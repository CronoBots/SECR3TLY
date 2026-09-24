# SECR3TLY — Architecture produit & technique

> **One creator. One universe. One link.**
> Ce document décrit comment passer du prototype statique de ce dépôt à la plateforme en production.

---

## 1. Ce que contient le prototype

| Brique | Fichiers | Rôle |
|---|---|---|
| Landing plateforme | `index.html` | Concept, univers, tarifs, inscription (réservation du lien) |
| Découverte | `explore.html` | Créateurs, catégories, tendances, événements |
| Univers créateur | `c/` | Rendu d'un espace créateur à partir de ses données + de son thème |
| Studio (back-office) | `studio/` | Univers (builder), contenus, CRM, commerce, marketing, analytics, media kit, collaborations, copilote IA, paramètres |
| Smart links | `404.html` | Résout `/<nom>/<section>` vers `c/?u=<nom>&s=<section>` sur GitHub Pages |
| Modèle de données | `assets/data.js` | Formes de données + créateurs de démo + store `localStorage` |
| Moteur de thèmes | `assets/themes.js` | 14 préréglages + surcharges individuelles → variables CSS |
| UI partagée | `assets/ui.js`, `assets/brand.css` | Visuels génératifs, icônes, QR codes, design system |
| Exemple réel | [cronobots.github.io/AUDACE](https://cronobots.github.io/AUDACE/) | Un univers déjà en ligne, réalisé à la main (le dépôt AUDACE) |

Le prototype n'a **aucun backend** : les modifications du créateur, les abonnements et les achats du visiteur restent dans le `localStorage` de son navigateur. Les paiements sont simulés. Les formes de données de `assets/data.js` sont celles que l'API renverra, ce qui permet de remplacer le store sans réécrire les interfaces.

---

## 2. Architecture cible

```
                    ┌───────────────────────────────┐
  creator.com ────▶ │  Edge (CDN + TLS à la volée)  │ ◀──── secr3tly.com/<nom>
  www.creator.com   │  routage domaine → créateur   │
                    └──────────────┬────────────────┘
                                   │
               ┌───────────────────┼─────────────────────┐
               ▼                   ▼                     ▼
      Univers public (SSR)   Studio (SPA)           Apps mobiles
      Next.js / Astro        Next.js                React Native / Expo
      SEO, OG, JSON-LD       créateurs & équipes    créateurs + fans
               │                   │                     │
               └─────────┬─────────┴──────────┬──────────┘
                         ▼                    ▼
                  API (REST + webhooks)   Temps réel (messages, notifs)
                         │
     ┌──────────┬────────┼─────────┬──────────────┬───────────────┐
     ▼          ▼        ▼         ▼              ▼               ▼
  Postgres   Stockage  Paiements  E-mail / Push   Analytics       IA
  (RLS)      médias    Stripe     (Resend,        (événements →   Claude API
             privé +   Connect    APNs / FCM)     ClickHouse ou   (copilote)
             CDN signé                            Postgres)
```

### Choix recommandés

| Besoin | Choix | Pourquoi |
|---|---|---|
| Base de données + auth | **Supabase** (Postgres, Auth, Storage, Realtime) | Row Level Security = contrôle d'accès par niveau au plus près des données |
| Front public | **Next.js** (App Router, ISR) | Rendu serveur pour le SEO des univers, pages pré-générées et revalidées à chaque modification |
| Paiements | **Stripe Connect** (comptes Express) | Abonnements, PPV, tips, produits ; SECR3TLY prélève sa commission via `application_fee_percent` ; KYC et versements gérés par Stripe |
| Domaines personnalisés | **Vercel Domains API** ou **Cloudflare for SaaS** | Certificats TLS émis automatiquement pour chaque domaine créateur |
| Médias | Supabase Storage (bucket privé) + CDN à URL signée courte | Contenus exclusifs jamais accessibles par une URL publique |
| Vidéo | Mux ou Cloudflare Stream | Streaming HLS signé, lives, filigrane |
| E-mails / newsletters | Resend (+ React Email) | Campagnes ciblées par segment CRM |
| Push | Expo Notifications (APNs / FCM) | Apps créateur + fan |
| Analytics | Événements first-party → table `events` (puis ClickHouse au-delà de ~100 M lignes) | Sans cookies tiers, conforme RGPD |
| IA | **Claude API** (`claude-opus-5-5` pour l'analyse, `claude-haiku-4-5` pour les réponses rapides) | Copilote : bio, publications, offres, analyse des stats, media kit, e-mails |

---

## 3. Domaines & smart links

1. Chaque univers répond sur `secr3tly.com/<nom>`.
2. Le créateur ajoute `creator.com` dans *Studio → Paramètres → Domaine*. L'API enregistre le domaine auprès du fournisseur (Vercel / Cloudflare), qui renvoie les enregistrements DNS à créer :
   - `www` → `CNAME cname.secr3tly.com`
   - apex → `A` / `ALIAS` fourni par le fournisseur
   - `TXT _secr3tly.<domaine>` → jeton de vérification
3. Dès que le DNS est vérifié, le certificat TLS est émis et le middleware Edge associe `Host` → `creator_id`.
4. Le visiteur ne voit plus SECR3TLY, hormis un « Powered by SECR3TLY » discret, qu'on peut retirer à partir du plan Premium.

**Smart links** : `/<nom>/<section>` (shop, vip, video, event, ou un slug personnalisé). Chaque résolution enregistre un événement `click` avec la source, les paramètres UTM, le pays et l'appareil, puis redirige ou fait défiler jusqu'à la section. Dans le prototype, `404.html` joue ce rôle sur GitHub Pages.

---

## 4. Contrôle d'accès (PUBLIC · MEMBERS · VIP · PRIVATE)

- Chaque contenu porte `access_level` (0 à 3) et, en option, un `price` (PPV / bundle) et `expires_at` (story 24 h, accès temporaire).
- Un visiteur peut voir un contenu si **l'une** de ces conditions est vraie :
  1. `access_level = public`
  2. il a un abonnement actif dont le niveau est supérieur ou égal à celui du contenu
  3. il a acheté ce contenu (ou un bundle qui le contient)
  4. il a une invitation acceptée (niveau PRIVATE)
- Cette règle est appliquée **dans Postgres via RLS** (voir `docs/schema.sql`), puis de nouveau au moment de signer l'URL du média. Le front n'affiche qu'une version floutée générée côté serveur : l'original ne quitte jamais le stockage privé sans signature.

### Protection des contenus
Les URL signées expirent en 60 s. Des filigranes dynamiques (pseudo + ID du membre) sont incrustés sur les photos et les vidéos. Le clic droit et le téléchargement sont bloqués. Le « screen recording » est détecté sur mobile. Une empreinte perceptuelle des médias permet de retrouver une fuite et d'envoyer une notification DMCA.

---

## 5. Monétisation

| Flux | Implémentation Stripe |
|---|---|
| Abonnements (mensuel / annuel, essai, promo, places limitées) | `Product` + `Price` par palier, `trial_period_days`, `Coupon`, quota vérifié côté API |
| PPV, bundle, accès temporaire ou permanent | `PaymentIntent` unique → table `purchases` (avec `expires_at` si l'accès est temporaire) |
| Tips / dons | `PaymentIntent` à montant libre |
| Boutique (numérique / physique) | `Checkout Session`, livraison numérique par lien signé, adresse collectée pour le physique |
| Billetterie d'événements | Produit à stock limité + QR de contrôle |
| Affiliation / codes promo / sponsoring | Suivi via smart links + table `brand_deals` (commission, revenus) |

**Commission plateforme** : FREE 10 % · PRO 5 % · PREMIUM 2 % · BUSINESS négociée (`application_fee_percent`).

---

## 6. Copilote IA

Le copilote tourne côté serveur. Une route `/api/copilot` construit un contexte à partir des données du créateur : profil, paliers, statistiques des 30 derniers jours, meilleurs contenus. Ce contexte est envoyé à la **Claude API** avec des outils (*tool use*) :

- `update_bio`, `create_post_draft`, `create_offer`, `create_campaign`, `get_analytics(range)`, `get_top_content`
- Le modèle propose, le créateur valide : **aucune action n'est exécutée sans confirmation**, ce que reflètent les boutons « Appliquer » du Studio.
- Les réponses automatiques aux fans sont désactivées par défaut. Quand le créateur les active, les messages générés par l'IA le signalent clairement.

Dans le prototype, le copilote est un générateur local à base de modèles de texte, alimenté par les vraies données de démo.

---

## 7. Sécurité & conformité

| Sujet | Mesures |
|---|---|
| Authentification | E-mail + passkeys / 2FA TOTP, sessions révocables, rôles d'équipe (owner, manager, editor, analyst) pour le plan Business |
| Autorisations | RLS Postgres sur toutes les tables, clés de service uniquement côté serveur |
| Paiements | Aucune donnée carte chez SECR3TLY (Stripe Elements / Checkout), webhooks signés |
| Modération | Signalement par les fans, file de modération, filtres automatiques, vérification d'âge et d'identité des créateurs selon les catégories de contenu |
| RGPD | Consentement marketing par membre (`consent_marketing`), export JSON complet, suppression de compte en 30 jours, registre des traitements, hébergement UE |
| Journalisation | Journal d'audit des actions sensibles (paiements, permissions, exports) |

---

## 8. Apps mobiles

Les apps utilisent **Expo / React Native** avec une seule base de code et deux « flavors » :

- **SECR3TLY Studio** (créateurs) : publier, messages, membres, statistiques, ventes, abonnements, édition de l'univers, notifications.
- **SECR3TLY** (fans) : suivre, découvrir, espaces privés, s'abonner, acheter, commenter, messages, notifications.

Les apps passent par la même API. Pour les achats numériques in-app, il faut respecter les règles des stores : l'abonnement se fait sur le web, et l'app sert d'accès au contenu.

---

## 9. Feuille de route

| Phase | Contenu |
|---|---|
| **0 — Prototype** *(ce dépôt)* | Landing, univers créateur à 14 thèmes et 4 niveaux d'accès, Studio complet en mode démo, smart links, QR, media kit, exemple réel AUDACE |
| **1 — MVP** | Supabase (auth, schéma, RLS), univers SSR, Stripe Connect (abonnements + PPV), stockage privé, domaine personnalisé, analytics first-party |
| **2 — Business** | Boutique, billetterie, CRM et campagnes e-mail/push, media kit PDF, collaborations, copilote Claude |
| **3 — Social** | Messagerie temps réel, communautés privées, lives, découverte, apps iOS/Android |
| **4 — Scale** | Équipes et agences (Business), API publique, marketplace de thèmes, multi-devise et fiscalité internationale |
