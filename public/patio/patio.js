const config={"escena":{"width":3840,"height":2160,"imagen":"patio-4k.webp"},"atlas":"hoguera-sprites.png","x":1792,"y":1286,"width":320,"height":352,"columnas":12,"filas":8,"fotogramas":96,"fps":24,"orden":"Filas de izquierda a derecha, desde arriba.","duracion":4},get=id=>document.getElementById(id),canvas=get('fire'),ctx=canvas.getContext('2d'),reduce=matchMedia('(prefers-reduced-motion: reduce)');let ready=false,playing=!reduce.matches,animation=0,elapsed=0,previous=null,current=-1;
const lightConfig={"superficies":{"imagen":"luz-del-patio.webp","x":1180,"y":1190,"width":1680,"height":820},"halo":{"atlas":"resplandor.webp","width":512,"height":512,"celda":128,"x":1696,"y":1206},"mezcla":"screen","opacidad":[0.291,0.2877,0.2933,0.3189,0.3642,0.4102,0.4294,0.4089,0.3641,0.3262,0.3155,0.3277,0.3437,0.3512,0.3531,0.3532,0.3517,0.3553,0.378,0.418,0.4549,0.4766,0.48,0.48,0.48,0.48,0.48,0.4247,0.3719,0.3463,0.338,0.3289,0.3112,0.2832,0.2509,0.24,0.24,0.2425,0.2928,0.3407,0.3638,0.362,0.3503,0.3366,0.3219,0.3054,0.2825,0.2574,0.24,0.24,0.2501,0.2695,0.294,0.322,0.3465,0.3547,0.3394,0.3053,0.2652,0.24,0.24,0.24,0.24,0.2447,0.2639,0.2834,0.2993,0.3069,0.3089,0.3172,0.3414,0.3767,0.4098,0.4285,0.4284,0.4139,0.393,0.3818,0.3967,0.4356,0.48,0.48,0.48,0.4633,0.4464,0.451,0.467,0.4731,0.4595,0.4247,0.3775,0.3345,0.3069,0.2964,0.2955,0.2946]},surface=get('surface'),bloomCanvas=get('halo'),bloomCtx=bloomCanvas.getContext('2d');
let sheet,bloomSheet;
async function loadSprite(url){
  if(window.createImageBitmap && (location.protocol!=='file:' || url.startsWith('data:'))){
    const res=await fetch(url);
    if(!res.ok)throw new Error('Sprite '+res.status);
    const blob=await res.blob();
    try{return await createImageBitmap(blob)}catch{}
  }
  const img=new Image();img.src=url;await img.decode();return img;
}
// Decode one visible sprite group at a time after the scene can be used.
const pendingLayers=[];
let loadingLayer=false;
function addLayer(visible,load,first=false){const layer={visible,load};if(first)pendingLayers.unshift(layer);else pendingLayers.push(layer)}
function refreshFrame(){const step=current;current=-1;draw(step,playing?elapsed*config.fps/1000:step)}
function scheduleLayers(){
  if(!get('fortress-gate').hidden)return;
  if(!ready || loadingLayer || document.hidden || !pendingLayers.some(layer=>layer.visible()))return;
  loadingLayer=true;
  const start=async()=>{
    const index=document.hidden?-1:pendingLayers.findIndex(layer=>layer.visible());
    try{
      if(index>=0){
        await pendingLayers.splice(index,1)[0].load();
        // Present this group before starting another. At high refresh rates,
        // waiting for the 24 fps scene tick batches several uploads together.
        refreshFrame();
      }
    }catch(error){get('message').textContent='No se pudo cargar una animación del patio.';console.error(error)}
    finally{loadingLayer=false;scheduleLayers()}
  };
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    if(window.requestIdleCallback)requestIdleCallback(start,{timeout:160});else setTimeout(start,0);
  }));
}
document.addEventListener('visibilitychange',scheduleLayers);
window.addEventListener('patio-opened',scheduleLayers);

const skyEl=get('sky'),cloudA=get('cloud-a'),cloudB=get('cloud-b');
let skyVisible=true,skyLoaded=false;

const flock=get('flock'),birds=flock.getContext('2d'),birdStrip=new Image();
let flockLoaded=false;
async function loadFlock(){birdStrip.src='img/b500035220c2a07d.webp';await birdStrip.decode();flockLoaded=true}
const formation=[
  [0,0,1.06,.17],[-15,-7,.96,1.31],[-13,7,1.01,3.26],
  [-30,-14,.93,4.55],[-29,15,.97,2.02],[-46,-20,.91,5.84],[-44,21,.95,.72]
];
function drawFlock(step){
  if(!flockLoaded)return;
  const seconds=step/config.fps;
  const flight=(seconds-1)/13;
  if(flight<0||flight>=1){if(!flock.hidden)flock.hidden=true;return}
  flock.hidden=false;
  // Positions are in the sky matte's 1125 × 370 coordinates. Move the small
  // canvas, so drawing birds never requires clearing or repainting the sky.
  const leadX=-12+1200*flight;
  const leadY=119-74*flight-8*Math.sin(Math.PI*flight);
  flock.style.transform='translate('+((leadX-64)*100/84)+'%,'+((leadY-31)*100/64)+'%)';
  birds.setTransform(2,0,0,2,0,0);birds.clearRect(0,0,84,64);
  for(const [dx,dy,size,offset] of formation){
    const glide=Math.max(0,Math.min(1,(Math.sin(seconds*1.42+offset)-.23)*2.6));
    const beat=Math.PI*2*seconds*(2.65+offset*.045)+offset;
    const wing=glide>.9?4:Math.round(((beat/(Math.PI*2))%1)*16)%16;
    const x=64+dx+1.15*Math.sin(seconds*.94+offset);
    const y=31+dy+1.2*Math.sin(seconds*1.47+offset)-.35*Math.cos(beat)*(1-glide);
    const w=16.5*size,h=w*18/24;
    birds.drawImage(birdStrip,wing*72,0,72,54,x-w*.52,y-h*.54,w,h);
  }
}

addLayer(()=>skyVisible,async()=>{
  await Promise.all([loadFlock(),...['img/72f300ba19e143a1.webp','img/d91e365e96d5c9f4.webp'].map(url=>{const image=new Image();image.src=url;return image.decode()})]);
  skyEl.style.setProperty('--sky-mask','url(img/d91e365e96d5c9f4.webp)');
  skyEl.style.setProperty('--cloud-texture','url(img/72f300ba19e143a1.webp)');
  skyLoaded=true;drawSky(current);skyEl.classList.add('loaded');skyEl.style.visibility='visible';
});
function drawSky(step){
  if(!skyVisible || !skyLoaded)return;
  drawFlock(step);
  const p=(step%cloudFrames)/cloudFrames,q=(p+.5)%1;
  // The lower layer always fills the opening. Each transform resets only while
  // fully occluded or transparent, so the wind never reverses at the loop seam.
  cloudA.style.transform='translateX('+((p-.5)*3.4).toFixed(4)+'%)';
  cloudB.style.transform='translateX('+((q-.5)*3.4).toFixed(4)+'%)';
  const phase=Math.min(1,Math.max(0,(Math.abs(2*p-1)-.30)/.40));
  cloudB.style.opacity=(phase*phase*(3-2*phase)).toFixed(5);
}


const standardCanvas=get('standard'),standardCtx=standardCanvas.getContext('2d');let standardSheet;
const standardFrames=144, standardFps=48;
let standardVisible=true,standardCel=-1,standardLoaded=false,standardDetail=false;
function useStandard(bitmap){
  const previous=standardSheet;
  standardSheet=bitmap;standardLoaded=true;standardCel=-1;
  previous?.close?.();
}
addLayer(()=>standardVisible && !standardLoaded,async()=>{
  useStandard(await loadSprite('img/e2bbe7c716058cc5.webp'));
});

