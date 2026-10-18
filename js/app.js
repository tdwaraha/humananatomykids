/* Router and page shell */
(function (HA) {
  'use strict';
  var app = document.getElementById('app'), cleanup = null;
  var TITLES = { home: '', body: 'Meet your body', lab: 'Magic Body Lab', lens: 'Magic Lens', food: 'Food Journey', organlab: 'Organ Lab', playroom: 'Body playroom', game: 'Body playroom game', label: 'Label my body', quiz: 'Body detective', match: 'Organ match', parts: 'Organ parts' };
  var BASE = 'Human Anatomy for Kids';

  function route() {
    var hash = location.hash.replace(/^#\/?/, '').split('?')[0];
    var parts = hash.split('/').filter(Boolean), name = parts[0] || 'home', params = parts.slice(1);
    if (!HA.pages[name]) name = 'home';
    if (cleanup) { try { cleanup(); } catch (e) {} cleanup = null; }
    HA.narrator.stop();
    HA.clear(app);
    try { cleanup = HA.pages[name](app, params) || null; }
    catch (err) {
      if (window.console) console.error(err);
      app.appendChild(HA.el('div', { class: 'page narrow' }, HA.el('div', { class: 'card center' }, HA.el('h2', {}, 'Oops!'), HA.el('p', {}, 'Something went wrong loading this page.'), HA.el('a', { class: 'btn primary', href: '#/' }, 'Back to home'))));
    }
    HA.reveal(app);
    document.title = (TITLES[name] ? TITLES[name] + ' \u2022 ' : '') + BASE;
    window.scrollTo(0, 0);
    var h1 = app.querySelector('h1'); if (h1) { h1.setAttribute('tabindex', '-1'); }
  }

  var musicBtn = document.getElementById('music-btn'), setBtn = document.getElementById('settings-btn');
  function syncMusic() { if (!musicBtn) return; var on = HA.settings.music; musicBtn.textContent = on ? '🎵' : '🔇'; musicBtn.setAttribute('aria-pressed', on ? 'true' : 'false'); musicBtn.setAttribute('aria-label', on ? 'Turn music off' : 'Turn music on'); }
  if (musicBtn) musicBtn.addEventListener('click', function () { HA.store.set('music', !HA.settings.music); syncMusic(); HA.music.refresh(); if (HA.settings.music) HA.music.start(); });
  if (setBtn) setBtn.addEventListener('click', function () { HA.openSettings(); });
  var dlg = document.getElementById('settings');
  if (dlg) { dlg.addEventListener('close', syncMusic); dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); }); }
  syncMusic();

  window.addEventListener('hashchange', route);
  route();

  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost')) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})(window.HA);
