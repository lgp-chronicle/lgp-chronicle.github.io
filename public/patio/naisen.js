// Approved appearance, 17/11/2026. Quiet reading, independent eyes, corrected two-arm gesture.
// Reuses the courtyard clock, pause and FPS cap; no separate animation loop.
function createNaisen(stage){
  const W=320,H=360,scale=.74,box={x:2220,y:1352,w:W*scale,h:H*scale};
  function canvas(id,w,h,x,y,displayW,displayH){
    const el=document.createElement('canvas');el.id=id;el.width=w;el.height=h;
    el.style.cssText=`left:${x/38.4}%;top:${y/21.6}%;width:${displayW/38.4}%;height:${displayH/21.6}%;pointer-events:none`;
    stage.append(el);return el;
  }
  // Staff shaft meets the right end of the backrest; its lower crystal rests
  // on the dirt. Its support is the bench, independent of the smaller pack.
  const props=canvas('naisen-equipo',220,350,2470,1305,220,350);
  props.setAttribute('aria-label','Mochila de brujo y Espinazo del Devorador apoyados junto al banco');
  const shadow=canvas('naisen-shadow',W,H+80,box.x,box.y,box.w,(H+80)*scale);
  const figure=canvas('naisen',W,H,box.x,box.y,box.w,box.h);
  figure.setAttribute('aria-label','Naisen Grandwell, gnomo brujo, leyendo un grimorio');
  const ctx=figure.getContext('2d'),shade=shadow.getContext('2d');
  const cel=document.createElement('canvas');cel.width=W;cel.height=H;const frame=cel.getContext('2d');
  let pages,spell,idle,eyes,lastKey='',lastTime=-1;
  let seed=1647;
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const all=Array.from({length:16},(_,i)=>i);
  const motions={
    page:{cells:all,holds:[.14,.09,.09,.10,.10,.11,.12,.13,.13,.12,.11,.11,.10,.10,.11,.16]},
    spell:{cells:all,holds:[.16,.10,.11,.11,.13,.14,.20,.36,.36,.20,.14,.12,.12,.12,.10,.16]},
    glance:{cells:all,holds:[.12,.11,.12,.13,.14,.16,.20,.34,.18,.12,.075,.10,.13,.12,.10,.12]}
  };
  const actions=[];let at=8;
  // Most of the time he reads with a still head. Eye movement and breathing
  // continue through these long pauses, independently of large gestures.
  const pattern=['page','glance','page','spell','page','glance'];
  for(let i=0;i<60;i++){
    const kind=pattern[i%pattern.length],motion=motions[kind],pace=kind==='glance'?1+random()*.2:1;
    const holds=motion.holds.map(n=>n*pace),duration=holds.reduce((a,b)=>a+b,0);
    actions.push({kind,start:at,holds,cells:motion.cells,duration});
    at+=duration+8+random()*4;
  }
  // Across the schedule boundary: 2 seconds here + 8 before the first
  // action gives a 10-second rest, also within the requested 8–12 range.
  const lastAction=actions[actions.length-1];
  const period=lastAction.start+lastAction.duration+2,blinks=[];let nextBlink=2.4;
  while(nextBlink<period){blinks.push(nextBlink);nextBlink+=3.5+random()*3.5}
  const gazes=[];let gazeTime=0,gazeStep=0;
  const gazeOrder=[0,3,0,1,0,3,1,0];
  while(gazeTime<period){gazes.push({start:gazeTime,cel:gazeOrder[gazeStep++%gazeOrder.length]});gazeTime+=2.2+random()*2.2}
  function contact(x,y,rx,ry,opacity){
    shade.save();shade.translate(x,y);shade.scale(rx,ry);const g=shade.createRadialGradient(0,0,0,0,0,1);
    g.addColorStop(0,`rgba(39,20,13,${opacity})`);g.addColorStop(.45,`rgba(39,20,13,${opacity*.65})`);g.addColorStop(1,'rgba(39,20,13,0)');
    shade.fillStyle=g;shade.fillRect(-1,-1,2,2);shade.restore();
  }
  async function load(loadSprite){
    const sources=["img/3ed153d11f3a114a.webp","img/bfce3d74596b2bf6.webp","img/e1b535ed474f468c.webp","img/c704aa7518a9e0fd.webp","img/44c93169c5a53a02.webp"];
    const loaded=[];
    for(const url of sources){loaded.push(await loadSprite(url));await new Promise(resolve=>requestAnimationFrame(resolve))}
    [pages,spell,eyes,idle]=loaded;
    contact(186,233,65,11,.48);contact(218,228,25,7,.3);contact(142,405,61,8,.18);
    const prop=loaded[4],p=props.getContext('2d'),h=340,w=h*prop.width/prop.height;
    // A short warm contact shadow only where the shaft rests on the wooden
    // backrest. The upper shaft casts no arbitrary outline on the scenery.
    p.save();p.strokeStyle='rgba(48,25,16,.26)';p.lineWidth=3.5;
    p.shadowColor='rgba(48,25,16,.5)';p.shadowBlur=4;p.lineCap='round';
    p.beginPath();p.moveTo(115,111);p.lineTo(83,174);p.stroke();p.restore();
    // Painted contact shadow comes with the prop. Draw this static layer once.
    p.drawImage(prop,0,350-h,w,h);paint(0);
  }
  function sprite(sheet,index){
    if(sheet===idle){
      // Idle atlas stores just the changing head/shoulders, saving ~4 MB
      // of decoded image memory and keeping the book and hands identical.
      frame.drawImage(pages,0,0,W,H,0,0,W,H);
      frame.clearRect(0,0,W,160);
      frame.drawImage(idle,(index%4)*W,Math.floor(index/4)*160,W,160,0,0,W,160);
    }else frame.drawImage(sheet,(index%4)*W,Math.floor(index/4)*H,W,H,0,0,W,H);
  }
  function paint(seconds){
    if(!pages)return;
    const t=((seconds%period)+period)%period;
    if(Math.abs(t-lastTime)<1/48)return;lastTime=t;
    const action=actions.find(a=>t>=a.start&&t<a.start+a.duration);
    let index=0,sheet=pages,kind='reading';
    if(action){
      kind=action.kind;sheet=kind==='page'?pages:kind==='spell'?spell:idle;
      let dt=t-action.start,step=0;
      while(step<action.cells.length-1&&dt>=action.holds[step]){dt-=action.holds[step];step++}
      index=action.cells[step];
    }
    const blink=!action&&blinks.some(start=>t>=start&&t<start+.125);
    // Change only the painted eyes, never the full head during quiet reading.
    let eyeCel=0;
    if(!action){for(const gaze of gazes){if(gaze.start>t)break;eyeCel=gaze.cel}if(blink)eyeCel=2}
    const key=kind+':'+index+':'+eyeCel;
    if(key!==lastKey){
      frame.clearRect(0,0,W,H);sprite(sheet,index);
      if(!action&&eyeCel)frame.drawImage(eyes,eyeCel*64,0,64,32,137,91,64,32);
      lastKey=key;
    }
    const breath=(1.45-1.45*Math.cos(t*2*Math.PI/4.2))*(.9+.1*Math.sin(t*.39));
    ctx.clearRect(0,0,W,H);
    // About one display pixel of breathing at 1080p. Hips and boots stay fixed.
    ctx.drawImage(cel,0,0,W,232,0,-breath,W,232+breath);
    ctx.drawImage(cel,0,232,W,H-232,0,232,W,H-232);
    figure.dataset.action=kind;figure.dataset.frame=String(index);figure.dataset.eyes=String(eyeCel);figure.dataset.time=t.toFixed(3);
  }
  return {load,paint,place:{"id":"naisen","name":"Naisen Grandwell","detail":"Gnomo brujo de La Ganga","href":"../#/character/forever-eu-naisen-grandwell","centre":[2338,1485],"character":{"guild":"La Ganga","level":34,"race":"Gnomo","className":"Brujo","classColor":"#9482c9","spec":"Demonología","faction":"Alianza","region":"EU","ruleset":"JcJ","appearanceDate":"2026-11-17","appearanceLabel":"17/11/2026"}}};
}