function drawStandard(step){
  const cel=Math.floor(step*standardFps/config.fps+.000001)%standardFrames;
  if(!standardLoaded || !standardVisible || cel===standardCel)return;
  const {width,height}=standardCanvas;
  standardCtx.clearRect(0,0,width,height);
  const w=standardSheet.width/12,h=standardSheet.height/12;
  const x=(cel%12)*w,y=Math.floor(cel/12)*h;
  standardCtx.drawImage(standardSheet,x,y,w,h,0,0,width,height);
  standardCel=cel;
}


const signLayer=get('tavern-sign'),signBoard=get('sign-board');
let signVisible=true,signSwing=0,signLoaded=false;
addLayer(()=>signVisible,async()=>{
  await Promise.all([signBoard,get('sign-backing')].map(image=>{image.src=image.dataset.src;return image.decode()}));
  signLoaded=true;signBoard.style.willChange='transform';drawSign(current);signLayer.style.visibility='visible';
});
function drawSign(step){
  if(!signVisible || !signLoaded)return;
  const phase=2*Math.PI*step/(8*config.fps);
  const travel=6.6*Math.sin(phase);
  if(travel===signSwing)return;
  signSwing=travel;
  // Project a rigid turn about the sloping line through both eyes.
  // Distance from that axis sets the travel, so both chain ends stay seated.
  const slope=0.2562814070351759;
  const dx=travel/390,dy=-.24*dx;
  signBoard.style.transform='matrix('+[1-slope*dx,-slope*dy,dx,1+dy,0,0].join(',')+')';
}



