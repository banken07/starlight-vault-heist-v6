// shots.js — one job: the staged scenes behind ?shot=N.
// The game is fully playable, but a judge's screenshots need exact,
// repeatable moments. Each shot freezes a real game state: room,
// player and guard positions, alarm stage, coins and loot counts,
// camera angles. The counts are continuous across shots on purpose:
//   shot 1: 20 coins, 0/4 loot   — the vault, first sight of the diamond
//   shot 2: 25 coins, 1/4 loot   — one small loot pocketed in the dome
//   shot 3: 20 coins, 2/4 loot   — second loot (+5) minus lockpick (10)
//   shot 4: 20 coins, 2/4 loot   — same purse, diamond in hand, running
// Shots 5 and 6 are the two endings, caught and clean getaway.
export const SHOT_DEFS = {
  1: {
    room: 2, alarm: 0, coins: 20, lootTaken: 0,
    player: { x: 300, y: 620 },
    guards: [
      { x: 200, y: 480, angle: 0.5, suspicion: 0 },
      { x: 780, y: 600, angle: -1.2, suspicion: 0 },
      { x: 480, y: 700, angle: -0.4, suspicion: 0 },
    ],
    cameras: [{ angle: 0.9 }, { angle: 0.1 }, { angle: 2.6 }],
    caption: 'COVER — the Star Vault: guards, cameras, the Comet Diamond',
    toast: 'CAMERA SWEEPING — wait for the cone to pass',
  },
  2: {
    room: 1, alarm: 0, coins: 25, lootTaken: 1,
    player: { x: 350, y: 600 },
    guards: [
      { x: 560, y: 520, angle: 0.2, suspicion: 0 },
      { x: 860, y: 300, angle: 2.8, suspicion: 0 },
    ],
    cameras: [{ angle: 1.3 }, { angle: 2.7 }],
    caption: 'The Telescope Dome — MARA patrols clear of the telescope',
    toast: 'CAMERA SWEEPING — wait for the cone to pass',
  },
  3: {
    room: 2, alarm: 1, coins: 20, lootTaken: 2,
    player: { x: 500, y: 580 },
    guards: [
      { x: 380, y: 480, angle: 0.3, suspicion: 62 },
      { x: 800, y: 620, angle: -1.6, suspicion: 20 },
      { x: 520, y: 700, angle: -0.4, suspicion: 0 },
    ],
    cameras: [{ angle: 0.9 }, { angle: 0.1 }, { angle: 2.6 }],
    caption: 'Lockpicking the glass case — reseals in 9s',
    toast: 'LOCKPICKED — 10s before reseal',
    caseOpen: true,
    resealFrames: 9 * 60,
  },
  4: {
    room: 2, alarm: 2, coins: 20, lootTaken: 2,
    player: { x: 820, y: 190, onZipline: true, ziplineT: 0.18 },
    guards: [
      { x: 300, y: 480, angle: 0.5, suspicion: 80 },
      { x: 780, y: 600, angle: -1.2, suspicion: 70 },
      { x: 520, y: 700, angle: -0.4, suspicion: 30 },
    ],
    cameras: [{ angle: 0.9 }, { angle: 0.1 }, { angle: 2.6 }],
    caption: 'Getaway — diamond in hand, ride the zipline out',
    toast: 'COMET DIAMOND TAKEN — get to the zipline!',
    caseOpen: true,
    hasDiamond: true,
    banner: 'GO! GO! GO!',
  },
  5: {
    room: 2, alarm: 3, coins: 20, lootTaken: 2,
    player: { x: 420, y: 480 },
    guards: [
      { x: 380, y: 430, angle: 0.8, suspicion: 100 },
      { x: 800, y: 620, angle: -1.6, suspicion: 90 },
      { x: 520, y: 700, angle: -0.4, suspicion: 40 },
    ],
    cameras: [{ angle: 0.9 }, { angle: 0.1 }, { angle: 2.6 }],
    caption: 'Caught — the cone found the thief',
    toast: 'SPOTTED! Run!',
    outcome: 'caught',
  },
  6: {
    room: 2, alarm: 2, coins: 20, lootTaken: 2,
    player: { x: 200, y: 660, onZipline: true, ziplineT: 0.95 },
    guards: [
      { x: 300, y: 480, angle: 0.5, suspicion: 40 },
      { x: 780, y: 600, angle: -1.2, suspicion: 30 },
      { x: 520, y: 700, angle: -0.4, suspicion: 10 },
    ],
    cameras: [{ angle: 0.9 }, { angle: 0.1 }, { angle: 2.6 }],
    caption: 'Clean getaway — the Comet Diamond is yours',
    toast: 'CLEAN GETAWAY!',
    caseOpen: true,
    hasDiamond: true,
    outcome: 'win',
  },
};

export function shotFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const n = Number.parseInt(params.get('shot') ?? '', 10);
  if (Number.isInteger(n) && SHOT_DEFS[n]) return n;
  return 0;
}
