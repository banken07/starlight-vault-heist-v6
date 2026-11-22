// input.js — one job: keyboard and mouse state, nothing else.
// WASD / arrows move, Shift sneaks, E is the action key, 1/2/3 use
// tools, M mutes, R restarts after a win or a catch. Mouse click on
// the canvas also steers the thief toward the click point.
export function makeKeys() {
  return {
    up: false, down: false, left: false, right: false,
    action: false, sneak: false,
    clickX: null, clickY: null,
  };
}

const KEYMAP = {
  ArrowUp: 'up', KeyW: 'up',
  ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left',
  ArrowRight: 'right', KeyD: 'right',
  KeyE: 'action', ShiftLeft: 'sneak', ShiftRight: 'sneak',
};

export function bindInput(keys, canvas, hooks) {
  window.addEventListener('keydown', (e) => {
    const name = KEYMAP[e.code];
    if (name) {
      keys[name] = true;
      e.preventDefault();
    }
    if (e.code === 'KeyM') hooks.onMute?.();
    if (e.code === 'KeyR') hooks.onRestart?.();
    if (e.code === 'Digit1') hooks.onTool?.('1');
    if (e.code === 'Digit2') hooks.onTool?.('2');
    if (e.code === 'Digit3') hooks.onTool?.('3');
    if (e.code === 'Enter') hooks.onConfirm?.();
  });
  window.addEventListener('keyup', (e) => {
    const name = KEYMAP[e.code];
    if (name) keys[name] = false;
  });
  canvas.addEventListener('pointerdown', (e) => {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    keys.clickX = (e.clientX - rect.left) * scaleX;
    keys.clickY = (e.clientY - rect.top) * scaleY;
    hooks.onClick?.(keys.clickX, keys.clickY);
  });
  window.addEventListener('blur', () => {
    keys.up = keys.down = keys.left = keys.right = keys.action = false;
  });
}
