/* 運営の画面(推測されにくい名前のファイル。README §1b)。合言葉を入れると、この端末の匿名 uid が loo-admins に登録される(ルールが loo-secret/admin の合言葉と照合)。
   申請(loo-requests)を見て、許可(loo-toilets に移す)・却下(消す)。運営かどうかは firestore.rules の looIsAdmin()(loo-admins/<uid> があるか)が決める */
const $=id=>document.getElementById(id);
const ts=()=>firebase.firestore.FieldValue.serverTimestamp();
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const BRANDS={seven:'セブン',family:'ファミマ',lawson:'ローソン',seico:'セーコマ',other:'その他'};
const LOANS={yes:'借りられる',ask:'声をかけて',no:'借りられない'};
const dist=(a,b)=>{ const R=6371000,r=Math.PI/180,dl=(b.lat-a.lat)*r,dg=(b.lng-a.lng)*r,h=Math.sin(dl/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dg/2)**2; return 2*R*Math.asin(Math.sqrt(h)); };
const when=t=>{ try{ const d=t&&t.toDate?t.toDate():null; return d?d.toLocaleString('ja-JP',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):''; }catch(e){ return ''; } };

let db=null, map=null, markers=[], pend=[], added=[], miss=[], admins=[], rejects=[], blocked=[], hidden=[], editing=new Set(), seenPend=null, q={pend:'',miss:'',added:''}, adminsLoaded=false, fitted=false, me=null, sel=null, unsubs=[], beat=null, adminsErr=false;
const ONLINE_MS=10*60*1000;   // 最終アクセスがこの時間以内なら「いま入っている」

function start(){
  const cfg=window.FIREBASE_CONFIG;
  if (!(cfg&&cfg.projectId&&window.firebase)){ showLogin(null,'Firebase の設定がありません'); return; }
  firebase.initializeApp(cfg); db=firebase.firestore();
  // アプリと同じ匿名ログイン(同じブラウザならアプリと同じ uid)。運営かどうかは loo-admins/<uid> があるかどうか
  firebase.auth().onAuthStateChanged(u=>{ if (u) onUser(u); else firebase.auth().signInAnonymously().catch(e=>showLogin(null,'ログインできませんでした: '+(e.code||e.message))); });
}
function stop(){ seenPend=null; unsubs.forEach(f=>f()); unsubs=[]; if (beat){ clearInterval(beat); beat=null; } }
function showLogin(u,msg){
  stop(); $('main').hidden=true; $('login').hidden=false;
  if (!$('lbear').firstChild) $('lbear').innerHTML=bearSvg(92,'normal');
  $('msg').textContent=msg||'';
  if (!u) return;
  const go=async()=>{
    const code=$('code').value; if (!code) return;
    try{ await db.collection('loo-admins').doc(u.uid).set({code,createdAt:ts()}); $('code').value=''; onUser(u); }
    catch(e){ $('msg').textContent='入れませんでした(合言葉が違うか、まだ設定されていません)'; }
  };
  $('lform').onsubmit=ev=>{ ev.preventDefault(); go(); };
  $('code').focus();
}
async function onUser(u){
  stop(); me=u.uid; adminsLoaded=false;
  let ok=false;
  try{ ok=(await db.collection('loo-admins').doc(u.uid).get()).exists; }catch(e){ ok=false; }
  if (!ok){ showLogin(u); return; }
  $('login').hidden=true; $('main').hidden=false; $('msg').textContent='';
  $('tbear').innerHTML=bearSvg(34,'happy');
  $('logout').onclick=async()=>{ try{ await db.collection('loo-admins').doc(u.uid).delete(); }catch(e){} onUser(u); };
  initMap();
  // 最終アクセスを残す(管理者の端末の一覧で、いま入っているか・知らない端末がないかを見る)
  const ping=()=>db.collection('loo-admins').doc(u.uid).update({lastSeen:ts()}).catch(()=>{});
  ping(); beat=setInterval(ping,5*60*1000);
  const denied=e=>{ console.warn(e); $('main').hidden=true; showLogin(null,'読めませんでした: '+(e.code||e.message)); };
  unsubs.push(db.collection('loo-requests').onSnapshot(s=>{
    const list=s.docs.map(d=>({id:d.id,...d.data()})).sort((x,y)=>(x.createdAt?x.createdAt.toMillis():0)-(y.createdAt?y.createdAt.toMillis():0));
    list.forEach((r,i)=>{ r._n=i+1; });   // 地図のピンの番号(古い順)。並べ替えても変わらない
    if (seenPend){ const fresh=list.filter(r=>!seenPend.has(r.id)); if (fresh.length) notifyNew(fresh.length); }
    seenPend=new Set(list.map(r=>r.id)); pend=list; render();
  },denied));
  unsubs.push(db.collection('loo-reports').where('kind','==','missing').onSnapshot(s=>{ miss=s.docs.map(d=>d.data()); render(); },denied));
  unsubs.push(db.collection('loo-toilets').onSnapshot(s=>{ added=s.docs.map(d=>({id:d.id,...d.data()})); render(); },denied));
  // 却下の記録・ブロック・非表示(新しいコレクション。ルールを貼る前は読めないので、エラーは無視して空のまま)
  const soft=(name,set)=>unsubs.push(db.collection(name).onSnapshot(s=>{ set(s.docs.map(d=>({id:d.id,...d.data()}))); render(); },e=>console.warn(name,e.code)));
  soft('loo-rejects',a=>{ rejects=a; }); soft('loo-blocked',a=>{ blocked=a; }); soft('loo-hidden',a=>{ hidden=a; });
  unsubs.push(db.collection('loo-admins').onSnapshot(s=>{ adminsErr=false; adminsLoaded=true; admins=s.docs.map(d=>({id:d.id,...d.data()})); render(); },e=>{ adminsErr=true; render(); }));
}

