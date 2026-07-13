/* Custom animated cursor with sparkle/click effects and favicon feedback.
 *
 * Layout of this file:
 *   1. Guards + configuration
 *   2. Favicon feedback (looping canvas-rendered R/D logo + click flash)
 *   3. Cursor element + motion loop
 *   4. Hover / idle state
 *   5. Movement + click effects
 *   6. Visibility handling + event wiring
 *
 * Loaded as a plain deferred script (see index.html), so no module syntax.
 * Disabled on touch-first devices.
 */
(function () {
  'use strict';

  // ------------------------------------------------ 1. Guards + configuration

  // Pointer-coarse detection rather than maxTouchPoints: hybrid laptops report
  // touch points even when a mouse is present.
  if (window.matchMedia && window.matchMedia('(pointer: coarse)').matches) return;

  // Runtime debug toggle: set localStorage.RD_DEBUG = '1' to log in production.
  const RD_DEBUG = (function () {
    try { return window.localStorage.getItem('RD_DEBUG') === '1'; } catch (e) { return false; }
  })();

  function debugError(label, err) {
    if (RD_DEBUG && window.console && console.error) console.error('[custom-cursor] ' + label, err);
  }

  // Tunables gathered in one place.
  const FOLLOW_EASING = 0.22;      // fraction of remaining distance per frame
  const SETTLE_EPSILON_PX = 0.1;   // park the motion loop once this close
  const IDLE_DELAY_MS = 140;       // pointer quiet time before the idle shrink
  const SPARK_INTERVAL_MS = 90;    // minimum gap between sparkle bursts
  const MAX_SPARKLES = 28;
  const MAX_CLICK_RINGS = 8;
  const POP_DURATION_MS = 280;
  const FAVICON_LOOP_MS = 3000;    // one full R/D draw-in + hold + fade cycle
  const FAVICON_FPS = 10;          // tab icons don't benefit from more
  const FAVICON_FLASH_MS = 450;    // click flash overlay duration
  const FAVICON_CANVAS_PX = 64;    // fixed backing store; icons display at 16-32px

  const HOVER_SELECTORS = 'a, button, input, select, textarea, summary, details, ' +
    '[role="button"], .page-link-cta, .badge-cta, .focus-badge, .project, ' +
    '.connect-links a, .collapsible';

  // --------------------------------------------------- 2. Favicon feedback

  // The favicon is a small canvas that perpetually loops the "R D" logo
  // draw-in; clicking layers a short flash/burst over the running loop.
  // Frames are encoded asynchronously (toBlob) so the main thread — and
  // therefore the cursor — never blocks on PNG encoding, and a single
  // <link> element is reused for every update. Cost stays negligible: a
  // fixed 64px canvas, ~10 frames/sec, paths/gradients/stars built once,
  // and no drawing or encoding at all while the tab is hidden.

  const originalFavicon = (function () {
    const link = document.getElementById('favicon') || document.querySelector('link[rel~="icon"]');
    return {
      href: (link && link.getAttribute('href')) || 'favicon.svg',
      type: (link && link.getAttribute('type')) || 'image/svg+xml'
    };
  })();

  let faviconLink = null;        // single reusable <link rel="icon"> element
  let faviconObjectUrl = null;   // current blob URL, revoked (deferred) on replacement
  let faviconLoopStarted = false;
  let faviconLoopStopped = false; // unrecoverable error: blocks any stale async frames
  let faviconFlashUntil = 0;      // performance.now() deadline for the click flash

  function ensureFaviconLink(type) {
    if (!faviconLink || !faviconLink.isConnected) {
      const head = document.head || document.getElementsByTagName('head')[0];
      const old = document.getElementById('favicon') || document.querySelector('link[rel~="icon"]');
      // Clone rather than create bare: preserves any extra attributes
      // (sizes, media, ...) the original tag might carry.
      faviconLink = (old && old.cloneNode(false)) || document.createElement('link');
      faviconLink.rel = 'icon';
      faviconLink.id = 'favicon';
      head.appendChild(faviconLink);
      if (old && old !== faviconLink && old.parentNode) old.parentNode.removeChild(old);
    }
    // Something else (an extension, another script) may have inserted its
    // own icon link alongside ours since we last checked; without removing
    // it the browser can end up rendering that one instead of the frames
    // this module is actively animating.
    const duplicates = document.querySelectorAll('link[rel~="icon"]');
    for (let i = 0; i < duplicates.length; i++) {
      const node = duplicates[i];
      if (node !== faviconLink && node.parentNode) node.parentNode.removeChild(node);
    }
    faviconLink.type = type;
    return faviconLink;
  }

  function setFavicon(href, type) {
    const link = ensureFaviconLink(type);
    link.href = href;
    // Re-append the existing node: some browsers only rescan icons when a
    // link is inserted, and moving the same node is far cheaper than
    // creating a fresh one per frame.
    if (link.parentNode) link.parentNode.appendChild(link);
  }

  function setFaviconBlob(blob) {
    const newUrl = URL.createObjectURL(blob);
    try {
      setFavicon(newUrl, 'image/png');
    } catch (err) {
      URL.revokeObjectURL(newUrl); // never applied; don't leak it
      throw err;
    }
    const previousUrl = faviconObjectUrl;
    faviconObjectUrl = newUrl;
    if (previousUrl) {
      // Defer the revoke instead of doing it in the same tick as the href
      // swap -- gives the browser's icon fetch a moment to finish reading
      // the old blob before the URL backing it is invalidated.
      window.setTimeout(function () { URL.revokeObjectURL(previousUrl); }, 200);
    }
  }

  function restoreOriginalFavicon() {
    // Only revoke once the href swap actually succeeds -- revoking
    // unconditionally (even on failure) would leave the <link> pointing at
    // a blob URL that's already been invalidated.
    setFavicon(originalFavicon.href, originalFavicon.type);
    if (faviconObjectUrl) {
      URL.revokeObjectURL(faviconObjectUrl);
      faviconObjectUrl = null;
    }
  }

  // Canvas-independent fallback: cache-bust the original SVG href so the
  // browser still flashes/reloads the icon once, even when canvas setup
  // itself failed (blocked by an extension/CSP, unsupported, etc).
  function flashFallbackFavicon() {
    try {
      setFavicon(originalFavicon.href.split('?')[0] + '?r=' + Math.round(performance.now()), originalFavicon.type);
    } catch (err) {
      debugError('favicon fallback flash failed', err);
    } finally {
      // This bypasses setFaviconBlob/restoreOriginalFavicon, so it must do
      // their object-URL cleanup itself or a prior run's blob URL leaks.
      if (faviconObjectUrl) {
        URL.revokeObjectURL(faviconObjectUrl);
        faviconObjectUrl = null;
      }
    }
  }

  function startFaviconLoop() {
    if (faviconLoopStarted || faviconLoopStopped) return;
    faviconLoopStarted = true;

    try {
      // Fixed-size backing store: tab icons display at 16-32px, so a
      // constant 64px canvas is already oversampled and keeps the encode
      // cost flat regardless of devicePixelRatio. All drawing code stays in
      // favicon.svg's 0..100 coordinate space via this one scale.
      const canvas = document.createElement('canvas');
      canvas.width = FAVICON_CANVAS_PX;
      canvas.height = FAVICON_CANVAS_PX;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('2d context unavailable');
      ctx.scale(FAVICON_CANVAS_PX / 100, FAVICON_CANVAS_PX / 100);

      // Star field for the background: generated once for the loop's whole
      // lifetime, and twinkling from absolute time rather than cycle
      // progress so nothing jumps when the cycle wraps. Reuses the cursor's
      // own SPARK_COLORS palette so the favicon matches the on-screen
      // sparkle trail.
      const stars = [];
      for (let i = 0; i < 20; i++) {
        stars.push({
          x: 8 + Math.random() * 84,
          y: 8 + Math.random() * 84,
          r: 0.6 + Math.random() * 1.3,
          phase: Math.random() * Math.PI * 2,
          speed: 2 + Math.random() * 2.5,
          color: SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)]
        });
      }

      function drawStar(star, now, flash) {
        // Steady twinkle, plus a brighter/bigger flare while a click flash
        // is active -- stars igniting instead of the old red flash.
        const twinkle = 0.35 + 0.65 * Math.abs(Math.sin((now / 1000) * star.speed + star.phase));
        const flare = flash * flash;
        ctx.save();
        ctx.globalAlpha = Math.min(1, twinkle + flare * 0.6);
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r * (1 + flare * 1.8), 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Paths copied from favicon.svg (viewBox 0..100).
      const pathR = new Path2D('M 28 35 L 28 60 M 28 35 L 38 35 Q 42 35 42 40 Q 42 45 38 45 L 28 45 M 42 45 L 48 60');
      const pathD = new Path2D('M 56 35 L 56 60 M 56 35 L 66 35 Q 70 35 70 47.5 Q 70 60 66 60 L 56 60');

      // Gradients are built once for the loop, not per frame: their
      // coordinates and color stops never depend on time, so recreating
      // them on every draw() call would just be wasted allocation.
      const sky = ctx.createRadialGradient(50, 50, 4, 50, 50, 46);
      sky.addColorStop(0, '#1c0f33');
      sky.addColorStop(1, '#05060a');

      const letterGradient = ctx.createLinearGradient(28, 35, 70, 60);
      letterGradient.addColorStop(0, '#FF80BF');
      letterGradient.addColorStop(0.5, '#8A2BE2');
      letterGradient.addColorStop(1, '#00D4FF');

      const loopStart = performance.now();

      function draw(now) {
        // Position within the current cycle: R draws in over 0-0.4, D over
        // 0.4-0.8, hold until 0.9, then the letters fade out so the next
        // cycle's draw-in starts from a clean sky.
        const progress = ((now - loopStart) % FAVICON_LOOP_MS) / FAVICON_LOOP_MS;
        // 1 at the moment of a click, easing back to 0 over FAVICON_FLASH_MS.
        const flash = Math.max(0, Math.min(1, (faviconFlashUntil - now) / FAVICON_FLASH_MS));

        ctx.clearRect(0, 0, 100, 100);

        // Dark starry-sky background instead of the old red-to-light-blue
        // flash, matching the site's dark theme.
        ctx.fillStyle = sky;
        ctx.beginPath();
        ctx.arc(50, 50, 45, 0, Math.PI * 2);
        ctx.fill();

        // Clip the star field to the badge circle so stars never draw past
        // its edge.
        ctx.save();
        ctx.beginPath();
        ctx.arc(50, 50, 45, 0, Math.PI * 2);
        ctx.clip();
        for (let i = 0; i < stars.length; i++) drawStar(stars[i], now, flash);
        ctx.restore();

        // Outer circle stroke, recolored to the site's rainbow/purple
        // palette instead of plain blue. It pulses once per cycle (cosine
        // is periodic, so no jump at the wrap) and brightens with the flash.
        const pulse = 0.85 + 0.15 * Math.cos(2 * Math.PI * progress);
        ctx.save();
        ctx.globalAlpha = Math.min(1, 0.5 * pulse + 0.4 * flash);
        ctx.strokeStyle = '#8A2BE2';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(50, 50, 47, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        // R/D letters: gradient stroke + soft glow instead of flat blue
        ctx.save();
        ctx.globalAlpha = progress < 0.9 ? 1 : 1 - (progress - 0.9) / 0.1;
        ctx.strokeStyle = letterGradient;
        ctx.shadowColor = '#8A2BE2';
        ctx.shadowBlur = 6;
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // draw R with dash effect
        const rProgress = Math.min(1, progress / 0.4);
        ctx.setLineDash([180]);
        ctx.lineDashOffset = 180 * (1 - rProgress);
        ctx.beginPath();
        ctx.stroke(pathR);

        // draw D with delayed dash effect
        const dProgress = Math.min(1, Math.max(0, (progress - 0.4) / 0.4));
        ctx.setLineDash([160]);
        ctx.lineDashOffset = 160 * (1 - dProgress);
        ctx.beginPath();
        ctx.stroke(pathD);
        ctx.restore();
      }

      let lastAppliedAt = 0; // drops async frames that arrive out of order

      function pushFrame(drawnAt) {
        if (typeof canvas.toBlob === 'function') {
          canvas.toBlob(function (blob) {
            try {
              if (!blob || faviconLoopStopped || drawnAt <= lastAppliedAt) return;
              lastAppliedAt = drawnAt;
              setFaviconBlob(blob);
            } catch (err) {
              debugError('favicon frame apply failed', err);
            }
          }, 'image/png');
        } else {
          // Synchronous fallback for browsers without toBlob.
          try {
            lastAppliedAt = drawnAt;
            setFavicon(canvas.toDataURL('image/png'), 'image/png');
          } catch (err) {
            debugError('favicon frame apply failed (toDataURL fallback)', err);
          }
        }
      }

      const frameInterval = 1000 / FAVICON_FPS;
      let lastFrameAt = 0; // 0 forces an immediate first frame

      function tick(now) {
        if (faviconLoopStopped) return;
        try {
          // Skip drawing while hidden: nobody sees the frames, and rAF is
          // throttled or paused there anyway. The loop resumes on its own
          // when the tab becomes visible and rAF starts firing again.
          if (document.visibilityState !== 'hidden' && now - lastFrameAt >= frameInterval) {
            draw(now);
            pushFrame(now);
            lastFrameAt = now;
          }
          window.requestAnimationFrame(tick);
        } catch (err) {
          // Without this catch a throw would silently kill the loop and
          // leave a half-drawn frame as the permanent icon; stop cleanly
          // and hand back to the crisp SVG instead. faviconLoopStopped also
          // blocks any still-in-flight toBlob callbacks from clobbering
          // the restored icon.
          debugError('favicon loop failed', err);
          faviconLoopStopped = true;
          try { restoreOriginalFavicon(); } catch (e) { /* leave whatever icon is set */ }
        }
      }

      // Ignite the stars on the very first frames too, so page load gets
      // the same "pop" a click does.
      faviconFlashUntil = loopStart + FAVICON_FLASH_MS;
      window.requestAnimationFrame(tick);
    } catch (err) {
      debugError('favicon loop setup failed', err);
      faviconLoopStopped = true;
      flashFallbackFavicon();
    }
  }

  // Click feedback: extend the flash deadline and let the running loop pick
  // it up on its next frame -- at 10fps that lands within ~100ms, well
  // inside the 450ms flash window, so the pop is never missed. Rapid
  // clicking just keeps pushing the deadline out; there is no queue to
  // glitch through.
  function flashFavicon() {
    faviconFlashUntil = performance.now() + FAVICON_FLASH_MS;
    if (faviconLoopStopped) {
      // Loop unavailable (canvas blocked by an extension/CSP, earlier
      // unrecoverable error): at least cache-bust the static icon so a
      // click still nudges the tab once.
      flashFallbackFavicon();
    } else if (!faviconLoopStarted) {
      // A click can land before the startup timeout below fires.
      startFaviconLoop();
    }
  }

  // Start the loop shortly after load; the small delay keeps favicon work
  // clear of the page's first paint.
  window.setTimeout(startFaviconLoop, 120);

  // ------------------------------------------- 3. Cursor element + motion loop

  const el = document.createElement('div');
  el.id = 'custom-cursor';
  // The click-pop animates this dedicated layer via the Web Animations API.
  // It sits between #custom-cursor (position) and .cursor-core (idle/enlarge
  // CSS transform) so the pop composes with whatever state is already
  // showing instead of overriding the same element's transform property.
  const popLayer = document.createElement('div');
  popLayer.className = 'cursor-pop-layer';
  // Single source of truth for the fallback CSS animation's duration too
  // (see .cursor-pop-fallback in styles.css), so the two paths can't drift.
  popLayer.style.setProperty('--pop-duration', POP_DURATION_MS + 'ms');
  const core = document.createElement('div');
  core.className = 'cursor-core';
  /* Stylized pointy cursor SVG; the tip sits at the element's top-left. */
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
  popLayer.appendChild(core);
  el.appendChild(popLayer);
  document.body.appendChild(el);
  // mark body so CSS hides the native cursor only when the custom one exists
  document.body.classList.add('has-custom-cursor');

  let mouseX = window.innerWidth / 2;
  let mouseY = window.innerHeight / 2;
  let posX = mouseX;
  let posY = mouseY;
  let rafId = null;
  let snapOnNextMove = true; // jump straight to the pointer on first use / after hide

  function applyPosition() {
    // translate3d keeps the cursor compositor-only; writing left/top forced a
    // layout pass on every frame. Round to whole pixels so the SVG stays
    // crisp when parked instead of sitting on a blurred sub-pixel offset.
    el.style.transform = 'translate3d(' + Math.round(posX) + 'px,' + Math.round(posY) + 'px,0)';
  }

  function motionStep() {
    const dx = mouseX - posX;
    const dy = mouseY - posY;
    if (Math.abs(dx) < SETTLE_EPSILON_PX && Math.abs(dy) < SETTLE_EPSILON_PX) {
      posX = mouseX;
      posY = mouseY;
      applyPosition();
      rafId = null; // park the loop; pointer activity restarts it
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

  // ------------------------------------------------- 4. Hover / idle state

  let hoverTarget = null;
  let idleTimer = null;
  let isIdle = true;
  let hoverRefreshPending = false; // see refreshHoverState

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

  // Re-derive hover state from the last known pointer position. Needed after
  // a tab hide/show cycle: if the pointer never left the hovered element, no
  // mouseover/mouseout fires to naturally refresh setHoverState's target.
  // mouseX/mouseY can be stale here (e.g. the real pointer moved in a
  // different window while this tab was hidden) -- callers that can't
  // guarantee fresh coordinates should also set hoverRefreshPending so the
  // next real mousemove re-derives it from its own event coordinates.
  function refreshHoverState() {
    if (typeof document.elementFromPoint === 'function') {
      setHoverState(document.elementFromPoint(mouseX, mouseY));
    }
  }

  // -------------------------------------------- 5. Movement + click effects

  // Shared bookkeeping for short-lived effect nodes: evict the oldest past
  // the cap and remove each node when its CSS animation ends.
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

  // Click pop via the Web Animations API: each call restarts natively — no
  // cleanup timer to desync from CSS. Falls back to a CSS class restart only
  // on browsers without Element.animate().
  let popAnimation = null;

  function playClickPop() {
    if (typeof popLayer.animate !== 'function') {
      // Rare pre-Web-Animations-API browsers: fall back to a plain CSS
      // animation restart (no forwards fill, so it self-resets on end).
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

  // ------------------------------- 6. Visibility handling + event wiring

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
      // Only reveal the cursor once its position is resynced — revealing it
      // immediately on tab-return would flash it at the stale pre-hide spot.
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
    if (e.button !== 0) return; // left click only; ignore right/middle click
    handlePointerActivity(e.clientX, e.clientY);
    spawnClickRing(e.clientX, e.clientY);
    playClickPop();
    flashFavicon();
  });

  document.addEventListener('pointerenter', function (e) {
    handlePointerActivity(e && e.clientX, e && e.clientY);
  });

  // Hide only when the document truly becomes hidden; transient blur events
  // must not blank the cursor mid-interaction.
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden') {
      hideCursor();
    } else {
      startMotion();
      refreshHoverState();
      // mouseX/mouseY above may be stale if the real pointer moved in a
      // different window while this tab was hidden; force one more
      // recheck using fresh coordinates on the next real pointer event.
      hoverRefreshPending = true;
    }
  });

  window.addEventListener('focus', function () {
    startMotion();
    refreshHoverState();
    hoverRefreshPending = true;
  });

  // Scrolling can move different content under a stationary pointer without
  // firing any mouse event; screen coordinates (mouseX/mouseY) stay valid
  // here, so a direct recheck (rAF-throttled) is correct, unlike the
  // deferred one above.
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
