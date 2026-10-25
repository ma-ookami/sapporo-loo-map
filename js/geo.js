/* 距離計算と表示用の整形。位置情報が取れないときの中心はすすきの交差点 */
const SUSUKINO={lat:43.0555,lng:141.3535};
const FAR_M=1500;
const BRANDS=[['seven','セブンイレブン'],['family','ファミリーマート'],['lawson','ローソン'],['seico','セイコーマート'],['other','その他']];
const LOANS=[['yes','借りられる'],['ask','声をかけて借りる'],['no','借りられない']];
const brandLabel=b=>(BRANDS.find(x=>x[0]===b)||[])[1]||'コンビニ';
const loanLabel=l=>(LOANS.find(x=>x[0]===l)||[])[1]||'';
function distanceM(a,b){
  const R=6371000, r=Math.PI/180, dLat=(b.lat-a.lat)*r, dLng=(b.lng-a.lng)*r;
  const h=Math.sin(dLat/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(h));
}
const fmtDist=m=>m<1000?`${Math.round(m/10)*10}m`:`${(m/1000).toFixed(1)}km`;
let PACE=80;   // 徒歩の速さ(m/分)。設定で変わる
const walkMin=m=>Math.max(1,Math.round(m/PACE));

// 名前のないトイレは、近くの施設や通りの名前(area)で見分けられるようにする
const nameOf=t=>t.name||(t.area?`トイレ(${t.area} 付近)`:'トイレ');