// 地図は、サイトと同じ(OpenFreeMap の淡い地図・暗いときは dark。地名は日本語だけ、店アイコン・標識は消す)
function tidyStyle(m){
  for (const l of m.getStyle().layers){
    if (l.type!=='symbol') continue;
    const sl=l['source-layer']||'', id=l.id;
    if (id==='poi_transit') m.setFilter(id,['==',['get','class'],'rail']);
    const hide=(sl==='poi'&&id!=='poi_transit')||/shield/.test(id)||sl==='housenumber'||(sl==='place'&&/neighbourhood|quarter|suburb|hamlet|other/.test(id));
    if (hide){ m.setLayoutProperty(id,'visibility','none'); continue; }
    if (m.getLayoutProperty(id,'text-field')) m.setLayoutProperty(id,'text-field',['coalesce',['get','name:ja'],['get','name']]);
  }
}
function initMap(){
  if (map) return;
  const dark=matchMedia('(prefers-color-scheme: dark)').matches;
  map=new maplibregl.Map({container:'map',style:'https://tiles.openfreemap.org/styles/'+(dark?'dark':'positron'),center:[141.353,43.0545],zoom:15.5,attributionControl:false,dragRotate:false,pitchWithRotate:false,touchPitch:false});
  map.touchZoomRotate.disableRotation();
  map.addControl(new maplibregl.AttributionControl({compact:true}),'bottom-right');
  map.addControl(new maplibregl.NavigationControl({showCompass:false}),'top-right');
  map.once('style.load',()=>tidyStyle(map));
  // サイトと同じく、引いた地図(zoom 15 未満)ではコンビニを出さない
  const zc=()=>$('map').classList.toggle('lowzoom',map.getZoom()<15);
  map.on('zoom',zc); zc();
}
// ピン: 公開中のトイレ=青赤の半々(サイトと同じ)、コンビニ=小さな白丸、許可待ち=橙の丸+番号
const BRAND_COLOR={seven:'#e5484d',family:'#2fa65a',lawson:'#3a9bdc',seico:'#f08a24',other:'#b9b4ad'};
// kind: toilet / conv / pend。外側の要素には transform を付けない(maplibre が位置に使う)ので、見た目は内側(.pp)に付ける
function pinHtml(kind,t,n,sm){
  const cls=kind==='pend'?'p':kind==='conv'?'c':'t', ic=kind==='conv'?icon('store',14):icon('wc',kind==='pend'?16:16);
  const st=kind==='conv'?' style="--bc:'+(BRAND_COLOR[t&&t.brand]||BRAND_COLOR.other)+'"':'';
  return '<i class="pp '+cls+(sm?' sm':'')+'"'+st+'>'+ic+(kind==='pend'?DASH_SVG+'<span class="n">'+n+'</span>':'')+'</i>';
}
function syncMarkers(){
  if (!map) return;
  markers.forEach(m=>m.remove()); markers=[];
  const add=(p,kind,n,click)=>{ const e=document.createElement('div'); e.className=kind==='conv'?'cv':''; e.innerHTML=pinHtml(kind,p,n); if (click){ e.style.cursor='pointer'; e.onclick=click; } markers.push(new maplibregl.Marker({element:e}).setLngLat([p.lng,p.lat]).addTo(map)); };
  TOILETS.concat(added).forEach(t=>add(t,t.type==='conv'?'conv':'toilet'));
  pend.forEach((t,i)=>add(t,'pend',String(i+1),()=>pick(t.id)));
  // 最初に申請が読めたとき、申請の場所が見えるように寄る(あとは動かさない)
  if (!fitted&&pend.length){ fitted=true; const b=new maplibregl.LngLatBounds(); pend.forEach(t=>b.extend([t.lng,t.lat])); map.fitBounds(b,{padding:70,maxZoom:16,duration:0}); }
}
function initLegend(){ $('lg-t').innerHTML=icon('wc',13); $('lg-c').innerHTML=icon('store',12); $('lg-p').innerHTML=icon('wc',13)+DASH_SVG; }

