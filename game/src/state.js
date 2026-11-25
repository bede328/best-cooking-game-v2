// game/src/state.js — keadaan permainan dan aturan mainnya:
// ambil bahan, potong di talenan, goreng di wajan, rebus di panci,
// susun di 3 piring, sajikan sebelum timer pesanan habis.
import {
  CUSTOMERS, INGREDIENTS, MAX_HEARTS, MAX_ORDERS, SHIFT_SECONDS,
  ingredient, isReady, recipe,
} from './config.js';
import { makeRng } from './random.js';
import { spawnOrder, refreshMoods } from './orders.js';
import { orderForPlate, servePoints } from './recipes.js';
import {
  playBurnt, playChop, playDing, playFail, playPick, playPlace,
  playServe, setSizzle,
} from './audio.js';

export function createState(seed) {
  return {
    seed,
    rng: makeRng(seed),
    screen: 'title',
    time: 0,
    score: 0,
    coins: 0,
    combo: 0,
    bestCombo: 0,
    served: 0,
    failed: 0,
    hearts: MAX_HEARTS,
    level: 1,
    shiftLeft: SHIFT_SECONDS,
    orders: [],
    orderSeq: 0,
    customers: CUSTOMERS.slice(0, 4).map((c) => ({ ...c, orderId: null, mood: 'idle', joyT: 0 })),
    hand: null,
    board: null, // { item, chops }
    wok: null,   // { item, t, total, burnt }
    pot: null,   // { item, t, total, burnt }
    plates: [{ items: [] }, { items: [] }, { items: [] }],
    spawnIn: 1.5,
    floaters: [],
    particles: [],
    flash: null,
    denyT: 0,
    stars: 0,
  };
}

export function startGame(state) {
  const fresh = createState(state.seed);
  Object.assign(state, fresh);
  state.screen = 'play';
  spawnOrder(state);
  spawnOrder(state);
  state.spawnIn = 10;
}

export function levelOf(served) {
  return 1 + Math.floor(served / 4);
}

export function starsFor(state) {
  if (state.served >= 14 && state.failed === 0) return 3;
  if (state.served >= 10) return 2;
  if (state.served >= 6) return 1;
  return 0;
}

function addFloater(state, x, y, text, color) {
  state.floaters.push({ x, y, text, color, t: 0 });
}

function burst(state, x, y, color, n) {
  for (let i = 0; i < n; i++) {
    state.particles.push({
      x, y,
      vx: (state.rng() - 0.5) * 160,
      vy: -40 - state.rng() * 120,
      life: 0.5 + state.rng() * 0.4,
      t: 0,
      color,
      size: 2 + state.rng() * 3,
    });
  }
}

// --- Aksi pemain (dipanggil input.js) ---

export function grabIngredient(state, ingId) {
  if (state.screen !== 'play' || state.hand) return false;
  const ing = ingredient(ingId);
  state.hand = { ing: ingId, stage: ing.cook === 0 && ing.chop === 0 ? 'ready' : 'raw' };
  playPick();
  return true;
}

export function clickBoard(state) {
  if (state.screen !== 'play') return;
  if (state.board) {
    // Ketok: tiap klik menambah potongan; selesai -> kembali ke tangan.
    const ing = ingredient(state.board.item.ing);
    state.board.chops += 1;
    playChop();
    burst(state, 392, 250, '#d9b380', 6);
    if (state.board.chops >= ing.chop) {
      state.hand = { ing: state.board.item.ing, stage: 'chopped' };
      state.board = null;
      playDing();
    }
    return;
  }
  if (!state.hand) return;
  const ing = ingredient(state.hand.ing);
  if (ing.chop > 0 && state.hand.stage === 'raw') {
    state.board = { item: state.hand, chops: 0 };
    state.hand = null;
    playPlace();
  }
}

export function clickCooker(state, which) {
  if (state.screen !== 'play') return;
  const key = which === 'wok' ? 'wok' : 'pot';
  const station = state[key];
  if (station) {
    if (station.burnt) {
      // Gosong dibuang: klik stasiun kosong-tangan untuk membersihkan.
      if (!state.hand) {
        state[key] = null;
        playPlace();
      }
      return;
    }
    if (!state.hand && station.t >= station.total) {
      state.hand = { ing: station.item.ing, stage: 'ready' };
      state[key] = null;
      playDing();
    }
    return;
  }
  if (!state.hand) return;
  const ing = ingredient(state.hand.ing);
  if (ing.station !== which) return;
  const readyToCook = ing.chop === 0 ? state.hand.stage === 'raw' : state.hand.stage === 'chopped';
  if (!readyToCook) return;
  state[key] = { item: state.hand, t: 0, total: ing.cook, burnt: false };
  state.hand = null;
  playPlace();
  setSizzle(true);
}

