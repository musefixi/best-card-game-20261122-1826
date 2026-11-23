// Riva, the Tide-Keeper: an opponent whose choices a player can read and counter.
import { effectiveValue, cardBeats } from './rules.js';
import { TRUMPS } from './deck.js';

/**
 * Riva's tell, shown after she plays: a one-line hint at why she chose that card,
 * so her plan is readable and the player can play around it.
 */
export function chooseCard(hand, context, random) {
  const { youTide, foeTide, youTricks, foeTricks, tricksLeft, lastYouCard, round } = context;
  const playable = [...hand];

  // Riva is losing badly on tide: she spends her Surge to claw a trick back.
  const surge = playable.find((card) => card.special === 'surge');
  if (surge && foeTide <= 8 && random() < 0.85) {
    return { card: surge, tell: 'Riva’s tide is low — she reaches for a Surge.' };
  }

  // She just saw you play a big card last trick: she answers with her Anchor.
  const anchor = playable.find((card) => card.special === 'anchor');
  if (anchor && lastYouCard && effectiveValue(lastYouCard) >= 7 && random() < 0.8) {
    return { card: anchor, tell: 'Riva braces — she answers your big card with an Anchor.' };
  }

  // Her hand is thin on power: Drift to draw deeper, early in the round.
  const drift = playable.find((card) => card.special === 'drift');
  const bestValue = Math.max(...playable.map(effectiveValue));
  if (drift && bestValue <= 5 && round <= 2 && random() < 0.7) {
    return { card: drift, tell: 'Riva drifts — her hand is weak, so she draws deeper.' };
  }

  // Otherwise play the cheapest card that would have beaten your last card's suit
  // with a trump, or the lowest card that is still strong — she saves her 8s and 9s.
  const sorted = [...playable].sort((a, b) => effectiveValue(a) - effectiveValue(b));
  let pick = sorted[0];
  if (lastYouCard && lastYouCard.suit) {
    const trumpAnswer = sorted.find(
      (card) => card.suit && TRUMPS[card.suit] === lastYouCard.suit && effectiveValue(card) >= 4,
    );
    if (trumpAnswer && random() < 0.75) {
      return { card: trumpAnswer, tell: `Riva holds a ${trumpAnswer.suit} — it trumps your ${lastYouCard.suit}.` };
    }
  }
  if (foeTricks >= 5 || youTide <= 6) {
    pick = sorted[sorted.length - 1];
    return { card: pick, tell: 'Riva smells the win — she plays her strongest card.' };
  }
  if (tricksLeft <= 2 && youTricks > foeTricks) {
    pick = sorted[sorted.length - 1];
    return { card: pick, tell: 'Riva will not lose the round — her best card comes out.' };
  }
  return { card: pick, tell: 'Riva plays low and patient, saving her strength.' };
}

/** A quick read on Riva's hand for the table's hint line. */
export function handRead(hand) {
  const strong = hand.filter((card) => effectiveValue(card) >= 7).length;
  if (strong >= 3) return 'Riva’s hand looks heavy — big cards are coming.';
  if (strong === 0) return 'Riva’s hand looks thin — press her now.';
  return 'Riva’s hand is middling — watch for a trump.';
}
