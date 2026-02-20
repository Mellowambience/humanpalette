-- HumanPalette — Supabase Schema v0.1
-- Run this in Supabase SQL Editor to initialize the database
-- Tables: profiles, artist_profiles, collector_profiles, artworks, swipes,
--         matches, commitment_fees, messages, transactions, royalties,
--         trust_score_events, artist_flags, verification_queue

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

create type user_role as enum ('artist', 'collector', 'admin');
create type verification_status as enum ('unverified', 'pending', 'verified', 'rejected');
create type artwork_status as enum ('draft', 'active', 'sold', 'hidden');
create type use_type as enum ('personal', 'display', 'commercial');
create type swipe_action as enum ('like', 'pass', 'super_like');
create type match_status as enum ('pending', 'active', 'closed', 'ghosted');
create type commitment_fee_status as enum ('held', 'refunded', 'forfeited');
create type transaction_status as enum ('pending', 'escrowed', 'released', 'refunded', 'disputed');
create type royalty_type as enum ('primary_sale', 'commercial_license', 'resale');
create type trust_event_type as enum ('purchase_completed','chat_responded','review_left','ghosted','declined_unexplained','artist_flag','admin_adjustment');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role user_role not null,
  display_name text not null,
  bio text, avatar_url text, location text, website text,
  stripe_account_id text, stripe_customer_id text,
  is_active boolean default true,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table artist_profiles (
  id uuid primary key references profiles(id) on delete cascade,
  verification_status verification_status default 'unverified',
  verification_notes text, verified_at timestamptz,
  commercial_rate_mult numeric(4,2) default 1.25,
  accepts_commissions boolean default true,
  min_commission_price numeric(10,2),
  portfolio_tags text[],
  human_verified_badge boolean default false,
  wip_proof_urls text[],
  created_at timestamptz default now()
);

create table collector_profiles (
  id uuid primary key references profiles(id) on delete cascade,
  trust_score numeric(5,2) default 50.00,
  total_matches integer default 0, completed_purchases integer default 0,
  ghosted_count integer default 0, flagged_count integer default 0,
  commitment_multiplier numeric(4,2) default 1.00,
  budget_range_min numeric(10,2), budget_range_max numeric(10,2),
  interests text[], created_at timestamptz default now()
);