export function clickPlate(state, i) {
  if (state.screen !== 'play' || !state.hand) return;
  const plate = state.plates[i];
  if (!isReady(state.hand)) { state.denyT = 0.4; return; }
  if (plate.items.length >= 4) { state.denyT = 0.4; return; }
  if (plate.items.some((p) => p.ing === state.hand.ing)) { state.denyT = 0.4; return; }
  const wanted = state.orders.some((o) => {
    const r = recipe(o.recipeId);
    return r.items.includes(state.hand.ing);
  });
  if (!wanted && state.orders.length > 0) { state.denyT = 0.4; return; }
  plate.items.push(state.hand);
  burst(state, 420 + i * 220, 420, '#ffcf5c', 8);
  state.hand = null;
  playPlace();
}

export function clickServe(state, i) {
  if (state.screen !== 'play') return;
  const plate = state.plates[i];
  const order = orderForPlate(plate.items, state.orders);
  if (!order) { state.denyT = 0.4; playFail(); return; }
  const pts = servePoints(order, state.combo);
  state.score += pts;
  state.coins += pts;
  state.combo += 1;
  state.bestCombo = Math.max(state.bestCombo, state.combo);
  state.served += 1;
  state.level = levelOf(state.served);
  state.orders = state.orders.filter((o) => o.id !== order.id);
  const slot = order.slot;
  state.customers[slot] = { ...state.customers[slot], orderId: null, mood: 'joy', joyT: 1.8 };
  plate.items = [];
  addFloater(state, 420 + i * 220, 380, `+${pts} POIN!`, '#1e7a34');
  state.flash = { text: `${orderText(order)} TERSAJI! +${pts}`, t: 0 };
  burst(state, 420 + i * 220, 420, '#ffd94d', 18);
  playServe();
  state.spawnIn = Math.min(state.spawnIn, 4);
}

function orderText(order) {
  return order.recipeId.replace(/-/g, ' ').toUpperCase();
}

export function clickTrash(state) {
  if (state.screen !== 'play') return;
  if (state.hand) {
    state.hand = null;
    playPlace();
  }
}

// --- Update per frame ---

export function update(state, dt) {
  state.time += dt;
  if (state.denyT > 0) state.denyT -= dt;
  for (const f of state.floaters) f.t += dt;
  state.floaters = state.floaters.filter((f) => f.t < 1.4);
  for (const p of state.particles) {
    p.t += dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vy += 260 * dt;
  }
  state.particles = state.particles.filter((p) => p.t < p.life);
  for (const c of state.customers) if (c && c.joyT > 0) c.joyT -= dt;
  if (state.flash) {
    state.flash.t += dt;
    if (state.flash.t > 1.6) state.flash = null;
  }
  if (state.screen !== 'play') return;

  state.shiftLeft -= dt;
  if (state.shiftLeft <= 0) {
    state.shiftLeft = 0;
    state.screen = 'win';
    state.stars = starsFor(state);
    setSizzle(false);
    playServe();
    return;
  }

  // Memasak berjalan; gosong bila dibiarkan 4 detik lewat matang.
  for (const key of ['wok', 'pot']) {
    const st = state[key];
    if (!st) continue;
    st.t += dt;
    if (!st.burnt && st.t > st.total + 4) {
      st.burnt = true;
      playBurnt();
      addFloater(state, key === 'wok' ? 564 : 736, 200, 'GOSONG!', '#a11');
      if (!state.wok && !state.pot) setSizzle(false);
    }
  }
  if (!state.wok && !state.pot) setSizzle(false);

  // Pesanan baru berkala.
  state.spawnIn -= dt;
  if (state.spawnIn <= 0) {
    if (state.orders.length < MAX_ORDERS) spawnOrder(state);
    state.spawnIn = 9 + state.rng() * 4;
  }

  // Countdown tiap tiket; habis = hati hilang, kombo putus.
  let expired = null;
  for (const o of state.orders) {
    o.left -= dt;
    if (o.left <= 0) { expired = o; break; }
  }
  if (expired) {
    state.orders = state.orders.filter((o) => o.id !== expired.id);
    state.customers[expired.slot] = {
      ...state.customers[expired.slot], orderId: null, mood: 'angry', joyT: 0,
    };
    state.hearts -= 1;
    state.failed += 1;
    state.combo = 0;
    state.flash = { text: 'PESANAN GAGAL! -1 HATI', t: 0 };
    playFail();
    if (state.hearts <= 0) {
      state.screen = 'win';
      state.stars = starsFor(state);
      setSizzle(false);
    }
  }
  refreshMoods(state);
}

export { INGREDIENTS };
