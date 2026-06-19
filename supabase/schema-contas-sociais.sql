-- Tabela de contas sociais por personagem
-- Cada personagem pode ter N contas por rede (principal, finsta, alt, etc.)
create table if not exists public.contas_sociais (
  id uuid primary key default gen_random_uuid(),
  personagem_id uuid not null references public.personagens(id) on delete cascade,
  tipo text not null check (tipo in ('twitter', 'instagram')),
  nome text not null default 'principal',
  username text,
  bio text,
  foto_url text,
  seguidores int not null default 0,
  seguindo int not null default 0,
  created_at timestamptz default now()
);

alter table public.contas_sociais enable row level security;

drop policy if exists "autenticadas_contas_select" on public.contas_sociais;
create policy "autenticadas_contas_select" on public.contas_sociais
  for select to authenticated using (true);

drop policy if exists "autenticadas_contas_insert" on public.contas_sociais;
create policy "autenticadas_contas_insert" on public.contas_sociais
  for insert to authenticated with check (true);

drop policy if exists "autenticadas_contas_update" on public.contas_sociais;
create policy "autenticadas_contas_update" on public.contas_sociais
  for update to authenticated using (true) with check (true);

drop policy if exists "autenticadas_contas_delete" on public.contas_sociais;
create policy "autenticadas_contas_delete" on public.contas_sociais
  for delete to authenticated using (true);

-- Vincula posts à conta social
alter table public.posts_sociais
  add column if not exists conta_id uuid references public.contas_sociais(id) on delete set null;

-- Garante que updates em posts_sociais funcionem (fix do bug de engagement)
drop policy if exists "autenticadas_posts_update" on public.posts_sociais;
create policy "autenticadas_posts_update" on public.posts_sociais
  for update to authenticated using (true) with check (true);

-- Migra dados existentes: cria conta "principal" para cada personagem
insert into public.contas_sociais (personagem_id, tipo, nome, username, bio, foto_url, seguidores, seguindo)
select
  id, 'twitter', 'principal',
  username, bio_twitter, foto_url,
  coalesce(seguidores_twitter, 0), coalesce(seguindo_twitter, 0)
from public.personagens
on conflict do nothing;

insert into public.contas_sociais (personagem_id, tipo, nome, username, bio, foto_url, seguidores, seguindo)
select
  id, 'instagram', 'principal',
  username, bio_instagram, foto_url,
  coalesce(seguidores_instagram, 0), coalesce(seguindo_instagram, 0)
from public.personagens
on conflict do nothing;

-- Associa posts existentes às contas principais
update public.posts_sociais p
set conta_id = c.id
from public.contas_sociais c
where c.personagem_id = p.personagem_id
  and c.tipo = 'twitter'
  and c.nome = 'principal'
  and (p.tipo is null or p.tipo = 'twitter')
  and p.conta_id is null;

update public.posts_sociais p
set conta_id = c.id
from public.contas_sociais c
where c.personagem_id = p.personagem_id
  and c.tipo = 'instagram'
  and c.nome = 'principal'
  and p.tipo = 'instagram'
  and p.conta_id is null;
