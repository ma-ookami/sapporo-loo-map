/* 運営の画面(推測されにくい名前のファイル。README §1b)。合言葉を入れると、この端末の匿名 uid が loo-admins に登録される(ルールが loo-secret/admin の合言葉と照合)。
   申請(loo-requests)を見て、許可(loo-toilets に移す)・却下(消す)。運営かどうかは firestore.rules の looIsAdmin()(loo-admins/<uid> があるか)が決める */
const $=id=>document.getElementById(id);
const ts=()=>firebase.firestore.FieldValue.serverTimestamp();
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const BRANDS={seven:'セブン',family:'ファミマ',lawson:'ローソン',seico:'セーコマ',other:'その他'};
const LOANS={yes:'借りられる',ask:'声をかけて',no:'借りられない'};
const dist=(a,b)=>{ const R=6371000,r=Math.PI/180,dl=(b.lat-a.lat)*r,dg=(b.lng-a.lng)*r,h=Math.sin(dl/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dg/2)**2; return 2*R*Math.asin(Math.sqrt(h)); };
const when=t=>{ try{ const d=t&&t.toDate?t.toDate():null; return d?d.toLocaleString('ja-JP',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):''; }catch(e){ return ''; } };

let db=null, map=null, markers=[], pend=[], added=[], miss=[], admins=[], adminsLoaded=false, fitted=false, me=null, sel=null, unsubs=[], beat=null, adminsErr=false;
const ONLINE_MS=10*60*1000;   // 最終アクセスがこの時間以内なら「いま入っている」

function start(){
  const cfg=window.FIREBASE_CONFIG;
  if (!(cfg&&cfg.projectId&&window.firebase)){ showLogin(null,'Firebase の設定がありません'); return; }
  firebase.initializeApp(cfg); db=firebase.firestore();
  // アプリと同じ匿名ログイン(同じブラウザならアプリと同じ uid)。運営かどうかは loo-admins/<uid> があるかどうか
  firebase.auth().onAuthStateChanged(u=>{ if (u) onUser(u); else firebase.auth().signInAnonymously().catch(e=>showLogin(null,'ログインできませんでした: '+(e.code||e.message))); });
}
function stop(){ unsubs.forEach(f=>f()); unsubs=[]; if (beat){ clearInterval(beat); beat=null; } }
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
  unsubs.push(db.collection('loo-requests').onSnapshot(s=>{ pend=s.docs.map(d=>({id:d.id,...d.data()})).sort((x,y)=>(x.createdAt?x.createdAt.toMillis():0)-(y.createdAt?y.createdAt.toMillis():0)); render(); },denied));
  unsubs.push(db.collection('loo-reports').where('kind','==','missing').onSnapshot(s=>{ miss=s.docs.map(d=>d.data()); render(); },denied));
  unsubs.push(db.collection('loo-toilets').onSnapshot(s=>{ added=s.docs.map(d=>({id:d.id,...d.data()})); render(); },denied));
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

// 申請の近くにすでにある場所(データ + 公開中のユーザー追加)
function nearOf(r){
  return TOILETS.concat(added).filter(x=>x.type===r.type).map(x=>({x,d:dist(r,x)})).filter(o=>o.d<=40).sort((a,b)=>a.d-b.d).slice(0,4);
}
const sel_=(id,opts,cur)=>'<select id="'+id+'">'+opts.map(([v,l])=>'<option value="'+v+'"'+(String(cur)===String(v)?' selected':'')+'>'+l+'</option>').join('')+'</select>';

function card(r,i){
  const conv=r.type==='conv', near=nearOf(r);
  const nh=near.length?'<div class="near warn">近くに既にある: '+near.map(o=>esc(o.x.name||'(名前なし)')+' '+Math.round(o.d)+'m').join(' / ')+'(重複かもしれません)</div>':'<div class="near">40m 以内に同じ種類の場所はありません</div>';
  return '<div class="card'+(sel===r.id?' on':'')+'" data-id="'+esc(r.id)+'">'
    +'<div><span class="num">'+(i+1)+'</span><b>'+esc(r.name)+'</b> <span class="pill">'+(conv?'コンビニ':'トイレ')+'</span><span class="sub">'+when(r.createdAt)+' ・ 申請者 '+esc(String(r.uid).slice(0,6))+' ・ <a href="https://www.google.com/maps?q='+r.lat+','+r.lng+'" target="_blank" rel="noopener">Google マップ</a></span></div>'
    +nh
    +'<div class="row">'
    +'<label>名前<input type="text" data-k="name" value="'+esc(r.name)+'" maxlength="40"></label>'
    +'<label>種類'+sel_('', [['toilet','トイレ'],['conv','コンビニ']],r.type).replace('<select id=""','<select data-k="type"')+'</label>'
    +(conv?'<label>ブランド'+sel_('',Object.entries(BRANDS),r.brand).replace('<select id=""','<select data-k="brand"')+'</label><label>貸し出し'+sel_('',Object.entries(LOANS),r.loan).replace('<select id=""','<select data-k="loan"')+'</label>'
      :'<label>階(数字。地下は -1)<input type="text" data-k="floor" value="'+(r.floor==null?'':r.floor)+'" size="4"></label>'
       +'<label>料金'+sel_('',[['','不明'],['free','無料'],['paid','有料']],r.fee===true?'paid':r.fee===false?'free':'').replace('<select id=""','<select data-k="fee"')+'</label>'
       +'<label>車いす'+sel_('',[['','不明'],['yes','可'],['no','不可']],r.wheelchair===true?'yes':r.wheelchair===false?'no':'').replace('<select id=""','<select data-k="wheelchair"')+'</label>')
    +'</div>'
    +'<div class="row"><label style="width:100%">メモ<textarea data-k="note" maxlength="200">'+esc(r.note)+'</textarea></label></div>'
    +'<div class="acts"><button class="ok" data-a="approve">許可して公開</button><button class="ng" data-a="reject">却下(消す)</button><button data-a="fly">地図で見る</button></div>'
    +'</div>';
}

