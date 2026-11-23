// Painting the table: cards, tide pips, trick totals, messages and overlays.
import { SUITS, SPECIALS, TRUMPS, SUIT_ORDER } from './deck.js';
import { effectiveValue, START_TIDE, TRICKS_TO_WIN } from './rules.js';
import { SCREEN_TITLE, SCREEN_WIN, SCREEN_LOSS, SCREEN_HELP } from './state.js';
import { handRead } from './ai.js';

export { SCREEN_TITLE, SCREEN_WIN, SCREEN_LOSS, SCREEN_HELP };

const HELP_HTML = `
  <h2>How a trick is won</h2>
  <ul>
    <li>Each trick you play one card and Riva plays one. The stronger card takes the trick and deals <b>2 tide</b> damage (3 with a Surge).</li>
    <li><b>Higher value wins</b> — unless a suit trumps it. The trump ring runs:</li>
  </ul>
  <div class="suits">
    <span><span class="glyph" style="color:#e4572e">▲</span>Flame trumps Wave</span>
    <span><span class="glyph" style="color:#2e86de">●</span>Wave trumps Stone</span>
    <span><span class="glyph" style="color:#8d7d6b">◆</span>Stone trumps Leaf</span>
    <span><span class="glyph" style="color:#3fa34d">✿</span>Leaf trumps Flame</span>
  </div>
  <ul>
    <li><b>Surge ⚡</b> is worth 5, doubled to 10, and deals +1 tide.</li>
    <li><b>Anchor ⚓</b> is worth 5, cannot be trumped, and wins all ties.</li>
    <li><b>Drift ≋</b> is worth 0 — but draws 2 fresh cards after the trick.</li>
  </ul>
  <h2>How the duel is won</h2>
  <ul>
    <li>First to <b>${TRICKS_TO_WIN} tricks</b>, or sink the other side to <b>0 tide</b>, wins the duel.</li>
    <li>When both hands run out, a fresh round is dealt and the scores carry on.</li>
    <li>Watch Riva's tells: she telegraphs her Surges, her Anchors and her weak hands.</li>
  </ul>`;

function cardElement(card, options = {}) {
  const element = document.createElement('div');
  element.className = `card ${card.suit ?? ''} ${card.special ? 'special' : ''} ${options.mini ? 'mini' : ''}`;
  element.dataset.cardId = String(card.id);
  const glyph = card.special ? SPECIALS[card.special].glyph : SUITS[card.suit].glyph;
  const shownValue = card.special ? effectiveValue(card) : card.value;
  const name = card.special ? SPECIALS[card.special].name : SUITS[card.suit].name;
  // Special cards show their name once at the top; the bottom corner carries only
  // the glyph, so the two never collide.
  const cornerLabel = card.special ? glyph : card.value;
  element.innerHTML =
    `<span class="corner"><span class="num">${card.special ? name : card.value}</span><span class="pip">${glyph}</span></span>` +
    `<span class="centre">${glyph}</span>` +
    `<span class="corner br"><span class="num">${cornerLabel}</span><span class="pip">${glyph}</span></span>` +
    `<span class="suit-name">${card.special ? `${name} · ${shownValue}` : name}</span>`;
  element.setAttribute('aria-label', card.special ? `${name}, value ${shownValue}` : `${card.value} of ${name}`);
  return element;
}

function backElement(key) {
  const element = document.createElement('div');
  element.className = 'card back';
  element.dataset.back = key;
  element.setAttribute('aria-label', 'Face-down card');
  return element;
}

function tidePips(element, tide) {
  element.innerHTML = '';
  for (let index = 0; index < START_TIDE; index += 1) {
    const pip = document.createElement('i');
    if (index >= tide) pip.className = 'spent';
    element.appendChild(pip);
  }
}

