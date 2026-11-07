'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Pers = { id: string; nome: string; foto_url: string | null }

export function NovaConversa({ personagens, universoId }: { personagens: Pers[]; universoId: string | null }) {
  const [open, setOpen] = useState(false)
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function criar() {
    if (!a || !b || a === b) return
    setLoading(true)
    const supabase = createClient()

    // conversa já existe (em qualquer ordem)?
    const { data: existente } = await supabase
      .from('dm_conversas')
      .select('id')
      .or(`and(personagem_a.eq.${a},personagem_b.eq.${b}),and(personagem_a.eq.${b},personagem_b.eq.${a})`)
      .maybeSingle()

    let id = existente?.id as string | undefined
    if (!id) {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase
        .from('dm_conversas')
        .insert({ personagem_a: a, personagem_b: b, universo_id: universoId, criado_por: user?.id })
        .select('id')
        .single()
      if (error || !data) {
        setLoading(false)
        alert('Não foi possível criar a conversa.')
        return
      }
      id = data.id
    }
    router.push(`/dashboard/mensagens/${id}${universoId ? `?universo=${universoId}` : ''}`)
  }

  const selectStyle = {
    background: 'var(--input)', border: '0.5px solid var(--p-15)', color: 'var(--foreground)',
  } as const

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg hover:opacity-80 transition-opacity"
        style={{ background: 'var(--btn-primary)', color: 'var(--primary-foreground)' }}
      >
        <Plus size={13} /> Nova
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-72 rounded-xl p-3 z-20 space-y-2"
          style={{ background: 'rgba(247,240,243,0.98)', border: '0.5px solid var(--p-15)', boxShadow: '0 8px 32px rgba(40,5,15,0.18)' }}
        >
          <select value={a} onChange={e => setA(e.target.value)} className="w-full text-sm rounded-lg px-3 py-2.5" style={selectStyle}>
            <option value="">Dono do celular…</option>
            {personagens.map(p => (
              <option key={p.id} value={p.id} disabled={p.id === b}>{p.nome}</option>
            ))}
          </select>
          <select value={b} onChange={e => setB(e.target.value)} className="w-full text-sm rounded-lg px-3 py-2.5" style={selectStyle}>
            <option value="">Conversando com…</option>
            {personagens.map(p => (
              <option key={p.id} value={p.id} disabled={p.id === a}>{p.nome}</option>
            ))}
          </select>
          <button
            onClick={criar}
            disabled={!a || !b || a === b || loading}
            className="w-full text-xs py-2.5 rounded-lg disabled:opacity-30"
            style={{ background: 'var(--btn-primary)', color: 'var(--primary-foreground)' }}
          >
            {loading ? 'Abrindo…' : 'Abrir conversa'}
          </button>
        </div>
      )}
    </div>
  )
}
