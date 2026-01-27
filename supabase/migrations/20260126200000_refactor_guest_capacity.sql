-- Refactor: use assignments.guest_names as single source of truth for guest capacity
-- Previously the trigger joined to interests.guest_count which could diverge from
-- the actual guest_names stored on assignments.

create or replace function validate_assignment_capacity() returns trigger as $$
declare
  max_cap integer;
  current_spots integer;
  new_guest_count integer;
begin
  select tt.max_players into max_cap
  from tee_times tt
  where tt.id = new.tee_time_id;

  -- Count existing spots from assignments (each assignment = 1 player + their guests)
  select coalesce(sum(1 + coalesce(array_length(a.guest_names, 1), 0)), 0)
  into current_spots
  from assignments a
  where a.tee_time_id = new.tee_time_id;

  -- Count guests on the new assignment being inserted
  new_guest_count := coalesce(array_length(new.guest_names, 1), 0);

  if current_spots + 1 + new_guest_count > max_cap then
    raise exception 'Not enough space in tee time. Available: %, Needed: %',
      max_cap - current_spots, 1 + new_guest_count;
  end if;

  return new;
end;
$$ language plpgsql security definer;
