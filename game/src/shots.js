// game/src/shots.js — susunan keadaan untuk screenshot (?shot=...).
// Dipakai HANYA saat mengambil gambar entri; permainan normal tidak
// memakai preset ini. Setiap preset membangun keadaan yang sama persis
// bila seed-nya sama, lalu membiarkan loop game berjalan seperti biasa.
import { CUSTOMERS, RECIPES } from './config.js';
import { createState } from './state.js';

function basePlay(seed) {
  const state = createState(seed);
  state.screen = 'play';
  return state;
}

function addOrder(state, recipeId, slot, left, total) {
  const customer = CUSTOMERS[slot];
  const order = { id: ++state.orderSeq, recipeId, customer, slot, left, total };
  state.orders.push(order);
  state.customers[slot] = { ...customer, orderId: order.id, mood: left / total < 0.25 ? 'angry' : left / total < 0.5 ? 'worried' : 'happy', joyT: 0 };
  return order;
}

// Cover: dapur tengah rush — semua elemen kriteria juri dalam satu frame:
// papan pesanan 4 tiket, pelanggan, 8 bahan di counter, talenan sedang
// memotong, wajan berapi, panci merebus, Bu Sari, satu piring setengah
// tersusun, satu piring SIAP SAJI beruap + tombol SAJIKAN, timer shift,
// skor & kombo. TANPA overlay judul.
export function presetCover() {
  const state = basePlay(1);
  state.score = 1450;
  state.coins = 380;
  state.combo = 3;
  state.bestCombo = 5;
  state.served = 7;
  state.level = 2;
  state.shiftLeft = 135;
  state.hearts = 3;
  addOrder(state, 'nasi-goreng', 0, 11, 54); // hampir habis — merah
  addOrder(state, 'mie-ayam', 1, 29, 58);
  addOrder(state, 'ayam-geprek', 2, 44, 58);
  addOrder(state, 'soto-ayam', 3, 52, 58);
  state.spawnIn = 9;
  // Talenan: ayam sedang dipotong 2/3.
  state.board = { item: { ing: 'ayam', stage: 'raw' }, chops: 2 };
  // Wajan: nasi menggoreng 60%, panci: mie merebus 50%.
  state.wok = { item: { ing: 'nasi', stage: 'raw' }, t: 2.4, total: 4, burnt: false };
  state.pot = { item: { ing: 'mie', stage: 'raw' }, t: 2.0, total: 4, burnt: false };
  // Piring 1: setengah tersusun (nasi + telur, kurang ayam + sambal).
  state.plates[0].items = [
    { ing: 'nasi', stage: 'ready' },
    { ing: 'telur', stage: 'ready' },
  ];
  // Piring 2: Mie Ayam lengkap, siap disajikan.
  state.plates[1].items = [
    { ing: 'mie', stage: 'ready' },
    { ing: 'ayam', stage: 'ready' },
    { ing: 'sayur', stage: 'ready' },
  ];
  // Piring 3: Es Teh Manis sudah lengkap (side cepat).
  state.plates[2].items = [{ ing: 'esteh', stage: 'ready' }];
  // Tangan memegang sambal.
  state.hand = { ing: 'sambal', stage: 'ready' };
  return state;
}

export function presetTitle() {
  const state = createState(1);
  state.screen = 'title';
  return state;
}

// Momen sesudah menyajikan: pelanggan gembira, poin melayang.
export function presetServe() {
  const state = basePlay(1);
  state.score = 980;
  state.coins = 250;
  state.combo = 2;
  state.bestCombo = 4;
  state.served = 5;
  state.level = 2;
  state.shiftLeft = 152;
  addOrder(state, 'mie-goreng', 1, 36, 58);
  addOrder(state, 'nasi-ayam', 2, 50, 58);
  state.customers[0] = { ...CUSTOMERS[0], orderId: null, mood: 'joy', joyT: 1.6 };
  state.plates[0].items = [{ ing: 'nasi', stage: 'ready' }];
  state.wok = { item: { ing: 'ayam', stage: 'chopped' }, t: 4.2, total: 5, burnt: false };
  state.floaters.push({ x: 640, y: 300, text: '+214 POIN!', color: '#1e7a34', t: 0.2 });
  state.flash = { text: 'NASI GORENG TERSAJI! +214', t: 0.3 };
  return state;
}

// Layar shift selesai (menang) dengan bintang tiga.
export function presetWin() {
  const state = basePlay(1);
  state.screen = 'win';
  state.score = 3650;
  state.coins = 920;
  state.combo = 0;
  state.bestCombo = 6;
  state.served = 15;
  state.failed = 0;
  state.level = 4;
  state.shiftLeft = 0;
  state.stars = 3;
  return state;
}

export function applyShot(state, shot) {
  if (shot === 'cover') return presetCover();
  if (shot === 'serve') return presetServe();
  if (shot === 'win') return presetWin();
  return presetTitle();
}

export function shotRecipes() { return RECIPES.map((r) => r.id); }
