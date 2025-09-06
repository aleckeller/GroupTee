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

-- Allow admins to insert assignments (they can assign players to tee times)
create policy "Admins can insert assignments" on assignments 
for insert to authenticated 
with check (
  exists (
    select 1 from memberships 
    where user_id = auth.uid() 
    and role = 'admin'
  )
);

-- Allow admins to update assignments (they can modify assignments)
create policy "Admins can update assignments" on assignments 
for update to authenticated 
using (
  exists (
    select 1 from memberships 
    where user_id = auth.uid() 
    and role = 'admin'
  )
)
with check (
  exists (
    select 1 from memberships 
    where user_id = auth.uid() 
    and role = 'admin'
  )
);

-- Allow admins to delete assignments (they can remove players from tee times)
create policy "Admins can delete assignments" on assignments 
for delete to authenticated 
using (
  exists (
    select 1 from memberships 
    where user_id = auth.uid() 
    and role = 'admin'
  )
);
create policy "Authenticated read" on trades for select to authenticated using (true);
create policy "Users can read their own notifications" on notifications for select to authenticated using (auth.uid() = user_id);
create policy "Users can update their own notifications" on notifications for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can delete their own notifications" on notifications for delete to authenticated using (auth.uid() = user_id);

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

-- Function to create notification when user is added to tee time
create or replace function public.notify_tee_time_assignment()
returns trigger as $$
declare
  tee_time_info record;
  message text;
begin
  -- Get tee time details
  select 
    tt.tee_date,
    tt.tee_time,
    w.start_date,
    w.end_date
  into tee_time_info
  from tee_times tt
  join weekends w on tt.weekend_id = w.id
  where tt.id = new.tee_time_id;
  
  -- Create notification message
  message := 'You have been added to a tee time on ' || 
             to_char(tee_time_info.tee_date, 'Mon DD, YYYY') || 
             ' at ' || 
             to_char(tee_time_info.tee_time, 'HH24:MI') || 
             ' for the weekend of ' ||
             to_char(tee_time_info.start_date, 'Mon DD') || 
             ' - ' || 
             to_char(tee_time_info.end_date, 'Mon DD, YYYY');
  
  -- Insert notification
  insert into notifications (user_id, message)
  values (new.user_id, message);
  
  return new;
end;
$$ language plpgsql security definer;

-- Function to create notification when user is removed from tee time
create or replace function public.notify_tee_time_removal()
returns trigger as $$
declare
  tee_time_info record;
  message text;
begin
  -- Get tee time details
  select 
    tt.tee_date,
    tt.tee_time,
    w.start_date,
    w.end_date
  into tee_time_info
  from tee_times tt
  join weekends w on tt.weekend_id = w.id
  where tt.id = old.tee_time_id;
  
  -- Create notification message
  message := 'You have been removed from a tee time on ' || 
             to_char(tee_time_info.tee_date, 'Mon DD, YYYY') || 
             ' at ' || 
             to_char(tee_time_info.tee_time, 'HH24:MI') || 
             ' for the weekend of ' ||
             to_char(tee_time_info.start_date, 'Mon DD') || 
             ' - ' || 
             to_char(tee_time_info.end_date, 'Mon DD, YYYY');
  
  -- Insert notification
  insert into notifications (user_id, message)
  values (old.user_id, message);
  
  return old;
end;
$$ language plpgsql security definer;

-- Triggers for assignment notifications
drop trigger if exists on_assignment_created on assignments;
create trigger on_assignment_created
  after insert on assignments
  for each row execute procedure public.notify_tee_time_assignment();

drop trigger if exists on_assignment_deleted on assignments;
create trigger on_assignment_deleted
  after delete on assignments
  for each row execute procedure public.notify_tee_time_removal();
