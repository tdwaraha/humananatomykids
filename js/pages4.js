/* Home (Kids Learning 3D + Realistic 3D), Body detective quiz and Organ match */
(function (HA) {
  'use strict';
  var h = HA.el, C = HA.CONTENT, P = HA.pages;
  var D = HA.DATA;

  HA.homeState = { mode: 'kids', system: 'All systems', view: 'body', selected: 'heart', query: '', real: { id: 'body', slice: 0, labels: true, rotate: true } };

  function glFallback() { return h('div', { class: 'no-gl' }, 'This device can\u2019t show 3D right now. Try the latest Chrome, Edge, Firefox or Samsung Internet. The pictures and games still work!'); }

  // ---------------- Quiz + match ----------------
  function pictureQuiz(cfg) {
    return function (app) {
      var items = HA.sample(D.organs, 8), idx = 0, score = 0, picked = null, choices = [], feedback = '', mood = 'happy';
      var area = h('div', { class: 'stack' });
      var starChip = HA.starsChip();
      function finished() { return idx >= items.length; }
      function cur() { return items[Math.min(idx, items.length - 1)]; }
      function build() { choices = HA.shuffle([cur()].concat(HA.sample(D.organs.filter(function (o) { return o.id !== cur().id; }), 3))); }
      function ask() { build(); feedback = cfg.intro; HA.narrator.speak(cfg.prompt(cur())); render(); }
      function pick(o) {
        if (picked) return; picked = o.id; var c = cur();
        if (o.id === c.id) { score++; HA.addStar(); mood = 'cheer'; feedback = cfg.right(c); HA.feedback.play('good'); }
        else { mood = 'oops'; feedback = cfg.wrong(c); HA.feedback.play('oops'); }
        HA.narrator.speak(feedback); render();
      }
      function next() {
        idx++; picked = null;
        if (finished()) { mood = 'cheer'; feedback = cfg.done(score, items.length); HA.feedback.play('cheer'); HA.narrator.speak(feedback); HA.confetti(); render(); }
        else { mood = 'happy'; ask(); }
      }
      function restart() { items = HA.sample(D.organs, 8); idx = 0; score = 0; picked = null; mood = 'happy'; ask(); }
      function render() {
        HA.clear(area);
        if (finished()) {
          area.appendChild(h('div', { class: 'center stack' }, h('div', { class: 'huge-emoji' }, cfg.trophy), h('h2', {}, cfg.doneTitle), h('p', { class: 'strong' }, cfg.done(score, items.length)),
            h('button', { class: 'btn primary big', type: 'button', onclick: restart }, 'Play again'), h('a', { class: 'btn ghost', href: '#/' }, 'Back to home')));
          return;
        }
        var c = cur();
        area.appendChild(h('div', { class: 'step-pill', style: { '--p': Math.round((idx + 1) / items.length * 100) + '%' }, role: 'status' }, 'Question ' + (idx + 1) + ' of ' + items.length));
        area.appendChild(h('div', { class: 'prompt card' }, cfg.prompt(c)));
        area.appendChild(h('button', { class: 'btn teal-o', type: 'button', onclick: function () { HA.narrator.speak(cfg.prompt(c)); } }, '🔊 Hear again'));
        area.appendChild(h('div', { class: 'pic-grid' }, choices.map(function (o) {
          var cls = 'pic-tile';
          if (picked) { if (o.id === c.id) cls += ' ok'; else if (o.id === picked) cls += ' bad'; }
          return h('button', { type: 'button', class: cls, disabled: !!picked, 'aria-label': o.title, onclick: function () { pick(o); } },
            h('img', { src: HA.organImg(o.id), alt: '' }), h('span', { class: 'pic-name' }, picked ? o.title : '?'));
        })));
        if (picked) {
          var bo = HA.buddy(mood, feedback, 72); area.appendChild(bo);
          area.appendChild(h('button', { class: 'btn primary big', type: 'button', onclick: next }, idx === items.length - 1 ? 'See my result' : 'Next picture'));
        }
      }
      app.appendChild(h('div', { class: 'page narrow' }, h('div', { class: 'page-head' }, HA.back('#/'), h('div', { class: 'page-title' }, h('h1', {}, cfg.title)), starChip), area));
      ask();
      return function () { starChip._off && starChip._off(); };
    };
  }
  P.quiz = pictureQuiz({
    title: 'Body detective 🔎', trophy: '🌟', doneTitle: 'Great exploring!', intro: 'Find the picture that matches.',
    prompt: function (o) { return 'Which picture is the ' + o.title.toLowerCase() + '?'; },
    right: function (o) { return "Yes! That's the " + o.title.toLowerCase() + '. ' + o.fact; },
    wrong: function (o) { return 'Not quite. This one is the ' + o.title.toLowerCase() + '. ' + o.fact; },
    done: function (s, n) { return 'You got ' + s + ' of ' + n + ' right!'; }
  });
  P.match = pictureQuiz({
    title: 'Organ match 🧩', trophy: '🏆', doneTitle: 'Amazing explorer!', intro: 'Listen to the clue, then tap the matching picture.',
    prompt: function (o) { return 'Which body part does this job? ' + (D.clues[o.id] || o.job); },
    right: function (o) { return 'Great match! ' + o.fact; },
    wrong: function (o) { return 'Nice try! That job belongs to the ' + o.title.toLowerCase() + '. ' + o.fact; },
    done: function (s, n) { return 'You matched ' + s + ' of ' + n + ' body parts!'; }
  });

  // ---------------- Home ----------------
  P.home = function (app) {
    var S = HA.homeState, modeBox = h('div', { class: 'mode-box' }), modeCleanup = null;
    var stars = HA.starsChip();
    var bo = HA.buddy('happy', "Hi, I'm Bo! Tap, spin and zoom to explore with me.", 76);
    var seg = h('div', { class: 'segmented', role: 'tablist' });
    function renderSeg() {
      HA.clear(seg);
      [['kids', '🧒 Kids Learning'], ['real', '🔬 Realistic 3D']].forEach(function (m) {
        seg.appendChild(h('button', { type: 'button', role: 'tab', 'aria-selected': S.mode === m[0] ? 'true' : 'false', class: S.mode === m[0] ? 'on' : '', onclick: function () { S.mode = m[0]; HA.feedback.play('tap'); renderSeg(); renderMode(); } }, m[1]));
      });
    }
    function renderMode() {
      if (modeCleanup) { modeCleanup(); modeCleanup = null; }
      HA.narrator.stop(); HA.clear(modeBox);
      modeCleanup = S.mode === 'kids' ? kids(modeBox) : real(modeBox);
    }
    var cards = h('div', { class: 'top-cards' },
      h('a', { class: 'top-card c1', href: '#/body' }, h('span', { class: 'em' }, '🧒'), h('b', {}, 'Meet your body'), h('small', {}, 'Labels, listen & learn'), h('i', { class: 'go' }, '→')),
      h('a', { class: 'top-card c2', href: '#/lab' }, h('span', { class: 'em' }, '✨'), h('b', {}, 'Magic Body Lab'), h('small', {}, 'Lens, food journey, organ lab'), h('i', { class: 'go' }, '→')),
      h('a', { class: 'top-card c3', href: '#/playroom' }, h('span', { class: 'em' }, '🎈'), h('b', {}, 'Body playroom'), h('small', {}, 'Games & stickers'), h('i', { class: 'go' }, '→')));
    app.appendChild(h('div', { class: 'page home' },
      h('section', { class: 'hero-banner' },
        h('div', { class: 'hero-copy' },
          h('span', { class: 'eyebrow' }, '✨ Free • No ads • Works on laptops, tablets & phones'),
          h('h1', { class: 'grad' }, 'Explore the human body in 3D'),
          h('p', { class: 'lead' }, 'Spin, zoom and tap 36 organs. Play games, earn stars and learn with Bo.'),
          h('div', { class: 'row wrap hero-actions' },
            h('button', { class: 'btn glow', type: 'button', onclick: function () { modeBox.scrollIntoView({ behavior: HA.reduceMotion ? 'auto' : 'smooth', block: 'start' }); HA.feedback.play('tap'); } }, 'Start exploring →'),
            h('a', { class: 'btn glass', href: '#/playroom' }, '🎈 Play games'), stars)),
        h('div', { class: 'hero-bo' }, bo)),
      cards, seg, modeBox));
    renderSeg(); renderMode();
    return function () { if (modeCleanup) modeCleanup(); stars._off && stars._off(); };
  };

  // ---------- Kids Learning ----------
  function kids(box) {
    var S = HA.homeState, cat = D.catalog, token = 0, viewer = null, needCam = true, alive = true;
    var learned = HA.getSet('learnedOrgans');
    var overview = new Set(C.overview);
    var wrap = h('div', { class: 'viewer-wrap kids-wrap' });
    var viewSeg = h('div', { class: 'segmented small' }), sysSel = h('select', { id: 'sys', 'aria-label': 'Body system' });
    var search = h('input', { type: 'search', placeholder: 'Search organs', 'aria-label': 'Search organs', value: S.query });
    var lesson = h('div', { class: 'card lesson' }), grid = h('div', { class: 'organ-grid' });
    var note = h('p', { class: 'small muted center' }, 'Drag to turn • Pinch or scroll to zoom • Tap an organ to learn about it');
    var reset = h('button', { class: 'btn ghost small-btn', type: 'button', onclick: function () { if (viewer) viewer.resetView(); } }, '⟲ Reset view');

    function hasModel(id) { return !!cat[id]; }
    function select(id, speak) {
      S.selected = id; learned.add(id); HA.setList('learnedOrgans', Array.from(learned));
      renderLesson(); renderGrid(); buildScene(false);
      if (speak) { var o = HA.organById(id); HA.narrator.speak(o.title + '. ' + o.job); HA.feedback.play('tap'); }
    }
    function renderViewSeg() {
      HA.clear(viewSeg);
      [['body', 'My body'], ['part', 'One body part']].forEach(function (v) {
        viewSeg.appendChild(h('button', { type: 'button', class: S.view === v[0] ? 'on' : '', 'aria-pressed': S.view === v[0] ? 'true' : 'false', onclick: function () { S.view = v[0]; needCam = true; renderViewSeg(); buildScene(true); } }, v[1]));
      });
    }
    function renderSys() {
      HA.clear(sysSel);
      ['All systems'].concat(HA.systems()).forEach(function (s) { sysSel.appendChild(h('option', { value: s, selected: s === S.system }, s)); });
    }
    function filtered() {
      var q = S.query.trim().toLowerCase();
      return D.organs.filter(function (o) {
        return (S.system === 'All systems' || o.system === S.system) && (!q || o.title.toLowerCase().indexOf(q) >= 0 || o.system.toLowerCase().indexOf(q) >= 0);
      });
    }
    function renderGrid() {
      HA.clear(grid);
      var list = filtered();
      if (!list.length) grid.appendChild(h('p', { class: 'muted' }, 'No matches. Try another word!'));
      list.forEach(function (o) {
        grid.appendChild(h('button', { type: 'button', class: 'organ-card' + (o.id === S.selected ? ' on' : ''), 'aria-pressed': o.id === S.selected ? 'true' : 'false', onclick: function () { select(o.id, true); } },
          h('img', { src: HA.organImg(o.id), alt: '', loading: 'lazy', width: 96, height: 96 }), h('b', {}, o.title), learned.has(o.id) ? h('span', { class: 'star' }, '⭐') : null));
      });
    }
    function renderLesson() {
      var o = HA.organById(S.selected); HA.clear(lesson);
      lesson.appendChild(h('div', { class: 'row between' }, h('div', {}, h('h2', {}, o.emoji + ' ' + o.title), HA.chip(o.system)),
        h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Listen', onclick: function () { HA.narrator.speak(o.title + '. ' + o.job + ' Did you know? ' + o.fact); } }, '🔊')));
      lesson.appendChild(h('p', {}, o.job)); lesson.appendChild(h('p', { class: 'fact' }, '💡 ' + o.fact));
      var qbox = h('div', { class: 'mini-quiz' }), qa = h('p', { class: 'strong' }, o.question);
      qbox.appendChild(qa);
      var fb = h('p', { class: 'feedback' });
      o.choices.forEach(function (c, i) {
        qbox.appendChild(h('button', { type: 'button', class: 'btn teal-o', onclick: function (e) {
          if (i === o.answer) { fb.textContent = 'Yes! ' + c + '.'; e.currentTarget.classList.add('ok'); HA.feedback.play('good'); HA.narrator.speak('Yes! ' + c); }
          else { fb.textContent = 'Not quite. Try again!'; HA.feedback.play('oops'); }
        } }, c));
      });
      qbox.appendChild(fb); lesson.appendChild(qbox);
      lesson.appendChild(h('div', { class: 'row wrap' }, h('a', { class: 'btn primary', href: '#/parts/' + o.id }, '🔎 See the parts'),
        !hasModel(o.id) ? h('span', { class: 'chip' }, 'Picture lesson') : null));
    }
    function buildScene(reuse) {
      if (!viewer) return;
      var my = ++token, o = HA.organById(S.selected), v = viewer;
      var list = [];
      if (S.view === 'body') {
        if (o.id !== 'skin' && hasModel('skin')) list.push('skin');
        D.organs.forEach(function (it) {
          if (!hasModel(it.id) || it.id === 'skin') return;
          if (it.id === o.id) { list.push(it.id); return; }
          if (o.id === 'skin') return;
          if (S.system === 'All systems' ? overview.has(it.id) : it.system === S.system) list.push(it.id);
        });
        if (o.id === 'skin') list = ['skin'];
      } else if (hasModel(o.id)) list = [o.id];
      var noModel = list.length === 0;
      noteEl.hidden = !noModel;
      if (noModel) { v.clear(); noteEl.textContent = o.title + ' does not have a 3D model yet. See its picture and parts below!'; return; }
      Promise.all(list.map(function (id) { return HA.models.load('models/organs/' + id + '.bin').then(function (m) { return [id, m]; }); })).then(function (res) {
        if (my !== token || !alive) return;
        loading.hidden = true; v.clear();
        res.forEach(function (r) {
          var id = r[0], m = r[1], p = cat[id];
          if (S.view === 'body') {
            var isSkin = id === 'skin' && o.id !== 'skin';
            v.add({ model: m, id: id, organId: isSkin ? null : id, pickable: !isSkin, pos: p.position.slice(), scale: p.scale, alpha: isSkin ? 0.07 : null, cull: isSkin, emit: id === o.id ? 0.1 : 0 });
          } else v.add({ model: m, id: id, organId: id, pos: [0, 0, 0], scale: 1, pickable: false });
        });
        if (needCam || !reuse) {
          if (S.view === 'body') v.setHome([0, 1.3, 0], 12, 0, 0.08); else v.setHome([0, 0, 0], 5.5, 0.4, 0.15);
          needCam = false;
        }
        v.autoRotate = S.view === 'part' && !HA.reduceMotion; v.autoSpeed = 0.18;
        v.invalidate();
      }).catch(function () { if (my === token) { loading.hidden = false; loading.textContent = 'Could not load the 3D model. Please check your connection.'; } });
    }
    var noteEl = h('div', { class: 'no-model', hidden: true }), loading = h('div', { class: 'loading' }, 'Loading 3D…');
    if (!HA.webglSupported()) wrap.appendChild(glFallback());
    else {
      var canvas = h('canvas', { class: 'gl', role: 'img', 'aria-label': '3D view of the human body. Drag to turn, pinch to zoom, tap an organ to learn about it.' });
      wrap.appendChild(canvas); wrap.appendChild(loading); wrap.appendChild(noteEl);
      try {
        viewer = new HA.Viewer(canvas, { fov: 42 });
        viewer.onPick = function (obj) { if (obj && obj.organId) select(obj.organId, true); };
      } catch (e) { HA.clear(wrap); wrap.appendChild(glFallback()); viewer = null; }
    }
    sysSel.addEventListener('change', function () { S.system = sysSel.value; renderGrid(); buildScene(true); });
    search.addEventListener('input', function () { S.query = search.value; renderGrid(); });
    box.appendChild(h('div', { class: 'row between wrap controls' }, viewSeg, reset));
    box.appendChild(wrap); box.appendChild(note);
    box.appendChild(h('div', { class: 'row wrap filters' }, h('label', { class: 'sel-wrap', for: 'sys' }, 'System ', sysSel), search));
    box.appendChild(h('h2', {}, 'Tap a picture to explore')); box.appendChild(grid); box.appendChild(lesson);
    box.appendChild(h('div', { class: 'two-cards' },
      h('a', { class: 'hero-card quiz', href: '#/quiz' }, h('span', { class: 'round-emoji' }, '🔎'), h('div', {}, h('h2', {}, 'Body detective'), h('p', {}, 'Which picture is it?')), h('span', { class: 'chev' }, '›')),
      h('a', { class: 'hero-card match', href: '#/match' }, h('span', { class: 'round-emoji' }, '🧩'), h('div', {}, h('h2', {}, 'Organ match'), h('p', {}, 'Which part does this job?')), h('span', { class: 'chev' }, '›'))));
    renderViewSeg(); renderSys(); renderGrid(); renderLesson(); buildScene(false);
    return function () { alive = false; token++; if (viewer) viewer.dispose(); };
  }

  // ---------- Realistic 3D ----------
  function real(box) {
    var R = HA.homeState.real, viewer = null, token = 0, alive = true, labelEls = [], anchors = [];
    var wrap = h('div', { class: 'viewer-wrap real-wrap' }), labelLayer = h('div', { class: 'label-layer', 'aria-hidden': 'true' });
    var chips = h('div', { class: 'chip-scroll' }), info = h('div', { class: 'card lesson' }), secSeg = h('div', { class: 'segmented small' });
    var search = h('input', { type: 'search', class: 'search-in', placeholder: 'Search models', 'aria-label': 'Search models' });
    var loading = h('div', { class: 'loading' }, 'Loading 3D…');
    function model() { return C.realModels.filter(function (m) { return m.id === R.id; })[0]; }
    function renderChips() {
      HA.clear(chips); var q = search.value.trim().toLowerCase();
      C.realModels.filter(function (m) { return !q || m.title.toLowerCase().indexOf(q) >= 0 || m.tag.toLowerCase().indexOf(q) >= 0; }).forEach(function (m) {
        chips.appendChild(h('button', { type: 'button', class: 'model-chip' + (m.id === R.id ? ' on' : ''), style: { '--c': m.color }, 'aria-pressed': m.id === R.id ? 'true' : 'false',
          onclick: function () { R.id = m.id; R.slice = 0; HA.feedback.play('tap'); renderChips(); renderSec(); renderInfo(); load(); HA.narrator.speak(m.title + '. ' + m.description); } }, h('b', {}, m.title), h('small', {}, m.tag)));
      });
    }
    function renderSec() {
      HA.clear(secSeg); if (R.id === 'body') return;
      [[0, 'Whole'], [1, '25%'], [2, '50%'], [3, '75%']].forEach(function (s) {
        secSeg.appendChild(h('button', { type: 'button', class: R.slice === s[0] ? 'on' : '', 'aria-pressed': R.slice === s[0] ? 'true' : 'false', onclick: function () { R.slice = s[0]; renderSec(); load(); } }, s[1]));
      });
    }
    function renderInfo() {
      var m = model(); HA.clear(info);
      info.appendChild(h('div', { class: 'row between' }, h('div', {}, h('h2', {}, m.title), HA.chip(m.tag)), h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Listen', onclick: function () { HA.narrator.speak(m.title + '. ' + m.description + ' Did you know? ' + m.fact); } }, '🔊')));
      info.appendChild(h('p', {}, m.description)); info.appendChild(h('p', { class: 'fact' }, '💡 ' + m.fact));
      info.appendChild(h('h3', {}, 'Key parts and jobs')); info.appendChild(h('ul', { class: 'key-list' }, m.key.map(function (k) { return h('li', {}, k); })));
    }
    function buildLabels(model3d) {
      HA.clear(labelLayer); labelEls = []; anchors = [];
      if (!R.labels) return;
      var m = model(), b = model3d, c = [0, 1, 2].map(function (a) { return (b.bmin[a] + b.bmax[a]) / 2; }), hs = [0, 1, 2].map(function (a) { return (b.bmax[a] - b.bmin[a]) / 2; });
      m.labels.forEach(function (l) {
        var el = h('span', { class: 'gl-label' }, l.text); labelLayer.appendChild(el); labelEls.push(el);
        anchors.push([c[0] + l.off[0] * hs[0], c[1] + l.off[1] * hs[1], c[2] + l.off[2] * hs[2]]);
      });
    }
    function frame() {
      if (!viewer) return;
      for (var i = 0; i < anchors.length; i++) {
        var p = viewer.project(anchors[i]), el = labelEls[i];
        el.style.transform = 'translate(' + Math.round(p.x) + 'px,' + Math.round(p.y) + 'px) translate(-50%,-50%)';
        el.style.visibility = p.visible ? 'visible' : 'hidden';
      }
    }
    function load() {
      var my = ++token; var m = model();
      var file = R.id === 'body' || R.slice === 0 ? R.id : R.id + '_s' + R.slice * 25;
      loading.hidden = false; loading.textContent = 'Loading 3D…';
      HA.models.load('models/real/' + file + '.bin').then(function (md) {
        if (my !== token || !alive || !viewer) return;
        loading.hidden = true; viewer.clear();
        var b = md; var ext = Math.max(b.bmax[0] - b.bmin[0], b.bmax[1] - b.bmin[1], b.bmax[2] - b.bmin[2]) || 1;
        var s = 1.7 / ext;
        var cen = [0, 1, 2].map(function (a) { return (b.bmin[a] + b.bmax[a]) / 2; });
        viewer.add({ model: md, id: file, pickable: false, scale: s, pos: [-cen[0] * s, -cen[1] * s, -cen[2] * s] });
        // labels are anchored in the fitted (scaled) space
        var fitted = { bmin: [0, 1, 2].map(function (a) { return (b.bmin[a] - cen[a]) * s; }), bmax: [0, 1, 2].map(function (a) { return (b.bmax[a] - cen[a]) * s; }) };
        buildLabels(fitted);
        viewer.setHome([0, 0, 0], 3.7, 0.35, 0.12);
        viewer.autoRotate = R.rotate && !HA.reduceMotion; viewer.autoSpeed = 0.35; viewer.invalidate();
      }).catch(function () { if (my === token) loading.textContent = 'Could not load this model. Please check your connection.'; });
    }
    if (!HA.webglSupported()) wrap.appendChild(glFallback());
    else {
      var canvas = h('canvas', { class: 'gl', role: 'img', 'aria-label': 'Realistic 3D model. Drag to turn, pinch to zoom.' });
      wrap.appendChild(canvas); wrap.appendChild(labelLayer); wrap.appendChild(loading);
      try { viewer = new HA.Viewer(canvas, { fov: 38 }); viewer.onFrame = frame; viewer.interactive = true; }
      catch (e) { HA.clear(wrap); wrap.appendChild(glFallback()); viewer = null; }
    }
    function tool(label, fn, aria) { return h('button', { class: 'btn ghost small-btn', type: 'button', 'aria-label': aria || label, onclick: fn }, label); }
    var rotBtn = tool(R.rotate ? '🔄 Spin: on' : '🔄 Spin: off', function () { R.rotate = !R.rotate; rotBtn.textContent = R.rotate ? '🔄 Spin: on' : '🔄 Spin: off'; if (viewer) { viewer.autoRotate = R.rotate && !HA.reduceMotion; viewer.invalidate(); } }, 'Toggle spinning');
    var lblBtn = tool(R.labels ? '🏷️ Labels on' : '🏷️ Labels off', function () { R.labels = !R.labels; lblBtn.textContent = R.labels ? '🏷️ Labels on' : '🏷️ Labels off'; load(); }, 'Toggle labels');
    var fsBtn = tool('⛶ Full screen', function () {
      if (document.fullscreenElement) document.exitFullscreen(); else if (wrap.requestFullscreen) wrap.requestFullscreen().catch(function () {});
    }, 'Toggle full screen');
    if (!document.fullscreenEnabled) fsBtn.hidden = true;
    search.addEventListener('input', renderChips);
    box.appendChild(search); box.appendChild(chips);
    box.appendChild(h('div', { class: 'row between wrap controls' }, secSeg, h('div', { class: 'row' }, rotBtn, lblBtn, tool('⟲ Reset', function () { if (viewer) viewer.resetView(); }, 'Reset view'), fsBtn)));
    box.appendChild(wrap); box.appendChild(h('p', { class: 'small muted center' }, 'Drag to turn • Pinch or scroll to zoom • Realistic models are simplified for learning. Labels are approximate.'));
    box.appendChild(info);
    renderChips(); renderSec(); renderInfo(); if (viewer) load();
    return function () { alive = false; token++; if (viewer) viewer.dispose(); if (document.fullscreenElement) document.exitFullscreen().catch(function () {}); };
  }
})(window.HA);
