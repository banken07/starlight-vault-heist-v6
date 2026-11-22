// player.js — one job: the thief. Movement, sneaking, loot, the
// lockpick channel on the glass case, grabbing the diamond, and the
// zipline ride out. The thief is drawn big (radius 26) with a single
// high-contrast YOU pill above — one label only, never two.
import { PLAYER_RUN_SPEED, PLAYER_SNEAK_SPEED, FIELD_W, FIELD_H, LOCKPICK_SECONDS, RESEAL_SECONDS } from './config.js';
import { roomByIndex, VAULT_CASE } from './rooms.js';

export function makePlayer(x = 120, y = 700) {
  return {
    x, y, r: 26,
    sneak: false,
    moving: false,
    facing: 0,
    hasDiamond: false,
    lockpicking: 0, // frames of channel held, 0 when idle
    onZipline: false,
    ziplineT: 0,
  };
}

export function playerStep(player, keys, room, dt) {
  if (player.onZipline) {
    player.ziplineT = Math.min(1, player.ziplineT + 0.012 * dt);
    return;
  }
  let dx = 0;
  let dy = 0;
  if (keys.left) dx -= 1;
  if (keys.right) dx += 1;
  if (keys.up) dy -= 1;
  if (keys.down) dy += 1;
  player.moving = dx !== 0 || dy !== 0;
  if (!player.moving) return;
  const len = Math.hypot(dx, dy);
  const speed = (player.sneak ? PLAYER_SNEAK_SPEED : PLAYER_RUN_SPEED) * dt;
  const nx = player.x + (dx / len) * speed;
  const ny = player.y + (dy / len) * speed;
  player.facing = Math.atan2(dy, dx);
  // Walls are the room border plus the balcony edge and the telescope
  // pier; the vent and balcony routes stay walkable by design.
  player.x = Math.max(24, Math.min(FIELD_W - 24, nx));
  player.y = Math.max(24, Math.min(FIELD_H - 24, ny));
  const pier = room.telescope;
  if (pier) {
    const pdx = player.x - pier.pierX;
    const pdy = player.y - pier.pierY;
    const pd = Math.hypot(pdx, pdy);
    if (pd < 46 && pd > 0) {
      player.x = pier.pierX + (pdx / pd) * 46;
      player.y = pier.pierY + (pdy / pd) * 46;
    }
  }
}

export function nearCase(player) {
  const c = VAULT_CASE;
  const cx = Math.max(c.x, Math.min(player.x, c.x + c.w));
  const cy = Math.max(c.y, Math.min(player.y, c.y + c.h));
  return Math.hypot(player.x - cx, player.y - cy) < 78;
}

// Hold E by the case to pick the lock. Returns a status line for the HUD.
export function playerLockpick(state, dt) {
  const p = state.player;
  if (state.roomIndex !== 2 || state.caseOpen) return '';
  if (!nearCase(p)) { p.lockpicking = 0; return ''; }
  if (!state.keys.action) { p.lockpicking = 0; return 'Hold E at the case to pick the lock (10 coins)'; }
  if (p.lockpicking === 0 && state.coins < 10) return 'Need 10 coins for the lockpick.';
  if (p.lockpicking === 0) {
    state.coins -= 10;
    state.toast = 'PICKING THE LOCK…';
  }
  p.lockpicking += dt;
  const need = LOCKPICK_SECONDS * 60;
  if (p.lockpicking >= need) {
    state.caseOpen = true;
    state.resealFrames = RESEAL_SECONDS * 60;
    p.lockpicking = 0;
    state.toast = 'LOCKPICKED — 10s before reseal';
    return state.toast;
  }
  return `Picking… ${Math.ceil((1 - p.lockpicking / need) * LOCKPICK_SECONDS)}s`;
}

export function playerGrabDiamond(state) {
  const p = state.player;
  if (!state.caseOpen || p.hasDiamond) return false;
  if (!nearCase(p)) return false;
  p.hasDiamond = true;
  state.toast = 'COMET DIAMOND TAKEN — get to the zipline!';
  return true;
}

export function playerCollectLoot(state) {
  const room = roomByIndex(state.roomIndex);
  for (const spot of room.lootSpots) {
    if (spot.taken) continue;
    if (Math.hypot(state.player.x - spot.x, state.player.y - spot.y) < 34) {
      spot.taken = true;
      state.coins += 5;
      state.lootTaken += 1;
      state.toast = `Small loot +5 coins (${state.lootTaken}/4)`;
    }
  }
}

// The zipline only works once the diamond is in hand.
export function playerAtZipline(state) {
  const room = roomByIndex(state.roomIndex);
  if (!room.zipline || !state.player.hasDiamond) return false;
  return Math.hypot(state.player.x - room.zipline.ax, state.player.y - room.zipline.ay) < 70;
}
