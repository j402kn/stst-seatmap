function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
const WD='日月火水木金土';
function mkDate(y,mon,day){
  const d=new Date(y,mon-1,day);
  if(d.getFullYear()!==y||d.getMonth()!==mon-1||d.getDate()!==day)return null;
  const wd=WD[d.getDay()];
  return {year:y,month:mon,day,wd,label:`${mon}月${day}日（${wd}）`,short:`${mon}/${day}（${wd}）`,d,ym:y*100+mon};
}
function parseDateAny(s){
  s=String(s==null?'':s).trim(); if(!s)return null;
  let m=s.match(/^(\d{4})[-\/.](\d{1,2})[-\/.](\d{1,2})/);
  if(m)return mkDate(+m[1],+m[2],+m[3]);
  m=s.match(/(\d{4})年(\d{1,2})月(\d{1,2})日/);
  if(m)return mkDate(+m[1],+m[2],+m[3]);
  m=s.match(/(\d{1,2})月(\d{1,2})日/);
  if(m){
    const mon=+m[1], now=new Date(), cm=now.getMonth()+1; let y=now.getFullYear();
    if(cm>=10&&mon<=3)y+=1; else if(cm<=3&&mon>=10)y-=1;
    return mkDate(y,mon,+m[2]);
  }
  return null;
}
function normTime(s){
  s=String(s==null?'':s).trim(); const m=s.match(/(\d{1,2}):(\d{2})/);
  return m?m[1].padStart(2,'0')+':'+m[2]:s;
}
function parseSeat(s){
  if(/2F|BOX/i.test(s))return null;
  const bm=s.match(/([ABCD])ブロック/); if(!bm)return null;
  const block=bm[1];
  const rm=s.match(/(\d+)列/), nm=s.match(/(\d+)番/);
  const num=nm?+nm[1]:null;
  if(rm){const row=+rm[1];
    if(num&&seatEls[`${block}|${row}|${num}`])return {block,row,num,key:`${block}|${row}|${num}`};
    return null;}
  if(num&&seatEls[`${block}|PS|${num}`])return {block,row:'PS',num,key:`${block}|PS|${num}`};
  return null;
}
function parseTeam(s,k){
  s=String(s==null?'':s).trim();
  const kk=(k===true)||/貸切|kashikiri|^1$|^true$|^○$/i.test(String(k==null?'':k).trim());
  if(/gold|金/i.test(s))return {id:kk?'kgold':'gold',name:'Team Gold Moon'+(kk?'（貸切）':'')};
  if(/silver|銀/i.test(s))return {id:kk?'ksilver':'silver',name:'Team Silver Moon'+(kk?'（貸切）':'')};
  return null;
}
function normalize(r){
  const date=parseDateAny(r.date); if(!date)return null;
  return {date,time:normTime(r.time),seatRaw:String(r.seat==null?'':r.seat).trim(),drink:String(r.drink==null?'':r.drink).trim(),kind:String(r.kind==null?'':r.kind).trim(),team:parseTeam(r.team,r.kashikiri),role:String(r.role==null?'':r.role).trim(),mail:!!r.__mail};
}
function tsvToRecords(text){
  const out=[];
  text.split(/\r?\n/).forEach((line,i)=>{
    if(!line.trim())return;
    const p=line.split('\t');
    out.push({date:p[0],time:p[1],seat:p[2],drink:p[3],kind:p[4],team:p[5],kashikiri:p[6],__line:i+1});
  });
  return out;
}
const KIND_RE=/^(Premium\s*seat|Class\s*[A-Z]|BOX\s*Room)/i;
function csvRows(text){
  const rows=[];let row=[],cell='',q=false;
  for(let i=0;i<text.length;i++){
    const ch=text[i];
    if(q){if(ch==='"'){if(text[i+1]==='"'){cell+='"';i++;}else q=false;}else cell+=ch;}
    else if(ch==='"')q=true;
    else if(ch===','){row.push(cell);cell='';}
    else if(ch==='\n'||ch==='\r'){if(ch==='\r'&&text[i+1]==='\n')i++;row.push(cell);rows.push(row);row=[];cell='';}
    else cell+=ch;
  }
  if(cell!==''||row.length){row.push(cell);rows.push(row);}
  return rows.filter(r=>r.some(c=>String(c).trim()!==''));
}
const HEAD_KEYS={date:'date','日付':'date','公演日':'date',time:'time','時間':'time','時刻':'time',seat:'seat','席':'seat','座席':'seat',drink:'drink','のみもの':'drink','ドリンク':'drink',kind:'kind','席種':'kind','種類':'kind',team:'team','チーム':'team'};
function csvToRecords(text){
  const rows=csvRows(text);
  if(!rows.length)return [];
  const first=rows[0].map(c=>String(c).trim());
  const isHead=!parseDateAny(first[0])&&first.some(c=>HEAD_KEYS[c.toLowerCase()]||HEAD_KEYS[c]);
  const cols=isHead?first.map(c=>HEAD_KEYS[c.toLowerCase()]||HEAD_KEYS[c]||null):['date','time','seat','drink','kind','team','kashikiri'];
  return rows.slice(isHead?1:0).map((r,i)=>{
    const o={__line:i+1+(isHead?1:0)};
    r.forEach((v,k)=>{if(cols[k])o[cols[k]]=v;});
    return o;
  });
}
function freeToRecords(text){
  const out=[];let date=null,time=null;
  text.normalize('NFKC').split(/\r?\n/).forEach((raw,i)=>{
    const ln=raw.trim();if(!ln)return;
    const sm=ln.match(/(\d+F\s*.*番)\s*$/);
    if(sm&&KIND_RE.test(ln)){
      const head=ln.slice(0,sm.index).trim();
      const km=head.match(KIND_RE);
      let rest=head.slice(km[0].length).replace(/\s*[\d,]+円\s*$/,'').trim();
      let drink='',role='';
      const dm=rest.match(/【([^】]*)】/);
      if(dm){drink=dm[1].trim();role=rest.replace(dm[0],'').trim();}
      else if(/ドリンクなし/.test(rest)){drink='なし';role=rest.replace(/ドリンクなし/,'').trim();}
      else role=rest;
      out.push({date,time,kind:km[0].replace(/\s+/g,' ').trim(),drink,role,seat:sm[1].replace(/\s+/g,' ').trim(),team:'',kashikiri:'',__line:i+1});
      return;
    }
    if(!/番/.test(ln)&&parseDateAny(ln)){
      date=ln.match(/\d{4}[-\/.]\d{1,2}[-\/.]\d{1,2}|\d{4}年\d{1,2}月\d{1,2}日|\d{1,2}月\d{1,2}日/)[0];
      const tm=ln.match(/(\d{1,2}):(\d{2})/);if(tm)time=tm[0];
    }
  });
  return out;
}
function textToRecords(text){
  const t=text.trim();
  if(!t)return [];
  if(/[■●]/.test(t)&&/\d{4}年\s*\d{1,2}月\s*\d{1,2}日/.test(t.normalize('NFKC')))return emailToRecords(text);
  if(/^[\[{]/.test(t)){
    try{const j=JSON.parse(t);const arr=Array.isArray(j)?j:(j.tickets||[]);return arr.map((r,i)=>Object.assign({__line:i+1},r));}
    catch(e){}
  }
  const n=t.normalize('NFKC');
  if(!/\t/.test(t)&&n.split(/\r?\n/).some(l=>KIND_RE.test(l.trim())&&/番\s*$/.test(l.trim())))return freeToRecords(text);
  if(/\t/.test(t))return tsvToRecords(text);
  if(/,/.test(t))return csvToRecords(text);
  return tsvToRecords(text);
}

function emailToRecords(text){
  const lines=text.normalize('NFKC').split(/\r?\n/);
  const out=[]; let date=null,time=null,cur=null;
  const flush=()=>{if(cur){out.push(cur);cur=null;}};
  lines.forEach((raw,i)=>{
    const ln=raw.trim(); if(!ln)return;
    let m=ln.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日(?:\([^)]*\))?\s*(\d{1,2}:\d{2})/);
    if(m){flush();date=m[1]+'-'+m[2]+'-'+m[3];time=m[4];return;}
    if(/^[-─=]{5,}$/.test(ln)||ln.charAt(0)==='■'){flush();return;}
    if(ln.charAt(0)==='●'){
      flush();
      let body=ln.slice(1).trim();
      body=body.replace(/\s*[\d,]+円\s*$/,'');
      const dm=body.match(/【([^】]*)】/);
      let kind=body, drink='', role='';
      if(dm){kind=body.slice(0,dm.index);drink=dm[1].trim();role=body.slice(dm.index+dm[0].length).trim();}
      else if(/ドリンクなし/.test(body)){drink='なし';kind=body.replace(/ドリンクなし/,'');}
      cur={date,time,kind:kind.trim(),drink,role,seat:'',team:'',kashikiri:'',__line:i+1,__mail:true};
      return;
    }
    if(cur&&!cur.seat){cur.seat=ln.replace(/\s+/g,' ');cur.__line=i+1;flush();}
  });
  flush();
  return out;
}
