// 設定画面の確認(ローカルモード): node tools/test-settings.js
const { chromium } = require('../../taskline/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: require('./browser.js'), args: ['--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ locale: 'ja-JP', viewport: { width: 390, height: 780 }, hasTouch: true, colorScheme: 'light', geolocation: { latitude: 43.0545, longitude: 141.3530 }, permissions: ['geolocation'] });
  await ctx.addInitScript(() => localStorage.setItem('loo-guide', '1'));
  const p = await ctx.newPage(); p.on('dialog', d => d.accept()); p.on('pageerror', e => console.log('ERR', e.message));
  const url = 'file:///C:/Users/masaya/dev/sapporo-loo-web/index.html?local=1';
  await p.goto(url); await p.waitForTimeout(4500);
  const walk = async () => (await p.locator('.nmeta').innerText()).split(String.fromCharCode(10)).join(' ');
  await p.click('#info'); console.log('1 settings open:', await p.locator('#sbody .shead').isVisible());
  await p.screenshot({ path: 'tools/shot-settings.png' });
  const bg0 = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
  await p.click('.seg[data-s=theme] button[data-v=dark]'); await p.waitForTimeout(600);
  console.log('2 theme dark (even if device is light):', await p.evaluate(() => document.documentElement.dataset.theme), '| bg', bg0, '->', await p.evaluate(() => getComputedStyle(document.body).backgroundColor));
  const w0 = await walk();
  await p.click('.seg[data-s=pace] button[data-v="100"]'); await p.waitForTimeout(300);
  console.log('3 pace:', w0, '->', await walk());
  await p.click('.sw[data-s=vibrate]'); console.log('4 vibrate off:', await p.locator('.sw[data-s=vibrate]').getAttribute('aria-pressed'));
  await p.click('.sw[data-s=nearConv]');
  // 自分が追加したものを1件作る → 一覧に出て削除できる
  await p.click('#sx'); await p.waitForTimeout(300);
  await p.click('#tabadd'); await p.waitForTimeout(700); await p.click('#pok'); await p.waitForTimeout(400);
  await p.fill('#fname', '設定テストビル'); await p.click('#fsave'); await p.waitForTimeout(600);
  await p.click('#info'); await p.waitForTimeout(300);
  console.log('5 my posts:', await p.locator('.mrow b').allInnerTexts());
  await p.click('[data-del]'); await p.waitForTimeout(500);
  console.log('6 after delete:', await p.locator('[data-del]').count());
  await p.reload(); await p.waitForTimeout(3500);
  console.log('7 persisted after reload: theme', await p.evaluate(() => document.documentElement.dataset.theme), '| pace', await p.evaluate(() => st.settings.pace), '| vibrate', await p.evaluate(() => st.settings.vibrate), '| nearConv', await p.evaluate(() => st.settings.nearConv));
  await b.close();
})();
