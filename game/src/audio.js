// audio.js — one job: tiny WebAudio bleeps. No assets, no network:
// every sound is an oscillator started on a user gesture, so the game
// stays silent until the player first presses a key.
let ctx = null;
let muted = false;

export function ensureAudio() {
  if (ctx) return;
  try {
    const AC = window.AudioContext ?? window.webkitAudioContext;
    if (AC) ctx = new AC();
  } catch {
    ctx = null;
  }
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function blip(freq, seconds, type = 'sine', gain = 0.05) {
  if (!ctx || muted) return;
  try {
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    g.gain.setValueAtTime(gain, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + seconds);
    osc.connect(g).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + seconds);
  } catch {
    // Audio is decoration; a failure must never break the game.
  }
}

export const sfx = {
  coin() { blip(880, 0.12, 'sine', 0.05); setTimeout(() => blip(1320, 0.1, 'sine', 0.04), 70); },
  pick() { blip(520, 0.08, 'triangle', 0.05); },
  unlock() { blip(660, 0.12, 'triangle', 0.06); setTimeout(() => blip(990, 0.18, 'triangle', 0.06), 90); },
  spotted() { blip(220, 0.25, 'sawtooth', 0.06); },
  alarm() { blip(180, 0.4, 'sawtooth', 0.07); setTimeout(() => blip(180, 0.4, 'sawtooth', 0.07), 450); },
  win() { [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => blip(f, 0.2, 'sine', 0.06), i * 120)); },
  caught() { [400, 300, 200].forEach((f, i) => setTimeout(() => blip(f, 0.25, 'sawtooth', 0.06), i * 150)); },
};
