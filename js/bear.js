/* くまトイ: ヒグマのマスコット(ますくん・だるま と同じく、体の形 + 表情の切り替え)
   すらっとした体(頭と細い胴を分けたシルエット)と、頭のとさか風の毛(3本)が特徴。
   mood: 'normal' | 'happy' | 'worried' | 'sleep'(true は worried)。ゆれ・まばたきは CSS(.bear) */
function bearSvg(size,mood){
  const m=mood===true?'worried':(mood||'normal');
  const INK='#2a1810', FUR='#8a5530', FUR_D='#5e3820', CREAM='#f1dcb8';
  const eyes={
    normal:`<g class="eyes"><ellipse cx="40" cy="33" rx="3.4" ry="4.3" fill="${INK}"/><ellipse cx="60" cy="33" rx="3.4" ry="4.3" fill="${INK}"/><circle cx="41.2" cy="31.3" r="1.3" fill="#fff"/><circle cx="61.2" cy="31.3" r="1.3" fill="#fff"/></g>`,
    happy:`<path d="M35.5 35 Q40 29 44.5 35M55.5 35 Q60 29 64.5 35" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>`,
    sleep:`<path d="M35.5 33 Q40 36.5 44.5 33M55.5 33 Q60 36.5 64.5 33" fill="none" stroke="${INK}" stroke-width="2.8" stroke-linecap="round"/>`,
  };
  eyes.worried=eyes.normal;
  const brows=m==='worried'?`<path d="M34 28 L45 31M66 28 L55 31" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`
    :m==='normal'?`<path d="M35 27.5 Q40 25 45 27M55 27 Q60 25 65 27.5" fill="none" stroke="${FUR_D}" stroke-width="2.2" stroke-linecap="round"/>`:'';
  const mouth=m==='worried'?`<path d="M45.5 47.5 Q50 43.5 54.5 47.5" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`
    :m==='happy'?`<path d="M45 44 Q50 51.5 55 44Z" fill="#c4521f" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`
    :`<path d="M45 44.2 Q47.5 47.8 50 43.8 Q52.5 47.8 55 44.2" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
  const extra=m==='worried'?'<path d="M79 22c2.6 3.4 3.6 6 3.6 7.8a3.6 3.6 0 0 1-7.2 0c0-1.8 1-4.4 3.6-7.8z" fill="#8fd3f4" stroke="#4aa3d0" stroke-width="1"/>'
    :m==='sleep'?`<g fill="${FUR_D}" font-family="sans-serif" font-weight="800"><text x="80" y="16" font-size="9">z</text><text x="87" y="7" font-size="7">z</text></g>`:'';
  return `<svg class="bear" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">
<ellipse cx="50" cy="96" rx="24" ry="3.2" fill="#000" opacity=".12"/>
<g stroke="${INK}" stroke-width="2.5" stroke-linejoin="round">
<ellipse cx="41" cy="92" rx="9.5" ry="5" fill="${FUR_D}"/><ellipse cx="59" cy="92" rx="9.5" ry="5" fill="${FUR_D}"/>
<path d="M34 51C29 62 32 78 35 89L65 89C68 78 71 62 66 51Z" fill="${FUR}"/>
<ellipse cx="26.5" cy="67" rx="4.6" ry="12" transform="rotate(8 26.5 67)" fill="${FUR}"/><ellipse cx="73.5" cy="67" rx="4.6" ry="12" transform="rotate(-8 73.5 67)" fill="${FUR}"/>
<circle cx="29" cy="15" r="9.5" fill="${FUR}"/><circle cx="71" cy="15" r="9.5" fill="${FUR}"/>
<path d="M39 17Q34 9 37 3Q43 7 47 16Z" fill="${FUR_D}"/>
<path d="M44 16Q43 6 50 0.8Q57 6 56 16Z" fill="${FUR_D}"/>
<path d="M53 16Q57 7 63 3Q66 9 61 17Z" fill="${FUR_D}"/>
<ellipse cx="50" cy="33" rx="26" ry="21" fill="${FUR}"/>
</g>
<circle cx="29" cy="16" r="4.6" fill="#f2b8a0"/><circle cx="71" cy="16" r="4.6" fill="#f2b8a0"/>
<ellipse cx="50" cy="69" rx="10.5" ry="14" fill="${CREAM}"/>
<ellipse cx="31.5" cy="42" rx="5" ry="3" fill="#ff8f7a" opacity=".55"/><ellipse cx="68.5" cy="42" rx="5" ry="3" fill="#ff8f7a" opacity=".55"/>
<ellipse cx="50" cy="42" rx="11" ry="8.5" fill="${CREAM}"/>
<ellipse cx="50" cy="38.5" rx="4.2" ry="2.9" fill="${INK}"/><ellipse cx="49" cy="37.6" rx="1.3" ry=".8" fill="#fff" opacity=".7"/>
${brows}${eyes[m]}${mouth}${extra}
</svg>`;
}