const catCanvas=get('sleeping-cat'),catCtx=catCanvas.getContext('2d');
const catShadowCanvas=get('cat-shadow'),catShadowCtx=catShadowCanvas.getContext('2d');
let catBody,catTail,catContact,catTailShadow,catVisible=true,lastCatBody=-1,lastCatTail=-1;
addLayer(()=>catVisible,async()=>{
  [catBody,catTail,catContact,catTailShadow]=await Promise.all([
    loadSprite('img/e9c1bb2f85c7b1b1.webp'),loadSprite('img/903ea8ad9ae59569.webp'),loadSprite('img/39b6a2096a5411b7.webp'),loadSprite('img/cb74dd93e9dcb03e.webp')]);
});
function drawCat(seconds){
  if(!catVisible || !catBody)return;
  const phase=seconds/3;
  const breath=(1-Math.cos(2*Math.PI*(phase+.049*Math.sin(2*Math.PI*phase))))/2;
  const flick=seconds%6-1.5;
  const body=Math.round(32*breath);
  const tail=flick>0 && flick<3.5?Math.floor(flick*24+.00001):0;
  if(body!==lastCatBody){
    catCtx.clearRect(0,0,176,139);
    catCtx.drawImage(catBody,(body%7)*176,Math.floor(body/7)*139,176,139,0,0,176,139);
    lastCatBody=body;
  }
  if(tail!==lastCatTail){
    catShadowCtx.clearRect(0,0,468,278);
    catShadowCtx.drawImage(catContact,0,0);
    catShadowCtx.drawImage(catTailShadow,(tail%7)*70,Math.floor(tail/7)*139,70,139,328,0,140,278);
    catCtx.clearRect(176,0,58,139);
    catCtx.drawImage(catTail,(tail%7)*58,Math.floor(tail/7)*139,58,139,176,0,58,139);
    lastCatTail=tail;
  }
}
const dustEffects=[{"id":"passage-dust","x":1373,"y":1089,"width":184,"height":280,"scale":1,"seed":23,"count":10,"radius":4.4,"beam":0.65,"slant":-0.31,"spread":0.25,"arch":true,"periods":[8,9,12,18],"light":[36,32,23,73,71,66,87,78,61,26,27,36,23,41,70,95,93,76,80,72,91,97,45,20,35,76,68,71,88,86,81,83,82,82,77,42,47,59,51,64,69,86,99,87,77,55,61,53,51,53,39,56,50,62,78,60,69,49,50,57,45,46,29,46,55,76,89,90,96,72,39,51,53,80,38,63,84,88,85,91,90,82,50,65,45,68,37,55,64,69,70,77,68,62,53,58,34,49,29,41,51,35,51,45,37,51,45,42,47,84,64,79,80,65,74,71,76,70,87,61,39,99,98,95,94,98,94,97,96,95,100,65,28,51,62,66,72,81,84,74,66,63,47,32],"side":12,"pigment":[208,151,103]},{"id":"tavern-dust","x":410,"y":1220,"width":746,"height":570,"scale":0.5,"seed":61,"count":14,"radius":6.9,"beam":0.31,"slant":0.38,"spread":0.3,"periods":[18,24,36],"light":[58,16,31,39,73,90,89,50,45,46,43,84,55,16,28,48,78,76,88,48,43,35,42,83,47,15,32,42,73,75,87,47,33,32,39,81,34,27,29,36,69,74,77,53,36,40,44,72,25,19,29,44,70,67,56,54,63,66,66,57,20,28,31,44,50,53,54,49,51,53,55,58,21,18,29,44,51,49,53,56,57,56,63,75,35,13,31,45,54,57,61,61,63,70,75,68,38,13,33,54,54,57,52,55,66,68,58,60,38,15,29,49,49,52,62,65,59,54,58,62,43,15,29,45,63,55,51,61,52,55,58,53,48,10,27,40,42,66,57,48,57,57,52,54],"side":12,"pigment":[177,134,94]},{"id":"gallery-dust","x":3030,"y":1018,"width":720,"height":696,"scale":0.5,"seed":97,"count":13,"radius":5.8,"beam":0.73,"slant":-0.35,"spread":0.26,"periods":[12,18,24,36],"light":[90,98,93,75,76,63,39,16,12,11,14,44,100,100,100,83,38,43,36,16,28,13,13,14,85,81,100,50,21,75,42,61,73,31,12,20,80,48,96,57,39,92,42,49,51,19,22,35,100,42,46,58,32,72,41,31,44,17,25,25,93,73,51,56,32,72,43,10,27,20,32,27,76,87,95,51,38,75,45,7,21,32,33,21,56,66,94,48,37,62,34,9,13,13,18,16,70,92,96,50,37,51,27,4,1,9,22,18,57,84,96,52,34,61,42,1,3,9,18,17,83,93,86,46,28,61,46,0,4,10,9,0,67,75,71,46,23,46,43,1,5,11,9,8],"side":12,"pigment":[179,141,103]},{"id":"dust-by-benches","x":85,"y":1680,"width":1200,"height":470,"scale":0.34,"seed":41,"count":19,"radius":7.5,"beam":0.44,"slant":0.13,"spread":0.52,"periods":[18,24,36],"light":[27,44,59,35,24,47,50,60,56,59,58,63,44,24,53,49,18,48,64,51,55,52,53,48,27,36,58,43,18,35,52,58,55,59,55,53,24,39,51,31,18,37,40,57,47,62,69,51,28,46,68,34,20,51,45,58,50,51,65,70,31,45,70,54,70,90,54,66,62,49,52,59,28,41,52,63,81,86,61,53,50,45,43,48,20,27,44,68,87,73,50,62,53,35,50,52,15,30,53,74,85,56,52,60,62,45,41,46,27,39,42,76,85,46,58,69,47,55,53,42,23,32,36,67,54,50,57,65,45,36,44,39,17,25,33,47,45,57,67,80,41,30,35,35],"side":12,"pigment":[181,133,82]},{"id":"dust-on-path","x":1135,"y":1610,"width":1510,"height":550,"scale":0.34,"seed":107,"count":26,"radius":8.2,"beam":0.56,"slant":-0.15,"spread":0.55,"periods":[18,24,36],"light":[71,57,28,75,79,46,59,41,47,74,46,31,67,63,19,27,39,56,68,69,75,80,72,63,54,38,21,31,32,83,96,99,85,73,66,66,53,46,30,26,31,61,73,70,60,62,57,54,58,55,53,44,48,56,59,59,56,59,60,53,69,59,52,58,62,58,51,56,61,58,54,49,51,60,66,63,55,48,56,62,54,51,46,44,48,51,61,71,58,48,50,51,50,46,47,43,49,49,43,63,58,43,46,47,46,45,48,47,42,42,44,52,56,49,42,49,46,49,48,45,42,38,43,46,51,42,36,40,38,42,37,37,36,34,43,42,45,35,30,36,35,34,38,38],"side":12,"pigment":[191,130,81]},{"id":"dust-on-stones","x":2535,"y":1650,"width":1230,"height":510,"scale":0.34,"seed":83,"count":20,"radius":7.8,"beam":0.49,"slant":0.21,"spread":0.5,"periods":[18,24,36],"light":[63,63,60,46,67,79,58,32,41,2,8,9,66,62,58,47,63,73,64,35,39,8,9,16,58,59,52,47,49,69,52,32,44,11,14,26,53,52,46,44,31,53,66,45,37,14,24,32,52,49,45,43,41,46,65,90,59,43,59,55,46,45,48,48,55,55,37,49,68,81,74,70,43,50,54,51,52,50,53,49,49,47,58,54,41,43,45,56,57,49,51,63,61,49,35,34,50,42,40,47,41,39,42,42,43,46,45,31,43,50,46,40,38,38,40,47,39,36,42,32,38,43,42,37,39,42,42,35,38,40,39,35,39,35,33,36,36,36,38,38,37,33,34,34],"side":12,"pigment":[189,129,84]}].map(function prepareDust(zone){
  const el=document.getElementById(zone.id),ctx=el.getContext('2d');
  const {width,height}=el;
  let seed=zone.seed;
  function random(){
    seed=(Math.imul(1664525,seed)+1013904223)>>>0;
    return seed/4294967296;
  }
  // Stratify paths and phases so each pool of light has its own sparse drift.
  const grains=Array.from({length:zone.count},(_,i)=>({
    y:(.12+.74*(i+random())/zone.count)*height,
    offset:(i*.618034+random()*.19)%1,
    period:zone.periods[Math.floor(random()*zone.periods.length)],
    rise:(random()-.53)*.16*height,
    radius:zone.radius*(.71+.62*random())*zone.scale,
    angle:random()*Math.PI
  }));
  const fleck=document.createElement('canvas');
  fleck.width=fleck.height=32;
  const brush=fleck.getContext('2d'),gradient=brush.createRadialGradient(15,15,1,16,16,16);
  const ink=zone.pigment.join(',');
  for(const [at,alpha] of [[0,.96],[.47,.81],[.72,.32],[1,0]])gradient.addColorStop(at,'rgba('+ink+','+alpha+')');
  brush.fillStyle=gradient;brush.fillRect(0,0,32,32);
  function localLight(x,y){
    const n=zone.side, u=Math.max(0,Math.min(n-1,x/width*n-.5)),v=Math.max(0,Math.min(n-1,y/height*n-.5));
    const col=Math.floor(u),row=Math.floor(v),next=Math.min(n-1,col+1);
    const across=r=>zone.light[r*n+col]*(1-u+col)+zone.light[r*n+next]*(u-col);
    return (across(row)*(1-v+row)+across(Math.min(n-1,row+1))*(v-row))/100;
  }
  return {el,visible:true,sizeScale:1,draw(seconds){
    ctx.clearRect(0,0,width,height);
    ctx.save();
    if(zone.arch){
      ctx.beginPath();ctx.moveTo(12,201);ctx.lineTo(12,59);ctx.lineTo(59,7);
      ctx.lineTo(126,7);ctx.lineTo(175,55);ctx.lineTo(175,267);
      ctx.lineTo(15,267);ctx.closePath();ctx.clip();
    }
    for(const grain of grains){
      const p=(seconds/grain.period+grain.offset)%1,phase=2*Math.PI*p;
      const y=grain.y+grain.rise*(p-.5)+.022*height*Math.sin(phase+grain.angle);
      const x=width*(.05+.90*p+.013*Math.sin(phase+grain.angle*2));
      const beam=(x/width-zone.beam-zone.slant*y/height)/zone.spread;
      const opacity=(.34+.44*localLight(x,y))*Math.exp(-beam*beam)*Math.sin(Math.PI*p)**2;
      if(opacity<.026)continue;
      const radius=grain.radius*this.sizeScale;
      const angle=grain.angle+.34*Math.sin(phase);
      ctx.save();ctx.translate(x,y);ctx.rotate(angle);
      ctx.globalAlpha=opacity;
      ctx.drawImage(fleck,-radius*1.2,-radius*.83,radius*2.4,radius*1.66);
      ctx.restore();
    }
    ctx.restore();
  }};
});
for(const effect of dustEffects)addLayer(()=>effect.visible,async()=>{effect.loaded=true});
const smokeCanvas=get('camp-smoke'),smokeCtx=smokeCanvas.getContext('2d'),smokeImage=new Image();
let smokeVisible=true,smokeLoaded=false,lastSmokeFrame=-1;
function updateAtmosphereView(visible){
  for(const effect of dustEffects){
    effect.visible=visible(effect.el);
    const displayWidth=effect.el.getBoundingClientRect().width;
    effect.sizeScale=Math.max(1,Math.min(3,.32*effect.el.width/Math.max(1,displayWidth)));
  }
  smokeVisible=visible(smokeCanvas);
  catVisible=visible(catCanvas);
}
addLayer(()=>smokeVisible,async()=>{
  smokeImage.src='img/84c933a2568041a1.webp';await smokeImage.decode();smokeLoaded=true;
});
function drawAtmosphere(step){
  const seconds=step/config.fps;
  drawCat(seconds);
  for(const effect of dustEffects)if(effect.visible && effect.loaded)effect.draw(seconds);
  if(!smokeVisible || !smokeLoaded)return;
  const frame=Math.floor(seconds*24+.00001)%144;
  if(frame===lastSmokeFrame)return;
  lastSmokeFrame=frame;
  const cel=Math.floor(frame/2),next=(cel+1)%72;
  const {width,height}=smokeCanvas;
  smokeCtx.clearRect(0,0,width,height);
  smokeCtx.globalAlpha=frame%2 ? .5 : 1;
  smokeCtx.drawImage(smokeImage,(cel%9)*width,Math.floor(cel/9)*height,width,height,0,0,width,height);
  if(frame%2){
    smokeCtx.globalCompositeOperation='lighter';
    smokeCtx.drawImage(smokeImage,(next%9)*width,Math.floor(next/9)*height,width,height,0,0,width,height);
    smokeCtx.globalCompositeOperation='source-over';smokeCtx.globalAlpha=1;
  }
}


