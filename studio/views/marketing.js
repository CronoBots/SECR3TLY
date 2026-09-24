/* Studio — Marketing : smart links + UTM + QR, codes promo, campagnes */
(function (root) {
  'use strict';
  var S = root.Studio, D = root.Secretly, U = root.SecretlyUI, esc = S.esc;
  var KIND = { newsletter: ['Newsletter', 'mail'], announce: ['Annonce', 'marketing'], push: ['Push', 'bell'], message: ['Message privé', 'chat'] };

  function short(u) { return String(u).replace(/^https?:\/\//, ''); }

  /** Liste des smart links (profil + sections visibles + liens personnalisés) */
  S.smartLinks = function () {
    var c = S.c, r = D.rng(S.handle + 'smart'), out = [];
    var base = Math.max(400, Math.round((c.stats.followers || 10000) / 60));
    out.push({ id: 'root', name: 'Profil (univers complet)', kind: 'Profil', url: D.prettyUrl(c.handle), clicks: Math.round(base * 4.2) });
    c.sections.forEach(function (sid) {
      var s = D.SECTIONS.filter(function (x) { return x.id === sid; })[0]; if (!s) return;
      out.push({ id: 's-' + sid, name: s.name, kind: 'Section', url: D.prettyUrl(c.handle, sid), clicks: Math.round(base * (0.2 + r() * 1.1)) });
    });
    c.links.forEach(function (l) { if (l.slug) out.push({ id: 'l-' + l.id, name: l.label, kind: 'Lien', url: D.prettyUrl(c.handle, l.slug), clicks: l.clicks || 0, icon: l.icon }); });
    return out;
  };

  S.campaigns = function () {
    var c = S.c;
    if (Array.isArray(c.campaigns)) return c.campaigns;
    var first = c.name.split(' ')[0], d = function (n) { return new Date(Date.now() - n * 864e5).toISOString(); };
    var p = c.posts[0], pr = c.products[0], vip = c.tiers.filter(function (t) { return t.level === 'vip'; })[0];
    return [
      { id: 'cpd1', kind: 'newsletter', subject: 'Lettre de ' + first + ' — ce que je ne poste nulle part', segment: 'Tous', audience: Math.round(c.stats.members * 0.7), status: 'sent', sentAt: d(3), open: 0.52, click: 0.11, revenue: 1840 },
      { id: 'cpd2', kind: 'announce', subject: pr ? 'Nouveau : ' + pr.name : 'Nouveauté dans la boutique', segment: 'Clients', audience: Math.round(c.stats.members * 0.24), status: 'sent', sentAt: d(9), open: 0.61, click: 0.18, revenue: 3920 },
      { id: 'cpd3', kind: 'push', subject: p ? '« ' + p.title + ' » est en ligne' : 'Nouveau contenu en ligne', segment: 'Abonnés premium', audience: Math.round(c.stats.members * 0.3), status: 'sent', sentAt: d(14), open: 0.38, click: 0.21, revenue: 610 },
      { id: 'cpd4', kind: 'newsletter', subject: vip ? vip.name + ' : −30 % pendant 48 h' : 'Offre membres 48 h', segment: 'Nouveaux membres', audience: Math.round(c.stats.members * 0.12), status: 'sent', sentAt: d(21), open: 0.47, click: 0.14, revenue: 2260 }
    ];
  };
  function ensureCampaigns() { if (!Array.isArray(S.c.campaigns)) S.c.campaigns = S.clone(S.campaigns()); return S.c.campaigns; }

  function render(main, sub, parts) {
    var tab = ['links', 'promos', 'campaigns'].indexOf(sub) >= 0 ? sub : 'links';
    main.innerHTML = '<div class="sec-h"><div><h2 class="sec-t">Marketing</h2><p class="sec-d">Smart links traçables, codes promo et campagnes vers vos segments.</p></div></div>' +
      S.subtabs('marketing', [{ id: 'links', label: 'Smart links' }, { id: 'promos', label: 'Codes promo', count: S.c.promos.length }, { id: 'campaigns', label: 'Campagnes' }], tab) + '<div id="mkBody"></div>';
    var el = main.querySelector('#mkBody');
    ({ links: links, promos: promos, campaigns: campaigns })[tab](el, parts[1]);
  }

  /* ---------------- Smart links ---------------- */
  var utm = { base: 'root', source: 'instagram', medium: 'bio', campaign: '' };
  function links(el) {
    var list = S.smartLinks(), max = Math.max.apply(null, list.map(function (l) { return l.clicks; }).concat([1]));
    var total = list.reduce(function (a, l) { return a + l.clicks; }, 0);
    el.innerHTML = '<div class="split">' +
      '<section class="panel panel-flush"><div class="panel-h"><div><h3 class="panel-t">Vos smart links</h3><p class="panel-d">Un lien court par section et par lien — ' + esc(S.num(total)) + ' clics au total</p></div><a class="btn btn-ghost btn-sm" href="#/universe/links">' + S.ic('plus', 15) + 'Lien personnalisé</a></div>' +
        '<ul class="sl-list">' + list.map(function (l) {
          return '<li class="sl" data-id="' + esc(l.id) + '"><div class="sl-main"><div class="sl-n">' + (l.icon ? '<span class="sl-g">' + esc(l.icon) + '</span>' : '') + esc(l.name) + ' <span class="tag">' + esc(l.kind) + '</span></div>' +
            '<a class="sl-u" href="' + esc(l.url) + '" target="_blank" rel="noopener">' + esc(short(l.url)) + '</a>' +
            '<div class="sl-bar"><span style="width:' + (l.clicks / max * 100).toFixed(1) + '%"></span></div></div>' +
            '<div class="sl-c"><b class="num">' + esc(S.num(l.clicks)) + '</b><span class="xs mute">clics</span></div>' +
            '<div class="sl-act"><button type="button" class="icon-btn sm" data-act="copy" aria-label="Copier ' + esc(l.name) + '">' + S.ic('copy', 15) + '</button><button type="button" class="icon-btn sm" data-act="qr" aria-label="QR code ' + esc(l.name) + '">' + S.ic('qr', 15) + '</button><button type="button" class="icon-btn sm" data-act="utm" aria-label="Construire un UTM pour ' + esc(l.name) + '">' + S.ic('tag', 15) + '</button></div></li>';
        }).join('') + '</ul></section>' +
      '<section class="panel utm" id="utm"><div class="panel-h"><div><h3 class="panel-t">Générateur UTM</h3><p class="panel-d">Mesurez chaque source dans Analytics</p></div></div>' +
        '<div class="field"><label for="utmB">Lien</label><select class="select" id="utmB">' + list.map(function (l) { return '<option value="' + esc(l.id) + '"' + (l.id === utm.base ? ' selected' : '') + '>' + esc(l.name) + '</option>'; }).join('') + '</select></div>' +
        '<div class="field mt"><label for="utmS">Source <span class="mute">utm_source</span></label><input class="input" id="utmS" value="' + esc(utm.source) + '"><div class="fchips mt-xs">' + ['instagram', 'tiktok', 'youtube', 'newsletter', 'qr', 'partenaire'].map(function (x) { return '<button type="button" class="fchip" data-src="' + x + '">' + x + '</button>'; }).join('') + '</div></div>' +
        '<div class="fgrid mt"><div class="field"><label for="utmM">Support <span class="mute">utm_medium</span></label><select class="select" id="utmM">' + ['bio', 'story', 'post', 'email', 'social', 'print', 'affiliation'].map(function (x) { return '<option' + (x === utm.medium ? ' selected' : '') + '>' + x + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label for="utmC">Campagne <span class="mute">utm_campaign</span></label><input class="input" id="utmC" value="' + esc(utm.campaign) + '" placeholder="automne-2026"></div></div>' +
        '<div class="utm-out mt"><code id="utmOut"></code><button type="button" class="btn btn-primary btn-sm" id="utmCopy">' + S.ic('copy', 14) + 'Copier</button></div>' +
        '<div class="qr-box mt"><div class="qr-img" id="utmQr"></div><div class="stack-sm"><div class="xs mute">QR code du lien tracké</div>' + S.seg('qrc', [{ v: 'dark', l: 'Noir' }, { v: 'sig', l: 'Signature' }, { v: 'inv', l: 'Inversé' }], 'dark') + '<button type="button" class="btn btn-ghost btn-sm" id="utmDl">' + S.ic('download', 14) + 'Télécharger (SVG)</button></div></div>' +
      '</section></div>';

    var qrStyle = 'dark';
    function url() {
      var l = list.filter(function (x) { return x.id === utm.base; })[0] || list[0];
      var q = [];
      if (utm.source) q.push('utm_source=' + encodeURIComponent(S.slugify(utm.source) || utm.source));
      if (utm.medium) q.push('utm_medium=' + encodeURIComponent(utm.medium));
      if (utm.campaign) q.push('utm_campaign=' + encodeURIComponent(S.slugify(utm.campaign)));
      return S.absUrl(l.url) + (q.length ? '?' + q.join('&') : '');
    }
    function colors() { return qrStyle === 'sig' ? { fg: '#d4467e', bg: '#fff' } : qrStyle === 'inv' ? { fg: '#f3ece6', bg: '#0b0909' } : { fg: '#0b0909', bg: '#fff' }; }
    function upd() {
      var u = url();
      el.querySelector('#utmOut').textContent = u;
      el.querySelector('#utmQr').innerHTML = U.qr(u, colors()) || '<p class="xs mute">Lien trop long pour un QR code</p>';
    }
    upd();
    el.querySelector('#utmB').addEventListener('change', function () { utm.base = this.value; upd(); });
    el.querySelector('#utmS').addEventListener('input', function () { utm.source = this.value; upd(); });
    el.querySelector('#utmM').addEventListener('change', function () { utm.medium = this.value; upd(); });
    el.querySelector('#utmC').addEventListener('input', function () { utm.campaign = this.value; upd(); });
    el.querySelectorAll('[data-src]').forEach(function (b) { b.addEventListener('click', function () { utm.source = b.getAttribute('data-src'); el.querySelector('#utmS').value = utm.source; if (utm.source === 'qr') { utm.medium = 'print'; el.querySelector('#utmM').value = 'print'; } if (utm.source === 'newsletter') { utm.medium = 'email'; el.querySelector('#utmM').value = 'email'; } upd(); }); });
    S.onSeg(el, 'qrc', function (v) { qrStyle = v; upd(); });
    el.querySelector('#utmCopy').addEventListener('click', function () { U.copy(url(), 'Lien UTM copié'); });
    el.querySelector('#utmDl').addEventListener('click', function () { S.download('qr-' + S.handle + '-' + (S.slugify(utm.campaign || utm.source) || 'lien') + '.svg', U.qr(url(), colors()), 'image/svg+xml'); });
    el.querySelector('.sl-list').addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var l = list.filter(function (x) { return x.id === b.closest('.sl').getAttribute('data-id'); })[0], a = b.getAttribute('data-act');
      if (a === 'copy') U.copy(S.absUrl(l.url), 'Smart link copié');
      if (a === 'utm') { utm.base = l.id; el.querySelector('#utmB').value = l.id; upd(); var box = el.querySelector('#utm'); box.scrollIntoView({ behavior: 'smooth', block: 'start' }); el.querySelector('#utmS').focus({ preventScroll: true }); }
      if (a === 'qr') qrModal(l);
    });
  }
  function qrModal(l) {
    var u = S.absUrl(l.url);
    S.modal({
      title: 'QR code', subtitle: l.name, cls: 'dlg-sm',
      body: '<div class="qr-big">' + U.qr(u) + '</div><p class="xs mute center mt">' + esc(short(u)) + '</p><p class="xs dim center">Imprimez-le sur vos cartes, packagings, stands ou affiches.</p>',
      foot: '<button type="button" class="btn btn-ghost btn-sm" id="qrCp">' + S.ic('copy', 14) + 'Copier le lien</button><button type="button" class="btn btn-primary btn-sm" id="qrDl">' + S.ic('download', 14) + 'Télécharger SVG</button>',
      onOpen: function (el) {
        el.querySelector('#qrCp').addEventListener('click', function () { U.copy(u, 'Lien copié'); });
        el.querySelector('#qrDl').addEventListener('click', function () { S.download('qr-' + S.handle + '-' + (S.slugify(l.name) || 'lien') + '.svg', U.qr(u), 'image/svg+xml'); });
      }
    });
  }

  /* ---------------- Codes promo ---------------- */
  function promos(el) {
    var c = S.c;
    function uses(p) { var r = D.rng(S.handle + p.code); return Math.round(40 + r() * 900); }
    el.innerHTML = '<section class="panel panel-flush"><div class="panel-h"><div><h3 class="panel-t">Codes promo & partenaires</h3><p class="panel-d">Affichés dans la section « Codes promo » de votre univers</p></div><button type="button" class="btn btn-primary btn-sm" id="pmNew">' + S.ic('plus', 15) + 'Nouveau code</button></div>' +
      (c.promos.length ? '<div class="tbl-wrap"><table class="tbl tbl-cards"><thead><tr><th>Code</th><th>Partenaire</th><th>Avantage</th><th class="r">Utilisations</th><th>Expire</th><th>Statut</th><th></th></tr></thead><tbody>' + c.promos.map(function (p, i) {
        var expired = p.expires && new Date(p.expires) < new Date();
        return '<tr data-i="' + i + '"><td class="td-main"><button type="button" class="code" data-act="copy" title="Copier">' + esc(p.code) + S.ic('copy', 13) + '</button></td><td data-l="Partenaire"><b>' + esc(p.brand) + '</b><div class="xs mute ellip" style="max-width:240px">' + esc(p.desc || '') + '</div></td>' +
          '<td data-l="Avantage"><span class="pill pill-sig">' + esc(p.discount) + '</span></td><td class="r num" data-l="Utilisations">' + S.num(uses(p)) + (p.limit ? ' / ' + S.num(p.limit) : '') + '</td><td data-l="Expire" class="nowrap">' + (p.expires ? esc(S.date(p.expires, true)) : '<span class="mute">Jamais</span>') + '</td>' +
          '<td data-l="Statut">' + (p.active === false ? '<span class="pill pill-mute"><span class="dot"></span>En pause</span>' : expired ? '<span class="pill pill-err"><span class="dot"></span>Expiré</span>' : '<span class="pill pill-ok"><span class="dot"></span>Actif</span>') + '</td>' +
          '<td class="td-act r nowrap"><button type="button" class="icon-btn sm" data-act="edit" aria-label="Modifier">' + S.ic('edit', 15) + '</button><button type="button" class="icon-btn sm danger" data-act="del" aria-label="Supprimer">' + S.ic('trash', 15) + '</button></td></tr>';
      }).join('') + '</tbody></table></div>' : S.empty({ icon: 'tag', title: 'Aucun code promo', text: 'Partagez les codes de vos marques partenaires ou créez vos propres offres.' })) + '</section>';
    function again() { promos(S.fresh(el)); }
    el.querySelector('#pmNew').addEventListener('click', function () { promoEditor(null, again); });
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var i = +b.closest('[data-i]').getAttribute('data-i'), p = c.promos[i], a = b.getAttribute('data-act');
      if (a === 'copy') U.copy(p.code, 'Code « ' + p.code + ' » copié');
      if (a === 'edit') promoEditor(p, again);
      if (a === 'del') S.confirm('Supprimer le code « ' + p.code + ' » ?', { ok: 'Supprimer', danger: true }).then(function (ok) { if (ok) { c.promos.splice(i, 1); S.changed(); again(); } });
    });
  }
  function promoEditor(p, done) {
    var c = S.c, isNew = !p;
    var m = p ? S.clone(p) : { id: S.uid('c'), brand: '', code: '', discount: '-15 %', url: '', desc: '', active: true };
    if (m.active == null) m.active = true;
    S.modal({
      title: isNew ? 'Nouveau code promo' : 'Modifier « ' + p.code + ' »',
      body: '<div class="fgrid"><div class="field"><label for="pm-b">Partenaire / marque</label><input class="input" id="pm-b" data-k="brand" placeholder="Ex. Maison Sézane"></div>' +
        '<div class="field"><label for="pm-c">Code</label><input class="input code-in" id="pm-c" data-k="code" placeholder="LENA15" maxlength="24"></div>' +
        '<div class="field"><label for="pm-d">Avantage</label><input class="input" id="pm-d" data-k="discount" placeholder="-15 %"></div>' +
        '<div class="field"><label for="pm-e">Expiration</label><input class="input" id="pm-e" type="date" data-k="expires"></div>' +
        '<div class="field full"><label for="pm-u">Lien partenaire</label><input class="input" id="pm-u" data-k="url" placeholder="https://"></div>' +
        '<div class="field full"><label for="pm-s">Description</label><input class="input" id="pm-s" data-k="desc" placeholder="Sur toute la collection automne"></div>' +
        '<div class="field"><label for="pm-l">Limite d’utilisations</label><input class="input" id="pm-l" type="number" min="0" data-k="limit" data-t="num" placeholder="Illimité"></div>' +
        '<div class="field"><label>&nbsp;</label>' + S.toggle('data-k="active"', m.active, 'Code actif') + '</div></div>',
      foot: '<button type="button" class="btn btn-ghost btn-sm" data-close>Annuler</button><button type="button" class="btn btn-primary btn-sm" id="pmSave">' + (isNew ? 'Créer le code' : 'Enregistrer') + '</button>',
      onOpen: function (el, close) {
        S.bind(el, m, function (k, v, input) { if (k === 'code') { m.code = String(v).toUpperCase().replace(/\s+/g, ''); input.value = m.code; } });
        el.querySelector('#pmSave').addEventListener('click', function () {
          if (!m.code) { el.querySelector('#pm-c').focus(); U.toast('Ajoutez un code'); return; }
          if (!m.brand) m.brand = c.name;
          if (!m.limit) delete m.limit; if (!m.expires) delete m.expires; if (!m.url) m.url = '#';
          var i = c.promos.findIndex(function (x) { return x.id === m.id; });
          if (i >= 0) c.promos[i] = m; else c.promos.push(m);
          S.changed(); close(); U.toast(isNew ? 'Code créé' : 'Code mis à jour'); done();
        });
      }
    });
  }

  /* ---------------- Campagnes ---------------- */
  function segSize(id) {
    var n = S.segmentCount(id), total = S.c.stats.members || 80;
    return id === 'all' ? total : Math.round(n / 80 * total);
  }
  function campaigns(el, action) {
    var list = S.campaigns();
    var sent = list.filter(function (x) { return x.status === 'sent' && x.open; });
    var avgO = sent.length ? sent.reduce(function (a, x) { return a + x.open; }, 0) / sent.length : 0;
    var avgC = sent.length ? sent.reduce(function (a, x) { return a + x.click; }, 0) / sent.length : 0;
    var rev = list.reduce(function (a, x) { return a + (x.revenue || 0); }, 0);
    el.innerHTML = '<div class="kpis"><div class="kpi"><div class="kpi-l">Taux d’ouverture moyen</div><div class="kpi-v">' + S.pct(avgO) + '</div><div class="kpi-f"><span class="kpi-s">moyenne créateurs : 38 %</span></div></div>' +
      '<div class="kpi"><div class="kpi-l">Taux de clic moyen</div><div class="kpi-v">' + S.pct(avgC) + '</div><div class="kpi-f"><span class="kpi-s">moyenne créateurs : 9 %</span></div></div>' +
      '<div class="kpi"><div class="kpi-l">Revenus attribués</div><div class="kpi-v">' + S.money(rev) + '</div><div class="kpi-f"><span class="kpi-s">7 jours après envoi</span></div></div></div>' +
      '<section class="panel panel-flush mt"><div class="panel-h"><div><h3 class="panel-t">Historique des campagnes</h3><p class="panel-d">Newsletters, annonces et notifications push</p></div><button type="button" class="btn btn-sig btn-sm" id="cpNew">' + S.ic('send', 15) + 'Nouvelle campagne</button></div>' +
      (list.length ? '<div class="tbl-wrap"><table class="tbl tbl-cards"><thead><tr><th>Campagne</th><th>Segment</th><th class="r">Audience</th><th class="r">Ouverture</th><th class="r">Clics</th><th class="r">Revenus</th><th>Date</th></tr></thead><tbody>' + list.map(function (x) {
        var k = KIND[x.kind] || KIND.newsletter, sch = x.status === 'scheduled';
        return '<tr><td class="td-main"><div class="cell-main"><span class="kind-ic">' + S.ic(k[1], 16) + '</span><div style="min-width:0"><div class="t ellip" style="max-width:320px">' + esc(x.subject) + '</div><div class="s">' + esc(k[0]) + '</div></div></div></td>' +
          '<td data-l="Segment">' + esc(x.segment) + '</td><td class="r num" data-l="Audience">' + S.num(x.audience) + '</td>' +
          '<td class="r num" data-l="Ouverture">' + (sch || !x.open ? '<span class="mute">—</span>' : rate(x.open)) + '</td><td class="r num" data-l="Clics">' + (sch || !x.open ? '<span class="mute">—</span>' : rate(x.click)) + '</td>' +
          '<td class="r num" data-l="Revenus">' + (x.revenue ? esc(S.money(x.revenue)) : '<span class="mute">—</span>') + '</td>' +
          '<td data-l="Date" class="nowrap">' + (sch ? '<span class="pill pill-warn"><span class="dot"></span>' + esc(S.dateTime(x.sentAt)) + '</span>' : esc(S.date(x.sentAt, true))) + '</td></tr>';
      }).join('') + '</tbody></table></div>' : S.empty({ icon: 'mail', title: 'Aucune campagne', text: 'Envoyez votre première newsletter à vos membres.' })) + '</section>';
    function again() { campaigns(S.fresh(el)); }
    el.querySelector('#cpNew').addEventListener('click', function () { S.openCampaign(null, again); });
    if (action === 'new') { try { history.replaceState(null, '', '#/marketing/campaigns'); } catch (e) { /* ignore */ } S.openCampaign(S._draftCampaign || null, again); S._draftCampaign = null; }
  }
  function rate(v) { return '<span class="rate"><span class="rate-bar"><i style="width:' + Math.min(100, v * 100 / 0.7).toFixed(0) + '%"></i></span>' + S.pct(v, 0) + '</span>'; }

  /** Composer de campagne (peut être pré-rempli par le copilote) */
  S.openCampaign = function (draft, done) {
    var c = S.c, links = S.smartLinks();
    var m = Object.assign({ kind: 'newsletter', segment: 'all', subject: '', body: '', link: 'root', when: 'now' }, draft || {});
    var defDate = new Date(Date.now() + 864e5); defDate.setHours(18, 30, 0, 0);
    var localIso = new Date(defDate.getTime() - defDate.getTimezoneOffset() * 6e4).toISOString().slice(0, 16);
    S.modal({
      title: 'Nouvelle campagne', wide: true, cls: 'dlg-cp',
      body: '<div class="cp">' +
        '<div class="cp-form">' +
          '<div class="field"><label>Format</label>' + S.seg('cp-k', [{ v: 'newsletter', l: 'Newsletter', icon: 'mail' }, { v: 'announce', l: 'Annonce', icon: 'marketing' }, { v: 'push', l: 'Push', icon: 'bell' }], m.kind, 'seg-full') + '</div>' +
          '<div class="field mt"><label>Audience</label><div class="aud-grid">' + S.SEGMENTS.map(function (s) {
            return '<label class="aud"><input type="radio" name="cp-seg" value="' + s.id + '"' + (m.segment === s.id ? ' checked' : '') + '><span class="aud-c"><b class="num">≈ ' + S.num(segSize(s.id)) + '</b><span>' + esc(s.id === 'all' ? 'Tous les membres' : s.l) + '</span></span></label>';
          }).join('') + '</div></div>' +
          '<div class="field mt" id="cpSubjF"><div class="field-top"><label for="cp-s">Objet</label><span class="cnt" id="cpSc"></span></div><input class="input" id="cp-s" data-k="subject" placeholder="Ce que je ne poste nulle part…"></div>' +
          '<div class="field mt"><div class="field-top"><label for="cp-b" id="cpBl">Message</label><a class="link-btn xs" href="#/copilot/email">✦ Rédiger avec le copilote</a></div><textarea class="textarea" id="cp-b" data-k="body" rows="6" placeholder="Bonjour {prénom}, …"></textarea></div>' +
          '<div class="field mt"><label for="cp-l">Bouton / lien</label><select class="select" id="cp-l" data-k="link">' + links.map(function (l) { return '<option value="' + esc(l.id) + '">' + esc(l.name) + '</option>'; }).join('') + '</select></div>' +
          '<div class="field mt"><label>Envoi</label>' + S.seg('cp-w', [{ v: 'now', l: 'Maintenant' }, { v: 'later', l: 'Programmer' }], m.when, 'seg-full') + '<input class="input mt-xs" type="datetime-local" id="cp-d" value="' + localIso + '" hidden aria-label="Date d’envoi"></div>' +
        '</div>' +
        '<aside class="cp-prev"><div class="xs mute pe-prev-l">Aperçu</div><div id="cpPrev"></div></aside>' +
      '</div>',
      foot: '<span class="xs mute" id="cpReach"></span><span class="spacer"></span><button type="button" class="btn btn-ghost btn-sm" data-close>Annuler</button><button type="button" class="btn btn-sig btn-sm" id="cpSend">' + S.ic('send', 14) + 'Envoyer</button>',
      onOpen: function (el, close) {
        function prev() {
          var seg = S.SEGMENTS.filter(function (s) { return s.id === m.segment; })[0];
          var n = segSize(m.segment), reach = m.kind === 'newsletter' || m.kind === 'announce' ? Math.round(n * 0.7) : n;
          el.querySelector('#cpSubjF').hidden = m.kind === 'push';
          el.querySelector('#cpBl').textContent = m.kind === 'push' ? 'Texte de la notification' : 'Message';
          el.querySelector('#cp-d').hidden = m.when !== 'later';
          el.querySelector('#cpSend').innerHTML = S.ic('send', 14) + (m.when === 'later' ? 'Programmer' : 'Envoyer');
          el.querySelector('#cpReach').textContent = '≈ ' + S.num(reach) + ' destinataires' + (m.kind !== 'push' ? ' (consentement email)' : '') + ' · ' + (seg.id === 'all' ? 'Tous' : seg.l);
          var body = esc(m.body || 'Votre message apparaîtra ici.').replace(/\{prénom\}/g, 'Camille').replace(/\n/g, '<br>');
          var l = links.filter(function (x) { return x.id === m.link; })[0] || links[0];
          el.querySelector('#cpPrev').innerHTML = m.kind === 'push'
            ? '<div class="push-prev"><div class="push-app"><span class="push-ic">3</span><b>' + esc(c.name) + '</b><span class="xs mute">maintenant</span></div><div class="push-t">' + body + '</div></div>'
            : '<div class="mail-prev"><div class="mail-h"><div class="xs mute">De : ' + esc(c.name) + ' · via SECR3TLY</div><div class="mail-s">' + esc(m.subject || 'Objet de votre email') + '</div></div><div class="mail-cover">' + U.art(c.cover) + '<span class="mail-av">' + U.avatar(c, 44) + '</span></div><div class="mail-b">' + body + '<a class="mail-btn">' + esc(m.kind === 'announce' ? 'Découvrir' : 'Lire la suite') + ' →</a><div class="mail-l">' + esc(short(l.url)) + '</div></div><div class="mail-f">Vous recevez cet email car vous êtes membre de l’univers de ' + esc(c.name) + '. Se désinscrire.</div></div>';
        }
        S.bind(el, m, prev);
        S.counter(el.querySelector('#cp-s'), el.querySelector('#cpSc'), 60);
        S.onSeg(el, 'cp-k', function (v) { m.kind = v; prev(); });
        S.onSeg(el, 'cp-w', function (v) { m.when = v; prev(); });
        el.querySelectorAll('input[name="cp-seg"]').forEach(function (r) { r.addEventListener('change', function () { m.segment = r.value; prev(); }); });
        prev();
        el.querySelector('#cpSend').addEventListener('click', function () {
          if (m.kind !== 'push' && !m.subject.trim()) { el.querySelector('#cp-s').focus(); U.toast('Ajoutez un objet'); return; }
          if (!m.body.trim()) { el.querySelector('#cp-b').focus(); U.toast('Écrivez votre message'); return; }
          var seg = S.SEGMENTS.filter(function (s) { return s.id === m.segment; })[0];
          var later = m.when === 'later';
          var list = ensureCampaigns();
          list.unshift({ id: S.uid('cp'), kind: m.kind, subject: m.kind === 'push' ? m.body.slice(0, 70) : m.subject, body: m.body, segment: seg.id === 'all' ? 'Tous' : seg.l, audience: segSize(m.segment), status: later ? 'scheduled' : 'sent', sentAt: later ? el.querySelector('#cp-d').value : new Date().toISOString(), open: 0, click: 0, link: m.link });
          S.changed({ preview: false }); close();
          U.toast(later ? 'Campagne programmée' : 'Campagne envoyée — les statistiques arrivent dans quelques minutes');
          if (done) done(); else if (S.route.id === 'marketing') S.render();
        });
      }
    });
  };

  S.register('marketing', { title: 'Marketing', group: 'Audience', icon: 'marketing', render: render });
})(window);
