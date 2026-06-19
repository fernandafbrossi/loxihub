-- ──────────────────────────────────────────────────────────
-- Melhorias jun/2025
-- Execute no Supabase SQL Editor
-- ──────────────────────────────────────────────────────────

-- 1. Habilitar realtime na tabela posts (para updates em tempo real dentro da thread)
alter publication supabase_realtime add table public.posts;

-- 2. Adicionar nota às relações entre personagens
alter table public.relacoes_personagens
  add column if not exists nota text;

-- 3. Galeria Inspo por personagem
create table if not exists public.inspo_personagem (
  id uuid default gen_random_uuid() primary key,
  personagem_id uuid references public.personagens(id) on delete cascade not null,
  url text not null,
  created_at timestamptz default now()
);

alter table public.inspo_personagem enable row level security;

drop policy if exists "Todas as usuárias veem inspo" on public.inspo_personagem;
create policy "Todas as usuárias veem inspo" on public.inspo_personagem
  for select using (true);

drop policy if exists "Todas as usuárias criam inspo" on public.inspo_personagem;
create policy "Todas as usuárias criam inspo" on public.inspo_personagem
  for insert with check (true);

drop policy if exists "Todas as usuárias deletam inspo" on public.inspo_personagem;
create policy "Todas as usuárias deletam inspo" on public.inspo_personagem
  for delete using (true);

-- 4. Notas privadas por universo (cada usuária vê só as suas)
create table if not exists public.notas_privadas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  universo_id uuid references public.universos(id) on delete cascade not null,
  conteudo text default '',
  updated_at timestamptz default now(),
  unique (user_id, universo_id)
);

alter table public.notas_privadas enable row level security;

drop policy if exists "Usuária vê apenas suas notas" on public.notas_privadas;
create policy "Usuária vê apenas suas notas" on public.notas_privadas
  for select using (auth.uid() = user_id);

drop policy if exists "Usuária cria suas notas" on public.notas_privadas;
create policy "Usuária cria suas notas" on public.notas_privadas
  for insert with check (auth.uid() = user_id);

drop policy if exists "Usuária edita suas notas" on public.notas_privadas;
create policy "Usuária edita suas notas" on public.notas_privadas
  for update using (auth.uid() = user_id);
