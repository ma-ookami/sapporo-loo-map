// 運営画面(admin.html)の確認。Firebase は偽物(メモリ上)に差し替える: node tools/test-admin.js [out.png]
const { chromium } = require('../../taskline/node_modules/playwright-core');
const FAKE = () => {
  const mk = ms => ({ toMillis: () => ms, toDate: () => new Date(ms) });
  const store = { 'loo-requests': {}, 'loo-toilets': {} }, subs = [];
  const emit = () => subs.forEach(s => s());
  const snap = n => ({ docs: Object.entries(store[n]).map(([id, d]) => ({ id, data: () => d })) });
  const near = window.__near;
  store['loo-requests'].AAAAAAAAAAAAAAAAAAAA = { name: '新しい店のトイレ', lat: near.lat + 0.00005, lng: near.lng, fee: false, wheelchair: true, floor: 2, ease: null, find: null, type: 'toilet', brand: null, loan: null, note: '2階の奥', uid: 'userAAAA1111', createdAt: mk(Date.now() - 60000) };
  store['loo-requests'].BBBBBBBBBBBBBBBBBBBB = { name: 'いたずら', lat: 43.0600, lng: 141.3500, fee: null, wheelchair: null, floor: null, ease: null, find: null, type: 'toilet', brand: null, loan: null, note: 'ここ', uid: 'userBBBB2222', createdAt: mk(Date.now() - 30000) };
  window.__store = store;
  const coll = n => ({ onSnapshot(cb) { const f = () => cb(snap(n)); subs.push(f); f(); return () => { subs.splice(subs.indexOf(f), 1); }; }, doc: id => ({ _n: n, _id: id, delete: async () => { delete store[n][id]; emit(); } }) });
  const fs = () => ({ collection: coll, batch: () => { const ops = []; return { set: (r, d) => ops.push(() => { store[r._n][r._id] = d; }), delete: r => ops.push(() => { delete store[r._n][r._id]; }), commit: async () => { ops.forEach(o => o()); emit(); } }; } });
  fs.FieldValue = { serverTimestamp: () => 0 };
  let cb; const user = { email: 'admin@example.com', isAnonymous: false };
  const auth = () => ({ onAuthStateChanged: f => { cb = f; setTimeout(() => f(user), 50); }, signOut: async () => cb(null) });
  auth.GoogleAuthProvider = function () {};
  window.firebase = { initializeApp() {}, auth, firestore: fs };
};
(async () => {
  const b = await chromium.launch({ executablePath: require('./browser.js'), args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ locale: 'ja-JP', viewport: { width: 900, height: 900 } });
  await ctx.route(/gstatic\.com\/firebasejs/, r => r.fulfill({ contentType: 'text/javascript', body: '' }));
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message)); p.on('dialog', d => d.accept());
  const near = await (async () => { const q = await ctx.newPage(); await q.goto('file:///C:/Users/masaya/dev/sapporo-loo-web/data/toilets.js'); const t = await q.evaluate(() => document.body.innerText.match(/"lat": ([\d.]+),\s+"lng": ([\d.]+)/)); await q.close(); return { lat: +t[1], lng: +t[2] }; })();
  await p.addInitScript(n => { window.__near = n; }, near);
  await p.addInitScript('(' + FAKE.toString() + ')()');
  await p.goto('file:///C:/Users/masaya/dev/sapporo-loo-web/admin.html'); await p.waitForTimeout(2500);
  console.log('1 申請の数', await p.locator('#pending .card').count(), '| 近くの重複の表示', await p.locator('#pending .near.warn').count());
  if (process.argv[2]) await p.locator('#pending').screenshot({ path: process.argv[2] });
  // 編集して許可(名前を直す)
  await p.fill('#pending .card:nth-child(1) [data-k=name]', '新しい店のトイレ(直した)');
  await p.click('#pending .card:nth-child(1) [data-a=approve]'); await p.waitForTimeout(400);
  const s = await p.evaluate(() => JSON.stringify({ req: Object.keys(__store['loo-requests']), toi: Object.entries(__store['loo-toilets']).map(([id, d]) => ({ id, ...d, createdAt: !!d.createdAt })) }));
  console.log('2 許可後', s);
  await p.click('#pending .card:nth-child(1) [data-a=reject]'); await p.waitForTimeout(400);
  console.log('3 却下後の申請', await p.evaluate(() => Object.keys(__store['loo-requests']).length), '| 画面', await p.locator('#pending').innerText());
  await p.click('#added [data-a=del]'); await p.waitForTimeout(300);
  console.log('4 公開中を削除', await p.evaluate(() => Object.keys(__store['loo-toilets']).length));
  await b.close();
})();
