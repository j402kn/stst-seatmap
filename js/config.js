const IMG={gold:'assets/team-gold.svg',silver:'assets/team-silver.svg'};
const C={
  line:'#d2d2d2', text:'#ffffff', gold:'#f5ce41',
  pFill:'#f5ce41', pStroke:'#ffffff', pLabel:'#3a0710',
  sFill:'#2e1a30', sStroke:'#d2d2d2', sLabel:'#ffffff',
  psFill:'#3a2466', psStroke:'#d2b4f5', psLabel:'#ffffff',
  addStroke:'#ffffff',
  wedgeFill:'rgba(255,255,255,0.05)', wedgeStroke:'#c98f98',
  doorFill:'#52101c', doorStroke:'#f5ce41',
  own:['#99ded6','#7fb2ff','#ff9ec4','#c9a6ff'], ownLabel:'#000000'
};
const OWN_NAME=['1枚','2枚','3枚','4枚以上'];
const PALETTES={
  std:{fills:[['#221d0b','#fff'],['#99ded6','#000'],['#7fb2ff','#000'],['#ff9ec4','#000'],['#c9a6ff','#000']],fw:1.3,big:false},
  cvd:{fills:[['#221d0b','#fff'],['#2b5d9a','#fff'],['#4f8fd0','#000'],['#8cbcf0','#000'],['#d6ebff','#000']],fw:1.3,big:false},
  hc:{fills:[['#000000','#fff'],['#5c5c5c','#fff'],['#9a9a9a','#000'],['#d0d0d0','#000'],['#ffffff','#000']],fw:2.4,big:true}
};
const PALKEY='stst202611_palette_v1';
let PAL='std';try{const pv=localStorage.getItem(PALKEY);if(pv&&PALETTES[pv])PAL=pv;}catch(e){}
function palFills(){return PALETTES[PAL].fills;}
const badgeQ=[];
function applyPalVars(){
  const root=document.documentElement.style;
  palFills().forEach((f,i)=>{root.setProperty('--pal'+i+'-bg',f[0]);root.setProperty('--pal'+i+'-fg',f[1]);});
}
applyPalVars();
