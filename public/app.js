const socket = io();
const $ = (sel) => document.querySelector(sel);

const ROLE_LABELS = { civil: 'Civil', impostor: 'Imposteur', white: 'Mr White' };
const PHASE_LABELS = {
  reveal: '👀 Découvrez vos mots',
  discussion: '💬 Discussion',
  vote: '🗳️ Vote',
  whiteGuess: '🎩 Mr White devine',
  end: '🏁 Fin de la manche',
};

function storage(key, value) {
  try {
    if (value === undefined) return localStorage.getItem(key);
    if (value === null) localStorage.removeItem(key);
    else localStorage.setItem(key, value);
  } catch { return null; }
}

let token = storage('imposteur_token');
if (!token) {
  token = (crypto.randomUUID ? crypto.randomUUID() : String(Math.random()).slice(2) + Date.now());
  storage('imposteur_token', token);
}

let state = null;
let messages = [];
let currentRoom = storage('imposteur_room');
let peeking = false;

// ---------- utilitaires ----------

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

let toastTimer;
function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add('hidden'), 3500);
}

function show(screen) {
  for (const s of ['home', 'lobby', 'game']) $('#screen-' + s).classList.toggle('hidden', s !== screen);
}

function playerName(id) {
  return state?.players.find((p) => p.id === id)?.name ?? '?';
}

// ---------- accueil ----------

$('#name').value = storage('imposteur_name') || '';
const urlCode = new URLSearchParams(location.search).get('code');
if (urlCode) $('#code').value = urlCode.toUpperCase();

function getName() {
  const name = $('#name').value.trim();
  if (!name) {
    toast('Choisis un pseudo.');
    $('#name').focus();
    return null;
  }
  storage('imposteur_name', name);
  return name;
}

$('#btn-create').onclick = () => {
  const name = getName();
  if (name) socket.emit('create', { name, token });
};

$('#btn-join').onclick = () => {
  const name = getName();
  const code = $('#code').value.trim().toUpperCase();
  if (!name) return;
  if (code.length !== 4) return toast('Le code fait 4 lettres.');
  socket.emit('join', { code, name, token });
};
$('#code').addEventListener('keydown', (e) => e.key === 'Enter' && $('#btn-join').click());
$('#name').addEventListener('keydown', (e) => e.key === 'Enter' && ($('#code').value ? $('#btn-join') : $('#btn-create')).click());

function leave() {
  socket.emit('leave');
  currentRoom = null;
  storage('imposteur_room', null);
  state = null;
  messages = [];
  history.replaceState(null, '', location.pathname);
  show('home');
}
$('#btn-leave').onclick = leave;
$('#btn-leave-game').onclick = () => {
  if (confirm('Quitter la partie en cours ?')) leave();
};

// ---------- salon ----------

$('#btn-copy').onclick = async () => {
  const link = `${location.origin}/?code=${state.code}`;
  try {
    await navigator.clipboard.writeText(link);
    toast('Lien copié !');
  } catch {
    prompt('Copie ce lien :', link);
  }
};

document.querySelectorAll('.stepper button').forEach((btn) => {
  btn.onclick = () => {
    const key = btn.parentElement.dataset.key;
    const s = { ...state.settings };
    s[key] = Math.max(0, s[key] + Number(btn.dataset.d));
    socket.emit('settings', s);
  };
});
$('#impostors-know').onchange = (e) => socket.emit('settings', { ...state.settings, impostorsKnow: e.target.checked });

$('#btn-start').onclick = () => socket.emit('start');

function renderLobby() {
  $('#lobby-code').textContent = state.code;
  $('#lobby-count').textContent = `(${state.players.length})`;
  $('#lobby-players').innerHTML = state.players.map((p) => `
    <li class="${p.id === state.meId ? 'me' : ''} ${p.connected ? '' : 'offline'}">
      <span class="name">${esc(p.name)}${p.id === state.meId ? ' (toi)' : ''}</span>
      ${p.isHost ? '<span class="tag">👑 hôte</span>' : ''}
      ${p.connected ? '' : '<span class="tag">déconnecté</span>'}
    </li>`).join('');

  const s = state.settings;
  document.querySelectorAll('.stepper').forEach((st) => {
    st.querySelector('b').textContent = s[st.dataset.key];
    st.querySelectorAll('button').forEach((b) => (b.disabled = !state.isHost));
  });
  $('#impostors-know').checked = s.impostorsKnow;
  $('#impostors-know').disabled = !state.isHost;

  const n = state.players.length;
  const civils = n - s.impostors - s.mrWhite;
  let summary = `${civils} civil${civils > 1 ? 's' : ''}, ${s.impostors} imposteur${s.impostors > 1 ? 's' : ''}, ${s.mrWhite} Mr White`;
  if (n < 3) summary += ' — il faut au moins 3 joueurs';
  else if (civils <= s.impostors + s.mrWhite) summary += ' — trop d\'infiltrés';
  $('#settings-summary').textContent = summary;

  $('#btn-start').classList.toggle('hidden', !state.isHost);
  $('#lobby-wait').classList.toggle('hidden', state.isHost);
}

