/* Body playroom and its six games */
(function (HA) {
  'use strict';
  var h = HA.el, C = HA.CONTENT, P = HA.pages, PP = C.playParts;

  P.playroom = function (app) {
    var earned = HA.getSet('bodyStickers');
    var stars = HA.starsChip();
    var stickers = h('div', { class: 'sticker-row' }, PP.map(function (p) {
      return h('span', { class: 'sticker' + (earned.has(p.name) ? ' on' : ''), title: p.name, 'aria-label': p.name + (earned.has(p.name) ? ' sticker earned' : ' sticker not yet earned') }, p.picture);
    }));
    var tiles = C.games.map(function (g, i) {
      return h('a', { class: 'game-tile', href: '#/game/' + i, style: { '--from': g.from, '--to': g.to } },
        h('span', { class: 'game-emoji' }, g.emoji), h('b', {}, g.title), h('small', {}, g.hint));
    });
    app.appendChild(h('div', { class: 'page narrow playroom' },
      h('div', { class: 'page-head' }, HA.back('#/'), h('div', { class: 'page-title' }, h('h1', {}, 'Body playroom 🎈'), h('p', { class: 'muted' }, 'Little discoveries. Big smiles!'))),
      h('div', {}, stars),
      h('h3', {}, 'Sticker book: ' + earned.size + ' of ' + PP.length), stickers,
      h('a', { class: 'hero-card vocab', href: '#/body' },
        h('img', { src: HA.img('ChildExplorer'), alt: '', width: 92, height: 138 }),
        h('div', {}, h('h2', {}, 'Body vocabulary'), h('p', {}, 'Tap the labels, listen and learn'), h('span', { class: 'pill' }, '▶ Start'))),
      h('a', { class: 'hero-card label', href: '#/label' },
        h('span', { class: 'round-emoji' }, '🏷️'), h('div', {}, h('h2', {}, 'Label my body'), h('p', {}, 'Drag each name onto the right spot')), h('span', { class: 'chev' }, '›')),
      h('h2', {}, 'More games'), h('div', { class: 'game-grid' }, tiles)));
    return function () { stars._off && stars._off(); };
  };

  P.game = function (app, params) {
    var mode = parseInt(params[0], 10); if (!(mode >= 0 && mode < 6)) { location.hash = '#/playroom'; return; }
    var G = C.games[mode];
    var round = 0, order = [], complete = false, selected = null, matched = new Set(), found = new Set();
    var letters = [], used = new Set(), answer = '', tiles = [], options = [], pairIDs = [], board = [], targets = new Set(), identify = [], wrong = new Set();
    var pool = PP.map(function (p, i) { return i; }).filter(function (i) { return mode !== 1 || PP[i].sortable !== false; });
    var feedback = '';
    var stars = HA.starsChip(), roundChip = h('span', { class: 'chip' });
    var bo = HA.buddy('happy', '', 76);
    var area = h('div', { class: 'game-area' });
    var nextBtn = h('button', { class: 'btn primary big', type: 'button', hidden: true, onclick: function () { nextRound(); } }, 'Next round');
    var star = h('div', { class: 'big-star', hidden: true }, '🌟');

    function part() { return PP[order[round % order.length]]; }
    function partIndex() { return order[round % order.length]; }
    function question() {
      var p = part();
      return [
        'Tap a body part, then tap what it does!', 'Usually one, or a pair?', 'Find 3 pictures of the ' + p.name.toLowerCase() + '!',
        'Build the word: ' + p.name.toUpperCase(), 'Tap two pieces to swap them!', 'What is this body part?'][mode];
    }
    function newOrder() {
      var last = order[order.length - 1]; order = HA.shuffle(pool);
      if (last !== undefined && order[0] === last && order.length > 1) { var t = order[0]; order[0] = order[order.length - 1]; order[order.length - 1] = t; }
    }
    function say(text, tone, mood) {
      feedback = text; HA.narrator.speak(text); HA.feedback.play(tone || 'tap');
      bo.set(mood || (tone === 'oops' ? 'oops' : tone === 'cheer' ? 'cheer' : 'happy'), text);
    }
    function win(lesson, sticker) {
      if (complete) return;
      complete = true; HA.addStar();
      var idx = sticker !== undefined ? sticker : partIndex();
      var earned = HA.getSet('bodyStickers'); var isNew = !earned.has(PP[idx].name); earned.add(PP[idx].name); HA.setList('bodyStickers', Array.from(earned));
      say('You did it! You earned a star.' + (isNew ? ' New sticker: ' + PP[idx].picture + ' ' + PP[idx].name + '!' : '') + ' ' + (lesson || ''), 'cheer', 'cheer');
      HA.confetti(); render();
    }
    function prepare() {
      if (!order.length) newOrder();
      complete = false; selected = null; matched = new Set(); found = new Set(); used = new Set(); answer = '';
      var p = part();
      letters = p.name.toUpperCase().split('').sort(function () { return Math.random() - 0.5; });
      if (letters.length > 1 && letters.join('') === p.name.toUpperCase()) { var t = letters[0]; letters[0] = letters[letters.length - 1]; letters[letters.length - 1] = t; }
      pairIDs = HA.shuffle(PP.map(function (x, i) { return i; })).slice(0, 4);
      do { options = HA.shuffle([0, 1, 2, 3]); } while (options.join() === '0,1,2,3');
      targets = new Set(HA.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]).slice(0, 3));
      var others = PP.map(function (x, i) { return i; }).filter(function (i) { return i !== partIndex(); });
      board = []; for (var k = 0; k < 12; k++) board.push(targets.has(k) ? partIndex() : HA.rand(others));
      wrong = new Set();
      identify = HA.shuffle([partIndex()].concat(HA.shuffle(others).slice(0, 2)));
      tiles = HA.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8]); if (tiles.join() === '0,1,2,3,4,5,6,7,8') { tiles[0] = 1; tiles[1] = 0; }
      feedback = question(); bo.set('happy', feedback); HA.narrator.speak(feedback);
      render();
    }
    function nextRound() { round++; if (round % Math.max(order.length, 1) === 0) newOrder(); prepare(); }
    function prompt(t) { return h('div', { class: 'prompt card' }, t); }
    function btn(cls, label, fn, dis) { return h('button', { type: 'button', class: cls, disabled: dis, onclick: fn }, label); }

    function matching() {
      var rows = [];
      for (var r = 0; r < 4; r++) (function (row) {
        var left = pairIDs[row], right = pairIDs[options[row]];
        rows.push(h('div', { class: 'match-row' },
          h('button', { type: 'button', class: 'match-tile' + (selected === left ? ' sel' : ''), disabled: matched.has(left) || complete,
            onclick: function () { selected = left; say(PP[left].name + '. Now tap what it does.'); render(); } },
            h('span', { class: 'em' }, PP[left].picture), h('b', {}, PP[left].name), matched.has(left) ? h('i', {}, '✓') : null),
          h('button', { type: 'button', class: 'match-tile text' + (matched.has(right) ? ' ok' : ''), disabled: matched.has(right) || complete,
            onclick: function () {
              if (selected === null) { say('First tap a body part on the left.', 'oops'); return; }
              if (selected === right) {
                matched.add(right); selected = null;
                if (matched.size === 4) win(PP[right].lesson, right); else { say('Yes! ' + PP[right].lesson, 'good'); render(); }
              } else say('Not quite. ' + PP[selected].lesson + ' Try another one.', 'oops');
            } }, (matched.has(right) ? '✓ ' : '') + PP[right].partner)));
      })(r);
      return h('div', {}, prompt('Tap a body part, then tap what it does!'), rows);
    }
    function sorting() {
      var p = part(), note = p.paired ? 'Most people have a pair.' : 'Most people have just one.';
      return h('div', { class: 'stack center' }, prompt('Usually one, or a pair?'), h('div', { class: 'huge-emoji' }, p.picture), h('h2', { class: 'huge-word' }, p.name),
        h('p', { class: 'muted' }, 'Everyone\u2019s body can be a little different.'),
        h('div', { class: 'row center' },
          btn('btn teal big', 'One', function () { if (!p.paired) win(p.lesson); else say('Not quite! ' + note + ' ' + p.lesson, 'oops'); }, complete),
          btn('btn indigo big', 'A pair', function () { if (p.paired) win(p.lesson); else say('Not quite! ' + note + ' ' + p.lesson, 'oops'); }, complete)));
    }
    function finding() {
      var p = part(), cells = [];
      for (var i = 0; i < 12; i++) (function (i) {
        var isT = targets.has(i), item = board[i];
        cells.push(h('button', { type: 'button', class: 'find-cell', disabled: found.has(i) || complete, 'aria-label': PP[item].name,
          onclick: function () {
            if (isT) { found.add(i); if (found.size === 3) win(p.lesson); else { say('Found one! Keep looking.', 'good'); render(); } }
            else say('Not that one. Keep looking for the ' + p.name.toLowerCase() + '.', 'oops');
          } }, found.has(i) ? '✅' : PP[item].picture));
      })(i);
      return h('div', {}, prompt('Find 3 pictures of the ' + p.name.toLowerCase() + '!'), h('p', { class: 'center strong' }, found.size + ' of 3 found'), h('div', { class: 'find-grid' }, cells));
    }
    function spelling() {
      var p = part(), expected = p.name.toUpperCase().split('');
      return h('div', { class: 'stack center' }, prompt('Build the word: ' + p.name.toUpperCase()), h('div', { class: 'huge-emoji' }, p.picture),
        btn('btn teal-o', '🔊 Say the word', function () { HA.narrator.speak(p.name); }),
        h('div', { class: 'answer' }, answer || 'Tap the letters in order'),
        h('div', { class: 'letter-grid' }, letters.map(function (L, i) {
          return h('button', { type: 'button', class: 'letter' + (used.has(i) ? ' used' : ''), disabled: used.has(i) || complete, onclick: function () {
            if (L === expected[answer.length]) {
              answer += L; used.add(i); HA.feedback.play('tap');
              if (answer === p.name.toUpperCase()) win(p.lesson); else render();
            } else say('Not that letter. The next letter is ' + expected[answer.length] + '.', 'oops');
          } }, L);
        })));
    }
    function identifyView() {
      var p = part();
      return h('div', { class: 'stack center' }, prompt('What is this body part?'), h('div', { class: 'huge-emoji' }, p.picture),
        identify.map(function (i) {
          var right = complete && i === partIndex();
          return h('button', { type: 'button', class: 'choice' + (right ? ' ok' : '') + (wrong.has(i) ? ' bad' : ''), disabled: wrong.has(i) || complete, onclick: function () {
            if (i === partIndex()) win(p.lesson);
            else { wrong.add(i); say('That is the ' + PP[i].name + '. ' + PP[i].lesson + ' Try another one!', 'oops'); render(); }
          } }, PP[i].name);
        }));
    }
    function puzzle() {
      var cells = tiles.map(function (tile, i) {
        return h('button', { type: 'button', class: 'pz' + (selected === i ? ' sel' : ''), disabled: complete, 'aria-label': 'Piece ' + (tile + 1) + ', position ' + (i + 1),
          style: { backgroundImage: 'url(' + HA.img('ChildExplorer') + ')', backgroundSize: '300% 300%', backgroundPosition: (tile % 3) * 50 + '% ' + Math.floor(tile / 3) * 50 + '%' },
          onclick: function () {
            if (selected !== null) {
              var t = tiles[selected]; tiles[selected] = tiles[i]; tiles[i] = t; selected = null; HA.feedback.play('tap');
              if (tiles.every(function (v, k) { return v === k; })) { win('Every part of your body works together!'); return; }
            } else selected = i;
            render();
          } });
      });
      return h('div', { class: 'stack center' }, prompt('Tap two pieces to swap them!'),
        h('img', { class: 'pz-preview', src: HA.img('ChildExplorer'), alt: 'Completed picture guide' }), h('div', { class: 'pz-grid' }, cells));
    }
    function render() {
      roundChip.textContent = 'Round ' + (round + 1);
      HA.clear(area);
      area.appendChild([matching, sorting, finding, spelling, puzzle, identifyView][mode]());
      star.hidden = !complete; nextBtn.hidden = !complete;
    }
    var page = h('div', { class: 'page narrow game-page', style: { '--from': G.from, '--to': G.to } },
      h('div', { class: 'page-head' }, HA.back('#/playroom'), h('div', { class: 'page-title' }, h('h1', {}, G.emoji + ' ' + G.title))),
      h('div', { class: 'row center' }, stars, roundChip), bo,
      h('div', { class: 'row center' }, btn('btn teal-o', '🔊 Hear again', function () { HA.narrator.speak(feedback); })),
      area, star, h('div', { class: 'row center' }, nextBtn), h('div', { class: 'row center' }, btn('btn ghost', 'Try this round again', function () { prepare(); })));
    app.appendChild(page);
    newOrder(); prepare();
    return function () { stars._off && stars._off(); };
  };
})(window.HA);
