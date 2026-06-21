-- Perfis das usuárias (extends auth.users)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  nome_display text not null,
  personagem_principal text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;

drop policy if exists "Usuárias veem todos os perfis" on public.profiles;
create policy "Usuárias veem todos os perfis" on public.profiles
  for select using (true);

drop policy if exists "Usuárias editam próprio perfil" on public.profiles;
create policy "Usuárias editam próprio perfil" on public.profiles
  for update using (auth.uid() = id);

-- Cria perfil automaticamente ao registrar
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nome_display)
  values (new.id, coalesce(new.raw_user_meta_data->>'nome_display', split_part(new.email, '@', 1)));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Threads (capítulos)
create table if not exists public.threads (
  id uuid default gen_random_uuid() primary key,
  titulo text not null,
  descricao text,
  status text default 'em_andamento' check (status in ('em_andamento', 'concluida', 'arquivada')),
  tags text[] default '{}',
  capa_url text,
  criado_por uuid references public.profiles(id),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.threads enable row level security;

drop policy if exists "Todas as usuárias veem threads" on public.threads;
create policy "Todas as usuárias veem threads" on public.threads
  for select using (true);

drop policy if exists "Todas as usuárias criam threads" on public.threads;
create policy "Todas as usuárias criam threads" on public.threads
  for insert with check (auth.uid() = criado_por);

drop policy if exists "Todas as usuárias editam threads" on public.threads;
create policy "Todas as usuárias editam threads" on public.threads
  for update using (true);

create or replace function public.update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists threads_updated_at on public.threads;
create trigger threads_updated_at
  before update on public.threads
  for each row execute procedure public.update_updated_at();

-- Posts dentro de threads
create table if not exists public.posts (
  id uuid default gen_random_uuid() primary key,
  thread_id uuid references public.threads(id) on delete cascade not null,
  conteudo text not null,
  personagem_pov text,
  criado_por uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.posts enable row level security;

drop policy if exists "Todas as usuárias veem posts" on public.posts;
create policy "Todas as usuárias veem posts" on public.posts
  for select using (true);

drop policy if exists "Todas as usuárias criam posts" on public.posts;
create policy "Todas as usuárias criam posts" on public.posts
  for insert with check (auth.uid() = criado_por);

create or replace function public.update_thread_on_post()
returns trigger language plpgsql as $$
begin
  update public.threads set updated_at = now() where id = new.thread_id;
  return new;
end;
$$;

drop trigger if exists post_updates_thread on public.posts;
create trigger post_updates_thread
  after insert on public.posts
  for each row execute procedure public.update_thread_on_post();

-- Lugares
create table if not exists public.lugares (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  descricao text,
  tipo text,
  foto_url text,
  criado_por uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.lugares enable row level security;

drop policy if exists "Todas as usuárias veem lugares" on public.lugares;
create policy "Todas as usuárias veem lugares" on public.lugares
  for select using (true);

drop policy if exists "Todas as usuárias criam lugares" on public.lugares;
create policy "Todas as usuárias criam lugares" on public.lugares
  for insert with check (auth.uid() = criado_por);

drop policy if exists "Todas as usuárias editam lugares" on public.lugares;
create policy "Todas as usuárias editam lugares" on public.lugares
  for update using (true);

-- Personagens
create table if not exists public.personagens (
  id uuid default gen_random_uuid() primary key,
  nome text not null,
  descricao text,
  foto_url text,
  tipo text default 'principal' check (tipo in ('principal', 'npc')),
  criado_por uuid references public.profiles(id),
  created_at timestamptz default now()
);

alter table public.personagens enable row level security;

drop policy if exists "Todas as usuárias veem personagens" on public.personagens;
create policy "Todas as usuárias veem personagens" on public.personagens
  for select using (true);

drop policy if exists "Todas as usuárias criam personagens" on public.personagens;
create policy "Todas as usuárias criam personagens" on public.personagens
  for insert with check (auth.uid() = criado_por);

drop policy if exists "Todas as usuárias editam personagens" on public.personagens;
create policy "Todas as usuárias editam personagens" on public.personagens
  for update using (true);

-- Relações entre personagens (árvore genealógica + vínculos)
create table if not exists public.relacoes_personagens (
  id uuid default gen_random_uuid() primary key,
  personagem_a uuid references public.personagens(id) on delete cascade,
  personagem_b uuid references public.personagens(id) on delete cascade,
  tipo_relacao text not null,
  created_at timestamptz default now()
);

alter table public.relacoes_personagens enable row level security;

drop policy if exists "Todas as usuárias veem relações" on public.relacoes_personagens;
create policy "Todas as usuárias veem relações" on public.relacoes_personagens
  for select using (true);

drop policy if exists "Todas as usuárias criam relações" on public.relacoes_personagens;
create policy "Todas as usuárias criam relações" on public.relacoes_personagens
  for insert with check (true);
