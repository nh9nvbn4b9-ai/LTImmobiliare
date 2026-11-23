/* =========================================================
   LT Immobiliare — interazioni del sito
   ========================================================= */
(function () {
  'use strict';

  var WA = '393393465927';
  var EMAIL = 'ltimmobiliare1@gmail.com';
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }

  var year = $('#year');
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Header, pulsanti flottanti ---------- */
  var header = $('#site-header');
  var hero = $('.hero');
  var fab = $('#fab');
  var contactsInView = false;
  function onScroll() {
    var y = window.pageYOffset;
    var heroEnd = hero ? hero.offsetTop + hero.offsetHeight - window.innerHeight : 0;
    header.classList.toggle('is-scrolled', hero ? y > heroEnd + window.innerHeight - 90 : y > 20);
    // i pulsanti flottanti compaiono dopo l'animazione e si nascondono nella sezione Contatti
    if (fab) fab.classList.toggle('is-visible', y > heroEnd + window.innerHeight * 0.5 && !contactsInView);
  }
  // ...e anche sopra al footer, per non coprire i link
  var hideFabOn = $$('.contact-stack, .footer');
  if (fab && hideFabOn.length && 'IntersectionObserver' in window) {
    var hiding = [];
    var fabObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var k = hiding.indexOf(en.target);
        if (en.isIntersecting && k < 0) hiding.push(en.target);
        if (!en.isIntersecting && k > -1) hiding.splice(k, 1);
      });
      contactsInView = hiding.length > 0;
      onScroll();
    });
    hideFabOn.forEach(function (el) { fabObs.observe(el); });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  onScroll();

  /* ---------- Menu mobile ---------- */
  var burger = $('.burger');
  var menu = $('#mobile-menu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    document.body.classList.toggle('menu-open', open);
  }
  if (burger && menu) {
    burger.addEventListener('click', function () { setMenu(burger.getAttribute('aria-expanded') !== 'true'); });
    $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
    window.matchMedia('(min-width: 1180px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });
  }

  /* ---------- Sezione attiva nel menu ---------- */
  var navLinks = $$('.nav a');
  if ('IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var id = en.target.id;
        navLinks.forEach(function (a) { a.classList.toggle('is-active', a.getAttribute('href') === '#' + id); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    $$('main > section[id]').forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Comparsa allo scroll ---------- */
  var revealEls = $$('.reveal, .contact-stack');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('is-visible'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---------- Contatore "30 anni" ---------- */
  var num = $('.about__num');
  if (num && 'IntersectionObserver' in window && !reduced) {
    var to = +num.dataset.count;
    num.textContent = '0';
    new IntersectionObserver(function (entries, obs) {
      if (!entries[0].isIntersecting) return;
      obs.disconnect();
      var t0 = performance.now(), dur = 1600;
      (function step(now) {
        var p = Math.min(1, (now - t0) / dur);
        num.textContent = Math.round(to * (1 - Math.pow(1 - p, 3)));
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }, { threshold: 0.6 }).observe(num);
  }

  /* ---------- Parallasse della banda fotografica ---------- */
  var band = $('.band');
  var bandMedia = $('.band__media');
  if (band && bandMedia && !reduced) {
    var bandTick = false;
    var updateBand = function () {
      bandTick = false;
      var r = band.getBoundingClientRect();
      if (r.bottom < 0 || r.top > window.innerHeight) return;
      var p = (r.top + r.height / 2 - window.innerHeight / 2) / (window.innerHeight + r.height);
      bandMedia.style.transform = 'translate3d(0,' + (p * 18).toFixed(2) + '%,0)';
    };
    window.addEventListener('scroll', function () { if (!bandTick) { bandTick = true; requestAnimationFrame(updateBand); } }, { passive: true });
    updateBand();
  }

  /* ---------- Biglietto da visita 3D ---------- */
  var card = $('#bizcard');
  if (card && window.matchMedia('(hover: hover) and (pointer: fine)').matches && !reduced) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      card.style.setProperty('--ry', (x * 18).toFixed(2) + 'deg');
      card.style.setProperty('--rx', (-y * 14).toFixed(2) + 'deg');
    });
    card.addEventListener('pointerleave', function () { card.style.removeProperty('--ry'); card.style.removeProperty('--rx'); });
  }

  /* Illustrazione "progetto" per gli immobili senza foto */
  var ART_COLORS = {
    appartamento: ['#111d4a', '#2449b3'],
    villa: ['#0b1433', '#1f3f9e'],
    casa: ['#16245c', '#3a5fc8'],
    rustico: ['#2b1d16', '#8a5434'],
    commerciale: ['#3a0d10', '#b81c14'],
    terreno: ['#0f2d1e', '#2f7a4a']
  };
  function windows() {
    var s = '';
    for (var r = 0; r < 5; r++) for (var c = 0; c < 4; c++) s += '<rect x="' + (153 + c * 26) + '" y="' + (76 + r * 26) + '" width="14" height="16" fill="rgba(255,255,255,.08)"/>';
    return s;
  }
  var ART = {
    appartamento: function () { return '<rect x="140" y="62" width="120" height="160"/><path d="M130 62h140"/>' + windows() + '<path d="M188 222v-18h24v18"/>'; },
    villa: function () { return '<path d="M96 222v-90h120v90"/><path d="M86 132h140"/><path d="M216 222V96h96v126"/><path d="M206 96h116"/><rect x="112" y="150" width="40" height="54" fill="rgba(255,255,255,.08)"/><rect x="162" y="150" width="40" height="54" fill="rgba(255,255,255,.08)"/><rect x="232" y="112" width="64" height="34" fill="rgba(255,255,255,.08)"/><rect x="232" y="160" width="64" height="62" fill="rgba(255,255,255,.08)"/><circle cx="62" cy="182" r="18"/><path d="M62 200v22"/>'; },
    casa: function () { return '<path d="M130 222v-84h140v84"/><path d="M116 144l84-62 84 62"/><path d="M240 112V86h16v38"/><rect x="148" y="160" width="30" height="30" fill="rgba(255,255,255,.08)"/><rect x="222" y="160" width="30" height="30" fill="rgba(255,255,255,.08)"/><path d="M186 222v-40h28v40"/><circle cx="322" cy="186" r="16"/><path d="M322 202v20"/>'; },
    rustico: function () { return '<path d="M100 222v-72h200v72"/><path d="M86 156l64-40h100l64 40"/><path d="M180 222v-30a20 20 0 0 1 40 0v30"/><rect x="122" y="168" width="24" height="24" fill="rgba(255,255,255,.08)"/><rect x="254" y="168" width="24" height="24" fill="rgba(255,255,255,.08)"/><path d="M108 208h14M130 200h12M262 208h16M286 198h8M112 182h6M156 212h10M236 204h10" stroke-opacity=".55"/><path d="M342 222v-12"/><path d="M342 210c-10-14-8-46 0-64 8 18 10 50 0 64z"/>'; },
    commerciale: function () { return '<path d="M110 222V92h180v130"/><rect x="130" y="104" width="140" height="22"/><path d="M104 140h192l-4 16H108z"/><path d="M108 156c6 8 18 8 24 0 6 8 18 8 24 0 6 8 18 8 24 0 6 8 18 8 24 0 6 8 18 8 24 0 6 8 18 8 24 0 6 8 18 8 24 0 6 8 18 8 24 0"/><rect x="126" y="178" width="92" height="44" fill="rgba(255,255,255,.08)"/><path d="M236 222v-44h38v44"/>'; },
    terreno: function () { return '<path d="M10 196c60-40 120-40 180-10s130 30 200-12"/><path d="M10 226c80-30 170-30 250-6s110 8 130 2"/><path d="M118 214l44-26 110 6-30 26z" stroke-dasharray="6 6"/><path d="M200 146c0 16-18 32-18 32s-18-16-18-32a18 18 0 0 1 36 0z"/><circle cx="182" cy="146" r="6"/><circle cx="334" cy="148" r="12"/><path d="M334 160v16"/><circle cx="62" cy="160" r="10"/><path d="M62 170v14"/>'; }
  };
  function artSVG(p, i) {
    var t = ART[p.tipologia] ? p.tipologia : 'casa';
    var col = ART_COLORS[t];
    var id = 'art' + String(p.rif || i).replace(/[^a-z0-9]/gi, '');
    var label = (TIPI[t] || '').toUpperCase() + (p.mq ? ' · ' + p.mq.toLocaleString('it-IT') + ' M²' : '');
    return '' +
      '<svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
        '<defs>' +
          '<linearGradient id="' + id + 'g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + col[0] + '"/><stop offset="1" stop-color="' + col[1] + '"/></linearGradient>' +
          '<pattern id="' + id + 'p" width="20" height="20" patternUnits="userSpaceOnUse"><path d="M20 0H0v20" fill="none" stroke="rgba(255,255,255,.07)"/></pattern>' +
          '<radialGradient id="' + id + 'r" cx=".75" cy=".2" r=".8"><stop offset="0" stop-color="rgba(255,255,255,.18)"/><stop offset="1" stop-color="rgba(255,255,255,0)"/></radialGradient>' +
        '</defs>' +
        '<rect width="400" height="250" fill="url(#' + id + 'g)"/>' +
        '<rect width="400" height="250" fill="url(#' + id + 'p)"/>' +
        '<rect width="400" height="250" fill="url(#' + id + 'r)"/>' +
        (t !== 'terreno' ? '<path d="M24 222h352" stroke="rgba(255,255,255,.45)" stroke-width="1.5"/>' : '') +
        '<g fill="none" stroke="rgba(255,255,255,.92)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + ART[t]() + '</g>' +
        '<text x="24" y="242" fill="rgba(255,255,255,.55)" font-family="Manrope, sans-serif" font-size="10" font-weight="700" letter-spacing="2">' + esc(label) + '</text>' +
      '</svg>';
  }

  /* =========================================================
     Ricerca immobili
     ========================================================= */
  var catalogo = window.LT_CATALOGO || { immobili: [] };
  var immobili = (catalogo.immobili || []).map(function (p, i) { p._i = i; return p; });
  var form = $('#finder');
  var listEl = $('#listings');
  var countEl = $('#results-count');
  var emptyEl = $('#empty');
  var sortEl = $('#sort');
  var TIPI = { appartamento: 'Appartamento', villa: 'Villa', casa: 'Casa indipendente', rustico: 'Rustico', commerciale: 'Locale commerciale', terreno: 'Terreno' };
  var EXTRA = { giardino: 'Giardino', box: 'Box / posto auto', terrazzo: 'Terrazzo', ascensore: 'Ascensore', arredato: 'Arredato', piscina: 'Piscina' };
  var PREZZI = { vendita: [80000, 120000, 150000, 200000, 250000, 300000, 400000], affitto: [400, 500, 600, 800, 1000, 1500] };
  var ENERGIA = { A4: '#0b8a3e', A3: '#15994a', A2: '#23a556', A1: '#3cb25e', A: '#3cb25e', B: '#7cc043', C: '#c3d532', D: '#f2d22b', E: '#f5a623', F: '#ec6a24', G: '#d7261e' };
  var euro = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });

  if (form && listEl) {
    if (catalogo.demo) $('#demo-note').hidden = false;
    // catalogo vuoto: messaggio dedicato al posto dei risultati
    var noCatalog = !immobili.length;
    $('#catalog-empty').hidden = !noCatalog;
    $('.results-bar').hidden = noCatalog;

    // comuni presenti nel catalogo
    var comuneSel = form.elements.comune;
    immobili.map(function (p) { return p.comune; })
      .filter(function (c, i, a) { return c && a.indexOf(c) === i; })
      .sort(function (a, b) { return a.localeCompare(b, 'it'); })
      .forEach(function (c) { comuneSel.add(new Option(c, c)); });

    var prezzoSel = form.elements.prezzo;
    var fillPrezzi = function () {
      var c = form.elements.contratto.value;
      var prev = prezzoSel.value;
      prezzoSel.innerHTML = '';
      if (c === 'tutti') {
        prezzoSel.add(new Option('Scegli contratto', ''));
        prezzoSel.disabled = true;
        return;
      }
      prezzoSel.disabled = false;
      prezzoSel.add(new Option('Qualsiasi', ''));
      PREZZI[c].forEach(function (v) {
        prezzoSel.add(new Option('fino a ' + euro.format(v) + (c === 'affitto' ? '/mese' : ''), String(v)));
      });
      if (PREZZI[c].indexOf(+prev) > -1) prezzoSel.value = prev;
    };

    var state = function () {
      var el = form.elements;
      return {
        contratto: el.contratto.value,
        tipologia: el.tipologia.value,
        comune: el.comune.value,
        prezzo: prezzoSel.disabled ? 0 : +prezzoSel.value || 0,
        q: norm(el.q.value).trim(),
        locali: +el.locali.value || 0,
        mq: +el.mq.value || 0,
        extra: $$('input[name="extra"]:checked', form).map(function (i) { return i.value; })
      };
    };

    var match = function (p, s) {
      if (s.contratto !== 'tutti' && p.contratto !== s.contratto) return false;
      if (s.tipologia && p.tipologia !== s.tipologia) return false;
      if (s.comune && p.comune !== s.comune) return false;
      if (s.prezzo && p.prezzo > s.prezzo) return false;
      if (s.locali && (p.locali || 0) < s.locali) return false;
      if (s.mq && (p.mq || 0) < s.mq) return false;
      var ex = p.extra || [];
      for (var k = 0; k < s.extra.length; k++) if (ex.indexOf(s.extra[k]) < 0) return false;
      if (s.q) {
        var hay = norm([p.rif, p.titolo, p.comune, TIPI[p.tipologia], p.contratto, p.descrizione, ex.map(function (e) { return EXTRA[e]; }).join(' ')].join(' '));
        var words = s.q.split(/\s+/);
        for (var w = 0; w < words.length; w++) if (hay.indexOf(words[w]) < 0) return false;
      }
      return true;
    };

    var render = function () {
      var s = state();
      var res = immobili.filter(function (p) { return match(p, s); });
      var sort = sortEl.value;
      res.sort(function (a, b) {
        if (sort === 'prezzo-asc') return a.prezzo - b.prezzo;
        if (sort === 'prezzo-desc') return b.prezzo - a.prezzo;
        if (sort === 'mq-desc') return (b.mq || 0) - (a.mq || 0);
        return a._i - b._i;
      });
      listEl.innerHTML = res.map(cardHTML).join('');
      listEl.hidden = !res.length;
      emptyEl.hidden = !!res.length || noCatalog;
      countEl.innerHTML = res.length
        ? '<strong>' + res.length + '</strong> ' + (res.length === 1 ? 'immobile trovato' : 'immobili trovati')
        : 'Nessun immobile trovato';
    };

    var qTimer;
    form.addEventListener('change', function (e) {
      if (e.target.name === 'contratto') fillPrezzi();
      render();
    });
    form.elements.q.addEventListener('input', function () { clearTimeout(qTimer); qTimer = setTimeout(render, 140); });
    sortEl.addEventListener('change', render);

    var resetAll = function () {
      form.reset();
      sortEl.value = 'recenti';
      fillPrezzi();
      render();
    };
    $('#reset').addEventListener('click', resetAll);
    $('#empty-reset').addEventListener('click', resetAll);

    var more = $('.finder__more');
    var adv = $('#finder-adv');
    more.addEventListener('click', function () {
      var open = more.getAttribute('aria-expanded') !== 'true';
      more.setAttribute('aria-expanded', String(open));
      adv.hidden = !open;
      more.querySelector('span').textContent = open ? 'Meno filtri' : 'Altri filtri';
    });

    fillPrezzi();
    render();
  }

  function cardHTML(p, i) {
    var affitto = p.contratto === 'affitto';
    var price = euro.format(p.prezzo) + (affitto ? ' <small>/ mese</small>' : '');
    var media = p.foto
      ? '<img src="' + esc(p.foto) + '" alt="' + esc(p.titolo) + '" loading="lazy" decoding="async">'
      : artSVG(p, i);
    var specs = [];
    if (p.mq) specs.push('<li><svg class="ico" aria-hidden="true"><use href="#i-area"/></svg>' + p.mq.toLocaleString('it-IT') + ' m²</li>');
    if (p.locali) specs.push('<li><svg class="ico" aria-hidden="true"><use href="#i-rooms"/></svg>' + p.locali + (p.locali === 1 ? ' locale' : ' locali') + '</li>');
    if (p.bagni) specs.push('<li><svg class="ico" aria-hidden="true"><use href="#i-bath"/></svg>' + p.bagni + (p.bagni === 1 ? ' bagno' : ' bagni') + '</li>');
    var tags = (p.extra || []).map(function (e) { return '<li>' + esc(EXTRA[e] || e) + '</li>'; }).join('');
    var energy = p.classe
      ? '<span class="energy">Classe <b style="--c:' + (ENERGIA[p.classe] || '#888') + ';' + (/^[CD]$/.test(p.classe) ? 'color:#1b1b1b' : '') + '">' + esc(p.classe) + '</b></span>'
      : '';
    var msg = 'Buongiorno, vorrei informazioni sull\'immobile Rif. ' + p.rif + ' – ' + p.titolo + ' (' + p.comune + ').';
    return '' +
      '<article class="card" style="--i:' + i + '">' +
        '<div class="card__media">' + media +
          '<span class="badge badge--' + esc(p.contratto) + '">' + (affitto ? 'Affitto' : 'Vendita') + '</span>' +
          '<span class="card__ref">Rif. ' + esc(p.rif) + '</span>' + energy +
        '</div>' +
        '<div class="card__body">' +
          '<p class="card__price">' + price + '</p>' +
          '<h3 class="card__title">' + esc(p.titolo) + '</h3>' +
          '<p class="card__loc"><svg class="ico" aria-hidden="true"><use href="#i-pin"/></svg>' + esc(p.comune) + ' · ' + esc(TIPI[p.tipologia] || '') + '</p>' +
          (p.descrizione ? '<p class="card__desc">' + esc(p.descrizione) + '</p>' : '') +
          (specs.length ? '<ul class="card__specs">' + specs.join('') + '</ul>' : '') +
          (tags ? '<ul class="card__tags">' + tags + '</ul>' : '') +
          '<div class="card__actions">' +
            '<a class="btn btn--navy btn--sm" href="https://wa.me/' + WA + '?text=' + encodeURIComponent(msg) + '" target="_blank" rel="noopener"><svg class="ico" aria-hidden="true"><use href="#i-whatsapp"/></svg>Richiedi info</a>' +
            '<a class="icon-btn" href="tel:+' + WA + '" aria-label="Chiama per l\'immobile ' + esc(p.rif) + '"><svg class="ico" aria-hidden="true"><use href="#i-phone"/></svg></a>' +
          '</div>' +
        '</div>' +
      '</article>';
  }

  /* =========================================================
     Orari: stato "aperto / chiuso" in tempo reale (ora italiana)
     ========================================================= */
  var SLOTS = { 0: [], 1: [[570, 750], [960, 1170]], 2: [[570, 750], [960, 1170]], 3: [[570, 750], [960, 1170]], 4: [[570, 750], [960, 1170]], 5: [[570, 750], [960, 1170]], 6: [[570, 750]] };
  var GIORNI = ['domenica', 'lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato'];
  function hhmm(m) { return ('0' + Math.floor(m / 60)).slice(-2) + ':' + ('0' + (m % 60)).slice(-2); }
  function romeNow() {
    try {
      var parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Europe/Rome', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
      var get = function (t) { for (var i = 0; i < parts.length; i++) if (parts[i].type === t) return parts[i].value; return ''; };
      return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday')), min: (+get('hour') % 24) * 60 + (+get('minute')) };
    } catch (e) {
      var d = new Date();
      return { day: d.getDay(), min: d.getHours() * 60 + d.getMinutes() };
    }
  }
  function updateHours() {
    var status = $('#status'), text = $('#status-text');
    if (!status) return;
    var now = romeNow();
    $$('.hours__row').forEach(function (r) { r.classList.toggle('is-today', +r.dataset.day === now.day); });
    var today = SLOTS[now.day] || [];
    for (var i = 0; i < today.length; i++) {
      if (now.min >= today[i][0] && now.min < today[i][1]) {
        status.dataset.state = 'open';
        text.textContent = 'Aperto ora · chiude alle ' + hhmm(today[i][1]);
        return;
      }
    }
    status.dataset.state = 'closed';
    for (var d = 0; d < 8; d++) {
      var day = (now.day + d) % 7;
      var slots = SLOTS[day];
      for (var k = 0; k < slots.length; k++) {
        if (d === 0 && slots[k][0] <= now.min) continue;
        var quando = d === 0 ? 'oggi' : d === 1 ? 'domani' : GIORNI[day];
        text.textContent = 'Chiuso ora · riapre ' + quando + ' alle ' + hhmm(slots[k][0]);
        return;
      }
    }
  }
  updateHours();
  setInterval(updateHours, 60000);

  /* =========================================================
     Modulo contatti rapido → WhatsApp o email
     ========================================================= */
  var qf = $('#quick-form');
  if (qf) {
    var via = 'whatsapp';
    $$('button[data-via]', qf).forEach(function (b) { b.addEventListener('click', function () { via = b.dataset.via; }); });
    qf.addEventListener('submit', function (e) {
      e.preventDefault();
      if (e.submitter && e.submitter.dataset.via) via = e.submitter.dataset.via;
      var nome = qf.elements.nome.value.trim();
      var msg = qf.elements.messaggio.value.trim();
      var err = $('#quick-form-error');
      if (!nome || !msg) {
        err.hidden = false;
        (nome ? qf.elements.messaggio : qf.elements.nome).focus();
        return;
      }
      err.hidden = true;
      var testo = 'Buongiorno, sono ' + nome + '.\n' + msg;
      if (via === 'email') {
        window.location.href = 'mailto:' + EMAIL + '?subject=' + encodeURIComponent('Richiesta dal sito – ' + nome) + '&body=' + encodeURIComponent(testo);
      } else {
        window.open('https://wa.me/' + WA + '?text=' + encodeURIComponent(testo), '_blank', 'noopener');
      }
    });
  }
})();
