// 見た目の確認用: node tools/shot.js [out.png] [dark]
const { chromium } = require('../../taskline/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', args: ['--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 780 }, colorScheme: process.argv[3] === 'dark' ? 'dark' : 'light', geolocation: { latitude: 43.0545, longitude: 141.3530 }, permissions: ['geolocation'] });
  await ctx.addInitScript(() => localStorage.setItem('loo-guide', '1'));
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file:///C:/Users/masaya/dev/sapporo-loo-web/index.html?local=1'); await p.waitForTimeout(5000);
  console.log('pins', await p.locator('.pin').count(), 'canvas', await p.locator('canvas').count());
  await p.click('[data-t=list]'); await p.waitForTimeout(600);
  await p.screenshot({ path: process.argv[2] || 'tools/shot.png' });
  await b.close();
})();
