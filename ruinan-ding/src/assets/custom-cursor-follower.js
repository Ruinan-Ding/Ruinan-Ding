/* Large animated custom cursor follower
   - Creates a single large cursor element that follows the pointer.
   - Spawns small sparkles on movement for a sprinkly effect.
   - Disabled on touch devices.
*/
(function(){
  // Avoid running on touch-first devices. Use pointer coarse detection
  // because some hybrid laptops report maxTouchPoints > 0 even when a mouse is present.
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;

  const el = document.createElement('div');
  el.id = 'custom-cursor';
  const core = document.createElement('div');
  core.className = 'cursor-core';
  /* Insert a stylized pointy cursor SVG where the tip is at the element's top-left.
     The shape is intentionally sharp and elegant; you can tweak colors/path later. */
  core.innerHTML = `
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="g1" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.98"/>
          <stop offset="40%" stop-color="#FF80BF"/>
          <stop offset="100%" stop-color="#8A2BE2"/>
        </linearGradient>
        <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
          <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000" flood-opacity="0.35"/>
        </filter>
      </defs>
      <!-- stylized pointer path; tip is at 0,0 -->
      <path d="M1 1 L18 12 L12 14 L14 20 L10 18 L8 24 L6 23 L6 14 L1 1 Z" fill="url(#g1)" filter="url(#shadow)" />
    </svg>
  `;
  el.appendChild(core);
  document.body.appendChild(el);
  // mark body so CSS can hide the native cursor only when the custom cursor exists
  document.body.classList.add('has-custom-cursor');

  // find favicon link for flash effect (we'll use a temporary link so we don't overwrite the original)
  const faviconLink = document.getElementById('favicon');
  const originalFaviconHref = faviconLink ? faviconLink.getAttribute('href') : null;
  function flashFavicon() {
    // Safer: briefly prepend a sparkle to the document title instead of swapping favicon links.
    try {
      const originalTitle = document.title || '';
      document.title = '✨ ' + originalTitle;
      setTimeout(() => { document.title = originalTitle; }, 360);
      if (console && console.debug) console.debug('[custom-cursor] flashed title instead of favicon');
    } catch (e) {
      if (console && console.error) console.error('[custom-cursor] flashFavicon error', e);
    }
  }

  let mouseX = window.innerWidth/2, mouseY = window.innerHeight/2;
  let posX = mouseX, posY = mouseY;
  let raf = null;

  function animate(){
    posX += (mouseX - posX) * 0.18;
    posY += (mouseY - posY) * 0.18;
    // place the element so its top-left corner == pointer tip position
    el.style.left = Math.round(posX) + 'px';
    el.style.top = Math.round(posY) + 'px';
    raf = requestAnimationFrame(animate);
  }
  animate();

  document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX; mouseY = e.clientY;
  }, {passive:true});

  const hoverSelectors = 'a, button, .badge-cta, .page-link-cta';
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest && e.target.closest(hoverSelectors)) el.classList.add('cursor-enlarge');
  });
  document.addEventListener('mouseout', (e) => {
    if (e.target.closest && e.target.closest(hoverSelectors)) el.classList.remove('cursor-enlarge');
  });

  // spawn mini-sparks near pointer while moving
  let last = 0;
  document.addEventListener('mousemove', (e) => {
    const now = performance.now();
    if (now - last > 60) { spawnMiniSparks(e.clientX, e.clientY); last = now; }
  }, {passive:true});

  function spawnMiniSparks(x,y){
    const colors = ['#FF80BF','#FFD166','#8A2BE2','#4B0082','#00D4FF','#7CFFB2'];
    const count = 3 + Math.floor(Math.random()*4);
    for (let i=0;i<count;i++){
      const s = document.createElement('div');
      s.className = 'mini-spark';
      const size = 4 + Math.random()*10;
      s.style.width = size + 'px'; s.style.height = size + 'px';
      s.style.background = colors[Math.floor(Math.random()*colors.length)];
      s.style.left = (x - size/2) + 'px'; s.style.top = (y - size/2) + 'px';
      const angle = Math.random()*Math.PI*2;
      const dist = 18 + Math.random()*36;
      const dx = Math.cos(angle)*dist; const dy = Math.sin(angle)*dist;
      s.style.setProperty('--dx', dx + 'px');
      s.style.setProperty('--dy', dy + 'px');
      document.body.appendChild(s);
      s.addEventListener('animationend', () => s.remove(), {once:true});
    }
  }

  // spawn a visible ring on click for a stronger pop effect
  function spawnClickRing(x,y){
    const r = document.createElement('div');
    r.className = 'cursor-pop-ring';
    r.style.left = x + 'px';
    r.style.top = y + 'px';
    document.body.appendChild(r);
    r.addEventListener('animationend', () => r.remove(), {once:true});
  }

  // click feedback
  document.addEventListener('mousedown', (e) => {
    // spawn a visible ring at the pointer for a stronger pop
    spawnClickRing(e.clientX, e.clientY);
    // reliably restart the pop animation by toggling the inline animation style
    el.style.animation = 'none';
    // force reflow
    void el.offsetWidth;
    el.style.animation = 'cursorPop 320ms cubic-bezier(.2,.85,.32,1) forwards';
    // clear animation style after it ends
    const onEnd = () => { el.style.animation = ''; el.removeEventListener('animationend', onEnd); };
    el.addEventListener('animationend', onEnd);
    // flash favicon briefly with a glow
    flashFavicon();
  });
  // ensure any leftover state is cleared on pointerup
  document.addEventListener('mouseup', () => { el.style.animation = ''; });

  function hideCursorForBlur(){
    // hide and stop animating
    el.classList.add('is-hidden');
    el.classList.remove('cursor-click','cursor-enlarge');
    if (raf) { cancelAnimationFrame(raf); raf = null; }
  }
  function showCursorAfterFocus(){
    el.classList.remove('is-hidden');
    if (!raf) animate();
  }

  window.addEventListener('blur', hideCursorForBlur);
  window.addEventListener('focus', showCursorAfterFocus);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') hideCursorForBlur(); else showCursorAfterFocus();
  });
  // pointer leaving the page
  document.addEventListener('pointerleave', hideCursorForBlur);
  document.addEventListener('pointerenter', showCursorAfterFocus);

})();
