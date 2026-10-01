'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

const script = fs.readFileSync(path.join(__dirname, 'custom-cursor-follower.js'), 'utf8');

function createHarness(options = {}) {
  let now = 0;
  let nextId = 0;
  const timers = new Map();
  const frames = new Map();
  const documentListeners = new Map();
  const windowListeners = new Map();
  const revokedUrls = [];
  const env = {
    encodes: 0,
    drawCalls: 0,
    blobCallbacks: [],
    blobMode: options.blobMode || 'sync',
    toBlobEnabled: options.toBlobEnabled !== false,
    contextEnabled: options.contextEnabled !== false,
    throwOnDraw: false,
    canvasCreations: 0,
    hoverTarget: null,
    elementFromPointCalls: 0
  };

  function makeElement(tagName) {
    const classes = new Set();
    const attributes = new Map();
    const listeners = new Map();
    const styleProperties = new Map();
    const element = {
      tagName: tagName.toUpperCase(),
      id: '',
      rel: '',
      type: '',
      href: '',
      width: 0,
      height: 0,
      innerHTML: '',
      parentNode: null,
      children: [],
      isConnected: true,
      style: {
        cssText: '',
        setProperty(name, value) { styleProperties.set(name, value); },
        getPropertyValue(name) { return styleProperties.get(name) || ''; }
      },
      classList: {
        add(name) { classes.add(name); },
        remove(name) { classes.delete(name); },
        contains(name) { return classes.has(name); },
        toggle(name, force) {
          const shouldAdd = force === undefined ? !classes.has(name) : force;
          if (shouldAdd) classes.add(name);
          else classes.delete(name);
          return shouldAdd;
        }
      },
      get className() { return [...classes].join(' '); },
      set className(value) {
        classes.clear();
        for (const name of value.split(/\s+/).filter(Boolean)) classes.add(name);
      },
      appendChild(child) {
        if (child.parentNode) child.parentNode.removeChild(child);
        this.children.push(child);
        child.parentNode = this;
        child.isConnected = true;
        return child;
      },
      removeChild(child) {
        const index = this.children.indexOf(child);
        if (index !== -1) this.children.splice(index, 1);
        child.parentNode = null;
        child.isConnected = false;
        return child;
      },
      addEventListener(type, listener) {
        const handlers = listeners.get(type) || [];
        handlers.push(listener);
        listeners.set(type, handlers);
      },
      removeEventListener(type, listener) {
        const handlers = listeners.get(type) || [];
        listeners.set(type, handlers.filter((handler) => handler !== listener));
      },
      dispatch(type, event = {}) {
        for (const listener of listeners.get(type) || []) listener({ target: this, ...event });
      },
      setAttribute(name, value) {
        attributes.set(name, String(value));
        if (name === 'href') this.href = String(value);
        if (name === 'type') this.type = String(value);
        if (name === 'rel') this.rel = String(value);
        if (name === 'id') this.id = String(value);
      },
      getAttribute(name) {
        return attributes.has(name) ? attributes.get(name) : null;
      },
      cloneNode() {
        const clone = makeElement(tagName);
        for (const [name, value] of attributes) clone.setAttribute(name, value);
        return clone;
      },
      closest() { return this.matchesHover ? this : null; },
      animate: options.animateEnabled === false ? undefined : function () {
        const animation = { cancelled: false, cancel() { this.cancelled = true; }, onfinish: null };
        this.lastAnimation = animation;
        return animation;
      }
    };
    if (tagName === 'canvas') {
      env.canvasCreations++;
      const context = new Proxy({}, {
        get(_target, property) {
          if (property === 'createLinearGradient' || property === 'createRadialGradient') {
            return () => ({ addColorStop() {} });
          }
          if (property === 'clearRect') return () => {
            if (env.throwOnDraw) throw new Error('canvas draw failed');
            env.drawCalls++;
          };
          return () => {};
        },
        set() { return true; }
      });
      element.getContext = () => env.contextEnabled ? context : null;
      if (env.toBlobEnabled) {
        element.toBlob = (callback) => {
          env.encodes++;
          if (env.blobMode === 'sync') callback({ size: 1 });
          else if (env.blobMode === 'queue') env.blobCallbacks.push(callback);
        };
      }
      element.toDataURL = () => 'data:image/png;base64,test';
    }
    return element;
  }

  const head = makeElement('head');
  const body = makeElement('body');
  const originalIcon = makeElement('link');
  originalIcon.setAttribute('id', 'favicon');
  originalIcon.setAttribute('rel', 'icon');
  originalIcon.setAttribute('type', 'image/svg+xml');
  originalIcon.setAttribute('href', 'favicon.svg?v=3');
  head.appendChild(originalIcon);

  const document = {
    visibilityState: 'visible',
    head,
    body,
    createElement: makeElement,
    getElementById(id) { return id === 'favicon' ? head.children.find((item) => item.id === id) || null : null; },
    querySelector(selector) {
      return selector === 'link[rel~="icon"]' ? head.children.find((item) => item.rel.split(/\s+/).includes('icon')) || null : null;
    },
    querySelectorAll(selector) {
      return selector === 'link[rel~="icon"]' ? head.children.filter((item) => item.rel.split(/\s+/).includes('icon')) : [];
    },
    getElementsByTagName(name) { return name === 'head' ? [head] : []; },
    elementFromPoint() {
      env.elementFromPointCalls++;
      return env.hoverTarget;
    },
    addEventListener(type, listener) {
      const handlers = documentListeners.get(type) || [];
      handlers.push(listener);
      documentListeners.set(type, handlers);
    }
  };

  const window = {
    innerWidth: 1024,
    innerHeight: 768,
    localStorage: {
      getItem() {
        if (options.localStorageThrows) throw new Error('storage blocked');
        return null;
      }
    },
    console: { error() {} },
    matchMedia: options.matchMedia === false
      ? undefined
      : (query) => ({
        matches: query.includes('pointer: coarse')
          ? Boolean(options.coarse)
          : query.includes('prefers-reduced-motion')
            ? Boolean(options.reducedMotion)
            : false
      }),
    requestAnimationFrame(callback) {
      const id = ++nextId;
      frames.set(id, callback);
      return id;
    },
    cancelAnimationFrame(id) { frames.delete(id); },
    setTimeout(callback, delay) {
      const id = ++nextId;
      timers.set(id, { callback, at: now + delay });
      return id;
    },
    clearTimeout(id) { timers.delete(id); },
    addEventListener(type, listener) {
      const handlers = windowListeners.get(type) || [];
      handlers.push(listener);
      windowListeners.set(type, handlers);
    }
  };
  const context = vm.createContext({
    window,
    document,
    performance: { now: () => now },
    URL: {
      createObjectURL: () => `blob:test-${++nextId}`,
      revokeObjectURL: (url) => revokedUrls.push(url)
    },
    Path2D: function Path2D() {},
    console: window.console
  });
  vm.runInContext(script, context, { filename: 'custom-cursor-follower.js' });

  function dispatch(target, type, event = {}) {
    const handlers = (target === 'window' ? windowListeners : documentListeners).get(type) || [];
    for (const handler of handlers) handler(event);
  }

  function advance(duration, step = 16) {
    for (let elapsed = 0; elapsed < duration; elapsed += step) {
      now += step;
      let dueTimer;
      do {
        dueTimer = [...timers.entries()].find(([, timer]) => timer.at <= now);
        if (dueTimer) {
          timers.delete(dueTimer[0]);
          dueTimer[1].callback();
        }
      } while (dueTimer);
      const dueFrames = [...frames.values()];
      frames.clear();
      for (const frame of dueFrames) frame(now);
    }
  }

  env.advance = advance;
  env.dispatch = dispatch;
  env.document = document;
  env.revokedUrls = revokedUrls;
  env.frames = frames;
  env.timers = timers;
  env.listeners = documentListeners;
  return env;
}

