-- =============================================
-- Eventos do universo (calendário do jogo)
-- Rodar no Supabase SQL Editor
-- =============================================

create table if not exists public.eventos (
  id           uuid default gen_random_uuid() primary key,
  universo_id  uuid references public.universos(id) on delete cascade not null,
  thread_id    uuid references public.threads(id) on delete set null,
  titulo       text not null,
  data_jogo    date not null,
  descricao    text,                          -- antes: o que vai acontecer
  clima        text,                          -- descrição do tempo
  acontecimentos text,                        -- depois: principais acontecimentos
  imagens      text[] not null default '{}',  -- imagens de referência
  criado_por   uuid references auth.users(id) on delete set null,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

create index if not exists idx_eventos_universo_data on public.eventos(universo_id, data_jogo);

alter table public.eventos enable row level security;

drop policy if exists "usuarios autenticados gerenciam eventos" on public.eventos;
create policy "usuarios autenticados gerenciam eventos"
  on public.eventos for all to authenticated
  using (true) with check (true);

drop trigger if exists eventos_updated_at on public.eventos;
create trigger eventos_updated_at
  before update on public.eventos
  for each row execute procedure public.update_updated_at();
