// ルールファイルの括弧の数(文字列とコメントは除く)。node tools/check-rules.js firestore.playground.rules
const fs = require('fs');
for (const f of process.argv.slice(2)) {
  const s = fs.readFileSync(f, 'utf8'); const n = s.length; let i = 0, line = 1;
  const cnt = { '{': 0, '}': 0, '(': 0, ')': 0, '[': 0, ']': 0 }; const stack = [];
  while (i < n) {
    const c = s[i];
    if (c === '\n') { line++; i++; continue; }
    if (c === '/' && s[i + 1] === '/') { while (i < n && s[i] !== '\n') i++; continue; }
    if (c === '/' && s[i + 1] === '*') { i += 2; while (i < n && !(s[i] === '*' && s[i + 1] === '/')) { if (s[i] === '\n') line++; i++; } i += 2; continue; }
    if (c === "'" || c === '"') { const q = c; i++; while (i < n && s[i] !== q && s[i] !== '\n') i++; i++; continue; }
    if (c in cnt) { cnt[c]++; if ('{(['.includes(c)) stack.push([c, line]); else { const t = stack.pop(); const want = { '}': '{', ')': '(', ']': '[' }[c]; if (!t || t[0] !== want) console.log(f, '行', line, 'で', c, 'が合わない(対応は', t, ')'); } }
    i++;
  }
  console.log(f.padEnd(40), JSON.stringify(cnt), stack.length ? '閉じていない: ' + JSON.stringify(stack.slice(-3)) : 'OK');
}
