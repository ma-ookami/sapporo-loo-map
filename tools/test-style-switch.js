// 地図スタイルを入れ替えたあとも、日本語のみ・標識なしが保たれるかの確認: node tools/test-style-switch.js
const { chromium } = require('../../taskline/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', args: ['--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const c = await b.newContext({ locale: 'ja-JP', viewport: { width: 390, height: 780 }, colorScheme: 'light' });
  await c.addInitScript(() => localStorage.setItem('loo-guide', '1'));
  const p = await c.newPage(); p.on('pageerror', e => console.log('ERR', e.message));
  await p.goto('file:///C:/Users/masaya/dev/sapporo-loo-web/index.html?local=1'); await p.waitForTimeout(6000);
  const audit = () => p.evaluate(() => {
    const bad = [], shields = [];
    for (const l of map.getStyle().layers) {
      if (l.type !== 'symbol') continue;
      const vis = map.getLayoutProperty(l.id, 'visibility') !== 'none';
      const tf = JSON.stringify(map.getLayoutProperty(l.id, 'text-field') || '');
      if (vis && /shield/.test(l.id)) shields.push(l.id);
      if (vis && /name:latin|name_en|name:nonlatin/.test(tf)) bad.push(l.id);
    }
    return { layers: map.getStyle().layers.length, bilingualVisible: bad, shieldsVisible: shields };
  });
  const settle = async () => { for (let i = 0; i < 40; i++) { if (await p.evaluate(() => map.isStyleLoaded())) break; await p.waitForTimeout(500); } await p.waitForTimeout(1500); };
  const show=(name,r)=>console.log(r.bilingualVisible.length===0&&r.shieldsVisible.length===0?'OK ':'NG ',name,'layers',r.layers,'| 日英併記',r.bilingualVisible.length,'| 標識',r.shieldsVisible.length);
  show('起動直後',await audit());
  await p.click('#layers'); await settle();
  show('カラーへ切替後',await audit());
  await p.click('#layers'); await settle();
  show('シンプルへ戻す',await audit());
  await p.evaluate(() => setSetting('theme','dark')); await settle(); show('ダークへ',await audit());
  await b.close();
})();
