// スマホで設定を閉じられるか(×と下の「閉じる」、パネルの上端が画面内): node tools/test-settings-close.js
const { chromium } = require('../../taskline/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: require('./browser.js'), args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ locale: 'ja-JP', viewport: { width: 390, height: 664 }, hasTouch: true, isMobile: true, geolocation: { latitude: 43.0545, longitude: 141.3530 }, permissions: ['geolocation'] });
  await ctx.addInitScript(() => localStorage.setItem('loo-guide', '1'));
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file:///C:/Users/masaya/dev/sapporo-loo-web/index.html?local=1'); await p.waitForTimeout(4500);
  const open = async () => { await p.tap('#info'); await p.waitForTimeout(500); };
  const geom = () => p.evaluate(() => { const r = document.querySelector('.spanel').getBoundingClientRect(), x = document.getElementById('sx').getBoundingClientRect(); return { top: Math.round(r.top), xTop: Math.round(x.top), xInside: x.top >= 0 && x.bottom <= innerHeight, vh: getComputedStyle(document.documentElement).getPropertyValue('--vh'), innerH: innerHeight }; });
  await open(); console.log('1 設定を開いた: 上端が画面内・×が見える:', JSON.stringify(await geom()));
  await p.tap('#sx'); await p.waitForTimeout(400); console.log('2 ×で閉じた:', !(await p.locator('#settings').isVisible()));
  await open(); await p.evaluate(() => document.querySelector('.sbody2').scrollTo(0, 99999)); await p.waitForTimeout(300);
  await p.tap('#sclose'); await p.waitForTimeout(400); console.log('3 下の「閉じる」で閉じた:', !(await p.locator('#settings').isVisible()));
  await open(); await p.touchscreen.tap(195, 20); await p.waitForTimeout(400); console.log('4 パネルの外(上)をタップで閉じた:', !(await p.locator('#settings').isVisible()));
  await b.close();
})();
