(() => {
  const gate=document.getElementById('fortress-gate'),movie=document.getElementById('gate-film'),fallback=document.getElementById('gate-fallback');
  const skip=document.getElementById('skip-gate'),main=document.querySelector('main');
  const status=document.getElementById('gate-status'),progress=document.getElementById('gate-progress');
  const enterButton=document.getElementById('enter-patio'),silentButton=document.getElementById('enter-silent'),retryButton=document.getElementById('retry-patio');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),saveData=navigator.connection?.saveData===true;
  const webm=Boolean(movie.canPlayType('video/webm; codecs="vp9"'));
  let opened=false,leaving=false,skipMotion=reduced.matches||saveData,timer,revision=0,movieURL,preloadTimer;
  let sceneReady=false,sceneError=false,sceneProgress=0,filmReady=false,audioArmed=false,entryFormat=webm?'webm':'webp';
  let updateQueued=false,audioWaitTimer,audioWaitExpired=false;
  main.inert=true;main.setAttribute('aria-busy','true');
  const cache=new Map();
  function asset(name){
    if(!cache.has(name))cache.set(name,fetch(name).then(r=>{if(!r.ok)throw Error('Transition unavailable');return r.blob()})
      .catch(error=>{cache.delete(name);throw error}));
    return cache.get(name);
  }
  function updateSoon(){if(!updateQueued){updateQueued=true;queueMicrotask(()=>{updateQueued=false;updateEntrance()})}}
  function updateEntrance(){
    if(opened||leaving)return;
    if(sceneReady&&filmReady&&!audioArmed){audioArmed=true;window.patioSound?.beginEntrance()}
    const sound=window.patioSound?.entranceState()||'error';
    const soundReady=sound==='ready'||sound==='muted';
    const waitingForSound=sceneReady&&filmReady&&!soundReady&&sound!=='blocked'&&sound!=='error';
    if(waitingForSound&&!audioWaitTimer&&!audioWaitExpired&&!document.hidden){
      audioWaitTimer=setTimeout(()=>{audioWaitTimer=null;audioWaitExpired=true;updateSoon()},8000);
    }else if(!waitingForSound||document.hidden){clearTimeout(audioWaitTimer);audioWaitTimer=null;audioWaitExpired=false}
    const value=Math.round(sceneProgress*80+(filmReady?10:0)+(soundReady?10:['prepared','blocked','starting'].includes(sound)?5:0));
    progress.style.setProperty('--loaded',value+'%');progress.setAttribute('aria-valuenow',String(value));
    enterButton.hidden=!(sceneReady&&filmReady&&sound==='blocked');
    silentButton.hidden=!(sceneReady&&filmReady&&!soundReady);
    retryButton.hidden=!(sceneError||sound==='error'||audioWaitExpired);
    gate.classList.toggle('needs-gesture',!enterButton.hidden);
    if(sceneError)status.textContent='Falta una parte del patio. Puedes reintentar la carga.';
    else if(!sceneReady)status.textContent='Preparando el patio y encendiendo sus luces…';
    else if(!filmReady)status.textContent='Preparando el portón…';
    else if(sound==='error')status.textContent='No se ha podido iniciar el sonido. Puedes reintentar o entrar sin él.';
    else if(sound==='blocked')status.textContent='El patio está listo. Entra para activar su sonido.';
    else if(audioWaitExpired)status.textContent='El sonido está tardando en arrancar. Puedes reintentar o entrar sin él.';
    else if(!soundReady)status.textContent='Escuchando la vida al otro lado…';
    else status.textContent='Bienvenido a La Ganga';
    if(sceneReady&&filmReady&&soundReady&&!document.hidden)enter();
  }
  async function prepareFilm(){
    if(skipMotion){filmReady=true;updateSoon();return}
    try{
      const blob=await asset('puerta-v4-entrada.'+entryFormat);
      if(leaving||skipMotion||opened)return;
      if(entryFormat==='webm'){
        movieURL=URL.createObjectURL(blob);movie.src=movieURL;
        await new Promise((resolve,reject)=>{
          const timeout=setTimeout(()=>finish(Error('Door decode timeout')),12000);
          const finish=error=>{clearTimeout(timeout);movie.removeEventListener('canplay',ok);movie.removeEventListener('error',bad);error?reject(error):resolve()};
          const ok=()=>finish(),bad=()=>finish(Error('Door decode failed'));
          movie.addEventListener('canplay',ok,{once:true});movie.addEventListener('error',bad,{once:true});movie.load();
          if(movie.readyState>=3)finish();
        });
      }
    }catch{
      if(leaving||skipMotion||opened)return;
      if(entryFormat==='webm'){
        try{await asset('puerta-v4-entrada.webp');entryFormat='webp'}catch{skipMotion=true}
      }else skipMotion=true;
    }
    filmReady=true;updateSoon();
  }
  function finishOpening(){
    window.patioSound?.stopDoor();revision++;clearTimeout(timer);movie.pause();
    gate.hidden=true;gate.setAttribute('aria-hidden','true');
    main.inert=false;main.removeAttribute('aria-busy');window.dispatchEvent(new Event('patio-opened'));
    if(gate.contains(document.activeElement))document.getElementById('scene').focus({preventScroll:true});
    if(movieURL){URL.revokeObjectURL(movieURL);movieURL=null}movie.removeAttribute('src');movie.load();
    clearTimeout(preloadTimer);
    if(!reduced.matches&&!saveData)preloadTimer=setTimeout(()=>{
      const preload=()=>{if(!leaving&&!document.hidden){asset('puerta-v4-salida.'+(webm?'webm':'webp')).catch(()=>{});window.patioSound?.prepareClose()}};
      if('requestIdleCallback' in window)requestIdleCallback(preload,{timeout:4000});else preload();
    },1200);
  }
  async function playFilm(exit,done){
    const turn=++revision,duration=exit?800:2000;
    clearTimeout(timer);fallback.hidden=true;movie.hidden=false;
    timer=setTimeout(done,exit?2400:8000);gate.hidden=false;gate.removeAttribute('aria-hidden');
    if(exit){gate.classList.add('is-open','is-leaving');movie.poster=''}
    const started=()=>{
      if(turn!==revision)return;
      gate.classList.toggle('is-open',!exit);gate.classList.add('is-opening');
      if(exit)window.patioSound?.closeDoor();else window.patioSound?.openDoor();
      clearTimeout(timer);timer=setTimeout(done,duration+1200);
    };
    const ended=()=>{if(turn===revision)done()};
    try{
      if(!(exit?webm:entryFormat==='webm'))throw Error('Use image frames');
      if(exit){const blob=await asset('puerta-v4-salida.webm');if(turn!==revision)return;movieURL=URL.createObjectURL(blob);movie.src=movieURL}
      movie.onended=ended;await movie.play();started();
    }catch{
      if(turn!==revision)return;
      try{
        const blob=await asset(exit?'puerta-v4-salida.webp':'puerta-v4-entrada.webp');if(turn!==revision)return;
        const url=URL.createObjectURL(blob);movie.hidden=true;fallback.hidden=false;
        fallback.onload=()=>{if(turn===revision){started();clearTimeout(timer);timer=setTimeout(ended,duration)}URL.revokeObjectURL(url)};
        fallback.onerror=()=>{URL.revokeObjectURL(url);ended()};fallback.src=url;
      }catch{ended()}
    }
  }
  function enter(){
    if(opened||leaving)return;opened=true;clearTimeout(audioWaitTimer);
    document.body.classList.remove('entering-courtyard');window.dispatchEvent(new Event('patio-entering'));
    if(skipMotion||reduced.matches){finishOpening();return}
    skip.disabled=false;skip.textContent='Omitir animación';playFilm(false,finishOpening);
  }
  function skipOpening(){
    if(leaving)return;skipMotion=true;
    if(opened){finishOpening();return}
    filmReady=true;skip.disabled=true;skip.textContent='Entrada sin animación';updateSoon();
  }
  skip.addEventListener('click',skipOpening);
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!gate.hidden&&!leaving)skipOpening()});
  enterButton.addEventListener('click',()=>{window.patioSound?.unlockEntrance();updateSoon()});
  silentButton.addEventListener('click',()=>{window.patioSound?.enterSilently();updateSoon()});
  retryButton.addEventListener('click',()=>{clearTimeout(audioWaitTimer);audioWaitTimer=null;audioWaitExpired=false;window.patioScene?.retry();window.patioSound?.prepareEntrance(!skipMotion);updateSoon()});
  window.addEventListener('patio-load-progress',event=>{
    sceneProgress=event.detail.loaded/event.detail.total;sceneError=event.detail.error;updateSoon();
  });
  window.addEventListener('patio-ready',()=>{sceneReady=true;sceneProgress=1;sceneError=false;updateSoon()},{once:true});
  window.addEventListener('patio-audio-state',updateSoon);
  document.addEventListener('visibilitychange',updateSoon);
  function navigate(url){
    clearTimeout(timer);clearTimeout(preloadTimer);movie.pause();window.patioSound?.stopDoor();
    try{sessionStorage.setItem('la-ganga:desde-patio',JSON.stringify({at:Date.now(),hash:url.hash}));sessionStorage.setItem('la-ganga:entrada','1')}catch{}
    location.assign(url.href);
  }
  document.addEventListener('click',event=>{
    if(event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    const link=event.target.closest?.('a[href]');if(!link||link.target==='_blank'||link.hasAttribute('download'))return;
    const raw=link.href?.baseVal||link.href||link.getAttribute('href');
    const url=new URL(raw,location.href),home=new URL('../',location.href);
    if(url.origin!==home.origin||url.pathname!==home.pathname||!url.hash.startsWith('#/'))return;
    event.preventDefault();if(leaving)return;
    leaving=true;revision++;clearTimeout(timer);document.dispatchEvent(new Event('patio-departure'));
    if(reduced.matches||saveData||!opened){navigate(url);return}
    window.patioSound?.prepareClose();main.inert=true;
    gate.setAttribute('aria-label','Entrando en '+(link.getAttribute('aria-label')||link.textContent.trim()));
    const deadline=setTimeout(()=>navigate(url),2500);
    playFilm(true,()=>{clearTimeout(deadline);navigate(url)});
  });
  window.addEventListener('pageshow',event=>{
    if(event.persisted){leaving=false;opened=true;gate.classList.remove('is-leaving');gate.classList.add('is-open');finishOpening()}
  });
  window.patioSound?.prepareEntrance(!skipMotion);prepareFilm();updateSoon();
})();
