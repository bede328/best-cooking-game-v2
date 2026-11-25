// game/src/render.js — menggambar seluruh dapur di kanvas 1280x720:
// papan pesanan, pelanggan, 8 bahan, talenan, wajan, panci, Bu Sari,
// 3 piring rakit, strip resep, nampan tangan, judul dan layar menang.
import {
  CUSTOMERS, H, INGREDIENTS, LAYOUT, RECIPES, W,
  binRect, customerRect, ingredient, orderRect, plateRect, recipe,
  recipeChipRect, serveRect,
} from './config.js';
import { orderForPlate } from './recipes.js';

const CREAM = '#fff6e3';
const WOOD = '#8a5a2b';
const WOOD_DARK = '#6e4420';
const TILE = '#f3e2c2';

function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function text(ctx, s, x, y, size, color, weight = 'bold', align = 'left') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px "Trebuchet MS", Verdana, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(s, x, y);
}

function bar(ctx, x, y, w, h, frac, good, bad) {
  ctx.fillStyle = '#3a2a18';
  rr(ctx, x, y, w, h, h / 2);
  ctx.fill();
  const f = Math.max(0, Math.min(1, frac));
  ctx.fillStyle = f > 0.5 ? good : f > 0.25 ? '#e8a020' : bad;
  if (f > 0.02) {
    rr(ctx, x + 2, y + 2, (w - 4) * f, h - 4, (h - 4) / 2);
    ctx.fill();
  }
}

