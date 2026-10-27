// 許可待ち(pending)の実画面確認: node tools/shot-pending.js out  → out-detail.png / out-map.png
const { chromium } = require('../../taskline/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: require('./browser.js'), args: ['--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ locale: 'ja-JP', viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, hasTouch: true, geolocation: { latitude: 43.0545, longitude: 141.3530 }, permissions: ['geolocation'] });
  await ctx.addInitScript(() => localStorage.setItem('loo-guide', '1'));
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file:///C:/Users/masaya/dev/sapporo-loo-web/index.html?local=1'); await p.waitForTimeout(4000);
  await p.evaluate(() => {
    const mk = (id, pending, approved, dy) => ({ id, name: pending ? '申請中のトイレ' : '許可されたトイレ', lat: 43.0545 + dy, lng: 141.3530, fee: false, wheelchair: null, floor: null, ease: null, find: null, type: 'toilet', brand: null, loan: null, hours: null, note: '', source: 'user', uid: 'me', stalls: null, mine: true, pending, approved });
    st.toilets = st.toilets.concat([mk('u-P', true, false, 0.0002), mk('u-A', false, true, -0.0002)]); refresh();
  });
  await p.waitForTimeout(600);
  console.log('user toilets', await p.evaluate(() => st.toilets.filter(t => t.source === 'user').map(t => t.id)), 'pins', await p.evaluate(() => [...markers.keys()].filter(k => /^u-/.test(k))));
  await p.evaluate(() => focus('u-P')); await p.waitForTimeout(900);
  console.log('tags', (await p.locator('#sbody .tags').first().innerText()).split('\n').join('|'));
  await p.locator('#sheet, .sheet').first().screenshot({ path: process.argv[2] + '-detail.png' });
  await b.close();
})();
