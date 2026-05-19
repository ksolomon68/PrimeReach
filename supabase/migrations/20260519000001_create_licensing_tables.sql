-- ── LICENSES ──
create table if not exists licenses (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  updated_at timestamptz default now(),

  license_key text unique not null default 'PR-' || upper(substr(md5(random()::text), 1, 8)),
  status text not null default 'pending'
    check (status in ('pending','active','suspended','transferred','cancelled')),
  tier text not null check (tier in ('starter','professional','enterprise')),
  billing_cycle text not null default 'monthly' check (billing_cycle in ('monthly','annual')),

  holder_org text not null,
  holder_contact text not null,
  holder_email text not null,
  holder_phone text,
  holder_domain text,

  agency_name text not null,
  department text,
  num_districts text,
  program_description text,
  launch_date date,

  original_owner text not null default 'EVOBRAND Concepts',
  owner_email text not null default 'ks@evobrand.net',
  is_owner_held boolean not null default true,

  monthly_rate numeric(10,2),
  annual_rate numeric(10,2),
  custom_pricing_notes text,

  notes text,
  activated_at timestamptz,
  expires_at timestamptz,
  last_payment_at timestamptz
);

-- ── LICENSE TRANSFERS ──
create table if not exists license_transfers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  license_id uuid references licenses(id) on delete cascade,

  from_org text not null,
  from_email text not null,
  to_org text not null,
  to_email text not null,
  to_contact text,
  to_phone text,

  status text not null default 'pending'
    check (status in ('pending','owner_approved','completed','rejected','cancelled')),
  transfer_reason text,
  owner_authorized boolean default false,
  owner_authorized_at timestamptz,
  completed_at timestamptz,
  admin_notes text
);

-- ── LICENSE REQUESTS ──
create table if not exists license_requests (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),

  agency_name text not null,
  department text,
  contact_name text not null,
  contact_title text,
  contact_email text not null,
  contact_phone text,
  custom_domain text,

  tier text not null check (tier in ('starter','professional','enterprise')),
  billing_pref text default 'monthly',
  num_districts text,
  launch_date date,
  program_description text,

  status text not null default 'new'
    check (status in ('new','reviewing','approved','rejected','converted')),
  converted_license_id uuid references licenses(id),
  admin_notes text
);

-- ── LICENSE EVENTS ──
create table if not exists license_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  license_id uuid references licenses(id) on delete cascade,
  event_type text not null,
  description text,
  performed_by text default 'ks@evobrand.net',
  metadata jsonb
);

-- ── RLS ──
alter table licenses enable row level security;
alter table license_transfers enable row level security;
alter table license_requests enable row level security;
alter table license_events enable row level security;

create policy "Public can submit license requests"
  on license_requests for insert to anon with check (true);

create policy "Public can submit transfer requests"
  on license_transfers for insert to anon with check (true);

create policy "Service role full access licenses"
  on licenses for all to service_role using (true);

create policy "Service role full access requests"
  on license_requests for all to service_role using (true);

create policy "Service role full access transfers"
  on license_transfers for all to service_role using (true);

create policy "Service role full access events"
  on license_events for all to service_role using (true);

-- updated_at trigger
create or replace function update_updated_at_column()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger licenses_updated_at
  before update on licenses
  for each row execute function update_updated_at_column();
