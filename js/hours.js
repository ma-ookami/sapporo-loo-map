/* 営業時間(OSM の opening_hours)から「いま営業中か」を求める。
   対応: 24/7、曜日(Mo-Fr, Sa,Su)、時間帯(複数可・日またぎ可)、off。祝日(PH/SH)は無視。
   読めない書き方なら null(不明)。結果は true=営業中 / false=営業時間外 / null=不明 */
const OH_DAYS=['Mo','Tu','We','Th','Fr','Sa','Su'];
const OH_WD={Mon:0,Tue:1,Wed:2,Thu:3,Fri:4,Sat:5,Sun:6};
const ohCache=new Map();

function ohParseDays(s){
  const out=new Set();
  for (let part of s.split(',')){
    part=part.trim(); if (!part) continue;
    if (part==='PH'||part==='SH') continue;
    const [a,b]=part.split('-');
    const i=OH_DAYS.indexOf(a), j=b===undefined?i:OH_DAYS.indexOf(b);
    if (i<0||j<0) return null;
    for (let k=i;;k=(k+1)%7){ out.add(k); if (k===j) break; }
  }
  return out;
}
function ohParseTimes(s){
  const out=[];
  for (const r of s.split(',')){
    const t=r.trim(); if (!t) continue;
    const [a,b]=t.split('-'); if (!a||!b) return null;
    const [ah,am]=a.split(':').map(Number), [bh,bm]=b.split(':').map(Number);
    if ([ah,am,bh,bm].some(Number.isNaN)) return null;
    out.push([ah*60+am,bh*60+bm]);
  }
  return out;
}
// 「Mo-Fr 08:00-22:00, Sa-Su 11:00-22:00」のように、カンマで別の曜日の規則が続くものを分ける
function ohSplitRules(r){
  const out=[]; let cur='';
  for (const part of r.split(',')){
    const t=part.trim(), head=t.slice(0,2);
    const isDay=OH_DAYS.includes(head)||head==='PH'||head==='SH';
    if (cur&&isDay&&cur.includes(':')){ out.push(cur); cur=t; }
    else cur=cur?cur+','+t:t;
  }
  if (cur) out.push(cur);
  return out;
}
function ohCompile(str){
  const rules=str.split(';').flatMap(ohSplitRules).map(x=>x.trim()).filter(Boolean);
  const state=Array(7).fill(null);   // 曜日ごとの時間帯(後の規則が上書き)
  let used=0;
  for (const r of rules){
    const tok=r.split(' ').filter(Boolean);
    let ti=tok.findIndex(x=>/^[0-9]/.test(x)||x==='off'||x==='closed');
    if (ti<0) return null;
    const dayStr=tok.slice(0,ti).join(' '), timeStr=tok.slice(ti).join('');
    let days=null;
    if (dayStr){
      days=ohParseDays(dayStr); if (!days) return null;
      if (!days.size) continue;   // PH のみ
    }
    let ranges;
    if (timeStr==='off'||timeStr==='closed') ranges=[];
    else if (timeStr==='24/7') ranges=[[0,1440]];
    else { ranges=ohParseTimes(timeStr); if (!ranges) return null; }
    for (let d=0;d<7;d++) if (!days||days.has(d)){ state[d]=ranges; used++; }
  }
  return used?state:null;
}
function tokyoNow(now){
  const p=new Intl.DateTimeFormat('en-US',{timeZone:'Asia/Tokyo',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false}).formatToParts(now);
  const g=t=>p.find(x=>x.type===t).value;
  return {d:OH_WD[g('weekday')],m:(Number(g('hour'))%24)*60+Number(g('minute'))};
}
function openNow(str,now){
  if (!str) return null;
  if (str==='24/7') return true;
  now=now||new Date();
  const key=str+'|'+Math.floor(now.getTime()/60000);
  if (ohCache.has(key)) return ohCache.get(key);
  let res=null;
  try{
    const st=ohCompile(str);
    if (st){
      const {d,m}=tokyoNow(now);
      const today=st[d]||[], yest=st[(d+6)%7]||[];
      res=today.some(([a,b])=>b>a?(m>=a&&m<b):m>=a)          // 日またぎの前半
        ||yest.some(([a,b])=>b<=a&&m<b);                       // 日またぎの後半
    }
  }catch(e){ res=null; }
  if (ohCache.size>500) ohCache.clear();
  ohCache.set(key,res); return res;
}
