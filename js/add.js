/* 追加: 1) 地図を動かして📍を場所に合わせる(最初は現在地) 2) 名前・階・料金などを選んで登録 */
function startAdd(){
  buzz(); st.adding=true; st.sel=null; st.open=false; syncPins();
  document.body.classList.add('adding'); $('cross').hidden=false; $('cross').innerHTML=PIN_SVG; $('sheet').classList.remove('open');
  pickPlace(true);
}
function placeCross(){ const pad=padMap(); $('cross').style.top=((innerHeight-pad)/2)+'px'; return pad; }
function toHere(){ map.easeTo({center:[st.here.lng,st.here.lat],zoom:18,duration:400}); }
function pickPlace(first){
  $('sbody').innerHTML='<div class="form"><div class="step"><i class="on"></i><i></i>&nbsp;1 / 2 場所</div><div class="hd">'+bearSvg(40)+'<span>まず場所を選んでね。'+(st.here?'いまの場所にピンを置いたよ。':'')+'ずれていたら地図を動かしてね</span></div>'
    +'<div class="btns"><button class="sub" id="pcancel">やめる</button>'+(st.here?'<button class="sub" id="phere">現在地</button>':'')+'<button class="cta" id="pok">ここにする</button></div></div>';
  placeCross();
  if (first&&st.here) toHere();
  $('pcancel').onclick=endAdd;
  if ($('phere')) $('phere').onclick=toHere;
  $('pok').onclick=()=>showForm(map.getCenter());
}
const FLOORS=[['-1','B1'],['1','1F'],['2','2F'],['3','3F'],['4','4F'],['5','5F'],['6','6F'],['7','7F'],['8','8F'],['9','9F'],['10','10F〜'],['','わからない']];
const STALLS=[['1','1'],['2','2'],['3','3'],['4','4'],['5','5以上'],['','わからない']];
const FEES=[['free','無料'],['paid','有料'],['','わからない']];
const WHEELS=[['yes','使える'],['no','使えない'],['','わからない']];
// 選択済みの値(再描画したとき用)。floor は数値、fee/wheelchair は真偽値、他は文字列
function sel(k,v,cur){
  if (cur==null) return v===''&&k!=='brand'&&k!=='loan';
  if (k==='floor'||k==='stalls') return String(cur)===v;
  if (k==='fee') return (cur===false&&v==='free')||(cur===true&&v==='paid');
  if (k==='wheelchair') return (cur===true&&v==='yes')||(cur===false&&v==='no');
  return cur===v;
}
function seg(k,opts,scroll,cur){
  return '<div class="seg'+(scroll?' scroll':'')+'" data-k="'+k+'">'
    +opts.map(o=>'<button type="button" data-v="'+o[0]+'" aria-pressed="'+sel(k,o[0],cur)+'">'+o[1]+'</button>').join('')+'</div>';
}
// 星(1〜5)。もう一度同じ星を押すと取り消し
function starPick(k,cur){
  return '<div class="stars" data-k="'+k+'">'+[1,2,3,4,5].map(n=>'<button type="button" data-v="'+n+'" class="'+(n<=(cur||0)?'on':'')+'" aria-label="'+n+'">'+starSvg(30)+'</button>').join('')+'</div>';
}
function showForm(loc,keep){
  const f=Object.assign({type:'toilet',brand:null,loan:null,fee:null,wheelchair:null,floor:null,stalls:null,ease:null,find:null,name:'',note:''},keep||{});
  const conv=f.type==='conv';
  const sg=(k,opts,scroll)=>seg(k,opts,scroll,f[k]);
  $('sbody').innerHTML='<div class="form"><div class="step"><i></i><i class="on"></i>&nbsp;2 / 2 情報</div><div class="hd">'+bearSvg(40)+'<span>この場所のことを教えてね</span></div>'
    +'<div class="seg" data-k="type"><button type="button" data-v="toilet" aria-pressed="'+!conv+'">トイレ</button><button type="button" data-v="conv" aria-pressed="'+conv+'">コンビニ</button></div>'
    +(conv
      ?'<div class="lb">どこのコンビニ?</div>'+sg('brand',BRANDS.map(x=>[x[0],x[1]]),true)
        +'<div class="lb">このコンビニのトイレ、借りられた?</div>'+sg('loan',LOANS)
        +'<div class="hint">お店のご厚意で借りるものです。お客さん専用のお店もあります。</div>'
        +'<input type="text" id="fname" maxlength="40" placeholder="店名・場所(例: ○○店。なくてOK)">'
      :'<input type="text" id="fname" maxlength="40" placeholder="名前・場所(例: ○○ビル)">'
        +'<div class="lb">階(地下はB1・B2)</div>'+sg('floor',FLOORS.map(x=>[x[0],x[1]]),true)
        +'<div class="lb">個室の数(男女別なら、合わせて)</div>'+sg('stalls',STALLS,true)
        +'<div class="lb">料金</div>'+sg('fee',FEES)
        +'<div class="lb">車いす</div>'+sg('wheelchair',WHEELS))
    +'<div class="lb">使いやすさ <span class="hn">広さ・きれいさ・入りやすさ</span></div>'+starPick('ease',f.ease)
    +'<div class="lb">場所のわかりやすさ <span class="hn">見つけやすさ・行き方</span></div>'+starPick('find',f.find)
    +'<input type="text" id="fnote" maxlength="200" placeholder="メモ(営業時間・使い方など。なくてOK)">'
    +'<div class="btns"><button class="sub" id="fback">場所を選び直す</button><button class="cta" id="fsave">登録する</button></div></div>';
  $('fname').value=f.name; $('fnote').value=f.note;
  placeCross();
  const snap=()=>{ f.name=$('fname').value; f.note=$('fnote').value; };
  document.querySelectorAll('#sbody .seg').forEach(g=>g.querySelectorAll('button').forEach(btn=>btn.onclick=()=>{
    buzz(); const v=btn.dataset.v, k=g.dataset.k;
    if (k==='type'){ snap(); f.type=v; showForm(loc,f); return; }
    g.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed','false')); btn.setAttribute('aria-pressed','true');
    f[k]=(k==='floor'||k==='stalls')?(v===''?null:Number(v)):k==='fee'?(v==='free'?false:v==='paid'?true:null):k==='wheelchair'?(v==='yes'?true:v==='no'?false:null):v;
  }));
  document.querySelectorAll('#sbody .stars').forEach(g=>g.querySelectorAll('button').forEach(btn=>btn.onclick=()=>{
    buzz(); const k=g.dataset.k, v=Number(btn.dataset.v);
    f[k]=f[k]===v?null:v;
    g.querySelectorAll('button').forEach(x=>x.classList.toggle('on',Number(x.dataset.v)<=(f[k]||0)));
  }));
  $('fback').onclick=()=>pickPlace(false);
  $('fsave').onclick=async()=>{
    snap(); let name=f.name.trim();
    if (conv){
      if (!f.brand){ toast('どこのコンビニか選んでね'); return; }
      if (!f.loan){ toast('貸し出しの状況を選んでね'); return; }
      const bl=brandLabel(f.brand); name=f.brand==='other'?(name||'コンビニ'):(name?bl+' '+name:bl);
    } else if (!name){ toast('名前か場所を入れてね'); return; }
    const t=conv?{name,lat:loc.lat,lng:loc.lng,fee:null,wheelchair:null,floor:null,ease:f.ease,find:f.find,type:'conv',brand:f.brand,loan:f.loan,note:f.note.trim()}
      :{name,lat:loc.lat,lng:loc.lng,fee:f.fee,wheelchair:f.wheelchair,floor:f.floor,stalls:f.stalls,ease:f.ease,find:f.find,type:'toilet',brand:null,loan:null,note:f.note.trim()};
    if (!inArea(loc)){ toast('ここは対象のエリア(すすきの〜札幌駅)の外です'); return; }
    const lim=postLimit(); if (lim){ toast(lim); return; }
    const dup=st.toilets.filter(x=>x.type===t.type&&(t.type==='toilet'||x.brand===t.brand)).map(x=>({x,d:distanceM(loc,x)})).sort((a,b)=>a.d-b.d)[0];
    if (dup&&dup.d<=20&&!confirm(I18N.t('すぐ近く({d}m)に「{name}」が登録されています。それでも登録しますか?',{d:Math.round(dup.d),name:nameOf(dup.x)}))) return;
    try{ await cloud.add(t); markPosted(); toast('登録しました。ありがとう!'); endAdd(); }
    catch(e){ toast(e&&e.code==='permission-denied'?'登録できませんでした。間をあけるか、今日の上限(10件)かもしれません':'登録できませんでした'); }
  };
}
// 連続投稿の制限(この端末だけの簡易なもの。荒らし対策の本体は firestore.rules)
const POST_KEY='loo-postlog', POST_GAP=30000, POST_DAY=10;
function postLog(){ try{ return JSON.parse(localStorage.getItem(POST_KEY)||'[]').filter(x=>Date.now()-x<86400000); }catch(e){ return []; } }
function postLimit(){
  const a=postLog(); if (!a.length) return null;
  if (Date.now()-a[a.length-1]<POST_GAP) return 'すこし間をあけてから、もう一度登録してね';
  if (a.length>=POST_DAY) return '今日はたくさん登録してくれてありがとう。続きはまた明日お願いします';
  return null;
}
function markPosted(){ try{ const a=postLog(); a.push(Date.now()); localStorage.setItem(POST_KEY,JSON.stringify(a)); }catch(e){} }
function endAdd(){
  st.adding=false; document.body.classList.remove('adding'); $('cross').hidden=true;
  map.setPadding({top:0,left:0,right:0,bottom:0}); renderSheet();
}
