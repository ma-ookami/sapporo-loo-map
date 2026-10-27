/* 下のシート(ホーム・リスト・詳細)、タブバー、絞り込みチップ */
const KINDS=[['closed','使えなかった']];

const LKINDS=[['loan-yes','check','借りられる','そのまま'],['loan-ask','chat','声をかけて','店員さんに一言/貼り紙あり'],['loan-no','close','借りられない','貸出なし/断られた']];
function loanCounts(id){ const c={'loan-yes':0,'loan-ask':0,'loan-no':0}; for (const r of st.reports) if (r.toiletId===id&&c[r.kind]!==undefined&&loanFresh(r)) c[r.kind]++; return c; }
function reportCounts(id){
  const since=Date.now()-24*3600*1000, c={clean:0,crowded:0,closed:0}; let mine=null;
  for (const r of st.reports){ if (r.toiletId!==id||r.at<since||c[r.kind]===undefined) continue; c[r.kind]++; if (r.mine) mine=r.kind; }
  return {c,mine};
}
const tagsOf=t=>(t.type==='conv'?`<span class="tag">${esc(brandLabel(t.brand))}</span>${(l=>`<span class="tag loan-${l||'null'}">${l?loanLabel(l):'借りられるか不明'}</span>`)(loanOf(t))}`:'')+(fl=>fl==null||t.type==='conv'?'':fl<0?`<span class="tag ug">地下 ${floorLabel(fl)}</span>`:fl===1?'<span class="tag">地上(1F)</span>':`<span class="tag">${floorLabel(fl)}</span>`)(floorOf(t))
  +(n=>n?`<span class="tag">個室 ${n}${n>=5?'以上':''}</span>`:'')(t.type==='conv'?null:stallsOf(t))
  +(t.fee===false?'<span class="tag free">無料</span>':t.fee===true?'<span class="tag">有料</span>':'')
  +(t.wheelchair?'<span class="tag">車いす可</span>':'')+(t.type!=='conv'&&reportCounts(t.id).c.closed?'<span class="tag loan-no">最近、使えなかった報告</span>':'')+(t.hours==='24/7'?'<span class="tag free">24時間</span>':(o=>o===true?'<span class="tag free">営業中</span>':o===false?'<span class="tag loan-no">営業時間外</span>':t.hours&&t.type!=='conv'?`<span class="tag">${esc(t.hours)}</span>`:'')(openNow(t.hours)));

