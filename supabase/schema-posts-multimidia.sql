-- Várias fotos por post (carrossel, até 10)
-- midia_url continua sendo a capa (primeira foto) para compatibilidade.
alter table public.posts_sociais
  add column if not exists midia_urls text[] not null default '{}';

update public.posts_sociais
set midia_urls = array[midia_url]
where midia_url is not null
  and midia_url <> ''
  and coalesce(array_length(midia_urls, 1), 0) = 0;
