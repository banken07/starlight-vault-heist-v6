// rooms.js — one job: the three rooms and everything fixed inside them.
// Each room is a plain data object: walls, routes (floor / balcony /
// vent), displays, the star chart, the telescope, the vault case with
// the Comet Diamond, and the zipline. No logic lives here, only layout,
// so a room can be read at a glance and staged shots can reuse it.
//
// Geometry rules learned from the earlier version:
// - the vault case is BIG and the diamond inside it is the largest,
//   brightest object in the room (120 x 100 px on the cover);
// - the top-right corner holds exactly ONE camera cone, and that cone
//   stops well short of the diamond case;
// - the balcony and the vent are real walkable geometry (floorboards,
//   railing posts, slatted grille), never just a label or a strip.
import { FIELD_W, FIELD_H } from './config.js';

export const VAULT_CASE = { x: 560, y: 300, w: 200, h: 170 };
export const DIAMOND = { cx: 660, cy: 380, w: 120, h: 100 };

export function roomWalls() {
  return [
    { x: 0, y: 0, w: FIELD_W, h: 14 },
    { x: 0, y: FIELD_H - 14, w: FIELD_W, h: 14 },
    { x: 0, y: 0, w: 14, h: FIELD_H },
    { x: FIELD_W - 14, y: 0, w: 14, h: FIELD_H },
  ];
}

// Four star displays, each a framed panel with its own warm light pool.
// They always sit in the left column, clear of the vault case, the
// telescope and the zipline, so they read the same in every room.
export function starDisplays(roomIndex) {
  return [
    { x: 36, y: 210, w: 92, h: 64, title: 'ORION' },
    { x: 36, y: 300, w: 92, h: 64, title: 'LYRA' },
    { x: 36, y: 390, w: 92, h: 64, title: 'CYGNUS' },
    { x: 36, y: 480, w: 92, h: 64, title: 'PERSEUS' },
  ];
}

export const ROOMS = [
  {
    index: 0,
    name: 'THE MAP ROOM',
    subtitle: 'Charts, globes and the first patrol',
    // Walkable balcony along the top edge, reached by stairs at the left.
    balcony: { x: 300, y: 30, w: 420, h: 62 },
    stairs: { x: 300, y: 92, w: 70, h: 46 },
    // A slatted vent grille in the lower wall: a real crawl route.
    vent: { x: 620, y: FIELD_H - 40, w: 150, h: 26 },
    ventExit: { x: 660, y: 640 },
    starChart: { x: 330, y: 52, w: 250, h: 96 },
    starGlobes: [
      { x: 190, y: 100, r: 26 },
      { x: 246, y: 86, r: 20 },
      { x: 288, y: 106, r: 16 },
    ],
    telescope: null,
    vaultCase: null,
    zipline: null,
    lootSpots: [
      { x: 210, y: 560 }, { x: 430, y: 250 },
      { x: 700, y: 560 }, { x: 850, y: 330 },
    ],
    exit: { x: 880, y: 700, w: 58, h: 58, label: 'EXIT — TELESCOPE DOME' },
  },
  {
    index: 1,
    name: 'THE TELESCOPE DOME',
    subtitle: 'Brass, glass and a sweeping eye',
    balcony: { x: 620, y: 30, w: 300, h: 62 },
    stairs: { x: 620, y: 92, w: 70, h: 46 },
    vent: { x: 90, y: FIELD_H - 40, w: 150, h: 26 },
    ventExit: { x: 150, y: 640 },
    // The chart hangs below the balcony, clear of its floorboards.
    starChart: { x: 700, y: 130, w: 220, h: 90 },
    starGlobes: [
      { x: 190, y: 100, r: 24 },
      { x: 240, y: 86, r: 18 },
    ],
    // The great brass telescope: a long tube on a pier, drawn as
    // geometry (tube, rings, pier, dome ribs) — never a label.
    telescope: { x: 250, y: 210, len: 300, angle: -0.42, pierX: 330, pierY: 420 },
    vaultCase: null,
    zipline: null,
    lootSpots: [
      { x: 180, y: 300 }, { x: 520, y: 600 },
      { x: 780, y: 300 }, { x: 860, y: 620 },
    ],
    exit: { x: 880, y: 700, w: 58, h: 58, label: 'EXIT — STAR VAULT' },
  },
  {
    index: 2,
    name: 'THE STAR VAULT',
    subtitle: 'The Comet Diamond, behind glass',
    balcony: { x: 780, y: 30, w: 158, h: 100 },
    stairs: { x: 780, y: 130, w: 60, h: 46 },
    vent: { x: 700, y: FIELD_H - 40, w: 150, h: 26 },
    ventExit: { x: 750, y: 640 },
    starChart: { x: 330, y: 52, w: 250, h: 96 },
    starGlobes: [
      { x: 190, y: 100, r: 24 },
      { x: 240, y: 86, r: 18 },
    ],
    // No telescope in the vault: it used to cross the thief's path
    // and clutter the cover. The vault's centrepiece is the case.
    telescope: null,
    vaultCase: { ...VAULT_CASE },
    diamond: { ...DIAMOND },
    // The getaway: a straight brass cable from the balcony anchor
    // down to the roof hatch at the lower left. Straight, so it
    // passes 28px above the glass case instead of sagging onto it.
    zipline: { ax: 930, ay: 58, bx: 120, by: 700 },
    lootSpots: [
      { x: 210, y: 560 }, { x: 430, y: 250 },
      { x: 850, y: 560 }, { x: 850, y: 330 },
    ],
    exit: { x: 880, y: 300, w: 58, h: 58, label: 'EXIT — ROOF ZIPLINE' },
  },
];

export function roomByIndex(i) {
  return ROOMS[Math.max(0, Math.min(ROOMS.length - 1, i))];
}
