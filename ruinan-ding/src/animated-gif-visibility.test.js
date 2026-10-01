'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');
const ts = require('typescript');

const source = fs.readFileSync(path.join(__dirname, 'animated-gif-visibility.ts'), 'utf8');
const compiled = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 }
}).outputText;
const moduleContext = { exports: {} };
vm.runInNewContext(compiled, moduleContext);
const { observeAnimatedGifs } = moduleContext.exports;

function makeImage(src, connected = true) {
  const attributes = new Map([['data-animated-src', src]]);
  return {
    dataset: { animatedSrc: src },
    isConnected: connected,
    hasAttribute: (name) => attributes.has(name),
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: (name) => attributes.delete(name),
    getAttribute: (name) => attributes.get(name) || null
  };
}

function makeDocument(images) {
  return {
    querySelectorAll(selector) {
      assert.equal(selector, 'img[data-animated-src]');
      return images;
    }
  };
}

test('defers GIF requests until near the viewport and pauses them after they leave', () => {
  const first = makeImage('https://images.example/first.gif');
  const second = makeImage('https://images.example/second.gif');
  let callback;
  let options;
  const observed = [];
  const unobserved = [];
  const win = {
    IntersectionObserver: class {
      constructor(onChange, observerOptions) {
        callback = onChange;
        options = observerOptions;
      }
      observe(image) { observed.push(image); }
      unobserve(image) { unobserved.push(image); }
    }
  };

  observeAnimatedGifs(makeDocument([first, second]), win);
  assert.deepEqual(observed, [first, second]);
  assert.equal(options.rootMargin, '200px');
  assert.equal(first.getAttribute('src'), null);

  callback([{ target: first, isIntersecting: true }]);
  assert.equal(first.getAttribute('src'), 'https://images.example/first.gif');
  callback([{ target: first, isIntersecting: false }]);
  assert.equal(first.getAttribute('src'), null);
  callback([{ target: first, isIntersecting: true }]);
  assert.equal(first.getAttribute('src'), 'https://images.example/first.gif');

  second.isConnected = false;
  callback([{ target: second, isIntersecting: false }]);
  assert.deepEqual(unobserved, [second]);
});

test('loads animated images directly when IntersectionObserver is unavailable', () => {
  const image = makeImage('https://images.example/fallback.gif');
  observeAnimatedGifs(makeDocument([image]), {});
  assert.equal(image.getAttribute('src'), 'https://images.example/fallback.gif');
});
