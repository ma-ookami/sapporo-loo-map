// index.html から読み込む css / js / データ / 画像 の ?v= を、各ファイルの中身のハッシュにそろえる。
// 変えたファイルだけ印が変わるので、ほかのファイルはキャッシュがそのまま効き、変えたファイルは必ず新しく読まれる。
// 使い方: node tools/stamp.js  (コミットの前に実行。.git/hooks/pre-commit からも呼ばれる)
const fs = require('fs'), path = require('path'), crypto = require('crypto');
const root = path.join(__dirname, '..'), file = path.join(root, 'index.html');
const EXT = ['.js', '.css', '.webmanifest', '.png'];
let n = 0;
// 属性の値("..." の中身)だけを順に見る。引用符で割ると、奇数番目が値になる
const parts = fs.readFileSync(file, 'utf8').split('"');
for (let i = 1; i < parts.length; i += 2) {
  const prev = parts[i - 1];
  if (!(prev.endsWith('src=') || prev.endsWith('href='))) continue;
  const url = parts[i].split('?')[0];
  if (/^(https?:)?\/\//.test(url) || !EXT.includes(path.extname(url))) continue;
  const p = path.join(root, url);
  if (!fs.existsSync(p)) continue;
  const h = crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex').slice(0, 8);
  parts[i] = `${url}?v=${h}`; n++;
}
fs.writeFileSync(file, parts.join('"'));
console.log('stamped', n, 'files');
