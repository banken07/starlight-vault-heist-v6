// render.js — one job: everything drawn on the canvas.
// One canvas, 1280x800: the playfield on the left (952px) and the HUD
// sidebar on the right (328px), so a screenshot always shows the whole
// game — room, guards and cones, cameras, loot, alarm meter — in one
// frame. Labels are placed on a grid with room between them: exactly
// one cone per area, no cone clipped by the top edge, and the diamond
// sits in clear floor light, never inside a red cone.
import { CANVAS_W, CANVAS_H, FIELD_W, FIELD_H, SIDEBAR_X, SIDEBAR_W, COLORS, ALARM_STAGES, ALARM_COLORS, TOOL_COSTS, GUARD_CONE_RANGE, CAMERA_CONE_RANGE } from './config.js';
import { roomByIndex, starDisplays } from './rooms.js';
import { TOOLS } from './tools.js';

function pill(ctx, x, y, w, h, fill, stroke = null) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 8);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
}

function label(ctx, text, x, y, size = 13, color = COLORS.text, bg = 'rgba(8,12,26,0.82)') {
  ctx.font = `bold ${size}px system-ui, sans-serif`;
  const w = ctx.measureText(text).width + 16;
  pill(ctx, x - w / 2, y - size / 2 - 6, w, size + 12, bg, 'rgba(238,242,255,0.25)');
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, x, y + 1);
}

