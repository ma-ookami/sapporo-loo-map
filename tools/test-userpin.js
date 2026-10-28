// ユーザー追加の見た目(緑・点線→確認で実線・右上の人バッジ)と、個室の数(追加時の入力・教えるボタン・中央値)の確認
//   node tools/test-userpin.js(ローカルモード。ほかの人の報告は、st.reports に入れて真似する)
const { chromium } = require('../../taskline/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: require('./browser.js'), args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ locale: 'ja-JP', viewport: { width: 390, height: 780 }, hasTouch: true, geolocation: { latitude: 43.0545, longitude: 141.3530 }, permissions: ['geolocation'] });
  await ctx.addInitScript(() => localStorage.setItem('loo-guide', '1'));
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file:///C:/Users/masaya/dev/sapporo-loo-web/index.html?local=1'); await p.waitForTimeout(5000);
  const NL = String.fromCharCode(10);
  const flat = async sel => (await p.locator(sel).first().innerText()).split(NL).join(' ');
  // 追加(トイレ・個室 3 つ)
  await p.click('#tabadd'); await p.waitForTimeout(600); await p.click('#pok'); await p.waitForTimeout(400);
  console.log('1 追加画面に個室の数の選択:', await p.locator('.seg[data-k=stalls] button').count(), '個');
  await p.fill('#fname', '個室テストビル'); await p.click('.seg[data-k=stalls] button[data-v="3"]'); await p.click('#fsave'); await p.waitForTimeout(800);
  const id = await p.evaluate(() => st.toilets.find(t => t.source === 'user').id);
  const look = () => p.evaluate(i => { const e = markers.get(i).getElement(), pi = e.querySelector('.pi'), cs = getComputedStyle(pi), ub = getComputedStyle(e.querySelector('.ub')); return { user: e.classList.contains('user'), unconf: e.classList.contains('unconf'), bg: cs.backgroundColor, dash: getComputedStyle(e.querySelector('.dash')).display, badge: ub.display }; }, id);
  console.log('2 追加した直後(未確認):', JSON.stringify(await look()));
  await p.evaluate(i => focus(i), id); await p.waitForTimeout(600);
  console.log('3 詳細のタグ:', await flat('#sbody .tags'));
  await p.click('#dx');
  // 確認: 作った人以外の 2 人以上。作った人自身・「ここにはなかった」は数えない
  const inject = (u, k) => p.evaluate(([i, uid, kind]) => { st.reports.push({ toiletId: i, kind, mine: false, uid, at: Date.now() }); refresh(); }, [id, u, k]); await p.waitForTimeout(450);
  await inject('local', 'clean'); console.log('4 作った人自身の報告:', 'unconf', (await look()).unconf);
  await inject('u1', 'missing'); console.log('5 他の人の「ここにはなかった」:', 'unconf', (await look()).unconf);
  await inject('u1', 'clean'); console.log('6 他の1人が報告:', 'unconf', (await look()).unconf, '(まだ点線のはず)');
  await inject('u1', 'crowded'); console.log('7 同じ人が重ねて報告:', 'unconf', (await look()).unconf, '(まだ点線のはず)');
  await inject('u2', 'closed'); const after = await look(); console.log('8 他の2人が報告:', JSON.stringify(after));
  await p.evaluate(i => focus(i), id); await p.waitForTimeout(600); console.log('9 詳細のタグ:', await flat('#sbody .tags')); await p.click('#dx');
  // 個室の数: 既存のトイレに教える(中央値)
  const dt = await p.evaluate(() => st.toilets.find(t => t.source === 'osm' && t.type === 'toilet').id);
  await p.evaluate(i => focus(i), dt); await p.waitForTimeout(600); await p.click('.teach summary'); await p.waitForTimeout(300);
  console.log('10 データのトイレに「個室はいくつ?」:', await p.locator('.seg.stl button').count(), '個 | 今のタグ:', await flat('#sbody .tags'));
  await p.click('.seg.stl button[data-st=stall-3]'); await p.waitForTimeout(500);
  console.log('11 自分が「3」を教えた:', await flat('#sbody .tags'), '| 押下', await p.locator('.seg.stl button[data-st=stall-3]').getAttribute('aria-pressed'));
  // 中央値(本物の報告を押すと、真似の報告が上書きされるので、計算を直接確かめる)
  const med = await p.evaluate(i => { const t = st.toilets.find(x => x.id === i), mk = ks => { st.reports = ks.map((k, n) => ({ toiletId: i, kind: k, mine: false, uid: 'v' + n, at: 0 })); return stallsOf(t); }; return { v2_5: mk(['stall-2', 'stall-5']), v2_3_5: mk(['stall-2', 'stall-3', 'stall-5']), v5_5_1: mk(['stall-5', 'stall-5', 'stall-1']), none: mk([]) }; }, dt);
  console.log('12 中央値(小さいほう):', JSON.stringify(med), '(期待: 2・5→2 / 2・3・5→3 / 5・5・1→5 / なし→null)');
  // 状態の報告と別に出せる
  await p.click('.reps:not(.lv):not(.st) button[data-k=closed]'); await p.waitForTimeout(300);
  console.log('13 状態の報告(きれい)と個室の報告は別:', await p.locator('.reps:not(.lv):not(.st) button[data-k=closed]').getAttribute('aria-pressed'));
  await p.click('#dx');
  // 凡例
  await p.click('#legendBtn').catch(() => {}); await p.waitForTimeout(300);
  console.log('14 凡例のユーザー追加の行:', await p.evaluate(() => { const r = [...document.querySelectorAll('.lrow2')].find(x => x.textContent.includes('ユーザー')); if (!r) return '(行なし)'; const pin = r.querySelector('.pin'); return { dashed: pin.classList.contains('unconf'), badge: getComputedStyle(r.querySelector('.ub')).display, text: r.textContent.trim() }; }));
  await b.close();
})();
