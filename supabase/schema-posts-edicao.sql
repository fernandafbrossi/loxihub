-- ──────────────────────────────────────────────────────────
-- Permitir editar e apagar os próprios posts da thread
-- Execute no Supabase SQL Editor (Dashboard → SQL Editor → New query)
--
-- Sem estas políticas, o RLS bloqueia o UPDATE/DELETE em silêncio:
-- o app mostra a edição, mas o banco não grava, e ao atualizar volta o texto antigo.
-- ──────────────────────────────────────────────────────────

drop policy if exists "Autora edita seus posts" on public.posts;
create policy "Autora edita seus posts" on public.posts
  for update using (auth.uid() = criado_por) with check (auth.uid() = criado_por);

drop policy if exists "Autora apaga seus posts" on public.posts;
create policy "Autora apaga seus posts" on public.posts
  for delete using (auth.uid() = criado_por);

-- Garante que a tabela está no realtime (ignora o erro "already member" se já estiver)
do $$
begin
  alter publication supabase_realtime add table public.posts;
exception when duplicate_object then null;
end $$;
