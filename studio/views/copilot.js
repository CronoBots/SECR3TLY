/* Studio — Copilote IA
   Mode démo : générateur local à base de gabarits, alimenté par les vraies
   données du créateur (catégorie, paliers, analytics, contenus…).
   En production : API Claude (voir docs/ARCHITECTURE.md). */
(function (root) {
  'use strict';
  var S = root.Studio, D = root.Secretly, U = root.SecretlyUI, esc = S.esc;

  var ACTIONS = [
    { id: 'bio', l: 'Créer une bio', i: 'user' },
    { id: 'post', l: 'Rédiger une publication', i: 'edit' },
    { id: 'product', l: 'Décrire un produit', i: 'commerce' },
    { id: 'offer', l: 'Générer une offre', i: 'tag' },
    { id: 'stats', l: 'Analyser mes stats', i: 'analytics' },
    { id: 'ideas', l: 'Idées de contenu', i: 'sparkle' },
    { id: 'email', l: 'Préparer un email de campagne', i: 'mail' },
    { id: 'optimize', l: 'Optimiser ma page', i: 'bolt' },
    { id: 'strategy', l: 'Stratégie de contenu', i: 'calendar' }
  ];
  var VOC = {
    Fashion: { niche: 'mode', mot: 'style', things: ['looks commentés', 'coulisses de shooting', 'pièces fétiches', 'carnets de voyage', 'essayages'], aud: 'les passionné·es de mode', tags: ['#mode', '#style', '#ootd', '#parisstyle', '#coulisses'], promise: 'un regard de styliste, sans filtre' },
    Beauty: { niche: 'beauté', mot: 'glow', things: ['routines pas à pas', 'tests produits honnêtes', 'tutos maquillage', 'astuces skincare', 'diagnostics peau'], aud: 'les passionné·es de beauté', tags: ['#skincare', '#makeup', '#beauté', '#routine', '#glow'], promise: 'des routines honnêtes qui marchent vraiment' },
    Gaming: { niche: 'gaming', mot: 'run', things: ['replays commentés', 'speedruns', 'coulisses du setup', 'tournois privés', 'sessions coaching'], aud: 'les joueurs et joueuses', tags: ['#gaming', '#speedrun', '#twitch', '#setup', '#gg'], promise: 'les coulisses de chaque run' },
    Art: { niche: 'illustration', mot: 'trait', things: ['process vidéo', 'croquis inédits', 'tirages limités', 'fonds d’écran', 'commandes personnalisées'], aud: 'les amoureux·ses d’illustration', tags: ['#illustration', '#art', '#process', '#artprint', '#sketchbook'], promise: 'l’atelier ouvert, du croquis au tirage' },
    Lifestyle: { niche: 'art de vivre', mot: 'table', things: ['recettes de saison', 'adresses secrètes', 'rituels du quotidien', 'accords mets-vins', 'dîners privés'], aud: 'les épicurien·nes', tags: ['#lifestyle', '#recette', '#saison', '#food', '#artdevivre'], promise: 'le goût des choses bien faites' },
    Photographie: { niche: 'photographie', mot: 'lumière', things: ['séries inédites', 'carnets de terrain', 'presets', 'fichiers RAW', 'tirages signés'], aud: 'les amoureux·ses de l’image', tags: ['#photographie', '#streetphotography', '#35mm', '#presets', '#carnet'], promise: 'les images qui ne passent pas l’algorithme' },
    Fitness: { niche: 'fitness', mot: 'énergie', things: ['programmes complets', 'séances guidées', 'conseils nutrition', 'défis mensuels', 'suivi personnalisé'], aud: 'celles et ceux qui veulent progresser', tags: ['#fitness', '#training', '#workout', '#nutrition', '#motivation'], promise: 'des programmes qui tiennent dans une vraie vie' },
    Musique: { niche: 'musique', mot: 'son', things: ['maquettes inédites', 'sessions acoustiques', 'coulisses de studio', 'préventes', 'rencontres après-concert'], aud: 'les fans de la première heure', tags: ['#musique', '#studio', '#acoustic', '#newmusic', '#live'], promise: 'la musique avant tout le monde' },
    Business: { niche: 'entrepreneuriat', mot: 'croissance', things: ['études de cas', 'templates', 'masterclass', 'coulisses chiffrées', 'sessions Q&A'], aud: 'les entrepreneur·es', tags: ['#business', '#entrepreneur', '#growth', '#marketing', '#startup'], promise: 'des méthodes testées, chiffres à l’appui' }
  };
  var st = { msgs: [], n: {} };
  S.on('account', function () { st.msgs = []; st.n = {}; });

  function voc() { return VOC[S.c.category] || VOC.Lifestyle; }
  function pick(arr, r) { return arr[Math.floor(r() * arr.length) % arr.length]; }
  function first() { return (S.c.name || '').split(' ')[0]; }
  function city() { return (S.c.location || '').split(',')[0].trim(); }
  function paid() { return S.c.tiers.filter(function (t) { return t.price > 0; }); }
  function topTier() { var p = paid(); return p.filter(function (t) { return t.highlight; })[0] || p[p.length > 1 ? 1 : 0]; }
  function bestDay(p) {
    var days = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'], sum = [0, 0, 0, 0, 0, 0, 0], n = [0, 0, 0, 0, 0, 0, 0];
    p.series.forEach(function (s) { var d = new Date(s.date + 'T12:00').getDay(); sum[d] += s.visitors; n[d]++; });
    var best = 0; for (var i = 1; i < 7; i++) if (sum[i] / (n[i] || 1) > sum[best] / (n[best] || 1)) best = i;
    return days[best];
  }

  /* ---------------- Générateurs ---------------- */
  var GEN = {
    bio: function (r) {
      var c = S.c, v = voc(), t = topTier(), th = v.things;
      var a = pick(th, r), b = pick(th.filter(function (x) { return x !== a; }), r);
      var variants = [
        (c.tagline ? c.tagline.split('·')[0].trim() + ' — ' : '') + (city() ? 'depuis ' + city() + '. ' : '') + 'Ici, je partage ce que je ne poste nulle part ailleurs : ' + a + ', ' + b + ' et ' + v.promise + '. ' + (t ? 'Rejoignez le cercle ' + t.name + ' pour tout voir en premier.' : 'Abonnez-vous pour ne rien manquer.'),
        'Bienvenue dans mon univers ✦ ' + S.num(c.stats.followers) + ' personnes me suivent pour la ' + v.niche + ' ; ' + S.num(c.stats.members) + ' ont choisi d’aller plus loin. Au programme : ' + a + ', ' + b + '… et beaucoup de coulisses.' + (t ? ' Le cercle ' + t.name + ' commence à ' + S.money(t.price) + '/mois.' : ''),
        first() + ', ' + v.niche + (city() ? ' · ' + city() : '') + '. ' + cap(v.promise) + '. ' + cap(a) + ', ' + b + ' et échanges privés avec ' + v.aud + '. Pas d’algorithme, juste nous.'
      ];
      var bio = variants[st.n.bio % variants.length];
      return {
        intro: 'Voici une proposition de bio (' + bio.length + ' caractères, idéal : 150–300) construite à partir de votre catégorie, de votre accroche et de vos paliers :',
        blocks: [{ t: 'quote', text: bio }, { t: 'p', text: 'Astuce : terminez toujours par une invitation claire (rejoindre, découvrir, s’abonner) — elle augmente les clics vers vos abonnements.' }],
        actions: [{ l: 'Appliquer à mon profil', i: 'check', fn: function () { S.c.bio = bio; S.changed(); U.toast('Bio mise à jour dans votre univers'); } }],
        copy: bio
      };
    },
    post: function (r) {
      var c = S.c, v = voc(), p = S.period(30), top = c.posts.slice().sort(function (a, b) { return (b.likes || 0) - (a.likes || 0); })[0];
      var thing = pick(v.things, r), lvl = pick(['public', 'members', 'members', 'vip'], r), t = topTier();
      var titles = ['Ce que personne ne voit : ' + thing, cap(thing) + ' — la version intégrale', '3 choses que j’ai apprises cette semaine', cap(thing) + ' : mes secrets', 'Journal #' + (12 + Math.floor(r() * 30)) + ' — ' + thing];
      var title = pick(titles, r);
      var cap1 = lvl === 'public'
        ? 'Un aperçu de ' + thing + ' ✦ La suite (et tout ce que je garde pour moi) est réservée au cercle. Dites-moi en commentaire ce que vous voulez voir ensuite 👇'
        : lvl === 'vip' ? 'Pour le cercle ' + (t ? t.name : 'VIP') + ' uniquement : ' + thing + ' sans filtre, avec mes explications pas à pas. Merci d’être là, vraiment.'
        : 'Membres : voici ' + thing + ' en version complète. ' + (top ? 'Vous avez adoré « ' + top.title + ' », alors j’ai poussé l’idée plus loin. ' : '') + 'Vos questions en commentaire, je réponds à tout ✦';
      var tags = v.tags.slice(0, 4).join(' ');
      return {
        intro: 'Proposition de publication, calibrée sur vos meilleurs contenus' + (top ? ' (« ' + top.title + ' », ' + D.compact(top.likes) + ' j’aime)' : '') + ' :',
        blocks: [
          { t: 'kv', rows: [['Titre', title], ['Niveau conseillé', S.levelName(lvl)], ['Meilleur moment', cap(bestDay(p)) + ', entre 18 h et 21 h']] },
          { t: 'quote', text: cap1 + '\n\n' + tags }
        ],
        actions: [{ l: 'Créer en brouillon', i: 'content', fn: function () {
          c.posts.unshift({ id: S.uid('p'), type: 'photo', title: title, caption: cap1, access: lvl, status: 'draft', draft: true, art: { a: c.avatar.a, b: c.avatar.b, pattern: pick(['silk', 'orb', 'wave', 'veil'], r) }, likes: 0, comments: 0, date: new Date().toISOString().slice(0, 10) });
          S.changed(); U.toast('Brouillon créé dans Contenus');
        } }, { l: 'Voir mes contenus', i: 'right', href: '#/content' }],
        copy: title + '\n\n' + cap1 + '\n\n' + tags
      };
    },
    product: function (r) {
      var c = S.c, v = voc();
      if (!c.products.length) return { intro: 'Vous n’avez pas encore de produit. Ajoutez-en un dans Commerce, puis je rédige sa fiche.', blocks: [], actions: [{ l: 'Ajouter un produit', i: 'plus', href: '#/commerce/products/new' }] };
      var p = c.products[st.n.product % c.products.length];
      var kind = { physical: 'pièce', digital: 'pack numérique', ebook: 'guide', course: 'formation', merch: 'édition', experience: 'expérience', ticket: 'billet' }[p.type] || 'produit';
      var desc = cap(kind) + ' pensé' + (/e$/.test(kind) && kind !== 'guide' ? 'e' : '') + ' pour ' + v.aud + ' : ' + p.name.replace(/^[^—«]*[—«]\s*/, '').replace(/»/g, '').trim() + '. ' +
        'Je l’ai conçu' + ' comme je travaille au quotidien — ' + v.promise + '. ' +
        (p.sales ? 'Déjà ' + S.num(p.sales) + ' exemplaires adoptés par la communauté.' : 'Une première édition, en quantité volontairement limitée.');
      var bullets = {
        physical: ['Matières sélectionnées avec soin, finitions main', 'Expédition soignée sous 48 h, emballage signé', 'Échange gratuit sous 30 jours'],
        digital: ['Téléchargement immédiat après achat', 'Compatible mobile et ordinateur', 'Mises à jour gratuites à vie'],
        ebook: ['PDF illustré, lisible sur tous les écrans', 'Méthode pas à pas + checklists', 'Accès à vie et mises à jour'],
        course: ['Modules vidéo à suivre à votre rythme', 'Exercices pratiques et supports téléchargeables', 'Session questions-réponses en live'],
        merch: ['Édition limitée, numérotée', 'Coton biologique / matières responsables', 'Livré avec une carte signée'],
        experience: ['Places très limitées', 'Programme sur mesure, préparé avec vous', 'Souvenirs et photos inclus'],
        ticket: ['Placement garanti', 'Accès prioritaire', 'Rencontre après l’événement']
      }[p.type] || ['Qualité premium', 'Livraison rapide', 'Satisfait ou remboursé'];
      var full = desc + '\n\n' + bullets.map(function (b) { return '— ' + b; }).join('\n');
      return {
        intro: 'Fiche produit pour « ' + p.name + ' » (' + S.money(p.price) + ') :',
        blocks: [{ t: 'quote', text: desc }, { t: 'ul', items: bullets }, { t: 'p', text: 'Argument prix : ' + (p.price >= 80 ? 'mettez en avant la rareté et le paiement en 3 fois.' : 'rappelez que c’est moins cher qu’un mois de votre palier ' + (topTier() ? topTier().name : 'VIP') + ' — un achat « plaisir » sans engagement.') }],
        actions: [{ l: 'Appliquer à la fiche', i: 'check', fn: function () { p.desc = full; S.changed(); U.toast('Description ajoutée à « ' + p.name + ' »'); } }, { l: 'Autre produit', i: 'refresh', run: 'product' }],
        copy: full
      };
    },
    offer: function (r) {
      var c = S.c, ps = paid();
      if (!ps.length) return { intro: 'Créez d’abord un palier payant (Commerce → Abonnements) : je pourrai alors construire une offre dessus.', blocks: [], actions: [{ l: 'Créer un palier', i: 'plus', href: '#/commerce/tiers' }] };
      var t = ps[st.n.offer % ps.length], kind = st.n.offer % 3;
      var offer, detail, apply;
      if (kind === 0) {
        var promo = '-30 % le 1er mois';
        offer = 'Offre de lancement « ' + t.name + ' » : ' + promo + ' pendant 72 h';
        detail = ['Prix barré : ' + S.money(t.price) + ' → ' + S.money(t.price * 0.7) + ' le premier mois', 'Durée courte (72 h) pour créer l’urgence', 'Cible : visiteurs récents et membres gratuits', 'Estimation : +' + Math.round(c.stats.members * 0.03) + ' abonnés si 3 % des membres convertissent'];
        apply = function () { t.promo = promo; S.changed(); U.toast('Promotion ajoutée au palier ' + t.name); };
      } else if (kind === 1) {
        var y = Math.round(t.price * 10);
        offer = 'Formule annuelle « ' + t.name + ' » : 2 mois offerts';
        detail = ['Prix annuel : ' + S.money(y) + ' au lieu de ' + S.money(t.price * 12), 'Encaissement immédiat : trésorerie + fidélisation', 'Réduit le churn (' + S.pct(D.analytics(S.handle, 30).churn) + ' actuellement)', 'À annoncer aux membres actifs depuis plus de 3 mois'];
        apply = function () { t.yearly = y; S.changed(); U.toast('Prix annuel défini : ' + S.money(y)); };
      } else {
        offer = 'Essai gratuit de 7 jours sur « ' + t.name + ' »';
        detail = ['Lève la principale objection : « est-ce que ça vaut le coup ? »', 'Rappel automatique J-2 avant la fin de l’essai', 'Montrez le meilleur contenu ' + S.levelName(t.level) + ' dès le jour 1', 'Taux de conversion essai → payant habituel : 35 à 50 %'];
        apply = function () { t.trialDays = 7; S.changed(); U.toast('Essai de 7 jours activé sur ' + t.name); };
      }
      return { intro: 'Voici une offre construite sur votre palier « ' + t.name + ' » (' + S.money(t.price) + '/mois) :', blocks: [{ t: 'h', text: offer }, { t: 'ul', items: detail }], actions: [{ l: 'Appliquer l’offre', i: 'check', fn: apply }, { l: 'Autre offre', i: 'refresh', run: 'offer' }], copy: offer + '\n' + detail.join('\n') };
    },
    stats: function () {
      var c = S.c, p = S.period(30), t = p.totals, pv = p.prev;
      var dv = (t.visitors - pv.visitors) / (pv.visitors || 1), dr = (t.revenue - pv.revenue) / (pv.revenue || 1);
      var src = p.sources.slice().sort(function (a, b) { return b.v - a.v; });
      var top = c.posts.slice().sort(function (a, b) { return (b.likes || 0) - (a.likes || 0); })[0];
      var link = c.links.slice().sort(function (a, b) { return (b.clicks || 0) - (a.clicks || 0); })[0];
      var recos = [];
      if (p.conversion < 0.02) recos.push('Conversion de ' + S.pct(p.conversion, 2) + ' : ajoutez un essai gratuit ou une offre de bienvenue sur votre premier palier.');
      else recos.push('Belle conversion (' + S.pct(p.conversion, 2) + ') : testez une hausse de prix de 10 % sur votre palier le plus demandé.');
      recos.push(src[0].name + ' génère ' + src[0].v + ' % du trafic : publiez-y un smart link tracké (UTM) chaque semaine.');
      recos.push('Votre meilleur jour est le ' + bestDay(p) + ' : programmez-y vos contenus payants et vos campagnes.');
      if (p.churn > 0.035) recos.push('Churn à ' + S.pct(p.churn) + ' : envoyez un message personnalisé aux membres inactifs depuis 30 jours (segment « Inactif »).');
      return {
        intro: 'Analyse de vos 30 derniers jours :',
        blocks: [
          { t: 'kv', rows: [
            ['Visiteurs', S.num(t.visitors) + ' (' + (dv >= 0 ? '+' : '') + S.num(dv * 100, 1) + ' %)'],
            ['Revenus', S.money(t.revenue) + ' (' + (dr >= 0 ? '+' : '') + S.num(dr * 100, 1) + ' %)'],
            ['MRR', S.money(p.mrr)], ['Conversion', S.pct(p.conversion, 2)], ['Churn', S.pct(p.churn)],
            ['Source n°1', src[0].name + ' (' + src[0].v + ' %)']
          ] },
          { t: 'p', text: (top ? 'Contenu phare : « ' + top.title + ' » (' + D.compact(top.likes) + ' j’aime, ' + S.levelName(top.access) + '). ' : '') + (link ? 'Lien le plus cliqué : « ' + link.label + ' » (' + S.num(link.clicks) + ' clics).' : '') },
          { t: 'h', text: 'Mes recommandations' }, { t: 'ol', items: recos }
        ],
        actions: [{ l: 'Ouvrir Analytics', i: 'analytics', href: '#/analytics' }],
        copy: recos.join('\n')
      };
    },
    ideas: function (r) {
      var c = S.c, v = voc(), t = topTier();
      var fmts = [['Carrousel', 'public'], ['Vidéo courte', 'public'], ['Album coulisses', 'members'], ['Live Q&A', 'vip'], ['Story 24 h', 'members'], ['Guide PDF (PPV)', 'public'], ['Lettre privée', 'private'], ['Sondage communauté', 'members']];
      var hooks = ['Avant / après : ', 'Ce que j’aurais aimé savoir sur ', 'Mon top 5 : ', 'Les erreurs à éviter : ', 'Une journée avec moi : ', 'Je réponds à vos questions sur ', 'Le making-of de ', 'Mes favoris du mois : '];
      var items = [], used = {};
      for (var i = 0; i < 7; i++) {
        var f = fmts[(i + st.n.ideas) % fmts.length], h = hooks[Math.floor(r() * hooks.length)], th = v.things[(i + Math.floor(r() * 5)) % v.things.length];
        var key = h + th; if (used[key]) { th = v.things[(i + 2) % v.things.length]; key = h + th; } used[key] = 1;
        if (f[1] === 'private' && !c.tiers.some(function (x) { return x.level === 'private'; })) f = ['Contenu exclusif', 'vip'];
        items.push({ title: h + th, fmt: f[0], lvl: f[1] });
      }
      return {
        intro: '7 idées de contenus pour ' + v.aud + ', réparties entre découverte (public) et exclusivité' + (t ? ' (' + t.name + ')' : '') + ' :',
        blocks: [{ t: 'ideas', items: items }],
        actions: [{ l: 'Ajouter les 3 premières en brouillons', i: 'content', fn: function () {
          items.slice(0, 3).reverse().forEach(function (it) { c.posts.unshift({ id: S.uid('p'), type: /Vidéo|Live/.test(it.fmt) ? 'video' : /Album|Carrousel/.test(it.fmt) ? 'album' : /Story/.test(it.fmt) ? 'story' : /PPV/.test(it.fmt) ? 'ppv' : 'photo', title: it.title, caption: '', access: it.lvl, price: /PPV/.test(it.fmt) ? 9 : undefined, ephemeral: /Story/.test(it.fmt) || undefined, status: 'draft', draft: true, art: { a: c.avatar.a, b: c.avatar.b, pattern: pick(['silk', 'orb', 'wave', 'grid'], r) }, likes: 0, comments: 0, date: new Date().toISOString().slice(0, 10) }); });
          S.changed(); U.toast('3 brouillons ajoutés dans Contenus');
        } }, { l: 'D’autres idées', i: 'refresh', run: 'ideas' }],
        copy: items.map(function (it) { return '• ' + it.title + ' — ' + it.fmt + ' (' + S.levelName(it.lvl) + ')'; }).join('\n')
      };
    },
    email: function (r) {
      var c = S.c, v = voc(), t = topTier(), p = c.posts.filter(function (x) { return x.access !== 'public'; })[0], pr = c.products[0];
      var subjects = ['Ce que je ne poste nulle part ailleurs', 'Juste entre nous, ' + '{prénom}', 'Nouveau : ' + (p ? p.title : pick(v.things, r)), (t ? t.name + ' : ' : '') + 'les portes ouvrent 48 h', 'Mon mois en coulisses'];
      var subject = subjects[st.n.email % subjects.length];
      var body = 'Bonjour {prénom},\n\n' +
        'Ce mois-ci, j’ai beaucoup travaillé sur ' + pick(v.things, r) + ' — et je voulais que vous soyez les premier·es à le savoir.\n\n' +
        (p ? '✦ Nouveau pour les membres : « ' + p.title + ' ».\n' : '') +
        (pr ? '✦ Dans la boutique : ' + pr.name + ' (' + S.money(pr.price) + ').\n' : '') +
        (t && t.promo ? '✦ Offre en cours : ' + t.promo + ' sur ' + t.name + '.\n' : t ? '✦ Le cercle ' + t.name + ' vous attend pour ' + S.money(t.price) + '/mois.\n' : '') +
        '\nMerci d’être là, vraiment. Répondez à cet email : je lis tout.\n\n' + first();
      return {
        intro: 'Email prêt à envoyer (objet ≤ 60 caractères, variable {prénom} incluse) :',
        blocks: [{ t: 'kv', rows: [['Objet', subject], ['Segment conseillé', t ? 'Tous les membres' : 'Nouveaux membres'], ['Envoi conseillé', cap(bestDay(S.period(30))) + ' · 18 h 30']] }, { t: 'quote', text: body }],
        actions: [{ l: 'Ouvrir dans Campagnes', i: 'send', fn: function () { S._draftCampaign = { kind: 'newsletter', subject: subject, body: body, segment: 'all' }; S.go('#/marketing/campaigns/new'); } }, { l: 'Autre version', i: 'refresh', run: 'email' }],
        copy: 'Objet : ' + subject + '\n\n' + body
      };
    },
    optimize: function () {
      var c = S.c, checks = [], fixes = [];
      var bl = (c.bio || '').length;
      checks.push({ ok: bl >= 80 && bl <= 300, t: 'Bio de 80 à 300 caractères', d: 'Actuellement ' + bl + ' caractères.' });
      checks.push({ ok: !!c.tagline, t: 'Accroche renseignée', d: c.tagline ? '« ' + c.tagline + ' »' : 'Ajoutez 3 mots-clés séparés par « · ».' });
      var mi = c.sections.indexOf('memberships');
      var memOk = !paid().length || (mi >= 0 && mi <= 2);
      checks.push({ ok: memOk, t: 'Abonnements dans les 3 premières sections', d: mi < 0 ? 'Section masquée.' : 'Position actuelle : ' + (mi + 1) + '.' });
      if (!memOk) fixes.push(function () { var i = c.sections.indexOf('memberships'); if (i >= 0) c.sections.splice(i, 1); c.sections.splice(Math.min(1, c.sections.length), 0, 'memberships'); });
      checks.push({ ok: c.links.length >= 3, t: 'Au moins 3 liens importants', d: c.links.length + ' lien(s).' });
      var hl = c.tiers.some(function (t) { return t.highlight; });
      checks.push({ ok: hl || paid().length < 2, t: 'Un palier mis en avant', d: hl ? 'OK' : 'Mettez en avant votre palier central : effet « recommandé ».' });
      if (!hl && paid().length >= 2) fixes.push(function () { var ps = paid(); ps[Math.min(1, ps.length - 1)].highlight = true; });
      var trial = paid().some(function (t) { return t.trialDays; });
      checks.push({ ok: trial || !paid().length, t: 'Essai gratuit sur un palier', d: trial ? 'OK' : 'Un essai de 7 jours réduit la friction.' });
      if (!trial && paid().length) fixes.push(function () { paid()[0].trialDays = 7; });
      var sd = (c.seo.description || '').length;
      checks.push({ ok: sd >= 110 && sd <= 160, t: 'Description SEO de 110 à 160 caractères', d: 'Actuellement ' + sd + '.' });
      if (!(sd >= 110 && sd <= 160)) fixes.push(function () { var v = voc(); c.seo.description = (c.name + ' — ' + v.niche + ' : ' + v.things.slice(0, 3).join(', ') + '. Contenus exclusifs, boutique et cercle privé.').slice(0, 158); });
      checks.push({ ok: c.socials.length >= 2, t: 'Au moins 2 réseaux reliés', d: c.socials.length + ' réseau(x).' });
      var recent = c.posts.some(function (p) { return S.postStatus(p) === 'published' && (Date.now() - new Date(p.date + 'T12:00')) < 7 * 864e5; });
      checks.push({ ok: recent, t: 'Une publication ces 7 derniers jours', d: recent ? 'OK' : 'La régularité fait revenir vos membres.' });
      checks.push({ ok: c.settings.domainStatus >= 2, t: 'Domaine personnalisé actif', d: c.domain ? c.domain : 'Configurez-le dans Paramètres.' });
      var score = Math.round(checks.filter(function (x) { return x.ok; }).length / checks.length * 100);
      return {
        intro: 'Audit de votre univers : score ' + score + ' / 100.',
        blocks: [{ t: 'score', v: score }, { t: 'check', items: checks }],
        actions: fixes.length ? [{ l: 'Corriger automatiquement (' + fixes.length + ')', i: 'bolt', fn: function () { fixes.forEach(function (f) { f(); }); S.changed(); U.toast(fixes.length + ' correction(s) appliquée(s)'); run('optimize', true); } }, { l: 'Ouvrir l’Univers', i: 'universe', href: '#/universe' }] : [{ l: 'Ouvrir l’Univers', i: 'universe', href: '#/universe' }],
        copy: checks.map(function (x) { return (x.ok ? '✓ ' : '✗ ') + x.t + ' — ' + x.d; }).join('\n')
      };
    },
    strategy: function (r) {
      var c = S.c, v = voc(), p = S.period(30), bd = bestDay(p), t = topTier();
      var week = [
        ['Lundi', 'Carrousel « ' + pick(v.things, r) + ' »', 'public'],
        ['Mardi', 'Story 24 h coulisses', 'members'],
        ['Mercredi', 'Contenu long : ' + pick(v.things, r), 'members'],
        ['Jeudi', 'Vidéo courte + smart link', 'public'],
        ['Vendredi', 'Sondage communauté', 'members'],
        ['Samedi', (t ? t.name + ' : ' : '') + 'live ou contenu premium', 'vip'],
        ['Dimanche', 'Newsletter / lettre privée', c.tiers.some(function (x) { return x.level === 'private'; }) ? 'private' : 'members']
      ];
      return {
        intro: 'Stratégie de contenu sur 4 semaines — objectif : convertir l’audience ' + (c.socials[0] ? (c.socials[0].net === 'x' ? 'X' : cap(c.socials[0].net)) : 'sociale') + ' en membres.',
        blocks: [
          { t: 'h', text: '3 piliers' },
          { t: 'ul', items: ['Découverte (40 %) : formats publics, courts, qui renvoient vers votre univers', 'Exclusivité (40 %) : ' + v.things.slice(0, 2).join(' et ') + ' réservés aux membres', 'Intimité (20 %) : lives, lettres et échanges directs pour vos meilleurs fans'] },
          { t: 'h', text: 'Semaine type' }, { t: 'week', items: week },
          { t: 'h', text: 'À suivre chaque semaine' },
          { t: 'ul', items: ['Conversion visite → abonnement (actuelle : ' + S.pct(p.conversion, 2) + ')', 'Clics sur vos smart links par réseau', 'Contenu le plus partagé → à décliner en offre payante', 'Pic d’audience le ' + bd + ' : gardez-y vos sorties importantes'] }
        ],
        actions: [{ l: 'Programmer un contenu', i: 'calendar', href: '#/content/new' }],
        copy: week.map(function (w) { return w[0] + ' — ' + w[1] + ' (' + S.levelName(w[2]) + ')'; }).join('\n')
      };
    }
  };
  function cap(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }

  /** Réponse libre : routage par mots-clés */
  function freeText(q) {
    var s = q.toLowerCase();
    var map = [['bio', /bio|présentation|description de moi/], ['post', /publi|post|légende|caption/], ['product', /produit|fiche|boutique/], ['offer', /offre|promo|réduc|prix|essai/], ['stats', /stat|analy|chiffre|perf|revenu/], ['ideas', /idée|inspir/], ['email', /email|mail|newsletter|campagne/], ['optimi', /optimi|audit|améliorer|conversion/], ['strategy', /stratég|planning|calendrier|plan/]];
    for (var i = 0; i < map.length; i++) if (map[i][1].test(s)) return map[i][0] === 'optimi' ? 'optimize' : map[i][0];
    return null;
  }

  /** Suggestion de réponse pour la messagerie */
  S.aiReply = function (text, m) {
    var s = String(text || '').toLowerCase(), n = m ? m.name.split(' ')[0] : '';
    var t = topTier();
    if (/commande|colis|livraison|parti/.test(s)) return 'Bonjour ' + n + ' ! Votre commande est bien partie, vous avez dû recevoir le numéro de suivi par email. Dites-moi si quoi que ce soit cloche ✦';
    if (/abonnement|replay|inclut|live/.test(s)) return 'Oui ' + n + ' ! ' + (t ? 'Le palier ' + t.name + ' inclut ' + (t.perks || []).slice(0, 2).join(' et ').toLowerCase() : 'Les replays sont inclus') + '. Tout est accessible dès l’inscription.';
    if (/collab|marque|partenariat/.test(s)) return 'Merci pour votre message ! Pour toute collaboration, écrivez à ' + S.mediakitData().contact + ' avec votre brief, je reviens vers vous sous 48 h.';
    if (/code|promo/.test(s)) return 'Oh non ! Vérifiez qu’il est bien saisi en majuscules. Si ça ne passe toujours pas, envoyez-moi une capture et je règle ça avec la marque.';
    if (/place|événement|event/.test(s)) return 'Il reste quelques places ' + n + ' ! Réservez directement depuis la section Événements de mon univers, les membres sont prioritaires.';
    if (/série|plus|suite/.test(s)) return 'Merci ' + n + ' 😍 Excellente idée, je prépare une suite pour les membres — tu seras prévenu·e en premier !';
    return 'Merci infiniment ' + n + ', ça me touche beaucoup ✦ À très vite dans l’univers !';
  };

  /* ---------------- Interface ---------------- */
  var viewEl = null;
  function render(main, sub) {
    main.innerHTML =
      '<div class="cp-wrap">' +
        '<div class="cp-head"><div class="cp-orb">' + S.ic('copilot', 22) + '</div><div><h2 class="sec-t">Copilote IA</h2><p class="sec-d">Votre assistant de création : il connaît votre univers, vos offres et vos chiffres.</p></div></div>' +
        '<p class="cp-note">' + S.ic('bolt', 14) + '<span><b>Mode démo :</b> en production, le copilote est propulsé par l’API Claude (voir docs/ARCHITECTURE.md). Ici, les réponses sont générées localement à partir de vos données.</span></p>' +
        '<div class="cp-chips" id="cpChips">' + ACTIONS.map(function (a) { return '<button type="button" class="cp-chip" data-run="' + a.id + '">' + S.ic(a.i, 16) + '<span>' + esc(a.l) + '</span></button>'; }).join('') + '</div>' +
        '<div class="cp-thread" id="cpThread" aria-live="polite"></div>' +
        '<form class="cp-input" id="cpForm"><textarea class="textarea" id="cpQ" rows="1" placeholder="Demandez au copilote… (ex. « écris une bio », « analyse mes stats »)" aria-label="Message au copilote"></textarea><button type="submit" class="btn btn-sig" aria-label="Envoyer">' + S.ic('send', 17) + '</button></form>' +
      '</div>';
    viewEl = main;
    var thread = main.querySelector('#cpThread');
    st.msgs.forEach(function (m) { thread.appendChild(msgEl(m, false)); });
    main.querySelector('#cpChips').addEventListener('click', function (e) { var b = e.target.closest('[data-run]'); if (b) run(b.getAttribute('data-run')); });
    var ta = main.querySelector('#cpQ');
    ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); main.querySelector('#cpForm').requestSubmit(); } });
    ta.addEventListener('input', function () { ta.style.height = 'auto'; ta.style.height = Math.min(140, ta.scrollHeight) + 'px'; });
    main.querySelector('#cpForm').addEventListener('submit', function (e) {
      e.preventDefault(); var q = ta.value.trim(); if (!q) return; ta.value = ''; ta.style.height = '';
      var id = freeText(q);
      if (id) run(id, false, q);
      else push({ role: 'user', text: q }), push({ role: 'ai', res: { intro: 'Je peux vous aider sur ces sujets — choisissez une action ou reformulez :', blocks: [{ t: 'ul', items: ACTIONS.map(function (a) { return a.l; }) }], actions: [] } }, true);
    });
    thread.addEventListener('click', function (e) {
      var b = e.target.closest('[data-a]'); if (!b) return;
      var msg = st.msgs[+b.closest('.cp-msg').getAttribute('data-m')], a = msg.res.actions[+b.getAttribute('data-a')];
      if (a.fn) { a.fn(); b.disabled = true; b.innerHTML = S.ic('check', 14) + 'Appliqué'; }
      else if (a.run) run(a.run);
      else if (a.href) S.go(a.href);
    });
    thread.addEventListener('click', function (e) {
      var b = e.target.closest('[data-copy]'); if (!b) return;
      var msg = st.msgs[+b.closest('.cp-msg').getAttribute('data-m')]; U.copy(msg.res.copy || '', 'Copié dans le presse-papiers');
    });
    var action = ACTIONS.filter(function (a) { return a.id === sub; })[0];
    if (action) { try { history.replaceState(null, '', '#/copilot'); } catch (e) { /* ignore */ } run(action.id); }
    else scrollEnd(false);
  }
  function run(id, silentUser, label) {
    st.n[id] = (st.n[id] || 0) + 1;
    var a = ACTIONS.filter(function (x) { return x.id === id; })[0];
    if (!silentUser) push({ role: 'user', text: label || a.l });
    var r = D.rng(S.handle + id + st.n[id] + Date.now());
    var res = GEN[id](r);
    push({ role: 'ai', res: res }, true);
  }
  function push(m, animate) {
    m.i = st.msgs.length; st.msgs.push(m);
    if (!viewEl || !viewEl.isConnected) return;
    var thread = viewEl.querySelector('#cpThread');
    thread.appendChild(msgEl(m, animate));
    scrollEnd(true);
  }
  function scrollEnd(smooth) {
    var f = viewEl && viewEl.querySelector('#cpForm'); if (!f) return;
    requestAnimationFrame(function () { f.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'end' }); });
  }

  function blockHtml(b) {
    switch (b.t) {
      case 'h': return '<h4 class="cp-h" data-type="' + esc(b.text) + '"></h4>';
      case 'p': return '<p data-type="' + esc(b.text) + '"></p>';
      case 'quote': return '<div class="cp-quote" data-type="' + esc(b.text) + '"></div>';
      case 'ul': case 'ol': return '<' + b.t + '>' + b.items.map(function (x) { return '<li data-type="' + esc(x) + '"></li>'; }).join('') + '</' + b.t + '>';
      case 'kv': return '<dl class="cp-kv">' + b.rows.map(function (r) { return '<div><dt>' + esc(r[0]) + '</dt><dd data-type="' + esc(r[1]) + '"></dd></div>'; }).join('') + '</dl>';
      case 'check': return '<ul class="cp-check">' + b.items.map(function (x) { return '<li class="' + (x.ok ? 'ok' : 'ko') + '"><span class="ck">' + S.ic(x.ok ? 'check' : 'x', 13) + '</span><div><b data-type="' + esc(x.t) + '"></b><span class="xs mute" data-type="' + esc(x.d) + '"></span></div></li>'; }).join('') + '</ul>';
      case 'score': return '<div class="cp-score"><div class="cp-score-b"><i style="width:' + b.v + '%"></i></div><b>' + b.v + '</b><span class="xs mute">/ 100</span></div>';
      case 'ideas': return '<ol class="cp-ideas">' + b.items.map(function (x) { return '<li><div><b data-type="' + esc(x.title) + '"></b><div class="row-wrap" style="gap:6px;margin-top:4px"><span class="tag">' + esc(x.fmt) + '</span>' + S.lvl(x.lvl) + '</div></div></li>'; }).join('') + '</ol>';
      case 'week': return '<ul class="cp-week">' + b.items.map(function (x) { return '<li><span class="cp-day">' + esc(x[0]) + '</span><span class="grow" data-type="' + esc(x[1]) + '"></span>' + S.lvl(x[2]) + '</li>'; }).join('') + '</ul>';
    }
    return '';
  }
  function msgEl(m, animate) {
    var el = document.createElement('div');
    el.className = 'cp-msg ' + m.role; el.setAttribute('data-m', m.i);
    if (m.role === 'user') { el.innerHTML = '<div class="cp-bub">' + esc(m.text) + '</div>'; return el; }
    var res = m.res;
    el.innerHTML = '<div class="cp-av">' + S.ic('copilot', 16) + '</div><div class="cp-body"><p class="cp-intro" data-type="' + esc(res.intro) + '"></p>' + res.blocks.map(blockHtml).join('') +
      '<div class="cp-acts" hidden>' + (res.actions || []).map(function (a, i) { return '<button type="button" class="btn btn-sm ' + (i ? 'btn-ghost' : 'btn-primary') + '" data-a="' + i + '">' + S.ic(a.i || 'check', 14) + esc(a.l) + '</button>'; }).join('') + (res.copy ? '<button type="button" class="btn btn-ghost btn-sm" data-copy>' + S.ic('copy', 14) + 'Copier</button>' : '') + '</div></div>';
    var targets = Array.prototype.slice.call(el.querySelectorAll('[data-type]'));
    var reduce = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    function finish() { targets.forEach(function (t) { t.textContent = t.getAttribute('data-type'); t.classList.remove('typing'); }); el.querySelector('.cp-acts').hidden = false; el.classList.remove('is-typing'); }
    if (!animate || reduce) { finish(); return el; }
    el.classList.add('is-typing');
    var ti = 0, ci = 0, dots = document.createElement('div');
    dots.className = 'cp-dots'; dots.innerHTML = '<i></i><i></i><i></i>';
    el.querySelector('.cp-body').prepend(dots);
    setTimeout(function () {
      dots.remove();
      (function step() {
        if (!el.isConnected) { finish(); return; }
        var t = targets[ti]; if (!t) { finish(); scrollEnd(true); return; }
        var full = t.getAttribute('data-type');
        t.classList.add('typing');
        ci = Math.min(full.length, ci + 4);
        t.textContent = full.slice(0, ci);
        if (ci >= full.length) { t.classList.remove('typing'); ti++; ci = 0; }
        setTimeout(step, 11);
      })();
    }, 650);
    return el;
  }

  S.register('copilot', { title: 'Copilote IA', short: 'Copilote', group: 'Création', icon: 'copilot', render: render });
})(window);
