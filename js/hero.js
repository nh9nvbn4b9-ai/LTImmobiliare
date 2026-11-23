/* =========================================================
   HOME — animazione automatica
   ---------------------------------------------------------
   Appena si apre il sito l'animazione parte da sola.
   - Percorso principale: video MP4 a 60 fps (interpolazione di movimento),
     riprodotto dal browser: è il modo più fluido possibile.
   - Riserva: se il browser blocca la riproduzione automatica dei video
     (es. iPhone in "Risparmio energetico"), la stessa animazione viene
     disegnata su <canvas> dai fotogrammi WebP, sempre in automatico.
   - "Riduci movimento" attivo: si vede il logo finale e un pulsante
     per guardare l'animazione.
   I testi, la barra di avanzamento e i capitoli seguono il tempo.
   ========================================================= */
(function () {
  'use strict';

  var hero = document.querySelector('.hero');
  if (!hero) return;

  var N = parseInt(hero.dataset.frames, 10) || 1;   // fotogrammi della sequenza (riferimento per i capitoli)
  var FRAME_RATE = 24 * 0.8;                        // stessa velocità del video (rallentato a 0,8)
  var FADE = 6;                                     // fotogrammi di dissolvenza dei testi
  // inquadratura verticale quando il riquadro taglia sopra/sotto (0 = alto, 1 = basso)
  var FOCUS = [[0, .5], [186, .5], [204, .4], [234, .4], [252, .47], [N - 1, .47]];

  var stage = hero.querySelector('.hero__stage');
  var video = hero.querySelector('.hero__video');
  var canvas = hero.querySelector('.hero__canvas');
  var ctx = canvas.getContext('2d', { alpha: false });
  var amb = hero.querySelector('.hero__ambient');
  var actx = amb.getContext('2d', { alpha: false });
  // luce ambientale: l'immagine viene ridotta a pochi pixel e poi ingrandita (sfocatura "gratuita",
  // senza filtri CSS che rallenterebbero ogni fotogramma)
  var tiny = document.createElement('canvas');
  var tctx = tiny.getContext('2d', { alpha: false });
  var bar = hero.querySelector('.hero__bar span');
  var btnToggle = hero.querySelector('[data-action="toggle"]');
  var btnSkip = hero.querySelector('[data-action="skip"]');
  var railBtns = Array.prototype.slice.call(hero.querySelectorAll('[data-goto]'));
  var chapters = Array.prototype.map.call(hero.querySelectorAll('.hero__chapter'), function (el) {
    return { el: el, from: +el.dataset.from, to: +el.dataset.to, o: -1 };
  });
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var mode = reduced ? 'static' : 'video';  // 'video' | 'frames' | 'static'
  var D = N / FRAME_RATE;                    // durata in secondi (aggiornata dal video)
  var t = 0;                                 // tempo corrente
  var playing = false, ended = false, userPaused = false, autoPaused = false, inView = true;
  var raf = 0, lastNow = 0, ambTick = 0, lastPos = '', railActive = -1;
  var W = 1, H = 1, ambOn = false;

  hero.classList.add('hero--js');

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function frameAt() { return clamp(t / D, 0, 1) * (N - 1); }
  function src(i) { return 'assets/hero/frames/' + ('000' + i).slice(-4) + '.webp'; }

  /* ---------- fotogrammi (solo per la riserva) ---------- */
  var imgs = new Array(N), ready = new Uint8Array(N), contig = -1;
  var qi = 0, inflight = 0, framesStarted = false, finalImg = null;
  function loadFrames() {
    if (framesStarted) return;
    framesStarted = true;
    pump();
  }
  function pump() { while (inflight < 6 && qi < N) loadOne(qi++); }
  function loadOne(i) {
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
        while (contig + 1 < N && ready[contig + 1]) contig++;
        if (mode === 'frames') kick();
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

  /* ---------- disegno ---------- */
  function focusAt(f) {
    for (var k = 1; k < FOCUS.length; k++) {
      if (f <= FOCUS[k][0]) {
        var a = FOCUS[k - 1], b = FOCUS[k];
        return a[1] + (b[1] - a[1]) * (f - a[0]) / Math.max(1, b[0] - a[0]);
      }
    }
    return FOCUS[FOCUS.length - 1][1];
  }
  function cover(c, img, w, h, fy) {
    var iw = img.naturalWidth || img.videoWidth, ih = img.naturalHeight || img.videoHeight;
    if (!iw || !ih) return;
    var s = Math.max(w / iw, h / ih);
    var dw = iw * s, dh = ih * s;
    c.drawImage(img, (w - dw) / 2, clamp(h / 2 - fy * dh, h - dh, 0), dw, dh);
  }
  function drawFrames(f) {
    var i0 = Math.floor(f), k = f - i0;
    var a = mode === 'static' && finalImg ? finalImg : nearest(i0);
    if (!a) return null;
    var b = mode === 'frames' && k > 0.02 ? nearest(Math.min(i0 + 1, N - 1)) : null;
    var fy = focusAt(f);
    ctx.globalAlpha = 1;
    cover(ctx, a, W, H, fy);
    if (b && b !== a) { ctx.globalAlpha = k; cover(ctx, b, W, H, fy); ctx.globalAlpha = 1; }
    return k > .5 && b ? b : a;
  }
  // nel riquadro desktop il video è ritagliato sopra/sotto: segue l'inquadratura
  var SW = 1, SH = 1;   // dimensioni del riquadro in px CSS
  function placeVideo(f) {
    var vw = video.videoWidth || 720, vh = video.videoHeight || 1280;
    var s = Math.max(SW / vw, SH / vh), dh = vh * s;
    var pos = '50% 50%';
    if (dh - SH > 1) {
      var dy = clamp(SH / 2 - focusAt(f) * dh, SH - dh, 0);
      pos = '50% ' + (dy / (SH - dh) * 100).toFixed(1) + '%';
    }
    if (pos !== lastPos) { video.style.objectPosition = pos; lastPos = pos; }
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
      var y = (1 - o) * (f < c.from ? 26 : -26);
      c.el.style.opacity = o.toFixed(3);
      c.el.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
      c.el.classList.toggle('is-active', o > 0.02);
    }
    var act = 0;
    for (var j = 0; j < railBtns.length; j++) if (f >= +railBtns[j].dataset.goto - 2) act = j;
    if (act !== railActive) {
      railActive = act;
      railBtns.forEach(function (btn, n) {
        btn.classList.toggle('is-active', n === act);
        if (n === act) btn.setAttribute('aria-current', 'step'); else btn.removeAttribute('aria-current');
      });
    }
    if (bar) bar.style.transform = 'scaleX(' + clamp(f / (N - 1), 0, 1).toFixed(4) + ')';
  }

  function render() {
    var f = frameAt();
    var ambSrc = null;
    if (mode === 'video') { placeVideo(f); ambSrc = video.readyState >= 2 ? video : null; }
    else ambSrc = drawFrames(f);
    // la luce ambientale cambia lentamente: aggiornarla ~8 volte al secondo basta e alleggerisce molto
    if (ambOn && ambSrc && (ambTick++ % 4 === 0 || !playing)) {
      cover(tctx, ambSrc, tiny.width, tiny.height, .5);
      actx.drawImage(tiny, 0, 0, amb.width, amb.height);
    }
    overlay(f);
  }

  /* ---------- ciclo ---------- */
  function kick() { if (!raf) raf = requestAnimationFrame(loop); }
  function loop(now) {
    raf = 0;
    if (mode === 'video') {
      t = video.currentTime || 0;
    } else if (mode === 'frames' && playing) {
      var dt = lastNow ? Math.min((now - lastNow) / 1000, 0.1) : 0;
      var next = Math.min(D, t + dt);
      // avanza solo se i fotogrammi necessari sono già arrivati (niente scatti)
      if (contig >= Math.min(N - 1, Math.ceil(next / D * (N - 1)) + 1)) t = next;
      if (t >= D) finish();
    }
    lastNow = now;
    if (inView) render();
    if (playing && inView) raf = requestAnimationFrame(loop);
    else lastNow = 0;
  }

  /* ---------- stato e comandi ---------- */
  function setControls() {
    var icon, label, aria;
    if (mode === 'static') { icon = 'i-play'; label = 'Guarda l\'animazione'; aria = 'Guarda l\'animazione'; }
    else if (ended) { icon = 'i-replay'; label = 'Rivedi'; aria = 'Riguarda l\'animazione dall\'inizio'; }
    else if (playing) { icon = 'i-pause'; label = 'Pausa'; aria = 'Metti in pausa l\'animazione'; }
    else { icon = 'i-play'; label = 'Riproduci'; aria = 'Riprendi l\'animazione'; }
    btnToggle.querySelector('use').setAttribute('href', '#' + icon);
    btnToggle.querySelector('span').textContent = label;
    btnToggle.setAttribute('aria-label', aria);
    btnSkip.hidden = ended;
    hero.classList.toggle('is-ended', ended);
    hero.classList.toggle('is-playing', playing);
  }
  function play() {
    ended = false;
    if (mode === 'video') {
      var p = video.play();
      // riproduzione automatica vietata o formato non supportato → riserva a fotogrammi
      if (p && p.catch) p.catch(function (err) {
        var name = err && err.name;
        if (video.paused && (name === 'NotAllowedError' || name === 'NotSupportedError')) useFrames();
      });
    } else if (mode === 'frames') {
      playing = true; lastNow = 0; kick();
    }
    setControls();
  }
  function pause() {
    if (mode === 'video') video.pause();
    playing = false;
    setControls();
  }
  function finish() {
    t = D; playing = false; ended = true;
    if (mode === 'video' && !video.paused) video.pause();
    setControls();
    render();
  }
  function seek(frame) {
    var nt = clamp(frame / (N - 1), 0, 1) * D;
    if (frame >= N - 1) { if (mode === 'video') { try { video.currentTime = D; } catch (e) {} } finish(); return; }
    t = nt;
    if (mode === 'video') { try { video.currentTime = nt; } catch (e) {} }
    userPaused = false;
    play();
    render();
  }

  /* ---------- modalità video ---------- */
  function startVideo() {
    mode = 'video';
    video.hidden = false;
    canvas.hidden = true;
    video.muted = true;
    video.defaultMuted = true;
    video.setAttribute('muted', '');
    video.playsInline = true;
    if (!video.getAttribute('src')) video.src = video.dataset.src;
    play();
  }
  video.addEventListener('loadedmetadata', function () {
    if (isFinite(video.duration) && video.duration > 0) D = video.duration;
  });
  video.addEventListener('play', function () {
    if (mode !== 'video') return;
    if (!inView || document.hidden) { autoPaused = true; video.pause(); return; }  // pagina aperta più in basso
    playing = true; ended = false; setControls(); kick();
  });
  video.addEventListener('pause', function () { if (mode !== 'video') return; playing = false; setControls(); render(); });
  video.addEventListener('ended', function () { if (mode === 'video') finish(); });
  video.addEventListener('error', function () { if (mode === 'video') useFrames(); });

  /* ---------- riserva a fotogrammi ---------- */
  function useFrames() {
    if (mode === 'frames') return;
    var from = mode === 'video' ? (video.currentTime || 0) : 0;
    mode = 'frames';
    video.pause();
    video.removeAttribute('src');
    try { video.load(); } catch (e) {}
    video.hidden = true;
    canvas.hidden = false;
    D = N / FRAME_RATE;
    t = Math.min(from, D);
    resize();
    loadFrames();
    if (!userPaused) { playing = true; lastNow = 0; }
    setControls();
    kick();
  }

  /* ---------- pulsanti ---------- */
  btnToggle.addEventListener('click', function () {
    if (mode === 'static') { userPaused = false; t = 0; startVideo(); return; }
    if (ended) { t = 0; if (mode === 'video') { try { video.currentTime = 0; } catch (e) {} } userPaused = false; play(); return; }
    if (playing) { userPaused = true; pause(); }
    else { userPaused = false; play(); }
  });
  btnSkip.addEventListener('click', function () { seek(N - 1); });
  railBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      if (mode === 'static') { startVideo(); }
      seek(+btn.dataset.goto);
    });
  });

  /* ---------- dimensioni ---------- */
  function resize() {
    var r = stage.getBoundingClientRect();
    SW = Math.max(1, r.width); SH = Math.max(1, r.height);
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (!canvas.hidden) {
      W = Math.max(1, Math.round(r.width * dpr)); H = Math.max(1, Math.round(r.height * dpr));
      if (canvas.width !== W || canvas.height !== H) { canvas.width = W; canvas.height = H; }
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
    }
    ambOn = window.getComputedStyle(amb).display !== 'none';
    if (ambOn) {
      var ratio = window.innerHeight / Math.max(1, window.innerWidth);
      var aw = 64, ah = Math.max(1, Math.round(aw * ratio));
      if (amb.width !== aw || amb.height !== ah) { amb.width = aw; amb.height = ah; }
      tiny.width = 10; tiny.height = Math.max(1, Math.round(10 * ratio));
      actx.imageSmoothingEnabled = tctx.imageSmoothingEnabled = true;
      actx.imageSmoothingQuality = tctx.imageSmoothingQuality = 'high';
    }
    lastPos = '';
    render();
  }
  window.addEventListener('resize', resize);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage);

  /* ---------- fuori schermo: pausa automatica ---------- */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (entries) {
      inView = entries[0].isIntersecting;
      if (!inView && playing) { autoPaused = true; pause(); }
      else if (inView && autoPaused && !userPaused && !ended) { autoPaused = false; play(); }
      if (inView) kick();
    }, { threshold: 0.15 }).observe(hero);
  }
  // scheda del browser nascosta: pausa, poi riprende da dove era
  document.addEventListener('visibilitychange', function () {
    if (document.hidden && playing) { autoPaused = true; pause(); }
    else if (!document.hidden && autoPaused && inView && !userPaused && !ended) { autoPaused = false; play(); }
  });

  /* ---------- avvio ---------- */
  if (mode === 'static') {
    // movimento ridotto: logo finale fermo, l'animazione parte solo su richiesta
    video.hidden = true;
    canvas.hidden = false;
    t = D; ended = true;
    finalImg = new Image();
    finalImg.onload = function () { resize(); };
    finalImg.src = 'assets/hero/final.webp';
    resize();
    setControls();
  } else {
    resize();
    overlay(0);
    startVideo();
  }
})();
