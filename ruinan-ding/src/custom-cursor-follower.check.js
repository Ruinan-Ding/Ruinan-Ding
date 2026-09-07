/* Self-check for the two bits of custom-cursor-follower.js's favicon loop that
 * fail silently — the icon just quietly stops moving and nobody notices:
 *   1. the loop must keep rescheduling forever; the ambient art is a 3s
 *      draw-in/fade cycle, so any early exit strands it mid-letter
 *   2. a toBlob callback that never fires must not hold the encode latch shut
 *      for the rest of the session
 *
 *   node src/custom-cursor-follower.check.js
 */
'use strict';
const assert = require('assert');

// ---- just enough DOM to run the script ----

let now = 0;
let canvasEl = null;
let encodes = 0;
const rafQueue = [];
const timers = [];

function makeEl(tag) {
  const el = {
    tagName: tag, id: '', rel: '', type: '', href: '', className: '', innerHTML: '',
    width: 0, height: 0, isConnected: true, parentNode: null, children: [],
    style: { cssText: '', setProperty() {} },
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    appendChild(c) { c.parentNode = el; el.children.push(c); return c; },
    removeChild(c) { c.parentNode = null; return c; },
    addEventListener() {}, removeEventListener() {},
    setAttribute() {}, getAttribute() { return null; },
    cloneNode() { return makeEl(tag); },
    animate() { return { cancel() {}, onfinish: null }; }
  };
  if (tag === 'canvas') {
    canvasEl = el;
    el.getContext = () => new Proxy({}, {
      get: (_, k) => (k === 'createLinearGradient' || k === 'createRadialGradient'
        ? () => ({ addColorStop() {} })
        : () => {}),
      set: () => true
    });
    el.toBlob = (cb) => { encodes++; cb({ size: 1 }); };  // synchronous stand-in
    el.toDataURL = () => 'data:image/png;base64,';
  }
  return el;
}

const listeners = {};
const doc = {
  visibilityState: 'visible',
  head: makeEl('head'),
  body: makeEl('body'),
  createElement: makeEl,
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  getElementsByTagName: () => [makeEl('head')],
  elementFromPoint: () => null,
  addEventListener(type, fn) { (listeners[type] = listeners[type] || []).push(fn); }
};

global.window = {
  innerWidth: 1024, innerHeight: 768,
  matchMedia: () => ({ matches: false }),          // not coarse, not reduced-motion
  localStorage: { getItem: () => null },
  requestAnimationFrame: (fn) => rafQueue.push(fn),
  setTimeout: (fn, ms) => timers.push({ fn, at: now + ms }),
  clearTimeout: () => {},
  addEventListener: doc.addEventListener,
  console
};
global.document = doc;
global.performance = { now: () => now };
global.URL = { createObjectURL: () => 'blob:x', revokeObjectURL: () => {} };
global.Path2D = function () { return {}; };

require('./custom-cursor-follower.js');

// ---- drive the virtual clock ----

function advance(ms, step) {
  step = step || 16;
  for (let elapsed = 0; elapsed < ms; elapsed += step) {
    now += step;
    for (let i = timers.length - 1; i >= 0; i--) {
      if (timers[i].at <= now) timers.splice(i, 1)[0].fn();
    }
    const due = rafQueue.splice(0, rafQueue.length);
    due.forEach((fn) => fn(now));
  }
}

// The ambient favicon animation must never stop on its own.
advance(200);
assert.ok(rafQueue.length > 0, 'loop should be running during the startup burst');

advance(6000); // well past the startup flash and its particles
assert.ok(rafQueue.length > 0, 'loop must keep running when idle — the ambient art is a loop');

// A click still has to register while it runs.
const onMouseDown = listeners.mousedown[0];
const framesBefore = encodes;
onMouseDown({ button: 0, clientX: 10, clientY: 10 });
advance(200);
assert.ok(encodes > framesBefore, 'a click must still produce new favicon frames');

// A toBlob callback that never comes back must not wedge the loop: the latch
// releases after 1s so the icon keeps animating on a browser that drops one.
canvasEl.toBlob = () => { encodes++; };   // swallow the callback
const wedgedAt = encodes;
advance(3000);
assert.ok(encodes - wedgedAt >= 2, 'a dropped toBlob callback must not freeze the icon (got ' + (encodes - wedgedAt) + ')');

console.log('ok - favicon loop keeps animating and survives a dropped encode');