function cone(ctx, x, y, angle, half, range, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, angle - half, angle + half);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function lightPool(ctx, x, y, r) {
  const g = ctx.createRadialGradient(x, y, 8, x, y, r);
  g.addColorStop(0, COLORS.lightPool);
  g.addColorStop(1, 'rgba(255,196,110,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// The Comet Diamond: 120 x 100 px of faceted cyan-white, with a soft
// glow. It is the biggest, brightest object in the room on purpose —
// it must still read as a diamond in the small contact-sheet thumbnail.
function drawDiamond(ctx, cx, cy, w, h, glow = true) {
  const hw = w / 2;
  const hh = h / 2;
  if (glow) {
    const g = ctx.createRadialGradient(cx, cy, 4, cx, cy, hw * 1.5);
    g.addColorStop(0, 'rgba(191,239,255,0.55)');
    g.addColorStop(1, 'rgba(191,239,255,0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(cx, cy, hw * 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
  const pts = [
    [cx - w * 0.41, cy - h * 0.42], [cx + w * 0.41, cy - h * 0.42],
    [cx + w * 0.5, cy], [cx, cy + h * 0.5], [cx - w * 0.5, cy],
  ];
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)));
  ctx.closePath();
  ctx.fillStyle = COLORS.diamond;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
  // Facets: a table line across the top and rays to the point.
  ctx.strokeStyle = 'rgba(255,255,255,0.9)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.41, cy - h * 0.42);
  ctx.lineTo(cx + w * 0.41, cy - h * 0.42);
  ctx.moveTo(cx - w * 0.18, cy - h * 0.42);
  ctx.lineTo(cx, cy + h * 0.5);
  ctx.moveTo(cx + w * 0.18, cy - h * 0.42);
  ctx.lineTo(cx, cy + h * 0.5);
  ctx.moveTo(cx, cy - h * 0.42);
  ctx.lineTo(cx, cy + h * 0.5);
  ctx.stroke();
  ctx.fillStyle = COLORS.diamondCore;
  ctx.beginPath();
  ctx.arc(cx - w * 0.1, cy - h * 0.12, 7, 0, Math.PI * 2);
  ctx.fill();
}

function drawVaultCase(ctx, room, state) {
  const c = room.vaultCase;
  if (!c) return;
  lightPool(ctx, c.x + c.w / 2, c.y + c.h / 2, 190);
  // Plinth under the case.
  ctx.fillStyle = '#3a2f22';
  ctx.fillRect(c.x - 20, c.y + c.h, c.w + 40, 18);
  ctx.fillStyle = COLORS.brass;
  ctx.fillRect(c.x - 20, c.y + c.h, c.w + 40, 4);
  // Brass frame, glass, then the diamond inside.
  ctx.fillStyle = 'rgba(160,210,235,0.10)';
  ctx.fillRect(c.x, c.y, c.w, c.h);
  ctx.strokeStyle = COLORS.brass;
  ctx.lineWidth = 6;
  ctx.strokeRect(c.x, c.y, c.w, c.h);
  ctx.strokeStyle = COLORS.brassLight;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(c.x + 8, c.y + 8, c.w - 16, c.h - 16);
  if (state.caseOpen) {
    // Lid swung open: the glass panel leans out to the right.
    ctx.fillStyle = 'rgba(160,210,235,0.16)';
    ctx.beginPath();
    ctx.moveTo(c.x + c.w, c.y);
    ctx.lineTo(c.x + c.w + 46, c.y + 26);
    ctx.lineTo(c.x + c.w + 46, c.y + c.h + 26);
    ctx.lineTo(c.x + c.w, c.y + c.h);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COLORS.brass;
    ctx.lineWidth = 3;
    ctx.stroke();
  }
  if (!state.player.hasDiamond) {
    drawDiamond(ctx, c.x + c.w / 2, c.y + c.h / 2, 120, 100);
  }
  // The lock: brass padlock on the case front.
  ctx.fillStyle = state.caseOpen ? '#7ee2a8' : COLORS.brass;
  ctx.beginPath();
  ctx.arc(c.x + c.w / 2, c.y + c.h - 6, 9, 0, Math.PI * 2);
  ctx.fill();
  label(ctx, 'COMET DIAMOND', c.x + c.w / 2, c.y - 18, 14, '#bfefff');
  if (state.caseOpen && state.resealFrames > 0) {
    const s = Math.ceil(state.resealFrames / 60);
    label(ctx, `RESEALS IN ${s}s`, c.x + c.w / 2, c.y + c.h + 44, 20, '#ff9f43', 'rgba(60,20,0,0.9)');
    const frac = state.resealFrames / 600;
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillRect(c.x + 20, c.y + c.h + 62, c.w - 40, 8);
    ctx.fillStyle = '#ff9f43';
    ctx.fillRect(c.x + 20, c.y + c.h + 62, (c.w - 40) * frac, 8);
  }
}

function drawTelescope(ctx, tel) {
  if (!tel) return;
  // Dome ribs in the background.
  ctx.strokeStyle = 'rgba(74,88,120,0.5)';
  ctx.lineWidth = 2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(476, -160, 300 + i * 46, 0.15 * Math.PI, 0.85 * Math.PI);
    ctx.stroke();
  }
  ctx.save();
  ctx.translate(tel.pierX, tel.pierY - 60);
  ctx.rotate(tel.angle);
  ctx.fillStyle = '#8a6d1f';
  ctx.fillRect(-20, -26, tel.len, 52);
  ctx.fillStyle = COLORS.brass;
  ctx.fillRect(-20, -26, tel.len, 16);
  ctx.fillStyle = COLORS.brassLight;
  for (const rx of [40, 130, 220]) ctx.fillRect(rx, -28, 10, 56);
  ctx.fillStyle = '#2c2110';
  ctx.fillRect(tel.len - 20, -30, 26, 60);
  ctx.restore();
  // Pier: a solid brass-and-stone mount the thief must walk around.
  ctx.fillStyle = '#4a3d24';
  ctx.beginPath();
  ctx.moveTo(tel.pierX - 34, tel.pierY + 30);
  ctx.lineTo(tel.pierX + 34, tel.pierY + 30);
  ctx.lineTo(tel.pierX + 20, tel.pierY - 60);
  ctx.lineTo(tel.pierX - 20, tel.pierY - 60);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = COLORS.brass;
  ctx.lineWidth = 2;
  ctx.stroke();
  label(ctx, 'GREAT TELESCOPE', tel.pierX, tel.pierY + 52, 12);
}

