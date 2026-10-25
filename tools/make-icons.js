// アイコン生成: node tools/make-icons.js(bear.js の SVG を Edge で撮影して icon-*.png / apple-touch-icon.png / Expo 版 assets を作る)
const fs = require('fs'), vm = require('vm'), cp = require('child_process'), path = require('path');
const root = path.join(__dirname, '..');
const ctx = {}; vm.createContext(ctx);
for (const f of ['js/icons.js', 'js/bear.js']) vm.runInContext(fs.readFileSync(path.join(root, f), 'utf8'), ctx);
const svg = vm.runInContext("bearSvg(1, 'happy')", ctx).replace('class="bear" width="1" height="1"', 'width="100%" height="100%"');
const html = n => `<body style="margin:0;background:#f6e7cf;width:${n}px;height:${n}px;display:grid;place-items:center"><div style="width:${n*0.78}px;height:${n*0.78}px">${svg}</div></body>`;
const edge = 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe';
const out = [[1024, 'icon-1024.png'], [512, 'icon-512.png'], [192, 'icon-192.png'], [180, 'apple-touch-icon.png']];
for (const [n, name] of out) {
  const h = path.join(__dirname, `_i${n}.html`); fs.writeFileSync(h, html(n));
  cp.spawnSync(edge, ['--headless', '--disable-gpu', '--hide-scrollbars', `--window-size=${n},${n}`, `--screenshot=${path.join(root, name)}`, 'file:///' + h.split(path.sep).join('/')], { stdio: 'ignore' });
  fs.unlinkSync(h);
}
console.log(out.map(([, n]) => n + ':' + fs.existsSync(path.join(root, n))).join(' '));
