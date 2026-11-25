// scripts/shots.mjs — potret 4 screenshot entri dari game yang sedang jalan
// di headless Chrome: sajikan game/, buka tiap ?shot= di shots.json,
// tunggu window.__shotReady, lalu simpan JPEG 1280x720 (<= 256 KiB).
// Jalankan dari root repo: node scripts/shots.mjs
import { startChrome, BrowserPage, sleep } from './cdp.mjs';
import { createServer } from 'node:http';
import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('..', import.meta.url));
const gameDir = join(here, 'game');
const shotsJson = JSON.parse(readFileSync(join(here, 'shots.json'), 'utf8'));
const outDir = join(here, 'screenshots');
mkdirSync(outDir, { recursive: true });

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
const server = createServer((req, res) => {
  const url = decodeURIComponent(req.url.split('?')[0]);
  if (url === '/favicon.ico') { res.writeHead(204); res.end(); return; }
  const file = join(gameDir, url === '/' ? 'index.html' : url);
  if (!file.startsWith(gameDir) || !existsSync(file)) { res.writeHead(404); res.end('not found'); return; }
  res.writeHead(200, { 'content-type': MIME[extname(file)] || 'application/octet-stream' });
  res.end(readFileSync(file));
});
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const port = server.address().port;

const { proc, base } = await startChrome(9335);
let errors = 0;
try {
  for (const shot of shotsJson) {
    const page = await BrowserPage.open(base, `http://127.0.0.1:${port}/${shot.query}`);
    await sleep(300);
    try {
      await page.waitFor('window.__shotReady === true', 20000);
    } catch {
      console.log(`${shot.name}: SHOT TIDAK PERNAH SIAP`);
      errors++;
    }
    await sleep(500);
    const info = await page.evaluate(`(() => {
      const s = window.__game && window.__game.state;
      return s ? { screen: s.screen, score: s.score, orders: s.orders.length, plates: s.plates.map(p => p.items.length) } : null;
    })()`);
    console.log(`${shot.name}: state=${JSON.stringify(info)}`);
    if (page.consoleErrors.length > 0) console.log('  console error:', page.consoleErrors);
    if (page.pageErrors.length > 0) console.log('  page error:', page.pageErrors);
    errors += page.consoleErrors.length + page.pageErrors.length;
    const out = join(outDir, shot.name);
    await page.screenshot(out, 82);
    const size = statSync(out).size;
    console.log(`${shot.name}: ${size} byte ${size <= 262144 ? 'OK' : 'TERLALU BESAR'}`);
    if (size > 262144) errors++;
    await page.close();
  }
} finally {
  proc.kill();
  server.close();
}
console.log(errors === 0 ? 'SHOTS OK: 0 error' : `SHOTS: ${errors} error`);
process.exit(errors === 0 ? 0 : 1);
