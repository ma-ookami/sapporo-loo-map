// 地図の文字(日本語/English)の確認: node tools/test-lang.js
const { chromium } = require('../../taskline/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', args: ['--enable-unsafe-swiftshader','--ignore-gpu-blocklist'] });
  const p = await (await b.newContext({ locale: 'ja-JP', viewport: { width: 390, height: 780 }, colorScheme: 'light' })).newPage();
  p.on('pageerror', e => console.log('ERR', e.message));
  await p.addInitScript(() => localStorage.setItem('loo-guide', '1'));
  await p.goto('file:///C:/Users/masaya/dev/sapporo-loo-web/index.html?local=1'); await p.waitForTimeout(5000);
  const info = () => p.evaluate(() => { const ids = labelLayers; const tf = ids.map(i => JSON.stringify(map.getLayoutProperty(i, 'text-field'))); return { n: ids.length, first: tf[0], anyEn: tf.some(s => s.includes('name_en')), anyJa: tf.some(s => s.includes('name:ja')), bilingual: map.getStyle().layers.filter(l => l.type === 'symbol' && map.getLayoutProperty(l.id, 'visibility') !== 'none' && /name:latin\W*,.*name:nonlatin|name:nonlatin/.test(JSON.stringify(map.getLayoutProperty(l.id, 'text-field') || ''))).map(l => l.id) }; });
  const ja = await info(); console.log('1 日本語:', ja.n, 'layers | en used:', ja.anyEn, '| ja used:', ja.anyJa, '| visible bilingual layers:', ja.bilingual.length);
  await p.click('#info'); await p.click('.seg[data-s=lang] button[data-v=en]'); await p.waitForTimeout(500);
  const en = await info(); console.log('2 English:', 'en used:', en.anyEn, '| ja used:', en.anyJa, '|', en.first);
  await p.reload(); await p.waitForTimeout(5000);
  const en2 = await info(); console.log('3 reload keeps English:', en2.anyEn && !en2.anyJa);
  await b.close();
})();
