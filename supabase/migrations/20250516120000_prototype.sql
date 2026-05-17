-- Prototype mode: property location + host booking status updates
alter table public.properties add column if not exists location text;

create policy bookings_update_host on public.bookings
  for update
  using (
    exists (
      select 1 from public.properties p
      where p.id = bookings.property_id and p.user_id = auth.uid()
    )
  );