function drawBalconyAndVent(ctx, room) {
  const b = room.balcony;
  // Real balcony geometry: floorboards, a stair, and a railing with
  // posts along its open edge — the thief can walk up here.
  ctx.fillStyle = '#232c4a';
  ctx.fillRect(b.x, b.y, b.w, b.h);
  ctx.strokeStyle = 'rgba(238,242,255,0.28)';
  ctx.lineWidth = 1;
  for (let y = b.y + 12; y < b.y + b.h; y += 12) {
    ctx.beginPath(); ctx.moveTo(b.x, y); ctx.lineTo(b.x + b.w, y); ctx.stroke();
  }
  ctx.fillStyle = COLORS.brass;
  ctx.fillRect(b.x, b.y + b.h - 6, b.w, 5);
  for (let x = b.x + 8; x < b.x + b.w; x += 22) {
    ctx.fillRect(x, b.y + b.h - 26, 3, 22);
  }
  const s = room.stairs;
  ctx.fillStyle = '#2c3552';
  ctx.fillRect(s.x, s.y, s.w, s.h);
  ctx.strokeStyle = 'rgba(238,242,255,0.35)';
  for (let i = 1; i < 4; i++) {
    ctx.beginPath(); ctx.moveTo(s.x, s.y + (s.h / 4) * i); ctx.lineTo(s.x + s.w, s.y + (s.h / 4) * i); ctx.stroke();
  }
  label(ctx, 'BALCONY', b.x + 34, b.y + 32, 12, COLORS.text);
  // Vent: a slatted grille set into the lower wall, a real crawl route.
  const v = room.vent;
  ctx.fillStyle = '#0a0e1e';
  ctx.fillRect(v.x, v.y, v.w, v.h);
  ctx.strokeStyle = '#5a6a94';
  ctx.lineWidth = 2;
  ctx.strokeRect(v.x, v.y, v.w, v.h);
  ctx.strokeStyle = 'rgba(238,242,255,0.5)';
  ctx.lineWidth = 1.5;
  for (let x = v.x + 12; x < v.x + v.w - 6; x += 14) {
    ctx.beginPath(); ctx.moveTo(x, v.y + 4); ctx.lineTo(x, v.y + v.h - 4); ctx.stroke();
  }
  label(ctx, 'VENT', v.x + v.w / 2, v.y - 14, 11, COLORS.textDim);
}

