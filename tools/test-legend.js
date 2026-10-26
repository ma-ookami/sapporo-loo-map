// 凡例: スマホはボタンで開閉、広い画面は出しっぱなし: node tools/test-legend.js
const { chromium } = require('../../taskline/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', args: ['--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  for (const [name, w] of [['スマホ', 390], ['広い画面', 1000]]) {
    const ctx = await b.newContext({ locale: 'ja-JP', viewport: { width: w, height: 780 } });
    await ctx.addInitScript(() => { localStorage.setItem('loo-guide', '1'); });
    const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
    await p.goto('file:///C:/Users/masaya/dev/sapporo-loo-web/index.html?local=1'); await p.waitForTimeout(3000);
    const v = s => p.locator(s).isVisible();
    const r = [name, '初期 ボタン', await v('#legendBtn'), '凡例', await v('#legend')];
    if (w < 600) { await p.click('#legendBtn'); r.push('→押す 凡例', await v('#legend')); await p.click('#legendBtn'); r.push('→もう一度 凡例', await v('#legend')); }
    console.log(r.join(' '));
    await ctx.close();
  }
  await b.close();
})();
