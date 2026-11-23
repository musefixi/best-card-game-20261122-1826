// The duel's state: screens, rounds, tricks, tide, and the staged screenshot scenes.
import { shuffledDeck, dealHands, cardLabel } from './deck.js';
import { resolveTrick, trickDamage, duelWinner, START_TIDE, HAND_SIZE } from './rules.js';
import { chooseCard } from './ai.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_WIN = 'win';
export const SCREEN_LOSS = 'loss';
export const SCREEN_HELP = 'help';

/** A fresh duel: 20 tide each, no tricks yet, round 1 dealt from a shuffled deck. */
export function createDuel(random) {
  const duel = {
    random,
    screen: SCREEN_TITLE,
    round: 1,
    deck: [],
    youHand: [],
    foeHand: [],
    youTide: START_TIDE,
    foeTide: START_TIDE,
    youTricks: 0,
    foeTricks: 0,
    youPlayed: null,
    foePlayed: null,
    foeTell: '',
    message: 'Welcome to Ember Tide.',
    log: [],
    lastYouCard: null,
    lastWinner: null,
    trickResolved: false,
    winner: null,
  };
  dealRound(duel);
  return duel;
}

/** Shuffle a fresh deck and deal a new round of hands. */
export function dealRound(duel) {
  duel.deck = shuffledDeck(duel.random);
  const hands = dealHands(duel.deck, HAND_SIZE);
  duel.youHand = hands.you;
  duel.foeHand = hands.foe;
  duel.youPlayed = null;
  duel.foePlayed = null;
  duel.trickResolved = false;
}

/** Start (or restart) the duel from the title screen. */
export function startDuel(duel) {
  duel.screen = SCREEN_PLAY;
  duel.round = 1;
  duel.youTide = START_TIDE;
  duel.foeTide = START_TIDE;
  duel.youTricks = 0;
  duel.foeTricks = 0;
  duel.lastYouCard = null;
  duel.winner = null;
  duel.log = [];
  dealRound(duel);
  duel.message = 'Round 1 — play a card to open the duel.';
}

/** Draw `count` cards from the deck into `hand` (Drift's reward). */
export function drawCards(duel, hand, count) {
  const drawn = duel.deck.splice(0, count);
  hand.push(...drawn);
  return drawn;
}

function removeFromHand(hand, cardId) {
  const index = hand.findIndex((card) => card.id === cardId);
  if (index !== -1) hand.splice(index, 1);
}

/**
 * Play one trick: the player commits `card`, Riva answers, the trick resolves,
 * tide moves, Drift draws, and the duel may end. Returns false if the card
 * cannot be played right now.
 */
export function playTrick(duel, card) {
  if (duel.screen !== SCREEN_PLAY || duel.trickResolved) return false;
  if (!duel.youHand.some((held) => held.id === card.id)) return false;

  removeFromHand(duel.youHand, card.id);
  duel.youPlayed = card;
  const context = {
    youTide: duel.youTide,
    foeTide: duel.foeTide,
    youTricks: duel.youTricks,
    foeTricks: duel.foeTricks,
    tricksLeft: duel.youHand.length,
    lastYouCard: duel.lastYouCard,
    round: duel.round,
  };
  const choice = chooseCard(duel.foeHand, context, duel.random);
  removeFromHand(duel.foeHand, choice.card.id);
  duel.foePlayed = choice.card;
  duel.foeTell = choice.tell;

  const result = resolveTrick(card, choice.card);
  duel.trickResolved = true;
  duel.lastWinner = result.winner === 'tie' ? null : result.winner;
  duel.lastYouCard = card;

  if (result.winner === 'you') {
    duel.youTricks += 1;
    const damage = trickDamage(card);
    duel.foeTide = Math.max(0, duel.foeTide - damage);
    duel.message = `${result.line} You deal ${damage} tide damage.`;
  } else if (result.winner === 'foe') {
    duel.foeTricks += 1;
    const damage = trickDamage(choice.card);
    duel.youTide = Math.max(0, duel.youTide - damage);
    duel.message = `${result.line} Riva deals ${damage} tide damage.`;
  } else {
    duel.message = result.line;
  }

  if (card.special === 'drift') {
    const drawn = drawCards(duel, duel.youHand, 2);
    duel.message += ` Drift draws ${drawn.map(cardLabel).join(' and ')}.`;
  }
  if (choice.card.special === 'drift') {
    const drawn = drawCards(duel, duel.foeHand, 2);
    duel.message += ` Riva drifts and draws ${drawn.length} cards.`;
  }

  duel.log.push(duel.message);
  duel.winner = duelWinner(duel);
  if (duel.winner) {
    duel.screen = duel.winner === 'you' ? SCREEN_WIN : SCREEN_LOSS;
    duel.message = duel.winner === 'you'
      ? 'The tide is yours — Riva yields the table.'
      : 'The tide takes you — Riva keeps the table.';
  }
  return true;
}

/** Clear the table after a resolved trick; deal a fresh round when hands run dry. */
export function nextTrick(duel) {
  if (!duel.trickResolved || duel.winner) return;
  duel.youPlayed = null;
  duel.foePlayed = null;
  duel.trickResolved = false;
  duel.lastWinner = null;
  duel.foeTell = '';
  if (duel.youHand.length === 0 && duel.foeHand.length === 0) {
    duel.round += 1;
    dealRound(duel);
    duel.message = `Round ${duel.round} — fresh hands, the duel goes on.`;
  } else {
    duel.message = 'Your move — play a card.';
  }
}
