-- GroupTee Schema
-- Golf weekend tee time management with hierarchical admin system

--------------------------------------------------------------------------------
-- TABLES
--------------------------------------------------------------------------------

create table clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website_url text,
  scraper_type text,
  created_at timestamptz default now()
);

create table profiles (
  id uuid primary key,
  full_name text,
  email text,
  normalized_name text generated always as (lower(trim(regexp_replace(full_name, '\s+', ' ', 'g')))) stored,
  created_at timestamptz default now()
);

create table groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  club_id uuid references clubs(id) on delete set null,
  created_at timestamptz default now()
);

create table memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  group_id uuid references groups(id) on delete cascade,
  role text check (role in ('member', 'admin', 'guest')) default 'guest',
  is_primary boolean default false,
  created_at timestamptz default now()
);

create table weekends (
  id uuid primary key default gen_random_uuid(),
  start_date date not null,
  end_date date not null,
  created_at timestamptz default now()
);

create table tee_times (
  id uuid primary key default gen_random_uuid(),
  weekend_id uuid references weekends(id) on delete cascade,
  tee_date date not null,
  tee_time time not null,
  group_id uuid references groups(id) on delete cascade,
  max_players integer default 4,
  created_at timestamptz default now(),
  unique (weekend_id, tee_date, tee_time, group_id)
);

create table interests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  interest_date date not null,
  wants_to_play boolean,
  time_preference text,
  transportation text check (transportation in ('walking', 'riding')),
  partners jsonb,
  guest_count integer default 0,
  notes text,
  created_at timestamptz default now(),
  unique (user_id, interest_date)
);

create table sysadmins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null unique,
  created_at timestamptz default now(),
  created_by uuid references profiles(id) on delete set null
);

create table club_admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  club_id uuid references clubs(id) on delete cascade not null,
  created_at timestamptz default now(),
  created_by uuid references profiles(id) on delete set null,
  unique(user_id, club_id)
);

create table invitations (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  invitation_type text not null check (invitation_type in ('club_admin', 'group_member')),
  club_id uuid references clubs(id) on delete cascade,
  group_id uuid references groups(id) on delete cascade,
  target_role text check (target_role in ('member', 'admin', 'guest')) default 'member',
  invited_email text,
  display_name text,
  created_by uuid references profiles(id) on delete set null not null,
  claimed_by uuid references profiles(id) on delete set null,
  claimed_at timestamptz,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  constraint valid_invitation check (
    (invitation_type = 'club_admin' and club_id is not null and group_id is null) or
    (invitation_type = 'group_member' and group_id is not null)
  )
);

create table assignments (
  id uuid primary key default gen_random_uuid(),
  weekend_id uuid references weekends(id) on delete cascade,
  user_id uuid references profiles(id) on delete cascade,
  tee_time_id uuid references tee_times(id) on delete cascade,
  invitation_id uuid references invitations(id) on delete cascade,
  guest_names text[],
  created_at timestamptz default now(),
  constraint assignment_has_user_or_invitation check (user_id is not null or invitation_id is not null)
);

create table trades (
  id uuid primary key default gen_random_uuid(),
  weekend_id uuid references weekends(id) on delete cascade,
  from_group_id uuid references groups(id) on delete cascade,
  to_group_id uuid references groups(id) on delete cascade,
  from_tee_time_id uuid references tee_times(id) on delete cascade,
  to_tee_time_id uuid references tee_times(id) on delete cascade,
  initiated_by uuid references profiles(id) on delete cascade,
  status text check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  created_at timestamptz default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  message text not null,
  read boolean default false,
  created_at timestamptz default now()
);

create table external_tee_sheets (
  id uuid primary key default gen_random_uuid(),
  club_id uuid references clubs(id),
  scraped_date date not null,
  scraped_at timestamptz default now(),
  raw_data jsonb not null
);

--------------------------------------------------------------------------------
-- INDEXES
--------------------------------------------------------------------------------

create index idx_groups_club_id on groups(club_id);
create index idx_memberships_primary on memberships(user_id) where is_primary = true;
create index idx_sysadmins_user_id on sysadmins(user_id);
create index idx_club_admins_user_id on club_admins(user_id);
create index idx_club_admins_club_id on club_admins(club_id);
create index idx_invitations_code on invitations(code);
create index idx_invitations_expires_at on invitations(expires_at);
create index idx_assignments_invitation on assignments(invitation_id) where invitation_id is not null;
create index idx_external_tee_sheets_date on external_tee_sheets(scraped_date);
create index idx_external_tee_sheets_club_id on external_tee_sheets(club_id);

--------------------------------------------------------------------------------
-- ROW LEVEL SECURITY
--------------------------------------------------------------------------------

