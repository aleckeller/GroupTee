-- Push notification token storage
create table push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  token text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique(user_id, token)
);

alter table push_tokens enable row level security;

create policy "users manage own tokens"
  on push_tokens for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_push_tokens_user_id on push_tokens(user_id);

grant select, insert, update, delete on push_tokens to authenticated;
grant select, insert, update, delete on push_tokens to service_role;
