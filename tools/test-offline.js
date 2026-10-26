// オフライン確認(localhost で配信 → 1回開く → 通信を切って開き直す): node tools/test-offline.js
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('../../taskline/node_modules/playwright-core');
const root = path.join(__dirname, '..');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
const srv = http.createServer((req, res) => {
  let f = path.join(root, decodeURIComponent(req.url.split('?')[0])); if (f.endsWith(path.sep) || f === root) f = path.join(f, 'index.html');
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); return res.end(); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res);
});
(async () => {
  await new Promise(r => srv.listen(0, r)); const url = 'http://localhost:' + srv.address().port + '/';
  const b = await chromium.launch({ executablePath: require('./browser.js'), args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ locale: 'ja-JP', viewport: { width: 390, height: 780 }, geolocation: { latitude: 43.0545, longitude: 141.3530 }, permissions: ['geolocation'] });
  await ctx.addInitScript(() => localStorage.setItem('loo-guide', '1'));
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto(url); await p.waitForTimeout(6000);
  const ready = await p.evaluate(async () => { const r = await navigator.serviceWorker.ready; return !!r.active; });
  console.log('1 SW 有効:', ready, '| pins', await p.locator('.pin').count());
  await p.reload(); await p.waitForTimeout(3000);   // SW 管理下でもう1回読んで、ライブラリもキャッシュさせる
  console.log('2 キャッシュ:', JSON.stringify(await p.evaluate(async () => { const o = {}; for (const k of await caches.keys()) o[k] = (await (await caches.open(k)).keys()).length; return o; })));
  await ctx.setOffline(true);
  const q = await ctx.newPage(); q.on('pageerror', e => console.log('ERR(off)', e.message));
  await q.goto(url); await q.waitForTimeout(5000);
  console.log('3 オフラインで開く: タイトル', await q.title(), '| maplibre', await q.evaluate(() => typeof maplibregl), '| pins', await q.locator('.pin').count(), '| 最寄り', await q.locator('.nname').first().innerText().catch(() => '(なし)'));
  await b.close(); srv.close();
})();
