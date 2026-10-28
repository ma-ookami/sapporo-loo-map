/* 地図・ピン・現在地。MapLibre + OpenFreeMap(キー不要) */
const MAP_LIGHT='https://tiles.openfreemap.org/styles/positron';
const MAP_DARK='https://tiles.openfreemap.org/styles/dark';
const darkQ=window.matchMedia('(prefers-color-scheme: dark)');
// 地図の色: シンプル(淡い・暗い)/ カラー。画面が暗いときのカラーは fiord(青みの暗い地図)
const MAP_COLOR='https://tiles.openfreemap.org/styles/bright';
const MAP_COLOR_DARK='https://tiles.openfreemap.org/styles/fiord';
const mapStyle=()=>{
  const color=st.settings.mapColor==='color';
  return isDark()?(color?MAP_COLOR_DARK:MAP_DARK):(color?MAP_COLOR:MAP_LIGHT);
};
// スタイルを入れ替える(入れ替えたあとに、文字・アイコンの整理をやり直す)
// diff:false で全部読み直す。差分更新だと style.load が来ず、整理(日本語のみ・標識と店アイコンを消す)が戻ってしまう
function reloadStyle(){ map.setStyle(mapStyle(),{diff:false}); map.once('style.load',()=>tidyStyle(map)); }
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const st={toilets:[],added:[],reports:[],adding:false,here:null,sel:null,open:false,tab:'map',
  filters:{free:false,wheel:false,open:false,h24:false,conv:false,conly:false,tonly:false,b_seven:false,b_family:false,b_lawson:false,b_seico:false},sorted:[]};
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
// コンビニ探しのモード: 「コンビニだけ」か、ブランドを選んでいるとき。借りられるかどうかに関係なく、店を出す
const BRAND_KEYS=['seven','family','lawson','seico'];
const activeBrands=()=>BRAND_KEYS.filter(b=>st.filters['b_'+b]);
const convMode=()=>st.filters.conly||activeBrands().length>0;
const passes=t=>(!st.filters.tonly||t.type==='toilet')&&(!st.filters.conly||t.type==='conv')&&(!activeBrands().length||(t.type==='conv'&&activeBrands().includes(t.brand)))&&(!st.filters.conv||(t.type==='conv'&&['yes','ask'].includes(loanOf(t))))&&(!st.filters.free||t.fee===false)&&(!st.filters.wheel||t.wheelchair===true)&&(!st.filters.open||openNow(t.hours)!==false)&&(!st.filters.h24||t.hours==='24/7');
// コンビニの貸し出し: 報告(1人1票)の多数決。同数は「声をかけて」。追加した人の選択も1票。まだ無ければ null(未確認)
// コンビニの貸し出し: みんなの報告の多数決(同数は声かけ)。LOAN_DAYS 日より古い報告は数えない。LOAN_MIN 人未満は不明のまま
const LOAN_MIN=2, LOAN_DAYS=90;
const loanFresh=r=>r.at>=Date.now()-LOAN_DAYS*86400000;
function loanOf(t){
  if (t.type!=='conv') return null;
  const c={yes:0,ask:0,no:0};
  if (t.source==='user'&&t.loan) c[t.loan]++;
  for (const r of st.reports) if (r.toiletId===t.id&&r.kind.startsWith('loan-')&&loanFresh(r)) c[r.kind.slice(5)]++;
  if (c.yes+c.ask+c.no<LOAN_MIN) return null;
  const max=Math.max(c.yes,c.ask,c.no);
  const top=Object.keys(c).filter(k=>c[k]===max);
  return top.length===1?top[0]:'ask';
}
// 個室の数: 作った人の入力(1票)と、みんなの「個室はいくつ?」の報告(stall-1〜5。5 は 5以上)の中央値。無ければ null
function stallVotes(t){
  const v=[]; if (t.source==='user'&&t.stalls) v.push(t.stalls);
  for (const r of st.reports) if (r.toiletId===t.id&&r.kind.startsWith('stall-')) v.push(Number(r.kind.slice(6)));
  return v;
}
function stallsOf(t){ const v=stallVotes(t).sort((a,b)=>a-b); return v.length?v[Math.floor((v.length-1)/2)]:null; }
// ユーザーが追加した場所の「確認」: 作った人以外の 2 人以上が、行ったことの分かる報告をした(「ここにはなかった」は数えない)
const CONFIRM_N=2;
function confirmedBy(t){ const s=new Set(); for (const r of st.reports) if (r.toiletId===t.id&&r.kind!=='missing'&&r.uid&&r.uid!==t.uid) s.add(r.uid); return s.size; }
// 運営が許可したもの(approved)は確認済み。許可待ち(pending)は未確認。許可制の前の投稿は、報告で確認される
const isConfirmed=t=>t.source!=='user'||(!t.pending&&(t.approved||confirmedBy(t)>=CONFIRM_N));
// 階: データ(floor)があればそれ。無ければ「どの階?」の報告の多数決(地上=1 / 地下=-1 / 2階以上=2)。同数・報告なしは null(不明)
const LV_FLOOR={'lv-gr':1,'lv-ug':-1,'lv-up':2};
function floorOf(t){
  if (t.floor!=null) return t.floor;
  const c={'lv-gr':0,'lv-ug':0,'lv-up':0};
  for (const r of st.reports) if (r.toiletId===t.id&&c[r.kind]!==undefined) c[r.kind]++;
  const max=Math.max(c['lv-gr'],c['lv-ug'],c['lv-up']); if (!max) return null;
  const top=Object.keys(c).filter(k=>c[k]===max);
  return top.length===1?LV_FLOOR[top[0]]:null;
}
// コンビニは、ほとんどが地上なので、地下か地上かは扱わない(印も質問も出さない)
const isUg=t=>{ if (t.type==='conv') return false; const f=floorOf(t); return f!=null&&f<0; };
// 最寄り・リストに出すのは、トイレと、貸し出し〇/声かけ のコンビニだけ
// 最寄り・リストに出すのは、トイレと、借りられる(声かけ含む)コンビニ。コンビニ探しのモードでは、コンビニはすべて
const MISS_N=3;   // 「ここにはなかった」がこの人数になった追加情報は、薄くして最寄り・リストから外す
const missCount=id=>st.reports.filter(r=>r.toiletId===id&&r.kind==='missing').length;
const doubted=t=>t.source==='user'&&missCount(t.id)>=MISS_N;
const usable=t=>!doubted(t)&&(t.type!=='conv'||convMode()||st.filters.conv||(st.settings.nearConv&&['yes','ask'].includes(loanOf(t))));
// お気に入り: よく使う場所の ID をこの端末に保存(ログインしないので、端末をまたいでは共有されない)
const FAV_KEY='loo-favs';
st.favs=(()=>{ try{ return new Set(JSON.parse(localStorage.getItem(FAV_KEY)||'[]')); }catch(e){ return new Set(); } })();
const isFav=t=>st.favs.has(t.id);
function toggleFav(id){
  if (st.favs.has(id)) st.favs.delete(id); else st.favs.add(id);
  try{ localStorage.setItem(FAV_KEY,JSON.stringify([...st.favs])); }catch(e){}
}
function resort(){
  const o=origin();
  st.sorted=st.toilets.filter(t=>passes(t)&&usable(t)).map(t=>({t,d:distanceM(o,t)})).sort((a,b)=>a.d-b.d);
}

