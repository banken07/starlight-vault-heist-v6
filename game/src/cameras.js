// cameras.js — one job: the brass-eye cameras and their sweeping cones.
// A camera is a brass dome on the wall plus a red cone that sweeps
// back and forth. One camera per area, cones never stacked: each
// camera's sweep is aimed at its own patch of floor, and the vault
// camera's sweep stops before the glass case, so the diamond is never
// drowned in red.
//
// A lens cap blinds a camera for 8 seconds; smoke blinds every cone
// in a radius for 6 seconds. Both are bought with coins.
import { CAMERA_CONE_RANGE, CAMERA_CONE_HALF_ANGLE } from './config.js';

export function makeCamera(id, x, y, baseAngle, sweep, speed, phase = 0) {
  return {
    id, x, y, baseAngle, sweep, speed, phase,
    angle: baseAngle, t: phase,
    blind: 0, // frames of blindness left
  };
}

export function camerasForRoom(roomIndex) {
  if (roomIndex === 0) {
    return [
      makeCamera('CAM 1', 120, 92, 0.9, 0.7, 0.011, 0),
      makeCamera('CAM 2', 92, 430, 0.1, 0.6, 0.009, 40),
    ];
  }
  if (roomIndex === 1) {
    return [
      makeCamera('CAM 1', 120, 92, 0.9, 0.7, 0.011, 0),
      // CAM 2 on the right wall, clear of JULES and clear of the star
      // chart (now at x 700-920, y 130-220), sweeping the right hall.
      makeCamera('CAM 2', 930, 380, 2.7, 0.55, 0.01, 60),
    ];
  }
  return [
    makeCamera('CAM 1', 120, 92, 0.9, 0.7, 0.011, 0),
    makeCamera('CAM 2', 92, 430, 0.1, 0.6, 0.009, 40),
    // CAM 3 lives on the right wall, not in the top corner, and its
    // cone points down and left with a short range: the cone tip ends
    // near (784, 328), clear of the glass case (top y 300, right x
    // 760), so the diamond sits in clear floor light, never inside red.
    makeCamera('CAM 3', 930, 240, 2.6, 0.45, 0.008, 20),
  ];
}

export function cameraStep(cam, dt) {
  if (cam.blind > 0) cam.blind -= dt;
  cam.t += dt;
  cam.angle = cam.baseAngle + Math.sin(cam.t * cam.speed) * cam.sweep;
}

export function cameraSees(cam, player) {
  if (cam.blind > 0) return false;
  const dx = player.x - cam.x;
  const dy = player.y - cam.y;
  const d = Math.hypot(dx, dy);
  if (d > CAMERA_CONE_RANGE) return false;
  let diff = Math.atan2(dy, dx) - cam.angle;
  while (diff > Math.PI) diff -= 2 * Math.PI;
  while (diff < -Math.PI) diff += 2 * Math.PI;
  return Math.abs(diff) < CAMERA_CONE_HALF_ANGLE;
}

export function blindCamera(cam, frames) {
  cam.blind = Math.max(cam.blind, frames);
}
