-- Enable PostGIS extension for geospatial features
create extension if not exists postgis;

-- Create custom types
create type hours_type as (
    open text,
    close text
);

-- Create tables
create table public.destinations (
    id bigint primary key generated always as identity,
    name text not null,
    city text not null,
    province text not null,
    type text not null,
    latitude double precision not null,
    longitude double precision not null,
    hours hours_type not null,
    duration integer not null,
    description text not null,
    image text not null,
    price numeric(10,2) not null,
    rating numeric(2,1) not null,
    transportation text[] not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    location geography(Point, 4326) generated always as (st_makepoint(longitude, latitude)::geography) stored
);

-- Enable row level security
alter table public.destinations enable row level security;

-- Create plans table for trip planning
create table public.plans (
    id bigint primary key generated always as identity,
    user_id uuid references auth.users(id) on delete cascade not null,
    name text not null,
    start_date date not null,
    end_date date not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable row level security
alter table public.plans enable row level security;

-- Create plan_destinations for managing destinations in a plan
create table public.plan_destinations (
    id bigint primary key generated always as identity,
    plan_id bigint references public.plans(id) on delete cascade not null,
    destination_id bigint references public.destinations(id) on delete cascade not null,
    visit_date date not null,
    visit_order integer not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(plan_id, destination_id)
);

-- Enable row level security
alter table public.plan_destinations enable row level security;

-- Create user_profiles for additional user information
create table public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    username text unique not null,
    full_name text,
    avatar_url text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable row level security
alter table public.profiles enable row level security;

-- Set up Row Level Security (RLS) policies

-- Destinations are readable by everyone
create policy "Destinations are viewable by everyone"
on public.destinations for select
to authenticated, anon
using (true);

-- Plans are only viewable by the owner
create policy "Plans are viewable by owner only"
on public.plans for select
to authenticated
using (auth.uid() = user_id);

-- Plan destinations are only viewable by the plan owner
create policy "Plan destinations are viewable by plan owner only"
on public.plan_destinations for select
to authenticated
using (
    exists (
        select 1 from public.plans
        where id = plan_destinations.plan_id
        and user_id = auth.uid()
    )
);

-- Profiles are viewable by everyone
create policy "Profiles are viewable by everyone"
on public.profiles for select
to authenticated, anon
using (true);

-- Profiles can only be updated by the owner
create policy "Profiles can only be updated by owner"
on public.profiles for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

-- Create functions and triggers for updated_at
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Add updated_at triggers to all tables
create trigger handle_updated_at
    before update on public.destinations
    for each row
    execute function public.handle_updated_at();

create trigger handle_updated_at
    before update on public.plans
    for each row
    execute function public.handle_updated_at();

create trigger handle_updated_at
    before update on public.plan_destinations
    for each row
    execute function public.handle_updated_at();

create trigger handle_updated_at
    before update on public.profiles
    for each row
    execute function public.handle_updated_at();

-- Create indexes for better query performance
create index destinations_location_idx on public.destinations using gist(location);
create index plans_user_id_idx on public.plans(user_id);
create index plan_destinations_plan_id_idx on public.plan_destinations(plan_id);
create index plan_destinations_destination_id_idx on public.plan_destinations(destination_id);