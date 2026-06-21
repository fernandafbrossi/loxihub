-- Storage bucket para todas as imagens
insert into storage.buckets (id, name, public)
values ('imagens', 'imagens', true)
on conflict (id) do nothing;

drop policy if exists "Imagens publicas" on storage.objects;
create policy "Imagens publicas" on storage.objects
  for select using (bucket_id = 'imagens');

drop policy if exists "Upload autenticado" on storage.objects;
create policy "Upload autenticado" on storage.objects
  for insert with check (bucket_id = 'imagens' and auth.role() = 'authenticated');

drop policy if exists "Delete autenticado" on storage.objects;
create policy "Delete autenticado" on storage.objects
  for delete using (bucket_id = 'imagens' and auth.uid() = owner);

-- Posts do Instagram dos personagens
create table if not exists public.posts_instagram (
  id uuid default gen_random_uuid() primary key,
  imagem_url text,
  legenda text not null,
  personagem_id uuid references public.personagens(id),
  criado_por uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.posts_instagram enable row level security;

drop policy if exists "Todas veem posts instagram" on public.posts_instagram;
create policy "Todas veem posts instagram" on public.posts_instagram for select using (true);

drop policy if exists "Todas criam posts instagram" on public.posts_instagram;
create policy "Todas criam posts instagram" on public.posts_instagram
  for insert with check (auth.uid() = criado_por);

drop policy if exists "Todas deletam posts instagram" on public.posts_instagram;
create policy "Todas deletam posts instagram" on public.posts_instagram
  for delete using (auth.uid() = criado_por);

-- Comentários do Instagram
create table if not exists public.comentarios_instagram (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts_instagram(id) on delete cascade,
  conteudo text not null,
  personagem_id uuid references public.personagens(id),
  criado_por uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.comentarios_instagram enable row level security;

drop policy if exists "Todas veem comentarios" on public.comentarios_instagram;
create policy "Todas veem comentarios" on public.comentarios_instagram for select using (true);

drop policy if exists "Todas criam comentarios" on public.comentarios_instagram;
create policy "Todas criam comentarios" on public.comentarios_instagram
  for insert with check (auth.uid() = criado_por);

-- Curtidas do Instagram
create table if not exists public.curtidas_instagram (
  id uuid default gen_random_uuid() primary key,
  post_id uuid references public.posts_instagram(id) on delete cascade,
  personagem_id uuid references public.personagens(id),
  criado_por uuid references public.profiles(id),
  created_at timestamptz default now(),
  unique(post_id, personagem_id)
);

alter table public.curtidas_instagram enable row level security;

drop policy if exists "Todas veem curtidas" on public.curtidas_instagram;
create policy "Todas veem curtidas" on public.curtidas_instagram for select using (true);

drop policy if exists "Todas criam curtidas" on public.curtidas_instagram;
create policy "Todas criam curtidas" on public.curtidas_instagram
  for insert with check (auth.uid() = criado_por);

drop policy if exists "Todas deletam curtidas" on public.curtidas_instagram;
create policy "Todas deletam curtidas" on public.curtidas_instagram
  for delete using (auth.uid() = criado_por);

-- Tweets dos personagens
create table if not exists public.tweets (
  id uuid default gen_random_uuid() primary key,
  conteudo text not null,
  personagem_id uuid references public.personagens(id),
  tweet_pai_id uuid references public.tweets(id) on delete cascade,
  criado_por uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.tweets enable row level security;

drop policy if exists "Todas veem tweets" on public.tweets;
create policy "Todas veem tweets" on public.tweets for select using (true);

drop policy if exists "Todas criam tweets" on public.tweets;
create policy "Todas criam tweets" on public.tweets
  for insert with check (auth.uid() = criado_por);

drop policy if exists "Todas deletam tweets" on public.tweets;
create policy "Todas deletam tweets" on public.tweets
  for delete using (auth.uid() = criado_por);

-- Curtidas de tweets
create table if not exists public.curtidas_tweets (
  id uuid default gen_random_uuid() primary key,
  tweet_id uuid references public.tweets(id) on delete cascade,
  personagem_id uuid references public.personagens(id),
  criado_por uuid references public.profiles(id),
  created_at timestamptz default now(),
  unique(tweet_id, personagem_id)
);

alter table public.curtidas_tweets enable row level security;

drop policy if exists "Todas veem curtidas tweets" on public.curtidas_tweets;
create policy "Todas veem curtidas tweets" on public.curtidas_tweets for select using (true);

drop policy if exists "Todas criam curtidas tweets" on public.curtidas_tweets;
create policy "Todas criam curtidas tweets" on public.curtidas_tweets
  for insert with check (auth.uid() = criado_por);

drop policy if exists "Todas deletam curtidas tweets" on public.curtidas_tweets;
create policy "Todas deletam curtidas tweets" on public.curtidas_tweets
  for delete using (auth.uid() = criado_por);
