// tools.js — one job: the three paid tools and what they do.
// Every tool costs coins, and coins come only from small loot, so the
// player must steal a little before they can steal the big thing.
//   lockpick (10) — opens the glass case; the case reseals after 10s.
//   smoke    (15) — blinds every vision cone in a radius for 6s.
//   lens cap ( 8) — blinds the nearest camera for 8s.
import { TOOL_COSTS } from './config.js';

export const TOOLS = [
  { key: '1', id: 'lockpick', name: 'LOCKPICK', cost: TOOL_COSTS.lockpick, blurb: 'Opens the glass case' },
  { key: '2', id: 'smoke', name: 'SMOKE BOMB', cost: TOOL_COSTS.smoke, blurb: 'Blinds cones near you, 6s' },
  { key: '3', id: 'lenscap', name: 'LENS CAP', cost: TOOL_COSTS.lenscap, blurb: 'Blinds nearest camera, 8s' },
];

export function canAfford(state, toolId) {
  return state.coins >= TOOL_COSTS[toolId];
}

export function payFor(state, toolId) {
  if (!canAfford(state, toolId)) return false;
  state.coins -= TOOL_COSTS[toolId];
  return true;
}

export function toolByKey(key) {
  return TOOLS.find((t) => t.key === key) ?? null;
}

// Smoke: every guard and camera whose eye is within 260px of the
// thief loses its cone for 6 seconds (360 frames).
export function useSmoke(state) {
  if (!payFor(state, 'smoke')) return 'Need 15 coins for smoke.';
  state.smoke = { x: state.player.x, y: state.player.y, frames: 360 };
  for (const g of state.guards) {
    if (Math.hypot(g.x - state.player.x, g.y - state.player.y) < 260) {
      g.suspicion = Math.max(0, g.suspicion - 45);
      if (g.state !== 'chase') g.state = 'patrol';
    }
  }
  for (const c of state.cameras) {
    if (Math.hypot(c.x - state.player.x, c.y - state.player.y) < 260) c.blind = Math.max(c.blind, 360);
  }
  state.toast = 'SMOKE OUT — cones blinded 6s';
  return state.toast;
}

export function useLensCap(state) {
  if (!payFor(state, 'lenscap')) return 'Need 8 coins for a lens cap.';
  let best = null;
  let bestD = Infinity;
  for (const c of state.cameras) {
    const d = Math.hypot(c.x - state.player.x, c.y - state.player.y);
    if (d < bestD) { bestD = d; best = c; }
  }
  if (!best) return 'No camera in this room.';
  best.blind = Math.max(best.blind, 480);
  state.toast = `${best.id} CAPPED — blind 8s`;
  return state.toast;
}
