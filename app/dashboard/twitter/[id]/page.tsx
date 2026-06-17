import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Heart, Users } from 'lucide-react'
import { TweetForm } from '../tweet-form'

export default async function TweetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tweet } = await supabase
    .from('tweets')
    .select('*, personagens(nome, foto_url), curtidas_tweets(id)')
    .eq('id', id)
    .single()

  if (!tweet) notFound()

  const { data: respostas } = await supabase
    .from('tweets')
    .select('*, personagens(nome, foto_url), curtidas_tweets(id)')
    .eq('tweet_pai_id', id)
    .order('created_at', { ascending: true })

  const { data: personagens } = await supabase.from('personagens').select('id, nome').order('nome')

  const personagem = tweet.personagens as { nome: string; foto_url: string | null } | null
  const curtidas = Array.isArray(tweet.curtidas_tweets) ? tweet.curtidas_tweets.length : 0

  return (
    <div className="p-6 max-w-xl mx-auto">
      <Link href="/dashboard/twitter" className="inline-flex items-center gap-1.5 text-sm mb-5 hover:underline" style={{ color: '#906070' }}>
        <ArrowLeft size={14} /> Timeline
      </Link>

      {/* Tweet principal */}
      <div className="rounded-xl border p-5 mb-4" style={{ background: 'rgba(255,255,255,0.60)', borderColor: 'rgba(128,0,32,0.10)' }}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'rgba(128,0,32,0.08)' }}>
            {personagem?.foto_url ? <img src={personagem.foto_url} alt="" className="w-full h-full object-cover" /> : <Users size={18} style={{ color: '#906070' }} />}
          </div>
          <span className="font-semibold" style={{ color: '#2E0510' }}>{personagem?.nome ?? 'Narrador'}</span>
        </div>
        <p className="text-base leading-relaxed mb-4" style={{ color: '#2E0510' }}>{tweet.conteudo}</p>
        <p className="text-xs mb-3" style={{ color: '#906070' }}>
          {new Date(tweet.created_at).toLocaleString('pt-BR')}
        </p>
        <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: 'rgba(128,0,32,0.10)' }}>
          <Heart size={18} style={{ color: '#906070' }} />
          <span className="text-sm" style={{ color: '#2E0510' }}>{curtidas} curtidas</span>
        </div>
      </div>

      {/* Responder */}
      <div className="mb-6">
        <TweetForm personagens={personagens ?? []} userId={user?.id ?? ''} tweetPaiId={id} />
      </div>

      {/* Respostas */}
      {respostas && respostas.length > 0 && (
        <div className="space-y-0 divide-y" style={{ borderColor: 'rgba(128,0,32,0.10)' }}>
          {respostas.map(r => {
            const autor = r.personagens as { nome: string; foto_url: string | null } | null
            const curtidasR = Array.isArray(r.curtidas_tweets) ? r.curtidas_tweets.length : 0
            return (
              <div key={r.id} className="flex gap-3 py-4">
                <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ background: 'rgba(128,0,32,0.08)' }}>
                  {autor?.foto_url ? <img src={autor.foto_url} alt="" className="w-full h-full object-cover" /> : <Users size={16} style={{ color: '#906070' }} />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm" style={{ color: '#2E0510' }}>{autor?.nome ?? 'Narrador'}</span>
                    <span className="text-xs" style={{ color: '#906070' }}>
                      · {new Date(r.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: '#2E0510' }}>{r.conteudo}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Heart size={13} style={{ color: '#906070' }} />
                    <span className="text-xs" style={{ color: '#906070' }}>{curtidasR}</span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
