/* 設定画面(右上の ⚙)。設定はこの端末の localStorage('loo-settings')に保存する */
const SETTINGS_KEY='loo-settings';
const APP_VERSION='1.0';
const DEFAULT_SETTINGS={theme:'auto',mapColor:'simple',lang:(navigator.language||'ja').toLowerCase().startsWith('ja')?'ja':'en',vibrate:true,pace:80,nearConv:true,showUnknown:true};
const KIND_LABEL={clean:'きれい','crowded':'混んでた',closed:'使えなかった',missing:'ここにはなかった','loan-yes':'借りられる','loan-ask':'声をかけて借りる','loan-no':'借りられない','lv-gr':'地上','lv-ug':'地下','lv-up':'2階以上','stall-1':'個室 1','stall-2':'個室 2','stall-3':'個室 3','stall-4':'個室 4','stall-5':'個室 5以上'};

const LOC_TEXT={ok:'取得できています(地図の青い点です)',pending:'取得中…',denied:'許可されていません。端末の設定で、このサイトの位置情報をオンにしてね(iPhone: 設定 → プライバシー → 位置情報サービス → Safari)',unavailable:'いまは取得できません。電波のよいところでためしてね'};
function loadSettings(){
  try{
    const saved=JSON.parse(localStorage.getItem(SETTINGS_KEY)||'{}');
    return Object.assign({},DEFAULT_SETTINGS,saved);
  }catch(e){ return Object.assign({},DEFAULT_SETTINGS); }
}
function saveSettings(){ try{ localStorage.setItem(SETTINGS_KEY,JSON.stringify(st.settings)); }catch(e){} }
st.settings=loadSettings();

// 画面が暗いか(テーマが「自動」なら端末の設定に従う)
function isDark(){ const t=st.settings.theme; return t==='dark'||(t==='auto'&&darkQ.matches); }
function applyTheme(){
  const r=document.documentElement, t=st.settings.theme;
  if (t==='auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme',t);
}
function applyPace(){ PACE=st.settings.pace; }
applyTheme(); applyPace();   // 画面が出る前に反映(ちらつき防止)

// 種類(すべて/トイレ/コンビニ)に合わせて、絞り込みボタンの押し状態と2段目の出し入れを揃える
function syncFilterUi(){
  const kind=st.filters.tonly?'tonly':st.filters.conly?'conly':'all';
  document.querySelectorAll('#filters [data-k]').forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.k===kind)));
  document.querySelectorAll('#filters [data-f]').forEach(x=>{
    x.setAttribute('aria-pressed',String(!!st.filters[x.dataset.f]));
    if (x.dataset.g) x.hidden=!(x.dataset.g==='t'?kind==='tonly':kind==='conly');
  });
  $('subf').hidden=kind==='all';
}
function setSetting(k,v){
  st.settings[k]=v; saveSettings();
  if (k==='theme'){ applyTheme(); if (map) reloadStyle(); }
  if (k==='mapColor'&&map) reloadStyle();
  if (k==='pace') applyPace();
  if (k==='lang'){ location.reload(); return; }   // 言語は、読み込み直して反映する
  if (map){ resort(); syncPins(); if (!st.adding) renderSheet(); }
}

const seg3=(k,opts)=>'<div class="seg" data-s="'+k+'">'+opts.map(o=>'<button type="button" data-v="'+o[0]+'" aria-pressed="'+(String(st.settings[k])===String(o[0]))+'">'+o[1]+'</button>').join('')+'</div>';
const sw=(k)=>'<button type="button" class="sw" data-s="'+k+'" aria-pressed="'+!!st.settings[k]+'" aria-label="切り替え"></button>';

function mineRows(){
  const posts=st.added.filter(t=>t.mine);
  const reps=st.reports.filter(r=>r.mine);
  const p=posts.length?posts.map(t=>`<div class="mrow"><div><b translate="no">${esc(nameOf(t))}</b><span>${t.type==='conv'?'コンビニ':'トイレ'}${t.floor!=null?'・'+floorLabel(t.floor):''}</span></div><button class="mdel" data-del="${esc(t.id)}">削除</button></div>`).join(''):'<div class="empty">まだありません</div>';
  const r=reps.length?reps.map(x=>{ const t=st.toilets.find(y=>y.id===x.toiletId); return `<div class="mrow"><div><b ${t?'translate="no"':''}>${esc(t?nameOf(t):'(見つかりません)')}</b><span>${KIND_LABEL[x.kind]||x.kind}</span></div><button class="mdel" data-rep="${esc(x.toiletId)}">取り消し</button></div>`; }).join(''):'<div class="empty">まだありません</div>';
  return {p,r};
}

