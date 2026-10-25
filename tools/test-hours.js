const fs=require('fs'),vm=require('vm');const c={};vm.createContext(c);vm.runInContext(fs.readFileSync(__dirname+'/../js/hours.js','utf8')+';this.openNow=openNow',c);
const at=(iso)=>new Date(iso); // JST を +09:00 で指定
const T=(s,iso)=>c.openNow(s,at(iso));
const cases=[
 ['24/7','2026-10-26T03:00:00+09:00',true],
 ['Mo-Su 07:00-23:00','2026-10-26T08:00:00+09:00',true],   // 月曜 8時
 ['Mo-Su 07:00-23:00','2026-10-26T23:30:00+09:00',false],
 ['Mo-Fr 09:00-18:00','2026-10-25T10:00:00+09:00',false],  // 日曜
 ['Mo-Fr 09:00-18:00','2026-10-26T10:00:00+09:00',true],
 ['Mo-Fr 09:00-18:00; Sa 09:00-12:00','2026-10-24T10:00:00+09:00',true],
 ['18:00-05:00','2026-10-26T02:00:00+09:00',true],         // 日またぎ後半
 ['18:00-05:00','2026-10-26T12:00:00+09:00',false],
 ['Mo-Su 07:00-24:00','2026-10-26T23:50:00+09:00',true],
 ['Mo-Su 07:00-23:00; PH off','2026-10-26T12:00:00+09:00',true],
 ['Jan-Mar 09:00-18:00','2026-10-26T12:00:00+09:00',null],
 ['sunrise-sunset','2026-10-26T12:00:00+09:00',null],
 ['Mo-Fr 09:00-12:00, 13:00-18:00','2026-10-26T12:30:00+09:00',false],
 [null,'2026-10-26T12:30:00+09:00',null],
];
let bad=0;for(const [s,t,e] of cases){const r=T(s,t);if(r!==e){bad++;console.log('NG',s,t,'->',r,'expected',e)}}
console.log(bad?bad+' NG':'all '+cases.length+' ok');
// 実データで読めない割合
global.window={};eval(fs.readFileSync(__dirname+'/../data/toilets.js','utf8').replace('const TOILETS','global.T'));
const hs=T_=>0; const withH=global.T.filter(t=>t.hours);let u=0,counts={true:0,false:0};
for(const t of withH){const r=c.openNow(t.hours,at('2026-10-26T12:00:00+09:00'));if(r===null)u++;else counts[r]++}
console.log('hours entries',withH.length,'unparsed',u,counts);
console.log([...new Set(withH.filter(t=>c.openNow(t.hours,at('2026-10-26T12:00:00+09:00'))===null).map(t=>t.hours))].slice(0,8));
