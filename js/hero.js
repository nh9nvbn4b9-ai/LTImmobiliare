/* =========================================================
   HOME — animazione a fotogrammi guidata dallo scroll
   ---------------------------------------------------------
   I fotogrammi (assets/hero/frames) sono generati dal video con
   tools/build_hero_frames.py, che sostituisce il taglio netto
   "porta → salone" con una transizione continua.
   Qui li disegniamo su <canvas> seguendo lo scroll, con:
   - smorzamento (il movimento non scatta mai, anche con la rotella);
   - dissolvenza tra fotogrammi adiacenti (fluidità oltre i 24 fps);
   - caricamento progressivo (prima pochi fotogrammi, poi tutti).
   ========================================================= */
(function () {
  'use strict';

  var hero = document.querySelector('.hero');
  if (!hero) return;

  var N = parseInt(hero.dataset.frames, 10) || 1;
  var HOLD_END = 0.08;   // ultima parte dello scroll: il logo resta fermo
  var TAU = 0.09;        // costante di tempo dello smorzamento (secondi)
  var FADE = 7;          // fotogrammi di dissolvenza dei testi
  // inquadratura verticale quando il riquadro taglia sopra/sotto (0 = alto, 1 = basso)
  var FOCUS = [[0, .5], [186, .5], [204, .4], [234, .4], [252, .47], [N - 1, .47]];

  var sticky = hero.querySelector('.hero__sticky');
  var stage = hero.querySelector('.hero__stage');
  var canvas = hero.querySelector('.hero__canvas');
  var ctx = canvas.getContext('2d', { alpha: false });
  var amb = hero.querySelector('.hero__ambient');
  var actx = amb.getContext('2d', { alpha: false });
  var bar = hero.querySelector('.hero__bar span');
  var railBtns = Array.prototype.slice.call(hero.querySelectorAll('[data-goto]'));
  var chapters = Array.prototype.map.call(hero.querySelectorAll('.hero__chapter'), function (el) {
    return { el: el, from: +el.dataset.from, to: +el.dataset.to, o: -1 };
  });
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var imgs = new Array(N);
  var ready = new Uint8Array(N);
  var cur = 0, target = 0, drawn = -1, dirty = true, raf = 0, lastT = 0;
  var W = 1, H = 1, ambOn = false, visible = true;
  var heroTop = 0, heroScroll = 1, railActive = -1;

  hero.classList.add('hero--js');

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function src(i) { return 'assets/hero/frames/' + ('000' + i).slice(-4) + '.webp'; }

  /* ---------- caricamento progressivo ---------- */
  var order = [];
  (function () {
    var seen = new Uint8Array(N);
    function push(i) { if (!seen[i]) { seen[i] = 1; order.push(i); } }
    if (reduced) { push(N - 1); return; }
    push(0); push(N - 1);
    [32, 16, 8, 4, 2, 1].forEach(function (step) { for (var i = 0; i < N; i += step) push(i); });
  })();
  var qi = 0, inflight = 0, MAX_INFLIGHT = 6;

  function pump() { while (inflight < MAX_INFLIGHT && qi < order.length) load(order[qi++]); }
  function load(i) {
    inflight++;
    var img = new Image();
    img.decoding = 'async';
    var finished = false;
    function done(ok) {
      if (finished) return;
      finished = true;
      inflight--;
      if (ok) {
        imgs[i] = img; ready[i] = 1;
        if (drawn < 0 || Math.abs(i - cur) < 2.5) { dirty = true; kick(); }
      }
      pump();
    }
    img.src = src(i);
    if (img.decode) img.decode().then(function () { done(true); }, function () { done(false); });
    else { img.onload = function () { done(true); }; img.onerror = function () { done(false); }; }
  }

  function nearest(i) {
    if (ready[i]) return imgs[i];
    for (var d = 1; d < N; d++) {
      if (i - d >= 0 && ready[i - d]) return imgs[i - d];
      if (i + d < N && ready[i + d]) return imgs[i + d];
    }
    return null;
  }

  function focusAt(f) {
    for (var k = 1; k < FOCUS.length; k++) {
      if (f <= FOCUS[k][0]) {
        var a = FOCUS[k - 1], b = FOCUS[k];
        var t = (f - a[0]) / Math.max(1, b[0] - a[0]);
        return a[1] + (b[1] - a[1]) * t;
      }
    }
    return FOCUS[FOCUS.length - 1][1];
  }

  /* ---------- disegno ---------- */
  function cover(c, img, w, h, fy) {
    var iw = img.naturalWidth, ih = img.naturalHeight;
    var s = Math.max(w / iw, h / ih);
    var dw = iw * s, dh = ih * s;
    var dx = (w - dw) / 2;
    var dy = clamp(h / 2 - fy * dh, h - dh, 0);
    c.drawImage(img, dx, dy, dw, dh);
  }

  function render(f) {
    var i0 = Math.floor(f), t = f - i0;
    var a = nearest(i0);
    if (!a) return false;
    var b = t > 0.02 ? nearest(Math.min(i0 + 1, N - 1)) : null;
    var fy = focusAt(f);
    ctx.globalAlpha = 1;
    cover(ctx, a, W, H, fy);
    if (b && b !== a) {
      ctx.globalAlpha = t;
      cover(ctx, b, W, H, fy);
      ctx.globalAlpha = 1;
    }
    if (ambOn) cover(actx, b && t > .5 ? b : a, amb.width, amb.height, .5);
    return true;
  }

  function overlay(f) {
    for (var k = 0; k < chapters.length; k++) {
      var c = chapters[k], o;
      if (f < c.from) o = 1 - (c.from - f) / FADE;
      else if (f > c.to) o = 1 - (f - c.to) / FADE;
      else o = 1;
      o = clamp(o, 0, 1);
      o = o * o * (3 - 2 * o);
      if (Math.abs(o - c.o) < 0.002) continue;
      c.o = o;
      var y = (1 - o) * (f < c.from ? 28 : -28);
      c.el.style.opacity = o.toFixed(3);
      c.el.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
      c.el.classList.toggle('is-active', o > 0.02);
    }
    var act = 0;
    for (var j = 0; j < chapters.length; j++) if (f >= chapters[j].from - FADE) act = j;
    if (act !== railActive) {
      railActive = act;
      railBtns.forEach(function (btn, n) {
        btn.classList.toggle('is-active', n === act);
        if (n === act) btn.setAttribute('aria-current', 'step'); else btn.removeAttribute('aria-current');
      });
    }
    if (bar) bar.style.transform = 'scaleX(' + (f / (N - 1)).toFixed(4) + ')';
  }

  /* ---------- ciclo di animazione ---------- */
  function kick() { if (!raf) raf = requestAnimationFrame(tick); }
  function tick(now) {
    raf = 0;
    var dt = lastT ? Math.min((now - lastT) / 1000, 0.1) : 1 / 60;
    lastT = now;
    var diff = target - cur;
    if (Math.abs(diff) < 0.003) cur = target;
    else cur += diff * (1 - Math.exp(-dt / TAU));

    if (visible && (dirty || cur !== drawn)) {
      if (render(cur)) { drawn = cur; dirty = false; }
      overlay(cur);
    }
    if (cur !== target) raf = requestAnimationFrame(tick);
    else lastT = 0;
  }

  /* ---------- scroll e dimensioni ---------- */
  function measure() {
    var r = hero.getBoundingClientRect();
    heroTop = r.top + window.pageYOffset;
    heroScroll = Math.max(1, hero.offsetHeight - sticky.offsetHeight);
  }
  function onScroll() {
    if (reduced) return;
    var p = clamp((window.pageYOffset - heroTop) / heroScroll, 0, 1);
    target = clamp(p / (1 - HOLD_END), 0, 1) * (N - 1);
    hero.classList.toggle('is-past-start', p > 0.012);
    hero.classList.toggle('is-at-end', p > 0.96);
    kick();
  }
  function resize() {
    var r = stage.getBoundingClientRect();
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = Math.max(1, Math.round(r.width * dpr)), h = Math.max(1, Math.round(r.height * dpr));
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    W = w; H = h;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ambOn = window.getComputedStyle(amb).display !== 'none';
    if (ambOn) {
      var aw = 72, ah = Math.max(1, Math.round(aw * window.innerHeight / Math.max(1, window.innerWidth)));
      if (amb.width !== aw || amb.height !== ah) { amb.width = aw; amb.height = ah; }
    }
    measure();
    onScroll();
    dirty = true;
    kick();
  }

  /* ---------- navigazione tra i capitoli ---------- */
  railBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var g = +btn.dataset.goto;
      var p = g >= N - 1 ? 1 : (g / (N - 1)) * (1 - HOLD_END);
      window.scrollTo({ top: heroTop + p * heroScroll + 1, behavior: 'smooth' });
    });
  });

  /* ---------- avvio ---------- */
  if (reduced) {
    hero.classList.add('is-static');
    cur = target = N - 1;
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', resize);
  window.addEventListener('pageshow', function () { measure(); onScroll(); cur = target; dirty = true; kick(); });
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      visible = entries[0].isIntersecting;
      if (visible) { dirty = true; kick(); }
    }).observe(hero);
  }

  resize();
  cur = target;          // se la pagina si apre già scrollata, niente animazione iniziale
  overlay(cur);
  pump();
})();
