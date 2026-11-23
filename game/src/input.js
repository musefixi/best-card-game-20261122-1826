// Mouse and keyboard input: number keys play cards, N advances, R restarts, H helps.
export const ACTION_CONFIRM = 1;
export const ACTION_NEXT = 2;
export const ACTION_RESTART = 4;
export const ACTION_HELP = 8;

/** Collect key presses into actions; number keys 1–9 report the hand index to play. */
export function createInput() {
  const pressed = { actions: 0, handIndex: -1 };
  const queue = [];

  function onKeyDown(event) {
    if (event.repeat) return;
    const key = event.key;
    if (key >= '1' && key <= '9') {
      queue.push({ handIndex: Number.parseInt(key, 10) - 1 });
    } else if (key === ' ' || key === 'Enter') {
      queue.push({ actions: ACTION_CONFIRM });
    } else if (key === 'n' || key === 'N') {
      queue.push({ actions: ACTION_NEXT });
    } else if (key === 'r' || key === 'R') {
      queue.push({ actions: ACTION_RESTART });
    } else if (key === 'h' || key === 'H') {
      queue.push({ actions: ACTION_HELP });
    }
  }

  document.addEventListener('keydown', onKeyDown);

  return {
    /** Take and clear every queued key press since the last call. */
    takePresses() {
      const taken = queue.splice(0, queue.length);
      return taken;
    },
    destroy() {
      document.removeEventListener('keydown', onKeyDown);
    },
  };
}
