import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Settings } from 'lucide-react'
import { SocialClient } from './social-client'

export default async function SocialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: personagem },
    { data: contas },
    { data: posts },
  ] = await Promise.all([
    supabase.from('personagens').select('id, nome, foto_url').eq('id', id).single(),
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

  const twitterContaIds = new Set(contasList.filter((c: any) => c.tipo === 'twitter').map((c: any) => c.id))
  const instagramContaIds = new Set(contasList.filter((c: any) => c.tipo === 'instagram').map((c: any) => c.id))

  const twitterCount = postsList.filter((p: any) =>
    twitterContaIds.has(p.conta_id) || (!p.conta_id && (!p.tipo || p.tipo === 'twitter'))
  ).length
  const instagramCount = postsList.filter((p: any) =>
    instagramContaIds.has(p.conta_id) || (!p.conta_id && p.tipo === 'instagram')
  ).length

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="px-6 pt-5 pb-4" style={{ borderBottom: '0.5px solid rgba(128,0,32,0.08)' }}>
        <div className="flex items-center justify-between mb-3">
          <Link
            href={`/dashboard/personagens/${id}`}
            className="flex items-center gap-1.5 text-xs hover:opacity-70 transition-opacity"
            style={{ color: '#906070' }}
          >
            <ArrowLeft size={12} /> Perfil
          </Link>
          <Link
            href={`/dashboard/personagens/${id}/social/editar`}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-opacity hover:opacity-80"
            style={{ background: 'rgba(128,0,32,0.07)', color: '#800020' }}
          >
            <Settings size={12} /> Gerenciar contas
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-semibold text-lg"
            style={{
              background: 'linear-gradient(135deg, #C08090, #A06070)',
              color: '#FAF0F2',
              boxShadow: '0 2px 10px rgba(40,5,15,0.18)',
            }}
          >
            {personagem.foto_url
              ? <img src={personagem.foto_url} alt={personagem.nome} className="w-full h-full object-cover" />
              : personagem.nome[0].toUpperCase()
            }
          </div>
          <div>
            <h1 className="text-sm font-semibold" style={{ color: '#2E0510' }}>{personagem.nome}</h1>
            <p className="text-xs mt-0.5" style={{ color: '#906070' }}>
              {contasList.length} {contasList.length === 1 ? 'conta social' : 'contas sociais'}
            </p>
            <div className="flex gap-3 mt-1.5">
              <span className="text-[11px]" style={{ color: '#B09098' }}>
                <strong style={{ color: '#2E0510' }}>{twitterCount}</strong> tweets
              </span>
              <span className="text-[11px]" style={{ color: '#B09098' }}>
                <strong style={{ color: '#2E0510' }}>{instagramCount}</strong> posts
              </span>
            </div>
          </div>
        </div>
      </div>

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
