// お気に入り(★)の確認(短く): node tools/test-fav.js
const { chromium } = require('../../taskline/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: require('./browser.js'), args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ locale: 'ja-JP', viewport: { width: 390, height: 780 }, hasTouch: true, geolocation: { latitude: 43.0545, longitude: 141.3530 }, permissions: ['geolocation'] });
  await ctx.addInitScript(() => localStorage.setItem('loo-guide', '1'));
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  const url = 'file:///C:/Users/masaya/dev/sapporo-loo-web/index.html?local=1';
  await p.goto(url); await p.waitForTimeout(4500);
  const id = await p.evaluate(() => st.toilets.find(t => t.type === 'toilet' && !t.pending).id);
  const badge = () => p.evaluate(i => ({ cls: markers.get(i).getElement().classList.contains('fav'), disp: getComputedStyle(markers.get(i).getElement().querySelector('.fb')).display }), id);
  await p.evaluate(i => focus(i), id); await p.waitForTimeout(600);
  console.log('1 登録前:', JSON.stringify(await badge()), '| ボタン', await p.locator('#dfav').getAttribute('aria-pressed'));
  await p.click('#dfav'); await p.waitForTimeout(400);
  console.log('2 ★を押した:', JSON.stringify(await badge()), '| ボタン', await p.locator('#dfav').getAttribute('aria-pressed'));
  await p.click('#dx'); await p.click('[data-t=list]'); await p.waitForTimeout(500);
  await p.click('[data-lm=fav]'); await p.waitForTimeout(300);
  console.log('3 リストの「お気に入り」:', await p.locator('.list .row').count(), '行 | 星つきの行', await p.locator('.list .row .rfav').count());
  await p.reload(); await p.waitForTimeout(4500);
  console.log('4 読み込み直しても残る:', await p.evaluate(() => st.favs.size), '件 | ピン', JSON.stringify(await badge()));
  await p.evaluate(i => focus(i), id); await p.waitForTimeout(500); await p.click('#dfav'); await p.waitForTimeout(300);
  console.log('5 もう一度で外す:', await p.evaluate(() => st.favs.size), '件');
  await p.click('#dx'); await p.click('[data-t=list]'); await p.waitForTimeout(400); await p.click('[data-lm=fav]'); await p.waitForTimeout(300);
  console.log('6 空のとき:', await p.locator('.list .empty').innerText());
  await b.close();
})();
