/* One resident at a time. Random on every entrance; manual choice lasts only
   for this visit. Loading a replacement never restarts the courtyard/audio. */
function createCourtyardCharacters(stage) {
  const definitions = {
    naisen: {
      create: createNaisen, transform: 'translate(2220 1352) scale(.74)',
      path: 'M117 20 Q180 8 228 53 L255 85 L258 136 L278 159 L272 211 L258 237 L243 283 L242 334 L210 345 L168 335 L123 344 L83 334 L83 292 L92 263 L70 228 L43 206 L42 166 L57 145 L47 112 L55 88 L83 84 L92 55 Z'
    },
    vincie: {
      create: createVincie, transform: 'translate(2258 1282) scale(.70)',
      path: 'M146 18 Q190 6 227 39 L236 91 L329 103 L342 170 L331 227 L337 276 L322 307 L340 370 L309 418 L276 455 L256 508 L237 531 L208 539 L180 534 L175 519 L202 480 L217 432 L226 393 L144 392 L119 478 L117 511 L77 530 L40 519 L44 493 L73 461 L77 406 L49 364 L51 319 L47 276 L61 223 L52 178 L84 132 L126 113 Z'
    }
  };
  const ids = Object.keys(definitions), initial = ids[Math.floor(Math.random() * ids.length)];
  const select = document.getElementById('patio-character');
  const controls = document.getElementById('resident-controls'), status = document.getElementById('resident-status');
  const zone = document.getElementById('place-resident'), shape = zone.querySelector('path');
  let active = null, loader, version = 0, seconds = 0;
  select.value = initial;
  zone.style.display = 'none';

  function dispose(resident) {
    if (!resident) return;
    resident.root.remove();
    for (const image of resident.images) image.close?.();
    resident.images.length = 0;
  }
  async function activate(id, first = false) {
    if (!definitions[id] || active?.id === id) return;
    const request = ++version, def = definitions[id];
    controls.setAttribute('aria-busy', 'true'); select.disabled = true;
    status.textContent = first ? '' : 'Preparando personaje…';
    const root = document.createElement('div');
    root.className = 'resident-layer'; root.hidden = true;
    root.style.cssText = 'position:absolute;inset:0;pointer-events:none'; stage.append(root);
    const candidate = { id, root, images: [], actor: def.create(root), started: seconds };
    try {
      await candidate.actor.load(async url => {
        const image = await loader(url); candidate.images.push(image); return image;
      });
      if (request !== version) { dispose(candidate); return; }
      // Draw before revealing, including when the courtyard is paused.
      candidate.started = seconds;
      candidate.actor.paint(0);
      window.dispatchEvent(new Event('patio-resident-change'));
      dispose(active); active = candidate; root.hidden = false;
      const place = active.actor.place;
      zone.classList.remove('is-active'); zone.removeAttribute('aria-describedby');
      zone.id = 'place-' + place.id; zone.dataset.place = place.id;
      zone.setAttribute('href', place.href);
      zone.setAttribute('aria-label', `${place.name}, nivel ${place.character.level}, ${place.character.race} ${place.character.className}. Apariencia del ${place.character.appearanceLabel}. Ver ficha`);
      shape.setAttribute('transform', def.transform); shape.setAttribute('d', def.path);
      zone.style.display = ''; select.value = id; status.textContent = '';
    } catch (error) {
      dispose(candidate);
      if (request === version) {
        select.value = active?.id || initial;
        status.textContent = 'No se ha podido cargar. Vuelve a elegirlo.';
      }
      if (first) throw error;
    } finally {
      if (request === version) {
        controls.setAttribute('aria-busy', 'false'); select.disabled = !active;
      }
    }
  }
  select.addEventListener('change', () => activate(select.value));
  return {
    get place() { return active?.actor.place; },
    async load(loadSprite) { loader = loadSprite; await activate(initial, true); },
    paint(time) { seconds = time; active?.actor.paint(Math.max(0, time - active.started)); }
  };
}
