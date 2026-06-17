'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, X, Check } from 'lucide-react'

interface DeleteButtonProps {
  table: string
  id: string
  redirectTo: string
  variant?: 'dark' | 'light'
}

export function DeleteButton({ table, id, redirectTo, variant = 'dark' }: DeleteButtonProps) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  async function handleDelete() {
    setDeleting(true)
    setError(null)
    const supabase = createClient()
    const { data, error: err } = await supabase.from(table).delete().eq('id', id).select()
    if (err) {
      setError(err.message)
      setDeleting(false)
      return
    }
    if (!data || data.length === 0) {
      setError('Sem permissão para excluir.')
      setDeleting(false)
      return
    }
    router.push(redirectTo)
  }

  const base = variant === 'dark'
    ? { background: 'rgba(0,0,0,0.25)', color: '#FAF0F2' }
    : { background: 'rgba(128,0,32,0.07)', color: '#800020' }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-1 w-full">
        <span className="text-[9px] text-center leading-tight" style={{ color: '#A32D2D' }}>
          Erro ao excluir
        </span>
        <button
          onClick={() => { setError(null); setConfirming(false) }}
          className="text-[11px] px-2.5 py-1.5 rounded-lg w-full text-center hover:opacity-70 transition-opacity"
          style={base}
        >
          Fechar
        </button>
      </div>
    )
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-1 w-full">
        <span className="text-[9px] text-center" style={{ color: variant === 'dark' ? 'rgba(250,240,242,0.65)' : '#B09098' }}>
          Confirmar exclusão?
        </span>
        <div className="flex gap-1">
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="flex-1 flex items-center justify-center gap-1 text-[11px] py-1.5 rounded-lg disabled:opacity-50"
            style={{ background: '#800020', color: '#FAF0F2' }}
          >
            <Check size={11} /> {deleting ? '...' : 'Sim'}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="flex items-center justify-center px-3 py-1.5 rounded-lg hover:opacity-70 transition-opacity"
            style={base}
          >
            <X size={11} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      className="flex items-center justify-center gap-1.5 text-[11px] px-2 py-1.5 rounded-lg w-full transition-opacity hover:opacity-80"
      style={base}
    >
      <Trash2 size={11} /> Excluir
    </button>
  )
}
