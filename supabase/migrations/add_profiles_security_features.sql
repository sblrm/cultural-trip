-- Extend profiles with additional fields and security features
alter table public.profiles
  add column if not exists gender text,
  add column if not exists birthdate date,
  add column if not exists city text,
  add column if not exists mfa_enabled boolean not null default false;

-- Update upsert_my_profile RPC to handle new optional fields
create or replace function public.upsert_my_profile(
  p_username text,
  p_full_name text,
  p_avatar_url text,
  p_gender text default null,
  p_birthdate date default null,
  p_city text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url, gender, birthdate, city)
  values (
    auth.uid(),
    p_username,
    p_full_name,
    p_avatar_url,
    p_gender,
    p_birthdate,
    p_city
  )
  on conflict (id) do update set
    username = coalesce(excluded.username, public.profiles.username),
    full_name = coalesce(excluded.full_name, public.profiles.full_name),
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    gender = coalesce(excluded.gender, public.profiles.gender),
    birthdate = coalesce(excluded.birthdate, public.profiles.birthdate),
    city = coalesce(excluded.city, public.profiles.city),
    updated_at = timezone('utc'::text, now());
end;
$$;

revoke all on function public.upsert_my_profile(text, text, text, text, date, text) from public;
grant execute on function public.upsert_my_profile(text, text, text, text, date, text) to authenticated;

-- MFA enable/disable function
create or replace function public.set_mfa_enabled(enabled boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set mfa_enabled = enabled,
      updated_at = timezone('utc'::text, now())
  where id = auth.uid();
end;
$$;

revoke all on function public.set_mfa_enabled(boolean) from public;
grant execute on function public.set_mfa_enabled(boolean) to authenticated;

-- Account deletion request table
create table if not exists public.account_deletion_requests (
  id bigserial primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  reason text,
  status text not null default 'pending', -- pending | approved | rejected | processed
  requested_at timestamp with time zone default timezone('utc'::text, now()) not null,
  processed_at timestamp with time zone
);

alter table public.account_deletion_requests enable row level security;

-- Only owner can view own deletion requests
drop policy if exists "Deletion requests viewable by owner" on public.account_deletion_requests;
create policy "Deletion requests viewable by owner"
on public.account_deletion_requests for select
to authenticated
using (auth.uid() = user_id);

-- Only owner can create a deletion request
drop policy if exists "Owner can create deletion request" on public.account_deletion_requests;
create policy "Owner can create deletion request"
on public.account_deletion_requests for insert
to authenticated
with check (auth.uid() = user_id);

-- Optional: service role can update statuses (handled outside client)

-- Triggers for updated_at on deletion requests
do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'handle_updated_at_account_deletion_requests'
  ) then
    create trigger handle_updated_at_account_deletion_requests
      before update on public.account_deletion_requests
      for each row
      execute function public.handle_updated_at();
  end if;
end $$;

-- Ensure only one pending request per user
create unique index if not exists account_deletion_requests_user_pending_idx
  on public.account_deletion_requests (user_id)
  where status = 'pending';
