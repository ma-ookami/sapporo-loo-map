// 絞り込み中に地図を引いても、外れた店が出ないこと: node tools/test-lowzoom.js
const { chromium } = require('../../taskline/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', args: ['--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, geolocation: { latitude: 43.0545, longitude: 141.3530 }, permissions: ['geolocation'] });
  await ctx.addInitScript(() => { localStorage.setItem('loo-guide', '1'); });
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file:///C:/Users/masaya/dev/sapporo-loo-web/index.html?local=1'); await p.waitForTimeout(4000);
  const vis = () => p.evaluate(() => { let c = 0; for (const [id, m] of markers) { const e = m.getElement(); if (e.offsetParent !== null && e.className.includes(' conv')) c++; } return c; });
  await p.click('[data-k=conly]'); await p.click('[data-f=b_seven]');
  const seven = await p.evaluate(() => st.toilets.filter(t => t.type === 'conv' && t.brand === 'seven').length);
  await p.evaluate(() => map.setZoom(13)); await p.waitForTimeout(1500);
  console.log('セブンのみ・zoom13 表示コンビニ', await vis(), '/ データ上のセブン', seven);
  await b.close();
})();
