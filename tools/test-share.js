// ?id= で開く・共有ボタン: node tools/test-share.js [out.png]
const { chromium } = require('../../taskline/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: require('./browser.js'), args: ['--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ locale: 'ja-JP', viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, hasTouch: true, geolocation: { latitude: 43.0545, longitude: 141.3530 }, permissions: ['geolocation', 'clipboard-read', 'clipboard-write'] });
  await ctx.addInitScript(() => { localStorage.setItem('loo-guide', '1'); delete Navigator.prototype.share; });
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  const base = 'file:///C:/Users/masaya/dev/sapporo-loo-web/index.html?local=1';
  await p.goto(base); await p.waitForTimeout(3000);
  const t = await p.evaluate(() => { const x = st.toilets.filter(t => t.type === 'toilet')[5]; return { id: x.id, name: x.name, lat: x.lat, lng: x.lng }; });
  await p.goto(base + '&id=' + encodeURIComponent(t.id)); await p.waitForTimeout(4000);
  const r = await p.evaluate(() => ({ sel: st.sel, c: map.getCenter(), z: map.getZoom() }));
  console.log('開いた', r.sel === t.id, 'zoom', r.z.toFixed(1), 'center差', Math.abs(r.c.lat - t.lat).toFixed(5), Math.abs(r.c.lng - t.lng).toFixed(5));
  await p.click('#dsh'); await p.waitForTimeout(500);
  console.log('コピー', await p.evaluate(() => navigator.clipboard.readText()).then(s => s.replace(/^.*index\.html/, '…')), '| toast', await p.locator('.toast').innerText().catch(() => '-'));
  await p.goto(base + '&id=nonexistent'); await p.waitForTimeout(2500);
  console.log('無い id でも普通に開く', await p.evaluate(() => st.sel === null));
  await p.goto(base + '&id=' + encodeURIComponent(t.id)); await p.waitForTimeout(3000);
  if (process.argv[2]) await p.locator('#sheet, .sheet').first().screenshot({ path: process.argv[2] });
  await b.close();
})();
