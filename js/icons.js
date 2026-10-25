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
  sliders:'<path d="M4 7h9M17 7h3M4 17h3M11 17h9"/><circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>',
  close:'<path d="M6 6l12 12M18 6 6 18"/>',
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
