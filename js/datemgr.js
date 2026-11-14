const dmById=id=>document.getElementById(id);
const STORE_KEY='stst202611_store_v2';
let STORE=[];
let SORTS=[];
const BLOCK_ORDER=['A','B','C','D','BOX','BOX Room'];

//BT-START
const FORM_KINDS=['Premium seat','Class S','PS','Class A','BOX Room'];
const MAX_ROW=7, MAX_NUM=12, MAX_BOX=18;
function pad2(n){return String(n).padStart(2,'0');}
function isWeekend(y,m,d){const w=new Date(y,m-1,d).getDay();return w===0||w===6;}
function timesFor(y,m,d){return isWeekend(y,m,d)?['11:30','15:30','19:30']:['14:30','19:30'];}
function validYmd(y,m,d){const x=new Date(y,m-1,d);return x.getFullYear()===y&&x.getMonth()===m-1&&x.getDate()===d;}
function buildTicket(f){
  const y=2000+(+f.yy),m=+f.mm,d=+f.dd;
  if(!validYmd(y,m,d))return {err:'日付が正しくありません。'};
  if(timesFor(y,m,d).indexOf(f.time)<0)return {err:'この日に選べない時間です。'};
  if(FORM_KINDS.indexOf(f.kind)<0)return {err:'席種が正しくありません。'};
  const isInt=(v,max)=>Number.isInteger(v)&&v>=1&&v<=max;
  const num=f.num, k=f.kind;
  if(!isInt(num,99))return {err:'番を選んでください。'};
  let seat='';
  if(k==='Class A'||k==='BOX Room'){
    if(!isInt(f.box,MAX_BOX)&&!(isInt(f.box,99)&&f.boxManual))return {err:(k==='BOX Room'?'部屋番号':'BOX')+'を選んでください。'};
    seat=k==='Class A'?`2F BOX${f.box} ${num}番`:`2F BOX Room${f.box} ${num}番`;
  }else{
    if('ABCD'.indexOf(f.block)<0||!f.block)return {err:'ブロックを選んでください。'};
    if(k==='PS'){
      if(f.row!==null&&f.row!==undefined)return {err:'PS（ソファ）では列は「なし」にしてください。'};
      if(!seatEls[`${f.block}|PS|${num}`])return {err:'そのソファ席は座席図にありません。'};
      seat=`1F ${f.block}ブロック ソファ ${num}番`;
    }else{
      if(!isInt(f.row,99))return {err:'列を選んでください。'};
      if(!seatEls[`${f.block}|${f.row}|${num}`])return {err:'その席は座席図にありません。列と番を確認してください。'};
      seat=`1F ${f.block}ブロック ${f.row}列 ${num}番`;
    }
  }
  return {rec:{date:`${y}-${pad2(m)}-${pad2(d)}`,time:f.time,seat,drink:String(f.drink||'').trim(),kind:k,team:f.team||''}};
}
//BT-END

