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
