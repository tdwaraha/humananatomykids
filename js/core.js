/* Human Anatomy for Kids - core helpers. No tracking, no network calls: everything stays on this device. */
window.HA = window.HA || {};
(function (HA) {
  'use strict';

  // ---- tiny storage wrapper (localStorage with in-memory fallback) ----
  var mem = {};
  HA.store = {
    get: function (k, d) {
      try {
        var v = window.localStorage.getItem('ha.' + k);
        if (v !== null) return JSON.parse(v);
      } catch (e) {}
      return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : d;
    },
    set: function (k, v) {
      mem[k] = v;
      try { window.localStorage.setItem('ha.' + k, JSON.stringify(v)); } catch (e) {}
    },
    clearAll: function () {
      mem = {};
      try {
        Object.keys(window.localStorage).filter(function (k) { return k.indexOf('ha.') === 0; })
          .forEach(function (k) { window.localStorage.removeItem(k); });
      } catch (e) {}
    }
  };

  HA.reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  // ---- DOM helper ----
  HA.el = function (tag, attrs) {
    var node = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') node.className = v;
        else if (k === 'html') node.innerHTML = v;
        else if (k === 'style' && typeof v === 'object') Object.keys(v).forEach(function (sk) { if (sk.slice(0, 2) === '--') node.style.setProperty(sk, v[sk]); else node.style[sk] = v[sk]; });
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') node.addEventListener(k.slice(2), v);
        else if (v === true) node.setAttribute(k, '');
        else node.setAttribute(k, v);
      });
    }
    for (var i = 2; i < arguments.length; i++) append(node, arguments[i]);
    return node;
  };
  function append(node, c) {
    if (c === null || c === undefined || c === false) return;
    if (Array.isArray(c)) { c.forEach(function (x) { append(node, x); }); return; }
    node.appendChild(typeof c === 'object' ? c : document.createTextNode(String(c)));
  }
  HA.clear = function (node) { while (node.firstChild) node.removeChild(node.firstChild); return node; };

  // ---- random helpers ----
  HA.shuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  };
  HA.sample = function (arr, n) { return HA.shuffle(arr).slice(0, n); };
  HA.rand = function (arr) { return arr[Math.floor(Math.random() * arr.length)]; };

  // ---- persisted counters (stars etc.) ----
  HA.getStars = function () { return HA.store.get('bodyActivityStars', 0); };
  HA.addStar = function () {
    HA.store.set('bodyActivityStars', HA.getStars() + 1);
    document.dispatchEvent(new CustomEvent('ha:progress'));
  };
  HA.setList = function (key, list) { HA.store.set(key, list); document.dispatchEvent(new CustomEvent('ha:progress')); };
  HA.getSet = function (key) { return new Set(HA.store.get(key, [])); };

  // ---- settings ----
  HA.settings = {
    get sound() { return HA.store.get('sound', true); },
    get haptics() { return HA.store.get('haptics', true); },
    get music() { return HA.store.get('music', true); },
    get volume() { return HA.store.get('musicVolume', 0.22); },
    get speech() { return HA.store.get('speech', true); },
    get labels() { return HA.store.get('labelsOn', true); }
  };

  // ---- Organ lookup ----
  HA.organById = function (id) { return HA.DATA.organs.filter(function (o) { return o.id === id; })[0]; };
  HA.systems = function () {
    var s = {}; HA.DATA.organs.forEach(function (o) { s[o.system] = 1; });
    return Object.keys(s).sort();
  };
  HA.img = function (name) { return 'assets/' + name + '.webp'; };
  HA.organImg = function (id) { return HA.img('Organ_' + id); };
})(window.HA);
