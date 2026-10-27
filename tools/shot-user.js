// ユーザー追加(未確認)の実画面確認: node tools/shot-user.js out [dark]  → out-list.png / out-legend.png / out-map.png
const { chromium } = require('../../taskline/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: require('./browser.js'), args: ['--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ locale: 'ja-JP', viewport: { width: 390, height: 780 }, deviceScaleFactor: +(process.env.DSF||3), hasTouch: true, colorScheme: process.argv[3] === 'dark' ? 'dark' : 'light', geolocation: { latitude: 43.0545, longitude: 141.3530 }, permissions: ['geolocation'] });
  await ctx.addInitScript(() => localStorage.setItem('loo-guide', '1'));
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file:///C:/Users/masaya/dev/sapporo-loo-web/index.html?local=1'); await p.waitForTimeout(5000);
  await p.click('#tabadd'); await p.waitForTimeout(600); await p.click('#pok'); await p.waitForTimeout(400);
  await p.fill('#fname', '見た目テスト'); await p.click('#fsave'); await p.waitForTimeout(1000);
  const o = process.argv[2];
  const id = await p.evaluate(() => st.toilets.find(t => t.source === 'user').id);
  const pin = p.locator('.pin.user').first();
  await p.screenshot({ path: o + '-map.png', clip: { x: 100, y: 250, width: 190, height: 200 } });
  await p.click('[data-t=list]'); await p.waitForTimeout(600);
  const row = p.locator('.row', { has: p.locator('.ri.user') }).first();
  console.log('rows', await p.locator('.row').count(), 'user rows', await p.locator('.ri.user').count());
  console.log(JSON.stringify(await p.evaluate(()=>{const s=document.querySelectorAll('.row .ri')[1];const v=s.querySelector('svg');const c=getComputedStyle(s),d=getComputedStyle(v);return {color:c.color,op:c.opacity,svgop:d.opacity,fill:d.fill,stroke:d.stroke,html:v.outerHTML.slice(0,300)}})));await p.waitForTimeout(1500);await p.locator('.row').nth(0).screenshot({ path: o + '-list.png' }); await p.locator('.row').nth(1).screenshot({ path: o + '-list2.png' });
  const lg = p.locator('#legend, .legend').first();
  if (!(await lg.isVisible())) { const bt = p.locator('#lgbtn, .lgbtn, [data-t=legend]').first(); if (await bt.count()) await bt.click(); await p.waitForTimeout(300); }
  await p.evaluate(() => { const l = document.querySelector('#legend,.legend'); if (l) { l.style.display = 'block'; l.style.visibility = 'visible'; l.style.opacity = 1; } });
  const lb = await p.evaluate(() => { const l = document.querySelector('#legend,.legend'); if (!l) return null; const r = l.getBoundingClientRect(); return { x: r.x, y: r.y, width: r.width, height: r.height }; });
  console.log('legend box', JSON.stringify(lb));
  { const q = await p.locator('.lm .pin.ug').first().boundingBox(); await p.screenshot({ path: o + '-ug.png', clip: { x: q.x - 4, y: q.y - 4, width: q.width + 12, height: q.height + 12 } }); } if (lb && lb.width) await p.screenshot({ path: o + '-legend.png', clip: lb });
  await b.close();
})();
