(function(){
  requestAnimationFrame(()=>document.body.classList.add('pc-intro-ready'));

  const paint=document.getElementById('pc-scroll-paint');
  const skyline=document.getElementById('pc-scroll-skyline');
  const person=document.getElementById('pc-scroll-person');
  const handle=document.getElementById('pc-scroll-handle');
  const personGap=document.getElementById('pc-scroll-person-gap');
  const rail=document.getElementById('pc-scroll-rail');
  const logoEls={
    atlassian:document.getElementById('logo-atlassian'),
    loom:document.getElementById('logo-loom'),
    alaska:document.getElementById('logo-alaska'),
    alaska2:document.getElementById('logo-alaska2'),
    samsung:document.getElementById('logo-samsung')
  };
  if(!paint||!skyline||!person||!handle||!rail) return;

  document.querySelectorAll('#logo-templates [data-logo]').forEach(t=>{
    const key=t.dataset.logo;
    // alaska template fills both alaska and alaska2
    if(key==='alaska'){
      [logoEls.alaska,logoEls.alaska2].forEach(el=>{
        if(!el) return;
        el.innerHTML=t.innerHTML;el.style.width=t.dataset.w+'px';el.style.height=t.dataset.h+'px';
      });
    } else {
      const el=logoEls[key];if(!el)return;
      el.innerHTML=t.innerHTML;el.style.width=t.dataset.w+'px';el.style.height=t.dataset.h+'px';
    }
  });

  const BASE_RAIL_WIDTH=200;
  const SKY_H_BASE=158;
  const HANDLE_H_BASE=219; // viewBox height of handle SVG
  const GAP_BASE=8;
  const PERSON_H_BASE=108;
  const INITIAL_PAINT_H_BASE=179;
  const GROWTH_RATE=0.35;
  const LOGO_PAGE_OFFSET=140;
  const LOGO_CLEARANCE=140;
  const LOGO_MIN_SCREEN_Y=-180;
  const TILE_REVEAL_OFFSET=140;
  const TILE_REVEAL_RANGE=220;

  const states=[
    {id:'pc-hero',type:'hero',color:'#f9de8e',logo:null},
    {id:'pc-row-1',type:'row',color:'#615DED',logo:'atlassian'},
    {id:'pc-row-2',type:'row',color:'#615DED',logo:'loom'},
    {id:'pc-row-3',type:'row',color:'#1A9CE2',logo:'alaska'},
    {id:'pc-row-4',type:'row',color:'#1A9CE2',logo:'alaska2'},
    {id:'pc-row-5',type:'row',color:'#1a4080',logo:'samsung'},
  ];
  const secs=states.map(s=>({...s,el:document.getElementById(s.id)})).filter(s=>s.el);
  const rowVisuals=secs
    .filter(s=>s.type==='row')
    .map(s=>({section:s,card:s.el.querySelector('.pc-card')}))
    .filter(v=>v.card);
  let raf=false;

  function clamp(n,a,b){return Math.max(a,Math.min(b,n))}
  function getActive(){
    const vh=window.innerHeight,sy=window.scrollY||0;
    let a=secs[0];for(const s of secs){if(sy>=s.el.offsetTop-vh*.35)a=s;else break;}return a;
  }
  function secAtY(y){
    for(let i=secs.length-1;i>=0;i--){if(y>=secs[i].el.getBoundingClientRect().top)return secs[i];}
    return secs[0];
  }

  function getDesktopGeometry(vh,metrics){
    const stackH=metrics.skyH+metrics.gap+metrics.initialPaintH+metrics.gap+metrics.handleH;
    const skyTop=clamp(Math.round((vh-stackH)*0.5),96,220);
    const skyBottom=skyTop+metrics.skyH;
    const paintTop=skyBottom+metrics.gap;
    const personPageTop=paintTop+metrics.initialPaintH-metrics.personH;
    return {skyTop,paintTop,personPageTop};
  }

  const miniPaint=document.getElementById('pc-mini-paint');
  const miniHandle=document.getElementById('pc-mini-handle');
  const miniSkyline=document.getElementById('pc-mini-skyline');
  const hero=document.getElementById('pc-hero');
  const heroContent=document.querySelector('.pc-hero-content');
  const isMobile=()=>window.innerWidth<=991;

  const MINI_SKY_PAGE_TOP=60;
  const MINI_SKY_RATIO=158/200;
  const MINI_GAP=4;

  function buildGradient(paintTopPos, paintH, active){
    var TRANSITION_GAP=8;
    var segs=[];
    for(var i=0;i<secs.length;i++){
      var s=secs[i];
      var r=s.el.getBoundingClientRect();
      var start=clamp(Math.round(r.top-paintTopPos),0,paintH);
      var end=clamp(Math.round(r.bottom-paintTopPos),0,paintH);
      if(end>start)segs.push({start:start,end:end,color:s.color});
    }
    segs.sort(function(a,b){return a.start-b.start});
    if(!segs.length) return {bg:active.color, img:'none'};
    var stops=[];
    var cursor=0;
    for(var j=0;j<segs.length;j++){
      var seg=segs[j];
      if(seg.start>cursor){
        stops.push('transparent '+cursor+'px');
        stops.push('transparent '+seg.start+'px');
      }
      var segStart=seg.start;
      var segEnd=seg.end;
      if(j<segs.length-1){
        segEnd=Math.max(segStart, segEnd-TRANSITION_GAP);
      }
      if(segEnd>segStart){
        stops.push(seg.color+' '+segStart+'px');
        stops.push(seg.color+' '+segEnd+'px');
      }
      cursor=seg.end;
      if(j<segs.length-1){
        var gapStart=Math.max(seg.start, seg.end-TRANSITION_GAP);
        var gapEnd=Math.min(paintH, seg.end);
        if(gapEnd>gapStart){
          stops.push('transparent '+gapStart+'px');
          stops.push('transparent '+gapEnd+'px');
        }
      }
    }
    if(cursor<paintH){
      stops.push('transparent '+cursor+'px');
      stops.push('transparent '+paintH+'px');
    }
    return {bg:'transparent', img:'linear-gradient(to bottom, '+stops.join(', ')+')'};
  }

  function updateMobile(){
    if(!miniPaint||!miniHandle||!hero||!heroContent) return;
    const vh=window.innerHeight;
    const sy=window.scrollY||0;
    const active=getActive();
    const railWidth=miniPaint.offsetWidth||54;
    const miniSkyH=railWidth*MINI_SKY_RATIO;
    const heroRect=hero.getBoundingClientRect();
    const contentRect=heroContent.getBoundingClientRect();
    const heroAnchor=Math.max(36, contentRect.bottom+10);
    const skyScreenTop=heroAnchor;
    const skyScreenBottom=skyScreenTop+miniSkyH;
    const fadeOut=clamp((heroRect.bottom-vh*0.44)/(vh*0.38),0,1);
    const extend=clamp((vh-heroRect.top)/(heroRect.height*0.75),0,1);
    if(miniSkyline){
      miniSkyline.style.top=skyScreenTop+'px';
      miniSkyline.style.height=miniSkyH+'px';
      miniSkyline.style.opacity=(skyScreenTop+miniSkyH>0?fadeOut:0)+'';
    }
    const miniPaintTop=Math.max(0, skyScreenBottom+MINI_GAP);
    const miniInitBottom=miniPaintTop+railWidth*0.58;
    const miniMaxBottom=miniPaintTop+railWidth*1.85;
    const miniPaintBottom=miniInitBottom+(miniMaxBottom-miniInitBottom)*extend*fadeOut;
    const miniPaintH=Math.max(0, miniPaintBottom-miniPaintTop);
    const miniHandleTop=miniPaintBottom+MINI_GAP;
    miniPaint.style.top=miniPaintTop+'px';
    miniPaint.style.height=miniPaintH+'px';
    miniPaint.style.opacity=fadeOut+'';
    miniHandle.style.top=miniHandleTop+'px';
    miniHandle.style.opacity=fadeOut+'';
    const hSec=secAtY(miniHandleTop);
    miniHandle.querySelectorAll('.mini-handle-color').forEach(el=>el.setAttribute('fill',hSec.color));
    const g=buildGradient(miniPaintTop, miniPaintH, active);
    miniPaint.style.backgroundColor=g.bg;
    miniPaint.style.backgroundImage=g.img;
    for(const v of rowVisuals){
      v.card.style.opacity='1';
      v.card.style.transform='translateX(0)';
    }
  }

  function update(){
    raf=false;
    if(isMobile()){updateMobile();return;}
    const vh=window.innerHeight;
    const sy=window.scrollY||0;
    const active=getActive();
    const railWidth=rail.getBoundingClientRect().width || BASE_RAIL_WIDTH;
    const desktopScale=railWidth/BASE_RAIL_WIDTH;
    const metrics={
      skyH:SKY_H_BASE*desktopScale,
      handleH:HANDLE_H_BASE*desktopScale,
      gap:GAP_BASE*desktopScale,
      personH:PERSON_H_BASE*desktopScale,
      initialPaintH:INITIAL_PAINT_H_BASE*desktopScale
    };
    const desktopGeo=getDesktopGeometry(vh,metrics);
    const maxPaintBottom=vh*0.85;
    const initialPaintBottom=desktopGeo.paintTop+metrics.initialPaintH;
    const paintBottom=clamp(initialPaintBottom+sy*GROWTH_RATE, initialPaintBottom, Math.max(initialPaintBottom,maxPaintBottom));
    const skylineScreenBottom=(desktopGeo.skyTop-sy)+metrics.skyH;
    const paintTop=Math.max(0, skylineScreenBottom+metrics.gap);
    const paintH=Math.max(0, paintBottom-paintTop);
    const handleTop=paintBottom+metrics.gap;
    const handleTopClamped=Math.min(handleTop, vh-metrics.handleH-8);
    const paintBottomClamped=Math.min(paintBottom, handleTopClamped-metrics.gap);
    const paintHClamped=Math.max(0, paintBottomClamped-paintTop);
    paint.style.top=paintTop+'px';
    paint.style.height=paintHClamped+'px';
    handle.style.top=handleTopClamped+'px';
    skyline.style.top=(desktopGeo.skyTop-sy)+'px';
    skyline.style.opacity=(desktopGeo.skyTop-sy+metrics.skyH>0)?'1':'0';
    person.style.top=(desktopGeo.personPageTop-sy)+'px';
    person.style.opacity=(desktopGeo.personPageTop+metrics.personH-sy>0)?'1':'0';
    if(personGap){
      personGap.style.top=(desktopGeo.personPageTop+metrics.personH-sy)+'px';
      personGap.style.opacity=person.style.opacity;
    }
    const hSec=secAtY(handleTopClamped);
    handle.querySelectorAll('.handle-color').forEach(el=>el.setAttribute('fill',hSec.color));
    for(const s of secs){
      if(!s.logo) continue;
      const el=logoEls[s.logo];
      if(!el) continue;
      const logoPageY=s.el.offsetTop+LOGO_PAGE_OFFSET;
      const logoScreenY=logoPageY-sy;
      el.style.top=logoScreenY+'px';
      el.style.opacity=(paintBottom>logoScreenY+LOGO_CLEARANCE && logoScreenY>LOGO_MIN_SCREEN_Y)?'1':'0';
    }
    for(const v of rowVisuals){
      const logoPageY=v.section.el.offsetTop+LOGO_PAGE_OFFSET;
      const logoScreenY=logoPageY-sy;
      let reveal=clamp((paintBottom-(logoScreenY+TILE_REVEAL_OFFSET))/TILE_REVEAL_RANGE,0,1);
      if(sy<=1){
        reveal=0;
      }
      v.card.style.opacity=String(reveal);
      v.card.style.transform='translateX(' + ((1-reveal)*-34).toFixed(2) + 'px)';
    }
    const g=buildGradient(paintTop, paintHClamped, active);
    paint.style.backgroundColor=g.bg;
    paint.style.backgroundImage=g.img;
  }

  function req(){if(!raf){raf=true;requestAnimationFrame(update);}}
  window.addEventListener('scroll',req,{passive:true});
  window.addEventListener('resize',req);
  req();
})();
