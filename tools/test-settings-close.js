// 設定が、リストと同じ下のシートで開閉できるか・フッターが押した状態になるか: node tools/test-settings-close.js
const { chromium } = require('../../taskline/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: require('./browser.js'), args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ locale: 'ja-JP', viewport: { width: 390, height: 664 }, hasTouch: true, isMobile: true, geolocation: { latitude: 43.0545, longitude: 141.3530 }, permissions: ['geolocation'] });
  await ctx.addInitScript(() => localStorage.setItem('loo-guide', '1'));
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file:///C:/Users/masaya/dev/sapporo-loo-web/index.html?local=1'); await p.waitForTimeout(4500);
  const state = () => p.evaluate(() => ({ open: document.getElementById('sheet').classList.contains('open'), head: !!document.querySelector('#sbody .shead'), on: [...document.querySelectorAll('#tabs .on')].map(x => x.dataset.t), xIn: (() => { const x = document.getElementById('sx'); if (!x) return null; const r = x.getBoundingClientRect(); return r.top >= 0 && r.bottom <= innerHeight; })() }));
  await p.tap('#info'); await p.waitForTimeout(500); console.log('1 開く:', JSON.stringify(await state()));
  await p.tap('#sx'); await p.waitForTimeout(400); console.log('2 ×で閉じる:', JSON.stringify(await state()));
  await p.tap('#info'); await p.waitForTimeout(400); await p.tap('#info'); await p.waitForTimeout(400); console.log('3 もう一度押して閉じる:', JSON.stringify(await state()));
  await p.tap('#info'); await p.waitForTimeout(400); await p.tap('[data-t=list]'); await p.waitForTimeout(400); console.log('4 リストへ切替:', JSON.stringify(await state()));
  await p.tap('#info'); await p.waitForTimeout(400); await p.touchscreen.tap(350, 140); await p.waitForTimeout(400); console.log('5 地図タップで閉じる:', JSON.stringify(await state()));
  await p.waitForTimeout(300); await p.screenshot({ path: 'C:/Users/masaya/AppData/Local/Temp/claude/c--Users-masaya-dev/d828e1bd-e38c-49b7-b21a-9b7a8f348582/scratchpad/set.png' });
  await b.close();
})();
