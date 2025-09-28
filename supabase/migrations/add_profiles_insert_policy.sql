-- Allow users to create their own profile rows
do $$ begin
  create policy "Profiles can only be inserted by owner"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);
exception when duplicate_object then null; end $$;
