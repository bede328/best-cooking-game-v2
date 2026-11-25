// game/src/audio.js — bunyi sintetis WebAudio, tanpa file eksternal.
// Semua bunyi dibuat dari osilator + noise buffer saat dipanggil.
let ctx = null;
let sizzleNodes = null;

export function ensureAudio() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function tone(freq, dur, type, vol, when = 0) {
  const ac = ensureAudio();
  if (!ac) return;
  const t = ac.currentTime + when;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  gain.gain.setValueAtTime(vol, t);
  gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.connect(gain);
  gain.connect(ac.destination);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noiseBurst(dur, vol, filterFreq) {
  const ac = ensureAudio();
  if (!ac) return;
  const len = Math.floor(ac.sampleRate * dur);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ac.createBufferSource();
  src.buffer = buf;
  const filter = ac.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.value = filterFreq;
  const gain = ac.createGain();
  gain.gain.value = vol;
  src.connect(filter);
  filter.connect(gain);
  gain.connect(ac.destination);
  src.start();
}

export function playChop() {
  noiseBurst(0.08, 0.5, 1800);
  tone(180, 0.06, 'square', 0.12);
}

export function playPick() {
  tone(520, 0.07, 'sine', 0.18);
}

export function playPlace() {
  tone(340, 0.08, 'triangle', 0.2);
  tone(510, 0.06, 'sine', 0.12, 0.05);
}

export function playDing() {
  tone(880, 0.18, 'sine', 0.25);
  tone(1318, 0.22, 'sine', 0.18, 0.09);
}

export function playServe() {
  tone(523, 0.1, 'triangle', 0.25);
  tone(659, 0.1, 'triangle', 0.25, 0.08);
  tone(784, 0.22, 'triangle', 0.28, 0.16);
}

export function playFail() {
  tone(220, 0.25, 'sawtooth', 0.15);
  tone(165, 0.35, 'sawtooth', 0.15, 0.12);
}

export function playBurnt() {
  noiseBurst(0.3, 0.4, 500);
  tone(110, 0.3, 'sawtooth', 0.18);
}

export function playClick() {
  tone(700, 0.05, 'sine', 0.12);
}

export function setSizzle(on) {
  const ac = ensureAudio();
  if (!ac) return;
  if (on && !sizzleNodes) {
    const len = ac.sampleRate;
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = ac.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 4000;
    const gain = ac.createGain();
    gain.gain.value = 0.03;
    src.connect(filter);
    filter.connect(gain);
    gain.connect(ac.destination);
    src.start();
    sizzleNodes = { src, gain };
  } else if (!on && sizzleNodes) {
    try { sizzleNodes.src.stop(); } catch { /* sudah berhenti */ }
    sizzleNodes = null;
  }
}