function getCursor(harness) {
  return harness.document.body.children.find((child) => child.id === 'custom-cursor');
}

test('skips setup on touch, reduced-motion, and browsers without matchMedia', () => {
  for (const options of [{ coarse: true }, { reducedMotion: true }, { matchMedia: false }]) {
    const harness = createHarness(options);
    assert.equal(getCursor(harness), undefined);
    assert.equal(harness.document.body.classList.contains('has-custom-cursor'), false);
    assert.equal(harness.listeners.size, 0);
    assert.equal(harness.timers.size, 0);
  }
});

test('creates an accessible-safe cursor, follows pointer activity, and idles after inactivity', () => {
  const harness = createHarness();
  const cursor = getCursor(harness);
  assert.ok(cursor);
  assert.match(cursor.style.cssText, /pointer-events:none/);
  assert.equal(harness.document.body.classList.contains('has-custom-cursor'), true);
  assert.equal(cursor.classList.contains('idle'), false);

  harness.advance(150);
  harness.dispatch('document', 'mousemove', { clientX: 123, clientY: 234, target: {} });
  assert.match(cursor.style.transform, /123px,234px/);
  assert.equal(cursor.classList.contains('idle'), false);
  assert.ok(harness.document.body.children.filter((child) => child.className === 'mini-spark').length > 0);

  harness.advance(150);
  assert.equal(cursor.classList.contains('idle'), true);
  const spark = harness.document.body.children.find((child) => child.className === 'mini-spark');
  spark.dispatch('animationend');
  assert.equal(spark.parentNode, null);
});

