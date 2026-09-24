/* =====================================================================
   SECR3TLY — Moteur de thèmes des univers créateurs
   Un thème = un préréglage + des surcharges individuelles (overrides).
   Toute propriété peut être personnalisée séparément.
   ===================================================================== */
(function (root) {
  'use strict';

  // Polices proposées au créateur (toutes Google Fonts)
  var FONTS = {
    'Cormorant Garamond': 'Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400',
    'Playfair Display': 'Playfair+Display:ital,wght@0,400;0,600;0,800;1,400',
    'Bodoni Moda': 'Bodoni+Moda:ital,opsz,wght@0,6..96,400;0,6..96,600;1,6..96,400',
    'DM Serif Display': 'DM+Serif+Display:ital@0;1',
    'Italiana': 'Italiana',
    'Syne': 'Syne:wght@500;700;800',
    'Space Grotesk': 'Space+Grotesk:wght@400;500;700',
    'Unbounded': 'Unbounded:wght@400;600;800',
    'Manrope': 'Manrope:wght@400;500;600;700;800',
    'Inter': 'Inter:wght@400;500;600;700',
    'DM Sans': 'DM+Sans:wght@400;500;700',
    'Outfit': 'Outfit:wght@300;400;600;800',
    'Fraunces': 'Fraunces:ital,wght@0,400;0,600;1,400',
    'Caveat': 'Caveat:wght@500;700'
  };

  /* Propriétés d'un thème
     mode        : 'dark' | 'light'
     bg          : fond de page          surface : fond des cartes
     ink         : texte                 muted   : texte secondaire
     accent      : couleur principale    accent2 : 2e couleur (dégradés)
     display     : police des titres     body    : police du texte
     radius      : arrondi des cartes (px)
     button      : 'pill' | 'soft' | 'square'
     card        : 'glass' | 'solid' | 'outline' | 'flat'
     background  : 'aura' | 'plain' | 'mesh' | 'grain' | 'lines'
     shadow      : 0 → 1 (intensité des ombres)
     transparency: 0 → 1 (transparence des cartes)
     border      : épaisseur des bordures (px)
     animation   : 'none' | 'subtle' | 'rich'
     titleCase   : 'none' | 'upper' */
  var PRESETS = {
    minimal:   { name: 'Minimal',   mode: 'light', bg: '#f7f5f2', surface: '#ffffff', ink: '#141414', muted: '#6b6b6b', accent: '#141414', accent2: '#8a8a8a', display: 'Inter', body: 'Inter', radius: 14, button: 'soft', card: 'outline', background: 'plain', shadow: 0.1, transparency: 0, border: 1, animation: 'subtle', titleCase: 'none' },
    luxury:    { name: 'Luxury',    mode: 'dark',  bg: '#0b0909', surface: '#16110f', ink: '#f3ece6', muted: '#a99c90', accent: '#d9c3a0', accent2: '#8c6f4a', display: 'Cormorant Garamond', body: 'Manrope', radius: 4, button: 'square', card: 'outline', background: 'grain', shadow: 0.5, transparency: 0.2, border: 1, animation: 'subtle', titleCase: 'upper' },
    fashion:   { name: 'Fashion',   mode: 'light', bg: '#efe9e3', surface: '#faf7f3', ink: '#111111', muted: '#6d645c', accent: '#111111', accent2: '#b08d6a', display: 'Bodoni Moda', body: 'DM Sans', radius: 0, button: 'square', card: 'flat', background: 'plain', shadow: 0, transparency: 0, border: 1, animation: 'subtle', titleCase: 'upper' },
    beauty:    { name: 'Beauty',    mode: 'light', bg: '#fbf1ef', surface: '#ffffff', ink: '#3b2427', muted: '#9a7b7f', accent: '#d98a9a', accent2: '#e8c1a6', display: 'Playfair Display', body: 'DM Sans', radius: 26, button: 'pill', card: 'solid', background: 'mesh', shadow: 0.25, transparency: 0, border: 0, animation: 'rich', titleCase: 'none' },
    editorial: { name: 'Editorial', mode: 'light', bg: '#f4f1ea', surface: '#f4f1ea', ink: '#1b1a17', muted: '#6f6a5f', accent: '#b0412e', accent2: '#1b1a17', display: 'Fraunces', body: 'Inter', radius: 2, button: 'square', card: 'flat', background: 'lines', shadow: 0, transparency: 0, border: 1, animation: 'subtle', titleCase: 'none' },
    creator:   { name: 'Creator',   mode: 'dark',  bg: '#0e0c12', surface: '#1a1621', ink: '#f5f1fa', muted: '#a49cb3', accent: '#c58cf0', accent2: '#f0a58c', display: 'Syne', body: 'Manrope', radius: 22, button: 'pill', card: 'glass', background: 'aura', shadow: 0.5, transparency: 0.35, border: 1, animation: 'rich', titleCase: 'none' },
    social:    { name: 'Social',    mode: 'light', bg: '#f3f4f8', surface: '#ffffff', ink: '#12131a', muted: '#6a6f82', accent: '#e8537a', accent2: '#ffb36b', display: 'Outfit', body: 'Outfit', radius: 20, button: 'pill', card: 'solid', background: 'mesh', shadow: 0.3, transparency: 0, border: 0, animation: 'rich', titleCase: 'none' },
    dark:      { name: 'Dark',      mode: 'dark',  bg: '#050505', surface: '#111111', ink: '#f2f2f2', muted: '#8a8a8a', accent: '#f2f2f2', accent2: '#555555', display: 'Space Grotesk', body: 'Inter', radius: 12, button: 'soft', card: 'outline', background: 'plain', shadow: 0.2, transparency: 0, border: 1, animation: 'subtle', titleCase: 'none' },
    premium:   { name: 'Premium',   mode: 'dark',  bg: '#0b0909', surface: '#1c1618', ink: '#f3ece6', muted: '#b9aea8', accent: '#d4467e', accent2: '#e8b4bc', display: 'Cormorant Garamond', body: 'Manrope', radius: 22, button: 'pill', card: 'glass', background: 'aura', shadow: 0.6, transparency: 0.35, border: 1, animation: 'rich', titleCase: 'none' },
    gaming:    { name: 'Gaming',    mode: 'dark',  bg: '#07080d', surface: '#11131d', ink: '#eef1ff', muted: '#8b90ad', accent: '#7c8cff', accent2: '#3fd6c5', display: 'Unbounded', body: 'Space Grotesk', radius: 10, button: 'soft', card: 'glass', background: 'lines', shadow: 0.5, transparency: 0.3, border: 1, animation: 'rich', titleCase: 'upper' },
    artistic:  { name: 'Artistic',  mode: 'light', bg: '#f1ece2', surface: '#fbf8f2', ink: '#221e1a', muted: '#7a7063', accent: '#d2643c', accent2: '#3c6e8f', display: 'DM Serif Display', body: 'DM Sans', radius: 30, button: 'pill', card: 'solid', background: 'mesh', shadow: 0.2, transparency: 0, border: 0, animation: 'rich', titleCase: 'none' },
    lifestyle: { name: 'Lifestyle', mode: 'light', bg: '#f5efe6', surface: '#fffaf3', ink: '#2c2620', muted: '#857a6d', accent: '#9a7b56', accent2: '#c9a27a', display: 'Fraunces', body: 'Manrope', radius: 18, button: 'pill', card: 'solid', background: 'grain', shadow: 0.2, transparency: 0, border: 0, animation: 'subtle', titleCase: 'none' },
    elegant:   { name: 'Elegant',   mode: 'dark',  bg: '#12100f', surface: '#1b1816', ink: '#efe7dd', muted: '#a39788', accent: '#c0707f', accent2: '#9c7fa6', display: 'Italiana', body: 'Manrope', radius: 8, button: 'square', card: 'outline', background: 'grain', shadow: 0.35, transparency: 0.1, border: 1, animation: 'subtle', titleCase: 'upper' },
    exclusive: { name: 'Exclusive', mode: 'dark',  bg: '#090709', surface: '#171216', ink: '#f6eef1', muted: '#b3a1a9', accent: '#e8b4bc', accent2: '#9c7fa6', display: 'Playfair Display', body: 'Manrope', radius: 20, button: 'pill', card: 'glass', background: 'aura', shadow: 0.7, transparency: 0.45, border: 1, animation: 'rich', titleCase: 'none' }
  };

  function hexToRgb(hex) {
    var h = String(hex || '#000').replace('#', '');
    if (h.length === 3) h = h.split('').map(function (c) { return c + c; }).join('');
    var n = parseInt(h, 16) || 0;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function rgba(hex, a) { var c = hexToRgb(hex); return 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + a + ')'; }
  // Texte lisible sur une couleur (noir ou blanc)
  function onColor(hex) {
    var c = hexToRgb(hex);
    var l = (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
    return l > 0.6 ? '#141014' : '#ffffff';
  }

  /** Fusionne préréglage + surcharges (le créateur peut tout changer) */
  function resolve(themeCfg) {
    themeCfg = themeCfg || {};
    var base = PRESETS[themeCfg.preset] || PRESETS.premium;
    var t = {};
    for (var k in base) t[k] = base[k];
    var o = themeCfg.overrides || {};
    for (var j in o) if (o[j] !== '' && o[j] != null) t[j] = o[j];
    t.preset = themeCfg.preset || 'premium';
    return t;
  }

  /** Variables CSS d'un thème résolu */
  function cssVars(t) {
    var btnR = t.button === 'pill' ? '999px' : t.button === 'square' ? '2px' : '12px';
    var surfaceAlpha = 1 - (Number(t.transparency) || 0) * 0.85;
    var cardBg = t.card === 'glass' ? rgba(t.surface, Math.min(surfaceAlpha, 0.7))
      : t.card === 'outline' ? rgba(t.surface, surfaceAlpha * 0.5)
      : t.card === 'flat' ? 'transparent' : rgba(t.surface, surfaceAlpha);
    var sh = Number(t.shadow) || 0;
    return {
      '--t-bg': t.bg,
      '--t-surface': t.surface,
      '--t-card': cardBg,
      '--t-ink': t.ink,
      '--t-muted': t.muted,
      '--t-accent': t.accent,
      '--t-accent2': t.accent2,
      '--t-on-accent': onColor(t.accent),
      '--t-accent-soft': rgba(t.accent, 0.14),
      '--t-line': rgba(t.ink, t.mode === 'dark' ? 0.12 : 0.1),
      '--t-line-strong': rgba(t.ink, 0.22),
      '--t-radius': (Number(t.radius) || 0) + 'px',
      '--t-btn-radius': btnR,
      '--t-border': (t.card === 'flat' ? 0 : (Number(t.border) || 0)) + 'px',
      '--t-shadow': sh ? '0 ' + Math.round(10 + 30 * sh) + 'px ' + Math.round(30 + 50 * sh) + 'px -20px rgba(0,0,0,' + (0.25 + 0.5 * sh).toFixed(2) + ')' : 'none',
      '--t-blur': t.card === 'glass' ? '18px' : '0px',
      '--t-font-display': "'" + t.display + "', Georgia, serif",
      '--t-font-body': "'" + t.body + "', system-ui, sans-serif",
      '--t-title-transform': t.titleCase === 'upper' ? 'uppercase' : 'none',
      '--t-title-spacing': t.titleCase === 'upper' ? '.08em' : '-.01em',
      '--t-gradient': 'linear-gradient(135deg,' + t.accent + ',' + t.accent2 + ')'
    };
  }

  /** Fond d'ambiance CSS selon le style choisi */
  function backgroundCss(t) {
    switch (t.background) {
      case 'aura': return 'radial-gradient(60% 45% at 50% -5%,' + rgba(t.accent, 0.22) + ',transparent 70%),radial-gradient(45% 40% at 100% 20%,' + rgba(t.accent2, 0.14) + ',transparent 70%),' + t.bg;
      case 'mesh': return 'radial-gradient(40% 35% at 15% 10%,' + rgba(t.accent, 0.18) + ',transparent 70%),radial-gradient(40% 40% at 90% 30%,' + rgba(t.accent2, 0.18) + ',transparent 70%),radial-gradient(50% 40% at 50% 100%,' + rgba(t.accent, 0.1) + ',transparent 70%),' + t.bg;
      case 'lines': return 'repeating-linear-gradient(90deg,' + rgba(t.ink, 0.035) + ' 0 1px,transparent 1px 80px),' + t.bg;
      case 'grain':
      case 'plain':
      default: return t.bg;
    }
  }

  /** Applique un thème à un élément (par défaut <html>) + charge les polices */
  function apply(themeCfg, el) {
    var t = resolve(themeCfg);
    el = el || document.documentElement;
    var vars = cssVars(t);
    for (var k in vars) el.style.setProperty(k, vars[k]);
    el.style.setProperty('--t-background', backgroundCss(t));
    el.setAttribute('data-mode', t.mode);
    el.setAttribute('data-anim', t.animation);
    el.setAttribute('data-bg', t.background);
    loadFonts([t.display, t.body]);
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', t.bg);
    return t;
  }

  var loaded = {};
  function loadFonts(list) {
    var fams = list.filter(function (f) { return FONTS[f] && !loaded[f]; });
    if (!fams.length) return;
    fams.forEach(function (f) { loaded[f] = true; });
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?' + fams.map(function (f) { return 'family=' + FONTS[f]; }).join('&') + '&display=swap';
    document.head.appendChild(link);
  }

  root.SecretlyThemes = {
    PRESETS: PRESETS, FONTS: Object.keys(FONTS),
    resolve: resolve, cssVars: cssVars, backgroundCss: backgroundCss, apply: apply,
    loadFonts: loadFonts, rgba: rgba, onColor: onColor
  };
})(window);
