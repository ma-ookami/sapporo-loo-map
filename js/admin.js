/* 運営の画面(推測されにくい名前のファイル。README §1b)。合言葉を入れると、この端末の匿名 uid が loo-admins に登録される(ルールが loo-secret/admin の合言葉と照合)。
   申請(loo-requests)を見て、許可(loo-toilets に移す)・却下(消す)。運営かどうかは firestore.rules の looIsAdmin()(loo-admins/<uid> があるか)が決める */
const $=id=>document.getElementById(id);
const ts=()=>firebase.firestore.FieldValue.serverTimestamp();
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const BRANDS={seven:'セブン',family:'ファミマ',lawson:'ローソン',seico:'セーコマ',other:'その他'};
const LOANS={yes:'借りられる',ask:'声をかけて',no:'借りられない'};
const dist=(a,b)=>{ const R=6371000,r=Math.PI/180,dl=(b.lat-a.lat)*r,dg=(b.lng-a.lng)*r,h=Math.sin(dl/2)**2+Math.cos(a.lat*r)*Math.cos(b.lat*r)*Math.sin(dg/2)**2; return 2*R*Math.asin(Math.sqrt(h)); };
const when=t=>{ try{ const d=t&&t.toDate?t.toDate():null; return d?d.toLocaleString('ja-JP',{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'}):''; }catch(e){ return ''; } };

let db=null, map=null, markers=[], pend=[], added=[], sel=null, unsubs=[];

function start(){
  const cfg=window.FIREBASE_CONFIG;
  if (!(cfg&&cfg.projectId&&window.firebase)){ $('msg').textContent='Firebase の設定がありません'; return; }
  firebase.initializeApp(cfg); db=firebase.firestore();
  // アプリと同じ匿名ログイン(同じブラウザならアプリと同じ uid)。運営かどうかは loo-admins/<uid> があるかどうか
  firebase.auth().onAuthStateChanged(u=>{ if (u) onUser(u); else firebase.auth().signInAnonymously().catch(e=>{ $('msg').textContent='ログインできませんでした: '+(e.code||e.message); }); });
}
async function onUser(u){
  unsubs.forEach(f=>f()); unsubs=[]; $('main').hidden=true; $('msg').textContent='';
  let ok=false;
  try{ ok=(await db.collection('loo-admins').doc(u.uid).get()).exists; }catch(e){ ok=false; }
  const a=$('auth');
  if (!ok){
    a.innerHTML='<label style="flex-direction:column;display:flex;font-size:12px;color:var(--sub);gap:2px">合言葉<input id="code" type="password" autocomplete="off" style="font:inherit;padding:8px;border:1px solid var(--line);border-radius:8px;width:260px;background:var(--card);color:var(--ink)"></label><button class="cta" id="enter" style="align-self:flex-end">入る</button>';
    const go=async()=>{
      const code=$('code').value; if (!code) return;
      try{ await db.collection('loo-admins').doc(u.uid).set({code,createdAt:ts()}); onUser(u); }
      catch(e){ $('msg').textContent='入れませんでした(合言葉が違うか、まだ設定されていません)'; }
    };
    $('enter').onclick=go; $('code').onkeydown=e=>{ if (e.key==='Enter') go(); };
    return;
  }
  a.innerHTML='<span class="sub">運営として入っています</span><button id="logout">この端末を運営から外す</button>';
  $('logout').onclick=async()=>{ try{ await db.collection('loo-admins').doc(u.uid).delete(); }catch(e){} onUser(u); };
  const denied=e=>{ $('main').hidden=true; $('msg').textContent='読めませんでした: '+(e.code||e.message); console.warn(e); };
  $('main').hidden=false; initMap();
  unsubs.push(db.collection('loo-requests').onSnapshot(s=>{ pend=s.docs.map(d=>({id:d.id,...d.data()})).sort((x,y)=>(x.createdAt?x.createdAt.toMillis():0)-(y.createdAt?y.createdAt.toMillis():0)); render(); },denied));
  unsubs.push(db.collection('loo-toilets').onSnapshot(s=>{ added=s.docs.map(d=>({id:d.id,...d.data()})); render(); },denied));
}

function initMap(){
  if (map) return;
  map=new maplibregl.Map({container:'map',style:'https://tiles.openfreemap.org/styles/positron',center:[141.353,43.0545],zoom:14.5,attributionControl:{compact:true}});
}
function dot(color,txt){ const e=document.createElement('div'); e.style.cssText='width:'+(txt?22:10)+'px;height:'+(txt?22:10)+'px;border-radius:50%;background:'+color+';border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.35);color:#fff;font:800 11px/18px sans-serif;text-align:center'; if (txt) e.textContent=txt; return e; }
function syncMarkers(){
  if (!map) return;
  markers.forEach(m=>m.remove()); markers=[];
  const add=(p,color,txt,click)=>{ const e=dot(color,txt); if (click) e.onclick=click; markers.push(new maplibregl.Marker({element:e}).setLngLat([p.lng,p.lat]).addTo(map)); };
  TOILETS.forEach(t=>add(t,'#9a948c'));
  added.forEach(t=>add(t,'#2f6fe4'));
  pend.forEach((t,i)=>add(t,'#c4521f',String(i+1),()=>pick(t.id)));
}

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

let dirty=false;
// 入力中に再描画すると直している最中の値が消えるので、入力が終わってから描き直す
function typing(){ const a=document.activeElement; return !!(a&&a.closest&&a.closest('#pending')&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)); }
addEventListener('focusout',()=>setTimeout(()=>{ if (dirty&&!typing()){ dirty=false; render(); } },0));
function render(){
  if (typing()){ dirty=true; return; }
  $('pn').textContent=pend.length?'('+pend.length+'件)':'(なし)';
  $('pending').innerHTML=pend.length?pend.map(card).join(''):'<div class="sub">許可待ちはありません</div>';
  const ua=added.filter(t=>t.uid);
  $('an').textContent='('+ua.length+'件)';
  $('added').innerHTML=ua.map(t=>'<div class="card" data-aid="'+esc(t.id)+'"><b>'+esc(t.name)+'</b> <span class="pill">'+(t.type==='conv'?'コンビニ':'トイレ')+'</span>'+(t.approved?'<span class="pill">許可済み</span>':'<span class="pill">許可制の前の投稿</span>')+' <button class="ng" data-a="del" style="float:right">削除</button></div>').join('')||'<div class="sub">なし</div>';
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
start();
