-- Rebookt Phase 1 schema (see DIRECT_BOOKING_ENGINE.md)

-- Host profile (1:1 with auth.users)
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text unique not null,
  created_at timestamptz default now()
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null,
  slug text unique not null,
  description text,
  base_price numeric not null,
  cleaning_fee numeric default 0,
  images text[] default '{}',
  gar_enabled boolean default false,
  gar_discount_pct numeric default 5,
  gar_trigger_delay_days integer default 5 not null,
  gar_google_business_url text,
  gar_message_tone text default 'casual',
  created_at timestamptz default now()
);

create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  guest_email text not null,
  guest_phone text,
  guest_name text,
  check_in date not null,
  check_out date not null,
  total_price numeric not null,
  status text default 'pending',
  stripe_session_id text,
  rebooking_sent_at timestamptz,
  gar_sent_at timestamptz,
  created_at timestamptz default now()
);

create table public.guests (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  email text not null,
  phone text,
  first_name text,
  last_name text,
  last_stay_date date,
  source text default 'direct',
  created_at timestamptz default now(),
  unique (property_id, email)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  guest_id uuid not null references public.guests (id) on delete cascade,
  type text not null,
  template text,
  status text default 'pending',
  sent_at timestamptz,
  created_at timestamptz default now()
);

create table public.reward_codes (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  guest_id uuid not null references public.guests (id) on delete cascade,
  code text unique not null,
  discount_pct numeric not null,
  status text default 'pending',
  sent_at timestamptz,
  redeemed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz default now()
);

create table public.blocked_dates (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id) on delete cascade,
  date date not null,
  reason text,
  unique (property_id, date)
);

create index bookings_property_checkout_idx on public.bookings (property_id, check_out);
create index guests_property_idx on public.guests (property_id);
create index blocked_dates_property_idx on public.blocked_dates (property_id, date);

-- Sync auth.users -> public.users
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do update
    set email = excluded.email;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

alter table public.users enable row level security;
alter table public.properties enable row level security;
alter table public.bookings enable row level security;
alter table public.guests enable row level security;
alter table public.messages enable row level security;
alter table public.reward_codes enable row level security;
alter table public.blocked_dates enable row level security;

-- users
create policy users_select_self on public.users
  for select using (auth.uid() = id);

create policy users_update_self on public.users
  for update using (auth.uid() = id);

-- properties: public read for booking pages; hosts manage own
create policy properties_select_public on public.properties
  for select using (true);

create policy properties_insert_owner on public.properties
  for insert with check (auth.uid() = user_id);

create policy properties_update_owner on public.properties
  for update using (auth.uid() = user_id);

create policy properties_delete_owner on public.properties
  for delete using (auth.uid() = user_id);

-- bookings: hosts read own property bookings only
create policy bookings_select_host on public.bookings
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = bookings.property_id and p.user_id = auth.uid()
    )
  );

-- guests: hosts manage guests for their properties
create policy guests_select_host on public.guests
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = guests.property_id and p.user_id = auth.uid()
    )
  );

create policy guests_insert_host on public.guests
  for insert with check (
    exists (
      select 1 from public.properties p
      where p.id = guests.property_id and p.user_id = auth.uid()
    )
  );

create policy guests_update_host on public.guests
  for update using (
    exists (
      select 1 from public.properties p
      where p.id = guests.property_id and p.user_id = auth.uid()
    )
  );

create policy guests_delete_host on public.guests
  for delete using (
    exists (
      select 1 from public.properties p
      where p.id = guests.property_id and p.user_id = auth.uid()
    )
  );

-- messages
create policy messages_select_host on public.messages
  for select using (
    exists (
      select 1
      from public.guests g
      join public.properties p on p.id = g.property_id
      where g.id = messages.guest_id and p.user_id = auth.uid()
    )
  );

create policy messages_insert_host on public.messages
  for insert with check (
    exists (
      select 1
      from public.guests g
      join public.properties p on p.id = g.property_id
      where g.id = messages.guest_id and p.user_id = auth.uid()
    )
  );

-- reward_codes
create policy reward_codes_select_host on public.reward_codes
  for select using (
    exists (
      select 1 from public.properties p
      where p.id = reward_codes.property_id and p.user_id = auth.uid()
    )
  );

create policy reward_codes_insert_host on public.reward_codes
  for insert with check (
    exists (
      select 1 from public.properties p
      where p.id = reward_codes.property_id and p.user_id = auth.uid()
    )
  );

create policy reward_codes_update_host on public.reward_codes
  for update using (
    exists (
      select 1 from public.properties p
      where p.id = reward_codes.property_id and p.user_id = auth.uid()
    )
  );

-- blocked_dates: public read for availability; hosts write
create policy blocked_dates_select_public on public.blocked_dates
  for select using (true);

create policy blocked_dates_insert_host on public.blocked_dates
  for insert with check (
    exists (
      select 1 from public.properties p
      where p.id = blocked_dates.property_id and p.user_id = auth.uid()
    )
  );

create policy blocked_dates_delete_host on public.blocked_dates
  for delete using (
    exists (
      select 1 from public.properties p
      where p.id = blocked_dates.property_id and p.user_id = auth.uid()
    )
  );
