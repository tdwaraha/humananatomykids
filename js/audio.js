/* Sound effects, read-aloud voice and calm background music. Everything is generated on the device. */
(function (HA) {
  'use strict';
  var ctx = null, master = null;

  function audioCtx() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      try { ctx = new AC(); } catch (e) { return null; }
    }
    if (ctx.state === 'suspended') { try { ctx.resume(); } catch (e) {} }
    return ctx;
  }
  HA.audioCtx = audioCtx;

  // ---------- sound effects + vibration ----------
  var NOTES = {
    tap: [[880, 0.05]],
    good: [[523.25, 0.10], [659.25, 0.10], [783.99, 0.18]],
    oops: [[329.63, 0.12], [261.63, 0.20]],
    cheer: [[523.25, 0.10], [659.25, 0.10], [783.99, 0.10], [1046.5, 0.32]]
  };
  var VIB = { tap: 8, good: 25, oops: 15, cheer: [30, 40, 30] };

  HA.feedback = {
    play: function (tone) {
      if (HA.settings.sound) {
        var c = audioCtx();
        if (c) {
          var t = c.currentTime + 0.01;
          NOTES[tone].forEach(function (n) {
            var o = c.createOscillator(), g = c.createGain();
            o.type = 'sine'; o.frequency.value = n[0];
            g.gain.setValueAtTime(0.0001, t);
            g.gain.exponentialRampToValueAtTime(0.28, t + 0.01);
            g.gain.exponentialRampToValueAtTime(0.0001, t + n[1]);
            o.connect(g); g.connect(c.destination);
            o.start(t); o.stop(t + n[1] + 0.02);
            t += n[1];
          });
        }
      }
      if (HA.settings.haptics && navigator.vibrate) { try { navigator.vibrate(VIB[tone]); } catch (e) {} }
    }
  };

  // ---------- read-aloud ----------
  var voice = null, speaking = 0, voiceReady = false;
  function pickVoice() {
    if (!('speechSynthesis' in window)) return;
    var list = window.speechSynthesis.getVoices() || [];
    if (!list.length) return;
    var lang = (navigator.language || 'en-US').toLowerCase();
    var base = lang.split('-')[0];
    var pref = list.filter(function (v) { return v.lang && v.lang.toLowerCase() === lang; })
      .concat(list.filter(function (v) { return v.lang && v.lang.toLowerCase().indexOf(base) === 0; }))
      .concat(list.filter(function (v) { return v.lang && v.lang.toLowerCase().indexOf('en') === 0; }));
    voice = pref[0] || null; voiceReady = true;
  }
  if ('speechSynthesis' in window) {
    pickVoice();
    if (window.speechSynthesis.addEventListener) window.speechSynthesis.addEventListener('voiceschanged', pickVoice);
    else window.speechSynthesis.onvoiceschanged = pickVoice;
  }
  HA.speechSupported = 'speechSynthesis' in window;

  function unduck() { if (speaking > 0) { speaking = 0; HA.music.duck(false); } }

  HA.narrator = {
    speak: function (text) {
      if (!text || !HA.speechSupported || !HA.settings.speech) return;
      try {
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(String(text).replace(/[\u{1F300}-\u{1FAFF}\u2600-\u27BF\uFE0F]/gu, ''));
        if (voice) { u.voice = voice; u.lang = voice.lang; } else { u.lang = navigator.language || 'en-US'; }
        u.rate = 0.92; u.pitch = 1.08; u.volume = 1;
        u.onstart = function () { if (!speaking) { speaking = 1; HA.music.duck(true); } };
        u.onend = u.onerror = unduck;
        window.speechSynthesis.speak(u);
      } catch (e) {}
    },
    stop: function () {
      if (!HA.speechSupported) return;
      try { window.speechSynthesis.cancel(); } catch (e) {}
      unduck();
    }
  };

  // ---------- background music (generated lullaby loop) ----------
  var musicNode = null, musicGain = null, building = false, ducked = false, pausedByTab = false, userStarted = false;

  function makeLoop(rate) {
    var beat = 60 / 76, barLen = beat * 4, bars = 8;
    var total = Math.floor(barLen * bars * rate);
    var buf = new Float32Array(total);
    var chords = [[261.63, 329.63, 392.00], [220.00, 261.63, 329.63], [174.61, 220.00, 261.63], [196.00, 246.94, 293.66]];
    var scale = [523.25, 587.33, 659.25, 783.99, 880.00];
    var melody = [2, 3, 4, 3, 2, 1, 0, 1, 2, 4, 3, 2, 1, 0, 1, 0];
    var arp = [0, 1, 2, 1, 2, 1, 0, 1];
    function add(freq, start, dur, amp, pluck) {
      var first = Math.floor(start * rate), count = Math.floor(dur * rate);
      for (var i = 0; i < count; i++) {
        var idx = first + i; if (idx >= total) break;
        var t = i / rate, env;
        if (pluck) env = Math.min(1, t / 0.02) * Math.exp(-t * 4.2);
        else env = Math.sin(Math.PI * (i / count));
        buf[idx] += (Math.sin(2 * Math.PI * freq * t) + 0.18 * Math.sin(4 * Math.PI * freq * t)) * env * amp;
      }
    }
    for (var bar = 0; bar < bars; bar++) {
      var chord = chords[bar % 4], bs = bar * barLen;
      chord.forEach(function (tone) { add(tone / 2, bs, barLen, 0.07, false); });
      for (var s = 0; s < 8; s++) add(chord[arp[s] % 3] * 2, bs + s * beat / 2, beat * 0.9, 0.07, true);
      for (var h = 0; h < 2; h++) add(scale[melody[(bar * 2 + h) % melody.length]], bs + h * beat * 2, beat * 1.8, 0.10, true);
    }
    var fade = Math.floor(0.05 * rate);
    for (var f = 0; f < fade; f++) { var g = f / fade; buf[f] *= g; buf[total - 1 - f] *= g; }
    for (var k = 0; k < total; k++) buf[k] = Math.tanh(buf[k] * 1.6) * 0.8;
    return buf;
  }

  function target() {
    var v = Math.min(Math.max(HA.settings.volume, 0.03), 0.6);
    return ducked ? v * 0.18 : v;
  }
  function ramp(sec) {
    if (!musicGain || !ctx) return;
    var t = ctx.currentTime;
    musicGain.gain.cancelScheduledValues(t);
    musicGain.gain.setValueAtTime(musicGain.gain.value, t);
    musicGain.gain.linearRampToValueAtTime(target(), t + sec);
  }

  HA.music = {
    start: function () {
      userStarted = true;
      if (!HA.settings.music || pausedByTab) return;
      var c = audioCtx(); if (!c) return;
      if (musicNode) { ramp(0.5); return; }
      if (building) return;
      building = true;
      setTimeout(function () {
        try {
          var rate = 22050, data = makeLoop(rate);
          var ab = c.createBuffer(1, data.length, rate); ab.getChannelData(0).set(data);
          musicNode = c.createBufferSource(); musicNode.buffer = ab; musicNode.loop = true;
          musicGain = c.createGain(); musicGain.gain.value = 0;
          musicNode.connect(musicGain); musicGain.connect(c.destination);
          musicNode.start();
          ramp(1.5);
        } catch (e) {}
        building = false;
      }, 30);
    },
    stop: function () {
      if (musicNode) { try { musicNode.stop(); } catch (e) {} musicNode.disconnect(); musicNode = null; musicGain = null; }
    },
    refresh: function () {
      if (!userStarted) return;
      if (HA.settings.music) { if (musicNode) ramp(0.4); else HA.music.start(); }
      else HA.music.stop();
    },
    duck: function (on) { ducked = on; ramp(on ? 0.3 : 0.9); }
  };

  // Start music after the first tap anywhere (browsers do not allow sound before that).
  function firstGesture() {
    document.removeEventListener('pointerdown', firstGesture, true);
    document.removeEventListener('keydown', firstGesture, true);
    HA.music.start();
  }
  document.addEventListener('pointerdown', firstGesture, true);
  document.addEventListener('keydown', firstGesture, true);

  // Pause everything when the tab is hidden.
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      pausedByTab = true; HA.narrator.stop();
      if (ctx && ctx.state === 'running') ctx.suspend().catch(function () {});
    } else {
      pausedByTab = false;
      if (ctx && userStarted) ctx.resume().catch(function () {});
    }
  });
})(window.HA);
