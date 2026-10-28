// 地下・階の表示と「どの階?」の報告の確認(ローカルモード): node tools/test-floor.js
const { chromium } = require('../../taskline/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: require('./browser.js'), args: ['--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ locale: 'ja-JP', viewport: { width: 390, height: 780 }, hasTouch: true, geolocation: { latitude: 43.0545, longitude: 141.3530 }, permissions: ['geolocation'] });
  await ctx.addInitScript(() => localStorage.setItem('loo-guide', '1'));
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file:///C:/Users/masaya/dev/sapporo-loo-web/index.html?local=1'); await p.waitForTimeout(5000);
  const NL = String.fromCharCode(10);
  const flat = async sel => (await p.locator(sel).first().innerText()).split(NL).join(' ');
  const info = await p.evaluate(() => ({ ug: st.toilets.filter(t => t.floor != null && t.floor < 0).length, unknown: st.toilets.filter(t => t.floor == null).length }));
  console.log('1 データ上の地下:', info.ug, '件 | 階が不明:', info.unknown, '件');
  // 地下のデータ: 印(B)・タグ「地下」。階を教えるボタンは出ない
  const ugId = await p.evaluate(() => st.toilets.find(t => t.type === 'toilet' && t.floor != null && t.floor < 0).id);
  await p.evaluate(i => focus(i), ugId); await p.waitForTimeout(700);
  console.log('2 地下の場所: ピンの B 印', await p.evaluate(i => markers.get(i).getElement().classList.contains('ug'), ugId), '| タグ:', await flat('#sbody .tags'), '| 階を教えるボタン', await p.locator('.reps.lv').count());
  await p.click('#dx'); await p.waitForTimeout(400);
  // 階が不明: ボタンが出る → 「地下」を押すと B 印とタグが付き、もう一度で取り消し
  const unId = await p.evaluate(() => st.toilets.find(t => t.floor == null && t.type === 'toilet').id);
  await p.evaluate(i => focus(i), unId); await p.waitForTimeout(700); await p.click('.teach summary'); await p.waitForTimeout(300);
  console.log('3 階が不明: ボタン', await p.locator('.reps.lv button').count(), '| B 印', await p.evaluate(i => markers.get(i).getElement().classList.contains('ug'), unId));
  await p.click('.reps.lv button[data-lv=lv-ug]'); await p.waitForTimeout(500);
  console.log('4 「地下」を押した後: B 印', await p.evaluate(i => markers.get(i).getElement().classList.contains('ug'), unId), '| タグ:', await flat('#sbody .tags'), '| 押下', await p.locator('.reps.lv button[data-lv=lv-ug]').getAttribute('aria-pressed'));
  // 状態の報告(きれい)と階の報告は両方できる
  await p.click('.reps:not(.lv) button[data-k=clean]'); await p.waitForTimeout(400);
  console.log('5 状態の報告も同時に出せる: きれい', await p.locator('.reps:not(.lv) button[data-k=clean]').getAttribute('aria-pressed'), '| 地下', await p.locator('.reps.lv button[data-lv=lv-ug]').getAttribute('aria-pressed'));
  await p.click('.reps.lv button[data-lv=lv-ug]'); await p.waitForTimeout(400);
  console.log('6 もう一度で取り消し: B 印', await p.evaluate(i => markers.get(i).getElement().classList.contains('ug'), unId));
  await p.click('#dx'); await p.waitForTimeout(300);
  // コンビニの追加にも階の選択がある
  await p.click('#tabadd'); await p.waitForTimeout(700); await p.click('#pok'); await p.waitForTimeout(400);
  await p.click('.seg[data-k=type] button[data-v=conv]'); await p.waitForTimeout(300);
  console.log('7 コンビニの追加に階の選択は無い(0):', await p.locator('.seg[data-k=floor] button').count(), '個');
  await p.click('#fback').catch(() => {}); await p.click('#pcancel').catch(() => {}); await p.waitForTimeout(300);
  await p.evaluate(() => focus(st.toilets.find(t => t.type === 'conv' && t.floor != null && t.floor < 0).id)); await p.waitForTimeout(500);
  console.log('8 地下のコンビニにも、B 印・地下タグ・階の質問は出ない:', 'B印', await p.evaluate(() => { const t = st.toilets.find(x => x.type === 'conv' && x.floor != null && x.floor < 0); return markers.get(t.id).getElement().classList.contains('ug'); }), '| 地下タグ', await p.locator('#sbody .tag.ug').count(), '| 質問', await p.locator('.reps.lv').count());
  await b.close();
})();
