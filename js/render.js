function loadRecords(recs){
  tickets=[];unmapped=[];skipped=[];warns=[];calAuto=true;
  recs.forEach((r,i)=>{
    const t=normalize(r);
    if(!t){skipped.push(r.__line||i+1);return;}
    applySchedule(t,r.__line||i+1);
    const seat=parseSeat(t.seatRaw);
    if(seat){t.seat=seat;tickets.push(t);}else{t.seat=null;unmapped.push(t);}
  });
  checkDup();
  render();
}
function teamChip(t){
  if(!t.team)return '<span aria-label="未設定">－</span>';
  return `<span class="chip" title="${esc(t.team.name)}"><img src="${IMG[t.team.id]}" alt="${esc(t.team.name)}"></span>`;
}
function teamHTML(t){
  if(!t.team)return '<span aria-label="未設定">－</span>';
  return `<span class="team"><span class="chip"><img src="${IMG[t.team.id]}" alt=""></span>${esc(t.team.name)}</span>`;
}
function pcCls(c){return 'pc'+Math.min(c,4);}
let currentMonth='all';
function filtered(list){return list.filter(t=>currentMonth==='all'||t.date.ym===+currentMonth);}
function countMap(){const m={};filtered(tickets).forEach(t=>{(m[t.seat.key]=m[t.seat.key]||[]).push(t);});return m;}
const byDate=(a,b)=>a.date.d-b.date.d||a.time.localeCompare(b.time);
function paint(map){
  Object.keys(seatEls).forEach(k=>{
    const o=seatEls[k], list=map[k]||[], c=list.length;
    paintSeat(o,c);
    if(c){
      o.cbg.setAttribute('display','block');o.ctxt.setAttribute('display','block');o.ctxt.textContent=c>=4?'4+':String(c);
      const dates=list.slice().sort(byDate).map(t=>t.date.label+t.time).join('、');
      o.g.setAttribute('aria-label',`${o.baseLabel}、所持${c}枚、${dates}`);
    }else{
      o.cbg.setAttribute('display','none');o.ctxt.setAttribute('display','none');
      o.g.setAttribute('aria-label',o.baseLabel+'、チケットなし');
    }
  });
  const cnt={A:0,B:0,C:0,D:0};
  for(const k in map)cnt[k[0]]+=map[k].length;
  document.querySelectorAll('#pageTabs button[data-page]').forEach(b=>{
    const s=b.querySelector('.cnt'); if(s)s.textContent=(cnt[b.dataset.page]||0)+'件';
  });
}
function renderDup(map){
  const arr=Object.entries(map).filter(([k,v])=>v.length>1).sort((a,b)=>b[1].length-a[1].length);
  const div=document.getElementById('dupList');
  if(!arr.length){div.textContent='なし';return;}
  div.innerHTML='';
  arr.forEach(([k,v])=>{
    const b=document.createElement('button');b.type='button';b.className='dupitem';
    b.innerHTML=`<strong>${esc(seatName(k))}</strong><span class="badge ${pcCls(v.length)}">${v.length}件</span><small>${v.slice().sort(byDate).map(t=>esc(t.date.label+' '+t.time)).join(' ／ ')}</small>`;
    b.onclick=()=>{highlightSeat(k);openSeatModal(k);};
    div.appendChild(b);
  });
}
function renderMonthBar(){
  const all=[...tickets,...unmapped];
  const yms=[...new Set(all.map(t=>t.date.ym))].sort((a,b)=>a-b);
  const multiYear=new Set(yms.map(x=>Math.floor(x/100))).size>1;
  if(currentMonth!=='all'&&!yms.includes(+currentMonth))currentMonth='all';
  const bar=document.getElementById('monthBar');bar.innerHTML='';
  const mk=(val,l)=>{const b=document.createElement('button');b.type='button';b.textContent=l;b.setAttribute('aria-pressed',String(String(currentMonth)===String(val)));
    b.onclick=()=>{currentMonth=val;if(val!=='all'){calY=Math.floor(val/100);calM=val%100;calSel=null;}render();say(l+'で絞り込みました');};bar.appendChild(b);};
  mk('all','すべて');
  yms.forEach(x=>mk(x,(multiYear?Math.floor(x/100)+'年':'')+(x%100)+'月'));
}
function tagFor(t){return t.seat.row==='PS'?'<span class="tag PS">ソファ</span>':(/Premium/i.test(t.kind)?'<span class="tag P">Premium</span>':'<span class="tag S">Class S</span>');}
function renderTables(){
  const tb=document.querySelector('#ticketTable tbody');tb.innerHTML='';
  filtered(tickets).slice().sort(byDate).forEach(t=>{
    const tr=document.createElement('tr');tr.dataset.key=t.seat.key;
    tr.innerHTML=`<td>${esc(t.date.short)}${evHTML(t)}</td><td>${esc(t.time)}</td><td>${teamIcon(t)}</td><td>${tagFor(t)}<button type="button" class="seatbtn">${esc(t.seatRaw)}</button></td><td>${esc(t.drink)}</td>`;
    tr.querySelector('.seatbtn').onclick=()=>highlightSeat(t.seat.key);
    tb.appendChild(tr);
  });
  const ub=document.querySelector('#unmappedTable tbody');ub.innerHTML='';
  filtered(unmapped).slice().sort(byDate).forEach(t=>{
    const tr=document.createElement('tr');
    tr.innerHTML=`<td>${esc(t.date.label)}${evHTML(t)}</td><td>${esc(t.time)}</td><td>${teamIcon(t)}</td><td><span class="tag BOX">図外</span>${esc(t.seatRaw)}</td><td>${esc(t.drink)}</td><td>${esc(t.kind)}</td>`;
    ub.appendChild(tr);
  });
}
function renderStats(){
  let s=`読み込み：マップ反映 ${tickets.length}件 ／ 図に出していない席 ${unmapped.length}件 ／ 合計 ${tickets.length+unmapped.length}件`;
  if(skipped.length)s+=` ／ 日付を読み取れず無視した行：${skipped.slice(0,20).join('、')}行目${skipped.length>20?' ほか':''}`;
  if(warns.length)s+=` ／ 要確認 ${warns.length}件`;document.getElementById('statsLine').textContent=s;
}
let lastHL=null;
function highlightSeat(k){
  if(lastHL&&seatEls[lastHL])seatEls[lastHL].g.classList.remove('sel');
  if(seatEls[k]){
    if(curPage!==k[0])setPage(k[0],true);
    seatEls[k].g.classList.add('sel');lastHL=k;
    shell.scrollIntoView({block:'center'});
    say(seatName(k)+'を強調表示しました');
  }
  document.querySelectorAll('#ticketTable tr[data-key]').forEach(tr=>tr.classList.toggle('hl',tr.dataset.key===k));
}
let lastFocus=null;
function openSeatModal(k){
  const list=(countMap()[k]||[]).slice().sort(byDate);
  document.getElementById('modalTitle').textContent=seatName(k);
  const tb=document.querySelector('#modalTable tbody');tb.innerHTML='';
  if(!list.length)tb.innerHTML='<tr><td colspan="4">この席のチケットはありません</td></tr>';
  list.forEach(t=>{const tr=document.createElement('tr');tr.innerHTML=`<td>${esc(t.date.label)}${evHTML(t)}</td><td>${esc(t.time)}</td><td>${teamChip(t)}</td><td>${esc(t.drink)}</td>`;tb.appendChild(tr);});
  lastFocus=document.activeElement;
  document.getElementById('seatModal').classList.add('open');
  document.querySelector('main').inert=true;
  document.getElementById('modalClose').focus();
}
function closeModal(){
  document.getElementById('seatModal').classList.remove('open');
  document.querySelector('main').inert=false;
  if(lastFocus&&lastFocus.focus)lastFocus.focus();
}
document.getElementById('modalClose').onclick=closeModal;
document.getElementById('seatModal').addEventListener('click',e=>{if(e.target.id==='seatModal')closeModal();});
document.addEventListener('keydown',e=>{
  if(!document.getElementById('seatModal').classList.contains('open'))return;
  if(e.key==='Escape')closeModal();
  if(e.key==='Tab'){e.preventDefault();document.getElementById('modalClose').focus();}
});
function render(){const map=countMap();paint(map);renderDup(map);renderMonthBar();renderTables();renderStats();renderWarn();renderCalendar();}
