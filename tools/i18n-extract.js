// コードと HTML に書いてある日本語の文言を抜き出す(辞書の漏れ探し用): node tools/i18n-extract.js [--missing]
//   既定: 全部の文言を JSON で tools/_strings.json に書く
//   --missing: 辞書(js/i18n-en.js)に無いものだけ表示する
const fs = require('fs'), path = require('path'), vm = require('vm');
const root = path.join(__dirname, '..');
const hasJa = s => { for (const ch of s) { const k = ch.charCodeAt(0); if ((k >= 0x3000 && k <= 0x30ff) || (k >= 0x4e00 && k <= 0x9fff) || (k >= 0xff00 && k <= 0xffef)) return true; } return false; };
// 辞書と同じ正規化(js/i18n.js の norm を使う)
const ctx = { window: { confirm: () => true }, st: { settings: { lang: 'en' } }, document: {}, NodeFilter: {}, MutationObserver: function () {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/i18n.js'), 'utf8') + ';this.I18N=I18N', ctx);
vm.runInContext(fs.readFileSync(path.join(root, 'js/i18n-en.js'), 'utf8'), ctx);
const norm = s => ctx.I18N.norm(s).key;

// JS: 文字列('…' "…" `…`)を取り出す。コメントは飛ばす。テンプレートは ${…} の外の文字だけ
function jsStrings(src) {
  const out = []; let i = 0; const n = src.length;
  const readTemplate = () => { // 先頭の ` の次から。${…} は入れ子を数えて飛ばす
    let seg = ''; const segs = [];
    while (i < n) {
      const c = src[i];
      if (c === '`') { i++; break; }
      if (c === String.fromCharCode(92)) { seg += src[i + 1]; i += 2; continue; }
      if (c === '$' && src[i + 1] === '{') {
        segs.push(seg); seg = ''; i += 2; let d = 1;
        while (i < n && d > 0) { const e = src[i]; if (e === '{') d++; else if (e === '}') d--; else if (e === "'" || e === '"') { const q = e; i++; let s2 = ''; while (i < n && src[i] !== q) { if (src[i] === String.fromCharCode(92)) { s2 += src[i + 1]; i += 2; } else s2 += src[i++]; } out.push(s2); } else if (e === '`') { i++; readTemplate(); continue; } i++; }
        continue;
      }
      seg += c; i++;
    }
    segs.push(seg); for (const s of segs) out.push(s);
  };
  while (i < n) {
    const c = src[i];
    if (c === '/' && src[i + 1] === '/') { while (i < n && src[i] !== String.fromCharCode(10)) i++; continue; }
    if (c === '/' && src[i + 1] === '*') { i += 2; while (i < n && !(src[i] === '*' && src[i + 1] === '/')) i++; i += 2; continue; }
    if (c === "'" || c === '"') { const q = c; i++; let s = ''; while (i < n && src[i] !== q && src[i] !== String.fromCharCode(10)) { if (src[i] === String.fromCharCode(92)) { s += src[i + 1]; i += 2; } else s += src[i++]; } i++; out.push(s); continue; }
    if (c === '`') { i++; readTemplate(); continue; }
    i++;
  }
  return out;
}
// HTML 断片(タグ入り)から、タグの外の文字と、aria-label / placeholder / title を取り出す
function htmlTexts(s) {
  const out = [];
  if (!s.includes('<') && !s.includes('=')) return [s];
  let i = 0, text = '';
  while (i < s.length) {
    if (s[i] === '<') {
      if (text.trim()) out.push(text); text = '';
      let j = i; while (j < s.length && s[j] !== '>') j++;
      const tag = s.slice(i, j + 1);
      for (const a of ['aria-label', 'placeholder', 'title']) { const k = tag.indexOf(a + '="'); if (k >= 0) { const e = tag.indexOf('"', k + a.length + 2); out.push(tag.slice(k + a.length + 2, e)); } }
      i = j + 1; continue;
    }
    text += s[i++];
  }
  if (text.trim()) out.push(text);
  return out;
}
const found = new Map(); // key → 出どころ
const add = (s, where) => { if (!hasJa(s)) return; const k = norm(s); if (!k.trim()) return; if (!found.has(k)) found.set(k, where); };
for (const f of fs.readdirSync(path.join(root, 'js'))) {
  if (f === 'i18n.js' || f === 'i18n-en.js' || !f.endsWith('.js')) continue;
  for (const s of jsStrings(fs.readFileSync(path.join(root, 'js', f), 'utf8'))) for (const t of htmlTexts(s)) add(t, 'js/' + f);
}
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
for (const t of htmlTexts(html.slice(html.indexOf('<body'))).concat(htmlTexts(html.slice(0, html.indexOf('</head>'))))) add(t, 'index.html');
// データ由来の名前や、辞書に入れない記号だけの行は、手で除く
const keys = [...found.keys()];
if (process.argv.includes('--missing')) {
  const miss = keys.filter(k => ctx.I18N.en[k] === undefined);
  console.log(miss.length + ' 件が辞書に無い(全部 ' + keys.length + ' 件)');
  for (const k of miss) console.log(JSON.stringify(k) + '  <- ' + found.get(k));
} else {
  fs.writeFileSync(path.join(__dirname, '_strings.json'), JSON.stringify(keys.map(k => [k, found.get(k)]), null, 1));
  console.log(keys.length + ' 件を tools/_strings.json に書いた');
}
