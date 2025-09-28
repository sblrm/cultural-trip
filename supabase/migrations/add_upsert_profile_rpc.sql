-- RPC: upsert profile as current user; enforces auth.uid() = id inside function
create or replace function public.upsert_my_profile(
  p_username text,
  p_full_name text,
  p_avatar_url text
) returns public.profiles
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid := auth.uid();
  v_row public.profiles;
begin
  if v_id is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.profiles (id, username, full_name, avatar_url)
  values (v_id, p_username, p_full_name, p_avatar_url)
  on conflict (id) do update set
    username = excluded.username,
    full_name = excluded.full_name,
    avatar_url = excluded.avatar_url
  returning * into v_row;

  return v_row;
end;
$$;

grant execute on function public.upsert_my_profile(text, text, text) to authenticated;
