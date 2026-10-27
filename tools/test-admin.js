// 運営画面(admin-fb7f2a3ee7b49e6613.html)の確認。Firebase は偽物(メモリ上)に差し替える: node tools/test-admin.js [out.png]
const { chromium } = require('../../taskline/node_modules/playwright-core');
const FAKE = () => {
  const mk = ms => ({ toMillis: () => ms, toDate: () => new Date(ms) });
  const store = { 'loo-requests': {}, 'loo-toilets': {}, 'loo-admins': {}, 'loo-reports': {}, 'loo-rejects': {}, 'loo-blocked': {}, 'loo-hidden': {} }, subs = [];
  const emit = () => subs.forEach(s => s());
  const snap = n => ({ docs: Object.entries(store[n]).map(([id, d]) => ({ id, data: () => d })) });
  const near = window.__near;
  store['loo-requests'].AAAAAAAAAAAAAAAAAAAA = { name: '新しい店のトイレ', lat: near.lat + 0.00005, lng: near.lng, fee: false, wheelchair: true, floor: 2, ease: null, find: null, type: 'toilet', brand: null, loan: null, note: '2階の奥', uid: 'userAAAA1111', createdAt: mk(Date.now() - 60000) };
  store['loo-requests'].BBBBBBBBBBBBBBBBBBBB = { name: 'いたずら', lat: 43.0600, lng: 141.3500, fee: null, wheelchair: null, floor: null, ease: null, find: null, type: 'toilet', brand: null, loan: null, note: 'ここ', uid: 'userBBBB2222', createdAt: mk(Date.now() - 30000) };
  ['a', 'b', 'c'].forEach(u => { store['loo-reports']['u-AAAAAAAAAAAAAAAAAAAA_' + u] = { toiletId: 'u-AAAAAAAAAAAAAAAAAAAA', kind: 'missing', uid: u }; });
  store['loo-admins'].otherDevice123 = { code: 'x', createdAt: mk(Date.now() - 5 * 86400000), lastSeen: mk(Date.now() - 3 * 3600000) };
  store['loo-requests'].CCCCCCCCCCCCCCCCCCCC = { name: 'いたずら2', lat: 43.0601, lng: 141.3501, fee: null, wheelchair: null, floor: null, ease: null, find: null, type: 'toilet', brand: null, loan: null, note: '', uid: 'userBBBB2222', createdAt: mk(Date.now() - 20000) };
  window.__store = store; window.__emit = emit; window.__mk = mk;
  const coll = n => ({ get: async () => snap(n), where: () => coll(n), onSnapshot(cb) { const f = () => cb(snap(n)); subs.push(f); f(); return () => { subs.splice(subs.indexOf(f), 1); }; }, doc: id => ({ _n: n, _id: id, get: async () => ({ exists: id in store[n] }), update: async d => { if (id in store[n]) { store[n][id] = { ...store[n][id], ...d }; emit(); } }, set: async d => { if (n === 'loo-admins' && d.code !== 'good-code') { const e = new Error('denied'); e.code = 'permission-denied'; throw e; } store[n][id] = d; emit(); }, delete: async () => { delete store[n][id]; emit(); } }) });
  const fs = () => ({ collection: coll, batch: () => { const ops = []; return { set: (r, d) => ops.push(() => { store[r._n][r._id] = d; }), delete: r => ops.push(() => { delete store[r._n][r._id]; }), commit: async () => { ops.forEach(o => o()); emit(); } }; } });
  fs.FieldValue = { serverTimestamp: () => mk(Date.now()) }; fs.Timestamp = { fromMillis: ms => mk(ms) };
  let cb; const user = { uid: 'anonA', isAnonymous: true };
  const auth = () => ({ onAuthStateChanged: f => { cb = f; setTimeout(() => f(null), 20); }, signInAnonymously: async () => { setTimeout(() => cb(user), 20); } });
  window.firebase = { initializeApp() {}, auth, firestore: fs };
};
(async () => {
  const b = await chromium.launch({ executablePath: require('./browser.js'), args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ locale: 'ja-JP', viewport: { width: +(process.env.W || 1280), height: +(process.env.H || 900) }, deviceScaleFactor: process.env.W ? 2 : 1 });
  await ctx.route(/gstatic\.com\/firebasejs/, r => r.fulfill({ contentType: 'text/javascript', body: '' }));
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message)); p.on('dialog', d => d.accept());
  const near = await (async () => { const q = await ctx.newPage(); await q.goto('file:///C:/Users/masaya/dev/sapporo-loo-web/data/toilets.js'); const t = await q.evaluate(() => document.body.innerText.match(/"lat": ([\d.]+),\s+"lng": ([\d.]+)/)); await q.close(); return { lat: +t[1], lng: +t[2] }; })();
  await p.addInitScript(n => { window.__near = n; }, near);
  await p.addInitScript('(' + FAKE.toString() + ')()');
  await p.goto('file:///C:/Users/masaya/dev/sapporo-loo-web/admin-fb7f2a3ee7b49e6613.html'); await p.waitForTimeout(2000);
  console.log('0 合言葉の入力欄', await p.locator('#code').count(), '| 申請はまだ見えない', await p.locator('#pending .card').count());
  if (process.argv[3]) await p.screenshot({ path: process.argv[3], fullPage: false });
  await p.fill('#code', 'wrong'); await p.click('#enter'); await p.waitForTimeout(500);
  console.log('0b 違う合言葉', await p.locator('#msg').innerText(), '| main', await p.locator('#main').isVisible());
  await p.fill('#code', 'good-code'); await p.click('#enter'); await p.waitForTimeout(2000);
  console.log('0c 正しい合言葉で入れた', await p.locator('#main').isVisible());
  console.log('1 申請の数', await p.locator('#pending .card').count(), '| 近くの重複の表示', await p.locator('#pending .near.warn').count());
  if (process.argv[2]) await p.screenshot({ path: process.argv[2] });
  console.log('1b 管理者の端末', (await p.locator('#st-admins').innerText()).replace(/\s+/g, ' '), '| 表の行', await p.locator('#admins tbody tr').count());
  if (process.env.W && process.argv[2]) for (const t of ['overview', 'pending', 'reports', 'map']) { await p.click('#nav [data-tab=' + t + ']'); await p.waitForTimeout(t === 'map' ? 2500 : 300); await p.screenshot({ path: process.argv[2].replace('.png', '-' + t + '.png') }); }
  if (process.env.W) await p.click('#nav [data-tab=pending]');
  // 編集して許可(名前を直す)
  await p.fill('#pending .card:nth-child(1) [data-k=name]', '新しい店のトイレ(直した)');
  await p.click('#pending .card:nth-child(1) [data-a=approve]'); await p.waitForTimeout(400);
  const s = await p.evaluate(() => JSON.stringify({ req: Object.keys(__store['loo-requests']), toi: Object.entries(__store['loo-toilets']).map(([id, d]) => ({ id, ...d, createdAt: !!d.createdAt })) }));
  console.log('2 許可後', s);
  // 公開中の編集
  await p.click('#added [data-a=aedit]'); await p.fill('#added [data-k=name]', '直した名前'); await p.click('#added [data-a=asave]'); await p.waitForTimeout(400);
  console.log('2b 公開中の編集', await p.evaluate(() => __store['loo-toilets'].AAAAAAAAAAAAAAAAAAAA.name + ' approved=' + __store['loo-toilets'].AAAAAAAAAAAAAAAAAAAA.approved));
  // 絞り込み・並べ替え(番号は変わらない)
  await p.fill('#q-pend', 'いたずら2'); await p.waitForTimeout(200);
  console.log('2c 絞り込み', await p.locator('#pending .card').count(), '番号', await p.locator('#pending .num').allInnerTexts());
  await p.fill('#q-pend', ''); await p.selectOption('#s-pend', 'new'); await p.waitForTimeout(200);
  console.log('2d 新しい順の番号', await p.locator('#pending .num').allInnerTexts());
  // 新着の知らせ
  await p.evaluate(() => { __store['loo-requests'].DDDDDDDDDDDDDDDDDDDD = { name: '新着', lat: 43.05, lng: 141.35, fee: null, wheelchair: null, floor: null, ease: null, find: null, type: 'toilet', brand: null, loan: null, note: '', uid: 'userEEEE', createdAt: __mk(Date.now()) }; __emit(); }); await p.waitForTimeout(300);
  console.log('2e 新着の知らせ', await p.locator('#newbar').isVisible(), (await p.locator('#newbar').innerText()), '| title', await p.title());
  await p.evaluate(() => { delete __store['loo-requests'].DDDDDDDDDDDDDDDDDDDD; __emit(); }); await p.selectOption('#s-pend', 'old'); await p.waitForTimeout(200);
  // 却下(記録が残る)
  await p.click('#pending .card:nth-child(1) [data-a=reject]'); await p.waitForTimeout(400);
  console.log('3 却下', await p.evaluate(() => Object.keys(__store['loo-requests']).join(',') + ' | rejects ' + Object.keys(__store['loo-rejects']).length));
  // ブロック(同じ申請者の申請中も却下)
  console.log('3b 履歴の表示', (await p.locator('#pending .card:nth-child(1) .sub').nth(1).innerText()).replace(/\s+/g, ' '));
  await p.click('#pending .card:nth-child(1) [data-a=block]'); await p.waitForTimeout(400);
  console.log('3c ブロック後', await p.evaluate(() => 'req ' + Object.keys(__store['loo-requests']).length + ' blocked ' + Object.keys(__store['loo-blocked']).join(',') + ' rejects ' + Object.keys(__store['loo-rejects']).length), '| 画面', (await p.locator('#blocked').innerText()).replace(/\s+/g, ' '));
  await p.click('#blocked [data-a=unblock]'); await p.waitForTimeout(300);
  console.log('3d 解除', await p.evaluate(() => Object.keys(__store['loo-blocked']).length));
  console.log('4 「なかった」の一覧', (await p.locator('#missing').innerText()).replace(/\s+/g, ' '));
  await p.click('#missing [data-a=mdel]'); await p.waitForTimeout(300);
  // 公開データの非表示(「なかった」3 人)
  await p.evaluate(() => { const id = TOILETS.find(t => t.type === 'toilet').id; ['a', 'b', 'c'].forEach(u => { __store['loo-reports'][id + '_' + u] = { toiletId: id, kind: 'missing', uid: u }; }); __emit(); }); await p.waitForTimeout(300);
  await p.click('#missing [data-a=mhide]'); await p.waitForTimeout(300);
  console.log('4b 非表示', await p.evaluate(() => Object.keys(__store['loo-hidden']).length), '| 一覧', (await p.locator('#hidden').innerText()).replace(/\s+/g, ' ').slice(0, 40));
  await p.click('#hidden [data-a=unhide]'); await p.waitForTimeout(300);
  console.log('4c 戻す', await p.evaluate(() => Object.keys(__store['loo-hidden']).length));
  // バックアップと復元(公開中のトイレを 1 件用意して)
  await p.evaluate(() => { __store['loo-toilets'].AAAAAAAAAAAAAAAAAAAA = { name: '復元テスト', lat: 43.05, lng: 141.35, fee: false, wheelchair: null, floor: 1, ease: null, find: null, type: 'toilet', brand: null, loan: null, note: '', uid: 'userAAAA1111', createdAt: __mk(1700000000000), approved: true }; __emit(); }); await p.waitForTimeout(200);
  const [dl] = await Promise.all([p.waitForEvent('download'), p.click('#bk-save')]); const path = require('path').join(require('os').tmpdir(), 'bk-test.json'); await dl.saveAs(path);
  const bj = JSON.parse(require('fs').readFileSync(path, 'utf8'));
  console.log('6 バックアップ', dl.suggestedFilename(), '| 件数', Object.entries(bj.collections).map(([k, v]) => k.replace('loo-', '') + ':' + v.length).join(' '), '| 時刻の形', JSON.stringify(bj.collections['loo-toilets'][0].data.createdAt), '| 合言葉を含まない', !JSON.stringify(bj).includes('good-code'));
  console.log('6b 表示', await p.locator('#bkn').innerText(), '|', (await p.locator('#bk-info').innerText()).slice(0, 40));
  await p.evaluate(() => { delete __store['loo-toilets'].AAAAAAAAAAAAAAAAAAAA; __emit(); }); await p.waitForTimeout(200);
  await p.setInputFiles('#bk-file', path); await p.waitForTimeout(600);
  console.log('6c 復元', await p.evaluate(() => Object.keys(__store['loo-toilets']).join(',') + ' createdAtが時刻型=' + (typeof __store['loo-toilets'].AAAAAAAAAAAAAAAAAAAA.createdAt.toMillis)));
  console.log('5 そこから削除', await p.evaluate(() => Object.keys(__store['loo-toilets']).length), '| 一覧', (await p.locator('#missing').innerText()).replace(/\s+/g, ' '));
  await b.close();
})();
