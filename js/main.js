/* 起動 */
function init(){
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
  initUi(); applyChips(); syncMarkers(); syncPins(); renderSheet();
  $('here').onclick=()=>{ buzz(); locateNow(); };
  map.on('dragstart',()=>{ st.moved=true; });
  watchHere();
  // 営業中の判定は時間で変わるので、「いま空いてる」を使っている間は1分ごとに更新
  setInterval(()=>{ if (st.filters.open&&!st.adding&&!st.sel){ resort(); syncPins(); renderSheet(); } },60000);
  let seen=false; try{ seen=!!localStorage.getItem('loo-guide'); }catch(e){}
  if (!seen) showGuide();
  cloud.init(list=>{ st.added=list; st.toilets=TOILETS.concat(list); refresh(); if(!$('settings').hidden) renderSettings(); },rs=>{ st.reports=rs; resort(); syncPins(); if(!st.adding) renderSheet(); if(!$('settings').hidden) renderSettings(); });
}
init();
