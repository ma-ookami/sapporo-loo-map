/* 保存先。Firebase(Firestore + 匿名ログイン)。firebase-config.js が空ならこの端末の localStorage(ローカルモード)
   - toilets: ユーザーが追加したトイレ   - reports: 「きれい/混んでた/使えなかった」の一言(1人1トイレ1件) */
const cloud={
  mode:'local', uid:'local', fb:null, _t:[], _r:[],
  async init(onToilets,onReports){
    this._ot=onToilets; this._or=onReports;
    const cfg=window.FIREBASE_CONFIG;
    // ?local=1 のときは、設定があってもこの端末だけに保存する(テスト・試し書き用)
    const forceLocal=location.search.includes('local=1');
    if (cfg && cfg.projectId && window.firebase && !forceLocal){
      try{
        firebase.initializeApp(cfg);
        const cred=await firebase.auth().signInAnonymously();
        this.uid=cred.user.uid; this.mode='cloud'; this.fb=firebase.firestore();
        this.fb.collection('loo-toilets').onSnapshot(s=>onToilets(s.docs.map(d=>this._row(d.id,d.data()))),()=>{});
        this.fb.collection('loo-reports').onSnapshot(s=>onReports(s.docs.map(d=>{ const r=d.data(); return {toiletId:r.toiletId,kind:r.kind,mine:r.uid===this.uid,at:r.createdAt?r.createdAt.toMillis():Date.now()}; })),()=>{});
        return;
      }catch(e){ console.warn('firebase 失敗。ローカルモードで動きます',e); setTimeout(()=>{ if (typeof toast==='function') toast('サーバーにつながらないので、この端末にだけ保存します'); },1500); }
    }
    this.uid='local'; this.mode='local';
    onToilets(this._loadT()); onReports(this._loadR());
  },
  _row(id,d){
    return {id:'u-'+id,name:d.name,lat:d.lat,lng:d.lng,fee:d.fee,wheelchair:d.wheelchair,floor:d.floor??null,ease:d.ease??null,find:d.find??null,type:d.type||'toilet',brand:d.brand||null,loan:d.loan||null,hours:null,note:d.note||'',source:'user',mine:d.uid===this.uid};
  },
  _get(k){ try{ return JSON.parse(localStorage.getItem(k)||'[]'); }catch(e){ return []; } },
  _loadT(){ return this._get('loo-added').map(d=>this._row(d.id,d)); },
  _loadR(){ return this._get('loo-reports').map(r=>({toiletId:r.toiletId,kind:r.kind,mine:true,at:r.at})); },
  async add(t){
    if (this.mode==='cloud'){
      // 投稿の間隔・回数の記録(loo-users)と同じバッチで書く。ルールが 30 秒に1件・24時間に10件までを見張る
      const ref=this.fb.collection('loo-toilets').doc(), uref=this.fb.collection('loo-users').doc(this.uid), ts=firebase.firestore.FieldValue.serverTimestamp();
      const snap=await uref.get(), d=snap.exists?snap.data():null;
      const inWin=d&&d.windowStart&&Date.now()<d.windowStart.toMillis()+24*3600*1000;
      const b=this.fb.batch();
      b.set(ref,{name:t.name,lat:t.lat,lng:t.lng,fee:t.fee,wheelchair:t.wheelchair,floor:t.floor,ease:t.ease??null,find:t.find??null,type:t.type,brand:t.brand,loan:t.loan,note:t.note,uid:this.uid,createdAt:firebase.firestore.FieldValue.serverTimestamp()});
      b.set(uref,inWin?{lastAt:ts,n:d.n+1,windowStart:d.windowStart,lastId:ref.id}:{lastAt:ts,n:1,windowStart:ts,lastId:ref.id});
      await b.commit();
      return;
    }
    const a=this._get('loo-added'); a.push({...t,id:String(Date.now()),uid:'local'});
    localStorage.setItem('loo-added',JSON.stringify(a)); this._ot(this._loadT());
  },
  async remove(id){
    const raw=id.slice(2);
    if (this.mode==='cloud'){ await this.fb.collection('loo-toilets').doc(raw).delete(); return; }
    localStorage.setItem('loo-added',JSON.stringify(this._get('loo-added').filter(d=>d.id!==raw))); this._ot(this._loadT());
  },
  // kind が null なら取り消し
  async report(toiletId,kind){
    if (this.mode==='cloud'){
      const ref=this.fb.collection('loo-reports').doc(toiletId+'_'+this.uid);
      if (kind) await ref.set({toiletId,kind,uid:this.uid,createdAt:firebase.firestore.FieldValue.serverTimestamp()}); else await ref.delete();
      return;
    }
    const a=this._get('loo-reports').filter(r=>r.toiletId!==toiletId);
    if (kind) a.push({toiletId,kind,at:Date.now()});
    localStorage.setItem('loo-reports',JSON.stringify(a)); this._or(this._loadR());
  }
};
