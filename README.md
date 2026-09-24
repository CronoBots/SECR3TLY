<p align="center">
  <img src="assets/logo-hero.webp" alt="SECR3TLY" width="720">
</p>

<h3 align="center">One creator. One universe. One link.</h3>
<p align="center"><em>Your space. Your audience. Your secrets.</em></p>

---

**SECR3TLY** est une plateforme internationale qui donne à chaque créateur (influenceur, artiste, personnalité, entrepreneur de l'économie créative) **son propre univers digital**. Cet univers réunit son identité, ses contenus, sa communauté, ses abonnés, ses contenus exclusifs, sa boutique, ses collaborations, ses revenus et ses statistiques, idéalement sur son propre nom de domaine.

> **Linktree** : « Voici mes liens. »
> **SECR3TLY** : « Voici mon univers. »

## 🔗 Démo

| Page | Lien |
|---|---|
| Plateforme | [`/`](https://cronobots.github.io/SECR3TLY/) |
| Découverte | [`/explore.html`](https://cronobots.github.io/SECR3TLY/explore.html) |
| Univers d'une créatrice (démo) | [`/lena`](https://cronobots.github.io/SECR3TLY/lena) · [`/lena/vip`](https://cronobots.github.io/SECR3TLY/lena/vip) · [`/lena/shop`](https://cronobots.github.io/SECR3TLY/lena/shop) |
| Studio créateur | [`/studio/`](https://cronobots.github.io/SECR3TLY/studio/) |
| **Exemple réel en ligne** | [**cronobots.github.io/AUDACE**](https://cronobots.github.io/AUDACE/) : un univers complet réalisé avec SECR3TLY (dépôt `AUDACE`) |

> Le site est publié par GitHub Pages depuis la branche par défaut. Il faut l'activer dans *Settings → Pages* (source : `main`, dossier `/`).

## ✨ Ce que fait le prototype

- **Univers créateur** (`c/`) : entièrement piloté par les données et le thème, avec 14 thèmes prédéfinis (Minimal, Luxury, Fashion, Beauty, Editorial, Creator, Social, Dark, Premium, Gaming, Artistic, Lifestyle, Elegant, Exclusive). Chaque propriété se personnalise individuellement : couleurs, polices, arrondis, boutons, cartes, fonds, ombres, transparence, bordures, animations, mode clair ou sombre.
- **4 niveaux d'accès** : PUBLIC · MEMBERS · VIP · PRIVATE. Contenus verrouillés, PPV, bundles, stories 24 h, invitation pour le niveau Private.
- **Abonnements** définis par le créateur : prix, nom, avantages, mensuel ou annuel, essai, promo, places limitées. Le parcours d'abonnement est simulé et débloque les contenus instantanément.
- **Boutique** (ebooks, presets, formations, merch, expériences…), événements, codes promo, communauté, newsletter, contact.
- **Studio** : builder d'univers avec aperçu en direct (« voir en tant que » Public/Members/VIP/Private), contenus, CRM et segments, messages, commerce, smart links avec paramètres UTM et **QR codes**, campagnes, analytics (audience et business : MRR, churn, panier moyen), **media kit automatique**, collaborations en kanban, **copilote IA**, domaine personnalisé, SEO, sécurité, RGPD (export et suppression), plans.
- **Smart links** : `secr3tly.com/<nom>/<section>`, tous suivis.
- **SEO** : title et description par univers, Open Graph, JSON-LD, sitemap.

Le prototype est 100 % statique, sans backend : les données de démo sont dans `assets/data.js` et les modifications restent dans le navigateur (`localStorage`). **Aucun paiement réel.**

## 🗂 Structure

```
index.html          Landing plateforme
explore.html        Découverte
c/                  Rendu d'un univers créateur        → c/?u=lena&s=vip
studio/             Back-office créateur (SPA)          → studio/#/univers
404.html            Routeur des smart links (GitHub Pages)
assets/
  brand.css         Design system de la marque
  themes.js         Moteur de thèmes (14 préréglages + surcharges)
  data.js           Modèle de données, créateurs de démo, store local
  ui.js             Visuels génératifs, icônes, QR codes, toasts
docs/
  ARCHITECTURE.md   Architecture de production, paiements, domaines, IA, sécurité, feuille de route
  schema.sql        Schéma Postgres/Supabase avec contrôle d'accès par RLS
  BRAND.md          Identité de marque
```

## 🚀 Lancer en local

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

Les URL « jolies » (`/lena/vip`) passent par `404.html` et ne fonctionnent que sur GitHub Pages. En local, utilisez `c/?u=lena&s=vip`.

## 🧭 Vers la production

Voir [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) : Supabase (Postgres + RLS), Next.js pour les univers rendus côté serveur, Stripe Connect avec commission par plan, domaines personnalisés avec TLS automatique, stockage privé avec URL signées, copilote propulsé par l'API Claude, apps Expo iOS et Android.

---

<p align="center"><sub>SECR<b>3</b>TLY · Where creators get closer.</sub></p>
