/* Studio — Vue d'ensemble */
(function (root) {
  'use strict';
  var S = root.Studio, D = root.Secretly, U = root.SecretlyUI, esc = S.esc;

  function greeting() {
    var h = new Date().getHours();
    return h < 5 ? 'Bonne nuit' : h < 12 ? 'Bonjour' : h < 18 ? 'Bel après-midi' : 'Bonsoir';
  }

  /** Flux d'activité : actions réelles du navigateur + activité simulée déterministe */
  S.activity = function (limit) {
    var c = S.c, out = [];
    D.localEvents(c.handle).slice(-12).reverse().forEach(function (e) {
      var map = {
        visit: ['eye', 'Nouvelle visite de votre univers', 'depuis ce navigateur'],
        click: ['link', 'Clic sur un lien', e.d.label || e.d.slug || ''],
        subscribe: ['star', 'Nouvel abonnement', (e.d.tier || '') + (e.d.amount ? ' · ' + S.money(e.d.amount) : '')],
        purchase: ['commerce', 'Nouvel achat', e.d.amount ? S.money(e.d.amount) : '']
      }[e.t];
      if (map) out.push({ icon: map[0], t: map[1], s: map[2], at: e.at, real: true });
    });
    var mem = D.members(c.handle, 30), r = D.rng(c.handle + 'feed' + new Date().toDateString());
    var tiers = c.tiers.filter(function (t) { return t.price > 0; });
    var posts = c.posts.slice(), prods = c.products.slice();
    var t = Date.now() - 4 * 60e3;
    for (var i = 0; i < 14; i++) {
      var m = mem[Math.floor(r() * mem.length)], k = r();
      var it;
      if (k < 0.3 && tiers.length) { var tr = tiers[Math.floor(r() * tiers.length)]; it = { icon: 'star', t: m.name + ' a rejoint ' + tr.name, s: S.money(tr.price) + ' / mois', lvl: tr.level }; }
      else if (k < 0.5 && prods.length) { var p = prods[Math.floor(r() * prods.length)]; it = { icon: 'commerce', t: m.name + ' a acheté', s: p.name + ' · ' + S.money(p.price) }; }
      else if (k < 0.72 && posts.length) { var po = posts[Math.floor(r() * posts.length)]; it = { icon: 'chat', t: m.name + ' a commenté', s: '« ' + po.title + ' »' }; }
      else if (k < 0.86) { it = { icon: 'mail', t: 'Nouveau message de ' + m.name, s: 'Communauté · boîte de réception' }; }
      else { it = { icon: 'user', t: m.name + ' suit votre univers', s: 'via ' + ['Instagram', 'TikTok', 'QR code', 'YouTube'][Math.floor(r() * 4)] }; }
      it.at = t; t -= (6 + r() * 70) * 60e3;
      out.push(it);
    }
    out.sort(function (a, b) { return b.at - a.at; });
    return out.slice(0, limit || 8);
  };

  /** Suggestion de l'IA — règles sur les données réelles */
  S.suggestions = function () {
    var c = S.c, p = S.period(30), out = [];
    var idx = c.sections.indexOf('memberships');
    if (c.tiers.some(function (t) { return t.price > 0; }) && (idx < 0 || idx > 2)) {
      out.push({ t: 'Remontez vos abonnements', d: 'La section Abonnements est en position ' + (idx < 0 ? '— (masquée)' : idx + 1) + '. Les univers qui l’affichent dans les 3 premières sections convertissent en moyenne 1,6× mieux.', cta: 'Réorganiser', href: '#/universe/sections' });
    }
    var src = p.sources.slice().sort(function (a, b) { return b.v - a.v; })[0];
    var we = 0, wd = 0, nwe = 0, nwd = 0;
    p.series.forEach(function (s) { var d = new Date(s.date + 'T12:00').getDay(); if (d === 0 || d === 6) { we += s.visitors; nwe++; } else { wd += s.visitors; nwd++; } });
    var lift = nwe && nwd ? (we / nwe) / (wd / nwd) - 1 : 0;
    if (lift > 0.08) out.push({ t: 'Publiez le week-end', d: 'Vos visiteurs sont ' + S.num(lift * 100) + ' % plus nombreux le samedi et le dimanche. Programmez vos contenus VIP et vos lives à ces moments-là.', cta: 'Programmer un contenu', href: '#/content/new' });
    out.push({ t: src.name + ' apporte ' + src.v + ' % de vos visites', d: 'Créez un smart link dédié (ex. ' + D.prettyUrl(c.handle, 'vip').replace(/^https?:\/\//, '') + ') avec un UTM « ' + src.name.toLowerCase().split(' ')[0] + ' » pour mesurer ce qu’il rapporte vraiment.', cta: 'Créer le smart link', href: '#/marketing/links' });
    if (p.conversion < 0.02 && c.tiers.some(function (t) { return t.price > 0 && !t.trialDays; })) {
      out.push({ t: 'Offrez un essai gratuit', d: 'Votre conversion est de ' + S.pct(p.conversion) + '. Un essai de 7 jours sur votre premier palier payant réduit la friction d’inscription.', cta: 'Modifier mes abonnements', href: '#/commerce/tiers' });
    }
    return out;
  };

  function render(main) {
    var c = S.c, p = S.period(30), first = (c.name || '').split(' ')[0];
    var t = p.totals, pv = p.prev;
    var rev = p.series.map(function (s) { return s.revenue; }), vis = p.series.map(function (s) { return s.visitors; });
    var sug = S.suggestions()[0];
    var kpis = [
      { l: 'Visiteurs', v: S.num(t.visitors), d: S.delta(t.visitors, pv.visitors), sp: S.spark(vis), s: '30 derniers jours' },
      { l: 'Revenus 30 j', v: S.money(t.revenue), d: S.delta(t.revenue, pv.revenue), sp: S.spark(rev), s: 'ventes + abonnements' },
      { l: 'MRR', v: S.money(p.mrr), d: '<span class="delta up">▲ ' + S.num(4 + (p.mrr % 7), 0) + ' %</span>', s: 'revenu récurrent mensuel' },
      { l: 'Abonnés actifs', v: S.num(p.activeSubs), d: '<span class="delta up">+' + S.num(t.subs) + '</span>', s: 'nouveaux ce mois' },
      { l: 'Conversion', v: S.pct(p.conversion, 2), d: S.delta(p.conversion, pv.conversion), s: 'visite → achat/abo' },
      { l: 'Churn', v: S.pct(p.churn), d: '<span class="delta up">▼ 0,4 pt</span>', s: 'désabonnements / mois' }
    ];
    main.innerHTML =
      '<section class="ov-hero">' +
        '<div class="ov-hero-l">' + U.avatar(c, 56) + '<div><p class="eyebrow">' + esc(greeting()) + '</p><h2 class="ov-hello">' + esc(first) + ', votre univers <span class="grad-text">brille</span>.</h2>' +
        '<p class="dim small">Voici l’essentiel de ces 30 derniers jours sur <a class="link-btn" href="' + esc(D.creatorUrl(c.handle)) + '" target="_blank" rel="noopener">' + esc(D.prettyUrl(c.handle).replace(/^https?:\/\//, '')) + '</a></p></div></div>' +
        '<div class="ov-hero-r"><a class="btn btn-ghost btn-sm" href="' + esc(D.creatorUrl(c.handle)) + '" target="_blank" rel="noopener">' + S.ic('external', 15) + 'Voir mon univers</a><a class="btn btn-primary btn-sm" href="#/content/new">' + S.ic('plus', 15) + 'Nouvelle publication</a></div>' +
      '</section>' +
      '<div class="kpis k6 mt">' + kpis.map(function (k) {
        return '<div class="kpi"><div class="kpi-l">' + esc(k.l) + '</div><div class="kpi-v">' + k.v + '</div><div class="kpi-f">' + (k.d || '') + (k.sp || '<span class="kpi-s">' + esc(k.s) + '</span>') + '</div></div>';
      }).join('') + '</div>' +
      '<div class="split mt">' +
        '<section class="panel"><div class="panel-h"><div><h3 class="panel-t" id="ovChartT">Revenus</h3><p class="panel-d" id="ovChartD">Par jour, 30 derniers jours · total ' + esc(S.money(t.revenue)) + '</p></div>' + S.seg('ovc', [{ v: 'rev', l: 'Revenus' }, { v: 'aud', l: 'Audience' }], 'rev') + '</div><div class="chart" id="ovChart"></div></section>' +
        '<div class="grid">' +
          (sug ? '<section class="panel ai-card"><div class="ai-badge">' + S.ic('copilot', 15) + 'Suggestion de l’IA</div><h3 class="ai-t">' + esc(sug.t) + '</h3><p class="ai-d">' + esc(sug.d) + '</p><div class="row-wrap"><a class="btn btn-sig btn-sm" href="' + sug.href + '">' + esc(sug.cta) + '</a><a class="btn btn-ghost btn-sm" href="#/copilot">Demander au copilote</a></div></section>' : '') +
          '<section class="panel"><div class="panel-h"><h3 class="panel-t">Actions rapides</h3></div><div class="qa">' +
            qa('content', 'Publier un contenu', '#/content/new') + qa('universe', 'Personnaliser l’univers', '#/universe') +
            qa('link', 'Créer un smart link', '#/marketing/links') + qa('mail', 'Envoyer une campagne', '#/marketing/campaigns/new') +
            qa('commerce', 'Ajouter un produit', '#/commerce/products/new') + qa('mediakit', 'Mon media kit', '#/mediakit') +
          '</div></section>' +
        '</div>' +
      '</div>' +
      '<div class="split mt">' +
        '<section class="panel"><div class="panel-h"><div><h3 class="panel-t">Activité récente</h3><p class="panel-d">Abonnements, achats, messages et commentaires</p></div><a class="link-btn" href="#/community">Communauté →</a></div><ul class="feed" id="ovFeed"></ul></section>' +
        '<div class="grid">' +
          '<section class="panel uni-card"><div class="uni-cover">' + U.art(c.cover) + '</div><div class="uni-body">' + U.avatar(c, 52) + '<div class="uni-meta"><div class="uni-n">' + esc(c.name) + '</div><div class="uni-u">' + esc(D.prettyUrl(c.handle).replace(/^https?:\/\//, '')) + '</div></div></div>' +
            '<div class="uni-stats"><div><b>' + esc(D.compact(c.stats.followers)) + '</b><span>audience</span></div><div><b>' + esc(S.num(c.stats.members)) + '</b><span>membres</span></div><div><b>' + esc(S.num(c.posts.length)) + '</b><span>contenus</span></div></div>' +
            '<div class="row-wrap"><a class="btn btn-primary btn-sm" href="' + esc(D.creatorUrl(c.handle)) + '" target="_blank" rel="noopener">Voir mon univers</a><button class="btn btn-ghost btn-sm" type="button" id="ovCopy">' + S.ic('copy', 15) + 'Copier le lien</button></div></section>' +
          upcoming(c) +
        '</div>' +
      '</div>';

    var chartEl = main.querySelector('#ovChart');
    function draw(mode) {
      if (mode === 'aud') {
        main.querySelector('#ovChartT').textContent = 'Audience';
        main.querySelector('#ovChartD').textContent = 'Visiteurs et visiteurs uniques par jour · ' + S.num(t.visitors) + ' visites';
        S.lineChart(chartEl, { label: 'Audience', labels: p.series.map(function (s) { return s.date; }), series: [
          { name: 'Visiteurs', color: S.CH.rose, values: vis },
          { name: 'Uniques', color: S.CH.mauve, values: p.series.map(function (s) { return s.unique; }), area: false }
        ] });
      } else {
        main.querySelector('#ovChartT').textContent = 'Revenus';
        main.querySelector('#ovChartD').textContent = 'Par jour, 30 derniers jours · total ' + S.money(t.revenue);
        S.lineChart(chartEl, { label: 'Revenus', labels: p.series.map(function (s) { return s.date; }), fmt: function (v) { return S.money(v); }, yfmt: function (v) { return S.num(v) + ' €'; }, series: [{ name: 'Revenus', color: S.CH.rose, values: rev }] });
      }
    }
    draw('rev');
    S.onSeg(main, 'ovc', draw);
    main.querySelector('#ovFeed').innerHTML = S.activity(8).map(function (a) {
      return '<li class="feed-i"><span class="feed-ic' + (a.real ? ' real' : '') + '">' + S.ic(a.icon, 16) + '</span><div class="feed-t"><div>' + esc(a.t) + (a.lvl ? ' ' + S.lvl(a.lvl) : '') + '</div><div class="feed-s">' + esc(a.s) + '</div></div><time class="feed-at">' + esc(S.ago(a.at)) + '</time></li>';
    }).join('');
    main.querySelector('#ovCopy').addEventListener('click', function () { U.copy(S.absUrl(D.prettyUrl(c.handle)), 'Lien copié'); });
  }
  function qa(icon, label, href) { return '<a class="qa-i" href="' + href + '"><span class="qa-ic">' + S.ic(icon, 18) + '</span><span>' + esc(label) + '</span></a>'; }
  function upcoming(c) {
    var ev = (c.events || []).slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; }).slice(0, 3);
    return '<section class="panel"><div class="panel-h"><h3 class="panel-t">À venir</h3><a class="link-btn" href="#/content">Calendrier →</a></div>' +
      (ev.length ? '<ul class="upc">' + ev.map(function (e) {
        var d = new Date(e.date);
        return '<li class="upc-i"><div class="upc-d"><b>' + d.getDate() + '</b><span>' + esc(S.date(d).split(' ')[1]) + '</span></div><div class="upc-t"><div class="t">' + esc(e.title) + '</div><div class="s">' + esc(e.place) + ' · ' + esc(S.dateTime(e.date).split(' · ')[1]) + '</div></div>' + S.lvl(e.access) + '</li>';
      }).join('') + '</ul>' : '<p class="dim small">Aucun événement programmé.</p>') + '</section>';
  }

  S.register('overview', { title: 'Vue d’ensemble', short: 'Accueil', group: 'Pilotage', icon: 'home', render: render });
})(window);
