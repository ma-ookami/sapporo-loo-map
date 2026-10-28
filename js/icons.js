/* 細い線のアイコン(24x24)。icon('map',22) のように使う。'wc' だけ塗りのピクトグラム */
const WC_PATHS='<circle cx="7" cy="4.6" r="1.9"/><path d="M4.6 8.6h4.8c.6 0 1 .4 1 1V15H9.3v6.2H4.7V15H3.6V9.6c0-.6.4-1 1-1z"/><circle cx="17" cy="4.6" r="1.9"/><path d="M17 8.6c.6 0 1.1.4 1.3.9l2.3 6.5h-2.1v5.2h-3V16h-2.1l2.3-6.5c.2-.5.7-.9 1.3-.9z"/>';
const ICONS={
  map:'<path d="M9 4 3 6.5v13L9 17l6 3 6-2.5v-13L15 7 9 4z"/><path d="M9 4v13M15 7v13"/>',
  list:'<path d="M9 6h12M9 12h12M9 18h12"/><circle cx="4.5" cy="6" r="1"/><circle cx="4.5" cy="12" r="1"/><circle cx="4.5" cy="18" r="1"/>',
  plus:'<path d="M12 5v14M5 12h14"/>',
  locate:'<circle cx="12" cy="12" r="3.2"/><circle cx="12" cy="12" r="8"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"/>',
  arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
  check:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  chat:'<path d="M4 5.5h16v11H10l-4.5 3.5v-3.5H4z"/>',
  info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v5.5M12 7.8v.1"/>',
  gear:'<path d="M10.17 4.62L10.67 2.09L13.33 2.09L13.83 4.62L15.92 5.49L18.07 4.05L19.95 5.93L18.51 8.08L19.38 10.17L21.91 10.67L21.91 13.33L19.38 13.83L18.51 15.92L19.95 18.07L18.07 19.95L15.92 18.51L13.83 19.38L13.33 21.91L10.67 21.91L10.17 19.38L8.08 18.51L5.93 19.95L4.05 18.07L5.49 15.92L4.62 13.83L2.09 13.33L2.09 10.67L4.62 10.17L5.49 8.08L4.05 5.93L5.93 4.05L8.08 5.49Z"/><circle cx="12" cy="12" r="3"/>',
  layers:'<path d="M12 3.5l9 5-9 5-9-5z"/><path d="M3 12.5l9 5 9-5"/><path d="M3 16.5l9 5 9-5"/>',
  sliders:'<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  star:'<path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1L3.2 9.6l6.1-.8z"/>',
  close:'<path d="M6 6l12 12M18 6 6 18"/>',
  share:'<path d="M12 15V4M8 8l4-4 4 4"/><path d="M5 12v7h14v-7"/>',
  chevron:'<path d="M9 6l6 6-6 6"/>',
  store:'<path d="M4 9l1.5-4.5h13L20 9M4 9v10.5h16V9"/><path d="M4 9c0 1.6 1.2 2.5 2.7 2.5S9.4 10.6 9.4 9c0 1.6 1.2 2.5 2.6 2.5s2.6-.9 2.6-2.5c0 1.6 1.2 2.5 2.7 2.5S20 10.6 20 9"/><path d="M10 19.5v-4.5h4v4.5"/>'
};
function icon(name,size,cls){
  size=size||20;
  if (name==='wc') return `<svg class="ic ${cls||''}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">${WC_PATHS}</svg>`;
  return `<svg class="ic ${cls||''}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}
const PIN_SVG='<svg width="34" height="46" viewBox="0 0 34 46" aria-hidden="true"><path d="M17 45C17 45 3 28.5 3 17a14 14 0 0 1 28 0c0 11.5-14 28-14 28z" fill="#c4521f" stroke="#fff" stroke-width="2.5"/><circle cx="17" cy="17" r="5.2" fill="#fff"/></svg>';

// 星(5段階の評価)
const starSvg=(size)=>`<svg width="${size||22}" height="${size||22}" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 3.2l2.7 5.6 6.1.8-4.5 4.2 1.1 6.1L12 17l-5.4 2.9 1.1-6.1L3.2 9.6l6.1-.8z"/></svg>`;
const starsRow=(n,size)=>[1,2,3,4,5].map(i=>`<span class="st${i<=n?' on':''}">${starSvg(size||14)}</span>`).join('');

// ユーザーが追加した場所のバッジ(ピンの右上)
const PERSON_SVG='<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="12" cy="8" r="4.6"/><path d="M3.5 21.5c0-4.8 3.8-8.2 8.5-8.2s8.5 3.4 8.5 8.2z"/></svg>';

// 未確認のピンの内側の、細かい点線の輪
const DASH_SVG='<svg class="dash" viewBox="0 0 34 34" aria-hidden="true"><circle cx="17" cy="17" r="12.4" pathLength="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-dasharray="0.55 1.45" stroke-dashoffset="0.275" stroke-linecap="round" transform="rotate(-90 17 17)"/></svg>';