export function createRenderer(root) {
  const foeHand = root.querySelector('#foe-hand');
  const youHand = root.querySelector('#you-hand');
  const foePlayed = root.querySelector('#foe-played');
  const youPlayed = root.querySelector('#you-played');
  const message = root.querySelector('#message');
  const trumpWheel = root.querySelector('#trump-wheel');
  const nextBtn = root.querySelector('#next-btn');
  const overlay = root.querySelector('#overlay');
  const overlayCard = root.querySelector('#overlay-card');
  const overlayTitle = root.querySelector('#overlay-title');
  const overlaySub = root.querySelector('#overlay-sub');
  const overlayBody = root.querySelector('#overlay-body');
  const overlayBtn = root.querySelector('#overlay-btn');

  trumpWheel.innerHTML = SUIT_ORDER.map(
    (suit) => `<span class="tw-${suit}">${SUITS[suit].glyph} ${SUITS[suit].name}</span> trumps <span class="tw-${TRUMPS[suit]}">${SUITS[TRUMPS[suit]].glyph} ${SUITS[TRUMPS[suit]].name}</span>`,
  ).join(' · ');

  function draw(duel, onCardClick, onNext, onOverlayButton) {
    tidePips(root.querySelector('#foe-tide'), duel.foeTide);
    tidePips(root.querySelector('#you-tide'), duel.youTide);
    root.querySelector('#foe-tricks').textContent = String(duel.foeTricks);
    root.querySelector('#you-tricks').textContent = String(duel.youTricks);
    root.querySelector('#round-label').textContent = `Round ${duel.round}`;
    root.querySelector('#deck-count').textContent = `Deck ${duel.deck.length} · ${handRead(duel.foeHand)}`;

    foeHand.replaceChildren();
    duel.foeHand.forEach((card, index) => foeHand.appendChild(backElement(`foe-${index}`)));

    youHand.replaceChildren();
    duel.youHand.forEach((card) => {
      const element = cardElement(card);
      element.tabIndex = 0;
      element.setAttribute('role', 'button');
      if (duel.screen === 'play' && !duel.trickResolved) element.classList.add('playable');
      else element.classList.add('disabled');
      element.addEventListener('click', () => onCardClick(card));
      element.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); onCardClick(card); }
      });
      youHand.appendChild(element);
    });

    foePlayed.replaceChildren();
    if (duel.foePlayed) {
      foePlayed.appendChild(cardElement(duel.foePlayed));
      if (duel.trickResolved && duel.lastWinner === 'foe') foePlayed.classList.add('winner');
      else foePlayed.classList.remove('winner');
    } else {
      foePlayed.innerHTML = '<div class="slot-label">Riva’s card</div>';
      foePlayed.classList.remove('winner');
    }
    youPlayed.replaceChildren();
    if (duel.youPlayed) {
      youPlayed.appendChild(cardElement(duel.youPlayed));
      if (duel.trickResolved && duel.lastWinner === 'you') youPlayed.classList.add('winner');
      else youPlayed.classList.remove('winner');
    } else {
      youPlayed.innerHTML = '<div class="slot-label">Your card</div>';
      youPlayed.classList.remove('winner');
    }

    message.innerHTML = duel.message + (duel.foeTell && duel.trickResolved ? `<br><i>${duel.foeTell}</i>` : '');
    nextBtn.hidden = !(duel.screen === 'play' && duel.trickResolved && !duel.winner);
    nextBtn.onclick = onNext;

    if (duel.screen === SCREEN_TITLE) showOverlay('title');
    else if (duel.screen === SCREEN_WIN) showOverlay('win', duel);
    else if (duel.screen === SCREEN_LOSS) showOverlay('loss', duel);
    else if (duel.screen === SCREEN_HELP) showOverlay('help');
    else overlay.hidden = true;

    overlayBtn.onclick = onOverlayButton;
  }

  function showOverlay(kind, duel) {
    overlay.hidden = false;
    overlayCard.className = kind === 'win' ? 'win' : kind === 'loss' ? 'loss' : '';
    if (kind === 'title') {
      overlayTitle.textContent = 'Ember Tide';
      overlaySub.textContent = 'A duel of tides and embers.';
      overlayBody.innerHTML = HELP_HTML;
      overlayBtn.textContent = 'Begin the duel';
    } else if (kind === 'help') {
      overlayTitle.textContent = 'How to play';
      overlaySub.textContent = 'Ember Tide in one minute.';
      overlayBody.innerHTML = HELP_HTML;
      overlayBtn.textContent = 'Back to the table';
    } else if (kind === 'win') {
      overlayTitle.textContent = 'You win the tide!';
      overlaySub.textContent = `Tricks ${duel.youTricks}–${duel.foeTricks} · Tide ${duel.youTide}–${duel.foeTide}`;
      overlayBody.innerHTML = `<p class="flourish">🌊🔥✦</p><p>Riva lays her cards down and bows. The ember tide burns bright for you — every trick you stole, every surge you weathered, led here. Play again and defend the table.</p>`;
      overlayBtn.textContent = 'Play again';
    } else {
      overlayTitle.textContent = 'The tide takes you';
      overlaySub.textContent = `Tricks ${duel.youTricks}–${duel.foeTricks} · Tide ${duel.youTide}–${duel.foeTide}`;
      overlayBody.innerHTML = `<p class="flourish">💧🥀</p><p>Riva gathers the cards with a small, sorry smile. The tide ebbed from your shore — but the deck is shuffled and the embers are warm. Take the table back.</p>`;
      overlayBtn.textContent = 'Play again';
    }
  }

  return { draw };
}
