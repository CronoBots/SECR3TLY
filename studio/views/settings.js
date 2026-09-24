/* Studio — Paramètres : branding, domaine, SEO, sécurité, paiements, RGPD, plan */
(function (root) {
  'use strict';
  var S = root.Studio, D = root.Secretly, U = root.SecretlyUI, T = root.SecretlyThemes, esc = S.esc;
  var TABS = [
    { id: 'branding', label: 'Branding' }, { id: 'domain', label: 'Domaine' }, { id: 'seo', label: 'SEO' }, { id: 'security', label: 'Sécurité' },
    { id: 'payments', label: 'Paiements' }, { id: 'privacy', label: 'Confidentialité & RGPD' }, { id: 'plan', label: 'Plan' }
  ];

  function render(main, sub) {
    var tab = TABS.some(function (t) { return t.id === sub; }) ? sub : 'branding';
    main.innerHTML = '<div class="sec-h"><div><h2 class="sec-t">Paramètres</h2><p class="sec-d">Domaine, référencement, sécurité, paiements et abonnement SECR3TLY.</p></div></div>' +
      S.subtabs('settings', TABS, tab) + '<div id="stBody" class="st-body"></div>';
    var el = main.querySelector('#stBody');
    ({ branding: branding, domain: domain, seo: seo, security: security, payments: payments, privacy: privacy, plan: plan })[tab](el);
  }
  function premium() { var p = S.c.settings.plan; return p === 'premium' || p === 'business'; }

  /* ---------------- Branding ---------------- */
  function branding(el) {
    var c = S.c, t = T.resolve(c.theme);
    T.loadFonts([t.display, t.body]);
    el.innerHTML = '<section class="panel brand-card"><div class="brand-prev" style="background:' + T.backgroundCss(t) + ';color:' + t.ink + '">' +
      '<div class="brand-av">' + U.avatar(c, 64) + '</div><div class="brand-n" style="font-family:\'' + esc(t.display) + '\',serif;' + (t.titleCase === 'upper' ? 'text-transform:uppercase;letter-spacing:.08em' : '') + '">' + esc(c.name) + '</div>' +
      '<div style="font-family:\'' + esc(t.body) + '\',sans-serif;color:' + t.muted + ';font-size:.9rem">' + esc(c.tagline || '') + '</div>' +
      '<span class="brand-btn" style="background:' + t.accent + ';color:' + T.onColor(t.accent) + ';border-radius:' + (t.button === 'pill' ? '99px' : t.button === 'soft' ? '10px' : '2px') + ';font-family:\'' + esc(t.body) + '\',sans-serif">Rejoindre</span></div>' +
      '<div class="brand-info"><h3 class="panel-t">Identité visuelle</h3><p class="panel-d">Thème « ' + esc((T.PRESETS[c.theme.preset] || {}).name || c.theme.preset) + ' » · ' + Object.keys(c.theme.overrides || {}).length + ' personnalisation(s)</p>' +
      '<div class="swatches mt">' + ['bg', 'surface', 'ink', 'muted', 'accent', 'accent2'].map(function (k) { return '<span class="sw" style="background:' + t[k] + '" title="' + k + ' ' + t[k] + '"></span>'; }).join('') + '</div>' +
      '<dl class="kv mt"><div><dt>Titres</dt><dd>' + esc(t.display) + '</dd></div><div><dt>Texte</dt><dd>' + esc(t.body) + '</dd></div><div><dt>Mode</dt><dd>' + (t.mode === 'dark' ? 'Sombre' : 'Clair') + '</dd></div></dl>' +
      '<div class="row-wrap mt"><a class="btn btn-primary btn-sm" href="#/universe/theme">' + S.ic('universe', 15) + 'Personnaliser dans Univers</a><a class="btn btn-ghost btn-sm" href="#/universe/identity">Identité & avatar</a></div></div></section>';
  }

  /* ---------------- Domaine ---------------- */
  function domain(el) {
    var c = S.c, s = c.settings;
    if (!c.domain) s.domainStatus = 0; else if (!s.domainStatus) s.domainStatus = 1;
    var steps = ['En attente DNS', 'Vérifié', 'SSL actif'];
    var d = c.domain || 'votredomaine.com', apex = d.replace(/^www\./, '');
    var recs = [['CNAME', 'www', 'cname.secr3tly.com'], ['A / ALIAS', '@', '76.76.21.21'], ['TXT', '_secr3tly', s.domainToken]];
    el.innerHTML =
      '<section class="panel"><div class="panel-h"><div><h3 class="panel-t">Domaine personnalisé</h3><p class="panel-d">Votre univers sur votre propre nom de domaine, avec SSL automatique.</p></div>' + statusPill(s.domainStatus) + '</div>' +
        '<form class="row dom-form" id="domForm"><div class="input-group grow"><span class="addon">https://</span><input class="input" id="domIn" value="' + esc(c.domain || '') + '" placeholder="lenamoreau.com" spellcheck="false" aria-label="Nom de domaine"></div><button type="submit" class="btn btn-primary btn-sm">Enregistrer</button></form>' +
        '<p class="xs mute mt-xs">Adresse SECR3TLY toujours active : ' + esc(D.prettyUrl(c.handle).replace(/^https?:\/\//, '')) + '</p>' +
        (c.domain ? '<ol class="stepper mt-l">' + steps.map(function (x, i) { var n = i + 1, cls = s.domainStatus > n ? 'done' : s.domainStatus === n ? 'cur' : ''; if (s.domainStatus >= 3 && n === 3) cls = 'done'; return '<li class="' + cls + '"><span class="stp-dot">' + (cls === 'done' ? S.ic('check', 13) : n) + '</span><span>' + x + '</span></li>'; }).join('') + '</ol>' +
        '<h4 class="ub-h4 mt-l">Enregistrements DNS à créer chez votre registrar</h4>' +
        '<div class="tbl-wrap mt-xs"><table class="tbl tbl-cards dns"><thead><tr><th>Type</th><th>Nom</th><th>Valeur</th><th></th></tr></thead><tbody>' + recs.map(function (r) {
          return '<tr><td class="td-main"><span class="tag">' + r[0] + '</span></td><td data-l="Nom"><code>' + esc(r[1] === '@' ? apex : r[1] + '.' + apex) + '</code></td><td data-l="Valeur"><code class="dns-v">' + esc(r[2]) + '</code></td><td class="td-act r"><button type="button" class="icon-btn sm" data-copy="' + esc(r[2]) + '" aria-label="Copier la valeur">' + S.ic('copy', 15) + '</button></td></tr>';
        }).join('') + '</tbody></table></div>' +
        '<p class="xs mute mt">La propagation DNS prend généralement de quelques minutes à 24 h. Le certificat SSL (Let’s Encrypt) est émis automatiquement dès la vérification.</p>' +
        '<div class="row-wrap mt"><button type="button" class="btn btn-sig btn-sm" id="domCheck"' + (s.domainStatus >= 3 ? ' disabled' : '') + '>' + S.ic('refresh', 14) + (s.domainStatus >= 3 ? 'Domaine actif' : 'Vérifier maintenant') + '</button>' + (s.domainStatus >= 3 ? '<a class="btn btn-ghost btn-sm" href="https://' + esc(c.domain) + '" target="_blank" rel="noopener">' + S.ic('external', 14) + esc(c.domain) + '</a>' : '') + '<button type="button" class="btn btn-ghost btn-sm" id="domRm">Retirer le domaine</button></div>' : '') +
      '</section>' +
      '<section class="panel mt"><div class="panel-h"><div><h3 class="panel-t">Mention SECR3TLY</h3><p class="panel-d">Petit lien discret en bas de votre univers.</p></div>' + (premium() ? '' : '<span class="pill pill-sig">Premium</span>') + '</div>' +
        S.toggle('id="pwrd"' + (premium() ? '' : ' disabled'), s.poweredBy, 'Afficher « Powered by SECR3TLY »', premium() ? 'Vous pouvez la retirer avec votre plan actuel.' : 'Retirable avec le plan Premium (marque blanche).') +
        (premium() ? '' : '<a class="link-btn" href="#/settings/plan">Découvrir Premium →</a>') + '</section>';
    el.querySelectorAll('[data-copy]').forEach(function (b) { b.addEventListener('click', function () { U.copy(b.getAttribute('data-copy'), 'Valeur copiée'); }); });
    el.querySelector('#domForm').addEventListener('submit', function (e) {
      e.preventDefault();
      var v = el.querySelector('#domIn').value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
      if (v && !/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(v)) { U.toast('Nom de domaine invalide'); el.querySelector('#domIn').focus(); return; }
      c.domain = v; s.domainStatus = v ? 1 : 0; S.changed(); domain(S.fresh(el)); U.toast(v ? 'Domaine enregistré — ajoutez les DNS' : 'Domaine retiré');
    });
    var chk = el.querySelector('#domCheck');
    if (chk) chk.addEventListener('click', function () {
      chk.disabled = true; chk.innerHTML = '<span class="spin"></span>Vérification DNS…';
      setTimeout(function () {
        s.domainStatus = Math.min(3, s.domainStatus + 1); S.changed({ preview: false });
        if (!el.isConnected) return;
        domain(S.fresh(el));
        if (s.domainStatus === 2) {
          U.toast('DNS vérifiés — émission du certificat SSL…');
          setTimeout(function () { s.domainStatus = 3; S.changed({ preview: false }); var cur = document.getElementById('stBody'); if (cur && S.route.sub === 'domain') { domain(S.fresh(cur)); U.toast('SSL actif : votre domaine est en ligne'); } }, 2200);
        } else U.toast(s.domainStatus === 3 ? 'SSL actif' : 'DNS en attente de propagation');
      }, 1300);
    });
    var rm = el.querySelector('#domRm');
    if (rm) rm.addEventListener('click', function () { S.confirm('Retirer ' + c.domain + ' ? Votre univers restera accessible sur votre adresse SECR3TLY.', { ok: 'Retirer', danger: true }).then(function (ok) { if (ok) { c.domain = ''; s.domainStatus = 0; S.changed(); domain(S.fresh(el)); } }); });
    var pw = el.querySelector('#pwrd');
    pw.addEventListener('change', function () { s.poweredBy = pw.checked; S.changed(); });
  }
  function statusPill(n) { return n >= 3 ? '<span class="pill pill-ok"><span class="dot"></span>SSL actif</span>' : n === 2 ? '<span class="pill pill-ok"><span class="dot"></span>Vérifié</span>' : n === 1 ? '<span class="pill pill-warn"><span class="dot"></span>En attente DNS</span>' : '<span class="pill pill-mute"><span class="dot"></span>Non configuré</span>'; }

  /* ---------------- SEO ---------------- */
  function seo(el) {
    var c = S.c;
    el.innerHTML = '<div class="g2">' +
      '<section class="panel"><div class="panel-h"><div><h3 class="panel-t">Référencement</h3><p class="panel-d">Ce que Google et les réseaux affichent quand on partage votre lien.</p></div></div>' +
        '<div class="field"><div class="field-top"><label for="seoT">Titre</label><span class="cnt" id="seoTc"></span></div><input class="input" id="seoT" data-k="seo.title"></div>' +
        '<div class="field mt"><div class="field-top"><label for="seoD">Description</label><span class="cnt" id="seoDc"></span></div><textarea class="textarea" id="seoD" data-k="seo.description" rows="4"></textarea><span class="hint">Idéal : 50–60 caractères pour le titre, 120–160 pour la description.</span></div>' +
        '<div class="mt">' + S.toggle('data-k="seo.noindex"', c.seo.noindex, 'Masquer des moteurs de recherche', 'Ajoute une balise noindex à votre univers') + '</div></section>' +
      '<div class="grid">' +
        '<section class="panel"><div class="panel-h"><h3 class="panel-t">Aperçu Google</h3></div><div class="g-prev" id="gPrev"></div></section>' +
        '<section class="panel"><div class="panel-h"><h3 class="panel-t">Aperçu partage social</h3></div><div class="og-prev" id="ogPrev"></div></section>' +
      '</div></div>';
    function prev() {
      var host = c.domain && c.settings.domainStatus >= 2 ? c.domain : D.prettyUrl(c.handle).replace(/^https?:\/\//, '').split('/')[0];
      var path = c.domain && c.settings.domainStatus >= 2 ? '' : ' › ' + c.handle;
      el.querySelector('#gPrev').innerHTML = '<div class="g-site">' + U.avatar(c, 26) + '<div><div class="g-n">' + esc(c.name) + '</div><div class="g-u">' + esc(host + path) + '</div></div></div><div class="g-t">' + esc(trunc(c.seo.title || c.name, 60)) + '</div><div class="g-d">' + esc(trunc(c.seo.description || c.bio, 160)) + '</div>';
      el.querySelector('#ogPrev').innerHTML = '<div class="og-img">' + U.art(c.cover) + '<span class="og-av">' + U.avatar(c, 54) + '</span></div><div class="og-b"><div class="og-u">' + esc(host.toUpperCase()) + '</div><div class="og-t">' + esc(trunc(c.seo.title || c.name, 70)) + '</div><div class="og-d">' + esc(trunc(c.seo.description || '', 110)) + '</div></div>';
    }
    S.bind(el, c, function () { prev(); S.changed(); });
    S.counter(el.querySelector('#seoT'), el.querySelector('#seoTc'), 60);
    S.counter(el.querySelector('#seoD'), el.querySelector('#seoDc'), 160);
    prev();
  }
  function trunc(s, n) { s = String(s || ''); return s.length > n ? s.slice(0, n - 1).trim() + '…' : s; }

  /* ---------------- Sécurité ---------------- */
  function security(el) {
    var c = S.c, s = c.settings;
    var sessions = D.store.get('studio:sessions:' + S.handle, null) || [
      { id: 's1', dev: 'Ce navigateur', loc: 'Paris, FR', at: 'Actif maintenant', cur: true },
      { id: 's2', dev: 'iPhone 16 · App SECR3TLY', loc: 'Paris, FR', at: 'Il y a 2 h' },
      { id: 's3', dev: 'MacBook Pro · Safari', loc: 'Lyon, FR', at: 'Il y a 3 jours' }
    ];
    el.innerHTML = '<div class="g2">' +
      '<section class="panel"><div class="panel-h"><div><h3 class="panel-t">Connexion</h3><p class="panel-d">Protégez votre compte et vos revenus.</p></div>' + (s.twoFA ? '<span class="pill pill-ok"><span class="dot"></span>2FA activée</span>' : '<span class="pill pill-warn"><span class="dot"></span>2FA désactivée</span>') + '</div>' +
        S.toggle('id="tfa"', s.twoFA, 'Double authentification (2FA)', 'Code à usage unique via une app (Authy, 1Password, Google Authenticator)') +
        '<h4 class="ub-h4 mt-l">Sessions actives</h4><ul class="sess">' + sessions.map(function (x) {
          return '<li><span class="sess-ic">' + S.ic(/iPhone/.test(x.dev) ? 'phone' : 'desktop', 18) + '</span><div class="grow"><div style="font-weight:600">' + esc(x.dev) + (x.cur ? ' <span class="pill pill-ok">Actuelle</span>' : '') + '</div><div class="xs mute">' + esc(x.loc) + ' · ' + esc(x.at) + '</div></div>' + (x.cur ? '' : '<button type="button" class="btn btn-ghost btn-xs" data-kill="' + x.id + '">Déconnecter</button>') + '</li>';
        }).join('') + '</ul></section>' +
      '<section class="panel"><div class="panel-h"><div><h3 class="panel-t">Protection du contenu</h3><p class="panel-d">Dissuadez les fuites de vos contenus payants.</p></div>' + S.ic('shield', 20) + '</div>' +
        S.toggle('data-k="settings.protect.watermark"', s.protect.watermark, 'Filigrane dynamique', 'Pseudo et identifiant du membre incrustés sur les médias') +
        S.toggle('data-k="settings.protect.rightClick"', s.protect.rightClick, 'Désactiver le clic droit', 'Sur les médias réservés aux membres') +
        S.toggle('data-k="settings.protect.download"', s.protect.download, 'Bloquer le téléchargement', 'Vidéos en streaming protégé, pas de fichier direct') +
        S.toggle('data-k="settings.protect.screenshot"', s.protect.screenshot, 'Dissuasion des captures d’écran', 'Floutage à la perte de focus et avertissement (app mobile)') +
        '<p class="xs mute mt">Aucune protection n’est absolue sur le web : ces mesures réduisent fortement le partage non autorisé.</p></section>' +
      '</div>';
    S.bind(el, c, function () { S.changed(); });
    var tfa = el.querySelector('#tfa');
    tfa.addEventListener('change', function () {
      if (!tfa.checked) { s.twoFA = false; S.changed({ preview: false }); security(S.fresh(el)); U.toast('Double authentification désactivée'); return; }
      tfa.checked = false;
      var secret = 'SX3' + S.handle.toUpperCase().slice(0, 4) + 'K7Q2M9';
      S.modal({
        title: 'Activer la 2FA', cls: 'dlg-sm',
        body: '<ol class="tfa-steps"><li>Scannez ce QR code avec votre application d’authentification.</li></ol><div class="qr-big sm">' + U.qr('otpauth://totp/SECR3TLY:' + S.handle + '?secret=' + secret + '&issuer=SECR3TLY') + '</div><p class="xs mute center">Clé : <code>' + secret + '</code></p><div class="field mt"><label for="tfaCode">Code à 6 chiffres</label><input class="input code-in" id="tfaCode" inputmode="numeric" maxlength="6" placeholder="123456" autocomplete="one-time-code"></div><p class="xs mute mt-xs">Démo : n’importe quel code à 6 chiffres est accepté.</p>',
        foot: '<button type="button" class="btn btn-ghost btn-sm" data-close>Annuler</button><button type="button" class="btn btn-primary btn-sm" id="tfaOk">Activer</button>',
        onOpen: function (m, close) {
          m.querySelector('#tfaOk').addEventListener('click', function () {
            var v = m.querySelector('#tfaCode').value.trim();
            if (!/^\d{6}$/.test(v)) { m.querySelector('#tfaCode').focus(); U.toast('Saisissez 6 chiffres'); return; }
            s.twoFA = true; S.changed({ preview: false }); close(); security(S.fresh(el)); U.toast('Double authentification activée');
          });
        }
      });
    });
    el.querySelectorAll('[data-kill]').forEach(function (b) { b.addEventListener('click', function () { sessions = sessions.filter(function (x) { return x.id !== b.getAttribute('data-kill'); }); D.store.set('studio:sessions:' + S.handle, sessions); security(S.fresh(el)); U.toast('Session déconnectée'); }); });
  }

  /* ---------------- Paiements ---------------- */
  function payments(el) {
    var c = S.c;
    el.innerHTML = '<section class="panel"><div class="panel-h"><div><h3 class="panel-t">Devise & fiscalité</h3><p class="panel-d">Appliqué à vos prix, factures et exports.</p></div></div><div class="fgrid">' +
      '<div class="field"><label for="pcur">Devise</label><select class="select" id="pcur" data-k="settings.currency"><option value="EUR">Euro (€)</option><option value="USD">Dollar US ($)</option><option value="CHF">Franc suisse (CHF)</option><option value="CAD">Dollar canadien (CA$)</option><option value="GBP">Livre sterling (£)</option></select></div>' +
      '<div class="field"><label for="pvat">Taux de TVA</label><select class="select" id="pvat" data-k="settings.vat" data-t="num"><option value="20">20 % — France</option><option value="21">21 % — Belgique</option><option value="8.1">8,1 % — Suisse</option><option value="17">17 % — Luxembourg</option><option value="5">5 % — Canada (TPS)</option><option value="0">0 % — Franchise en base</option></select></div>' +
      '<div class="field full">' + S.toggle('data-k="settings.vatIncluded"', c.settings.vatIncluded, 'Prix affichés TTC', 'Recommandé pour une audience de particuliers') + '</div>' +
      '<div class="field"><label for="plegal">Raison sociale / nom légal</label><input class="input" id="plegal" data-k="settings.legalName" placeholder="' + esc(c.name) + '"></div>' +
      '<div class="field"><label for="psiret">SIRET / n° d’entreprise</label><input class="input" id="psiret" data-k="settings.siret" placeholder="Optionnel"></div>' +
      '</div><div class="ex-price mt" id="exP"></div></section>' +
      '<section class="panel mt"><div class="panel-h"><div><h3 class="panel-t">Encaissements</h3><p class="panel-d">Stripe Connect — virements, KYC, factures.</p></div><span class="pill pill-warn"><span class="dot"></span>À connecter</span></div><a class="btn btn-ghost btn-sm" href="#/commerce/payments">' + S.ic('wallet', 15) + 'Voir les paiements</a></section>';
    function ex() {
      var t = c.tiers.filter(function (x) { return x.price > 0; })[0], p = t ? t.price : 10, v = Number(c.settings.vat) || 0;
      var ht = c.settings.vatIncluded ? p / (1 + v / 100) : p, ttc = c.settings.vatIncluded ? p : p * (1 + v / 100);
      el.querySelector('#exP').innerHTML = '<span class="xs mute">Exemple' + (t ? ' — ' + esc(t.name) : '') + ' :</span> <b>' + esc(S.money(ttc)) + ' TTC</b> <span class="mute">· ' + esc(S.money(ht)) + ' HT · TVA ' + esc(S.money(ttc - ht)) + '</span>';
    }
    S.bind(el, c, function () { ex(); S.changed(); });
    ex();
  }

  /* ---------------- RGPD ---------------- */
  function privacy(el) {
    var c = S.c;
    el.innerHTML = '<div class="g2">' +
      '<section class="panel"><div class="panel-h"><div><h3 class="panel-t">Exporter mes données</h3><p class="panel-d">Portabilité (art. 20 RGPD) : profil, contenus, offres, réglages et événements analytics locaux.</p></div>' + S.ic('download', 20) + '</div>' +
        '<button type="button" class="btn btn-primary btn-sm" id="exp">' + S.ic('download', 15) + 'Télécharger (JSON)</button></section>' +
      '<section class="panel"><div class="panel-h"><div><h3 class="panel-t">Vos membres</h3><p class="panel-d">SECR3TLY agit comme sous-traitant ; vous restez responsable de traitement.</p></div></div>' +
        '<ul class="checks"><li>' + S.ic('check', 14) + 'Consentement marketing recueilli à l’inscription</li><li>' + S.ic('check', 14) + 'Lien de désinscription dans chaque email</li><li>' + S.ic('check', 14) + 'Bandeau cookies conforme CNIL sur votre univers</li><li>' + S.ic('check', 14) + 'Hébergement des données dans l’UE</li></ul></section>' +
      '</div>' +
      '<section class="panel danger-zone mt"><div class="panel-h"><div><h3 class="panel-t">Supprimer mon compte</h3><p class="panel-d">Supprime votre univers, vos contenus et vos réglages. Irréversible en production.</p></div></div>' +
        '<button type="button" class="btn btn-danger btn-sm" id="del">' + S.ic('trash', 15) + 'Supprimer le compte…</button><p class="xs mute mt-xs">Démo : la suppression réinitialise simplement les données de « ' + esc(c.name) + ' » dans ce navigateur.</p></section>';
    el.querySelector('#exp').addEventListener('click', function () {
      var data = { exportedAt: new Date().toISOString(), platform: 'SECR3TLY', creator: c, localEvents: D.localEvents(c.handle), notes: D.store.get('studio:notes:' + c.handle, {}) };
      S.download('secr3tly-' + c.handle + '-export.json', JSON.stringify(data, null, 2), 'application/json');
      U.toast('Export téléchargé');
    });
    el.querySelector('#del').addEventListener('click', function () {
      S.modal({
        title: 'Supprimer le compte', cls: 'dlg-sm',
        body: '<p class="dim">Cette action supprimera définitivement l’univers <b>' + esc(c.name) + '</b>. Pour confirmer, saisissez <code>' + esc(c.handle) + '</code>.</p><div class="field mt"><label for="delIn">Identifiant</label><input class="input" id="delIn" autocomplete="off" spellcheck="false"></div>',
        foot: '<button type="button" class="btn btn-ghost btn-sm" data-close>Annuler</button><button type="button" class="btn btn-danger btn-sm" id="delOk" disabled>Supprimer définitivement</button>',
        onOpen: function (m, close) {
          var i = m.querySelector('#delIn'), ok = m.querySelector('#delOk');
          i.addEventListener('input', function () { ok.disabled = i.value.trim().toLowerCase() !== c.handle; });
          ok.addEventListener('click', function () {
            D.resetCreator(c.handle); ['inbox', 'notes', 'orders', 'sessions'].forEach(function (k) { D.store.del('studio:' + k + ':' + c.handle); });
            close(); S.load(c.handle); S.emit('account-refresh'); S.emit('account'); S.go('#/overview'); U.toast('Compte supprimé (démo) — données réinitialisées');
          });
        }
      });
    });
  }

  /* ---------------- Plan ---------------- */
  function plan(el) {
    var c = S.c, cur = c.settings.plan;
    var FEAT = [
      ['Univers, thèmes & smart links', 1, 1, 1, 1], ['Abonnements, boutique, PPV', 1, 1, 1, 1], ['Commission sur les ventes', '10 %', '5 %', '2 %', 'Sur devis'],
      ['Domaine personnalisé', 0, 1, 1, 1], ['CRM, segments & campagnes', 0, 1, 1, 1], ['Analytics avancées', 0, 1, 1, 1], ['Copilote IA', 0, '500 / mois', 'Illimité', 'Illimité'],
      ['Retrait « Powered by SECR3TLY »', 0, 0, 1, 1], ['Media kit & collaborations', 0, 0, 1, 1], ['Multi-comptes & sièges', 0, 0, 0, 1], ['Account manager', 0, 0, 0, 1]
    ];
    el.innerHTML = '<div class="plans">' + S.PLANS.map(function (p) {
      var on = p.id === cur;
      return '<article class="plan' + (on ? ' on' : '') + (p.id === 'premium' ? ' feat' : '') + '"><div class="row"><h3 class="plan-n">' + esc(p.name) + '</h3>' + (on ? '<span class="pill pill-ok">Plan actuel</span>' : p.id === 'pro' ? '<span class="pill pill-mute">' + esc(p.tag) + '</span>' : '') + '</div>' +
        '<p class="xs mute">' + esc(p.tag) + '</p><div class="plan-p">' + (p.price == null ? '<b>Sur devis</b>' : '<b>' + esc(S.money(p.price)) + '</b><span>/ mois</span>') + '</div>' +
        '<div class="plan-fee">' + (p.fee == null ? 'Commission négociée' : 'Commission ' + S.pct(p.fee, 0)) + '</div>' +
        '<ul class="tier-perks">' + p.perks.map(function (x) { return '<li>' + S.ic('check', 14) + esc(x) + '</li>'; }).join('') + '</ul>' +
        (on ? '<button type="button" class="btn btn-ghost btn-sm" disabled>Plan actuel</button>' : p.id === 'business' ? '<button type="button" class="btn btn-ghost btn-sm" data-contact>Nous contacter</button>' : '<button type="button" class="btn btn-sm ' + (p.id === 'premium' ? 'btn-sig' : 'btn-primary') + '" data-plan="' + p.id + '">' + (S.PLANS.map(function (x) { return x.id; }).indexOf(p.id) > S.PLANS.map(function (x) { return x.id; }).indexOf(cur) ? 'Passer à ' : 'Revenir à ') + esc(p.name) + '</button>') + '</article>';
    }).join('') + '</div>' +
    '<section class="panel panel-flush mt"><div class="panel-h"><h3 class="panel-t">Comparatif détaillé</h3></div><div class="tbl-wrap"><table class="tbl cmp"><thead><tr><th>Fonctionnalité</th>' + S.PLANS.map(function (p) { return '<th class="c' + (p.id === cur ? ' cur' : '') + '">' + esc(p.name) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      FEAT.map(function (f) { return '<tr><td>' + esc(f[0]) + '</td>' + f.slice(1).map(function (v, i) { return '<td class="c' + (S.PLANS[i].id === cur ? ' cur' : '') + '">' + (v === 1 ? '<span class="ok">' + S.ic('check', 15) + '</span>' : v === 0 ? '<span class="mute">—</span>' : esc(v)) + '</td>'; }).join('') + '</tr>'; }).join('') +
    '</tbody></table></div></section><p class="xs mute mt">Démo : changer de plan ne déclenche aucun paiement. Prix HT, sans engagement.</p>';
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-plan]');
      if (b) { c.settings.plan = b.getAttribute('data-plan'); if (!premium()) c.settings.poweredBy = true; S.changed(); S.emit('account-refresh'); plan(S.fresh(el)); U.toast('Plan ' + S.plan().name + ' activé (démo)'); return; }
      if (e.target.closest('[data-contact]')) U.toast('Notre équipe vous recontacte sous 24 h (démo)');
    });
  }

  S.register('settings', { title: 'Paramètres', group: 'Compte', icon: 'settings', render: render });
})(window);
