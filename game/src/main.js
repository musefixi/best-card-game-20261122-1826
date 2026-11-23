// Boot and the one loop: the duel is drawn every animation frame, key presses are
// read each frame, and clicks play cards straight away. The game moves between
// four screens: title, play, win and loss (plus a help overlay over the table).
//
// ?seed=N fixes the shuffle. ?shot=title|table|win|loss (with &seed=N) stages that
// scene instead of running the loop, paints it twice and sets window.__shotReady.
import { createRandom } from './random.js';
import { createDuel, startDuel, playTrick, nextTrick, SCREEN_TITLE, SCREEN_WIN, SCREEN_LOSS, SCREEN_HELP, SCREEN_PLAY } from './state.js';
import { createRenderer } from './render.js';
import { createInput, ACTION_CONFIRM, ACTION_NEXT, ACTION_RESTART, ACTION_HELP } from './input.js';
import { stageShot } from './shots.js';

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seedParam = Number.parseInt(params.get('seed') ?? '', 10);
const seed = Number.isInteger(seedParam) ? seedParam : Math.floor(Math.random() * 4294967296);

const table = document.getElementById('table');
const status = document.getElementById('status');
const duel = createDuel(createRandom(seed));
const renderer = createRenderer(table);

function announce(message) {
  status.textContent = message;
}

function onCardClick(card) {
  if (duel.screen !== SCREEN_PLAY || duel.trickResolved) return;
  if (playTrick(duel, card)) {
    announce(duel.message);
    renderer.draw(duel, onCardClick, onNext, onOverlayButton);
  }
}

function onNext() {
  nextTrick(duel);
  renderer.draw(duel, onCardClick, onNext, onOverlayButton);
}

function onOverlayButton() {
  if (duel.screen === SCREEN_HELP) {
    duel.screen = SCREEN_PLAY;
  } else {
    startDuel(duel);
  }
  announce(duel.screen === SCREEN_PLAY ? 'Playing. First to 7 tricks or 0 tide wins.' : duel.message);
  renderer.draw(duel, onCardClick, onNext, onOverlayButton);
}

document.getElementById('restart-btn').addEventListener('click', () => {
  startDuel(duel);
  announce('A fresh duel. First to 7 tricks or 0 tide wins.');
  renderer.draw(duel, onCardClick, onNext, onOverlayButton);
});

function runShot(name) {
  stageShot(name, duel);
  let painted = 0;
  function paint() {
    renderer.draw(duel, onCardClick, onNext, onOverlayButton);
    painted += 1;
    if (painted < 2) requestAnimationFrame(paint);
    else window.__shotReady = true;
  }
  requestAnimationFrame(paint);
}

function runGame() {
  const input = createInput();
  let previousScreen = duel.screen;

  function handlePresses() {
    for (const press of input.takePresses()) {
      if (press.handIndex !== undefined && press.handIndex >= 0) {
        const card = duel.youHand[press.handIndex];
        if (card) onCardClick(card);
        continue;
      }
      const actions = press.actions ?? 0;
      if (actions & ACTION_RESTART) {
        startDuel(duel);
        announce('A fresh duel.');
      } else if (actions & ACTION_HELP) {
        duel.screen = duel.screen === SCREEN_HELP ? SCREEN_PLAY : SCREEN_HELP;
      } else if (actions & ACTION_NEXT) {
        onNext();
      } else if (actions & ACTION_CONFIRM) {
        if (duel.screen === SCREEN_TITLE || duel.screen === SCREEN_WIN || duel.screen === SCREEN_LOSS) {
          startDuel(duel);
          announce('Playing. First to 7 tricks or 0 tide wins.');
        } else if (duel.screen === SCREEN_HELP) {
          duel.screen = SCREEN_PLAY;
        } else if (duel.trickResolved) {
          onNext();
        }
      }
    }
  }

  function frame() {
    requestAnimationFrame(frame);
    handlePresses();
    if (duel.screen !== previousScreen) {
      previousScreen = duel.screen;
      announce(duel.message);
    }
    renderer.draw(duel, onCardClick, onNext, onOverlayButton);
  }

  announce('Ember Tide. Press Space or click Begin the duel to start.');
  requestAnimationFrame(frame);
}

if (shot) runShot(shot);
else runGame();
