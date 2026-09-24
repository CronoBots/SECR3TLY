/* Studio — Contenus : publications, PPV, bundles, stories, programmation */
(function (root) {
  'use strict';
  var S = root.Studio, D = root.Secretly, U = root.SecretlyUI, esc = S.esc;

  var TYPES = [
    ['photo', 'Photo', 'image'], ['video', 'Vidéo', 'play'], ['album', 'Album', 'content'], ['story', 'Story', 'clock'], ['live', 'Live', 'bolt'],
    ['file', 'Fichier', 'file'], ['message', 'Message', 'chat'], ['ppv', 'PPV', 'lock'], ['bundle', 'Bundle', 'commerce']
  ];
  var TYPE = {}; TYPES.forEach(function (t) { TYPE[t[0]] = { l: t[1], i: t[2] }; });
  S.POST_TYPES = TYPES;
  var PATS = ['orb', 'silk', 'wave', 'grid', 'lines', 'sun', 'veil'];
  var st = { status: 'all', level: '', type: '', q: '', layout: 'grid' };

  function status(p) {
    if (p.status === 'draft' || p.draft) return 'draft';
    if (p.scheduledAt && new Date(p.scheduledAt) > new Date()) return 'scheduled';
    return 'published';
  }
  S.postStatus = status;
  var ST_L = { published: ['Publié', 'pill-ok'], scheduled: ['Programmé', 'pill-warn'], draft: ['Brouillon', 'pill-mute'] };
  function stPill(p) { var s = ST_L[status(p)]; return '<span class="pill ' + s[1] + '"><span class="dot"></span>' + s[0] + '</span>'; }

  function render(main, sub) {
    var c = S.c;
    var counts = { all: c.posts.length, published: 0, scheduled: 0, draft: 0 };
    c.posts.forEach(function (p) { counts[status(p)]++; });
    var ppv = c.posts.filter(function (p) { return p.price; }).reduce(function (a, p) { return a + p.price * Math.round((p.likes || 0) * 0.06); }, 0);
    main.innerHTML =
      '<div class="sec-h"><div><h2 class="sec-t">Contenus</h2><p class="sec-d">Publications, contenus exclusifs, stories éphémères, PPV et bundles — avec un niveau d’accès par contenu.</p></div>' +
        '<button type="button" class="btn btn-primary" id="ctNew">' + S.ic('plus', 16) + 'Nouveau contenu</button></div>' +
      '<div class="kpis k4">' +
        kpi('Publiés', S.num(counts.published), 'visibles dans l’univers') + kpi('Programmés', S.num(counts.scheduled), 'publication automatique') +
        kpi('Brouillons', S.num(counts.draft), 'non visibles') + kpi('Revenus PPV estimés', S.money(ppv), 'contenus à l’unité & bundles') +
      '</div>' +
      '<div class="toolbar mt">' +
        '<div class="fchips" id="ctSt">' + [['all', 'Tous'], ['published', 'Publiés'], ['scheduled', 'Programmés'], ['draft', 'Brouillons']].map(function (x) {
          return '<button type="button" class="fchip' + (st.status === x[0] ? ' on' : '') + '" data-s="' + x[0] + '">' + x[1] + ' <b>' + counts[x[0]] + '</b></button>';
        }).join('') + '</div>' +
        '<div class="tb-filters">' +
          '<div class="input-ic grow"><span>' + S.ic('search', 16) + '</span><input class="input input-sm" id="ctQ" placeholder="Rechercher un contenu" value="' + esc(st.q) + '" aria-label="Rechercher"></div>' +
          '<select class="select input-sm" id="ctLvl" aria-label="Niveau d’accès"><option value="">Tous niveaux</option>' + D.LEVELS.map(function (l) { return '<option value="' + l.id + '"' + (st.level === l.id ? ' selected' : '') + '>' + l.name + '</option>'; }).join('') + '</select>' +
          '<select class="select input-sm" id="ctType" aria-label="Type"><option value="">Tous types</option>' + TYPES.map(function (t) { return '<option value="' + t[0] + '"' + (st.type === t[0] ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') + '</select>' +
          S.seg('ctl', [{ v: 'grid', l: 'Grille', icon: 'content' }, { v: 'list', l: 'Liste', icon: 'analytics' }], st.layout, 'ct-lay') +
        '</div>' +
      '</div>' +
      '<div id="ctList" class="mt"></div>';

    var listEl = main.querySelector('#ctList');
    function draw() {
      var q = st.q.toLowerCase().trim();
      var list = c.posts.filter(function (p) {
        return (st.status === 'all' || status(p) === st.status) && (!st.level || p.access === st.level) && (!st.type || p.type === st.type) &&
          (!q || (p.title + ' ' + (p.caption || '')).toLowerCase().indexOf(q) >= 0);
      }).sort(function (a, b) { return (b.scheduledAt || b.date || '') < (a.scheduledAt || a.date || '') ? -1 : 1; });
      if (!list.length) {
        listEl.innerHTML = '<div class="panel">' + S.empty(c.posts.length ? { icon: 'search', title: 'Aucun résultat', text: 'Aucun contenu ne correspond à ces filtres.' } : { icon: 'content', title: 'Votre premier contenu', text: 'Photo, vidéo, story 24 h, live, PPV… choisissez qui peut le voir.', action: '<button type="button" class="btn btn-primary btn-sm" data-new>Créer un contenu</button>' }) + '</div>';
        return;
      }
      if (st.layout === 'grid') {
        listEl.innerHTML = '<div class="pc-grid">' + list.map(function (p) {
          return '<article class="pc" data-id="' + esc(p.id) + '"><button type="button" class="pc-media" data-act="edit" aria-label="Modifier ' + esc(p.title) + '">' + U.art(p.art) +
            '<span class="pc-type">' + S.ic(TYPE[p.type] ? TYPE[p.type].i : 'image', 13) + esc(TYPE[p.type] ? TYPE[p.type].l : p.type) + '</span>' +
            (p.ephemeral ? '<span class="pc-eph">24 h</span>' : '') + (p.price ? '<span class="pc-price">' + esc(S.money(p.price)) + '</span>' : '') + '</button>' +
            '<div class="pc-body"><div class="row-wrap">' + S.lvl(p.access) + stPill(p) + '</div><h3 class="pc-t">' + esc(p.title) + '</h3>' +
            '<div class="pc-meta"><span>♥ ' + esc(D.compact(p.likes || 0)) + '</span><span>' + S.ic('chat', 13) + ' ' + esc(S.num(p.comments || 0)) + '</span><span class="spacer"></span><span>' + esc(status(p) === 'scheduled' ? S.dateTime(p.scheduledAt) : S.date(p.date)) + '</span></div></div>' +
            '<div class="pc-act"><button type="button" class="icon-btn sm" data-act="edit" aria-label="Modifier">' + S.ic('edit', 15) + '</button><button type="button" class="icon-btn sm" data-act="dup" aria-label="Dupliquer">' + S.ic('copy', 15) + '</button><button type="button" class="icon-btn sm danger" data-act="del" aria-label="Supprimer">' + S.ic('trash', 15) + '</button></div></article>';
        }).join('') + '</div>';
      } else {
        listEl.innerHTML = '<div class="panel panel-flush"><div class="tbl-wrap"><table class="tbl tbl-cards"><thead><tr><th>Contenu</th><th>Accès</th><th>Statut</th><th class="r">Prix</th><th class="r">J’aime</th><th>Date</th><th></th></tr></thead><tbody>' + list.map(function (p) {
          return '<tr data-id="' + esc(p.id) + '"><td class="td-main"><div class="cell-main">' + S.artBox(p.art, 'thumb') + '<div style="min-width:0"><div class="t">' + esc(p.title) + '</div><div class="s">' + esc(TYPE[p.type] ? TYPE[p.type].l : p.type) + (p.ephemeral ? ' · 24 h' : '') + '</div></div></div></td>' +
            '<td data-l="Accès">' + S.lvl(p.access) + '</td><td data-l="Statut">' + stPill(p) + '</td><td class="r num" data-l="Prix">' + (p.price ? esc(S.money(p.price)) : '—') + '</td><td class="r num" data-l="J’aime">' + esc(S.num(p.likes || 0)) + '</td>' +
            '<td data-l="Date" class="nowrap">' + esc(status(p) === 'scheduled' ? S.dateTime(p.scheduledAt) : S.date(p.date)) + '</td>' +
            '<td class="td-act r nowrap"><button type="button" class="icon-btn sm" data-act="edit" aria-label="Modifier">' + S.ic('edit', 15) + '</button><button type="button" class="icon-btn sm" data-act="dup" aria-label="Dupliquer">' + S.ic('copy', 15) + '</button><button type="button" class="icon-btn sm danger" data-act="del" aria-label="Supprimer">' + S.ic('trash', 15) + '</button></td></tr>';
        }).join('') + '</tbody></table></div></div>';
      }
    }
    draw();
    function rerender() { render(main); }
    main.querySelector('#ctNew').addEventListener('click', function () { S.postEditor(null, rerender); });
    main.querySelector('#ctSt').addEventListener('click', function (e) { var b = e.target.closest('.fchip'); if (!b) return; st.status = b.getAttribute('data-s'); main.querySelectorAll('#ctSt .fchip').forEach(function (x) { x.classList.toggle('on', x === b); }); draw(); });
    main.querySelector('#ctQ').addEventListener('input', function () { st.q = this.value; draw(); });
    main.querySelector('#ctLvl').addEventListener('change', function () { st.level = this.value; draw(); });
    main.querySelector('#ctType').addEventListener('change', function () { st.type = this.value; draw(); });
    S.onSeg(main, 'ctl', function (v) { st.layout = v; draw(); });
    listEl.addEventListener('click', function (e) {
      if (e.target.closest('[data-new]')) { S.postEditor(null, rerender); return; }
      var b = e.target.closest('[data-act]'); if (!b) return;
      var id = b.closest('[data-id]').getAttribute('data-id');
      var i = c.posts.findIndex(function (p) { return p.id === id; }), p = c.posts[i];
      var a = b.getAttribute('data-act');
      if (a === 'edit') S.postEditor(p, rerender);
      if (a === 'dup') {
        var n = S.clone(p); n.id = S.uid('p'); n.title = p.title + ' (copie)'; n.status = 'draft'; n.draft = true; n.likes = 0; n.comments = 0; n.date = new Date().toISOString().slice(0, 10); delete n.scheduledAt;
        c.posts.splice(i + 1, 0, n); S.changed(); rerender(); U.toast('Contenu dupliqué en brouillon');
      }
      if (a === 'del') S.confirm('Supprimer « ' + p.title + ' » ? Cette action est définitive.', { ok: 'Supprimer', danger: true }).then(function (ok) { if (ok) { c.posts.splice(i, 1); S.changed(); rerender(); U.toast('Contenu supprimé'); } });
    });
    if (sub === 'new') {
      try { history.replaceState(null, '', '#/content'); } catch (e) { /* ignore */ }
      S.postEditor(null, rerender);
    }
  }
  function kpi(l, v, s) { return '<div class="kpi"><div class="kpi-l">' + esc(l) + '</div><div class="kpi-v">' + v + '</div><div class="kpi-f"><span class="kpi-s">' + esc(s) + '</span></div></div>'; }

  /** Éditeur de contenu (création / modification) */
  S.postEditor = function (post, onDone) {
    var c = S.c, isNew = !post;
    var m = post ? S.clone(post) : {
      id: S.uid('p'), type: 'photo', title: '', caption: '', access: 'members', art: { a: c.avatar.a || '#e8b4bc', b: c.avatar.b || '#9c7fa6', pattern: 'silk' },
      likes: 0, comments: 0, date: new Date().toISOString().slice(0, 10)
    };
    m.art = m.art || { a: '#e8b4bc', b: '#9c7fa6', pattern: 'orb' };
    m.accessMode = m.accessMode || 'permanent';
    var sched = !!m.scheduledAt;
    var defDate = new Date(Date.now() + 864e5); defDate.setHours(19, 0, 0, 0);
    function localIso(d) { var z = new Date(d.getTime() - d.getTimezoneOffset() * 6e4); return z.toISOString().slice(0, 16); }
    var body =
      '<div class="pe">' +
        '<div class="pe-form">' +
          '<div class="field"><label>Type de contenu</label><div class="type-grid" role="radiogroup" aria-label="Type">' + TYPES.map(function (t) {
            return '<button type="button" role="radio" aria-checked="' + (m.type === t[0]) + '" class="type-b' + (m.type === t[0] ? ' on' : '') + '" data-type="' + t[0] + '">' + S.ic(t[2], 17) + '<span>' + t[1] + '</span></button>';
          }).join('') + '</div></div>' +
          '<div class="field mt"><label for="pe-t">Titre</label><input class="input" id="pe-t" data-k="title" maxlength="90" placeholder="Ex. Coulisses du shooting d’automne" autofocus></div>' +
          '<div class="field mt"><div class="field-top"><label for="pe-c">Légende</label><span class="cnt" id="pe-cc"></span></div><textarea class="textarea" id="pe-c" data-k="caption" rows="3" placeholder="Ce que vos membres vont découvrir…"></textarea></div>' +
          '<div class="field mt"><label>Qui peut voir ce contenu ?</label><div class="lvl-grid">' + D.LEVELS.map(function (l) {
            return '<label class="lvl-opt"><input type="radio" name="pe-acc" value="' + l.id + '"' + (m.access === l.id ? ' checked' : '') + '><span class="lvl-card">' + S.lvl(l.id) + '<span class="xs mute">' + esc(l.desc) + '</span></span></label>';
          }).join('') + '</div></div>' +
          '<div class="pe-money mt" id="peMoney">' +
            '<div class="fgrid"><div class="field"><label for="pe-p">Prix</label><div class="input-group"><span class="addon">€</span><input class="input" id="pe-p" type="number" min="0" step="0.5" data-k="price" data-t="num" placeholder="12"></div></div>' +
            '<div class="field"><label>Accès après achat</label>' + S.seg('pe-am', [{ v: 'permanent', l: 'Permanent' }, { v: 'temporary', l: 'Temporaire' }], m.accessMode, 'seg-full') + '</div>' +
            '<div class="field full" id="peHours"><label for="pe-h">Durée d’accès</label><select class="select" id="pe-h" data-k="accessHours" data-t="num"><option value="24">24 heures</option><option value="48">48 heures</option><option value="72">3 jours</option><option value="168">7 jours</option><option value="720">30 jours</option></select></div></div>' +
          '</div>' +
          '<div class="fgrid mt"><div class="field" id="peCount"><label for="pe-n">Nombre de médias</label><input class="input" id="pe-n" type="number" min="1" data-k="count" data-t="num" placeholder="12"></div>' +
          '<div class="field" id="peDur"><label for="pe-d">Durée</label><input class="input" id="pe-d" data-k="duration" placeholder="12:30"></div></div>' +
          '<div class="pe-opts mt">' + S.toggle('data-k="ephemeral"', m.ephemeral, 'Éphémère 24 h', 'Disparaît automatiquement 24 h après publication') +
            S.toggle('id="pe-sch"', sched, 'Programmer la publication', 'Publié automatiquement à la date choisie') + '</div>' +
          '<div class="field" id="peWhen"><label for="pe-w">Date et heure de publication</label><input class="input" type="datetime-local" id="pe-w" value="' + esc(m.scheduledAt ? m.scheduledAt.slice(0, 16) : localIso(defDate)) + '"></div>' +
          '<div class="field mt"><label>Visuel</label><div class="row-wrap art-ctl"><input type="color" data-k="art.a" aria-label="Couleur 1"><input type="color" data-k="art.b" aria-label="Couleur 2">' +
            PATS.map(function (p) { return '<button type="button" class="pat sm' + (m.art.pattern === p ? ' on' : '') + '" data-pat="' + p + '" aria-label="Motif ' + p + '">' + U.art({ a: m.art.a, b: m.art.b, pattern: p }) + '</button>'; }).join('') + '</div></div>' +
        '</div>' +
        '<aside class="pe-prev"><div class="xs mute pe-prev-l">Aperçu</div><div id="pePrev"></div></aside>' +
      '</div>';
    var foot = (isNew ? '' : '<button type="button" class="btn btn-danger btn-sm" id="peDel">' + S.ic('trash', 14) + 'Supprimer</button>') + '<span class="spacer"></span>' +
      '<button type="button" class="btn btn-ghost btn-sm" id="peDraft">Enregistrer le brouillon</button><button type="button" class="btn btn-primary btn-sm" id="pePub">Publier</button>';
    S.modal({
      title: isNew ? 'Nouveau contenu' : 'Modifier le contenu', wide: true, cls: 'dlg-pe', body: body, foot: foot,
      onOpen: function (el, close) {
        function sync() {
          var money = m.type === 'ppv' || m.type === 'bundle' || m.type === 'message' || !!m.price;
          el.querySelector('#peMoney').hidden = !money;
          el.querySelector('#peHours').hidden = m.accessMode !== 'temporary';
          el.querySelector('#peCount').hidden = !(m.type === 'album' || m.type === 'bundle');
          el.querySelector('#peDur').hidden = !(m.type === 'video' || m.type === 'live');
          el.querySelector('#peWhen').hidden = !sched;
          el.querySelector('#pePub').textContent = sched ? 'Programmer' : (isNew || status(m) === 'draft' ? 'Publier' : 'Enregistrer');
          el.querySelector('#pePrev').innerHTML =
            '<article class="pc pc-static"><div class="pc-media">' + U.art(m.art) + '<span class="pc-type">' + S.ic(TYPE[m.type].i, 13) + esc(TYPE[m.type].l) + '</span>' + (m.ephemeral ? '<span class="pc-eph">24 h</span>' : '') + (m.price && money ? '<span class="pc-price">' + esc(S.money(m.price)) + '</span>' : '') +
            (m.access !== 'public' ? '<span class="pc-lock">' + S.ic('lock', 20) + '<span>' + esc(S.levelName(m.access)) + '</span></span>' : '') + '</div>' +
            '<div class="pc-body"><div class="row-wrap">' + S.lvl(m.access) + (sched ? '<span class="pill pill-warn"><span class="dot"></span>' + esc(S.dateTime(el.querySelector('#pe-w').value)) + '</span>' : '') + '</div><h3 class="pc-t">' + esc(m.title || 'Titre du contenu') + '</h3><p class="pc-cap">' + esc(m.caption || 'Votre légende apparaîtra ici.') + '</p>' +
            (m.price && money ? '<p class="xs mute">' + (m.accessMode === 'temporary' ? 'Accès ' + esc(el.querySelector('#pe-h').selectedOptions[0].text) + ' après achat' : 'Accès permanent après achat') + '</p>' : '') + '</div></article>';
        }
        S.bind(el, m, function (k) {
          if (k === 'ephemeral' && m.ephemeral && m.type !== 'story') { /* ok */ }
          if (k === 'art.a' || k === 'art.b') el.querySelectorAll('.pat').forEach(function (b) { b.innerHTML = U.art({ a: m.art.a, b: m.art.b, pattern: b.getAttribute('data-pat') }); });
          sync();
        });
        if (!m.accessHours) el.querySelector('#pe-h').value = '48';
        S.counter(el.querySelector('#pe-c'), el.querySelector('#pe-cc'), 280);
        el.querySelector('.type-grid').addEventListener('click', function (e) {
          var b = e.target.closest('.type-b'); if (!b) return;
          m.type = b.getAttribute('data-type');
          el.querySelectorAll('.type-b').forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-checked', x === b); });
          if (m.type === 'story' && !m.ephemeral) { m.ephemeral = true; el.querySelector('[data-k="ephemeral"]').checked = true; }
          if ((m.type === 'ppv' || m.type === 'bundle') && !m.price) { m.price = m.type === 'ppv' ? 12 : 29; el.querySelector('#pe-p').value = m.price; }
          sync();
        });
        el.querySelectorAll('input[name="pe-acc"]').forEach(function (r) { r.addEventListener('change', function () { m.access = r.value; sync(); }); });
        S.onSeg(el, 'pe-am', function (v) { m.accessMode = v; if (v === 'temporary' && !m.accessHours) m.accessHours = 48; sync(); });
        el.querySelector('#pe-sch').addEventListener('change', function () { sched = this.checked; sync(); });
        el.querySelector('#pe-w').addEventListener('input', sync);
        el.querySelector('.art-ctl').addEventListener('click', function (e) {
          var b = e.target.closest('.pat'); if (!b) return;
          m.art.pattern = b.getAttribute('data-pat');
          el.querySelectorAll('.pat').forEach(function (x) { x.classList.toggle('on', x === b); }); sync();
        });
        sync();
        function commit(asDraft) {
          if (!m.title.trim()) { var t = el.querySelector('#pe-t'); t.focus(); t.classList.add('invalid'); U.toast('Ajoutez un titre'); return; }
          var money = m.type === 'ppv' || m.type === 'bundle' || m.type === 'message';
          if (!money && !m.price) delete m.price;
          if (m.accessMode !== 'temporary') delete m.accessHours;
          if (asDraft) { m.status = 'draft'; m.draft = true; }
          else { m.status = 'published'; delete m.draft; }
          if (sched && !asDraft) { m.scheduledAt = el.querySelector('#pe-w').value; m.date = m.scheduledAt.slice(0, 10); m.status = 'scheduled'; }
          else if (!sched) delete m.scheduledAt;
          if (!asDraft && !sched && (isNew || (post && status(post) === 'draft'))) m.date = new Date().toISOString().slice(0, 10);
          var i = c.posts.findIndex(function (p) { return p.id === m.id; });
          if (i >= 0) c.posts[i] = m; else c.posts.unshift(m);
          S.changed(); close();
          U.toast(asDraft ? 'Brouillon enregistré' : sched ? 'Publication programmée le ' + S.dateTime(m.scheduledAt) : 'Contenu publié');
          if (onDone) onDone(m);
        }
        el.querySelector('#peDraft').addEventListener('click', function () { commit(true); });
        el.querySelector('#pePub').addEventListener('click', function () { commit(false); });
        var del = el.querySelector('#peDel');
        if (del) del.addEventListener('click', function () {
          S.confirm('Supprimer « ' + (post.title) + ' » ?', { ok: 'Supprimer', danger: true }).then(function (ok) {
            if (!ok) return; c.posts = c.posts.filter(function (p) { return p.id !== post.id; }); S.changed(); close(); U.toast('Contenu supprimé'); if (onDone) onDone();
          });
        });
      }
    });
  };

  S.register('content', { title: 'Contenus', group: 'Création', icon: 'content', render: render });
})(window);
