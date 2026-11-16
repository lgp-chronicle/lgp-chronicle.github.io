(() => {
  const gate = document.getElementById('fortress-gate');
  const skip = document.getElementById('skip-gate');
  const main = document.querySelector('main');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let opened = false, leaving = false, skipMotion = reduced.matches, openingTimer;
  main.inert = true;
  const doorReady = Promise.all(['izquierda','derecha'].map(side=>{
    const painting = new Image(); painting.src = 'puerta-'+side+'.webp'; return painting.decode();
  })).catch(() => { skipMotion = true; });
  function finishOpening() {
    clearTimeout(openingTimer);
    gate.hidden = true; gate.setAttribute('aria-hidden', 'true');
    main.inert = false; main.removeAttribute('aria-busy');
    window.dispatchEvent(new Event('patio-opened'));
    if (document.activeElement === skip) document.getElementById('scene').focus({ preventScroll: true });
  }
  async function enter() {
    if (opened) return;
    opened = true;
    await doorReady;
    document.body.classList.remove('entering-courtyard');
    if (skipMotion || reduced.matches) { finishOpening(); return; }
    // Ensure the closed leaves have been painted before their opening starts.
    requestAnimationFrame(() => requestAnimationFrame(() => {
      gate.classList.add('is-open');
      openingTimer = setTimeout(finishOpening, 1400);
    }));
  }
  function skipOpening() {
    skipMotion = true; gate.classList.add('skip-motion');
    document.body.classList.remove('entering-courtyard');
    finishOpening();
  }
  skip.addEventListener('click', skipOpening);
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && !gate.hidden && !leaving) skipOpening(); });
  window.addEventListener('patio-ready', enter, { once: true });
  // An error must always leave the real homepage available.
  setTimeout(() => {
    if (!opened && !gate.hidden) document.getElementById('gate-status').textContent = 'El patio está tardando en cargar…';
  }, 8000);
  function navigate(url) {
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
    leaving = true; clearTimeout(openingTimer);
    document.dispatchEvent(new Event('patio-departure'));
    if (reduced.matches || !opened) { navigate(url); return; }
    main.inert = true;
    gate.classList.remove('skip-motion'); gate.classList.add('is-open', 'is-leaving');
    gate.hidden = false; gate.removeAttribute('aria-hidden');
    gate.setAttribute('aria-label', 'Entrando en ' + (link.getAttribute('aria-label') || link.textContent.trim()));
    requestAnimationFrame(() => requestAnimationFrame(() => {
      gate.classList.remove('is-open');
      setTimeout(() => navigate(url), 560);
    }));
  });
  // Browsers may restore the document from bfcache with its exit veil still closed.
  window.addEventListener('pageshow', event => {
    if (event.persisted) { leaving = false; gate.classList.remove('is-leaving'); gate.classList.add('is-open'); finishOpening(); }
  });
})();
