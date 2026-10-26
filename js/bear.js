/* くまトイ: ヒグマのマスコット(ますくん・だるま と同じく、丸い体 + 表情の切り替え)
   頭の上に寝ぐせ風の毛(ばらばらな3本)
   mood: 'normal' | 'happy' | 'worried' | 'sleep'(true は worried)。ゆれ・まばたきは CSS(.bear) */
// 寝ぐせ: 向きも長さもばらばらな毛。輪郭(太い線)を先に全部描いてから、中の色を重ねる
const BED_HAIR=['M44 17C40 10 42 6 48.5 4.6','M51 16C51 8 57 4 63 6.5','M57 16C62 11 68 12 70 17'];
function bearSvg(size,mood){
  const m=mood===true?'worried':(mood||'normal');
  const INK='#2a1810', FUR='#8a5530', FUR_D='#5e3820', CREAM='#f1dcb8';
  const eyes={
    normal:`<g class="eyes"><ellipse cx="35" cy="43" rx="4.2" ry="5" fill="${INK}"/><ellipse cx="65" cy="43" rx="4.2" ry="5" fill="${INK}"/><circle cx="36.4" cy="41" r="1.6" fill="#fff"/><circle cx="66.4" cy="41" r="1.6" fill="#fff"/></g>`,
    happy:`<path d="M30 45 Q35 37.5 40 45M60 45 Q65 37.5 70 45" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
    sleep:`<path d="M30 43 Q35 47 40 43M60 43 Q65 47 70 43" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/>`,
  };
  eyes.worried=eyes.normal;
  const brows=m==='worried'?`<path d="M29 35 L41 38M71 35 L59 38" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`
    :m==='normal'?`<path d="M30 35.5 Q35 33 40 35M60 35 Q65 33 70 35.5" fill="none" stroke="${FUR_D}" stroke-width="2.4" stroke-linecap="round"/>`:'';
  const mouth=m==='worried'?`<path d="M44.5 59 Q50 54.5 55.5 59" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`
    :m==='happy'?`<path d="M43 54.5 Q50 63 57 54.5Z" fill="#c4521f" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>`
    :`<path d="M43 55 Q46.5 59.5 50 54.8 Q53.5 59.5 57 55" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`;
  const extra=m==='worried'?'<path d="M78 30c3 4 4 7 4 9a4 4 0 0 1-8 0c0-2 1-5 4-9z" fill="#8fd3f4" stroke="#4aa3d0" stroke-width="1"/>'
    :m==='sleep'?`<g fill="${FUR_D}" font-family="sans-serif" font-weight="800"><text x="82" y="9" font-size="8">z</text><text x="89" y="5" font-size="6">z</text></g>`:'';
  return `<svg class="bear" width="${size}" height="${size}" viewBox="0 0 100 100" aria-hidden="true">
<ellipse cx="50" cy="94" rx="30" ry="4" fill="#000" opacity=".12"/>
<g stroke="${INK}" stroke-width="2.6" stroke-linejoin="round">
<ellipse cx="34" cy="89" rx="12" ry="6.5" fill="${FUR_D}"/><ellipse cx="66" cy="89" rx="12" ry="6.5" fill="${FUR_D}"/>
<circle cx="23" cy="22" r="11.5" fill="${FUR}"/><circle cx="77" cy="22" r="11.5" fill="${FUR}"/>
${BED_HAIR.map(d=>`<path d="${d}" fill="none" stroke="${INK}" stroke-width="6.6" stroke-linecap="round"/>`).join('')}${BED_HAIR.map(d=>`<path d="${d}" fill="none" stroke="${FUR_D}" stroke-width="3.4" stroke-linecap="round"/>`).join('')}
<path d="M50 13C77 13 91 33 91 58 91 80 75 91 50 91 25 91 9 80 9 58 9 33 23 13 50 13Z" fill="${FUR}"/>
<ellipse cx="9.5" cy="65" rx="6" ry="10.5" transform="rotate(14 9.5 65)" fill="${FUR}"/><ellipse cx="90.5" cy="65" rx="6" ry="10.5" transform="rotate(-14 90.5 65)" fill="${FUR}"/>
</g>
<circle cx="23" cy="23" r="5.6" fill="#f2b8a0"/><circle cx="77" cy="23" r="5.6" fill="#f2b8a0"/>
<ellipse cx="50" cy="76" rx="25" ry="15" fill="${CREAM}"/>
<ellipse cx="28" cy="53" rx="6.5" ry="3.8" fill="#ff8f7a" opacity=".55"/><ellipse cx="72" cy="53" rx="6.5" ry="3.8" fill="#ff8f7a" opacity=".55"/>
<ellipse cx="50" cy="52" rx="14" ry="10.5" fill="${CREAM}"/>
<ellipse cx="50" cy="47.5" rx="5" ry="3.4" fill="${INK}"/><ellipse cx="48.8" cy="46.4" rx="1.5" ry=".9" fill="#fff" opacity=".7"/>
${brows}${eyes[m]}${mouth}${extra}
</svg>`;
}
