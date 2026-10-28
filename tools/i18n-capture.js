// 英語表示の文言集め: 画面をひととおり操作して、辞書に無かった文言(I18N.missing)を tools/_missing.json に書く
//   node tools/i18n-capture.js   (辞書が空でも、足りないぶんを見つけられる)
const fs = require('fs'), path = require('path');
const { chromium } = require('../../taskline/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: require('./browser.js'), args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const url = 'file:///C:/Users/masaya/dev/sapporo-loo-web/index.html?local=1';
  const all = new Set();
  const mk = async (opts, seen) => {
    const c = await b.newContext(Object.assign({ viewport: { width: 390, height: 780 }, locale: 'ja-JP' }, opts));
    await c.addInitScript(([guide]) => { if (guide) localStorage.setItem('loo-guide', '1'); localStorage.setItem('loo-settings', JSON.stringify({ lang: 'en' })); }, [!seen]);
    const p = await c.newPage(); p.on('pageerror', e => console.log('ERR', e.message)); p.on('dialog', d => d.dismiss());
    await p.goto(url); await p.waitForTimeout(4500);
    return p;
  };
  const harvest = async (p, label) => { const m = await p.evaluate(() => [...I18N.missing]); m.forEach(k => all.add(k)); console.log(label.padEnd(26), 'いままでの合計', all.size); };
  const clickIf = async (p, sel) => { const l = p.locator(sel).first(); if (await l.count() && await l.isVisible().catch(() => false)) { await l.click({ timeout: 4000 }).catch(() => {}); await p.waitForTimeout(250); } };
  const near = { geolocation: { latitude: 43.0545, longitude: 141.3530 }, permissions: ['geolocation'] };

  // ---- A: すすきの近く、位置情報あり ----
  let p = await mk(near);
  await harvest(p, '起動');
  await clickIf(p, '#legendBtn'); await harvest(p, '凡例');
  await clickIf(p, '#lgx');
  for (const k of ['tonly', 'conly']) { await clickIf(p, `[data-k=${k}]`); await harvest(p, '種類 ' + k); for (const f of ['free', 'wheel', 'h24', 'conv', 'b_seven', 'b_family', 'b_lawson', 'b_seico', 'open']) await clickIf(p, `[data-f=${f}]`); await harvest(p, '絞り込み ' + k); }
  await clickIf(p, '[data-k=all]');
  await p.evaluate(() => { for (const k in st.filters) st.filters[k] = false; st.filters.tonly = true; st.filters.h24 = true; st.filters.wheel = true; refresh(); }); await p.waitForTimeout(400); await harvest(p, '該当なし');
  await p.evaluate(() => { for (const k in st.filters) st.filters[k] = false; refresh(); });
  await clickIf(p, '[data-t=list]'); await harvest(p, 'リスト'); await clickIf(p, '#lx');
  const ug = await p.evaluate(() => (st.toilets.find(t => t.floor != null && t.floor < 0 && t.type === 'toilet') || st.toilets.find(t => t.floor != null && t.floor < 0)).id);
  await p.evaluate(i => focus(i), ug); await p.waitForTimeout(500); await harvest(p, '詳細(地下の場所)'); await clickIf(p, '#dx');
  const un = await p.evaluate(() => st.toilets.find(t => t.floor == null && t.type === 'toilet').id);
  await p.evaluate(i => focus(i), un); await p.waitForTimeout(500); await harvest(p, '詳細(階が不明)');
  await clickIf(p, '.teach summary'); await clickIf(p, '.reps.lv button[data-lv=lv-ug]'); await harvest(p, '階を教えた後'); await clickIf(p, '.reps:not(.lv) button[data-k=clean]'); await harvest(p, '様子を報告'); await clickIf(p, '#go'); await clickIf(p, '#dx');
  const cv = await p.evaluate(() => st.toilets.find(t => t.type === 'conv' && t.floor == null).id);
  await p.evaluate(i => focus(i), cv); await p.waitForTimeout(500); await harvest(p, '詳細(コンビニ不明)');
  for (const k of ['loan-yes', 'loan-ask', 'loan-no']) { await clickIf(p, `.lq button[data-k=${k}]`); await harvest(p, '貸し出し ' + k); }
  await clickIf(p, '#dx');
  const cvk = await p.evaluate(() => (st.toilets.find(t => t.type === 'conv' && t.floor != null && t.floor < 0) || {}).id);
  if (cvk) { await p.evaluate(i => focus(i), cvk); await p.waitForTimeout(500); await harvest(p, '詳細(コンビニ地下)'); await clickIf(p, '#dx'); }
  // 追加: 場所 → トイレのフォーム(空で登録=通知)→ 登録
  await clickIf(p, '#tabadd'); await p.waitForTimeout(500); await harvest(p, '追加(場所)');
  await clickIf(p, '#pok'); await harvest(p, '追加(トイレ)'); await clickIf(p, '#fsave'); await harvest(p, '通知: 名前なし');
  await p.fill('#fname', '英語テストビル'); await clickIf(p, '.seg[data-k=stalls] button[data-v="3"]'); await clickIf(p, '.seg[data-k=floor] button[data-v="-1"]'); await clickIf(p, '#fsave'); await p.waitForTimeout(600); await harvest(p, '登録(トイレ)');
  await clickIf(p, '#tabadd'); await p.waitForTimeout(500); await clickIf(p, '#pok'); await clickIf(p, '.seg[data-k=type] button[data-v=conv]'); await harvest(p, '追加(コンビニ)');
  await clickIf(p, '#fsave'); await harvest(p, '通知: ブランドなし'); await clickIf(p, '.seg[data-k=brand] button[data-v=seven]'); await clickIf(p, '#fsave'); await harvest(p, '通知: 貸し出しなし');
  await clickIf(p, '.seg[data-k=loan] button[data-v=ask]'); await clickIf(p, '#fsave'); await p.waitForTimeout(600); await harvest(p, '登録(コンビニ)');
  // 自分の追加を詳細で開く(削除)/ ほかの人の追加として開く(「なかった」の報告)
  const mine = await p.evaluate(() => st.toilets.find(t => t.source === 'user').id);
  await p.evaluate(i => focus(i), mine); await p.waitForTimeout(500); await harvest(p, '詳細(自分の追加)'); await clickIf(p, '#del'); await harvest(p, '削除の確認');
  await p.evaluate(() => { const t = st.toilets.find(x => x.source === 'user'); if (t) { t.mine = false; focus(t.id); } }); await p.waitForTimeout(500); await harvest(p, '詳細(他人の追加)'); await clickIf(p, '#miss'); await harvest(p, '「なかった」報告後'); await clickIf(p, '#dx');
  await p.evaluate(() => { const t = st.toilets.find(x => x.source === 'user'); if (t) { st.reports.push({ toiletId: t.id, kind: 'clean', mine: false, uid: 'x1', at: 0 }, { toiletId: t.id, kind: 'clean', mine: false, uid: 'x2', at: 0 }); refresh(); focus(t.id); } }); await p.waitForTimeout(500); await harvest(p, '詳細(確認済み)'); await clickIf(p, '#dx');
  // 設定
  await clickIf(p, '#info'); await harvest(p, '設定');
  for (const sel of ['.seg[data-s=theme] button[data-v=light]', '.seg[data-s=theme] button[data-v=auto]', '.seg[data-s=pace] button[data-v="100"]', '.seg[data-s=pace] button[data-v="80"]', '.sw[data-s=vibrate]', '.sw[data-s=nearConv]', '.sw[data-s=showUnknown]', '.seg[data-s=mapColor] button[data-v=color]', '.seg[data-s=mapColor] button[data-v=simple]']) await clickIf(p, sel);
  await harvest(p, '設定を操作'); await clickIf(p, '#sreset'); await harvest(p, '消す確認');
  await clickIf(p, '[data-del]'); await clickIf(p, '#sguide'); await harvest(p, '案内(設定から)');
  await p.close();

  // ---- B: 遠い場所(すすきのから離れている) ----
  p = await mk({ geolocation: { latitude: 42.7752, longitude: 141.6923 }, permissions: ['geolocation'] });
  await harvest(p, '遠い場所'); await clickIf(p, '#info'); await harvest(p, '設定(遠い)'); await p.close();

  // ---- C: 位置情報なし ----
  p = await mk({});
  await clickIf(p, '#here'); await p.waitForTimeout(1500); await harvest(p, '位置情報なし(通知)');
  await clickIf(p, '#info'); await harvest(p, '設定(位置情報なし)'); await p.close();

  // ---- D: 初回(案内が出る) ----
  p = await mk(near, true);
  await harvest(p, '初回の案内'); await p.close();

  await b.close();
  const out = [...all].sort();
  fs.writeFileSync(path.join(__dirname, '_missing.json'), JSON.stringify(out, null, 1));
  console.log('辞書に無い文言', out.length, '件を tools/_missing.json に書いた');
})();
