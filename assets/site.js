/* =====================================================================
   SECR3TLY — Pages vitrine : navigation + pied de page partagés.
   Injecte le menu et le footer dans <header data-nav> / <footer data-foot>
   (chemins relatifs à la racine du site, déduite de Secretly.BASE).
   ===================================================================== */
(function () {
  'use strict';
  var B = (window.Secretly && Secretly.BASE) || './';
  var page = document.body.getAttribute('data-page') || '';
  var home = page === 'home' ? '' : B;

  var links = [
    ['Univers', home + '#univers'],
    ['Fonctionnalités', home + '#fonctionnalites'],
    ['Tarifs', home + '#tarifs'],
    ['Explorer', B + 'explore.html', page === 'explore'],
    ['Studio', B + 'studio/']
  ];

  var nav = document.querySelector('[data-nav]');
  if (nav) {
    nav.className = 'nav';
    nav.innerHTML =
      '<div class="container nav-in">' +
        '<a class="nav-brand" href="' + B + '" aria-label="SECR3TLY — accueil"><img src="' + B + 'assets/wordmark.webp" alt="SECR3TLY" width="900" height="147"></a>' +
        '<nav class="nav-links" aria-label="Navigation principale">' +
          links.map(function (l) { return '<a href="' + l[1] + '"' + (l[2] ? ' aria-current="page"' : '') + '>' + l[0] + '</a>'; }).join('') +
        '</nav>' +
        '<div class="nav-cta">' +
          '<a class="btn btn-primary" href="' + B + 'studio/">Créer mon univers</a>' +
          '<button class="nav-burger" type="button" aria-label="Ouvrir le menu" aria-expanded="false" aria-controls="nav-sheet"><span></span></button>' +
        '</div>' +
      '</div>' +
      '<div class="nav-sheet" id="nav-sheet">' +
        links.map(function (l) { return '<a href="' + l[1] + '">' + l[0] + '</a>'; }).join('') +
      '</div>';
    var burger = nav.querySelector('.nav-burger');
    function setOpen(o) {
      nav.classList.toggle('open', o);
      burger.setAttribute('aria-expanded', o ? 'true' : 'false');
      burger.setAttribute('aria-label', o ? 'Fermer le menu' : 'Ouvrir le menu');
    }
    burger.addEventListener('click', function () { setOpen(!nav.classList.contains('open')); });
    nav.querySelectorAll('.nav-sheet a').forEach(function (a) { a.addEventListener('click', function () { setOpen(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setOpen(false); });
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 24); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  var foot = document.querySelector('[data-foot]');
  if (foot) {
    foot.className = 'foot';
    foot.innerHTML =
      '<div class="container">' +
        '<div class="foot-grid">' +
          '<div class="foot-brand">' +
            '<img src="' + B + 'assets/wordmark.webp" alt="SECR3TLY" width="900" height="147" loading="lazy">' +
            '<p>La plateforme qui donne à chaque créateur son propre univers : identité, contenus, communauté, commerce et business, derrière un seul lien.</p>' +
            '<p class="sign">Where creators get closer.</p>' +
          '</div>' +
          '<div><h3>Produit</h3><ul>' +
            '<li><a href="' + home + '#univers">Univers</a></li>' +
            '<li><a href="' + home + '#fonctionnalites">Fonctionnalités</a></li>' +
            '<li><a href="' + home + '#themes">Thèmes</a></li>' +
            '<li><a href="' + home + '#tarifs">Tarifs</a></li>' +
          '</ul></div>' +
          '<div><h3>Découvrir</h3><ul>' +
            '<li><a href="' + B + 'explore.html">Explorer</a></li>' +
            '<li><a href="https://cronobots.github.io/AUDACE/" target="_blank" rel="noopener">Un univers réel</a></li>' +
            '<li><a href="' + B + 'studio/">Studio créateur</a></li>' +
            '<li><a href="' + home + '#faq">FAQ</a></li>' +
          '</ul></div>' +
          '<div><h3>Légal</h3><ul>' +
            '<li><a href="#" data-soon>Mentions légales</a></li>' +
            '<li><a href="#" data-soon>Confidentialité</a></li>' +
            '<li><a href="#" data-soon>Conditions d’utilisation</a></li>' +
            '<li><a href="#" data-soon>Cookies</a></li>' +
          '</ul></div>' +
        '</div>' +
        '<div class="foot-bottom"><span>© 2026 SECR3TLY. Tous droits réservés.</span><span>One creator. One universe. One link.</span></div>' +
      '</div>';
    foot.querySelectorAll('[data-soon]').forEach(function (a) {
      a.addEventListener('click', function (e) { e.preventDefault(); if (window.SecretlyUI) SecretlyUI.toast('Page bientôt disponible'); });
    });
  }
})();
