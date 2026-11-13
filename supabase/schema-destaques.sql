-- Destaques do perfil (coleções de fotos com título e capa, como no Instagram)
create table if not exists public.destaques_sociais (
  id uuid primary key default gen_random_uuid(),
  conta_id uuid not null references public.contas_sociais(id) on delete cascade,
  titulo text not null,
  capa_url text,
  midia_urls text[] not null default '{}',
  criado_por uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.destaques_sociais enable row level security;

drop policy if exists "autenticadas_destaques_select" on public.destaques_sociais;
create policy "autenticadas_destaques_select" on public.destaques_sociais
  for select to authenticated using (true);

drop policy if exists "autenticadas_destaques_insert" on public.destaques_sociais;
create policy "autenticadas_destaques_insert" on public.destaques_sociais
  for insert to authenticated with check (true);

drop policy if exists "autenticadas_destaques_update" on public.destaques_sociais;
create policy "autenticadas_destaques_update" on public.destaques_sociais
  for update to authenticated using (true) with check (true);

drop policy if exists "autenticadas_destaques_delete" on public.destaques_sociais;
create policy "autenticadas_destaques_delete" on public.destaques_sociais
  for delete to authenticated using (true);
