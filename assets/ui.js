/* =====================================================================
   SECR3TLY — Utilitaires d'interface partagés
   - SecretlyUI.art(art)      : visuel génératif SVG (remplace les photos de démo)
   - SecretlyUI.avatar(c)     : avatar (image ou initiales en dégradé)
   - SecretlyUI.icon(net)     : icônes des réseaux sociaux
   - SecretlyUI.toast(msg)    : notification éphémère
   - SecretlyUI.reveal()      : apparition au scroll des éléments .reveal
   - SecretlyUI.qr(text)      : QR code SVG (smart links)
   ===================================================================== */
(function (root) {
  'use strict';
  var uid = 0;

  function art(a, opts) {
    a = a || { a: '#e8b4bc', b: '#9c7fa6', pattern: 'orb' };
    opts = opts || {};
    var id = 'g' + (++uid);
    var A = a.a, B = a.b, p = a.pattern;
    var defs = '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + A + '"/><stop offset="1" stop-color="' + B + '"/></linearGradient>' +
      '<radialGradient id="' + id + 'r" cx=".3" cy=".25" r=".8"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
      '<filter id="' + id + 'b"><feGaussianBlur stdDeviation="18"/></filter></defs>';
    var body = '<rect width="400" height="400" fill="url(#' + id + ')"/>';
    switch (p) {
      case 'silk':
        for (var i = 0; i < 7; i++) body += '<path d="M-20 ' + (60 + i * 45) + ' C 120 ' + (10 + i * 50) + ', 260 ' + (140 + i * 40) + ', 420 ' + (70 + i * 46) + '" stroke="#fff" stroke-opacity="' + (0.06 + i * 0.025) + '" stroke-width="' + (22 - i * 2) + '" fill="none"/>';
        break;
      case 'wave':
        for (var w = 0; w < 9; w++) body += '<path d="M0 ' + (40 + w * 42) + ' Q 100 ' + (10 + w * 42) + ' 200 ' + (40 + w * 42) + ' T 400 ' + (40 + w * 42) + '" stroke="#fff" stroke-opacity=".14" stroke-width="1.5" fill="none"/>';
        break;
      case 'grid':
        for (var g = 1; g < 10; g++) body += '<path d="M' + g * 40 + ' 0V400M0 ' + g * 40 + 'H400" stroke="#fff" stroke-opacity=".08"/>';
        body += '<circle cx="280" cy="130" r="70" fill="#fff" fill-opacity=".12"/>';
        break;
      case 'lines':
        for (var l = 0; l < 14; l++) body += '<path d="M' + (l * 34 - 60) + ' 400 L' + (l * 34 + 80) + ' 0" stroke="#fff" stroke-opacity=".09" stroke-width="10"/>';
        break;
      case 'sun':
        body += '<circle cx="200" cy="230" r="110" fill="#fff" fill-opacity=".22"/><circle cx="200" cy="230" r="70" fill="#fff" fill-opacity=".22"/><rect y="300" width="400" height="100" fill="' + B + '" fill-opacity=".55"/>';
        break;
      case 'veil':
        body += '<g filter="url(#' + id + 'b)"><ellipse cx="140" cy="160" rx="120" ry="90" fill="' + A + '"/><ellipse cx="270" cy="260" rx="130" ry="100" fill="#fff" fill-opacity=".18"/></g>';
        break;
      default: // orb
        body += '<g filter="url(#' + id + 'b)"><circle cx="130" cy="120" r="110" fill="#fff" fill-opacity=".25"/><circle cx="300" cy="300" r="120" fill="' + B + '"/></g>';
    }
    body += '<rect width="400" height="400" fill="url(#' + id + 'r)" opacity=".5"/>';
    return '<svg class="art" viewBox="0 0 400 400" preserveAspectRatio="xMidYMid slice" role="img" aria-label="' + (opts.label || '') + '" xmlns="http://www.w3.org/2000/svg">' + defs + body + '</svg>';
  }

  function avatar(c, size) {
    var av = (c && c.avatar) || {};
    size = size || 48;
    var st = 'width:' + size + 'px;height:' + size + 'px;';
    if (av.img) return '<span class="avatar" style="' + st + 'background:linear-gradient(135deg,' + av.a + ',' + av.b + ')"><img src="' + av.img + '" alt="" loading="lazy" onerror="this.remove()"></span>';
    return '<span class="avatar" style="' + st + 'background:linear-gradient(135deg,' + (av.a || '#e8b4bc') + ',' + (av.b || '#9c7fa6') + ');font-size:' + Math.round(size * 0.36) + 'px">' + (av.initials || '?') + '</span>';
  }

  var ICONS = {
    instagram: '<path d="M12 2.2c3.2 0 3.6 0 4.8.1 1.2.1 1.8.2 2.2.4.6.2 1 .5 1.4.9.4.4.7.8.9 1.4.2.4.4 1 .4 2.2.1 1.3.1 1.6.1 4.8s0 3.6-.1 4.8c-.1 1.2-.2 1.8-.4 2.2-.2.6-.5 1-.9 1.4-.4.4-.8.7-1.4.9-.4.2-1 .4-2.2.4-1.3.1-1.6.1-4.8.1s-3.6 0-4.8-.1c-1.2-.1-1.8-.2-2.2-.4-.6-.2-1-.5-1.4-.9-.4-.4-.7-.8-.9-1.4-.2-.4-.4-1-.4-2.2C2.2 15.6 2.2 15.2 2.2 12s0-3.6.1-4.8c.1-1.2.2-1.8.4-2.2.2-.6.5-1 .9-1.4.4-.4.8-.7 1.4-.9.4-.2 1-.4 2.2-.4C8.4 2.2 8.8 2.2 12 2.2zm0 4.7a5.1 5.1 0 1 0 0 10.2 5.1 5.1 0 0 0 0-10.2zm0 8.4a3.3 3.3 0 1 1 0-6.6 3.3 3.3 0 0 1 0 6.6zm5.3-9.8a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4z"/>',
    tiktok: '<path d="M16.6 5.8A4.3 4.3 0 0 1 15.5 3h-3.1v12.4a2.6 2.6 0 1 1-2.6-2.6c.3 0 .5 0 .8.1V9.7a5.7 5.7 0 1 0 4.9 5.7V9.1a7.3 7.3 0 0 0 4.3 1.4V7.4s-1.9.1-3.2-1.6z"/>',
    youtube: '<path d="M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15V9l5.8 3-5.8 3z"/>',
    x: '<path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.46l8.6-9.83L0 1.15h7.6l5.24 6.93zM17.6 20.65h2.04L6.49 3.24H4.3z"/>',
    snapchat: '<path d="M12 2c3 0 5.3 2.3 5.3 5.4v2.3c.4.2.9.1 1.3-.1.6-.2 1.1.4.8.9-.4.6-1.5.9-2 1.2.4 1.5 1.9 3.3 3.9 3.8.4.1.4.6.1.8-.6.4-1.6.6-2.3.7-.2.4-.1 1-.6 1.1-.6.1-1.4-.2-2.3 0-1.1.3-2 1.9-4.2 1.9s-3.1-1.6-4.2-1.9c-.9-.2-1.7.1-2.3 0-.5-.1-.4-.7-.6-1.1-.7-.1-1.7-.3-2.3-.7-.3-.2-.3-.7.1-.8 2-.5 3.5-2.3 3.9-3.8-.5-.3-1.6-.6-2-1.2-.3-.5.2-1.1.8-.9.4.2.9.3 1.3.1V7.4C6.7 4.3 9 2 12 2z"/>',
    facebook: '<path d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.2 2.7.2v3h-1.5c-1.5 0-2 .9-2 1.9V12h3.4l-.5 3.5h-2.9v8.4A12 12 0 0 0 24 12z"/>',
    twitch: '<path d="M2.1 0L.5 4.2v17.1h5.7V24h3.2l3-2.7h4.7l6.3-6.2V0H2.1zm19.1 14l-3.6 3.5H12l-3 2.8v-2.8H4.3V2.1h16.9V14zM17.6 5.9v6.1h-2.1V5.9h2.1zm-5.7 0v6.1H9.8V5.9h2.1z"/>',
    pinterest: '<path d="M12 0a12 12 0 0 0-4.4 23.2c-.1-.9-.2-2.4 0-3.4l1.4-6s-.4-.7-.4-1.8c0-1.7 1-2.9 2.2-2.9 1 0 1.5.8 1.5 1.7 0 1-.7 2.6-1 4-.3 1.2.6 2.2 1.8 2.2 2.1 0 3.8-2.2 3.8-5.5 0-2.9-2.1-4.9-5-4.9-3.4 0-5.4 2.6-5.4 5.2 0 1 .4 2.1.9 2.7.1.1.1.2.1.3l-.3 1.4c-.1.2-.2.3-.4.2-1.5-.7-2.4-2.9-2.4-4.6 0-3.8 2.7-7.2 7.9-7.2 4.1 0 7.4 3 7.4 6.9 0 4.1-2.6 7.5-6.2 7.5-1.2 0-2.4-.6-2.8-1.4l-.7 2.9c-.3 1-1 2.4-1.5 3.2A12 12 0 1 0 12 0z"/>',
    telegram: '<path d="M23.9 3.6l-3.6 17c-.3 1.2-1 1.5-2 .9l-5.5-4-2.6 2.5c-.3.3-.5.5-1.1.5l.4-5.6L19.7 5.8c.4-.4-.1-.6-.7-.2L6.4 13.4.9 11.7c-1.2-.4-1.2-1.2.3-1.7L22.4 1.8c1-.4 1.9.2 1.5 1.8z"/>',
    web: '<path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm7.9 7h-3.3a18 18 0 0 0-1.5-4.4A10 10 0 0 1 19.9 7zM12 2c.9 1.2 1.7 3 2.2 5H9.8c.5-2 1.3-3.8 2.2-5zM2.3 14a10 10 0 0 1 0-4h3.8a20 20 0 0 0 0 4H2.3zm.8 3h3.3c.4 1.6.9 3.1 1.5 4.4A10 10 0 0 1 3.1 17zm3.3-10H3.1a10 10 0 0 1 4.8-4.4C7.3 3.9 6.8 5.4 6.4 7zM12 22c-.9-1.2-1.7-3-2.2-5h4.4c-.5 2-1.3 3.8-2.2 5zm2.5-7H9.5a18 18 0 0 1 0-6h5a18 18 0 0 1 0 6zm.6 6.4c.6-1.3 1.1-2.8 1.5-4.4h3.3a10 10 0 0 1-4.8 4.4zm2.8-6.4a20 20 0 0 0 0-4h3.8a10 10 0 0 1 0 4h-3.8z"/>'
  };
  function icon(net, size) {
    size = size || 20;
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="currentColor" aria-hidden="true">' + (ICONS[net] || ICONS.web) + '</svg>';
  }

  var tEl, tTimer;
  function toast(msg) {
    if (!tEl) { tEl = document.createElement('div'); tEl.className = 'toast'; tEl.setAttribute('role', 'status'); tEl.setAttribute('aria-live', 'polite'); document.body.appendChild(tEl); }
    tEl.textContent = msg; tEl.classList.add('show');
    clearTimeout(tTimer); tTimer = setTimeout(function () { tEl.classList.remove('show'); }, 2600);
  }

  function reveal(scope) {
    var els = (scope || document).querySelectorAll('.reveal:not(.in)');
    if (!('IntersectionObserver' in window)) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (e) { io.observe(e); });
  }

  function copy(text, msg) {
    function done() { toast(msg || 'Copié'); }
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(done, fallback); else fallback();
    function fallback() { var t = document.createElement('textarea'); t.value = text; t.style.position = 'fixed'; t.style.opacity = '0'; document.body.appendChild(t); t.select(); try { document.execCommand('copy'); } catch (e) { /* ignore */ } t.remove(); done(); }
  }

  /* ---------- QR code (encodeur minimal, octets, niveau M, versions 1-10) ----------
     Suffisant pour des smart links courts. */
  var QR = (function () {
    var EXP = new Array(512), LOG = new Array(256);
    (function () { var x = 1; for (var i = 0; i < 255; i++) { EXP[i] = x; LOG[x] = i; x <<= 1; if (x & 256) x ^= 0x11d; } for (var j = 255; j < 512; j++) EXP[j] = EXP[j - 255]; })();
    function mul(a, b) { return a && b ? EXP[LOG[a] + LOG[b]] : 0; }
    function rsGen(n) { var g = [1]; for (var i = 0; i < n; i++) { var ng = new Array(g.length + 1).fill(0); for (var j = 0; j < g.length; j++) { ng[j] ^= g[j]; ng[j + 1] ^= mul(g[j], EXP[i]); } g = ng; } return g; }
    function rs(data, n) { var g = rsGen(n), res = data.concat(new Array(n).fill(0)); for (var i = 0; i < data.length; i++) { var c = res[i]; if (c) for (var j = 0; j < g.length; j++) res[i + j] ^= mul(g[j], c); } return res.slice(data.length); }
    // Niveau M : [total codewords, ec par bloc, blocs groupe1, data g1, blocs g2, data g2]
    var TAB = [null, [26, 10, 1, 16, 0, 0], [44, 16, 1, 28, 0, 0], [70, 26, 1, 44, 0, 0], [100, 18, 2, 32, 0, 0], [134, 24, 2, 43, 0, 0], [172, 16, 4, 27, 0, 0], [196, 18, 4, 31, 0, 0], [242, 22, 2, 38, 2, 39], [292, 22, 3, 36, 2, 37], [346, 26, 4, 43, 1, 44]];
    var ALIGN = [null, [], [6, 18], [6, 22], [6, 26], [6, 30], [6, 34], [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50]];
    function encode(text) {
      var bytes = unescape(encodeURIComponent(text)).split('').map(function (c) { return c.charCodeAt(0); });
      var v = 1; for (; v <= 10; v++) { var t = TAB[v]; var cap = t[2] * t[3] + t[4] * t[5]; if (bytes.length + (v < 10 ? 2 : 3) <= cap) break; }
      if (v > 10) return null;
      var T = TAB[v], dataCap = T[2] * T[3] + T[4] * T[5];
      var bits = []; function put(val, len) { for (var i = len - 1; i >= 0; i--) bits.push((val >> i) & 1); }
      put(4, 4); put(bytes.length, v < 10 ? 8 : 16); bytes.forEach(function (b) { put(b, 8); });
      put(0, Math.min(4, dataCap * 8 - bits.length)); while (bits.length % 8) bits.push(0);
      var data = []; for (var i = 0; i < bits.length; i += 8) data.push(parseInt(bits.slice(i, i + 8).join(''), 2));
      for (var pad = 0; data.length < dataCap; pad++) data.push(pad % 2 ? 0x11 : 0xec);
      var blocks = [], ecs = [], k = 0;
      for (var g = 0; g < 2; g++) for (var b = 0; b < T[2 + g * 2]; b++) { var blk = data.slice(k, k + T[3 + g * 2]); k += T[3 + g * 2]; blocks.push(blk); ecs.push(rs(blk, T[1])); }
      var final = [], maxD = Math.max(T[3], T[5]);
      for (var c = 0; c < maxD; c++) blocks.forEach(function (bl) { if (c < bl.length) final.push(bl[c]); });
      for (var e = 0; e < T[1]; e++) ecs.forEach(function (ec) { final.push(ec[e]); });
      var size = v * 4 + 17, M = [], R = [];
      for (var y = 0; y < size; y++) { M.push(new Array(size).fill(0)); R.push(new Array(size).fill(false)); }
      function set(x, y, val) { M[y][x] = val ? 1 : 0; R[y][x] = true; }
      function finder(x, y) { for (var dy = -1; dy <= 7; dy++) for (var dx = -1; dx <= 7; dx++) { var xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= size || yy >= size) continue; var on = dx >= 0 && dx <= 6 && dy >= 0 && dy <= 6 && (dx === 0 || dx === 6 || dy === 0 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4)); set(xx, yy, on); } }
      finder(0, 0); finder(size - 7, 0); finder(0, size - 7);
      for (var s = 8; s < size - 8; s++) { set(s, 6, s % 2 === 0); set(6, s, s % 2 === 0); }
      var al = ALIGN[v]; var alast = al[al.length - 1]; al.forEach(function (ay) { al.forEach(function (ax) { if ((ax === 6 && ay === 6) || (ax === 6 && ay === alast) || (ax === alast && ay === 6)) return; for (var dy = -2; dy <= 2; dy++) for (var dx = -2; dx <= 2; dx++) set(ax + dx, ay + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1); }); });
      set(8, size - 8, 1);
      for (var f = 0; f < 9; f++) { R[8][f] = R[f][8] = true; } for (var f2 = 0; f2 < 8; f2++) { R[8][size - 1 - f2] = R[size - 1 - f2][8] = true; }
      if (v >= 7) for (var vi = 0; vi < 6; vi++) for (var vj = 0; vj < 3; vj++) { R[vi][size - 11 + vj] = R[size - 11 + vj][vi] = true; }
      var bitArr = []; final.forEach(function (byte) { for (var i = 7; i >= 0; i--) bitArr.push((byte >> i) & 1); });
      var idx = 0;
      for (var col = size - 1; col > 0; col -= 2) { if (col === 6) col--; for (var r = 0; r < size; r++) { var yy = ((col + 1) & 2) === 0 ? size - 1 - r : r; for (var cc = 0; cc < 2; cc++) { var xx = col - cc; if (R[yy][xx]) continue; var bit = idx < bitArr.length ? bitArr[idx++] : 0; if ((xx + yy) % 2 === 0) bit ^= 1; M[yy][xx] = bit; } } }
      // Format (niveau M = 00, masque 0)
      var fmt = (0 << 3) | 0, rem = fmt; for (var fi = 0; fi < 10; fi++) rem = (rem << 1) ^ ((rem >> 9) * 0x537); var fbits = ((fmt << 10) | rem) ^ 0x5412;
      function fbit(i) { return (fbits >> i) & 1; }
      for (var fa = 0; fa <= 5; fa++) M[fa][8] = fbit(fa);
      M[7][8] = fbit(6); M[8][8] = fbit(7); M[8][7] = fbit(8);
      for (var fc = 9; fc < 15; fc++) M[8][14 - fc] = fbit(fc);
      for (var fd = 0; fd < 8; fd++) M[8][size - 1 - fd] = fbit(fd);
      for (var fe = 8; fe < 15; fe++) M[size - 15 + fe][8] = fbit(fe);
      if (v >= 7) { var vr = v; for (var q = 0; q < 12; q++) vr = (vr << 1) ^ ((vr >> 11) * 0x1f25); var vb = (v << 12) | vr; for (var vk = 0; vk < 18; vk++) { var bv = (vb >> vk) & 1; M[Math.floor(vk / 3)][size - 11 + vk % 3] = bv; M[size - 11 + vk % 3][Math.floor(vk / 3)] = bv; } }
      return M;
    }
    return { encode: encode };
  })();

  function qr(text, opts) {
    opts = opts || {};
    var M = QR.encode(text); if (!M) return '';
    var n = M.length, q = 4, sz = n + q * 2, d = '';
    for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) if (M[y][x]) d += 'M' + (x + q) + ' ' + (y + q) + 'h1v1h-1z';
    return '<svg class="qr" viewBox="0 0 ' + sz + ' ' + sz + '" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="QR code"><rect width="' + sz + '" height="' + sz + '" fill="' + (opts.bg || '#fff') + '"/><path d="' + d + '" fill="' + (opts.fg || '#0b0909') + '"/></svg>';
  }

  root.SecretlyUI = { art: art, avatar: avatar, icon: icon, toast: toast, reveal: reveal, copy: copy, qr: qr };
})(window);
