/* Rompecraneos Roman, 18/11/2026: sleeping, painted startled expressions and a nose bubble.
   No interpolation between painted poses. Static armor stays from the base. */
function createRoman(stage){
 const W=512,H=512,scale=.65,box={x:2246,y:1300};
 function layer(id,w=W,h=H,x=box.x,y=box.y,dw=w*scale,dh=h*scale){const c=document.createElement('canvas');c.id=id;c.width=w;c.height=h;c.style.cssText=`left:${x/38.4}%;top:${y/21.6}%;width:${dw/38.4}%;height:${dh/21.6}%;pointer-events:none`;stage.append(c);return c}
 const shade=layer('roman-shadow',W+420,H+145),shadow=shade.getContext('2d');
 shade.style.mixBlendMode='multiply';
 const packShade=layer('roman-pack-shadow',600,470,2554,1421,246*600/384,246*470/384),packShadow=packShade.getContext('2d');
 packShade.style.mixBlendMode='multiply';
 const props=layer('roman-props',384,384,2554,1421,246,246),p=props.getContext('2d');
 const figure=layer('roman'),ctx=figure.getContext('2d');
 figure.setAttribute('aria-label','Rompecraneos Roman duerme agotado de entrenar. Una pompa en su nariz se rompe de vez en cuando y lo despierta.');
 const cel=document.createElement('canvas');cel.width=W;cel.height=H;const frame=cel.getContext('2d');
 const headArea=new Path2D('M246 9 L366 9 L383 112 L356 140 L352 209 L315 216 L297 166 L275 151 L268 199 L235 204 L230 156 L215 184 L185 192 L191 135 L221 84 L251 55 Z');
 let base,heads,bubbles,bag,lastKey='',lastTime=-1,seed=181126;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 const awakeFrames=[2,3,4,5,6,7,8,9,10,11,12,13,15,0];
 const awakeHolds=[.08,.10,.27,.28,.38,.25,.37,.34,.26,.26,.24,.22,.18,.18];
 const wakeDuration=awakeHolds.reduce((a,b)=>a+b,0),cycles=[];let at=0;
 for(let i=0;i<60;i++){const sleep=i===0?13:22+random()*12;cycles.push({start:at,sleep,breath:3.9+random()*.6});at+=sleep+wakeDuration}
 const period=at;
 function contact(x,y,rx,ry,opacity,angle=0){shadow.save();shadow.translate(x,y);shadow.rotate(angle);shadow.scale(rx,ry);const g=shadow.createRadialGradient(0,0,0,0,0,1);g.addColorStop(0,`rgba(40,25,17,${opacity})`);g.addColorStop(.45,`rgba(40,25,17,${opacity*.65})`);g.addColorStop(1,'rgba(40,25,17,0)');shadow.fillStyle=g;shadow.fillRect(-1,-1,2,2);shadow.restore()}
 function benchPolygon(points){points.forEach(([x,y],i)=>shadow[i?'lineTo':'moveTo']((2170+x-box.x)/scale,(1170+y-box.y)/scale));shadow.closePath()}
 function paintContact(){
  shadow.clearRect(0,0,shade.width,shade.height);
  const silhouette=document.createElement('canvas');silhouette.width=W;silhouette.height=H;
  const ink=silhouette.getContext('2d');ink.drawImage(base,0,0);
  ink.globalCompositeOperation='source-in';ink.fillStyle='#493628';ink.fillRect(0,0,W,H);
  // Project the painted body onto the actual wood. Clip to the backrest so
  // no dark halo spills onto the stone wall or the air around his head.
  shadow.save();shadow.beginPath();benchPolygon([[149,234],[454,249],[429,316],[142,291]]);shadow.clip();
  shadow.filter='blur(6px)';shadow.globalAlpha=.28;shadow.drawImage(silhouette,15,7);
  shadow.filter='blur(2px)';shadow.globalAlpha=.16;shadow.drawImage(silhouette,5,3);shadow.restore();
  shadow.save();shadow.beginPath();benchPolygon([[65,333],[218,329],[431,356],[425,398],[285,391],[64,357]]);shadow.clip();
  shadow.save();shadow.filter='blur(5px)';shadow.globalAlpha=.25;shadow.drawImage(silhouette,9,7);shadow.restore();
  contact(260,329,155,20,.28,.10);contact(179,328,50,8,.25,.10);contact(351,341,44,9,.24,.10);shadow.restore();
  // Short dwarf legs are relaxed; soft low shadows, no black shoe outlines.
  shadow.save();shadow.beginPath();shadow.rect(0,0,shade.width,shade.height);
  benchPolygon([[86,365],[141,368],[118,436],[73,439]]);benchPolygon([[146,369],[172,377],[212,429],[173,431]]);
  benchPolygon([[305,398],[363,400],[349,466],[313,480],[278,474],[286,438]]);benchPolygon([[371,399],[404,397],[425,461],[389,466],[360,427]]);shadow.clip('evenodd');
  contact(121,518,80,18,.18,.11);contact(290,539,72,17,.18,.14);shadow.restore();
 }
 function paintPackContact(){
  const S=384,pixels=p.getImageData(0,0,S,S).data,edge=new Int16Array(S);edge.fill(-1);
  for(let x=0;x<S;x++)for(let y=S-1;y>=S*.70;y--)if(pixels[(y*S+x)*4+3]>100){edge[x]=y;break}
  const cast=document.createElement('canvas');cast.width=600;cast.height=470;
  const castContext=cast.getContext('2d'),data=castContext.createImageData(600,470);
  // Project each column from its own painted base, which slopes in perspective.
  // This keeps both the pack and the sword tips attached to their shadows.
  for(let x=0;x<S;x++)if(edge[x]>=0)for(let y=0;y<=edge[x];y++){
   const alpha=pixels[(y*S+x)*4+3];if(alpha<7)continue;
   const height=edge[x]-y,dx=Math.round(x+height*.42),dy=Math.round(edge[x]+2+height*.10),at=(dy*600+dx)*4;
   data.data[at]=65;data.data[at+1]=47;data.data[at+2]=34;data.data[at+3]=Math.max(data.data[at+3],Math.round(alpha*.25));
  }
  castContext.putImageData(data,0,0);packShadow.clearRect(0,0,600,470);
  packShadow.save();packShadow.filter='blur(3px)';packShadow.drawImage(cast,0,0);packShadow.restore();
  const contour=new Path2D();let last=-1;
  for(let x=0;x<S;x++){
   const y=edge[x];if(y<0){last=-1;continue}
   if(last<0||Math.abs(y-last)>7)contour.moveTo(x,y+1);else contour.lineTo(x,y+1);last=y;
  }
  packShadow.save();packShadow.lineCap='round';packShadow.lineJoin='round';
  packShadow.filter='blur(2px)';packShadow.lineWidth=7;packShadow.strokeStyle='rgba(57,37,25,.28)';packShadow.stroke(contour);
  packShadow.filter='blur(.7px)';packShadow.lineWidth=2.2;packShadow.strokeStyle='rgba(43,29,21,.47)';packShadow.stroke(contour);packShadow.restore();
 }
 async function load(loadSprite){
  const images=[];for(const url of ['img/86e294220ca9f067.webp','img/2c046c9a62081e41.webp','img/5daca6ba44c7f565.webp','img/17817b777fd954eb.webp']){images.push(await loadSprite(url));await new Promise(r=>requestAnimationFrame(r))}
  [base,heads,bubbles,bag]=images;p.drawImage(bag,0,0,384,384);paintContact();paintPackContact();paint(0);
 }
 function pick(t){let i=0;while(i<awakeHolds.length-1&&t>=awakeHolds[i])t-=awakeHolds[i++];return awakeFrames[i]}
 const ease=n=>{const t=Math.max(0,Math.min(1,n));return t*t*(3-2*t)};
 function breathing(t,period){
  const phase=t/period%1,inhale=phase<.42,q=inhale?phase/.42:(phase-.42)/.58;
  return{phase,value:(1+(inhale?-1:1)*Math.cos(q*Math.PI))/2,velocity:(inhale?1:-1)*Math.sin(q*Math.PI)*Math.PI/(2*period*(inhale?.42:.58))};
 }
 function bubbleMotion(dt,cycle,wake,awakeTime){
  const swellAt=cycle.sleep-1.1,breath=breathing(dt,cycle.breath);
  let frame=6,size;
  if(wake){frame=awakeTime<.09?13:awakeTime<.18?14:awakeTime<.27?15:-1;size=75}
  else if(dt>=swellAt){
   const start=breathing(swellAt,cycle.breath),u=Math.min(1,(dt-swellAt)/1.1),u2=u*u,u3=u2*u;
   // One painted bubble throughout inflation, with matching position, size
   // and velocity at the transition. No sudden switch to the full-size cel.
   size=(2*u3-3*u2+1)*(24+36*start.value)+(u3-2*u2+u)*1.1*36*start.velocity+(-2*u3+3*u2)*75;
  }else size=(24+36*breath.value)*ease(dt/.65);
  return{frame,size:Math.max(0,size)};
 }
 function paint(seconds){
  if(!base||Math.abs(seconds-lastTime)<1/60)return;lastTime=seconds;
  const t=((seconds%period)+period)%period,cycle=cycles.find((c,i)=>t>=c.start&&t<(cycles[i+1]?.start??period))||cycles[0];
  const dt=t-cycle.start,wake=dt>=cycle.sleep,awakeTime=dt-cycle.sleep,head=wake?pick(awakeTime):0;
  const key=String(head);
  if(key!==lastKey){
   frame.clearRect(0,0,W,H);frame.drawImage(base,0,0);
   frame.save();frame.clip(headArea);frame.clearRect(120,0,352,260);frame.drawImage(heads,head%4*352,Math.floor(head/4)*260,352,260,120,0,352,260);frame.restore();lastKey=key;
  }
  const breathNow=breathing(dt,cycle.breath),phase=breathNow.phase;
  // A fuller inhale and a slower exhale, readable at the courtyard's scale.
  const breath=breathNow.value,atPop=breathing(cycle.sleep,cycle.breath).value;
  const settle=ease(awakeTime/.35),returnToSleep=1-ease((awakeTime-(wakeDuration-.5))/.5);
  const lift=wake?(atPop*9+(2.5-atPop*9)*settle+Math.sin(Math.min(1,awakeTime/.26)*Math.PI)*5)*returnToSleep:breath*9;
  const expansion=wake?1+atPop*.009*(1-settle):1+breath*.009;
  ctx.clearRect(0,0,W,H);ctx.save();ctx.translate(256,326);ctx.scale(expansion,1+lift/326);
  ctx.drawImage(cel,0,0,W,326,-256,-326,W,326);ctx.restore();
  ctx.clearRect(0,326,W,H-326);ctx.drawImage(cel,0,326,W,H-326,0,326,W,H-326);
  const bubble=bubbleMotion(dt,cycle,wake,awakeTime),bubbleFrame=bubble.frame,bubbleSize=bubble.size;
  // Detached burst fragments remain where the bubble popped while he jolts.
  const bubbleLift=wake?atPop*9:lift,bubbleExpansion=wake?1+atPop*.009:expansion;
  const x=256+(292-256)*bubbleExpansion,y=65-bubbleLift*(1-65/326);
  if(bubbleFrame>=0&&bubbleSize>0){
   const s=bubbleSize/96;
   ctx.save();ctx.translate(x,y);ctx.scale(-1,1);ctx.globalAlpha=.74;
   ctx.drawImage(bubbles,bubbleFrame%4*96,Math.floor(bubbleFrame/4)*96,96,96,-12*s,-85*s,bubbleSize,bubbleSize);ctx.restore();
  }
  figure.dataset.action=wake?'sobresalto':'dormido';figure.dataset.frame=String(head);figure.dataset.bubble=String(bubbleFrame);figure.dataset.bubbleSize=bubbleSize.toFixed(3);figure.dataset.bubbleX=x.toFixed(3);figure.dataset.bubbleY=y.toFixed(3);figure.dataset.time=t.toFixed(3);figure.dataset.breathPhase=phase.toFixed(4);figure.dataset.nextPop=(cycle.start+cycle.sleep-t).toFixed(2);
 }
 return {load,paint,place:{id:'roman',name:'Rompecraneos Roman',detail:'Enano guerrero de La Ganga',href:'../#/character/forever-eu-rompecraneos-roman',centre:[2412,1460],character:{guild:'La Ganga',level:35,race:'Enano',className:'Guerrero',classColor:'#c79c6e',spec:'Furia',faction:'Alianza',region:'EU',ruleset:'JcJ',appearanceDate:'2026-11-18',appearanceLabel:'18/11/2026'}}};
}
