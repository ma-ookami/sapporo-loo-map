// 凡例とユーザー追加の色の確認(ローカルモード): node tools/test-legend.js
const { chromium } = require('../../taskline/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', args: ['--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, hasTouch: true, geolocation: { latitude: 43.0545, longitude: 141.3530 }, permissions: ['geolocation'] });
  await ctx.addInitScript(() => localStorage.setItem('loo-guide', '1'));
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file:///C:/Users/masaya/dev/sapporo-loo-web/index.html?local=1'); await p.waitForTimeout(5000);
  const rect = sel => p.evaluate(s => { const r = document.querySelector(s).getBoundingClientRect(); return { top: Math.round(r.top), bottom: Math.round(r.bottom), left: Math.round(r.left) }; }, sel);
  const sh = await rect('#sheet'), bt = await rect('#legendBtn');
  console.log('1 凡例ボタン: 左', bt.left, '| シートの上にある:', bt.bottom <= sh.top, `(ボタン下端 ${bt.bottom} / シート上端 ${sh.top})`);
  await p.click('#legendBtn'); await p.waitForTimeout(400);
  console.log('2 凡例の行数(4):', await p.locator('.lrow2').count(), '| 表示:', await p.locator('#legend').isVisible());
  await p.screenshot({ path: 'tools/shot-legend.png' });
  await p.click('#lgx'); console.log('3 閉じる:', !(await p.locator('#legend').isVisible()));
  // ユーザー追加のトイレ: 紫
  await p.click('#tabadd'); await p.waitForTimeout(700); await p.click('#pok'); await p.waitForTimeout(400);
  await p.fill('#fname', '凡例テストビル'); await p.click('#fsave'); await p.waitForTimeout(700);
  const pin = await p.evaluate(() => { const t = st.toilets.find(x => x.source === 'user'); const e = markers.get(t.id).getElement(); return { cls: e.className.includes(' user'), bg: getComputedStyle(e.querySelector('.pi')).backgroundColor }; });
  console.log('4 ユーザー追加のピン: userクラス', pin.cls, '| 色', pin.bg);
  const osm = await p.evaluate(() => { const t = st.toilets.find(x => x.source === 'osm' && x.type === 'toilet'); return getComputedStyle(markers.get(t.id).getElement().querySelector('.pi')).backgroundImage.slice(0, 40); });
  console.log('5 データのトイレ(青赤):', osm);
  await p.click('[data-t=list]'); await p.waitForTimeout(500);
  console.log('6 リスト表示中は凡例ボタンを隠す:', !(await p.locator('#legendBtn').isVisible()));
  await b.close();
})();
