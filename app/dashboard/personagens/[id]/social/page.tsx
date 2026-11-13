import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SocialClient, type Post, type Conta, type Comentario } from './social-client'

function escapar(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default async function SocialPage({ params, searchParams }: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ post?: string }>
}) {
  const { id } = await params
  const { post: postInicialId } = await searchParams
  const supabase = await createClient()

  const [
    { data: personagem },
    { data: contas },
    { data: posts },
  ] = await Promise.all([
    supabase.from('personagens').select('id, nome, foto_url, capa_url, username').eq('id', id).single(),
    supabase.from('contas_sociais').select('*').eq('personagem_id', id).order('created_at'),
    supabase.from('posts_sociais').select('*').eq('personagem_id', id).order('data_post', { ascending: false }),
  ])

  if (!personagem) notFound()

  const contasList = (contas ?? []) as Conta[]
  const postsList = (posts ?? []) as Post[]

  // Usernames que identificam este personagem (para a aba "Marcadas")
  const usernames = Array.from(new Set(
    [personagem.username, ...contasList.map(c => c.username)].filter((u): u is string => !!u)
  ))

  const [
    { data: destaques },
    { data: marcadasBrutas },
  ] = await Promise.all([
    // Tabela criada em schema-destaques.sql; se ainda não existir, vem vazio.
    contasList.length > 0
      ? supabase.from('destaques_sociais').select('*').in('conta_id', contasList.map(c => c.id)).order('created_at')
      : Promise.resolve({ data: [] }),
    usernames.length > 0
      ? supabase.from('posts_sociais').select('*')
          .eq('tipo', 'instagram').neq('personagem_id', id)
          .or(usernames.map(u => `conteudo.ilike.%@${u.replace(/[,()%]/g, '')}%`).join(','))
          .order('data_post', { ascending: false })
      : Promise.resolve({ data: [] }),
  ])

  // ilike é frouxo (o "_" vale qualquer letra): confere a menção exata aqui.
  const marcadas = ((marcadasBrutas ?? []) as Post[]).filter(p =>
    usernames.some(u => new RegExp(`@${escapar(u)}(?![\\p{L}\\p{N}_.])`, 'iu').test(p.conteudo ?? '')))

  const idsContasMarcadas = Array.from(new Set(marcadas.map(p => p.conta_id).filter((x): x is string => !!x)))
  const { data: contasMarcadas } = idsContasMarcadas.length > 0
    ? await supabase.from('contas_sociais').select('*').in('id', idsContasMarcadas)
    : { data: [] }

  const postIds = [...postsList, ...marcadas].map(p => p.id)

  const [
    { data: { user } },
    { data: todosPersonagens },
    { data: curtidas },
    { data: comentarios },
    { data: comentarioCurtidas },
    { data: contasInstagram },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('personagens').select('id, nome, foto_url, username').order('nome'),
    postIds.length > 0
      ? supabase.from('curtidas_sociais').select('*').in('post_id', postIds)
      : Promise.resolve({ data: [] }),
    postIds.length > 0
      ? supabase.from('comentarios_sociais').select('*, personagens(id, nome, foto_url)').in('post_id', postIds).order('created_at', { ascending: true })
      : Promise.resolve({ data: [] }),
    // Tabela criada em schema-curtidas-comentarios.sql; se ainda não existir, vem vazio.
    postIds.length > 0
      ? supabase.from('curtidas_comentarios_sociais').select('id, comentario_id, personagem_id')
      : Promise.resolve({ data: [] }),
    // Foto e @ da rede social de cada personagem (a principal é a mais antiga)
    supabase.from('contas_sociais').select('personagem_id, username, foto_url').eq('tipo', 'instagram').order('created_at'),
  ])

  // Na rede social vale a foto/@ da conta Instagram, não a foto da ficha do personagem.
  const contaPrincipal = new Map<string, { username: string | null; foto_url: string | null }>()
  for (const c of contasInstagram ?? []) {
    if (!contaPrincipal.has(c.personagem_id)) contaPrincipal.set(c.personagem_id, c)
  }
  const comPerfilSocial = <T extends { id: string; foto_url: string | null; username?: string | null }>(p: T): T => {
    const c = contaPrincipal.get(p.id)
    return c ? { ...p, foto_url: c.foto_url ?? p.foto_url, username: c.username ?? p.username } : p
  }
  const personagensSociais = (todosPersonagens ?? []).map(comPerfilSocial)
  const comentariosSociais = ((comentarios ?? []) as Comentario[]).map(c =>
    c.personagens ? { ...c, personagens: comPerfilSocial(c.personagens) } : c)

  return (
    <div className="flex-1 overflow-y-auto">
      <SocialClient
        key={postInicialId ?? 'perfil'}
        personagemId={id}
        personagem={personagem}
        contas={contasList}
        posts={postsList}
        postsMarcados={marcadas}
        contasMarcadas={(contasMarcadas ?? []) as Conta[]}
        destaques={destaques ?? []}
        userId={user?.id ?? ''}
        todosPersonagens={personagensSociais}
        curtidasIniciais={curtidas ?? []}
        comentariosIniciais={comentariosSociais}
        comentarioCurtidasIniciais={comentarioCurtidas ?? []}
        postInicialId={postInicialId ?? null}
      />
    </div>
  )
}
