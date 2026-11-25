// The Golden Ladle — random.js
// One job: a tiny seeded random-number generator so screenshot scenes and
// cosmetic scatter are reproducible from a seed.
(function (global) {
  'use strict';

  // mulberry32: small, fast, deterministic.
  function makeSeededRandom(seed) {
    var state = (seed >>> 0) || 1;
    return function next() {
      state = (state + 0x6d2b79f5) >>> 0;
      var t = state;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pickWith(rng, list) {
    return list[Math.floor(rng() * list.length)];
  }

  function shuffleWith(rng, list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(rng() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  global.GoldenLadleRandom = {
    makeSeededRandom: makeSeededRandom,
    pickWith: pickWith,
    shuffleWith: shuffleWith
  };
})(typeof window !== 'undefined' ? window : globalThis);
