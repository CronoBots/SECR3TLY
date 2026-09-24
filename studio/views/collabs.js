/* Studio — Collaborations : pipeline de brand deals (kanban) */
(function (root) {
  'use strict';
  var S = root.Studio, D = root.Secretly, U = root.SecretlyUI, esc = S.esc;
  var COLS = [['lead', 'Prospect'], ['brief', 'Brief'], ['contract', 'Contrat'], ['live', 'En cours'], ['done', 'Terminé']];
  var CI = {}; COLS.forEach(function (c, i) { CI[c[0]] = i; });

  function checked(b) { b.checked = b.checked || []; return (b.deliverables || []).filter(function (_, i) { return b.checked[i]; }).length; }

  function render(mainEl) {
    mainEl.innerHTML = '<div class="cb-root"></div>';
    var main = mainEl.querySelector('.cb-root');
    var c = S.c, list = c.collabs;
    var pipeline = list.filter(function (b) { return b.status === 'lead' || b.status === 'brief'; }).reduce(function (a, b) { return a + (b.fee || 0); }, 0);
    var signed = list.filter(function (b) { return ['contract', 'live', 'done'].indexOf(b.status) >= 0; }).reduce(function (a, b) { return a + (b.fee || 0); }, 0);
    var aff = list.reduce(function (a, b) { return a + (b.revenue || 0) * (b.commission || 0); }, 0);
    var clicks = list.reduce(function (a, b) { return a + (b.clicks || 0); }, 0);
    main.innerHTML =
      '<div class="sec-h"><div><h2 class="sec-t">Collaborations</h2><p class="sec-d">Suivez vos partenariats du premier contact au bilan : brief, contrat, livrables, commissions.</p></div>' +
        '<button type="button" class="btn btn-primary" id="cbNew">' + S.ic('plus', 16) + 'Nouvelle collaboration</button></div>' +
      '<div class="kpis kb-kpis"><div class="kpi"><div class="kpi-l">Pipeline</div><div class="kpi-v">' + S.money(pipeline) + '</div><div class="kpi-f"><span class="kpi-s">valeur potentielle</span></div></div>' +
        '<div class="kpi"><div class="kpi-l">Signé</div><div class="kpi-v">' + S.money(signed) + '</div><div class="kpi-f"><span class="kpi-s">contrats, en cours, terminés</span></div></div>' +
        '<div class="kpi"><div class="kpi-l">Commissions affiliation</div><div class="kpi-v">' + S.money(aff) + '</div><div class="kpi-f"><span class="kpi-s">' + S.num(clicks) + ' clics générés</span></div></div></div>' +
      (list.length ? '<div class="kanban mt" id="kb">' + COLS.map(function (col) {
        var items = list.filter(function (b) { return b.status === col[0]; });
        var sum = items.reduce(function (a, b) { return a + (b.fee || 0); }, 0);
        return '<section class="kb-col" data-col="' + col[0] + '" aria-label="' + col[1] + '"><header class="kb-h"><span class="kb-dot s-' + col[0] + '"></span><h3>' + col[1] + '</h3><span class="kb-n">' + items.length + '</span><span class="spacer"></span><span class="xs mute num">' + (sum ? esc(S.money(sum)) : '') + '</span></header>' +
          '<div class="kb-list">' + (items.map(card).join('') || '<div class="kb-empty">Déposez une carte ici</div>') + '</div></section>';
      }).join('') + '</div>' : '<div class="panel mt">' + S.empty({ icon: 'collabs', title: 'Aucune collaboration', text: 'Ajoutez vos premiers prospects et suivez vos brand deals jusqu’au bilan.', action: '<button type="button" class="btn btn-primary btn-sm" data-new>Ajouter un prospect</button>' }) + '</div>');

    function again() { render(mainEl); }
    main.querySelector('#cbNew').addEventListener('click', function () { editor(null, again); });
    var kb = main.querySelector('#kb');
    main.addEventListener('click', function (e) {
      if (e.target.closest('[data-new]')) { editor(null, again); return; }
      var b = e.target.closest('[data-act]'); if (!b) return;
      var id = b.closest('[data-id]').getAttribute('data-id'), deal = list.filter(function (x) { return x.id === id; })[0];
      var a = b.getAttribute('data-act');
      if (a === 'open') editor(deal, again);
      if (a === 'prev' || a === 'next') {
        var i = CI[deal.status] + (a === 'next' ? 1 : -1); if (i < 0 || i >= COLS.length) return;
        deal.status = COLS[i][0]; S.changed({ preview: false }); again();
        U.toast(deal.brand + ' → ' + COLS[i][1]);
        var f = main.querySelector('.kb-card[data-id="' + id + '"] [data-act="' + a + '"]') || main.querySelector('.kb-card[data-id="' + id + '"] [data-act="open"]'); if (f) f.focus();
      }
    });
    if (!kb) return;
    // Glisser-déposer (desktop)
    var dragId = null;
    kb.addEventListener('dragstart', function (e) { var cd = e.target.closest('.kb-card'); if (!cd) return; dragId = cd.getAttribute('data-id'); cd.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragId); } catch (err) { /* ignore */ } });
    kb.addEventListener('dragend', function () { dragId = null; kb.querySelectorAll('.dragging,.drop').forEach(function (x) { x.classList.remove('dragging', 'drop'); }); });
    kb.addEventListener('dragover', function (e) { var col = e.target.closest('.kb-col'); if (!col || !dragId) return; e.preventDefault(); kb.querySelectorAll('.kb-col').forEach(function (x) { x.classList.toggle('drop', x === col); }); });
    kb.addEventListener('drop', function (e) {
      var col = e.target.closest('.kb-col'); if (!col || !dragId) return; e.preventDefault();
      var deal = list.filter(function (x) { return x.id === dragId; })[0], to = col.getAttribute('data-col');
      if (deal && deal.status !== to) { deal.status = to; S.changed({ preview: false }); U.toast(deal.brand + ' → ' + COLS[CI[to]][1]); }
      again();
    });
  }
  function card(b) {
    var n = (b.deliverables || []).length, k = checked(b);
    var late = b.deadline && b.status !== 'done' && new Date(b.deadline + 'T23:59') < new Date();
    var i = CI[b.status];
    return '<article class="kb-card" draggable="true" data-id="' + esc(b.id) + '">' +
      '<button type="button" class="kb-open" data-act="open" aria-label="Ouvrir ' + esc(b.brand) + '"><span class="kb-brand">' + esc(b.brand) + '</span><span class="kb-type">' + esc(b.type || '') + '</span></button>' +
      '<div class="kb-meta"><span class="kb-fee">' + (b.fee ? esc(S.money(b.fee)) : '<span class="mute">Affiliation</span>') + '</span>' + (b.commission ? '<span class="tag">' + S.num(b.commission * 100) + ' % com.</span>' : '') + '</div>' +
      (n ? '<div class="kb-prog"><div class="kb-prog-b"><i style="width:' + (k / n * 100) + '%"></i></div><span class="xs mute">' + k + '/' + n + ' livrables</span></div>' : '') +
      ((b.revenue || b.clicks) ? '<div class="kb-stats xs"><span>' + esc(S.money(b.revenue || 0)) + ' générés</span><span>' + esc(S.num(b.clicks || 0)) + ' clics</span></div>' : '') +
      '<div class="kb-foot"><span class="xs ' + (late ? 'late' : 'mute') + '">' + S.ic('calendar', 12) + ' ' + (b.deadline ? esc(S.date(b.deadline, true)) : 'Sans échéance') + '</span><span class="spacer"></span>' +
      '<button type="button" class="icon-btn sm" data-act="prev" aria-label="Étape précédente"' + (i ? '' : ' disabled') + '>' + S.ic('left', 14) + '</button><button type="button" class="icon-btn sm" data-act="next" aria-label="Étape suivante"' + (i < COLS.length - 1 ? '' : ' disabled') + '>' + S.ic('right', 14) + '</button></div></article>';
  }

  function editor(deal, done) {
    var c = S.c, isNew = !deal;
    var m = deal ? S.clone(deal) : { id: S.uid('b'), brand: '', status: 'lead', type: '', fee: 0, deadline: '', deliverables: [], checked: [], commission: 0, revenue: 0, clicks: 0 };
    m.checked = m.checked || []; m.deliverables = m.deliverables || [];
    m.commissionPct = Math.round((m.commission || 0) * 1000) / 10;
    S.modal({
      title: isNew ? 'Nouvelle collaboration' : m.brand, subtitle: isNew ? '' : m.type,
      body: '<div class="fgrid">' +
        '<div class="field"><label for="cb-b">Marque</label><input class="input" id="cb-b" data-k="brand" placeholder="Ex. Maison Sézane"></div>' +
        '<div class="field"><label for="cb-t">Type de partenariat</label><input class="input" id="cb-t" data-k="type" placeholder="Campagne, placement, affiliation…"></div>' +
        '<div class="field"><label for="cb-s">Étape</label><select class="select" id="cb-s" data-k="status">' + COLS.map(function (x) { return '<option value="' + x[0] + '">' + x[1] + '</option>'; }).join('') + '</select></div>' +
        '<div class="field"><label for="cb-d">Échéance</label><input class="input" type="date" id="cb-d" data-k="deadline"></div>' +
        '<div class="field"><label for="cb-f">Cachet</label><div class="input-group"><span class="addon">€</span><input class="input" type="number" min="0" id="cb-f" data-k="fee" data-t="num"></div></div>' +
        '<div class="field"><label for="cb-c">Commission affiliation</label><div class="input-group"><span class="addon">%</span><input class="input" type="number" min="0" max="100" step="0.5" id="cb-c" data-k="commissionPct" data-t="num"></div></div>' +
        '<div class="field"><label for="cb-r">Revenus générés</label><div class="input-group"><span class="addon">€</span><input class="input" type="number" min="0" id="cb-r" data-k="revenue" data-t="num"></div></div>' +
        '<div class="field"><label for="cb-k">Clics</label><input class="input" type="number" min="0" id="cb-k" data-k="clicks" data-t="num"></div>' +
        '<div class="field full"><label>Livrables</label><ul class="dl-list" id="cbDl"></ul><form class="row mt-xs" id="cbAdd"><input class="input input-sm grow" id="cbNewDl" placeholder="Ajouter un livrable (ex. 2 Reels)" aria-label="Nouveau livrable"><button type="submit" class="btn btn-ghost btn-sm">' + S.ic('plus', 14) + 'Ajouter</button></form></div>' +
      '</div>',
      foot: (isNew ? '' : '<button type="button" class="btn btn-danger btn-sm" id="cbDel">' + S.ic('trash', 14) + 'Supprimer</button>') + '<span class="spacer"></span><button type="button" class="btn btn-ghost btn-sm" data-close>Annuler</button><button type="button" class="btn btn-primary btn-sm" id="cbSave">' + (isNew ? 'Ajouter' : 'Enregistrer') + '</button>',
      onOpen: function (el, close) {
        S.bind(el, m);
        function dl() {
          el.querySelector('#cbDl').innerHTML = m.deliverables.length ? m.deliverables.map(function (d, i) {
            return '<li class="dl"><label class="row grow"><input type="checkbox" class="cb" data-dl="' + i + '"' + (m.checked[i] ? ' checked' : '') + '><span' + (m.checked[i] ? ' class="done"' : '') + '>' + esc(d) + '</span></label><button type="button" class="icon-btn sm danger" data-rm="' + i + '" aria-label="Retirer ' + esc(d) + '">' + S.ic('x', 14) + '</button></li>';
          }).join('') : '<li class="xs mute">Aucun livrable pour l’instant.</li>';
        }
        dl();
        el.querySelector('#cbDl').addEventListener('change', function (e) { var i = e.target.getAttribute('data-dl'); if (i == null) return; m.checked[+i] = e.target.checked; dl(); });
        el.querySelector('#cbDl').addEventListener('click', function (e) { var b = e.target.closest('[data-rm]'); if (!b) return; var i = +b.getAttribute('data-rm'); m.deliverables.splice(i, 1); m.checked.splice(i, 1); dl(); });
        el.querySelector('#cbAdd').addEventListener('submit', function (e) { e.preventDefault(); var inp = el.querySelector('#cbNewDl'); var v = inp.value.trim(); if (!v) return; m.deliverables.push(v); m.checked.push(false); inp.value = ''; dl(); inp.focus(); });
        el.querySelector('#cbSave').addEventListener('click', function () {
          if (!m.brand.trim()) { el.querySelector('#cb-b').focus(); U.toast('Ajoutez le nom de la marque'); return; }
          m.commission = (Number(m.commissionPct) || 0) / 100; delete m.commissionPct;
          ['fee', 'revenue', 'clicks'].forEach(function (k) { m[k] = Math.max(0, Number(m[k]) || 0); });
          var i = c.collabs.findIndex(function (x) { return x.id === m.id; });
          if (i >= 0) c.collabs[i] = m; else c.collabs.push(m);
          S.changed({ preview: false }); close(); U.toast(isNew ? 'Collaboration ajoutée' : 'Collaboration mise à jour'); done();
        });
        var del = el.querySelector('#cbDel');
        if (del) del.addEventListener('click', function () { S.confirm('Supprimer la collaboration avec ' + deal.brand + ' ?', { ok: 'Supprimer', danger: true }).then(function (ok) { if (ok) { c.collabs = c.collabs.filter(function (x) { return x.id !== deal.id; }); S.changed({ preview: false }); close(); done(); } }); });
      }
    });
  }

  S.register('collabs', { title: 'Collaborations', short: 'Collabs', group: 'Revenus', icon: 'collabs', render: render });
})(window);
