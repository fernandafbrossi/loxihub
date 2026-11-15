-- =============================================
-- Canons do universo (fatos estabelecidos)
-- Rodar no Supabase SQL Editor
-- =============================================

create table if not exists public.canons (
  id            uuid default gen_random_uuid() primary key,
  universo_id   uuid references public.universos(id) on delete cascade not null,
  personagem_id uuid references public.personagens(id) on delete set null,
  thread_id     uuid references public.threads(id) on delete set null,
  categoria     text not null,
  titulo        text not null,
  texto         text,
  destaque      boolean not null default false,
  criado_por    uuid references auth.users(id) on delete set null,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists idx_canons_universo on public.canons(universo_id, categoria);
create index if not exists idx_canons_personagem on public.canons(personagem_id);

alter table public.canons enable row level security;

drop policy if exists "usuarios autenticados gerenciam canons" on public.canons;
create policy "usuarios autenticados gerenciam canons"
  on public.canons for all to authenticated
  using (true) with check (true);

drop trigger if exists canons_updated_at on public.canons;
create trigger canons_updated_at
  before update on public.canons
  for each row execute procedure public.update_updated_at();
