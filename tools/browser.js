// テストで使うブラウザ。環境変数 LOO_BROWSER で指定できる。無ければ Chrome → Edge の順で、あるものを使う
const fs = require('fs');
const C = ['C:/Program Files/Google/Chrome/Application/chrome.exe', 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'];
module.exports = process.env.LOO_BROWSER || C.find(p => fs.existsSync(p));
