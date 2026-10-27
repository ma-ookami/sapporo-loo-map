// コンビニ貸し出しの決め方(2 人以上・90 日): node tools/test-loan-rule.js [out.png]
const { chromium } = require('../../taskline/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: require('./browser.js'), args: ['--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ locale: 'ja-JP', viewport: { width: 390, height: 780 }, deviceScaleFactor: 2, hasTouch: true, geolocation: { latitude: 43.0545, longitude: 141.3530 }, permissions: ['geolocation'] });
  await ctx.addInitScript(() => localStorage.setItem('loo-guide', '1'));
  const p = await ctx.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file:///C:/Users/masaya/dev/sapporo-loo-web/index.html?local=1'); await p.waitForTimeout(4000);
  const r = await p.evaluate(() => {
    const t = st.toilets.find(x => x.type === 'conv'), D = 86400000, now = Date.now(), out = {};
    const rp = (k, ago) => st.reports.push({ toiletId: t.id, kind: k, mine: false, uid: 'u' + Math.random(), at: now - ago * D });
    st.reports = []; out.zero = loanOf(t);
    rp('loan-yes', 1); out.one = loanOf(t);
    rp('loan-yes', 2); out.twoYes = loanOf(t);
    st.reports = []; rp('loan-yes', 100); rp('loan-yes', 120); out.twoOld = loanOf(t);
    rp('loan-no', 3); out.oldPlusOne = loanOf(t);
    rp('loan-no', 4); out.twoNoFresh = loanOf(t);
    st.reports = []; rp('loan-yes', 1); rp('loan-no', 1); out.tie = loanOf(t);
    st.reports = []; rp('loan-yes', 1); rp('loan-yes', 1); rp('loan-no', 1); out.majority = loanOf(t);
    st.reports = []; rp('loan-yes', 1); refresh(); focus(t.id); out.id = t.id;
    return out;
  });
  console.log(JSON.stringify(r));
  await p.waitForTimeout(800); console.log('note:', (await p.locator('.repnote').innerText()).replace(/\s+/g, ' '));
  if (process.argv[2]) await p.locator('#sheet, .sheet').first().screenshot({ path: process.argv[2] });
  await b.close();
})();
