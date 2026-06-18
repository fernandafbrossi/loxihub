-- Tabela de notificações
create table if not exists public.notificacoes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users on delete cascade not null,
  tipo text not null, -- 'novo_post' | 'comentario_instagram' | 'curtida_instagram' | 'reply_tweet'
  criado_por uuid references auth.users on delete cascade not null,
  resource_id uuid not null,
  thread_id uuid references public.threads on delete cascade,
  texto text not null,
  url text,
  lida boolean default false,
  created_at timestamptz default now()
);

create index if not exists notificacoes_user_id_idx on public.notificacoes(user_id);
create index if not exists notificacoes_nao_lidas_idx on public.notificacoes(user_id, lida) where not lida;

alter table public.notificacoes enable row level security;

drop policy if exists "Usuária vê suas notificações" on public.notificacoes;
create policy "Usuária vê suas notificações" on public.notificacoes
  for select using (auth.uid() = user_id);

drop policy if exists "Usuária marca como lida" on public.notificacoes;
create policy "Usuária marca como lida" on public.notificacoes
  for update using (auth.uid() = user_id);

-- Habilitar realtime
alter publication supabase_realtime add table public.notificacoes;

-- ─────────────────────────────────────────
-- TRIGGER 1: novo post numa thread
-- ─────────────────────────────────────────
create or replace function public.notify_novo_post()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_thread_titulo text;
  v_autor_nome    text;
  v_outro_user_id uuid;
begin
  select titulo      into v_thread_titulo from threads  where id = new.thread_id;
  select nome_display into v_autor_nome   from profiles where id = new.criado_por;
  select id           into v_outro_user_id from profiles where id != new.criado_por limit 1;

  if v_outro_user_id is not null then
    insert into notificacoes (user_id, tipo, criado_por, resource_id, thread_id, texto, url)
    values (
      v_outro_user_id,
      'novo_post',
      new.criado_por,
      new.id,
      new.thread_id,
      v_autor_nome || ' postou em "' || coalesce(v_thread_titulo, 'thread') || '"',
      '/dashboard/threads/' || new.thread_id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_notify_novo_post on public.posts;
create trigger trg_notify_novo_post
  after insert on public.posts
  for each row execute function public.notify_novo_post();

-- ─────────────────────────────────────────
-- TRIGGER 2: comentário no Instagram
-- ─────────────────────────────────────────
create or replace function public.notify_comentario_instagram()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_post_creator  uuid;
  v_autor_nome    text;
  v_personagem    text;
begin
  select criado_por into v_post_creator from posts_instagram where id = new.post_id;
  if v_post_creator is null or v_post_creator = new.criado_por then return new; end if;

  select nome_display into v_autor_nome from profiles   where id = new.criado_por;
  select nome          into v_personagem  from personagens where id = new.personagem_id;

  insert into notificacoes (user_id, tipo, criado_por, resource_id, texto, url)
  values (
    v_post_creator,
    'comentario_instagram',
    new.criado_por,
    new.post_id,
    v_autor_nome || ' comentou no Instagram' ||
      case when v_personagem is not null then ' como ' || v_personagem else '' end,
    '/dashboard/instagram/' || new.post_id
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_comentario_instagram on public.comentarios_instagram;
create trigger trg_notify_comentario_instagram
  after insert on public.comentarios_instagram
  for each row execute function public.notify_comentario_instagram();

-- ─────────────────────────────────────────
-- TRIGGER 3: curtida no Instagram
-- ─────────────────────────────────────────
create or replace function public.notify_curtida_instagram()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_post_creator uuid;
  v_autor_nome   text;
begin
  select criado_por into v_post_creator from posts_instagram where id = new.post_id;
  if v_post_creator is null or v_post_creator = new.criado_por then return new; end if;

  select nome_display into v_autor_nome from profiles where id = new.criado_por;

  insert into notificacoes (user_id, tipo, criado_por, resource_id, texto, url)
  values (
    v_post_creator,
    'curtida_instagram',
    new.criado_por,
    new.post_id,
    v_autor_nome || ' curtiu seu post no Instagram',
    '/dashboard/instagram/' || new.post_id
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_curtida_instagram on public.curtidas_instagram;
create trigger trg_notify_curtida_instagram
  after insert on public.curtidas_instagram
  for each row execute function public.notify_curtida_instagram();

-- ─────────────────────────────────────────
-- TRIGGER 4: reply no Twitter
-- ─────────────────────────────────────────
create or replace function public.notify_reply_tweet()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_pai_creator uuid;
  v_autor_nome  text;
begin
  if new.tweet_pai_id is null then return new; end if;

  select criado_por into v_pai_creator from tweets where id = new.tweet_pai_id;
  if v_pai_creator is null or v_pai_creator = new.criado_por then return new; end if;

  select nome_display into v_autor_nome from profiles where id = new.criado_por;

  insert into notificacoes (user_id, tipo, criado_por, resource_id, texto, url)
  values (
    v_pai_creator,
    'reply_tweet',
    new.criado_por,
    new.id,
    v_autor_nome || ' respondeu seu tweet',
    '/dashboard/twitter/' || new.tweet_pai_id
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_reply_tweet on public.tweets;
create trigger trg_notify_reply_tweet
  after insert on public.tweets
  for each row execute function public.notify_reply_tweet();
