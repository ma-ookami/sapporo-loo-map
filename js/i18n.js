/* 英語表示(設定の「言語 / Language」)。
   画面に出る日本語の文言を、辞書(i18n-en.js)で英語に置き換える。画面を作るコードは日本語のまま。
   - 文言の中の数字は {n} に置き換えて辞書を引く(「徒歩2分」→「徒歩{n}分」)。英語側では {n}(順番どおり)か {1} {2}(順番を入れ替え)で数字を戻す
   - 場所の名前・メモなど、利用者やデータの文字は translate="no" を付けて置き換えない
   - 名前を含む文章は I18N.t('…{name}…',{name}) を使う(辞書のキーは、そのままの文字列)
   - 辞書に無い文言は、そのまま(日本語)出し、I18N.missing に記録する(開発用。確認は tools/test-i18n.js)
   - 言語を切り替えたときは、ページを読み込み直して反映する */
const I18N={
  en:{},
  missing:new Set(),
  obs:null,
  isEn(){ return !!(typeof st!=='undefined'&&st.settings&&st.settings.lang==='en'); },
  hasJa(s){
    for (const ch of s){ const k=ch.charCodeAt(0); if ((k>=0x3000&&k<=0x30ff)||(k>=0x4e00&&k<=0x9fff)||(k>=0xff00&&k<=0xffef)) return true; }
    return false;
  },
  // 空白を1つにまとめ、数字を {n} にする。前後の空白は別に持つ
  norm(s){
    let a=0,b=s.length; const ws=c=>c<=32||c===160; while (a<b&&ws(s.charCodeAt(a))) a++; while (b>a&&ws(s.charCodeAt(b-1))) b--;
    const core=s.slice(a,b), nums=[]; let key='', sp=false;
    for (let j=0;j<core.length;){
      const k=core.charCodeAt(j);
      if (ws(k)){ if (!sp){ key+=' '; sp=true; } j++; continue; }
      sp=false;
      if (k>=48&&k<=57){
        let m=j;
        while (m<core.length){ const c=core.charCodeAt(m); if ((c>=48&&c<=57)||(c===46&&m+1<core.length&&core.charCodeAt(m+1)>=48&&core.charCodeAt(m+1)<=57)) m++; else break; }
        nums.push(core.slice(j,m)); key+='{n}'; j=m; continue;
      }
      key+=core[j]; j++;
    }
    return {key,nums,lead:s.slice(0,a),tail:s.slice(b)};
  },
  fill(v,nums){
    let out='', idx=0;
    for (let i=0;i<v.length;){
      const c=v.charCodeAt(i+1);
      if (v.startsWith('{n}',i)){ out+=(nums[idx++]??''); i+=3; }
      else if (v[i]==='{'&&v[i+2]==='}'&&c>=49&&c<=57){ out+=(nums[c-49]??''); i+=3; }
      else out+=v[i++];
    }
    return out;
  },
  // 文字列を英語にする(日本語が無い・英語でないときはそのまま)
  tr(s){
    if (!this.isEn()||!this.hasJa(s)) return s;
    const n=this.norm(s), v=this.en[n.key];
    if (v===undefined){ this.missing.add(n.key); return s; }
    return n.lead+this.fill(v,n.nums)+n.tail;
  },
  // 名前などを含む文章用。キーは辞書にそのまま書く
  t(key,vars){
    let s=key;
    if (this.isEn()){ const v=this.en[key]; if (v===undefined) this.missing.add(key); else s=v; }
    for (const k in (vars||{})) s=s.split('{'+k+'}').join(vars[k]);
    return s;
  },
  skip(node){ const el=node.nodeType===1?node:node.parentElement; return !el||!!el.closest('[translate="no"],script,style'); },
  fixText(n){
    if (this.skip(n)) return;
    const s=n.nodeValue; if (!s||!this.hasJa(s)) return;
    const r=this.tr(s); if (r!==s) n.nodeValue=r;
  },
  fixAttrs(e){
    if (this.skip(e)) return;
    for (const a of ['aria-label','placeholder','title']){
      const s=e.getAttribute(a);
      if (s&&this.hasJa(s)){ const r=this.tr(s); if (r!==s) e.setAttribute(a,r); }
    }
  },
  fixLinks(root){
    if (!root.querySelectorAll) return;
    root.querySelectorAll('a[href="privacy.html"]').forEach(a=>a.setAttribute('href','privacy.en.html'));
  },
  translateTree(root){
    if (root.nodeType===3){ this.fixText(root); return; }
    if (root.nodeType!==1) return;
    const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT), list=[];
    while (w.nextNode()) list.push(w.currentNode);
    list.forEach(n=>this.fixText(n));
    this.fixAttrs(root); root.querySelectorAll('[aria-label],[placeholder],[title]').forEach(e=>this.fixAttrs(e));
    this.fixLinks(root);
  },
  // 英語のとき、最初に画面全体を置き換え、あとから増える部分(シート・通知・設定など)も自動で置き換える
  start(){
    if (!this.isEn()) return;
    document.documentElement.lang='en';
    document.title=this.tr(document.title);
    this.translateTree(document.body);
    this.obs=new MutationObserver(ms=>{
      for (const m of ms){
        if (m.type==='childList') m.addedNodes.forEach(n=>this.translateTree(n));
        else if (m.type==='characterData') this.fixText(m.target);
        else if (m.type==='attributes') this.fixAttrs(m.target);
      }
    });
    this.obs.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['aria-label','placeholder','title']});
  }
};
// 確認ダイアログの文章も英語にする
(function(){ const c=window.confirm.bind(window); window.confirm=m=>c(I18N.tr(m)); })();
