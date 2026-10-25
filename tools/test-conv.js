// コンビニ追加の確認(ローカルモード): node tools/test-conv.js
const { chromium } = require('../../taskline/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', args: ['--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, geolocation: { latitude: 43.0545, longitude: 141.3530 }, permissions: ['geolocation'] });
  await ctx.addInitScript(() => localStorage.setItem('loo-guide','1')); const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file:///C:/Users/masaya/dev/sapporo-loo-web/index.html?local=1'); await p.waitForTimeout(4000);
  const add = async (brand, loan, name) => {
    await p.click('#tabadd'); await p.waitForTimeout(700); await p.click('#pok'); await p.waitForTimeout(400);
    await p.click('.seg[data-k=type] button[data-v=conv]');
    if (name) await p.fill('#fname', name);
    if (brand) await p.click(`.seg[data-k=brand] button[data-v=${brand}]`);
    if (loan) await p.click(`.seg[data-k=loan] button[data-v=${loan}]`);
    await p.click('#fsave'); await p.waitForTimeout(500);
  };
  await add(null, null); console.log('1 no brand toast', await p.locator('.toast').count(), '| form still open', await p.locator('#fsave').count());
  await p.click('.seg[data-k=brand] button[data-v=seven]'); await p.click('#fsave'); console.log('2 no loan toast', await p.locator('.toast').count());
  await p.click('.seg[data-k=loan] button[data-v=ask]'); await p.screenshot({ path: 'tools/shot-conv.png' });
  await p.fill('#fname', '札幌南3条店'); await p.click('#fsave'); await p.waitForTimeout(600);
  console.log('3 conv pins', await p.locator('.pin.conv').count());
  await add('lawson', 'no');
  console.log('4 conv pins', await p.locator('.pin.conv').count(), '| nearest excludes ×:', (await p.locator('.nname').innerText()).slice(0, 30));
  await p.evaluate(() => document.querySelectorAll('.pin.conv')[0].click()); await p.waitForTimeout(700);
  console.log('5 detail', (await p.locator('#sbody h2').innerText()), '|', (await p.locator('#sbody .tags').first().innerText()).replace(/\n/g, ' '));
  await p.screenshot({ path: 'tools/shot-conv2.png' });
  await b.close();
})();
