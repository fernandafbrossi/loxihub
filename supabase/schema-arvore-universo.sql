-- Migração: adicionar universo_id à árvore genealógica
-- Execute este arquivo no Supabase SQL Editor

alter table membros_arvore
  add column if not exists universo_id uuid references universos(id) on delete cascade;

create index if not exists membros_arvore_universo_idx on membros_arvore(universo_id);
