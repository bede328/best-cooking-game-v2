// game/src/recipes.js — logika resep: mencocokkan isi piring dengan pesanan,
// menghitung harga dan bonus waktu, serta daftar bahan yang masih kurang.
import { recipe } from './config.js';

export function plateMatchesOrder(plateItems, order) {
  const r = recipe(order.recipeId);
  if (plateItems.length !== r.items.length) return false;
  const have = plateItems.map((i) => i.ing).sort().join(',');
  return have === r.items.slice().sort().join(',');
}

export function missingForPlate(plateItems, order) {
  const r = recipe(order.recipeId);
  const have = plateItems.map((i) => i.ing);
  return r.items.filter((ing) => !have.includes(ing));
}

// Piring boleh menerima bahan bila ada pesanan terbuka yang membutuhkannya
// dan piring itu belum punya bahan tersebut.
export function plateAccepts(plateItems, orders, ing) {
  if (plateItems.some((i) => i.ing === ing)) return false;
  return orders.some((o) => {
    const r = recipe(o.recipeId);
    return r.items.includes(ing) && !plateItems.some((i) => i.ing === ing);
  });
}

export function orderForPlate(plateItems, orders) {
  return orders.find((o) => plateMatchesOrder(plateItems, o)) || null;
}

export function servePoints(order, combo) {
  const r = recipe(order.recipeId);
  const timeBonus = Math.round(60 * (order.left / order.total));
  const mult = 1 + 0.25 * Math.min(combo, 8);
  return Math.round((r.price + timeBonus) * mult);
}