// 新しい申請が届いたとき、上に知らせを出す(タップで申請の画面へ)。タブのタイトルの件数は render() で更新
function notifyNew(n){
  const b=$('newbar'); b.hidden=false; b.textContent='新しい申請が '+n+' 件届きました(タップで見る)';
  b.onclick=()=>{ b.hidden=true; const t=document.querySelector('#nav [data-tab=pending]'); if (t&&getComputedStyle($('nav')).display!=='none') t.click(); else scrollTo({top:$('pending').getBoundingClientRect().top+scrollY-80,behavior:'smooth'}); };
}
// 申請の近くにすでにある場所(データ + 公開中のユーザー追加)
function nearOf(r){
  return TOILETS.concat(added).filter(x=>x.type===r.type).map(x=>({x,d:dist(r,x)})).filter(o=>o.d<=40).sort((a,b)=>a.d-b.d).slice(0,4);
}
const sel_=(id,opts,cur)=>'<select id="'+id+'">'+opts.map(([v,l])=>'<option value="'+v+'"'+(String(cur)===String(v)?' selected':'')+'>'+l+'</option>').join('')+'</select>';

// 名前・種類・階・料金などの入力欄(申請の編集と、公開中の編集で同じものを使う)
function fieldsHtml(r){
  const conv=r.type==='conv';
  return '<div class="row">'
    +'<label>名前<input type="text" data-k="name" value="'+esc(r.name)+'" maxlength="40"></label>'
    +'<label>種類'+sel_('', [['toilet','トイレ'],['conv','コンビニ']],r.type).replace('<select id=""','<select data-k="type"')+'</label>'
    +(conv?'<label>ブランド'+sel_('',Object.entries(BRANDS),r.brand).replace('<select id=""','<select data-k="brand"')+'</label><label>貸し出し'+sel_('',Object.entries(LOANS),r.loan).replace('<select id=""','<select data-k="loan"')+'</label>'
      :'<label>階(数字。地下は -1)<input type="text" data-k="floor" value="'+(r.floor==null?'':r.floor)+'" size="4"></label>'
       +'<label>料金'+sel_('',[['','不明'],['free','無料'],['paid','有料']],r.fee===true?'paid':r.fee===false?'free':'').replace('<select id=""','<select data-k="fee"')+'</label>'
       +'<label>車いす'+sel_('',[['','不明'],['yes','可'],['no','不可']],r.wheelchair===true?'yes':r.wheelchair===false?'no':'').replace('<select id=""','<select data-k="wheelchair"')+'</label>')
    +'</div>'
    +'<div class="row"><label style="width:100%">メモ<textarea data-k="note" maxlength="200">'+esc(r.note)+'</textarea></label></div>';
}
const blockedSet=()=>new Set(blocked.map(b=>b.id));
// 申請者ごとの履歴: 許可(公開中の自分の投稿のうち許可済み)・却下(記録)・申請中
function histOf(uid){ return {ok:added.filter(x=>x.uid===uid&&x.approved).length, ng:rejects.filter(x=>x.uid===uid).length, pe:pend.filter(x=>x.uid===uid).length}; }
function card(r){
  const near=nearOf(r), h=histOf(r.uid), isB=blockedSet().has(r.uid);
  const nh=near.length?'<div class="near warn">近くに既にある: '+near.map(o=>esc(o.x.name||'(名前なし)')+' '+Math.round(o.d)+'m').join(' / ')+'(重複かもしれません)</div>':'<div class="near">40m 以内に同じ種類の場所はありません</div>';
  return '<div class="card'+(sel===r.id?' on':'')+'" data-id="'+esc(r.id)+'">'
    +'<div><span class="num">'+r._n+'</span><b>'+esc(r.name)+'</b> <span class="pill">'+(r.type==='conv'?'コンビニ':'トイレ')+'</span><span class="sub">'+when(r.createdAt)+' ・ <a href="https://www.google.com/maps?q='+r.lat+','+r.lng+'" target="_blank" rel="noopener">Google マップ</a></span></div>'
    +'<div class="sub" style="margin-top:4px">申請者 '+esc(String(r.uid).slice(0,6))+': 許可 '+h.ok+' ・ 却下 '+h.ng+' ・ 申請中 '+h.pe+(isB?' <span class="pill" style="background:var(--ng);color:#fff">ブロック中</span>':'')+'</div>'
    +nh+fieldsHtml(r)
    +'<div class="acts"><button class="ok" data-a="approve">許可して公開</button><button class="ng" data-a="reject">却下(消す)</button><button data-a="fly">地図で見る</button>'+(isB?'':'<button class="ng" data-a="block" style="margin-left:auto">この人をブロック</button>')+'</div>'
    +'</div>';
}
function addedCard(t){
  const on=editing.has(t.id);
  return '<div class="card" data-aid="'+esc(t.id)+'"><div><b>'+esc(t.name)+'</b> <span class="pill">'+(t.type==='conv'?'コンビニ':'トイレ')+'</span>'+(t.approved?'<span class="pill">許可済み</span>':'<span class="pill">許可制の前の投稿</span>')+'<span class="sub">'+when(t.createdAt)+'</span>'
    +'<span style="float:right;display:inline-flex;gap:6px">'+(on?'':'<button data-a="aedit">編集</button>')+'<button class="ng" data-a="del">削除</button></span></div>'
    +(on?fieldsHtml(t)+'<div class="acts"><button class="ok" data-a="asave">保存</button><button data-a="acancel">キャンセル</button></div>':'')
    +'</div>';
}

