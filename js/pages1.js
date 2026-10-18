/* Meet your body, organ parts, Label my body */
(function (HA) {
  'use strict';
  var h = HA.el, C = HA.CONTENT, P = HA.pages = HA.pages || {};

  function pageHead(title, sub, extra) {
    return h('div', { class: 'page-head' }, HA.back(), h('div', { class: 'page-title' }, h('h1', {}, title), sub ? h('p', { class: 'muted' }, sub) : null), extra || null);
  }
  HA.pageHead = pageHead;

  // ---------------- Meet your body ----------------
  P.body = function (app) {
    var parts = C.bodyParts, selected = 0, target = null;
    var feedback = 'Tap a label to learn about a body part.';
    var showLabels = HA.store.get('showBodyLabels', true);
    var explored = HA.getSet('bodyPartsExplored');
    var countChip = h('span', { class: 'chip' });
    var labelCb = h('input', { type: 'checkbox', id: 'lblcb' });
    labelCb.checked = showLabels;
    var pic = h('div', { class: 'body-pic', role: 'group', 'aria-label': 'Picture of a child with body part labels' });
    var nameEl = h('h2', { class: 'big-name' }), fbEl = h('p', { class: 'feedback', 'aria-live': 'polite' });
    var grid = h('div', { class: 'chip-grid' });
    var playBtn = h('button', { class: 'btn primary', type: 'button' }, 'Play: find a body part');
    var stopBtn = h('button', { class: 'btn ghost', type: 'button', hidden: true }, 'Stop playing and show the labels');

    function labelsVisible() { return showLabels && target === null; }
    function choose(i) {
      selected = i; var part = parts[i];
      explored.add(part.name); HA.setList('bodyPartsExplored', Array.from(explored));
      if (target !== null) {
        var goal = parts[target].name.toLowerCase();
        if (target === i) { feedback = "You found it! That's the " + goal + '.'; HA.feedback.play('good'); target = null; }
        else { feedback = 'Try again. Find the ' + goal + '.'; HA.feedback.play('oops'); }
      } else { feedback = part.fact; HA.feedback.play('tap'); }
      HA.narrator.speak(feedback); render();
    }
    function pickNearest(e) {
      var r = pic.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
      var best = 0, bd = 1e9;
      parts.forEach(function (p, i) {
        [p.target].concat(p.also || []).forEach(function (s) {
          var d = Math.pow(s[0] - x, 2) + Math.pow((s[1] - y) * 1.5, 2);
          if (d < bd) { bd = d; best = i; }
        });
      });
      choose(best);
    }
    function render() {
      countChip.textContent = '⭐ ' + parts.filter(function (p) { return explored.has(p.name); }).length + ' of ' + parts.length + ' explored';
      labelCb.disabled = target !== null;
      HA.clear(pic);
      pic.appendChild(h('img', { src: HA.img('ChildExplorer'), alt: '', draggable: 'false' }));
      var tap = h('div', { class: 'pic-tap', onclick: pickNearest }); pic.appendChild(tap);
      var NS = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 200 300'); svg.setAttribute('class', 'pic-svg'); svg.setAttribute('aria-hidden', 'true');
      function s(tag, a) { var n = document.createElementNS(NS, tag); Object.keys(a).forEach(function (k) { n.setAttribute(k, a[k]); }); svg.appendChild(n); }
      if (labelsVisible()) {
        parts.forEach(function (p, i) {
          var on = i === selected, tw = 0.20 * 200 / 2;
          var fx = p.tag[0] * 200 + (p.tag[0] < 0.5 ? tw : -tw), fy = p.tag[1] * 300;
          s('line', { x1: fx, y1: fy, x2: p.target[0] * 200, y2: p.target[1] * 300, stroke: on ? '#FF9500' : 'rgba(13,102,115,.8)', 'stroke-width': on ? 1.6 : 1, 'stroke-linecap': 'round' });
          s('circle', { cx: p.target[0] * 200, cy: p.target[1] * 300, r: on ? 3.4 : 2.8, fill: on ? '#FF9500' : '#0D6673', stroke: '#fff', 'stroke-width': 1 });
        });
      } else {
        var t = parts[selected].target;
        s('circle', { cx: t[0] * 200, cy: t[1] * 300, r: 7, fill: 'rgba(255,149,0,.16)', stroke: '#FF9500', 'stroke-width': 1.6 });
      }
      pic.appendChild(svg);
      if (labelsVisible()) {
        parts.forEach(function (p, i) {
          pic.appendChild(h('button', { type: 'button', class: 'tag' + (i === selected ? ' on' : ''), style: { left: p.tag[0] * 100 + '%', top: p.tag[1] * 100 + '%' },
            'aria-pressed': i === selected ? 'true' : 'false', onclick: function () { choose(i); } }, p.name));
        });
      }
      nameEl.textContent = parts[selected].name; fbEl.textContent = feedback;
      HA.clear(grid);
      parts.forEach(function (p, i) { grid.appendChild(h('button', { type: 'button', class: 'btn ' + (i === selected ? 'orange' : 'teal-o'), onclick: function () { choose(i); } }, p.name)); });
      playBtn.hidden = target !== null ? false : false; stopBtn.hidden = target === null;
    }
    labelCb.addEventListener('change', function () { showLabels = labelCb.checked; HA.store.set('showBodyLabels', showLabels); render(); });
    playBtn.addEventListener('click', function () {
      target = Math.floor(Math.random() * parts.length); feedback = 'Can you find the ' + parts[target].name.toLowerCase() + '?';
      HA.narrator.speak(feedback); render();
    });
    stopBtn.addEventListener('click', function () { target = null; feedback = 'Tap a label to learn about a body part.'; HA.narrator.stop(); render(); });
    var wrap = h('div', { class: 'page narrow' },
      pageHead('Meet your body', 'A friendly illustrated guide'),
      h('div', { class: 'row between' }, countChip, h('label', { class: 'switch', for: 'lblcb' }, 'Labels', labelCb)),
      pic, nameEl, fbEl,
      h('button', { class: 'btn teal', type: 'button', onclick: function () { HA.narrator.speak(parts[selected].fact); } }, '🔊 Listen'),
      grid, h('div', { class: 'row center' }, playBtn, stopBtn),
      h('p', { class: 'small muted center' }, '2D illustration • Open the organ explorer on the home page for interactive 3D.'));
    app.appendChild(wrap); render();
  };

  // ---------------- Organ parts ----------------
  P.parts = function (app, params) {
    var organ = HA.organById(params[0]);
    if (!organ) { location.hash = '#/'; return; }
    var parts = HA.DATA.parts[organ.id] || [];
    var selected = -1, showLabels = true;
    var box = h('div', { class: 'parts-pic' });
    var card = h('div', { class: 'card detail-card' });
    function isLeft(i) { return (parts[i].points[0] || [0.5])[0] < 0.5; }
    function tagY() {
      var res = {};
      [true, false].forEach(function (left) {
        var g = parts.map(function (p, i) { return i; }).filter(function (i) { return isLeft(i) === left; })
          .sort(function (a, b) { return parts[a].points[0][1] - parts[b].points[0][1]; });
        var last = -1;
        g.forEach(function (i) {
          var y = 0.25 + parts[i].points[0][1] * 0.5;
          if (y < last + 0.115) y = last + 0.115;
          y = Math.min(Math.max(y, 0.06), 0.94); last = y; res[i] = y;
        });
      });
      return res;
    }
    function select(i) { selected = i; HA.narrator.speak(parts[i].name + '. ' + parts[i].detail); HA.feedback.play('tap'); render(); }
    function render() {
      HA.clear(box);
      box.appendChild(h('img', { src: HA.organImg(organ.id), alt: '', class: 'parts-img' }));
      var NS = 'http://www.w3.org/2000/svg';
      var svg = document.createElementNS(NS, 'svg'); svg.setAttribute('viewBox', '0 0 100 100'); svg.setAttribute('class', 'pic-svg'); svg.setAttribute('aria-hidden', 'true');
      var ty = tagY();
      if (showLabels) {
        parts.forEach(function (p, i) {
          var on = selected === i;
          p.points.forEach(function (pt) {
            var ln = document.createElementNS(NS, 'line');
            ln.setAttribute('x1', isLeft(i) ? 28 : 72); ln.setAttribute('y1', ty[i] * 100);
            ln.setAttribute('x2', 25 + pt[0] * 50); ln.setAttribute('y2', 25 + pt[1] * 50);
            ln.setAttribute('stroke', on ? organ.color : 'rgba(23,43,71,.7)'); ln.setAttribute('stroke-width', on ? 0.8 : 0.4);
            svg.appendChild(ln);
            var c = document.createElementNS(NS, 'circle');
            c.setAttribute('cx', 25 + pt[0] * 50); c.setAttribute('cy', 25 + pt[1] * 50); c.setAttribute('r', 1.3);
            c.setAttribute('fill', on ? organ.color : '#fff'); c.setAttribute('stroke', '#172B47'); c.setAttribute('stroke-width', 0.4);
            svg.appendChild(c);
          });
        });
      }
      box.appendChild(svg);
      if (showLabels) parts.forEach(function (p, i) {
        box.appendChild(h('button', { type: 'button', class: 'tag wide ' + (isLeft(i) ? 'l' : 'r') + (selected === i ? ' on' : ''),
          style: { left: (isLeft(i) ? 2 : 98) + '%', top: ty[i] * 100 + '%', '--c': organ.color }, onclick: function () { select(i); } }, p.name));
      });
      HA.clear(card);
      if (selected >= 0) {
        card.appendChild(h('div', { class: 'row between' }, h('h3', {}, parts[selected].name),
          h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'Read about the ' + parts[selected].name, onclick: function () { HA.narrator.speak(parts[selected].name + '. ' + parts[selected].detail); } }, '🔊')));
        card.appendChild(h('p', {}, parts[selected].detail));
      } else card.appendChild(h('p', { class: 'muted' }, 'Tap a label to learn about each part.'));
    }
    var cb = h('input', { type: 'checkbox', id: 'plcb', checked: true });
    cb.addEventListener('change', function () { showLabels = cb.checked; render(); });
    app.appendChild(h('div', { class: 'page narrow' },
      pageHead(organ.emoji + ' ' + organ.title + ' parts'),
      h('div', { class: 'row end' }, h('label', { class: 'switch', for: 'plcb' }, 'Show labels', cb)),
      box, card,
      HA.listenBtn(function () { return organ.title + '. ' + organ.job + ' Did you know? ' + organ.fact; }, 'Listen to the whole ' + organ.title.toLowerCase()),
      h('p', { class: 'small muted center' }, 'Simplified picture. Sizes and positions are approximate.')));
    render();
  };

  // ---------------- Label my body ----------------
  P.label = function (app) {
    var spots = [], tray = [], placed = new Set(), selected = null, complete = false;
    var bo = HA.buddy('happy', 'Drag each name to the right place on my body!', 72);
    var pic = h('div', { class: 'body-pic label-pic' }), trayEl = h('div', { class: 'tray' });
    var starChip = HA.starsChip();
    var next = h('button', { class: 'btn primary big', type: 'button', hidden: true, onclick: function () { newRound(); } }, 'Next round');
    function say(m, msg, tone) { bo.set(m, msg); if (tone) HA.feedback.play(tone); }
    function newRound() {
      spots = HA.sample(C.labelSpots, 6); tray = HA.shuffle(spots.map(function (s) { return s.name; }));
      placed = new Set(); selected = null; complete = false; next.hidden = true;
      say('happy', 'Drag each name to the right place on my body!'); render();
    }
    function spotAt(cx, cy) {
      var r = pic.getBoundingClientRect(), nx = (cx - r.left) / r.width, ny = (cy - r.top) / r.height, best = null, bd = 1e9;
      spots.forEach(function (s) {
        if (placed.has(s.name)) return;
        var d = Math.sqrt(Math.pow(s.point[0] - nx, 2) + Math.pow((s.point[1] - ny) * 1.5, 2));
        if (d < 0.09 && d < bd) { bd = d; best = s; }
      });
      return best;
    }
    function attempt(name, spot) {
      if (!spot) { say('think', 'Drop ' + name.toLowerCase() + ' on a ring on my body.', 'tap'); return; }
      if (spot.name === name) {
        placed.add(name); selected = null; var m = "Yes! That's the " + name.toLowerCase() + '.';
        HA.narrator.speak(m);
        if (placed.size === spots.length) {
          complete = true; HA.addStar(); say('cheer', 'You labelled my whole body! ⭐', 'cheer');
          HA.narrator.speak('You labelled the whole body! You earned a star.'); HA.confetti(); next.hidden = false;
        } else say('happy', m, 'good');
      } else { say('oops', 'Not quite. Try another spot for ' + name.toLowerCase() + '.', 'oops'); HA.narrator.speak('Not quite. Try again.'); }
      render();
    }
    function render() {
      HA.clear(pic); pic.appendChild(h('img', { src: HA.img('ChildExplorer'), alt: '', draggable: 'false' }));
      spots.forEach(function (s) {
        var done = placed.has(s.name);
        pic.appendChild(h('button', { type: 'button', class: 'ring' + (done ? ' done' : ''), style: { left: s.point[0] * 100 + '%', top: s.point[1] * 100 + '%' },
          'aria-label': done ? s.name : 'Spot ' + s.hint, disabled: done || complete,
          onclick: function () { if (selected) attempt(selected, s); else say('think', 'First tap a name, then tap its ring.', 'tap'); } }, done ? s.name : ''));
      });
      HA.clear(trayEl);
      tray.forEach(function (name) {
        if (placed.has(name)) return;
        var chip = h('button', { type: 'button', class: 'drag-chip' + (selected === name ? ' sel' : ''), 'data-name': name }, name);
        chip.addEventListener('pointerdown', function (e) { startDrag(e, chip, name); });
        trayEl.appendChild(chip);
      });
    }
    function startDrag(e, chip, name) {
      if (complete) return;
      e.preventDefault();
      var sx = e.clientX, sy = e.clientY, moved = false, ghost = null;
      try { chip.setPointerCapture(e.pointerId); } catch (x) {}
      function mv(ev) {
        if (!moved && Math.hypot(ev.clientX - sx, ev.clientY - sy) > 6) {
          moved = true; ghost = h('div', { class: 'drag-ghost' }, name); document.body.appendChild(ghost); chip.classList.add('lifting');
        }
        if (ghost) { ghost.style.left = ev.clientX + 'px'; ghost.style.top = (ev.clientY - 36) + 'px'; }
      }
      function up(ev) {
        chip.removeEventListener('pointermove', mv); chip.removeEventListener('pointerup', up); chip.removeEventListener('pointercancel', up);
        if (ghost) ghost.remove(); chip.classList.remove('lifting');
        if (moved) { attempt(name, spotAt(ev.clientX, ev.clientY - 36)); }
        else { selected = selected === name ? null : name; HA.feedback.play('tap'); render(); }
      }
      chip.addEventListener('pointermove', mv); chip.addEventListener('pointerup', up); chip.addEventListener('pointercancel', up);
    }
    app.appendChild(h('div', { class: 'page narrow' }, pageHead('Label my body', 'Drag a name onto the right ring (or tap a name, then tap a ring)', starChip), bo, pic, trayEl, h('div', { class: 'row center' }, next)));
    newRound();
    return function () { starChip._off && starChip._off(); };
  };
})(window.HA);
