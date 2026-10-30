const express = require('express');
const http = require('http');
const path = require('path');
const crypto = require('crypto');
const { Server } = require('socket.io');
const WORD_PAIRS = require('./words');

const PORT = process.env.PORT || 3000;
const MAX_PLAYERS = 20;
const MAX_MESSAGES = 300;
const LOBBY_GRACE_MS = 30_000;
const EMPTY_ROOM_TTL_MS = 10 * 60_000;

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(path.join(__dirname, 'public')));
app.get('/health', (req, res) => res.send('ok'));

/** code -> room */
const rooms = new Map();

// ---------- utilitaires ----------

function makeCode() {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code;
  do {
    code = Array.from({ length: 4 }, () => letters[crypto.randomInt(letters.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = crypto.randomInt(i + 1);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function normalize(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
}

function cleanName(name) {
  return String(name || '').replace(/\s+/g, ' ').trim().slice(0, 20);
}

function clampInt(v, min, max) {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

// ---------- logique de salle ----------

function createRoom() {
  const room = {
    code: makeCode(),
    hostId: null,
    players: new Map(), // id -> player
    settings: { impostors: 1, mrWhite: 0, impostorsKnow: false },
    phase: 'lobby', // lobby | reveal | discussion | vote | whiteGuess | end
    messages: [],
    pair: null, // { civil, impostor }
    usedPairs: new Set(),
    starterId: null,
    lastResult: null,
    winner: null,
    whiteGuess: null,
    turn: 0,
    emptySince: null,
  };
  rooms.set(room.code, room);
  return room;
}

function addPlayer(room, name, token, socketId) {
  const player = {
    id: crypto.randomUUID(),
    token,
    name,
    socketId,
    connected: true,
    alive: true,
    role: null, // civil | impostor | white
    word: null,
    vote: null,
    leaveTimer: null,
  };
  room.players.set(player.id, player);
  if (!room.hostId) room.hostId = player.id;
  return player;
}

function removePlayer(room, playerId) {
  const p = room.players.get(playerId);
  if (!p) return;
  clearTimeout(p.leaveTimer);
  room.players.delete(playerId);
  if (room.hostId === playerId) pickNewHost(room);
  if (room.players.size === 0) rooms.delete(room.code);
}

function pickNewHost(room) {
  const candidates = [...room.players.values()];
  const next = candidates.find((p) => p.connected) || candidates[0];
  room.hostId = next ? next.id : null;
  if (next) systemMessage(room, `${next.name} est maintenant l'hôte.`);
}

function systemMessage(room, text) {
  pushMessage(room, { system: true, text });
}

function pushMessage(room, msg) {
  msg.id = crypto.randomUUID();
  msg.ts = Date.now();
  room.messages.push(msg);
  if (room.messages.length > MAX_MESSAGES) room.messages.shift();
  io.to(room.code).emit('message', msg);
}

function validateSettings(count, s) {
  const bad = s.impostors + s.mrWhite;
  if (count < 3) return 'Il faut au moins 3 joueurs.';
  if (bad < 1) return 'Il faut au moins un imposteur ou un Mr White.';
  if (count - bad <= bad) return 'Il faut plus de civils que d\'imposteurs + Mr White.';
  return null;
}

function pickPair(room) {
  if (room.usedPairs.size >= WORD_PAIRS.length) room.usedPairs.clear();
  let idx;
  do {
    idx = crypto.randomInt(WORD_PAIRS.length);
  } while (room.usedPairs.has(idx));
  room.usedPairs.add(idx);
  const [a, b] = WORD_PAIRS[idx];
  return crypto.randomInt(2) ? { civil: a, impostor: b } : { civil: b, impostor: a };
}

function startGame(room) {
  const players = shuffle([...room.players.values()]);
  room.pair = pickPair(room);
  const { impostors, mrWhite } = room.settings;
  players.forEach((p, i) => {
    p.alive = true;
    p.vote = null;
    if (i < impostors) {
      p.role = 'impostor';
      p.word = room.pair.impostor;
    } else if (i < impostors + mrWhite) {
      p.role = 'white';
      p.word = null;
    } else {
      p.role = 'civil';
      p.word = room.pair.civil;
    }
  });
  room.phase = 'reveal';
  room.messages = [];
  room.lastResult = null;
  room.winner = null;
  room.whiteGuess = null;
  room.turn = 1;
  chooseStarter(room);
  io.to(room.code).emit('messages', []);
}

function chooseStarter(room) {
  // Mr White ne commence jamais
  const candidates = [...room.players.values()].filter((p) => p.alive && p.role !== 'white');
  room.starterId = candidates.length ? candidates[crypto.randomInt(candidates.length)].id : null;
}

function alivePlayers(room) {
  return [...room.players.values()].filter((p) => p.alive);
}

function checkWinner(room) {
  const alive = alivePlayers(room);
  const civils = alive.filter((p) => p.role === 'civil').length;
  const bad = alive.length - civils;
  if (bad === 0) return 'civils';
  if (bad >= civils) return 'infiltres';
  return null;
}

function endGame(room, winner) {
  room.phase = 'end';
  room.winner = winner;
}

function afterElimination(room) {
  const winner = checkWinner(room);
  if (winner) return endGame(room, winner);
  room.phase = 'discussion';
  room.turn += 1;
  chooseStarter(room);
  for (const p of room.players.values()) p.vote = null;
}

function maybeResolveVote(room, force = false) {
  if (room.phase !== 'vote') return;
  const voters = alivePlayers(room).filter((p) => p.connected);
  if (!force && voters.some((p) => !p.vote)) return;

  const tally = {};
  for (const p of alivePlayers(room)) {
    if (p.vote && room.players.get(p.vote)?.alive) tally[p.vote] = (tally[p.vote] || 0) + 1;
  }
  const votesDetail = alivePlayers(room)
    .filter((p) => p.vote)
    .map((p) => ({ from: p.name, to: room.players.get(p.vote)?.name || '?' }));

  const max = Math.max(0, ...Object.values(tally));
  const top = Object.keys(tally).filter((id) => tally[id] === max);

  if (max === 0 || top.length > 1) {
    room.lastResult = { tie: true, votes: votesDetail };
    systemMessage(room, 'Égalité : personne n\'est éliminé. La discussion reprend.');
    room.phase = 'discussion';
    for (const p of room.players.values()) p.vote = null;
    return;
  }

  const eliminated = room.players.get(top[0]);
  eliminated.alive = false;
  room.lastResult = {
    tie: false,
    votes: votesDetail,
    eliminated: { id: eliminated.id, name: eliminated.name, role: eliminated.role },
  };
  const roleLabel = { civil: 'civil', impostor: 'imposteur', white: 'Mr White' }[eliminated.role];
  systemMessage(room, `${eliminated.name} est éliminé(e) : c'était un(e) ${roleLabel} !`);

  if (eliminated.role === 'white') {
    room.phase = 'whiteGuess';
    room.whiteGuess = { playerId: eliminated.id };
    return;
  }
  afterElimination(room);
}

// ---------- état envoyé aux clients ----------

function publicState(room, me) {
  const reveal = room.phase === 'end';
  const players = [...room.players.values()].map((p) => ({
    id: p.id,
    name: p.name,
    connected: p.connected,
    alive: p.alive,
    isHost: p.id === room.hostId,
    hasVoted: room.phase === 'vote' ? !!p.vote : false,
    role: reveal || (!p.alive && room.phase !== 'lobby') ? p.role : null,
    word: reveal ? p.word : null,
  }));

  let myRole = null;
  if (me.role === 'white') myRole = 'white';
  else if (me.role === 'impostor' && room.settings.impostorsKnow) myRole = 'impostor';
  else if (me.role) myRole = room.settings.impostorsKnow ? 'civil' : null;

  return {
    code: room.code,
    phase: room.phase,
    settings: room.settings,
    players,
    meId: me.id,
    isHost: me.id === room.hostId,
    me: room.phase === 'lobby' ? null : {
      word: me.word,
      role: myRole,
      alive: me.alive,
      vote: me.vote,
    },
    starterId: room.starterId,
    turn: room.turn,
    lastResult: room.lastResult,
    winner: room.winner,
    whiteGuess: room.whiteGuess
      ? { playerId: room.whiteGuess.playerId, guess: room.whiteGuess.guess ?? null, correct: room.whiteGuess.correct ?? null }
      : null,
    words: reveal ? room.pair : null,
    wordCount: WORD_PAIRS.length,
  };
}

function broadcast(room) {
  for (const p of room.players.values()) {
    if (p.connected && p.socketId) io.to(p.socketId).emit('state', publicState(room, p));
  }
}

// ---------- sockets ----------

io.on('connection', (socket) => {
  let room = null;
  let player = null;

  const fail = (msg) => socket.emit('errorMsg', msg);

  function attach(r, p) {
    room = r;
    player = p;
    clearTimeout(p.leaveTimer);
    p.socketId = socket.id;
    p.connected = true;
    r.emptySince = null;
    socket.join(r.code);
    socket.emit('joined', { code: r.code });
    socket.emit('messages', r.messages);
    broadcast(r);
  }

  socket.on('create', ({ name, token } = {}) => {
    name = cleanName(name);
    if (!name) return fail('Choisis un pseudo.');
    if (!token) return fail('Session invalide, recharge la page.');
    const r = createRoom();
    const p = addPlayer(r, name, String(token), socket.id);
    attach(r, p);
  });

  socket.on('join', ({ code, name, token } = {}) => {
    code = String(code || '').toUpperCase().trim();
    const r = rooms.get(code);
    if (!r) return fail('Salle introuvable.');
    token = String(token || '');
    if (!token) return fail('Session invalide, recharge la page.');

    // reconnexion
    const existing = [...r.players.values()].find((p) => p.token === token);
    if (existing) {
      const wasDisconnected = !existing.connected;
      attach(r, existing);
      if (wasDisconnected && r.phase !== 'lobby') {
        systemMessage(r, `${existing.name} est de retour.`);
      }
      return;
    }

    name = cleanName(name);
    if (!name) return fail('Choisis un pseudo.');
    if (r.phase !== 'lobby') return fail('Une partie est en cours dans cette salle, attends la fin.');
    if (r.players.size >= MAX_PLAYERS) return fail('La salle est pleine.');
    if ([...r.players.values()].some((p) => p.name.toLowerCase() === name.toLowerCase())) {
      return fail('Ce pseudo est déjà pris dans la salle.');
    }
    const p = addPlayer(r, name, token, socket.id);
    attach(r, p);
  });

  socket.on('leave', () => {
    if (!room || !player) return;
    const r = room;
    socket.leave(r.code);
    if (r.phase === 'lobby' || r.phase === 'end') {
      removePlayer(r, player.id);
    } else {
      player.connected = false;
      player.socketId = null;
      systemMessage(r, `${player.name} a quitté la partie.`);
      if (r.hostId === player.id) pickNewHost(r);
      maybeResolveVote(r);
    }
    room = null;
    player = null;
    if (rooms.has(r.code)) broadcast(r);
  });

  socket.on('settings', (s = {}) => {
    if (!room || player.id !== room.hostId || room.phase !== 'lobby') return;
    room.settings = {
      impostors: clampInt(s.impostors, 0, 9),
      mrWhite: clampInt(s.mrWhite, 0, 9),
      impostorsKnow: !!s.impostorsKnow,
    };
    broadcast(room);
  });

  socket.on('start', () => {
    if (!room || player.id !== room.hostId) return;
    if (room.phase !== 'lobby' && room.phase !== 'end') return;
    // retire les joueurs déconnectés avant une nouvelle partie
    for (const p of [...room.players.values()]) if (!p.connected) removePlayer(room, p.id);
    const err = validateSettings(room.players.size, room.settings);
    if (err) return fail(err);
    startGame(room);
    broadcast(room);
  });

  socket.on('hideWords', () => {
    if (!room || player.id !== room.hostId || room.phase !== 'reveal') return;
    room.phase = 'discussion';
    const starter = room.players.get(room.starterId);
    systemMessage(room, `Les mots sont masqués. ${starter ? starter.name + ' commence !' : 'À vous de jouer !'}`);
    broadcast(room);
  });

  socket.on('chat', (text) => {
    if (!room || !player) return;
    text = String(text || '').trim().slice(0, 300);
    if (!text) return;
    if (room.phase !== 'lobby' && room.phase !== 'end' && !player.alive) {
      return fail('Tu es éliminé(e), tu ne peux plus écrire pendant la manche.');
    }
    pushMessage(room, { playerId: player.id, name: player.name, text });
  });

  socket.on('startVote', () => {
    if (!room || player.id !== room.hostId || room.phase !== 'discussion') return;
    room.phase = 'vote';
    for (const p of room.players.values()) p.vote = null;
    systemMessage(room, 'Place au vote !');
    broadcast(room);
  });

  socket.on('cancelVote', () => {
    if (!room || player.id !== room.hostId || room.phase !== 'vote') return;
    room.phase = 'discussion';
    for (const p of room.players.values()) p.vote = null;
    systemMessage(room, 'Vote annulé, la discussion reprend.');
    broadcast(room);
  });

  socket.on('vote', (targetId) => {
    if (!room || room.phase !== 'vote' || !player.alive) return;
    const target = room.players.get(targetId);
    if (!target || !target.alive || target.id === player.id) return;
    player.vote = target.id;
    maybeResolveVote(room);
    broadcast(room);
  });

  socket.on('forceVote', () => {
    if (!room || player.id !== room.hostId || room.phase !== 'vote') return;
    maybeResolveVote(room, true);
    broadcast(room);
  });

  socket.on('whiteGuess', (guess) => {
    if (!room || room.phase !== 'whiteGuess' || room.whiteGuess?.playerId !== player.id) return;
    guess = String(guess || '').trim().slice(0, 40);
    if (!guess) return;
    const correct = normalize(guess) === normalize(room.pair.civil);
    room.whiteGuess.guess = guess;
    room.whiteGuess.correct = correct;
    systemMessage(room, `Mr White propose « ${guess} » : ${correct ? 'c\'est le bon mot !' : 'raté !'}`);
    if (correct) endGame(room, 'white');
    else afterElimination(room);
    broadcast(room);
  });

  socket.on('backToLobby', () => {
    if (!room || player.id !== room.hostId || room.phase !== 'end') return;
    for (const p of [...room.players.values()]) if (!p.connected) removePlayer(room, p.id);
    room.phase = 'lobby';
    for (const p of room.players.values()) {
      p.role = null;
      p.word = null;
      p.alive = true;
      p.vote = null;
    }
    room.pair = null;
    room.lastResult = null;
    room.winner = null;
    room.whiteGuess = null;
    broadcast(room);
  });

  socket.on('disconnect', () => {
    if (!room || !player || player.socketId !== socket.id) return;
    const r = room;
    const p = player;
    p.connected = false;
    p.socketId = null;
    if (r.phase === 'lobby' || r.phase === 'end') {
      p.leaveTimer = setTimeout(() => {
        if (!p.connected && rooms.get(r.code) === r) {
          removePlayer(r, p.id);
          if (rooms.has(r.code)) broadcast(r);
        }
      }, LOBBY_GRACE_MS);
    } else {
      if (r.hostId === p.id) pickNewHost(r);
      maybeResolveVote(r);
    }
    if (![...r.players.values()].some((x) => x.connected)) r.emptySince = Date.now();
    broadcast(r);
  });
});

// nettoyage des salles abandonnées
setInterval(() => {
  const now = Date.now();
  for (const [code, r] of rooms) {
    if (r.emptySince && now - r.emptySince > EMPTY_ROOM_TTL_MS) rooms.delete(code);
  }
}, 60_000);

server.listen(PORT, () => {
  console.log(`Imposteur en ligne sur le port ${PORT} (${WORD_PAIRS.length} paires de mots)`);
});
