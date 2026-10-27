// ピン見本: node tools/pinzoom.js out.png [dark]  (ユーザー追加ピンの状態を並べて拡大)
const { chromium } = require('../../taskline/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: require('./browser.js'), args: ['--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ locale: 'ja-JP', viewport: { width: 390, height: 780 }, deviceScaleFactor: 4, colorScheme: process.argv[3] === 'dark' ? 'dark' : 'light' });
  await ctx.addInitScript(() => localStorage.setItem('loo-guide', '1'));
  const p = await ctx.newPage();
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file:///C:/Users/masaya/dev/sapporo-loo-web/index.html?local=1'); await p.waitForTimeout(3000);
  await p.evaluate(() => {
    document.body.innerHTML = '';
    const mk = (cls, label) => '<div style="display:inline-block;margin:14px;text-align:center;font:11px sans-serif"><div class="pin '+cls+'" style="position:relative"><div class="pi">'+icon('wc',18)+DASH_SVG+'<i class="ub">'+PERSON_SVG+'</i></div></div><br>'+label+'</div>';
    document.body.style.background = getComputedStyle(document.documentElement).getPropertyValue('--bg') || '#eee';
    document.body.innerHTML = mk('', 'data') + mk('user unconf', '未確認') + mk('user', '確認済み') + mk('user unconf sel', '選択');
  });
  await p.waitForTimeout(800);
  await p.screenshot({ path: process.argv[2], clip: { x: 0, y: 0, width: 360, height: 100 } });
  await b.close();
})();
