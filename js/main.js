/* 起動 */
function init(){
  // 見えている高さ(スマホのアドレスバーの出し入れで変わる)を --vh に入れる。css の高さの指定に使う
  const setVh=()=>document.documentElement.style.setProperty('--vh',(window.innerHeight/100)+'px');
  setVh(); addEventListener('resize',setVh);
  I18N.start();   // 英語のときは、画面の文言を英語にする(js/i18n.js)
  st.toilets=TOILETS.slice(); resort();
  map=new maplibregl.Map({container:'map',style:mapStyle(),center:[SUSUKINO.lng,SUSUKINO.lat],zoom:15.5,
    attributionControl:false,dragRotate:false,pitchWithRotate:false,touchPitch:false});
  map.touchZoomRotate.disableRotation();
  map.addControl(new maplibregl.AttributionControl({compact:true}),'top-left');
  map.once('style.load',()=>tidyStyle(map));
  // 端末の明るさ設定が変わったら地図の色も切り替える
  darkQ.addEventListener('change',()=>{ if (st.settings.theme!=='auto') return; reloadStyle(); });
  const zc=()=>$('map').classList.toggle('lowzoom',map.getZoom()<15);
  map.on('zoom',zc); zc();
  // 地図のタップで、開いている詳細・リストを閉じる(追加中は何もしない)
  map.on('click',()=>{ if (st.adding) return; if (st.sel) unselect(); else if (st.open) setTab('map'); });
  initUi(); syncMarkers(); syncPins(); renderSheet();
  try{ st.wantId=new URLSearchParams(location.search).get('id'); }catch(e){}
  openSharedSpot();
  $('here').onclick=()=>{ buzz(); locateNow(); };
  map.on('dragstart',()=>{ st.moved=true; });
  watchHere();
  // 営業中の判定は時間で変わるので、「いま空いてる」を使っている間は1分ごとに更新
  setInterval(()=>{ if (st.filters.open&&!st.adding&&!st.sel){ resort(); syncPins(); renderSheet(); } },60000);
  let seen=false; try{ seen=!!localStorage.getItem('loo-guide'); }catch(e){}
  if (!seen) showGuide();
  // 運営が非表示にした公開データ(loo-hidden)は出さない
  const rebuild=()=>{ st.toilets=TOILETS.concat(st.added).filter(t=>!st.hidden.has(t.id)); if (st.sel&&!st.toilets.some(t=>t.id===st.sel)) st.sel=null; };
  st.hidden=new Set();
  cloud.init(list=>{ st.added=list; rebuild(); refresh(); openSharedSpot(); if (settingsOpen()) renderSettings(); },rs=>{ st.reports=rs; resort(); syncPins(); if(!st.adding) renderSheet(); if (settingsOpen()) renderSettings(); },ids=>{ st.hidden=new Set(ids); rebuild(); refresh(); });
}
init();
// オフライン対応(https か localhost のときだけ。file:// や ?local=1 の試しでは登録しない)
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol) && !location.search.includes('local=1')){
  addEventListener('load',()=>{ navigator.serviceWorker.register('sw.js').catch(()=>{}); });
}
