// The deck of Ember Tide: four suits, values 1–9, plus three kinds of special card.
import { shuffleDeck } from './random.js';

export const SUITS = {
  flame: { name: 'Flame', glyph: '▲', colour: '#e4572e' },
  wave: { name: 'Wave', glyph: '●', colour: '#2e86de' },
  stone: { name: 'Stone', glyph: '◆', colour: '#8d7d6b' },
  leaf: { name: 'Leaf', glyph: '✿', colour: '#3fa34d' },
};
export const SUIT_ORDER = ['flame', 'wave', 'stone', 'leaf'];

/** The trump cycle: each suit trumps the next one in the ring. */
export const TRUMPS = { flame: 'wave', wave: 'stone', stone: 'leaf', leaf: 'flame' };

export const SPECIALS = {
  surge: { name: 'Surge', glyph: '⚡', value: 5, text: 'Worth 5, doubled to 10 this trick, and deals +1 tide.' },
  anchor: { name: 'Anchor', glyph: '⚓', value: 5, text: 'Worth 5, cannot be trumped, and wins all ties.' },
  drift: { name: 'Drift', glyph: '≋', value: 0, text: 'Worth 0 this trick — draw 2 cards after it.' },
};

let nextCardId = 1;

/** Build one card object, with a fresh id. `suit` is a key of SUITS or null for a special. */
export function makeCard(suit, value, special) {
  const card = { id: nextCardId, suit, value, special: special ?? null };
  nextCardId += 1;
  return card;
}

/** The full 42-card deck: 4 suits × 1–9, plus 2 of each special. */
export function buildDeck() {
  nextCardId = 1;
  const deck = [];
  for (const suit of SUIT_ORDER) {
    for (let value = 1; value <= 9; value += 1) deck.push(makeCard(suit, value, null));
  }
  for (const special of ['surge', 'anchor', 'drift']) {
    deck.push(makeCard(null, SPECIALS[special].value, special));
    deck.push(makeCard(null, SPECIALS[special].value, special));
  }
  return deck;
}

/** A fresh shuffled deck using the given random source. */
export function shuffledDeck(random) {
  return shuffleDeck(buildDeck(), random);
}

/** Deal `count` cards to each side from the front of `deck`. */
export function dealHands(deck, count) {
  return { you: deck.splice(0, count), foe: deck.splice(0, count) };
}

/** Human-readable label for a card, e.g. "7 of Flame" or "Surge". */
export function cardLabel(card) {
  if (card.special) return SPECIALS[card.special].name;
  return `${card.value} of ${SUITS[card.suit].name}`;
}
