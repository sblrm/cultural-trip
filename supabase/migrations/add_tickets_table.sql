-- Create tickets table for managing user ticket purchases
create table public.tickets (
    id bigint primary key generated always as identity,
    user_id uuid references auth.users(id) on delete cascade not null,
    destination_id bigint references public.destinations(id) on delete cascade not null,
    quantity integer not null,
    total_price numeric(10,2) not null,
    visit_date date not null,
    booking_name text not null,
    booking_email text not null,
    booking_phone text not null,
    status text not null default 'confirmed',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable row level security
alter table public.tickets enable row level security;

-- Tickets are only viewable by the owner
create policy "Tickets are viewable by owner only"
on public.tickets for select
to authenticated
using (auth.uid() = user_id);

-- Tickets can only be inserted by the owner
create policy "Tickets can only be inserted by owner"
on public.tickets for insert
to authenticated
with check (auth.uid() = user_id);

-- Create updated_at trigger
create trigger handle_updated_at
    before update on public.tickets
    for each row
    execute function public.handle_updated_at();

-- Create index for better query performance
create index tickets_user_id_idx on public.tickets(user_id);
create index tickets_destination_id_idx on public.tickets(destination_id);