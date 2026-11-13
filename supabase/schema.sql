-- WORTHSY community product submissions
-- Only the Supabase Edge Function service role may access these tables.
create table if not exists public.community_product_submissions (
  id bigint generated always as identity primary key,
  asin text not null unique check (asin ~ '^[A-Z0-9]{10}$'),
  affiliate_url text not null,
  product_name text not null,
  status text not null default 'published' check (status in ('published','duplicate','failed')),
  created_at timestamptz not null default now()
);
alter table public.community_product_submissions enable row level security;

create table if not exists public.community_submit_events (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  created_at timestamptz not null default now()
);
create index if not exists community_submit_events_ip_created_idx
  on public.community_submit_events (ip_hash, created_at desc);
alter table public.community_submit_events enable row level security;
