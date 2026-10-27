// 「使えなかった」の実画面確認: node tools/shot-closed.js out  → out-detail.png / out-row.png
const { chromium } = require('../../taskline/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: require('./browser.js'), args: ['--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ locale: 'ja-JP', viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, hasTouch: true, geolocation: { latitude: 43.0545, longitude: 141.3530 }, permissions: ['geolocation'] });
  await ctx.addInitScript(() => localStorage.setItem('loo-guide', '1'));
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file:///C:/Users/masaya/dev/sapporo-loo-web/index.html?local=1'); await p.waitForTimeout(5000);
  const id = await p.evaluate(() => st.toilets.find(t => t.type === 'toilet').id);
  await p.evaluate(i => { st.reports.push({ toiletId: i, kind: 'closed', mine: false, uid: 'u1', at: Date.now() }); focus(i); }, id); await p.waitForTimeout(900);
  console.log('buttons', await p.locator('.reps button').count(), 'tag', await p.locator('#sbody .tags').first().innerText().then(s => s.split('\n').join('|')));
  await p.locator('#sheet, .sheet').first().screenshot({ path: process.argv[2] + '-detail.png' });
  await b.close();
})();
