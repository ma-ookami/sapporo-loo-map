// 絞り込み(種類の切替 + 2段目)の状態確認(ローカルモード・地図の拡大なし): node tools/test-filters.js
const { chromium } = require('../../taskline/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', args: ['--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ locale: 'ja-JP', viewport: { width: 390, height: 780 }, hasTouch: true, geolocation: { latitude: 43.0545, longitude: 141.3530 }, permissions: ['geolocation'] });
  await ctx.addInitScript(() => { localStorage.setItem('loo-guide', '1'); });
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file:///C:/Users/masaya/dev/sapporo-loo-web/index.html?local=1'); await p.waitForTimeout(4000);
  const state = () => p.evaluate(() => ({ f: Object.keys(st.filters).filter(k => st.filters[k]).join(','), sub: !$('subf').hidden, shown: [...document.querySelectorAll('#subf [data-f]')].filter(x => !x.hidden).map(x => x.dataset.f).join(','), list: st.sorted.length }));
  const log = async (l) => console.log(l, JSON.stringify(await state()));
  await log('0 初期');
  await p.click('[data-k=tonly]'); await log('1 トイレ');
  await p.click('[data-f=free]'); await log('2 トイレ+無料');
  await p.click('[data-k=conly]'); await log('3 コンビニ(無料は外れる)');
  await p.click('[data-f=b_seven]'); await p.click('[data-f=conv]'); await log('4 セブン+借りられる');
  await p.click('[data-k=tonly]'); await log('5 トイレ(ブランド等は外れる)');
  await p.click('[data-f=open]'); await p.click('[data-k=all]'); await log('6 すべて(いま空いてるは残る)');
  await b.close();
})();
