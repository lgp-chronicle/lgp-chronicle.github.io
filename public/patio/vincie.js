 // Local Vincie: painted polishing, glances and corrected boot placement.
function createVincie(stage){
 const W=384,H=544,scale=.70,box={x:2258,y:1282};
 function layer(id,w=W,h=H,x=box.x,y=box.y,dw=w*scale,dh=h*scale){const c=document.createElement('canvas');c.id=id;c.width=w;c.height=h;c.style.cssText=`left:${x/38.4}%;top:${y/21.6}%;width:${dw/38.4}%;height:${dh/21.6}%;pointer-events:none`;stage.append(c);return c;}
 const props=layer('vincie-backpack',180,220,2588,1499,124,152);
 props.setAttribute('aria-label','Mochila de pícaro apoyada junto al banco');
 const shadow=layer('vincie-shadow',W,H+48),figure=layer('vincie'),ctx=figure.getContext('2d'),shade=shadow.getContext('2d');
 figure.setAttribute('aria-label','Vincie Quickhands, humano pícaro, limpiando su hoja y mirando a su alrededor. Apariencia del 17 de noviembre de 2026.');
 const cel=document.createElement('canvas');cel.width=W;cel.height=H;const frame=cel.getContext('2d');
 // Only this swept arm/cloth area can change. The tabard and exposed belt
 // always come from the same base, avoiding repaint shimmer on the torso.
 const armArea=new Path2D('M270 181 L346 181 L351 280 L326 315 L293 318 L263 321 L250 331 L224 343 L174 344 L138 332 L133 293 L155 272 L183 261 L221 251 L248 233 L264 211 Z');
 let base,hands,eyes,head,lastKey='',lastTime=-1,seed=171126;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const wipe=[0,1,2,3,4,5,6,7,8,9,10,11,12,13],wipeHolds=[.08,.10,.12,.14,.16,.18,.18,.16,.16,.15,.14,.13,.12,.08],wipeDuration=wipeHolds.reduce((a,b)=>a+b,0);
 const segments=[];let at=0;
 for(let i=0;i<80;i++){
  const cycles=4+Math.floor(random()*3),pace=1+random()*.10,duration=cycles*wipeDuration*pace;
  segments.push({kind:'polish',start:at,duration,pace});at+=duration;
  const direction=i%2?'right':'left',offset=direction==='left'?0:8,holds=[.12,.14,.17,.20,.65+random()*.55,.18,.15,.20];
  const pause=holds.reduce((a,b)=>a+b,0);segments.push({kind:'look-'+direction,start:at,duration:pause,holds,offset});at+=pause;
 }
 const period=at,blinks=[];for(let t=2.6;t<period;t+=3.6+random()*3.5)blinks.push(t);
 function contact(x,y,rx,ry,opacity,angle=0){shade.save();shade.translate(x,y);shade.rotate(angle);shade.scale(rx,ry);const g=shade.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,`rgba(43,27,19,${opacity})`);g.addColorStop(.38,`rgba(43,27,19,${opacity*.72})`);g.addColorStop(1,'rgba(43,27,19,0)');shade.fillStyle=g;shade.fillRect(-1,-1,2,2);shade.restore();}
 function benchPolygon(points){
  points.forEach(([x,y],i)=>shade[i?'lineTo':'moveTo']((2170+x-box.x)/scale,(1170+y-box.y)/scale));shade.closePath();
 }
 function footprint(path,opacity,blur,dx=0,dy=0){
  shade.save();shade.translate(dx,dy);shade.filter=`blur(${blur}px)`;shade.fillStyle=`rgba(36,25,20,${opacity})`;shade.fill(new Path2D(path));shade.restore();
 }
 function paintContact(){
  shade.clearRect(0,0,W,H+48);
  // Seat shading belongs to the wooden seat, not to the air below it.
  shade.save();shade.beginPath();benchPolygon([[65,333],[218,329],[431,356],[425,398],[285,391],[64,357]]);shade.clip();
  contact(198,349,139,27,.24,.10);
  contact(103,346,39,7,.40,.10);contact(267,358,35,7,.42,.10);shade.restore();
  // Mask the physical bench supports out of shadows that lie on the dirt.
  shade.save();shade.beginPath();shade.rect(0,0,W,H+48);
  benchPolygon([[86,365],[141,368],[118,436],[73,439]]);
  benchPolygon([[146,369],[172,377],[212,429],[173,431]]);
  benchPolygon([[305,398],[363,400],[349,466],[313,480],[278,474],[286,438]]);
  benchPolygon([[371,399],[404,397],[425,461],[389,466],[360,427]]);
  shade.clip('evenodd');
  // Unequal, tapered cast shadows follow the two planted feet. The nearer
  // right toe now sits in front of the bench, with visible dirt between them.
  footprint('M53 512 Q78 508 120 497 Q147 506 195 529 Q202 537 178 538 Q121 535 75 527 Q55 524 53 512Z',.16,5);
  footprint('M184 523 Q216 510 250 500 Q285 517 326 540 Q333 549 308 549 Q252 544 207 539 Q185 537 184 523Z',.15,5);
  const left='M50 511 Q49 520 62 523 Q83 528 106 515 L127 502 Q128 497 121 496 L82 505Z';
  const right='M183 523 Q183 532 199 535 Q218 539 237 525 L255 508 Q256 503 250 501 L210 515Z';
  footprint(left,.18,3,1,2);footprint(right,.18,3,1,2);
  footprint(left,.48,.85,0,1);footprint(right,.48,.85,0,1);
  shade.restore();
 }
 async function load(loadSprite){
  const loaded=[];for(const url of ["img/a0082e069f731bec.webp","img/b63475cde1880abd.webp","img/5f4b417c8b6a9761.webp","img/734237f5ef7e908f.webp","img/430744418b171067.webp"]){loaded.push(await loadSprite(url));await new Promise(r=>requestAnimationFrame(r));}
  [base,hands,eyes,head]=loaded;const bag=loaded[4],p=props.getContext('2d'),h=212,w=h*bag.width/bag.height;p.drawImage(bag,(180-w)/2,220-h,w,h);
  paintContact();paint(0);
 }
 function pick(holds,dt){let index=0;while(index<holds.length-1&&dt>=holds[index])dt-=holds[index++];return index;}
 function paint(seconds){
  if(!base)return;const t=((seconds%period)+period)%period;if(Math.abs(t-lastTime)<1/60)return;lastTime=t;
  const segment=segments.find(s=>t>=s.start&&t<s.start+s.duration)||segments[0],dt=t-segment.start;let hand=0,headIndex=0,eye=0;
  if(segment.kind==='polish'){
   hand=wipe[pick(wipeHolds,(dt/segment.pace)%wipeDuration)];eye=(Math.floor(t/2.8)%3===1)?1:0;
   const blink=blinks.find(b=>t>=b&&t<b+.24);if(blink!==undefined){const phase=t-blink;eye=phase<.055||phase>.17?3:2;}
  }else headIndex=segment.offset+pick(segment.holds,dt);
  const key=hand+':'+eye+':'+headIndex;
  if(key!==lastKey){
   frame.clearRect(0,0,W,H);frame.drawImage(base,0,0);
   // Replace the entire painted arm, including the transparent space left
   // behind when it moves. Overlaying only the wrist retained the old elbow.
   if(hand){frame.save();frame.clip(armArea);frame.clearRect(120,172,236,188);frame.drawImage(hands,hand%4*236,Math.floor(hand/4)*188,236,188,120,172,236,188);frame.restore();}
   if(![0,7,8,15].includes(headIndex)){frame.clearRect(120,0,140,178);frame.drawImage(head,headIndex%4*140,Math.floor(headIndex/4)*178,140,178,120,0,140,178);}
   else if(eye)frame.drawImage(eyes,eye*52,0,52,24,150,77,52,24);lastKey=key;
  }
  const lift=(Math.sin(seconds*Math.PI*2/4.6)+1)*1.15,anchor=335;
  ctx.clearRect(0,0,W,H);ctx.drawImage(cel,0,0,W,anchor,0,-lift,W,anchor+lift);ctx.drawImage(cel,0,anchor,W,H-anchor,0,anchor,W,H-anchor);
  figure.dataset.action=segment.kind;figure.dataset.frame=String(hand);figure.dataset.head=String(headIndex);figure.dataset.eyes=String(eye);figure.dataset.time=t.toFixed(3);
 }
 return {load,paint,place:{"id":"vincie","name":"Vincie Quickhands","detail":"Humano pícaro de La Ganga","href":"../#/character/forever-eu-vincie-quickhands","centre":[2392,1465],"character":{"guild":"La Ganga","level":38,"race":"Humano","className":"Pícaro","classColor":"#fff569","spec":"Combate","faction":"Alianza","region":"EU","ruleset":"JcJ","appearanceDate":"2026-11-17","appearanceLabel":"17/11/2026"}}};
}
