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
      console.debug && console.debug('[favicon-animator] favicon updated');
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

  console.debug && console.debug('[favicon-animator] started');

  // Start animation when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', drawFavicon);
  } else {
    drawFavicon();
  }
})();