function renderSettings(){
  const v=$('settings'), keep=v.querySelector('.sbody2'), top=keep?keep.scrollTop:0, m=mineRows();
  v.innerHTML=`<div class="spanel"><div class="shead"><h3>設定</h3><button class="x" id="sx" aria-label="閉じる">${icon('close',16)}</button></div>
  <div class="sbody2">
    <div class="sg"><div class="sl">テーマ</div>${seg3('theme',[['auto','自動'],['light','ライト'],['dark','ダーク']])}<div class="shint">自動は、端末の設定に合わせます</div></div>
    <div class="sg srow"><div><div class="sl">現在地</div><div class="shint">${LOC_TEXT[st.locState]||LOC_TEXT.pending}</div></div><button class="sub small" id="slocate">さがす</button></div>
    <div class="sg"><div class="sl">地図の色</div>${seg3('mapColor',[['simple','シンプル'],['color','カラー']])}<div class="shint">シンプルは淡い地図、カラーは建物や公園に色がつきます。地図の上のボタン(重なった四角のアイコン)でも切り替えられます</div></div>
    <div class="sg"><div class="sl">言語 / Language</div>${seg3('lang',[['ja','日本語'],['en','English']])}<div class="shint">画面と地図の文字の言語です。English でも、英語の名前がない場所は日本語で出ます</div></div>
    <div class="sg"><div class="sl">歩く速さ</div>${seg3('pace',[[60,'ゆっくり'],[80,'ふつう'],[100,'早足']])}<div class="shint">「徒歩○分」の計算に使います</div></div>
    <div class="sg srow"><div><div class="sl">振動</div><div class="shint">ボタンを押したとき(Android のみ)</div></div>${sw('vibrate')}</div>
    <div class="sg srow"><div><div class="sl">最寄りにコンビニも出す</div><div class="shint">「いちばん近いトイレ」とリストに、借りられるコンビニを含めます</div></div>${sw('nearConv')}</div>
    <div class="sg srow"><div><div class="sl">借りられるか不明のコンビニを地図に出す</div><div class="shint">オフにすると、教えてもらった店だけが出ます</div></div>${sw('showUnknown')}</div>
    <div class="ssec">自分が追加したもの</div>${m.p}
    <div class="ssec">自分の報告</div>${m.r}
    <div class="ssec">このアプリについて</div>
    <button class="lrow" id="sguide">使う前に(お客さん専用・お店への配慮)${icon('chevron',16)}</button>
    <a class="lrow" href="privacy.html" target="_blank" rel="noopener">プライバシーとデータの出典${icon('chevron',16)}</a>
    ${''/* 「間違い・ご意見を送る」(GitHub Issues へのリンク)は一旦非表示。連絡先を決めたら戻す */}
    <div class="lrow plain"><span>版</span><span class="shint" style="margin:0">${APP_VERSION}</span></div>
    <button class="lrow danger" id="sreset">この端末の設定と記録を消す</button>
    <button class="lrow close" id="sclose">閉じる</button>
  </div></div>`;
  const nb=v.querySelector('.sbody2'); nb.scrollTop=top;
  $('sx').onclick=hideSettings; $('sclose').onclick=hideSettings;   // 上の×と、親指で届く下の「閉じる」
  $('slocate').onclick=()=>{ hideSettings(); locateNow(); };
  v.onclick=e=>{ if (e.target===v) hideSettings(); };
  v.querySelectorAll('.seg[data-s] button').forEach(b=>b.onclick=()=>{ buzz(); const k=b.parentNode.dataset.s, val=b.dataset.v; setSetting(k,k==='pace'?Number(val):val); renderSettings(); });
  v.querySelectorAll('.sw[data-s]').forEach(b=>b.onclick=()=>{ buzz(); setSetting(b.dataset.s,!st.settings[b.dataset.s]); renderSettings(); });
  v.querySelectorAll('[data-del]').forEach(b=>b.onclick=async()=>{ if(!confirm('削除しますか?')) return; try{ await cloud.remove(b.dataset.del); }catch(e){ toast('削除できませんでした'); } renderSettings(); });
  v.querySelectorAll('[data-rep]').forEach(b=>b.onclick=async()=>{ try{ await cloud.report(b.dataset.rep,null); }catch(e){ toast('取り消せませんでした'); } renderSettings(); });
  $('sguide').onclick=()=>{ hideSettings(); showGuide(); };
  $('sreset').onclick=()=>{ if(!confirm('この端末の設定と記録を消します。(ほかの人にも見えている投稿は消えません)')) return;
    try{ ['loo-settings','loo-guide','loo-added','loo-reports'].forEach(k=>localStorage.removeItem(k)); }catch(e){}
    location.reload(); };
}
function showSettings(){ const v=$('settings'); v.hidden=false; renderSettings(); }
function hideSettings(){ $('settings').hidden=true; }
