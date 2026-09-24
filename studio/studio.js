/* =====================================================================
   SECR3TLY Studio — coque : navigation, barre d'onglets mobile,
   sélecteur de compte démo, réinitialisation, démarrage.
   ===================================================================== */
(function (root) {
  'use strict';
  var S = root.Studio, D = root.Secretly, U = root.SecretlyUI, esc = S.esc;

  var GROUPS = [
    { name: 'Pilotage', ids: ['overview', 'analytics'] },
    { name: 'Création', ids: ['universe', 'content', 'copilot'] },
    { name: 'Audience', ids: ['community', 'marketing'] },
    { name: 'Revenus', ids: ['commerce', 'collabs', 'mediakit'] },
    { name: 'Compte', ids: ['settings'] }
  ];
  var TABS = [
    { id: 'overview', label: 'Accueil', icon: 'home' },
    { id: 'universe', label: 'Univers', icon: 'universe' },
    { id: 'content', label: 'Contenus', icon: 'content' },
    { id: 'analytics', label: 'Stats', icon: 'analytics' }
  ];
  var PLAN_NAMES = { free: 'Free', pro: 'Pro', premium: 'Premium', business: 'Business' };

  function renderNav() {
    var r = S.route.id;
    document.getElementById('nav').innerHTML = GROUPS.map(function (g) {
      return '<div class="nav-g"><div class="nav-gt">' + esc(g.name) + '</div>' + g.ids.map(function (id) {
        var v = S.views[id]; if (!v) return '';
        var on = id === r, bd = v.badge ? v.badge() : '';
        return '<a class="nav-i' + (on ? ' on' : '') + '" href="#/' + id + '"' + (on ? ' aria-current="page"' : '') + '>' + S.ic(v.icon, 18) + '<span>' + esc(v.title) + '</span>' + (bd ? '<span class="nav-badge">' + esc(bd) + '</span>' : '') + '</a>';
      }).join('') + '</div>';
    }).join('');
    var inTabs = TABS.some(function (t) { return t.id === r; });
    document.getElementById('tabbar').innerHTML = TABS.map(function (t) {
      var on = t.id === r;
      return '<a class="tab' + (on ? ' on' : '') + '" href="#/' + t.id + '"' + (on ? ' aria-current="page"' : '') + '>' + S.ic(t.icon, 21) + '<span>' + esc(t.label) + '</span></a>';
    }).join('') + '<button type="button" class="tab' + (!inTabs ? ' on' : '') + '" id="tabMore" aria-haspopup="dialog">' + S.ic('more', 21) + '<span>' + (!inTabs ? esc(S.views[r].short || S.views[r].title) : 'Plus') + '</span></button>';
    document.getElementById('tabMore').addEventListener('click', openMore);
  }

  function renderAccount() {
    var c = S.c;
    var html = '<button type="button" class="acct-btn" id="acctBtn" aria-haspopup="true" aria-expanded="false">' + U.avatar(c, 36) +
      '<span class="acct-txt"><span class="acct-n">' + esc(c.name) + '</span><span class="acct-h">' + esc(c.pseudo || '@' + c.handle) + '</span></span>' + S.ic('down', 14) + '</button>';
    document.getElementById('acct').innerHTML = html;
    document.getElementById('acctBtn').addEventListener('click', function () { openAccounts(this); });
    document.getElementById('tbAcct').innerHTML = U.avatar(c, 32);
    var url = D.creatorUrl(c.handle);
    document.getElementById('viewUniverse').href = url;
    document.getElementById('tbView').href = url;
    var plan = c.settings.plan;
    document.getElementById('sidePlan').innerHTML = '<a href="#/settings/plan" class="plan-pill"><span>Plan ' + esc(PLAN_NAMES[plan] || plan) + '</span>' + (plan === 'free' || plan === 'pro' ? '<em>Passer à Premium</em>' : '<em>Gérer</em>') + '</a>';
  }

  function openAccounts() {
    var list = S.creators();
    S.sheet({
      title: 'Compte de démonstration', subtitle: 'Explorez le Studio avec un autre créateur fictif.', cls: 'dlg-sm',
      body: '<div class="acct-list">' + list.map(function (c) {
        var on = c.handle === S.handle;
        return '<button type="button" class="acct-row' + (on ? ' on' : '') + '" data-h="' + esc(c.handle) + '">' + U.avatar(c, 40) +
          '<span class="acct-txt"><span class="acct-n">' + esc(c.name) + '</span><span class="acct-h">' + esc(c.category) + ' · ' + esc(D.compact(c.stats.followers)) + ' abonnés</span></span>' +
          (on ? '<span class="acct-on">' + S.ic('check', 16) + '</span>' : '') + '</button>';
      }).join('') + '</div>',
      onOpen: function (el, close) {
        el.addEventListener('click', function (e) {
          var b = e.target.closest('.acct-row'); if (!b) return;
          var h = b.getAttribute('data-h'); close(true);
          if (h !== S.handle) switchTo(h);
        });
      }
    });
  }

  function switchTo(h) {
    S.saveNow();
    S.load(h);
    renderAccount();
    S.emit('account');
    S.render();
    U.toast('Compte démo : ' + S.c.name);
  }
  S.switchTo = switchTo;

  function openMore() {
    var items = ['community', 'marketing', 'commerce', 'collabs', 'mediakit', 'copilot', 'settings'];
    S.sheet({
      title: 'Plus', cls: 'dlg-sm more-sheet',
      body: '<div class="more-grid">' + items.map(function (id) {
        var v = S.views[id];
        return '<a class="more-i' + (S.route.id === id ? ' on' : '') + '" href="#/' + id + '">' + S.ic(v.icon, 22) + '<span>' + esc(v.title) + '</span></a>';
      }).join('') + '</div>' +
      '<div class="more-foot"><a class="btn btn-ghost btn-sm" href="' + esc(D.creatorUrl(S.handle)) + '" target="_blank" rel="noopener">' + S.ic('external', 15) + 'Voir mon univers</a>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="moreAcct">' + S.ic('user', 15) + 'Changer de compte</button></div>',
      onOpen: function (el, close) {
        el.querySelectorAll('.more-i').forEach(function (a) { a.addEventListener('click', function () { close(true); }); });
        el.querySelector('#moreAcct').addEventListener('click', function () { close(true); openAccounts(); });
      }
    });
  }

  function resetDemo() {
    S.confirm('Toutes les modifications faites sur « ' + S.c.name + ' » dans ce navigateur seront effacées et la démo retrouvera son état d’origine.', { title: 'Réinitialiser la démo', ok: 'Réinitialiser', danger: true }).then(function (ok) {
      if (!ok) return;
      D.resetCreator(S.handle);
      D.store.del('studio:inbox:' + S.handle);
      S.load(S.handle);
      renderAccount();
      S.emit('account');
      S.render();
      S.setSaved('saved');
      U.toast('Démo réinitialisée');
    });
  }

  document.getElementById('demoReset').addEventListener('click', resetDemo);
  document.getElementById('tbAcct').addEventListener('click', openAccounts);
  S.resetDemo = resetDemo;
  S.openAccounts = openAccounts;
  S.on('route', renderNav);
  S.on('account-refresh', renderAccount);
  root.addEventListener('hashchange', S.render);
  root.addEventListener('beforeunload', function () { S.saveNow(); });

  /* ---------- « Réserver mon lien » depuis la landing (?claim=<handle>) ---------- */
  function cleanHandle(h) { return String(h || '').toLowerCase().replace(/^@/, '').replace(/[^a-z0-9._-]/g, '').replace(/^[._-]+|[._-]+$/g, '').slice(0, 30); }
  function nameFrom(h) { return h.split(/[._-]+/).filter(Boolean).map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join(' ') || h; }
  function createFromClaim(h) {
    var existing = D.getCreator(h);
    if (existing && !D.seedCreator(h)) return existing.handle; // déjà réservé dans ce navigateur
    if (existing) { var n = 2; while (D.getCreator(h + n)) n++; h = h + n; }
    var c = D.seedCreator('lena'), name = nameFrom(h);
    c.handle = h; c.name = name; c.pseudo = '@' + h; c.verified = false; c.domain = '';
    c.tagline = 'Mode · Coulisses · Exclusivités';
    c.bio = 'Bienvenue dans mon univers : ici, je partage ce que je ne poste nulle part ailleurs. Contenus exclusifs, coulisses et offres réservées aux membres.';
    c.avatar = { initials: name.split(' ').map(function (w) { return w[0]; }).join('').slice(0, 2).toUpperCase() || h.slice(0, 2).toUpperCase(), a: '#e8b4bc', b: '#9c7fa6' };
    c.seo = { title: name + ' — univers officiel', description: 'L’univers officiel de ' + name + ' : contenus exclusifs, boutique, abonnements et coulisses, au même endroit.' };
    if (c.mediakit) c.mediakit.contact = 'partenariats@' + h + '.com';
    c.claimedAt = new Date().toISOString();
    D.saveCreator(c);
    return h;
  }
  function claimWelcome(raw) {
    var h = cleanHandle(raw);
    D.store.del('claim');
    try { if (location.search.indexOf('claim=') >= 0) history.replaceState(null, '', location.pathname + location.hash); } catch (e) { /* ignore */ }
    if (!h) return;
    S.modal({
      title: 'Bienvenue sur SECR3TLY', cls: 'dlg-sm claim-dlg',
      body: '<div class="claim"><div class="claim-orb">' + S.ic('star', 22) + '</div>' +
        '<p class="claim-url"><span>secr3tly.com/</span><b>' + esc(h) + '</b></p><p class="claim-t">est réservé pour vous.</p>' +
        '<p class="dim small">Créez votre univers en quelques minutes : nous le pré-remplissons avec un exemple que vous personnalisez librement — thème, sections, offres, contenus.</p>' +
        '<p class="xs mute mt">Démo : tout reste dans ce navigateur, aucun paiement réel.</p></div>',
      foot: '<button type="button" class="btn btn-ghost btn-sm" data-close>Explorer la démo de Lena</button><button type="button" class="btn btn-sig btn-sm" id="claimGo" autofocus>' + S.ic('sparkle', 15) + 'Créer mon univers</button>',
      onOpen: function (el, close) {
        el.querySelector('#claimGo').addEventListener('click', function () {
          var nh = createFromClaim(h);
          close(true);
          S.saveNow(); S.load(nh); renderAccount(); S.emit('account');
          S.go('#/universe/identity');
          U.toast('Votre univers ' + nh + ' est prêt — personnalisez-le !');
        });
      }
    });
  }

  // Démarrage
  var q = new URLSearchParams(location.search);
  S.load(q.get('u') || D.store.get('studio:handle', 'lena'));
  renderAccount();
  S.render();
  var claim = q.get('claim') || D.store.get('claim', null);
  if (claim) claimWelcome(claim);
})(window);