function dmSave(){try{localStorage.setItem(STORE_KEY,JSON.stringify(STORE));}catch(e){}}
function pickField(r,names){for(const n of names){if(r[n]!==undefined&&r[n]!==null&&String(r[n]).trim()!=='')return String(r[n]).trim();}return '';}
function toStoreRec(r){
  const d=parseDateAny(pickField(r,['date','日付','公演日']));
  if(!d)return null;
  return {
    date:dk(d.year,d.month,d.day),
    time:normTime(pickField(r,['time','時間','時刻'])),
    seat:pickField(r,['seat','席','座席']),
    drink:pickField(r,['drink','のみもの','ドリンク']),
    kind:pickField(r,['kind','席種','種類']),
    team:pickField(r,['team','チーム']),
    kashikiri:pickField(r,['kashikiri']),
    role:pickField(r,['role','役割']),
    mail:!!r.__mail
  };
}
function recsToStore(recs){
  const out=[];let bad=0;
  recs.forEach(r=>{const s=toStoreRec(r);if(s)out.push(s);else bad++;});
  return {out,bad};
}
function reflect(){
  lastHL=null;
  loadRecords(STORE.map((s,i)=>({date:s.date,time:s.time,seat:s.seat,drink:s.drink,kind:s.kind,team:s.team,kashikiri:s.kashikiri,role:s.role,__mail:s.mail,__line:i+1})));
  renderDmTable();
}
function blockOf(s){
  const m=s.seat.match(/([ABCD])ブロック/);
  if(m)return m[1];
  if(/BOX\s*Room/i.test(s.seat)||/BOX\s*Room/i.test(s.kind))return 'BOX Room';
  if(/BOX/i.test(s.seat))return 'BOX';
  return '';
}
function cmpRows(col,a,b){
  if(col==='date')return (a.date+' '+a.time).localeCompare(b.date+' '+b.time);
  if(col==='block'){
    const ia=BLOCK_ORDER.indexOf(blockOf(a)),ib=BLOCK_ORDER.indexOf(blockOf(b));
    return (ia<0?99:ia)-(ib<0?99:ib);
  }
  if(col==='kind')return a.kind.localeCompare(b.kind,'ja');
  if(col==='drink')return a.drink.localeCompare(b.drink,'ja');
  return 0;
}
function sortedRows(){
  const rows=STORE.map((s,i)=>Object.assign({idx:i},s));
  rows.sort((a,b)=>{
    for(const st of SORTS){const c=cmpRows(st.col,a,b);if(c)return st.dir*c;}
    return a.idx-b.idx;
  });
  return rows;
}
const COLNAME={date:'日付',block:'ブロック',kind:'席種',drink:'のみもの'};
function renderDmTable(){
  const tb=document.querySelector('#dmTable tbody');tb.innerHTML='';
  sortedRows().forEach(s=>{
    const tr=document.createElement('tr');
    const d=parseDateAny(s.date);
    const b=blockOf(s);
    tr.innerHTML=`<td>${esc(d?d.short:s.date)}</td><td>${esc(s.time)}</td><td>${esc(b||'－')}</td><td>${esc(s.kind||'－')}</td><td>${esc(s.seat)}</td><td>${esc(s.drink)}</td><td>${esc(s.team||'－')}</td><td><button type="button" class="btn sub delbtn" aria-label="この行を削除">削除</button></td>`;
    tr.querySelector('.delbtn').onclick=()=>{STORE.splice(s.idx,1);dmSave();reflect();say('1件削除しました');};
    tb.appendChild(tr);
  });
  if(!STORE.length){const tr=document.createElement('tr');tr.innerHTML='<td colspan="8">まだ入力がありません</td>';tb.appendChild(tr);}
  document.querySelectorAll('#dmTable .sortbtn').forEach(btn=>{
    const col=btn.dataset.col,k=SORTS.findIndex(x=>x.col===col),th=btn.parentNode;
    if(k<0){th.setAttribute('aria-sort','none');btn.textContent=COLNAME[col];}
    else{th.setAttribute('aria-sort',SORTS[k].dir>0?'ascending':'descending');btn.textContent=COLNAME[col]+(SORTS[k].dir>0?' ▲':' ▼')+(SORTS.length>1?(k+1):'');}
  });
  dmById('sortInfo').textContent=SORTS.length?'並べ替えの優先順：'+SORTS.map(x=>COLNAME[x.col]+(x.dir>0?'（昇順）':'（降順）')).join(' → '):'並べ替えなし（新しく追加した順）';
}
document.querySelectorAll('#dmTable .sortbtn').forEach(btn=>{
  btn.onclick=()=>{
    const col=btn.dataset.col,k=SORTS.findIndex(x=>x.col===col);
    let dir=1;
    if(k===0)dir=-SORTS[0].dir;
    else if(k>0)dir=SORTS[k].dir;
    if(k>=0)SORTS.splice(k,1);
    SORTS.unshift({col,dir});
    renderDmTable();
    say(COLNAME[col]+'で並べ替えました');
  };
});

function addRecords(recs,replace){
  const {out,bad}=recsToStore(recs);
  STORE=replace?out:out.concat(STORE);
  dmSave();reflect();
  const msg=`${out.length}件を${replace?'置き換えで':'追加で'}読み込みました`+(bad?`（日付を読み取れず無視：${bad}件）`:'');
  dmById('inHint').textContent=msg;say(msg);
  return out.length;
}
dmById('applyBtn').onclick=()=>{
  const ta=dmById('ticketInput');
  if(!ta.value.trim()){say('入力欄が空です');return;}
  const n=addRecords(textToRecords(ta.value),false);
  if(n)ta.value='';
};
dmById('clearBtn').onclick=()=>{dmById('ticketInput').value='';say('入力欄を空にしました');};
dmById('allDelBtn').onclick=()=>{
  if(!STORE.length)return;
  if(!window.confirm('入力済みのチケットをすべて削除します。よろしいですか。'))return;
  STORE=[];dmSave();reflect();say('すべて削除しました');
};

