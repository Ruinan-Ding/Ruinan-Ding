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
  function replayFavicon() {
    // Re-insert the favicon link with a changing query param so the browser reloads the SVG
    try {
      const head = document.head || document.getElementsByTagName('head')[0];
      // prefer element with id 'favicon' if present, else any icon link
      const old = document.getElementById('favicon') || document.querySelector('link[rel~="icon"]');
      const base = (old && old.getAttribute('href')) ? old.getAttribute('href').split('?')[0] : 'favicon.svg';
      const newHref = base + (base.includes('?') ? '&' : '?') + 'r=' + Date.now();

      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/svg+xml';
      link.id = 'favicon';
      link.href = newHref;

      // Append new link and remove previous to force the browser to load the fresh SVG
      head.appendChild(link);
      // slight delay before removing the old reference so some browsers pick up the change
      if (old && old.parentNode) {
        setTimeout(() => { try { old.parentNode.removeChild(old); } catch(e){} }, 40);
      }
      if (console && console.debug) console.debug('[custom-cursor] replayed favicon ->', newHref);
    } catch (e) {
      if (console && console.error) console.error('[custom-cursor] replayFavicon error', e);
    }
  }

  // Canvas-based favicon animation fallback: draw frames on a canvas and set data-URL favicons
  // This forces a visible redraw in browsers that don't animate SVG favicons.
  function animateFaviconSequence(duration = 2500, fps = 30) {
    try {
      const pixelRatio = Math.max(1, window.devicePixelRatio || 1);
      const size = 100; // match SVG viewBox
      const canvas = document.createElement('canvas');
      canvas.width = size * pixelRatio;
      canvas.height = size * pixelRatio;
      const ctx = canvas.getContext('2d');
      ctx.scale(pixelRatio, pixelRatio);

      // small color helpers
      function hexToRgb(hex) {
        const m = hex.replace('#','');
        const bigint = parseInt(m, 16);
        return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
      }
      function rgbToHex(r,g,b) {
        return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
      }
      function lerpColor(a,b,t){
        const A = hexToRgb(a); const B = hexToRgb(b);
        const r = Math.round(A.r + (B.r - A.r) * t);
        const g = Math.round(A.g + (B.g - A.g) * t);
        const bb = Math.round(A.b + (B.b - A.b) * t);
        return rgbToHex(r,g,bb);
      }

      // Paths copied from favicon.svg (matching viewBox 0..100)
      const pathR = new Path2D('M 28 35 L 28 60 M 28 35 L 38 35 Q 42 35 42 40 Q 42 45 38 45 L 28 45 M 42 45 L 48 60');
      const pathD = new Path2D('M 56 35 L 56 60 M 56 35 L 66 35 Q 70 35 70 47.5 Q 70 60 66 60 L 56 60');

      let start = performance.now();
      const frameInterval = 1000 / fps;
      let lastFrame = 0;

      function draw(progress) {
        // clear
        ctx.clearRect(0, 0, size, size);
        // pulse for outer circle
        const pulse = 0.85 + 0.15 * Math.cos(2 * Math.PI * progress);

        // background transitions from red to light blue over the animation
        const bgColor = lerpColor('#ff4d4d', '#f0f8ff', progress);
        ctx.fillStyle = bgColor;
        ctx.beginPath(); ctx.arc(50,50,45,0,Math.PI*2); ctx.fill();

        // outer circle stroke with pulse (semi-transparent)
        ctx.save();
        ctx.globalAlpha = 0.5 * pulse;
        ctx.strokeStyle = '#0066cc'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(50,50,47,0,Math.PI*2); ctx.stroke();
        ctx.restore();

        // draw R with dash effect
        const rProg = Math.min(1, Math.max(0, progress / 0.4));
        ctx.strokeStyle = '#0066cc'; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.setLineDash([180]); ctx.lineDashOffset = 180 * (1 - rProg);
        ctx.beginPath(); ctx.stroke(pathR);

        // draw D with delayed dash effect
        let dProg = 0;
        if (progress <= 0.4) dProg = 0; else if (progress <= 0.8) dProg = (progress - 0.4) / 0.4; else dProg = 1;
        ctx.setLineDash([160]); ctx.lineDashOffset = 160 * (1 - dProg);
        ctx.beginPath(); ctx.stroke(pathD);
      }

      // draw immediate first frame (red) so the favicon shows red instantly
      draw(0);
      try {
        const data0 = canvas.toDataURL('image/png');
        const head0 = document.head || document.getElementsByTagName('head')[0];
        const old0 = document.getElementById('favicon') || document.querySelector('link[rel~="icon"]');
        const link0 = document.createElement('link'); link0.rel = 'icon'; link0.type = 'image/png'; link0.id = 'favicon'; link0.href = data0;
        head0.appendChild(link0);
        if (old0 && old0.parentNode) { setTimeout(() => { try { old0.parentNode.removeChild(old0); } catch(e){} }, 60); }
      } catch (e) {
        if (console && console.error) console.error('[custom-cursor] initial favicon toDataURL failed', e);
      }

      start = performance.now();
      function tick(now) {
        const elapsed = now - start;
        const progress = Math.min(1, elapsed / duration);
        if (now - lastFrame >= frameInterval || progress === 1) {
          draw(progress);
          // convert to PNG dataURL and set favicon
          try {
            const data = canvas.toDataURL('image/png');
            const head = document.head || document.getElementsByTagName('head')[0];
            const old = document.getElementById('favicon') || document.querySelector('link[rel~="icon"]');
            const link = document.createElement('link'); link.rel = 'icon'; link.type = 'image/png'; link.id = 'favicon'; link.href = data;
            head.appendChild(link);
            if (old && old.parentNode) { setTimeout(() => { try { old.parentNode.removeChild(old); } catch(e){} }, 60); }
          } catch (e) {
            if (console && console.error) console.error('[custom-cursor] favicon canvas toDataURL failed', e);
          }
          lastFrame = now;
        }
        if (elapsed < duration) requestAnimationFrame(tick);
      }

      requestAnimationFrame(tick);
    } catch (e) {
      if (console && console.error) console.error('[custom-cursor] animateFaviconSequence error', e);
      // fallback to replayFavicon
      try { replayFavicon(); } catch (e2) {}
    }
  }

  // Run the favicon animation once on page load so users see the full cycle without clicking
  try {
    // Slight delay to allow head / index to stabilize
    setTimeout(() => {
      try { animateFaviconSequence(); } catch (e) { if (console && console.error) console.error(e); }
    }, 120);
  } catch (e) {}

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
    // If the custom cursor was hidden (e.g., after a blur/leave), snap it to the pointer and show it immediately
    if (el.classList.contains('is-hidden')) {
      posX = mouseX; posY = mouseY;
      el.style.left = Math.round(posX) + 'px';
      el.style.top = Math.round(posY) + 'px';
      showCursorAfterFocus();
    }
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
    // restart the favicon animation: prefer canvas-based animation, fallback to replaying the SVG
    try { animateFaviconSequence(); } catch (e) { try { replayFavicon(); } catch (e2) {} }
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

  // Do NOT hide the cursor on window blur alone — that made the custom cursor disappear
  // while users moved their mouse over the page without first clicking. Instead,
  // hide when the document becomes hidden or when the pointer actually leaves the page.
  window.addEventListener('focus', showCursorAfterFocus);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') hideCursorForBlur(); else showCursorAfterFocus();
  });

  // pointer leaving/entering the document. Cover multiple event types for broader browser support.
  document.addEventListener('pointerleave', hideCursorForBlur);
  document.addEventListener('pointerout', (e) => { if (!e.relatedTarget) hideCursorForBlur(); });
  document.addEventListener('mouseout', (e) => { if (!e.relatedTarget) hideCursorForBlur(); });
  document.addEventListener('pointerenter', (e) => {
    if (e && typeof e.clientX === 'number') { mouseX = e.clientX; mouseY = e.clientY; }
    // snap to pointer and show when re-entering
    posX = mouseX; posY = mouseY;
    el.style.left = Math.round(posX) + 'px';
    el.style.top = Math.round(posY) + 'px';
    showCursorAfterFocus();
  });

})();
