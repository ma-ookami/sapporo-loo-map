// コンビニ探し(コンビニだけ / トイレだけ / ブランド)の確認(ローカルモード): node tools/test-convmode.js
const { chromium } = require('../../taskline/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', args: ['--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, geolocation: { latitude: 43.0545, longitude: 141.3530 }, permissions: ['geolocation'] });
  await ctx.addInitScript(() => { localStorage.setItem('loo-guide', '1');  });
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file:///C:/Users/masaya/dev/sapporo-loo-web/index.html?local=1'); await p.waitForTimeout(5000);
  const vis = () => p.evaluate(() => { let t = 0, c = 0; for (const [id, m] of markers) { const e = m.getElement(); if (e.hidden || e.offsetParent === null) continue; if (e.className.includes(' conv')) c++; else t++; } return { toilets: t, conv: c }; });
  const eyebrow = () => p.locator('.eyebrow').first().innerText();
  const nearest = () => p.locator('.nname').innerText();
  console.log('0 初期:', JSON.stringify(await vis()), '|', await eyebrow());
  await p.click('[data-k=conly]'); await p.waitForTimeout(500);
  console.log('1 コンビニだけ:', JSON.stringify(await vis()), '|', await eyebrow(), '|', await nearest());
  await p.evaluate(() => map.setZoom(13)); await p.waitForTimeout(800);
  console.log('2 引いた地図(zoom13)でも不明の店が出る:', JSON.stringify(await vis()));
  await p.evaluate(() => map.setZoom(15.5)); await p.waitForTimeout(800);
  await p.click('[data-k=tonly]'); await p.waitForTimeout(400);
  console.log('3 トイレだけ(コンビニだけと同時には選べない):', JSON.stringify(await vis()), '| conly押下', await p.locator('[data-k=conly]').getAttribute('aria-pressed'), '|', await eyebrow());
  await p.click('[data-k=conly]'); await p.click('[data-f=b_seven]'); await p.waitForTimeout(400);
  const seven = await p.evaluate(() => st.toilets.filter(t => t.type === 'conv' && t.brand === 'seven').length);
  console.log('4 セブン(トイレだけは外れる):', JSON.stringify(await vis()), '| データ上のセブン', seven, '| tonly', await p.locator('[data-k=tonly]').getAttribute('aria-pressed'), '|', await eyebrow(), '|', await nearest());
  await p.click('[data-f=b_lawson]'); await p.waitForTimeout(400);
  console.log('5 セブン+ローソン:', JSON.stringify(await vis()));
  await p.click('[data-f=b_seven]'); await p.click('[data-f=b_lawson]'); await p.waitForTimeout(400);
  console.log('6 ブランドを全部外す(戻る):', JSON.stringify(await vis()), '|', await eyebrow());
  await b.close();
})();
