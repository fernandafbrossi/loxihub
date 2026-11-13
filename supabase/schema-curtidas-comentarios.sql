-- Curtidas em comentários do Instagram dos personagens
create table if not exists public.curtidas_comentarios_sociais (
  id uuid primary key default gen_random_uuid(),
  comentario_id uuid not null references public.comentarios_sociais(id) on delete cascade,
  personagem_id uuid not null references public.personagens(id) on delete cascade,
  criado_por uuid references public.profiles(id),
  created_at timestamptz default now(),
  unique (comentario_id, personagem_id)
);

alter table public.curtidas_comentarios_sociais enable row level security;

drop policy if exists "autenticadas_curtidas_coment_select" on public.curtidas_comentarios_sociais;
create policy "autenticadas_curtidas_coment_select" on public.curtidas_comentarios_sociais
  for select to authenticated using (true);

drop policy if exists "autenticadas_curtidas_coment_insert" on public.curtidas_comentarios_sociais;
create policy "autenticadas_curtidas_coment_insert" on public.curtidas_comentarios_sociais
  for insert to authenticated with check (auth.uid() = criado_por);

drop policy if exists "autenticadas_curtidas_coment_delete" on public.curtidas_comentarios_sociais;
create policy "autenticadas_curtidas_coment_delete" on public.curtidas_comentarios_sociais
  for delete to authenticated using (auth.uid() = criado_por);