test('tracks hover transitions and refreshes hover state after focus, visibility, and scroll', () => {
  const harness = createHarness();
  const cursor = getCursor(harness);
  const link = harness.document.createElement('a');
  link.matchesHover = true;
  const other = harness.document.createElement('div');

  harness.dispatch('document', 'mouseover', { target: link, clientX: 20, clientY: 30 });
  assert.equal(cursor.classList.contains('cursor-enlarge'), true);
  harness.dispatch('document', 'mouseout', { target: link, relatedTarget: other });
  assert.equal(cursor.classList.contains('cursor-enlarge'), false);
  const secondLink = harness.document.createElement('a');
  secondLink.matchesHover = true;
  harness.dispatch('document', 'mouseover', { target: link, clientX: 20, clientY: 30 });
  harness.dispatch('document', 'mouseout', { target: link, relatedTarget: secondLink });
  assert.equal(cursor.classList.contains('cursor-enlarge'), true);
  harness.dispatch('document', 'mouseout', { target: secondLink, relatedTarget: other });
  assert.equal(cursor.classList.contains('cursor-enlarge'), false);

  harness.document.visibilityState = 'hidden';
  harness.dispatch('document', 'visibilitychange');
  assert.equal(cursor.classList.contains('is-hidden'), true);
  harness.document.visibilityState = 'visible';
  harness.hoverTarget = link;
  harness.dispatch('document', 'visibilitychange');
  harness.dispatch('window', 'focus');
  assert.ok(harness.elementFromPointCalls >= 2);
  assert.equal(cursor.classList.contains('cursor-enlarge'), true);
  harness.dispatch('document', 'mousemove', { clientX: 22, clientY: 32, target: link });
  assert.equal(cursor.classList.contains('is-hidden'), false);

  harness.dispatch('window', 'scroll');
  harness.advance(60);
  const callsBeforeSettledScroll = harness.elementFromPointCalls;
  harness.dispatch('window', 'scroll');
  harness.advance(112);
  assert.equal(harness.elementFromPointCalls, callsBeforeSettledScroll);
  harness.advance(16);
  assert.equal(harness.elementFromPointCalls, callsBeforeSettledScroll + 1);
});

test('ignores non-primary clicks, creates bounded click effects, and updates favicon frames', () => {
  const harness = createHarness();
  const cursor = getCursor(harness);
  harness.advance(200);

  harness.dispatch('document', 'mousedown', { button: 2, clientX: 8, clientY: 9 });
  assert.equal(harness.document.body.children.filter((child) => child.className === 'cursor-pop-ring').length, 0);

  for (let i = 0; i < 10; i++) {
    harness.dispatch('document', 'mousedown', { button: 0, clientX: i, clientY: i + 1 });
  }
  const rings = harness.document.body.children.filter((child) => child.className === 'cursor-pop-ring');
  assert.equal(rings.length, 8);
  assert.equal(rings[7].style.left, '9px');
  assert.equal(cursor.children[0].lastAnimation !== undefined, true);

  const beforeClickFrames = harness.encodes;
  harness.advance(400);
  assert.ok(harness.encodes > beforeClickFrames);
  assert.equal(harness.document.querySelectorAll('link[rel~="icon"]').length, 1);
  assert.equal(harness.document.querySelector('link[rel~="icon"]').type, 'image/png');
});

