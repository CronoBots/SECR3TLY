-- =====================================================================
-- SECR3TLY — Schéma Postgres (Supabase) de référence
-- Contrôle d'accès PUBLIC / MEMBERS / VIP / PRIVATE appliqué par RLS.
-- auth.users est fourni par Supabase Auth.
-- =====================================================================

create extension if not exists citext;
create extension if not exists pgcrypto;

-- ---------- Types ----------
create type access_level as enum ('public', 'members', 'vip', 'private');
create type billing_period as enum ('month', 'year', 'once');
create type post_type as enum ('photo', 'video', 'album', 'story', 'live', 'file', 'message', 'ppv', 'bundle');
create type product_type as enum ('ebook', 'course', 'digital', 'template', 'physical', 'merch', 'experience', 'ticket');
create type subscription_status as enum ('trialing', 'active', 'past_due', 'canceled');
create type deal_status as enum ('lead', 'brief', 'contract', 'live', 'done');
create type plan_tier as enum ('free', 'pro', 'premium', 'business');

-- Rang numérique d'un niveau (public 0 → private 3)
create or replace function level_rank(l access_level) returns int
language sql immutable as $$
  select case l when 'public' then 0 when 'members' then 1 when 'vip' then 2 else 3 end
$$;

-- ---------- Créateurs ----------
create table creators (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references auth.users(id) on delete cascade,
  handle          citext not null unique check (handle ~ '^[a-z0-9][a-z0-9._-]{1,29}$'),
  display_name    text not null,
  pseudo          text,
  tagline         text,
  bio             text,
  location        text,
  category        text,
  verified        boolean not null default false,
  avatar_url      text,
  cover_url       text,
  theme           jsonb not null default '{"preset":"premium","overrides":{}}',
  sections        text[] not null default array['links','feed','memberships','shop'],
  seo             jsonb not null default '{}',
  plan            plan_tier not null default 'free',
  show_powered_by boolean not null default true,
  stripe_account  text,
  created_at      timestamptz not null default now()
);

create table creator_domains (
  domain       citext primary key,
  creator_id   uuid not null references creators(id) on delete cascade,
  verify_token text not null default encode(gen_random_bytes(16), 'hex'),
  verified_at  timestamptz,
  ssl_ready_at timestamptz
);

-- Équipe (plan Business : agences, managers)
create table creator_team (
  creator_id uuid references creators(id) on delete cascade,
  user_id    uuid references auth.users(id) on delete cascade,
  role       text not null check (role in ('owner', 'manager', 'editor', 'analyst')),
  primary key (creator_id, user_id)
);

create table links (
  id         uuid primary key default gen_random_uuid(),
  creator_id uuid not null references creators(id) on delete cascade,
  label      text not null,
  url        text not null,
  slug       text,
  icon       text,
  position   int not null default 0,
  unique (creator_id, slug)
);

-- ---------- Abonnements ----------
create table tiers (
  id              uuid primary key default gen_random_uuid(),
  creator_id      uuid not null references creators(id) on delete cascade,
  name            text not null,
  level           access_level not null,
  price_cents     int not null default 0 check (price_cents >= 0),
  yearly_cents    int,
  currency        char(3) not null default 'EUR',
  trial_days      int not null default 0,
  perks           text[] not null default '{}',
  seats_limit     int,
  invite_only     boolean not null default false,
  stripe_price_id text,
  position        int not null default 0
);

create table subscriptions (
  id                 uuid primary key default gen_random_uuid(),
  creator_id         uuid not null references creators(id) on delete cascade,
  tier_id            uuid not null references tiers(id),
  fan_id             uuid not null references auth.users(id) on delete cascade,
  status             subscription_status not null,
  period             billing_period not null default 'month',
  current_period_end timestamptz not null,
  stripe_sub_id      text unique,
  created_at         timestamptz not null default now(),
  unique (creator_id, fan_id)
);

create table invitations (
  id          uuid primary key default gen_random_uuid(),
  creator_id  uuid not null references creators(id) on delete cascade,
  fan_id      uuid references auth.users(id) on delete cascade,
  email       citext,
  message     text,
  status      text not null default 'requested' check (status in ('requested', 'accepted', 'declined')),
  created_at  timestamptz not null default now()
);

