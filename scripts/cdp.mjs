// scripts/cdp.mjs — driver headless Chrome lewat Chrome DevTools Protocol.
// Tanpa dependensi npm: memakai WebSocket bawaan Node 22 untuk bicara dengan
// chrome-headless-shell yang dijalankan dengan --remote-debugging-port.
// Dipakai oleh scripts/shots.mjs untuk memotret game yang sedang jalan.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';

export const CHROME_BIN =
  process.env.CHROME_PATH ||
  '/home/hatch/.cache/ms-playwright/chromium_headless_shell-1255/chrome-headless-shell-linux64/chrome-headless-shell';

export const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Nyalakan chrome headless dan tunggu endpoint DevTools-nya menjawab.
export async function startChrome(port = 9333) {
  if (!existsSync(CHROME_BIN)) throw new Error('chrome-headless-shell tidak ada di ' + CHROME_BIN);
  const proc = spawn(CHROME_BIN, [
    '--headless',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    `--remote-debugging-port=${port}`,
    '--window-size=1280,720',
    'about:blank',
  ], { stdio: ['ignore', 'pipe', 'pipe'] });
  proc.stderr.on('data', () => {});
  const base = `http://127.0.0.1:${port}`;
  for (let i = 0; i < 60; i++) {
    try {
      const res = await fetch(`${base}/json/version`);
      if (res.ok) return { proc, base };
    } catch { /* belum siap */ }
    await sleep(500);
  }
  proc.kill();
  throw new Error('chrome tidak menyalakan endpoint DevTools');
}

export class BrowserPage {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    this.consoleErrors = [];
    this.pageErrors = [];
    this.ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) reject(new Error(msg.error.message));
        else resolve(msg.result);
      } else if (msg.method === 'Runtime.exceptionThrown') {
        const d = msg.params?.exceptionDetails;
        this.pageErrors.push(String(d?.exception?.description || d?.text || 'page exception'));
      } else if (msg.method === 'Runtime.consoleAPICalled' && msg.params?.type === 'error') {
        this.consoleErrors.push(msg.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
      } else if (msg.method === 'Log.entryAdded' && msg.params?.entry?.level === 'error') {
        this.consoleErrors.push(msg.params.entry.text);
      }
    };
  }

  static async open(base, url) {
    let target;
    const put = await fetch(`${base}/json/new?${encodeURIComponent(url)}`, { method: 'PUT' });
    if (put.ok) target = await put.json();
    else target = await (await fetch(`${base}/json/new?${encodeURIComponent(url)}`)).json();
    const ws = new WebSocket(target.webSocketDebuggerUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = () => reject(new Error('websocket gagal'));
    });
    const page = new BrowserPage(ws);
    await page.send('Runtime.enable');
    await page.send('Page.enable');
    await page.send('Log.enable');
    await page.send('Emulation.setDeviceMetricsOverride', {
      width: 1280, height: 720, deviceScaleFactor: 1, mobile: false,
    });
    return page;
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const r = await this.send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (r.exceptionDetails) throw new Error('evaluate gagal: ' + JSON.stringify(r.exceptionDetails));
    return r.result.value;
  }

  async waitFor(expression, timeoutMs = 20000, pollMs = 200) {
    const start = Date.now();
    for (;;) {
      try { if (await this.evaluate(expression)) return true; } catch { /* coba lagi */ }
      if (Date.now() - start > timeoutMs) throw new Error('timeout menunggu: ' + expression);
      await sleep(pollMs);
    }
  }

  async click(x, y) {
    await this.send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await this.send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
  }

  async pressKey(key, code, keyCode) {
    await this.send('Input.dispatchKeyEvent', { type: 'keyDown', key, code, windowsVirtualKeyCode: keyCode });
    await this.send('Input.dispatchKeyEvent', { type: 'keyUp', key, code, windowsVirtualKeyCode: keyCode });
  }

  async screenshot(path, quality = 82) {
    const { writeFileSync } = await import('node:fs');
    const { data } = await this.send('Page.captureScreenshot', { format: 'jpeg', quality });
    writeFileSync(path, Buffer.from(data, 'base64'));
  }

  async close() {
    try { this.ws.close(); } catch { /* abaikan */ }
  }
}