// ---------- partie ----------

function renderWordCard() {
  const me = state.me;
  const el = $('#word-card');
  const roleLine = me.role === 'impostor'
    ? '<div class="role">Tu es <b style="color:var(--danger)">imposteur</b> 😈</div>'
    : me.role === 'civil' ? '<div class="role">Tu es <b style="color:var(--ok)">civil</b></div>' : '';

  const content = me.role === 'white'
    ? `<div class="label">Tu es</div><div class="word">🎩 Mr White</div><div class="role">Tu n'as pas de mot : écoute et bluffe !</div>`
    : `<div class="label">Ton mot</div><div class="word">${esc(me.word)}</div>${roleLine}`;

  const visible = state.phase === 'reveal' || state.phase === 'end' || peeking;
  if (visible) {
    el.innerHTML = content + (peeking ? '<button class="small" id="btn-peek">Masquer</button>' : '');
  } else {
    el.innerHTML = `<div class="label">Ton mot est masqué</div><div class="masked">• • • • •</div>
      <button class="small" id="btn-peek">👁️ Revoir mon mot</button>`;
  }
  const peekBtn = $('#btn-peek');
  if (peekBtn) peekBtn.onclick = () => { peeking = !peeking; renderWordCard(); };
}

function renderGamePlayers() {
  const reveal = state.phase === 'end';
  $('#game-players').innerHTML = state.players.map((p) => {
    const tags = [];
    if (p.isHost) tags.push('<span class="tag">👑</span>');
    if (p.id === state.starterId && p.alive && (state.phase === 'discussion' || state.phase === 'reveal')) {
      tags.push('<span class="tag starter">commence</span>');
    }
    if (p.hasVoted) tags.push('<span class="tag voted">a voté</span>');
    if (p.role) tags.push(`<span class="tag ${p.role}">${ROLE_LABELS[p.role]}${reveal && p.word ? ' · ' + esc(p.word) : ''}</span>`);
    if (!p.connected) tags.push('<span class="tag">hors ligne</span>');
    return `<li class="${p.id === state.meId ? 'me' : ''} ${p.alive ? '' : 'dead'} ${p.connected ? '' : 'offline'}">
      <span class="name">${p.alive ? '' : '💀 '}${esc(p.name)}</span>${tags.join('')}</li>`;
  }).join('');
}

function lastResultHtml() {
  const r = state.lastResult;
  if (!r) return '';
  const votes = r.votes.map((v) => `${esc(v.from)} → ${esc(v.to)}`).join('<br>');
  const head = r.tie
    ? '<b>Dernier vote : égalité</b>, personne n\'est éliminé.'
    : `<b>${esc(r.eliminated.name)}</b> a été éliminé(e) (${ROLE_LABELS[r.eliminated.role]}).`;
  return `<div class="result">${head}${votes ? '<br><span class="muted">' + votes + '</span>' : ''}</div>`;
}

