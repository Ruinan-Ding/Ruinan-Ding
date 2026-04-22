/* Large animated custom cursor follower
   - Creates a single large cursor element that follows the pointer.
   - Spawns small sparkles on movement for a sprinkly effect.
   - Disabled on touch devices.
*/
(function(){
  if ('ontouchstart' in window || navigator.maxTouchPoints > 0) return;

  const el = document.createElement('div');
  el.id = 'custom-cursor';
  const core = document.createElement('div');
  core.className = 'cursor-core';
  core.textContent = 'RD';
  el.appendChild(core);
  document.body.appendChild(el);

  let mouseX = window.innerWidth/2, mouseY = window.innerHeight/2;
  let posX = mouseX, posY = mouseY;
  let raf = null;

  function animate(){
    posX += (mouseX - posX) * 0.18;
    posY += (mouseY - posY) * 0.18;
    el.style.left = posX + 'px';
    el.style.top = posY + 'px';
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

  // click feedback
  document.addEventListener('mousedown', () => {
    el.classList.add('cursor-click');
    setTimeout(() => el.classList.remove('cursor-click'), 200);
  });

  window.addEventListener('blur', () => { if (raf) cancelAnimationFrame(raf); });
  window.addEventListener('focus', () => { if (!raf) animate(); });

})();