const torches={"columnas":12,"filas":8,"fotogramas":96,"fps":24,"antorchas":[{"id":"taberna","nombre":"Taberna","x":160,"y":176,"width":344,"height":420,"llama":{"x":218,"y":180,"width":265,"height":319},"halo":{"x":-230,"y":-214,"width":1125,"height":1200,"celdaW":225,"celdaH":240},"reflejo":{"x":46,"y":190,"width":526,"height":602},"luz":[0.1847,0.1889,0.209,0.2408,0.2592,0.2566,0.2361,0.2065,0.1806,0.1637,0.1584,0.1589,0.163,0.1759,0.1949,0.2125,0.2159,0.2145,0.2182,0.2354,0.2556,0.2681,0.2667,0.2513,0.2331,0.2158,0.2042,0.1936,0.1883,0.1882,0.1965,0.2116,0.2315,0.2519,0.2666,0.2738,0.275,0.2742,0.272,0.265,0.2484,0.2181,0.1859,0.1654,0.1699,0.1861,0.1981,0.199,0.1915,0.1817,0.166,0.1475,0.1278,0.1174,0.1196,0.1313,0.1415,0.1408,0.1341,0.1262,0.1245,0.1309,0.1471,0.1749,0.206,0.2281,0.2321,0.2177,0.2008,0.1797,0.1578,0.1289,0.1102,0.1078,0.1216,0.1415,0.1625,0.1845,0.2081,0.2304,0.25,0.2614,0.2609,0.2451,0.2197,0.187,0.153,0.1189,0.0971,0.095,0.1132,0.1422,0.1675,0.1869,0.1943,0.1937]},{"id":"escalera","nombre":"Escalera","x":2400,"y":642,"width":208,"height":218,"llama":{"x":2471,"y":661,"width":92,"height":168},"halo":{"x":2247,"y":489,"width":516,"height":525,"celdaW":172,"celdaH":175},"reflejo":{"x":2315,"y":673,"width":338,"height":320},"luz":[0.1584,0.1559,0.1591,0.1637,0.1689,0.1826,0.208,0.2382,0.2589,0.2686,0.2709,0.2745,0.275,0.2621,0.2359,0.2036,0.1812,0.1625,0.1448,0.1238,0.1133,0.1158,0.1315,0.1546,0.1851,0.2135,0.2308,0.2304,0.2197,0.2082,0.2034,0.2027,0.1995,0.1891,0.1763,0.1695,0.1697,0.1719,0.1668,0.1551,0.1413,0.1335,0.1376,0.1553,0.183,0.2113,0.2333,0.2477,0.2564,0.2642,0.2621,0.2405,0.1917,0.1368,0.1018,0.095,0.1062,0.1178,0.1265,0.133,0.1423,0.1582,0.1795,0.1998,0.2099,0.2051,0.1873,0.1658,0.1494,0.1441,0.145,0.1452,0.1425,0.1429,0.1518,0.1636,0.1682,0.1595,0.1454,0.1363,0.1421,0.1611,0.1858,0.2054,0.2157,0.2194,0.219,0.2149,0.2061,0.194,0.1807,0.1698,0.1658,0.1696,0.1717,0.1678]},{"id":"galeria","nombre":"Galería","x":2960,"y":926,"width":246,"height":288,"llama":{"x":3036,"y":974,"width":109,"height":188},"halo":{"x":2777,"y":743,"width":612,"height":654,"celdaW":204,"celdaH":218},"reflejo":{"x":2859,"y":990,"width":390,"height":394},"luz":[0.1905,0.2095,0.2256,0.237,0.2452,0.2452,0.2304,0.2035,0.1697,0.1375,0.1098,0.095,0.0974,0.1151,0.1406,0.1617,0.1777,0.19,0.203,0.2109,0.2103,0.2043,0.2007,0.2004,0.1952,0.1826,0.166,0.1553,0.1535,0.1571,0.1632,0.1668,0.1754,0.1907,0.2152,0.2378,0.2519,0.2533,0.2462,0.2327,0.2156,0.201,0.1981,0.2138,0.2384,0.2596,0.2692,0.273,0.2653,0.2431,0.2075,0.1794,0.1641,0.1583,0.1537,0.1546,0.1609,0.1691,0.1717,0.1752,0.1865,0.2093,0.2374,0.258,0.2686,0.2713,0.2743,0.275,0.2645,0.2421,0.2136,0.1935,0.1767,0.1608,0.1419,0.1322,0.1345,0.1485,0.17,0.1977,0.2228,0.2366,0.2342,0.2236,0.2133,0.2092,0.2084,0.2049,0.1953,0.1845,0.1795,0.1804,0.1824,0.1779,0.1732,0.1751]}]},torchAtlases=["img/f41c843d6a251c32.webp","img/1c963a1a86c2b17f.webp","img/a7739801c5b36a53.webp"];
const glowAtlases=["img/b4d214ece0ff0947.webp","img/b8f2fe27208c3108.webp","img/fdfa8575e5e802c0.webp"];
const fixtures=torches.antorchas.map((t,i)=>{
  return {t,light:get('light-'+t.id),base:get('base-'+t.id),ctx:get('flame-'+t.id).getContext('2d'),glowCtx:get('halo-'+t.id).getContext('2d'),loaded:false};
});
async function decodeCel(url,ctx){
  const sprite=await loadSprite(url);
  ctx.canvas.width=sprite.width/torches.columnas;ctx.canvas.height=sprite.height/torches.filas;return sprite;
}
let visibleFixtures=fixtures,showCampfire=true;
fixtures.forEach((f,i)=>addLayer(()=>visibleFixtures.includes(f),async()=>{
  f.base.src=f.base.dataset.src;f.light.src=f.light.dataset.src;
  [f.sheet,f.bloom]=await Promise.all([decodeCel(torchAtlases[i],f.ctx),decodeCel(glowAtlases[i],f.glowCtx),f.base.decode(),f.light.decode()]);
  f.loaded=true;f.base.style.visibility='visible';
}));
function drawTorchCel(ctx,sheet,frame){
  const {width,height}=ctx.canvas;
  const x=(frame%torches.columnas)*width,y=Math.floor(frame/torches.columnas)*height;
  ctx.clearRect(0,0,width,height);ctx.drawImage(sheet,x,y,width,height,0,0,width,height);
  ctx.canvas.dataset.frame=frame;
}
function setTorchLight(frame){
  for(const f of visibleFixtures){
    if(!f.loaded)continue;
    f.light.style.opacity=f.t.luz[frame];
    drawTorchCel(f.glowCtx,f.bloom,frame);
  }
}
function drawTorches(frame){for(const f of visibleFixtures)if(f.loaded)drawTorchCel(f.ctx,f.sheet,frame)}
const scene=get('scene'),stage=get('stage'),pick=get('focus');
const layoutPan=(function setupPan(scene,stage,pick,update){
  let positionX=.5,positionY=.5,gesture,frame=0,suppressClick=false;
  const nativePan=matchMedia('(pointer: coarse)');
  const clamp=value=>Math.max(0,Math.min(1,value));
  function bounds(){
    return [Math.max(0,stage.offsetWidth-scene.clientWidth),Math.max(0,stage.offsetHeight-scene.clientHeight)];
  }
  function layout(){
    const hint=get('pan-hint');
    if(pick.value!=='patio'){scene.classList.remove('pannable');hint.hidden=true;return}
    const [w,h]=bounds();
    hint.hidden=w<=1 && h<=1;
    const label=nativePan.matches?'Desliza para explorar':'Arrastra para explorar';
    if(hint.lastElementChild.textContent!==label)hint.lastElementChild.textContent=label;
    if(nativePan.matches){
      // Reassigning scroll offsets on every frame can cancel touch inertia.
      if(Math.abs(scene.scrollLeft-positionX*w)>1)scene.scrollLeft=positionX*w;
      if(Math.abs(scene.scrollTop-positionY*h)>1)scene.scrollTop=positionY*h;
      scene.classList.toggle('pannable',w>1 || h>1);return;
    }
    stage.style.setProperty('--pan-x','calc(-50% + '+((.5-positionX)*w)+'px)');
    stage.style.setProperty('--pan-y','calc(-50% + '+((.5-positionY)*h)+'px)');
    scene.classList.toggle('pannable',w>1 || h>1);
  }
  function move(x,y){
    positionX=clamp(x);positionY=clamp(y);
    if(!frame)frame=requestAnimationFrame(()=>{frame=0;update()});
  }
  scene.addEventListener('pointerdown',e=>{
    suppressClick=false;
    if(nativePan.matches)return;
    if(!e.isPrimary || e.button!==0 || !scene.classList.contains('pannable'))return;
    const [w,h]=bounds();
    gesture={id:e.pointerId,x:e.clientX,y:e.clientY,positionX,positionY,w,h,dragged:false};
  });
  scene.addEventListener('pointermove',e=>{
    if(!gesture || e.pointerId!==gesture.id)return;
    const g=gesture;
    if(!g.dragged){
      if(Math.hypot(e.clientX-g.x,e.clientY-g.y)<6)return;
      g.dragged=true;suppressClick=true;
      scene.setPointerCapture(e.pointerId);scene.classList.add('dragging');
    }
    move(g.positionX-(g.w?(e.clientX-g.x)/g.w:0),g.positionY-(g.h?(e.clientY-g.y)/g.h:0));
  });
  scene.addEventListener('lostpointercapture',()=>{gesture=null;scene.classList.remove('dragging')});
  scene.addEventListener('pointerup',()=>{gesture=null;scene.classList.remove('dragging')});
  scene.addEventListener('pointercancel',()=>{gesture=null;scene.classList.remove('dragging')});
  scene.addEventListener('click',e=>{if(suppressClick){suppressClick=false;e.preventDefault();e.stopImmediatePropagation()}},true);
  scene.addEventListener('scroll',()=>{
    if(!nativePan.matches || pick.value!=='patio')return;
    const [w,h]=bounds();positionX=w?scene.scrollLeft/w:.5;positionY=h?scene.scrollTop/h:.5;
    if(!frame)frame=requestAnimationFrame(()=>{frame=0;update()});
  },{passive:true});
  nativePan.addEventListener('change',()=>{scene.scrollLeft=0;scene.scrollTop=0;update()});
  scene.addEventListener('keydown',e=>{
    if(pick.value!=='patio')return;
    const step={ArrowLeft:[-.18,0],ArrowRight:[.18,0],ArrowUp:[0,-.18],ArrowDown:[0,.18]}[e.key];
    if(step){e.preventDefault();move(positionX+step[0],positionY+step[1])}
  });
  layout.lookAt=(x,y)=>{
    const [w,h]=bounds();
    positionX=w?clamp((x/3840*stage.offsetWidth-scene.clientWidth/2)/w):.5;
    positionY=h?clamp((y/2160*stage.offsetHeight-scene.clientHeight/2)/h):.5;
    update();
  };
  return layout;
})(scene,stage,pick,focusTorch);
const viewpoints=[{"id":"taberna","x":160,"y":176,"width":344,"height":420},{"id":"escalera","x":2400,"y":642,"width":208,"height":218},{"id":"galeria","x":2960,"y":926,"width":246,"height":288},{"id":"cristales-taberna","x":105,"y":510,"width":570,"height":1070},{"id":"ventana-pasadizo","x":2270,"y":350,"width":482,"height":390},{"id":"ventana-salon","x":2875,"y":219,"width":420,"height":430},{"id":"ventana-derecha","x":3500,"y":80,"width":340,"height":410},{"id":"polvo","x":1278,"y":962,"width":402,"height":482},{"id":"humo","x":1640,"y":1100,"width":750,"height":610},{"id":"gato","x":1260,"y":1405,"width":540,"height":330},{"id":"tablon","x":1990,"y":940,"width":510,"height":365},{"id":"cartel","x":650,"y":210,"width":530,"height":535},{"id":"estandarte","x":2580,"y":133,"width":346,"height":690},{"id":"cielo","x":1150,"y":0,"width":1380,"height":583}];
let detailPlate,detailRequest=0;
function sharpenDetail(focused){
  const base=get('plate'),size=Math.ceil(stage.getBoundingClientRect().width)+'px';
  if(!focused){
    detailRequest++;get('detail-plate')?.remove();detailPlate=null;return;
  }
  if(detailPlate?.sizes===size)return;
  const turn=++detailRequest;
  const next=new Image();next.alt='';next.decoding='async';next.style.cssText='position:absolute;inset:0;pointer-events:none';
  next.sizes=size;next.srcset=base.srcset;
  const previous=detailPlate;detailPlate=next;
  next.decode().then(()=>{
    if(turn!==detailRequest)return;
    const displayed=get('detail-plate');
    next.id='detail-plate';base.after(next);displayed?.remove();
  }).catch(()=>{if(turn===detailRequest)detailPlate=previous});
}
function focusTorch(){
  const t=viewpoints.find(t=>t.id===pick.value);
  scene.classList.toggle('focused',Boolean(t));
  layoutPan();
  if(t){
  const windowWidth=scene.clientWidth,windowHeight=scene.clientHeight;
  const zoom=Math.max(windowWidth,windowHeight*16/9,Math.min(windowWidth*.59/t.width,windowHeight*.75/t.height)*3840);
  const visible=(centre,view,size)=>Math.max(view/(2*size),Math.min(1-view/(2*size),centre));
  const centreX=visible((t.x+.5*t.width)/3840,windowWidth,zoom);
  const centreY=visible((t.y+.52*t.height)/2160,windowHeight,zoom*2160/3840);
  stage.style.setProperty('--zoom',zoom+'px');
  stage.style.setProperty('--pan-x',(-100*centreX)+'%');stage.style.setProperty('--pan-y',(-100*centreY)+'%');
  }
  const viewport=scene.getBoundingClientRect();
  sharpenDetail(Boolean(t));
  const visible=el=>{const r=el.getBoundingClientRect();return r.right>viewport.left && r.left<viewport.right && r.bottom>viewport.top && r.top<viewport.bottom};
  visibleFixtures=fixtures.filter(f=>visible(f.glowCtx.canvas)||visible(f.light));
  visibleGlass=glassPanes.filter(p=>visible(p.el));
  showCampfire=visible(surface)||visible(bloomCanvas);
  skyVisible=visible(skyEl);
  standardVisible=visible(standardCanvas);standardDetail=pick.value==="estandarte" || standardCanvas.getBoundingClientRect().width*devicePixelRatio>140;
  signVisible=visible(signLayer);
  updateAtmosphereView(visible);
  scene.dispatchEvent(new Event('patio-view'));
  if(ready){refreshFrame();scheduleLayers()}
}
pick.addEventListener('change',()=>{focusTorch();history.replaceState(null,'',location.pathname+location.search+'#'+pick.value)});
function readFocus(){pick.value=viewpoints.some(t=>'#'+t.id===location.hash)?location.hash.slice(1):'patio';focusTorch()}
addEventListener('hashchange',readFocus);new ResizeObserver(focusTorch).observe(scene);

