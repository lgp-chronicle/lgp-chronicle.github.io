(() => {
  const button=document.getElementById('sound'),volume=document.getElementById('ambient-volume');
  const key='la-ganga:sonido-patio';
  let saved;try{saved=JSON.parse(localStorage.getItem(key))}catch{}
  let enabled=saved?.enabled!==false;
  volume.value=typeof saved?.volume==='number'&&Number.isFinite(saved.volume)?Math.min(100,Math.max(0,saved.volume)):25;
  let context,master,ambientGain,voices,pan,ambientBuffers,ambientLoading,ambientError;
  let doorSource,doorWindow,armed=false,departed=false,revision=0,audibleAt=Infinity,readyTimer,lastState;
  const sources=[],effects=new Map(),pendingEffects=new Map();
  const level=()=>Number(volume.value)/100;
  const wanted=()=>enabled&&level()>0&&!document.hidden;
  function save(){try{localStorage.setItem(key,JSON.stringify({enabled,volume:Number(volume.value)}))}catch{}}
  function entranceState(){
    if(!enabled||level()===0)return 'muted';
    if(ambientError)return 'error';
    if(!ambientBuffers)return 'loading';
    if(!armed)return 'prepared';
    if(context?.state!=='running')return 'blocked';
    return sources.length===2&&context.currentTime>=audibleAt?'ready':'starting';
  }
  function announce(){
    const state=entranceState();
    if(state!==lastState){lastState=state;window.dispatchEvent(new CustomEvent('patio-audio-state',{detail:{state}}))}
  }
  function show(){
    const audible=wanted()&&context?.state==='running';
    const label=audible?'Silenciar':'Activar';
    button.setAttribute('aria-pressed',String(audible));
    button.setAttribute('aria-label',label+' sonido del patio');button.title=label+' sonido del patio';
    document.getElementById('sound-label').textContent=label;
    document.getElementById('volume-value').textContent=volume.value+' %';
    volume.setAttribute('aria-valuetext',volume.value+' por ciento');announce();
  }
  function placeTavern(){
    if(!pan)return;
    const stage=document.getElementById('stage').getBoundingClientRect(),scene=document.getElementById('scene').getBoundingClientRect();
    const centre=(scene.left+scene.width/2-stage.left)/stage.width,distance=centre-.07;
    pan.pan.setTargetAtTime(.42*Math.tanh(-distance*stage.width/(scene.width/2)),context.currentTime,.22);
    voices.gain.setTargetAtTime(.94-.16*Math.min(1,Math.abs(distance)/.6),context.currentTime,.22);
  }
  function ensureContext(){
    if(context)return;
    context=new AudioContext();
    master=context.createGain();master.gain.value=0;master.connect(context.destination);
    ambientGain=context.createGain();ambientGain.connect(master);
    voices=context.createGain();pan=context.createStereoPanner();voices.connect(pan);pan.connect(ambientGain);
    context.addEventListener('statechange',()=>{if(context.state==='running'&&wanted())playReady();show()});placeTavern();
  }
  function ramp(gain,value,seconds){
    if(!context||!gain)return;
    const now=context.currentTime;gain.cancelAndHoldAtTime(now);gain.linearRampToValueAtTime(value,now+seconds);
  }
  async function decode(url){
    const response=await fetch(url);
    if(!response.ok)throw Error('Audio '+response.status);
    return context.decodeAudioData(await response.arrayBuffer());
  }
  function loadAmbience(){
    if(ambientBuffers)return Promise.resolve(ambientBuffers);
    if(!ambientLoading)ambientLoading=Promise.all([
      decode('audio/9339eec5bfcc320a.ogg'),decode('audio/1181642b1d043783.ogg')
    ]).then(buffers=>{
      for(const buffer of buffers){
        const join=Math.round(.045*buffer.sampleRate);
        for(let ch=0;ch<buffer.numberOfChannels;ch++){
          const pcm=buffer.getChannelData(ch),last=pcm.length-join;
          for(let j=0;j<join;j++){const t=j/(join-1);pcm[last+j]+=(pcm[j]-pcm[last+j])*t*t*(3-2*t)}
        }
      }
      ambientBuffers=buffers;ambientError=null;playReady();announce();return buffers;
    }).catch(error=>{ambientLoading=null;ambientError=error;announce();throw error});
    return ambientLoading;
  }
  function loadDoor(kind){
    if(effects.has(kind))return Promise.resolve(effects.get(kind));
    if(!pendingEffects.has(kind))pendingEffects.set(kind,decode('audio/puerta-'+(kind==='open'?'abrir':'cerrar')+'-v1.ogg')
      .then(buffer=>{effects.set(kind,buffer);return buffer}).catch(error=>{pendingEffects.delete(kind);throw error}));
    return pendingEffects.get(kind);
  }
  function playDoor(){
    const movement=doorWindow,buffer=effects.get(movement?.kind);
    if(!movement||movement.played||!buffer||!wanted()||context.state!=='running')return;
    const offset=(performance.now()-movement.at)/1000;
    if(offset>=buffer.duration)return;
    movement.played=true;
    const source=context.createBufferSource(),gain=context.createGain();
    source.buffer=buffer;source.connect(gain);gain.connect(master);
    gain.gain.setValueAtTime(0,context.currentTime);gain.gain.linearRampToValueAtTime(1,context.currentTime+.025);
    doorSource={source,gain};
    source.onended=()=>{source.disconnect();gain.disconnect();if(doorSource?.source===source)doorSource=null};
    source.start(0,Math.max(0,offset));
  }
  function stopDoor(){
    doorWindow=null;if(!doorSource)return;
    const {source,gain}=doorSource;doorSource=null;
    ramp(gain.gain,0,.04);try{source.stop(context.currentTime+.05)}catch{}
  }
  function startDoor(kind){
    stopDoor();if(!enabled||level()===0)return;
    doorWindow={kind,at:performance.now(),played:false};sync();
    if(context)loadDoor(kind).then(playDoor).catch(()=>{});
  }
  function checkAudible(){
    clearTimeout(readyTimer);
    if(!wanted()||context?.state!=='running'||!sources.length)return;
    if(context.currentTime<audibleAt){readyTimer=setTimeout(checkAudible,40);return}announce();
  }
  function playReady(){
    if(!wanted()||context?.state!=='running')return;
    ramp(master.gain,level(),.12);playDoor();
    if(armed&&!departed&&ambientBuffers){
      ramp(ambientGain.gain,1,.12);
      if(!sources.length){
        const when=context.currentTime+.025;audibleAt=when+.12;
        ambientBuffers.forEach((buffer,i)=>{
          const source=context.createBufferSource();source.buffer=buffer;source.loop=true;
          source.loopStart=Math.round(.045*buffer.sampleRate)/buffer.sampleRate;source.loopEnd=buffer.duration;
          source.connect(i===0?ambientGain:voices);source.start(when,source.loopStart);sources.push(source);
        });
      }
      checkAudible();
    }
  }
  function sync(){
    const turn=++revision;
    if(!wanted()){
      ramp(master?.gain,0,.12);clearTimeout(readyTimer);
      if(context?.state==='running')setTimeout(()=>{if(turn===revision)context.suspend().catch(()=>{})},150);
      show();return;
    }
    try{
      ensureContext();
      // Resume during the gesture, before any fetch/await.
      context.resume().then(()=>{if(turn===revision){playReady();show()}}).catch(()=>{show()});
      playReady();show();
    }catch(error){ambientError=error;show()}
  }
  function prepareEntrance(withDoor=false){
    if(!enabled||level()===0){announce();return}
    try{
      ensureContext();ambientError=null;sync();loadAmbience().catch(()=>{});
      if(withDoor)loadDoor('open').catch(()=>{});
    }catch(error){ambientError=error;announce()}
  }
  window.patioSound={
    prepareEntrance,
    beginEntrance(){armed=true;sync()},entranceState,
    unlockEntrance(){prepareEntrance();sync()},
    enterSilently(){enabled=false;save();sync()},
    prepareClose(){if(enabled&&level()>0){try{ensureContext();loadDoor('close').catch(()=>{})}catch{}}},
    openDoor(){startDoor('open')},closeDoor(){startDoor('close')},stopDoor
  };
  button.addEventListener('click',()=>{
    enabled=!(enabled&&level()>0&&context?.state==='running');
    if(enabled&&level()===0)volume.value=25;
    save();prepareEntrance();sync();
  });
  volume.addEventListener('input',()=>{if(level()>0)enabled=true;save();prepareEntrance();sync()});
  function unlock(event){
    if(!wanted()||context?.state==='running'||event.target.closest?.('.sound-controls'))return;sync();
  }
  document.addEventListener('pointerdown',unlock,{capture:true,passive:true});
  document.addEventListener('keydown',unlock,{capture:true});
  window.addEventListener('patio-opened',()=>{armed=true;departed=false;sync()});
  document.addEventListener('patio-departure',()=>{departed=true;stopDoor();ramp(ambientGain?.gain,0,.3)});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopDoor();sync()});
  window.addEventListener('pagehide',()=>{stopDoor();clearTimeout(readyTimer);ramp(master?.gain,0,0);context?.suspend().catch(()=>{})});
  document.getElementById('scene').addEventListener('patio-view',placeTavern);show();
})();
