import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Users, Heart, MessageCircle } from 'lucide-react'
import { TweetForm } from './tweet-form'

export default async function TwitterPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tweets } = await supabase
    .from('tweets')
    .select('*, personagens(nome, foto_url), curtidas_tweets(id), tweets!tweet_pai_id(id)')
    .is('tweet_pai_id', null)
    .order('created_at', { ascending: false })

  const { data: personagens } = await supabase.from('personagens').select('id, nome').order('nome')

  return (
    <div className="p-6 max-w-xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Twitter</h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Timeline dos personagens</p>
      </div>

      <TweetForm personagens={personagens ?? []} userId={user?.id ?? ''} />

      <div className="mt-6 space-y-0 divide-y" style={{ borderColor: 'var(--border)' }}>
        {!tweets || tweets.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Nenhum tweet ainda. Escreva o primeiro!</p>
          </div>
        ) : (
          tweets.map(tweet => {
            const personagem = tweet.personagens as { nome: string; foto_url: string | null } | null
            const curtidas = Array.isArray(tweet.curtidas_tweets) ? tweet.curtidas_tweets.length : 0
            const respostas = Array.isArray(tweet['tweets']) ? tweet['tweets'].length : 0

            return (
              <Link key={tweet.id} href={`/dashboard/twitter/${tweet.id}`} className="flex gap-3 py-4 px-1 hover:opacity-80 transition-opacity block">
                <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ background: 'var(--muted)' }}>
                  {personagem?.foto_url ? (
                    <img src={personagem.foto_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <Users size={18} style={{ color: 'var(--muted-foreground)' }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                      {personagem?.nome ?? 'Narrador'}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      · {new Date(tweet.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--foreground)' }}>{tweet.conteudo}</p>
                  <div className="flex items-center gap-5 mt-2">
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      <MessageCircle size={14} /> {respostas}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      <Heart size={14} /> {curtidas}
                    </span>
                  </div>
                </div>
              </Link>
            )
          })
        )}
      </div>
    </div>
  )
}
