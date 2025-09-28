-- Bookings table
create table if not exists public.bookings (
  id bigint primary key generated always as identity,
  user_id uuid references auth.users(id) on delete cascade not null,
  destination_id bigint references public.destinations(id) on delete cascade not null,
  booking_date date not null,
  quantity integer not null default 1,
  total_price numeric(10,2) not null,
  status text not null default 'confirmed',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.bookings enable row level security;

create policy if not exists "Bookings are viewable by owner only"
on public.bookings for select
to authenticated
using (auth.uid() = user_id);

create policy if not exists "Bookings can only be inserted by owner"
on public.bookings for insert
to authenticated
with check (auth.uid() = user_id);

create trigger handle_updated_at
  before update on public.bookings
  for each row
  execute function public.handle_updated_at();

create index if not exists bookings_user_id_idx on public.bookings(user_id);
create index if not exists bookings_destination_id_idx on public.bookings(destination_id);

-- Purchases table
create table if not exists public.purchases (
  id bigint primary key generated always as identity,
  user_id uuid references auth.users(id) on delete cascade not null,
  ticket_id bigint references public.tickets(id) on delete set null,
  amount numeric(10,2) not null,
  payment_method text,
  status text not null default 'paid',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.purchases enable row level security;

create policy if not exists "Purchases are viewable by owner only"
on public.purchases for select
to authenticated
using (auth.uid() = user_id);

create policy if not exists "Purchases can only be inserted by owner"
on public.purchases for insert
to authenticated
with check (auth.uid() = user_id);

create trigger handle_updated_at
  before update on public.purchases
  for each row
  execute function public.handle_updated_at();

create index if not exists purchases_user_id_idx on public.purchases(user_id);
create index if not exists purchases_ticket_id_idx on public.purchases(ticket_id);

-- Refunds table
create table if not exists public.refunds (
  id bigint primary key generated always as identity,
  user_id uuid references auth.users(id) on delete cascade not null,
  ticket_id bigint references public.tickets(id) on delete set null,
  reason text,
  status text not null default 'pending',
  requested_at timestamp with time zone default timezone('utc'::text, now()) not null,
  processed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.refunds enable row level security;

create policy if not exists "Refunds are viewable by owner only"
on public.refunds for select
to authenticated
using (auth.uid() = user_id);

create policy if not exists "Refunds can only be inserted by owner"
on public.refunds for insert
to authenticated
with check (auth.uid() = user_id);

create trigger handle_updated_at
  before update on public.refunds
  for each row
  execute function public.handle_updated_at();

create index if not exists refunds_user_id_idx on public.refunds(user_id);
create index if not exists refunds_ticket_id_idx on public.refunds(ticket_id);

-- Users view to satisfy public.users requirement while leveraging existing profiles
create or replace view public.users as
select 
  u.id,
  u.email,
  p.username,
  p.full_name,
  p.avatar_url,
  p.created_at,
  p.updated_at
from auth.users u
left join public.profiles p on p.id = u.id;
