function paintSeat(o,n){
  const pal=PALETTES[PAL], c=Math.min(n,4), rp=pal.fills[c], fc=(o.type==='S')?'#ffffff':C.gold, w=pal.fw;
  o.rect.setAttribute('fill',rp[0]);
  o.label.setAttribute('fill',rp[1]);
  o.label.setAttribute('font-size',(pal.big?o.fs*1.15:o.fs).toFixed(1));
  let halo=null, fr={c:fc,w:w};
  if(n>0)halo={c:'#000000',w:w+2.6};
  if(o.added&&n===0)fr={c:'#ffffff',w:2,d:'3,2'};
  if(halo){o.halo.setAttribute('display','block');o.halo.setAttribute('stroke',halo.c);o.halo.setAttribute('stroke-width',halo.w);}
  else o.halo.setAttribute('display','none');
  o.fr.setAttribute('stroke',fr.c);o.fr.setAttribute('stroke-width',fr.w);
  if(fr.d)o.fr.setAttribute('stroke-dasharray',fr.d);else o.fr.removeAttribute('stroke-dasharray');
  o.cbg.setAttribute('r',pal.big?10:8);o.ctxt.setAttribute('font-size',pal.big?12:9);
}
const CX=500, CY=230, R0=150, GAP=34, HALF=25;
const NS='http://www.w3.org/2000/svg';
const svg=document.getElementById('seatmap');
const PAGES=['all','A','B','C','D'];
const blockEls={A:[],B:[],C:[],D:[],all:[]};
const allEls=[];
const BLOCKS={
 A:{c:-85,rows:[{t:'P',n:5,add:[5]},{t:'P',n:6},{t:'P',n:7},{t:'S',n:9},{t:'S',n:9},{t:'S',n:12,add:[10,11,12]},{t:'S',n:5,add:[5]}],sofas:[{n:1,a:-70},{n:2,a:-85},{n:3,a:-100}]},
 B:{c:-145,rows:[{t:'P',n:6},{t:'P',n:8,add:[8]},{t:'P',n:9,add:[9]},{t:'S',n:10},{t:'S',n:11},null,{t:'S',n:9,add:[8,9]}],sofas:[1,2,3,4,5,6,7,9,10]},
 C:{c:145,rows:[{t:'P',n:6},{t:'P',n:8,add:[8]},{t:'P',n:8},{t:'S',n:10},{t:'S',n:11},null,{t:'S',n:8,add:[8]}],sofas:[]},
 D:{c:85,rows:[{t:'P',n:5,add:[5]},{t:'P',n:6},{t:'P',n:7},{t:'S',n:9},{t:'S',n:9},{t:'S',n:12,add:[10,11,12]}],sofas:Array.from({length:12},(_,i)=>({n:i+1,a:112-i*54/11}))}
};
function polar(r,deg){const a=deg*Math.PI/180;return [CX+r*Math.sin(a), CY-r*Math.cos(a)];}
function arcPath(r,a1,a2){const [x1,y1]=polar(r,a1),[x2,y2]=polar(r,a2);return `M ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2}`;}
function wedgePath(r1,r2,a1,a2){
  const [x1,y1]=polar(r1,a1),[x2,y2]=polar(r1,a2),[x3,y3]=polar(r2,a2),[x4,y4]=polar(r2,a1);
  return `M ${x1} ${y1} A ${r1} ${r1} 0 0 1 ${x2} ${y2} L ${x3} ${y3} A ${r2} ${r2} 0 0 0 ${x4} ${y4} Z`;
}
function el(tag,attrs){const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);return e;}
function txt(x,y,s,size,fill,anchor){const t=el('text',{x,y,'font-size':size,fill:fill||C.text,'text-anchor':anchor||'middle','font-weight':'bold'});t.textContent=s;return t;}
function put(e,blk){svg.appendChild(e);(blockEls[blk]||blockEls.all).push(e);allEls.push(e);}
const TYPE_NAME={P:'Premium席',S:'Class S',PS:'ソファ席'};
let dragged=false;
const seatEls={};
function seatName(k){const [b,r,n]=k.split('|');return r==='PS'?`${b}ブロック ソファ${n}番`:`${b}ブロック ${r}列 ${n}番`;}
function makeSeat(x,y,rot,w,h,type,added,key,labelStr){
  const blk=key.split('|')[0];
  const g=el('g',{class:'seat',role:'button',tabindex:'-1'});
  const geo={x:x-w/2,y:y-h/2,width:w,height:h,rx:3};
  const mkr=()=>{const q=el('rect',Object.assign({},geo));if(rot)q.setAttribute('transform',`rotate(${rot} ${x} ${y})`);return q;};
  const r=mkr();r.setAttribute('stroke','none');
  const halo=mkr();halo.setAttribute('fill','none');halo.setAttribute('display','none');
  const fr=mkr();fr.setAttribute('fill','none');
  const fs=w<19?8.5:9.5;
  const label=txt(x,y+fs*0.36,labelStr,fs,'#ffffff');
  const cbg=el('circle',{cx:x+w/2-1,cy:y-h/2+1,r:8,fill:'#fff',stroke:'#000','stroke-width':1,display:'none','pointer-events':'none'});
  const ctxt=txt(x+w/2-1,y-h/2+4,'',9,'#000');ctxt.setAttribute('display','none');
  g.appendChild(r);g.appendChild(halo);g.appendChild(fr);g.appendChild(label);
  const baseLabel=`${seatName(key)}、${TYPE_NAME[type]}${added?'、追加席':''}`;
  g.setAttribute('aria-label',baseLabel+'、チケットなし');
  g.addEventListener('click',()=>{if(dragged)return;openSeatModal(key);});
  g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();openSeatModal(key);}});
  g.addEventListener('focus',()=>panToElement(g));
  put(g,blk);
  badgeQ.push({cbg,ctxt,blk});
  seatEls[key]={g,rect:r,halo,fr,label,cbg,ctxt,type,added,fs,baseLabel};
  paintSeat(seatEls[key],0);
}
Object.keys(BLOCKS).forEach(b=>{
  const B=BLOCKS[b], c=B.c, nrows=B.rows.length;
  const a1=c-HALF, a2=c+HALF;
  const rOut=R0+GAP*nrows+14;
  put(el('path',{d:wedgePath(R0-22,rOut,a1,a2),fill:C.wedgeFill,stroke:C.wedgeStroke,'stroke-width':2}),b);
  put(el('path',{d:arcPath(rOut+16,a1,a2),fill:'none',stroke:C.wedgeStroke,'stroke-width':1.5,'stroke-dasharray':'5,4'}),b);
  const [lx,ly]=polar(R0-48,c);
  put(txt(lx,ly,''+b,22,C.gold),b);
  put(el('path',{d:arcPath(R0+2.5*GAP,a1,a2),fill:'none',stroke:C.gold,'stroke-width':2,'stroke-dasharray':'7,5'}),b);
  B.rows.forEach((row,i)=>{
    if(!row)return;
    const rowNo=i+1, r=R0+i*GAP, n=row.n;
    const w=Math.min(24, 0.8727*r/n*0.88), h=15;
    const items=[];
    for(let j=0;j<n;j++){const ang=a1+(j+.5)*(2*HALF/n);const [x,y]=polar(r,ang);items.push({x,y,ang});}
    items.sort((p,q)=>q.ang-p.ang);
    items.forEach((it,idx)=>{
      const num=idx+1;
      const key=`${b}|${rowNo}|${num}`;
      const added=(row.add||[]).includes(num);
      makeSeat(it.x,it.y,it.ang,w,h,row.t,added,key,row.t+num);
    });
    const la=(b==='A'||b==='B')?c-HALF-5:c+HALF+5;
    const [rx,ry]=polar(r,la);
    put(txt(rx,ry+3.5,'列'+rowNo,10,C.text),b);
  });
});
BLOCKS.A.sofas.forEach(s=>{const [x,y]=polar(446,s.a);makeSeat(x,y,s.a,24,16,'PS',false,`A|PS|${s.n}`,'PS'+s.n);});
BLOCKS.D.sofas.forEach(s=>{const [x,y]=polar(410,s.a);makeSeat(x,y,s.a,24,16,'PS',false,`D|PS|${s.n}`,'PS'+s.n);});
(function(){const list=BLOCKS.B.sofas,n=list.length,r=430;list.forEach((num,j)=>{const ang=-122+(j+.5)*(-46/n);const [x,y]=polar(r,ang);makeSeat(x,y,ang,24,16,'PS',false,`B|PS|${num}`,'PS'+num);});})();
badgeQ.forEach(q=>{put(q.cbg,q.blk);put(q.ctxt,q.blk);});
const st=txt(CX,120,'STAGE',22,C.gold);st.setAttribute('letter-spacing','6');put(st,'all');
function buildLegend(){
  applyPalVars();
  const lab=['0','1','2','3','4+'];
  const seat=[['lg-p','Premium席（P）'],['lg-s','Class S'],['lg-p','ソファ（PS）'],['lg-add','追加席']];
  document.getElementById('legendSeat').innerHTML=seat.map(i=>`<li><span class="sw ${i[0]}" aria-hidden="true"></span>${i[1]}</li>`).join('');
  document.getElementById('legendOwn').innerHTML='<li><span class="swrow">'+lab.map((t,i)=>`<span class="sw swl pc${i}" aria-hidden="true">${t}</span>`).join('')+'</span></li>';
}
buildLegend();

