// The Golden Ladle — audio.js
// One job: every sound the game makes, synthesized with WebAudio.
// No audio files, no network. Silent until the first user gesture.
(function (global) {
  'use strict';

  function makeAudio() {
    var ctx = null;
    var muted = false;
    var sizzleNodes = null;

    function ensureContext() {
      if (ctx) return ctx;
      var AC = global.AudioContext || global.webkitAudioContext;
      if (!AC) return null;
      try {
        ctx = new AC();
      } catch (err) {
        ctx = null;
      }
      return ctx;
    }

    function unlock() {
      var c = ensureContext();
      if (c && c.state === 'suspended') c.resume();
    }

    function tone(freq, seconds, type, gainValue, when) {
      if (muted) return;
      var c = ensureContext();
      if (!c) return;
      var t0 = c.currentTime + (when || 0);
      var osc = c.createOscillator();
      var gain = c.createGain();
      osc.type = type || 'sine';
      osc.frequency.setValueAtTime(freq, t0);
      gain.gain.setValueAtTime(0.0001, t0);
      gain.gain.exponentialRampToValueAtTime(gainValue || 0.12, t0 + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t0 + seconds);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(t0);
      osc.stop(t0 + seconds + 0.05);
    }

    function noiseBurst(seconds, gainValue, filterFreq) {
      if (muted) return;
      var c = ensureContext();
      if (!c) return;
      var length = Math.max(1, Math.floor(c.sampleRate * seconds));
      var buffer = c.createBuffer(1, length, c.sampleRate);
      var data = buffer.getChannelData(0);
      for (var i = 0; i < length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / length);
      }
      var src = c.createBufferSource();
      src.buffer = buffer;
      var filter = c.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = filterFreq || 1200;
      var gain = c.createGain();
      gain.gain.value = gainValue || 0.15;
      src.connect(filter);
      filter.connect(gain);
      gain.connect(c.destination);
      src.start();
    }

    var sounds = {
      unlock: unlock,
      toggleMute: function () {
        muted = !muted;
        if (muted) sounds.stopSizzle();
        return muted;
      },
      isMuted: function () { return muted; },
      pickup: function () { tone(520, 0.07, 'triangle', 0.10); },
      place: function () { tone(340, 0.08, 'triangle', 0.10); tone(510, 0.06, 'triangle', 0.07, 0.05); },
      chop: function () { noiseBurst(0.06, 0.22, 900); tone(180, 0.05, 'square', 0.05); },
      chopDone: function () { tone(660, 0.09, 'triangle', 0.11); tone(880, 0.12, 'triangle', 0.10, 0.08); },
      grillDone: function () { tone(740, 0.1, 'triangle', 0.11); tone(988, 0.14, 'triangle', 0.10, 0.09); },
      serve: function () {
        tone(523, 0.1, 'triangle', 0.12);
        tone(659, 0.1, 'triangle', 0.12, 0.09);
        tone(784, 0.18, 'triangle', 0.13, 0.18);
      },
      error: function () { tone(160, 0.16, 'sawtooth', 0.08); },
      expire: function () { tone(220, 0.2, 'sawtooth', 0.09); tone(165, 0.3, 'sawtooth', 0.09, 0.16); },
      startSizzle: function () {
        if (muted || sizzleNodes) return;
        var c = ensureContext();
        if (!c) return;
        var length = c.sampleRate;
        var buffer = c.createBuffer(1, length, c.sampleRate);
        var data = buffer.getChannelData(0);
        for (var i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
        var src = c.createBufferSource();
        src.buffer = buffer;
        src.loop = true;
        var filter = c.createBiquadFilter();
        filter.type = 'highpass';
        filter.frequency.value = 4000;
        var gain = c.createGain();
        gain.gain.value = 0.02;
        src.connect(filter);
        filter.connect(gain);
        gain.connect(c.destination);
        src.start();
        sizzleNodes = { src: src, gain: gain };
      },
      stopSizzle: function () {
        if (!sizzleNodes) return;
        try { sizzleNodes.src.stop(); } catch (err) { /* already stopped */ }
        sizzleNodes = null;
      }
    };

    return sounds;
  }

  global.GoldenLadleAudio = { makeAudio: makeAudio };
})(typeof window !== 'undefined' ? window : globalThis);