const glassPanes=Array.from(document.querySelectorAll('.window-glass'),pane=>({el:pane,room:Number(pane.dataset.room),left:pane.children[1],right:pane.children[2],spill:pane.children[3],shade:pane.querySelector('em'),loaded:false}));
let visibleGlass=glassPanes;
for(const pane of glassPanes)addLayer(()=>visibleGlass.includes(pane),async()=>{
  const sources=[pane.el.dataset.glass,pane.el.dataset.matte];
  await Promise.all(sources.map(url=>{const image=new Image();image.src=url;return image.decode()}));
  pane.el.style.setProperty('--glass','url('+sources[0]+')');
  pane.el.style.setProperty('--matte','url('+sources[1]+')');
  pane.loaded=true;drawWindows(current%windowFrames);pane.el.classList.add('lit');
});
// Three harmonics of the same eight-second loop: gradual changes in the light
// source, with the opposite side of the room catching up a little later.
const roomRhythms=[[2,5,.55,.32],[3,7,2.1,.13],[1,4,4.6,.64],[2,3,3.85,.81]];
function drawWindows(step){
  const phase=2*Math.PI*step/windowFrames;
  const levels=roomRhythms.map(([slow,fast,offset,lag])=>{
    const source=p=>.52+.33*Math.sin(slow*p+offset)+.085*Math.sin(fast*p+2*offset)+.025*Math.sin((fast+3)*p-offset);
    const left=source(phase),right=source(phase-lag/slow);
    const travel=Math.sin(phase+offset+.34*Math.sin(slow*phase+lag));
    return [left,right,.08+.40*(left+right)/2,-50+76*travel];
  });
  for(const pane of visibleGlass){
    if(!pane.loaded)continue;
    const [left,right,spill,travel]=levels[pane.room];
    pane.left.style.opacity=left.toFixed(3);
    pane.right.style.opacity=right.toFixed(3);
    pane.spill.style.opacity=spill.toFixed(3);
    pane.shade.style.transform='translateX('+travel.toFixed(1)+'%)';
  }
}

