/* Recorded CC0 foley; sources and edits are in design/patio/audio.
   Residents share the courtyard's audio context, volume and sprite clock. */
function createCourtyardFoley({getContext,getOutput,canPlay}){
 const recordings={
  snore:['roman-ronquido-a-v1.ogg','roman-ronquido-b-v1.ogg'],
  pop:['pompa-pop-v1.ogg'],startle:['roman-susto-v1.ogg'],
  page:['naisen-pagina-a-v1.ogg','naisen-pagina-b-v1.ogg'],
  wipe:['vincie-pano-a-v1.ogg','vincie-pano-b-v1.ogg']
 };
 const levels={snore:.46,pop:.88,startle:.74,page:.58,wipe:.13};
 const buffers=new Map(),pending=new Map(),attempted=new Map(),failed=new Set(),live=new Set();
 const counts={snore:0,pop:0,startle:0,page:0,wipe:0},variants={...counts};
 let bus,context,previous;
 const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
 function load(file){
  if(buffers.has(file)||pending.has(file)||(attempted.has(file)&&performance.now()-attempted.get(file)<15000))return;
  attempted.set(file,performance.now());
  const controller=new AbortController();let timer;
  const promise=Promise.race([
   (async()=>{const response=await fetch('audio/'+file,{signal:controller.signal});if(!response.ok)throw Error('Audio '+response.status);return context.decodeAudioData(await response.arrayBuffer())})(),
   new Promise((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('Foley timeout'))},8000)})
  ]).then(buffer=>{buffers.set(file,buffer);failed.delete(file)})
   .catch(()=>{failed.add(file)})
   .finally(()=>{clearTimeout(timer);pending.delete(file)});
  pending.set(file,promise);
 }
 function prepare(){
  context=getContext();if(!context)return;
  if(!bus){
   const high=context.createBiquadFilter(),low=context.createBiquadFilter(),pan=context.createStereoPanner(),gain=context.createGain();
   high.type='highpass';high.frequency.value=65;high.Q.value=.5;
   low.type='lowpass';low.frequency.value=3600;low.Q.value=.5;gain.gain.value=.92;
   high.connect(low);low.connect(pan);pan.connect(gain);gain.connect(getOutput());bus={input:high,pan,gain};
  }
  for(const file of Object.values(recordings).flat())load(file);
 }
 function place(){
  const rect=document.getElementById('stage').getBoundingClientRect(),scene=document.getElementById('scene').getBoundingClientRect();
  const x=rect.left+rect.width*(previous?.id==='naisen'?2338:2400)/3840;
  const distance=(x-scene.left-scene.width/2)/(scene.width/2);
  bus.pan.pan.setTargetAtTime(clamp(distance*.48,-.65,.65),context.currentTime,.08);
  bus.gain.gain.setTargetAtTime(.92/(1+Math.max(0,Math.abs(distance)-.45)*.55),context.currentTime,.08);
 }
 function play(kind,delay=0){
  if(!canPlay())return;prepare();if(!bus||context.state!=='running')return;
  const files=recordings[kind],buffer=buffers.get(files[variants[kind]%files.length]);
  // An optional download never blocks the gate or plays a gesture late.
  if(!buffer)return;
  place();variants[kind]++;
  const source=context.createBufferSource(),gain=context.createGain();
  source.buffer=buffer;source.connect(gain);gain.connect(bus.input);gain.gain.value=levels[kind];
  const voice={source,gain,kind};live.add(voice);counts[kind]++;
  source.onended=()=>{source.disconnect();gain.disconnect();live.delete(voice)};
  source.start(context.currentTime+delay);
 }
 function stopKind(kind){
  for(const voice of live)if(voice.kind===kind){
   voice.gain.gain.cancelScheduledValues(context.currentTime);
   voice.gain.gain.setValueAtTime(voice.gain.gain.value,context.currentTime);
   voice.gain.gain.linearRampToValueAtTime(0,context.currentTime+.025);
   try{voice.source.stop(context.currentTime+.03)}catch{}
  }
 }
 function stop(){
  previous=null;
  for(const voice of live){try{voice.source.stop()}catch{}voice.source.disconnect();voice.gain.disconnect()}
  live.clear();
 }
 function tick(id,data){
  if(!id||!data||!canPlay()){if(previous||live.size)stop();return}
  const now={id,time:Number(data.time),action:data.action,frame:Number(data.frame),phase:Number(data.breathPhase)};
  if(!Number.isFinite(now.time))return;
  const before=previous;
  if(before?.id!==id){stop();previous=now;return}
  previous=now;const dt=now.time-before.time;
  // Ignore repeated frames, scrubbing and jumps after a suspended tab.
  if(dt<=0||dt>.5)return;
  if(id==='roman'){
   if(before.action==='dormido'&&now.action==='sobresalto'){stopKind('snore');play('pop');play('startle',.10)}
   else if(now.action==='dormido'&&before.action==='dormido'&&before.phase<.17&&now.phase>=.17)play('snore');
  }else if(id==='naisen'){
   if(now.action==='page'&&now.frame>=3&&now.frame<10&&(before.action!=='page'||before.frame<3))play('page');
  }else if(id==='vincie'){
   if(now.action!=='polish'&&before.action==='polish')stopKind('wipe');
   if(now.action==='polish'&&before.action==='polish'&&((before.frame<2&&now.frame>=2&&now.frame<8)||(before.frame<9&&now.frame>=9)))play('wipe');
  }
 }
 function warm(){if(!document.hidden&&getContext())prepare()}
 window.addEventListener('patio-audio-state',warm);
 window.addEventListener('patio-opened',warm);
 window.addEventListener('patio-resident-change',stop);
 document.addEventListener('patio-departure',stop);
 document.addEventListener('visibilitychange',()=>{if(document.hidden)stop()});
 window.addEventListener('pagehide',stop);
 matchMedia('(prefers-reduced-motion: reduce)').addEventListener('change',stop);
 document.getElementById('sound').addEventListener('click',stop);
 document.getElementById('ambient-volume').addEventListener('input',stop);
 return{tick,stop,diagnostics:()=>({counts:{...counts},active:live.size,cached:buffers.size,pending:pending.size,failed:[...failed]})};
}
