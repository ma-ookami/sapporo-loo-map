// 地図タップで詳細・リストが閉じるかの確認: node tools/test-mapclose.js
const { chromium } = require('../../taskline/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', args: ['--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ locale: 'ja-JP', viewport: { width: 390, height: 780 }, hasTouch: true, geolocation: { latitude: 43.0545, longitude: 141.3530 }, permissions: ['geolocation'] });
  await ctx.addInitScript(() => localStorage.setItem('loo-guide', '1'));
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file:///C:/Users/masaya/dev/sapporo-loo-web/index.html?local=1'); await p.waitForTimeout(5000);
  const state = () => p.evaluate(() => ({ sel: st.sel, open: st.open, tab: st.tab, sheetOpen: document.getElementById('sheet').classList.contains('open') }));
  // 地図の空いている所(左上寄り。ピンやボタンと重ならない)
  const tapMap = async (y) => { await p.touchscreen.tap(60, y || 300); await p.waitForTimeout(500); };
  await p.evaluate(() => focus(st.toilets[0].id)); await p.waitForTimeout(800);
  console.log('1 詳細を開いた:', JSON.stringify(await state()));
  await tapMap(); console.log('2 地図タップ後(詳細):', JSON.stringify(await state()));
  await p.click('[data-t=list]'); await p.waitForTimeout(500);
  console.log('3 リストを開いた:', JSON.stringify(await state()));
  await tapMap(160); console.log('4 地図タップ後(リスト):', JSON.stringify(await state()));
  await b.close();
})();
