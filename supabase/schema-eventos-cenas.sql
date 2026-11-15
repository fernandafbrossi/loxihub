-- =============================================
-- Liga cada card de cena a um evento
-- Rodar no Supabase SQL Editor (depois de schema-eventos.sql)
-- =============================================

alter table public.contextos_cena
  add column if not exists evento_id uuid references public.eventos(id) on delete set null;

create index if not exists idx_contextos_cena_evento on public.contextos_cena(evento_id);