-- ---------- Contenus ----------
create table posts (
  id           uuid primary key default gen_random_uuid(),
  creator_id   uuid not null references creators(id) on delete cascade,
  type         post_type not null,
  title        text,
  caption      text,
  access       access_level not null default 'public',
  price_cents  int,                -- PPV / bundle
  access_days  int,                -- accès temporaire après achat (null = permanent)
  expires_at   timestamptz,        -- story 24 h / contenu temporaire
  publish_at   timestamptz not null default now(),
  created_at   timestamptz not null default now()
);

create table post_media (
  id            uuid primary key default gen_random_uuid(),
  post_id       uuid not null references posts(id) on delete cascade,
  storage_path  text not null,     -- bucket privé, jamais public
  blurred_path  text,              -- aperçu flouté généré côté serveur (public)
  kind          text not null check (kind in ('image', 'video', 'file')),
  position      int not null default 0
);

create table bundle_items (
  bundle_id uuid references posts(id) on delete cascade,
  post_id   uuid references posts(id) on delete cascade,
  primary key (bundle_id, post_id)
);

-- ---------- Commerce ----------
create table products (
  id          uuid primary key default gen_random_uuid(),
  creator_id  uuid not null references creators(id) on delete cascade,
  name        text not null,
  type        product_type not null,
  description text,
  price_cents int not null check (price_cents >= 0),
  currency    char(3) not null default 'EUR',
  stock       int,
  active      boolean not null default true
);

create table purchases (
  id            uuid primary key default gen_random_uuid(),
  creator_id    uuid not null references creators(id) on delete cascade,
  fan_id        uuid not null references auth.users(id) on delete cascade,
  post_id       uuid references posts(id),
  product_id    uuid references products(id),
  amount_cents  int not null,
  fee_cents     int not null,      -- commission SECR3TLY
  expires_at    timestamptz,       -- accès temporaire
  stripe_pi_id  text unique,
  created_at    timestamptz not null default now(),
  check (post_id is not null or product_id is not null)
);

create table tips (
  id           uuid primary key default gen_random_uuid(),
  creator_id   uuid not null references creators(id) on delete cascade,
  fan_id       uuid references auth.users(id) on delete set null,
  amount_cents int not null,
  message      text,
  created_at   timestamptz not null default now()
);

create table events (
  id          uuid primary key default gen_random_uuid(),
  creator_id  uuid not null references creators(id) on delete cascade,
  title       text not null,
  starts_at   timestamptz not null,
  place       text,
  access      access_level not null default 'public',
  price_cents int not null default 0,
  seats       int
);

create table promo_codes (
  id         uuid primary key default gen_random_uuid(),
  creator_id uuid not null references creators(id) on delete cascade,
  brand      text not null,
  code       text not null,
  discount   text,
  url        text,
  expires_at timestamptz
);

-- ---------- Communauté & CRM ----------
create table follows (
  creator_id uuid references creators(id) on delete cascade,
  fan_id     uuid references auth.users(id) on delete cascade,
  consent_marketing boolean not null default false,
  created_at timestamptz not null default now(),
  primary key (creator_id, fan_id)
);

create table comments (
  id         uuid primary key default gen_random_uuid(),
  post_id    uuid not null references posts(id) on delete cascade,
  author_id  uuid not null references auth.users(id) on delete cascade,
  body       text not null check (length(body) <= 2000),
  hidden     boolean not null default false,
  created_at timestamptz not null default now()
);

create table reactions (
  post_id  uuid references posts(id) on delete cascade,
  fan_id   uuid references auth.users(id) on delete cascade,
  kind     text not null default 'like',
  primary key (post_id, fan_id, kind)
);

create table messages (
  id          uuid primary key default gen_random_uuid(),
  creator_id  uuid not null references creators(id) on delete cascade,
  fan_id      uuid not null references auth.users(id) on delete cascade,
  from_creator boolean not null,
  body        text not null,
  ai_generated boolean not null default false,
  price_cents int,                 -- message payant (optionnel)
  read_at     timestamptz,
  created_at  timestamptz not null default now()
);

