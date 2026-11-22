// config.js — one job: every tunable number for Starlight Vault.
// Canvas is 1280x800. The playfield is the left 952px; the right 328px
// is the HUD sidebar drawn on the same canvas so screenshots capture it.
export const CANVAS_W = 1280;
export const CANVAS_H = 800;
export const FIELD_W = 952;
export const FIELD_H = 800;
export const SIDEBAR_X = 952;
export const SIDEBAR_W = 328;

// The thief runs a little slower than a guard's chase, so being seen
// is a real problem: chase 2.95 vs run 2.6 (px per frame at 60fps).
export const PLAYER_RUN_SPEED = 2.6;
export const PLAYER_SNEAK_SPEED = 1.5;
export const GUARD_PATROL_SPEED = 1.1;
export const GUARD_CHASE_SPEED = 2.95;
export const GUARD_CONE_RANGE = 230;
export const GUARD_CONE_HALF_ANGLE = 0.62; // radians, about 35 degrees
export const CAMERA_CONE_RANGE = 190;
export const CAMERA_CONE_HALF_ANGLE = 0.5;

export const TOOL_COSTS = { lockpick: 10, smoke: 15, lenscap: 8 };
export const SMALL_LOOT_VALUE = 5;
export const SMALL_LOOT_TOTAL = 4;
export const START_COINS = 20;
export const LOCKPICK_SECONDS = 3;
export const RESEAL_SECONDS = 10;
export const ROUND_SECONDS = 300;

export const ALARM_STAGES = ['CALM', 'UNEASY', 'HUNTED', 'ALARM'];
export const ALARM_COLORS = {
  CALM: '#7ee2a8',
  UNEASY: '#ffd166',
  HUNTED: '#ff9f43',
  ALARM: '#ff5a5a',
};

export const COLORS = {
  floor: '#141a2e',
  floorAlt: '#182036',
  wall: '#2c3552',
  wallEdge: '#4a5878',
  brass: '#c9a227',
  brassLight: '#e8c766',
  parchment: '#f2e3b3',
  parchmentDim: '#cbb87e',
  diamond: '#bfefff',
  diamondCore: '#ffffff',
  coneGuard: 'rgba(255, 176, 66, 0.30)',
  coneGuardEdge: 'rgba(255, 176, 66, 0.75)',
  coneCamera: 'rgba(255, 92, 92, 0.26)',
  coneCameraEdge: 'rgba(255, 92, 92, 0.7)',
  playerRing: '#37e6ff',
  playerFill: '#0b3542',
  lightPool: 'rgba(255, 196, 110, 0.14)',
  sidebar: '#0d1226',
  sidebarEdge: '#2c3552',
  text: '#eef2ff',
  textDim: '#9aa7c7',
  green: '#4ade80',
  red: '#ff5a5a',
};

// The staged shot clock: each shot starts from its own base time and
// then ticks live, so the footer timer is never a stale 0s.
export const SHOT_BASE_TIME = { 1: 272, 2: 238, 3: 192, 4: 167, 5: 143, 6: 121 };