function syncMarkers(){
  const ids=new Set(st.toilets.map(t=>t.id));
  for (const [id,m] of markers) if (!ids.has(id)){ m.remove(); markers.delete(id); }
  for (const t of st.toilets){
    if (markers.has(t.id)) continue;
    const e=document.createElement('div'); e.className='pin'+(t.type==='conv'?' conv b-'+(BRAND_KEYS.includes(t.brand)?t.brand:'other')+' loan-'+(loanOf(t)||'null'):'')+(t.source==='user'?' user':''); e.innerHTML='<div class="pi">'+icon(t.type==='conv'?'store':'wc',18)+(t.type==='conv'?'<i class="ld"></i>':'')+DASH_SVG+'<i class="ugb">B</i><i class="ub">'+PERSON_SVG+'</i><i class="fb">'+starSvg(8)+'</i></div>';
    e.onclick=ev=>{ ev.stopPropagation(); if(!st.adding) focus(t.id); };
    markers.set(t.id,new maplibregl.Marker({element:e,anchor:'center'}).setLngLat([t.lng,t.lat]).addTo(map));
  }
}
function syncPins(){
  $('map').classList.toggle('convmode',convMode());   // コンビニ探しのとき、不明の店も引いた地図で出す
  const near=st.sorted[0]&&st.sorted[0].d<=FAR_M?st.sorted[0].t.id:null;
  const t2=new Map(st.toilets.map(t=>[t.id,t]));
  for (const [id,m] of markers){
    const e=m.getElement(), t=t2.get(id);
    e.hidden=(!passes(t)||(t.type==='conv'&&!st.settings.showUnknown&&!convMode()&&loanOf(t)===null))&&id!==st.sel;
    if (t.type==='conv'){ e.classList.remove('loan-yes','loan-ask','loan-no','loan-null'); e.classList.add('loan-'+(loanOf(t)||'null')); }
    e.classList.toggle('doubt',doubted(t));
    e.classList.toggle('ug',isUg(t));
    e.classList.toggle('unconf',t.source==='user'&&!isConfirmed(t));
    e.classList.toggle('fav',isFav(t));
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
  if (settingsOpen()) renderSettings();
}
function onPosErr(err){
  st.locState=err&&err.code===1?'denied':'unavailable';
  if (settingsOpen()) renderSettings();
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
