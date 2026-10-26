// 英語表示の確認: node tools/test-i18n.js
//   1. 端末の言語が英語なら、初めから英語。日本語なら日本語
//   2. 英語のとき、主な画面に日本語が残っていない(場所の名前など translate="no" の部分は除く)
//   3. 設定の「言語 / Language」で切り替えられ、地図の文字も切り替わる
//   画面の写真(tools/shot-en-*.png)も撮る
const { chromium } = require('../../taskline/node_modules/playwright-core');
(async () => {
  const b = await chromium.launch({ executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe', args: ['--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const url = 'file:///C:/Users/masaya/dev/sapporo-loo-web/index.html?local=1';
  const near = { geolocation: { latitude: 43.0545, longitude: 141.3530 }, permissions: ['geolocation'] };
  const mk = async (locale, guideSeen, extra) => {
    const c = await b.newContext(Object.assign({ viewport: { width: 390, height: 780 }, locale }, near, extra || {}));
    if (guideSeen) await c.addInitScript(() => localStorage.setItem('loo-guide', '1'));
    const p = await c.newPage(); p.on('pageerror', e => console.log('ERR', e.message)); p.on('dialog', d => d.dismiss());
    await p.goto(url); await p.waitForTimeout(4500);
    return p;
  };
  // 日本語が残っている文字(translate="no" の中は除く)を探す
  const leftovers = p => p.evaluate(() => {
    const hasJa = s => { for (const ch of s) { const k = ch.charCodeAt(0); if ((k >= 0x3000 && k <= 0x30ff) || (k >= 0x4e00 && k <= 0x9fff) || (k >= 0xff00 && k <= 0xffef)) return true; } return false; };
    const out = []; const w = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (w.nextNode()) { const n = w.currentNode, el = n.parentElement; if (!el || el.closest('[translate="no"],script,style')) continue; if (hasJa(n.nodeValue) && n.nodeValue.trim() !== '日本語') out.push(n.nodeValue.trim().slice(0, 40)); }
    for (const e of document.querySelectorAll('[aria-label],[placeholder],[title]')) { if (e.closest('[translate="no"]')) continue; for (const a of ['aria-label', 'placeholder', 'title']) { const v = e.getAttribute(a); if (v && hasJa(v)) out.push(a + ':' + v.slice(0, 30)); } }
    return out;
  });
  const shot = (p, n) => p.screenshot({ path: 'tools/shot-en-' + n + '.png' });
  const check = async (p, label) => { const l = await leftovers(p); console.log((l.length ? 'NG ' : 'OK ') + label.padEnd(18), l.length ? JSON.stringify(l.slice(0, 5)) : ''); return l.length; };
  let bad = 0;

  // 1. 端末の言語
  let p = await mk('ja-JP', true);
  console.log('1a 端末が日本語 → lang', await p.evaluate(() => st.settings.lang), '| 見出し', await p.locator('#brand').innerText());
  await p.close();
  p = await mk('en-US', true);
  console.log('1b 端末が英語 → lang', await p.evaluate(() => st.settings.lang), '| 見出し', await p.locator('#brand').innerText(), '| html lang', await p.evaluate(() => document.documentElement.lang), '| title', await p.title());

  // 2. 英語の主な画面
  bad += await check(p, '起動'); await shot(p, 'home');
  await p.click('#legendBtn'); await p.waitForTimeout(300); bad += await check(p, '凡例'); await p.click('#lgx').catch(() => {});
  await p.click('[data-t=list]'); await p.waitForTimeout(500); bad += await check(p, 'リスト'); await shot(p, 'list'); await p.click('#lx');
  const un = await p.evaluate(() => st.toilets.find(t => t.floor == null && t.type === 'toilet').id);
  await p.evaluate(i => focus(i), un); await p.waitForTimeout(600); bad += await check(p, '詳細(トイレ)'); await shot(p, 'detail'); await p.click('#dx');
  const cv = await p.evaluate(() => st.toilets.find(t => t.type === 'conv').id);
  await p.evaluate(i => focus(i), cv); await p.waitForTimeout(600); bad += await check(p, '詳細(コンビニ)'); await shot(p, 'detail-conv'); await p.click('#dx');
  await p.click('#tabadd'); await p.waitForTimeout(600); bad += await check(p, '追加(場所)');
  await p.click('#pok'); await p.waitForTimeout(400); bad += await check(p, '追加(トイレ)'); await shot(p, 'add');
  await p.click('.seg[data-k=type] button[data-v=conv]'); await p.waitForTimeout(300); bad += await check(p, '追加(コンビニ)');
  await p.click('#fsave'); await p.waitForTimeout(300); bad += await check(p, '通知'); await p.click('#fback'); await p.click('#pcancel');
  await p.click('#info'); await p.waitForTimeout(400); bad += await check(p, '設定'); await shot(p, 'settings');
  await p.click('#sguide'); await p.waitForTimeout(300); bad += await check(p, '案内(設定から)'); await shot(p, 'guide');
  console.log('   案内のリンク先:', await p.locator('#guide a').first().getAttribute('href'));
  await p.close();
  p = await mk('en-US', false); bad += await check(p, '初回の案内'); await p.close();

  // 3. 設定で言語を切り替える(読み込み直して反映)
  p = await mk('en-US', true);
  const brandEn = await p.locator('#brand').innerText();
  await p.click('#info'); await p.click('.seg[data-s=lang] button[data-v=ja]'); await p.waitForTimeout(2500);
  console.log('3a 日本語に切り替え → lang', await p.evaluate(() => st.settings.lang), '| 見出し', await p.locator('#brand').innerText(), '| html lang', await p.evaluate(() => document.documentElement.lang));
  const mapJa = await p.evaluate(() => JSON.stringify(map.getLayoutProperty(labelLayers[0], 'text-field')).includes('name:ja'));
  await p.click('#info'); await p.click('.seg[data-s=lang] button[data-v=en]'); await p.waitForTimeout(2500);
  const mapEn = await p.evaluate(() => JSON.stringify(map.getLayoutProperty(labelLayers[0], 'text-field')).includes('name_en'));
  console.log('3b 英語に戻す → 見出し', await p.locator('#brand').innerText(), '(元:' + brandEn + ') | 地図の文字: 日本語時 name:ja', mapJa, '/ 英語時 name_en', mapEn);
  await b.close();
  console.log(bad ? '日本語が残っている画面あり: ' + bad : 'すべての画面で日本語の残りなし');
})();
