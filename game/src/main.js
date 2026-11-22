// main.js — one job: the game loop and the state machine.
// One state object carries the room, the thief, the guards, the
// cameras, the coins, the alarm and the clock. Each frame: step the
// world, check sight lines, escalate the alarm, then draw.
// Staged shots (?shot=N) freeze a real state instead of playing.
import { CANVAS_W, CANVAS_H, SHOT_BASE_TIME, START_COINS, SMALL_LOOT_TOTAL, ROUND_SECONDS } from './config.js';
import { roomByIndex } from './rooms.js';
import { guardsForRoom, guardStep, guardSees, guardSuspicion } from './guards.js';
import { camerasForRoom, cameraStep, cameraSees } from './cameras.js';
import { makePlayer, playerStep, playerLockpick, playerGrabDiamond, playerCollectLoot, playerAtZipline, nearCase } from './player.js';
import { useSmoke, useLensCap, toolByKey } from './tools.js';
import { drawGame } from './render.js';
import { makeKeys, bindInput } from './input.js';
import { ensureAudio, sfx, toggleMute } from './audio.js';
import { SHOT_DEFS, shotFromQuery } from './shots.js';

export function makeState(roomIndex = 0) {
  const room = roomByIndex(roomIndex);
  const state = {
    roomIndex,
    player: makePlayer(120, 700),
    guards: guardsForRoom(roomIndex),
    cameras: camerasForRoom(roomIndex),
    keys: makeKeys(),
    coins: START_COINS,
    lootTaken: 0,
    alarm: 0, // 0 CALM, 1 UNEASY, 2 HUNTED, 3 ALARM
    spotted: 0,
    timeLeft: ROUND_SECONDS,
    elapsedFrames: 0,
    caseOpen: false,
    resealFrames: 0,
    smoke: null,
    toast: 'Steal the Comet Diamond. Stay out of the cones.',
    banner: '',
    outcome: '',
    lockHint: '',
    roomCleared: [false, false, false],
  };
  // Fresh loot spots per room: a spot taken in an earlier room stays
  // taken when the player comes back, so the count never jumps.
  for (const r of [0, 1, 2]) {
    for (const spot of roomByIndex(r).lootSpots) spot.taken = false;
  }
  return state;
}

export function applyShot(state, n) {
  const def = SHOT_DEFS[n];
  if (!def) return state;
  const next = makeState(def.room);
  next.alarm = def.alarm;
  next.coins = def.coins;
  next.lootTaken = def.lootTaken;
  next.timeLeft = SHOT_BASE_TIME[n];
  next.toast = def.toast;
  next.banner = def.banner ?? '';
  next.outcome = def.outcome ?? '';
  next.caseOpen = def.caseOpen ?? false;
  next.resealFrames = def.resealFrames ?? 0;
  next.player.x = def.player.x;
  next.player.y = def.player.y;
  next.player.hasDiamond = def.hasDiamond ?? false;
  next.player.onZipline = def.player.onZipline ?? false;
  next.player.ziplineT = def.player.ziplineT ?? 0;
  next.spotted = def.alarm >= 2 ? def.alarm : def.alarm === 1 ? 1 : 0;
  const room = roomByIndex(def.room);
  room.lootSpots.forEach((spot, i) => { spot.taken = i < def.lootTaken; });
  def.guards.forEach((g, i) => {
    const guard = next.guards[i];
    if (!guard) return;
    guard.x = g.x;
    guard.y = g.y;
    guard.angle = g.angle;
    guard.suspicion = g.suspicion;
    guard.state = g.suspicion >= 100 ? 'chase' : g.suspicion >= 55 ? 'suspicious' : 'patrol';
    guard.spottedFlash = g.suspicion >= 55 ? 30 : 0;
  });
  def.cameras.forEach((c, i) => {
    if (next.cameras[i]) next.cameras[i].angle = c.angle;
  });
  return next;
}

function escalateAlarm(state, seen) {
  if (state.outcome) return;
  if (seen) {
    state.spotted += 1;
    if (state.alarm === 0) {
      state.alarm = 1;
      state.toast = 'SPOTTED — a cone found you. Break line of sight!';
      sfx.spotted();
    } else if (state.alarm === 1 && state.spotted % 90 === 0) {
      state.alarm = 2;
      state.toast = 'HUNTED — guards are closing in!';
      sfx.alarm();
    } else if (state.alarm === 2 && state.spotted % 240 === 0) {
      state.alarm = 3;
      state.toast = 'ALARM — run for the zipline or hide!';
      sfx.alarm();
    }
  }
}

