-- Grant service_role access to tables needed by ETL pipeline
-- The service_role bypasses RLS but still needs table-level grants

grant select on public.clubs to service_role;
grant select on public.groups to service_role;
grant select on public.memberships to service_role;
grant select on public.profiles to service_role;
grant select on public.invitations to service_role;
grant select, insert on public.weekends to service_role;
grant select, insert, update on public.tee_times to service_role;
grant insert on public.external_tee_sheets to service_role;
