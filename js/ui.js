/* Shared UI pieces: Bo the mascot, confetti, chips, settings dialog. */
(function (HA) {
  'use strict';
  var el = HA.el;
  var NS = 'http://www.w3.org/2000/svg';

  // ---------- Bo ----------
  function svg(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    Object.keys(attrs || {}).forEach(function (k) { n.setAttribute(k, attrs[k]); });
    for (var i = 2; i < arguments.length; i++) n.appendChild(arguments[i]);
    return n;
  }
  var INK = '#172B47';
  function boSVG(mood) {
    var s = 100;
    var root = svg('svg', { viewBox: '0 0 100 100', 'aria-hidden': 'true', class: 'bo-svg' });
    var defs = svg('defs', {}, svg('linearGradient', { id: 'bofur' + mood, x1: 0, y1: 0, x2: 0, y2: 1 },
      svg('stop', { offset: '0', 'stop-color': '#40C7C7' }), svg('stop', { offset: '1', 'stop-color': '#1A94A8' })));
    root.appendChild(defs);
    [20, 80].forEach(function (x) {
      root.appendChild(svg('circle', { cx: x, cy: 20, r: 16, fill: '#1A94A8' }));
      root.appendChild(svg('circle', { cx: x, cy: 20, r: 8, fill: 'rgba(255,105,180,.55)' }));
    });
    root.appendChild(svg('circle', { cx: 50, cy: 56, r: 44, fill: 'url(#bofur' + mood + ')' }));
    [24, 76].forEach(function (x) { root.appendChild(svg('circle', { cx: x, cy: 64, r: 6.5, fill: 'rgba(255,105,180,.35)' })); });
    [36, 64].forEach(function (x) {
      if (mood === 'cheer') {
        root.appendChild(svg('path', { d: 'M' + (x - 6) + ' 52 Q' + x + ' 41 ' + (x + 6) + ' 52', fill: 'none', stroke: INK, 'stroke-width': 3, 'stroke-linecap': 'round' }));
      } else {
        root.appendChild(svg('circle', { cx: x, cy: 50, r: 7.5, fill: '#fff' }));
        root.appendChild(svg('circle', { cx: x, cy: mood === 'think' ? 47 : 51, r: 4, fill: INK }));
        root.appendChild(svg('circle', { cx: x + 2, cy: 48, r: 1.5, fill: '#fff' }));
      }
    });
    root.appendChild(svg('ellipse', { cx: 50, cy: 60, rx: 4.5, ry: 3, fill: '#1F4059' }));
    var m;
    if (mood === 'cheer') m = svg('path', { d: 'M36 67 Q50 92 64 67 Z', fill: '#8C1F33' });
    else if (mood === 'oops') m = svg('path', { d: 'M41 74 Q50 67 59 74', fill: 'none', stroke: INK, 'stroke-width': 3, 'stroke-linecap': 'round' });
    else if (mood === 'think') m = svg('path', { d: 'M44 70 Q52 75 60 68', fill: 'none', stroke: INK, 'stroke-width': 3, 'stroke-linecap': 'round' });
    else m = svg('path', { d: 'M40 68 Q50 80 60 68', fill: 'none', stroke: INK, 'stroke-width': 3, 'stroke-linecap': 'round' });
    root.appendChild(m);
    return root;
  }
  HA.buddy = function (mood, message, size) {
    var face = el('div', { class: 'bo-face', style: { width: (size || 84) + 'px', height: (size || 84) + 'px' } });
    var bubble = el('div', { class: 'bo-bubble', 'aria-live': 'polite' });
    var wrap = el('div', { class: 'bo' }, face, bubble);
    function set(m, msg) {
      HA.clear(face); face.appendChild(boSVG(m));
      face.className = 'bo-face' + (m === 'cheer' && !HA.reduceMotion ? ' hop' : '');
      if (msg !== undefined) bubble.textContent = msg;
    }
    set(mood || 'happy', message || '');
    wrap.set = set;
    return wrap;
  };

  // ---------- confetti ----------
  HA.confetti = function () {
    if (HA.reduceMotion) return;
    var c = document.createElement('canvas');
    c.className = 'confetti'; c.width = window.innerWidth; c.height = window.innerHeight;
    document.body.appendChild(c);
    var g = c.getContext('2d');
    var cols = ['#FF5E7E', '#FFC53D', '#3DD6A5', '#4D9DFF', '#B07CFF', '#FF9A3D'];
    var pieces = [];
    for (var i = 0; i < 90; i++) pieces.push({ x: Math.random() * c.width, y: -20 - Math.random() * c.height * 0.5, vx: (Math.random() - 0.5) * 2, vy: 2 + Math.random() * 3.5, r: 4 + Math.random() * 6, a: Math.random() * 6, va: (Math.random() - 0.5) * 0.3, col: cols[i % cols.length] });
    var start = performance.now();
    (function frame(now) {
      var t = now - start;
      g.clearRect(0, 0, c.width, c.height);
      pieces.forEach(function (p) {
        p.x += p.vx; p.y += p.vy; p.a += p.va;
        g.save(); g.translate(p.x, p.y); g.rotate(p.a); g.fillStyle = p.col; g.fillRect(-p.r / 2, -p.r / 4, p.r, p.r / 2); g.restore();
      });
      if (t < 2800) requestAnimationFrame(frame); else c.remove();
    })(start);
  };

  // ---------- spring-style entrance motion (Web Animations API; skipped for reduced motion) ----------
  HA.reveal = function (root) {
    if (HA.reduceMotion || !root || !root.animate) return;
    var els = root.querySelectorAll('.hero-banner,.top-card,.hero-card,.game-tile,.card,.organ-card,.pic-tile,.model-chip,.food-btn');
    var i = 0, vh = window.innerHeight * 1.3;
    Array.prototype.forEach.call(els, function (el) {
      if (el.getBoundingClientRect().top > vh) return;
      el.animate([{ opacity: 0, transform: 'translateY(18px) scale(.97)' }, { opacity: 1, transform: 'none' }],
        { duration: 560, delay: Math.min(i++, 12) * 50, easing: 'cubic-bezier(.2,.9,.25,1.12)', fill: 'backwards' });
    });
  };

  // ---------- small components ----------
  HA.chip = function (text, cls) { return el('span', { class: 'chip ' + (cls || '') }, text); };
  HA.back = function (to) {
    return el('button', { class: 'back-btn', type: 'button', 'aria-label': 'Back', onclick: function () {
      HA.narrator.stop();
      if (to) location.hash = to; else if (history.length > 1) history.back(); else location.hash = '#/';
    } }, '‹ Back');
  };
  HA.starsChip = function () {
    var chip = el('span', { class: 'chip stars' });
    function upd() { chip.textContent = '⭐ ' + HA.getStars() + ' stars'; }
    upd(); document.addEventListener('ha:progress', upd);
    chip._off = function () { document.removeEventListener('ha:progress', upd); };
    return chip;
  };
  HA.listenBtn = function (getText, label) {
    return el('button', { class: 'btn teal', type: 'button', onclick: function () { HA.feedback.play('tap'); HA.narrator.speak(typeof getText === 'function' ? getText() : getText); } }, '🔊 ' + (label || 'Listen'));
  };

  // ---------- For grown-ups dialog ----------
  HA.openSettings = function () {
    var dlg = document.getElementById('settings');
    if (!dlg) return;
    HA.clear(dlg);
    function toggle(key, label, note, after) {
      var cb = el('input', { type: 'checkbox', id: 'set-' + key });
      cb.checked = !!HA.store.get(key, true);
      cb.addEventListener('change', function () { HA.store.set(key, cb.checked); if (after) after(); HA.feedback.play('tap'); });
      return el('label', { class: 'toggle-row', for: 'set-' + key }, el('span', {}, el('b', {}, label), note ? el('small', {}, note) : null), cb);
    }
    var vol = el('input', { type: 'range', min: '0.03', max: '0.6', step: '0.01', id: 'set-vol', 'aria-label': 'Music volume' });
    vol.value = HA.settings.volume;
    vol.addEventListener('input', function () { HA.store.set('musicVolume', parseFloat(vol.value)); HA.music.refresh(); });
    var speechNote = HA.speechSupported ? 'Uses your device\u2019s built-in voice. Voices vary by device and browser.' : 'This browser does not offer read-aloud.';
    dlg.appendChild(el('form', { method: 'dialog', class: 'dlg-body' },
      el('h2', {}, 'For grown-ups'),
      el('p', {}, 'Human Anatomy for Kids is a free introduction to 36 major organs and body structures for curious children. Explore it together!'),
      el('p', {}, 'The 3D models are simplified and some are stylized illustrations; shapes, positions, proportions, colours and motion are approximate. This is not a clinical anatomy atlas and not medical advice. The body is shown from the front: your body\u2019s left appears on the viewer\u2019s right.'),
      el('p', {}, 'No accounts, no ads, no tracking, no purchases. Stars and progress are saved only in this browser on this device.'),
      el('h3', {}, 'Settings'),
      toggle('sound', 'Sound effects', 'Short happy tones'),
      toggle('haptics', 'Vibration', 'Gentle buzz on phones and tablets that support it'),
      toggle('speech', 'Read aloud', speechNote, function () { if (!HA.settings.speech) HA.narrator.stop(); }),
      toggle('music', 'Background music', 'A calm lullaby made on the device', function () { HA.music.refresh(); }),
      el('label', { class: 'toggle-row', for: 'set-vol' }, el('span', {}, el('b', {}, 'Music volume')), vol),
      el('div', { class: 'dlg-actions' },
        el('button', { class: 'btn ghost', type: 'button', onclick: function () {
          if (confirm('Clear all stars, stickers and explored organs from this browser?')) { HA.store.clearAll(); document.dispatchEvent(new CustomEvent('ha:progress')); alert('Progress cleared.'); }
        } }, 'Reset progress'),
        el('a', { class: 'btn ghost', href: 'support.html' }, 'Support'),
        el('a', { class: 'btn ghost', href: 'privacy.html' }, 'Privacy policy'),
        el('button', { class: 'btn teal', value: 'close' }, 'Done'))));
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute('open', '');
  };
})(window.HA);
