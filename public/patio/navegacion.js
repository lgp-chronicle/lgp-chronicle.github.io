/* Navigation for the published courtyard. Classic always means the real homepage. */
function setupCourtyardNavigation(places, scene, stage, pick, pan, glow) {
  const get = id => document.getElementById(id), tip = get('place-tooltip');
  let active = null, lastPointer = null, frameRequest = 0;
  function hide() {
    if (active) get('place-' + active.id)?.classList.remove('is-active');
    active = null; tip.hidden = true; glow.hide();
  }
  function positionTip(point, node) {
    const box = node.getBoundingClientRect(), w = tip.offsetWidth, h = tip.offsetHeight;
    let x = point ? point.x + 19 : box.right + 12, y = point ? point.y + 23 : box.top;
    if (x + w > innerWidth - 10) x = (point ? point.x : box.left) - w - 15;
    if (y + h > innerHeight - 12) y = (point ? point.y : box.top) - h - 15;
    const top = get('guild-bar').getBoundingClientRect().bottom + 8;
    tip.style.left = Math.max(10, Math.min(innerWidth - w - 10, x)) + 'px';
    tip.style.top = Math.max(top, Math.min(innerHeight - h - 12, y)) + 'px';
  }
  function reveal(node, event) {
    if (scene.classList.contains('dragging') || event?.pointerType === 'touch') return;
    const place = places.find(p => p.id === node.dataset.place);
    if (active?.id !== place.id) { hide(); active = place; node.classList.add('is-active'); glow.select(place); }
    get('place-name').textContent = place.name;
    get('place-detail').textContent = place.detail;
    tip.hidden = false; node.setAttribute('aria-describedby', 'place-tooltip');
    lastPointer = event ? { x: event.clientX, y: event.clientY } : null;
    positionTip(lastPointer, node);
  }
  for (const node of document.querySelectorAll('.place-zone')) {
    node.addEventListener('pointerenter', event => reveal(node, event));
    node.addEventListener('pointermove', event => {
      if (!active || event.pointerType === 'touch') return;
      lastPointer = { x: event.clientX, y: event.clientY };
      if (!frameRequest) frameRequest = requestAnimationFrame(() => { frameRequest = 0; if (active) positionTip(lastPointer, node); });
    });
    node.addEventListener('pointerleave', () => { if (active?.id === node.dataset.place) hide(); node.removeAttribute('aria-describedby'); });
    node.addEventListener('focus', () => {
      if (pick.value !== 'patio') { pick.value = 'patio'; pick.dispatchEvent(new Event('change')); }
      const p = places.find(p => p.id === node.dataset.place), r = node.getBoundingClientRect(), v = scene.getBoundingClientRect();
      if (r.left < v.left || r.right > v.right || r.top < v.top || r.bottom > v.bottom) pan.lookAt(...p.centre);
      reveal(node);
    });
    node.addEventListener('blur', hide);
  }
  document.addEventListener('keydown', event => { if (event.key === 'Escape') hide(); });
  scene.addEventListener('pointerdown', hide);
  scene.addEventListener('patio-view', hide);
  window.addEventListener('resize', hide);
  document.addEventListener('patio-departure', hide);
  document.querySelector('.tools summary').textContent = 'Ajustes';
}
