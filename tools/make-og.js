// 共有用の画像(OGP): node tools/make-og.js → og.png(1200x630。bear.js のくまトイ + 文字)
const fs = require('fs'), vm = require('vm'), path = require('path');
const { chromium } = require('../../taskline/node_modules/playwright-core');
const root = path.join(__dirname, '..');
const ctx = {}; vm.createContext(ctx);
for (const f of ['js/icons.js', 'js/bear.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx);
const svg = vm.runInContext("bearSvg(1, 'happy')", ctx).replace('class="bear" width="1" height="1"', 'width="100%" height="100%"');
const html = `<body style="margin:0;width:1200px;height:630px;background:#f6e7cf;display:flex;align-items:center;font-family:'Noto Sans JP','Hiragino Sans','Yu Gothic',sans-serif;color:#1d1a17">
<div style="width:380px;height:380px;margin:0 70px 0 110px;flex:none">${svg}</div>
<div><div style="font-size:30px;color:#7b746c;font-weight:700;letter-spacing:.04em">すすきの 〜 札幌駅</div>
<div style="font-size:78px;font-weight:900;line-height:1.2;margin:10px 0 22px">札幌トイレ・<br>コンビニマップ</div>
<div style="font-size:30px;line-height:1.6;color:#4a443d">近くのトイレと、<br>トイレを借りられるコンビニを地図で探す</div></div></body>`;
(async () => {
  const b = await chromium.launch({ executablePath: require('./browser.js') });
  const p = await b.newPage({ viewport: { width: 1200, height: 630 } });
  await p.setContent(html); await p.waitForTimeout(300);
  await p.screenshot({ path: path.join(root, 'og.png') }); await b.close();
  console.log('og.png', fs.statSync(path.join(root, 'og.png')).size);
})();
