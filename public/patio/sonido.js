(() => {
  const button=document.getElementById('sound'),volume=document.getElementById('ambient-volume');
  const key='la-ganga:sonido-patio';
  let saved;try{saved=JSON.parse(localStorage.getItem(key))}catch{}
  let enabled=saved?.enabled!==false;
  volume.value=typeof saved?.volume==='number'&&Number.isFinite(saved.volume)?Math.min(100,Math.max(0,saved.volume)):25;
  let context,master,voices,pan,ambientBuffers,ambientLoading,doorBuffer,doorLoading,doorSource,doorWindow;
  let entered=false,departed=false,revision=0;
  const sources=[];
  const level=()=>Number(volume.value)/100;
  const wanted=()=>enabled&&level()>0&&!document.hidden&&!departed;
  function save(){try{localStorage.setItem(key,JSON.stringify({enabled,volume:Number(volume.value)}))}catch{}}
  function show(){
    const audible=wanted()&&context?.state==='running';
    const label=audible?'Silenciar':'Activar';
    button.setAttribute('aria-pressed',String(audible));
    button.setAttribute('aria-label',label+' sonido del patio');button.title=label+' sonido del patio';
    document.getElementById('sound-label').textContent=label;
    document.getElementById('volume-value').textContent=volume.value+' %';
    volume.setAttribute('aria-valuetext',volume.value+' por ciento');
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
    voices=context.createGain();pan=context.createStereoPanner();voices.connect(pan);pan.connect(master);
    context.addEventListener('statechange',()=>{show();if(context.state==='running'&&wanted())playReady()});
    placeTavern();
  }
  function fade(value,seconds){
    if(!context)return;
    const now=context.currentTime;
    master.gain.cancelAndHoldAtTime(now);master.gain.linearRampToValueAtTime(value,now+seconds);
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
      ambientBuffers=buffers;return buffers;
    }).catch(error=>{ambientLoading=null;throw error});
    return ambientLoading;
  }
  function loadDoor(){
    if(doorBuffer)return Promise.resolve(doorBuffer);
    if(!doorLoading)doorLoading=decode('audio/puerta-abrir-v1.ogg').then(buffer=>doorBuffer=buffer).catch(error=>{doorLoading=null;throw error});
    return doorLoading;
  }
  function playDoor(){
    const opening=doorWindow;
    if(!opening||opening.played||!doorBuffer||!wanted()||context.state!=='running')return;
    const offset=(performance.now()-opening.at)/1000;
    if(offset>=doorBuffer.duration)return; // Never play an opening after it ended.
    opening.played=true;
    const source=context.createBufferSource(),gain=context.createGain();
    source.buffer=doorBuffer;source.connect(gain);gain.connect(master);
    gain.gain.setValueAtTime(0,context.currentTime);
    gain.gain.linearRampToValueAtTime(1,context.currentTime+.025);
    doorSource={source,gain};
    source.onended=()=>{source.disconnect();gain.disconnect();if(doorSource?.source===source)doorSource=null};
    source.start(0,Math.max(0,offset));
  }
  function stopDoor(){
    doorWindow=null;
    if(!doorSource)return;
    const {source,gain}=doorSource;doorSource=null;
    gain.gain.cancelAndHoldAtTime(context.currentTime);gain.gain.linearRampToValueAtTime(0,context.currentTime+.04);
    try{source.stop(context.currentTime+.05)}catch{}
  }
  function playReady(){
    if(!wanted()||context?.state!=='running')return;
    fade(level(),.12);show();playDoor();
    if(!entered||sources.length)return;
    loadAmbience().then(buffers=>{
      if(!wanted()||context.state!=='running'||!entered||sources.length)return;
      const when=context.currentTime+.025;
      buffers.forEach((buffer,i)=>{
        const source=context.createBufferSource();source.buffer=buffer;source.loop=true;
        source.loopStart=Math.round(.045*buffer.sampleRate)/buffer.sampleRate;source.loopEnd=buffer.duration;
        source.connect(i===0?master:voices);source.start(when,source.loopStart);sources.push(source);
      });
    }).catch(()=>{document.getElementById('message').textContent='No se ha podido cargar el ambiente. Puedes volver a activar el sonido.'});
  }
  function sync(){
    const turn=++revision;
    if(!wanted()){
      fade(0,.12);
      if(context?.state==='running')setTimeout(()=>{if(turn===revision)context.suspend().catch(()=>{})},150);
      show();return;
    }
    try{
      ensureContext();
      // Called directly during a gesture too, before any fetch/await.
      context.resume().then(()=>{if(turn===revision)playReady()}).catch(()=>{show()});
      playReady();show();
    }catch{show()}
  }
  window.patioSound={
    prepareDoor(){if(wanted()){try{ensureContext();loadDoor().catch(()=>{})}catch{}}},
    openDoor(){
      if(!enabled||level()===0)return;
      doorWindow={at:performance.now(),played:false};sync();
      if(context)loadDoor().then(playDoor).catch(()=>{});
    },
    stopDoor
  };
  button.addEventListener('click',()=>{
    enabled=!(enabled&&level()>0&&context?.state==='running');
    if(enabled&&level()===0)volume.value=25;
    save();sync();
  });
  volume.addEventListener('input',()=>{if(level()>0)enabled=true;save();sync()});
  function unlock(event){
    if(!wanted()||context?.state==='running'||event.target.closest?.('.sound-controls'))return;
    sync();
  }
  document.addEventListener('pointerdown',unlock,{capture:true,passive:true});
  document.addEventListener('keydown',unlock,{capture:true});
  window.addEventListener('patio-opened',()=>{entered=true;departed=false;sync()});
  document.addEventListener('patio-departure',()=>{departed=true;stopDoor();sync()});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopDoor();sync()});
  window.addEventListener('pagehide',()=>{stopDoor();fade(0,0);context?.suspend().catch(()=>{})});
  document.getElementById('scene').addEventListener('patio-view',placeTavern);
  show();sync();
})();
