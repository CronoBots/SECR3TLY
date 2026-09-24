/* Studio — Univers : le builder (thème, identité, sections, liens, réseaux)
   avec aperçu live de ../c/?u=<handle>&preview=1 (postMessage). */
(function (root) {
  'use strict';
  var S = root.Studio, D = root.Secretly, U = root.SecretlyUI, T = root.SecretlyThemes, esc = S.esc;

  var TABS = [
    { id: 'theme', label: 'Thème' },
    { id: 'identity', label: 'Identité' },
    { id: 'sections', label: 'Sections' },
    { id: 'links', label: 'Liens' },
    { id: 'socials', label: 'Réseaux' }
  ];
  var COLORS = [['bg', 'Fond'], ['surface', 'Surface'], ['ink', 'Texte'], ['muted', 'Texte secondaire'], ['accent', 'Accent'], ['accent2', 'Accent 2']];
  var ENUMS = {
    button: { l: 'Boutons', o: [['pill', 'Pilule'], ['soft', 'Doux'], ['square', 'Carré']] },
    card: { l: 'Cartes', o: [['glass', 'Verre'], ['solid', 'Plein'], ['outline', 'Contour'], ['flat', 'Plat']] },
    background: { l: 'Arrière-plan', o: [['aura', 'Aura'], ['plain', 'Uni'], ['mesh', 'Mesh'], ['grain', 'Grain'], ['lines', 'Lignes']] },
    animation: { l: 'Animations', o: [['none', 'Aucune'], ['subtle', 'Subtiles'], ['rich', 'Riches']] },
    titleCase: { l: 'Casse des titres', o: [['none', 'Normale'], ['upper', 'Majuscules']] },
    mode: { l: 'Mode', o: [['dark', 'Sombre'], ['light', 'Clair']] }
  };
  var RANGES = {
    radius: { l: 'Arrondi', min: 0, max: 40, step: 1, f: function (v) { return v + ' px'; } },
    border: { l: 'Bordures', min: 0, max: 3, step: 1, f: function (v) { return v + ' px'; } },
    shadow: { l: 'Ombres', min: 0, max: 1, step: 0.05, f: function (v) { return S.num(v * 100) + ' %'; } },
    transparency: { l: 'Transparence', min: 0, max: 1, step: 0.05, f: function (v) { return S.num(v * 100) + ' %'; } }
  };
  var PATTERNS = [['orb', 'Orbe'], ['silk', 'Soie'], ['wave', 'Vague'], ['grid', 'Grille'], ['lines', 'Lignes'], ['sun', 'Soleil'], ['veil', 'Voile']];
  var NETS = [['instagram', 'Instagram'], ['tiktok', 'TikTok'], ['youtube', 'YouTube'], ['x', 'X'], ['snapchat', 'Snapchat'], ['facebook', 'Facebook'], ['twitch', 'Twitch'], ['pinterest', 'Pinterest'], ['telegram', 'Telegram'], ['web', 'Site web']];
  var GLYPHS = ['✦', '◈', '♛', '▶', '●', '✧', '♥', '★', '✉', '%', '☾', '❖', '→'];

  var st = { tab: 'theme', device: 'phone', view: 'ctrl' };

  function render(main, sub) {
    st.tab = TABS.some(function (t) { return t.id === sub; }) ? sub : st.tab;
    var c = S.c;
    main.innerHTML =
      '<div class="ub ' + (st.view === 'prev' ? 'show-prev' : '') + '" id="ub">' +
        '<div class="ub-switch">' + S.seg('ubv', [{ v: 'ctrl', l: 'Réglages', icon: 'settings' }, { v: 'prev', l: 'Aperçu live', icon: 'eye' }], st.view, 'seg-full') + '</div>' +
        '<div class="ub-ctrl">' +
          '<div class="ub-tabs" role="tablist">' + TABS.map(function (t) { return '<button type="button" role="tab" class="ub-tab' + (t.id === st.tab ? ' on' : '') + '" aria-selected="' + (t.id === st.tab) + '" data-tab="' + t.id + '">' + esc(t.label) + '</button>'; }).join('') + '</div>' +
          '<div class="ub-panel" id="ubPanel" role="tabpanel"></div>' +
        '</div>' +
        '<div class="ub-prev">' +
          '<div class="ub-bar">' +
            S.seg('ubd', [{ v: 'phone', l: 'Mobile', icon: 'phone' }, { v: 'desktop', l: 'Bureau', icon: 'desktop' }], st.device, 'ub-dev') +
            '<div class="ub-as"><span class="xs mute">Voir en tant que</span>' + S.seg('uba', D.LEVELS.map(function (l) { return { v: l.id, l: l.name }; }), S.preview.as) + '</div>' +
          '</div>' +
          '<div class="ub-stage" id="ubStage"><div class="ub-device" id="ubDevice"><div class="ub-notch"></div><iframe id="ubFrame" title="Aperçu de l’univers de ' + esc(c.name) + '" src="' + esc(S.previewUrl()) + '"></iframe></div></div>' +
          '<div class="ub-foot"><span class="live-dot" id="ubLive"><i></i>Connexion à l’aperçu…</span><span class="spacer"></span><button type="button" class="icon-btn sm" id="ubReload" aria-label="Recharger l’aperçu" title="Recharger">' + S.ic('refresh', 16) + '</button><a class="icon-btn sm" href="' + esc(D.creatorUrl(c.handle)) + '" target="_blank" rel="noopener" aria-label="Ouvrir dans un nouvel onglet" title="Ouvrir">' + S.ic('external', 16) + '</a></div>' +
        '</div>' +
      '</div>';

    var ub = main.querySelector('#ub'), frame = main.querySelector('#ubFrame');
    S.preview.frame = frame;
    frame.addEventListener('load', function () { S.pushPreview(); S.pushAs(); });
    var live = main.querySelector('#ubLive'), ready = false;
    function onReady() { ready = true; live.className = 'live-dot on'; live.innerHTML = '<i></i>Aperçu live'; }
    S.on('preview:ready', onReady);
    var tmo = setTimeout(function () { if (!ready && live.isConnected) { live.className = 'live-dot off'; live.innerHTML = '<i></i>Aperçu en attente de la page créateur'; } }, 6000);
    S.cleanup(function () { clearTimeout(tmo); S.preview.frame = null; S.off('preview:ready', onReady); });

    main.querySelector('#ubReload').addEventListener('click', function () { ready = false; live.className = 'live-dot'; live.innerHTML = '<i></i>Connexion à l’aperçu…'; frame.src = S.previewUrl(); });
    S.onSeg(main, 'ubv', function (v) { st.view = v; ub.classList.toggle('show-prev', v === 'prev'); fit(); });
    S.onSeg(main, 'ubd', function (v) { st.device = v; fit(); });
    S.onSeg(main, 'uba', function (v) { S.preview.as = v; S.pushAs(); });
    main.querySelector('.ub-tabs').addEventListener('click', function (e) {
      var b = e.target.closest('.ub-tab'); if (!b) return;
      st.tab = b.getAttribute('data-tab');
      main.querySelectorAll('.ub-tab').forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
      try { history.replaceState(null, '', '#/universe/' + st.tab); } catch (err) { /* ignore */ }
      panel();
    });
    main.querySelector('.ub-tabs').addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      var bs = Array.prototype.slice.call(main.querySelectorAll('.ub-tab')), i = bs.indexOf(document.activeElement);
      if (i < 0) return; var n = bs[(i + (e.key === 'ArrowRight' ? 1 : bs.length - 1)) % bs.length]; n.focus(); n.click();
    });

    // Mise à l'échelle de l'appareil
    var stage = main.querySelector('#ubStage'), dev = main.querySelector('#ubDevice');
    function fit() {
      var phone = st.device === 'phone';
      var fw = phone ? 390 : 1280, fh = phone ? 844 : 820;
      dev.classList.toggle('is-phone', phone); dev.classList.toggle('is-desktop', !phone);
      var W = stage.clientWidth - 8;
      var top = stage.getBoundingClientRect().top;
      var mobile = root.innerWidth < 1100;
      var H = Math.max(360, root.innerHeight - Math.max(top, mobile ? 150 : 120) - (mobile ? 130 : 70));
      var pad = phone ? 22 : 12;
      var s = Math.min(1, W / (fw + pad), H / (fh + pad));
      frame.style.width = fw + 'px'; frame.style.height = fh + 'px';
      frame.style.transform = 'scale(' + s + ')';
      dev.style.width = Math.round(fw * s + pad) + 'px';
      dev.style.height = Math.round(fh * s + pad) + 'px';
      dev.style.setProperty('--s', s);
    }
    fit();
    requestAnimationFrame(fit);
    var onRs = function () { fit(); };
    root.addEventListener('resize', onRs);
    S.cleanup(function () { root.removeEventListener('resize', onRs); });

    var panelEl = main.querySelector('#ubPanel');
    function panel() {
      // nouvel élément à chaque onglet : évite l'empilement des écouteurs délégués
      var fresh = panelEl.cloneNode(false); panelEl.replaceWith(fresh); panelEl = fresh;
      ({ theme: themePanel, identity: identityPanel, sections: sectionsPanel, links: linksPanel, socials: socialsPanel })[st.tab](panelEl);
    }
    panel();
  }

  /* ---------------- Thème ---------------- */
  function themePanel(el) {
    var c = S.c, th = c.theme, ov = th.overrides;
    var base = T.PRESETS[th.preset] || T.PRESETS.premium, res = T.resolve(th);
    T.loadFonts(T.FONTS);
    var nOv = Object.keys(ov).filter(function (k) { return ov[k] !== '' && ov[k] != null; }).length;
    el.innerHTML =
      '<div class="ub-sec"><div class="ub-sec-h"><div><h3 class="ub-h">Préréglages</h3><p class="ub-d">14 directions artistiques. Tout reste personnalisable ensuite.</p></div></div>' +
        '<div class="pz-grid">' + Object.keys(T.PRESETS).map(function (id) {
          var p = T.PRESETS[id], on = id === th.preset;
          return '<button type="button" class="pz' + (on ? ' on' : '') + '" data-p="' + id + '" aria-pressed="' + on + '">' +
            '<span class="pz-art" style="background:' + T.backgroundCss(p) + '">' +
              '<span class="pz-card" style="background:' + p.surface + ';border-radius:' + Math.min(p.radius, 12) + 'px;border:' + (p.border ? '1px solid ' + T.rgba(p.ink, .15) : '0') + '">' +
                '<b style="color:' + p.ink + ';font-family:\'' + p.display + '\',serif;' + (p.titleCase === 'upper' ? 'text-transform:uppercase;letter-spacing:.06em;font-size:.8em' : '') + '">Aa</b>' +
                '<span class="pz-btn" style="background:' + p.accent + ';border-radius:' + (p.button === 'pill' ? '99px' : p.button === 'soft' ? '4px' : '1px') + '"></span>' +
              '</span>' +
              '<span class="pz-dots"><i style="background:' + p.accent + '"></i><i style="background:' + p.accent2 + '"></i></span>' +
            '</span><span class="pz-n">' + esc(p.name) + '</span></button>';
        }).join('') + '</div></div>' +
      '<div class="ub-sec"><div class="ub-sec-h"><div><h3 class="ub-h">Personnalisation</h3><p class="ub-d">Base : <b>' + esc(base.name) + '</b> · <span id="ovCount">' + nOv + '</span> propriété(s) modifiée(s)</p></div>' +
        '<button type="button" class="btn btn-ghost btn-xs" id="ovReset"' + (nOv ? '' : ' disabled') + '>' + S.ic('refresh', 14) + 'Réinitialiser au préréglage</button></div>' +
        grp('Couleurs', true, '<div class="cc-grid">' + COLORS.map(function (x) { return colorCtl(x[0], x[1], res[x[0]]); }).join('') + '</div>') +
        grp('Typographie', true,
          '<div class="fgrid">' + fontCtl('display', 'Police des titres', res.display) + fontCtl('body', 'Police du texte', res.body) + '</div>' +
          '<div class="font-demo" id="fontDemo"></div>' + enumCtl('titleCase', res.titleCase)) +
        grp('Formes', false, rangeCtl('radius', res.radius) + enumCtl('button', res.button) + enumCtl('card', res.card) + rangeCtl('border', res.border)) +
        grp('Ambiance', false, enumCtl('mode', res.mode) + enumCtl('background', res.background) + rangeCtl('shadow', res.shadow) + rangeCtl('transparency', res.transparency) + enumCtl('animation', res.animation)) +
      '</div>';

    function mark(prop) {
      var isOv = ov[prop] != null && ov[prop] !== '';
      el.querySelectorAll('[data-ctl="' + prop + '"]').forEach(function (x) { x.classList.toggle('is-ov', isOv); });
      var n = Object.keys(ov).filter(function (k) { return ov[k] !== '' && ov[k] != null; }).length;
      el.querySelector('#ovCount').textContent = n;
      el.querySelector('#ovReset').disabled = !n;
    }
    function setProp(prop, v) {
      if (String(v) === String(base[prop])) delete ov[prop]; else ov[prop] = v;
      mark(prop); S.changed();
      if (prop === 'display' || prop === 'body' || prop === 'titleCase') fontDemo();
    }
    function fontDemo() {
      var r = T.resolve(th);
      el.querySelector('#fontDemo').innerHTML = '<span style="font-family:\'' + esc(r.display) + '\',serif;' + (r.titleCase === 'upper' ? 'text-transform:uppercase;letter-spacing:.08em;font-size:1.05rem' : '') + '">' + esc(c.name) + '</span><span style="font-family:\'' + esc(r.body) + '\',sans-serif">' + esc(c.tagline || 'Votre univers, vos règles.') + '</span>';
    }
    fontDemo();

    el.querySelector('.pz-grid').addEventListener('click', function (e) {
      var b = e.target.closest('.pz'); if (!b) return;
      var id = b.getAttribute('data-p');
      if (id === th.preset && !Object.keys(ov).length) return;
      th.preset = id; th.overrides = {};
      S.changed(); themePanel(el);
      U.toast('Préréglage « ' + T.PRESETS[id].name + ' » appliqué');
    });
    el.querySelector('#ovReset').addEventListener('click', function () { th.overrides = {}; S.changed(); themePanel(el); U.toast('Réinitialisé au préréglage'); });
    // couleurs
    el.querySelectorAll('.cc').forEach(function (cc) {
      var prop = cc.getAttribute('data-ctl'), pick = cc.querySelector('input[type=color]'), hex = cc.querySelector('.hex');
      pick.addEventListener('input', function () { hex.value = pick.value; setProp(prop, pick.value); });
      hex.addEventListener('change', function () {
        var v = hex.value.trim(); if (!/^#?[0-9a-f]{6}$/i.test(v) && !/^#?[0-9a-f]{3}$/i.test(v)) { hex.value = pick.value; return; }
        if (v[0] !== '#') v = '#' + v;
        if (v.length === 4) v = '#' + v[1] + v[1] + v[2] + v[2] + v[3] + v[3];
        pick.value = v.toLowerCase(); hex.value = v.toLowerCase(); setProp(prop, v.toLowerCase());
      });
    });
    el.querySelectorAll('select[data-font]').forEach(function (s) { s.addEventListener('change', function () { setProp(s.getAttribute('data-font'), s.value); }); });
    Object.keys(ENUMS).forEach(function (k) { S.onSeg(el, 'th-' + k, function (v) { setProp(k, v); }); });
    el.querySelectorAll('input[data-range]').forEach(function (r) {
      var k = r.getAttribute('data-range'), out = el.querySelector('[data-out="' + k + '"]');
      r.addEventListener('input', function () { out.textContent = RANGES[k].f(Number(r.value)); setProp(k, Number(r.value)); });
    });
    el.querySelectorAll('.ov-reset').forEach(function (b) {
      b.addEventListener('click', function () { var k = b.getAttribute('data-reset'); delete ov[k]; S.changed(); themePanel(el); });
    });
    Object.keys(ov).forEach(mark);
  }
  function grp(title, open, body) { return '<details class="grp"' + (open ? ' open' : '') + '><summary><span>' + esc(title) + '</span>' + S.ic('down', 14) + '</summary><div class="grp-b">' + body + '</div></details>'; }
  function ovBtn(prop) { return '<button type="button" class="ov-reset" data-reset="' + prop + '" title="Revenir à la valeur du préréglage" aria-label="Réinitialiser">' + S.ic('refresh', 12) + '</button>'; }
  function colorCtl(prop, label, val) {
    return '<div class="cc" data-ctl="' + prop + '"><input type="color" value="' + esc(val) + '" aria-label="' + esc(label) + '"><div class="cc-t"><label class="cc-l">' + esc(label) + '</label><input class="input input-sm hex" value="' + esc(val) + '" spellcheck="false" aria-label="' + esc(label) + ' (hex)"></div>' + ovBtn(prop) + '</div>';
  }
  function fontCtl(prop, label, val) {
    return '<div class="field" data-ctl="' + prop + '"><div class="field-top"><label for="f-' + prop + '">' + esc(label) + '</label>' + ovBtn(prop) + '</div><select class="select" id="f-' + prop + '" data-font="' + prop + '">' +
      T.FONTS.map(function (f) { return '<option' + (f === val ? ' selected' : '') + '>' + esc(f) + '</option>'; }).join('') + '</select></div>';
  }
  function enumCtl(prop, val) {
    var e = ENUMS[prop];
    return '<div class="ctl" data-ctl="' + prop + '"><div class="ctl-top"><span class="ctl-l">' + esc(e.l) + '</span>' + ovBtn(prop) + '</div>' + S.seg('th-' + prop, e.o.map(function (o) { return { v: o[0], l: o[1] }; }), val, 'seg-full') + '</div>';
  }
  function rangeCtl(prop, val) {
    var r = RANGES[prop];
    return '<div class="ctl" data-ctl="' + prop + '"><div class="ctl-top"><label class="ctl-l" for="r-' + prop + '">' + esc(r.l) + '</label><span class="ctl-v" data-out="' + prop + '">' + esc(r.f(Number(val))) + '</span>' + ovBtn(prop) + '</div><input type="range" id="r-' + prop + '" data-range="' + prop + '" min="' + r.min + '" max="' + r.max + '" step="' + r.step + '" value="' + esc(val) + '"></div>';
  }

  /* ---------------- Identité ---------------- */
  function identityPanel(el) {
    var c = S.c;
    el.innerHTML =
      '<div class="ub-sec"><h3 class="ub-h">Profil</h3><div class="fgrid mt">' +
        '<div class="field"><label for="id-name">Nom affiché</label><input class="input" id="id-name" data-k="name" maxlength="60"></div>' +
        '<div class="field"><label for="id-pseudo">Pseudo</label><input class="input" id="id-pseudo" data-k="pseudo" maxlength="40"></div>' +
        '<div class="field full"><label for="id-tag">Accroche</label><input class="input" id="id-tag" data-k="tagline" maxlength="80" placeholder="Mode · Voyages · Coulisses"></div>' +
        '<div class="field full"><div class="field-top"><label for="id-bio">Bio</label><span class="cnt" id="bioCnt"></span></div><textarea class="textarea" id="id-bio" data-k="bio" rows="4"></textarea><a class="hint link-btn" href="#/copilot/bio">✦ Générer une bio avec le copilote</a></div>' +
        '<div class="field"><label for="id-loc">Localisation</label><input class="input" id="id-loc" data-k="location"></div>' +
        '<div class="field"><label for="id-cat">Catégorie</label><select class="select" id="id-cat" data-k="category">' + D.CATEGORIES.map(function (x) { return '<option>' + esc(x) + '</option>'; }).join('') + '</select></div>' +
      '</div></div>' +
      '<div class="ub-sec"><h3 class="ub-h">Avatar</h3><div class="av-edit mt"><div id="avPrev"></div><div class="fgrid-3 grow">' +
        '<div class="field"><label for="av-i">Initiales</label><input class="input" id="av-i" data-k="avatar.initials" maxlength="3"></div>' +
        '<div class="field"><label for="av-a">Dégradé 1</label><input type="color" id="av-a" data-k="avatar.a"></div>' +
        '<div class="field"><label for="av-b">Dégradé 2</label><input type="color" id="av-b" data-k="avatar.b"></div>' +
      '</div></div></div>' +
      '<div class="ub-sec"><h3 class="ub-h">Couverture</h3><div class="cover-prev mt" id="coverPrev"></div><div class="fgrid-3 mt">' +
        '<div class="field"><label for="cv-a">Couleur 1</label><input type="color" id="cv-a" data-k="cover.a"></div>' +
        '<div class="field"><label for="cv-b">Couleur 2</label><input type="color" id="cv-b" data-k="cover.b"></div>' +
        '<div class="field"><label for="cv-p">Motif</label><select class="select" id="cv-p" data-k="cover.pattern">' + PATTERNS.map(function (p) { return '<option value="' + p[0] + '">' + p[1] + '</option>'; }).join('') + '</select></div>' +
      '</div><div class="pat-row mt">' + PATTERNS.map(function (p) { return '<button type="button" class="pat' + (c.cover.pattern === p[0] ? ' on' : '') + '" data-pat="' + p[0] + '" aria-label="Motif ' + p[1] + '" title="' + p[1] + '">' + U.art({ a: c.cover.a, b: c.cover.b, pattern: p[0] }) + '</button>'; }).join('') + '</div></div>';
    if (c.cover.img || c.coverImg) el.querySelector('#coverPrev').insertAdjacentHTML('afterend', '<p class="hint xs mute mt">Une photo de couverture est définie : les couleurs servent de repli.</p>');
    function paint() {
      el.querySelector('#avPrev').innerHTML = U.avatar(c, 72);
      el.querySelector('#coverPrev').innerHTML = U.art(c.cover);
    }
    paint();
    S.bind(el, c, function (k) {
      if (/^avatar|^cover/.test(k)) { paint(); if (/^cover\.(a|b)/.test(k)) el.querySelectorAll('.pat').forEach(function (b) { b.innerHTML = U.art({ a: c.cover.a, b: c.cover.b, pattern: b.getAttribute('data-pat') }); }); }
      if (k === 'cover.pattern') el.querySelectorAll('.pat').forEach(function (b) { b.classList.toggle('on', b.getAttribute('data-pat') === c.cover.pattern); });
      if (k === 'name' || k === 'avatar.initials') S.emit('account-refresh');
      S.changed();
    });
    S.counter(el.querySelector('#id-bio'), el.querySelector('#bioCnt'), 300);
    el.querySelector('.pat-row').addEventListener('click', function (e) {
      var b = e.target.closest('.pat'); if (!b) return;
      c.cover.pattern = b.getAttribute('data-pat'); el.querySelector('#cv-p').value = c.cover.pattern;
      el.querySelectorAll('.pat').forEach(function (x) { x.classList.toggle('on', x === b); });
      paint(); S.changed();
    });
  }

  /* ---------------- Sections ---------------- */
  function sectionsPanel(el) {
    var c = S.c;
    function names(id) { var s = D.SECTIONS.filter(function (x) { return x.id === id; })[0]; return s ? s.name : id; }
    function draw() {
      var hidden = D.SECTIONS.filter(function (s) { return c.sections.indexOf(s.id) < 0; });
      el.innerHTML = '<div class="ub-sec"><h3 class="ub-h">Sections de l’univers</h3><p class="ub-d">Glissez-déposez ou utilisez les flèches pour réordonner. L’œil masque une section.</p>' +
        '<ol class="sec-list mt" id="secList">' + c.sections.map(function (id, i) {
          return '<li class="sec-i" draggable="true" data-id="' + esc(id) + '"><span class="sec-grip" aria-hidden="true">' + S.ic('grip', 16) + '</span><span class="sec-n"><b>' + (i + 1) + '</b>' + esc(names(id)) + '</span>' +
            '<button type="button" class="icon-btn sm" data-act="up" aria-label="Monter ' + esc(names(id)) + '"' + (i === 0 ? ' disabled' : '') + '>' + S.ic('up', 15) + '</button>' +
            '<button type="button" class="icon-btn sm" data-act="down" aria-label="Descendre ' + esc(names(id)) + '"' + (i === c.sections.length - 1 ? ' disabled' : '') + '>' + S.ic('down', 15) + '</button>' +
            '<button type="button" class="icon-btn sm" data-act="hide" aria-label="Masquer ' + esc(names(id)) + '" title="Masquer">' + S.ic('eye', 16) + '</button></li>';
        }).join('') + '</ol>' +
        (c.sections.length ? '' : '<p class="dim small">Aucune section visible : votre univers n’affichera que l’en-tête.</p>') +
        (hidden.length ? '<h4 class="ub-h4 mt-l">Sections masquées</h4><ul class="sec-list hidden-list">' + hidden.map(function (s) {
          return '<li class="sec-i off" data-id="' + s.id + '"><span class="sec-n">' + esc(s.name) + '</span><button type="button" class="btn btn-ghost btn-xs" data-act="show">' + S.ic('eyeoff', 14) + 'Afficher</button></li>';
        }).join('') + '</ul>' : '') + '</div>';
    }
    draw();
    function move(from, to) {
      if (to < 0 || to >= c.sections.length || from === to) return;
      var x = c.sections.splice(from, 1)[0]; c.sections.splice(to, 0, x);
      S.changed(); draw();
    }
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var li = b.closest('.sec-i'), id = li.getAttribute('data-id'), i = c.sections.indexOf(id), act = b.getAttribute('data-act');
      if (act === 'up') { move(i, i - 1); focusBtn(id, 'up'); }
      else if (act === 'down') { move(i, i + 1); focusBtn(id, 'down'); }
      else if (act === 'hide') { c.sections.splice(i, 1); S.changed(); draw(); U.toast('Section masquée'); }
      else if (act === 'show') { c.sections.push(id); S.changed(); draw(); U.toast('Section affichée'); }
    });
    function focusBtn(id, act) { var b = el.querySelector('.sec-i[data-id="' + id + '"] [data-act="' + act + '"]'); if (b && !b.disabled) b.focus(); else { b = el.querySelector('.sec-i[data-id="' + id + '"] [data-act]'); if (b) b.focus(); } }
    // Glisser-déposer (desktop)
    var dragId = null;
    el.addEventListener('dragstart', function (e) { var li = e.target.closest('.sec-i[draggable]'); if (!li) return; dragId = li.getAttribute('data-id'); li.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; try { e.dataTransfer.setData('text/plain', dragId); } catch (err) { /* ignore */ } });
    el.addEventListener('dragend', function () { dragId = null; el.querySelectorAll('.sec-i').forEach(function (x) { x.classList.remove('dragging', 'drop-before', 'drop-after'); }); });
    el.addEventListener('dragover', function (e) {
      var li = e.target.closest('.sec-i[draggable]'); if (!li || !dragId) return;
      e.preventDefault();
      var r = li.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2;
      el.querySelectorAll('.sec-i').forEach(function (x) { x.classList.remove('drop-before', 'drop-after'); });
      li.classList.add(after ? 'drop-after' : 'drop-before');
    });
    el.addEventListener('drop', function (e) {
      var li = e.target.closest('.sec-i[draggable]'); if (!li || !dragId) return;
      e.preventDefault();
      var r = li.getBoundingClientRect(), after = e.clientY > r.top + r.height / 2;
      var from = c.sections.indexOf(dragId), target = c.sections.indexOf(li.getAttribute('data-id'));
      var to = target + (after ? 1 : 0); if (from < to) to--;
      move(from, to);
    });
  }

  /* ---------------- Liens ---------------- */
  function linksPanel(el) {
    var c = S.c;
    function draw(focusId) {
      el.innerHTML = '<div class="ub-sec"><div class="ub-sec-h"><div><h3 class="ub-h">Liens importants</h3><p class="ub-d">Chaque lien obtient un smart link : ' + esc(D.prettyUrl(c.handle, 'slug').replace(/^https?:\/\//, '')) + '</p></div>' +
        '<button type="button" class="btn btn-primary btn-sm" id="lkAdd">' + S.ic('plus', 15) + 'Ajouter</button></div>' +
        (c.links.length ? '<ul class="ed-list mt">' + c.links.map(function (l, i) {
          return '<li class="ed-i" data-i="' + i + '">' +
            '<div class="ed-top"><select class="select input-sm glyph" data-f="icon" aria-label="Icône">' + GLYPHS.concat(GLYPHS.indexOf(l.icon) < 0 && l.icon ? [l.icon] : []).map(function (g) { return '<option' + (g === l.icon ? ' selected' : '') + '>' + esc(g) + '</option>'; }).join('') + '</select>' +
            '<input class="input input-sm grow" data-f="label" value="' + esc(l.label) + '" placeholder="Intitulé" aria-label="Intitulé">' +
            '<span class="ed-clicks" title="Clics">' + S.num(l.clicks || 0) + ' clics</span></div>' +
            '<div class="ed-row"><input class="input input-sm grow" data-f="url" value="' + esc(l.url) + '" placeholder="https://… ou #section" aria-label="URL">' +
            '<div class="input-group slug"><span class="addon">/' + esc(c.handle) + '/</span><input class="input input-sm" data-f="slug" value="' + esc(l.slug || '') + '" aria-label="Slug"></div></div>' +
            '<div class="ed-act"><button type="button" class="icon-btn sm" data-act="up" aria-label="Monter"' + (i ? '' : ' disabled') + '>' + S.ic('up', 15) + '</button><button type="button" class="icon-btn sm" data-act="down" aria-label="Descendre"' + (i < c.links.length - 1 ? '' : ' disabled') + '>' + S.ic('down', 15) + '</button>' +
            '<button type="button" class="icon-btn sm" data-act="copy" aria-label="Copier le smart link">' + S.ic('copy', 15) + '</button><span class="spacer"></span><button type="button" class="icon-btn sm danger" data-act="del" aria-label="Supprimer">' + S.ic('trash', 15) + '</button></div></li>';
        }).join('') + '</ul>' : S.empty({ icon: 'link', title: 'Aucun lien', text: 'Ajoutez vos liens clés : boutique, dernière vidéo, cercle VIP…' })) + '</div>';
      if (focusId != null) { var f = el.querySelector('.ed-i[data-i="' + focusId + '"] [data-f="label"]'); if (f) { f.focus(); f.select(); } }
      el.querySelector('#lkAdd').addEventListener('click', function () {
        c.links.push({ id: S.uid('l'), label: 'Nouveau lien', url: 'https://', slug: 'lien-' + (c.links.length + 1), icon: '✦', clicks: 0 });
        S.changed(); draw(c.links.length - 1);
      });
    }
    draw();
    el.addEventListener('input', function (e) {
      var f = e.target.getAttribute('data-f'); if (!f) return;
      var i = +e.target.closest('.ed-i').getAttribute('data-i');
      var v = e.target.value;
      if (f === 'slug') { v = S.slugify(v) || ''; }
      c.links[i][f] = v; S.changed();
    });
    el.addEventListener('change', function (e) { if (e.target.getAttribute('data-f') === 'slug') e.target.value = c.links[+e.target.closest('.ed-i').getAttribute('data-i')].slug; });
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var i = +b.closest('.ed-i').getAttribute('data-i'), a = b.getAttribute('data-act'), l = c.links;
      if (a === 'up' && i > 0) { l.splice(i - 1, 0, l.splice(i, 1)[0]); S.changed(); draw(); }
      if (a === 'down' && i < l.length - 1) { l.splice(i + 1, 0, l.splice(i, 1)[0]); S.changed(); draw(); }
      if (a === 'copy') U.copy(S.absUrl(D.prettyUrl(c.handle, l[i].slug)), 'Smart link copié');
      if (a === 'del') S.confirm('Supprimer le lien « ' + l[i].label + ' » ?', { ok: 'Supprimer', danger: true }).then(function (ok) { if (ok) { l.splice(i, 1); S.changed(); draw(); } });
    });
  }

  /* ---------------- Réseaux ---------------- */
  function socialsPanel(el) {
    var c = S.c;
    function draw() {
      var total = c.socials.reduce(function (a, s) { return a + (Number(s.followers) || 0); }, 0);
      el.innerHTML = '<div class="ub-sec"><div class="ub-sec-h"><div><h3 class="ub-h">Réseaux sociaux</h3><p class="ub-d">Audience cumulée : <b>' + esc(S.num(total)) + '</b> — reprise dans le media kit.</p></div>' +
        '<button type="button" class="btn btn-primary btn-sm" id="soAdd">' + S.ic('plus', 15) + 'Ajouter</button></div>' +
        (c.socials.length ? '<ul class="ed-list mt">' + c.socials.map(function (s, i) {
          return '<li class="ed-i so" data-i="' + i + '"><div class="ed-top"><span class="so-ic">' + U.icon(s.net, 18) + '</span>' +
            '<select class="select input-sm" data-f="net" aria-label="Réseau">' + NETS.map(function (n) { return '<option value="' + n[0] + '"' + (n[0] === s.net ? ' selected' : '') + '>' + n[1] + '</option>'; }).join('') + '</select>' +
            '<input class="input input-sm so-f" type="number" min="0" data-f="followers" value="' + esc(s.followers || 0) + '" aria-label="Abonnés"><span class="xs mute">abonnés</span></div>' +
            '<div class="ed-row"><input class="input input-sm grow" data-f="url" value="' + esc(s.url) + '" placeholder="https://" aria-label="URL du profil"></div>' +
            '<div class="ed-act"><button type="button" class="icon-btn sm" data-act="up" aria-label="Monter"' + (i ? '' : ' disabled') + '>' + S.ic('up', 15) + '</button><button type="button" class="icon-btn sm" data-act="down" aria-label="Descendre"' + (i < c.socials.length - 1 ? '' : ' disabled') + '>' + S.ic('down', 15) + '</button><span class="spacer"></span><button type="button" class="icon-btn sm danger" data-act="del" aria-label="Supprimer">' + S.ic('trash', 15) + '</button></div></li>';
        }).join('') + '</ul>' : S.empty({ icon: 'globe', title: 'Aucun réseau', text: 'Reliez vos réseaux pour les afficher dans votre univers et votre media kit.' })) + '</div>';
      el.querySelector('#soAdd').addEventListener('click', function () {
        var used = c.socials.map(function (s) { return s.net; });
        var net = (NETS.filter(function (n) { return used.indexOf(n[0]) < 0; })[0] || NETS[0])[0];
        c.socials.push({ net: net, url: 'https://', followers: 0 }); S.changed(); draw();
      });
    }
    draw();
    el.addEventListener('input', function (e) {
      var f = e.target.getAttribute('data-f'); if (!f || f === 'net') return;
      var i = +e.target.closest('.ed-i').getAttribute('data-i');
      c.socials[i][f] = f === 'followers' ? Math.max(0, Number(e.target.value) || 0) : e.target.value;
      S.changed();
    });
    el.addEventListener('change', function (e) {
      if (e.target.getAttribute('data-f') !== 'net') return;
      var i = +e.target.closest('.ed-i').getAttribute('data-i'); c.socials[i].net = e.target.value; S.changed(); draw();
    });
    el.addEventListener('click', function (e) {
      var b = e.target.closest('[data-act]'); if (!b) return;
      var i = +b.closest('.ed-i').getAttribute('data-i'), a = b.getAttribute('data-act'), l = c.socials;
      if (a === 'up' && i > 0) { l.splice(i - 1, 0, l.splice(i, 1)[0]); S.changed(); draw(); }
      if (a === 'down' && i < l.length - 1) { l.splice(i + 1, 0, l.splice(i, 1)[0]); S.changed(); draw(); }
      if (a === 'del') { l.splice(i, 1); S.changed(); draw(); }
    });
  }

  S.register('universe', { title: 'Univers', group: 'Création', icon: 'universe', render: render });
})(window);