function renderActions() {
  const el = $('#actions');
  const host = state.isHost;
  const me = state.me;
  let html = '';

  switch (state.phase) {
    case 'reveal':
      html = `<p class="muted">Mémorise ton mot. La première personne à parler est indiquée dans la liste.</p>`;
      html += host
        ? '<button class="primary" data-act="hideWords">Tout le monde a vu son mot : masquer</button>'
        : '<p class="muted center">En attente de l\'hôte…</p>';
      break;

    case 'discussion':
      html = lastResultHtml();
      html += `<p class="muted">Décrivez votre mot dans le chat, chacun son tour, sans le dire.${state.starterId ? ` <b>${esc(playerName(state.starterId))}</b> commence.` : ''}</p>`;
      if (host) html += '<button class="primary" data-act="startVote">Passer au vote</button>';
      break;

    case 'vote': {
      const alive = state.players.filter((p) => p.alive);
      const voted = alive.filter((p) => p.hasVoted).length;
      html = `<p><b>${voted}/${alive.length}</b> ont voté.</p>`;
      if (me.alive) {
        html += '<p class="muted">Qui est l\'imposteur ? (tu peux changer ton vote)</p><div class="vote-list">';
        html += alive.filter((p) => p.id !== state.meId).map((p) =>
          `<button data-vote="${p.id}" class="${me.vote === p.id ? 'selected' : ''}">${esc(p.name)}</button>`).join('');
        html += '</div>';
      } else {
        html += '<p class="muted">Tu es éliminé(e), tu ne votes pas.</p>';
      }
      if (host) {
        html += '<button data-act="forceVote">Clôturer le vote maintenant</button>';
        html += '<button class="ghost" data-act="cancelVote">Annuler le vote</button>';
      }
      break;
    }

    case 'whiteGuess': {
      const wg = state.whiteGuess;
      html = lastResultHtml();
      if (wg.playerId === state.meId) {
        html += `<p><b>Tu as été démasqué !</b> Devine le mot des civils pour gagner :</p>
          <form id="white-form" class="row"><input id="white-input" maxlength="40" placeholder="Le mot des civils" autocomplete="off"><button class="primary">Valider</button></form>`;
      } else {
        html += `<p class="muted center">${esc(playerName(wg.playerId))} (Mr White) essaie de deviner le mot des civils…</p>`;
      }
      break;
    }

    case 'end': {
      const labels = { civils: '🎉 Les civils gagnent !', infiltres: '😈 Les infiltrés gagnent !', white: '🎩 Mr White gagne !' };
      html = `<div class="winner ${state.winner}">${labels[state.winner]}</div>`;
      html += `<div class="result">Mot des civils : <b>${esc(state.words.civil)}</b><br>Mot des imposteurs : <b>${esc(state.words.impostor)}</b></div>`;
      if (state.whiteGuess?.guess) {
        html += `<div class="result">Mr White a proposé « ${esc(state.whiteGuess.guess)} »</div>`;
      }
      if (host) {
        html += '<button class="primary" data-act="start">Nouvelle manche</button>';
        html += '<button data-act="backToLobby">Retour au salon (réglages)</button>';
      } else {
        html += '<p class="muted center">En attente de l\'hôte…</p>';
      }
      break;
    }
  }

  el.innerHTML = html;
  el.querySelectorAll('[data-act]').forEach((b) => (b.onclick = () => socket.emit(b.dataset.act)));
  el.querySelectorAll('[data-vote]').forEach((b) => (b.onclick = () => socket.emit('vote', b.dataset.vote)));
  const wf = $('#white-form');
  if (wf) {
    wf.onsubmit = (e) => {
      e.preventDefault();
      const g = $('#white-input').value.trim();
      if (g) socket.emit('whiteGuess', g);
    };
    $('#white-input').focus();
  }
}

function renderGame() {
  $('#phase-label').textContent = PHASE_LABELS[state.phase] || '';
  $('#game-code').textContent = state.code;
  renderWordCard();
  renderGamePlayers();
  // ne pas écraser le formulaire de Mr White pendant qu'il tape
  if (!(state.phase === 'whiteGuess' && $('#white-form'))) renderActions();

  const canChat = state.me.alive || state.phase === 'end';
  $('#chat-input').disabled = !canChat;
  $('#chat-input').placeholder = canChat ? 'Écris un message…' : 'Tu es éliminé(e), tu peux seulement lire.';
}

// ---------- chat ----------

function messageHtml(m) {
  if (m.system) return `<div class="msg system">${esc(m.text)}</div>`;
  const mine = state && m.playerId === state.meId;
  return `<div class="msg ${mine ? 'mine' : ''}"><span class="author">${esc(m.name)}</span>${esc(m.text)}</div>`;
}

function renderMessages() {
  const box = $('#messages');
  box.innerHTML = messages.length
    ? messages.map(messageHtml).join('')
    : '<div class="msg system">Le chat de la manche apparaîtra ici.</div>';
  box.scrollTop = box.scrollHeight;
}

function appendMessage(m) {
  const box = $('#messages');
  const nearBottom = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
  if (messages.length === 1) box.innerHTML = '';
  box.insertAdjacentHTML('beforeend', messageHtml(m));
  if (nearBottom || m.playerId === state?.meId) box.scrollTop = box.scrollHeight;
}

$('#chat-form').onsubmit = (e) => {
  e.preventDefault();
  const input = $('#chat-input');
  const text = input.value.trim();
  if (!text) return;
  socket.emit('chat', text);
  input.value = '';
};

// ---------- socket ----------

socket.on('connect', () => {
  if (currentRoom) socket.emit('join', { code: currentRoom, token, name: storage('imposteur_name') || '' });
});

socket.on('joined', ({ code }) => {
  currentRoom = code;
  storage('imposteur_room', code);
  history.replaceState(null, '', `?code=${code}`);
});

socket.on('errorMsg', (msg) => {
  // reconnexion automatique impossible : retour à l'accueil
  if (!state && currentRoom) {
    currentRoom = null;
    storage('imposteur_room', null);
  }
  toast(msg);
});

socket.on('state', (s) => {
  const prevPhase = state?.phase;
  state = s;
  if (s.phase !== prevPhase) peeking = false;
  if (s.phase === 'lobby') {
    show('lobby');
    renderLobby();
  } else {
    if (prevPhase === 'whiteGuess' && s.phase !== 'whiteGuess') $('#actions').innerHTML = '';
    show('game');
    renderGame();
    if (prevPhase === 'lobby' || !prevPhase) renderMessages();
  }
});

socket.on('messages', (list) => {
  messages = list;
  renderMessages();
});

socket.on('message', (m) => {
  messages.push(m);
  appendMessage(m);
});
