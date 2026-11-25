// game/src/main.js — titik masuk game: siapkan kanvas, baca ?shot= / ?seed=,
// jalankan loop requestAnimationFrame, dan sediakan window.__game +
// window.__shotReady untuk alat screenshot.
import { H, W } from './config.js';
import { createState, update } from './state.js';
import { render } from './render.js';
import { installInput } from './input.js';
import { applyShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || '1') || 1;
const shot = params.get('shot');

let state = createState(seed);
if (shot) state = applyShot(state, shot);

installInput(canvas, state, () => {});
window.__game = { state };

let last = performance.now();
let frames = 0;

function frame(now) {
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  update(state, dt);
  render(ctx, state);
  frames += 1;
  if (frames === 3) window.__shotReady = true;
  requestAnimationFrame(frame);
}

// Kanvas dipasang ke ukuran logis 1280x720 dan diskalakan CSS ke layar.
canvas.width = W;
canvas.height = H;
requestAnimationFrame(frame);
