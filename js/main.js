/* 起動 */
function init(){
  st.toilets=TOILETS.slice(); resort();
  map=new maplibregl.Map({container:'map',style:mapStyle(),center:[SUSUKINO.lng,SUSUKINO.lat],zoom:15.5,
    attributionControl:false,dragRotate:false,pitchWithRotate:false,touchPitch:false});
  map.touchZoomRotate.disableRotation();
  map.addControl(new maplibregl.AttributionControl({compact:true}),'top-left');
  map.on('load',()=>tidyStyle(map));
  // 端末の明るさ設定が変わったら地図の色も切り替える
  darkQ.addEventListener('change',()=>{ if (st.settings.theme!=='auto') return; map.setStyle(mapStyle()); map.once('style.load',()=>tidyStyle(map)); });
  const zc=()=>$('map').classList.toggle('lowzoom',map.getZoom()<15);
  map.on('zoom',zc); zc();
  map.on('click',()=>{ if(!st.adding) unselect(); });
  initUi(); syncMarkers(); syncPins(); renderSheet();
  $('here').onclick=()=>{ buzz(); if (st.here) map.flyTo({center:[st.here.lng,st.here.lat],zoom:16}); };
  watchHere();
  // 営業中の判定は時間で変わるので、「いま空いてる」を使っている間は1分ごとに更新
  setInterval(()=>{ if (st.filters.open&&!st.adding&&!st.sel){ resort(); syncPins(); renderSheet(); } },60000);
  let seen=false; try{ seen=!!localStorage.getItem('loo-guide'); }catch(e){}
  if (!seen) showGuide();
  cloud.init(list=>{ st.added=list; st.toilets=TOILETS.concat(list); refresh(); if(!$('settings').hidden) renderSettings(); },rs=>{ st.reports=rs; resort(); syncPins(); if(!st.adding) renderSheet(); if(!$('settings').hidden) renderSettings(); });
}
init();
