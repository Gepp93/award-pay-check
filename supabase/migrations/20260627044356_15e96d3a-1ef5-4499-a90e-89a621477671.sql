create table public.user_credits (
  user_id uuid primary key references auth.users(id) on delete cascade,
  credits int not null default 0,
  updated_at timestamptz not null default now()
);

grant select on public.user_credits to authenticated;
grant all on public.user_credits to service_role;

alter table public.user_credits enable row level security;

create policy "Users read own credits"
  on public.user_credits for select to authenticated
  using (user_id = auth.uid());