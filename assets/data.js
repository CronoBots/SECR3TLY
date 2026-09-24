/* =====================================================================
   SECR3TLY — Modèle de données + store de démonstration
   ---------------------------------------------------------------------
   Prototype 100 % statique : les données de démo sont ci-dessous et les
   modifications du créateur / du visiteur sont conservées dans le
   localStorage du navigateur. En production, ce module est remplacé par
   l'API décrite dans docs/ARCHITECTURE.md (mêmes formes de données).
   ===================================================================== */
(function (root) {
  'use strict';

  /* ---------- Niveaux d'accès ---------- */
  var LEVELS = [
    { id: 'public',  name: 'Public',  rank: 0, desc: 'Accessible à tout le monde' },
    { id: 'members', name: 'Members', rank: 1, desc: 'Réservé aux membres' },
    { id: 'vip',     name: 'VIP',     rank: 2, desc: 'Contenu premium' },
    { id: 'private', name: 'Private', rank: 3, desc: 'Sur invitation uniquement' }
  ];
  var RANK = { public: 0, members: 1, vip: 2, private: 3 };

  /* ---------- Sections disponibles dans un univers ----------
     Le créateur choisit lesquelles afficher et dans quel ordre. */
  var SECTIONS = [
    { id: 'links',       name: 'Liens importants' },
    { id: 'feed',        name: 'Publications & contenus exclusifs' },
    { id: 'gallery',     name: 'Galerie / albums' },
    { id: 'memberships', name: 'Abonnements' },
    { id: 'shop',        name: 'Boutique' },
    { id: 'events',      name: 'Événements' },
    { id: 'promos',      name: 'Codes promo & partenaires' },
    { id: 'community',   name: 'Communauté' },
    { id: 'collabs',     name: 'Collaborations' },
    { id: 'newsletter',  name: 'Newsletter' },
    { id: 'contact',     name: 'Contact' }
  ];

  /* Visuel génératif (pas de photo) : 2 couleurs + motif */
  function art(a, b, pattern, label) { return { a: a, b: b, pattern: pattern || 'orb', label: label || '' }; }

  /* =================================================================
     CRÉATEURS DE DÉMONSTRATION (noms, chiffres et contenus fictifs)
     ================================================================= */
  var SEED = [
    {
      handle: 'secr3tly',
      name: 'Secr3tly',
      pseudo: '@secr3tly',
      category: 'Fitness',
      tagline: 'Fitness · Lifestyle',
      bio: 'Univers réel réalisé avec SECR3TLY : fitness, lifestyle et contenu exclusif, tous les liens et l’accès privé au même endroit.',
      location: 'Bruxelles, BE',
      verified: true,
      // Univers déjà en ligne : la page créateur redirige vers le site dédié
      externalUrl: 'https://cronobots.github.io/AUDACE/',
      domain: 'cronobots.github.io/AUDACE',
      avatar: { initials: 'S3', a: '#ff4d6d', b: '#e7c79b', img: 'https://cronobots.github.io/AUDACE/img-avatar.webp' },
      cover: art('#ff4d6d', '#0a0908', 'orb', ''),
      coverImg: 'https://cronobots.github.io/AUDACE/img-pool.webp',
      theme: { preset: 'premium', overrides: { accent: '#ff4d6d', accent2: '#e7c79b', display: 'Cormorant Garamond' } },
      stats: { followers: 128400, members: 2140, posts: 312 },
      featured: true,
      sections: [], links: [], tiers: [], posts: [], products: [], events: [], promos: [], collabs: [], socials: []
    },
    {
      handle: 'lena',
      name: 'Lena Moreau',
      pseudo: '@lenamoreau',
      category: 'Fashion',
      tagline: 'Mode · Voyages · Coulisses',
      bio: 'Styliste et créatrice mode basée à Paris. Ici, je partage ce que je ne poste nulle part ailleurs : coulisses des shootings, carnets de voyage, looks commentés et mes adresses secrètes.',
      location: 'Paris, FR',
      verified: true,
      domain: 'lenamoreau.com',
      avatar: { initials: 'LM', a: '#e8b4bc', b: '#9c7fa6' },
      cover: art('#2a1d22', '#c0707f', 'silk', ''),
      theme: { preset: 'luxury', overrides: { accent: '#e8b4bc', accent2: '#c0707f' } },
      stats: { followers: 486000, members: 3920, posts: 214 },
      featured: true,
      sections: ['links', 'feed', 'memberships', 'shop', 'events', 'promos', 'gallery', 'community', 'collabs', 'newsletter', 'contact'],
      socials: [
        { net: 'instagram', url: 'https://instagram.com/', followers: 312000 },
        { net: 'tiktok', url: 'https://tiktok.com/', followers: 142000 },
        { net: 'youtube', url: 'https://youtube.com/', followers: 24000 },
        { net: 'pinterest', url: 'https://pinterest.com/', followers: 8000 }
      ],
      links: [
        { id: 'l1', label: 'Mon carnet de voyage — Kyoto', url: '#feed', slug: 'kyoto', icon: '✦', clicks: 4210 },
        { id: 'l2', label: 'Ma capsule « Rose Nacre »', url: '#shop', slug: 'shop', icon: '◈', clicks: 6120 },
        { id: 'l3', label: 'Rejoindre le cercle VIP', url: '#memberships', slug: 'vip', icon: '♛', clicks: 8830 },
        { id: 'l4', label: 'Dernière vidéo YouTube', url: 'https://youtube.com/', slug: 'video', icon: '▶', clicks: 2940 }
      ],
      tiers: [
        { id: 'free', name: 'Free', level: 'public', price: 0, period: 'month', perks: ['Publications publiques', 'Newsletter mensuelle'], highlight: false },
        { id: 'basic', name: 'Cercle', level: 'members', price: 6.99, period: 'month', yearly: 69, trialDays: 7, perks: ['Coulisses des shootings', 'Carnets de voyage complets', 'Discussions membres'], highlight: false },
        { id: 'vip', name: 'VIP', level: 'vip', price: 19, period: 'month', yearly: 190, perks: ['Tout le Cercle', 'Lives privés mensuels', 'Looks commentés', '-15 % sur la boutique'], highlight: true, promo: '-30 % le 1er mois' },
        { id: 'private', name: 'Private', level: 'private', price: 89, period: 'month', perks: ['Tout le VIP', 'Session styling 1:1 par trimestre', 'Invitations aux événements', 'Accès sur invitation'], limited: 25, inviteOnly: true }
      ],
      posts: [
        { id: 'p1', type: 'photo', title: 'Kyoto, 6h du matin', caption: 'Le temple avant la foule. Le carnet complet est pour le Cercle.', access: 'public', art: art('#f2d7c9', '#c0707f', 'sun'), likes: 12400, comments: 318, date: '2026-09-21' },
        { id: 'p2', type: 'album', title: 'Coulisses — shooting Rose Nacre', caption: '42 photos jamais publiées.', access: 'members', art: art('#e8b4bc', '#2a1d22', 'silk'), count: 42, likes: 3120, comments: 96, date: '2026-09-19' },
        { id: 'p3', type: 'video', title: 'Live privé : je trie mon dressing', caption: 'Replay 58 min · questions en direct.', access: 'vip', art: art('#9c7fa6', '#140f12', 'wave'), duration: '58:12', likes: 1840, comments: 212, date: '2026-09-17' },
        { id: 'p4', type: 'ppv', title: 'Lookbook automne (PDF + vidéo)', caption: 'À l’unité, accès permanent.', access: 'public', price: 12, art: art('#d9c3a0', '#5a3b2e', 'grid'), likes: 980, comments: 41, date: '2026-09-15' },
        { id: 'p5', type: 'story', title: 'Story 24 h — essayage Paris FW', caption: 'Disparaît demain.', access: 'members', ephemeral: true, art: art('#c0707f', '#e8b4bc', 'orb'), likes: 2210, comments: 57, date: '2026-09-23' },
        { id: 'p6', type: 'photo', title: 'Lettre privée #12', caption: 'Pour le cercle Private uniquement.', access: 'private', art: art('#3a2833', '#9c7fa6', 'veil'), likes: 212, comments: 18, date: '2026-09-12' },
        { id: 'p7', type: 'photo', title: 'Mes 5 adresses à Lisbonne', caption: 'Épinglé.', access: 'public', art: art('#e9c9a8', '#6a8caf', 'sun'), likes: 8600, comments: 190, date: '2026-09-09' },
        { id: 'p8', type: 'bundle', title: 'Bundle « Voyages 2026 »', caption: '6 carnets + 3 vidéos.', access: 'public', price: 29, art: art('#6a8caf', '#e8b4bc', 'wave'), likes: 640, comments: 22, date: '2026-09-02' }
      ],
      products: [
        { id: 'pr1', name: 'Capsule « Rose Nacre » — foulard soie', type: 'physical', price: 89, stock: 40, art: art('#e8b4bc', '#fbf6f1', 'silk'), sales: 312 },
        { id: 'pr2', name: 'Presets Lightroom « Paris Hiver »', type: 'digital', price: 19, art: art('#c9b2d2', '#2a1d22', 'grid'), sales: 1480 },
        { id: 'pr3', name: 'Guide : construire sa garde-robe capsule', type: 'ebook', price: 24, art: art('#d9c3a0', '#3a2833', 'lines'), sales: 890 },
        { id: 'pr4', name: 'Masterclass styling (2 h)', type: 'course', price: 79, art: art('#c0707f', '#140f12', 'wave'), sales: 164 },
        { id: 'pr5', name: 'Tote bag Lena × Atelier', type: 'merch', price: 35, stock: 120, art: art('#f3ece6', '#9c7fa6', 'orb'), sales: 402 },
        { id: 'pr6', name: 'Journée shopping à Paris (expérience)', type: 'experience', price: 450, stock: 4, art: art('#2a1d22', '#d9c3a0', 'veil'), sales: 11 }
      ],
      events: [
        { id: 'e1', title: 'Live Q&A : tendances automne', date: '2026-10-02T20:00', place: 'En ligne', access: 'vip', price: 0, seats: null },
        { id: 'e2', title: 'Brunch privé — Paris 6e', date: '2026-10-19T11:00', place: 'Paris', access: 'private', price: 65, seats: 18 },
        { id: 'e3', title: 'Pop-up Rose Nacre', date: '2026-11-08T14:00', place: 'Le Marais, Paris', access: 'public', price: 0, seats: 300 }
      ],
      promos: [
        { id: 'c1', brand: 'Maison Sézane', code: 'LENA15', discount: '-15 %', url: '#', desc: 'Sur toute la collection automne' },
        { id: 'c2', brand: 'Aesop', code: 'LENAGLOW', discount: 'Coffret offert', url: '#', desc: 'Dès 80 € d’achat' },
        { id: 'c3', brand: 'Airbnb', code: 'LENATRIP', discount: '-40 €', url: '#', desc: 'Sur votre premier séjour' }
      ],
      collabs: [
        { id: 'b1', brand: 'Maison Sézane', status: 'live', type: 'Campagne capsule', fee: 6500, deadline: '2026-10-05', deliverables: ['3 Reels', '1 carrousel', '1 story/semaine'], commission: 0.08, revenue: 9120, clicks: 18400 },
        { id: 'b2', brand: 'Aesop', status: 'contract', type: 'Placement produit', fee: 3200, deadline: '2026-10-20', deliverables: ['1 vidéo YouTube', '2 stories'], commission: 0, revenue: 0, clicks: 0 },
        { id: 'b3', brand: 'Airbnb', status: 'brief', type: 'Affiliation voyage', fee: 0, deadline: '2026-11-01', deliverables: ['Carnet Kyoto sponsorisé'], commission: 0.1, revenue: 0, clicks: 0 },
        { id: 'b4', brand: 'Longchamp', status: 'lead', type: 'Ambassadrice saison', fee: 18000, deadline: '2026-12-01', deliverables: ['À définir'], commission: 0, revenue: 0, clicks: 0 },
        { id: 'b5', brand: 'Veja', status: 'done', type: 'Lancement sneakers', fee: 4800, deadline: '2026-08-30', deliverables: ['2 Reels', '1 live'], commission: 0.05, revenue: 7340, clicks: 12100 }
      ],
      mediakit: {
        rates: [
          { item: 'Reel Instagram', price: 2800 }, { item: 'Vidéo TikTok', price: 1900 },
          { item: 'Intégration YouTube', price: 4200 }, { item: 'Story (3 frames)', price: 900 },
          { item: 'Post dans l’univers + newsletter', price: 1500 }
        ],
        audience: { female: 78, male: 20, other: 2, ages: { '18-24': 31, '25-34': 44, '35-44': 17, '45+': 8 }, countries: { France: 58, Belgique: 11, Suisse: 7, Canada: 6, 'États-Unis': 5, Autres: 13 } },
        engagement: 5.8,
        contact: 'partners@lenamoreau.com'
      },
      seo: { title: 'Lena Moreau — Mode, voyages & coulisses', description: 'L’univers officiel de Lena Moreau : contenus exclusifs, capsule Rose Nacre, carnets de voyage et cercle VIP.' }
    },
    {
      handle: 'ines',
      name: 'Inès Belkacem',
      pseudo: '@ines.glow',
      category: 'Beauty',
      tagline: 'Skincare · Makeup · Routines',
      bio: 'Maquilleuse professionnelle. Tutoriels pas à pas, routines skincare honnêtes et tests produits sans filtre.',
      location: 'Bruxelles, BE',
      verified: true,
      domain: 'inesglow.be',
      avatar: { initials: 'IB', a: '#f3c6b8', b: '#d98a9a' },
      cover: art('#fbe3dc', '#d98a9a', 'orb', ''),
      theme: { preset: 'beauty', overrides: {} },
      stats: { followers: 212000, members: 1840, posts: 380 },
      featured: true,
      sections: ['links', 'memberships', 'feed', 'shop', 'promos', 'newsletter', 'contact'],
      socials: [{ net: 'instagram', url: '#', followers: 164000 }, { net: 'tiktok', url: '#', followers: 48000 }],
      links: [
        { id: 'l1', label: 'Ma routine du soir (vidéo)', url: '#feed', slug: 'routine', icon: '✧', clicks: 3120 },
        { id: 'l2', label: 'Mes codes promo beauté', url: '#promos', slug: 'codes', icon: '%', clicks: 5400 }
      ],
      tiers: [
        { id: 'free', name: 'Free', level: 'public', price: 0, period: 'month', perks: ['Tutoriels publics'] },
        { id: 'basic', name: 'Glow Club', level: 'members', price: 4.99, period: 'month', trialDays: 14, perks: ['Tutoriels complets', 'Routines personnalisées'] },
        { id: 'vip', name: 'Glow VIP', level: 'vip', price: 14, period: 'month', perks: ['Diagnostic peau mensuel', 'Lives privés'], highlight: true }
      ],
      posts: [
        { id: 'p1', type: 'video', title: 'Teint glowy en 5 minutes', caption: 'Version courte ici, version pas à pas pour le Glow Club.', access: 'public', art: art('#fbe3dc', '#d98a9a', 'orb'), duration: '04:12', likes: 9100, comments: 240, date: '2026-09-22' },
        { id: 'p2', type: 'video', title: 'Routine peau mixte — complète', caption: '', access: 'members', art: art('#f3c6b8', '#a86b76', 'wave'), duration: '21:40', likes: 2100, comments: 88, date: '2026-09-18' },
        { id: 'p3', type: 'ppv', title: 'Masterclass eye-liner', caption: 'À l’unité.', access: 'public', price: 9, art: art('#3b2427', '#d98a9a', 'lines'), likes: 740, comments: 30, date: '2026-09-10' }
      ],
      products: [
        { id: 'pr1', name: 'Guide skincare par type de peau', type: 'ebook', price: 15, art: art('#fbe3dc', '#e8c1a6', 'grid'), sales: 1240 },
        { id: 'pr2', name: 'Pinceaux signature (set de 6)', type: 'physical', price: 49, art: art('#d98a9a', '#3b2427', 'silk'), sales: 380 }
      ],
      events: [], promos: [{ id: 'c1', brand: 'Typology', code: 'INES20', discount: '-20 %', url: '#', desc: 'Sur tout le site' }], collabs: [],
      seo: { title: 'Inès Belkacem — Beauty', description: 'Tutoriels, routines skincare et Glow Club.' }
    },
    {
      handle: 'noah',
      name: 'Noah Vale',
      pseudo: '@noahvale',
      category: 'Gaming',
      tagline: 'Streams · Speedruns · Setup',
      bio: 'Streamer et speedrunner. Replays sans pub, tournois communautaires et coulisses de mon setup.',
      location: 'Montréal, CA',
      verified: false,
      domain: 'noahvale.gg',
      avatar: { initials: 'NV', a: '#7c8cff', b: '#3fd6c5' },
      cover: art('#11131d', '#7c8cff', 'grid', ''),
      theme: { preset: 'gaming', overrides: {} },
      stats: { followers: 94000, members: 1210, posts: 540 },
      sections: ['links', 'feed', 'memberships', 'events', 'community', 'shop', 'contact'],
      socials: [{ net: 'twitch', url: '#', followers: 61000 }, { net: 'youtube', url: '#', followers: 33000 }, { net: 'x', url: '#', followers: 12000 }],
      links: [{ id: 'l1', label: 'En live maintenant', url: '#', slug: 'live', icon: '●', clicks: 9800 }],
      tiers: [
        { id: 'free', name: 'Viewer', level: 'public', price: 0, period: 'month', perks: ['Clips publics'] },
        { id: 'basic', name: 'Squad', level: 'members', price: 3.99, period: 'month', perks: ['Replays sans pub', 'Discord privé'] },
        { id: 'vip', name: 'Elite', level: 'vip', price: 9.99, period: 'month', perks: ['Coaching de groupe', 'Tournois privés'], highlight: true }
      ],
      posts: [
        { id: 'p1', type: 'video', title: 'Any% WR attempt — replay', caption: '', access: 'members', art: art('#7c8cff', '#07080d', 'grid'), duration: '1:42:10', likes: 3400, comments: 410, date: '2026-09-20' },
        { id: 'p2', type: 'photo', title: 'Nouveau setup 2026', caption: 'La liste complète du matériel est dans la boutique.', access: 'public', art: art('#3fd6c5', '#11131d', 'lines'), likes: 5100, comments: 260, date: '2026-09-14' }
      ],
      products: [{ id: 'pr1', name: 'Pack overlays stream', type: 'digital', price: 12, art: art('#7c8cff', '#3fd6c5', 'grid'), sales: 920 }],
      events: [{ id: 'e1', title: 'Tournoi communautaire #14', date: '2026-10-11T19:00', place: 'En ligne', access: 'members', price: 0, seats: 64 }],
      promos: [], collabs: [],
      seo: { title: 'Noah Vale — Gaming', description: 'Streams, speedruns et la Squad.' }
    },
    {
      handle: 'kai',
      name: 'Atelier Kaï',
      pseudo: '@atelierkai',
      category: 'Art',
      tagline: 'Illustration · Tirages · Process',
      bio: 'Illustratrice. Tirages d’art en édition limitée, process vidéo et commandes personnalisées.',
      location: 'Lisbonne, PT',
      verified: true,
      domain: 'atelierkai.art',
      avatar: { initials: 'AK', a: '#d2643c', b: '#3c6e8f' },
      cover: art('#f1ece2', '#d2643c', 'sun', ''),
      theme: { preset: 'artistic', overrides: {} },
      stats: { followers: 58000, members: 690, posts: 190 },
      sections: ['gallery', 'shop', 'memberships', 'feed', 'newsletter', 'contact'],
      socials: [{ net: 'instagram', url: '#', followers: 51000 }, { net: 'pinterest', url: '#', followers: 7000 }],
      links: [],
      tiers: [
        { id: 'free', name: 'Curieux', level: 'public', price: 0, period: 'month', perks: ['Galerie publique'] },
        { id: 'basic', name: 'Atelier', level: 'members', price: 5, period: 'month', perks: ['Process vidéo', 'Fonds d’écran'] }
      ],
      posts: [{ id: 'p1', type: 'video', title: 'Process — « Marée »', caption: '', access: 'members', art: art('#3c6e8f', '#f1ece2', 'wave'), duration: '12:03', likes: 1300, comments: 64, date: '2026-09-16' }],
      products: [
        { id: 'pr1', name: 'Tirage « Marée » — 30×40, 50 ex.', type: 'physical', price: 120, stock: 12, art: art('#3c6e8f', '#f1ece2', 'wave'), sales: 38 },
        { id: 'pr2', name: 'Commande de portrait', type: 'experience', price: 280, art: art('#d2643c', '#f1ece2', 'orb'), sales: 19 }
      ],
      events: [], promos: [], collabs: [],
      seo: { title: 'Atelier Kaï — Illustration', description: 'Tirages d’art et process.' }
    },
    {
      handle: 'mael',
      name: 'Maël Rivière',
      pseudo: '@maelcuisine',
      category: 'Lifestyle',
      tagline: 'Cuisine de saison · Vins · Tables',
      bio: 'Chef à domicile. Recettes de saison, accords mets-vins et dîners privés.',
      location: 'Bordeaux, FR',
      verified: false,
      domain: 'maelriviere.fr',
      avatar: { initials: 'MR', a: '#9a7b56', b: '#c9a27a' },
      cover: art('#f5efe6', '#9a7b56', 'lines', ''),
      theme: { preset: 'lifestyle', overrides: {} },
      stats: { followers: 41000, members: 520, posts: 260 },
      sections: ['feed', 'events', 'shop', 'memberships', 'newsletter'],
      socials: [{ net: 'instagram', url: '#', followers: 38000 }],
      links: [],
      tiers: [
        { id: 'free', name: 'Gourmand', level: 'public', price: 0, period: 'month', perks: ['Recettes publiques'] },
        { id: 'basic', name: 'Table', level: 'members', price: 4, period: 'month', perks: ['Toutes les recettes', 'Accords vins'] }
      ],
      posts: [{ id: 'p1', type: 'photo', title: 'Cèpes, noisettes & beurre noisette', caption: '', access: 'public', art: art('#9a7b56', '#f5efe6', 'orb'), likes: 2300, comments: 70, date: '2026-09-19' }],
      products: [{ id: 'pr1', name: 'Carnet « Automne » — 24 recettes', type: 'ebook', price: 14, art: art('#c9a27a', '#2c2620', 'lines'), sales: 610 }],
      events: [{ id: 'e1', title: 'Dîner privé — 8 couverts', date: '2026-10-24T20:00', place: 'Bordeaux', access: 'members', price: 95, seats: 8 }],
      promos: [], collabs: [],
      seo: { title: 'Maël Rivière — Cuisine', description: 'Recettes de saison et dîners privés.' }
    },
    {
      handle: 'sora',
      name: 'Sora Nakamura',
      pseudo: '@sora.frames',
      category: 'Photographie',
      tagline: 'Photographie · Carnets · Tirages',
      bio: 'Photographe éditorial entre Tokyo et Paris. Séries longues, carnets de terrain et presets.',
      location: 'Tokyo, JP',
      verified: true,
      domain: 'soraframes.jp',
      avatar: { initials: 'SN', a: '#1b1a17', b: '#b0412e' },
      cover: art('#f4f1ea', '#1b1a17', 'lines', ''),
      theme: { preset: 'editorial', overrides: {} },
      stats: { followers: 77000, members: 880, posts: 150 },
      sections: ['gallery', 'feed', 'shop', 'memberships', 'contact'],
      socials: [{ net: 'instagram', url: '#', followers: 70000 }],
      links: [],
      tiers: [
        { id: 'free', name: 'Lecteur', level: 'public', price: 0, period: 'month', perks: ['Séries publiques'] },
        { id: 'basic', name: 'Abonné', level: 'members', price: 6, period: 'month', perks: ['Carnets complets', 'Fichiers RAW mensuels'] }
      ],
      posts: [{ id: 'p1', type: 'album', title: 'Shinjuku, pluie', caption: '18 images.', access: 'members', count: 18, art: art('#1b1a17', '#b0412e', 'lines'), likes: 1900, comments: 55, date: '2026-09-18' }],
      products: [{ id: 'pr1', name: 'Presets « Tokyo Night »', type: 'digital', price: 22, art: art('#b0412e', '#1b1a17', 'grid'), sales: 740 }],
      events: [], promos: [], collabs: [],
      seo: { title: 'Sora Nakamura — Photographie', description: 'Séries, carnets et tirages.' }
    }
  ];

  var CATEGORIES = ['Fashion', 'Beauty', 'Fitness', 'Lifestyle', 'Gaming', 'Art', 'Photographie', 'Musique', 'Business'];

  /* =================================================================
     STOCKAGE LOCAL (toujours protégé : navigation privée, stockage bloqué)
     ================================================================= */
  var NS = 'secr3tly:';
  function lsGet(k, fb) { try { var v = localStorage.getItem(NS + k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function lsSet(k, v) { try { localStorage.setItem(NS + k, JSON.stringify(v)); return true; } catch (e) { return false; } }
  function lsDel(k) { try { localStorage.removeItem(NS + k); } catch (e) { /* ignore */ } }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  /* ---------- Créateurs ---------- */
  function getCreators() {
    var edits = lsGet('creators', {});
    return SEED.map(function (c) { return edits[c.handle] ? edits[c.handle] : clone(c); })
      .concat(Object.keys(edits).filter(function (h) { return !SEED.some(function (c) { return c.handle === h; }); }).map(function (h) { return edits[h]; }));
  }
  function getCreator(handle) {
    handle = String(handle || '').toLowerCase();
    var all = getCreators();
    for (var i = 0; i < all.length; i++) if (all[i].handle === handle) return all[i];
    return null;
  }
  function saveCreator(c) {
    var edits = lsGet('creators', {});
    edits[c.handle] = c;
    return lsSet('creators', edits);
  }
  function resetCreator(handle) {
    var edits = lsGet('creators', {});
    delete edits[handle];
    lsSet('creators', edits);
  }
  function seedCreator(handle) {
    for (var i = 0; i < SEED.length; i++) if (SEED[i].handle === handle) return clone(SEED[i]);
    return null;
  }

  /* ---------- Visiteur (fan) : abonnements, achats, suivis ---------- */
  function getViewer() { return lsGet('viewer', { name: '', email: '', follows: [], memberships: {}, purchases: {}, likes: {}, invites: {} }); }
  function saveViewer(v) { lsSet('viewer', v); }
  function viewerLevel(handle) {
    var v = getViewer();
    var m = v.memberships[handle];
    return m ? m.level : 'public';
  }
  function hasAccess(handle, level) { return RANK[viewerLevel(handle)] >= (RANK[level] || 0); }
  function join(handle, tier) {
    var v = getViewer();
    v.memberships[handle] = { tier: tier.id, level: tier.level, since: new Date().toISOString(), price: tier.price };
    if (v.follows.indexOf(handle) < 0) v.follows.push(handle);
    saveViewer(v);
    track(handle, 'subscribe', { tier: tier.id, amount: tier.price });
  }
  function leave(handle) { var v = getViewer(); delete v.memberships[handle]; saveViewer(v); }
  function purchase(handle, itemId, amount) {
    var v = getViewer();
    v.purchases[handle] = v.purchases[handle] || [];
    if (v.purchases[handle].indexOf(itemId) < 0) v.purchases[handle].push(itemId);
    saveViewer(v);
    track(handle, 'purchase', { item: itemId, amount: amount || 0 });
  }
  function isPurchased(handle, itemId) { var p = getViewer().purchases[handle] || []; return p.indexOf(itemId) >= 0; }
  function toggleFollow(handle) {
    var v = getViewer(); var i = v.follows.indexOf(handle);
    if (i < 0) v.follows.push(handle); else v.follows.splice(i, 1);
    saveViewer(v); return i < 0;
  }
  function isFollowing(handle) { return getViewer().follows.indexOf(handle) >= 0; }
  function toggleLike(handle, postId) {
    var v = getViewer(); var k = handle + ':' + postId;
    v.likes[k] = !v.likes[k]; saveViewer(v); return v.likes[k];
  }
  function isLiked(handle, postId) { return !!getViewer().likes[handle + ':' + postId]; }

  /* ---------- Événements analytics locaux (visites, clics, ventes) ---------- */
  function track(handle, type, data) {
    var ev = lsGet('events', []);
    ev.push({ h: handle, t: type, d: data || {}, at: Date.now() });
    if (ev.length > 2000) ev = ev.slice(-2000);
    lsSet('events', ev);
  }
  function localEvents(handle) { return lsGet('events', []).filter(function (e) { return e.h === handle; }); }

  /* ---------- Générateur pseudo-aléatoire déterministe ---------- */
  function rng(seed) {
    var s = 0; for (var i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
    return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  }

  /** Séries analytics de démonstration (déterministes par créateur) */
  function analytics(handle, days) {
    days = days || 30;
    var c = getCreator(handle) || { stats: { followers: 10000, members: 100 } };
    var r = rng(handle + 'analytics');
    var base = Math.max(300, Math.round((c.stats.followers || 10000) / 120));
    var series = [];
    var now = new Date(); now.setHours(0, 0, 0, 0);
    for (var i = days - 1; i >= 0; i--) {
      var d = new Date(now.getTime() - i * 864e5);
      var wk = d.getDay() === 0 || d.getDay() === 6 ? 1.25 : 1;
      var trend = 1 + (days - i) / days * 0.35;
      var visitors = Math.round(base * wk * trend * (0.75 + r() * 0.5));
      var unique = Math.round(visitors * (0.62 + r() * 0.1));
      var views = Math.round(visitors * (2.1 + r() * 0.8));
      var clicks = Math.round(visitors * (0.34 + r() * 0.12));
      var subs = Math.round(visitors * (0.006 + r() * 0.006));
      var sales = Math.round(visitors * (0.004 + r() * 0.005));
      var revenue = Math.round(subs * 14 + sales * 31 + r() * 90);
      series.push({ date: d.toISOString().slice(0, 10), visitors: visitors, unique: unique, views: views, clicks: clicks, subs: subs, sales: sales, revenue: revenue });
    }
    // Les vraies actions faites dans ce navigateur s'ajoutent à aujourd'hui
    var today = series[series.length - 1];
    localEvents(handle).forEach(function (e) {
      if (new Date(e.at).toISOString().slice(0, 10) !== today.date) return;
      if (e.t === 'visit') { today.visitors++; today.unique++; today.views++; }
      if (e.t === 'click') today.clicks++;
      if (e.t === 'subscribe') { today.subs++; today.revenue += Math.round(e.d.amount || 0); }
      if (e.t === 'purchase') { today.sales++; today.revenue += Math.round(e.d.amount || 0); }
    });
    function sum(k) { return series.reduce(function (a, s) { return a + s[k]; }, 0); }
    var totals = { visitors: sum('visitors'), unique: sum('unique'), views: sum('views'), clicks: sum('clicks'), subs: sum('subs'), sales: sum('sales'), revenue: sum('revenue') };
    var tiers = (c.tiers || []).filter(function (t) { return t.price > 0; });
    var mrr = Math.round(tiers.reduce(function (a, t, i) { return a + t.price * Math.round((c.stats.members || 0) * [0.62, 0.3, 0.08][i] || 0); }, 0));
    return {
      series: series,
      totals: totals,
      conversion: totals.visitors ? (totals.subs + totals.sales) / totals.visitors : 0,
      mrr: mrr,
      activeSubs: c.stats.members || 0,
      churn: 0.031 + r() * 0.02,
      aov: totals.sales ? Math.round((totals.revenue * 0.45) / totals.sales) : 0,
      sources: [
        { name: 'Instagram', v: 38 + Math.round(r() * 8) }, { name: 'TikTok', v: 22 + Math.round(r() * 6) },
        { name: 'Direct / QR', v: 12 + Math.round(r() * 4) }, { name: 'YouTube', v: 9 + Math.round(r() * 4) },
        { name: 'Google', v: 7 + Math.round(r() * 3) }, { name: 'X', v: 4 + Math.round(r() * 3) }
      ],
      countries: [
        { name: 'France', v: 52 }, { name: 'Belgique', v: 12 }, { name: 'Suisse', v: 8 }, { name: 'Canada', v: 7 }, { name: 'États-Unis', v: 6 }, { name: 'Autres', v: 15 }
      ],
      devices: [{ name: 'Mobile', v: 81 }, { name: 'Desktop', v: 15 }, { name: 'Tablette', v: 4 }]
    };
  }

  /** CRM : membres de démonstration (déterministes) */
  function members(handle, n) {
    n = n || 60;
    var first = ['Camille', 'Léa', 'Hugo', 'Emma', 'Lucas', 'Chloé', 'Nina', 'Adam', 'Jade', 'Louis', 'Sarah', 'Yanis', 'Manon', 'Théo', 'Inès', 'Noé', 'Zoé', 'Ethan', 'Lina', 'Sofia', 'Rayan', 'Mila', 'Tom', 'Alice'];
    var last = ['M.', 'D.', 'L.', 'B.', 'R.', 'P.', 'G.', 'V.', 'C.', 'F.', 'N.', 'S.'];
    var countries = ['FR', 'FR', 'FR', 'BE', 'CH', 'CA', 'US', 'LU', 'MA'];
    var c = getCreator(handle) || { tiers: [] };
    var paid = (c.tiers || []).filter(function (t) { return t.price > 0; });
    var r = rng(handle + 'crm');
    var out = [];
    for (var i = 0; i < n; i++) {
      var tier = paid.length ? paid[Math.min(paid.length - 1, Math.floor(Math.pow(r(), 1.8) * paid.length))] : null;
      var months = 1 + Math.floor(r() * 18);
      var spent = Math.round((tier ? tier.price * months : 0) + r() * 160);
      var joined = new Date(Date.now() - months * 30 * 864e5 - Math.floor(r() * 25) * 864e5);
      var lastSeen = Math.floor(Math.pow(r(), 2) * 40);
      var tags = [];
      if (months <= 1) tags.push('Nouveau');
      if (tier && tier.level === 'vip') tags.push('VIP');
      if (tier && tier.level === 'private') tags.push('Private');
      if (spent > 150) tags.push('Client');
      if (lastSeen > 30) tags.push('Inactif');
      if (r() > 0.8) tags.push('Événement');
      out.push({
        id: 'm' + i,
        name: first[Math.floor(r() * first.length)] + ' ' + last[Math.floor(r() * last.length)],
        tier: tier ? tier.name : 'Free',
        level: tier ? tier.level : 'public',
        status: r() > 0.9 ? 'churned' : 'active',
        country: countries[Math.floor(r() * countries.length)],
        joined: joined.toISOString().slice(0, 10),
        lastSeenDays: lastSeen,
        spent: spent,
        purchases: Math.floor(r() * 6),
        messages: Math.floor(r() * 30),
        tags: tags,
        consentMarketing: r() > 0.3
      });
    }
    return out;
  }

  /* ---------- URLs ---------- */
  // Racine du site, déduite de l'emplacement de ce script (…/assets/data.js)
  var BASE = (function () {
    try {
      var s = document.currentScript && document.currentScript.src;
      if (s) return s.replace(/assets\/data\.js.*$/, '');
    } catch (e) { /* ignore */ }
    return '/';
  })();
  /** Lien vers l'univers d'un créateur (section optionnelle = smart link) */
  function creatorUrl(handle, section) {
    var c = getCreator(handle);
    if (c && c.externalUrl && !section) return c.externalUrl;
    return BASE + 'c/?u=' + encodeURIComponent(handle) + (section ? '&s=' + encodeURIComponent(section) : '');
  }
  /** Smart link « joli » : secr3tly.com/nom/section (résolu par 404.html) */
  function prettyUrl(handle, section) { return BASE + handle + (section ? '/' + section : ''); }

  function money(n, cur) {
    try { return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: cur || 'EUR', maximumFractionDigits: n % 1 ? 2 : 0 }).format(n); }
    catch (e) { return n + ' €'; }
  }
  function compact(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1).replace('.', ',') + ' M';
    if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1).replace('.', ',') + ' k';
    return String(n);
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  root.Secretly = {
    LEVELS: LEVELS, RANK: RANK, SECTIONS: SECTIONS, CATEGORIES: CATEGORIES, BASE: BASE,
    getCreators: getCreators, getCreator: getCreator, saveCreator: saveCreator, resetCreator: resetCreator, seedCreator: seedCreator,
    getViewer: getViewer, saveViewer: saveViewer, viewerLevel: viewerLevel, hasAccess: hasAccess,
    join: join, leave: leave, purchase: purchase, isPurchased: isPurchased,
    toggleFollow: toggleFollow, isFollowing: isFollowing, toggleLike: toggleLike, isLiked: isLiked,
    track: track, localEvents: localEvents, analytics: analytics, members: members, rng: rng,
    creatorUrl: creatorUrl, prettyUrl: prettyUrl, money: money, compact: compact, esc: esc, art: art,
    store: { get: lsGet, set: lsSet, del: lsDel }
  };
})(window);