create table artworks (
  id uuid primary key default uuid_generate_v4(),
  artist_id uuid not null references profiles(id) on delete cascade,
  title text not null, description text,
  media_urls text[] not null, tags text[],
  price numeric(10,2) not null,
  status artwork_status default 'draft',
  allows_commercial boolean default false,
  commercial_price numeric(10,2),
  is_commission boolean default false,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table swipes (
  id uuid primary key default uuid_generate_v4(),
  collector_id uuid not null references profiles(id) on delete cascade,
  artwork_id uuid references artworks(id) on delete set null,
  artist_id uuid not null references profiles(id) on delete cascade,
  action swipe_action not null,
  created_at timestamptz default now(),
  unique(collector_id, artwork_id)
);

create table matches (
  id uuid primary key default uuid_generate_v4(),
  collector_id uuid not null references profiles(id) on delete cascade,
  artist_id uuid not null references profiles(id) on delete cascade,
  artwork_id uuid references artworks(id) on delete set null,
  status match_status default 'pending',
  artist_accepted boolean, chat_unlocked_at timestamptz,
  closed_at timestamptz, ghosted_at timestamptz,
  created_at timestamptz default now()
);

create table commitment_fees (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references matches(id) on delete cascade,
  collector_id uuid not null references profiles(id),
  amount_cents integer not null,
  stripe_payment_intent text,
  status commitment_fee_status default 'held',
  resolved_at timestamptz, created_at timestamptz default now()
);

create table messages (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid not null references matches(id) on delete cascade,
  sender_id uuid not null references profiles(id),
  body text not null, read_at timestamptz,
  created_at timestamptz default now()
);

create table transactions (
  id uuid primary key default uuid_generate_v4(),
  match_id uuid references matches(id),
  artwork_id uuid not null references artworks(id),
  buyer_id uuid not null references profiles(id),
  artist_id uuid not null references profiles(id),
  use_type use_type default 'personal',
  base_price_cents integer not null,
  commercial_uplift_cents integer default 0,
  platform_fee_cents integer not null,
  artist_payout_cents integer not null,
  stripe_payment_intent text, stripe_transfer_id text,
  status transaction_status default 'pending',
  escrowed_at timestamptz, released_at timestamptz,
  created_at timestamptz default now()
);

create table royalties (
  id uuid primary key default uuid_generate_v4(),
  transaction_id uuid not null references transactions(id),
  artist_id uuid not null references profiles(id),
  royalty_type royalty_type not null,
  amount_cents integer not null,
  stripe_transfer_id text, paid_at timestamptz,
  created_at timestamptz default now()
);

create table trust_score_events (
  id uuid primary key default uuid_generate_v4(),
  collector_id uuid not null references profiles(id) on delete cascade,
  event_type trust_event_type not null,
  delta numeric(5,2) not null, score_after numeric(5,2) not null,
  match_id uuid references matches(id),
  notes text, created_at timestamptz default now()
);

create table artist_flags (
  id uuid primary key default uuid_generate_v4(),
  artist_id uuid not null references profiles(id),
  collector_id uuid not null references profiles(id),
  match_id uuid references matches(id),
  reason text not null, reviewed boolean default false,
  created_at timestamptz default now(),
  unique(artist_id, collector_id, match_id)
);

create table verification_queue (
  id uuid primary key default uuid_generate_v4(),
  artist_id uuid not null references profiles(id) on delete cascade,
  submitted_at timestamptz default now(),
  reviewed_at timestamptz, reviewed_by uuid references profiles(id),
  outcome verification_status, rejection_reason text,
  proof_urls text[] not null
);

-- Indexes
create index idx_artworks_artist on artworks(artist_id);
create index idx_artworks_status on artworks(status);
create index idx_swipes_collector on swipes(collector_id);
create index idx_matches_collector on matches(collector_id);
create index idx_matches_artist on matches(artist_id);
create index idx_messages_match on messages(match_id);
create index idx_transactions_buyer on transactions(buyer_id);
create index idx_trust_events_collector on trust_score_events(collector_id);

-- RLS
alter table profiles enable row level security;
alter table artworks enable row level security;
alter table matches enable row level security;
alter table messages enable row level security;
alter table transactions enable row level security;

create policy "profiles_read_own" on profiles for select using (auth.uid() = id);
create policy "profiles_update_own" on profiles for update using (auth.uid() = id);
create policy "artworks_public_read" on artworks for select using (status = 'active');
create policy "artworks_artist_manage" on artworks for all using (auth.uid() = artist_id);
create policy "matches_participant_read" on matches for select using (auth.uid() = collector_id or auth.uid() = artist_id);
create policy "messages_participant" on messages for all using (exists (select 1 from matches m where m.id = match_id and (m.collector_id = auth.uid() or m.artist_id = auth.uid())));
create policy "transactions_participant" on transactions for select using (auth.uid() = buyer_id or auth.uid() = artist_id);

-- Functions
create or replace function handle_updated_at() returns trigger as $$ begin new.updated_at = now(); return new; end; $$ language plpgsql;
create trigger profiles_updated_at before update on profiles for each row execute function handle_updated_at();
create trigger artworks_updated_at before update on artworks for each row execute function handle_updated_at();

create or replace function recalculate_trust_score(p_collector_id uuid) returns void as $$
declare new_score numeric(5,2); new_multiplier numeric(4,2);
begin
  select coalesce(50 + sum(delta), 50) into new_score from trust_score_events where collector_id = p_collector_id;
  new_score := greatest(0, least(100, new_score));
  new_multiplier := case when new_score < 30 then 2.00 else 1.00 end;
  update collector_profiles set trust_score = new_score, commitment_multiplier = new_multiplier where id = p_collector_id;
end; $$ language plpgsql security definer;

create or replace function mark_match_ghosted(p_match_id uuid) returns void as $$
declare v_collector_id uuid;
begin
  select collector_id into v_collector_id from matches where id = p_match_id;
  update matches set status = 'ghosted', ghosted_at = now() where id = p_match_id;
  update collector_profiles set ghosted_count = ghosted_count + 1 where id = v_collector_id;
  insert into trust_score_events (collector_id, event_type, delta, score_after, match_id, notes)
  select v_collector_id, 'ghosted', -10, greatest(0, cp.trust_score - 10), p_match_id, 'Automatic ghost'
  from collector_profiles cp where cp.id = v_collector_id;
  perform recalculate_trust_score(v_collector_id);
end; $$ language plpgsql security definer;

create or replace function calculate_payout(p_base_price_cents integer, p_commercial_uplift_cents integer default 0, p_platform_fee_pct numeric default 0.075)
returns table(platform_fee_cents integer, artist_payout_cents integer) as $$
declare total integer;
begin
  total := p_base_price_cents + p_commercial_uplift_cents;
  platform_fee_cents := floor(total * p_platform_fee_pct)::integer;
  artist_payout_cents := total - platform_fee_cents;
  return next;
end; $$ language plpgsql;