create table segments (
  id         uuid primary key default gen_random_uuid(),
  creator_id uuid not null references creators(id) on delete cascade,
  name       text not null,
  rules      jsonb not null        -- ex. {"level":"vip","min_spent_cents":10000}
);

create table campaigns (
  id          uuid primary key default gen_random_uuid(),
  creator_id  uuid not null references creators(id) on delete cascade,
  segment_id  uuid references segments(id),
  channel     text not null check (channel in ('email', 'push', 'message', 'announcement')),
  subject     text,
  body        text not null,
  send_at     timestamptz,
  sent_count  int not null default 0,
  open_count  int not null default 0,
  click_count int not null default 0
);

-- ---------- Collaborations ----------
create table brand_deals (
  id            uuid primary key default gen_random_uuid(),
  creator_id    uuid not null references creators(id) on delete cascade,
  brand         text not null,
  type          text,
  status        deal_status not null default 'lead',
  fee_cents     int not null default 0,
  commission    numeric(5,4) not null default 0,
  deadline      date,
  deliverables  jsonb not null default '[]',
  contract_url  text,
  promo_code_id uuid references promo_codes(id)
);

-- ---------- Analytics first-party ----------
create table analytics_events (
  id         bigint generated always as identity primary key,
  creator_id uuid not null references creators(id) on delete cascade,
  type       text not null,        -- visit, click, subscribe, purchase, tip
  path       text,
  link_slug  text,
  utm        jsonb,
  country    char(2),
  device     text,
  amount_cents int,
  visitor_hash text,               -- hash quotidien salé, pas de cookie
  created_at timestamptz not null default now()
);
create index on analytics_events (creator_id, created_at desc);

-- =====================================================================
-- Règles d'accès
-- =====================================================================

-- L'utilisateur courant gère-t-il ce créateur ?
create or replace function is_creator_staff(c uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from creators where id = c and owner_id = auth.uid())
      or exists (select 1 from creator_team where creator_id = c and user_id = auth.uid())
$$;

-- Niveau d'accès du visiteur courant chez un créateur
create or replace function viewer_rank(c uuid) returns int
language sql stable security definer set search_path = public as $$
  select coalesce(max(level_rank(t.level)), 0)
  from subscriptions s join tiers t on t.id = s.tier_id
  where s.creator_id = c and s.fan_id = auth.uid()
    and s.status in ('trialing', 'active') and s.current_period_end > now()
$$;

-- Le visiteur peut-il voir ce contenu ?
create or replace function can_view_post(p posts) returns boolean
language sql stable security definer set search_path = public as $$
  select
    is_creator_staff(p.creator_id)
    or (
      p.publish_at <= now()
      and (p.expires_at is null or p.expires_at > now())
      and (
        (p.access = 'public' and p.price_cents is null)
        or (p.price_cents is null and viewer_rank(p.creator_id) >= level_rank(p.access))
        or exists (
          select 1 from purchases pu
          where pu.fan_id = auth.uid()
            and (pu.expires_at is null or pu.expires_at > now())
            and (pu.post_id = p.id
                 or pu.post_id in (select bundle_id from bundle_items where post_id = p.id))
        )
      )
    )
$$;

alter table creators         enable row level security;
alter table creator_domains  enable row level security;
alter table creator_team     enable row level security;
alter table links            enable row level security;
alter table tiers            enable row level security;
alter table subscriptions    enable row level security;
alter table invitations      enable row level security;
alter table posts            enable row level security;
alter table post_media       enable row level security;
alter table bundle_items     enable row level security;
alter table products         enable row level security;
alter table purchases        enable row level security;
alter table tips             enable row level security;
alter table events           enable row level security;
alter table promo_codes      enable row level security;
alter table follows          enable row level security;
alter table comments         enable row level security;
alter table reactions        enable row level security;
alter table messages         enable row level security;
alter table segments         enable row level security;
alter table campaigns        enable row level security;
alter table brand_deals      enable row level security;
alter table analytics_events enable row level security;

-- Profil, liens, paliers, produits, événements et codes promo : lecture publique, écriture par l'équipe
create policy creators_read  on creators for select using (true);
create policy creators_write on creators for update using (is_creator_staff(id));
create policy creators_insert on creators for insert with check (owner_id = auth.uid());

