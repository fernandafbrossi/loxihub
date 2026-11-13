-- Notificações de curtida/comentário passam a abrir o post certo
-- (a página social lê ?post=<id> e já abre o post).

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
    '/dashboard/personagens/' || v_personagem_id || '/social?post=' || new.post_id
  );
  return new;
end;
$$;

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
    '/dashboard/personagens/' || v_personagem_id || '/social?post=' || new.post_id
  );
  return new;
end;
$$;

-- Notificações já existentes: acrescenta o post ao link
update public.notificacoes
set url = url || '?post=' || resource_id
where tipo in ('curtida_social', 'comentario_social')
  and url is not null
  and url not like '%?post=%'
  and resource_id is not null;
