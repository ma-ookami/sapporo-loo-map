// ダークモード・いま空いてる・遠いとき の確認: node tools/test-dark.js
const { chromium } = require('../../taskline/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', args: ['--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  // 札幌駅より南の遠い場所(例: 新千歳空港付近)にいる想定
  const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, colorScheme: 'dark', geolocation: { latitude: 42.7752, longitude: 141.6923 }, permissions: ['geolocation'] });
  await ctx.addInitScript(() => localStorage.setItem('loo-guide', '1'));
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file:///C:/Users/masaya/dev/sapporo-loo-web/index.html?local=1'); await p.waitForTimeout(4500);
  console.log('1 dark map style:', await p.evaluate(() => map.getStyle().name || map.getStyle().sprite), '| body bg:', await p.evaluate(() => getComputedStyle(document.body).backgroundColor));
  console.log('2 far bubble + button:', await p.locator('#gosus').count());
  await p.screenshot({ path: 'tools/shot-dark1.png' });
  await p.click('#gosus'); await p.waitForTimeout(2500);
  const c = await p.evaluate(() => map.getCenter());
  console.log('3 moved to Susukino:', Math.abs(c.lat - 43.0555) < 0.01 && Math.abs(c.lng - 141.3535) < 0.01);
  const vis = () => p.evaluate(() => [...document.querySelectorAll('.pin')].filter(e => !e.hidden && e.offsetParent !== null).length);
  const n0 = await vis(); await p.click('[data-f=open]'); await p.waitForTimeout(400);
  console.log('4 open-now filter on: visible', n0, '->', await vis(), '| chip pressed:', await p.locator('[data-f=open]').getAttribute('aria-pressed'));
  await p.click('[data-f=open]');
  await p.evaluate(() => { const id = st.toilets.find(t => t.type === 'conv').id; focus(id); }); await p.waitForTimeout(700);
  await p.screenshot({ path: 'tools/shot-dark2.png' });
  await b.close();
})();
