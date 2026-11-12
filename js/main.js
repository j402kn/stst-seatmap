const $=id=>document.getElementById(id);
const ta=$('ticketInput'), srcStatus=$('srcStatus');
const LSKEY='stst202611_tickets_v1';
function applyText(){
  const text=ta.value;
  try{if(text.trim())localStorage.setItem(LSKEY,text);else localStorage.removeItem(LSKEY);}catch(e){}
  loadRecords(textToRecords(text));
  srcStatus.textContent='この端末に保存したデータを表示中です。';
}
ta.addEventListener('input',applyText);
$('applyBtn').onclick=()=>{applyText();say('反映しました。'+$('statsLine').textContent);};
$('clearBtn').onclick=()=>{ta.value='';lastHL=null;applyText();say('入力を空にしました');};

document.querySelectorAll('.navtabs button').forEach(b=>{
  b.onclick=()=>{document.querySelectorAll('.navtabs button').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));
    document.querySelectorAll('.sec').forEach(s=>s.classList.remove('show'));
    $(b.dataset.sec).classList.add('show');};
});
(function(){
  const area=document.getElementById('swipeArea');
  let sx=0,sy=0,st=0,ok=false,tw=null,tsl=0;
  area.addEventListener('touchstart',e=>{
    if(e.touches.length!==1||document.getElementById('seatModal').classList.contains('open')){ok=false;return;}
    const t=e.touches[0];sx=t.clientX;sy=t.clientY;st=Date.now();ok=true;
    tw=e.target.closest?e.target.closest('.tablewrap'):null;tsl=tw?tw.scrollLeft:0;
  },{passive:true});
  area.addEventListener('touchend',e=>{
    if(!ok)return;ok=false;
    const t=e.changedTouches[0],dx=t.clientX-sx,dy=t.clientY-sy;
    if(Math.abs(dx)<70||Math.abs(dy)>Math.abs(dx)*0.6||Date.now()-st>900)return;
    if(tw&&tw.scrollWidth>tw.clientWidth+2){
      const max=tw.scrollWidth-tw.clientWidth;
      if(Math.abs(tw.scrollLeft-tsl)>1)return;
      if(dx>0&&tsl>1)return;
      if(dx<0&&tsl<max-1)return;
    }
    const btns=Array.prototype.slice.call(document.querySelectorAll('#monthBar button'));
    if(btns.length<2)return;
    let cur=btns.findIndex(b=>b.getAttribute('aria-pressed')==='true');if(cur<0)cur=0;
    btns[(cur+(dx<0?1:-1)+btns.length)%btns.length].click();
  },{passive:true});
})();
(function(){
  const NAMES={std:['標準','従来の色で表示'],cvd:['色覚配慮','明るさの段階で見分ける'],hc:['高コントラスト','白黒・太い枠・大きな文字']};
  const btn=document.getElementById('palBtn'), menu=document.getElementById('palMenu'), nm=document.getElementById('palName');
  function build(){
    menu.innerHTML='';
    Object.keys(PALETTES).forEach(k=>{
      const li=document.createElement('li');li.setAttribute('role','presentation');
      const b=document.createElement('button');b.type='button';b.setAttribute('role','option');b.setAttribute('aria-selected',String(k===PAL));b.dataset.pal=k;
      b.innerHTML=`<span class="pm-ck" aria-hidden="true">${k===PAL?'✓':''}</span><span class="pm-body"><span class="pm-name">${NAMES[k][0]}</span><span class="pm-desc">${NAMES[k][1]}</span></span><span class="pm-sw" aria-hidden="true"></span>`;
      PALETTES[k].fills.forEach(f=>{const i=document.createElement('i');i.style.background=f[0];b.querySelector('.pm-sw').appendChild(i);});
      b.onclick=()=>{
        PAL=k;try{localStorage.setItem(PALKEY,PAL);}catch(e){}
        buildLegend();render();build();openMenu(false);btn.focus();
        say('配色を'+NAMES[k][0]+'にしました');
      };
      li.appendChild(b);menu.appendChild(li);
    });
    nm.textContent=NAMES[PAL][0];
    btn.setAttribute('aria-label','配色の切り替え。いまは'+NAMES[PAL][0]);
  }
  function openMenu(v){
    menu.hidden=!v;btn.setAttribute('aria-expanded',String(v));
    if(v){const sel=menu.querySelector('[aria-selected="true"]');if(sel)sel.focus();}
  }
  btn.onclick=()=>openMenu(menu.hidden);
  document.addEventListener('click',e=>{if(!menu.hidden&&!menu.contains(e.target)&&!btn.contains(e.target))openMenu(false);});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){openMenu(false);btn.focus();}});
  build();
})();
(function(){
  const btn=document.getElementById('secretBtn');
  btn.setAttribute('aria-pressed',String(KBU));
  btn.onclick=()=>{
    KBU=!KBU;
    try{localStorage.setItem(KBKEY,KBU?'1':'0');}catch(e){}
    if(!KBU)LAY.kbd=false;
    saveLay();btn.setAttribute('aria-pressed',String(KBU));
    buildLayers();renderTables();renderCalendar();
    say(KBU?'キャストの誕生日の切り替えが、カレンダーに出ました':'キャストの誕生日の切り替えを隠しました');
  };
})();
measureBoxes();setPage('all',true);

$('inHint').textContent='貼り付けると自動でマップに反映されます。内容はこの端末（localStorage）にだけ保存され、外部には送信されません。日付は 2026-12-05 または 12月5日（土）の形で入力します。タブ区切りまたはJSONを受け付けます。';
srcStatus.textContent='この端末に保存したデータを使います。';
let saved=null;
try{saved=localStorage.getItem(LSKEY);}catch(e){}
if(saved){ta.value=saved;loadRecords(textToRecords(saved));}else render();

const DCKEY='stst202611_disclaimer_v1';
(function(){
  const dlg=$('disclaimer'), body=$('dcBody'), src=$('noticeBody');
  if(!dlg||!body||!src||typeof dlg.showModal!=='function')return;
  let seen=false;
  try{seen=localStorage.getItem(DCKEY)==='1';}catch(e){}
  if(seen)return;
  const copy=src.cloneNode(true);
  copy.removeAttribute('id');
  body.appendChild(copy);
  $('dcOk').onclick=()=>{
    try{localStorage.setItem(DCKEY,'1');}catch(e){}
    dlg.close();
  };
  dlg.showModal();
})();
