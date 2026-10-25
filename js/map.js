/* 地図・ピン・現在地。MapLibre + OpenFreeMap(キー不要) */
const MAP_LIGHT='https://tiles.openfreemap.org/styles/positron';
const MAP_DARK='https://tiles.openfreemap.org/styles/dark';
const darkQ=window.matchMedia('(prefers-color-scheme: dark)');
const mapStyle=()=>isDark()?MAP_DARK:MAP_LIGHT;
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const st={toilets:[],added:[],reports:[],adding:false,here:null,sel:null,open:false,tab:'map',
  filters:{free:false,wheel:false,open:false,h24:false,conv:false},sorted:[]};
let map, hereMarker; const markers=new Map();
const buzz=()=>{ try{ st.settings.vibrate&&navigator.vibrate&&navigator.vibrate(10); }catch(e){} };
const routeUrl=t=>`https://www.google.com/maps/dir/?api=1&destination=${t.lat},${t.lng}&travelmode=walking`;
const floorLabel=n=>n==null?'':n<0?`B${-n}`:`${n}F`;

// 地図の文字は1言語だけ。日本語: name:ja → name / English: name_en → name:latin → name(英語が無ければ元の名前)
const labelExpr=()=>st.settings.lang==='en'
  ?['coalesce',['get','name_en'],['get','name:latin'],['get','name']]
  :['coalesce',['get','name:ja'],['get','name']];
let labelLayers=[];
function setLabelLang(m){ for (const id of labelLayers) if (m.getLayer(id)) m.setLayoutProperty(id,'text-field',labelExpr()); }
// 店や施設のアイコンなし・バス停なし(sakabazu と同じ)。地名・通り名は1言語だけにする
function tidyStyle(m){
  labelLayers=[];
  for (const l of m.getStyle().layers){
    if (l.type!=='symbol') continue;
    const sl=l['source-layer']||'', id=l.id;
    if (id==='poi_transit') m.setFilter(id,['==',['get','class'],'rail']);
    const hide=(sl==='poi'&&id!=='poi_transit')||/shield/.test(id)||sl==='housenumber'
      ||(sl==='place'&&/neighbourhood|quarter|suburb|hamlet|other/.test(id));
    if (hide){ m.setLayoutProperty(id,'visibility','none'); continue; }
    if (m.getLayoutProperty(id,'text-field')){ labelLayers.push(id); m.setLayoutProperty(id,'text-field',labelExpr()); }
  }
}

const origin=()=>st.here||SUSUKINO;
// 「借りられるコンビニ」: トイレは隠し、貸し出し 借りられる/声をかけて のコンビニだけ出す
const passes=t=>(!st.filters.conv||(t.type==='conv'&&['yes','ask'].includes(loanOf(t))))&&(!st.filters.free||t.fee===false)&&(!st.filters.wheel||t.wheelchair===true)&&(!st.filters.open||openNow(t.hours)!==false)&&(!st.filters.h24||t.hours==='24/7');
// コンビニの貸し出し: 報告(1人1票)の多数決。同数は「声をかけて」。追加した人の選択も1票。まだ無ければ null(未確認)
function loanOf(t){
  if (t.type!=='conv') return null;
  const c={yes:0,ask:0,no:0};
  if (t.source==='user'&&t.loan) c[t.loan]++;
  for (const r of st.reports) if (r.toiletId===t.id&&r.kind.startsWith('loan-')) c[r.kind.slice(5)]++;
  const max=Math.max(c.yes,c.ask,c.no); if (!max) return null;
  const top=Object.keys(c).filter(k=>c[k]===max);
  return top.length===1?top[0]:'ask';
}
// 最寄り・リストに出すのは、トイレと、貸し出し〇/声かけ のコンビニだけ
const usable=t=>t.type!=='conv'||((st.settings.nearConv||st.filters.conv)&&['yes','ask'].includes(loanOf(t)));
function resort(){
  const o=origin();
  st.sorted=st.toilets.filter(t=>passes(t)&&usable(t)).map(t=>({t,d:distanceM(o,t)})).sort((a,b)=>a.d-b.d);
}

