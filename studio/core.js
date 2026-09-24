/* =====================================================================
   SECR3TLY Studio — noyau
   État du créateur, autosave, routeur (hash), modales / tiroirs,
   liaison de formulaires, graphiques SVG faits main, utilitaires.
   Les vues s'enregistrent via Studio.register(id, def).
   ===================================================================== */
(function (root) {
  'use strict';
  var D = root.Secretly, U = root.SecretlyUI;
  var S = root.Studio = { views: {}, order: [] };
  var esc = S.esc = D.esc;

  /* ---------------------------------------------------------------
     Formatage fr-FR
     --------------------------------------------------------------- */
  var NF = new Intl.NumberFormat('fr-FR');
  S.num = function (n, dec) {
    n = Number(n) || 0;
    if (dec != null) return new Intl.NumberFormat('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec }).format(n);
    return NF.format(Math.round(n));
  };
  S.pct = function (x, dec) { return S.num((Number(x) || 0) * 100, dec == null ? 1 : dec) + ' %'; };
  S.money = function (n, cur) { return D.money(Math.round((Number(n) || 0) * 100) / 100, cur || (S.c && S.c.settings && S.c.settings.currency) || 'EUR'); };
  S.compact = D.compact;
  var MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
  function toDate(d) { if (d instanceof Date) return d; var s = String(d || ''); return new Date(s.length === 10 ? s + 'T12:00' : s); }
  S.date = function (d, withYear) {
    var x = toDate(d); if (isNaN(x)) return '—';
    return x.getDate() + ' ' + MONTHS[x.getMonth()] + (withYear ? ' ' + x.getFullYear() : '');
  };
  S.dateTime = function (d) {
    var x = toDate(d); if (isNaN(x)) return '—';
    return S.date(x) + ' · ' + String(x.getHours()).padStart(2, '0') + ':' + String(x.getMinutes()).padStart(2, '0');
  };
  S.ago = function (ts) {
    var s = Math.max(0, (Date.now() - ts) / 1000);
    if (s < 60) return 'à l’instant';
    if (s < 3600) return 'il y a ' + Math.floor(s / 60) + ' min';
    if (s < 86400) return 'il y a ' + Math.floor(s / 3600) + ' h';
    var d = Math.floor(s / 86400); return d === 1 ? 'hier' : 'il y a ' + d + ' j';
  };
  S.uid = function (p) { return (p || 'id') + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); };
  S.clone = function (o) { return JSON.parse(JSON.stringify(o)); };
  S.slugify = function (s) {
    return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40);
  };
  S.levelName = function (id) { var l = D.LEVELS.filter(function (x) { return x.id === id; })[0]; return l ? l.name : id; };
  S.lvl = function (id) { return '<span class="lvl lvl-' + esc(id) + '">' + esc(S.levelName(id)) + '</span>'; };
  S.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ---------------------------------------------------------------
     Icônes d'interface (trait 1.6, viewBox 24)
     --------------------------------------------------------------- */
  var IC = {
    home: '<path d="M3.5 10.5 12 4l8.5 6.5V20a1 1 0 0 1-1 1H15v-6H9v6H4.5a1 1 0 0 1-1-1z"/>',
    universe: '<circle cx="12" cy="12" r="3.2"/><ellipse cx="12" cy="12" rx="9.5" ry="4.3" transform="rotate(-28 12 12)"/>',
    content: '<rect x="3.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.6"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.6"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.6"/>',
    community: '<circle cx="9" cy="8" r="3.4"/><path d="M2.8 20c.8-3.5 3.3-5.4 6.2-5.4s5.4 1.9 6.2 5.4"/><path d="M15.8 4.8a3.4 3.4 0 0 1 0 6.5M17.6 14.9c1.9.7 3.1 2.4 3.6 5.1"/>',
    commerce: '<path d="M5 8.5h14l-1.1 11.6a1 1 0 0 1-1 .9H7.1a1 1 0 0 1-1-.9z"/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5"/>',
    marketing: '<path d="M3.5 10v4a1 1 0 0 0 1 1h2.8l6.2 4V5L7.3 9H4.5a1 1 0 0 0-1 1z"/><path d="M17 8.8a4.6 4.6 0 0 1 0 6.4M19.4 6.4a8 8 0 0 1 0 11.2"/>',
    analytics: '<path d="M3.5 20.5h17"/><path d="M6.5 16.5v-4M11 16.5V7M15.5 16.5v-6.5M20 16.5V4.5"/>',
    mediakit: '<path d="M6.5 3.5h7.5l4 4v13h-11.5z"/><path d="M14 3.5v4h4"/><path d="M9.5 12.5h5M9.5 16h3.5"/>',
    collabs: '<rect x="3.5" y="4" width="4.6" height="16" rx="1.4"/><rect x="9.8" y="4" width="4.6" height="10" rx="1.4"/><rect x="16" y="4" width="4.6" height="13" rx="1.4"/>',
    copilot: '<path d="M11 3.5l1.7 4.6 4.6 1.7-4.6 1.7L11 16.1l-1.7-4.6-4.6-1.7 4.6-1.7z"/><path d="M18.2 14.5l.8 2.1 2.1.8-2.1.8-.8 2.1-.8-2.1-2.1-.8 2.1-.8z"/>',
    settings: '<path d="M4 6.5h9M17.5 6.5H20M4 12h3M11.5 12H20M4 17.5h11M19.5 17.5h.5"/><circle cx="15.3" cy="6.5" r="2.1"/><circle cx="9.3" cy="12" r="2.1"/><circle cx="17.4" cy="17.5" r="2.1"/>',
    more: '<circle cx="5.5" cy="12" r="1.3"/><circle cx="12" cy="12" r="1.3"/><circle cx="18.5" cy="12" r="1.3"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>',
    trash: '<path d="M4.5 7h15M9.5 7V4.5h5V7M6.5 7l1 13h9l1-13"/>',
    copy: '<rect x="8.5" y="8.5" width="11" height="11" rx="2"/><path d="M15.5 8.5V5.5a1 1 0 0 0-1-1h-9a1 1 0 0 0-1 1v9a1 1 0 0 0 1 1h3"/>',
    up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
    down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
    left: '<path d="M15 5l-7 7 7 7"/>',
    right: '<path d="M9 5l7 7-7 7"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    eyeoff: '<path d="M4 4l16 16M10 5.7a9 9 0 0 1 2-.2c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.6 3.4M6.5 7.3C4 9 2.5 12 2.5 12s3.5 6.5 9.5 6.5a9 9 0 0 0 4.1-1"/>',
    grip: '<circle cx="9" cy="6" r="1.2"/><circle cx="15" cy="6" r="1.2"/><circle cx="9" cy="12" r="1.2"/><circle cx="15" cy="12" r="1.2"/><circle cx="9" cy="18" r="1.2"/><circle cx="15" cy="18" r="1.2"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="M20 20l-4.3-4.3"/>',
    send: '<path d="M21 3.5 10.5 14M21 3.5l-6.5 17-4-6.5-6.5-4z"/>',
    external: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    download: '<path d="M12 4v11M7 10.5l5 5 5-5M4.5 19.5h15"/>',
    link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
    qr: '<rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><path d="M14 14h2v2h-2zM18 18h2v2h-2zM14 18h2M18 14h2"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    calendar: '<rect x="4" y="5.5" width="16" height="15" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/>',
    clock: '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    mail: '<rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="M4 7l8 6 8-6"/>',
    phone: '<rect x="7" y="3" width="10" height="18" rx="2.4"/><path d="M11 18h2"/>',
    desktop: '<rect x="3" y="4.5" width="18" height="12" rx="1.6"/><path d="M9 20h6M12 16.5V20"/>',
    refresh: '<path d="M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.5 4.5v4h-4"/>',
    bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    user: '<circle cx="12" cy="8.5" r="3.8"/><path d="M4.5 20.5c1-4 4-6 7.5-6s6.5 2 7.5 6"/>',
    star: '<path d="M12 4l2.4 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.9 2.7 1.1-5.4-4-3.7 5.4-.6z"/>',
    bolt: '<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>',
    globe: '<circle cx="12" cy="12" r="8.5"/><path d="M3.5 12h17M12 3.5c2.5 2.6 3.5 5.4 3.5 8.5s-1 5.9-3.5 8.5c-2.5-2.6-3.5-5.4-3.5-8.5s1-5.9 3.5-8.5z"/>',
    shield: '<path d="M12 3.5 5 6v5.5c0 4.4 3 7.9 7 9 4-1.1 7-4.6 7-9V6z"/>',
    card: '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M3 10h18M7 15h3"/>',
    tag: '<path d="M3.5 12.5V4.5h8l9 9-8 8z"/><circle cx="8" cy="9" r="1.4"/>',
    chat: '<path d="M4 5.5h16v11H9l-5 4z"/>',
    image: '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.8"/><path d="M4 18l5-5 4 4 3-3 4 4"/>',
    play: '<path d="M8 5.5v13l10.5-6.5z"/>',
    file: '<path d="M6.5 3.5h7.5l4 4v13h-11.5z"/><path d="M14 3.5v4h4"/>',
    print: '<path d="M7 9V3.5h10V9M7 17.5H4.5v-7a1.5 1.5 0 0 1 1.5-1.5h12a1.5 1.5 0 0 1 1.5 1.5v7H17"/><rect x="7" y="14" width="10" height="6.5"/>',
    filter: '<path d="M4 5.5h16l-6.2 7.3v5.7l-3.6 1.8v-7.5z"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
    wallet: '<path d="M4 7.5V18a1.5 1.5 0 0 0 1.5 1.5h14V9H5.5A1.5 1.5 0 0 1 4 7.5zm0 0A1.5 1.5 0 0 1 5.5 6h11.5"/><circle cx="16" cy="14.2" r="1.1"/>'
  };
  S.ic = function (name, size) {
    size = size || 18;
    return '<svg class="ic" viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IC[name] || IC.star) + '</svg>';
  };

  /* ---------------------------------------------------------------
     État du créateur + autosave
     --------------------------------------------------------------- */
  function hashStr(s) { var h = 0; for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h.toString(36); }
  function normalize(c) {
    ['sections', 'links', 'tiers', 'posts', 'products', 'events', 'promos', 'collabs', 'socials'].forEach(function (k) { if (!Array.isArray(c[k])) c[k] = []; });
    c.stats = c.stats || { followers: 0, members: 0, posts: 0 };
    c.theme = c.theme || { preset: 'premium', overrides: {} };
    c.theme.overrides = c.theme.overrides || {};
    c.avatar = c.avatar || { initials: (c.name || '?').slice(0, 2).toUpperCase(), a: '#e8b4bc', b: '#9c7fa6' };
    c.cover = c.cover || D.art('#2a1d22', '#c0707f', 'silk');
    c.seo = c.seo || { title: c.name || '', description: (c.bio || '').slice(0, 155) };
    var st = c.settings || {};
    c.settings = {
      plan: st.plan || 'pro',
      poweredBy: st.poweredBy !== false,
      twoFA: !!st.twoFA,
      protect: Object.assign({ watermark: true, rightClick: true, download: true, screenshot: false }, st.protect || {}),
      currency: st.currency || 'EUR',
      vat: st.vat != null ? st.vat : 20,
      vatIncluded: st.vatIncluded !== false,
      domainStatus: st.domainStatus || 0,
      domainToken: st.domainToken || ('secr3tly-verify=' + hashStr(c.handle + 'dns') + hashStr(c.handle + 'tok')),
      mediakit: st.mediakit || null
    };
    return c;
  }
  S.handle = null;
  S.c = null;

  S.load = function (handle) {
    var c = D.getCreator(handle);
    if (!c || c.externalUrl) c = D.getCreator('lena');
    S.handle = c.handle;
    S.c = normalize(c);
    D.store.set('studio:handle', S.handle);
    return S.c;
  };

  var saveTimer, savedTimer;
  S.changed = function (opts) {
    opts = opts || {};
    if (opts.preview !== false) S.pushPreview();
    setSaved('saving');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(S.saveNow, opts.delay == null ? 400 : opts.delay);
  };
  S.saveNow = function () {
    clearTimeout(saveTimer);
    var ok = D.saveCreator(S.c);
    setSaved(ok ? 'saved' : 'error');
    S.emit('saved');
  };
  function setSaved(state) {
    var el = document.getElementById('saved'); if (!el) return;
    clearTimeout(savedTimer);
    el.className = 'saved is-' + state;
    if (state === 'saving') el.innerHTML = '<span class="saved-dot"></span>Enregistrement…';
    else if (state === 'saved') {
      el.innerHTML = S.ic('check', 14) + 'Enregistré';
      savedTimer = setTimeout(function () { el.classList.add('is-rest'); }, 2200);
    } else el.innerHTML = '<span class="saved-dot"></span>Stockage indisponible';
  }
  S.setSaved = setSaved;

  /* Petit bus d'événements */
  var bus = {};
  S.on = function (ev, fn) { (bus[ev] = bus[ev] || []).push(fn); };
  S.off = function (ev, fn) { var a = bus[ev] || []; var i = a.indexOf(fn); if (i >= 0) a.splice(i, 1); };
  S.emit = function (ev, data) { (bus[ev] || []).forEach(function (fn) { try { fn(data); } catch (e) { console.error(e); } }); };

  /* ---------------------------------------------------------------
     Aperçu live (iframe c/?preview=1) — protocole postMessage
     --------------------------------------------------------------- */
  S.preview = { frame: null, as: 'public' };
  S.previewUrl = function () { return '../c/?u=' + encodeURIComponent(S.handle) + '&preview=1'; };
  S.pushPreview = function () {
    var f = S.preview.frame;
    if (!f || !f.isConnected || !f.contentWindow) return;
    try {
      f.contentWindow.postMessage({ type: 'secr3tly:preview', creator: S.clone(S.c) }, '*');
    } catch (e) { /* iframe pas prête */ }
  };
  S.pushAs = function () {
    var f = S.preview.frame;
    if (!f || !f.isConnected || !f.contentWindow) return;
    try { f.contentWindow.postMessage({ type: 'secr3tly:as', level: S.preview.as }, '*'); } catch (e) { /* ignore */ }
  };
  root.addEventListener('message', function (e) {
    var f = S.preview.frame;
    if (!e.data || e.data.type !== 'secr3tly:ready' || !f || e.source !== f.contentWindow) return;
    S.pushPreview(); S.pushAs();
    S.emit('preview:ready');
  });

  /* ---------------------------------------------------------------
     Routeur
     --------------------------------------------------------------- */
  S.register = function (id, def) { def.id = id; S.views[id] = def; S.order.push(id); };
  var cleanups = [];
  S.cleanup = function (fn) { cleanups.push(fn); };
  S.route = { id: 'overview', sub: null, parts: [] };
  S.go = function (hash) { if (location.hash === hash) S.render(); else location.hash = hash; };
  S.parse = function () {
    var h = location.hash.replace(/^#\/?/, '');
    var parts = h.split('/').filter(Boolean).map(decodeURIComponent);
    var id = parts[0] && S.views[parts[0]] ? parts[0] : 'overview';
    return { id: id, sub: parts[1] || null, parts: parts.slice(1) };
  };
  S.render = function () {
    cleanups.splice(0).forEach(function (fn) { try { fn(); } catch (e) { /* ignore */ } });
    S.closeAll(true);
    var r = S.route = S.parse();
    var def = S.views[r.id];
    var main = document.getElementById('main');
    document.getElementById('tbTitle').textContent = def.title;
    document.getElementById('tbEyebrow').textContent = def.group || 'Studio';
    document.title = def.title + ' · SECR3TLY Studio';
    document.body.setAttribute('data-view', r.id);
    main.className = 'main view-' + r.id;
    main.innerHTML = '';
    S.emit('route', r);
    try { def.render(main, r.sub, r.parts); } catch (e) { console.error(e); main.innerHTML = S.empty({ icon: 'bolt', title: 'Une erreur est survenue', text: String(e && e.message || e) }); }
    root.scrollTo(0, 0);
  };

  /** Sous-onglets d'une vue (liens hash) */
  S.subtabs = function (base, tabs, active) {
    return '<nav class="subtabs" aria-label="Sous-sections">' + tabs.map(function (t) {
      var on = t.id === active;
      return '<a href="#/' + base + '/' + t.id + '" class="subtab' + (on ? ' on' : '') + '"' + (on ? ' aria-current="page"' : '') + '>' + esc(t.label) + (t.count != null ? '<span class="subtab-n">' + esc(t.count) + '</span>' : '') + '</a>';
    }).join('') + '</nav>';
  };
  /** Segmented control (boutons) */
  S.seg = function (name, opts, value, extraCls) {
    return '<div class="seg ' + (extraCls || '') + '" role="radiogroup" data-seg="' + esc(name) + '">' + opts.map(function (o) {
      var on = String(o.v) === String(value);
      return '<button type="button" role="radio" aria-checked="' + on + '" class="seg-b' + (on ? ' on' : '') + '" data-v="' + esc(o.v) + '">' + (o.icon ? S.ic(o.icon, 15) : '') + '<span>' + esc(o.l) + '</span></button>';
    }).join('') + '</div>';
  };
  S.onSeg = function (rootEl, name, fn) {
    var g = rootEl.querySelector('[data-seg="' + name + '"]'); if (!g) return;
    g.addEventListener('click', function (e) {
      var b = e.target.closest('.seg-b'); if (!b) return;
      g.querySelectorAll('.seg-b').forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
      fn(b.getAttribute('data-v'));
    });
  };

  /* ---------------------------------------------------------------
     Blocs d'interface communs
     --------------------------------------------------------------- */
  S.empty = function (o) {
    return '<div class="empty">' +
      '<div class="empty-ic">' + S.ic(o.icon || 'sparkle', 22) + '</div>' +
      '<h3 class="empty-t">' + esc(o.title) + '</h3>' +
      (o.text ? '<p class="empty-p">' + esc(o.text) + '</p>' : '') +
      (o.action || '') + '</div>';
  };
  S.toggle = function (attrs, checked, label, desc) {
    return '<label class="tgl"><span class="tgl-txt"><span class="tgl-l">' + esc(label) + '</span>' + (desc ? '<span class="tgl-d">' + esc(desc) + '</span>' : '') + '</span>' +
      '<input type="checkbox" class="tgl-in" ' + attrs + (checked ? ' checked' : '') + '><span class="tgl-ui" aria-hidden="true"></span></label>';
  };
  S.delta = function (cur, prev, invert) {
    if (!prev) return '';
    var d = (cur - prev) / prev; var good = invert ? d < 0 : d >= 0;
    return '<span class="delta ' + (good ? 'up' : 'down') + '">' + (d >= 0 ? '▲' : '▼') + ' ' + S.num(Math.abs(d) * 100, 1) + ' %</span>';
  };
  S.artBox = function (a, cls) { return '<div class="artbox ' + (cls || '') + '">' + U.art(a) + '</div>'; };

  /* Petite palette de graphiques (validée daltonisme, fond sombre) */
  S.CH = { rose: '#e0628e', mauve: '#9a7fd6', gold: '#b8863a' };

  /* ---------------------------------------------------------------
     Modales, tiroirs, feuilles
     --------------------------------------------------------------- */
  var stack = [];
  S.modal = function (o) {
    var layer = document.getElementById('layer');
    var prevFocus = document.activeElement;
    var kind = o.kind || 'modal'; // modal | drawer | sheet
    var id = S.uid('dlg');
    var wrap = document.createElement('div');
    wrap.className = 'dlg-back dlg-' + kind;
    wrap.innerHTML =
      '<div class="dlg ' + (o.cls || '') + (o.wide ? ' dlg-wide' : '') + '" role="dialog" aria-modal="true" aria-labelledby="' + id + '">' +
        '<div class="dlg-head"><h2 class="dlg-title" id="' + id + '">' + esc(o.title || '') + '</h2>' +
        (o.subtitle ? '<p class="dlg-sub">' + esc(o.subtitle) + '</p>' : '') +
        '<button type="button" class="icon-btn dlg-x" aria-label="Fermer">' + S.ic('x', 18) + '</button></div>' +
        '<div class="dlg-body">' + (o.body || '') + '</div>' +
        (o.foot ? '<div class="dlg-foot">' + o.foot + '</div>' : '') +
      '</div>';
    layer.appendChild(wrap);
    document.body.classList.add('has-dlg');
    var dlg = wrap.querySelector('.dlg');
    var api = { el: dlg, back: wrap, close: close };
    function close(silent) {
      if (!wrap.isConnected) return;
      var i = stack.indexOf(api); if (i >= 0) stack.splice(i, 1);
      wrap.classList.remove('in');
      setTimeout(function () { wrap.remove(); if (!stack.length) document.body.classList.remove('has-dlg'); }, silent === true ? 0 : 220);
      if (o.onClose) o.onClose();
      if (prevFocus && prevFocus.focus && silent !== true) try { prevFocus.focus(); } catch (e) { /* ignore */ }
    }
    wrap.addEventListener('mousedown', function (e) { if (e.target === wrap) close(); });
    dlg.querySelector('.dlg-x').addEventListener('click', function () { close(); });
    dlg.addEventListener('click', function (e) { if (e.target.closest('[data-close]')) close(); });
    stack.push(api);
    requestAnimationFrame(function () { wrap.classList.add('in'); });
    if (o.onOpen) o.onOpen(dlg, close, api);
    setTimeout(function () {
      var f = dlg.querySelector('[autofocus]') || dlg.querySelector('.dlg-body input:not([type=checkbox]):not([type=color]), .dlg-body textarea, .dlg-body select') || dlg.querySelector('.dlg-x');
      if (f && root.innerWidth > 720) f.focus(); else dlg.querySelector('.dlg-x').focus({ preventScroll: true });
    }, 30);
    return api;
  };
  S.drawer = function (o) { o.kind = 'drawer'; return S.modal(o); };
  S.sheet = function (o) { o.kind = 'sheet'; return S.modal(o); };
  S.closeAll = function (silent) { stack.slice().reverse().forEach(function (m) { m.close(silent); }); };
  document.addEventListener('keydown', function (e) {
    if (!stack.length) return;
    var top = stack[stack.length - 1];
    if (e.key === 'Escape') { e.preventDefault(); top.close(); return; }
    if (e.key === 'Tab') { // piège de focus
      var f = Array.prototype.filter.call(top.el.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])'), function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  S.confirm = function (text, o) {
    o = o || {};
    return new Promise(function (resolve) {
      var done = false;
      S.modal({
        title: o.title || 'Confirmer', cls: 'dlg-sm',
        body: '<p class="confirm-p">' + esc(text) + '</p>',
        foot: '<button type="button" class="btn btn-ghost btn-sm" data-close>Annuler</button><button type="button" class="btn btn-sm ' + (o.danger ? 'btn-danger' : 'btn-primary') + '" data-ok>' + esc(o.ok || 'Confirmer') + '</button>',
        onOpen: function (el, close) { el.querySelector('[data-ok]').addEventListener('click', function () { done = true; close(); resolve(true); }); setTimeout(function () { el.querySelector('[data-ok]').focus(); }, 40); },
        onClose: function () { if (!done) resolve(false); }
      });
    });
  };

  /* ---------------------------------------------------------------
     Liaison de formulaires : [data-k="chemin.en.points"]
     data-t="num" | "lines" | "csv" ; checkbox → booléen
     --------------------------------------------------------------- */
  function getPath(o, p) { return p.split('.').reduce(function (a, k) { return a == null ? undefined : a[k]; }, o); }
  function setPath(o, p, v) {
    var ks = p.split('.'), last = ks.pop();
    var t = ks.reduce(function (a, k) { if (a[k] == null || typeof a[k] !== 'object') a[k] = {}; return a[k]; }, o);
    t[last] = v;
  }
  S.getPath = getPath; S.setPath = setPath;
  S.bind = function (rootEl, obj, cb) {
    rootEl.querySelectorAll('[data-k]').forEach(function (el) {
      var k = el.getAttribute('data-k'), t = el.getAttribute('data-t');
      var v = getPath(obj, k);
      if (el.type === 'checkbox') el.checked = !!v;
      else if (t === 'lines') el.value = Array.isArray(v) ? v.join('\n') : (v || '');
      else if (t === 'csv') el.value = Array.isArray(v) ? v.join(', ') : (v || '');
      else el.value = v == null ? '' : v;
      var evName = (el.tagName === 'SELECT' || el.type === 'checkbox' || el.type === 'radio') ? 'change' : 'input';
      el.addEventListener(evName, function () {
        var nv;
        if (el.type === 'checkbox') nv = el.checked;
        else if (t === 'num') nv = el.value === '' ? null : Number(el.value);
        else if (t === 'lines') nv = el.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean);
        else if (t === 'csv') nv = el.value.split(',').map(function (s) { return s.trim(); }).filter(Boolean);
        else nv = el.value;
        setPath(obj, k, nv);
        if (cb) cb(k, nv, el);
      });
    });
  };
  /** Compteur de caractères sur un champ */
  S.counter = function (input, out, max) {
    function upd() {
      var n = input.value.length;
      out.textContent = n + ' / ' + max;
      out.classList.toggle('over', n > max);
      out.classList.toggle('good', n >= max * 0.55 && n <= max);
    }
    input.addEventListener('input', upd); upd();
  };

  /* ---------------------------------------------------------------
     Graphiques SVG faits main
     --------------------------------------------------------------- */
  var charts = [];
  function niceMax(v) {
    if (v <= 0) return 1;
    var p = Math.pow(10, Math.floor(Math.log10(v))), n = v / p;
    var m = n <= 1 ? 1 : n <= 1.5 ? 1.5 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 3 ? 3 : n <= 4 ? 4 : n <= 5 ? 5 : n <= 6 ? 6 : n <= 8 ? 8 : 10;
    return m * p;
  }
  function shortNum(v) {
    if (v >= 1e6) return S.num(v / 1e6, v % 1e6 ? 1 : 0) + ' M';
    if (v >= 1e3) return S.num(v / 1e3, v % 1e3 ? 1 : 0) + ' k';
    return S.num(v);
  }
  /**
   * S.lineChart(el, { labels:[iso], series:[{name,color,values,area}], fmt, yfmt, height })
   * Crosshair + infobulle au survol / toucher / clavier (flèches).
   */
  S.lineChart = function (el, cfg) {
    charts.push({ el: el, cfg: cfg });
    drawLine(el, cfg);
  };
  function drawLine(el, cfg) {
    var W = Math.max(260, el.clientWidth || 600), H = cfg.height || 220;
    var pl = 44, pr = 12, pt = 14, pb = 28;
    var n = cfg.labels.length;
    var all = []; cfg.series.forEach(function (s) { all = all.concat(s.values); });
    var max = niceMax(Math.max.apply(null, all.concat([1])) * 1.05);
    var fmt = cfg.fmt || S.num, yfmt = cfg.yfmt || shortNum;
    function X(i) { return pl + (n <= 1 ? 0 : i * (W - pl - pr) / (n - 1)); }
    function Y(v) { return pt + (H - pt - pb) * (1 - v / max); }
    var gid = S.uid('lg');
    var svg = '<svg class="chart-svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" tabindex="0" role="img" aria-label="' + esc(cfg.label || 'Graphique') + ' — flèches pour parcourir">';
    svg += '<defs>' + cfg.series.map(function (s, i) {
      return '<linearGradient id="' + gid + i + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + s.color + '" stop-opacity=".26"/><stop offset="1" stop-color="' + s.color + '" stop-opacity="0"/></linearGradient>';
    }).join('') + '</defs>';
    var ticks = 4;
    for (var t = 0; t <= ticks; t++) {
      var v = max * t / ticks, y = Y(v);
      svg += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y + '" y2="' + y + '" class="ch-grid' + (t === 0 ? ' base' : '') + '"/>';
      svg += '<text x="' + (pl - 8) + '" y="' + (y + 4) + '" text-anchor="end" class="ch-y">' + esc(yfmt(v)) + '</text>';
    }
    var nx = Math.min(n, W < 420 ? 4 : 6);
    for (var k = 0; k < nx; k++) {
      var idx = Math.round(k * (n - 1) / Math.max(1, nx - 1));
      svg += '<text x="' + X(idx) + '" y="' + (H - 8) + '" text-anchor="' + (k === 0 ? 'start' : k === nx - 1 ? 'end' : 'middle') + '" class="ch-x">' + esc(S.date(cfg.labels[idx])) + '</text>';
    }
    cfg.series.forEach(function (s, si) {
      var d = s.values.map(function (v, i) { return (i ? 'L' : 'M') + X(i).toFixed(1) + ' ' + Y(v).toFixed(1); }).join('');
      if (s.area !== false) svg += '<path d="' + d + 'L' + X(n - 1).toFixed(1) + ' ' + Y(0) + 'L' + X(0) + ' ' + Y(0) + 'Z" fill="url(#' + gid + si + ')"/>';
      svg += '<path d="' + d + '" fill="none" stroke="' + s.color + '" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"' + (s.dash ? ' stroke-dasharray="4 4"' : '') + '/>';
    });
    svg += '<g class="ch-hover" style="display:none"><line class="ch-cross" y1="' + pt + '" y2="' + (H - pb) + '"/>' +
      cfg.series.map(function (s) { return '<circle r="4.5" fill="' + s.color + '" stroke="#141011" stroke-width="2"/>'; }).join('') + '</g>';
    svg += '<rect class="ch-hit" x="' + pl + '" y="0" width="' + (W - pl - pr) + '" height="' + H + '" fill="transparent"/></svg>';
    var legend = cfg.series.length > 1 ? '<div class="ch-legend">' + cfg.series.map(function (s) { return '<span class="ch-key"><i style="background:' + s.color + '"></i>' + esc(s.name) + '</span>'; }).join('') + '</div>' : '';
    el.innerHTML = legend + '<div class="ch-box">' + svg + '<div class="ch-tip" role="status" aria-live="polite"></div></div>';
    var box = el.querySelector('.ch-box'), svgEl = box.querySelector('svg'), g = svgEl.querySelector('.ch-hover'), tip = box.querySelector('.ch-tip');
    var cur = -1;
    function show(i) {
      cur = i = S.clamp(i, 0, n - 1);
      g.style.display = '';
      g.querySelector('line').setAttribute('x1', X(i)); g.querySelector('line').setAttribute('x2', X(i));
      g.querySelectorAll('circle').forEach(function (c, si) { c.setAttribute('cx', X(i)); c.setAttribute('cy', Y(cfg.series[si].values[i])); });
      tip.innerHTML = '<div class="ch-tip-d">' + esc(S.date(cfg.labels[i], true)) + '</div>' + cfg.series.map(function (s) {
        return '<div class="ch-tip-r"><i style="background:' + s.color + '"></i><span>' + esc(s.name) + '</span><b>' + esc(fmt(s.values[i])) + '</b></div>';
      }).join('');
      tip.classList.add('on');
      var tw = tip.offsetWidth, x = X(i) + 12;
      if (x + tw > W) x = X(i) - tw - 12;
      tip.style.transform = 'translate(' + Math.max(0, x) + 'px,' + 6 + 'px)';
    }
    function hide() { g.style.display = 'none'; tip.classList.remove('on'); }
    function fromEvent(e) {
      var r = svgEl.getBoundingClientRect();
      var px = (e.clientX - r.left) * (W / r.width);
      return Math.round((px - pl) / ((W - pl - pr) / Math.max(1, n - 1)));
    }
    svgEl.addEventListener('pointermove', function (e) { show(fromEvent(e)); });
    svgEl.addEventListener('pointerdown', function (e) { show(fromEvent(e)); });
    svgEl.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hide(); });
    svgEl.addEventListener('blur', hide);
    svgEl.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); show(cur < 0 ? n - 1 : cur + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur < 0 ? n - 1 : cur - 1); }
      else if (e.key === 'Escape') hide();
    });
  }
  /** Barres verticales (une série) — ex. revenus par jour */
  S.barChart = function (el, cfg) { charts.push({ el: el, cfg: cfg, bar: true }); drawBars(el, cfg); };
  function drawBars(el, cfg) {
    var W = Math.max(260, el.clientWidth || 600), H = cfg.height || 200;
    var pl = 44, pr = 8, pt = 12, pb = 28, n = cfg.values.length;
    var max = niceMax(Math.max.apply(null, cfg.values.concat([1])) * 1.05);
    var fmt = cfg.fmt || S.num, yfmt = cfg.yfmt || shortNum;
    var bw = (W - pl - pr) / n, gap = Math.max(2, bw * 0.28);
    function Y(v) { return pt + (H - pt - pb) * (1 - v / max); }
    var svg = '<svg class="chart-svg" width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" tabindex="0" role="img" aria-label="' + esc(cfg.label || 'Graphique') + '">';
    for (var t = 0; t <= 4; t++) {
      var y = Y(max * t / 4);
      svg += '<line x1="' + pl + '" x2="' + (W - pr) + '" y1="' + y + '" y2="' + y + '" class="ch-grid' + (t === 0 ? ' base' : '') + '"/><text x="' + (pl - 8) + '" y="' + (y + 4) + '" text-anchor="end" class="ch-y">' + esc(yfmt(max * t / 4)) + '</text>';
    }
    cfg.values.forEach(function (v, i) {
      var x = pl + i * bw + gap / 2, w = Math.max(1, bw - gap), y = Y(v), h = Math.max(0, Y(0) - y);
      var r = Math.min(4, w / 2, h);
      svg += '<path class="ch-bar" data-i="' + i + '" fill="' + (cfg.color || S.CH.rose) + '" d="M' + x + ' ' + Y(0) + 'V' + (y + r) + 'Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + 'H' + (x + w - r) + 'Q' + (x + w) + ' ' + y + ' ' + (x + w) + ' ' + (y + r) + 'V' + Y(0) + 'Z"/>';
    });
    var nx = Math.min(n, W < 420 ? 4 : 6);
    for (var k = 0; k < nx; k++) {
      var idx = Math.round(k * (n - 1) / Math.max(1, nx - 1));
      svg += '<text x="' + (pl + idx * bw + bw / 2) + '" y="' + (H - 8) + '" text-anchor="middle" class="ch-x">' + esc(cfg.labelFmt ? cfg.labelFmt(cfg.labels[idx]) : S.date(cfg.labels[idx])) + '</text>';
    }
    svg += '<rect class="ch-hit" x="' + pl + '" y="0" width="' + (W - pl - pr) + '" height="' + H + '" fill="transparent"/></svg>';
    el.innerHTML = '<div class="ch-box">' + svg + '<div class="ch-tip" role="status" aria-live="polite"></div></div>';
    var svgEl = el.querySelector('svg'), tip = el.querySelector('.ch-tip'), cur = -1;
    function show(i) {
      cur = i = S.clamp(i, 0, n - 1);
      svgEl.querySelectorAll('.ch-bar').forEach(function (b, j) { b.style.opacity = j === i ? 1 : 0.45; });
      tip.innerHTML = '<div class="ch-tip-d">' + esc(cfg.labelFmt ? cfg.labelFmt(cfg.labels[i]) : S.date(cfg.labels[i], true)) + '</div><div class="ch-tip-r"><i style="background:' + (cfg.color || S.CH.rose) + '"></i><span>' + esc(cfg.name || '') + '</span><b>' + esc(fmt(cfg.values[i])) + '</b></div>';
      tip.classList.add('on');
      var cx = pl + i * bw + bw / 2, tw = tip.offsetWidth, x = cx + 10; if (x + tw > W) x = cx - tw - 10;
      tip.style.transform = 'translate(' + Math.max(0, x) + 'px,6px)';
    }
    function hide() { svgEl.querySelectorAll('.ch-bar').forEach(function (b) { b.style.opacity = ''; }); tip.classList.remove('on'); }
    function idxOf(e) { var r = svgEl.getBoundingClientRect(); return Math.floor(((e.clientX - r.left) * (W / r.width) - pl) / bw); }
    svgEl.addEventListener('pointermove', function (e) { show(idxOf(e)); });
    svgEl.addEventListener('pointerdown', function (e) { show(idxOf(e)); });
    svgEl.addEventListener('pointerleave', function (e) { if (e.pointerType === 'mouse') hide(); });
    svgEl.addEventListener('blur', hide);
    svgEl.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); show(cur < 0 ? n - 1 : cur + 1); }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur < 0 ? n - 1 : cur - 1); }
    });
  }
  var rsT;
  root.addEventListener('resize', function () {
    clearTimeout(rsT);
    rsT = setTimeout(function () {
      charts = charts.filter(function (c) { return c.el.isConnected; });
      charts.forEach(function (c) { if (c.bar) drawBars(c.el, c.cfg); else drawLine(c.el, c.cfg); });
    }, 150);
  });
  /** Mini-courbe pour les tuiles KPI */
  S.spark = function (values, color) {
    var W = 120, H = 34, n = values.length, max = Math.max.apply(null, values), min = Math.min.apply(null, values);
    var rng = max - min || 1;
    var d = values.map(function (v, i) { return (i ? 'L' : 'M') + (i * W / (n - 1)).toFixed(1) + ' ' + (H - 3 - (v - min) / rng * (H - 6)).toFixed(1); }).join('');
    return '<svg class="spark" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true"><path d="' + d + '" fill="none" stroke="' + (color || S.CH.rose) + '" stroke-width="1.6" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></svg>';
  };
  /** Barres horizontales (sources, pays, appareils…) */
  S.hbars = function (list, o) {
    o = o || {};
    var max = o.max || Math.max.apply(null, list.map(function (x) { return x.v; }).concat([1]));
    var fmt = o.fmt || function (v) { return S.num(v) + ' %'; };
    return '<ul class="hbars">' + list.map(function (x) {
      return '<li class="hbar"><div class="hbar-top"><span class="hbar-l">' + esc(x.name) + '</span><span class="hbar-v">' + esc(fmt(x.v, x)) + '</span></div>' +
        '<div class="hbar-track"><span class="hbar-fill" style="width:' + Math.max(2, x.v / max * 100).toFixed(1) + '%;' + (o.color ? 'background:' + o.color : '') + '"></span></div></li>';
    }).join('') + '</ul>';
  };

  /* ---------------------------------------------------------------
     Divers
     --------------------------------------------------------------- */
  S.download = function (filename, content, type) {
    var blob = new Blob([content], { type: type || 'application/octet-stream' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = filename;
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  };
  S.absUrl = function (u) { try { return new URL(u, location.href).href; } catch (e) { return u; } };
  /** Données de période : série courante + précédente (pour les deltas) */
  S.period = function (days) {
    var a = D.analytics(S.handle, days * 2);
    var cur = a.series.slice(days), prev = a.series.slice(0, days);
    function sum(arr, k) { return arr.reduce(function (s, x) { return s + x[k]; }, 0); }
    var full = D.analytics(S.handle, days);
    full.series = cur;
    ['visitors', 'unique', 'views', 'clicks', 'subs', 'sales', 'revenue'].forEach(function (k) { full.totals[k] = sum(cur, k); });
    full.conversion = full.totals.visitors ? (full.totals.subs + full.totals.sales) / full.totals.visitors : 0;
    var prevTotals = {};
    ['visitors', 'unique', 'views', 'clicks', 'subs', 'sales', 'revenue'].forEach(function (k) { prevTotals[k] = sum(prev, k); });
    prevTotals.conversion = prevTotals.visitors ? (prevTotals.subs + prevTotals.sales) / prevTotals.visitors : 0;
    full.prev = prevTotals;
    return full;
  };
  /** Remplace un conteneur par une copie vide (purge les écouteurs délégués) */
  S.fresh = function (el) { var n = el.cloneNode(false); el.replaceWith(n); return n; };
  S.creators = function () { return D.getCreators().filter(function (c) { return !c.externalUrl; }); };
})(window);
