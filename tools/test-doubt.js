// 「ここにはなかった」: 3人で薄くなり最寄り・リストから外れる / 押す・取り消し / 範囲外の投稿をはじく: node tools/test-doubt.js
const { chromium } = require('../../taskline/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: require('./browser.js'), args: ['--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ locale: 'ja-JP', viewport: { width: 390, height: 780 }, geolocation: { latitude: 43.0545, longitude: 141.3530 }, permissions: ['geolocation'] });
  await ctx.addInitScript(() => localStorage.setItem('loo-guide', '1'));
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message)); p.on('dialog', d => d.accept());
  await p.goto('file:///C:/Users/masaya/dev/sapporo-loo-web/index.html?local=1'); await p.waitForTimeout(4000);
  const info = () => p.evaluate(() => { const m = markers.get('u-fake'); return { doubt: m && m.getElement().classList.contains('doubt'), inList: st.sorted.some(x => x.t.id === 'u-fake'), n: missCount('u-fake') }; });
  await p.evaluate(() => { const o = origin(); st.toilets.push({ id: 'u-fake', source: 'user', type: 'toilet', name: 'いたずらトイレ', lat: o.lat + 0.00005, lng: o.lng, fee: null, wheelchair: null, floor: null, ease: null, find: null, brand: null, loan: null, hours: null, note: '', mine: false }); refresh(); });
  console.log('1 作った直後', JSON.stringify(await info()));
  await p.evaluate(() => { for (let i = 0; i < 2; i++) st.reports.push({ toiletId: 'u-fake', kind: 'missing', mine: false, at: Date.now() }); refresh(); });
  console.log('2 報告2人(まだ通常)', JSON.stringify(await info()));
  await p.evaluate(() => focus('u-fake')); await p.waitForTimeout(700);
  console.log('3 詳細: ボタン', await p.locator('#miss').innerText());
  await p.click('#miss'); await p.waitForTimeout(700);   // ローカルモードは報告を端末の記録から読み直すので、他の人の2件を入れ直す
  await p.evaluate(() => { for (let i = 0; i < 2; i++) st.reports.push({ toiletId: 'u-fake', kind: 'missing', mine: false, at: Date.now() }); refresh(); }); await p.waitForTimeout(500);
  console.log('4 自分も報告(計3人)', JSON.stringify(await info()), '| タグ', await p.locator('.tags').innerText().then(t => t.split('\n').join(' ')), '| ボタン', await p.locator('#miss').innerText());
  await p.click('#miss'); await p.waitForTimeout(700);
  await p.evaluate(() => { for (let i = 0; i < 2; i++) st.reports.push({ toiletId: 'u-fake', kind: 'missing', mine: false, at: Date.now() }); refresh(); }); await p.waitForTimeout(500);
  console.log('5 取り消し後は他の2人(通常に戻る)', JSON.stringify(await info()));
  console.log('6 範囲', await p.evaluate(() => [inArea({ lat: 43.0545, lng: 141.353 }), inArea({ lat: 43.2, lng: 141.35 }), inArea({ lat: 43.06, lng: 141.5 })]));
  await b.close();
})();
