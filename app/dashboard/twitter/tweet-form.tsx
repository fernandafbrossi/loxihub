'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Users } from 'lucide-react'

interface Props {
  personagens: { id: string; nome: string }[]
  userId: string
  tweetPaiId?: string
  onSuccess?: () => void
}

export function TweetForm({ personagens, userId, tweetPaiId, onSuccess }: Props) {
  const [conteudo, setConteudo] = useState('')
  const [personagemId, setPersonagemId] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const max = 280

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!conteudo.trim() || conteudo.length > max) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('tweets').insert({
      conteudo: conteudo.trim(),
      personagem_id: personagemId || null,
      tweet_pai_id: tweetPaiId ?? null,
      criado_por: userId,
    })
    setConteudo('')
    setLoading(false)
    if (onSuccess) onSuccess()
    else router.refresh()
  }

  const restante = max - conteudo.length

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border p-4" style={{ background: 'rgba(255,255,255,0.60)', borderColor: 'rgba(128,0,32,0.10)' }}>
      <div className="flex gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 mt-1" style={{ background: 'rgba(128,0,32,0.08)' }}>
          <Users size={16} style={{ color: '#906070' }} />
        </div>
        <div className="flex-1">
          <select
            value={personagemId}
            onChange={e => setPersonagemId(e.target.value)}
            className="mb-2 px-3 py-1.5 rounded-lg border text-xs outline-none"
            style={{ background: '#F5F0F2', borderColor: 'rgba(128,0,32,0.10)', color: '#2E0510' }}
          >
            <option value="">Como narrador</option>
            {personagens.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
          <textarea
            value={conteudo}
            onChange={e => setConteudo(e.target.value)}
            rows={3}
            placeholder={tweetPaiId ? 'Escreva sua resposta...' : 'O que está acontecendo?'}
            className="w-full px-0 py-1 text-sm outline-none resize-none bg-transparent"
            style={{ color: '#2E0510' }}
          />
          <div className="flex items-center justify-between pt-2 border-t mt-2" style={{ borderColor: 'rgba(128,0,32,0.10)' }}>
            <span className="text-xs" style={{ color: restante < 20 ? 'var(--destructive)' : '#906070' }}>
              {restante}
            </span>
            <button
              type="submit"
              disabled={loading || !conteudo.trim() || conteudo.length > max}
              className="px-4 py-1.5 rounded-full text-sm font-semibold disabled:opacity-50"
              style={{ background: '#800020', color: '#FAF0F2' }}
            >
              {tweetPaiId ? 'Responder' : 'Tweetar'}
            </button>
          </div>
        </div>
      </div>
    </form>
  )
}