alter table clubs enable row level security;
alter table profiles enable row level security;
alter table groups enable row level security;
alter table memberships enable row level security;
alter table weekends enable row level security;
alter table tee_times enable row level security;
alter table interests enable row level security;
alter table sysadmins enable row level security;
alter table club_admins enable row level security;
alter table invitations enable row level security;
alter table assignments enable row level security;
alter table trades enable row level security;
alter table notifications enable row level security;
alter table external_tee_sheets enable row level security;

--------------------------------------------------------------------------------
-- HELPER FUNCTIONS
--------------------------------------------------------------------------------

-- Check if current user is any kind of admin (group-level)
create function is_admin() returns boolean as $$
  select exists (
    select 1 from memberships where user_id = auth.uid() and role = 'admin'
  )
$$ language sql security definer stable;

-- Check if current user is a sysadmin
create function is_sysadmin() returns boolean as $$
  select exists (
    select 1 from sysadmins where user_id = auth.uid()
  )
$$ language sql security definer stable;

-- Check if current user is a club admin for a specific club
create function is_club_admin(target_club_id uuid) returns boolean as $$
  select exists (
    select 1 from club_admins where user_id = auth.uid() and club_id = target_club_id
  )
$$ language sql security definer stable;

-- Check if current user is a group admin for a specific group
create function is_group_admin(target_group_id uuid) returns boolean as $$
  select exists (
    select 1 from memberships
    where user_id = auth.uid()
    and group_id = target_group_id
    and role = 'admin'
  )
$$ language sql security definer stable;

-- Generate random 6-character invite code (excludes confusing chars: I, O, 0, 1)
create function generate_invite_code() returns text as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i integer;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$ language plpgsql volatile;

--------------------------------------------------------------------------------
-- RLS POLICIES
--------------------------------------------------------------------------------

-- Clubs
create policy "authenticated read" on clubs for select to authenticated using (true);
create policy "sysadmin_insert" on clubs for insert to authenticated with check (is_sysadmin());
create policy "sysadmin_update" on clubs for update to authenticated using (is_sysadmin()) with check (is_sysadmin());
create policy "sysadmin_delete" on clubs for delete to authenticated using (is_sysadmin());

-- Profiles
create policy "authenticated read" on profiles for select to authenticated using (true);
create policy "self update" on profiles for update to authenticated using (auth.uid() = id);
create policy "self insert" on profiles for insert to authenticated with check (auth.uid() = id);
create policy "service role insert" on profiles for insert to service_role with check (true);

-- Groups
create policy "authenticated read" on groups for select to authenticated using (true);
create policy "admin_insert" on groups for insert to authenticated with check (is_sysadmin() or is_club_admin(club_id));
create policy "admin_update" on groups for update to authenticated using (is_sysadmin() or is_club_admin(club_id)) with check (is_sysadmin() or is_club_admin(club_id));
create policy "admin_delete" on groups for delete to authenticated using (is_sysadmin() or is_club_admin(club_id));

-- Memberships
create policy "authenticated read" on memberships for select to authenticated using (true);
create policy "self update" on memberships for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admin_insert" on memberships for insert to authenticated with check (
  is_sysadmin() or
  is_club_admin((select club_id from groups where id = group_id)) or
  is_group_admin(group_id)
);
create policy "admin_update" on memberships for update to authenticated
  using (
    is_sysadmin() or
    is_club_admin((select club_id from groups where id = group_id)) or
    (is_group_admin(group_id) and user_id != auth.uid())
  )
  with check (
    is_sysadmin() or
    is_club_admin((select club_id from groups where id = group_id)) or
    (is_group_admin(group_id) and user_id != auth.uid())
  );
create policy "admin_delete" on memberships for delete to authenticated using (
  is_sysadmin() or
  is_club_admin((select club_id from groups where id = group_id)) or
  (is_group_admin(group_id) and user_id != auth.uid())
);

-- Weekends
create policy "authenticated read" on weekends for select to authenticated using (true);

-- Tee Times
create policy "authenticated read" on tee_times for select to authenticated using (true);
create policy "group_admin_delete" on tee_times for delete to authenticated using (
  is_group_admin(group_id) or
  is_club_admin((select club_id from groups where id = group_id)) or
  is_sysadmin()
);

-- Interests
create policy "self manage" on interests for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "admin read group" on interests for select to authenticated using (
  exists (
    select 1 from memberships m1
    join memberships m2 on m1.group_id = m2.group_id
    where m1.user_id = auth.uid() and m1.role = 'admin' and m2.user_id = interests.user_id
  )
);

