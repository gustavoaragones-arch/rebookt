-- GAR prototype: guest send tracking, host display name, booking reward code, expiry helper

alter table public.users add column if not exists full_name text;

alter table public.guests add column if not exists rebooking_sent_at timestamptz;
alter table public.guests add column if not exists gar_sent_at timestamptz;

alter table public.bookings add column if not exists reward_code_used text;

create or replace function public.expire_reward_codes()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.reward_codes
  set status = 'expired'
  where status in ('pending', 'sent')
    and expires_at is not null
    and expires_at < now();
end;
$$;
