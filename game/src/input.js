// game/src/input.js — mouse + keyboard: klik stasiun/piring/bin,
// tombol 1-8 ambil bahan, spasi mulai, Esc kembali ke judul.
import {
  INGREDIENTS, LAYOUT, binRect, customerRect, inRect, orderRect,
  plateRect, recipeChipRect, serveRect,
} from './config.js';
import {
  clickBoard, clickCooker, clickPlate, clickServe, clickTrash,
  grabIngredient, startGame,
} from './state.js';
import { ensureAudio, playClick } from './audio.js';

function canvasPos(canvas, ev) {
  const r = canvas.getBoundingClientRect();
  const scaleX = canvas.width / r.width;
  const scaleY = canvas.height / r.height;
  return { x: (ev.clientX - r.left) * scaleX, y: (ev.clientY - r.top) * scaleY };
}

export function installInput(canvas, state, onAction) {
  canvas.addEventListener('pointerdown', (ev) => {
    ensureAudio();
    const { x, y } = canvasPos(canvas, ev);
    handleClick(state, x, y);
    if (onAction) onAction();
  });

  window.addEventListener('keydown', (ev) => {
    ensureAudio();
    if (ev.key === ' ' || ev.key === 'Enter') {
      if (state.screen === 'title' || state.screen === 'win') {
        startGame(state);
        playClick();
      }
      ev.preventDefault();
      return;
    }
    if (ev.key === 'Escape' && state.screen === 'play') {
      state.screen = 'title';
      return;
    }
    if (state.screen !== 'play') return;
    const n = Number(ev.key);
    if (n >= 1 && n <= INGREDIENTS.length) {
      grabIngredient(state, INGREDIENTS[n - 1].id);
    }
    if (ev.key === 't' || ev.key === 'T') clickTrash(state);
    if (ev.key === 'b' || ev.key === 'B') clickBoard(state);
  });
}

export function handleClick(state, x, y) {
  if (state.screen === 'title') {
    // Tombol MULAI MASAK di tengah layar judul.
    if (inRect({ x: 490, y: 520, w: 300, h: 64 }, x, y)) {
      startGame(state);
      playClick();
    }
    return;
  }
  if (state.screen === 'win') {
    if (inRect({ x: 490, y: 560, w: 300, h: 56 }, x, y)) {
      startGame(state);
      playClick();
    }
    return;
  }
  if (state.screen !== 'play') return;

  // Bin bahan 1-8.
  for (let i = 0; i < INGREDIENTS.length; i++) {
    if (inRect(binRect(i), x, y)) {
      grabIngredient(state, INGREDIENTS[i].id);
      return;
    }
  }
  // Stasiun masak.
  if (inRect(LAYOUT.boardStation, x, y)) { clickBoard(state); return; }
  if (inRect(LAYOUT.wokStation, x, y)) { clickCooker(state, 'wok'); return; }
  if (inRect(LAYOUT.potStation, x, y)) { clickCooker(state, 'pot'); return; }
  // Piring + tombol SAJIKAN.
  for (let i = 0; i < 3; i++) {
    if (inRect(serveRect(i), x, y)) { clickServe(state, i); return; }
    if (inRect(plateRect(i), x, y)) { clickPlate(state, i); return; }
  }
  // Tempat sampah (di bilah bawah kanan).
  if (inRect({ x: 1150, y: 588, w: 106, h: 48 }, x, y)) { clickTrash(state); return; }
  // Tiket pesanan / pelanggan: hanya info, tidak bisa diklik.
  for (let i = 0; i < 4; i++) {
    if (inRect(orderRect(i), x, y) || inRect(customerRect(i), x, y)) return;
  }
  void recipeChipRect;
}
