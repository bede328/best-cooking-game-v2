// scripts/playtest.mjs — mainkan Sambal Rush sungguhan lewat klik + tombol
// di headless Chrome: mulai, ambil ayam, potong di talenan, goreng di wajan,
// ambil matang, lalu sajikan pesanan dari preset cover. Gagal bila ada
// error console/page atau langkah permainan tidak mengubah state.
// Jalankan: node scripts/playtest.mjs
import { startChrome, BrowserPage, sleep } from './cdp.mjs';
import { createServer } from 'node:http';
import { readFileSync, existsSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('..', import.meta.url));
const gameDir = join(here, 'game');
const MIME = { '.html': 'text/html', '.js': 'text/javascript' };
const server = createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  const file = join(gameDir, url === '/' ? 'index.html' : url);
  if (!file.startsWith(gameDir) || !existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;

const { proc, base } = await startChrome(9336);
let errors = 0;
const check = (label, cond) => {
  console.log((cond ? 'PASS' : 'FAIL') + ' ' + label);
  if (!cond) errors++;
};
try {
  const page = await BrowserPage.open(base, `http://127.0.0.1:${port}/?seed=7`);
  await page.waitFor('window.__shotReady === true', 20000);
  const snap = () => page.evaluate(`(() => {
    const s = window.__game.state;
    return { screen: s.screen, hand: s.hand && s.hand.ing + ':' + s.hand.stage,
      board: s.board && s.board.item.ing + ':' + s.board.chops,
      wok: s.wok && s.wok.item.ing + ':' + Math.round(s.wok.t * 10) / 10 + '/' + s.wok.total,
      plates: s.plates.map(p => p.items.map(i => i.ing).join(',')),
      orders: s.orders.length, score: s.score, served: s.served };
  })()`);
  check('judul tampil', (await snap()).screen === 'title');
  await page.click(640, 552); // mulai (tombol judul v2)
  await sleep(300);
  check('permainan mulai', (await snap()).screen === 'play');
  check('2 pesanan awal', (await snap()).orders === 2);
  await page.pressKey('6', 'Digit6', 54); // ambil sambal (siap saji)
  await sleep(150);
  check('tangan pegang sambal', (await snap()).hand === 'sambal:ready');
  await page.click(423, 404); // taruh di piring 1 (v2)
  await sleep(150);
  check('sambal di piring 1', (await snap()).plates[0] === 'sambal');
  await page.pressKey('3', 'Digit3', 51); // ambil ayam
  await sleep(150);
  await page.click(392, 247); // taruh di talenan (v2)
  await page.click(392, 247); // ketok 1
  await page.click(392, 247); // ketok 2
  await page.click(392, 247); // ketok 3 -> selesai
  await sleep(150);
  const afterChop = await snap();
  check('ayam terpotong kembali ke tangan', afterChop.hand === 'ayam:chopped' && afterChop.board === null);
  await page.click(564, 247); // masuk wajan (v2)
  await sleep(200);
  check('ayam di wajan', (await snap()).wok !== null);
  await sleep(6000); // tunggu matang (5 dtk)
  await page.click(564, 247); // ambil dari wajan
  await sleep(150);
  check('ayam matang di tangan', (await snap()).hand === 'ayam:ready');
  await page.click(423, 404); // taruh di piring 1 (v2) (sambal + ayam)
  await sleep(150);
  check('piring 1 berisi sambal+ayam', (await snap()).plates[0] === 'sambal,ayam');

  // Sajikan lewat preset cover: piring 2 sudah Mie Ayam lengkap.
  const page2 = await BrowserPage.open(base, `http://127.0.0.1:${port}/?shot=cover&seed=1`);
  await page2.waitFor('window.__shotReady === true', 20000);
  await sleep(300);
  const before = await page2.evaluate('window.__game.state.score');
  await page2.click(637, 473); // tombol SAJIKAN piring 2 (v2)
  await sleep(300);
  const after = await page2.evaluate(`(() => {
    const s = window.__game.state;
    return { score: s.score, served: s.served, orders: s.orders.length, plates: s.plates.map(p => p.items.length) };
  })()`);
  check('sajikan menambah skor & hidangan', after.score > before && after.served === 8 && after.orders === 3 && after.plates[1] === 0);
  console.log('  skor sebelum/sesudah:', before, '->', after.score);
  for (const p of [page, page2]) {
    if (p.consoleErrors.length) console.log('  console error:', p.consoleErrors);
    if (p.pageErrors.length) console.log('  page error:', p.pageErrors);
    errors += p.consoleErrors.length + p.pageErrors.length;
    await p.close();
  }
} finally {
  proc.kill();
  server.close();
}
console.log(errors === 0 ? 'PLAYTEST OK: 0 error' : `PLAYTEST: ${errors} error`);
process.exit(errors === 0 ? 0 : 1);
