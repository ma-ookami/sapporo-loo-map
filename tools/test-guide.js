// 「使う前に」の確認: node tools/test-guide.js
const { chromium } = require('../../taskline/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', args: ['--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 780 } });
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  const url = 'file:///C:/Users/masaya/dev/sapporo-loo-web/index.html?local=1';
  await p.goto(url); await p.waitForTimeout(2500);
  console.log('1 first visit guide visible:', await p.locator('#guide').isVisible());
  await p.screenshot({ path: 'tools/shot-guide.png' });
  await p.click('#gok'); console.log('2 closed:', !(await p.locator('#guide').isVisible()));
  await p.reload(); await p.waitForTimeout(2000);
  console.log('3 second visit hidden:', !(await p.locator('#guide').isVisible()));
  await p.click('#info'); await p.click('#sguide'); console.log('4 settings > guide reopens:', await p.locator('#guide').isVisible());
  await b.close();
})();
