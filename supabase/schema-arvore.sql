-- Árvore genealógica v2
-- Execute este arquivo no Supabase SQL Editor

create table if not exists membros_arvore (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  foto_url text,
  personagem_id uuid references personagens(id) on delete set null,
  status text not null default 'ativo' check (status in ('ativo', 'falecido', 'npc')),
  notas text,
  created_at timestamptz default now()
);

create table if not exists relacoes_arvore (
  id uuid primary key default gen_random_uuid(),
  membro_a uuid not null references membros_arvore(id) on delete cascade,
  membro_b uuid not null references membros_arvore(id) on delete cascade,
  tipo_relacao text not null,
  created_at timestamptz default now()
);

alter table membros_arvore enable row level security;
alter table relacoes_arvore enable row level security;

create policy "auth_membros_arvore"
  on membros_arvore for all to authenticated using (true) with check (true);

create policy "auth_relacoes_arvore"
  on relacoes_arvore for all to authenticated using (true) with check (true);