document.querySelectorAll('.maintabs button').forEach(b=>{
  b.onclick=()=>{
    document.querySelectorAll('.maintabs button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    ['viewMap','viewDate'].forEach(id=>{dmById(id).hidden=(id!==b.dataset.view);});
    if(b.dataset.view==='viewMap'){measureBoxes();setPage(curPage,true);}
    window.scrollTo(0,0);
  };
});
document.querySelectorAll('.modetabs button').forEach(b=>{
  b.onclick=()=>{
    document.querySelectorAll('.modetabs button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    dmById('modePaste').hidden=b.dataset.mode!=='paste';
    dmById('modeForm').hidden=b.dataset.mode!=='form';
  };
});

// ----- プルダウン入力 -----
function opt(sel,value,text){const o=document.createElement('option');o.value=value;o.textContent=text;sel.appendChild(o);}
function fillNumSel(id,max){
  const s=dmById(id);s.innerHTML='';
  opt(s,'','なし');
  for(let i=1;i<=max;i++)opt(s,String(i),String(i));
  opt(s,'__m','手入力');
  s.onchange=()=>{const m=dmById(id+'M');m.hidden=s.value!=='__m';if(!m.hidden)m.focus();};
}
function numVal(id){
  const s=dmById(id).value;
  if(s==='')return null;
  if(s==='__m'){const v=dmById(id+'M').value.trim();return /^\d+$/.test(v)?+v:NaN;}
  return +s;
}
function sailorNames(){
  const out=[];
  ROSTER.forEach(r=>{const p=r[0].split('／');if(p[1]&&/^セーラー/.test(p[1]))out.push(p[1]);});
  out.push('セーラースターヒーラー');
  return out;
}
function fillDate(){
  const y=dmById('fY'),m=dmById('fM');
  y.innerHTML='';m.innerHTML='';
  [26,27].forEach(v=>opt(y,String(v),pad2(v)));
  for(let i=1;i<=12;i++)opt(m,String(i),pad2(i));
  const n=new Date();let yy=n.getFullYear()-2000,mm=n.getMonth()+1,dd=n.getDate();
  if(yy<26||(yy===26&&mm<10)||yy>27||(yy===27&&mm>3)){yy=26;mm=11;dd=1;}
  y.value=String(yy);m.value=String(mm);
  fillDays(dd);
}
function fillDays(keep){
  const y=2000+(+dmById('fY').value),m=+dmById('fM').value,dsel=dmById('fD');
  const cur=keep||+dsel.value||1,last=new Date(y,m,0).getDate();
  dsel.innerHTML='';
  for(let i=1;i<=last;i++)opt(dsel,String(i),pad2(i));
  dsel.value=String(Math.min(cur,last));
  fillTimes();
}
function fillTimes(){
  const y=2000+(+dmById('fY').value),m=+dmById('fM').value,d=+dmById('fD').value;
  const t=dmById('fTime'),prev=t.value;
  t.innerHTML='';
  timesFor(y,m,d).forEach(x=>opt(t,x,x));
  if([...t.options].some(o=>o.value===prev))t.value=prev;
  dmById('fWd').textContent='（'+WD[new Date(y,m-1,d).getDay()]+'）'+(isWeekend(y,m,d)?'土日の時間':'平日の時間');
}
function fillDrink(){
  const s=dmById('fDrink');s.innerHTML='';
  opt(s,'','選ばない');opt(s,'なし','なし（ドリンクなし）');
  sailorNames().forEach(n=>opt(s,n,n));
  opt(s,'__m','手入力');
  s.onchange=()=>{const m=dmById('fDrinkM');m.hidden=s.value!=='__m';if(!m.hidden)m.focus();};
}
function syncForm(){
  const k=dmById('fKind').value;
  const box=(k==='Class A'||k==='BOX Room');
  dmById('fBlock').disabled=box;
  dmById('fRow').disabled=box||k==='PS';
  dmById('fRowM').disabled=dmById('fRow').disabled;
  dmById('fBox').disabled=!box;
  dmById('fBoxM').disabled=!box;
  dmById('formNote').textContent=box?'Class A / BOX Room は、BOX（部屋）の番号と番を選びます。':(k==='PS'?'PS（ソファ）は、ブロックと番を選びます。列は使いません。':'Premium seat / Class S は、ブロック・列・番を選びます。');
}
['fY','fM'].forEach(id=>{dmById(id).onchange=()=>fillDays();});
dmById('fD').onchange=fillTimes;
dmById('fKind').onchange=syncForm;
dmById('formAddBtn').onclick=()=>{
  const k=dmById('fKind').value,hint=dmById('inHint');
  const box=(k==='Class A'||k==='BOX Room');
  const ds=dmById('fDrink').value;
  const f={
    yy:dmById('fY').value,mm:dmById('fM').value,dd:dmById('fD').value,time:dmById('fTime').value,kind:k,
    block:box?'':dmById('fBlock').value,
    row:(box||k==='PS')?null:numVal('fRow'),
    num:numVal('fNum'),
    box:box?numVal('fBox'):null,
    boxManual:dmById('fBox').value==='__m',
    drink:ds==='__m'?dmById('fDrinkM').value:ds,
    team:dmById('fTeam').value
  };
  if(Number.isNaN(f.row)||Number.isNaN(f.num)||Number.isNaN(f.box)){hint.textContent='手入力は1以上の整数で入力してください。';say('手入力は1以上の整数で入力してください');return;}
  const r=buildTicket(f);
  if(r.err){hint.textContent=r.err;say(r.err);return;}
  addRecords([r.rec],false);
};

const impDlg=dmById('importDlg');
dmById('fileIn').onchange=e=>{
  const f=e.target.files[0];
  if(!f)return;
  const rd=new FileReader();
  rd.onload=()=>{
    const recs=textToRecords(String(rd.result));
    dmById('impMsg').textContent=`${f.name}：${recs.length}件を読み取りました。現在の入力は${STORE.length}件です。`;
    const done=rep=>{impDlg.close();addRecords(recs,rep);e.target.value='';};
    dmById('impAdd').onclick=()=>done(false);
    dmById('impRep').onclick=()=>done(true);
    dmById('impCancel').onclick=()=>{impDlg.close();e.target.value='';};
    if(typeof impDlg.showModal==='function')impDlg.showModal();
    else done(!window.confirm('追加しますか。（キャンセルで置き換え）'));
  };
  rd.readAsText(f,'utf-8');
};

function dl(name,mime,text){
  const bl=new Blob([text],{type:mime});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(bl);a.download=name;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function exportRows(){return sortedRows().map(s=>({date:s.date,time:s.time,seat:s.seat,drink:s.drink,kind:s.kind,team:s.team}));}
function csvCell(v){v=String(v);return /[",\n\r]/.test(v)?'"'+v.replace(/"/g,'""')+'"':v;}
const EX_COLS=['date','time','seat','drink','kind','team'];
const EXPORTERS={
  csv:rows=>['\uFEFF'+EX_COLS.join(',')].concat(rows.map(r=>EX_COLS.map(c=>csvCell(r[c])).join(','))).join('\r\n'),
  txt:rows=>rows.map(r=>EX_COLS.map(c=>r[c]).join('\t')).join('\n'),
  json:rows=>JSON.stringify(rows,null,2),
  html:rows=>'<!DOCTYPE html>\n<html lang="ja"><head><meta charset="UTF-8"><title>チケット一覧</title></head><body>\n<table border="1" cellpadding="4" cellspacing="0">\n<thead><tr><th>日付</th><th>時間</th><th>席</th><th>のみもの</th><th>席種</th><th>チーム</th></tr></thead>\n<tbody>\n'+rows.map(r=>'<tr>'+EX_COLS.map(c=>'<td>'+esc(r[c])+'</td>').join('')+'</tr>').join('\n')+'\n</tbody></table>\n</body></html>'
};
const EXMIME={csv:'text/csv;charset=utf-8',txt:'text/plain;charset=utf-8',json:'application/json;charset=utf-8',html:'text/html;charset=utf-8'};
document.querySelectorAll('[data-ex]').forEach(b=>{
  b.onclick=()=>{
    const f=b.dataset.ex;
    if(!STORE.length){say('出力するデータがありません');return;}
    dl('tickets.'+f,EXMIME[f],EXPORTERS[f](exportRows()));
    say(f.toUpperCase()+'で出力しました');
  };
});

function dmInit(){
  try{
    const raw=localStorage.getItem(STORE_KEY);
    if(raw){const a=JSON.parse(raw);if(Array.isArray(a))STORE=a;}
    else{
      const old=localStorage.getItem('stst202611_tickets_v1');
      if(old){STORE=recsToStore(textToRecords(old)).out;dmSave();}
    }
  }catch(e){STORE=[];}
  fillDate();
  fillNumSel('fRow',MAX_ROW);fillNumSel('fNum',MAX_NUM);fillNumSel('fBox',MAX_BOX);
  fillDrink();syncForm();
  dmById('inHint').textContent='入力内容はこの端末（localStorage）にだけ保存され、外部には送信されません。新しく追加した行は表の上に入ります。';
  reflect();
}
