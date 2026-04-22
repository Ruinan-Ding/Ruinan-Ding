/* Simple sparkle trail cursor
   Creates short-lived sparkle elements that follow the cursor for a sprinkly animated effect.
*/
(function(){
  if (!('addEventListener' in document)) return;

  const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  if (isTouch) return; // don't enable on touch devices

  const colors = ['#FF80BF','#FFD166','#8A2BE2','#4B0082','#00D4FF','#7CFFB2'];

  function createSpark(x, y){
    const el = document.createElement('div');
    el.className = 'sparkle';
    const size = 6 + Math.random()*10;
    el.style.width = size + 'px';
    el.style.height = size + 'px';
    el.style.left = (x - size/2) + 'px';
    el.style.top = (y - size/2) + 'px';
    el.style.background = colors[Math.floor(Math.random()*colors.length)];
    el.style.opacity = '0.95';
    document.body.appendChild(el);
    // remove after animation
    el.addEventListener('animationend', () => el.remove());
  }

  let last = 0;
  function onMove(e){
    const now = performance.now();
    // spawn at most ~6 per 100ms
    if (now - last < 25) return;
    last = now;
    const x = e.clientX;
    const y = e.clientY;
    // create multiple small sparks
    const count = 1 + Math.floor(Math.random()*2);
    for(let i=0;i<count;i++){
      setTimeout(()=> createSpark(x + (Math.random()*12-6), y + (Math.random()*12-6)), i*8);
    }
  }

  // attach
  document.addEventListener('mousemove', onMove, {passive:true});

})();