test('bounds spark nodes and removes the oldest when the pool is full', () => {
  const harness = createHarness();
  harness.advance(100);
  harness.dispatch('document', 'mousemove', { clientX: 1, clientY: 2, target: {} });
  const firstSpark = harness.document.body.children.find((child) => child.className === 'mini-spark');
  assert.ok(firstSpark);

  for (let i = 0; i < 20; i++) {
    harness.advance(100);
    harness.dispatch('document', 'mousemove', { clientX: i + 2, clientY: i + 3, target: {} });
  }

  assert.equal(harness.document.body.children.filter((child) => child.className === 'mini-spark').length, 28);
  assert.equal(firstSpark.parentNode, null);
});

test('handles clicks before favicon startup and falls back when Web Animations or storage are unavailable', () => {
  const harness = createHarness({ animateEnabled: false, localStorageThrows: true });
  const cursor = getCursor(harness);
  const popLayer = cursor.children[0];

  harness.dispatch('document', 'mousedown', { button: 0, clientX: 15, clientY: 25 });
  assert.equal(popLayer.classList.contains('cursor-pop-fallback'), true);
  assert.equal(harness.canvasCreations, 1);
  assert.ok(harness.frames.size > 0);

  harness.advance(150);
  assert.equal(harness.canvasCreations, 1);
  assert.equal(harness.document.querySelectorAll('link[rel~="icon"]').length, 1);
});

test('keeps the favicon loop alive, skips hidden-tab drawing, and recovers from a dropped blob callback', () => {
  const harness = createHarness({ blobMode: 'drop' });
  harness.advance(180);
  assert.ok(harness.frames.size > 0);
  assert.ok(harness.drawCalls > 0);

  harness.document.visibilityState = 'hidden';
  const drawsWhileVisible = harness.drawCalls;
  harness.advance(500);
  assert.equal(harness.drawCalls, drawsWhileVisible);
  assert.ok(harness.frames.size > 0);

  harness.document.visibilityState = 'visible';
  harness.advance(2500);
  assert.ok(harness.encodes >= 2);
  assert.ok(harness.frames.size > 0);
});

test('uses toDataURL when toBlob is unavailable and restores the static icon if canvas setup fails', () => {
  const dataUrlHarness = createHarness({ toBlobEnabled: false });
  dataUrlHarness.advance(200);
  assert.equal(dataUrlHarness.document.querySelector('link[rel~="icon"]').href, 'data:image/png;base64,test');

  const failedCanvasHarness = createHarness({ contextEnabled: false });
  failedCanvasHarness.advance(150);
  assert.match(failedCanvasHarness.document.querySelector('link[rel~="icon"]').href, /^favicon\.svg\?r=\d+$/);
  assert.equal(failedCanvasHarness.document.querySelector('link[rel~="icon"]').type, 'image/svg+xml');
});

test('drops stale asynchronous favicon frames and revokes old object URLs', () => {
  const harness = createHarness({ blobMode: 'queue' });
  harness.advance(4000);
  assert.ok(harness.blobCallbacks.length >= 4);

  const callbacks = harness.blobCallbacks.splice(0);
  const link = harness.document.querySelector('link[rel~="icon"]');
  for (const callback of callbacks.slice(0, 4)) callback({ size: 1 });
  const latestHref = link.href;
  callbacks[0]({ size: 1 });
  assert.equal(link.href, latestHref);
  assert.ok(harness.revokedUrls.length >= 1);
});

test('does not let a late timed-out encode callback release a newer encode latch', () => {
  const harness = createHarness({ blobMode: 'queue' });
  harness.advance(1600);
  assert.ok(harness.blobCallbacks.length >= 2);

  const lateCallback = harness.blobCallbacks[0];
  const encodesBeforeLateCallback = harness.encodes;
  lateCallback({ size: 1 });
  harness.advance(250);

  assert.equal(harness.encodes, encodesBeforeLateCallback);
});

test('ignores pending favicon callbacks after a drawing failure restores the static icon', () => {
  const harness = createHarness({ blobMode: 'queue' });
  harness.advance(200);
  assert.ok(harness.blobCallbacks.length > 0);

  harness.throwOnDraw = true;
  harness.advance(200);
  const link = harness.document.querySelector('link[rel~="icon"]');
  assert.equal(link.href, 'favicon.svg?v=3');
  const restoredHref = link.href;

  for (const callback of harness.blobCallbacks) callback({ size: 1 });
  assert.equal(link.href, restoredHref);
});
