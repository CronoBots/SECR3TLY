/* =====================================================================
   SECR3TLY — Rendu d'un univers créateur
   URL : c/?u=<handle>[&s=<section>][&preview=1][&as=<level>]

   Mode aperçu (studio) :
     - le parent envoie  {type:'secr3tly:preview', creator:{…}}  → re-rendu instantané
     - le parent envoie  {type:'secr3tly:as', level:'public|members|vip|private'}
     - la page envoie    {type:'secr3tly:ready'}  au chargement
   En aperçu : aucune redirection, aucun tracking, pilule « Aperçu ».
   ===================================================================== */
(function () {
  'use strict';

  var S = window.Secretly, UI = window.SecretlyUI, TH = window.SecretlyThemes;
  var esc = S.esc;
  var app = document.getElementById('app');

  /* ---------- Paramètres ---------- */
  var qs = new URLSearchParams(location.search);
  var LEVEL_IDS = ['public', 'members', 'vip', 'private'];
  var state = {
    handle: (qs.get('u') || '').toLowerCase().replace(/^@/, ''),
    section: (qs.get('s') || '').toLowerCase(),
    preview: qs.get('preview') === '1',
    as: LEVEL_IDS.indexOf(qs.get('as')) >= 0 ? qs.get('as') : null,
    creator: null,
    theme: null,
    filter: 'all',
    period: 'month',
    cart: [],
    simPurchases: {},       // achats simulés en aperçu
    rendered: false,
    redirectTimer: null,
    stayed: false
  };

  /* ---------- Utilitaires ---------- */
  var RANK = S.RANK;
  var LEVEL_NAME = { public: 'Public', members: 'Membres', vip: 'VIP', private: 'Private' };
  function $(sel, el) { return (el || document).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  function arr(x) { return Array.isArray(x) ? x : []; }
  // Publications visibles : ni brouillons, ni programmées dans le futur (réglées dans le Studio)
  function posts(c) {
    var now = Date.now();
    return arr(c && c.posts).filter(function (p) {
      if (p.draft || p.status === 'draft') return false;
      if (p.scheduledAt && new Date(p.scheduledAt).getTime() > now) return false;
      return true;
    });
  }
  function settings(c) { return (c && c.settings) || {}; }
  function money(n) { return S.money(Number(n) || 0); }
  function firstName(c) {
    if (c.firstName) return c.firstName;
    var w = String(c.name || '').trim().split(/\s+/);
    return w.length === 2 && !/^(atelier|studio|maison|la|le|les|the|chez|mr|mme)$/i.test(w[0]) ? w[0] : (c.name || '');
  }
  /** « de Lena » / « d’Atelier Kaï » */
  function deName(n) { return (/^[aeiouyhàâäéèêëîïôöûü]/i.test(n) ? 'd’' : 'de ') + n; }
  function reduced() { return window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches; }
  function animLevel() { return reduced() ? 'none' : (state.theme && state.theme.animation) || 'subtle'; }

  function viewerLevel() {
    if (state.as) return state.as;
    return S.viewerLevel(state.handle);
  }
  function canSee(level) { return RANK[viewerLevel()] >= (RANK[level] || 0); }
  function purchased(id) {
    if (state.simPurchases[id]) return true;
    return !state.preview && S.isPurchased(state.handle, id);
  }
  function currentMembership() {
    if (state.as) {
      if (state.as === 'public') return null;
      var t = tierForLevel(state.as, true);
      return t ? { tier: t.id, level: t.level, sim: true } : { level: state.as, sim: true };
    }
    var v = S.getViewer();
    return v.memberships[state.handle] || null;
  }
  function paidTiers() { return arr(state.creator.tiers).filter(function (t) { return t.price > 0; }); }
  /** Formule la moins chère donnant accès à un niveau */
  function tierForLevel(level, exact) {
    var tiers = arr(state.creator.tiers).filter(function (t) { return exact ? t.level === level : RANK[t.level] >= RANK[level]; });
    tiers.sort(function (a, b) { return RANK[a.level] - RANK[b.level] || a.price - b.price; });
    return tiers[0] || null;
  }
  function tierById(id) { return arr(state.creator.tiers).filter(function (t) { return t.id === id; })[0] || null; }

  function relDate(d) {
    var t = new Date(d); if (isNaN(t)) return '';
    var diff = Math.round((Date.now() - t.getTime()) / 864e5);
    if (diff <= 0) return 'Aujourd’hui';
    if (diff === 1) return 'Hier';
    if (diff < 7) return 'Il y a ' + diff + ' j';
    return t.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  }
  function storyLeft(p) {
    var exp = p.expiresAt ? new Date(p.expiresAt).getTime() : new Date(p.date + 'T00:00').getTime() + 864e5;
    if (isNaN(exp)) exp = Date.now() + 864e5 / 2;
    while (exp < Date.now()) exp += 864e5;
    var ms = exp - Date.now(), h = Math.floor(ms / 36e5), m = Math.floor((ms % 36e5) / 6e4);
    return h > 0 ? 'reste ' + h + ' h' : 'reste ' + m + ' min';
  }
  function eventDate(d) {
    var t = new Date(d);
    if (isNaN(t)) return { day: '—', month: '', full: String(d || '') };
    return {
      day: t.toLocaleDateString('fr-FR', { day: '2-digit' }),
      month: t.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', ''),
      full: t.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) + ' · ' + t.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
    };
  }
  function initials(s) { return String(s || '?').split(/\s+/).map(function (w) { return w.charAt(0); }).join('').slice(0, 2).toUpperCase(); }
  function vipDiscount() {
    var found = null;
    arr(state.creator.tiers).forEach(function (t) {
      arr(t.perks).forEach(function (p) {
        var m = /-\s?(\d+)\s?%.*boutique/i.exec(p);
        if (m && !found) found = { pct: Number(m[1]), tier: t };
      });
    });
    return found;
  }
  function track(type, data) {
    if (state.preview || state.as) return;
    try { S.track(state.handle, type, data); } catch (e) { /* ignore */ }
  }

  /* ---------- Icônes ---------- */
  var IC = {
    lock: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="4.5" y="10.5" width="15" height="10" rx="2.5"/><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3"/></svg>',
    heart: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.2a4.3 4.3 0 0 1 7.5 2.6C19.5 15.4 12 20 12 20z"/></svg>',
    chat: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M20 12a7.5 7.5 0 0 1-11.2 6.5L4 19.5l1.1-4.2A7.5 7.5 0 1 1 20 12z"/></svg>',
    share: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 15V3.5M7.5 8 12 3.5 16.5 8M5 13v5.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V13"/></svg>',
    play: '<svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>',
    stack: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="7" y="7" width="13" height="13" rx="2"/><path d="M4 16V5.5A1.5 1.5 0 0 1 5.5 4H16"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    ext: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M14 4h6v6M20 4l-9 9M18 14v4.5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 18.5v-11A1.5 1.5 0 0 1 5.5 6H10"/></svg>',
    close: '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    bag: '<svg viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M5 8h14l-1 12.5H6z"/><path d="M9 8V6.5a3 3 0 0 1 6 0V8"/></svg>',
    pin: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/></svg>',
    cal: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="4" y="5.5" width="16" height="14.5" rx="2"/><path d="M4 10h16M8.5 3.5v4M15.5 3.5v4"/></svg>',
    copy: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2"/><path d="M15.5 8.5V5.5A1.5 1.5 0 0 0 14 4H5.5A1.5 1.5 0 0 0 4 5.5V14a1.5 1.5 0 0 0 1.5 1.5h3"/></svg>',
    spark: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M12 2.5l1.9 6.1 6.1 1.9-6.1 1.9L12 18.5l-1.9-6.1L4 10.5l6.1-1.9z"/></svg>',
    clock: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
    chevL: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg>',
    chevR: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg>',
    mail: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="13" rx="2"/><path d="m4 7 8 6 8-6"/></svg>'
  };
  var VERIFIED = '<svg class="verified" viewBox="0 0 24 24" width="20" height="20" role="img" aria-label="Compte vérifié"><path fill="currentColor" d="M12 1.8l2.4 1.8 3-.1.9 2.9 2.4 1.8-1 2.8 1 2.8-2.4 1.8-.9 2.9-3-.1L12 22.2l-2.4-1.8-3 .1-.9-2.9-2.4-1.8 1-2.8-1-2.8 2.4-1.8.9-2.9 3 .1z"/><path d="m8 12.3 2.7 2.7L16.2 9.5" fill="none" stroke="var(--t-on-accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function lvlBadge(level) {
    return '<span class="lvl lvl-' + esc(level) + '">' + (level === 'public' ? '' : IC.lock.replace('width="18" height="18"', 'width="11" height="11"')) + esc(LEVEL_NAME[level] || level) + '</span>';
  }
  /** Avatar partagé + initiales de secours si l'image ne charge pas */
  function avatar(c, size) {
    var h = UI.avatar(c, size);
    var ini = esc((c.avatar && c.avatar.initials) || initials(c.name));
    return h.replace('<span class="avatar" style="', '<span class="avatar" data-i="' + ini + '" style="font-size:' + Math.round(size * 0.36) + 'px;');
  }
  function artHtml(a, label) { return UI.art(a, { label: label || '' }); }

  /* =================================================================
     RENDU PRINCIPAL
     ================================================================= */
  function applyTheme(c) {
    var t = TH.apply(c.theme || { preset: 'premium' });
    var html = document.documentElement;
    html.setAttribute('data-card', t.card || 'solid');
    html.setAttribute('data-btn', t.button || 'pill');
    html.setAttribute('data-title', t.titleCase === 'upper' ? 'upper' : 'none');
    if (reduced()) html.setAttribute('data-anim', 'none');
    state.theme = t;
    return t;
  }

  function render(opts) {
    opts = opts || {};
    var c = state.creator;
    var y = window.scrollY;
    applyTheme(c);
    setSeo(c);
    var sections = orderedSections(c);
    var instant = opts.keepScroll || animLevel() === 'none';

    app.innerHTML =
      previewPill() +
      topbar(c) +
      '<header class="cover" role="img" aria-label="Couverture ' + esc(deName(c.name)) + '">' + coverHtml(c) + '</header>' +
      '<div class="shell">' +
        '<aside class="identity-col">' + identity(c, sections) + '</aside>' +
        '<main id="main" class="main-col" tabindex="-1">' +
          externalBlock(c) +
          sections.map(function (id) { return sectionHtml(id, c); }).join('') +
          (sections.length || c.externalUrl ? '' : emptyUniverse(c)) +
        '</main>' +
      '</div>' +
      footer(c) +
      cartFab();

    if (instant) $$('.reveal', app).forEach(function (e) { e.classList.add('in'); });
    else UI.reveal(app);
    setupTopbar();
    if (opts.keepScroll) window.scrollTo(0, y);
    state.rendered = true;
  }

  function orderedSections(c) {
    var known = S.SECTIONS.map(function (s) { return s.id; });
    var seen = {};
    return arr(c.sections).filter(function (id) {
      if (known.indexOf(id) < 0 || seen[id]) return false;
      seen[id] = true;
      return state.preview || hasContent(id, c);
    });
  }
  function hasContent(id, c) {
    switch (id) {
      case 'links': return arr(c.links).length > 0;
      case 'feed': return posts(c).length > 0;
      case 'gallery': return posts(c).length + arr(c.products).length > 0;
      case 'memberships': return arr(c.tiers).length > 0;
      case 'shop': return arr(c.products).length > 0;
      case 'events': return arr(c.events).length > 0;
      case 'promos': return arr(c.promos).length > 0;
      case 'collabs': return publicCollabs(c).length > 0;
      default: return true;
    }
  }
  function publicCollabs(c) { return arr(c.collabs).filter(function (b) { return b.status === 'live' || b.status === 'done'; }); }

  function previewPill() {
    if (state.preview) return '<div class="preview-pill" aria-live="polite"><span class="dot"></span>Aperçu' + (state.as ? ' · ' + esc(LEVEL_NAME[state.as]) : '') + '</div>';
    if (state.as) return '<div class="preview-pill"><span class="dot"></span>Vue ' + esc(LEVEL_NAME[state.as]) + '</div>';
    return '';
  }

  function coverHtml(c) {
    var inner = c.coverImg
      ? '<img src="' + esc(c.coverImg) + '" alt="" decoding="async" fetchpriority="high" onerror="this.remove()">' + artHtml(c.cover)
      : artHtml(c.cover || { a: '#1c1618', b: '#d4467e', pattern: 'orb' });
    return '<div class="cover-media' + (c.coverImg ? ' has-img' : '') + '">' + inner + '</div><div class="cover-fade"></div>';
  }

  function topbar(c) {
    var m = currentMembership();
    return '<div class="topbar" id="topbar" aria-hidden="true">' +
      '<div class="topbar-in">' +
        '<a href="#top" class="tb-id" data-act="top" tabindex="-1">' + avatar(c, 32) + '<span class="tb-name">' + esc(c.name) + '</span>' + (c.verified ? VERIFIED : '') + '</a>' +
        (arr(c.tiers).length ? '<button class="btn btn-primary btn-sm" data-act="' + (m ? 'manage' : 'goto') + '" data-sec="memberships" tabindex="-1">' + (m ? 'Mon accès' : 'Rejoindre') + '</button>' : '') +
      '</div></div>';
  }

  function identity(c, sections) {
    var st = c.stats || {};
    var following = !state.preview && S.isFollowing(c.handle);
    var m = currentMembership();
    var mt = m && tierById(m.tier);
    var hasTiers = paidTiers().length > 0;
    var socials = arr(c.socials);
    var navs = sections.filter(function (id) { return id !== 'links'; });
    return '<div class="identity" id="top">' +
      '<div class="id-avatar">' + avatar(c, 112) + '</div>' +
      '<div class="id-text">' +
        '<h1 class="id-name">' + nameHtml(c) + '</h1>' +
        '<p class="id-meta">' + esc(c.pseudo || '@' + c.handle) + (c.location ? '<span class="sep" aria-hidden="true">·</span><span class="loc">' + IC.pin + esc(c.location) + '</span>' : '') + '</p>' +
        (c.tagline ? '<p class="id-tagline">' + esc(c.tagline) + '</p>' : '') +
        (c.bio ? '<p class="id-bio">' + esc(c.bio) + '</p>' : '') +
      '</div>' +
      '<dl class="id-stats">' +
        '<div><dt>Abonnés</dt><dd>' + S.compact((st.followers || 0) + (following ? 1 : 0)) + '</dd></div>' +
        '<div><dt>Membres</dt><dd>' + S.compact(st.members || 0) + '</dd></div>' +
        '<div><dt>Publications</dt><dd>' + S.compact(st.posts || posts(c).length) + '</dd></div>' +
      '</dl>' +
      (m ? '<p class="id-member">' + IC.spark + 'Vous êtes membre ' + esc(mt ? mt.name : LEVEL_NAME[m.level]) + '</p>' : '') +
      '<div class="id-actions">' +
        (hasTiers ? (m
          ? '<button class="btn btn-primary" data-act="manage">Gérer mon accès</button>'
          : '<button class="btn btn-primary" data-act="goto" data-sec="memberships">Rejoindre</button>') : '') +
        '<button class="btn btn-ghost" data-act="follow" aria-pressed="' + following + '">' + (following ? IC.check + 'Suivi' : 'Suivre') + '</button>' +
        '<button class="btn btn-ghost btn-icon" data-act="share" aria-label="Partager cet univers">' + IC.share + '</button>' +
      '</div>' +
      (socials.length ? '<ul class="id-socials" aria-label="Réseaux sociaux">' + socials.map(function (s) {
        return '<li><a href="' + esc(safeUrl(s.url)) + '" target="_blank" rel="noopener me" aria-label="' + esc(netName(s.net)) + (s.followers ? ' — ' + S.compact(s.followers) + ' abonnés' : '') + '">' + UI.icon(s.net, 18) + '</a></li>';
      }).join('') + '</ul>' : '') +
      (navs.length > 1 ? '<nav class="id-nav" aria-label="Sections de l’univers"><ul>' + navs.map(function (id) {
        return '<li><a href="#sec-' + id + '" data-act="goto" data-sec="' + id + '">' + esc(navLabel(id)) + '</a></li>';
      }).join('') + '</ul></nav>' : '') +
    '</div>';
  }
  function nameHtml(c) {
    var words = String(c.name || '').split(' '), last = words.pop();
    return esc(words.join(' ')) + (words.length ? ' ' : '') + '<span class="nw">' + esc(last) + (c.verified ? VERIFIED : '') + '</span>';
  }
  function netName(n) { return ({ instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', x: 'X', snapchat: 'Snapchat', facebook: 'Facebook', twitch: 'Twitch', pinterest: 'Pinterest', telegram: 'Telegram', web: 'Site web' })[n] || 'Lien'; }
  function safeUrl(u) { u = String(u || '#'); return /^(https?:|mailto:|#|\/|\.)/i.test(u) ? u : '#'; }

  var TITLES = {
    links: ['À ne pas manquer', 'Liens'],
    feed: ['Publications', 'Le journal'],
    gallery: ['Galerie', 'Albums & images'],
    memberships: ['Abonnements', 'Rejoindre le cercle'],
    shop: ['Boutique', 'La boutique'],
    events: ['Agenda', 'Événements'],
    promos: ['Partenaires', 'Codes promo'],
    community: ['Communauté', 'Le salon des membres'],
    collabs: ['Collaborations', 'Ils m’ont fait confiance'],
    newsletter: ['Newsletter', 'La lettre'],
    contact: ['Contact', 'Écrire à ' + '{name}']
  };
  function navLabel(id) { return ({ feed: 'Publications', gallery: 'Galerie', memberships: 'Abonnements', shop: 'Boutique', events: 'Agenda', promos: 'Codes', community: 'Communauté', collabs: 'Collabs', newsletter: 'Newsletter', contact: 'Contact', links: 'Liens' })[id] || id; }

  function sectionHtml(id, c) {
    var t = TITLES[id] || [id, id];
    var title = t[1].replace('{name}', firstName(c));
    if (id === 'newsletter') title = 'La lettre ' + deName(firstName(c));
    var body = '';
    try { body = RENDER[id](c); } catch (e) { body = ''; if (window.console) console.warn('Section', id, e); }
    if (!body) body = '<div class="empty">Section vide — ajoutez du contenu depuis le Studio.</div>';
    return '<section class="sec sec-' + id + ' reveal" id="sec-' + id + '" data-sec="' + id + '" aria-labelledby="h-' + id + '">' +
      (id === 'links' ? '<h2 class="sr-only" id="h-' + id + '">' + esc(title) + '</h2>' :
      '<div class="sec-head"><p class="eyebrow">' + esc(t[0]) + '</p><h2 class="sec-title" id="h-' + id + '">' + esc(title) + '</h2></div>') +
      body + '</section>';
  }

  function emptyUniverse(c) {
    return '<section class="sec"><div class="empty big"><p class="eyebrow">Bientôt</p><h2 class="sec-title">L’univers ' + esc(deName(firstName(c))) + ' se prépare</h2><p>Suivez-le pour être prévenu·e de l’ouverture.</p></div></section>';
  }

  function externalBlock(c) {
    if (!c.externalUrl) return '';
    return '<section class="sec reveal"><div class="card external-card">' +
      '<p class="eyebrow">Univers en ligne</p>' +
      '<h2 class="sec-title">L’univers ' + esc(deName(c.name)) + ' vit sur son propre domaine</h2>' +
      '<p class="muted">Liens, contenus exclusifs et accès privé : tout est réuni sur ' + esc(c.domain || c.externalUrl) + '.</p>' +
      '<a class="btn btn-primary" href="' + esc(safeUrl(c.externalUrl)) + '" data-act="external">Entrer dans l’univers ' + IC.arrow + '</a>' +
    '</div></section>';
  }

  /* ---------- Sections ---------- */
  var RENDER = {};

  RENDER.links = function (c) {
    var links = arr(c.links);
    if (!links.length) return '';
    return '<ul class="links">' + links.map(function (l, i) {
      var ext = !/^#/.test(l.url || '');
      return '<li><a class="link-card card" href="' + esc(safeUrl(l.url)) + '" data-act="link" data-id="' + esc(l.id) + '" data-slug="' + esc(l.slug || '') + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + ' style="--i:' + i + '">' +
        '<span class="link-ico" aria-hidden="true">' + esc(l.icon || '✦') + '</span>' +
        '<span class="link-label">' + esc(l.label) + '</span>' +
        '<span class="link-go" aria-hidden="true">' + (ext ? IC.ext : IC.arrow) + '</span></a></li>';
    }).join('') + '</ul>';
  };

  function postLocked(p) {
    if (p.price) return !purchased(p.id);
    return !canSee(p.access || 'public');
  }
  function matchesFilter(p, f) {
    switch (f) {
      case 'photo': return p.type === 'photo' || p.type === 'story';
      case 'video': return p.type === 'video';
      case 'album': return p.type === 'album' || p.type === 'bundle';
      case 'exclusive': return (p.access && p.access !== 'public') || !!p.price;
      default: return true;
    }
  }
  RENDER.feed = function (c) {
    var feedPosts = posts(c);
    if (!feedPosts.length) return '';
    var chips = [['all', 'Tout'], ['photo', 'Photos'], ['video', 'Vidéos'], ['album', 'Albums'], ['exclusive', 'Exclusifs']];
    var list = feedPosts.filter(function (p) { return matchesFilter(p, state.filter); });
    return '<div class="chips" role="toolbar" aria-label="Filtrer les publications">' + chips.map(function (ch) {
      var n = feedPosts.filter(function (p) { return matchesFilter(p, ch[0]); }).length;
      return '<button class="chip" data-act="filter" data-f="' + ch[0] + '" aria-pressed="' + (state.filter === ch[0]) + '"' + (n ? '' : ' disabled') + '>' + ch[1] + (ch[0] !== 'all' && n ? ' <span class="n">' + n + '</span>' : '') + '</button>';
    }).join('') + '</div>' +
    (list.length ? '<div class="feed">' + list.map(postCard).join('') + '</div>' : '<div class="empty">Rien ici pour le moment.</div>');
  };

  function postCard(p) {
    var c = state.creator;
    var locked = postLocked(p);
    var liked = S.isLiked(c.handle, p.id);
    var badges = '';
    if (p.type === 'video' && p.duration) badges += '<span class="m-badge">' + IC.play.replace('width="22" height="22"', 'width="12" height="12"') + esc(p.duration) + '</span>';
    if ((p.type === 'album' || p.type === 'bundle') && (p.count || p.type === 'bundle')) badges += '<span class="m-badge">' + IC.stack + (p.count ? esc(p.count) + ' photos' : 'Bundle') + '</span>';
    if (p.ephemeral) badges += '<span class="m-badge story" data-story="' + esc(p.id) + '">' + IC.clock + '24 h · ' + esc(storyLeft(p)) + '</span>';
    var overlay = '';
    if (locked) {
      var cta;
      if (p.price) cta = '<button class="btn btn-primary btn-sm" data-act="buy-post" data-id="' + esc(p.id) + '">Débloquer pour ' + money(p.price) + '</button>';
      else {
        var t = tierForLevel(p.access);
        cta = t ? '<button class="btn btn-primary btn-sm" data-act="join" data-tier="' + esc(t.id) + '">' + (t.inviteOnly ? 'Demander une invitation' : 'Débloquer avec ' + esc(t.name)) + '</button>'
          : '<button class="btn btn-primary btn-sm" data-act="goto" data-sec="memberships">Voir les accès</button>';
      }
      overlay = '<div class="veil"><span class="veil-lock">' + IC.lock + '</span>' +
        (p.price ? '<span class="lvl lvl-ppv">' + (p.type === 'bundle' ? 'Bundle' : 'À l’unité') + '</span>' : lvlBadge(p.access)) +
        '<p class="veil-text">' + (p.price ? 'Accès permanent, sans abonnement' : 'Réservé ' + esc(LEVEL_NAME[p.access] === 'Membres' ? 'aux membres' : 'au niveau ' + LEVEL_NAME[p.access])) + '</p>' + cta + '</div>';
    }
    var media = '<div class="post-media' + (locked ? ' is-locked' : '') + (p.type === 'video' ? ' is-video' : '') + '">' +
      '<div class="art-wrap">' + artHtml(p.art, p.title) + '</div>' +
      (!locked && p.type === 'video' ? '<span class="play" aria-hidden="true">' + IC.play + '</span>' : '') +
      '<div class="m-badges">' + badges + '</div>' + overlay +
      (!locked ? '<button class="media-hit" data-act="open-post" data-id="' + esc(p.id) + '" aria-label="Ouvrir « ' + esc(p.title) + ' »"></button>' : '') +
    '</div>';
    return '<article class="post card" data-type="' + esc(p.type) + '">' +
      '<header class="post-head">' + avatar(c, 34) + '<div class="ph-text"><strong>' + esc(c.name) + '</strong><span>' + esc(relDate(p.date)) + '</span></div>' +
        (p.access && p.access !== 'public' ? lvlBadge(p.access) : (p.price ? '<span class="lvl lvl-ppv">' + money(p.price) + '</span>' : '')) + '</header>' +
      media +
      '<div class="post-body"><h3 class="post-title">' + esc(p.title) + '</h3>' + (p.caption ? '<p class="post-cap">' + esc(p.caption) + '</p>' : '') + '</div>' +
      '<footer class="post-foot">' +
        '<button class="act' + (liked ? ' on' : '') + '" data-act="like" data-id="' + esc(p.id) + '" aria-pressed="' + liked + '" aria-label="J’aime">' + IC.heart + '<span>' + S.compact((p.likes || 0) + (liked ? 1 : 0)) + '</span></button>' +
        '<button class="act" data-act="' + (locked ? 'noop-locked' : 'open-post') + '" data-id="' + esc(p.id) + '" aria-label="' + esc(p.comments || 0) + ' commentaires">' + IC.chat + '<span>' + S.compact(p.comments || 0) + '</span></button>' +
        '<button class="act push" data-act="share-post" data-id="' + esc(p.id) + '" aria-label="Partager">' + IC.share + '</button>' +
      '</footer></article>';
  }

  function galleryItems(c) {
    var items = [];
    posts(c).forEach(function (p) { items.push({ id: p.id, kind: 'post', title: p.title, art: p.art, locked: postLocked(p), post: p }); });
    arr(c.products).forEach(function (p) { items.push({ id: p.id, kind: 'product', title: p.name, art: p.art, locked: false, product: p }); });
    return items;
  }
  RENDER.gallery = function (c) {
    var items = galleryItems(c);
    if (!items.length) return '';
    var ratios = ['1 / 1.25', '1 / 1', '1 / 1.45', '1 / .85', '1 / 1.15', '1 / 1.35'];
    return '<div class="masonry">' + items.map(function (it, i) {
      return '<figure class="m-item' + (it.locked ? ' is-locked' : '') + '" style="aspect-ratio:' + ratios[i % ratios.length] + '">' +
        artHtml(it.art, it.title) +
        (it.locked ? '<span class="m-lock">' + IC.lock + '</span>' : '') +
        '<figcaption>' + esc(it.title) + '</figcaption>' +
        '<button class="media-hit" data-act="' + (it.locked ? 'unlock-item' : 'lightbox') + '" data-i="' + i + '" aria-label="' + (it.locked ? 'Contenu verrouillé : ' : 'Agrandir : ') + esc(it.title) + '"></button>' +
      '</figure>';
    }).join('') + '</div>';
  };

  RENDER.memberships = function (c) {
    var tiers = arr(c.tiers);
    if (!tiers.length) return '';
    var hasYearly = tiers.some(function (t) { return t.yearly; });
    var m = currentMembership();
    var paid = tiers.filter(function (t) { return t.price > 0; });
    var free = tiers.filter(function (t) { return !(t.price > 0); })[0];
    var invites = (S.getViewer().invites || {})[c.handle];
    var out = '';
    if (hasYearly) out += '<div class="period" role="radiogroup" aria-label="Période de facturation">' +
      '<button role="radio" data-act="period" data-p="month" aria-checked="' + (state.period === 'month') + '">Mensuel</button>' +
      '<button role="radio" data-act="period" data-p="year" aria-checked="' + (state.period === 'year') + '">Annuel <em>2 mois offerts</em></button></div>';
    out += '<div class="tiers">' + paid.map(function (t) {
      var yearly = state.period === 'year' && t.yearly;
      var isCur = m && (m.tier === t.id || (!m.tier && m.level === t.level));
      var included = m && !isCur && RANK[m.level] > RANK[t.level];
      var seatsLeft = t.limited ? Math.max(1, Math.round(t.limited * (0.18 + S.rng(c.handle + t.id)() * 0.3))) : 0;
      var cta;
      if (isCur) cta = '<button class="btn btn-ghost" data-act="manage">' + IC.check + 'Votre formule · Gérer</button>';
      else if (included) cta = '<button class="btn btn-ghost" disabled>Inclus dans votre formule</button>';
      else if (t.inviteOnly && invites) cta = '<button class="btn btn-ghost" disabled>' + IC.check + 'Demande envoyée</button>';
      else if (t.inviteOnly) cta = '<button class="btn btn-primary" data-act="join" data-tier="' + esc(t.id) + '">Demander une invitation</button>';
      else cta = '<button class="btn btn-primary" data-act="join" data-tier="' + esc(t.id) + '">' + (t.trialDays ? 'Essayer ' + t.trialDays + ' jours' : 'Rejoindre ' + esc(t.name)) + '</button>';
      return '<article class="tier card' + (t.highlight ? ' is-hl' : '') + (isCur ? ' is-cur' : '') + '">' +
        (t.highlight ? '<span class="tier-ribbon">Le plus choisi</span>' : '') +
        '<div class="tier-top">' + lvlBadge(t.level) + (t.promo ? '<span class="promo-badge">' + esc(t.promo) + '</span>' : '') + '</div>' +
        '<h3 class="tier-name">' + esc(t.name) + '</h3>' +
        '<p class="tier-price"><strong>' + money(yearly ? t.yearly : t.price) + '</strong><span>/' + (yearly ? 'an' : 'mois') + '</span></p>' +
        (yearly ? '<p class="tier-sub">soit ' + money(Math.round(t.yearly / 12 * 100) / 100) + ' par mois</p>' : (t.trialDays ? '<p class="tier-sub">' + t.trialDays + ' jours d’essai offerts</p>' : '<p class="tier-sub">Sans engagement</p>')) +
        '<ul class="perks">' + arr(t.perks).map(function (pk) { return '<li>' + IC.check + '<span>' + esc(pk) + '</span></li>'; }).join('') + '</ul>' +
        (t.limited ? '<p class="seats"><span class="seat-bar"><i style="width:' + Math.round((1 - seatsLeft / t.limited) * 100) + '%"></i></span>' + t.limited + ' places · plus que ' + seatsLeft + (t.inviteOnly ? ' · sur invitation' : '') + '</p>' : (t.inviteOnly ? '<p class="seats">Sur invitation</p>' : '')) +
        cta + '</article>';
    }).join('') + '</div>';
    if (free) out += '<div class="free-row card"><div><strong>' + esc(free.name) + ' · Gratuit</strong><span>' + esc(arr(free.perks).join(' · ')) + '</span></div>' +
      '<button class="btn btn-ghost btn-sm" data-act="follow">' + (!state.preview && S.isFollowing(c.handle) ? IC.check + 'Suivi' : 'Suivre gratuitement') + '</button></div>';
    out += '<p class="fineprint">Paiement sécurisé · Résiliable à tout moment · Démo — aucun paiement réel</p>';
    return out;
  };

  var TYPE_LABEL = { ebook: 'E-book', digital: 'Numérique', physical: 'Édition physique', course: 'Formation', merch: 'Merch', experience: 'Expérience' };
  var TYPE_DESC = {
    ebook: 'Un guide au format PDF, à lire partout. Téléchargement immédiat après l’achat.',
    digital: 'Fichiers numériques livrés instantanément dans votre bibliothèque.',
    physical: 'Pièce soigneusement emballée et expédiée sous 3 à 5 jours ouvrés.',
    course: 'Formation vidéo en accès illimité, à suivre à votre rythme.',
    merch: 'Édition officielle, produite en séries limitées.',
    experience: 'Une expérience unique, organisée ensemble après la réservation.'
  };
  function productPrice(p) {
    var d = vipDiscount();
    if (d && canSee(d.tier.level) && p.type !== 'experience') return { price: Math.round(p.price * (100 - d.pct)) / 100, was: p.price, pct: d.pct };
    return { price: p.price };
  }
  RENDER.shop = function (c) {
    var ps = arr(c.products);
    if (!ps.length) return '';
    var d = vipDiscount();
    return (d ? '<p class="shop-note">' + IC.spark + (canSee(d.tier.level) ? 'Votre remise ' + esc(d.tier.name) + ' de −' + d.pct + ' % est appliquée.' : '−' + d.pct + ' % sur la boutique pour les membres ' + esc(d.tier.name) + '.') + '</p>' : '') +
      '<div class="products">' + ps.map(function (p) {
        var pp = productPrice(p), owned = purchased(p.id);
        return '<article class="product card">' +
          '<div class="product-media">' + artHtml(p.art, p.name) + (p.stock != null && p.stock <= 12 ? '<span class="m-badge">Plus que ' + esc(p.stock) + '</span>' : '') + '</div>' +
          '<div class="product-body"><p class="p-type">' + esc(TYPE_LABEL[p.type] || p.type) + '</p><h3 class="p-name">' + esc(p.name) + '</h3>' +
          '<p class="p-price">' + (owned ? '<span class="owned">' + IC.check + 'Acheté</span>' : money(pp.price) + (pp.was ? ' <s>' + money(pp.was) + '</s>' : '')) + '</p></div>' +
          '<button class="media-hit" data-act="product" data-id="' + esc(p.id) + '" aria-label="Voir ' + esc(p.name) + '"></button>' +
        '</article>';
      }).join('') + '</div>';
  };

  RENDER.events = function (c) {
    var evs = arr(c.events).slice().sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });
    if (!evs.length) return '';
    return '<div class="events">' + evs.map(function (e) {
      var d = eventDate(e.date), ok = canSee(e.access || 'public'), booked = purchased(e.id);
      var cta;
      if (booked) cta = '<span class="booked">' + IC.check + 'Réservé</span>';
      else if (!ok) {
        var t = tierForLevel(e.access);
        cta = t ? '<button class="btn btn-ghost btn-sm" data-act="join" data-tier="' + esc(t.id) + '">' + IC.lock.replace('width="18" height="18"', 'width="14" height="14"') + (t.inviteOnly ? 'Sur invitation' : 'Avec ' + esc(t.name)) + '</button>' : '<span class="booked">' + IC.lock + '</span>';
      } else cta = '<button class="btn btn-primary btn-sm" data-act="book" data-id="' + esc(e.id) + '">Réserver</button>';
      return '<article class="event card">' +
        '<div class="ev-date" aria-hidden="true"><strong>' + esc(d.day) + '</strong><span>' + esc(d.month) + '</span></div>' +
        '<div class="ev-body"><div class="ev-top">' + lvlBadge(e.access || 'public') + '<span class="ev-price">' + (e.price ? money(e.price) : 'Gratuit') + '</span></div>' +
          '<h3 class="ev-title">' + esc(e.title) + '</h3>' +
          '<p class="ev-meta"><span>' + IC.cal + esc(d.full) + '</span><span>' + IC.pin + esc(e.place || '') + (e.seats ? ' · ' + e.seats + ' places' : '') + '</span></p></div>' +
        '<div class="ev-cta">' + cta + '</div>' +
      '</article>';
    }).join('') + '</div>';
  };

  RENDER.promos = function (c) {
    var ps = arr(c.promos);
    if (!ps.length) return '';
    return '<div class="promos">' + ps.map(function (p) {
      return '<article class="promo card">' +
        '<div class="promo-top"><span class="monogram" aria-hidden="true">' + esc(initials(p.brand)) + '</span><div><h3 class="promo-brand">' + esc(p.brand) + '</h3><p class="muted">' + esc(p.desc || '') + '</p></div><strong class="promo-off">' + esc(p.discount || '') + '</strong></div>' +
        '<div class="promo-code"><code>' + esc(p.code) + '</code><button class="btn btn-ghost btn-sm" data-act="copy" data-code="' + esc(p.code) + '" aria-label="Copier le code ' + esc(p.code) + '">' + IC.copy + 'Copier</button>' +
        (p.url && p.url !== '#' ? '<a class="btn btn-ghost btn-sm" href="' + esc(safeUrl(p.url)) + '" target="_blank" rel="noopener sponsored" data-act="promo-link" data-id="' + esc(p.id) + '">' + IC.ext + '</a>' : '') + '</div>' +
      '</article>';
    }).join('') + '</div>';
  };

  var CHAT = {
    Fashion: ['Le foulard est encore plus beau en vrai 😍', 'Tu peux faire un look automne avec la capsule ?', 'Merci pour le carnet de Kyoto, je pars en avril !', 'Le live de dimanche était incroyable'],
    Beauty: ['La routine du soir a changé ma peau', 'Quel fond de teint pour peau mixte ?', 'Merci pour le diagnostic, trop précis', 'Hâte du prochain live'],
    Gaming: ['GG pour le run d’hier, record en vue 🔥', 'Inscrit au tournoi #14 !', 'Le replay sans pub, un vrai luxe', 'Quelle souris pour le setup ?'],
    Art: ['Le tirage « Marée » est arrivé, sublime', 'Le process vidéo est hypnotisant', 'Tu prends encore des commandes ?', 'Merci pour les fonds d’écran'],
    default: ['Merci pour ce contenu, vraiment unique', 'Hâte de la suite !', 'Le dernier post était parfait', 'Ravi·e de faire partie du cercle']
  };
  RENDER.community = function (c) {
    var st = c.stats || {};
    var mem = S.members(c.handle, 8);
    var lines = CHAT[c.category] || CHAT.default;
    var ok = canSee('members');
    var own = arr(S.store.get('community:' + c.handle, []));
    var msgs = own.slice(-3).reverse().map(function (o) { return { name: o.name || 'Vous', text: o.text, when: 'À l’instant', me: true }; })
      .concat(lines.map(function (l, i) { return { name: mem[i] ? mem[i].name : 'Membre', text: l, when: ['Il y a 4 min', 'Il y a 22 min', 'Il y a 1 h', 'Il y a 3 h'][i] }; }));
    return '<div class="community card">' +
      '<div class="comm-head"><div class="stack" aria-hidden="true">' + mem.slice(0, 5).map(function (m, i) { return '<span style="--h:' + (i * 57) + '">' + esc(initials(m.name)) + '</span>'; }).join('') + '</div>' +
        '<p><strong>' + S.compact(st.members || 0) + ' membres</strong><span class="online"><i></i>' + Math.max(3, Math.round((st.members || 100) * 0.021)) + ' en ligne</span></p></div>' +
      '<ul class="msgs' + (ok ? '' : ' is-locked') + '">' + msgs.slice(0, 4).map(function (m, i) {
        return '<li class="' + (!ok && i > 0 ? 'blur' : '') + '"><span class="m-av" aria-hidden="true">' + esc(initials(m.name)) + '</span><div><p class="m-name">' + esc(m.name) + ' <span>' + esc(m.when) + '</span></p><p>' + esc(m.text) + '</p></div></li>';
      }).join('') + '</ul>' +
      (ok ? '<form class="comm-form" data-form="community"><label class="sr-only" for="comm-in">Votre message</label><input id="comm-in" class="input" name="text" maxlength="280" placeholder="Écrire aux membres…" required><button class="btn btn-primary btn-sm" type="submit">Envoyer</button></form>'
        : '<div class="comm-lock">' + IC.lock + '<p>La discussion est réservée aux membres.</p><button class="btn btn-primary btn-sm" data-act="' + (tierForLevel('members') ? 'join' : 'goto') + '" data-sec="memberships" data-tier="' + esc((tierForLevel('members') || {}).id || '') + '">Rejoindre la discussion</button></div>') +
    '</div>';
  };

  RENDER.collabs = function (c) {
    var bs = publicCollabs(c);
    if (!bs.length) return '';
    return '<ul class="collabs">' + bs.map(function (b) {
      return '<li class="collab card"><span class="c-brand">' + esc(b.brand) + '</span><span class="c-type">' + esc(b.type || '') + '</span><span class="c-status ' + (b.status === 'live' ? 'live' : '') + '">' + (b.status === 'live' ? '<i></i>En cours' : 'Réalisée') + '</span></li>';
    }).join('') + '</ul>';
  };

  RENDER.newsletter = function (c) {
    var list = arr(S.store.get('newsletter:' + c.handle, []));
    var mine = S.getViewer().email;
    var done = mine && list.some(function (x) { return x.email === mine; });
    return '<div class="newsletter card">' +
      '<span class="nl-ico" aria-hidden="true">' + IC.mail + '</span>' +
      '<p class="nl-text">Une lettre par mois, écrite pour vous : coulisses, adresses, avant-premières. Jamais de spam.</p>' +
      (done ? '<p class="nl-done">' + IC.check + 'Vous êtes inscrit·e avec ' + esc(mine) + '</p>' :
      '<form class="nl-form" data-form="newsletter"><label class="sr-only" for="nl-email">Adresse e-mail</label><input id="nl-email" class="input" type="email" name="email" autocomplete="email" placeholder="votre@email.com" required><button class="btn btn-primary" type="submit">S’inscrire</button></form>') +
    '</div>';
  };

  RENDER.contact = function (c) {
    var pro = c.mediakit && c.mediakit.contact;
    return '<form class="contact card" data-form="contact" novalidate>' +
      '<fieldset class="seg"><legend class="sr-only">Objet</legend>' +
        [['pro', 'Demande pro'], ['collab', 'Collaboration'], ['other', 'Autre']].map(function (o, i) {
          return '<label><input type="radio" name="kind" value="' + o[0] + '"' + (i === 0 ? ' checked' : '') + '><span>' + o[1] + '</span></label>';
        }).join('') + '</fieldset>' +
      '<div class="grid2"><div class="field"><label for="ct-name">Nom</label><input id="ct-name" class="input" name="name" autocomplete="name" required></div>' +
      '<div class="field"><label for="ct-email">E-mail</label><input id="ct-email" class="input" type="email" name="email" autocomplete="email" required></div></div>' +
      '<div class="field"><label for="ct-msg">Message</label><textarea id="ct-msg" class="input textarea" name="message" rows="4" required></textarea></div>' +
      '<div class="contact-foot"><button class="btn btn-primary" type="submit">Envoyer le message</button>' + (pro ? '<a class="muted small" href="mailto:' + esc(pro) + '">' + esc(pro) + '</a>' : '') + '</div>' +
    '</form>';
  };

  function footer(c) {
    return '<footer class="foot">' +
      (arr(c.socials).length ? '<ul class="foot-socials">' + arr(c.socials).map(function (s) {
        return '<li><a href="' + esc(safeUrl(s.url)) + '" target="_blank" rel="noopener" aria-label="' + esc(netName(s.net)) + '">' + UI.icon(s.net, 17) + '</a></li>';
      }).join('') + '</ul>' : '') +
      '<p class="foot-name">© ' + new Date().getFullYear() + ' ' + esc(c.name) + (c.domain ? ' · ' + esc(c.domain) : '') + '</p>' +
      '<p class="foot-legal"><button data-act="legal" data-k="mentions">Mentions légales</button><button data-act="legal" data-k="privacy">Confidentialité</button><button data-act="legal" data-k="cgv">CGV</button></p>' +
      (settings(c).poweredBy === false ? '' : '<a class="powered" href="../"' + (state.preview ? ' target="_blank" rel="noopener"' : '') + '>Powered by <b>SECR<span>3</span>TLY</b></a>') +
    '</footer>';
  }

  function cartFab() {
    var n = state.cart.reduce(function (a, x) { return a + x.qty; }, 0);
    if (!n) return '';
    return '<button class="cart-fab" data-act="cart" aria-label="Ouvrir le panier, ' + n + ' article' + (n > 1 ? 's' : '') + '">' + IC.bag + '<span>Panier</span><b>' + n + '</b></button>';
  }

  /* =================================================================
     BARRE COMPACTE AU SCROLL
     ================================================================= */
  var io;
  function setupTopbar() {
    var bar = $('#topbar'), idEl = $('.id-actions');
    if (!bar || !idEl) return;
    if (io) io.disconnect();
    if (!('IntersectionObserver' in window)) return;
    io = new IntersectionObserver(function (en) {
      var show = !en[0].isIntersecting && en[0].boundingClientRect.top < 0;
      bar.classList.toggle('show', show);
      bar.setAttribute('aria-hidden', String(!show));
      $$('[tabindex]', bar).forEach(function (el) { el.tabIndex = show ? 0 : -1; });
    });
    io.observe(idEl);
  }

  /* =================================================================
     MODALES (piège du focus, Échap, retour du focus)
     ================================================================= */
  var modal = null;
  function openModal(html, opts) {
    opts = opts || {};
    closeModal(true);
    var wrap = document.createElement('div');
    wrap.className = 'modal-wrap' + (opts.kind ? ' is-' + opts.kind : '');
    wrap.innerHTML = '<div class="modal-back" data-act="close"></div>' +
      '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">' +
        '<button class="modal-x" data-act="close" aria-label="Fermer">' + IC.close + '</button>' +
        '<div class="modal-body">' + html + '</div></div>';
    document.body.appendChild(wrap);
    modal = { el: wrap, last: document.activeElement, onClose: opts.onClose };
    document.documentElement.classList.add('locked');
    requestAnimationFrame(function () { wrap.classList.add('open'); focusFirst(); });
    return wrap;
  }
  function setModal(html) {
    if (!modal) return;
    $('.modal-body', modal.el).innerHTML = html;
    focusFirst();
  }
  function focusFirst() {
    if (!modal) return;
    var f = $('[autofocus]', modal.el) || $('.modal-body h2, .modal-body [tabindex="-1"]', modal.el);
    if (f && f.tagName === 'H2') f.setAttribute('tabindex', '-1');
    (f || $('.modal-x', modal.el)).focus({ preventScroll: true });
  }
  function closeModal(silent) {
    if (!modal) return;
    var m = modal; modal = null;
    m.el.classList.remove('open');
    document.documentElement.classList.remove('locked');
    setTimeout(function () { m.el.remove(); }, animLevel() === 'none' ? 0 : 280);
    if (!silent && m.last && m.last.focus && document.contains(m.last)) m.last.focus({ preventScroll: true });
    if (!silent && m.onClose) m.onClose();
  }
  document.addEventListener('keydown', function (e) {
    if (lightbox && (e.key === 'ArrowRight' || e.key === 'ArrowLeft')) { stepLightbox(e.key === 'ArrowRight' ? 1 : -1); return; }
    if (!modal) return;
    if (e.key === 'Escape') { e.preventDefault(); closeModal(); return; }
    if (e.key === 'Tab') {
      var f = $$('a[href],button:not([disabled]),input:not([disabled]),textarea,select,[tabindex]:not([tabindex="-1"])', modal.el).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && (document.activeElement === first || !modal.el.contains(document.activeElement))) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  /* ---------- Paiement de démonstration ---------- */
  function demoPayFields() {
    var v = S.getViewer();
    return '<div class="grid2"><div class="field"><label for="pay-name">Nom complet</label><input id="pay-name" class="input" name="name" autocomplete="name" value="' + esc(v.name || '') + '" required></div>' +
      '<div class="field"><label for="pay-email">E-mail</label><input id="pay-email" class="input" type="email" name="email" autocomplete="email" value="' + esc(v.email || '') + '" required></div></div>' +
      '<div class="demo-card"><p class="demo-flag">' + IC.lock.replace('width="18" height="18"', 'width="13" height="13"') + 'Démo — aucun paiement réel</p>' +
        '<div class="field"><label for="pay-cc">Numéro de carte</label><input id="pay-cc" class="input" inputmode="numeric" value="4242 4242 4242 4242" autocomplete="off" aria-describedby="demo-note"></div>' +
        '<div class="grid2"><div class="field"><label for="pay-exp">Expiration</label><input id="pay-exp" class="input" value="12 / 29" autocomplete="off"></div><div class="field"><label for="pay-cvc">CVC</label><input id="pay-cvc" class="input" value="123" autocomplete="off"></div></div>' +
        '<p class="small muted" id="demo-note">Prototype : aucune carte n’est débitée, aucune donnée bancaire n’est envoyée.</p></div>';
  }
  function readPayForm(form) {
    var name = form.name.value.trim(), email = form.email.value.trim();
    if (!name || !/^\S+@\S+\.\S+$/.test(email)) {
      UI.toast('Indiquez un nom et un e-mail valides');
      (!name ? form.name : form.email).focus();
      return null;
    }
    if (!state.preview) { var v = S.getViewer(); v.name = name; v.email = email; S.saveViewer(v); }
    return { name: name, email: email };
  }
  function processing(label) {
    setModal('<div class="processing" role="status"><span class="spinner" aria-hidden="true"></span><h2 id="modal-title" class="m-title">' + esc(label || 'Paiement sécurisé…') + '</h2><p class="muted">Un instant.</p></div>');
  }
  function success(title, text, btn) {
    setModal('<div class="success"><span class="burst" aria-hidden="true"><svg viewBox="0 0 52 52"><circle cx="26" cy="26" r="24" fill="none"/><path d="m15 27 7.5 7.5L38 19" fill="none"/></svg></span>' +
      '<h2 id="modal-title" class="m-title">' + esc(title) + '</h2><p class="muted">' + esc(text) + '</p>' +
      '<button class="btn btn-primary btn-block" data-act="close" autofocus>' + esc(btn || 'Continuer') + '</button></div>');
  }
  function delay(fn) { setTimeout(fn, animLevel() === 'none' ? 250 : 1100); }

  /* ---------- Rejoindre (abonnement) ---------- */
  function openJoin(tierId) {
    var tier = tierById(tierId) || tierForLevel('members') || paidTiers()[0];
    if (!tier) { UI.toast('Aucun abonnement disponible'); return; }
    if (tier.inviteOnly) return openInvite(tier);
    openModal(joinStep1(tier.id), { kind: 'sheet' });
  }
  function joinStep1(selId) {
    var c = state.creator;
    var tiers = paidTiers().filter(function (t) { return !t.inviteOnly; });
    var hasYearly = tiers.some(function (t) { return t.yearly; });
    return '<div class="m-head">' + avatar(c, 44) + '<div><p class="eyebrow">Rejoindre ' + esc(c.name) + '</p><h2 id="modal-title" class="m-title">Choisissez votre accès</h2></div></div>' +
      (hasYearly ? '<div class="period small-p" role="radiogroup" aria-label="Période"><button role="radio" data-act="m-period" data-p="month" data-sel="' + esc(selId) + '" aria-checked="' + (state.period === 'month') + '">Mensuel</button><button role="radio" data-act="m-period" data-p="year" data-sel="' + esc(selId) + '" aria-checked="' + (state.period === 'year') + '">Annuel</button></div>' : '') +
      '<form data-form="join1"><div class="opts" role="radiogroup" aria-label="Formules">' + tiers.map(function (t) {
        var y = state.period === 'year' && t.yearly;
        return '<label class="opt"><input type="radio" name="tier" value="' + esc(t.id) + '"' + (t.id === selId ? ' checked' : '') + '>' +
          '<span class="opt-in"><span class="opt-top"><strong>' + esc(t.name) + '</strong>' + lvlBadge(t.level) + '<span class="opt-price">' + money(y ? t.yearly : t.price) + '<small>/' + (y ? 'an' : 'mois') + '</small></span></span>' +
          '<span class="opt-perks">' + esc(arr(t.perks).slice(0, 3).join(' · ')) + '</span>' +
          (t.trialDays ? '<span class="opt-trial">' + t.trialDays + ' jours offerts</span>' : '') + (t.promo ? '<span class="opt-trial">' + esc(t.promo) + '</span>' : '') + '</span></label>';
      }).join('') + '</div>' +
      '<button class="btn btn-primary btn-block" type="submit">Continuer ' + IC.arrow + '</button></form>';
  }
  function joinStep2(tier) {
    var y = state.period === 'year' && tier.yearly;
    var amount = y ? tier.yearly : tier.price;
    return '<div class="m-head"><button class="back" data-act="join-back" data-sel="' + esc(tier.id) + '" aria-label="Retour">' + IC.chevL + '</button><div><p class="eyebrow">Paiement</p><h2 id="modal-title" class="m-title">' + esc(tier.name) + '</h2></div></div>' +
      '<div class="summary"><span>' + esc(tier.name) + ' · ' + (y ? 'annuel' : 'mensuel') + '</span><strong>' + money(amount) + '/' + (y ? 'an' : 'mois') + '</strong></div>' +
      (tier.trialDays ? '<p class="small muted">Aujourd’hui : 0 € — ' + tier.trialDays + ' jours d’essai, puis ' + money(amount) + '/' + (y ? 'an' : 'mois') + '. Résiliable à tout moment.</p>' : '') +
      '<form data-form="join2" data-tier="' + esc(tier.id) + '">' + demoPayFields() +
      '<button class="btn btn-primary btn-block" type="submit">' + (tier.trialDays ? 'Commencer l’essai gratuit' : 'Confirmer · ' + money(amount)) + '</button></form>';
  }
  function completeJoin(tier) {
    if (state.preview) state.as = tier.level;
    else { state.as = null; S.join(state.handle, tier); }
    render({ keepScroll: true });
  }

  function openInvite(tier) {
    var v = S.getViewer();
    openModal('<div class="m-head">' + avatar(state.creator, 44) + '<div><p class="eyebrow">' + esc(tier.name) + ' · sur invitation</p><h2 id="modal-title" class="m-title">Demander une invitation</h2></div></div>' +
      '<p class="muted">Le cercle ' + esc(tier.name) + ' est volontairement restreint' + (tier.limited ? ' à ' + tier.limited + ' personnes' : '') + '. ' + esc(firstName(state.creator)) + ' étudie chaque demande personnellement.</p>' +
      '<form data-form="invite" data-tier="' + esc(tier.id) + '">' +
      '<div class="grid2"><div class="field"><label for="inv-name">Nom</label><input id="inv-name" class="input" name="name" value="' + esc(v.name || '') + '" required></div>' +
      '<div class="field"><label for="inv-email">E-mail</label><input id="inv-email" class="input" type="email" name="email" value="' + esc(v.email || '') + '" required></div></div>' +
      '<div class="field"><label for="inv-msg">Quelques mots sur vous</label><textarea id="inv-msg" class="input textarea" name="message" rows="3" placeholder="Pourquoi souhaitez-vous rejoindre ce cercle ?"></textarea></div>' +
      '<button class="btn btn-primary btn-block" type="submit">Envoyer ma demande</button></form>', { kind: 'sheet' });
  }

  function openManage() {
    var m = currentMembership();
    if (!m) return openJoin();
    var t = tierById(m.tier) || tierForLevel(m.level, true);
    var since = m.since ? new Date(m.since).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' }) : '';
    openModal('<div class="m-head">' + avatar(state.creator, 44) + '<div><p class="eyebrow">Mon accès</p><h2 id="modal-title" class="m-title">' + esc(t ? t.name : LEVEL_NAME[m.level]) + '</h2></div></div>' +
      '<div class="summary"><span>' + lvlBadge(m.level) + '</span><strong>' + (t ? money(t.price) + '/mois' : '') + '</strong></div>' +
      (since ? '<p class="small muted">Membre depuis le ' + esc(since) + '. Prochain renouvellement dans 30 jours.</p>' : '') +
      (m.sim ? '<p class="small muted">Accès simulé (aperçu).</p>' : '') +
      '<div class="stack-btns"><button class="btn btn-ghost btn-block" data-act="change-tier">Changer de formule</button>' +
      '<button class="btn btn-ghost btn-block danger" data-act="cancel-sub">Résilier mon abonnement</button></div>', { kind: 'sheet' });
  }

  /* ---------- Achats unitaires (PPV, événements) ---------- */
  function openPurchase(item) {
    openModal('<div class="m-head"><div class="m-thumb">' + artHtml(item.art || state.creator.cover) + '</div><div><p class="eyebrow">' + esc(item.kind) + '</p><h2 id="modal-title" class="m-title">' + esc(item.title) + '</h2></div></div>' +
      '<div class="summary"><span>' + esc(item.note || 'Accès permanent') + '</span><strong>' + money(item.amount) + '</strong></div>' +
      '<form data-form="purchase" data-id="' + esc(item.id) + '" data-amount="' + item.amount + '" data-done="' + esc(item.done || 'Débloqué') + '">' + demoPayFields() +
      '<button class="btn btn-primary btn-block" type="submit">Payer ' + money(item.amount) + '</button></form>', { kind: 'sheet' });
  }
  function recordPurchase(id, amount) {
    if (state.preview) state.simPurchases[id] = true;
    else S.purchase(state.handle, id, amount);
  }

  /* ---------- Fiche publication ---------- */
  function openPost(p) {
    var c = state.creator;
    var mem = S.members(c.handle + p.id, 3);
    var lines = (CHAT[c.category] || CHAT.default);
    openModal('<div class="post-sheet"><div class="ps-media">' + artHtml(p.art, p.title) + (p.type === 'video' ? '<span class="play" aria-hidden="true">' + IC.play + '</span>' : '') + '</div>' +
      '<div class="ps-body"><p class="eyebrow">' + esc(relDate(p.date)) + (p.duration ? ' · ' + esc(p.duration) : '') + (p.count ? ' · ' + esc(p.count) + ' photos' : '') + '</p>' +
      '<h2 id="modal-title" class="m-title">' + esc(p.title) + '</h2>' + (p.caption ? '<p class="muted">' + esc(p.caption) + '</p>' : '') +
      '<p class="small muted ps-count">' + S.compact(p.likes || 0) + ' j’aime · ' + S.compact(p.comments || 0) + ' commentaires</p>' +
      '<ul class="msgs">' + mem.map(function (m, i) { return '<li><span class="m-av" aria-hidden="true">' + esc(initials(m.name)) + '</span><div><p class="m-name">' + esc(m.name) + '</p><p>' + esc(lines[(i + 1) % lines.length]) + '</p></div></li>'; }).join('') + '</ul></div></div>', { kind: 'wide' });
  }

  /* ---------- Lightbox ---------- */
  var lightbox = null;
  function openLightbox(i) {
    var items = galleryItems(state.creator).filter(function (x) { return !x.locked; });
    var all = galleryItems(state.creator);
    var target = all[i];
    var idx = Math.max(0, items.indexOf(items.filter(function (x) { return x.id === target.id; })[0]));
    lightbox = { items: items, i: idx };
    openModal('<div class="lb"></div>', { kind: 'lightbox', onClose: function () { lightbox = null; } });
    paintLightbox();
  }
  function paintLightbox() {
    if (!lightbox || !modal) return;
    var it = lightbox.items[lightbox.i];
    var n = lightbox.items.length;
    $('.lb', modal.el).innerHTML = '<div class="lb-media">' + artHtml(it.art, it.title) + '</div>' +
      '<div class="lb-cap"><h2 id="modal-title" class="m-title">' + esc(it.title) + '</h2><span>' + (lightbox.i + 1) + ' / ' + n + '</span>' +
      (it.kind === 'product' ? '<button class="btn btn-ghost btn-sm" data-act="product" data-id="' + esc(it.id) + '">Voir en boutique</button>' : '') + '</div>' +
      (n > 1 ? '<button class="lb-nav prev" data-act="lb" data-d="-1" aria-label="Image précédente">' + IC.chevL + '</button><button class="lb-nav next" data-act="lb" data-d="1" aria-label="Image suivante">' + IC.chevR + '</button>' : '');
  }
  function stepLightbox(d) {
    if (!lightbox) return;
    var n = lightbox.items.length;
    lightbox.i = (lightbox.i + d + n) % n;
    paintLightbox();
  }

  /* ---------- Boutique & panier ---------- */
  function productById(id) { return arr(state.creator.products).filter(function (p) { return p.id === id; })[0]; }
  function openProduct(id) {
    var p = productById(id); if (!p) return;
    var pp = productPrice(p), owned = purchased(p.id), d = vipDiscount();
    var inCart = state.cart.some(function (x) { return x.id === id; });
    openModal('<div class="product-sheet"><div class="ps-media">' + artHtml(p.art, p.name) + '</div><div class="ps-body">' +
      '<p class="eyebrow">' + esc(TYPE_LABEL[p.type] || p.type) + '</p><h2 id="modal-title" class="m-title">' + esc(p.name) + '</h2>' +
      '<p class="ps-price">' + money(pp.price) + (pp.was ? ' <s>' + money(pp.was) + '</s>' : '') + '</p>' +
      '<p class="muted">' + esc(p.desc || TYPE_DESC[p.type] || '') + '</p>' +
      (p.stock != null ? '<p class="small muted">' + (p.stock <= 12 ? 'Plus que ' + esc(p.stock) + ' en stock' : 'En stock') + '</p>' : '') +
      (d && !pp.was && p.type !== 'experience' ? '<p class="shop-note">' + IC.spark + '−' + d.pct + ' % pour les membres ' + esc(d.tier.name) + '</p>' : '') +
      (owned ? '<p class="nl-done">' + IC.check + 'Déjà acheté — disponible dans votre bibliothèque</p>' :
        '<button class="btn btn-primary btn-block" data-act="add-cart" data-id="' + esc(p.id) + '">' + (inCart ? 'Ajouter encore' : 'Ajouter au panier') + ' · ' + money(pp.price) + '</button>' +
        '<button class="btn btn-ghost btn-block" data-act="buy-now" data-id="' + esc(p.id) + '">Acheter maintenant</button>') +
      '</div></div>', { kind: 'wide' });
  }
  function saveCart() { S.store.set('cart:' + state.handle, state.cart); }
  function addToCart(id) {
    var p = productById(id); if (!p) return;
    var line = state.cart.filter(function (x) { return x.id === id; })[0];
    var single = p.type !== 'physical' && p.type !== 'merch';
    if (line) { if (!single) line.qty++; } else state.cart.push({ id: id, qty: 1 });
    saveCart();
    refreshFab();
  }
  function refreshFab() {
    var old = $('.cart-fab'); if (old) old.remove();
    var html = cartFab();
    if (html) { app.insertAdjacentHTML('beforeend', html); }
  }
  function cartTotal() {
    return state.cart.reduce(function (a, x) { var p = productById(x.id); return a + (p ? productPrice(p).price * x.qty : 0); }, 0);
  }
  function cartHtml() {
    state.cart = state.cart.filter(function (x) { return productById(x.id); });
    if (!state.cart.length) return '<h2 id="modal-title" class="m-title">Votre panier</h2><div class="empty">Votre panier est vide.</div><button class="btn btn-ghost btn-block" data-act="close">Continuer la visite</button>';
    return '<h2 id="modal-title" class="m-title">Votre panier</h2><ul class="cart">' + state.cart.map(function (x) {
      var p = productById(x.id), pp = productPrice(p), single = p.type !== 'physical' && p.type !== 'merch';
      return '<li><span class="c-thumb">' + artHtml(p.art) + '</span><div class="c-info"><strong>' + esc(p.name) + '</strong><span>' + esc(TYPE_LABEL[p.type] || p.type) + ' · ' + money(pp.price) + '</span></div>' +
        '<div class="qty">' + (single ? '' : '<button data-act="qty" data-id="' + esc(p.id) + '" data-d="-1" aria-label="Retirer un">−</button><span>' + x.qty + '</span><button data-act="qty" data-id="' + esc(p.id) + '" data-d="1" aria-label="Ajouter un">+</button>') +
        '<button class="rm" data-act="rm-cart" data-id="' + esc(p.id) + '" aria-label="Supprimer ' + esc(p.name) + '">' + IC.close + '</button></div></li>';
    }).join('') + '</ul><div class="summary"><span>Total</span><strong>' + money(cartTotal()) + '</strong></div>' +
    '<button class="btn btn-primary btn-block" data-act="checkout">Passer au paiement</button>';
  }
  function openCart() { openModal(cartHtml(), { kind: 'drawer' }); }
  function checkoutHtml() {
    return '<div class="m-head"><button class="back" data-act="cart-back" aria-label="Retour au panier">' + IC.chevL + '</button><div><p class="eyebrow">Paiement</p><h2 id="modal-title" class="m-title">Finaliser la commande</h2></div></div>' +
      '<div class="summary"><span>' + state.cart.length + ' article' + (state.cart.length > 1 ? 's' : '') + '</span><strong>' + money(cartTotal()) + '</strong></div>' +
      '<form data-form="checkout">' + demoPayFields() + '<button class="btn btn-primary btn-block" type="submit">Payer ' + money(cartTotal()) + '</button></form>';
  }

  /* ---------- Mentions ---------- */
  var LEGAL = {
    mentions: ['Mentions légales', 'Cet univers est édité par {name} et hébergé par SECR3TLY. Les contenus publiés restent la propriété de leur auteur·rice. Toute reproduction sans autorisation est interdite.'],
    privacy: ['Confidentialité', 'Vos données (e-mail, abonnements, achats) servent uniquement à vous donner accès aux contenus de {name}. Dans ce prototype, elles restent stockées dans votre navigateur.'],
    cgv: ['Conditions de vente', 'Les abonnements sont sans engagement et résiliables à tout moment. Les contenus numériques sont accessibles immédiatement après l’achat. Prototype : aucun paiement réel.']
  };

  /* =================================================================
     ÉVÉNEMENTS (délégation)
     ================================================================= */
  document.addEventListener('click', function (e) {
    var el = e.target.closest('[data-act]');
    if (!el) return;
    var act = el.getAttribute('data-act'), id = el.getAttribute('data-id');
    var c = state.creator;
    switch (act) {
      case 'close': e.preventDefault(); closeModal(); break;
      case 'top': e.preventDefault(); window.scrollTo({ top: 0, behavior: animLevel() === 'none' ? 'auto' : 'smooth' }); break;
      case 'goto': e.preventDefault(); closeModal(true); gotoSection(el.getAttribute('data-sec')); break;
      case 'follow':
        if (state.preview) { UI.toast('Aperçu : action désactivée'); break; }
        var on = S.toggleFollow(c.handle);
        UI.toast(on ? 'Vous suivez ' + c.name : 'Vous ne suivez plus ' + c.name);
        render({ keepScroll: true }); break;
      case 'share': shareUrl(pageUrl(), c.name); break;
      case 'share-post': shareUrl(pageUrl('feed'), c.name); break;
      case 'link':
        track('click', { link: id, slug: el.getAttribute('data-slug') });
        var href = el.getAttribute('href') || '';
        if (href.charAt(0) === '#') { e.preventDefault(); var sec = href.slice(1) || 'links'; if (/video/i.test(el.getAttribute('data-slug') || '')) state.filter = 'video'; if (sec === 'feed') render({ keepScroll: true }); gotoSection(sec); }
        if (href === '#' || href === '') UI.toast('Lien bientôt disponible');
        break;
      case 'external': track('click', { link: 'external' }); break;
      case 'promo-link': track('click', { promo: id }); break;
      case 'filter':
        state.filter = el.getAttribute('data-f');
        var feedSec = $('#sec-feed');
        if (feedSec) { var y = window.scrollY; feedSec.outerHTML = sectionHtml('feed', c); var ns = $('#sec-feed'); ns.classList.add('in'); window.scrollTo(0, y); var btn = $('[data-act="filter"][data-f="' + state.filter + '"]'); if (btn) btn.focus({ preventScroll: true }); }
        break;
      case 'like':
        var liked = S.toggleLike(c.handle, id);
        var p = posts(c).filter(function (x) { return x.id === id; })[0];
        el.classList.toggle('on', liked); el.setAttribute('aria-pressed', String(liked));
        el.querySelector('span').textContent = S.compact(((p && p.likes) || 0) + (liked ? 1 : 0));
        if (liked && animLevel() !== 'none') { el.classList.remove('pop'); void el.offsetWidth; el.classList.add('pop'); }
        break;
      case 'noop-locked': UI.toast('Débloquez ce contenu pour voir les commentaires'); break;
      case 'open-post': var pp = posts(c).filter(function (x) { return x.id === id; })[0]; if (pp) openPost(pp); break;
      case 'join': openJoin(el.getAttribute('data-tier')); break;
      case 'manage': openManage(); break;
      case 'period': state.period = el.getAttribute('data-p'); var ms = $('#sec-memberships'); if (ms) { ms.outerHTML = sectionHtml('memberships', c); $('#sec-memberships').classList.add('in'); $('[data-act="period"][data-p="' + state.period + '"]').focus({ preventScroll: true }); } break;
      case 'm-period': state.period = el.getAttribute('data-p'); var sel = $('input[name="tier"]:checked', modal && modal.el); setModal(joinStep1(sel ? sel.value : el.getAttribute('data-sel'))); break;
      case 'join-back': setModal(joinStep1(el.getAttribute('data-sel'))); break;
      case 'change-tier': setModal(joinStep1((currentMembership() || {}).tier)); break;
      case 'cancel-sub':
        setModal('<h2 id="modal-title" class="m-title">Résilier votre abonnement ?</h2><p class="muted">Vous perdrez l’accès aux contenus réservés ' + esc(deName(c.name)) + '. Vous pourrez revenir à tout moment.</p>' +
          '<div class="stack-btns"><button class="btn btn-primary btn-block" data-act="close" autofocus>Garder mon accès</button><button class="btn btn-ghost btn-block danger" data-act="cancel-confirm">Confirmer la résiliation</button></div>');
        break;
      case 'cancel-confirm':
        if (state.preview || state.as) state.as = 'public'; else S.leave(c.handle);
        if (!state.preview && state.as === 'public') state.as = null;
        closeModal(true); UI.toast('Abonnement résilié'); render({ keepScroll: true }); break;
      case 'buy-post':
        var bp = posts(c).filter(function (x) { return x.id === id; })[0];
        if (bp) openPurchase({ id: bp.id, title: bp.title, art: bp.art, amount: bp.price, kind: bp.type === 'bundle' ? 'Bundle' : 'Contenu à l’unité', note: 'Accès permanent, sans abonnement', done: 'Contenu débloqué' });
        break;
      case 'unlock-item':
        var gi = galleryItems(c)[Number(el.getAttribute('data-i'))];
        if (gi && gi.post) { if (gi.post.price) el.closest('.m-item') && openPurchase({ id: gi.post.id, title: gi.post.title, art: gi.post.art, amount: gi.post.price, kind: 'Contenu à l’unité', done: 'Contenu débloqué' }); else openJoin((tierForLevel(gi.post.access) || {}).id); }
        break;
      case 'lightbox': openLightbox(Number(el.getAttribute('data-i'))); break;
      case 'lb': stepLightbox(Number(el.getAttribute('data-d'))); break;
      case 'book':
        var ev = arr(c.events).filter(function (x) { return x.id === id; })[0];
        if (!ev) break;
        if (ev.price) openPurchase({ id: ev.id, title: ev.title, art: c.cover, amount: ev.price, kind: 'Réservation', note: eventDate(ev.date).full, done: 'Place réservée' });
        else { recordPurchase(ev.id, 0); UI.toast('Place réservée — à bientôt !'); render({ keepScroll: true }); }
        break;
      case 'copy': UI.copy(el.getAttribute('data-code'), 'Code ' + el.getAttribute('data-code') + ' copié'); track('click', { code: el.getAttribute('data-code') }); break;
      case 'product': closeModal(true); lightbox = null; openProduct(id); break;
      case 'add-cart': addToCart(id); closeModal(true); UI.toast('Ajouté au panier'); break;
      case 'buy-now': addToCart(id); setModal(checkoutHtml()); break;
      case 'cart': openCart(); break;
      case 'qty':
        state.cart.forEach(function (x) { if (x.id === id) x.qty = Math.max(0, x.qty + Number(el.getAttribute('data-d'))); });
        state.cart = state.cart.filter(function (x) { return x.qty > 0; }); saveCart(); setModal(cartHtml()); refreshFab(); break;
      case 'rm-cart': state.cart = state.cart.filter(function (x) { return x.id !== id; }); saveCart(); setModal(cartHtml()); refreshFab(); break;
      case 'checkout': setModal(checkoutHtml()); break;
      case 'cart-back': setModal(cartHtml()); break;
      case 'legal':
        var L = LEGAL[el.getAttribute('data-k')];
        openModal('<h2 id="modal-title" class="m-title">' + esc(L[0]) + '</h2><p class="muted">' + esc(L[1].replace('{name}', c.name)) + '</p><button class="btn btn-ghost btn-block" data-act="close">Fermer</button>', { kind: 'sheet' });
        break;
    }
  });

  document.addEventListener('submit', function (e) {
    var f = e.target, kind = f.getAttribute('data-form');
    if (!kind) return;
    e.preventDefault();
    var c = state.creator;
    if (kind === 'join1') {
      var t = tierById((f.querySelector('input[name="tier"]:checked') || {}).value);
      if (t) setModal(joinStep2(t));
    } else if (kind === 'join2') {
      var tier = tierById(f.getAttribute('data-tier'));
      if (!readPayForm(f)) return;
      processing();
      delay(function () {
        completeJoin(tier);
        success('Bienvenue dans le cercle', 'Votre accès ' + tier.name + ' est actif : les contenus ' + (LEVEL_NAME[tier.level] || '') + ' sont débloqués.', 'Découvrir mes contenus');
      });
    } else if (kind === 'invite') {
      var it = tierById(f.getAttribute('data-tier'));
      var name = f.name.value.trim(), email = f.email.value.trim();
      if (!name || !/^\S+@\S+\.\S+$/.test(email)) { UI.toast('Indiquez un nom et un e-mail valides'); return; }
      if (!state.preview) { var v = S.getViewer(); v.invites = v.invites || {}; v.invites[c.handle] = { tier: it.id, name: name, email: email, message: f.message.value.trim(), at: Date.now() }; v.name = v.name || name; v.email = v.email || email; S.saveViewer(v); }
      processing('Envoi de votre demande…');
      delay(function () { render({ keepScroll: true }); success('Demande envoyée', firstName(c) + ' vous répondra personnellement par e-mail.', 'Fermer'); });
    } else if (kind === 'purchase') {
      if (!readPayForm(f)) return;
      var pid = f.getAttribute('data-id'), amt = Number(f.getAttribute('data-amount')), done = f.getAttribute('data-done');
      processing();
      delay(function () { recordPurchase(pid, amt); render({ keepScroll: true }); success(done, 'Accès permanent, retrouvez-le à tout moment ici.', 'Voir'); });
    } else if (kind === 'checkout') {
      if (!readPayForm(f)) return;
      processing();
      delay(function () {
        state.cart.forEach(function (x) { var p = productById(x.id); if (p) recordPurchase(p.id, productPrice(p).price * x.qty); });
        state.cart = []; saveCart();
        render({ keepScroll: true });
        success('Merci pour votre commande', 'Un récapitulatif vous a été envoyé par e-mail. Les contenus numériques sont déjà disponibles.', 'Fermer');
      });
    } else if (kind === 'newsletter') {
      var em = f.email.value.trim();
      if (!/^\S+@\S+\.\S+$/.test(em)) { UI.toast('Adresse e-mail invalide'); return; }
      if (!state.preview) {
        var list = arr(S.store.get('newsletter:' + c.handle, []));
        if (!list.some(function (x) { return x.email === em; })) list.push({ email: em, at: Date.now() });
        S.store.set('newsletter:' + c.handle, list);
        var vw = S.getViewer(); if (!vw.email) { vw.email = em; S.saveViewer(vw); }
      }
      UI.toast('Inscription confirmée — à très vite');
      var ns = $('#sec-newsletter'); if (ns && !state.preview) { ns.outerHTML = sectionHtml('newsletter', c); $('#sec-newsletter').classList.add('in'); }
    } else if (kind === 'contact') {
      var data = { kind: (f.querySelector('input[name="kind"]:checked') || {}).value, name: f.name.value.trim(), email: f.email.value.trim(), message: f.message.value.trim(), at: Date.now() };
      if (!data.name || !/^\S+@\S+\.\S+$/.test(data.email) || !data.message) { UI.toast('Merci de remplir tous les champs'); return; }
      if (!state.preview) { var cl = arr(S.store.get('contact:' + c.handle, [])); cl.push(data); S.store.set('contact:' + c.handle, cl); }
      f.reset();
      UI.toast('Message envoyé à ' + c.name);
    } else if (kind === 'community') {
      var txt = f.text.value.trim(); if (!txt) return;
      if (!state.preview) { var own = arr(S.store.get('community:' + c.handle, [])); own.push({ name: S.getViewer().name || 'Vous', text: txt, at: Date.now() }); S.store.set('community:' + c.handle, own.slice(-50)); }
      var cs = $('#sec-community'); if (cs) { cs.outerHTML = sectionHtml('community', c); $('#sec-community').classList.add('in'); }
      UI.toast('Message publié');
    }
  });

  function pageUrl(sec) {
    var base = S.BASE + 'c/?u=' + encodeURIComponent(state.handle);
    return base + (sec ? '&s=' + encodeURIComponent(sec) : '');
  }
  function shareUrl(url, title) {
    if (navigator.share && !state.preview) { navigator.share({ title: title, url: url }).catch(function () { /* annulé */ }); return; }
    UI.copy(url, 'Lien copié');
  }

  /* =================================================================
     SMART LINKS (&s=)
     ================================================================= */
  var ALIASES = { vip: 'memberships', abonnement: 'memberships', abonnements: 'memberships', join: 'memberships', rejoindre: 'memberships', membership: 'memberships', private: 'memberships',
    video: 'feed', videos: 'feed', posts: 'feed', contenus: 'feed', event: 'events', evenements: 'events', agenda: 'events', boutique: 'shop', store: 'shop',
    codes: 'promos', promo: 'promos', galerie: 'gallery', photos: 'gallery', album: 'gallery', albums: 'gallery', liens: 'links', link: 'links', newsletters: 'newsletter', lettre: 'newsletter', collab: 'collabs', communaute: 'community' };
  function resolveSmart(s) {
    var c = state.creator;
    if (!s) return null;
    var ids = S.SECTIONS.map(function (x) { return x.id; });
    if (s === 'video' || s === 'videos') return { sec: 'feed', filter: 'video' };
    if (ALIASES[s] && (s === 'vip' || s === 'event' || !arr(c.links).some(function (l) { return l.slug === s; }))) return { sec: ALIASES[s] };
    if (ids.indexOf(s) >= 0) return { sec: s };
    var l = arr(c.links).filter(function (x) { return (x.slug || '').toLowerCase() === s; })[0];
    if (l) {
      if (/^#/.test(l.url) && l.url.length > 1) return { sec: l.url.slice(1), link: l.id };
      return { sec: 'links', link: l.id };
    }
    if (ALIASES[s]) return { sec: ALIASES[s] };
    return null;
  }
  function gotoSection(sec, linkId) {
    var el = $('#sec-' + sec);
    if (!el && sec === 'memberships') { openJoin(); return; }
    if (!el) return;
    var target = linkId ? ($('[data-act="link"][data-id="' + linkId + '"]') || el) : el;
    var smooth = animLevel() !== 'none';
    var top = target.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top: Math.max(0, top), behavior: smooth ? 'smooth' : 'auto' });
    target.classList.remove('is-target'); void target.offsetWidth; target.classList.add('is-target');
    setTimeout(function () { target.classList.remove('is-target'); }, 2600);
    el.classList.add('in');
  }

  /* =================================================================
     SEO
     ================================================================= */
  function meta(attr, key, val) {
    var m = document.head.querySelector('meta[' + attr + '="' + key + '"]');
    if (!m) { m = document.createElement('meta'); m.setAttribute(attr, key); document.head.appendChild(m); }
    m.setAttribute('content', val);
  }
  function setSeo(c) {
    var seo = c.seo || {};
    var title = seo.title || (c.name + (c.tagline ? ' — ' + c.tagline : ''));
    var desc = seo.description || c.bio || c.tagline || '';
    var url = pageUrl();
    var img = c.coverImg || (c.avatar && c.avatar.img) || (S.BASE + 'assets/og-image.jpg');
    document.title = title;
    meta('name', 'description', desc);
    meta('property', 'og:title', title);
    meta('property', 'og:description', desc);
    meta('property', 'og:url', url);
    meta('property', 'og:image', img);
    meta('property', 'og:type', 'profile');
    meta('property', 'profile:username', c.handle);
    meta('name', 'twitter:title', title);
    meta('name', 'twitter:description', desc);
    var can = document.head.querySelector('link[rel="canonical"]');
    if (!can) { can = document.createElement('link'); can.rel = 'canonical'; document.head.appendChild(can); }
    can.href = url;
    meta('name', 'robots', state.preview || (c.seo && c.seo.noindex) ? 'noindex' : 'index, follow');
    var ld = document.getElementById('ld-profile');
    if (!ld) { ld = document.createElement('script'); ld.type = 'application/ld+json'; ld.id = 'ld-profile'; document.head.appendChild(ld); }
    ld.textContent = JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      name: title,
      url: url,
      description: desc,
      mainEntity: {
        '@type': 'Person',
        name: c.name,
        alternateName: c.pseudo || ('@' + c.handle),
        description: c.bio || '',
        image: (c.avatar && c.avatar.img) || img,
        homeLocation: c.location ? { '@type': 'Place', name: c.location } : undefined,
        sameAs: arr(c.socials).map(function (s) { return s.url; }).filter(function (u) { return /^https?:/.test(u); }).concat(c.externalUrl ? [c.externalUrl] : []),
        interactionStatistic: { '@type': 'InteractionCounter', interactionType: 'https://schema.org/FollowAction', userInteractionCount: (c.stats && c.stats.followers) || 0 }
      }
    }).replace(/</g, '\\u003c');
  }

  /* =================================================================
     PAGES SPÉCIALES
     ================================================================= */
  function renderUnknown() {
    TH.apply({ preset: 'premium' });
    document.documentElement.setAttribute('data-card', 'glass');
    document.documentElement.setAttribute('data-btn', 'pill');
    state.theme = TH.resolve({ preset: 'premium' });
    document.title = 'Univers introuvable · SECR3TLY';
    meta('name', 'robots', 'noindex');
    meta('name', 'description', 'Cet univers créateur n’existe pas (encore).');
    var h = state.handle;
    app.innerHTML = '<main id="main" class="solo" tabindex="-1">' +
      '<div class="solo-orb" aria-hidden="true">' + artHtml({ a: '#e8b4bc', b: '#9c7fa6', pattern: 'veil' }) + '<span>?</span></div>' +
      '<p class="eyebrow">' + (h ? '@' + esc(h) : 'Univers introuvable') + '</p>' +
      '<h1 class="solo-title">Cet univers n’existe pas <em>(encore)</em>.</h1>' +
      '<p class="solo-text">' + (h ? 'Personne n’a encore réservé ce nom. Il pourrait devenir le vôtre : un créateur, un univers, un lien.' : 'Aucun créateur n’est indiqué dans ce lien.') + '</p>' +
      '<div class="solo-actions"><a class="btn btn-primary" href="../explore.html">Explorer les univers</a><a class="btn btn-ghost" href="../">Créer mon univers</a></div>' +
      '<a class="powered" href="../">Powered by <b>SECR<span>3</span>TLY</b></a>' +
    '</main>';
  }

  function renderInterstitial(c) {
    applyTheme(c);
    setSeo(c);
    var host = c.domain || c.externalUrl.replace(/^https?:\/\//, '').replace(/\/$/, '');
    app.innerHTML = '<main id="main" class="solo interstitial" tabindex="-1">' +
      (c.coverImg ? '<div class="inter-bg" aria-hidden="true"><img src="' + esc(c.coverImg) + '" alt="" onerror="this.remove()"></div>' : '') +
      '<div class="inter-card">' +
        '<div class="inter-av">' + avatar(c, 104) + '</div>' +
        '<p class="eyebrow">Un univers SECR<span class="sig3">3</span>TLY</p>' +
        '<h1 class="solo-title">Entrer dans l’univers ' + esc(deName(c.name)) + '</h1>' +
        '<p class="solo-text">' + esc(c.tagline || '') + (c.tagline ? ' · ' : '') + esc(host) + '</p>' +
        '<div class="inter-progress" aria-hidden="true"><i></i></div>' +
        '<p class="small muted" id="inter-status" role="status">Ouverture automatique…</p>' +
        '<div class="solo-actions"><a class="btn btn-primary" id="inter-go" href="' + esc(safeUrl(c.externalUrl)) + '">Entrer ' + IC.arrow + '</a><button class="btn btn-ghost" id="inter-stay">Rester ici</button></div>' +
      '</div>' +
      '<a class="powered" href="../">Powered by <b>SECR<span>3</span>TLY</b></a></main>';
    track('visit', { external: true });
    var wait = reduced() ? 3500 : 2600;
    state.redirectTimer = setTimeout(function () {
      if (state.stayed) return;
      $('#inter-status').textContent = 'Ouverture…';
      track('click', { link: 'external' });
      location.href = c.externalUrl;
    }, wait);
    $('#inter-go').addEventListener('click', function () { clearTimeout(state.redirectTimer); track('click', { link: 'external' }); });
    $('#inter-stay').addEventListener('click', function () {
      state.stayed = true; clearTimeout(state.redirectTimer);
      render();
      window.scrollTo(0, 0);
    });
    $('#inter-go').focus({ preventScroll: true });
  }

  /* =================================================================
     APERÇU (studio) — postMessage
     ================================================================= */
  window.addEventListener('message', function (e) {
    if (!state.preview) return;
    var d = e.data;
    if (!d || typeof d !== 'object') return;
    if (d.type === 'secr3tly:preview' && d.creator && typeof d.creator === 'object') {
      state.creator = d.creator;
      if (d.creator.handle) state.handle = String(d.creator.handle).toLowerCase();
      if (modal) closeModal(true);
      render({ keepScroll: state.rendered });
    } else if (d.type === 'secr3tly:as') {
      state.as = LEVEL_IDS.indexOf(d.level) >= 0 ? d.level : null;
      state.simPurchases = {};
      if (state.creator) render({ keepScroll: true });
    }
  });

  /* Rafraîchit les compteurs de stories éphémères */
  setInterval(function () {
    $$('[data-story]').forEach(function (el) {
      var p = posts(state.creator).filter(function (x) { return x.id === el.getAttribute('data-story'); })[0];
      if (p) el.innerHTML = IC.clock + '24 h · ' + esc(storyLeft(p));
    });
  }, 60000);

  /* =================================================================
     DÉMARRAGE
     ================================================================= */
  function boot() {
    var c = state.handle ? S.getCreator(state.handle) : null;
    if (state.preview) {
      try { if (window.parent !== window) window.parent.postMessage({ type: 'secr3tly:ready', handle: state.handle || null }, '*'); } catch (e) { /* ignore */ }
    }
    if (!c) {
      if (state.preview) {
        // en aperçu, on attend l'objet créateur envoyé par le studio
        app.innerHTML = '<main class="solo"><p class="eyebrow">Aperçu</p><h1 class="solo-title">En attente du studio…</h1></main>';
        TH.apply({ preset: 'premium' });
        state.theme = TH.resolve({ preset: 'premium' });
        return;
      }
      renderUnknown();
      return;
    }
    state.creator = c;
    state.handle = c.handle;
    state.cart = arr(S.store.get('cart:' + c.handle, []));
    if (c.externalUrl && !state.preview && !state.section) { renderInterstitial(c); return; }
    render();
    if (!state.preview) track('visit', { s: state.section || null, ref: document.referrer ? 'ref' : 'direct' });
    var smart = resolveSmart(state.section);
    if (smart) {
      if (smart.filter) { state.filter = smart.filter; render({ keepScroll: true }); }
      setTimeout(function () { gotoSection(smart.sec, smart.link); }, 380);
    }
  }
  boot();
})();
