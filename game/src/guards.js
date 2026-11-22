// guards.js — one job: guard patrols, vision cones and suspicion.
// Guards walk waypoints, pause at each end, and look along their walk
// direction. A guard who sees the thief gets suspicious, then chases;
// a chase is faster than the thief's run, so the fair warning is the
// cone itself — it is drawn before the guard ever moves.
import { GUARD_PATROL_SPEED, GUARD_CHASE_SPEED, GUARD_CONE_RANGE, GUARD_CONE_HALF_ANGLE } from './config.js';

export function makeGuard(name, waypoints, pauseFrames = 90) {
  return {
    name, waypoints, pauseFrames,
    x: waypoints[0].x, y: waypoints[0].y,
    leg: 0, dir: 1, pause: 0, angle: 0,
    state: 'patrol', // patrol | suspicious | chase
    suspicion: 0,
    spottedFlash: 0,
  };
}

export function guardsForRoom(roomIndex) {
  if (roomIndex === 0) {
    return [
      makeGuard('MARA', [{ x: 200, y: 480 }, { x: 200, y: 660 }, { x: 480, y: 660 }]),
      makeGuard('JULES', [{ x: 700, y: 420 }, { x: 880, y: 420 }, { x: 880, y: 620 }]),
    ];
  }
  if (roomIndex === 1) {
    // MARA patrols the lower hall, clear of the telescope (which sits
    // up at y 210-420, x 250-550). JULES works the right side.
    return [
      makeGuard('MARA', [{ x: 560, y: 520 }, { x: 780, y: 520 }, { x: 780, y: 680 }]),
      makeGuard('JULES', [{ x: 860, y: 240 }, { x: 860, y: 420 }]),
    ];
  }
  return [
    makeGuard('MARA', [{ x: 200, y: 480 }, { x: 420, y: 480 }, { x: 420, y: 660 }]),
    makeGuard('JULES', [{ x: 780, y: 600 }, { x: 900, y: 600 }, { x: 900, y: 700 }]),
    // G — the third guard, a slow sentry by the lower wall, visible in
    // the getaway shot so the escape still has a watcher in frame.
    makeGuard('G', [{ x: 480, y: 700 }, { x: 620, y: 700 }], 140),
  ];
}

export function guardStep(guard, player, dt) {
  if (guard.state === 'chase') {
    const dx = player.x - guard.x;
    const dy = player.y - guard.y;
    const d = Math.hypot(dx, dy) || 1;
    guard.x += (dx / d) * GUARD_CHASE_SPEED * dt;
    guard.y += (dy / d) * GUARD_CHASE_SPEED * dt;
    guard.angle = Math.atan2(dy, dx);
    return;
  }
  if (guard.pause > 0) {
    guard.pause -= dt;
    return;
  }
  const target = guard.waypoints[guard.leg + guard.dir] ?? guard.waypoints[guard.leg];
  const dx = target.x - guard.x;
  const dy = target.y - guard.y;
  const d = Math.hypot(dx, dy);
  if (d < 3) {
    const next = guard.leg + guard.dir;
    if (next >= guard.waypoints.length || next < 0) {
      guard.dir *= -1;
      guard.pause = guard.pauseFrames;
    } else {
      guard.leg = next;
      guard.pause = guard.pauseFrames * 0.5;
    }
    return;
  }
  guard.x += (dx / d) * GUARD_PATROL_SPEED * dt;
  guard.y += (dy / d) * GUARD_PATROL_SPEED * dt;
  guard.angle = Math.atan2(dy, dx);
}

// True when the thief stands inside the guard's vision cone.
export function guardSees(guard, player) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const d = Math.hypot(dx, dy);
  if (d > GUARD_CONE_RANGE) return false;
  if (d < 26) return true;
  let diff = Math.atan2(dy, dx) - guard.angle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return Math.abs(diff) < GUARD_CONE_HALF_ANGLE;
}

// Suspicion rises while seen, falls while hidden. Crossing the top
// threshold flips the guard to chase and hands the alarm its escalation.
export function guardSuspicion(guard, seen, dt) {
  if (seen) {
    guard.suspicion = Math.min(100, guard.suspicion + 1.6 * dt);
    guard.spottedFlash = Math.max(guard.spottedFlash, 30);
    if (guard.suspicion >= 100) guard.state = 'chase';
    else if (guard.suspicion >= 55) guard.state = 'suspicious';
  } else {
    guard.suspicion = Math.max(0, guard.suspicion - 0.35 * dt);
    if (guard.suspicion < 55 && guard.state === 'suspicious') guard.state = 'patrol';
    if (guard.state === 'chase' && guard.suspicion <= 0) guard.state = 'patrol';
  }
  if (guard.spottedFlash > 0) guard.spottedFlash -= dt;
  return guard.state;
}
