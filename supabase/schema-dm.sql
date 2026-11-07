-- ─────────────────────────────────────────
-- DM / mensagens de celular entre personagens (1:1)
-- Rode no SQL Editor do Supabase.
-- ─────────────────────────────────────────

create table if not exists public.dm_conversas (
  id            uuid default gen_random_uuid() primary key,
  universo_id   uuid references public.universos(id) on delete cascade,
  personagem_a  uuid not null references public.personagens(id) on delete cascade,
  personagem_b  uuid not null references public.personagens(id) on delete cascade,
  criado_por    uuid references public.profiles(id),
  ultima_msg_em timestamptz default now(),
  created_at    timestamptz default now(),
  constraint dm_conversas_distintos check (personagem_a <> personagem_b)
);

-- uma conversa por par de personagens (independe da ordem a/b)
create unique index if not exists dm_conversas_par_idx
  on public.dm_conversas (least(personagem_a, personagem_b), greatest(personagem_a, personagem_b));
create index if not exists dm_conversas_universo_idx on public.dm_conversas(universo_id, ultima_msg_em desc);

create table if not exists public.dm_mensagens (
  id            uuid default gen_random_uuid() primary key,
  conversa_id   uuid not null references public.dm_conversas(id) on delete cascade,
  personagem_id uuid not null references public.personagens(id) on delete cascade, -- quem "digitou"
  conteudo      text not null,
  criado_por    uuid references public.profiles(id),
  created_at    timestamptz default now()
);
create index if not exists dm_mensagens_conversa_idx on public.dm_mensagens(conversa_id, created_at);

alter table public.dm_conversas enable row level security;
alter table public.dm_mensagens enable row level security;

-- Como no resto do app, as duas usuárias veem e escrevem tudo.
drop policy if exists "Veem conversas" on public.dm_conversas;
create policy "Veem conversas" on public.dm_conversas for select using (auth.uid() is not null);
drop policy if exists "Criam conversas" on public.dm_conversas;
create policy "Criam conversas" on public.dm_conversas for insert with check (auth.uid() = criado_por);
drop policy if exists "Editam conversas" on public.dm_conversas;
create policy "Editam conversas" on public.dm_conversas for update using (auth.uid() is not null);
drop policy if exists "Apagam conversas" on public.dm_conversas;
create policy "Apagam conversas" on public.dm_conversas for delete using (auth.uid() is not null);

drop policy if exists "Veem mensagens" on public.dm_mensagens;
create policy "Veem mensagens" on public.dm_mensagens for select using (auth.uid() is not null);
drop policy if exists "Criam mensagens" on public.dm_mensagens;
create policy "Criam mensagens" on public.dm_mensagens for insert with check (auth.uid() = criado_por);
drop policy if exists "Editam próprias mensagens" on public.dm_mensagens;
create policy "Editam próprias mensagens" on public.dm_mensagens for update using (auth.uid() = criado_por);
drop policy if exists "Apagam próprias mensagens" on public.dm_mensagens;
create policy "Apagam próprias mensagens" on public.dm_mensagens for delete using (auth.uid() = criado_por);

-- Realtime
alter publication supabase_realtime add table public.dm_mensagens;

-- Atualiza ordenação da lista + notifica a outra usuária (push sai pelo webhook de notificacoes)
create or replace function public.notify_nova_dm()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_outro_user_id uuid;
  v_autor_nome    text;
  v_pers_nome     text;
  v_universo      uuid;
begin
  update dm_conversas set ultima_msg_em = new.created_at where id = new.conversa_id
    returning universo_id into v_universo;

  select nome_display into v_autor_nome from profiles where id = new.criado_por;
  select nome into v_pers_nome from personagens where id = new.personagem_id;
  select id into v_outro_user_id from profiles where id != new.criado_por limit 1;

  if v_outro_user_id is not null then
    insert into notificacoes (user_id, tipo, criado_por, resource_id, texto, url)
    values (
      v_outro_user_id,
      'nova_dm',
      new.criado_por,
      new.id,
      coalesce(v_pers_nome, v_autor_nome) || ': ' || left(new.conteudo, 80),
      '/dashboard/mensagens/' || new.conversa_id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_nova_dm on public.dm_mensagens;
create trigger trg_notify_nova_dm
  after insert on public.dm_mensagens
  for each row execute function public.notify_nova_dm();
