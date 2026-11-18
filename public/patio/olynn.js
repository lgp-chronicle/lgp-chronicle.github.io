/* Olynn Grandwell, approved 18/11/2026. Painted supported tackle, physical contact/cast shadows and a readable head gesture. */
function createOlynn(stage){
 const W=580,H=590,box={x:2170,y:1170};
 function layer(id,w=W,h=H,x=box.x,y=box.y,dw=w,dh=h){const c=document.createElement('canvas');c.id=id;c.width=w;c.height=h;c.style.cssText=`left:${x/38.4}%;top:${y/21.6}%;width:${dw/38.4}%;height:${dh/21.6}%;pointer-events:none`;stage.append(c);return c;}
 const shade=layer('olynn-shadow',800,720),shadow=shade.getContext('2d');shade.style.mixBlendMode='multiply';
 const props=layer('olynn-props',300,460,2500,1210,300,460),p=props.getContext('2d');
 const figure=layer('olynn'),ctx=figure.getContext('2d');
 figure.setAttribute('aria-label','Olynn Grandwell, sentado siguiendo la perspectiva del banco, prepara el cebo de pesca.');
 function buffer(){const c=document.createElement('canvas');c.width=W;c.height=H;return c;}
 const cel=buffer(),frame=cel.getContext('2d'),headCel=buffer(),headInk=headCel.getContext('2d'),composite=buffer(),final=composite.getContext('2d');
 // Warm shadow-facing light, prepared once. No global color/lighting changes between poses.
 const lightMask=buffer(),light=lightMask.getContext('2d');
 const sideLight=light.createLinearGradient(140,0,405,0);sideLight.addColorStop(0,'rgba(65,36,26,0)');sideLight.addColorStop(.42,'rgba(65,36,26,.025)');sideLight.addColorStop(1,'rgba(65,36,26,.19)');light.fillStyle=sideLight;light.fillRect(0,0,W,H);
 const lowerLight=light.createLinearGradient(0,370,0,550);lowerLight.addColorStop(0,'rgba(62,34,25,0)');lowerLight.addColorStop(1,'rgba(62,34,25,.10)');light.fillStyle=lowerLight;light.fillRect(0,370,W,220);
 const handsArea=new Path2D('M192 281 Q201 278 215 287 L234 301 L241 310 Q260 302 285 300 L290 322 Q276 339 248 341 L231 332 L226 316 Q213 325 196 313 Q186 301 192 281Z');
 const headArea=new Path2D('M197 91 L325 91 L325 127 L298 149 L283 175 L278 195 L265 207 L247 207 L236 195 L228 180 L219 161 L210 143 L196 129Z');
 let base,hands,eyelids,bag,lastKey='',lastTime=-1,seed=181140;
 const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const handOrder=[0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15],handHolds=[.20,.20,.21,.24,.25,.23,.22,.28,.34,.28,.22,.24,.23,.21,.20,.20],handDuration=handHolds.reduce((a,b)=>a+b,0);
 const segments=[];let at=0;
 for(let i=0;i<80;i++){
  const pace=.76+random()*.25,duration=(i===0?1:3)*handDuration*pace;segments.push({start:at,duration,kind:'cebo',pace});at+=duration;
  const pause=3.2+random()*.6;segments.push({start:at,duration:pause,kind:'revisar-cana',direction:i%2?-.72:1});at+=pause;
 }
 const period=at,blinks=[];for(let t=2.8;t<period;t+=3.3+random()*3.2)blinks.push(t);
 function groundContact(image,w,h,g,cut){
  const sample=document.createElement('canvas');sample.width=w;sample.height=h;const s=sample.getContext('2d');s.drawImage(image,0,0,w,h);const rgba=s.getImageData(0,0,w,h).data,edge=new Int16Array(w);edge.fill(-1);
  for(let x=0;x<w;x++)for(let y=h-1;y>=cut;y--)if(rgba[(y*w+x)*4+3]>110){edge[x]=y;break;}
  const data=g.createImageData(g.canvas.width,g.canvas.height),cw=g.canvas.width;
  for(let x=0;x<w;x++)if(edge[x]>=0)for(let y=cut;y<=edge[x];y++){
   const alpha=rgba[(y*w+x)*4+3],height=edge[x]-y,dx=Math.round(x+height*.45),dy=Math.round(edge[x]+2+height*.11);if(alpha<12||dx>=cw||dy>=g.canvas.height)continue;
   const j=(dy*cw+dx)*4;data.data[j]=62;data.data[j+1]=44;data.data[j+2]=31;data.data[j+3]=Math.max(data.data[j+3],Math.round(alpha*.20));
  }
  const cast=document.createElement('canvas');cast.width=cw;cast.height=g.canvas.height;cast.getContext('2d').putImageData(data,0,0);g.save();g.filter='blur(3px)';g.drawImage(cast,0,0);g.restore();
  const line=new Path2D();let prev=-1;for(let x=0;x<w;x++){const y=edge[x];if(y<0){prev=-1;continue;}if(prev<0||Math.abs(y-prev)>8)line.moveTo(x,y+1);else line.lineTo(x,y+1);prev=y;}
  g.save();g.lineCap='round';g.lineJoin='round';g.filter='blur(2px)';g.lineWidth=6;g.strokeStyle='rgba(49,32,22,.25)';g.stroke(line);g.filter='blur(.7px)';g.lineWidth=2;g.strokeStyle='rgba(41,27,19,.42)';g.stroke(line);g.restore();
 }
 function paintContact(){
  shadow.clearRect(0,0,800,720);
  const silhouette=buffer(),ink=silhouette.getContext('2d');ink.drawImage(base,0,0);ink.globalCompositeOperation='source-in';ink.fillStyle='#463126';ink.fillRect(0,0,W,H);
  for(const points of [[[149,234],[454,249],[429,316],[142,291]],[[65,333],[218,329],[431,356],[425,398],[285,391],[64,357]]]){
   shadow.save();shadow.beginPath();points.forEach(([x,y],i)=>shadow[i?'lineTo':'moveTo'](x,y));shadow.closePath();shadow.clip();
   shadow.filter='blur(8px)';shadow.globalAlpha=.24;shadow.drawImage(silhouette,25,8);
   shadow.filter='blur(3px)';shadow.globalAlpha=.24;shadow.drawImage(silhouette,9,3);shadow.restore();
  }
  // Occlusion follows the seat under the robe and the bench feet, not a halo around the sitter.
  const seam=new Path2D('M150 340 Q195 356 242 366 Q307 376 351 351');
  shadow.save();shadow.lineCap='round';shadow.strokeStyle='rgba(52,29,19,.44)';shadow.lineWidth=11;shadow.filter='blur(3px)';shadow.stroke(seam);shadow.restore();
  const under=new Path2D('M128 452 Q179 465 230 464 L318 467 Q375 452 419 460 L470 481 Q398 506 314 504 Q213 507 141 486Z');
  shadow.save();shadow.filter='blur(9px)';shadow.fillStyle='rgba(66,38,26,.19)';shadow.fill(under);shadow.restore();
  // Project the actual painted silhouette away from the light onto the ground plane.
  const cast=document.createElement('canvas');cast.width=800;cast.height=720;const g=cast.getContext('2d');
  g.save();g.setTransform(1,-.075,-.43,.13,.43*540,540-.13*540);g.drawImage(silhouette,0,0);g.restore();
  const floor=new Path2D('M40 475 L151 470 L260 479 L350 478 L414 467 L490 458 L740 433 L740 630 L40 630Z');
  shadow.save();shadow.clip(floor);shadow.filter='blur(7px)';shadow.globalAlpha=.21;shadow.drawImage(cast,0,0);shadow.restore();
  groundContact(base,W,H,shadow,460);
  // Small contact cores under each boot retain the earth texture via multiply.
  for(const [x,y,rx,ry,a] of [[118,493,39,6,-.22],[216,533,36,6,-.18]]){
   shadow.save();shadow.translate(x,y);shadow.rotate(a);shadow.filter='blur(3px)';shadow.fillStyle='rgba(49,28,18,.30)';shadow.beginPath();shadow.ellipse(0,0,rx,ry,0,0,Math.PI*2);shadow.fill();shadow.restore();
  }
 }
 async function load(loadSprite){
  const images=[];for(const url of ['img/4ca9ae762ac8040e.webp','img/ece4380212093306.webp','img/a52931c7021d228b.webp','img/b0ecbcb1acddeb5e.webp']){images.push(await loadSprite(url));await new Promise(r=>requestAnimationFrame(r));}
  [base,hands,eyelids,bag]=images;
  p.clearRect(0,0,300,460);p.drawImage(bag,0,0,300,460);
  // User chose a continuous rod in front of the bench. Do not mask the wood crossing.
  paintContact();paint(0);
 }
 function pick(holds,t){let i=0;while(i<holds.length-1&&t>=holds[i])t-=holds[i++];return i;}
 const ease=t=>t*t*(3-2*t);
 function paint(seconds){
  if(!base||Math.abs(seconds-lastTime)<1/60)return;lastTime=seconds;
  const t=((seconds%period)+period)%period,segment=segments.find(s=>t>=s.start&&t<s.start+s.duration)||segments[0],dt=t-segment.start;
  let hand=0,blink=-1,gesture=0;
  if(segment.kind==='cebo')hand=handOrder[pick(handHolds,(dt/segment.pace)%handDuration)];
  else{const u=dt/segment.duration;gesture=(u<.3?ease(u/.3):u>.7?ease((1-u)/.3):1)*segment.direction;}
  if(blinks.some(b=>t>=b&&t<b+.19))blink=13;
  const key=hand+':'+blink;
  if(key!==lastKey){
   frame.clearRect(0,0,W,H);frame.drawImage(base,0,0);
   // Only fingers/hook change; the chest, sleeves and robe remain fixed.
   frame.save();frame.clip(handsArea);frame.drawImage(hands,hand%4*180,Math.floor(hand/4)*115,180,115,175,235,180,115);frame.restore();
   frame.save();frame.globalCompositeOperation='source-atop';frame.drawImage(lightMask,0,0);frame.restore();
   headInk.clearRect(0,0,W,H);headInk.save();headInk.clip(headArea);headInk.drawImage(cel,0,0);
   if(blink>=0){headInk.save();headInk.beginPath();headInk.ellipse(239,165,5.4,2.4,.25,0,Math.PI*2);headInk.closePath();headInk.moveTo(265.5,162);headInk.ellipse(259,162,6.5,2.8,-.40,0,Math.PI*2);headInk.closePath();headInk.clip();headInk.drawImage(eyelids,210,140,85,65);headInk.restore();}
   headInk.restore();lastKey=key;
  }
  final.clearRect(0,0,W,H);final.drawImage(cel,0,0);
  // A readable gentle head gesture uses exactly the same face paint in every frame.
  final.save();final.clip(headArea);final.clearRect(190,85,140,125);final.restore();final.drawImage(cel,247,196,31,17,247,196,31,17);
  final.save();final.translate(265+gesture*1.3,202-Math.abs(gesture)*3.4);final.rotate(gesture*.105);final.translate(-265,-202);final.drawImage(headCel,0,0);final.restore();
  const breath=(1-Math.cos(seconds*2*Math.PI/4.7))/2,lift=breath*1.6,anchor=354;
  ctx.clearRect(0,0,W,H);ctx.drawImage(composite,0,0,W,anchor,0,-lift,W,anchor+lift);ctx.drawImage(composite,0,anchor,W,H-anchor,0,anchor,W,H-anchor);
  figure.dataset.action=segment.kind;figure.dataset.frame=String(hand);figure.dataset.head=String(gesture);figure.dataset.blink=String(blink);figure.dataset.time=t.toFixed(3);figure.dataset.breath=breath.toFixed(4);figure.dataset.face='base-v2-immutable';
 }
 return{load,paint,place:{id:'olynn',name:'Olynn Grandwell',detail:'Elfo de la noche druida de La Ganga',href:'../#/character/forever-eu-olynn-grandwell',centre:[2420,1490],character:{guild:'La Ganga',level:40,race:'Elfo de la noche',className:'Druida',classColor:'#ff7d0a',spec:'Equilibrio',faction:'Alianza',region:'EU',ruleset:'JcJ',appearanceDate:'2026-11-18',appearanceLabel:'18/11/2026'}}};
}