function syncMarkers(){
  const ids=new Set(st.toilets.map(t=>t.id));
  for (const [id,m] of markers) if (!ids.has(id)){ m.remove(); markers.delete(id); }
  for (const t of st.toilets){
    if (markers.has(t.id)) continue;
    const e=document.createElement('div'); e.className='pin'+(t.type==='conv'?' conv loan-'+(loanOf(t)||'null'):''); e.innerHTML='<div class="pi">'+icon(t.type==='conv'?'store':'wc',18)+'</div>';
    e.onclick=ev=>{ ev.stopPropagation(); if(!st.adding) focus(t.id); };
    markers.set(t.id,new maplibregl.Marker({element:e,anchor:'center'}).setLngLat([t.lng,t.lat]).addTo(map));
  }
}
function syncPins(){
  const near=st.sorted[0]&&st.sorted[0].d<=FAR_M?st.sorted[0].t.id:null;
  const t2=new Map(st.toilets.map(t=>[t.id,t]));
  for (const [id,m] of markers){
    const e=m.getElement(), t=t2.get(id);
    e.hidden=(!passes(t)||(t.type==='conv'&&!st.settings.showUnknown&&loanOf(t)===null))&&id!==st.sel;
    if (t.type==='conv'){ e.classList.remove('loan-yes','loan-ask','loan-no','loan-null'); e.classList.add('loan-'+(loanOf(t)||'null')); }
    e.classList.toggle('sel',id===st.sel);
    e.classList.toggle('near',id===near&&id!==st.sel);
  }
  if (st.here){
    if (!hereMarker){ const h=document.createElement('div'); h.className='herem'; hereMarker=new maplibregl.Marker({element:h}).setLngLat([st.here.lng,st.here.lat]).addTo(map); }
    else hereMarker.setLngLat([st.here.lng,st.here.lat]);
  }
}
function refresh(){ resort(); syncMarkers(); syncPins(); renderSheet(); }

// 現在地。動いたら距離を更新(10m 以上動いたときだけ描き直す)
let lastRender=null;
// 位置情報が取れた(最初の1回は、地図を動かしていなくて、すすきの近くにいるなら、そこへ寄せる)
function onPos(p){
  const h={lat:p.coords.latitude,lng:p.coords.longitude};
  const first=!st.here; st.here=h; st.locState='ok';
  if (first||!lastRender||distanceM(lastRender,h)>10){ lastRender=h; resort(); syncPins(); if(!st.adding) renderSheet(); }
  else hereMarker&&hereMarker.setLngLat([h.lng,h.lat]);
  if (first&&!st.moved&&!st.adding&&!st.sel&&distanceM(h,SUSUKINO)<3000) map.easeTo({center:[h.lng,h.lat],zoom:16,duration:600});
  if (!$('settings').hidden) renderSettings();
}
function onPosErr(err){
  st.locState=err&&err.code===1?'denied':'unavailable';
  if (!$('settings').hidden) renderSettings();
}
const LOC_HELP={
  denied:'位置情報がオフです。iPhone は「設定 → プライバシー → 位置情報サービス → Safari」でオンにして、ページを開き直してね',
  unavailable:'現在地がとれませんでした。電波のよいところで、もう一度ためしてね'
};
function watchHere(){
  if (!navigator.geolocation){ st.locState='unavailable'; return; }
  st.locState='pending';
  navigator.geolocation.watchPosition(onPos,onPosErr,{enableHighAccuracy:true,maximumAge:5000,timeout:15000});
}
// 現在地ボタン: 取れていればそこへ。まだなら、もう一度とりに行って、だめな理由を知らせる
function locateNow(){
  if (st.here){ map.flyTo({center:[st.here.lng,st.here.lat],zoom:16}); return; }
  if (!navigator.geolocation){ toast(LOC_HELP.unavailable); return; }
  toast('現在地をさがしています…');
  navigator.geolocation.getCurrentPosition(p=>{ onPos(p); map.flyTo({center:[st.here.lng,st.here.lat],zoom:16}); },e=>{ onPosErr(e); toast(LOC_HELP[st.locState]); },{enableHighAccuracy:true,timeout:10000});
}
// シートの下に隠れないよう、地図の中心をシートの上に寄せる
function padMap(){
  const pad=st.adding||st.sel?Math.max(0,innerHeight-$('sheet').getBoundingClientRect().top):0;
  map.setPadding({top:0,left:0,right:0,bottom:pad}); return pad;
}
