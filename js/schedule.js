const SCH={};
function dk(y,m,d){return y+'-'+String(m).padStart(2,'0')+'-'+String(d).padStart(2,'0');}
function eachDay(a,b,fn){
  const p=a.split('-').map(Number), q=b.split('-').map(Number);
  for(let u=Date.UTC(p[0],p[1]-1,p[2]),e=Date.UTC(q[0],q[1]-1,q[2]);u<=e;u+=864e5){const x=new Date(u);fn(dk(x.getUTCFullYear(),x.getUTCMonth()+1,x.getUTCDate()));}
}
function sch(k){return SCH[k]||(SCH[k]={team:null,off:false,ev:[],ph:null,code:false,bw:[]});}
function hasCode(k){return k<='2026-11-30'||(k>='2027-01-03'&&k<='2027-01-31');}
TEAMR.forEach(r=>eachDay(r[0],r[1],k=>{const s=sch(k);s.team=r[2]==='G'?'gold':'silver';s.ph=r[3];s.code=hasCode(k);}));
OFFR.forEach(r=>eachDay(r[0],r[1],k=>{sch(k).off=true;}));
EVR.forEach(r=>sch(r[0]).ev.push({name:r[1],times:r[2]}));
BWR.forEach(r=>eachDay(r[0],r[1],k=>{sch(k).bw.push(r[2]);}));
function roleName(r){return r.split('／')[0];}
function mdKey(s){const m=/(\d+)月(\d+)日/.exec(s||'');return m?String(m[1]).padStart(2,'0')+'-'+String(m[2]).padStart(2,'0'):null;}
const BD={};
function addBD(key,o){if(key)(BD[key]=BD[key]||[]).push(o);}
ROSTER.forEach(r=>{
  const rn=roleName(r[0]);
  addBD(mdKey(r[1]),{kind:'char',role:r[0],rn});
  addBD(mdKey(r[3]),{kind:'cast',team:'gold',cast:r[2],rn});
  addBD(mdKey(r[5]),{kind:'cast',team:'silver',cast:r[4],rn});
});
function memStyle(n){const m=MEM[n]||{bg:'#fff',ink:'#000'};return `background:${m.bg};color:${m.ink}`;}
function memCls(n){const i=Object.keys(MEM).indexOf(n);return i>=0?'m'+i:'m-x';}
function memEn(n){return (MEM[n]||{en:n}).en;}
function memS(n){return (MEM[n]||{s:n.charAt(0)}).s;}
function bwBirth(name){const r=ROSTER.find(x=>roleName(x[0])===name);const m=r&&mdKey(r[1]);return m?`${+m.slice(0,2)}月${+m.slice(3)}日`:'';}
function keyLabel(k){const p=k.split('-').map(Number);const wd=WD[new Date(Date.UTC(p[0],p[1]-1,p[2])).getUTCDay()];return `${p[1]}月${p[2]}日（${wd}）`;}
function teamIcon(t){
  if(!t.team)return '<span aria-label="未設定">－</span>';
  const nm=t.team.name+(t.team.inferred?'（日程から補完）':'');
  return `<span class="chip" title="${esc(nm)}"><img src="${IMG[t.team.id]}" alt="${esc(nm)}"></span>`;
}
let warns=[];
function applySchedule(t,line){
  const k=dk(t.date.year,t.date.month,t.date.day), s=SCH[k], w=[];
  t.key=k;t.line=line;t.evtags=[];t.warned=false;
  if(k<SCH_FIRST||k>SCH_LAST){
    w.push(`取り込んだスケジュールの範囲外です（${SCH_FIRST}〜${SCH_LAST}）。チームの補完と照合はできません。`);
  }else if(s&&s.off){
    w.push('この日は休演日です。日付の入力ミスの可能性があります。');
  }else if(s&&s.team){
    if(t.team){
      if(t.team.id.replace(/^k/,'')!==s.team)w.push(`入力は${t.team.name}ですが、スケジュール上この日は${TN[s.team]}です。`);
    }else{
      t.team={id:s.team,name:TN[s.team],inferred:true};
    }
    s.ev.forEach(e=>{if(e.times.indexOf(t.time)>=0)t.evtags.push(e.name);});
    const tm=t.team.id.replace(/^k/,'');
    (BD[k.slice(5)]||[]).forEach(b=>{if(b.kind==='cast'&&b.team===tm)t.evtags.push(b.cast+'さん誕生日');});
  }else if(!t.team){
    w.push('スケジュールにチームの記載がなく、補完できませんでした。');
  }
  if(w.length)t.warned=true;
  w.forEach(m=>warns.push({t,line,msg:m}));
}
function checkDup(){
  const seen={};
  tickets.concat(unmapped).filter(t=>t.mail).forEach(t=>{
    const sig=[t.key,t.time,t.seatRaw,t.kind,t.drink,t.role].join('|');
    if(seen[sig]){t.warned=true;warns.push({t,line:t.line,msg:'同じ内容のチケットが重複しています（メールを二重に貼った可能性があります）。'});}
    else seen[sig]=1;
  });
}
function evHTML(t){
  let h=(t.evtags||[]).filter(n=>LAY.kbd||!/さん誕生日$/.test(n)).map(n=>`<span class="tag EV">${esc(n)}</span>`).join('');
  if(t.warned)h+='<span class="tag WARN">要確認</span>';
  return h?'<br>'+h:'';
}
