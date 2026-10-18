/* Magic Body Lab: hub, Magic Lens, Food Journey, Organ Lab */
(function (HA) {
  'use strict';
  var h = HA.el, C = HA.CONTENT, P = HA.pages;

  P.lab = function (app) {
    var cards = [
      { href: '#/lens', emoji: '🔍', title: 'Magic Lens', sub: 'Look inside the body with a magic lens', c1: '#8CEB8C', c2: '#33B366' },
      { href: '#/food', emoji: '🍎', title: 'Food Journey', sub: 'Follow a snack all the way through', c1: '#FFDB66', c2: '#FF9933' },
      { href: '#/organlab', emoji: '🫁', title: 'Organ Lab', sub: 'Watch real organs work: resting, walking, running', c1: '#80D9FF', c2: '#3385F2' }
    ];
    app.appendChild(h('div', { class: 'page narrow' },
      h('div', { class: 'page-head' }, HA.back('#/'), h('div', { class: 'page-title' }, h('h1', {}, 'Magic Body Lab ✨'), h('p', { class: 'muted' }, 'Three ways to explore'))),
      cards.map(function (c) {
        return h('a', { class: 'hero-card lab-card', href: c.href, style: { '--from': c.c1, '--to': c.c2 } }, h('span', { class: 'round-emoji' }, c.emoji),
          h('div', {}, h('h2', {}, c.title), h('p', {}, c.sub)), h('span', { class: 'chev' }, '›'));
      })));
  };

  // ---------------- Magic Lens ----------------
  P.lens = function (app) {
    var layerIdx = 0, lens = { x: 0.5, y: 0.40 }, moved = false, labelsOn = HA.store.get('labelsOn', true);
    var pic = h('div', { class: 'lens-pic' });
    var base = h('img', { src: HA.img('ChildCutout'), alt: '', draggable: 'false' });
    var layerImg = h('img', { class: 'lens-layer', alt: '', draggable: 'false' });
    var disc = h('div', { class: 'lens-disc' }), ring = h('div', { class: 'lens-ring' }), handle = h('div', { class: 'lens-handle' });
    var hint = h('div', { class: 'lens-hint' }, '✋ Drag the lens');
    var tagsBox = h('div', { class: 'lens-tags' });
    pic.appendChild(h('div', { class: 'lens-bg' })); pic.appendChild(base); pic.appendChild(disc); pic.appendChild(layerImg); pic.appendChild(ring); pic.appendChild(handle); pic.appendChild(tagsBox); pic.appendChild(hint);
    var info = h('div', { class: 'card info-card', 'aria-live': 'polite' }), picker = h('div', { class: 'row center wrap' });
    var lblCb = h('input', { type: 'checkbox', id: 'lenslbl' }); lblCb.checked = labelsOn;
    var lastSpoken = '';
    function layer() { return C.lensLayers[layerIdx]; }
    function update(speak) {
      var w = pic.clientWidth || 400, hh = w * 1.5, d = w * 0.46, cx = lens.x * w, cy = lens.y * hh;
      layerImg.src = HA.img(layer().image);
      layerImg.style.clipPath = 'circle(' + d / 2 + 'px at ' + cx + 'px ' + cy + 'px)';
      [disc, ring].forEach(function (n) { n.style.width = d + 'px'; n.style.height = d + 'px'; n.style.left = cx + 'px'; n.style.top = cy + 'px'; });
      handle.style.left = cx + d * 0.62 + 'px'; handle.style.top = cy + d * 0.62 + 'px';
      ring.style.borderColor = layer().tint;
      HA.clear(tagsBox);
      if (labelsOn) (C.lensTags[layer().id] || []).forEach(function (t) {
        var dx = t[1] * w - cx, dy = t[2] * hh - cy;
        if (Math.hypot(dx, dy) < d / 2 * 0.95) tagsBox.appendChild(h('span', { class: 'lens-tag', style: { left: t[1] * 100 + '%', top: t[2] * 100 + '%' } }, t[0]));
      });
      var r = C.lensRegion(layer().id, lens.x, lens.y);
      HA.clear(info); info.appendChild(h('div', { class: 'row between' }, h('h3', {}, layer().icon + ' ' + r[0]),
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Read aloud', onclick: function () { HA.narrator.speak(r[0] + '. ' + r[1]); } }, '🔊')), h('p', {}, r[1]));
      if (speak && r[0] !== lastSpoken) { lastSpoken = r[0]; HA.narrator.speak(r[0] + '. ' + r[1]); }
      HA.clear(picker);
      C.lensLayers.forEach(function (l, i) {
        picker.appendChild(h('button', { type: 'button', class: 'btn ' + (i === layerIdx ? 'teal' : 'teal-o'), 'aria-pressed': i === layerIdx ? 'true' : 'false',
          onclick: function () { layerIdx = i; HA.feedback.play('tap'); update(true); } }, l.icon + ' ' + l.title));
      });
    }
    function move(e) {
      var r = pic.getBoundingClientRect();
      lens.x = Math.min(0.96, Math.max(0.04, (e.clientX - r.left) / r.width)); lens.y = Math.min(0.98, Math.max(0.02, (e.clientY - r.top) / r.height));
      if (!moved) { moved = true; hint.hidden = true; }
      update(false);
    }
    var dragging = false;
    pic.style.touchAction = 'none';
    pic.addEventListener('pointerdown', function (e) { dragging = true; try { pic.setPointerCapture(e.pointerId); } catch (x) {} move(e); });
    pic.addEventListener('pointermove', function (e) { if (dragging) move(e); });
    function end() { if (dragging) { dragging = false; update(true); } }
    pic.addEventListener('pointerup', end); pic.addEventListener('pointercancel', end);
    lblCb.addEventListener('change', function () { labelsOn = lblCb.checked; HA.store.set('labelsOn', labelsOn); update(false); });
    app.appendChild(h('div', { class: 'page narrow' },
      h('div', { class: 'page-head' }, HA.back('#/lab'), h('div', { class: 'page-title' }, h('h1', {}, 'Magic Lens 🔍'))),
      h('div', { class: 'row end' }, h('label', { class: 'switch', for: 'lenslbl' }, 'Labels', lblCb)),
      pic, picker, info,
      h('p', { class: 'small muted center' }, 'Simplified illustration for learning. Positions and proportions are approximate.')));
    var ro = window.ResizeObserver ? new ResizeObserver(function () { update(false); }) : null; if (ro) ro.observe(pic);
    update(false);
    return function () { if (ro) ro.disconnect(); };
  };

  // ---------------- Food Journey ----------------
  P.food = function (app) {
    var running = false, alive = true, energy = 0, labelsOn = HA.store.get('labelsOn', true);
    var faces = ['😴', '🙂', '😊', '😄', '🤩', '🤩'];
    var scene = h('div', { class: 'food-scene' });
    var caption = h('div', { class: 'card caption', 'aria-live': 'polite' }, 'Pick a snack and watch where it goes!');
    var foodEl = h('div', { class: 'food-bit', hidden: true }), glow = h('div', { class: 'food-glow' }); foodEl.appendChild(glow);
    var foodEmoji = h('span', {}); foodEl.appendChild(foodEmoji);
    var meterFace = h('div', { class: 'meter-face' }, faces[0]), meterFill = h('div', { class: 'meter-fill' });
    var lblCb = h('input', { type: 'checkbox', id: 'foodlbl' }); lblCb.checked = labelsOn;
    var foodBtns = h('div', { class: 'food-row' });
    function sleep(s) { return new Promise(function (r) { setTimeout(r, s * 1000); }); }
    function sceneBuild() {
      HA.clear(scene); scene.appendChild(h('img', { src: HA.img('DigestiveScene'), alt: 'Cartoon of the digestive system' }));
      if (labelsOn) {
        var NS = 'http://www.w3.org/2000/svg'; var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 1024 1010'); svg.setAttribute('class', 'pic-svg');
        C.sceneLabels.forEach(function (it) {
          var edge = it.left ? 0.20 : 0.80, ln = document.createElementNS(NS, 'line');
          ln.setAttribute('x1', edge * 1024); ln.setAttribute('y1', it.py * 1010); ln.setAttribute('x2', it.ax * 1024); ln.setAttribute('y2', it.ay * 1010);
          ln.setAttribute('stroke', 'rgba(23,43,71,.8)'); ln.setAttribute('stroke-width', 3); svg.appendChild(ln);
          var c = document.createElementNS(NS, 'circle'); c.setAttribute('cx', it.ax * 1024); c.setAttribute('cy', it.ay * 1010); c.setAttribute('r', 9);
          c.setAttribute('fill', '#fff'); c.setAttribute('stroke', '#172B47'); c.setAttribute('stroke-width', 3); svg.appendChild(c);
        });
        scene.appendChild(svg);
        C.sceneLabels.forEach(function (it) { scene.appendChild(h('span', { class: 'scene-lbl', style: { left: (it.left ? 3 : 97) + '%', top: it.py * 100 + '%', transform: 'translate(' + (it.left ? '0' : '-100%') + ',-50%)' } }, it.name)); });
      }
      scene.appendChild(foodEl);
    }
    function setPos(s, dur) {
      foodEl.style.transition = 'left ' + dur + 's ease-in-out, top ' + dur + 's ease-in-out, transform ' + dur + 's ease-in-out';
      foodEl.style.left = s.x * 100 + '%'; foodEl.style.top = s.y * 100 + '%'; foodEl.style.transform = 'translate(-50%,-50%) scale(' + s.scale + ')';
    }
    async function send(food) {
      if (running) return; running = true; foodBtns.classList.add('busy');
      HA.feedback.play('tap'); foodEmoji.textContent = food.emoji; foodEl.hidden = false;
      var first = C.foodSteps[0]; foodEl.style.transition = 'none'; foodEl.style.left = first.x * 100 + '%'; foodEl.style.top = first.y * 100 + '%'; foodEl.style.transform = 'translate(-50%,-50%) scale(1)';
      caption.textContent = 'Yum! ' + food.name + ' goes in your mouth...';
      await sleep(0.05);
      for (var i = 0; i < C.foodSteps.length; i++) {
        var s = C.foodSteps[i]; if (!alive) return;
        if (s.text) { caption.textContent = s.text; HA.narrator.speak(s.text); }
        if (s.emoji) foodEmoji.textContent = s.emoji;
        setPos(s, HA.reduceMotion ? 0.01 : s.move);
        await sleep(HA.reduceMotion ? 0.4 + s.hold * 0.5 : s.move + s.hold);
      }
      if (!alive) return;
      var msg;
      if (food.healthy) { energy = Math.min(energy + 1, 5); HA.feedback.play('good'); msg = food.name + ' gave you energy! Healthy food helps you grow, think and play.'; }
      else msg = 'A ' + food.name.toLowerCase() + ' is a fun treat sometimes. Fruits, veggies and milk give you more energy to grow!';
      caption.textContent = msg; HA.narrator.speak(msg); foodEl.hidden = true; meter(); running = false; foodBtns.classList.remove('busy');
    }
    function meter() { meterFace.textContent = faces[energy]; meterFill.style.height = Math.max(energy / 5, 0.04) * 100 + '%'; }
    C.foods.forEach(function (f) {
      foodBtns.appendChild(h('button', { type: 'button', class: 'food-btn', 'aria-label': 'Eat ' + f.name, onclick: function () { send(f); } }, h('span', {}, f.emoji), h('small', {}, f.name)));
    });
    lblCb.addEventListener('change', function () { labelsOn = lblCb.checked; HA.store.set('labelsOn', labelsOn); sceneBuild(); });
    app.appendChild(h('div', { class: 'page narrow wide-ok food-page' },
      h('div', { class: 'page-head' }, HA.back('#/lab'), h('div', { class: 'page-title' }, h('h1', {}, 'Food Journey 🍎'))),
      h('div', { class: 'row end' }, h('label', { class: 'switch', for: 'foodlbl' }, 'Labels', lblCb)),
      h('div', { class: 'food-layout' }, scene, h('div', { class: 'meter' }, meterFace, h('div', { class: 'meter-bar' }, meterFill), h('b', {}, 'Energy'))),
      caption, foodBtns,
      h('p', { class: 'small muted center' }, 'A simplified cartoon. Real digestion takes many hours, and everyone\u2019s body is a little different.')));
    sceneBuild(); meter();
    return function () { alive = false; HA.narrator.stop(); };
  };

  // ---------------- Organ Lab ----------------
  var RATE = {
    lungs: ['breaths a minute', [16, 24, 40]], heart: ['beats a minute', [70, 100, 150]]
  };
  function g(x, c, w) { var d = (x - c) / w; return Math.exp(-d * d); }
  P.organlab = function (app) {
    var current = 'lungs', speed = 1, viewer = null, token = 0;
    var canvasWrap = h('div', { class: 'viewer-wrap lab-wrap' }), caption = h('div', { class: 'card info-card', 'aria-live': 'polite' });
    var chips = h('div', { class: 'row center wrap lab-chips' }), speeds = h('div', { class: 'row center' });
    function anim(id) {
      var per = { lungs: [4.0, 2.4, 1.5], heart: [60 / 70, 60 / 100, 60 / 150], stomach: [3.2, 2.2, 1.5], brain: [3.2, 2.2, 1.4] }[id] || [3.6, 2.5, 1.7];
      var amp = [0.5, 0.75, 1.0];
      return function (t) {
        var p = per[speed - 1], ph = (t % p) / p, a = amp[speed - 1], k = 1;
        if (id === 'heart') k = 1 + 0.13 * a * (g(ph, 0.1, 0.06) + 0.7 * g(ph, 0.34, 0.06)) + 0.01;
        else if (id === 'lungs') k = 1.02 + 0.10 * a * (0.5 - 0.5 * Math.cos(ph * 2 * Math.PI));
        else if (id === 'stomach' || id === 'small_intestine') k = 1.0 + 0.06 * a * Math.sin(ph * 2 * Math.PI);
        else k = 1.0 + 0.045 * a * Math.sin(ph * 2 * Math.PI);
        return { k: k, tw: (id === 'stomach' || id === 'small_intestine') ? 0.1 * a * Math.sin(ph * 2 * Math.PI) : 0 };
      };
    }
    function describe() {
      var o = HA.organById(current), t = C.labOrgans.filter(function (x) { return x.id === current; })[0];
      var mode = ['resting', 'walking', 'running'][speed - 1], extra = '';
      if (RATE[current]) extra = ' While ' + mode + ', about ' + RATE[current][1][speed - 1] + ' ' + RATE[current][0] + '.';
      else extra = ' Notice how it moves a little differently when you are ' + mode + '.';
      HA.clear(caption); caption.appendChild(h('div', { class: 'row between' }, h('h3', {}, t.heading), h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Read aloud', onclick: function () { HA.narrator.speak(o.job + extra); } }, '🔊')));
      caption.appendChild(h('p', {}, o.job + extra)); caption.appendChild(h('p', { class: 'fact' }, '💡 ' + o.fact));
    }
    function load() {
      var my = ++token;
      if (viewer) { viewer.dispose(); viewer = null; }
      HA.clear(canvasWrap);
      if (!HA.webglSupported()) { canvasWrap.appendChild(h('div', { class: 'no-gl' }, 'This device can\u2019t show 3D right now. Try Chrome, Edge, Firefox or Samsung Internet.')); return; }
      var canvas = h('canvas', { class: 'gl', 'aria-label': '3D model of the ' + current.replace('_', ' ') + '. Drag to turn it.', role: 'img' });
      canvasWrap.appendChild(canvas); var loading = h('div', { class: 'loading' }, 'Loading 3D…'); canvasWrap.appendChild(loading);
      var v = new HA.Viewer(canvas, { fov: 40 }); viewer = v;
      var url = 'models/organs/' + current + '.bin';
      HA.models.load(url).then(function (model) {
        if (my !== token) return; loading.remove();
        var fn = anim(current), parts = [];
        var main = v.add({ model: model, id: current, pickable: false, scale: 1, anim: null });
        if (current === 'lungs') {
          [-1, 1].forEach(function (s) {
            parts.push(v.add({ model: HA.sphereModel(1, [0.98, 0.58, 0.62], 0.38), pickable: false, pos: [s * 0.5, -0.05, 0], scale: [0.52, 1.02, 0.58], base: [0.52, 1.02, 0.58], basePos: [s * 0.5, -0.05, 0], cull: true }));
          });
        }
        var tick = function (t) {
          var r = fn(t); main.scale = [r.k, r.k, r.k]; main.rz = r.tw;
          parts.forEach(function (p) { p.scale = [p.base[0] * r.k, p.base[1] * r.k, p.base[2] * r.k]; p.pos = [p.basePos[0] * r.k, p.basePos[1] * r.k, 0]; });
        };
        if (HA.reduceMotion) { tick(0); v.invalidate(); }
        else { main.anim = tick; }
        var b = v.bounds([main]); v.setHome([0, 0, 0], 5.4, 0, 0.1); v.autoRotate = false;
      }).catch(function () { if (my === token) { loading.textContent = 'Could not load this model. Please check your connection and try again.'; } });
    }
    function renderPickers() {
      HA.clear(chips);
      C.labOrgans.forEach(function (o) {
        chips.appendChild(h('button', { type: 'button', class: 'organ-chip' + (o.id === current ? ' on' : ''), 'aria-pressed': o.id === current ? 'true' : 'false',
          onclick: function () { current = o.id; HA.feedback.play('tap'); renderPickers(); describe(); load(); } },
          h('img', { src: HA.img(o.icon), alt: '', width: 44, height: 44 }), h('small', {}, o.title)));
      });
      HA.clear(speeds);
      [['🛋️', 'Resting'], ['🚶', 'Walking'], ['🏃', 'Running']].forEach(function (s, i) {
        speeds.appendChild(h('button', { type: 'button', class: 'btn ' + (speed === i + 1 ? 'teal' : 'teal-o'), 'aria-pressed': speed === i + 1 ? 'true' : 'false',
          onclick: function () { speed = i + 1; HA.feedback.play('tap'); renderPickers(); describe(); if (viewer) { var o = viewer.objects; viewer.objects.forEach(function (x) { x.anim = null; }); load(); } } }, s[0] + ' ' + s[1]));
      });
    }
    app.appendChild(h('div', { class: 'page narrow' }, h('div', { class: 'page-head' }, HA.back('#/lab'), h('div', { class: 'page-title' }, h('h1', {}, 'Organ Lab 🫁'), h('p', { class: 'muted' }, 'Drag to turn the organ. Pick how active you are!'))),
      canvasWrap, speeds, caption, chips,
      h('p', { class: 'small muted center' }, 'Simplified 3D models. The motion is an illustration, not a medical simulation.')));
    renderPickers(); describe(); load();
    return function () { token++; if (viewer) viewer.dispose(); };
  };
})(window.HA);