function mmss(sec) {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

// --- Gambar makanan: tiap bahan digambar berlapis supaya terlihat enak ---
export function drawFood(ctx, ingId, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  if (ingId === 'nasi') {
    ctx.fillStyle = '#f7f1dc';
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8d9a8';
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.arc(-r * 0.5 + i * r * 0.25, -r * 0.15 + (i % 2) * r * 0.2, r * 0.09, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (ingId === 'mie') {
    ctx.strokeStyle = '#f2c14e';
    ctx.lineWidth = r * 0.22;
    ctx.lineCap = 'round';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(0, (i - 1.5) * r * 0.28, r * 0.75, 0.15 * Math.PI, 0.85 * Math.PI);
      ctx.stroke();
    }
    ctx.strokeStyle = '#d99a1f';
    ctx.lineWidth = r * 0.1;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
    ctx.stroke();
  } else if (ingId === 'ayam') {
    ctx.fillStyle = '#c67b4e';
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.9, r * 0.7, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#a85a30';
    ctx.beginPath();
    ctx.ellipse(-r * 0.2, -r * 0.1, r * 0.45, r * 0.3, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f3e2c2';
    ctx.lineWidth = r * 0.18;
    ctx.beginPath();
    ctx.moveTo(r * 0.7, r * 0.3);
    ctx.lineTo(r * 1.05, r * 0.6);
    ctx.stroke();
  } else if (ingId === 'telur') {
    ctx.fillStyle = '#fffdf5';
    ctx.beginPath();
    ctx.ellipse(0, 0, r, r * 0.75, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffb703';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffdf6b';
    ctx.beginPath();
    ctx.arc(-r * 0.12, -r * 0.12, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
  } else if (ingId === 'sayur') {
    ctx.fillStyle = '#7fb069';
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.rotate((i - 1) * 0.7);
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.45, r * 0.32, r * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.strokeStyle = '#2e5d23';
    ctx.lineWidth = r * 0.08;
    ctx.beginPath();
    ctx.moveTo(0, r * 0.7);
    ctx.lineTo(0, -r * 0.2);
    ctx.stroke();
  } else if (ingId === 'sambal') {
    ctx.fillStyle = '#d62828';
    for (const [dx, dy, s] of [[-0.4, 0.2, 0.5], [0.35, 0.25, 0.45], [0, -0.35, 0.55]]) {
      ctx.beginPath();
      ctx.arc(dx * r, dy * r, s * r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = '#ff6b5e';
    ctx.beginPath();
    ctx.arc(-r * 0.15, -r * 0.3, r * 0.18, 0, Math.PI * 2);
    ctx.fill();
  } else if (ingId === 'tahu') {
    ctx.fillStyle = '#e8d5a8';
    ctx.strokeStyle = '#b99b5e';
    ctx.lineWidth = r * 0.08;
    for (const [dx, dy] of [[-0.35, -0.2], [0.35, -0.15], [0, 0.35]]) {
      ctx.fillRect(dx * r - r * 0.32, dy * r - r * 0.28, r * 0.64, r * 0.56);
      ctx.strokeRect(dx * r - r * 0.32, dy * r - r * 0.28, r * 0.64, r * 0.56);
    }
  } else if (ingId === 'esteh') {
    ctx.fillStyle = 'rgba(220,240,255,0.9)';
    ctx.fillRect(-r * 0.55, -r * 0.8, r * 1.1, r * 1.6);
    ctx.fillStyle = '#c96f2e';
    ctx.fillRect(-r * 0.45, -r * 0.35, r * 0.9, r * 1.05);
    ctx.fillStyle = '#fff';
    ctx.fillRect(-r * 0.3, -r * 0.6, r * 0.3, r * 0.3);
    ctx.fillRect(r * 0.1, -r * 0.2, r * 0.28, r * 0.28);
    ctx.strokeStyle = '#e33';
    ctx.lineWidth = r * 0.12;
    ctx.beginPath();
    ctx.moveTo(r * 0.2, -r * 0.8);
    ctx.lineTo(r * 0.45, -r * 1.15);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFace(ctx, x, y, r, skin, shirt, mood) {
  ctx.fillStyle = shirt;
  ctx.beginPath();
  ctx.arc(x, y + r * 1.15, r * 0.95, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2b1a0e';
  const eyeY = y - r * 0.15;
  if (mood === 'angry') {
    ctx.strokeStyle = '#2b1a0e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.55, eyeY - r * 0.35);
    ctx.lineTo(x - r * 0.15, eyeY - r * 0.1);
    ctx.moveTo(x + r * 0.55, eyeY - r * 0.35);
    ctx.lineTo(x + r * 0.15, eyeY - r * 0.1);
    ctx.stroke();
  }
  ctx.beginPath();
  ctx.arc(x - r * 0.35, eyeY, r * 0.09, 0, Math.PI * 2);
  ctx.arc(x + r * 0.35, eyeY, r * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2b1a0e';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  if (mood === 'joy' || mood === 'happy') {
    ctx.arc(x, y + r * 0.25, r * 0.4, 0.15 * Math.PI, 0.85 * Math.PI);
  } else if (mood === 'angry') {
    ctx.arc(x, y + r * 0.75, r * 0.35, 1.15 * Math.PI, 1.85 * Math.PI);
  } else if (mood === 'worried') {
    ctx.arc(x, y + r * 0.55, r * 0.25, 1.1 * Math.PI, 1.9 * Math.PI);
  } else {
    ctx.moveTo(x - r * 0.25, y + r * 0.45);
    ctx.lineTo(x + r * 0.25, y + r * 0.45);
  }
  ctx.stroke();
  if (mood === 'angry') {
    ctx.strokeStyle = '#c0392b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(x - r * 0.7, y - r * 0.75);
    ctx.lineTo(x - r * 0.3, y - r * 0.55);
    ctx.moveTo(x + r * 0.7, y - r * 0.75);
    ctx.lineTo(x + r * 0.3, y - r * 0.55);
    ctx.stroke();
  }
}

function drawSteam(ctx, x, y, t) {
  ctx.save();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  for (let i = 0; i < 3; i++) {
    const ph = t * 1.6 + i * 2.1;
    const yy = y - ((ph % 1) * 34);
    const xx = x + (i - 1) * 14 + Math.sin(ph * 3) * 5;
    ctx.globalAlpha = 0.7 * (1 - (ph % 1));
    ctx.beginPath();
    ctx.moveTo(xx, yy + 10);
    ctx.quadraticCurveTo(xx + 6, yy, xx - 2, yy - 10);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFlame(ctx, x, y, t) {
  for (let i = 0; i < 5; i++) {
    const ph = (t * 3 + i * 0.7) % 1;
    const h = 14 + ph * 16;
    const w = 12 - ph * 4;
    ctx.fillStyle = i % 2 ? `rgba(255,${140 + Math.floor(ph * 60)},20,0.9)` : 'rgba(255,200,40,0.9)';
    ctx.beginPath();
    ctx.ellipse(x + (i - 2) * 14, y - h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function render(ctx, state) {
  const t = state.time;
  // Dinding + lantai warung.
  ctx.fillStyle = '#f7e8c8';
  ctx.fillRect(0, 0, W, 470);
  ctx.fillStyle = '#e8c98f';
  ctx.fillRect(0, 470, W, 250);
  ctx.fillStyle = '#d9b380';
  for (let i = 0; i < 16; i++) {
    ctx.fillRect(i * 80, 470, 2, 250);
    ctx.fillRect(0, 470 + (i % 4) * 62, W, 2);
  }
  ctx.fillStyle = '#c94f2e';
  ctx.fillRect(0, 58, W, 6);
  ctx.fillStyle = '#f3e2c2';
  ctx.fillRect(0, 0, W, 58);

  if (state.screen === 'title') { drawTitle(ctx, state); return; }
  if (state.screen === 'win') { drawWin(ctx, state); drawChrome(ctx, state); return; }

  drawChrome(ctx, state);
  drawBoard(ctx, state);
  drawCustomers(ctx, state);
  drawBins(ctx, state);
  drawStations(ctx, state, t);
  drawPlates(ctx, state, t);
  drawRecipes(ctx, state);
  drawHand(ctx, state);
  drawFooter(ctx, state);
  drawFloaters(ctx, state);
  if (state.flash) {
    ctx.globalAlpha = Math.max(0, 1 - state.flash.t / 1.6);
    text(ctx, state.flash.text, W / 2, 660, 30, '#7a1010', 'bold', 'center');
    ctx.globalAlpha = 1;
  }
  for (const p of state.particles) {
    ctx.globalAlpha = 1 - p.t / p.life;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawChrome(ctx, state) {
  const h = LAYOUT.header;
  text(ctx, 'SAMBAL RUSH 2', 20, 38, 30, '#a11d1d', 'bold');
  text(ctx, 'Warung Bu Sari', 310, 36, 16, '#6e4420');
  // Timer shift besar di tengah.
  const low = state.shiftLeft < 30;
  ctx.fillStyle = low ? '#a11d1d' : '#2b1a0e';
  rr(ctx, 520, 8, 240, 42, 10);
  ctx.fill();
  text(ctx, `SHIFT ${mmss(state.shiftLeft)}`, 640, 38, 28, low ? '#ffd94d' : '#fff6e3', 'bold', 'center');
  // Skor, kombo, hati, level.
  text(ctx, `SKOR ${state.score}`, 800, 36, 22, '#2b1a0e', 'bold');
  text(ctx, `KOMBO x${state.combo}`, 940, 36, 22, state.combo >= 2 ? '#c96f00' : '#8a7a4a', 'bold');
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < state.hearts ? '#d62828' : '#d9c9a8';
    ctx.beginPath();
    ctx.arc(1075 + i * 30, 28, 11, 0, Math.PI * 2);
    ctx.fill();
  }
  text(ctx, `LV ${state.level}`, 1180, 36, 22, '#2b1a0e', 'bold');
}

function drawBoard(ctx, state) {
  const b = LAYOUT.board;
  ctx.fillStyle = '#5a3a1a';
  rr(ctx, b.x, b.y, b.w, b.h, 12);
  ctx.fill();
  ctx.fillStyle = '#f7e8c8';
  rr(ctx, b.x + 4, b.y + 4, b.w - 8, b.h - 8, 9);
  ctx.fill();
  text(ctx, 'PAPAN PESANAN', b.x + b.w / 2, b.y + 30, 20, '#7a1010', 'bold', 'center');
  for (let i = 0; i < 4; i++) {
    const r = orderRect(i);
    const o = state.orders[i];
    ctx.fillStyle = o ? '#fff' : '#efe3c8';
    rr(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.fill();
    ctx.strokeStyle = o ? (o.left / o.total < 0.25 ? '#d62828' : '#c9a86a') : '#d9c9a8';
    ctx.lineWidth = 2;
    rr(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.stroke();
    if (!o) {
      text(ctx, '— kosong —', r.x + r.w / 2, r.y + 45, 16, '#a08a68', 'bold', 'center');
      continue;
    }
    const rp = recipe(o.recipeId);
    drawFace(ctx, r.x + 34, r.y + 26, 17, o.customer.skin, o.customer.shirt,
      o.left / o.total < 0.25 ? 'angry' : o.left / o.total < 0.5 ? 'worried' : 'happy');
    text(ctx, rp.name, r.x + 60, r.y + 26, 19, '#2b1a0e', 'bold');
    text(ctx, `${Math.ceil(o.left)} dtk`, r.x + r.w - 10, r.y + 26, 17, o.left / o.total < 0.25 ? '#d62828' : '#6e4420', 'bold', 'right');
    // Ikon bahan resep + countdown bar.
    rp.items.forEach((ing, j) => drawFood(ctx, ing, r.x + 76 + j * 34, r.y + 54, 13));
    bar(ctx, r.x + 8, r.y + 68, r.w - 16, 7, o.left / o.total, '#2e9e4f', '#d62828');
  }
}

function drawCustomers(ctx, state) {
  const c = LAYOUT.customers;
  ctx.fillStyle = '#2e6f9e';
  rr(ctx, c.x, c.y, c.w, c.h, 12);
  ctx.fill();
  ctx.fillStyle = '#e8f2f7';
  rr(ctx, c.x + 4, c.y + 4, c.w - 8, c.h - 8, 9);
  ctx.fill();
  text(ctx, 'PELANGGAN MENUNGGU', c.x + c.w / 2, c.y + 30, 20, '#1d4a6b', 'bold', 'center');
  for (let i = 0; i < 4; i++) {
    const r = customerRect(i);
    const cu = state.customers[i];
    ctx.fillStyle = '#fff';
    rr(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.fill();
    ctx.strokeStyle = '#b9d2e0';
    ctx.lineWidth = 2;
    rr(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.stroke();
    if (!cu) continue;
    drawFace(ctx, r.x + 36, r.y + 28, 20, cu.skin, cu.shirt, cu.joyT > 0 ? 'joy' : cu.mood);
    text(ctx, cu.name, r.x + 66, r.y + 30, 19, '#2b1a0e', 'bold');
    const order = state.orders.find((o) => o.slot === i);
    text(ctx, cu.joyT > 0 ? 'Senang! Terima kasih!' : order ? `Menunggu ${recipe(order.recipeId).name}` : 'Belum pesan',
      r.x + 66, r.y + 56, 15, cu.joyT > 0 ? '#1e7a34' : '#6e4420');
    if (order) bar(ctx, r.x + 66, r.y + 64, r.w - 76, 7, order.left / order.total, '#2e9e4f', '#d62828');
  }
}

function drawBins(ctx, state) {
  const b = LAYOUT.bins;
  ctx.fillStyle = WOOD;
  rr(ctx, b.x - 6, b.y - 6, b.w + 12, b.h + 12, 12);
  ctx.fill();
  INGREDIENTS.forEach((ing, i) => {
    const r = binRect(i);
    const held = state.hand && state.hand.ing === ing.id;
    ctx.fillStyle = held ? '#ffe9a8' : CREAM;
    rr(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.fill();
    ctx.strokeStyle = held ? '#e8a020' : '#c9a86a';
    ctx.lineWidth = held ? 3 : 2;
    rr(ctx, r.x, r.y, r.w, r.h, 8);
    ctx.stroke();
    drawFood(ctx, ing.id, r.x + r.w / 2, r.y + 30, 17);
    text(ctx, ing.name, r.x + r.w / 2, r.y + 58, 14, '#2b1a0e', 'bold', 'center');
    text(ctx, ing.hint, r.x + r.w / 2, r.y + 76, 11, '#8a6d2f', 'bold', 'center');
    text(ctx, String(i + 1), r.x + 8, r.y + 16, 13, '#a08a68', 'bold');
  });
}

function drawStations(ctx, state, t) {
  // Talenan.
  const bs = LAYOUT.boardStation;
  ctx.fillStyle = WOOD_DARK;
  rr(ctx, bs.x, bs.y, bs.w, bs.h, 10);
  ctx.fill();
  text(ctx, 'TALENAN', bs.x + bs.w / 2, bs.y + 22, 16, '#ffe9a8', 'bold', 'center');
  ctx.fillStyle = '#e8c98f';
  rr(ctx, bs.x + 14, bs.y + 34, bs.w - 28, 84, 8);
  ctx.fill();
  if (state.board) {
    const ing = ingredient(state.board.item.ing);
    drawFood(ctx, state.board.item.ing, bs.x + bs.w / 2, bs.y + 72, 22);
    bar(ctx, bs.x + 20, bs.y + 126, bs.w - 40, 10, state.board.chops / ing.chop, '#2e9e4f', '#d62828');
    text(ctx, `KETOK ${state.board.chops}/${ing.chop}`, bs.x + bs.w / 2, bs.y + 146, 13, '#ffe9a8', 'bold', 'center');
    // Pisau.
    ctx.save();
    ctx.translate(bs.x + bs.w - 30, bs.y + 60);
    ctx.rotate(-0.5 + Math.sin(t * 9) * 0.08);
    ctx.fillStyle = '#d9d9d9';
    ctx.fillRect(-4, -26, 8, 40);
    ctx.fillStyle = '#5a3a1a';
    ctx.fillRect(-4, 12, 8, 14);
    ctx.restore();
  } else {
    text(ctx, 'Taruh bahan', bs.x + bs.w / 2, bs.y + 76, 14, '#a8875e', 'bold', 'center');
    text(ctx, 'yg perlu dipotong', bs.x + bs.w / 2, bs.y + 96, 13, '#a8875e', 'bold', 'center');
  }

  // Wajan + kompor.
  const ws = LAYOUT.wokStation;
  ctx.fillStyle = '#3a2a18';
  rr(ctx, ws.x, ws.y, ws.w, ws.h, 10);
  ctx.fill();
  text(ctx, 'WAJAN', ws.x + ws.w / 2, ws.y + 22, 16, '#ffe9a8', 'bold', 'center');
  drawFlame(ctx, ws.x + ws.w / 2, ws.y + 122, t);
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.ellipse(ws.x + ws.w / 2, ws.y + 92, 58, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#444';
  ctx.beginPath();
  ctx.ellipse(ws.x + ws.w / 2, ws.y + 90, 52, 16, 0, 0, Math.PI * 2);
  ctx.fill();
  if (state.wok) {
    if (state.wok.burnt) {
      drawFood(ctx, state.wok.item.ing, ws.x + ws.w / 2, ws.y + 88, 20);
      ctx.fillStyle = 'rgba(20,10,0,0.55)';
      ctx.beginPath();
      ctx.ellipse(ws.x + ws.w / 2, ws.y + 88, 26, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      text(ctx, 'GOSONG! Klik utk buang', ws.x + ws.w / 2, ws.y + 146, 13, '#ff8a7a', 'bold', 'center');
    } else {
      drawFood(ctx, state.wok.item.ing, ws.x + ws.w / 2, ws.y + 88, 20);
      drawSteam(ctx, ws.x + ws.w / 2, ws.y + 62, t);
      bar(ctx, ws.x + 16, ws.y + 124, ws.w - 32, 10, state.wok.t / state.wok.total, '#e8a020', '#d62828');
      text(ctx, state.wok.t >= state.wok.total ? 'MATANG! Klik utk ambil' : 'Menggoreng…', ws.x + ws.w / 2, ws.y + 142, 13, '#ffe9a8', 'bold', 'center');
    }
  } else {
    text(ctx, 'Taruh bahan', ws.x + ws.w / 2, ws.y + 76, 14, '#a8875e', 'bold', 'center');
    text(ctx, 'yg perlu digoreng', ws.x + ws.w / 2, ws.y + 96, 13, '#a8875e', 'bold', 'center');
  }

  // Panci rebus.
  const ps = LAYOUT.potStation;
  ctx.fillStyle = '#1d4a6b';
  rr(ctx, ps.x, ps.y, ps.w, ps.h, 10);
  ctx.fill();
  text(ctx, 'PANCI REBUS', ps.x + ps.w / 2, ps.y + 22, 16, '#cfe8f7', 'bold', 'center');
  ctx.fillStyle = '#8a97a3';
  ctx.beginPath();
  ctx.ellipse(ps.x + ps.w / 2, ps.y + 92, 52, 22, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#bfe3f5';
  ctx.beginPath();
  ctx.ellipse(ps.x + ps.w / 2, ps.y + 88, 44, 15, 0, 0, Math.PI * 2);
  ctx.fill();
  if (state.pot) {
    if (state.pot.burnt) {
      text(ctx, 'GOSONG! Klik utk buang', ps.x + ps.w / 2, ps.y + 146, 13, '#ffb0a8', 'bold', 'center');
    } else {
      drawFood(ctx, state.pot.item.ing, ps.x + ps.w / 2, ps.y + 86, 18);
      drawSteam(ctx, ps.x + ps.w / 2, ps.y + 60, t + 1);
      bar(ctx, ps.x + 16, ps.y + 124, ps.w - 32, 10, state.pot.t / state.pot.total, '#2e9e4f', '#d62828');
      text(ctx, state.pot.t >= state.pot.total ? 'MATANG! Klik utk ambil' : 'Merebus…', ps.x + ps.w / 2, ps.y + 142, 13, '#cfe8f7', 'bold', 'center');
    }
  } else {
    text(ctx, 'Taruh MIE', ps.x + ps.w / 2, ps.y + 76, 14, '#9db8c9', 'bold', 'center');
    text(ctx, 'utk direbus', ps.x + ps.w / 2, ps.y + 96, 13, '#9db8c9', 'bold', 'center');
  }

  // Bu Sari di kompor.
  const ch = LAYOUT.chef;
  ctx.fillStyle = '#7a1010';
  rr(ctx, ch.x, ch.y, ch.w, ch.h, 10);
  ctx.fill();
  text(ctx, 'BU SARI', ch.x + ch.w / 2, ch.y + 22, 16, '#ffe9a8', 'bold', 'center');
  ctx.fillStyle = '#e8b98a';
  ctx.beginPath();
  ctx.arc(ch.x + ch.w / 2, ch.y + 62, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3a2a18';
  ctx.beginPath();
  ctx.arc(ch.x + ch.w / 2, ch.y + 46, 24, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#3a2a18';
  ctx.beginPath();
  ctx.arc(ch.x + ch.w / 2, ch.y + 40, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#2b1a0e';
  ctx.beginPath();
  ctx.arc(ch.x + ch.w / 2 - 9, ch.y + 62, 2.5, 0, Math.PI * 2);
  ctx.arc(ch.x + ch.w / 2 + 9, ch.y + 62, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#2b1a0e';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(ch.x + ch.w / 2, ch.y + 70, 7, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
  ctx.fillStyle = '#f7f1dc';
  ctx.beginPath();
  ctx.arc(ch.x + ch.w / 2, ch.y + 118, 34, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#c94f2e';
  ctx.fillRect(ch.x + ch.w / 2 - 34, ch.y + 112, 68, 8);
  text(ctx, '“Ayo, cepat!”', ch.x + ch.w / 2, ch.y + 142, 13, '#ffe9a8', 'bold', 'center');
}

function drawPlates(ctx, state, t) {
  const p = LAYOUT.plates;
  ctx.fillStyle = WOOD;
  rr(ctx, p.x - 6, p.y - 6, p.w + 12, p.h + 12, 12);
  ctx.fill();
  for (let i = 0; i < 3; i++) {
    const r = plateRect(i);
    const plate = state.plates[i];
    ctx.fillStyle = '#fdf6e3';
    rr(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.fill();
    ctx.strokeStyle = '#c9a86a';
    ctx.lineWidth = 2;
    rr(ctx, r.x, r.y, r.w, r.h, 10);
    ctx.stroke();
    text(ctx, `PIRING ${i + 1}`, r.x + 12, r.y + 22, 15, '#6e4420', 'bold');
    // Piring bundar + isi berlapis.
    const cx = r.x + r.w / 2;
    const cy = r.y + 66;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx, cy, 48, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#d9c9a8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(cx, cy, 48, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#f3e2c2';
    ctx.beginPath();
    ctx.arc(cx, cy, 34, 0, Math.PI * 2);
    ctx.fill();
    plate.items.forEach((item, j) => {
      const spots = [[-13, -7], [13, -8], [-11, 11], [12, 10]];
      const [dx, dy] = spots[j % 4];
      drawFood(ctx, item.ing, cx + dx, cy + dy, 15);
    });
    if (plate.items.length === 0) {
      text(ctx, 'Piring kosong', cx, cy + 4, 14, '#a08a68', 'bold', 'center');
    }
    // Status: lengkap? kurang apa?
    const order = orderForPlate(plate.items, state.orders);
    const sr = serveRect(i);
    if (order) {
      drawSteam(ctx, cx, cy - 40, t + i);
      ctx.fillStyle = '#1e7a34';
      rr(ctx, r.x + r.w - 96, r.y + 8, 86, 24, 12);
      ctx.fill();
      text(ctx, 'SIAP SAJI!', r.x + r.w - 53, r.y + 25, 14, '#fff', 'bold', 'center');
      ctx.fillStyle = '#1e7a34';
      rr(ctx, sr.x, sr.y, sr.w, sr.h, 8);
      ctx.fill();
      text(ctx, '▶ SAJIKAN', sr.x + sr.w / 2, sr.y + 21, 18, '#fff', 'bold', 'center');
    } else {
      ctx.fillStyle = '#b9a888';
      rr(ctx, sr.x, sr.y, sr.w, sr.h, 8);
      ctx.fill();
      text(ctx, 'SAJIKAN', sr.x + sr.w / 2, sr.y + 21, 17, '#fff6e3', 'bold', 'center');
    }
  }
}

function drawRecipes(ctx, state) {
  const r = LAYOUT.recipes;
  ctx.fillStyle = '#5a3a1a';
  rr(ctx, r.x, r.y, r.w, r.h, 10);
  ctx.fill();
  text(ctx, 'BUKU RESEP — 8 MENU WARUNG', r.x + 12, r.y + 18, 15, '#ffe9a8', 'bold');
  RECIPES.forEach((rp, i) => {
    const c = recipeChipRect(i);
    ctx.fillStyle = '#fff6e3';
    rr(ctx, c.x, c.y, c.w, c.h, 8);
    ctx.fill();
    rp.items.forEach((ing, j) => drawFood(ctx, ing, c.x + 18 + j * 20, c.y + 16, 8));
    text(ctx, rp.name, c.x + 10, c.y + 38, 11, '#2b1a0e', 'bold');
  });
}

function drawHand(ctx, state) {
  const h = LAYOUT.hand;
  ctx.fillStyle = '#2b1a0e';
  rr(ctx, h.x, h.y, h.w, h.h, 10);
  ctx.fill();
  text(ctx, 'TANGAN:', h.x + 16, h.y + 37, 18, '#ffe9a8', 'bold');
  if (state.hand) {
    const ing = ingredient(state.hand.ing);
    drawFood(ctx, state.hand.ing, h.x + 150, h.y + 29, 18);
    const stage = state.hand.stage === 'ready' ? 'SIAP' : state.hand.stage === 'chopped' ? 'TERPOTONG' : 'MENTAH';
    text(ctx, `${ing.name} — ${stage}`, h.x + 178, h.y + 37, 18, '#fff', 'bold');
  } else {
    text(ctx, '(kosong — ambil bahan di counter)', h.x + 120, h.y + 37, 17, '#d9c9a8', 'bold');
  }
  const hint = state.hand
    ? 'Klik talenan / wajan / panci / piring utk memakai • T = buang'
    : 'Klik bahan (1-8) lalu masak, susun di piring, tekan SAJIKAN';
  text(ctx, hint, h.x + 640, h.y + 37, 16, '#ffe9a8', 'bold');
  ctx.fillStyle = '#a11d1d';
  rr(ctx, 1150, h.y + 4, 106, 50, 8);
  ctx.fill();
  text(ctx, '🗑 BUANG', 1203, h.y + 35, 16, '#fff', 'bold', 'center');
  if (state.denyT > 0) {
    text(ctx, 'Tidak bisa! Cek resep di tiket.', 640, h.y - 8, 16, '#d62828', 'bold', 'center');
  }
}

function drawFooter(ctx, state) {
  const f = LAYOUT.footer;
  ctx.fillStyle = '#2b1a0e';
  ctx.fillRect(f.x, f.y, f.w, f.h);
  text(ctx, 'KLIK: ambil • potong • goreng • rebus • susun • sajikan      TOMBOL: 1-8 bahan • B talenan • T buang • Spasi mulai • Esc judul',
    W / 2, f.y + 30, 16, '#ffe9a8', 'bold', 'center');
  text(ctx, `Hidangan tersaji: ${state.served}   •   Gagal: ${state.failed}   •   Kombo terbaik: x${state.bestCombo}   •   Deadline pesanan mengecil tiap 4 hidangan (LV ${state.level})`,
    W / 2, f.y + 58, 15, '#d9c9a8', 'bold', 'center');
}

function drawFloaters(ctx, state) {
  for (const f of state.floaters) {
    ctx.globalAlpha = Math.max(0, 1 - f.t / 1.4);
    text(ctx, f.text, f.x, f.y - f.t * 46, 24, f.color, 'bold', 'center');
  }
  ctx.globalAlpha = 1;
}

function drawTitle(ctx, state) {
  ctx.fillStyle = '#a11d1d';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#f7e8c8';
  for (let i = 0; i < 8; i++) ctx.fillRect(i * 160, 0, 4, H);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  rr(ctx, 190, 60, 900, 600, 20);
  ctx.fill();
  text(ctx, 'SAMBAL RUSH 2', W / 2, 170, 72, '#ffd94d', 'bold', 'center');
  text(ctx, 'Warung Bu Sari: Jam Makan Siang', W / 2, 225, 32, '#fff6e3', 'bold', 'center');
  text(ctx, 'Masak 8 menu warung sebelum pelanggan marah!', W / 2, 275, 22, '#ffe9a8', 'bold', 'center');
  // Deretan makanan contoh.
  ['nasi-goreng', 'mie-ayam', 'soto-ayam', 'gado-gado'].forEach((id, i) => {
    const rp = recipe(id);
    const cx = 340 + i * 200;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.arc(cx, 350, 62, 0, Math.PI * 2);
    ctx.fill();
    rp.items.forEach((ing, j) => {
      const spots = [[-16, -8], [16, -10], [-14, 14], [15, 13]];
      const [dx, dy] = spots[j % 4];
      drawFood(ctx, ing, cx + dx, 350 + dy, 18);
    });
    text(ctx, rp.name, cx, 435, 17, '#fff6e3', 'bold', 'center');
  });
  text(ctx, 'Ambil bahan → Potong → Goreng/Rebus → Susun di piring → SAJIKAN', W / 2, 485, 20, '#ffe9a8', 'bold', 'center');
  ctx.fillStyle = '#1e7a34';
  rr(ctx, 490, 520, 300, 64, 12);
  ctx.fill();
  text(ctx, '▶ MULAI MASAK', 640, 561, 28, '#fff', 'bold', 'center');
  text(ctx, 'Mouse + keyboard • 3 hati • Shift 3 menit • Kombo x1,25 per sajian tepat waktu', W / 2, 625, 16, '#d9c9a8', 'bold', 'center');
}

function drawWin(ctx, state) {
  ctx.fillStyle = '#1d4a6b';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  rr(ctx, 290, 70, 700, 560, 20);
  ctx.fill();
  const win = state.hearts > 0;
  text(ctx, win ? 'SHIFT SELESAI!' : 'WARUNG TUTUP…', W / 2, 160, 54, '#ffd94d', 'bold', 'center');
  text(ctx, win ? 'Bu Sari bangga padamu, Nak!' : 'Pelanggan kecewa — coba lagi besok!', W / 2, 205, 22, '#fff6e3', 'bold', 'center');
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i < state.stars ? '#ffd94d' : '#5a6a7a';
    const cx = 540 + i * 100;
    const cy = 280;
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
      const a2 = a + Math.PI / 5;
      ctx.lineTo(cx + Math.cos(a) * 38, cy + Math.sin(a) * 38);
      ctx.lineTo(cx + Math.cos(a2) * 16, cy + Math.sin(a2) * 16);
    }
    ctx.closePath();
    ctx.fill();
  }
  text(ctx, `SKOR AKHIR: ${state.score}`, W / 2, 380, 36, '#fff', 'bold', 'center');
  text(ctx, `Hidangan tersaji: ${state.served}   •   Gagal: ${state.failed}   •   Kombo terbaik: x${state.bestCombo}   •   Koin: ${state.coins}`,
    W / 2, 425, 19, '#cfe8f7', 'bold', 'center');
  text(ctx, state.stars === 3 ? '★★★ SEMPURNA! Warung Bu Sari jadi langganan!' : state.stars === 2 ? '★★ Bagus! Pelanggan pulang kenyang.' : state.stars === 1 ? '★ Lumayan — besok lebih cepat lagi!' : 'Belum ada bintang — latihan lagi, Nak!',
    W / 2, 470, 19, '#ffe9a8', 'bold', 'center');
  ctx.fillStyle = '#1e7a34';
  rr(ctx, 490, 560, 300, 56, 12);
  ctx.fill();
  text(ctx, '↻ MAIN LAGI', 640, 597, 26, '#fff', 'bold', 'center');
  void CUSTOMERS;
}
