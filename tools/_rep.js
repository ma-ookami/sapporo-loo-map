// 共通の置換(改行が CRLF 混在でも合う): require('./_rep.js')(file, from, to)
const fs = require('fs');
module.exports = (f, a, b) => {
  const s = fs.readFileSync(f, 'utf8');
  const esc = a.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').split('\n').join('\\r?\\n');
  const re = new RegExp(esc);
  if (!re.test(s)) { console.log('MISSING', f, a.slice(0, 60)); process.exit(1); }
  fs.writeFileSync(f, s.replace(re, () => b));
};
