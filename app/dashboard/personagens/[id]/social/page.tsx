import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { SocialClient } from './social-client'

export default async function SocialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: personagem },
    { data: contas },
    { data: posts },
  ] = await Promise.all([
    supabase.from('personagens').select('id, nome, foto_url, capa_url').eq('id', id).single(),
    supabase.from('contas_sociais').select('*').eq('personagem_id', id).order('created_at'),
    supabase.from('posts_sociais').select('*').eq('personagem_id', id).order('data_post', { ascending: false }),
  ])

  if (!personagem) notFound()

  const postIds = (posts ?? []).map((p: any) => p.id)
  const contasList = contas ?? []
  const postsList = posts ?? []

  const [
    { data: { user } },
    { data: todosPersonagens },
    { data: curtidas },
    { data: comentarios },
  ] = await Promise.all([
    supabase.auth.getUser(),
    supabase.from('personagens').select('id, nome, foto_url').order('nome'),
    postIds.length > 0
      ? supabase.from('curtidas_sociais').select('*').in('post_id', postIds)
      : Promise.resolve({ data: [] }),
    postIds.length > 0
      ? supabase.from('comentarios_sociais').select('*, personagens(id, nome, foto_url)').in('post_id', postIds).order('created_at', { ascending: true })
      : Promise.resolve({ data: [] }),
  ])

  return (
    <div className="flex-1 overflow-y-auto">
      <SocialClient
        personagemId={id}
        personagem={personagem}
        contas={contasList}
        posts={postsList}
        userId={user?.id ?? ''}
        todosPersonagens={todosPersonagens ?? []}
        curtidasIniciais={curtidas ?? []}
        comentariosIniciais={comentarios ?? []}
      />
    </div>
  )
}
