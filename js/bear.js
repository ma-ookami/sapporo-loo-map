/* くまトイ: ヒグマのマスコット(ますくん・だるま と同じく、体の形 + 表情の切り替え)
   少しシュッとした縦長の体と、頭のとさか風の毛(3本)が特徴。
   mood: 'normal' | 'happy' | 'worried' | 'sleep'(true は worried)。ゆれ・まばたきは CSS(.bear) */
function bearSvg(size,mood){
  const m=mood===true?'worried':(mood||'normal');
  const INK='#2a1810', FUR='#8a5530', FUR_D='#5e3820', CREAM='#f1dcb8';
  const eyes={
    normal:`<g class="eyes"><ellipse cx="38" cy="44" rx="3.8" ry="4.8" fill="${INK}"/><ellipse cx="62" cy="44" rx="3.8" ry="4.8" fill="${INK}"/><circle cx="39.3" cy="42" r="1.5" fill="#fff"/><circle cx="63.3" cy="42" r="1.5" fill="#fff"/></g>`,
    happy:`<path d="M33 46 Q38 39 43 46M57 46 Q62 39 67 46" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
    sleep:`<path d="M33 44 Q38 48 43 44M57 44 Q62 48 67 44" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
  };
  eyes.worried=eyes.normal;
  const brows=m==='worried'?`<path d="M32 36 L43 39M68 36 L57 39" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`
    :m==='normal'?`<path d="M33 36.5 Q38 34 43 36M57 36 Q62 34 67 36.5" fill="none" stroke="${FUR_D}" stroke-width="2.4" stroke-linecap="round"/>`:'';
  const mouth=m==='worried'?`<path d="M45 60 Q50 55.5 55 60" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`
    :m==='happy'?`<path d="M44 55.5 Q50 63.5 56 55.5Z" fill="#c4521f" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>`
    :`<path d="M44 56 Q47 60 50 55.8 Q53 60 56 56" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
  const extra=m==='worried'?'<path d="M77 34c3 4 4 7 4 9a4 4 0 0 1-8 0c0-2 1-5 4-9z" fill="#8fd3f4" stroke="#4aa3d0" stroke-width="1"/>'
    :m==='sleep'?`<g fill="${FUR_D}" font-family="sans-serif" font-weight="800"><text x="83" y="22" font-size="10">z</text><text x="90" y="12" font-size="8">z</text></g>`:'';
  return `<svg class="bear" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">
<ellipse cx="50" cy="94.5" rx="26" ry="3.8" fill="#000" opacity=".12"/>
<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round">
<ellipse cx="38" cy="90" rx="10.5" ry="6" fill="${FUR_D}"/><ellipse cx="62" cy="90" rx="10.5" ry="6" fill="${FUR_D}"/>
<circle cx="28" cy="25" r="10.5" fill="${FUR}"/><circle cx="72" cy="25" r="10.5" fill="${FUR}"/>
<path d="M39 22Q34 13 37 6Q43 10 47 21Z" fill="${FUR_D}"/>
<path d="M44 21Q43 9 50 1.5Q57 9 56 21Z" fill="${FUR_D}"/>
<path d="M53 21Q57 11 63 6Q66 13 61 22Z" fill="${FUR_D}"/>
<path d="M50 17C73 17 85 34 85 56 85 78 73 92 50 92 27 92 15 78 15 56 15 34 27 17 50 17Z" fill="${FUR}"/>
<ellipse cx="12" cy="66" rx="5.5" ry="10.5" transform="rotate(12 12 66)" fill="${FUR}"/><ellipse cx="88" cy="66" rx="5.5" ry="10.5" transform="rotate(-12 88 66)" fill="${FUR}"/>
</g>
<circle cx="28" cy="26" r="5.2" fill="#f2b8a0"/><circle cx="72" cy="26" r="5.2" fill="#f2b8a0"/>
<ellipse cx="50" cy="77" rx="21" ry="14" fill="${CREAM}"/>
<ellipse cx="30" cy="54" rx="6" ry="3.6" fill="#ff8f7a" opacity=".55"/><ellipse cx="70" cy="54" rx="6" ry="3.6" fill="#ff8f7a" opacity=".55"/>
<ellipse cx="50" cy="53" rx="12.5" ry="10" fill="${CREAM}"/>
<ellipse cx="50" cy="48.5" rx="4.6" ry="3.2" fill="${INK}"/><ellipse cx="48.9" cy="47.5" rx="1.4" ry=".9" fill="#fff" opacity=".7"/>
${brows}${eyes[m]}${mouth}${extra}
</svg>`;
}