create policy links_read  on links for select using (true);
create policy links_write on links for all using (is_creator_staff(creator_id)) with check (is_creator_staff(creator_id));
create policy tiers_read  on tiers for select using (true);
create policy tiers_write on tiers for all using (is_creator_staff(creator_id)) with check (is_creator_staff(creator_id));
create policy products_read  on products for select using (active or is_creator_staff(creator_id));
create policy products_write on products for all using (is_creator_staff(creator_id)) with check (is_creator_staff(creator_id));
create policy events_read  on events for select using (true);
create policy events_write on events for all using (is_creator_staff(creator_id)) with check (is_creator_staff(creator_id));
create policy promos_read  on promo_codes for select using (true);
create policy promos_write on promo_codes for all using (is_creator_staff(creator_id)) with check (is_creator_staff(creator_id));

create policy domains_staff on creator_domains for all using (is_creator_staff(creator_id)) with check (is_creator_staff(creator_id));
create policy team_staff    on creator_team for select using (is_creator_staff(creator_id));

-- Contenus : la liste (titre, niveau, prix) est visible pour afficher les cartes verrouillées ;
-- les médias ne sont lisibles que si can_view_post() est vrai.
create policy posts_read  on posts for select using (publish_at <= now() or is_creator_staff(creator_id));
create policy posts_write on posts for all using (is_creator_staff(creator_id)) with check (is_creator_staff(creator_id));
create policy media_read  on post_media for select using (
  exists (select 1 from posts p where p.id = post_id and can_view_post(p))
);
create policy media_write on post_media for all
  using (exists (select 1 from posts p where p.id = post_id and is_creator_staff(p.creator_id)))
  with check (exists (select 1 from posts p where p.id = post_id and is_creator_staff(p.creator_id)));
create policy bundle_read on bundle_items for select using (true);

-- Abonnements, achats, tips : le fan voit les siens, le créateur voit ceux de son univers.
-- Les écritures passent uniquement par les webhooks Stripe (clé service, hors RLS).
create policy subs_read      on subscriptions for select using (fan_id = auth.uid() or is_creator_staff(creator_id));
create policy purchases_read on purchases     for select using (fan_id = auth.uid() or is_creator_staff(creator_id));
create policy tips_read      on tips          for select using (fan_id = auth.uid() or is_creator_staff(creator_id));

create policy invites_fan   on invitations for insert with check (fan_id = auth.uid());
create policy invites_read  on invitations for select using (fan_id = auth.uid() or is_creator_staff(creator_id));
create policy invites_staff on invitations for update using (is_creator_staff(creator_id));

-- Communauté
create policy follows_self  on follows for all using (fan_id = auth.uid()) with check (fan_id = auth.uid());
create policy follows_staff on follows for select using (is_creator_staff(creator_id));

create policy comments_read on comments for select using (
  exists (select 1 from posts p where p.id = post_id and can_view_post(p)) and (not hidden or author_id = auth.uid())
);
create policy comments_write on comments for insert with check (
  author_id = auth.uid() and exists (select 1 from posts p where p.id = post_id and can_view_post(p))
);
create policy comments_moderate on comments for update using (
  exists (select 1 from posts p where p.id = post_id and is_creator_staff(p.creator_id))
);

create policy reactions_self on reactions for all using (fan_id = auth.uid()) with check (fan_id = auth.uid());
create policy reactions_read on reactions for select using (true);

create policy messages_read on messages for select using (fan_id = auth.uid() or is_creator_staff(creator_id));
create policy messages_fan  on messages for insert with check (fan_id = auth.uid() and not from_creator);
create policy messages_staff on messages for insert with check (is_creator_staff(creator_id) and from_creator);

-- Outils pro : équipe du créateur uniquement
create policy segments_staff  on segments    for all using (is_creator_staff(creator_id)) with check (is_creator_staff(creator_id));
create policy campaigns_staff on campaigns   for all using (is_creator_staff(creator_id)) with check (is_creator_staff(creator_id));
create policy deals_staff     on brand_deals for all using (is_creator_staff(creator_id)) with check (is_creator_staff(creator_id));
create policy analytics_staff on analytics_events for select using (is_creator_staff(creator_id));
-- Les événements analytics sont insérés par l'Edge (clé service).
