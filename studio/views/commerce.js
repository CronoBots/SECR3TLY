/* Studio — Commerce : produits, abonnements, commandes, paiements */
(function (root) {
  'use strict';
  var S = root.Studio, D = root.Secretly, U = root.SecretlyUI, esc = S.esc;

  S.PLANS = [
    { id: 'free', name: 'Free', price: 0, fee: 0.10, tag: 'Pour démarrer', perks: ['Univers complet & smart links', '14 thèmes personnalisables', 'Abonnements, boutique, PPV', 'Mention « Powered by SECR3TLY »'] },
    { id: 'pro', name: 'Pro', price: 19, fee: 0.05, tag: 'Le plus choisi', perks: ['Tout Free', 'Domaine personnalisé', 'CRM & campagnes email', 'Analytics avancées', 'Copilote IA (500 requêtes / mois)'] },
    { id: 'premium', name: 'Premium', price: 49, fee: 0.02, tag: 'Marque blanche', perks: ['Tout Pro', 'Retrait de « Powered by SECR3TLY »', 'Media kit & collaborations', 'Copilote IA illimité', 'Support prioritaire'] },
    { id: 'business', name: 'Business', price: null, fee: null, tag: 'Agences & talents', perks: ['Tout Premium', 'Multi-comptes & multi-sièges', 'Rôles et permissions', 'Commission négociée', 'Account manager dédié'] }
  ];
  S.plan = function () { return S.PLANS.filter(function (p) { return p.id === S.c.settings.plan; })[0] || S.PLANS[1]; };

  var PTYPES = [['physical', 'Produit physique'], ['digital', 'Produit numérique'], ['ebook', 'E-book / guide'], ['course', 'Formation'], ['merch', 'Merch'], ['experience', 'Expérience'], ['ticket', 'Billet d’événement']];
  var PT = {}; PTYPES.forEach(function (t) { PT[t[0]] = t[1]; });
  var STOCKED = { physical: 1, merch: 1, experience: 1, ticket: 1 };
  var PATS = ['orb', 'silk', 'wave', 'grid', 'lines', 'sun', 'veil'];

  function render(main, sub, parts) {
    var tab = ['products', 'tiers', 'orders', 'payments'].indexOf(sub) >= 0 ? sub : 'products';
    var c = S.c;
    main.innerHTML = '<div class="sec-h"><div><h2 class="sec-t">Commerce</h2><p class="sec-d">Boutique, abonnements, commandes et versements — au même endroit.</p></div></div>' +
      S.subtabs('commerce', [{ id: 'products', label: 'Produits', count: c.products.length }, { id: 'tiers', label: 'Abonnements', count: c.tiers.length }, { id: 'orders', label: 'Commandes' }, { id: 'payments', label: 'Paiements' }], tab) +
      '<div id="coBody"></div>';
    var el = main.querySelector('#coBody');
    ({ products: products, tiers: tiers, orders: orders, payments: payments })[tab](el, parts[1]);
  }

  /* ---------------- Produits ---------------- */
  function products(el, action) {
    var c = S.c;
    var rev = c.products.reduce(function (a, p) { return a + p.price * (p.sales || 0); }, 0);
    var low = c.products.filter(function (p) { return STOCKED[p.type] && p.stock != null && p.stock <= 5; }).length;
    el.innerHTML = '<div class="kpis">' +
        '<div class="kpi"><div class="kpi-l">Produits</div><div class="kpi-v">' + c.products.length + '</div><div class="kpi-f"><span class="kpi-s">en vente dans la boutique</span></div></div>' +
        '<div class="kpi"><div class="kpi-l">Chiffre d’affaires cumulé</div><div class="kpi-v">' + S.money(rev) + '</div><div class="kpi-f"><span class="kpi-s">' + S.num(c.products.reduce(function (a, p) { return a + (p.sales || 0); }, 0)) + ' ventes</span></div></div>' +
        '<div class="kpi"><div class="kpi-l">Stock faible</div><div class="kpi-v">' + low + '</div><div class="kpi-f"><span class="kpi-s">produits ≤ 5 unités</span></div></div>' +
      '</div>' +
      '<div class="panel panel-flush mt"><div class="panel-h"><div><h3 class="panel-t">Catalogue</h3><p class="panel-d">Physique, numérique, formations, expériences…</p></div><button type="button" class="btn btn-primary btn-sm" id="prNew">' + S.ic('plus', 15) + 'Nouveau produit</button></div>' +
      (c.products.length ? '<div class="tbl-wrap"><table class="tbl tbl-cards"><thead><tr><th>Produit</th><th>Type</th><th class="r">Prix</th><th class="r">Stock</th><th class="r">Ventes</th><th class="r">Revenus</th><th></th></tr></thead><tbody>' + c.products.map(function (p) {
        var stock = STOCKED[p.type] ? (p.stock == null ? '∞' : p.stock <= 5 ? '<span class="pill pill-warn">' + p.stock + '</span>' : S.num(p.stock)) : '<span class="mute">—</span>';
        return '<tr data-id="' + esc(p.id) + '"><td class="td-main"><div class="cell-main">' + S.artBox(p.art, 'thumb') + '<div style="min-width:0"><div class="t">' + esc(p.name) + '</div><div class="s">' + esc(PT[p.type] || p.type) + '</div></div></div></td>' +
          '<td data-l="Type"><span class="tag">' + esc(PT[p.type] || p.type) + '</span></td><td class="r num" data-l="Prix">' + esc(S.money(p.price)) + '</td><td class="r num" data-l="Stock">' + stock + '</td><td class="r num" data-l="Ventes">' + S.num(p.sales || 0) + '</td><td class="r num" data-l="Revenus">' + esc(S.money(p.price * (p.sales || 0))) + '</td>' +
          '<td class="td-act r nowrap"><button type="button" class="icon-btn sm" data-act="edit" aria-label="Modifier">' + S.ic('edit', 15) + '</button><button type="button" class="icon-btn sm" data-act="dup" aria-label="Dupliquer">' + S.ic('copy', 15) + '</button><button type="button" class="icon-btn sm danger" data-act="del" aria-label="Supprimer">' + S.ic('trash', 15) + '</button></td></tr>';
      }).join('') + '</tbody></table></div>' : S.empty({ icon: 'commerce', title: 'Boutique vide', text: 'Ajoutez un premier produit : preset, e-book, merch, expérience…' })) + '</div>';
    function again() { products(S.fresh(el)); }
    el.querySelector('#prNew').addEventListener('click', function () { productEditor(null, again); });
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var id = b.closest('[data-id]').getAttribute('data-id'), i = c.products.findIndex(function (p) { return p.id === id; }), p = c.products[i];
      var a = b.getAttribute('data-act');
      if (a === 'edit') productEditor(p, again);
      if (a === 'dup') { var n = S.clone(p); n.id = S.uid('pr'); n.name += ' (copie)'; n.sales = 0; c.products.splice(i + 1, 0, n); S.changed(); again(); U.toast('Produit dupliqué'); }
      if (a === 'del') S.confirm('Supprimer « ' + p.name + ' » de la boutique ?', { ok: 'Supprimer', danger: true }).then(function (ok) { if (ok) { c.products.splice(i, 1); S.changed(); again(); U.toast('Produit supprimé'); } });
    });
    if (action === 'new') { try { history.replaceState(null, '', '#/commerce/products'); } catch (e) { /* ignore */ } productEditor(null, again); }
  }
  function productEditor(p, done) {
    var c = S.c, isNew = !p;
    var m = p ? S.clone(p) : { id: S.uid('pr'), name: '', type: 'digital', price: 19, art: { a: '#e8b4bc', b: '#2a1d22', pattern: 'grid' }, sales: 0 };
    m.art = m.art || { a: '#e8b4bc', b: '#2a1d22', pattern: 'grid' };
    S.modal({
      title: isNew ? 'Nouveau produit' : 'Modifier le produit',
      body: '<div class="prod-ed"><div class="prod-prev" id="pdPrev"></div><div class="fgrid grow">' +
        '<div class="field full"><label for="pd-n">Nom</label><input class="input" id="pd-n" data-k="name" maxlength="80" placeholder="Ex. Presets « Paris Hiver »"></div>' +
        '<div class="field"><label for="pd-t">Type</label><select class="select" id="pd-t" data-k="type">' + PTYPES.map(function (t) { return '<option value="' + t[0] + '">' + t[1] + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label for="pd-p">Prix</label><div class="input-group"><span class="addon">€</span><input class="input" id="pd-p" type="number" min="0" step="0.5" data-k="price" data-t="num"></div></div>' +
        '<div class="field full" id="pdStockF"><label for="pd-s">Stock</label><input class="input" id="pd-s" type="number" min="0" data-k="stock" data-t="num" placeholder="Vide = illimité"><span class="hint">Laissez vide pour un stock illimité.</span></div>' +
        '<div class="field full"><label for="pd-d">Description</label><textarea class="textarea" id="pd-d" data-k="desc" rows="3" placeholder="Ce que l’acheteur reçoit, format, délais…"></textarea><a class="hint link-btn" href="#/copilot/product">✦ Rédiger avec le copilote</a></div>' +
        '<div class="field full"><label>Visuel</label><div class="row-wrap art-ctl"><input type="color" data-k="art.a" aria-label="Couleur 1"><input type="color" data-k="art.b" aria-label="Couleur 2">' + PATS.map(function (x) { return '<button type="button" class="pat sm' + (m.art.pattern === x ? ' on' : '') + '" data-pat="' + x + '" aria-label="Motif ' + x + '"></button>'; }).join('') + '</div></div>' +
      '</div></div>',
      foot: '<button type="button" class="btn btn-ghost btn-sm" data-close>Annuler</button><button type="button" class="btn btn-primary btn-sm" id="pdSave">' + (isNew ? 'Ajouter à la boutique' : 'Enregistrer') + '</button>',
      onOpen: function (el, close) {
        function paint() {
          el.querySelector('#pdPrev').innerHTML = '<div class="artbox" style="aspect-ratio:1">' + U.art(m.art) + '</div><div class="t">' + esc(m.name || 'Nom du produit') + '</div><div class="s">' + esc(S.money(m.price || 0)) + '</div>';
          el.querySelectorAll('.pat').forEach(function (b) { b.innerHTML = U.art({ a: m.art.a, b: m.art.b, pattern: b.getAttribute('data-pat') }); });
          el.querySelector('#pdStockF').hidden = !STOCKED[m.type];
        }
        S.bind(el, m, paint); paint();
        el.querySelector('.art-ctl').addEventListener('click', function (e) { var b = e.target.closest('.pat'); if (!b) return; m.art.pattern = b.getAttribute('data-pat'); el.querySelectorAll('.pat').forEach(function (x) { x.classList.toggle('on', x === b); }); paint(); });
        el.querySelector('#pdSave').addEventListener('click', function () {
          if (!m.name.trim()) { el.querySelector('#pd-n').focus(); U.toast('Ajoutez un nom'); return; }
          if (!STOCKED[m.type] || m.stock == null || m.stock === '') delete m.stock;
          m.price = Math.max(0, Number(m.price) || 0);
          var i = c.products.findIndex(function (x) { return x.id === m.id; });
          if (i >= 0) c.products[i] = m; else c.products.push(m);
          S.changed(); close(); U.toast(isNew ? 'Produit ajouté à la boutique' : 'Produit mis à jour'); done();
        });
      }
    });
  }
  S.productEditor = productEditor;

  /* ---------------- Abonnements ---------------- */
  function tierSubs(t, i, paid) {
    var share = [0.62, 0.3, 0.08, 0.03][paid.indexOf(t)] || 0;
    return t.price > 0 ? Math.round((S.c.stats.members || 0) * share) : Math.round((S.c.stats.followers || 0) * 0.01);
  }
  function tiers(el) {
    var c = S.c, paid = c.tiers.filter(function (t) { return t.price > 0; });
    var mrr = paid.reduce(function (a, t, i) { return a + t.price * tierSubs(t, i, paid); }, 0);
    el.innerHTML = '<div class="sec-h" style="margin-bottom:14px"><div><p class="dim small">MRR estimé : <b class="num" style="color:var(--ivoire)">' + esc(S.money(mrr)) + '</b> · ' + paid.length + ' palier(s) payant(s)</p></div><button type="button" class="btn btn-primary btn-sm" id="tiNew">' + S.ic('plus', 15) + 'Nouveau palier</button></div>' +
      (c.tiers.length ? '<div class="tier-grid">' + c.tiers.map(function (t, i) {
        var subs = tierSubs(t, i, paid);
        return '<article class="tier' + (t.highlight ? ' hl' : '') + '" data-i="' + i + '">' + (t.highlight ? '<span class="tier-hl">Mis en avant</span>' : '') +
          '<div class="row-wrap">' + S.lvl(t.level) + (t.inviteOnly ? '<span class="tag">' + S.ic('lock', 11) + ' Sur invitation</span>' : '') + (t.limited ? '<span class="tag">' + t.limited + ' places</span>' : '') + '</div>' +
          '<h3 class="tier-n">' + esc(t.name) + '</h3><div class="tier-p">' + (t.price ? '<b>' + esc(S.money(t.price)) + '</b><span>/ mois</span>' : '<b>Gratuit</b>') + '</div>' +
          (t.yearly ? '<div class="xs dim">ou ' + esc(S.money(t.yearly)) + ' / an (−' + Math.round((1 - t.yearly / (t.price * 12)) * 100) + ' %)</div>' : '<div class="xs dim">&nbsp;</div>') +
          '<div class="row-wrap mt">' + (t.trialDays ? '<span class="pill pill-ok">Essai ' + t.trialDays + ' j</span>' : '') + (t.promo ? '<span class="pill pill-sig">' + esc(t.promo) + '</span>' : '') + '</div>' +
          '<ul class="tier-perks">' + (t.perks || []).map(function (p) { return '<li>' + S.ic('check', 14) + esc(p) + '</li>'; }).join('') + '</ul>' +
          '<div class="tier-f"><div><b class="num">' + esc(S.num(subs)) + '</b><span class="xs mute"> ' + (t.price ? 'abonnés' : 'membres gratuits') + '</span></div>' +
          '<div class="row"><button type="button" class="icon-btn sm" data-act="up" aria-label="Monter"' + (i ? '' : ' disabled') + '>' + S.ic('left', 15) + '</button><button type="button" class="icon-btn sm" data-act="down" aria-label="Descendre"' + (i < c.tiers.length - 1 ? '' : ' disabled') + '>' + S.ic('right', 15) + '</button><button type="button" class="icon-btn sm" data-act="edit" aria-label="Modifier ' + esc(t.name) + '">' + S.ic('edit', 15) + '</button><button type="button" class="icon-btn sm danger" data-act="del" aria-label="Supprimer ' + esc(t.name) + '">' + S.ic('trash', 15) + '</button></div></div></article>';
      }).join('') + '</div>' : '<div class="panel">' + S.empty({ icon: 'star', title: 'Aucun palier', text: 'Créez un abonnement Members, VIP ou Private.' }) + '</div>');
    function again() { tiers(S.fresh(el)); }
    el.querySelector('#tiNew').addEventListener('click', function () { tierEditor(null, again); });
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var i = +b.closest('[data-i]').getAttribute('data-i'), t = c.tiers[i], a = b.getAttribute('data-act');
      if (a === 'edit') tierEditor(t, again);
      if (a === 'up' && i > 0) { c.tiers.splice(i - 1, 0, c.tiers.splice(i, 1)[0]); S.changed(); again(); }
      if (a === 'down' && i < c.tiers.length - 1) { c.tiers.splice(i + 1, 0, c.tiers.splice(i, 1)[0]); S.changed(); again(); }
      if (a === 'del') S.confirm('Supprimer le palier « ' + t.name + ' » ? Les abonnés actuels conservent leur accès jusqu’à la fin de leur période.', { ok: 'Supprimer', danger: true }).then(function (ok) { if (ok) { c.tiers.splice(i, 1); S.changed(); again(); } });
    });
  }
  function tierEditor(t, done) {
    var c = S.c, isNew = !t;
    var m = t ? S.clone(t) : { id: S.uid('t'), name: '', level: 'members', price: 9, period: 'month', perks: [] };
    S.modal({
      title: isNew ? 'Nouveau palier' : 'Modifier « ' + t.name + ' »',
      body: '<div class="fgrid">' +
        '<div class="field"><label for="ti-n">Nom</label><input class="input" id="ti-n" data-k="name" maxlength="30" placeholder="Ex. Cercle"></div>' +
        '<div class="field"><label for="ti-l">Niveau d’accès</label><select class="select" id="ti-l" data-k="level">' + D.LEVELS.map(function (l) { return '<option value="' + l.id + '">' + l.name + ' — ' + esc(l.desc) + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label for="ti-p">Prix mensuel</label><div class="input-group"><span class="addon">€</span><input class="input" id="ti-p" type="number" min="0" step="0.01" data-k="price" data-t="num"></div></div>' +
        '<div class="field"><label for="ti-y">Prix annuel</label><div class="input-group"><span class="addon">€</span><input class="input" id="ti-y" type="number" min="0" step="1" data-k="yearly" data-t="num" placeholder="Optionnel"></div><span class="hint" id="tiYh"></span></div>' +
        '<div class="field"><label for="ti-tr">Essai gratuit (jours)</label><input class="input" id="ti-tr" type="number" min="0" max="60" data-k="trialDays" data-t="num" placeholder="0"></div>' +
        '<div class="field"><label for="ti-pr">Promotion</label><input class="input" id="ti-pr" data-k="promo" placeholder="Ex. −30 % le 1er mois"></div>' +
        '<div class="field"><label for="ti-li">Places limitées</label><input class="input" id="ti-li" type="number" min="0" data-k="limited" data-t="num" placeholder="Illimité"></div>' +
        '<div class="field"><label>&nbsp;</label>' + S.toggle('data-k="inviteOnly"', m.inviteOnly, 'Sur invitation uniquement') + '</div>' +
        '<div class="field full"><label for="ti-pk">Avantages <span class="mute">(un par ligne)</span></label><textarea class="textarea" id="ti-pk" data-k="perks" data-t="lines" rows="4"></textarea></div>' +
        '<div class="field full">' + S.toggle('data-k="highlight"', m.highlight, 'Mettre en avant', 'Affiché comme « recommandé » dans votre univers') + '</div>' +
      '</div>',
      foot: '<button type="button" class="btn btn-ghost btn-sm" data-close>Annuler</button><button type="button" class="btn btn-primary btn-sm" id="tiSave">' + (isNew ? 'Créer le palier' : 'Enregistrer') + '</button>',
      onOpen: function (el, close) {
        function hint() { el.querySelector('#tiYh').textContent = m.yearly && m.price ? 'Économie de ' + Math.round((1 - m.yearly / (m.price * 12)) * 100) + ' % vs mensuel' : 'Suggestion : ' + S.money(Math.round((m.price || 0) * 10)) + ' (2 mois offerts)'; }
        S.bind(el, m, hint); hint();
        el.querySelector('#tiSave').addEventListener('click', function () {
          if (!m.name.trim()) { el.querySelector('#ti-n').focus(); U.toast('Ajoutez un nom'); return; }
          ['yearly', 'trialDays', 'limited'].forEach(function (k) { if (!m[k]) delete m[k]; });
          if (!m.promo) delete m.promo;
          m.price = Math.max(0, Number(m.price) || 0); m.period = 'month';
          if (m.highlight) c.tiers.forEach(function (x) { if (x.id !== m.id) x.highlight = false; });
          var i = c.tiers.findIndex(function (x) { return x.id === m.id; });
          if (i >= 0) c.tiers[i] = m; else c.tiers.push(m);
          S.changed(); close(); U.toast(isNew ? 'Palier créé' : 'Palier mis à jour'); done();
        });
      }
    });
  }

  /* ---------------- Commandes (démo) ---------------- */
  var OST = { paid: ['Payée', 'pill-sig'], shipped: ['Expédiée', 'pill-warn'], delivered: ['Livrée', 'pill-ok'], digital: ['Livrée (numérique)', 'pill-ok'], refunded: ['Remboursée', 'pill-err'] };
  S.orders = function () {
    var c = S.c, r = D.rng(S.handle + 'orders'), mem = S.members(), out = [];
    var over = D.store.get('studio:orders:' + S.handle, {});
    var items = c.products.length ? c.products : [];
    var posts = c.posts.filter(function (p) { return p.price; });
    for (var i = 0; i < 36; i++) {
      var useP = items.length && (r() > 0.25 || !posts.length);
      var it = useP ? items[Math.floor(r() * items.length)] : posts[Math.floor(r() * Math.max(1, posts.length))];
      if (!it) break;
      var qty = useP && STOCKED[it.type] && r() > 0.8 ? 2 : 1;
      var at = Date.now() - (i * 17 + r() * 16) * 3600e3;
      var phys = useP && (it.type === 'physical' || it.type === 'merch');
      var age = (Date.now() - at) / 864e5;
      var stt = r() > 0.95 ? 'refunded' : !phys ? 'digital' : age < 1.5 ? 'paid' : age < 5 ? 'shipped' : 'delivered';
      var id = 'SX-' + (10480 - i);
      out.push({ id: id, at: at, customer: mem[Math.floor(r() * mem.length)].name, item: useP ? it.name : it.title, kind: useP ? (PT[it.type] || it.type) : 'Contenu PPV', qty: qty, amount: (it.price || 0) * qty, status: over[id] || stt, phys: phys });
    }
    return out;
  };
  function orders(el) {
    var list = S.orders(), f = 'all';
    var total = list.filter(function (o) { return o.status !== 'refunded'; }).reduce(function (a, o) { return a + o.amount; }, 0);
    var toShip = list.filter(function (o) { return o.status === 'paid'; }).length;
    el.innerHTML = '<div class="kpis"><div class="kpi"><div class="kpi-l">Commandes (36 dernières)</div><div class="kpi-v">' + list.length + '</div><div class="kpi-f"><span class="kpi-s">≈ 30 derniers jours</span></div></div>' +
      '<div class="kpi"><div class="kpi-l">Montant encaissé</div><div class="kpi-v">' + S.money(total) + '</div><div class="kpi-f"><span class="kpi-s">hors remboursements</span></div></div>' +
      '<div class="kpi"><div class="kpi-l">À expédier</div><div class="kpi-v">' + toShip + '</div><div class="kpi-f"><span class="kpi-s">commandes physiques payées</span></div></div></div>' +
      '<div class="panel panel-flush mt"><div class="cm-tools"><div class="fchips" id="orF">' + [['all', 'Toutes'], ['paid', 'À expédier'], ['shipped', 'Expédiées'], ['delivered', 'Livrées'], ['digital', 'Numériques'], ['refunded', 'Remboursées']].map(function (x, i) { return '<button type="button" class="fchip' + (i ? '' : ' on') + '" data-f="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div></div><div id="orT"></div></div>';
    function draw() {
      var rows = list.filter(function (o) { return f === 'all' || o.status === f; });
      el.querySelector('#orT').innerHTML = rows.length ? '<div class="tbl-wrap"><table class="tbl tbl-cards"><thead><tr><th>Commande</th><th>Client</th><th>Article</th><th class="r">Montant</th><th>Statut</th><th></th></tr></thead><tbody>' + rows.map(function (o) {
        var s = OST[o.status];
        return '<tr data-id="' + o.id + '"><td class="td-main"><div><div class="t num" style="font-weight:700">#' + o.id + '</div><div class="xs mute">' + esc(S.dateTime(new Date(o.at))) + '</div></div></td><td data-l="Client">' + esc(o.customer) + '</td>' +
          '<td data-l="Article"><div class="ellip" style="max-width:280px">' + esc(o.item) + (o.qty > 1 ? ' ×' + o.qty : '') + '</div><div class="xs mute">' + esc(o.kind) + '</div></td><td class="r num" data-l="Montant">' + esc(S.money(o.amount)) + '</td>' +
          '<td data-l="Statut"><span class="pill ' + s[1] + '"><span class="dot"></span>' + s[0] + '</span></td>' +
          '<td class="td-act r">' + (o.status === 'paid' ? '<button type="button" class="btn btn-ghost btn-xs" data-ship="' + o.id + '">Marquer expédiée</button>' : '') + '</td></tr>';
      }).join('') + '</tbody></table></div>' : S.empty({ icon: 'commerce', title: 'Aucune commande', text: 'Aucune commande dans cette catégorie.' });
    }
    draw();
    el.querySelector('#orF').addEventListener('click', function (e) { var b = e.target.closest('.fchip'); if (!b) return; f = b.getAttribute('data-f'); el.querySelectorAll('#orF .fchip').forEach(function (x) { x.classList.toggle('on', x === b); }); draw(); });
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-ship]'); if (!b) return;
      var over = D.store.get('studio:orders:' + S.handle, {}); over[b.getAttribute('data-ship')] = 'shipped'; D.store.set('studio:orders:' + S.handle, over);
      list = S.orders(); draw(); U.toast('Commande marquée expédiée — le client est notifié');
    });
  }

  /* ---------------- Paiements ---------------- */
  function payments(el) {
    var c = S.c, p = S.period(30), plan = S.plan();
    var gross = p.totals.revenue + p.mrr;
    var fee = plan.fee == null ? 0.015 : plan.fee;
    var com = gross * fee, proc = gross * 0.014 + (p.totals.sales + p.activeSubs) * 0.25 * 0.1, net = gross - com - proc;
    var r = D.rng(S.handle + 'payouts'), payouts = [];
    for (var i = 0; i < 6; i++) { var d = new Date(); d.setDate(1); d.setMonth(d.getMonth() - i); payouts.push({ d: d, amt: net * (0.82 + r() * 0.3), st: i === 0 ? 'pending' : 'paid' }); }
    var next = new Date(); next.setDate(next.getDate() + ((8 - next.getDay()) % 7 || 7));
    el.innerHTML =
      '<div class="pay-hero panel"><div><div class="eyebrow">Solde disponible</div><div class="pay-bal">' + esc(S.money(net * 0.34)) + '</div><p class="dim small">En attente (J+7) : ' + esc(S.money(net * 0.21)) + ' · Prochain virement le ' + esc(S.date(next, true)) + '</p></div>' +
        '<div class="row-wrap"><button type="button" class="btn btn-primary btn-sm" id="payOut">' + S.ic('wallet', 15) + 'Demander un virement</button></div></div>' +
      '<div class="g2 mt">' +
        '<section class="panel"><div class="panel-h"><div><h3 class="panel-t">Répartition — 30 derniers jours</h3><p class="panel-d">Plan ' + esc(plan.name) + ' : commission ' + (plan.fee == null ? 'négociée' : S.pct(plan.fee, 0)) + '</p></div></div>' +
          '<dl class="ledger"><div><dt>Revenus bruts</dt><dd>' + esc(S.money(gross)) + '</dd></div><div><dt>Commission SECR3TLY (' + (plan.fee == null ? 'devis' : S.pct(fee, 0)) + ')</dt><dd>− ' + esc(S.money(com)) + '</dd></div><div><dt>Frais de paiement (≈ 1,4 % + 0,25 €)</dt><dd>− ' + esc(S.money(proc)) + '</dd></div><div class="tot"><dt>Net créateur</dt><dd>' + esc(S.money(net)) + '</dd></div></dl>' +
          (plan.id !== 'premium' && plan.id !== 'business' ? '<p class="xs dim mt">Avec Premium (2 %), vous auriez économisé <b>' + esc(S.money(gross * (fee - 0.02) - 30)) + '</b> ce mois-ci, abonnement déduit. <a class="link-btn" href="#/settings/plan">Comparer les plans</a></p>' : '') + '</section>' +
        '<section class="panel stripe"><div class="panel-h"><div><h3 class="panel-t">Compte de paiement</h3><p class="panel-d">Encaissements et virements via Stripe Connect</p></div><span class="pill pill-warn"><span class="dot"></span>À connecter</span></div>' +
          '<p class="dim small">En production, SECR3TLY utilise <b>Stripe Connect</b> (comptes Express) : KYC, virements SEPA, TVA et factures sont gérés automatiquement. Cette démo n’effectue aucun paiement réel.</p>' +
          '<ul class="checks mt"><li>' + S.ic('check', 14) + 'Paiements par carte, Apple Pay, Google Pay</li><li>' + S.ic('check', 14) + 'Virements hebdomadaires automatiques</li><li>' + S.ic('check', 14) + 'Factures & TVA OSS pour l’UE</li></ul>' +
          '<button type="button" class="btn btn-ghost btn-sm mt" id="payStripe">' + S.ic('card', 15) + 'Connecter Stripe</button></section>' +
      '</div>' +
      '<section class="panel panel-flush mt"><div class="panel-h"><h3 class="panel-t">Historique des virements</h3></div><div class="tbl-wrap"><table class="tbl tbl-cards"><thead><tr><th>Période</th><th>Référence</th><th class="r">Montant</th><th>Statut</th></tr></thead><tbody>' +
        payouts.map(function (x, i) { return '<tr><td class="td-main"><b>' + esc(x.d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })) + '</b></td><td data-l="Référence" class="num mute">PO-' + (x.d.getFullYear() * 100 + x.d.getMonth() + 1) + '-' + S.handle.toUpperCase().slice(0, 3) + '</td><td class="r num" data-l="Montant">' + esc(S.money(x.amt)) + '</td><td data-l="Statut">' + (x.st === 'paid' ? '<span class="pill pill-ok"><span class="dot"></span>Versé</span>' : '<span class="pill pill-warn"><span class="dot"></span>En cours</span>') + '</td></tr>'; }).join('') +
      '</tbody></table></div></section>';
    el.querySelector('#payOut').addEventListener('click', function () { U.toast('Démo : aucun virement réel n’est effectué'); });
    el.querySelector('#payStripe').addEventListener('click', function () {
      S.modal({ title: 'Connecter Stripe', cls: 'dlg-sm', body: '<p class="dim">En production, ce bouton ouvre l’onboarding Stripe Connect Express (identité, IBAN, informations fiscales), puis vous ramène au Studio.</p><p class="dim mt">Dans cette démo statique, aucune donnée n’est envoyée.</p>', foot: '<button type="button" class="btn btn-primary btn-sm" data-close>Compris</button>' });
    });
  }

  S.register('commerce', { title: 'Commerce', group: 'Revenus', icon: 'commerce', render: render });
})(window);
