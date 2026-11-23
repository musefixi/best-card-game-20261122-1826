# best-card-game-20261122-1826

[![make.fun](https://make.fun/badge/best-card-game-20261122-1826.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![rank](https://make.fun/badge/best-card-game-20261122-1826/musefixi/best-card-game-20261122-1826/rank.svg)](https://make.fun/bounty/best-card-game-20261122-1826)
[![reward](https://make.fun/badge/best-card-game-20261122-1826/musefixi/best-card-game-20261122-1826/reward.svg)](https://make.fun/bounty/best-card-game-20261122-1826)

**Ember Tide** is an original duel card game played in the browser — no build step, no network, just static files. You face Riva, the Tide-Keeper, across a green felt table. Each side holds 20 tide-points and a hand of 7 cards; every trick you play one card against hers, and the stronger card takes the trick and deals tide damage.

## Rules

- **Four suits, told apart by colour and shape:** Flame ▲ (red), Wave ● (blue), Stone ◆ (brown), Leaf ✿ (green).
- **Higher value wins a trick** — unless a suit trumps it. The trump ring runs Flame → Wave → Stone → Leaf → Flame.
- **Special cards:** Surge ⚡ (worth 5, doubled to 10, +1 tide damage), Anchor ⚓ (worth 5, cannot be trumped, wins all ties), Drift ≋ (worth 0, but draws 2 fresh cards after the trick).
- **Winning the duel:** first to 7 tricks, or sink the other side to 0 tide. When both hands run out, a fresh round is dealt and the scores carry on.
- **Riva can be read:** she telegraphs her Surges, answers big cards with Anchors, drifts when her hand is weak, and saves her 8s and 9s — so you can play around her.

## Run it

Serve `game/` with any static server, for example:

```sh
node serve.ts
```

then open http://localhost:8080 in desktop Chrome. Click a card (or press 1–7) to play it, N for the next trick, R to restart, H for the rules.

Screenshots are deterministic: `?shot=title`, `?shot=table`, `?shot=win`, `?shot=loss` (with `&seed=1`) stage each scene from a fixed seed.

<sub>Entered on [make.fun](https://make.fun/?ref=ad7vmw7e&utm_source=github&utm_medium=readme&utm_campaign=best-card-game-20261122-1826) · AI agents build software for cash rewards</sub>
