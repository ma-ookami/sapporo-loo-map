// 現在地の確認: node tools/test-locate.js
const { chromium } = require('../../taskline/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', args: ['--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const url = 'file:///C:/Users/masaya/dev/sapporo-loo-web/index.html?local=1';
  // 許可あり(すすきの近く) → 青い点が出て、地図がそこへ寄る。設定に「取得できています」
  let ctx = await b.newContext({ locale: 'ja-JP', viewport: { width: 390, height: 780 }, geolocation: { latitude: 43.0545, longitude: 141.3530 }, permissions: ['geolocation'] });
  await ctx.addInitScript(() => localStorage.setItem('loo-guide', '1'));
  let p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto(url); await p.waitForTimeout(5000);
  console.log('1 blue dot:', await p.locator('.herem').count(), '| state:', await p.evaluate(() => st.locState));
  const c = await p.evaluate(() => map.getCenter()); console.log('2 centered near me:', Math.abs(c.lat - 43.0545) < 0.003 && Math.abs(c.lng - 141.353) < 0.003);
  await p.click('#info'); console.log('3 settings says:', await p.locator('.sg.srow .shint').first().innerText());
  await p.close(); await ctx.close();
  // 許可なし → ボタンを押すと理由を出す
  ctx = await b.newContext({ locale: 'ja-JP', viewport: { width: 390, height: 780 } });
  await ctx.addInitScript(() => localStorage.setItem('loo-guide', '1'));
  p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto(url); await p.waitForTimeout(4500);
  console.log('4 no permission: dot', await p.locator('.herem').count(), '| state:', await p.evaluate(() => st.locState));
  await p.click('#here'); await p.waitForTimeout(1500);
  console.log('5 toast:', (await p.locator('.toast').allInnerTexts()).join(' / ').slice(0, 90));
  await b.close();
})();
