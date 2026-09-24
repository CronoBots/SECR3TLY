/* Studio — Analytics */
(function (root) {
  'use strict';
  var S = root.Studio, D = root.Secretly, U = root.SecretlyUI, esc = S.esc;
  var st = { days: 30 };

  function render(main) {
    main.innerHTML = '<div class="sec-h"><div><h2 class="sec-t">Analytics</h2><p class="sec-d">Trafic, conversions et revenus de votre univers. Les actions faites dans ce navigateur s’ajoutent en temps réel à aujourd’hui.</p></div>' +
      S.seg('anp', [{ v: 7, l: '7 j' }, { v: 30, l: '30 j' }, { v: 90, l: '90 j' }], st.days) + '</div><div id="anBody"></div>';
    S.onSeg(main, 'anp', function (v) { st.days = +v; body(main.querySelector('#anBody')); });
    body(main.querySelector('#anBody'));
  }

  function body(el) {
    var c = S.c, p = S.period(st.days), t = p.totals, pv = p.prev, days = st.days;
    var labels = p.series.map(function (s) { return s.date; });
    var conv = t.subs + t.sales, convPrev = pv.subs + pv.sales;
    var aovPrev = pv.sales ? Math.round(pv.revenue * 0.45 / pv.sales) : 0;
    var kp = [
      ['Visiteurs', S.num(t.visitors), S.delta(t.visitors, pv.visitors)],
      ['Pages vues', S.num(t.views), S.delta(t.views, pv.views)],
      ['Clics sur liens', S.num(t.clicks), S.delta(t.clicks, pv.clicks)],
      ['Conversions', S.num(conv), S.delta(conv, convPrev)],
      ['Panier moyen', S.money(p.aov), S.delta(p.aov, aovPrev)],
      ['Revenus récurrents', S.money(p.mrr), '<span class="kpi-s">MRR</span>'],
      ['Taux de conversion', S.pct(p.conversion, 2), S.delta(p.conversion, pv.conversion)],
      ['Churn mensuel', S.pct(p.churn), '<span class="delta up">▼ 0,4 pt</span>']
    ];
    var topPosts = c.posts.slice().sort(function (a, b) { return (b.likes || 0) - (a.likes || 0); }).slice(0, 5);
    var topLinks = c.links.slice().sort(function (a, b) { return (b.clicks || 0) - (a.clicks || 0); }).slice(0, 5);
    var maxL = Math.max.apply(null, topLinks.map(function (l) { return l.clicks || 0; }).concat([1]));
    var prodRev = c.products.map(function (x) { return { name: x.name, v: x.price * (x.sales || 0) }; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 6);
    var campRev = (S.campaigns ? S.campaigns() : []).filter(function (x) { return x.revenue; }).map(function (x) { return { name: x.subject, v: x.revenue }; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 6);
    var money = function (v) { return S.money(v); };

    el.innerHTML =
      '<div class="kpis k4">' + kp.map(function (k) { return '<div class="kpi"><div class="kpi-l">' + esc(k[0]) + '</div><div class="kpi-v">' + k[1] + '</div><div class="kpi-f">' + k[2] + '<span class="kpi-s">vs ' + days + ' j préc.</span></div></div>'; }).join('') + '</div>' +
      '<section class="panel mt"><div class="panel-h"><div><h3 class="panel-t">Trafic</h3><p class="panel-d">Visiteurs et visiteurs uniques par jour</p></div></div><div class="chart" id="anTraffic"></div>' +
        '<details class="data-table"><summary>Voir les données</summary><div class="tbl-wrap" style="max-height:260px;overflow:auto"><table class="tbl"><thead><tr><th>Date</th><th class="r">Visiteurs</th><th class="r">Uniques</th><th class="r">Pages vues</th><th class="r">Revenus</th></tr></thead><tbody>' +
        p.series.slice().reverse().map(function (s) { return '<tr><td>' + esc(S.date(s.date, true)) + '</td><td class="r num">' + S.num(s.visitors) + '</td><td class="r num">' + S.num(s.unique) + '</td><td class="r num">' + S.num(s.views) + '</td><td class="r num">' + esc(S.money(s.revenue)) + '</td></tr>'; }).join('') +
        '</tbody></table></div></details></section>' +
      '<div class="g2 mt">' +
        '<section class="panel"><div class="panel-h"><div><h3 class="panel-t">Revenus</h3><p class="panel-d">' + esc(S.money(t.revenue)) + ' sur ' + days + ' jours ' + S.delta(t.revenue, pv.revenue) + '</p></div></div><div class="chart" id="anRev"></div></section>' +
        '<section class="panel"><div class="panel-h"><div><h3 class="panel-t">Nouveaux abonnements</h3><p class="panel-d">' + S.num(t.subs) + ' abonnements · ' + S.num(t.sales) + ' ventes</p></div></div><div class="chart" id="anSubs"></div></section>' +
      '</div>' +
      '<div class="g3 mt">' +
        '<section class="panel"><div class="panel-h"><h3 class="panel-t">Sources de trafic</h3></div>' + S.hbars(p.sources.slice().sort(function (a, b) { return b.v - a.v; })) + '</section>' +
        '<section class="panel"><div class="panel-h"><h3 class="panel-t">Pays</h3></div>' + S.hbars(p.countries) + '</section>' +
        '<section class="panel"><div class="panel-h"><h3 class="panel-t">Appareils</h3></div>' + S.hbars(p.devices) + '<p class="xs mute mt">' + S.num(p.devices[0].v) + ' % de votre audience vous découvre sur mobile : soignez l’aperçu mobile dans Univers.</p></section>' +
      '</div>' +
      '<div class="g2 mt">' +
        '<section class="panel"><div class="panel-h"><h3 class="panel-t">Top contenus</h3><a class="link-btn" href="#/content">Tous →</a></div>' +
          (topPosts.length ? '<ol class="rank">' + topPosts.map(function (x, i) { return '<li><span class="rank-n">' + (i + 1) + '</span>' + S.artBox(x.art, 'thumb') + '<div class="grow" style="min-width:0"><div class="ellip" style="font-weight:600">' + esc(x.title) + '</div><div class="row-wrap" style="gap:6px;margin-top:3px">' + S.lvl(x.access) + '<span class="xs mute">' + S.num(x.comments || 0) + ' commentaires</span></div></div><b class="num nowrap">♥ ' + esc(D.compact(x.likes || 0)) + '</b></li>'; }).join('') + '</ol>' : '<p class="dim small">Aucun contenu.</p>') + '</section>' +
        '<section class="panel"><div class="panel-h"><h3 class="panel-t">Top liens</h3><a class="link-btn" href="#/marketing/links">Smart links →</a></div>' +
          (topLinks.length ? S.hbars(topLinks.map(function (l) { return { name: (l.icon ? l.icon + ' ' : '') + l.label, v: l.clicks || 0 }; }), { max: maxL, fmt: function (v) { return S.num(v) + ' clics'; }, color: S.CH.mauve }) : '<p class="dim small">Aucun lien personnalisé.</p>') + '</section>' +
      '</div>' +
      '<div class="g2 mt">' +
        '<section class="panel"><div class="panel-h"><h3 class="panel-t">Revenus par produit</h3><span class="xs mute">cumulés</span></div>' + (prodRev.length ? S.hbars(prodRev, { fmt: money, color: S.CH.gold }) : '<p class="dim small">Aucun produit.</p>') + '</section>' +
        '<section class="panel"><div class="panel-h"><h3 class="panel-t">Revenus par campagne</h3><span class="xs mute">attribués à 7 jours</span></div>' + (campRev.length ? S.hbars(campRev, { fmt: money, color: S.CH.gold }) : '<p class="dim small">Aucune campagne avec revenus attribués.</p>') + '</section>' +
      '</div>';

    S.lineChart(el.querySelector('#anTraffic'), { label: 'Trafic', labels: labels, height: 240, series: [
      { name: 'Visiteurs', color: S.CH.rose, values: p.series.map(function (s) { return s.visitors; }) },
      { name: 'Uniques', color: S.CH.mauve, values: p.series.map(function (s) { return s.unique; }), area: false }
    ] });
    S.barChart(el.querySelector('#anRev'), { label: 'Revenus', name: 'Revenus', labels: labels, values: p.series.map(function (s) { return s.revenue; }), fmt: money, yfmt: function (v) { return S.num(v) + ' €'; }, color: S.CH.rose });
    S.lineChart(el.querySelector('#anSubs'), { label: 'Abonnements', labels: labels, series: [{ name: 'Abonnements', color: S.CH.mauve, values: p.series.map(function (s) { return s.subs; }) }] });
  }

  S.register('analytics', { title: 'Analytics', short: 'Stats', group: 'Pilotage', icon: 'analytics', render: render });
})(window);