// 「ここにはなかった」の報告が付いた場所(人数の多い順)。ユーザー追加(u-<ID>)は削除できる
function renderMissing(){
  const hiddenIds=new Set(hidden.map(h=>h.id)), ql=q.miss.trim().toLowerCase();
  const by={}; miss.forEach(r=>{ (by[r.toiletId]=by[r.toiletId]||new Set()).add(r.uid); });
  const all=Object.entries(by).map(([id,s])=>({id,n:s.size,t:id.startsWith('u-')?added.find(x=>x.id===id.slice(2)):TOILETS.find(x=>x.id===id)})).filter(o=>o.t).sort((a,b)=>b.n-a.n);
  const rows=all.filter(o=>!ql||String(o.t.name||'').toLowerCase().includes(ql));
  $('mn').textContent=all.length||'なし'; $('mn').classList.toggle('hot',all.some(o=>o.n>=3&&!hiddenIds.has(o.id)));
  $('missing').innerHTML=rows.map(o=>{
    const user=o.id.startsWith('u-'), hid=hiddenIds.has(o.id);
    return '<div class="card" data-mid="'+esc(o.id)+'"><b>'+esc(o.t.name||'(名前なし)')+'</b> <span class="pill">'+(o.t.type==='conv'?'コンビニ':'トイレ')+'</span><span class="pill">'+o.n+'人が「なかった」'+(o.n>=3&&!hid?'(アプリで薄く表示中)':'')+'</span> <a href="https://www.google.com/maps?q='+o.t.lat+','+o.t.lng+'" target="_blank" rel="noopener">Google マップ</a>'
      +'<span style="float:right">'+(user?'<button class="ng" data-a="mdel">削除</button>':hid?'<span class="pill">非表示中</span>':'<button class="ng" data-a="mhide">アプリで非表示にする</button>')+'</span></div>';
  }).join('')||'<div class="empty">'+(all.length?'該当なし':'なし')+'</div>';
  document.querySelectorAll('#missing [data-a=mdel]').forEach(b=>b.onclick=async()=>{
    const id=b.closest('.card').dataset.mid.slice(2), t=added.find(x=>x.id===id);
    if (!confirm('「'+(t?t.name:id)+'」を削除します(元に戻せません)')) return;
    try{ await db.collection('loo-toilets').doc(id).delete(); }catch(e){ alert('削除できませんでした: '+(e.code||e.message)); }
  });
  document.querySelectorAll('#missing [data-a=mhide]').forEach(b=>b.onclick=()=>hideData(b.closest('.card').dataset.mid));
}
// 公開データ(OSM)を、アプリで出さないようにする(loo-hidden)。戻すと、また出る
async function hideData(id){
  const t=TOILETS.find(x=>x.id===id); if (!t) return;
  if (!confirm('「'+(t.name||'(名前なし)')+'」をアプリで非表示にします(あとで戻せます)')) return;
  try{ await db.collection('loo-hidden').doc(id).set({at:ts(),name:t.name||''}); }catch(e){ alert('できませんでした: '+(e.code||e.message)+'(ルールの貼り替えが済んでいるか確認してください)'); }
}
function renderHidden(){
  $('hn').textContent=hidden.length||'なし';
  $('hidden').innerHTML=hidden.map(h=>{ const t=TOILETS.find(x=>x.id===h.id); return '<div class="card" data-hid="'+esc(h.id)+'"><b>'+esc((t&&t.name)||h.name||'(名前なし)')+'</b> <span class="pill">'+((t&&t.type)==='conv'?'コンビニ':'トイレ')+'</span><span class="sub">'+when(h.at)+'</span><span style="float:right"><button data-a="unhide">戻す</button></span></div>'; }).join('')||'<div class="empty">なし</div>';
  document.querySelectorAll('#hidden [data-a=unhide]').forEach(b=>b.onclick=async()=>{ try{ await db.collection('loo-hidden').doc(b.closest('.card').dataset.hid).delete(); }catch(e){ alert('できませんでした: '+(e.code||e.message)); } });
}
function renderBlocked(){
  $('bn').textContent=blocked.length||'なし';
  $('blocked').innerHTML=blocked.map(b=>'<div class="card" data-bid="'+esc(b.id)+'"><b>'+esc(b.id.slice(0,8))+'</b> <span class="sub">'+esc(b.name||'')+' ・ '+when(b.at)+'</span><span style="float:right"><button data-a="unblock">解除</button></span></div>').join('')||'<div class="empty">なし</div>';
  document.querySelectorAll('#blocked [data-a=unblock]').forEach(b=>b.onclick=async()=>{ if (!confirm('ブロックを解除します')) return; try{ await db.collection('loo-blocked').doc(b.closest('.card').dataset.bid).delete(); }catch(e){ alert('できませんでした: '+(e.code||e.message)); } });
}
// 上の数字と、管理者の端末の一覧。端末の数が前回見たときより増えていたら赤くして知らせる(知らない人が入っていないかの見張り)
const lastSeenMs=a=>a.lastSeen&&a.lastSeen.toMillis?a.lastSeen.toMillis():0;
function renderAdmins(){
  if (!adminsLoaded&&!adminsErr) return;   // 読み込み前の 0 台を基準にしない
  const n=admins.length, on=admins.filter(a=>Date.now()-lastSeenMs(a)<=ONLINE_MS).length;
  let prev=null; try{ const v=localStorage.getItem('loo-admin-count'); prev=v==null?null:+v; }catch(e){}
  const grew=prev!=null&&n>prev, el=$('st-admins');
  el.classList.toggle('alert',grew);
  el.innerHTML='<b>'+(adminsErr?'?':n)+'台</b><span>管理者の端末(いま入っている: '+on+'台)'+(grew?' ・前回より +'+(n-prev)+'台':'')+'</span>';
  $('adn').textContent=adminsErr?'':n+'台'; $('adn').classList.toggle('hot',grew);
  if (adminsErr){ $('admins').innerHTML='<div class="empty">一覧を読めません。ルールの貼り替えが済んでいるか確認してください</div>'; return; }
  $('admins').innerHTML='<table><thead><tr><th>端末</th><th>登録</th><th>最終アクセス</th><th></th></tr></thead><tbody>'
    +admins.slice().sort((a,b)=>lastSeenMs(b)-lastSeenMs(a)).map(a=>{ const live=Date.now()-lastSeenMs(a)<=ONLINE_MS; return '<tr data-uid="'+esc(a.id)+'"><td><span class="dot'+(live?' on':'')+'"></span>'+esc(a.id.slice(0,8))+(a.id===me?' <span class="pill me">この端末</span>':'')+'</td><td>'+when(a.createdAt)+'</td><td>'+(lastSeenMs(a)?when(a.lastSeen):'-')+'</td><td style="text-align:right">'+(a.id===me?'':'<button class="ng" data-a="kick">外す</button>')+'</td></tr>'; }).join('')+'</tbody></table>'
    +'<div class="sub" style="margin-top:8px"><button data-a="ack" style="padding:4px 10px;font-size:12px">いまの台数を確認済みにする</button></div>';
  document.querySelectorAll('#admins [data-a=kick]').forEach(b=>b.onclick=async()=>{
    const id=b.closest('tr').dataset.uid;
    if (!confirm('この端末(' + id.slice(0,8) + ')を運営から外します')) return;
    try{ await db.collection('loo-admins').doc(id).delete(); }catch(e){ alert('外せませんでした: '+(e.code||e.message)); }
  });
  const ack=document.querySelector('#admins [data-a=ack]'); if (ack) ack.onclick=()=>{ try{ localStorage.setItem('loo-admin-count',String(n)); }catch(e){} renderAdmins(); };
  if (prev==null) { try{ localStorage.setItem('loo-admin-count',String(n)); }catch(e){} }
}
// 下の切り替え(狭い画面だけ表示される。広い画面は全部並ぶ)
function initTabs(){
  document.body.dataset.tab='overview';
  document.querySelectorAll('#nav [data-i]').forEach(s=>{ s.outerHTML=icon(s.dataset.i,22); });
  document.querySelectorAll('#nav [data-tab]').forEach(b=>b.onclick=()=>{
    document.body.dataset.tab=b.dataset.tab;
    document.querySelectorAll('#nav [data-tab]').forEach(x=>x.classList.toggle('on',x===b));
    scrollTo(0,0); if (b.dataset.tab==='map'&&map) setTimeout(()=>map.resize(),0);
  });
}
function renderStats(){
  const ua=added.filter(t=>t.uid).length, mset=new Set(miss.map(r=>r.toiletId)).size;
  $('tb-pend').textContent=pend.length||''; $('tb-rep').textContent=mset||'';
  $('st-pend').textContent=pend.length; $('st-miss').textContent=mset; $('st-pub').textContent=ua;
}
let dirty=false;
// 入力中に再描画すると直している最中の値が消えるので、入力が終わってから描き直す
function typing(){ const a=document.activeElement; return !!(a&&a.closest&&a.closest('#pending,#added')&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)); }
addEventListener('focusout',()=>setTimeout(()=>{ if (dirty&&!typing()){ dirty=false; render(); } },0));
function render(){
  document.title=(pend.length?'('+pend.length+') ':'')+'運営 | 札幌トイレ・コンビニマップ';
  if (typing()){ dirty=true; return; }
  renderStats(); renderAdmins(); renderBlocked(); renderHidden();
  $('pn').textContent=pend.length||'なし'; $('pn').classList.toggle('hot',pend.length>0);
  // 申請: 名前で絞り込み・並べ替え(番号は地図のピンと同じまま)
  const qp=q.pend.trim().toLowerCase(), sp=$('s-pend').value;
  let pl=pend.filter(r=>!qp||String(r.name).toLowerCase().includes(qp));
  if (sp==='new') pl=pl.slice().sort((a,b)=>b._n-a._n); else if (sp==='dup') pl=pl.slice().sort((a,b)=>nearOf(b).length-nearOf(a).length||a._n-b._n);
  $('pending').innerHTML=pl.length?pl.map(card).join(''):'<div class="empty">'+(pend.length?'該当なし':'許可待ちはありません')+'</div>';
  renderMissing();
  const ua=added.filter(t=>t.uid), qa=q.added.trim().toLowerCase(), sa=$('s-added').value;
  $('an').textContent=ua.length||'なし';
  let al=ua.filter(t=>!qa||String(t.name).toLowerCase().includes(qa));
  al=al.slice().sort(sa==='name'?(a,b)=>String(a.name).localeCompare(String(b.name),'ja'):(a,b)=>(b.createdAt?b.createdAt.toMillis():0)-(a.createdAt?a.createdAt.toMillis():0));
  $('added').innerHTML=al.map(addedCard).join('')||'<div class="empty">'+(ua.length?'該当なし':'なし')+'</div>';
  document.querySelectorAll('#pending .card').forEach(c=>{
    const r=pend.find(x=>x.id===c.dataset.id);
    c.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>act(b.dataset.a,r,c));
    c.onclick=e=>{ if (e.target.closest('button,input,select,textarea,a')) return; pick(r.id); };
  });
  document.querySelectorAll('#added .card').forEach(c=>{
    const t=added.find(x=>x.id===c.dataset.aid);
    c.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>actAdded(b.dataset.a,t,c));
  });
  syncMarkers();
}
function pick(id){ sel=id; const r=pend.find(x=>x.id===id); document.querySelectorAll('#pending .card').forEach(c=>c.classList.toggle('on',c.dataset.id===id)); if (r&&map) map.flyTo({center:[r.lng,r.lat],zoom:17}); const el=document.querySelector('#pending .card[data-id="'+id+'"]'); if (el) el.scrollIntoView({block:'nearest'}); }