// 「ここにはなかった」の報告が付いた場所(人数の多い順)。ユーザー追加(u-<ID>)は削除できる
function renderMissing(){
  const by={}; miss.forEach(r=>{ (by[r.toiletId]=by[r.toiletId]||new Set()).add(r.uid); });
  const rows=Object.entries(by).map(([id,s])=>({id,n:s.size,t:id.startsWith('u-')?added.find(x=>x.id===id.slice(2)):TOILETS.find(x=>x.id===id)})).filter(o=>o.t).sort((a,b)=>b.n-a.n);
  $('mn').textContent=rows.length||'なし'; $('mn').classList.toggle('hot',rows.some(o=>o.n>=3));
  $('missing').innerHTML=rows.map(o=>'<div class="card" data-mid="'+esc(o.id)+'"><b>'+esc(o.t.name||'(名前なし)')+'</b> <span class="pill">'+(o.t.type==='conv'?'コンビニ':'トイレ')+'</span><span class="pill">'+o.n+'人が「なかった」'+(o.n>=3?'(アプリで薄く表示中)':'')+'</span> <a href="https://www.google.com/maps?q='+o.t.lat+','+o.t.lng+'" target="_blank" rel="noopener">Google マップ</a>'+(o.id.startsWith('u-')?' <button class="ng" data-a="mdel" style="float:right">削除</button>':' <span class="sub">(公開データ)</span>')+'</div>').join('')||'<div class="empty">なし</div>';
  document.querySelectorAll('#missing [data-a=mdel]').forEach(b=>b.onclick=async()=>{
    const id=b.closest('.card').dataset.mid.slice(2), t=added.find(x=>x.id===id);
    if (!confirm('「'+(t?t.name:id)+'」を削除します(元に戻せません)')) return;
    try{ await db.collection('loo-toilets').doc(id).delete(); }catch(e){ alert('削除できませんでした: '+(e.code||e.message)); }
  });
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
function typing(){ const a=document.activeElement; return !!(a&&a.closest&&a.closest('#pending')&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)); }
addEventListener('focusout',()=>setTimeout(()=>{ if (dirty&&!typing()){ dirty=false; render(); } },0));
function render(){
  if (typing()){ dirty=true; return; }
  renderStats(); renderAdmins();
  $('pn').textContent=pend.length||'なし'; $('pn').classList.toggle('hot',pend.length>0);
  $('pending').innerHTML=pend.length?pend.map(card).join(''):'<div class="empty">許可待ちはありません</div>';
  renderMissing();
  const ua=added.filter(t=>t.uid);
  $('an').textContent=ua.length||'なし';
  $('added').innerHTML=ua.map(t=>'<div class="card" data-aid="'+esc(t.id)+'"><b>'+esc(t.name)+'</b> <span class="pill">'+(t.type==='conv'?'コンビニ':'トイレ')+'</span>'+(t.approved?'<span class="pill">許可済み</span>':'<span class="pill">許可制の前の投稿</span>')+' <button class="ng" data-a="del" style="float:right">削除</button></div>').join('')||'<div class="empty">なし</div>';
  document.querySelectorAll('#pending .card').forEach(c=>{
    const r=pend.find(x=>x.id===c.dataset.id);
    c.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>act(b.dataset.a,r,c));
    c.onclick=e=>{ if (e.target.closest('button,input,select,textarea,a')) return; pick(r.id); };
  });
  document.querySelectorAll('#added [data-a=del]').forEach(b=>b.onclick=async()=>{
    const id=b.closest('.card').dataset.aid, t=added.find(x=>x.id===id);
    if (!confirm('「'+t.name+'」を削除します(元に戻せません)')) return;
    try{ await db.collection('loo-toilets').doc(id).delete(); }catch(e){ alert('削除できませんでした: '+(e.code||e.message)); }
  });
  syncMarkers();
}
function pick(id){ sel=id; const r=pend.find(x=>x.id===id); document.querySelectorAll('#pending .card').forEach(c=>c.classList.toggle('on',c.dataset.id===id)); if (r&&map) map.flyTo({center:[r.lng,r.lat],zoom:17}); const el=document.querySelector('#pending .card[data-id="'+id+'"]'); if (el) el.scrollIntoView({block:'nearest'}); }

// 画面で直した値を、保存できる形(ルールの型)にする
function edited(r,c){
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
    note:(v('note')||'').trim(), uid:r.uid, createdAt:r.createdAt, approved:true};
  if (!conv&&r.stalls) o.stalls=r.stalls;
  return o;
}
async function act(a,r,c){
  if (a==='fly'){ pick(r.id); return; }
  try{
    if (a==='reject'){ if (!confirm('「'+r.name+'」を却下して消します')) return; await db.collection('loo-requests').doc(r.id).delete(); return; }
    if (a==='approve'){
      const o=edited(r,c), b=db.batch();
      b.set(db.collection('loo-toilets').doc(r.id),o); b.delete(db.collection('loo-requests').doc(r.id));
      await b.commit();
    }
  }catch(e){ alert('できませんでした: '+(e.code||e.message)); }
}
initLegend();
initTabs();
start();
