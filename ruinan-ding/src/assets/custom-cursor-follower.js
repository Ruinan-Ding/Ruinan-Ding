/* Custom animated cursor with sparkle/click effects and an animated favicon.
 * Loaded as a plain deferred script (see index.html). Disabled on touch devices.
 */
(function () {
  'use strict';

  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;

  // set localStorage.RD_DEBUG = '1' to enable logging
  const RD_DEBUG = (function () {
    try { return window.localStorage.getItem('RD_DEBUG') === '1'; } catch (e) { return false; }
  })();

  function debugError(label, err) {
    if (RD_DEBUG && window.console && console.error) console.error('[custom-cursor] ' + label, err);
  }

  const FOLLOW_EASING = 0.22;
  const SETTLE_EPSILON_PX = 0.1;
  const IDLE_DELAY_MS = 140;
  const SPARK_INTERVAL_MS = 90;
  const MAX_SPARKLES = 28;
  const MAX_CLICK_RINGS = 8;
  const POP_DURATION_MS = 280;
  const FAVICON_LOOP_MS = 3000;
  const FAVICON_FPS = 6;
  const FAVICON_IDLE_FPS = 5;
  const FAVICON_FLASH_MS = 450;
  const FAVICON_CANVAS_PX = 32;

  const HOVER_SELECTORS = 'a, button, input, select, textarea, summary, details, ' +
    '[role="button"], .page-link-cta, .badge-cta, .focus-badge, .project, ' +
    '.connect-links a, .collapsible';

  // ---- favicon animation ----

  const originalFavicon = (function () {
    const link = document.getElementById('favicon') || document.querySelector('link[rel~="icon"]');
    return {
      href: (link && link.getAttribute('href')) || 'favicon.svg',
      type: (link && link.getAttribute('type')) || 'image/svg+xml'
    };
  })();

  let faviconLink = null;
  let faviconObjectUrl = null;
  let faviconLoopStarted = false;
  let faviconLoopStopped = false;
  let faviconFlashUntil = 0;
  let faviconBurstQueued = 0; // clicks waiting for a sparkle burst

  function ensureFaviconLink(type) {
    if (!faviconLink || !faviconLink.isConnected) {
      const head = document.head || document.getElementsByTagName('head')[0];
      const old = document.getElementById('favicon') || document.querySelector('link[rel~="icon"]');
      faviconLink = (old && old.cloneNode(false)) || document.createElement('link');
      faviconLink.rel = 'icon';
      faviconLink.id = 'favicon';
      head.appendChild(faviconLink);
      if (old && old !== faviconLink && old.parentNode) old.parentNode.removeChild(old);
      // drop any stray icon links so the browser doesn't pick one of those instead
      const duplicates = document.querySelectorAll('link[rel~="icon"]');
      for (let i = 0; i < duplicates.length; i++) {
        const node = duplicates[i];
        if (node !== faviconLink && node.parentNode) node.parentNode.removeChild(node);
      }
    }
    if (faviconLink.type !== type) faviconLink.type = type;
    return faviconLink;
  }

  function setFavicon(href, type) {
    const link = ensureFaviconLink(type);
    link.href = href;
    // some browsers only rescan icons when a link node is (re)inserted
    if (link.parentNode) link.parentNode.appendChild(link);
  }

  // per-frame path: once the link exists, updating href is enough — re-inserting
  // the node many times a second forces extra icon refetch/decode work
  function setFaviconFrame(href, type) {
    ensureFaviconLink(type).href = href;
  }

  let faviconPrevObjectUrl = null;

  function setFaviconBlob(blob) {
    const newUrl = URL.createObjectURL(blob);
    try {
      setFaviconFrame(newUrl, 'image/png');
    } catch (err) {
      URL.revokeObjectURL(newUrl);
      throw err;
    }
    // revoke the URL from two frames back: the previous frame may still be
    // loading, but the one before it is done — no timers needed
    if (faviconPrevObjectUrl) URL.revokeObjectURL(faviconPrevObjectUrl);
    faviconPrevObjectUrl = faviconObjectUrl;
    faviconObjectUrl = newUrl;
  }

  function releaseFaviconObjectUrls() {
    if (faviconObjectUrl) {
      URL.revokeObjectURL(faviconObjectUrl);
      faviconObjectUrl = null;
    }
    if (faviconPrevObjectUrl) {
      URL.revokeObjectURL(faviconPrevObjectUrl);
      faviconPrevObjectUrl = null;
    }
  }

  function restoreOriginalFavicon() {
    setFavicon(originalFavicon.href, originalFavicon.type);
    releaseFaviconObjectUrls();
  }

  // cache-bust the static SVG so the icon still reacts when canvas is unavailable
  function flashFallbackFavicon() {
    try {
      setFavicon(originalFavicon.href.split('?')[0] + '?r=' + Math.round(performance.now()), originalFavicon.type);
    } catch (err) {
      debugError('favicon fallback flash failed', err);
    } finally {
      releaseFaviconObjectUrls();
    }
  }

  function startFaviconLoop() {
    if (faviconLoopStarted || faviconLoopStopped) return;
    faviconLoopStarted = true;

    try {
      // fixed 64px backing store; drawing stays in favicon.svg's 0..100 space
      const canvas = document.createElement('canvas');
      canvas.width = FAVICON_CANVAS_PX;
      canvas.height = FAVICON_CANVAS_PX;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('2d context unavailable');
      ctx.scale(FAVICON_CANVAS_PX / 100, FAVICON_CANVAS_PX / 100);

      // background star field; twinkle from absolute time so nothing jumps
      // when the loop cycle wraps
      const stars = [];
      for (let i = 0; i < 14; i++) {
        stars.push({
          x: 4 + Math.random() * 92,
          y: 4 + Math.random() * 92,
          r: 1.6 + Math.random() * 2.6,
          phase: Math.random() * Math.PI * 2,
          speed: 2 + Math.random() * 2.5,
          color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)]
        });
      }

      function drawStar(star, now, flash) {
        const twinkle = 0.5 + 0.5 * Math.abs(Math.sin((now / 1000) * star.speed + star.phase));
        const flare = flash * flash;
        ctx.save();
        ctx.globalAlpha = Math.min(1, twinkle + flare * 0.6);
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r * (1 + flare * 1.8), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // sparkle stars that shoot outward from the center on each click
      // small pool: at 32px the icon saturates well before this many stars
      const burstParticles = [];
      const MAX_BURST_PARTICLES = 24;

      function spawnBurst(now) {
        const count = 8 + Math.floor(Math.random() * 3);
        for (let i = 0; i < count; i++) {
          if (burstParticles.length >= MAX_BURST_PARTICLES) burstParticles.shift();
          burstParticles.push({
            angle: Math.random() * Math.PI * 2,
            dist: 20 + Math.random() * 34,
            r: 9 + Math.random() * 9,
            spin: (Math.random() - 0.5) * 4,
            color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)],
            born: now,
            life: 800 + Math.random() * 400
          });
        }
      }

      function drawBurstStar(p, now) {
        const t = (now - p.born) / p.life;
        if (t >= 1) return false;
        const eased = t * (2 - t);
        const x = 50 + Math.cos(p.angle) * p.dist * eased;
        const y = 50 + Math.sin(p.angle) * p.dist * eased;
        const r = p.r * (1 - t * 0.4);
        ctx.save();
        ctx.globalAlpha = 1 - t;
        ctx.translate(x, y);
        ctx.rotate(p.angle + p.spin * t);
        ctx.lineCap = 'round';
        // colored star
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 3.6;
        ctx.beginPath();
        ctx.moveTo(-r, 0); ctx.lineTo(r, 0);
        ctx.moveTo(0, -r); ctx.lineTo(0, r);
        const d = r * 0.55;
        ctx.moveTo(-d, -d); ctx.lineTo(d, d);
        ctx.moveTo(-d, d); ctx.lineTo(d, -d);
        ctx.stroke();
        // bright white core for extra glint
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 1.8;
        const c = r * 0.45;
        ctx.beginPath();
        ctx.moveTo(-c, 0); ctx.lineTo(c, 0);
        ctx.moveTo(0, -c); ctx.lineTo(0, c);
        ctx.stroke();
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(0, 0, 1.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        return true;
      }

      // letter paths from favicon.svg; D widened slightly so it reads as a
      // capital D at tab size
      const pathR = new Path2D('M 28 35 L 28 60 M 28 35 L 38 35 Q 42 35 42 40 Q 42 45 38 45 L 28 45 M 42 45 L 48 60');
      const pathD = new Path2D('M 56 35 L 56 60 M 56 35 L 64 35 Q 72 36 72 47.5 Q 72 59 64 60 L 56 60');

      const sky = ctx.createRadialGradient(50, 50, 6, 50, 50, 72);
      sky.addColorStop(0, '#fdf4ff');
      sky.addColorStop(1, '#c8d4f2');

      const letterGradient = ctx.createLinearGradient(28, 35, 72, 60);
      letterGradient.addColorStop(0, '#D61F7E');
      letterGradient.addColorStop(0.5, '#6A0DAD');
      letterGradient.addColorStop(1, '#0B5FBF');

      const loopStart = performance.now();

      function draw(now) {
        // R draws in over 0-0.4, D over 0.4-0.8, hold to 0.9, then fade out
        const progress = ((now - loopStart) % FAVICON_LOOP_MS) / FAVICON_LOOP_MS;
        const flash = Math.max(0, Math.min(1, (faviconFlashUntil - now) / FAVICON_FLASH_MS));

        ctx.clearRect(0, 0, 100, 100);

        ctx.fillStyle = sky;
        ctx.fillRect(0, 0, 100, 100);

        for (let i = 0; i < stars.length; i++) drawStar(stars[i], now, flash);

        // click flash: brief purple wash over the whole icon
        if (flash > 0) {
          ctx.save();
          ctx.globalAlpha = 0.35 * flash;
          ctx.fillStyle = '#8A2BE2';
          ctx.fillRect(0, 0, 100, 100);
          ctx.restore();
        }

        // zoom the letters out to fill the frame; the raw paths only span
        // about half the viewBox
        ctx.save();
        ctx.translate(50, 50);
        ctx.scale(1.9, 1.9);
        ctx.translate(-50, -47.5);
        ctx.globalAlpha = progress < 0.9 ? 1 : 1 - (progress - 0.9) / 0.1;
        ctx.strokeStyle = letterGradient;
        ctx.lineWidth = 4.2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        const rProgress = Math.min(1, progress / 0.4);
        ctx.setLineDash([180]);
        ctx.lineDashOffset = 180 * (1 - rProgress);
        ctx.beginPath();
        ctx.stroke(pathR);

        const dProgress = Math.min(1, Math.max(0, (progress - 0.4) / 0.4));
        ctx.setLineDash([160]);
        ctx.lineDashOffset = 160 * (1 - dProgress);
        ctx.beginPath();
        ctx.stroke(pathD);
        ctx.restore();

        while (faviconBurstQueued > 0) {
          faviconBurstQueued--;
          spawnBurst(now);
        }
        for (let i = burstParticles.length - 1; i >= 0; i--) {
          if (!drawBurstStar(burstParticles[i], now)) burstParticles.splice(i, 1);
        }
      }

      let lastAppliedAt = 0; // drops async frames that arrive out of order
      let encodeInFlight = false; // never stack encodes on a slow machine

      function pushFrame(drawnAt) {
        if (typeof canvas.toBlob === 'function') {
          if (encodeInFlight) return;
          encodeInFlight = true;
          canvas.toBlob(function (blob) {
            encodeInFlight = false;
            try {
              if (!blob || faviconLoopStopped || drawnAt <= lastAppliedAt) return;
              lastAppliedAt = drawnAt;
              setFaviconBlob(blob);
            } catch (err) {
              debugError('favicon frame apply failed', err);
            }
          }, 'image/png');
        } else {
          try {
            lastAppliedAt = drawnAt;
            setFavicon(canvas.toDataURL('image/png'), 'image/png');
          } catch (err) {
            debugError('favicon frame apply failed (toDataURL fallback)', err);
          }
        }
      }

      const frameInterval = 1000 / FAVICON_FPS;
      const idleFrameInterval = 1000 / FAVICON_IDLE_FPS;
      let lastFrameAt = 0;

      function tick(now) {
        if (faviconLoopStopped) return;
        try {
          // full rate only while a click flash/burst is animating; the ambient
          // twinkle doesn't need that many PNG encodes per second
          const busy = faviconFlashUntil > now || faviconBurstQueued > 0 || burstParticles.length > 0;
          // skip drawing while the tab is hidden; rAF resumes on its own
          if (document.visibilityState !== 'hidden' && now - lastFrameAt >= (busy ? frameInterval : idleFrameInterval)) {
            draw(now);
            pushFrame(now);
            lastFrameAt = now;
          }
          window.requestAnimationFrame(tick);
        } catch (err) {
          // stop cleanly and hand back to the static SVG rather than leaving
          // a half-drawn frame as the permanent icon
          debugError('favicon loop failed', err);
          faviconLoopStopped = true;
          try { restoreOriginalFavicon(); } catch (e) { /* keep whatever icon is set */ }
        }
      }

      // flash and burst on page load too
      faviconFlashUntil = loopStart + FAVICON_FLASH_MS;
      faviconBurstQueued++;
      window.requestAnimationFrame(tick);
    } catch (err) {
      debugError('favicon loop setup failed', err);
      faviconLoopStopped = true;
      flashFallbackFavicon();
    }
  }

  function flashFavicon() {
    faviconFlashUntil = performance.now() + FAVICON_FLASH_MS;
    faviconBurstQueued++;
    if (faviconLoopStopped) {
      flashFallbackFavicon();
    } else if (!faviconLoopStarted) {
      // a click can land before the startup timeout fires
      startFaviconLoop();
    }
  }

  // small delay keeps favicon work clear of first paint
  window.setTimeout(startFaviconLoop, 120);

  // ---- cursor element + motion loop ----

  const el = document.createElement('div');
  el.id = 'custom-cursor';
  // separate layer for the click pop so it composes with .cursor-core's
  // idle/enlarge transform instead of overriding it
  const popLayer = document.createElement('div');
  popLayer.className = 'cursor-pop-layer';
  popLayer.style.setProperty('--pop-duration', POP_DURATION_MS + 'ms');
  const core = document.createElement('div');
  core.className = 'cursor-core';
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
      <path d="M1 1 L18 12 L12 14 L14 20 L10 18 L8 24 L6 23 L6 14 L1 1 Z" fill="url(#g1)" filter="url(#shadow)" />
    </svg>
  `;
  popLayer.appendChild(core);
  el.appendChild(popLayer);
  document.body.appendChild(el);
  document.body.classList.add('has-custom-cursor');

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let posX = mouseX;
  let posY = mouseY;
  let rafId = null;
  let snapOnNextMove = true;

  function applyPosition() {
    // translate3d keeps the cursor compositor-only; rounding keeps the SVG
    // crisp when parked
    el.style.transform = 'translate3d(' + Math.round(posX) + 'px,' + Math.round(posY) + 'px,0)';
  }

  function motionStep() {
    const dx = mouseX - posX;
    const dy = mouseY - posY;
    if (Math.abs(dx) < SETTLE_EPSILON_PX && Math.abs(dy) < SETTLE_EPSILON_PX) {
      posX = mouseX;
      posY = mouseY;
      applyPosition();
      rafId = null;
      return;
    }
    posX += dx * FOLLOW_EASING;
    posY += dy * FOLLOW_EASING;
    applyPosition();
    rafId = window.requestAnimationFrame(motionStep);
  }

  function startMotion() {
    if (rafId === null) rafId = window.requestAnimationFrame(motionStep);
  }

  function stopMotion() {
    if (rafId !== null) {
      window.cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  // ---- hover / idle state ----

  let hoverTarget = null;
  let idleTimer = null;
  let isIdle = true;
  let hoverRefreshPending = false;

  function setIdleState(nextIdle) {
    if (isIdle === nextIdle) return;
    isIdle = nextIdle;
    el.classList.toggle('idle', nextIdle);
  }

  function resetIdleState() {
    window.clearTimeout(idleTimer);
    setIdleState(false);
    idleTimer = window.setTimeout(function () { setIdleState(true); }, IDLE_DELAY_MS);
  }

  function setHoverState(target) {
    if (hoverTarget === target) return;
    hoverTarget = target;
    if (target && typeof target.closest === 'function' && target.closest(HOVER_SELECTORS)) {
      el.classList.add('cursor-enlarge');
    } else {
      el.classList.remove('cursor-enlarge');
    }
  }

  // re-derive hover state from the last known pointer position (needed after
  // tab hide/show, when no mouseover/mouseout fires)
  function refreshHoverState() {
    if (typeof document.elementFromPoint === 'function') {
      setHoverState(document.elementFromPoint(mouseX, mouseY));
    }
  }

  // ---- movement + click effects ----

  function spawnTracked(node, pool, cap) {
    while (pool.length >= cap) {
      const oldest = pool.shift();
      if (oldest && oldest.parentNode) oldest.parentNode.removeChild(oldest);
    }
    document.body.appendChild(node);
    pool.push(node);
    node.addEventListener('animationend', function () {
      const index = pool.indexOf(node);
      if (index >= 0) pool.splice(index, 1);
      if (node.parentNode) node.parentNode.removeChild(node);
    }, { once: true });
  }

  const SPARK_COLORS = ['#FF80BF', '#FFD166', '#8A2BE2', '#4B0082', '#00D4FF', '#7CFFB2'];
  const activeSparkles = [];
  let lastSparkAt = 0;

  function spawnMiniSparks(x, y) {
    const count = 2 + Math.floor(Math.random() * 2);
    for (let i = 0; i < count; i++) {
      const spark = document.createElement('div');
      spark.className = 'mini-spark';
      const size = 4 + Math.random() * 8;
      spark.style.width = size + 'px';
      spark.style.height = size + 'px';
      spark.style.background = SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)];
      spark.style.left = (x - size / 2) + 'px';
      spark.style.top = (y - size / 2) + 'px';
      const angle = Math.random() * Math.PI * 2;
      const distance = 14 + Math.random() * 24;
      spark.style.setProperty('--dx', Math.cos(angle) * distance + 'px');
      spark.style.setProperty('--dy', Math.sin(angle) * distance + 'px');
      spawnTracked(spark, activeSparkles, MAX_SPARKLES);
    }
  }

  const activeRings = [];

  function spawnClickRing(x, y) {
    const ring = document.createElement('div');
    ring.className = 'cursor-pop-ring';
    ring.style.left = x + 'px';
    ring.style.top = y + 'px';
    spawnTracked(ring, activeRings, MAX_CLICK_RINGS);
  }

  let popAnimation = null;

  function playClickPop() {
    if (typeof popLayer.animate !== 'function') {
      // fallback for browsers without the Web Animations API
      popLayer.classList.remove('cursor-pop-fallback');
      void popLayer.offsetWidth;
      popLayer.classList.add('cursor-pop-fallback');
      return;
    }
    if (popAnimation) popAnimation.cancel();
    popAnimation = popLayer.animate(
      [
        { transform: 'scale(1)' },
        { transform: 'scale(1.9)', offset: 0.4 },
        { transform: 'scale(1)' }
      ],
      { duration: POP_DURATION_MS, easing: 'cubic-bezier(.2,.85,.32,1)' }
    );
    popAnimation.onfinish = function () { popAnimation = null; };
  }

  // ---- visibility handling + event wiring ----

  function hideCursor() {
    el.classList.add('is-hidden');
    hoverTarget = null;
    el.classList.remove('cursor-enlarge');
    if (popAnimation) {
      popAnimation.cancel();
      popAnimation = null;
    }
    stopMotion();
    snapOnNextMove = true;
  }

  function handlePointerActivity(x, y) {
    if (typeof x === 'number' && typeof y === 'number') {
      mouseX = x;
      mouseY = y;
    }
    if (snapOnNextMove) {
      posX = mouseX;
      posY = mouseY;
      snapOnNextMove = false;
      applyPosition();
      // reveal only after the position is resynced, so the cursor doesn't
      // flash at its stale pre-hide spot
      el.classList.remove('is-hidden');
    }
    startMotion();
    resetIdleState();
  }

  document.addEventListener('mousemove', function (e) {
    handlePointerActivity(e.clientX, e.clientY);
    if (hoverRefreshPending) {
      hoverRefreshPending = false;
      refreshHoverState();
    }
    const now = performance.now();
    if (now - lastSparkAt > SPARK_INTERVAL_MS) {
      spawnMiniSparks(e.clientX, e.clientY);
      lastSparkAt = now;
    }
  }, { passive: true });

  document.addEventListener('mouseover', function (e) {
    handlePointerActivity(e.clientX, e.clientY);
    setHoverState(e.target);
  });

  document.addEventListener('mouseout', function (e) {
    const related = e.relatedTarget;
    if (related && typeof related.closest === 'function' && related.closest(HOVER_SELECTORS)) {
      setHoverState(related);
      return;
    }
    setHoverState(null);
  });

  document.addEventListener('mousedown', function (e) {
    if (e.button !== 0) return;
    handlePointerActivity(e.clientX, e.clientY);
    spawnClickRing(e.clientX, e.clientY);
    playClickPop();
    flashFavicon();
  });

  document.addEventListener('pointerenter', function (e) {
    handlePointerActivity(e && e.clientX, e && e.clientY);
  });

  // hide only when the document truly becomes hidden; transient blur events
  // shouldn't blank the cursor mid-interaction
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      hideCursor();
    } else {
      startMotion();
      refreshHoverState();
      // coordinates may be stale if the pointer moved while hidden; recheck
      // on the next real pointer event
      hoverRefreshPending = true;
    }
  });

  window.addEventListener('focus', function () {
    startMotion();
    refreshHoverState();
    hoverRefreshPending = true;
  });

  // scrolling moves content under a stationary pointer without mouse events
  let scrollRefreshQueued = false;
  window.addEventListener('scroll', function () {
    if (scrollRefreshQueued) return;
    scrollRefreshQueued = true;
    window.requestAnimationFrame(function () {
      scrollRefreshQueued = false;
      refreshHoverState();
    });
  }, { passive: true });

  applyPosition();
  resetIdleState();
})();
