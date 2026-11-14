const CAL_MIN=202610, CAL_MAX=202703;
let calY=2026, calM=11, calSel=null, calAuto=true;
const LAYERS=[
  {id:'team',name:'公演チーム',text:'チーム',mk:''},
  {id:'photo',name:'写真撮影',text:'',mk:`<span class="emj">${EMO_PH}</span>`},
  {id:'send',name:'お見送り',text:'',mk:`<span class="emj wave">${EMO_SD}</span>`},
  {id:'bw',name:'BIRTHDAY WEEK',text:'Bday week',mk:''},
  {id:'cbd',name:'キャラクターの誕生日',text:'誕生日',mk:''},
  {id:'kbd',name:'キャストの誕生日',text:'',mk:'<span class="mk kb">★</span>'},
  {id:'cheer',name:'応援上演',text:'',mk:'<span class="mk cheer">応援</span>'},
  {id:'kids',name:'キッズ観劇Day',text:'',mk:'<span class="mk kids">キッズ</span>'},
  {id:'special',name:'特別公演',text:'',mk:'<span class="mk spec">特別</span>'},
  {id:'mine',name:'自分の公演（チケット）',text:'チケ',mk:'<span class="emj">🎫</span>'}
];
const LAY={team:true,photo:true,send:true,bw:true,cbd:true,kbd:false,cheer:true,kids:true,special:true,mine:true};
const LAYKEY='stst202611_cal_layers_v3';
try{const sv=JSON.parse(localStorage.getItem(LAYKEY)||'null');if(sv)Object.keys(LAY).forEach(k=>{if(typeof sv[k]==='boolean')LAY[k]=sv[k];});}catch(e){}
const KBKEY='stst202611_kb_unlock_v1';
let KBU=false;try{KBU=localStorage.getItem(KBKEY)==='1';}catch(e){}
if(!KBU)LAY.kbd=false;
function saveLay(){try{localStorage.setItem(LAYKEY,JSON.stringify(LAY));}catch(e){}}
function buildLayers(){
  const box=document.getElementById('calLayers');box.innerHTML='';
  LAYERS.forEach(L=>{
    if(L.id==='kbd'&&!KBU)return;
    const b=document.createElement('button');b.type='button';b.className='layerbtn';
    b.setAttribute('aria-pressed',String(LAY[L.id]));
    b.setAttribute('aria-label',(L.text?L.text+'：':'')+L.name);
    b.title=L.name;
    b.innerHTML=(L.mk?`<span aria-hidden="true">${L.mk}</span>`:'')+(L.text?`<span aria-hidden="true">${esc(L.text)}</span>`:'');
    b.onclick=()=>{LAY[L.id]=!LAY[L.id];saveLay();b.setAttribute('aria-pressed',String(LAY[L.id]));if(L.id==='kbd')renderTables();renderCalendar();say(L.name+'を'+(LAY[L.id]?'表示':'非表示')+'にしました');};
    box.appendChild(b);
  });
}
function allTickets(){return tickets.concat(unmapped);}
function renderWarn(){
  const box=document.getElementById('warnBox');
  if(!warns.length){box.hidden=true;box.innerHTML='';return;}
  box.hidden=false;
  box.innerHTML=`<h3>要確認のチケット（${warns.length}件）</h3><ul></ul>`;
  const ul=box.querySelector('ul');
  warns.forEach(w=>{
    const li=document.createElement('li');
    li.innerHTML=`<button type="button" class="lk">${esc(keyLabel(w.t.key))} ${esc(w.t.time)}</button>（${w.line}行目）${esc(w.msg)}`;
    li.querySelector('.lk').onclick=()=>goDay(w.t.key);
    ul.appendChild(li);
  });
}
function goDay(k){
  const p=k.split('-').map(Number);calY=p[0];calM=p[1];calSel=k;
  renderCalendar();
  document.querySelector('.navtabs button[data-sec="secCal"]').click();
  document.getElementById('secCal').scrollIntoView({block:'start'});
}
function clampCal(){
  const ym=calY*100+calM;
  if(ym<CAL_MIN){calY=2026;calM=10;}
  if(ym>CAL_MAX){calY=2027;calM=3;}
}
function bwFull(n){return `${memEn(n)} ${n} Birthday Week`;}
function dayInfo(k){
  const s=SCH[k], bd=BD[k.slice(5)]||[];
  const marks=[], label=[keyLabel(k)];
  if(s&&s.off)label.push('休演日');
  else if(s&&s.team&&LAY.team)label.push(TN[s.team]);
  if(s&&!s.off&&s.ph){
    const o=s.ph==='O'?'I':'O';
    if(LAY.photo){marks.push(`<span class="mk ${s.ph==='O'?'po':'pi'}">${EMO_PH}${GSHORT[s.ph]}</span>`);label.push('写真撮影 '+GTITLE[s.ph]);}
    if(LAY.send){marks.push(`<span class="mk ${o==='O'?'so':'si'}">${EMO_SD}${GSHORT[o]}</span>`);label.push('お見送り '+GTITLE[o]);}
  }
  if(s&&LAY.bw)s.bw.forEach(n=>{label.push(bwFull(n));});
  const cb=bd.filter(b=>b.kind==='char'), kb=bd.filter(b=>b.kind==='cast');
  if(LAY.cbd)cb.forEach(b=>{marks.push(`<span class="mk ${memCls(b.rn)}">${esc(memS(b.rn))}誕</span>`);label.push(b.rn+'の誕生日');});
  if(LAY.kbd&&kb.length){marks.push(`<span class="mk kb">★${kb.length>1?kb.length:''}</span>`);kb.forEach(b=>label.push(b.cast+'さん（'+TN[b.team]+'）の誕生日'));}
  if(s)s.ev.forEach(e=>{const c=EVCLS[e.name];if(c&&LAY[c[1]]){marks.push(`<span class="mk ${c[0]}">${c[2]}</span>`);label.push(e.name);}});
  return {marks,label};
}
function bwRange(n){return BWR.find(r=>r[2]===n);}
function renderCalendar(){
  const by={}, wc={};
  allTickets().forEach(t=>{(by[t.key]=by[t.key]||[]).push(t);});
  warns.forEach(w=>{wc[w.t.key]=true;});
  if(calAuto){
    calAuto=false;
    const ks=allTickets().map(t=>t.key).sort();
    const n=new Date(), today=dk(n.getFullYear(),n.getMonth()+1,n.getDate());
    const pick=ks.find(k=>k>=today)||ks[0];
    if(pick){calSel=pick;const p=pick.split('-').map(Number);calY=p[0];calM=p[1];}
    else{calSel=null;calY=n.getFullYear();calM=n.getMonth()+1;}
  }
  clampCal();
  const ym=calY*100+calM;
  document.getElementById('calMonth').textContent=`${calY}年${calM}月`;
  document.getElementById('calPrev').disabled=ym<=CAL_MIN;
  document.getElementById('calNext').disabled=ym>=CAL_MAX;
  const grid=document.getElementById('calGrid');grid.innerHTML='';
  const hd=document.createElement('div');hd.className='calweek';
  '月火水木金土日'.split('').forEach(d=>{const e=document.createElement('div');e.className='calhd';e.textContent=d;hd.appendChild(e);});
  grid.appendChild(hd);
  const first=(new Date(Date.UTC(calY,calM-1,1)).getUTCDay()+6)%7, days=new Date(Date.UTC(calY,calM,0)).getUTCDate();
  const weeks=[];let cur=new Array(7).fill(0), col=first;
  for(let d=1;d<=days;d++){cur[col]=d;col++;if(col===7){weeks.push(cur);cur=new Array(7).fill(0);col=0;}}
  if(cur.some(x=>x))weeks.push(cur);
  weeks.forEach(wk=>{
    const row=document.createElement('div');row.className='calweek';
    const segs=[];
    if(LAY.bw){
      const names={};
      wk.forEach((d,c)=>{if(!d)return;const s=SCH[dk(calY,calM,d)];if(s)s.bw.forEach(n=>{(names[n]=names[n]||[]).push(c);});});
      Object.keys(names).forEach(n=>{const cs=names[n];segs.push({n,s:cs[0],e:cs[cs.length-1]});});
      segs.sort((a,b)=>a.s-b.s);
      const laneEnd=[];
      segs.forEach(sg=>{let l=0;while(laneEnd[l]!==undefined&&laneEnd[l]>=sg.s)l++;sg.lane=l;laneEnd[l]=sg.e;});
    }
    const L=segs.length?Math.max.apply(null,segs.map(x=>x.lane))+1:0;
    wk.forEach((d,c)=>{
      if(!d){const e=document.createElement('div');e.className='calcell blank';e.style.cssText=`grid-row:1;grid-column:${c+1}`;row.appendChild(e);return;}
      const k=dk(calY,calM,d), s=SCH[k], ts=by[k]||[], info=dayInfo(k);
      const b=document.createElement('button');b.type='button';
      b.className='calcell'+(s&&s.off?' off':'')+(!s?' out':'');
      b.style.cssText=`grid-row:1;grid-column:${c+1}`;
      b.setAttribute('aria-pressed',String(k===calSel));
      let inner=`<span class="dn">${d}</span>`;
      if(L)inner+=`<span class="bwgap g${L}"></span>`;
      if(s&&s.off)inner+='<span>休演</span>';
      else if(s&&s.team&&LAY.team)inner+=`<img src="${IMG[s.team]}" alt="">`;
      if(info.marks.length)inner+=`<span class="mks">${info.marks.join('')}</span>`;
      const label=info.label.slice();
      if(!s)label.push('スケジュール範囲外');
      if(LAY.mine){
        if(ts.length){inner+=`<span class="cb ${pcCls(ts.length)}">${ts.length>=4?'4+':ts.length}</span>`;label.push(`チケット${ts.length}枚`);}
        if(wc[k]){inner+='<span class="cw">要確認</span>';label.push('要確認あり');}
      }
      b.innerHTML=inner;b.setAttribute('aria-label',label.join('、'));
      b.onclick=()=>{calSel=k;renderCalendar();const nb=document.querySelector('#calGrid .calcell[aria-pressed="true"]');if(nb)nb.focus({preventScroll:true});document.getElementById('calDetail').scrollIntoView({block:'nearest'});say(label.join('、'));};
      row.appendChild(b);
    });
    segs.forEach(sg=>{
      const r=bwRange(sg.n), k1=dk(calY,calM,wk[sg.s]), k2=dk(calY,calM,wk[sg.e]), span=sg.e-sg.s+1, en=memEn(sg.n);
      const bar=document.createElement('div');
      bar.className='bwbar'+(r&&k1===r[0]?' st':'')+(r&&k2===r[1]?' en':'');
      bar.setAttribute('aria-hidden','true');
      bar.style.cssText=memStyle(sg.n)+`;grid-row:1;grid-column:${sg.s+1} / span ${span};margin-top:${30+sg.lane*24}px`;
      bar.textContent=span>=6?bwFull(sg.n):(span>=4?`${en} ${sg.n}`:(span>=2?en.replace('Sailor ',''):sg.n));
      row.appendChild(bar);
    });
    grid.appendChild(row);
  });
  renderCalDetail(by);
}
function renderCalDetail(by){
  const box=document.getElementById('calDetail');
  if(!calSel){box.innerHTML='<p>日付を押すと、その日の公演情報が出ます。</p>';return;}
  const k=calSel, s=SCH[k], bd=BD[k.slice(5)]||[], ts=(by[k]||[]).slice().sort((a,b)=>a.time.localeCompare(b.time));
  let h=`<h3>${esc(keyLabel(k))}</h3>`;
  if(!s)h+='<p>取り込んだスケジュールの範囲外の日付です。</p>';
  else if(s.off)h+='<p>休演日です。</p>';
  else{
    if(LAY.team)h+=`<p><span class="team"><span class="chip"><img src="${IMG[s.team]}" alt=""></span>${TN[s.team]}の公演日</span></p>`;
    if(s.ph){
      const o=s.ph==='O'?'I':'O';
      if(LAY.photo)h+=`<p><span class="mk ${s.ph==='O'?'po':'pi'}">${EMO_PH}${GSHORT[s.ph]}</span> 写真撮影：${esc(GTITLE[s.ph])}</p>`;
      if(LAY.send){
        const names=GTITLE[o]+'、クイーン・ヴァルシア'+(s.code?'、ヴァルシア・コード':'');
        h+=`<p><span class="mk ${o==='O'?'so':'si'}">${EMO_SD}${GSHORT[o]}</span> お見送り：${esc(names)}</p>`;
      }
    }
    s.ev.forEach(e=>{const c=EVCLS[e.name];if(c&&LAY[c[1]])h+=`<p><span class="mk ${c[0]}">${c[2]}</span> ${esc(e.name)}（対象公演：${esc(e.times.join('／'))}）</p>`;});
  }
  if(s&&LAY.bw)s.bw.forEach(n=>{const b=bwBirth(n);h+=`<p><span class="mk ${memCls(n)}">${esc(memS(n))}週</span> ${esc(bwFull(n))}${b?'（誕生日 '+esc(b)+'）':''}</p>`;});
  if(LAY.cbd)bd.filter(b=>b.kind==='char').forEach(b=>{h+=`<p><span class="mk ${memCls(b.rn)}">${esc(memS(b.rn))}誕</span> ${esc(b.role)}の誕生日</p>`;});
  if(LAY.kbd)bd.filter(b=>b.kind==='cast').forEach(b=>{h+=`<p><span class="mk kb">★</span> ${esc(b.cast)}さん（${TN[b.team]}・${esc(b.rn)}役）の誕生日${s&&s.team===b.team&&!s.off?'<small>この日の出演チームです</small>':''}</p>`;});
  if(LAY.mine){
    if(!ts.length)h+='<p>この日のチケットはありません。</p>';
    else{
      h+='<ul>';
      ts.forEach(t=>{
        const ws=warns.filter(w=>w.t===t).map(w=>`<div class="w">⚠ ${esc(w.msg)}</div>`).join('');
        h+=`<li><strong>${esc(t.time)}</strong> ${teamHTML(t)}${evHTML(t).replace('<br>',' ')}<br>${t.seat?`<button type="button" class="seatbtn" data-k="${esc(t.seat.key)}">${esc(t.seatRaw)}</button>`:`<span class="tag BOX">図外</span>${esc(t.seatRaw)}`}${t.drink?'　'+esc(t.drink):''}${t.role?'　'+esc(t.role):''}${t.kind?'　'+esc(t.kind):''}${ws}</li>`;
      });
      h+='</ul>';
    }
  }
  box.innerHTML=h;
  box.querySelectorAll('.seatbtn').forEach(b=>{b.onclick=()=>highlightSeat(b.dataset.k);});
}
document.getElementById('calPrev').onclick=()=>{calM--;if(calM<1){calM=12;calY--;}calSel=null;renderCalendar();say(calY+'年'+calM+'月');};
document.getElementById('calNext').onclick=()=>{calM++;if(calM>12){calM=1;calY++;}calSel=null;renderCalendar();say(calY+'年'+calM+'月');};
buildLayers();

