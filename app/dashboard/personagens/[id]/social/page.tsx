import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Settings } from 'lucide-react'
import { SocialClient } from './social-client'

export default async function SocialPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: personagem } = await supabase
    .from('personagens')
    .select('id, nome, foto_url, username, bio_twitter, bio_instagram, capa_url, seguidores_twitter, seguindo_twitter, seguidores_instagram, seguindo_instagram')
    .eq('id', id)
    .single()

  if (!personagem) notFound()

  const { data: posts } = await supabase
    .from('posts_sociais')
    .select('*')
    .eq('personagem_id', id)
    .order('data_post', { ascending: false })

  const postIds = (posts ?? []).map((p: any) => p.id)

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

  const handle = personagem.username
    ? `@${personagem.username}`
    : `@${personagem.nome.toLowerCase().replace(/\s+/g, '_')}`

  const twitterPosts = (posts ?? []).filter((p: any) => !p.tipo || p.tipo === 'twitter')
  const instagramPosts = (posts ?? []).filter((p: any) => p.tipo === 'instagram')

  return (
    <div className="flex-1 overflow-y-auto">

      {/* ── Perfil ── */}
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
            <Settings size={12} /> Editar perfil
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
            <p className="text-xs mt-0.5" style={{ color: '#906070' }}>{handle}</p>
            <div className="flex gap-3 mt-1.5">
              <span className="text-[11px]" style={{ color: '#B09098' }}>
                <strong style={{ color: '#2E0510' }}>{twitterPosts.length}</strong> tweets
              </span>
              <span className="text-[11px]" style={{ color: '#B09098' }}>
                <strong style={{ color: '#2E0510' }}>{instagramPosts.length}</strong> posts
              </span>
            </div>
          </div>
        </div>
      </div>

      <SocialClient
        personagemId={id}
        personagem={personagem}
        twitterPosts={twitterPosts}
        instagramPosts={instagramPosts}
        userId={user?.id ?? ''}
        bioTwitter={personagem.bio_twitter ?? null}
        bioInstagram={personagem.bio_instagram ?? null}
        seguindoTwitter={personagem.seguindo_twitter ?? 0}
        seguidoresTwitter={personagem.seguidores_twitter ?? 0}
        seguindoInsta={personagem.seguindo_instagram ?? 0}
        seguidoresInsta={personagem.seguidores_instagram ?? 0}
        todosPersonagens={todosPersonagens ?? []}
        curtidasIniciais={curtidas ?? []}
        comentariosIniciais={comentarios ?? []}
      />
    </div>
  )
}
