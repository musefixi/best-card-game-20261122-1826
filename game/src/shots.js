// The screenshot scenes behind ?shot=title|table|win|loss. Each one stages a real duel
// state with the fixed seed, so the same shot always renders the same frame.
import { createDuel, playTrick, startDuel, SCREEN_TITLE, SCREEN_WIN, SCREEN_LOSS } from './state.js';

/** Stage `name` on a fresh duel and return the duel ready to paint. */
export function stageShot(name, duel) {
  if (name === 'title') {
    duel.screen = SCREEN_TITLE;
    duel.message = 'Welcome to Ember Tide.';
    return duel;
  }
  if (name === 'win') {
    startDuel(duel);
    // Stage the winning moment directly: the final trick stays on the table —
    // your best card over Riva's weakest — with a coherent winning scoreline.
    const best = [...duel.youHand].sort((a, b) => b.value - a.value)[0];
    const weakest = [...duel.foeHand].sort((a, b) => a.value - b.value)[0];
    duel.youHand = duel.youHand.filter((card) => card.id !== best.id);
    duel.foeHand = duel.foeHand.filter((card) => card.id !== weakest.id);
    duel.youPlayed = best;
    duel.foePlayed = weakest;
    duel.trickResolved = true;
    duel.lastWinner = 'you';
    duel.youTricks = 7;
    duel.foeTricks = 4;
    duel.youTide = 10;
    duel.foeTide = 6;
    duel.winner = 'you';
    duel.screen = SCREEN_WIN;
    duel.message = 'The tide is yours — Riva yields the table.';
    return duel;
  }
  if (name === 'loss') {
    startDuel(duel);
    duel.youTricks = 2;
    duel.foeTricks = 5;
    duel.youTide = 3;
    duel.foeTide = 14;
    // Play out tricks with the player's weakest card until the duel is lost.
    for (let guard = 0; guard < 40 && duel.screen !== SCREEN_LOSS; guard += 1) {
      const worst = [...duel.youHand].sort((a, b) => a.value - b.value)[0];
      if (!worst) break;
      playTrick(duel, worst);
      if (duel.screen === SCREEN_LOSS) break;
      duel.youPlayed = null;
      duel.foePlayed = null;
      duel.trickResolved = false;
      duel.lastWinner = null;
      if (duel.youHand.length === 0) break;
    }
    if (duel.screen !== SCREEN_LOSS) {
      duel.youTide = 0;
      duel.screen = SCREEN_LOSS;
      duel.winner = 'foe';
      duel.message = 'The tide takes you — Riva keeps the table.';
    }
    return duel;
  }
  // Default: 'table' — a mid-game table, three tricks in, both hands on show.
  startDuel(duel);
  for (let trick = 0; trick < 3; trick += 1) {
    const mid = [...duel.youHand].sort((a, b) => a.value - b.value)[Math.floor(duel.youHand.length / 2)];
    if (!mid) break;
    playTrick(duel, mid);
    if (duel.screen !== 'play') break;
    duel.youPlayed = null;
    duel.foePlayed = null;
    duel.trickResolved = false;
    duel.lastWinner = null;
    duel.foeTell = '';
  }
  // Leave the fourth trick on the table, resolved, so the shot shows played cards.
  if (duel.screen === 'play' && duel.youHand.length > 0) {
    const mid = [...duel.youHand].sort((a, b) => a.value - b.value)[Math.floor(duel.youHand.length / 2)];
    playTrick(duel, mid);
  }
  duel.message = 'Mid-duel — Riva’s tells are showing. Play your next card.';
  return duel;
}
