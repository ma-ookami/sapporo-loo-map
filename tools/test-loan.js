// コンビニ(OSM 取り込み)と貸し出し報告の確認(ローカルモード): node tools/test-loan.js
const { chromium } = require('../../taskline/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', args: ['--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, geolocation: { latitude: 43.0545, longitude: 141.3530 }, permissions: ['geolocation'] });
  await ctx.addInitScript(() => localStorage.setItem('loo-guide','1')); const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file:///C:/Users/masaya/dev/sapporo-loo-web/index.html'); await p.waitForTimeout(4500);
  const vis = sel => p.evaluate(s => [...document.querySelectorAll(s)].filter(e => e.offsetParent !== null).length, sel);
  console.log('1 conv pins (unknown, visible):', await vis('.pin.conv.loan-null'), '| all pins in DOM:', await p.locator('.pin').count());
  await p.screenshot({ path: 'tools/shot-loan1.png' });
  const near0 = await p.locator('.nname').innerText();
  await p.evaluate(() => map.setZoom(13)); await p.waitForTimeout(500);
  console.log('2 zoomed out, unknown conv visible:', await vis('.pin.conv.loan-null'));
  await p.evaluate(() => map.jumpTo({ zoom: 15.5, center: [141.3530, 43.0545] })); await p.waitForTimeout(600);
  // 一番近い未確認コンビニを開く
  const id = await p.evaluate(() => { const c = st.toilets.filter(t => t.type === 'conv').map(t => ({ t, d: distanceM(origin(), t) })).sort((a, b) => a.d - b.d)[0].t; return c.id; });
  await p.evaluate(i => focus(i), id); await p.waitForTimeout(700);
  console.log('3 detail:', await p.locator('#sbody h2').innerText(), '|', (await p.locator('#sbody .tags').innerText()).replace(/\n/g, ' '));
  await p.screenshot({ path: 'tools/shot-loan2.png' });
  await p.click('.lq button[data-k=loan-yes]'); await p.waitForTimeout(500);
  console.log('4 after 〇:', (await p.locator('#sbody .tags').innerText()).replace(/\n/g, ' '), '| pin class:', await p.evaluate(i => markers.get(i).getElement().className, id));
  await p.click('#dx'); await p.waitForTimeout(500);
  console.log('5 nearest now:', await p.locator('.nname').innerText(), '(before:', near0 + ')');
  await p.click('[data-f=conv]'); await p.waitForTimeout(400);
  console.log('5b conv filter -> visible pins:', await vis('.pin'), '| nearest:', await p.locator('.nname').innerText());
  await p.click('[data-f=conv]'); await p.waitForTimeout(300);
  await p.evaluate(i => focus(i), id); await p.waitForTimeout(500);
  await p.click('.lq button[data-k=loan-no]'); await p.waitForTimeout(400);
  await p.click('#dx'); await p.waitForTimeout(400);
  console.log('6 after ×, nearest:', await p.locator('.nname').innerText());
  await b.close();
})();
