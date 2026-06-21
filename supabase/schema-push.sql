-- Tabela para armazenar subscriptions de push notification por dispositivo
create table if not exists public.push_subscriptions (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references auth.users on delete cascade not null,
  endpoint   text not null,
  p256dh     text not null,
  auth_key   text not null,
  created_at timestamptz default now(),
  constraint push_subscriptions_endpoint_key unique (endpoint)
);

alter table public.push_subscriptions enable row level security;

create policy "Usuária gerencia suas subscriptions"
  on public.push_subscriptions for all
  using (auth.uid() = user_id);
