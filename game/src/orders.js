// game/src/orders.js — papan pesanan: memunculkan tiket baru, menghitung
// deadline yang mengecil tiap level, dan suasana hati pelanggan.
import { CUSTOMERS, MAX_ORDERS, RECIPES } from './config.js';
import { pick } from './random.js';

export function orderDeadline(served) {
  const level = 1 + Math.floor(served / 4);
  return Math.max(32, 58 - (level - 1) * 5);
}

export function spawnOrder(state) {
  if (state.orders.length >= MAX_ORDERS) return null;
  const freeSlots = CUSTOMERS.slice(0, 4).map((c, i) => i).filter(
    (i) => !state.orders.some((o) => o.slot === i),
  );
  if (freeSlots.length === 0) return null;
  const slot = pick(state.rng, freeSlots);
  const r = pick(state.rng, RECIPES);
  const total = orderDeadline(state.served);
  const order = {
    id: ++state.orderSeq,
    recipeId: r.id,
    customer: CUSTOMERS[slot],
    slot,
    left: total,
    total,
  };
  state.orders.push(order);
  state.customers[slot] = { ...CUSTOMERS[slot], orderId: order.id, mood: 'happy' };
  return order;
}

export function customerMood(order) {
  if (!order) return 'idle';
  const f = order.left / order.total;
  if (f < 0.25) return 'angry';
  if (f < 0.5) return 'worried';
  return 'happy';
}

export function refreshMoods(state) {
  for (let i = 0; i < state.customers.length; i++) {
    const c = state.customers[i];
    if (!c || c.joyT > 0) continue;
    const order = state.orders.find((o) => o.slot === i);
    state.customers[i] = { ...c, orderId: order ? order.id : null, mood: customerMood(order) };
  }
}