-- Sysadmins
create policy "sysadmin_select" on sysadmins for select to authenticated using (is_sysadmin() or user_id = auth.uid());
create policy "sysadmin_insert" on sysadmins for insert to authenticated with check (is_sysadmin());
create policy "sysadmin_delete" on sysadmins for delete to authenticated using (is_sysadmin() and user_id != auth.uid());

-- Club Admins
create policy "club_admin_select" on club_admins for select to authenticated using (is_sysadmin() or user_id = auth.uid());
create policy "club_admin_insert" on club_admins for insert to authenticated with check (is_sysadmin());
create policy "club_admin_delete" on club_admins for delete to authenticated using (is_sysadmin());

-- Invitations
create policy "invitation_select" on invitations for select to authenticated using (
  is_sysadmin() or
  created_by = auth.uid() or
  (invitation_type = 'club_admin' and is_sysadmin()) or
  (invitation_type = 'group_member' and (
    is_club_admin((select club_id from groups where id = group_id)) or
    is_group_admin(group_id)
  ))
);
create policy "invitation_insert" on invitations for insert to authenticated with check (
  (invitation_type = 'club_admin' and is_sysadmin()) or
  (invitation_type = 'group_member' and (
    is_sysadmin() or
    is_club_admin((select club_id from groups where id = group_id)) or
    is_group_admin(group_id)
  ))
);
create policy "invitation_delete" on invitations for delete to authenticated using (is_sysadmin() or created_by = auth.uid());
create policy "invitation_update" on invitations for update to authenticated using (
  is_sysadmin() or
  created_by = auth.uid() or
  (invitation_type = 'group_member' and (
    is_club_admin((select club_id from groups where id = group_id)) or
    is_group_admin(group_id)
  ))
);

-- Assignments
create policy "authenticated read" on assignments for select to authenticated using (true);
create policy "admin manage" on assignments for all to authenticated using (is_admin()) with check (is_admin());

-- Trades
create policy "authenticated read" on trades for select to authenticated using (true);

-- Notifications
create policy "self manage" on notifications for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- External Tee Sheets
create policy "admin read" on external_tee_sheets for select to authenticated using (is_admin());
create policy "service role insert" on external_tee_sheets for insert to service_role with check (true);

--------------------------------------------------------------------------------
-- GRANTS
--------------------------------------------------------------------------------

grant usage on schema public to postgres, anon, authenticated, service_role;
grant all on public.profiles to postgres, anon, authenticated, service_role;

--------------------------------------------------------------------------------
-- TRIGGERS & FUNCTIONS
--------------------------------------------------------------------------------

-- Create profile on signup and auto-claim matching invitations
create function handle_new_user() returns trigger as $$
declare
  inv_record record;
begin
  -- Create profile with email
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email);

  -- Auto-claim any unclaimed invitations with matching email
  if new.email is not null then
    for inv_record in
      select * from invitations
      where lower(invited_email) = lower(new.email)
        and claimed_by is null
        and invitation_type = 'group_member'
    loop
      -- Create membership
      insert into memberships (user_id, group_id, role)
      values (new.id, inv_record.group_id, coalesce(inv_record.target_role, 'member'))
      on conflict do nothing;

      -- Transfer any assignments from invitation to real user
      update assignments
      set user_id = new.id, invitation_id = null
      where invitation_id = inv_record.id;

      -- Mark invitation as claimed
      update invitations
      set claimed_by = new.id, claimed_at = now()
      where id = inv_record.id;
    end loop;
  end if;

  return new;
end;
$$ language plpgsql security definer
set search_path = public;

-- Set function owner to postgres so SECURITY DEFINER bypasses RLS
alter function handle_new_user() owner to postgres;

create trigger on_auth_user_created after insert on auth.users
  for each row execute procedure handle_new_user();

-- Notify on assignment changes
-- Handles cascading deletes from tee_times by checking if tee_time info exists
create function notify_assignment_change() returns trigger as $$
declare
  info record;
  action text;
  target_user uuid;
begin
  if tg_op = 'DELETE' then
    action := 'removed from';
    target_user := old.user_id;
    select tt.tee_date, tt.tee_time, w.start_date, w.end_date into info
    from tee_times tt join weekends w on tt.weekend_id = w.id where tt.id = old.tee_time_id;
  else
    action := 'added to';
    target_user := new.user_id;
    select tt.tee_date, tt.tee_time, w.start_date, w.end_date into info
    from tee_times tt join weekends w on tt.weekend_id = w.id where tt.id = new.tee_time_id;
  end if;

  -- Only notify if there's a real user (not invitation-based assignment)
  -- AND if we could find the tee time info (not a cascade delete from tee_times)
  if target_user is not null and info.tee_date is not null then
    insert into notifications (user_id, message) values (
      target_user,
      'You have been ' || action || ' a tee time on ' ||
      to_char(info.tee_date, 'Mon DD, YYYY') || ' at ' || to_char(info.tee_time, 'HH24:MI') ||
      ' for the weekend of ' || to_char(info.start_date, 'Mon DD') || ' - ' || to_char(info.end_date, 'Mon DD, YYYY')
    );
  end if;

  return coalesce(new, old);
