/* Self-check for the favicon loop's park/wake state machine, the one bit of
 * custom-cursor-follower.js that fails silently: park too eagerly and the icon
 * freezes mid-burst, never park and it PNG-encodes a new icon 5x/second for
 * the life of the tab.
 *
 *   node src/custom-cursor-follower.check.js
 */
'use strict';
const assert = require('assert');

// ---- just enough DOM to run the script ----

let now = 0;
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
    el.getContext = () => new Proxy({}, {
      get: (_, k) => (k === 'createLinearGradient' || k === 'createRadialGradient'
        ? () => ({ addColorStop() {} })
        : () => {}),
      set: () => true
    });
    el.toBlob = (cb) => cb({ size: 1 });          // synchronous stand-in
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

// The startup burst runs the loop...
advance(200);
assert.ok(rafQueue.length > 0, 'loop should be running during the startup burst');

// ...and once the flash and its particles settle, it must stop scheduling.
advance(6000);
assert.strictEqual(rafQueue.length, 0, 'loop must park when nothing is animating');

// A click has to wake it back up, or the icon stays frozen for the session.
const onMouseDown = listeners.mousedown[0];
onMouseDown({ button: 0, clientX: 10, clientY: 10 });
assert.ok(rafQueue.length > 0, 'a click must wake the parked loop');

advance(200);
assert.ok(rafQueue.length > 0, 'loop should still be running mid-burst');
advance(6000);
assert.strictEqual(rafQueue.length, 0, 'loop must park again after the click burst');

console.log('ok - favicon loop parks when idle and wakes on click');
