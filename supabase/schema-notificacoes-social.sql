-- ─────────────────────────────────────────
-- TRIGGER: curtida em posts_sociais
-- (usado pela UI de /personagens/[id]/social)
-- ─────────────────────────────────────────
create or replace function public.notify_curtida_social()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_post_creator  uuid;
  v_personagem_id uuid;
  v_tipo          text;
  v_autor_nome    text;
begin
  select criado_por, personagem_id, tipo
    into v_post_creator, v_personagem_id, v_tipo
    from posts_sociais where id = new.post_id;

  if v_post_creator is null or v_post_creator = new.criado_por then return new; end if;

  select nome_display into v_autor_nome from profiles where id = new.criado_por;

  insert into notificacoes (user_id, tipo, criado_por, resource_id, texto, url)
  values (
    v_post_creator,
    'curtida_social',
    new.criado_por,
    new.post_id,
    v_autor_nome || ' curtiu seu post no ' ||
      case when v_tipo = 'twitter' then 'Twitter' else 'Instagram' end,
    '/dashboard/personagens/' || v_personagem_id || '/social'
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_curtida_social on public.curtidas_sociais;
create trigger trg_notify_curtida_social
  after insert on public.curtidas_sociais
  for each row execute function public.notify_curtida_social();

-- ─────────────────────────────────────────
-- TRIGGER: comentário em posts_sociais
-- (usado pela UI de /personagens/[id]/social)
-- ─────────────────────────────────────────
create or replace function public.notify_comentario_social()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_post_creator  uuid;
  v_personagem_id uuid;
  v_tipo          text;
  v_autor_nome    text;
  v_personagem    text;
begin
  select criado_por, personagem_id, tipo
    into v_post_creator, v_personagem_id, v_tipo
    from posts_sociais where id = new.post_id;

  if v_post_creator is null or v_post_creator = new.criado_por then return new; end if;

  select nome_display into v_autor_nome from profiles   where id = new.criado_por;
  select nome          into v_personagem  from personagens where id = new.personagem_id;

  insert into notificacoes (user_id, tipo, criado_por, resource_id, texto, url)
  values (
    v_post_creator,
    'comentario_social',
    new.criado_por,
    new.post_id,
    v_autor_nome || ' comentou no ' ||
      case when v_tipo = 'twitter' then 'Twitter' else 'Instagram' end ||
      case when v_personagem is not null then ' como ' || v_personagem else '' end,
    '/dashboard/personagens/' || v_personagem_id || '/social'
  );
  return new;
end;
$$;

drop trigger if exists trg_notify_comentario_social on public.comentarios_sociais;
create trigger trg_notify_comentario_social
  after insert on public.comentarios_sociais
  for each row execute function public.notify_comentario_social();