readFocus();
(function setupSound(urls){
  const button=document.getElementById('sound'),volume=document.getElementById('ambient-volume');
  const masterLevel=()=>Number(volume.value)/100;
  let context,master,voices,pan,loading,playing=false,revision=0;

  function placeTavern(){
    if(!pan)return;
    const stage=document.getElementById('stage').getBoundingClientRect();
    const scene=document.getElementById('scene').getBoundingClientRect();
    const centre=(scene.left+scene.width/2-stage.left)/stage.width;
    // The entrance is at x=7% of the painting. In a close-up it can sit off screen.
    const distance=centre-.07, direction=-distance*stage.width/(scene.width/2);
    pan.pan.setTargetAtTime(.42*Math.tanh(direction),context.currentTime,.22);
    voices.gain.setTargetAtTime(.94-.16*Math.min(1,Math.abs(distance)/.6),context.currentTime,.22);
  }
  async function load(){
    const buffers=[];
    for(const url of urls){
      const response=await fetch(url);
      if(!response.ok)throw new Error('Audio '+response.status);
      buffers.push(await context.decodeAudioData(await response.arrayBuffer()));
    }
    // Opus decoding and device-rate resampling can colour the very first and
    // last samples differently. Join them in decoded PCM at the playback rate.
    const when=context.currentTime+.025;
    buffers.forEach((buffer,i)=>{
      const source=context.createBufferSource();
      const join=Math.round(.045*buffer.sampleRate);
      for(let ch=0;ch<buffer.numberOfChannels;ch++){
        const pcm=buffer.getChannelData(ch),last=pcm.length-join;
        for(let j=0;j<join;j++){
          const t=j/(join-1),weight=t*t*(3-2*t);
          pcm[last+j]+=(pcm[j]-pcm[last+j])*weight;
        }
      }
      source.buffer=buffer;source.loop=true;source.loopStart=join/buffer.sampleRate;
      source.loopEnd=buffer.duration;source.connect(i===0?master:voices);source.start(when,source.loopStart);
    });
  }
  function show(){
    button.setAttribute('aria-pressed',String(playing));
    button.setAttribute('aria-label',playing?'Silenciar ambiente':'Activar ambiente');
    button.title=playing?'Silenciar ambiente':'Activar ambiente';
    document.getElementById('sound-label').textContent=playing?'Silenciar':'Activar';
  }
  function showVolume(){
    document.getElementById('volume-value').textContent=volume.value+' %';
    volume.setAttribute('aria-valuetext',volume.value+' por ciento');
  }
  function fade(value,seconds){
    const now=context.currentTime;
    master.gain.cancelAndHoldAtTime(now);
    master.gain.linearRampToValueAtTime(value,now+seconds);
  }
  async function sync(){
    const turn=++revision;
    if(!playing || document.hidden){
      if(context?.state==='running'){
        fade(0,.14);
        setTimeout(()=>{if(turn===revision)context.suspend().catch(()=>{})},170);
      }
      return;
    }
    try{
      if(!context){
        context=new AudioContext();
        master=context.createGain();master.gain.value=0;master.connect(context.destination);
        voices=context.createGain();pan=context.createStereoPanner();voices.connect(pan);pan.connect(master);
        placeTavern();
      }
      // Resume synchronously inside the click gesture, before fetching.
      const resumed=context.resume();
      if(!loading)loading=load().catch(error=>{loading=null;throw error});
      await Promise.all([resumed,loading]);
      if(turn===revision)fade(masterLevel(),.5);
    }catch(error){
      if(turn===revision){
        playing=false;show();
        document.getElementById('message').textContent='No se ha podido reproducir el ambiente. Puedes volver a intentarlo.';
      }
    }
  }
  button.addEventListener('click',()=>{playing=!playing;show();sync()});
  volume.addEventListener('input',()=>{showVolume();if(playing && context && !document.hidden)fade(masterLevel(),.06)});
  showVolume();
  document.addEventListener('visibilitychange',sync);
  document.getElementById('scene').addEventListener('patio-view',placeTavern);
})(["audio/9339eec5bfcc320a.ogg","audio/1181642b1d043783.ogg"]);
const navigationGlow=(function setupPaintedHover(scene,configs,motion){
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const layers=new Map(configs.map(config=>{
    const root=document.getElementById('painted-'+config.id);
    return [config.id,{...config,root,views:[...root.children],loaded:false,pending:null,frames:'',retireAt:0}];
  }));
  const visible=new Set();
  let selected=null;
  for(const layer of layers.values())layer.root.addEventListener('transitionend',event=>{
    if(event.target===layer.root&&event.propertyName==='opacity'&&!layer.root.classList.contains('is-lit')){
      visible.delete(layer);layer.root.classList.remove('is-rendering');
    }
  });
  function blit(ctx,image,frame,w,h,cols,dx=0){
    ctx.drawImage(image,(frame%cols)*w,Math.floor(frame/cols)*h,w,h,dx,0,w,h);
  }
  function draw(layer){
    if(!layer.loaded)return;
    if(layer.sprite==='sign'){
      const transform=motion.sign();
      if(transform!==layer.frames){layer.root.style.transform=transform;layer.frames=transform}
    }else if(layer.sprite==='flag'){
      const frame=motion.flag();
      if(frame<0||layer.frames===String(frame))return;
      layer.frames=String(frame);
      const ctx=layer.contexts[0];ctx.clearRect(0,0,106,254);
      blit(ctx,layer.images[0],frame,106,254,12);
    }else if(layer.sprite==='cat'){
      const [body,tail]=motion.cat(),key=body+'/'+tail;
      if(body<0||tail<0||layer.frames===key)return;
      const [oldBody,oldTail]=layer.frames.split('/').map(Number),ctx=layer.contexts[0];
      if(body!==oldBody||!layer.frames){ctx.clearRect(0,0,176,139);blit(ctx,layer.images[0],body,176,139,7)}
      if(tail!==oldTail||!layer.frames){ctx.clearRect(176,0,58,139);blit(ctx,layer.images[1],tail,58,139,7,176)}
      layer.frames=key;
    }
  }
  function paint(){
    if(!visible.size)return;
    const now=performance.now();
    for(const layer of visible){
      if(layer!==selected&&now>=layer.retireAt){visible.delete(layer);layer.root.classList.remove('is-rendering');continue}
      draw(layer);
    }
  }
  function activate(layer){
    if(selected!==layer)return;
    layer.frames='';visible.add(layer);draw(layer);
    layer.root.classList.add('is-rendering','is-lit');
  }
  async function load(layer){
    if(!layer.pending){
      const dynamic=layer.sprite==='flag'||layer.sprite==='cat';
      layer.images=dynamic?[]:layer.views;
      // Decode the moving lightmaps off the main thread when supported.
      // Only one atlas set is needed; its pulse is composited by CSS.
      layer.pending=(dynamic?Promise.all(layer.urls.map(url=>loadSprite(url))).then(images=>{layer.images=images}):Promise.all(layer.images.map((image,i)=>{image.src=layer.urls[i];return image.decode()})))
        .then(()=>{
          if(dynamic)layer.contexts=layer.views.map(canvas=>canvas.getContext('2d'));
          layer.loaded=true;activate(layer);
        }).catch(()=>{layer.pending=null});
    }
    return layer.pending;
  }
  function hide(){
    if(selected){
      selected.root.classList.remove('is-lit');
      selected.retireAt=performance.now()+320;
      if(reduced.matches||!motion.running()){
        visible.delete(selected);selected.root.classList.remove('is-rendering');
      }
    }
    selected=null;
  }
  function select(place){
    const next=layers.get(place.id);
    if(next===selected)return;
    hide();selected=next||null;
    if(!selected)return;
    if(selected.loaded)activate(selected);else load(selected);
  }
  scene.paintNavigation=paint;
  scene.syncNavigation=running=>scene.classList.toggle('hover-paused',!running);
  scene.syncNavigation(motion.running());
  return {select,hide};
})(scene,[{"id":"taberna","rect":[0,500,768,1600],"urls":["img/67e24a077e85779f.webp","img/e5f3b810d78da089.webp"]},{"id":"cuartel","rect":[700,900,640,640],"urls":["img/222000d4e37e34f0.webp","img/613c02c00c7497f3.webp"]},{"id":"heraldo","rect":[1856,720,736,704],"urls":["img/fd49c7e8a85c9495.webp","img/d2a22763d5d5b428.webp"]},{"id":"entrenamiento","rect":[1320,1100,340,300],"urls":["img/828b781f9834c7a9.webp","img/742f73ef58ff4e2c.webp"]},{"id":"progreso","rect":[1700,300,512,384],"urls":["img/e61ba1e12eafaa8a.webp","img/ed599817755d98c5.webp"]},{"id":"fama","rect":[3104,0,736,704],"urls":["img/943f6ebd79aa3bb8.webp","img/154167ccbaabb2a5.webp"]},{"id":"galeria","rect":[3152,704,688,1408],"urls":["img/f21a69065b57894f.webp","img/d444da87dab85be7.webp"]},{"id":"hoguera","rect":[1536,1376,896,480],"urls":["img/1e3e0c9bf8bf7537.webp","img/7b94f43808e2116e.webp"]},{"id":"cartel","sprite":"sign","rect":[650,210,530,535],"urls":["img/3f05b40e7b56bd32.webp","img/4be74a1199578d0e.webp"]},{"id":"estandarte","sprite":"flag","rect":[2645,171,266,636],"urls":["img/4e1cca28dda0d07a.webp"]},{"id":"gato","sprite":"cat","rect":[1392,1523,196,116.43],"urls":["img/c13a125c0af30c29.webp","img/ac55cb553bb902be.webp"]}],{flag:()=>standardCel,cat:()=>[lastCatBody,lastCatTail],sign:()=>signBoard.style.transform,running:()=>playing&&!document.hidden});(setupCourtyardNavigation)([{"id":"taberna","name":"La taberna","detail":"Actividad y cotilleos de la hermandad","href":"../#/archivo/activity","centre":[430,1120],"box":[200,500,440,1400],"shape":"M266 717 Q356 554 482 735 Q552 880 548 1084 L559 1843 L443 1861 L420 1741 L425 1640 L380 1580 L365 1480 L291 1508 L258 1430 Z","mask":"M132 184 Q155 155 174 182 C260 217 307 311 312 425 L311 498 L300 700 L289 900 L280 1100 L278 1369 L233 1383 L222 1322 L234 1281 L226 1244 L210 1223 L195 1207 L178 1179 L187 1153 L209 1140 L219 1120 L208 1104 L180 1082 L149 1065 L109 1073 L73 1032 L77 799 L86 602 L94 430 L116 280 Z"},{"id":"cartel","name":"La taberna","detail":"Actividad y cotilleos de la hermandad","href":"../#/archivo/activity","centre":[910,500],"sprite":"sign-board","menu":false,"shape":"M681 546 L686 373 Q700 355 713 351 Q755 349 784 333 Q807 300 847 294 Q897 277 961 295 Q1011 309 1043 330 Q1074 348 1075 374 L1129 421 L1129 626 Q1087 651 1052 703 Q966 733 863 707 Q815 696 756 659 Q737 605 681 550 Z"},{"id":"cuartel","name":"La hermandad","detail":"Miembros y fichas de personaje","href":"../#/archivo/overview","centre":[971,1215],"box":[810,970,300,490],"shape":"M863 1083 Q951 980 1059 1072 L1066 1412 L861 1420 Z","mask":"M53 81 C114 26 163 32 219 72 Q233 86 242 105 L244 432 L56 442 L52 322 L51 133 Z"},{"id":"heraldo","name":"El Heraldo","detail":"Noticias, hazañas, altas y bajas","href":"../#/archivo/news","centre":[2225,1120],"box":[1940,780,560,550],"shape":"M1965 1007 L2215 802 L2477 1004 L2442 1039 L2406 1031 L2408 1269 L2352 1301 L2341 1275 L2092 1281 L2074 1304 L2050 1280 L2029 1027 L1998 1044 Z","mask":"M17 237 L52 213 L60 191 L85 175 L79 161 L125 132 L118 119 L160 96 L153 87 L204 46 L211 32 Q227 17 244 22 L280 34 L322 54 L348 58 L346 66 L380 78 L412 96 L428 99 L426 107 L470 126 L477 132 L480 141 L519 156 L523 165 L560 204 L557 217 L527 224 L519 236 L480 244 L478 282 L484 301 L482 451 L454 467 L447 485 L433 489 L425 470 L408 473 L413 496 L400 501 L389 490 L379 494 L371 479 L167 478 L165 499 L152 501 L150 486 L138 486 L138 539 L106 537 L114 423 L119 312 L104 294 L93 263 L61 260 L54 249 L37 253 Z"},{"id":"entrenamiento","name":"Cara a cara","detail":"Compara a dos personajes","href":"../#/archivo/compare","centre":[1485,1240],"box":[1400,1160,150,190],"shape":"M1529 1228 A43 43 0 1 1 1443 1228 A43 43 0 1 1 1529 1228 M1475 1267 L1455 1320 L1462 1323 L1485 1272 L1508 1324 L1516 1320 L1495 1267 Z","hit":"M1418 1163 H1554 V1342 H1418 Z","mask":"M124 80 A41 40 0 1 1 42 80 A41 40 0 1 1 124 80 M65 113 L45 151 L54 154 L73 117 Z M94 117 L115 154 L124 152 L109 114 Z"},{"id":"progreso","name":"Progreso","detail":"La carrera de La Ganga hacia el nivel 60","href":"../#/archivo/race","centre":[1960,487],"box":[1760,335,375,275],"shape":"M1791 377 L1850 359 L1876 377 L2045 363 L2105 387 L2097 553 L2051 581 L1830 586 L1791 570 Z","mask":"M10 45 L20 41 L31 48 L40 48 L50 52 L63 52 L77 55 L98 60 L103 62 L269 47 L273 42 L304 32 L309 27 L320 24 L324 21 L334 23 L344 17 L347 209 L332 215 L302 222 L278 229 L272 233 L98 244 L87 241 L68 237 L43 234 L27 231 L11 228 Z"},{"id":"fama","name":"Salón de la fama","detail":"Trofeos y hazañas de la hermandad","href":"../#/archivo/awards","centre":[3440,341],"box":[3170,0,560,640],"shape":"M3218 258 Q3232 113 3444 46 Q3609 79 3681 189 L3688 499 L3219 608 Z","mask":"M101 282 C110 222 161 145 209 95 Q264 44 295 35 Q369 53 427 102 L440 142 L454 176 L481 216 L500 254 L504 426 L485 439 L487 474 L456 482 L366 527 L328 545 L296 565 L111 586 L105 512 Z"},{"id":"galeria","name":"Galería","detail":"Las ilustraciones y recuerdos de La Ganga","href":"../#/archivo/gallery","centre":[3540,1350],"box":[3250,780,580,1150],"shape":"M3300 1110 Q3357 1043 3454 1031 Q3604 1014 3780 1100 L3786 1816 L3308 1890 Z M3380 875 Q3471 800 3590 801 Q3714 807 3781 899 L3775 976 Q3569 963 3410 1026 Z","hit":"M3300 1110 Q3357 1043 3454 1031 Q3604 1014 3780 1100 L3786 1816 L3308 1890 Z M3380 875 Q3471 800 3590 801 Q3714 807 3781 899 L3775 976 Q3569 963 3410 1026 Z","mask":"M40 383 Q87 314 149 284 L177 279 L196 283 L199 439 L202 619 L222 679 L228 722 L222 746 L209 754 L210 1066 L198 1074 L169 1076 L48 1013 L39 1012 L35 918 L46 916 L46 883 L35 877 L35 838 L40 831 L40 527 L32 525 L33 477 L42 476 Z M172 139 C165 105 179 79 197 57 C226 29 267 14 297 15 C322 13 339 31 343 53 C347 75 320 90 325 108 C350 127 347 159 317 177 C285 201 252 205 218 193 C196 184 185 170 179 155 Z M193 169 L391 10 Q407 -1 412 4 L402 33 L229 186 Z"},{"id":"hoguera","name":"Portada","detail":"Las últimas noticias y el cuadro de honor","href":"../#/","centre":[1989,1632],"box":[1650,1490,600,250],"shape":"M1703 1589 Q1718 1528 1812 1532 L1850 1467 L1916 1439 L1987 1511 Q2080 1501 2148 1551 Q2241 1606 2169 1662 Q1958 1758 1765 1676 Z","mask":"M52 100 L60 80 L80 75 L88 59 L109 55 L124 65 L146 29 L174 25 L189 37 L218 22 L246 35 L271 23 L296 15 L309 29 L327 23 L352 35 L368 29 L396 39 L423 27 L441 33 L460 58 L476 55 L497 70 L519 70 L538 88 L554 94 L567 126 L559 143 L535 153 L516 168 L481 176 L447 173 L416 187 L385 183 L369 190 L337 188 L316 194 L287 188 L263 195 L234 186 L217 190 L186 179 L165 186 L140 175 L120 181 L103 163 L83 167 L70 148 L56 135 Z"},{"id":"estandarte","name":"Composición de la hermandad","detail":"Clases y razas bajo un mismo estandarte","href":"../#/archivo/composicion","centre":[2775,475],"sprite":"standard","shape":"M2660 178 L2855 216 L2912 796 L2833 722 L2813 805 L2748 707 L2717 784 L2662 681 Z"},{"id":"gato","name":"Mascotas y monturas","detail":"Los compañeros de viaje de La Ganga","href":"../#/archivo/collections","centre":[1490,1577],"sprite":"sleeping-cat","shape":"M1400 1520 Q1470 1498 1530 1530 L1597 1586 L1592 1650 L1546 1650 L1517 1611 L1395 1601 Z"}],scene,stage,pick,layoutPan,navigationGlow);
const windowFrames=config.fotogramas*2;
const cloudFrames=windowFrames*3;
const playbackFrames=cloudFrames*3;
function drawLighting(frame){
  drawWindows(current%windowFrames);
  setTorchLight(frame);
  if(!showCampfire)return;
  if(!fireLoaded)return;
  const size=bloomCanvas.width;
  bloomCtx.clearRect(0,0,size,size);
  bloomCtx.drawImage(bloomSheet,(frame%config.columnas)*size,Math.floor(frame/config.columnas)*size,size,size,0,0,size,size);
  surface.style.opacity=lightConfig.opacidad[frame];
}
function draw(step,continuousStep=step){
  drawStandard(continuousStep);
  if(step===current){scene.paintNavigation?.(continuousStep/config.fps);return;}
  current=step;
  drawAtmosphere(step);drawSign(step);drawSky(step);
  const frame=step%config.fotogramas;
  drawTorches(frame);
  if(!get('stage').classList.contains('lights-off'))drawLighting(frame);
  if(!showCampfire){canvas.dataset.frame=String(frame);scene.paintNavigation?.(continuousStep/config.fps);return}
  if(!fireLoaded){scene.paintNavigation?.(continuousStep/config.fps);return;}
  ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(sheet,(frame%config.columnas)*canvas.width,Math.floor(frame/config.columnas)*canvas.height,canvas.width,canvas.height,0,0,canvas.width,canvas.height);
  canvas.dataset.frame=String(frame);
  scene.paintNavigation?.(continuousStep/config.fps);
}
function tick(now){
  animation=0;
  if(!ready||!playing||document.hidden)return;
  if(previous!==null)elapsed=(elapsed+now-previous)%(playbackFrames*1000/config.fps);
  previous=now;
  const step=elapsed*config.fps/1000;
  draw(Math.floor(step),step);
  animation=requestAnimationFrame(tick);
}
function sync(){cancelAnimationFrame(animation);animation=0;previous=null;get('lighting').disabled=!ready;get('toggle').disabled=!ready;get('advance').disabled=!ready||playing;get('toggle').textContent=playing?'Pausar':'Reproducir';scene.syncNavigation?.(playing&&!document.hidden);if(ready&&playing&&!document.hidden)animation=requestAnimationFrame(tick)}
get('lighting').onclick=()=>{
  const off=get('stage').classList.toggle('lights-off');
  get('lighting').setAttribute('aria-pressed',String(!off));
  if(!off && ready)drawLighting(current%config.fotogramas);
};
get('toggle').onclick=()=>{playing=!playing;sync()};get('advance').onclick=()=>{const n=(current+1)%playbackFrames;elapsed=n*1000/config.fps+.001;draw(n)};if(get('zoom'))get('zoom').onclick=()=>{const on=get('scene').classList.toggle('detail');get('zoom').setAttribute('aria-pressed',String(on));get('zoom').textContent=on?'Ver el patio':'Acercar hoguera'};reduce.addEventListener('change',()=>{playing=!reduce.matches;sync()});document.addEventListener('visibilitychange',sync);
if(get('zoom')&&location.hash==='#detalle')get('zoom').click();
let fireLoaded=false;
addLayer(()=>showCampfire,async()=>{
  surface.src=surface.dataset.src;
  [sheet,bloomSheet]=await Promise.all([loadSprite('img/edaf420421549b1b.webp'),loadSprite('img/d3ac17cbbd2afc61.webp'),surface.decode()]);
  canvas.width=sheet.width/config.columnas;canvas.height=sheet.height/config.filas;
  bloomCanvas.width=bloomSheet.width/config.columnas;bloomCanvas.height=bloomSheet.height/config.filas;
  fireLoaded=true;
},true);
async function decodePlate(){
  const plate=get('plate');
  // A resize or a direct detail link can replace a srcset request mid-decode.
  for(;;){
    const selected=plate.currentSrc, sizes=plate.sizes;
    try{await plate.decode();return}catch(error){
      if(selected===plate.currentSrc && sizes===plate.sizes)throw error;
    }
  }
}
decodePlate().then(()=>{
  ready=true;draw(0);sync();window.dispatchEvent(new Event('patio-ready'));get('message').textContent='';scheduleLayers();
}).catch(()=>{get('message').textContent='No se pudo cargar el patio. Puedes volver a la portada.'});
