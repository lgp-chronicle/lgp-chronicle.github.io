(() => {
  const gate = document.getElementById('fortress-gate');
  const movie = document.getElementById('gate-film');
  const fallback = document.getElementById('gate-fallback');
  const skip = document.getElementById('skip-gate');
  const main = document.querySelector('main');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = navigator.connection?.saveData === true;
  const webm = Boolean(movie.canPlayType('video/webm; codecs="vp9"'));
  let opened = false, leaving = false, skipMotion = reduced.matches || saveData, timer, revision = 0, movieURL, preloadTimer;
  main.inert = true;
  const cache = new Map();
  function asset(name) {
    if (!cache.has(name)) cache.set(name, fetch(name).then(r => {
      if (!r.ok) throw Error('Transition unavailable');
      return r.blob();
    }).catch(error => { cache.delete(name); throw error; }));
    return cache.get(name);
  }
  function finishOpening() {
    revision++; clearTimeout(timer); movie.pause();
    gate.hidden = true; gate.setAttribute('aria-hidden', 'true');
    main.inert = false; main.removeAttribute('aria-busy');
    window.dispatchEvent(new Event('patio-opened'));
    if (document.activeElement === skip) document.getElementById('scene').focus({ preventScroll: true });
    if (movieURL) { URL.revokeObjectURL(movieURL); movieURL = null; }
    movie.removeAttribute('src'); movie.load();
    clearTimeout(preloadTimer);
    if (!reduced.matches && !saveData) preloadTimer = setTimeout(() => {
      const preload = () => { if (!leaving && !document.hidden) asset('puerta-v3-salida.' + (webm ? 'webm' : 'webp')).catch(() => {}); };
      if ('requestIdleCallback' in window) requestIdleCallback(preload, { timeout: 4000 }); else preload();
    }, 2000);
  }
  async function playFilm(exit, done) {
    const turn = ++revision, duration = exit ? 800 : 2000;
    clearTimeout(timer); fallback.hidden = true; movie.hidden = false;
    timer = setTimeout(done, exit ? 2400 : 8000);
    gate.hidden = false; gate.removeAttribute('aria-hidden');
    if (exit) { gate.classList.add('is-open', 'is-leaving'); movie.poster = ''; }
    const started = () => {
      if (turn !== revision) return;
      gate.classList.toggle('is-open', !exit);
      clearTimeout(timer);
      timer = setTimeout(done, duration + 1200);
    };
    const ended = () => { if (turn === revision) done(); };
    try {
      if (!webm) throw Error('Use image frames');
      if (exit) {
        const blob = await asset('puerta-v3-salida.webm');
        if (turn !== revision) return;
        movieURL = URL.createObjectURL(blob); movie.src = movieURL;
      } else movie.src = 'puerta-v3-entrada.webm';
      movie.onended = ended;
      await movie.play();
      started();
    } catch {
      if (turn !== revision) return;
      // The same illustrated frames, with alpha, for non-WebM browsers.
      try {
        const blob = await asset(exit ? 'puerta-v3-salida.webp' : 'puerta-v3-entrada.webp');
        if (turn !== revision) return;
        const url = URL.createObjectURL(blob);
        movie.hidden = true; fallback.hidden = false;
        fallback.onload = () => {
          started(); clearTimeout(timer); timer = setTimeout(ended, duration);
          URL.revokeObjectURL(url);
        };
        fallback.onerror = done; fallback.src = url;
      } catch { done(); }
    }
  }
  function enter() {
    if (opened) return;
    opened = true;
    document.body.classList.remove('entering-courtyard');
    if (skipMotion || reduced.matches) { finishOpening(); return; }
    playFilm(false, finishOpening);
  }
  function skipOpening() {
    skipMotion = true;
    document.body.classList.remove('entering-courtyard');
    finishOpening();
  }
  skip.addEventListener('click', skipOpening);
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !gate.hidden && !leaving) skipOpening(); });
  window.addEventListener('patio-ready', enter, { once: true });
  setTimeout(() => {
    if (!opened && !gate.hidden) document.getElementById('gate-status').textContent = 'El patio está tardando en cargar…';
  }, 8000);
  function navigate(url) {
    clearTimeout(timer); clearTimeout(preloadTimer); movie.pause();
    try {
      sessionStorage.setItem('la-ganga:desde-patio', JSON.stringify({ at: Date.now(), hash: url.hash }));
      sessionStorage.setItem('la-ganga:entrada', '1');
    } catch {}
    location.assign(url.href);
  }
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest?.('a[href]');
    if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
    const raw = link.href?.baseVal || link.href || link.getAttribute('href');
    const url = new URL(raw, location.href), home = new URL('../', location.href);
    if (url.origin !== home.origin || url.pathname !== home.pathname || !url.hash.startsWith('#/')) return;
    event.preventDefault();
    if (leaving) return;
    leaving = true; revision++; clearTimeout(timer);
    document.dispatchEvent(new Event('patio-departure'));
    if (reduced.matches || saveData || !opened) { navigate(url); return; }
    main.inert = true;
    gate.setAttribute('aria-label', 'Entrando en ' + (link.getAttribute('aria-label') || link.textContent.trim()));
    const deadline = setTimeout(() => navigate(url), 2500);
    playFilm(true, () => { clearTimeout(deadline); navigate(url); });
  });
  window.addEventListener('pageshow', event => {
    if (event.persisted) { leaving = false; gate.classList.remove('is-leaving'); gate.classList.add('is-open'); finishOpening(); }
  });
})();
