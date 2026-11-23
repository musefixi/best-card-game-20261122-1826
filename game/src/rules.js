// The rules of Ember Tide: how one trick is won, what it costs, and when the duel ends.
import { SUITS, TRUMPS } from './deck.js';

export const START_TIDE = 20;
export const TRICKS_TO_WIN = 7;
export const HAND_SIZE = 7;
export const BASE_DAMAGE = 2;

/** Effective fighting value of a played card (Surge doubles it; Drift is worth 0). */
export function effectiveValue(card) {
  if (card.special === 'drift') return 0;
  if (card.special === 'surge') return card.value * 2;
  return card.value;
}

/**
 * Does `a` beat `b` in a trick? Anchors ignore trump and win ties, so they are
 * compared on effective value alone; otherwise trump beats value, then value.
 */
export function cardBeats(a, b) {
  const aAnchor = a.special === 'anchor';
  const bAnchor = b.special === 'anchor';
  if (aAnchor || bAnchor) {
    return aAnchor
      ? effectiveValue(a) >= effectiveValue(b)
      : effectiveValue(a) > effectiveValue(b);
  }
  const aSuit = a.suit;
  const bSuit = b.suit;
  if (aSuit && bSuit && aSuit !== bSuit) {
    if (TRUMPS[aSuit] === bSuit) return true;
    if (TRUMPS[bSuit] === aSuit) return false;
  }
  return effectiveValue(a) > effectiveValue(b);
}

/** Resolve one trick. Returns 'you' | 'foe' | 'tie' and a line explaining why. */
export function resolveTrick(youCard, foeCard) {
  const youWins = cardBeats(youCard, foeCard);
  const foeWins = cardBeats(foeCard, youCard);
  if (youWins && !foeWins) {
    return { winner: 'you', line: explainWin(youCard, foeCard, 'You') };
  }
  if (foeWins && !youWins) {
    return { winner: 'foe', line: explainWin(foeCard, youCard, 'Riva') };
  }
  return { winner: 'tie', line: `A dead tie — ${describeCard(youCard)} meets ${describeCard(foeCard)}. No trick, no damage.` };
}

function describeCard(card) {
  if (card.special) return `${card.special === 'surge' ? 'Surge' : card.special === 'anchor' ? 'Anchor' : 'Drift'} ${card.value > 0 ? card.value : ''}`.trim();
  return `${card.value} ${SUITS[card.suit].glyph}`;
}

function explainWin(winCard, loseCard, who) {
  const winText = describeCard(winCard);
  const loseText = describeCard(loseCard);
  if (winCard.special === 'anchor') return `${who} holds with Anchor — untrumpable, untied. ${winText} beats ${loseText}.`;
  if (winCard.special === 'surge') return `${who} surges! ${winText} (doubled to ${effectiveValue(winCard)}) overpowers ${loseText}.`;
  if (winCard.suit && loseCard.suit && winCard.suit !== loseCard.suit) {
    return `${who} trumps! ${SUITS[winCard.suit].name} beats ${SUITS[loseCard.suit].name} — ${winText} takes ${loseText}.`;
  }
  return `${who} takes the trick: ${winText} beats ${loseText}.`;
}

/** Tide damage the trick winner deals (Surge adds +1). */
export function trickDamage(winnerCard) {
  return BASE_DAMAGE + (winnerCard.special === 'surge' ? 1 : 0);
}

/** Has either side won the duel outright? Returns 'you' | 'foe' | null. */
export function duelWinner(state) {
  if (state.foeTide <= 0 || state.youTricks >= TRICKS_TO_WIN) return 'you';
  if (state.youTide <= 0 || state.foeTricks >= TRICKS_TO_WIN) return 'foe';
  return null;
}
