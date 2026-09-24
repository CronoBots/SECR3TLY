/* Studio — Media Kit : one-pager imprimable généré depuis les données */
(function (root) {
  'use strict';
  var S = root.Studio, D = root.Secretly, U = root.SecretlyUI, esc = S.esc;

  var BLOCKS = [
    ['profile', 'Photo & bio'], ['audience', 'Audience par réseau'], ['kpis', 'Chiffres clés'], ['demo', 'Démographie'],
    ['collabs', 'Collaborations'], ['rates', 'Tarifs'], ['contact', 'Contact & QR code']
  ];
  var NET_N = { instagram: 'Instagram', tiktok: 'TikTok', youtube: 'YouTube', x: 'X', snapchat: 'Snapchat', facebook: 'Facebook', twitch: 'Twitch', pinterest: 'Pinterest', telegram: 'Telegram', web: 'Site web' };

  /** Données du kit (valeurs réelles ou dérivées si absentes) */
  S.mediakitData = function () {
    var c = S.c, mk = c.mediakit || {};
    var total = c.socials.reduce(function (a, s) { return a + (Number(s.followers) || 0); }, 0) || c.stats.followers || 0;
    var avgLikes = c.posts.length ? c.posts.reduce(function (a, p) { return a + (p.likes || 0); }, 0) / c.posts.length : 0;
    var eng = mk.engagement || S.clamp(Math.round((avgLikes / Math.max(1, total)) * 1000) / 10 * 4 || 4.2, 2.1, 9.4);
    var female = { Fashion: 78, Beauty: 84, Gaming: 24, Fitness: 58, Lifestyle: 62, Art: 64, Photographie: 46, Musique: 52, Business: 44 }[c.category] || 55;
    var an = D.analytics(c.handle, 30);
    var aud = mk.audience || {
      female: female, male: 100 - female - 2, other: 2,
      ages: c.category === 'Gaming' ? { '18-24': 46, '25-34': 38, '35-44': 12, '45+': 4 } : { '18-24': 28, '25-34': 41, '35-44': 20, '45+': 11 },
      countries: an.countries.reduce(function (o, x) { o[x.name] = x.v; return o; }, {})
    };
    function r50(v) { return Math.max(150, Math.round(v / 50) * 50); }
    var rates = mk.rates || [
      { item: 'Post / Reel Instagram', price: r50(total * 0.006) }, { item: 'Vidéo TikTok', price: r50(total * 0.0045) },
      { item: 'Story (3 frames)', price: r50(total * 0.002) }, { item: 'Mise en avant dans l’univers + newsletter', price: r50(total * 0.003) }
    ];
    var brands = [];
    c.collabs.forEach(function (b) { if ((b.status === 'done' || b.status === 'live') && brands.indexOf(b.brand) < 0) brands.push(b.brand); });
    c.promos.forEach(function (p) { if (p.brand && brands.indexOf(p.brand) < 0 && p.brand !== c.name) brands.push(p.brand); });
    return { total: total, eng: eng, aud: aud, rates: rates, brands: brands, contact: mk.contact || ('partenariats@' + (c.domain || (c.handle + '.com'))), derived: !c.mediakit };
  };

  function prefs() {
    var c = S.c; c.settings.mediakit = c.settings.mediakit || {};
    var b = c.settings.mediakit.blocks = c.settings.mediakit.blocks || {};
    BLOCKS.forEach(function (x) { if (b[x[0]] == null) b[x[0]] = true; });
    return b;
  }

  function render(main) {
    var c = S.c, on = prefs(), d = S.mediakitData();
    var link = S.absUrl(D.creatorUrl(c.handle, 'collabs'));
    main.innerHTML =
      '<div class="sec-h mk-noprint"><div><h2 class="sec-t">Media Kit</h2><p class="sec-d">Généré automatiquement à partir de votre univers. Toujours à jour, prêt à envoyer aux marques.</p></div>' +
        '<div class="row-wrap"><button type="button" class="btn btn-ghost btn-sm" id="mkCopy">' + S.ic('link', 15) + 'Copier le lien</button><button type="button" class="btn btn-primary btn-sm" id="mkPrint">' + S.ic('print', 15) + 'Imprimer / PDF</button></div></div>' +
      '<div class="mk-layout">' +
        '<aside class="panel mk-ctl mk-noprint"><h3 class="panel-t">Blocs inclus</h3><p class="panel-d">Cochez ce que les marques verront.</p><div class="mt">' +
          BLOCKS.map(function (b) { return S.toggle('data-block="' + b[0] + '"', on[b[0]], b[1]); }).join('') + '</div>' +
          (d.derived ? '<p class="xs mute mt">Certaines valeurs (démographie, tarifs, engagement) sont estimées à partir de vos données : affinez-les avec vos statistiques réelles.</p>' : '') +
        '</aside>' +
        '<div class="mk-wrap"><article class="mk-sheet" id="mkSheet"></article></div>' +
      '</div>';
    var sheet = main.querySelector('#mkSheet');
    function draw() {
      var a = d.aud, ages = Object.keys(a.ages), ctry = Object.keys(a.countries);
      var maxAge = Math.max.apply(null, ages.map(function (k) { return a.ages[k]; }));
      sheet.innerHTML =
        '<header class="mk-head"><div class="mk-cover">' + U.art(c.cover) + '</div>' +
          '<div class="mk-id">' + (on.profile ? U.avatar(c, 92) : '') + '<div><div class="mk-eyebrow">Media kit ' + new Date().getFullYear() + ' · ' + esc(c.category) + '</div><h1 class="mk-name">' + esc(c.name) + '</h1><div class="mk-tag">' + esc(c.tagline || '') + '</div><div class="mk-loc">' + esc(c.location || '') + (c.domain ? ' · ' + esc(c.domain) : '') + '</div></div></div></header>' +
        (on.profile ? '<section class="mk-sec mk-bio"><p>' + esc(c.bio || '') + '</p></section>' : '') +
        (on.kpis ? '<section class="mk-sec mk-kpis"><div><b>' + esc(D.compact(d.total)) + '</b><span>Audience totale</span></div><div><b>' + esc(S.num(d.eng, 1)) + ' %</b><span>Engagement moyen</span></div><div><b>' + esc(S.num(c.stats.members)) + '</b><span>Membres payants</span></div><div><b>' + esc(S.num(c.stats.posts || c.posts.length)) + '</b><span>Contenus publiés</span></div></section>' : '') +
        (on.audience && c.socials.length ? '<section class="mk-sec"><h2 class="mk-h">Audience par réseau</h2><div class="mk-socials">' + c.socials.map(function (s) {
          return '<div class="mk-soc">' + U.icon(s.net, 20) + '<div><b>' + esc(D.compact(s.followers || 0)) + '</b><span>' + esc(NET_N[s.net] || s.net) + '</span></div></div>';
        }).join('') + '</div></section>' : '') +
        (on.demo ? '<section class="mk-sec mk-demo"><h2 class="mk-h">Démographie</h2><div class="mk-demo-g">' +
          '<div><h3 class="mk-h3">Genre</h3><div class="mk-gender"><span style="flex:' + a.female + '"></span><span style="flex:' + a.male + '"></span>' + (a.other ? '<span style="flex:' + a.other + '"></span>' : '') + '</div><div class="mk-leg"><span><i class="g1"></i>Femmes ' + a.female + ' %</span><span><i class="g2"></i>Hommes ' + a.male + ' %</span>' + (a.other ? '<span><i class="g3"></i>Autre ' + a.other + ' %</span>' : '') + '</div></div>' +
          '<div><h3 class="mk-h3">Âge</h3><div class="mk-ages">' + ages.map(function (k) { return '<div class="mk-age"><div class="mk-age-b"><span style="height:' + (a.ages[k] / maxAge * 100) + '%"></span></div><b>' + a.ages[k] + ' %</b><span>' + esc(k) + '</span></div>'; }).join('') + '</div></div>' +
          '<div><h3 class="mk-h3">Pays</h3><ul class="mk-ctry">' + ctry.slice(0, 5).map(function (k) { return '<li><span>' + esc(k) + '</span><span class="mk-ctry-b"><i style="width:' + a.countries[k] * 1.5 + '%"></i></span><b>' + a.countries[k] + ' %</b></li>'; }).join('') + '</ul></div>' +
        '</div></section>' : '') +
        (on.collabs && d.brands.length ? '<section class="mk-sec"><h2 class="mk-h">Ils m’ont fait confiance</h2><div class="mk-brands">' + d.brands.map(function (b) { return '<span>' + esc(b) + '</span>'; }).join('') + '</div></section>' : '') +
        (on.rates ? '<section class="mk-sec"><h2 class="mk-h">Tarifs indicatifs</h2><table class="mk-rates">' + d.rates.map(function (r) { return '<tr><td>' + esc(r.item) + '</td><td>' + esc(S.money(r.price)) + '</td></tr>'; }).join('') + '</table><p class="mk-note">Tarifs HT, hors droits d’usage étendus. Packages sur mesure sur demande.</p></section>' : '') +
        (on.contact ? '<footer class="mk-sec mk-contact"><div><h2 class="mk-h">Travaillons ensemble</h2><p class="mk-mail">' + esc(d.contact) + '</p><p class="mk-url">' + esc(link.replace(/^https?:\/\//, '')) + '</p></div><div class="mk-qr">' + U.qr(link, { fg: '#1b1416', bg: '#f7f1ea' }) + '</div></footer>' : '') +
        '<div class="mk-powered">Media kit généré avec SECR<span>3</span>TLY</div>';
    }
    draw();
    main.querySelectorAll('[data-block]').forEach(function (i) {
      i.addEventListener('change', function () { on[i.getAttribute('data-block')] = i.checked; S.changed({ preview: false }); draw(); });
    });
    main.querySelector('#mkPrint').addEventListener('click', function () { root.print(); });
    main.querySelector('#mkCopy').addEventListener('click', function () { U.copy(link, 'Lien du media kit copié'); });
  }

  S.register('mediakit', { title: 'Media Kit', group: 'Revenus', icon: 'mediakit', render: render });
})(window);