// 画面で直した値を、保存できる形(ルールの型)にする。公開中の編集では、許可済みの印(approved)を元のまま残す
function edited(r,c,keep){
  const v=k=>{ const e=c.querySelector('[data-k='+k+']'); return e?e.value:null; };
  const type=v('type'), conv=type==='conv';
  const fl=v('floor'); let floor=null;
  if (!conv&&fl!=null&&fl.trim()!==''){ floor=parseInt(fl,10); if (isNaN(floor)||floor<-3||floor>30) throw new Error('階は -3〜30 の数字で入れてください'); }
  const name=(v('name')||'').trim(); if (!name) throw new Error('名前が空です');
  const o={name,lat:r.lat,lng:r.lng,type,
    fee:conv?null:(v('fee')==='free'?false:v('fee')==='paid'?true:null),
    wheelchair:conv?null:(v('wheelchair')==='yes'?true:v('wheelchair')==='no'?false:null),
    floor:conv?null:floor, ease:r.ease??null, find:r.find??null,
    brand:conv?(v('brand')||r.brand||'other'):null, loan:conv?(v('loan')||r.loan||null):null,
    note:(v('note')||'').trim(), uid:r.uid, createdAt:r.createdAt};
  if (!keep||r.approved) o.approved=true;
  if (!conv&&r.stalls) o.stalls=r.stalls;
  return o;
}
const rejectOps=(b,r)=>{ b.set(db.collection('loo-rejects').doc(r.id),{uid:r.uid,name:r.name,at:ts()}); b.delete(db.collection('loo-requests').doc(r.id)); };
async function act(a,r,c){
  if (a==='fly'){ pick(r.id); return; }
  try{
    if (a==='reject'){ if (!confirm('「'+r.name+'」を却下して消します')) return; const b=db.batch(); rejectOps(b,r); await b.commit(); return; }
    if (a==='approve'){
      const o=edited(r,c), b=db.batch();
      b.set(db.collection('loo-toilets').doc(r.id),o); b.delete(db.collection('loo-requests').doc(r.id));
      await b.commit();
    }
    if (a==='block'){
      const mine=pend.filter(x=>x.uid===r.uid);
      if (!confirm('この申請者('+String(r.uid).slice(0,6)+')をブロックします。以後は申請できません。申請中の'+mine.length+'件は却下して消します')) return;
      const b=db.batch(); b.set(db.collection('loo-blocked').doc(r.uid),{at:ts(),name:r.name}); mine.forEach(x=>rejectOps(b,x)); await b.commit();
    }
  }catch(e){ alert('できませんでした: '+(e.code||e.message)); }
}
// 公開中のユーザー追加: 編集・保存・削除
async function actAdded(a,t,c){
  try{
    if (a==='aedit'){ editing.add(t.id); render(); return; }
    if (a==='acancel'){ editing.delete(t.id); render(); return; }
    if (a==='asave'){ await db.collection('loo-toilets').doc(t.id).set(edited(t,c,true)); editing.delete(t.id); render(); return; }
    if (a==='del'){ if (!confirm('「'+t.name+'」を削除します(元に戻せません)')) return; await db.collection('loo-toilets').doc(t.id).delete(); }
  }catch(e){ alert('できませんでした: '+(e.code||e.message)); }
}
function initTools(){
  [['q-pend','pend'],['q-miss','miss'],['q-added','added']].forEach(([id,k])=>{ $(id).oninput=e=>{ q[k]=e.target.value; render(); }; });
  $('s-pend').onchange=render; $('s-added').onchange=render;
}
initLegend();
initTools();
initTabs();
start();
