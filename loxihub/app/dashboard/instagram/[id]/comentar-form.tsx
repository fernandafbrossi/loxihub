'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'

interface Props {
  postId: string
  personagens: { id: string; nome: string }[]
  userId: string
}

export function ComentarForm({ postId, personagens, userId }: Props) {
  const [conteudo, setConteudo] = useState('')
  const [personagemId, setPersonagemId] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!conteudo.trim()) return
    setLoading(true)
    const supabase = createClient()
    await supabase.from('comentarios_instagram').insert({
      post_id: postId,
      conteudo: conteudo.trim(),
      personagem_id: personagemId || null,
      criado_por: userId,
    })
    setConteudo('')
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
      <select value={personagemId} onChange={e => setPersonagemId(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-xs outline-none" style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
        <option value="">Como narrador</option>
        {personagens.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
      </select>
      <div className="flex gap-2">
        <input
          type="text"
          value={conteudo}
          onChange={e => setConteudo(e.target.value)}
          placeholder="Adicionar comentário..."
          className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
          style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
        />
        <button type="submit" disabled={loading || !conteudo.trim()} className="px-3 py-2 rounded-lg disabled:opacity-40" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
          <Send size={15} />
        </button>
      </div>
    </form>
  )
}
