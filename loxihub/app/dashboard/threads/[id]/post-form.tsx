'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Send } from 'lucide-react'

interface PostFormProps {
  threadId: string
  personagemPrincipal: string
}

export function PostForm({ threadId, personagemPrincipal }: PostFormProps) {
  const [conteudo, setConteudo] = useState('')
  const [personagemPov, setPersonagemPov] = useState(personagemPrincipal)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!conteudo.trim()) return
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('posts').insert({
      thread_id: threadId,
      conteudo: conteudo.trim(),
      personagem_pov: personagemPov.trim() || null,
      criado_por: user?.id,
    })

    setConteudo('')
    setLoading(false)
    router.refresh()
  }

  return (
    <div className="sticky bottom-0 pt-4 pb-2" style={{ background: 'var(--background)' }}>
      <form onSubmit={handleSubmit} className="rounded-xl border p-4 shadow-sm" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="mb-3">
          <input
            type="text"
            value={personagemPov}
            onChange={e => setPersonagemPov(e.target.value)}
            placeholder="POV do personagem (ex: Lucas, Narrador...)"
            className="w-full px-3 py-2 rounded-lg border text-xs outline-none"
            style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
        </div>
        <div className="flex gap-2">
          <textarea
            value={conteudo}
            onChange={e => setConteudo(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && e.ctrlKey) handleSubmit(e as unknown as React.FormEvent)
            }}
            rows={3}
            placeholder="Escreva sua parte da história... (Ctrl+Enter para enviar)"
            className="flex-1 px-3 py-2.5 rounded-lg border text-sm outline-none resize-none"
            style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}
          />
          <button
            type="submit"
            disabled={loading || !conteudo.trim()}
            className="px-4 rounded-lg disabled:opacity-40 transition-opacity self-end"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            <Send size={18} />
          </button>
        </div>
        <p className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>Ctrl+Enter para enviar</p>
      </form>
    </div>
  )
}