function focus(id){
  st.sel=id; st.open=false; buzz();
  syncPins(); renderSheet();
  const t=st.toilets.find(x=>x.id===id);
  map.setPadding({top:0,left:0,right:0,bottom:padMap()});
  map.easeTo({center:[t.lng,t.lat],zoom:Math.max(map.getZoom(),17),duration:450});
}
function unselect(){
  if (!st.sel) return;
  st.sel=null; syncPins(); renderSheet(); map.setPadding({top:0,left:0,right:0,bottom:0});
}
function setTab(tab){
  if (st.adding) return;
  buzz(); st.tab=tab; st.sel=null; st.open=tab==='list';
  document.querySelectorAll('#tabs [data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t===tab));
  syncPins(); renderSheet(); map.setPadding({top:0,left:0,right:0,bottom:0});
}

function renderSheet(){
  if (st.adding) return;
  const sh=$('sheet'), body=$('sbody');
  sh.classList.toggle('open',st.open&&!st.sel);
  const sel=st.sel&&st.toilets.find(x=>x.id===st.sel);
  if (sel) return renderDetail(body,sel);
  const nearest=st.sorted[0], far=!nearest||nearest.d>FAR_M;
  let h='';
  if (!nearest) h+=`<div class="bubble">${bearSvg(36,true)}<span>条件に合う場所がないよ。絞り込みをゆるめてみてね</span></div>`;
  else{
    if (far) h+=`<div class="bubble"><span>ちょっと遠いよ。まずはすすきの周辺だけ載ってるよ</span><button class="sub small" id="gosus">すすきのへ</button></div>`;
    const t=nearest.t;
    h+=`<div class="near">${bearSvg(40,far?'worried':'normal')}<div class="ntext"><div class="eyebrow">${convMode()?'いちばん近いコンビニ':'いちばん近いトイレ'}</div>
      <button class="nhead" id="nhead" data-id="${esc(t.id)}"><div class="nname" translate="no">${esc(nameOf(t))}</div>
      <div class="nmeta">${fmtDist(nearest.d)}<i>徒歩${walkMin(nearest.d)}分</i>${t.type==='conv'?`<i class="lo lo-${loanOf(t)}">${loanLabel(loanOf(t))}</i>`:''}</div></button></div>
      <button class="cta mini${far?' far':''}" id="nbtn">ナビ開始${icon('arrow',16)}</button></div>`;
  }
  if (st.open) h+='<div class="sech"><span class="sec">近い順</span><button class="x" id="lx" aria-label="リストを閉じる">'+icon('close',16)+'</button></div><div class="list">'+st.sorted.slice(0,30).map(({t,d})=>`<button class="row" data-id="${esc(t.id)}"><span class="ri${t.type==='conv'?' conv':''}${t.source==='user'?' user':''}${t.source==='user'&&!isConfirmed(t)?' unconf':''}">${icon(t.type==='conv'?'store':'wc',20)}</span><span class="rn"><b translate="no">${esc(nameOf(t))}</b><span class="tags">${tagsOf(t)}</span></span><span class="rd">${fmtDist(d)}</span>${icon('chevron',16)}</button>`).join('')+'</div>';
  body.innerHTML=h; body.style.animation='none'; void body.offsetWidth; body.style.animation='';
  const gs=$('gosus'); if (gs) gs.onclick=()=>{ buzz(); map.flyTo({center:[SUSUKINO.lng,SUSUKINO.lat],zoom:15.5}); };
  const lx=$('lx'); if (lx) lx.onclick=()=>setTab('map');
  const nb=$('nbtn'); if (nb) nb.onclick=()=>{ buzz(); goRoute(nearest.t); };
  body.querySelectorAll('.row,#nhead').forEach(r=>r.onclick=()=>focus(r.dataset.id));
  placeLegend();
}

// データに階が無い場所で、「どの階?」を教えてもらう(地上 / 地下 / 2階以上)。みんなの多数決で、地下の印(B)が付く
const LVK=[['lv-gr','地上(1階)'],['lv-ug','地下'],['lv-up','2階以上']];
function floorBlock(t){
  if (t.floor!=null||t.type==='conv') return '';   // コンビニには、地下か地上かを聞かない
  const c={'lv-gr':0,'lv-ug':0,'lv-up':0}; let mineLv=null;
  for (const r of st.reports){ if (r.toiletId!==t.id||c[r.kind]===undefined) continue; c[r.kind]++; if (r.mine) mineLv=r.kind; }
  const n=c['lv-gr']+c['lv-ug']+c['lv-up'], fl=floorOf(t);
  return '<div class="sec2">どこにある?(地上か地下か)</div><div class="reps lv">'
    +LVK.map(([k,l])=>'<button data-lv="'+k+'" aria-pressed="'+(mineLv===k)+'"><i></i>'+l+(c[k]?' <b>'+c[k]+'</b>':'')+'</button>').join('')+'</div>'
    +'<div class="repnote">'+(n?(fl!=null&&fl<0?'みんなの情報では、地下にあります。':'')+n+'人が教えてくれました。行ったことがあれば、教えてね':'まだ分かっていません。行ったことがあれば、教えてね(地下の場所には、地図に「B」の印が付きます)')+'</div>';
}
// 「個室はいくつ?」。公開データに無いので、行った人に教えてもらう(中央値)。トイレだけ
const STK=[['stall-1','1'],['stall-2','2'],['stall-3','3'],['stall-4','4'],['stall-5','5以上']];
function stallBlock(t){
  if (t.type==='conv') return '';
  let mineSt=null;
  for (const r of st.reports) if (r.toiletId===t.id&&r.mine&&r.kind.startsWith('stall-')) mineSt=r.kind;
  const n=stallVotes(t).length;
  return '<div class="sec2">個室はいくつ?</div><div class="seg stl">'
    +STK.map(([k,l])=>'<button type="button" data-st="'+k+'" aria-pressed="'+(mineSt===k)+'">'+l+'</button>').join('')+'</div>'
    +'<div class="repnote">'+(n?'{n}人が教えてくれました。数えたことがあれば、あなたも教えてね'.replace('{n}',n):'まだ分かっていません。数えたことがあれば、教えてね')+'</div>';
}
function renderDetail(body,t){
  const d=distanceM(origin(),t), {c,mine:mine0}=reportCounts(t.id), lc=loanCounts(t.id), mine=(st.reports.find(r=>r.toiletId===t.id&&r.mine&&!r.kind.startsWith('lv-')&&!r.kind.startsWith('stall-'))||{}).kind||mine0;
  body.innerHTML=`<div class="dhead"><div class="av">${bearSvg(36)}</div><div><h2 translate="no">${esc(nameOf(t))}</h2>
    <div class="d">${fmtDist(d)}・徒歩${walkMin(d)}分</div></div>${t.pending?'':`<button class="x" id="dsh" aria-label="この場所を共有">${icon('share',16)}</button>`}<button class="x" id="dx" aria-label="閉じる">${icon('close',16)}</button></div>
    <div class="tags">${tagsOf(t)}${t.source==='user'?(t.pending?'<span class="tag user dashed">運営の確認待ち(あなたにだけ見えています)</span>':isConfirmed(t)?'<span class="tag user">追加された情報(確認済み)</span>':'<span class="tag user dashed">追加された情報(未確認)</span>'):''}${doubted(t)?'<span class="tag loan-no">「なかった」の報告があります</span>':''}</div>
    ${t.note?`<div class="note" translate="no">${esc(t.note)}</div>`:''}
    ${floorBlock(t)}
    ${stallBlock(t)}
    ${(t.ease||t.find)?`<div class="rate">${t.ease?`<div><span>使いやすさ</span><span>${starsRow(t.ease)}</span></div>`:''}${t.find?`<div><span>場所のわかりやすさ</span><span>${starsRow(t.find)}</span></div>`:''}</div>`:''}
    ${t.type==='conv'
      ?`<div class="sec2">このコンビニのトイレ、借りられる?</div>
    <div class="lq">${LKINDS.map(([k,ic,l,sub])=>`<button data-k="${k}" aria-pressed="${mine===k}"><span class="lic">${icon(ic,20)}</span><b>${l}</b><small>${sub.replace("/","<br>")}</small><em>${lc[k]?lc[k]+'人':'&nbsp;'}</em></button>`).join('')}</div>
    <div class="repnote">${(n=>n>=LOAN_MIN?`${n}人が教えてくれました。借りたことがあれば、あなたも教えてね`:n?'1人が教えてくれました。もう1人の報告で、地図に出ます。借りたことがあれば、教えてね':'まだ誰も教えてくれていません。借りたことがあれば、教えてね')(lc['loan-yes']+lc['loan-ask']+lc['loan-no'])}</div>`
      :`<div class="sec2">使えなかったら教えてね(24時間だけ表示)</div>
    <div class="reps">${KINDS.map(([k,l])=>`<button data-k="${k}" aria-pressed="${mine===k}"><i></i>${l}${c[k]?` <b>${c[k]}</b>`:''}</button>`).join('')}</div>`}
    <div class="care">${icon('info',16)}<span>${t.type==='conv'?'お店のご厚意で借りるトイレです。できればお買い物を。混んでいるときは遠慮して、きれいに使いましょう。お客さん専用のお店もあります。':'ビルやお店のトイレは、お客さん専用のこともあります。使えなかったときは、無理せず別の場所へ。'}</span></div>
    ${t.source==='user'&&!t.mine?`<button class="miss" id="miss" aria-pressed="${mine==='missing'}">${mine==='missing'?'「ここにはなかった」と報告済み(押すと取り消し)':'ここには、なかった'}</button>`:''}
    <a class="cta" id="go" href="${routeUrl(t)}" target="_blank" rel="noopener">ここへ行く${icon('arrow',20)}</a>
    ${t.mine?'<button class="del" id="del">この情報を削除</button>':''}`;
  placeLegend();
  $('dx').onclick=unselect;
  if ($('dsh')) $('dsh').onclick=()=>shareSpot(t);
  body.querySelectorAll('.reps:not(.lv) button,.lq button').forEach(b=>b.onclick=async()=>{
    buzz(); const k=b.dataset.k;
    try{ await cloud.report(t.id,mine===k?null:k); }catch(e){ toast('送れませんでした'); }
  });
  body.querySelectorAll('.reps.lv button').forEach(b=>b.onclick=async()=>{
    buzz(); const k=b.dataset.lv, mineLv=(st.reports.find(r=>r.toiletId===t.id&&r.mine&&r.kind.startsWith('lv-'))||{}).kind;
    try{ await cloud.reportFloor(t.id,mineLv===k?null:k); }catch(e){ toast('送れませんでした'); }
  });
  body.querySelectorAll('.seg.stl button').forEach(b=>b.onclick=async()=>{
    buzz(); const k=b.dataset.st, mineSt=(st.reports.find(r=>r.toiletId===t.id&&r.mine&&r.kind.startsWith('stall-'))||{}).kind;
    try{ await cloud.reportStall(t.id,mineSt===k?null:k); }catch(e){ toast('送れませんでした'); }
  });
  const ms=$('miss'); if (ms) ms.onclick=async()=>{ buzz(); try{ await cloud.report(t.id,mine==='missing'?null:'missing'); }catch(e){ toast('送れませんでした'); } };
  const go=$('go'); if (go) go.onclick=e=>{ e.preventDefault(); buzz(); goRoute(t); };
  const dl=$('del'); if(dl) dl.onclick=async()=>{ if(!confirm('削除しますか?')) return; try{ await cloud.remove(t.id); st.sel=null; renderSheet(); padMap(); }catch(e){ toast('削除できませんでした'); } };
}

// 外のアプリ(Google マップ)を開く前に確認する。キャンセルすれば、そのまま
function goRoute(t){
  if (!confirm(I18N.t('Google マップを開いて、「{name}」までの徒歩ルートを表示します。よろしいですか?',{name:nameOf(t)}))) return;
  window.open(routeUrl(t),'_blank','noopener');
}
// この場所のリンク(?id=)を共有。共有シートが無い端末ではコピー
function spotUrl(t){ return location.origin+location.pathname+'?id='+encodeURIComponent(t.id); }
async function shareSpot(t){
  const url=spotUrl(t), title=nameOf(t);
  try{ if (navigator.share){ await navigator.share({title,text:title,url}); return; } }catch(e){ if (e&&e.name==='AbortError') return; }
  try{ await navigator.clipboard.writeText(url); toast('リンクをコピーしました'); }catch(e){ toast('コピーできませんでした'); }
}
// ?id= で開かれたとき、その場所を選ぶ(ユーザー追加の分は読み込み後に探す)
function openSharedSpot(){
  if (!st.wantId) return;
  const t=st.toilets.find(x=>x.id===st.wantId); if (!t) return;
  st.wantId=null; st.moved=true; focus(t.id);
}
function toast(msg){ const d=document.createElement('div'); d.className='toast'; d.textContent=msg; d.style.bottom=(innerHeight-$('sheet').getBoundingClientRect().top+12)+'px'; document.body.appendChild(d); setTimeout(()=>d.remove(),Math.max(2200,msg.length*90)); }

function initUi(){
  document.querySelectorAll('#tabs [data-t]').forEach(b=>b.onclick=()=>setTab(b.dataset.t==='list'&&st.open&&!st.sel?'map':b.dataset.t));
  $('tabadd').onclick=startAdd;
  $('brand').innerHTML=bearSvg(30)+'札幌トイレ・コンビニマップ'; $('here').innerHTML=icon('locate',22); $('layers').innerHTML=icon('layers',22); $('layers').onclick=()=>{ buzz(); setSetting('mapColor',st.settings.mapColor==='color'?'simple':'color'); toast(st.settings.mapColor==='color'?'地図: カラー':'地図: シンプル'); if(!$('settings').hidden) renderSettings(); };
  initLegend();
  $('info').onclick=()=>showSettings();
  $('ic-list').innerHTML=icon('list',23); $('ic-set').innerHTML=icon('gear',23); $('ic-add').innerHTML=icon('plus',28);
  document.querySelectorAll('#filters [data-k]').forEach(b=>b.onclick=()=>{
    buzz(); const k=b.dataset.k;
    st.filters.tonly=k==='tonly'; st.filters.conly=k==='conly';
    // 種類を替えたら、その種類専用の絞り込みは外す
    ['free','wheel','h24'].forEach(x=>{ if (k==='conly') st.filters[x]=false; });
    ['conv','b_seven','b_family','b_lawson','b_seico'].forEach(x=>{ if (k!=='conly') st.filters[x]=false; });
    syncFilterUi(); refresh();
  });
  document.querySelectorAll('#filters [data-f]').forEach(b=>b.onclick=()=>{
    buzz(); const k=b.dataset.f; st.filters[k]=!st.filters[k];
    syncFilterUi(); refresh();
  });
  syncFilterUi();
  // つまみ: タップで開閉、上下スワイプ
  const g=$('grab'); let y0=null, tAt=0;
  g.addEventListener('touchstart',e=>{ y0=e.touches[0].clientY; },{passive:true});
  g.addEventListener('touchend',e=>{
    const dy=e.changedTouches[0].clientY-y0; y0=null; tAt=Date.now();
    if (st.sel){ if(dy>30) unselect(); return; }
    if (dy<-30) st.open=true; else if (dy>30) st.open=false; else st.open=!st.open;
    st.tab=st.open?'list':'map'; document.querySelectorAll('#tabs [data-t]').forEach(b=>b.classList.toggle('on',b.dataset.t===st.tab)); renderSheet();
  });
  g.onclick=()=>{ if (Date.now()-tAt<600) return; if (st.sel) unselect(); else { st.open=!st.open; renderSheet(); } };
}

// 使う前に(初回だけ自動で出す。右上の ⓘ からいつでも)
function showGuide(){
  const g=$('guide');
  g.innerHTML=`<div class="gcard"><div class="ghd">${bearSvg(64,'happy')}<h3>使う前に、ちょっとだけ</h3></div>
    <ol>
    <li><b>お客さん専用のトイレもあるよ</b><span>お店や商業施設のトイレは、お客さんだけが使えることがあります。使えなかったときは、無理せず別の場所へ。</span></li>
    <li><b>できるだけ、お店で買い物を</b><span>コンビニなどはお店のご厚意で借りています。できれば何か買って、混んでいる時間は遠慮して、きれいに使いましょう。声をかけるときは「お手洗いをお借りできますか?」と一言。</span></li>
    <li><b>情報はみんなの投稿です</b><span>古い・違うこともあります。気づいたら、報告や追加で教えてね。</span></li>
    </ol>
    <p class="gfoot">地図とトイレ・コンビニの位置は © OpenStreetMap contributors のデータです。現在地は端末の中だけで使い、送りません。<a href="privacy.html" target="_blank" rel="noopener">くわしく</a></p>
    <button class="cta" id="gok">わかった</button></div>`;
  g.hidden=false; $('gok').onclick=()=>{ g.hidden=true; try{ localStorage.setItem('loo-guide','1'); }catch(e){} };
}

// ---- 凡例(左下)。下のシートの上に並べて、シートが伸び縮みしても重ならないよう追従する ----
const LEGEND_ROWS=[
  ['pin','wc','トイレ: 公開データ'],
  ['pin user unconf','wc','トイレ: ユーザー追加(点線は未確認)'],
  ['pin conv b-other loan-yes','store','コンビニ: 借りられる'],
  ['pin conv b-other loan-no','store','コンビニ: 借りられない'],
  ['pin ug','wc','地下にある(Bの印)']
];
function legendHtml(){
  return LEGEND_ROWS.map(r=>'<div class="lrow2"><span class="lm">'+(r[1]?'<div class="'+r[0]+'"><div class="pi">'+icon(r[1],13)+(r[0].includes('conv')?'<i class="ld"></i>':'')+(r[0].includes(' ug')?'<i class="ugb">B</i>':'')+(r[0].includes(' unconf')?DASH_SVG:'')+(r[0].includes(' user')?'<i class="ub">'+PERSON_SVG+'</i>':'')+'</div></div>':'<div class="'+r[0]+'"></div>')+'</span><span>'+r[2]+'</span></div>').join('');
}
const WIDE=()=>matchMedia('(min-width:600px)').matches;   // 広い画面(PC・タブレット)は凡例を出しっぱなし、スマホはボタンで開く
function placeLegend(){
  const lg=$('legend'); if (!lg) return;
  lg.style.bottom=Math.round(innerHeight-$('sheet').getBoundingClientRect().top+10+(WIDE()?0:44))+'px';
  $('legendBtn').style.bottom=Math.round(innerHeight-$('sheet').getBoundingClientRect().top+10)+'px';
}
function initLegend(){
  $('legend').innerHTML=legendHtml();
  $('legendBtn').innerHTML=icon('info',18)+'<span>凡例</span>';
  $('legendBtn').onclick=()=>{ buzz(); $('legend').classList.toggle('on'); };
  if (window.ResizeObserver) new ResizeObserver(placeLegend).observe($('sheet'));
  addEventListener('resize',placeLegend);
  placeLegend();
}
