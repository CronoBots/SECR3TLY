/* Studio — Communauté : CRM membres, segments, fiche membre, messagerie */
(function (root) {
  'use strict';
  var S = root.Studio, D = root.Secretly, U = root.SecretlyUI, esc = S.esc;

  var SEGMENTS = [
    { id: 'all', l: 'Tous', f: function () { return true; } },
    { id: 'new', l: 'Nouveaux membres', f: function (m) { return m.tags.indexOf('Nouveau') >= 0; } },
    { id: 'vip', l: 'VIP', f: function (m) { return m.tags.indexOf('VIP') >= 0; } },
    { id: 'clients', l: 'Clients', f: function (m) { return m.tags.indexOf('Client') >= 0; } },
    { id: 'former', l: 'Anciens clients', f: function (m) { return m.status === 'churned'; } },
    { id: 'premium', l: 'Abonnés premium', f: function (m) { return m.level === 'vip' || m.level === 'private'; } },
    { id: 'event', l: 'Participants à un événement', f: function (m) { return m.tags.indexOf('Événement') >= 0; } }
  ];
  S.SEGMENTS = SEGMENTS;
  var st = { seg: 'all', q: '', tier: '', level: '', status: '', tag: '', sel: {}, limit: 25, conv: null };
  var FLAGS = { FR: 'France', BE: 'Belgique', CH: 'Suisse', CA: 'Canada', US: 'États-Unis', LU: 'Luxembourg', MA: 'Maroc' };

  S.members = function () { return D.members(S.handle, 80); };
  S.segmentCount = function (id) { var s = SEGMENTS.filter(function (x) { return x.id === id; })[0]; return S.members().filter(s.f).length; };
  function mAvatar(m, size) {
    var h = 0; for (var i = 0; i < m.name.length; i++) h = (h * 31 + m.name.charCodeAt(i)) >>> 0;
    var pal = [['#e8b4bc', '#9c7fa6'], ['#d9c3a0', '#c0707f'], ['#c9b2d2', '#6a8caf'], ['#f2d7c9', '#c0707f'], ['#9c7fa6', '#2a1d22'], ['#e9c9a8', '#9a7b56']][h % 6];
    var ini = m.name.split(' ').map(function (x) { return x[0]; }).join('').slice(0, 2);
    size = size || 34;
    return '<span class="avatar" style="width:' + size + 'px;height:' + size + 'px;font-size:' + Math.round(size * 0.36) + 'px;background:linear-gradient(135deg,' + pal[0] + ',' + pal[1] + ')">' + esc(ini) + '</span>';
  }
  S.mAvatar = mAvatar;
  function statusPill(m) { return m.status === 'active' ? '<span class="pill pill-ok"><span class="dot"></span>Actif</span>' : '<span class="pill pill-err"><span class="dot"></span>Résilié</span>'; }
  function seen(d) { return d === 0 ? 'Aujourd’hui' : d === 1 ? 'Hier' : 'Il y a ' + d + ' j'; }

  function render(main, sub) {
    var tab = sub === 'messages' ? 'messages' : 'members';
    main.innerHTML = '<div class="sec-h"><div><h2 class="sec-t">Communauté</h2><p class="sec-d">Votre CRM : membres, segments, historique et consentements — et vos conversations privées.</p></div></div>' +
      S.subtabs('community', [{ id: 'members', label: 'Membres', count: 80 }, { id: 'messages', label: 'Messages', count: unread() || null }], tab) + '<div id="cmBody"></div>';
    var body = main.querySelector('#cmBody');
    if (tab === 'messages') inbox(body); else membersView(body);
  }

  /* ---------------- Membres ---------------- */
  function membersView(el) {
    var all = S.members();
    var tiers = []; all.forEach(function (m) { if (tiers.indexOf(m.tier) < 0) tiers.push(m.tier); });
    var tags = ['Nouveau', 'VIP', 'Private', 'Client', 'Inactif', 'Événement'];
    var spent = all.reduce(function (a, m) { return a + m.spent; }, 0);
    var active = all.filter(function (m) { return m.status === 'active'; }).length;
    var consent = all.filter(function (m) { return m.consentMarketing; }).length;
    el.innerHTML =
      '<div class="kpis">' +
        '<div class="kpi"><div class="kpi-l">Membres (CRM)</div><div class="kpi-v">' + S.num(all.length) + '</div><div class="kpi-f"><span class="kpi-s">sur ' + esc(S.num(S.c.stats.members)) + ' au total</span></div></div>' +
        '<div class="kpi"><div class="kpi-l">Actifs</div><div class="kpi-v">' + S.pct(active / all.length, 0) + '</div><div class="kpi-f"><span class="kpi-s">' + S.num(active) + ' abonnements en cours</span></div></div>' +
        '<div class="kpi"><div class="kpi-l">Valeur vie moyenne</div><div class="kpi-v">' + S.money(spent / all.length) + '</div><div class="kpi-f"><span class="kpi-s">dépense moyenne par membre</span></div></div>' +
      '</div>' +
      '<div class="seg-cards mt" id="cmSegs">' + SEGMENTS.map(function (s) {
        var n = all.filter(s.f).length;
        return '<button type="button" class="segc' + (st.seg === s.id ? ' on' : '') + '" data-seg="' + s.id + '"><span class="segc-n">' + S.num(n) + '</span><span class="segc-l">' + esc(s.l) + '</span></button>';
      }).join('') + '</div>' +
      '<div class="panel panel-flush mt"><div class="cm-tools">' +
        '<div class="input-ic grow"><span>' + S.ic('search', 16) + '</span><input class="input input-sm" id="cmQ" placeholder="Rechercher un membre" value="' + esc(st.q) + '" aria-label="Rechercher un membre"></div>' +
        sel('cmTier', 'Palier', tiers.map(function (t) { return [t, t]; }), st.tier) +
        sel('cmLvl', 'Niveau', D.LEVELS.map(function (l) { return [l.id, l.name]; }), st.level) +
        sel('cmSt', 'Statut', [['active', 'Actif'], ['churned', 'Résilié']], st.status) +
        sel('cmTag', 'Tag', tags.map(function (t) { return [t, t]; }), st.tag) +
      '</div><div class="bulk" id="cmBulk" hidden></div><div id="cmTable"></div></div>' +
      '<p class="xs mute mt">Consentement marketing : ' + S.num(consent) + ' membres sur ' + S.num(all.length) + ' (' + S.pct(consent / all.length, 0) + '). Les campagnes email ne sont envoyées qu’aux membres ayant consenti.</p>';

    var tableEl = el.querySelector('#cmTable'), bulk = el.querySelector('#cmBulk');
    function filtered() {
      var seg = SEGMENTS.filter(function (s) { return s.id === st.seg; })[0];
      var q = st.q.toLowerCase().trim();
      return all.filter(function (m) {
        return seg.f(m) && (!q || m.name.toLowerCase().indexOf(q) >= 0) && (!st.tier || m.tier === st.tier) && (!st.level || m.level === st.level) && (!st.status || m.status === st.status) && (!st.tag || m.tags.indexOf(st.tag) >= 0);
      });
    }
    function draw() {
      var list = filtered(), shown = list.slice(0, st.limit);
      var allSel = shown.length && shown.every(function (m) { return st.sel[m.id]; });
      tableEl.innerHTML = list.length ? '<label class="sel-all-m"><input type="checkbox" class="cb" id="cmAllM"' + (allSel ? ' checked' : '') + '> Tout sélectionner (' + shown.length + ')</label><div class="tbl-wrap"><table class="tbl tbl-cards cm-tbl"><thead><tr><th style="width:36px"><input type="checkbox" class="cb" id="cmAll" aria-label="Tout sélectionner"' + (allSel ? ' checked' : '') + '></th><th>Membre</th><th>Palier</th><th>Statut</th><th class="r">Dépensé</th><th>Inscrit</th><th>Dernière visite</th><th>Tags</th></tr></thead><tbody>' +
        shown.map(function (m) {
          return '<tr data-id="' + m.id + '" class="' + (st.sel[m.id] ? 'sel' : '') + '"><td class="td-cb"><input type="checkbox" class="cb" data-cb="' + m.id + '" aria-label="Sélectionner ' + esc(m.name) + '"' + (st.sel[m.id] ? ' checked' : '') + '></td>' +
            '<td class="td-main"><button type="button" class="cell-main cm-open" data-open="' + m.id + '">' + mAvatar(m) + '<span style="min-width:0;text-align:left"><span class="t" style="display:block">' + esc(m.name) + '</span><span class="s">' + esc(FLAGS[m.country] || m.country) + '</span></span></button></td>' +
            '<td data-l="Palier"><span class="row cell-r" style="gap:8px">' + esc(m.tier) + ' ' + S.lvl(m.level) + '</span></td><td data-l="Statut">' + statusPill(m) + '</td>' +
            '<td class="r num" data-l="Dépensé">' + esc(S.money(m.spent)) + '</td><td data-l="Inscrit" class="nowrap">' + esc(S.date(m.joined, true)) + '</td><td data-l="Dernière visite" class="nowrap">' + esc(seen(m.lastSeenDays)) + '</td>' +
            '<td data-l="Tags"><span class="row-wrap cell-r" style="gap:4px">' + (m.tags.map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') || '<span class="mute">—</span>') + '</span></td></tr>';
        }).join('') + '</tbody></table></div>' +
        '<div class="tbl-foot"><span class="xs mute">' + S.num(shown.length) + ' sur ' + S.num(list.length) + ' membres</span>' + (list.length > shown.length ? '<button type="button" class="btn btn-ghost btn-sm" id="cmMore">Afficher plus</button>' : '') + '</div>'
        : S.empty({ icon: 'community', title: 'Aucun membre', text: 'Aucun membre ne correspond à ces critères.' });
      drawBulk();
    }
    function drawBulk() {
      var ids = Object.keys(st.sel).filter(function (k) { return st.sel[k]; });
      bulk.hidden = !ids.length;
      bulk.innerHTML = '<span><b>' + ids.length + '</b> sélectionné' + (ids.length > 1 ? 's' : '') + '</span><span class="spacer"></span>' +
        '<button type="button" class="btn btn-ghost btn-xs" id="cmClear">Désélectionner</button><button type="button" class="btn btn-ghost btn-xs" id="cmCsv">' + S.ic('download', 14) + 'CSV</button><button type="button" class="btn btn-sig btn-xs" id="cmMsg">' + S.ic('send', 14) + 'Envoyer un message</button>';
    }
    draw();
    el.querySelector('#cmSegs').addEventListener('click', function (e) {
      var b = e.target.closest('.segc'); if (!b) return; st.seg = b.getAttribute('data-seg'); st.limit = 25;
      el.querySelectorAll('.segc').forEach(function (x) { x.classList.toggle('on', x === b); }); draw();
    });
    el.querySelector('#cmQ').addEventListener('input', function () { st.q = this.value; st.limit = 25; draw(); });
    [['cmTier', 'tier'], ['cmLvl', 'level'], ['cmSt', 'status'], ['cmTag', 'tag']].forEach(function (x) { el.querySelector('#' + x[0]).addEventListener('change', function () { st[x[1]] = this.value; st.limit = 25; draw(); }); });
    el.addEventListener('change', function (e) {
      if (e.target.id === 'cmAll' || e.target.id === 'cmAllM') { filtered().slice(0, st.limit).forEach(function (m) { st.sel[m.id] = e.target.checked; }); draw(); }
      var id = e.target.getAttribute('data-cb'); if (id) { st.sel[id] = e.target.checked; e.target.closest('tr').classList.toggle('sel', e.target.checked); drawBulk(); }
    });
    el.addEventListener('click', function (e) {
      var o = e.target.closest('[data-open]'); if (o) { memberDrawer(all.filter(function (m) { return m.id === o.getAttribute('data-open'); })[0]); return; }
      if (e.target.closest('#cmMore')) { st.limit += 25; draw(); }
      if (e.target.closest('#cmClear')) { st.sel = {}; draw(); }
      var chosen = function () { return all.filter(function (m) { return st.sel[m.id]; }); };
      if (e.target.closest('#cmMsg')) composer(chosen(), function () { st.sel = {}; draw(); });
      if (e.target.closest('#cmCsv')) {
        var rows = [['Nom', 'Palier', 'Niveau', 'Statut', 'Pays', 'Inscrit', 'Dépensé', 'Tags', 'Consentement marketing']].concat(chosen().map(function (m) { return [m.name, m.tier, m.level, m.status, m.country, m.joined, m.spent, m.tags.join(' '), m.consentMarketing ? 'oui' : 'non']; }));
        S.download('membres-' + S.handle + '.csv', rows.map(function (r) { return r.map(function (v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(';'); }).join('\n'), 'text/csv;charset=utf-8');
      }
    });
  }
  function sel(id, label, opts, v) {
    return '<select class="select input-sm" id="' + id + '" aria-label="' + esc(label) + '"><option value="">' + esc(label) + ' : tous</option>' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === v ? ' selected' : '') + '>' + esc(o[1]) + '</option>'; }).join('') + '</select>';
  }

  function memberDrawer(m) {
    var c = S.c, r = D.rng(S.handle + m.id + 'hist');
    var notes = D.store.get('studio:notes:' + S.handle, {});
    var hist = [], t = new Date(m.joined + 'T12:00').getTime();
    hist.push({ i: 'user', t: 'Inscription', s: 'via ' + ['Instagram', 'TikTok', 'QR code', 'YouTube', 'lien direct'][Math.floor(r() * 5)], at: t });
    if (m.tier !== 'Free') hist.push({ i: 'star', t: 'Abonnement ' + m.tier, s: S.levelName(m.level), at: t + 864e5 * Math.floor(r() * 10) });
    for (var i = 0; i < m.purchases; i++) {
      var p = c.products[Math.floor(r() * c.products.length)];
      if (p) hist.push({ i: 'commerce', t: 'Achat', s: p.name + ' · ' + S.money(p.price), at: t + 864e5 * (5 + Math.floor(r() * (Date.now() - t) / 864e5)) });
    }
    var po = c.posts[Math.floor(r() * Math.max(1, c.posts.length))];
    if (po) hist.push({ i: 'chat', t: 'Commentaire', s: '« ' + po.title + ' »', at: Date.now() - 864e5 * (m.lastSeenDays + 1) });
    if (m.tags.indexOf('Événement') >= 0 && c.events[0]) hist.push({ i: 'calendar', t: 'Participation', s: c.events[0].title, at: Date.now() - 864e5 * (m.lastSeenDays + 3) });
    if (m.status === 'churned') hist.push({ i: 'x', t: 'Résiliation', s: 'Motif : ' + ['prix', 'moins de temps', 'contenu', 'non précisé'][Math.floor(r() * 4)], at: Date.now() - 864e5 * m.lastSeenDays });
    hist = hist.filter(function (h) { return h.at <= Date.now(); }).sort(function (a, b) { return b.at - a.at; });
    S.drawer({
      title: m.name, subtitle: m.tier + ' · ' + (FLAGS[m.country] || m.country) + ' · membre depuis le ' + S.date(m.joined, true),
      body:
        '<div class="md-head">' + mAvatar(m, 64) + '<div class="row-wrap">' + S.lvl(m.level) + statusPill(m) + m.tags.map(function (t) { return '<span class="tag">' + esc(t) + '</span>'; }).join('') + '</div></div>' +
        '<div class="md-stats"><div><b>' + esc(S.money(m.spent)) + '</b><span>Total dépensé</span></div><div><b>' + m.purchases + '</b><span>Achats</span></div><div><b>' + m.messages + '</b><span>Messages</span></div><div><b>' + esc(seen(m.lastSeenDays)) + '</b><span>Dernière visite</span></div></div>' +
        '<h4 class="md-h">Consentements</h4><ul class="md-consent">' +
          '<li>' + (m.consentMarketing ? '<span class="ok">' + S.ic('check', 15) + '</span>' : '<span class="no">' + S.ic('x', 15) + '</span>') + 'Emails marketing & newsletter</li>' +
          '<li><span class="ok">' + S.ic('check', 15) + '</span>Conditions & politique de confidentialité (' + esc(S.date(m.joined, true)) + ')</li>' +
          '<li>' + (m.level !== 'public' ? '<span class="ok">' + S.ic('check', 15) + '</span>' : '<span class="no">' + S.ic('x', 15) + '</span>') + 'Notifications push</li></ul>' +
        '<h4 class="md-h">Historique & interactions</h4><ol class="timeline">' + hist.map(function (h) { return '<li><span class="tl-ic">' + S.ic(h.i, 14) + '</span><div><div class="tl-t">' + esc(h.t) + '</div><div class="tl-s">' + esc(h.s) + '</div></div><time>' + esc(S.date(new Date(h.at), true)) + '</time></li>'; }).join('') + '</ol>' +
        '<h4 class="md-h">Note privée</h4><textarea class="textarea" id="mdNote" rows="3" placeholder="Visible par vous seul·e">' + esc(notes[m.id] || '') + '</textarea>',
      foot: '<button type="button" class="btn btn-ghost btn-sm" id="mdGift">' + S.ic('star', 14) + 'Offrir un mois</button><span class="spacer"></span><button type="button" class="btn btn-sig btn-sm" id="mdMsg">' + S.ic('send', 14) + 'Envoyer un message</button>',
      onOpen: function (el, close) {
        el.querySelector('#mdNote').addEventListener('input', function () { notes[m.id] = this.value; D.store.set('studio:notes:' + S.handle, notes); S.setSaved('saved'); });
        el.querySelector('#mdMsg').addEventListener('click', function () { composer([m]); });
        el.querySelector('#mdGift').addEventListener('click', function () { U.toast('Un mois offert à ' + m.name + ' (démo)'); });
      }
    });
  }

  /** Composer un message à une sélection de membres */
  function composer(list, done) {
    var n = list.length, first = list[0];
    var reach = list.filter(function (m) { return m.consentMarketing; }).length;
    S.modal({
      title: 'Envoyer un message', subtitle: n === 1 ? 'À ' + first.name : n + ' destinataires sélectionnés',
      body: '<div class="field"><label>Canal</label>' + S.seg('cmp-ch', [{ v: 'dm', l: 'Message privé' }, { v: 'email', l: 'Email' }, { v: 'push', l: 'Notification' }], 'dm', 'seg-full') + '</div>' +
        '<p class="xs mute mt" id="cmpReach">Message privé dans l’univers : ' + n + ' destinataire' + (n > 1 ? 's' : '') + '.</p>' +
        '<div class="field mt" id="cmpSubjF" hidden><label for="cmpSubj">Objet</label><input class="input" id="cmpSubj" placeholder="Un petit mot pour vous"></div>' +
        '<div class="field mt"><div class="field-top"><label for="cmpBody">Message</label><button type="button" class="link-btn xs" id="cmpVar">+ {prénom}</button></div><textarea class="textarea" id="cmpBody" rows="5">Bonjour {prénom},\n\nMerci de faire partie de mon univers ✦ </textarea></div>' +
        '<div class="msg-prev mt"><div class="xs mute">Aperçu pour ' + esc(first.name.split(' ')[0]) + '</div><div class="bubble me" id="cmpPrev"></div></div>',
      foot: '<button type="button" class="btn btn-ghost btn-sm" data-close>Annuler</button><button type="button" class="btn btn-sig btn-sm" id="cmpSend">' + S.ic('send', 14) + 'Envoyer</button>',
      onOpen: function (el, close) {
        var ch = 'dm', ta = el.querySelector('#cmpBody');
        function prev() { el.querySelector('#cmpPrev').textContent = ta.value.replace(/\{prénom\}/g, first.name.split(' ')[0]); }
        ta.addEventListener('input', prev); prev();
        el.querySelector('#cmpVar').addEventListener('click', function () { var p = ta.selectionStart || ta.value.length; ta.value = ta.value.slice(0, p) + '{prénom}' + ta.value.slice(p); ta.focus(); prev(); });
        S.onSeg(el, 'cmp-ch', function (v) {
          ch = v; el.querySelector('#cmpSubjF').hidden = v !== 'email';
          el.querySelector('#cmpReach').textContent = v === 'email' ? 'Email : ' + reach + ' destinataire(s) ayant consenti sur ' + n + '.' : v === 'push' ? 'Notification push : ' + n + ' destinataire(s) avec l’app ou les notifications activées.' : 'Message privé dans l’univers : ' + n + ' destinataire' + (n > 1 ? 's' : '') + '.';
        });
        el.querySelector('#cmpSend').addEventListener('click', function () {
          if (!ta.value.trim()) { ta.focus(); return; }
          var sent = ch === 'email' ? reach : n;
          var c = S.c; c.campaigns = S.campaigns ? S.campaigns() : (c.campaigns || []);
          c.campaigns.unshift({ id: S.uid('cp'), kind: ch === 'email' ? 'newsletter' : ch === 'push' ? 'push' : 'message', subject: el.querySelector('#cmpSubj').value || ta.value.split('\n')[0].slice(0, 60), body: ta.value, segment: n === 1 ? first.name : n + ' membres sélectionnés', audience: sent, status: 'sent', sentAt: new Date().toISOString(), open: 0, click: 0 });
          S.changed({ preview: false });
          close(); U.toast('Message envoyé à ' + sent + ' membre' + (sent > 1 ? 's' : ''));
          if (done) done();
        });
      }
    });
  }
  S.composeTo = composer;

  /* ---------------- Messagerie ---------------- */
  function threads() {
    var c = S.c, mem = S.members(), r = D.rng(S.handle + 'inbox');
    var tiers = c.tiers.filter(function (t) { return t.price > 0; });
    var post = c.posts[0], prod = c.products[0], ev = c.events[0], vip = tiers[tiers.length - 1];
    var first = c.name.split(' ')[0];
    var T = [
      [['them', 'Coucou ' + first + ' ! ' + (post ? 'J’ai adoré « ' + post.title + ' »' : 'J’adore ton univers') + ' 😍'], ['them', 'Tu pourrais en faire une série ?']],
      [['them', 'Bonjour, est-ce que l’abonnement ' + (vip ? vip.name : 'VIP') + ' inclut les replays des lives ?']],
      [['them', prod ? 'Hello, ma commande « ' + prod.name + ' » est-elle bien partie ?' : 'Hello, une question sur ma commande'], ['me', 'Bonjour ! Oui, expédiée hier, vous recevrez le suivi par email.'], ['them', 'Merci beaucoup 🙏']],
      [['them', 'Merci pour le live d’hier, c’était génial ✨']],
      [['them', 'Bonjour ' + first + ', je gère une petite marque et j’aimerais vous proposer une collaboration. Qui contacter ?']],
      [['them', ev ? 'Il reste des places pour « ' + ev.title + ' » ?' : 'Tu prévois un événement bientôt ?']],
      [['them', 'Le code promo ne fonctionne pas chez moi 😕']],
      [['them', 'Tes conseils ont changé ma façon de voir les choses, merci ❤️']]
    ];
    return T.map(function (msgs, i) {
      var m = mem[(i * 7 + 3) % mem.length];
      var at = Date.now() - (i * 3.3 + r() * 2) * 3600e3;
      return { id: 'cv' + i, m: m, msgs: msgs.map(function (x, j) { return { from: x[0], text: x[1], at: at - (msgs.length - j) * 9e5 }; }), unread: i < 3 };
    });
  }
  function inboxState() { return D.store.get('studio:inbox:' + S.handle, { read: {}, replies: {} }); }
  function unread() { var s = inboxState(); return threads().filter(function (t) { return t.unread && !s.read[t.id]; }).length; }

  function inbox(el) {
    var list = threads(), state = inboxState();
    function msgsOf(t) { return t.msgs.concat(state.replies[t.id] || []); }
    el.innerHTML = '<div class="inbox' + (st.conv ? ' has-conv' : '') + '" id="ibx"><div class="ib-list" id="ibList"></div><div class="ib-conv" id="ibConv"></div></div>';
    var ibx = el.querySelector('#ibx');
    function drawList() {
      el.querySelector('#ibList').innerHTML = '<div class="ib-search input-ic"><span>' + S.ic('search', 16) + '</span><input class="input input-sm" placeholder="Rechercher" id="ibQ" aria-label="Rechercher une conversation"></div><ul role="list">' + list.map(function (t) {
        var ms = msgsOf(t), last = ms[ms.length - 1], un = t.unread && !state.read[t.id];
        return '<li><button type="button" class="ib-row' + (st.conv === t.id ? ' on' : '') + (un ? ' unread' : '') + '" data-c="' + t.id + '" data-n="' + esc(t.m.name.toLowerCase()) + '">' + mAvatar(t.m, 40) +
          '<span class="ib-mid"><span class="ib-top"><span class="ib-n">' + esc(t.m.name) + '</span><time>' + esc(S.ago(last.at)) + '</time></span><span class="ib-last">' + (last.from === 'me' ? 'Vous : ' : '') + esc(last.text) + '</span></span>' + (un ? '<span class="ib-dot" aria-label="Non lu"></span>' : '') + '</button></li>';
      }).join('') + '</ul>';
      el.querySelector('#ibQ').addEventListener('input', function () { var q = this.value.toLowerCase(); el.querySelectorAll('.ib-row').forEach(function (r) { r.parentNode.hidden = q && r.getAttribute('data-n').indexOf(q) < 0; }); });
    }
    function drawConv() {
      var conv = el.querySelector('#ibConv');
      var t = list.filter(function (x) { return x.id === st.conv; })[0];
      if (!t) { conv.innerHTML = S.empty({ icon: 'chat', title: 'Vos conversations', text: 'Sélectionnez une conversation pour lire et répondre.' }); return; }
      var ms = msgsOf(t);
      conv.innerHTML = '<div class="ib-head"><button type="button" class="icon-btn ib-back" aria-label="Retour">' + S.ic('left', 18) + '</button>' + mAvatar(t.m, 36) + '<div class="grow" style="min-width:0"><div class="ib-n">' + esc(t.m.name) + '</div><div class="xs mute">' + esc(t.m.tier) + ' · ' + esc(S.money(t.m.spent)) + ' dépensés</div></div>' + S.lvl(t.m.level) + '</div>' +
        '<div class="ib-msgs" id="ibMsgs">' + ms.map(function (x) { return '<div class="bubble ' + (x.from === 'me' ? 'me' : 'them') + '">' + esc(x.text) + '<time>' + esc(S.ago(x.at)) + '</time></div>'; }).join('') + '</div>' +
        '<div class="ib-quick">' + ['Merci infiniment ✦', 'Je t’envoie le lien en privé', 'Tout est dans le cercle VIP 💫'].map(function (q) { return '<button type="button" class="fchip" data-q="' + esc(q) + '">' + esc(q) + '</button>'; }).join('') + '<button type="button" class="fchip" id="ibAi">' + S.ic('copilot', 13) + 'Suggérer</button></div>' +
        '<form class="ib-reply" id="ibForm"><textarea class="textarea" id="ibText" rows="1" placeholder="Écrire une réponse…" aria-label="Réponse"></textarea><button type="submit" class="btn btn-sig btn-sm" aria-label="Envoyer">' + S.ic('send', 16) + '</button></form>';
      var box = conv.querySelector('#ibMsgs'); box.scrollTop = box.scrollHeight;
      var ta = conv.querySelector('#ibText');
      conv.querySelector('.ib-back').addEventListener('click', function () { st.conv = null; ibx.classList.remove('has-conv'); drawList(); });
      conv.querySelectorAll('[data-q]').forEach(function (b) { b.addEventListener('click', function () { ta.value = b.getAttribute('data-q'); ta.focus(); }); });
      conv.querySelector('#ibAi').addEventListener('click', function () {
        var lastThem = ms.filter(function (x) { return x.from === 'them'; }).pop();
        ta.value = S.aiReply ? S.aiReply(lastThem ? lastThem.text : '', t.m) : 'Merci pour ton message ✦';
        ta.focus();
      });
      ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); conv.querySelector('#ibForm').requestSubmit(); } });
      conv.querySelector('#ibForm').addEventListener('submit', function (e) {
        e.preventDefault(); var v = ta.value.trim(); if (!v) return;
        (state.replies[t.id] = state.replies[t.id] || []).push({ from: 'me', text: v, at: Date.now() });
        D.store.set('studio:inbox:' + S.handle, state); drawConv(); drawList();
        conv.querySelector('#ibText').focus();
      });
    }
    el.addEventListener('click', function (e) {
      var r = e.target.closest('.ib-row'); if (!r) return;
      st.conv = r.getAttribute('data-c'); state.read[st.conv] = true; D.store.set('studio:inbox:' + S.handle, state);
      ibx.classList.add('has-conv'); drawList(); drawConv();
      var ta = el.querySelector('#ibText'); if (ta && root.innerWidth > 900) ta.focus();
    });
    if (!st.conv && root.innerWidth >= 900) { st.conv = list[0].id; state.read[st.conv] = true; D.store.set('studio:inbox:' + S.handle, state); ibx.classList.add('has-conv'); }
    drawList(); drawConv();
  }

  S.on('account', function () { st.sel = {}; st.conv = null; });
  S.register('community', { title: 'Communauté', group: 'Audience', icon: 'community', render: render, badge: function () { var n = unread(); return n || ''; } });
})(window);
