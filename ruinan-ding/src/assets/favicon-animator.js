/* Improved favicon animator: updates both 'icon' and 'shortcut icon' links repeatedly.
   Makes a small rotating/scaling RD badge and forces the browser to reload the favicon.
*/
(function(){
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size; canvas.height = size;
  const ctx = canvas.getContext('2d');

  function ensureLink(rel){
    let l = document.querySelector('link[rel="' + rel + '"]');
    if(!l){ l = document.createElement('link'); l.rel = rel; document.head.appendChild(l); }
    return l;
  }

  const linkIcon = ensureLink('icon');
  const linkShortcut = ensureLink('shortcut icon');

  let t = 0;
  let iv = null;

  function drawOnce(){
    ctx.clearRect(0,0,size,size);
    ctx.save();
    ctx.translate(size/2, size/2);

    // rotation + subtle vertical bounce
    const rot = Math.sin(t) * 0.12; // radians
    const bounce = Math.sin(t*2) * 1.5;
    ctx.rotate(rot);
    ctx.translate(0, bounce);

    // radial background
    const g = ctx.createRadialGradient(0,0,6,0,0,size/2);
    g.addColorStop(0, '#ffffff22');
    g.addColorStop(0.2, '#8A2BE2');
    g.addColorStop(1, '#4B0082');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.arc(0,0,size/2 - 1, 0, Math.PI*2); ctx.fill();

    // Draw RD with outline
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const scale = 1 + 0.08 * Math.sin(t*2);
    ctx.font = (Math.floor(32 * scale)) + 'px Arial';
    // outline
    ctx.lineWidth = 6;
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.strokeText('RD', 0, 2);
    ctx.fillStyle = '#fff';
    ctx.fillText('RD', 0, 2);

    ctx.restore();

    try{
      const url = canvas.toDataURL('image/png');
      // set both links to be safe across browsers
      linkIcon.href = url;
      linkShortcut.href = url;
    }catch(e){/* ignore */}

    t += 0.45;
  }

  function start(){
    if(iv) clearInterval(iv);
    drawOnce();
    iv = setInterval(drawOnce, 120);
  }

  function stop(){ if(iv) { clearInterval(iv); iv = null; } }

  document.addEventListener('visibilitychange', function(){
    if(document.hidden) stop(); else start();
  });

  // try to start immediately
  start();
})();
/* Simple canvas-based favicon animator.
   Draws "RD" on a purple circular background with a subtle wobble.
   Place this file at: src/assets/favicon-animator.js
*/
(function() {
  const LINK_ID = 'favicon';

  function getLink() {
    let link = document.getElementById(LINK_ID);
    if (!link) {
      link = document.querySelector('link[rel="icon"]') || document.querySelector('link[rel="shortcut icon"]');
      if (link) link.id = LINK_ID;
      else {
        link = document.createElement('link');
        link.id = LINK_ID;
        link.rel = 'icon';
        document.head.appendChild(link);
      }
    }
    link.rel = 'icon';
    link.type = 'image/png';
    return link;
  }

  const SIZE = 64; // canvas logical size in CSS px
  let dpr = Math.max(1, window.devicePixelRatio || 1);
  const canvas = document.createElement('canvas');
  canvas.width = SIZE * dpr;
  canvas.height = SIZE * dpr;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  let running = true;

  function drawFrame(now) {
    const t = (now || performance.now()) / 1000;
    ctx.clearRect(0, 0, SIZE, SIZE);

    const cx = SIZE / 2;
    const cy = SIZE / 2;
    const r = SIZE / 2 - 2;

    // background gradient circle
    const grad = ctx.createLinearGradient(0, 0, SIZE, SIZE);
    grad.addColorStop(0, '#8A2BE2');
    grad.addColorStop(1, '#4B0082');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();

    // RD with wobble + subtle scale
    ctx.save();
    ctx.translate(cx, cy);
    const wobble = Math.sin(t * 3) * 0.06; // radians
    const scale = 1 + Math.sin(t * 2) * 0.03;
    ctx.rotate(wobble);
    ctx.scale(scale, scale);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RD', 0, 2);
    ctx.restore();

    // write to link
    const url = canvas.toDataURL('image/png');
    const link = getLink();
    if (link.href !== url) link.href = url;

    if (running) window.requestAnimationFrame(drawFrame);
  }

  function start() {
    // re-evaluate DPR (handles zoom changes)
    dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = SIZE * dpr;
    canvas.height = SIZE * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawFrame();
    try { console.info('[favicon-animator] started'); } catch (e) {}
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();

  // pause when hidden
  document.addEventListener('visibilitychange', function() {
    running = !document.hidden;
    if (running) start();
  });
})();
// Animated favicon using Canvas with debug and robust favicon updates
(function() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  let animationFrame = 0;

  function updateFavicon(dataUrl) {
    try {
      let link = document.getElementById('favicon') || document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.id = 'favicon';
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = dataUrl;
      link.type = 'image/png';
      link.sizes = '64x64';
      // ensure a shortcut icon exists for broader compatibility
      let short = document.getElementById('favicon-short') || document.querySelector("link[rel='shortcut icon']");
      if (!short) {
        short = document.createElement('link');
        short.id = 'favicon-short';
        short.rel = 'shortcut icon';
        document.head.appendChild(short);
      }
      short.href = dataUrl;
      console.log('[favicon-animator] favicon updated');
    } catch (e) {
      console.error('[favicon-animator] updateFavicon error', e);
    }
  }

  function drawFavicon() {
    try {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#f0f8ff';
      ctx.fillRect(0, 0, 64, 64);

      // Border circle
      ctx.strokeStyle = '#0066cc';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(32, 32, 30, 0, Math.PI * 2);
      ctx.stroke();

      // Animation state (0-7 frames)
      const frame = Math.floor(animationFrame % 8);

      ctx.strokeStyle = '#0066cc';
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Frame-by-frame drawing animation
      if (frame >= 0) {
        // R vertical line
        ctx.beginPath();
        ctx.moveTo(18, 20);
        ctx.lineTo(18, 48);
        ctx.stroke();
      }

      if (frame >= 1) {
        // R top curve
        ctx.beginPath();
        ctx.arc(25, 28, 7, Math.PI, 0, true);
        ctx.stroke();
      }

      if (frame >= 2) {
        // R diagonal leg
        ctx.beginPath();
        ctx.moveTo(25, 34);
        ctx.lineTo(33, 48);
        ctx.stroke();
      }

      if (frame >= 3) {
        // D vertical line
        ctx.beginPath();
        ctx.moveTo(40, 20);
        ctx.lineTo(40, 48);
        ctx.stroke();
      }

      if (frame >= 4) {
        // D top curve
        ctx.beginPath();
        ctx.arc(47, 28, 7, Math.PI, 0, false);
        ctx.stroke();
      }

      if (frame >= 5) {
        // D bottom curve completion
        ctx.beginPath();
        ctx.arc(47, 43, 7, 0, Math.PI, false);
        ctx.stroke();
      }

      // Update favicon (PNG data URL)
      updateFavicon(canvas.toDataURL('image/png'));

      animationFrame += 0.5; // Control speed
    } catch (e) {
      console.error('[favicon-animator] drawFavicon error', e);
    }
    requestAnimationFrame(drawFavicon);
  }

  console.log('[favicon-animator] started');

  // Start animation when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', drawFavicon);
  } else {
    drawFavicon();
  }
})();
// Simple flashing RD favicon (reliable toggle between two PNG frames)
(function() {
  const size = 64;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  function drawBase() {
    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = '#f0f8ff';
    ctx.fillRect(0, 0, size, size);
    // border
    ctx.strokeStyle = '#0066cc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(size/2, size/2, 28, 0, Math.PI * 2);
    ctx.stroke();
  }

  function drawRD() {
    ctx.fillStyle = '#0066cc';
    // Use a compact sans-serif that renders clearly in small sizes
    ctx.font = 'bold 36px Arial, system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('RD', size/2, size/2 + 2);
  }

  function dataUrlFor(showRD) {
    drawBase();
    if (showRD) drawRD();
    return canvas.toDataURL('image/png');
  }

  function updateLinks(href) {
    try {
      let link = document.getElementById('favicon') || document.querySelector("link[rel*='icon']");
      if (!link) {
        link = document.createElement('link');
        link.id = 'favicon';
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = href;
      link.type = 'image/png';

      let short = document.getElementById('favicon-short') || document.querySelector("link[rel='shortcut icon']");
      if (!short) {
        short = document.createElement('link');
        short.id = 'favicon-short';
        short.rel = 'shortcut icon';
        document.head.appendChild(short);
      }
      short.href = href;
    } catch (e) {
      console.error('[favicon-animator] updateLinks error', e);
    }
  }

  function startFlashing() {
    try {
      const off = dataUrlFor(false);
      const on = dataUrlFor(true);
      let visible = false;
      updateLinks(off);
      console.log('[favicon-animator] flashing RD started');
      setInterval(() => {
        visible = !visible;
        updateLinks(visible ? on : off);
      }, 600);
    } catch (e) {
      console.error('[favicon-animator] startFlashing error', e);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startFlashing);
  } else {
    startFlashing();
  }
})();