const shell=document.getElementById('mapshell');
const live=document.getElementById('live');
function say(s){live.textContent='';setTimeout(()=>{live.textContent=s;},30);}
let boxes={}, curPage='all', base={x:0,y:0,w:1000,h:680}, v={x:0,y:0,w:1000,h:680};
function measureBoxes(){
  svg.setAttribute('viewBox','0 0 1000 680');
  allEls.forEach(e=>e.style.display='');
  const inv=svg.getScreenCTM().inverse();
  const calc=list=>{
    let x1=1e9,y1=1e9,x2=-1e9,y2=-1e9;
    list.forEach(e=>{
      const r=e.getBoundingClientRect(); if(!r.width&&!r.height)return;
      [[r.left,r.top],[r.right,r.bottom]].forEach(([px,py])=>{
        const p=new DOMPoint(px,py).matrixTransform(inv);
        x1=Math.min(x1,p.x);y1=Math.min(y1,p.y);x2=Math.max(x2,p.x);y2=Math.max(y2,p.y);});
    });
    const pad=14; return {x:x1-pad,y:y1-pad,w:x2-x1+pad*2,h:y2-y1+pad*2};
  };
  boxes.all=calc(allEls);
  ['A','B','C','D'].forEach(b=>boxes[b]=calc(blockEls[b]));
}
function fitAspect(b){
  const r=svg.getBoundingClientRect(), ar=r.width/r.height;
  let {x,y,w,h}=b;
  if(w/h<ar){const nw=h*ar;x-=(nw-w)/2;w=nw;}else{const nh=w/ar;y-=(nh-h)/2;h=nh;}
  return {x,y,w,h};
}
function applyView(){svg.setAttribute('viewBox',`${v.x} ${v.y} ${v.w} ${v.h}`);const z=(base.w/v.w)>1.02?'none':'pan-y';shell.style.touchAction=z;svg.style.touchAction=z;}
function clampView(){
  if(v.w>=base.w){v.w=base.w;v.h=base.h;v.x=base.x;v.y=base.y;return;}
  v.x=Math.min(Math.max(v.x,base.x),base.x+base.w-v.w);
  v.y=Math.min(Math.max(v.y,base.y),base.y+base.h-v.h);
}
function scaleNow(){return base.w/v.w;}
function resetZoom(){v={...base};applyView();}
function pageName(p){return p==='all'?'全体':p+'ブロック';}
function setPage(p,silent){
  if(!boxes.all)measureBoxes();
  curPage=p;
  allEls.forEach(e=>e.style.display='none');
  (p==='all'?allEls:blockEls[p]).forEach(e=>e.style.display='');
  Object.values(seatEls).forEach(o=>o.g.setAttribute('tabindex',(p!=='all'&&o.g.style.display!=='none')?'0':'-1'));
  base=fitAspect(boxes[p]);resetZoom();
  document.querySelectorAll('#pageTabs button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.page===p)));
  document.getElementById('pageInfo').textContent=pageName(p);
  if(!silent)say(pageName(p)+'を表示しました');
}
function stepPage(d){const i=PAGES.indexOf(curPage);setPage(PAGES[(i+d+PAGES.length)%PAGES.length]);}
document.querySelectorAll('#pageTabs button').forEach(b=>b.onclick=()=>setPage(b.dataset.page));
document.getElementById('prevBtn').onclick=()=>stepPage(-1);
document.getElementById('nextBtn').onclick=()=>stepPage(1);
function toSvg(px,py){
  const r=svg.getBoundingClientRect(), k=Math.min(r.width/v.w,r.height/v.h);
  const ox=(r.width-v.w*k)/2, oy=(r.height-v.h*k)/2;
  return {x:v.x+(px-r.left-ox)/k, y:v.y+(py-r.top-oy)/k, k};
}
function zoomAt(px,py,f){
  const s=scaleNow(), ns=Math.min(8,Math.max(1,s*f)); f=ns/s; if(f===1)return;
  const p=toSvg(px,py);
  v.x=p.x-(p.x-v.x)/f; v.y=p.y-(p.y-v.y)/f; v.w/=f; v.h/=f;
  clampView();applyView();
}
function zoomCenter(f){const r=svg.getBoundingClientRect();zoomAt(r.left+r.width/2,r.top+r.height/2,f);say('拡大率 '+scaleNow().toFixed(1)+'倍');}
function panBy(dx,dy){v.x+=dx*v.w;v.y+=dy*v.h;clampView();applyView();}
function panToElement(g){
  if(scaleNow()<=1.02)return;
  const r=g.getBoundingClientRect(), s=svg.getBoundingClientRect();
  if(r.left>=s.left+20&&r.right<=s.right-20&&r.top>=s.top+20&&r.bottom<=s.bottom-20)return;
  const p=toSvg((r.left+r.right)/2,(r.top+r.bottom)/2);
  v.x=p.x-v.w/2;v.y=p.y-v.h/2;clampView();applyView();
}
document.getElementById('zin').onclick=()=>zoomCenter(1.6);
document.getElementById('zout').onclick=()=>zoomCenter(1/1.6);
document.getElementById('zreset').onclick=()=>{resetZoom();say('拡大を元に戻しました');};
shell.addEventListener('keydown',e=>{
  if(e.target.closest&&e.target.closest('button'))return;
  const k=e.key;
  if(k==='+'||k==='='){e.preventDefault();zoomCenter(1.4);}
  else if(k==='-'){e.preventDefault();zoomCenter(1/1.4);}
  else if(k==='0'){e.preventDefault();resetZoom();}
  else if(e.target===shell&&k==='ArrowLeft'){e.preventDefault();scaleNow()>1.02?panBy(-.15,0):stepPage(-1);}
  else if(e.target===shell&&k==='ArrowRight'){e.preventDefault();scaleNow()>1.02?panBy(.15,0):stepPage(1);}
  else if(e.target===shell&&k==='ArrowUp'){e.preventDefault();panBy(0,-.15);}
  else if(e.target===shell&&k==='ArrowDown'){e.preventDefault();panBy(0,.15);}
});
const ptrs=new Map(); let startPt=null, pinch=null, swipeDone=false;
shell.addEventListener('pointerdown',e=>{
  if(e.target.closest('button'))return;
  ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===1){startPt={x:e.clientX,y:e.clientY};dragged=false;swipeDone=false;}
  if(ptrs.size===2){const [a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y),mx:(a.x+b.x)/2,my:(a.y+b.y)/2};dragged=true;}
});
shell.addEventListener('pointermove',e=>{
  if(!ptrs.has(e.pointerId))return;
  const prev=ptrs.get(e.pointerId);
  ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});
  if(ptrs.size===2&&pinch){
    const [a,b]=[...ptrs.values()];
    const d=Math.hypot(a.x-b.x,a.y-b.y), mx=(a.x+b.x)/2, my=(a.y+b.y)/2;
    zoomAt(mx,my,d/pinch.d);
    const k=toSvg(0,0).k;
    v.x-=(mx-pinch.mx)/k; v.y-=(my-pinch.my)/k; clampView();applyView();
    pinch={d,mx,my};return;
  }
  if(ptrs.size===1&&startPt){
    if(Math.hypot(e.clientX-startPt.x,e.clientY-startPt.y)>8)dragged=true;
    if(scaleNow()>1.02){
      const k=toSvg(0,0).k;
      const dx=e.clientX-prev.x, dy=e.clientY-prev.y, oy=v.y;
      v.x-=dx/k; v.y-=dy/k; clampView();applyView();
      if(Math.abs(dy)>=Math.abs(dx)&&Math.abs(v.y-oy)<1e-6)window.scrollBy(0,-dy);
    }
  }
});
function endPtr(e){
  if(e.type==='pointerup'&&ptrs.size===1&&startPt&&scaleNow()<=1.02&&!swipeDone){
    const dx=e.clientX-startPt.x, dy=e.clientY-startPt.y;
    if(Math.abs(dx)>70&&Math.abs(dy)<60){swipeDone=true;stepPage(dx<0?1:-1);}
  }
  ptrs.delete(e.pointerId);
  if(ptrs.size<2)pinch=null;
  if(ptrs.size===0){startPt=null;setTimeout(()=>{dragged=false;},0);}
}
shell.addEventListener('pointerup',endPtr);
shell.addEventListener('pointercancel',endPtr);
shell.addEventListener('wheel',e=>{
  if(e.ctrlKey||e.metaKey){e.preventDefault();zoomAt(e.clientX,e.clientY,e.deltaY<0?1.15:1/1.15);return;}
  if(scaleNow()>1.02){
    const k=toSvg(0,0).k, ox=v.x, oy=v.y;
    v.x+=e.deltaX/k; v.y+=e.deltaY/k; clampView();applyView();
    if(Math.abs(v.x-ox)>1e-6||Math.abs(v.y-oy)>1e-6)e.preventDefault();
  }
},{passive:false});
['gesturestart','gesturechange'].forEach(n=>shell.addEventListener(n,e=>e.preventDefault()));
let rsT;window.addEventListener('resize',()=>{clearTimeout(rsT);rsT=setTimeout(()=>{measureBoxes();setPage(curPage,true);},150);});

