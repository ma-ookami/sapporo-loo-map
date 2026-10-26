// 地図の色(シンプル/カラー)の確認: node tools/test-mapcolor.js
const { chromium } = require('../../taskline/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', args: ['--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const mk = async scheme => { const c = await b.newContext({ viewport: { width: 390, height: 780 }, colorScheme: scheme }); await c.addInitScript(() => localStorage.setItem('loo-guide', '1')); const p = await c.newPage(); p.on('pageerror', e => console.log('ERR', e.message)); await p.goto('file:///C:/Users/masaya/dev/sapporo-loo-web/index.html?local=1'); await p.waitForTimeout(5000); return p; };
  const state = async p => { for (let i = 0; i < 40; i++) { if (await p.evaluate(() => map.isStyleLoaded())) break; await p.waitForTimeout(500); } await p.waitForTimeout(800); return p.evaluate(() => { const l = map.getStyle().layers; return { n: l.length, bg: (l.find(x => x.type === 'background') || { paint: {} }).paint['background-color'], labels: labelLayers.length }; }); };
  let p = await mk('light');
  const s0 = await state(p); console.log('1 simple (light):', JSON.stringify(s0));
  await p.click('#layers'); const s1 = await state(p); console.log('2 color (light):', JSON.stringify(s1), '| differs:', s1.n !== s0.n, '| labels tidied:', s1.labels > 0);
  console.log('3 saved:', await p.evaluate(() => st.settings.mapColor), '| settings shows:', await (async () => { await p.click('#info'); return p.locator('.seg[data-s=mapColor] button[aria-pressed=true]').innerText(); })());
  await p.click('#sx'); await p.click('#layers'); const s2 = await state(p); console.log('4 back to simple:', s2.n === s0.n);
  await p.close();
  p = await mk('dark');
  const d0 = await state(p); await p.click('#layers'); const d1 = await state(p);
  console.log('5 dark simple vs dark color:', d0.n, '->', d1.n, '| bg', d0.bg, '->', d1.bg);
  await b.close();
})();
