-- Basic schema for Golf Weekend Tee Times

create table if not exists profiles (
  id uuid primary key, -- Temporarily removed foreign key for development
  -- id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  created_at timestamp with time zone default now()
);

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamp with time zone default now()
);

create table if not exists memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  group_id uuid references groups(id) on delete cascade,
  role text check (role in ('member', 'admin', 'guest')) default 'guest',
  created_at timestamp with time zone default now()
);

create table if not exists weekends (
  id uuid primary key default gen_random_uuid(),
  start_date date not null,
  end_date date not null,
  created_at timestamp with time zone default now()
);

create table if not exists tee_times (
  id uuid primary key default gen_random_uuid(),
  weekend_id uuid references weekends(id) on delete cascade,
  tee_date date not null,
  tee_time time not null,
  group_id uuid references groups(id) on delete cascade,
  max_players integer default 4,
  created_at timestamp with time zone default now()
);

create table if not exists interests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  walking boolean default false,
  riding boolean default true,
  partners text,
  game_type text,
  notes text,
  created_at timestamp with time zone default now()
);

create table if not exists assignments (
  id uuid primary key default gen_random_uuid(),
  weekend_id uuid references weekends(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  tee_time_id uuid references tee_times(id) on delete cascade,
  created_at timestamp with time zone default now()
);

create table if not exists trades (
  id uuid primary key default gen_random_uuid(),
  weekend_id uuid references weekends(id) on delete cascade,
  from_group_id uuid references groups(id) on delete cascade,
  to_group_id uuid references groups(id) on delete cascade,
  from_tee_time_id uuid references tee_times(id) on delete cascade,
  to_tee_time_id uuid references tee_times(id) on delete cascade,
  initiated_by uuid references profiles(id) on delete cascade,
  status text check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  created_at timestamp with time zone default now()
);

create table if not exists notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  message text not null,
  read boolean default false,
  created_at timestamp with time zone default now()
);

-- RLS
alter table profiles enable row level security;
alter table memberships enable row level security;
alter table groups enable row level security;
alter table weekends enable row level security;
alter table tee_times enable row level security;
alter table interests enable row level security;
alter table assignments enable row level security;
alter table trades enable row level security;
alter table notifications enable row level security;

-- Basic policies (open to authenticated users for demo; tighten in prod)
create policy "Authenticated read" on profiles for select to authenticated using (true);
create policy "Self update" on profiles for update to authenticated using (auth.uid() = id);
create policy "Allow profile creation" on profiles for insert to authenticated with check (auth.uid() = id);
create policy "Allow service role profile creation" on profiles for insert to service_role with check (true);

create policy "Authenticated read" on groups for select to authenticated using (true);
create policy "Authenticated read" on memberships for select to authenticated using (true);
create policy "Authenticated read" on weekends for select to authenticated using (true);
create policy "Authenticated read" on tee_times for select to authenticated using (true);
create policy "Authenticated read/write interests" on interests for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Authenticated read" on assignments for select to authenticated using (true);
create policy "Authenticated read" on trades for select to authenticated using (true);
create policy "Authenticated read" on notifications for select to authenticated using (true);

-- Function to handle new user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

-- Grant necessary permissions for the trigger function
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on public.profiles to postgres, anon, authenticated, service_role;

-- Trigger to call handle_new_user when a new user signs up
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
