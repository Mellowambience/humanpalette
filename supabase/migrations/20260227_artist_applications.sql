-- artist_applications table for web beta onboarding
create table if not exists public.artist_applications (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null unique,
  portfolio_url text,
  medium      text,
  status      text not null default 'pending',  -- pending | approved | rejected
  notes       text,
  created_at  timestamptz not null default now()
);

-- Only service role can insert/read (web Server Action uses service role)
alter table public.artist_applications enable row level security;

-- No public access
create policy "service_role only" on public.artist_applications
  using (auth.role() = 'service_role');