function drawStarChart(ctx, chart) {
  ctx.fillStyle = COLORS.parchment;
  ctx.fillRect(chart.x, chart.y, chart.w, chart.h);
  ctx.strokeStyle = COLORS.brass;
  ctx.lineWidth = 4;
  ctx.strokeRect(chart.x, chart.y, chart.w, chart.h);
  ctx.fillStyle = '#3a2f16';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('STAR CHART', chart.x + 10, chart.y + 8);
  // A bright constellation, drawn as lines and star dots.
  const stars = [[40, 40], [90, 30], [140, 52], [190, 36], [220, 62], [120, 72], [170, 78]];
  ctx.strokeStyle = '#7a6420';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  stars.forEach(([sx, sy], i) => {
    const x = chart.x + sx;
    const y = chart.y + sy;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  });
  ctx.stroke();
  ctx.fillStyle = '#3a2f16';
  for (const [sx, sy] of stars) {
    ctx.beginPath();
    ctx.arc(chart.x + sx, chart.y + sy, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawGuard(ctx, g) {
  cone(ctx, g.x, g.y, g.angle, 0.62, GUARD_CONE_RANGE, COLORS.coneGuard, COLORS.coneGuardEdge);
  const flash = g.spottedFlash > 0;
  ctx.fillStyle = flash ? '#ff5a5a' : '#5a2e35';
  ctx.beginPath();
  ctx.arc(g.x, g.y, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = flash ? '#ffffff' : COLORS.brass;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = '#e8c766';
  ctx.beginPath();
  ctx.arc(g.x, g.y - 4, 11, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(g.name[0], g.x, g.y + 6);
  label(ctx, g.name, g.x, g.y - 34, 12, flash ? '#ff8a8a' : COLORS.text);
  if (g.suspicion > 5) {
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    ctx.fillRect(g.x - 22, g.y + 28, 44, 6);
    ctx.fillStyle = g.suspicion > 55 ? '#ff5a5a' : '#ffd166';
    ctx.fillRect(g.x - 22, g.y + 28, 44 * (g.suspicion / 100), 6);
  }
}

function drawCamera(ctx, cam) {
  if (cam.blind <= 0) {
    cone(ctx, cam.x, cam.y, cam.angle, 0.5, CAMERA_CONE_RANGE, COLORS.coneCamera, COLORS.coneCameraEdge);
  }
  ctx.fillStyle = '#3a2f16';
  ctx.beginPath();
  ctx.arc(cam.x, cam.y, 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.brass;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = cam.blind > 0 ? '#7ee2a8' : '#ff5a5a';
  ctx.beginPath();
  ctx.arc(cam.x, cam.y, 5, 0, Math.PI * 2);
  ctx.fill();
  // Label placement avoids the displays: a camera on the lower left
  // wall gets its label below-right of the dome, not above it, where
  // the CYGNUS panel sits; the right-wall camera keeps its label left.
  const lx = cam.x < 150 && cam.y > 300 ? cam.x + 50 : cam.x - 34;
  const ly = cam.x < 150 && cam.y > 300 ? cam.y + 40 : cam.y - 26;
  label(ctx, cam.id, lx, ly, 11, cam.blind > 0 ? '#7ee2a8' : '#ff8a8a');
}

function drawPlayer(ctx, p, hasDiamond) {
  // One label only: the YOU pill above the token. Nothing is written
  // inside the ring, so the token reads at any size.
  ctx.fillStyle = 'rgba(55,230,255,0.18)';
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r + 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.playerFill;
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.playerRing;
  ctx.lineWidth = 4;
  ctx.stroke();
  // Hood and mask: a dark cowl with a pale face slit.
  ctx.fillStyle = '#0e2a33';
  ctx.beginPath();
  ctx.arc(p.x, p.y - 4, 15, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#eef2ff';
  ctx.fillRect(p.x - 9, p.y - 6, 18, 7);
  ctx.fillStyle = '#0b3542';
  ctx.fillRect(p.x - 5, p.y - 4, 3, 3);
  ctx.fillRect(p.x + 2, p.y - 4, 3, 3);
  pill(ctx, p.x - 30, p.y - p.r - 34, 60, 22, 'rgba(8,20,30,0.92)', COLORS.playerRing);
  ctx.fillStyle = '#37e6ff';
  ctx.font = 'bold 14px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('YOU', p.x, p.y - p.r - 22);
  if (hasDiamond) {
    drawDiamond(ctx, p.x + 30, p.y - 26, 26, 22, false);
  }
}

function drawSidebar(ctx, state) {
  const x0 = SIDEBAR_X;
  ctx.fillStyle = COLORS.sidebar;
  ctx.fillRect(x0, 0, SIDEBAR_W, CANVAS_H);
  ctx.fillStyle = COLORS.sidebarEdge;
  ctx.fillRect(x0, 0, 2, CANVAS_H);
  let y = 26;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#bfefff';
  ctx.font = 'bold 24px system-ui, sans-serif';
  ctx.fillText('STARLIGHT VAULT', x0 + 18, y);
  y += 22;
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText('Steal the Comet Diamond. Get out alive.', x0 + 18, y);
  y += 30;
  const room = roomByIndex(state.roomIndex);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(`ROOM ${state.roomIndex + 1}/3 — ${room.name}`, x0 + 18, y);
  y += 20;
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '13px system-ui, sans-serif';
  ctx.fillText(room.subtitle, x0 + 18, y);
  y += 28;
  // Objective.
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('OBJECTIVE', x0 + 18, y);
  y += 18;
  ctx.fillStyle = COLORS.text;
  ctx.font = '13px system-ui, sans-serif';
  const obj = state.player.hasDiamond
    ? 'Diamond taken — ride the zipline out!'
    : state.caseOpen
      ? 'Case open — grab the Comet Diamond!'
      : 'Pick the lock on the glass case (10 coins).';
  ctx.fillText(obj, x0 + 18, y);
  y += 30;
  // Alarm meter: four named stages, the active one lit.
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('ALARM', x0 + 18, y);
  y += 10;
  const segW = (SIDEBAR_W - 36 - 9) / 4;
  ALARM_STAGES.forEach((stage, i) => {
    const sx = x0 + 18 + i * (segW + 3);
    ctx.fillStyle = i <= state.alarm ? ALARM_COLORS[stage] : 'rgba(255,255,255,0.14)';
    ctx.fillRect(sx, y, segW, 14);
    ctx.fillStyle = i === state.alarm ? ALARM_COLORS[stage] : COLORS.textDim;
    ctx.font = 'bold 10px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(stage, sx + segW / 2, y + 28);
    ctx.textAlign = 'left';
  });
  y += 48;
  // Loot and coins — the same numbers the playfield shows.
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText(`LOOT  ${state.lootTaken}/4 small  •  DIAMOND  ${state.player.hasDiamond ? 'YES' : 'NO'}`, x0 + 18, y);
  y += 22;
  ctx.fillStyle = '#ffd166';
  ctx.fillText(`COINS  ${state.coins}`, x0 + 18, y);
  y += 28;
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('TOOLS — press 1 / 2 / 3', x0 + 18, y);
  y += 18;
  for (const t of TOOLS) {
    const afford = state.coins >= t.cost;
    ctx.fillStyle = afford ? COLORS.text : COLORS.textDim;
    ctx.font = 'bold 13px system-ui, sans-serif';
    ctx.fillText(`${t.key}  ${t.name} — ${t.cost} coins`, x0 + 18, y);
    y += 16;
    ctx.fillStyle = COLORS.textDim;
    ctx.font = '12px system-ui, sans-serif';
    ctx.fillText(t.blurb, x0 + 38, y);
    y += 20;
  }
  y += 4;
  // Star map: a miniature of the current room, thief and guards as dots.
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('STAR MAP', x0 + 18, y);
  y += 8;
  const mw = SIDEBAR_W - 36;
  const mh = 76;
  const mx = x0 + 18;
  const my = y;
  ctx.fillStyle = '#101830';
  ctx.fillRect(mx, my, mw, mh);
  ctx.strokeStyle = COLORS.wallEdge;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(mx, my, mw, mh);
  const sx = (px) => mx + (px / FIELD_W) * mw;
  const sy = (py) => my + (py / FIELD_H) * mh;
  if (room.vaultCase) {
    ctx.fillStyle = '#bfefff';
    ctx.fillRect(sx(room.vaultCase.x) - 4, sy(room.vaultCase.y) - 4, 8, 8);
  }
  if (room.zipline) {
    ctx.strokeStyle = COLORS.brass;
    ctx.beginPath();
    ctx.moveTo(sx(room.zipline.ax), sy(room.zipline.ay));
    ctx.lineTo(sx(room.zipline.bx), sy(room.zipline.by));
    ctx.stroke();
  }
  for (const g of state.guards) {
    ctx.fillStyle = '#ff9f43';
    ctx.beginPath();
    ctx.arc(sx(g.x), sy(g.y), 4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = '#37e6ff';
  ctx.beginPath();
  ctx.arc(sx(state.player.x), sy(state.player.y), 5, 0, Math.PI * 2);
  ctx.fill();
  y = my + mh + 24;
  // Legend: what every cone and mark means, in plain words.
  ctx.fillStyle = '#ffd166';
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.fillText('LEGEND', x0 + 18, y);
  y += 18;
  ctx.font = '13px system-ui, sans-serif';
  const legend = [
    ['#ffb042', 'Amber cone — guard is watching'],
    ['#ff5c5c', 'Red cone — camera is sweeping'],
    ['#37e6ff', 'Cyan ring — you, the thief'],
    ['#bfefff', 'Bright gem — the Comet Diamond'],
    ['#c9a227', 'Brass line — zipline out'],
  ];
  for (const [color, text] of legend) {
    ctx.fillStyle = color;
    ctx.fillRect(x0 + 18, y - 10, 12, 12);
    ctx.fillStyle = COLORS.text;
    ctx.fillText(text, x0 + 38, y);
    y += 18;
  }
  y += 6;
  ctx.fillStyle = COLORS.textDim;
  ctx.font = '12px system-ui, sans-serif';
  ctx.fillText('WASD / arrows move • Shift sneak • E action', x0 + 18, y);
  y += 16;
  ctx.fillText('1 lockpick  2 smoke  3 lens cap  •  M mute  •  R restart', x0 + 18, y);
}

export function drawGame(ctx, state) {
  const room = roomByIndex(state.roomIndex);
  // Floor: dark marble with a checker of two near-black blues.
  ctx.fillStyle = COLORS.floor;
  ctx.fillRect(0, 0, FIELD_W, FIELD_H);
  for (let ty = 0; ty < 10; ty++) {
    for (let tx = 0; tx < 12; tx++) {
      if ((tx + ty) % 2 === 0) {
        ctx.fillStyle = COLORS.floorAlt;
        ctx.fillRect(tx * 80, ty * 80, 80, 80);
      }
    }
  }
  ctx.strokeStyle = 'rgba(74,88,120,0.35)';
  ctx.lineWidth = 1;
  for (let tx = 0; tx <= 12; tx++) {
    ctx.beginPath(); ctx.moveTo(tx * 80, 0); ctx.lineTo(tx * 80, FIELD_H); ctx.stroke();
  }
  for (const d of starDisplays(state.roomIndex)) {
    lightPool(ctx, d.x + d.w / 2, d.y + d.h / 2, 110);
  }
  // Displays: framed star panels with dots, never a bare green slab.
  for (const d of starDisplays(state.roomIndex)) {
    ctx.fillStyle = '#1b2440';
    ctx.fillRect(d.x, d.y, d.w, d.h);
    ctx.strokeStyle = COLORS.brass;
    ctx.lineWidth = 3;
    ctx.strokeRect(d.x, d.y, d.w, d.h);
    ctx.fillStyle = '#bfefff';
    for (let i = 0; i < 6; i++) {
      const sx = d.x + 12 + ((i * 29) % (d.w - 24));
      const sy = d.y + 14 + ((i * 17) % (d.h - 28));
      ctx.beginPath(); ctx.arc(sx, sy, 2.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = COLORS.text;
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(d.title, d.x + d.w / 2, d.y + d.h - 8);
  }
  drawStarChart(ctx, room.starChart);
  // Star globes: brass-ringed spheres on stands.
  for (const g of room.starGlobes) {
    ctx.fillStyle = '#1b2440';
    ctx.fillRect(g.x - 4, g.y + g.r - 4, 8, 16);
    ctx.fillStyle = '#274b7a';
    ctx.beginPath(); ctx.arc(g.x, g.y, g.r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = COLORS.brass;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.strokeStyle = 'rgba(191,239,255,0.7)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.arc(g.x, g.y, g.r - 5, 0.4, 2.6); ctx.stroke();
  }
  label(ctx, 'STAR GLOBES', 230, 168, 12, COLORS.text);
  drawBalconyAndVent(ctx, room);
  drawTelescope(ctx, room.telescope);
  // The zipline cable: a straight brass line with an anchor.
  // Straight on purpose — a sagging cable dipped onto the glass case.
  if (room.zipline) {
    const z = room.zipline;
    ctx.strokeStyle = COLORS.brass;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(z.ax, z.ay);
    ctx.lineTo(z.bx, z.by);
    ctx.stroke();
    ctx.fillStyle = COLORS.brassLight;
    ctx.beginPath(); ctx.arc(z.ax, z.ay, 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#3a2f16';
    ctx.beginPath(); ctx.arc(z.bx, z.by, 7, 0, Math.PI * 2); ctx.fill();
  }
  // Small loot: coin pouches that have not been taken yet.
  for (const spot of room.lootSpots) {
    if (spot.taken) continue;
    ctx.fillStyle = '#ffd166';
    ctx.beginPath(); ctx.arc(spot.x, spot.y, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#7a5a10';
    ctx.font = 'bold 12px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('$', spot.x, spot.y + 1);
  }
  // Exit door, with its label drawn whole and clear of the top edge.
  const ex = room.exit;
  ctx.fillStyle = '#1b2440';
  ctx.fillRect(ex.x, ex.y, ex.w, ex.h);
  ctx.strokeStyle = COLORS.green;
  ctx.lineWidth = 3;
  ctx.strokeRect(ex.x, ex.y, ex.w, ex.h);
  ctx.fillStyle = COLORS.green;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EXIT', ex.x + ex.w / 2, ex.y + ex.h / 2);
  label(ctx, ex.label, 830, ex.y - 16, 12, COLORS.green);
  if (state.roomIndex === 1) {
    // The way back is signed in full, clear of the toast pill:
    // EXIT — TELESCOPE DOME.
    label(ctx, 'EXIT — TELESCOPE DOME', 430, 745, 15, COLORS.green);
  }
  drawVaultCase(ctx, room, state);
  // Smoke puff, if one is burning.
  if (state.smoke && state.smoke.frames > 0) {
    ctx.fillStyle = 'rgba(200,200,210,0.35)';
    ctx.beginPath(); ctx.arc(state.smoke.x, state.smoke.y, 90, 0, Math.PI * 2); ctx.fill();
  }
  for (const g of state.guards) drawGuard(ctx, g);
  for (const c of state.cameras) drawCamera(ctx, c);
  // The thief on the zipline rides the cable, diamond in hand.
  if (state.player.onZipline && room.zipline) {
    const z = room.zipline;
    const t = state.player.ziplineT;
    const px = z.ax + (z.bx - z.ax) * t;
    const py = z.ay + (z.by - z.ay) * t + 6;
    drawPlayer(ctx, { ...state.player, x: px, y: py }, state.player.hasDiamond);
  } else {
    drawPlayer(ctx, state.player, state.player.hasDiamond);
  }
  // Walls on top of the floor edge, so nothing is clipped by the frame.
  ctx.fillStyle = COLORS.wall;
  ctx.fillRect(0, 0, FIELD_W, 14);
  ctx.fillRect(0, FIELD_H - 14, FIELD_W, 14);
  ctx.fillRect(0, 0, 14, FIELD_H);
  ctx.fillRect(FIELD_W - 14, 0, 14, FIELD_H);
  ctx.strokeStyle = COLORS.wallEdge;
  ctx.lineWidth = 2;
  ctx.strokeRect(7, 7, FIELD_W - 14, FIELD_H - 14);
  // Toast: the latest real event, top-centre of the playfield.
  if (state.toast) {
    label(ctx, state.toast, 400, 30, 14, '#ffe9a8', 'rgba(40,28,0,0.9)');
  }
  if (state.banner) {
    label(ctx, state.banner, 700, 62, 18, '#ffd166', 'rgba(60,20,0,0.9)');
  }
  if (state.player.hasDiamond && state.roomIndex === 2 && !state.outcome) {
    label(ctx, 'E — RIDE THE ZIPLINE OUT', 700, 255, 16, '#4ade80', 'rgba(0,40,16,0.92)');
  }
  // Outcome overlays.
  if (state.outcome === 'caught') {
    ctx.fillStyle = 'rgba(60,0,0,0.72)';
    ctx.fillRect(0, 0, FIELD_W, FIELD_H);
    ctx.fillStyle = '#ff5a5a';
    ctx.font = 'bold 64px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CAUGHT!', FIELD_W / 2, FIELD_H / 2 - 20);
    ctx.fillStyle = COLORS.text;
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText('MARA saw you in the cone. Press R to try again.', FIELD_W / 2, FIELD_H / 2 + 24);
  }
  if (state.outcome === 'win') {
    ctx.fillStyle = 'rgba(0,30,50,0.72)';
    ctx.fillRect(0, 0, FIELD_W, FIELD_H);
    drawDiamond(ctx, FIELD_W / 2, FIELD_H / 2 - 90, 110, 92);
    ctx.fillStyle = '#bfefff';
    ctx.font = 'bold 44px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CLEAN GETAWAY — YOU WIN', FIELD_W / 2, FIELD_H / 2 + 30);
    ctx.fillStyle = COLORS.text;
    ctx.font = '20px system-ui, sans-serif';
    ctx.fillText(`The Comet Diamond is yours. Coins left: ${state.coins} • Loot ${state.lootTaken}/4`, FIELD_W / 2, FIELD_H / 2 + 66);
  }
  // Footer: live timer and spotted count, ticking every frame.
  // Short and centred, so it never runs over the vent grille.
  const total = state.timeLeft;
  const mm = String(Math.floor(total / 60)).padStart(2, '0');
  const ss = String(total % 60).padStart(2, '0');
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 13px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`TIME ${mm}:${ss}   •   SPOTTED ${state.spotted}   •   ROOM ${state.roomIndex + 1}/3`, FIELD_W / 2, FIELD_H - 16);
  drawSidebar(ctx, state);
}