function stepWorld(state) {
  if (state.outcome) return;
  const dt = 1;
  state.elapsedFrames += dt;
  if (state.elapsedFrames % 60 === 0 && state.timeLeft > 0) state.timeLeft -= 1;
  if (state.timeLeft <= 0) {
    state.outcome = 'caught';
    state.toast = 'Out of time — the vault sealed with you inside.';
    sfx.caught();
    return;
  }
  const room = roomByIndex(state.roomIndex);
  // Mouse click steers the thief toward the click point.
  if (state.keys.clickX !== null) {
    const dx = state.keys.clickX - state.player.x;
    const dy = state.keys.clickY - state.player.y;
    if (Math.hypot(dx, dy) > 12) {
      state.keys.left = dx < -4;
      state.keys.right = dx > 4;
      state.keys.up = dy < -4;
      state.keys.down = dy > 4;
    } else {
      state.keys.clickX = null;
      state.keys.clickY = null;
      state.keys.left = state.keys.right = state.keys.up = state.keys.down = false;
    }
  }
  playerStep(state.player, state.keys, room, dt);
  playerCollectLoot(state);
  const before = state.coins;
  state.lockHint = playerLockpick(state, dt);
  if (state.coins < before) sfx.pick();
  if (state.caseOpen && !state.player.hasDiamond) {
    if (playerGrabDiamond(state)) sfx.unlock();
  }
  if (state.resealFrames > 0) {
    state.resealFrames -= dt;
    if (state.resealFrames <= 0 && !state.player.hasDiamond) {
      state.caseOpen = false;
      state.toast = 'The case resealed. Pick the lock again.';
    }
  }
  if (state.smoke && state.smoke.frames > 0) state.smoke.frames -= dt;
  // Sight lines: guards and cameras, unless smoke covers them.
  let seen = false;
  for (const g of state.guards) {
    guardStep(g, state.player, dt);
    const inSmoke = state.smoke && state.smoke.frames > 0
      && Math.hypot(g.x - state.player.x, g.y - state.player.y) < 200;
    const sees = !inSmoke && guardSees(g, state.player);
    guardSuspicion(g, sees, dt);
    if (sees) seen = true;
    if (g.state === 'chase' && Math.hypot(g.x - state.player.x, g.y - state.player.y) < 34) {
      state.outcome = 'caught';
      state.toast = 'CAUGHT — a guard grabbed you.';
      sfx.caught();
      return;
    }
  }
  for (const c of state.cameras) {
    cameraStep(c, dt);
    if (cameraSees(c, state.player)) seen = true;
  }
  escalateAlarm(state, seen);
  // Room exit: walk into the green door to move on — or, in the
  // vault with the diamond, ride the zipline out and win.
  const ex = room.exit;
  const inExit = state.player.x > ex.x - 10 && state.player.x < ex.x + ex.w + 10
    && state.player.y > ex.y - 10 && state.player.y < ex.y + ex.h + 10;
  if (inExit && state.roomIndex < 2) {
    state.roomCleared[state.roomIndex] = true;
    const keep = { coins: state.coins, lootTaken: state.lootTaken, spotted: state.spotted };
    const fresh = makeState(state.roomIndex + 1);
    Object.assign(state, fresh, keep);
    state.toast = `Room ${state.roomIndex + 1} — ${roomByIndex(state.roomIndex).name}`;
    return;
  }
  if (state.roomIndex === 2 && playerAtZipline(state)) {
    state.player.onZipline = true;
  }
  if (state.player.onZipline) {
    state.player.ziplineT = Math.min(1, state.player.ziplineT + 0.012 * dt);
    if (state.player.ziplineT >= 1) {
      state.outcome = 'win';
      sfx.win();
    }
  }
  // The thief can also slip through the vent: stand on it, press E.
  if (state.keys.action && !state.player.onZipline) {
    const vent = room.vent;
    if (state.player.x > vent.x && state.player.x < vent.x + vent.w
      && Math.abs(state.player.y - vent.y) < 40) {
      state.player.x = room.ventExit.x;
      state.player.y = room.ventExit.y;
      state.toast = 'Through the vent — the patrol never saw you.';
    }
  }
  if (state.lockHint) state.toast = state.lockHint;
}

function useTool(state, key) {
  if (state.outcome) return;
  const tool = toolByKey(key);
  if (!tool) return;
  if (tool.id === 'smoke') useSmoke(state);
  else if (tool.id === 'lenscap') useLensCap(state);
  else if (tool.id === 'lockpick') {
    state.toast = nearCase(state.player)
      ? 'Hold E at the case to pick the lock (10 coins)'
      : 'Stand by the glass case to pick the lock.';
  }
}

export function startGame() {
  const canvas = document.getElementById('game');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d');
  let state = makeState(0);
  const shot = shotFromQuery();
  const staged = shot > 0;
  if (staged) state = applyShot(state, shot);
  bindInput(state.keys, canvas, {
    onMute: () => { ensureAudio(); toggleMute(); },
    onRestart: () => { state = staged ? applyShot(makeState(0), shot) : makeState(state.roomIndex); },
    onTool: (key) => { ensureAudio(); useTool(state, key); },
    onClick: () => ensureAudio(),
    onConfirm: () => ensureAudio(),
  });
  // In staged shots the clock still ticks, so the footer timer is
  // live rather than a frozen number — but the scene does not play.
  function frame() {
    if (!staged) stepWorld(state);
    else {
      state.elapsedFrames += 1;
      if (state.elapsedFrames % 60 === 0 && state.timeLeft > 0) state.timeLeft -= 1;
      if (state.resealFrames > 0) state.resealFrames -= 1;
    }
    drawGame(ctx, state);
    requestAnimationFrame(frame);
  }
  document.getElementById('shot-caption').textContent =
    staged ? SHOT_DEFS[shot].caption : 'Play: steal the Comet Diamond, ride the zipline out.';
  requestAnimationFrame(frame);
}

startGame();
