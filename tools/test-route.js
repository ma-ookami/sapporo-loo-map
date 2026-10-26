// 「ここへ行く」「ナビ開始」: 確認ダイアログ → OK で Google マップを開く / キャンセルで開かない: node tools/test-route.js
const { chromium } = require('../../taskline/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', args: ['--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, geolocation: { latitude: 43.0545, longitude: 141.3530 }, permissions: ['geolocation'] });
  await ctx.addInitScript(() => localStorage.setItem('loo-guide', '1'));
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file:///C:/Users/masaya/dev/sapporo-loo-web/index.html?local=1'); await p.waitForTimeout(4000);
  let msg = '', accept = false, opened = 0;
  p.on('dialog', d => { msg = d.message(); accept ? d.accept() : d.dismiss(); });
  ctx.on('page', () => { opened++; });
  const tryIt = async (label, sel, ok) => { accept = ok; opened = 0; msg = ''; await p.click(sel); await p.waitForTimeout(1200); console.log(label, ok ? 'OK' : 'キャンセル', '| 確認文:', msg.slice(0, 40), '| 新しいタブ', opened); };
  await tryIt('1 ナビ開始', '#nbtn', false); await tryIt('1 ナビ開始', '#nbtn', true);
  await p.click('#nhead'); await p.waitForTimeout(800);
  await tryIt('2 ここへ行く', '#go', false); await tryIt('2 ここへ行く', '#go', true);
  await b.close();
})();
