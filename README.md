# 🕵️ Imposteur

Jeu de l'imposteur en ligne, en français, avec chat textuel. Un hôte crée une salle, les invités la rejoignent avec un code.

## Comment jouer

1. Chaque joueur choisit son pseudo.
2. L'hôte crée une partie et partage le code (ou le lien) de la salle.
3. L'hôte choisit le nombre d'**imposteurs** et de **Mr White**, puis lance la manche.
4. Chaque joueur voit son mot. Quand tout le monde l'a mémorisé, l'hôte **masque les mots** (on peut toujours revoir le sien).
5. On décrit son mot dans le chat, chacun son tour, sans limite de temps.
6. L'hôte clique sur **Passer au vote** : chaque joueur vivant vote, le plus voté est éliminé.
7. Si Mr White est éliminé, il peut gagner en devinant le mot des civils.

- **Civils** : gagnent quand tous les imposteurs et Mr White sont éliminés.
- **Infiltrés** : gagnent dès qu'ils sont aussi nombreux que les civils.

## Lancer en local

```bash
npm install
npm start
# http://localhost:3000
```

## Déployer sur Render

1. Sur [render.com](https://render.com) : **New → Web Service** et choisir ce dépôt GitHub (ou **New → Blueprint**, qui lit `render.yaml`).
2. Build command : `npm install` — Start command : `npm start`.
3. C'est tout : le port est fourni par Render via `PORT`.

> Sur l'offre gratuite, le service s'endort après 15 min d'inactivité (premier chargement plus lent) et les parties en cours sont perdues au redémarrage.

## Mots

Les paires de mots sont dans [`words.js`](words.js), une paire par ligne (`mot A ; mot B`). Ajoutez-en autant que vous voulez.
