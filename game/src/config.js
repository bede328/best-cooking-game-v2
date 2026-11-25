// game/src/config.js — data statis Sambal Rush 2: ukuran kanvas, 8 bahan,
// 8 resep, pelanggan, dan geometri dapur. Satu sumber kebenaran untuk
// render.js dan input.js supaya klik selalu cocok dengan gambar.
export const W = 1280;
export const H = 720;

// Bahan: station = stasiun yang memasaknya ('wok' | 'pot' | 'none'),
// chop = ketukan di talenan (0 = tidak perlu), cook = detik memasak.
export const INGREDIENTS = [
  { id: 'nasi',   name: 'NASI',   color: '#f7f1dc', dark: '#8a7a4a', chop: 0, cook: 4, station: 'wok',  hint: 'GORENG 4dt' },
  { id: 'mie',    name: 'MIE',    color: '#f2c14e', dark: '#8a6410', chop: 0, cook: 4, station: 'pot',  hint: 'REBUS 4dt' },
  { id: 'ayam',   name: 'AYAM',   color: '#c67b4e', dark: '#6e3b1c', chop: 3, cook: 5, station: 'wok',  hint: 'POTONG+GOR' },
  { id: 'telur',  name: 'TELUR',  color: '#fff3b0', dark: '#8a7a10', chop: 0, cook: 3, station: 'wok',  hint: 'GORENG 3dt' },
  { id: 'sayur',  name: 'SAYUR',  color: '#7fb069', dark: '#2e5d23', chop: 2, cook: 0, station: 'none', hint: 'POTONG 2x' },
  { id: 'sambal', name: 'SAMBAL', color: '#d62828', dark: '#7a1010', chop: 0, cook: 0, station: 'none', hint: 'SIAP SAJI' },
  { id: 'tahu',   name: 'TAHU',   color: '#e8d5a8', dark: '#8a6d2f', chop: 0, cook: 3, station: 'wok',  hint: 'GORENG 3dt' },
  { id: 'esteh',  name: 'ES TEH', color: '#c96f2e', dark: '#6e3410', chop: 0, cook: 0, station: 'none', hint: 'SIAP SAJI' },
];

export function ingredient(id) {
  return INGREDIENTS.find((g) => g.id === id);
}

// Bahan siap disajikan bila sudah lewat semua langkahnya.
export function isReady(item) {
  if (!item) return false;
  const ing = ingredient(item.ing);
  if (ing.cook > 0) return item.stage === 'ready';
  return item.stage !== 'raw';
}

export function nextStage(item) {
  const ing = ingredient(item.ing);
  if (ing.chop > 0 && item.stage === 'raw') return 'chopped';
  return 'ready';
}

// 8 resep berkombinasi: makin banyak bahan, makin besar harga.
export const RECIPES = [
  { id: 'nasi-goreng', name: 'NASI GORENG', items: ['nasi', 'ayam', 'telur', 'sambal'], price: 120 },
  { id: 'mie-ayam',    name: 'MIE AYAM',    items: ['mie', 'ayam', 'sayur'],            price: 110 },
  { id: 'ayam-geprek', name: 'AYAM GEPREK', items: ['ayam', 'sambal', 'nasi'],          price: 130 },
  { id: 'mie-goreng',  name: 'MIE GORENG',  items: ['mie', 'telur', 'sayur', 'sambal'], price: 115 },
  { id: 'nasi-ayam',   name: 'NASI AYAM',   items: ['nasi', 'ayam', 'sayur'],           price: 100 },
  { id: 'soto-ayam',   name: 'SOTO AYAM',   items: ['ayam', 'mie', 'telur'],            price: 125 },
  { id: 'gado-gado',   name: 'GADO-GADO',   items: ['tahu', 'sayur', 'telur', 'sambal'], price: 120 },
  { id: 'es-teh',      name: 'ES TEH MANIS', items: ['esteh'],                          price: 40 },
];

export function recipe(id) {
  return RECIPES.find((r) => r.id === id);
}

// Pelanggan warung (nama orisinal, bukan tokoh mana pun).
export const CUSTOMERS = [
  { name: 'Pak Darso',  skin: '#e8b98a', shirt: '#2e6f9e' },
  { name: 'Bu Ratna',   skin: '#f0c49a', shirt: '#c94f6d' },
  { name: 'Mas Jono',   skin: '#d9a06b', shirt: '#4a7c59' },
  { name: 'Mbak Sari',  skin: '#eec39a', shirt: '#e08e2b' },
  { name: 'Bang Udin',  skin: '#c98d5f', shirt: '#7a4a8a' },
  { name: 'Neng Lilis', skin: '#f2cfa5', shirt: '#3f8f8a' },
];

export const SHIFT_SECONDS = 180; // satu shift = 3 menit, lalu layar menang
export const MAX_HEARTS = 3;
export const MAX_ORDERS = 4;
export const SERVE_FOR_LEVEL = 4; // tiap 4 hidangan naik level, deadline mengecil

// Geometri dapur. Semua rect dalam koordinat kanvas 1280x720.
export const LAYOUT = {
  header: { x: 0, y: 0, w: 1280, h: 58 },
  board: { x: 12, y: 68, w: 288, h: 400 },        // papan pesanan (kiri, 4 tiket)
  customers: { x: 980, y: 68, w: 288, h: 400 },  // pelanggan (kanan)
  bins: { x: 312, y: 68, w: 656, h: 92 },         // rak 8 bahan di counter
  boardStation: { x: 312, y: 172, w: 160, h: 150 }, // talenan
  wokStation: { x: 484, y: 172, w: 160, h: 150 },   // wajan + kompor
  potStation: { x: 656, y: 172, w: 160, h: 150 },   // panci rebus
  chef: { x: 828, y: 172, w: 140, h: 150 },         // Bu Sari di kompor
  plates: { x: 312, y: 334, w: 656, h: 166 },       // 3 piring rakit + SAJIKAN
  recipes: { x: 12, y: 512, w: 1256, h: 64 },       // strip 8 resep (buku resep)
  hand: { x: 12, y: 584, w: 1256, h: 56 },          // nampan tangan + petunjuk
  footer: { x: 0, y: 648, w: 1280, h: 72 },         // bilah kontrol + level
};

export function binRect(i) {
  const b = LAYOUT.bins;
  const w = b.w / 8;
  return { x: b.x + i * w + 3, y: b.y + 3, w: w - 6, h: b.h - 6 };
}

export function plateRect(i) {
  const p = LAYOUT.plates;
  const w = p.w / 3;
  return { x: p.x + i * w + 4, y: p.y + 4, w: w - 8, h: p.h - 8 };
}

export function serveRect(i) {
  const r = plateRect(i);
  return { x: r.x + 18, y: r.y + r.h - 38, w: r.w - 36, h: 30 };
}

export function orderRect(i) {
  const b = LAYOUT.board;
  const y = b.y + 42 + i * 88;
  return { x: b.x + 8, y, w: b.w - 16, h: 80 };
}

export function customerRect(i) {
  const c = LAYOUT.customers;
  const y = c.y + 42 + i * 88;
  return { x: c.x + 8, y, w: c.w - 16, h: 80 };
}

export function recipeChipRect(i) {
  const r = LAYOUT.recipes;
  const w = r.w / 8;
  return { x: r.x + i * w + 3, y: r.y + 20, w: w - 6, h: 40 };
}

export function inRect(r, x, y) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
