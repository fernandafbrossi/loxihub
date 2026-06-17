import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Heart, Users } from 'lucide-react'
import { ComentarForm } from './comentar-form'

export default async function PostInstagramPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: post } = await supabase
    .from('posts_instagram')
    .select('*, personagens(nome, foto_url)')
    .eq('id', id)
    .single()

  if (!post) notFound()

  const { data: comentarios } = await supabase
    .from('comentarios_instagram')
    .select('*, personagens(nome, foto_url)')
    .eq('post_id', id)
    .order('created_at', { ascending: true })

  const { count: curtidas } = await supabase
    .from('curtidas_instagram')
    .select('*', { count: 'exact', head: true })
    .eq('post_id', id)

  const personagem = post.personagens as { nome: string; foto_url: string | null } | null

  const { data: meusPersonagens } = await supabase
    .from('personagens')
    .select('id, nome')
    .order('nome')

  return (
    <div className="p-6 max-w-md mx-auto">
      <Link href="/dashboard/instagram" className="inline-flex items-center gap-1.5 text-sm mb-5 hover:underline" style={{ color: '#906070' }}>
        <ArrowLeft size={14} /> Feed
      </Link>

      <div className="rounded-2xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.60)', borderColor: 'rgba(128,0,32,0.10)' }}>
        <div className="flex items-center gap-3 p-4">
          <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'rgba(128,0,32,0.08)' }}>
            {personagem?.foto_url ? <img src={personagem.foto_url} alt="" className="w-full h-full object-cover" /> : <Users size={16} style={{ color: '#906070' }} />}
          </div>
          <span className="font-semibold text-sm" style={{ color: '#2E0510' }}>{personagem?.nome ?? 'Narrador'}</span>
        </div>

        {post.imagem_url && <img src={post.imagem_url} alt="" className="w-full object-cover" />}

        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <Heart size={22} style={{ color: '#2E0510' }} />
            <span className="text-sm font-semibold" style={{ color: '#2E0510' }}>{curtidas ?? 0} curtidas</span>
          </div>
          <p className="text-sm mb-4" style={{ color: '#2E0510' }}>
            <span className="font-semibold mr-1">{personagem?.nome}</span>
            {post.legenda}
          </p>

          <div className="space-y-3 mb-4">
            {comentarios?.map(c => {
              const autor = c.personagens as { nome: string; foto_url: string | null } | null
              return (
                <div key={c.id} className="flex items-start gap-2">
                  <div className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center shrink-0 mt-0.5" style={{ background: 'rgba(128,0,32,0.08)' }}>
                    {autor?.foto_url ? <img src={autor.foto_url} alt="" className="w-full h-full object-cover" /> : <Users size={12} style={{ color: '#906070' }} />}
                  </div>
                  <p className="text-sm" style={{ color: '#2E0510' }}>
                    <span className="font-semibold mr-1">{autor?.nome ?? 'Personagem'}</span>
                    {c.conteudo}
                  </p>
                </div>
              )
            })}
          </div>

          <ComentarForm postId={id} personagens={meusPersonagens ?? []} userId={user?.id ?? ''} />
        </div>
      </div>
    </div>
  )
}