end;
$$ language plpgsql security definer;

create trigger on_assignment_change after insert or delete on assignments
  for each row execute procedure notify_assignment_change();

-- Validate assignment capacity
create function validate_assignment_capacity() returns trigger as $$
declare
  max_cap integer;
  current_spots integer;
  guest_count integer;
  td date;
begin
  select tt.max_players, tt.tee_date into max_cap, td from tee_times tt where tt.id = new.tee_time_id;

  select coalesce(sum(1 + coalesce(i.guest_count, 0)), 0) into current_spots
  from assignments a
  left join interests i on i.user_id = a.user_id and i.interest_date = td
  where a.tee_time_id = new.tee_time_id;

  select coalesce(i.guest_count, 0) into guest_count
  from interests i where i.user_id = new.user_id and i.interest_date = td;

  if current_spots + 1 + guest_count > max_cap then
    raise exception 'Not enough space in tee time. Available: %, Needed: %',
      max_cap - current_spots, 1 + guest_count;
  end if;

  return new;
end;
$$ language plpgsql security definer;

create trigger validate_assignment_capacity before insert on assignments
  for each row execute procedure validate_assignment_capacity();

-- Claim an invitation by code
create function claim_invitation(invite_code text) returns jsonb as $$
declare
  inv record;
begin
  -- Find and lock the invitation
  select * into inv from invitations
  where code = upper(trim(invite_code))
    and claimed_by is null
    and expires_at > now()
  for update;

  if inv is null then
    return jsonb_build_object('success', false, 'error', 'Invalid or expired invitation code');
  end if;

  -- Mark as claimed
  update invitations
  set claimed_by = auth.uid(), claimed_at = now()
  where id = inv.id;

  -- Create the appropriate association
  if inv.invitation_type = 'club_admin' then
    insert into club_admins (user_id, club_id, created_by)
    values (auth.uid(), inv.club_id, inv.created_by)
    on conflict (user_id, club_id) do nothing;

    return jsonb_build_object(
      'success', true,
      'type', 'club_admin',
      'club_id', inv.club_id
    );
  else
    insert into memberships (user_id, group_id, role)
    values (auth.uid(), inv.group_id, inv.target_role)
    on conflict do nothing;

    return jsonb_build_object(
      'success', true,
      'type', 'group_member',
      'group_id', inv.group_id,
      'role', inv.target_role
    );
  end if;
end;
$$ language plpgsql security definer;

-- Link invitation to existing user (admin action)
create function link_invitation_to_user(invite_id uuid, target_user_id uuid) returns jsonb as $$
declare
  inv record;
begin
  select * into inv from invitations where id = invite_id and claimed_by is null;

  if inv is null then
    return jsonb_build_object('success', false, 'error', 'Invitation not found or already claimed');
  end if;

  -- Create the real membership
  insert into memberships (user_id, group_id, role)
  values (target_user_id, inv.group_id, coalesce(inv.target_role, 'member'))
  on conflict do nothing;

  -- Transfer any assignments to the real user
  update assignments
  set user_id = target_user_id, invitation_id = null
  where invitation_id = invite_id;

  -- Mark invitation as claimed
  update invitations
  set claimed_by = target_user_id, claimed_at = now()
  where id = invite_id;

  return jsonb_build_object('success', true, 'membership_created', true);
end;
$$ language plpgsql security definer;

-- Validate invite code (public, no auth required)
-- Returns display_name and invited_email if valid, error if not
create function validate_invite_code(invite_code text) returns jsonb as $$
declare
  inv record;
begin
  select id, display_name, invited_email, expires_at, claimed_by
  into inv
  from invitations
  where code = upper(trim(invite_code));

  if inv is null then
    return jsonb_build_object('valid', false, 'error', 'Invalid invite code');
  end if;

  if inv.claimed_by is not null then
    return jsonb_build_object('valid', false, 'error', 'This invite code has already been used');
  end if;

  if inv.expires_at < now() then
    return jsonb_build_object('valid', false, 'error', 'This invite code has expired');
  end if;

  return jsonb_build_object('valid', true, 'display_name', inv.display_name, 'invited_email', inv.invited_email);
end;
$$ language plpgsql security definer;
