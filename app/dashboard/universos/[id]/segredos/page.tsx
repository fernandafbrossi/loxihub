'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ArrowLeft, Lock, Save } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

const card = {
  background: 'rgba(255,255,255,0.60)',
  border: '0.5px solid rgba(128,0,32,0.08)',
  backdropFilter: 'blur(8px)',
} as const

export default function SegredosPage() {
  const params = useParams()
  const universoId = params.id as string

  const [conteudo, setConteudo] = useState('')
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<Date | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase
        .from('notas_privadas')
        .select('conteudo')
        .eq('user_id', user.id)
        .eq('universo_id', universoId)
        .maybeSingle()
      setConteudo(data?.conteudo ?? '')
      setLoaded(true)
    })
  }, [universoId])

  async function salvar(texto: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setSaving(true)
    await supabase
      .from('notas_privadas')
      .upsert(
        { user_id: user.id, universo_id: universoId, conteudo: texto, updated_at: new Date().toISOString() },
        { onConflict: 'user_id,universo_id' }
      )
    setSaving(false)
    setSavedAt(new Date())
  }

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const val = e.target.value
    setConteudo(val)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => salvar(val), 1200)
  }

  const salvoTexto = savedAt
    ? `salvo às ${savedAt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    : ''

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="max-w-3xl mx-auto flex flex-col gap-4">

        <Link
          href={`/dashboard/universos/${universoId}`}
          className="inline-flex items-center gap-1.5 text-xs self-start hover:opacity-70 transition-opacity"
          style={{ color: '#906070' }}
        >
          <ArrowLeft size={13} /> Universo
        </Link>

        <div className="rounded-2xl p-6" style={card}>
          <div className="flex items-center gap-2 mb-1">
            <Lock size={14} style={{ color: '#800020' }} />
            <h1 className="text-lg font-semibold" style={{ color: '#2E0510' }}>Segredos</h1>
          </div>
          <p className="text-xs mb-5" style={{ color: '#906070' }}>
            Só você vê estas notas — a outra usuária não tem acesso.
          </p>

          {!loaded ? (
            <div className="h-64 rounded-xl animate-pulse" style={{ background: 'rgba(128,0,32,0.05)' }} />
          ) : (
            <textarea
              value={conteudo}
              onChange={handleChange}
              placeholder="Escreva seus segredos, planos, notas de personagem que só você sabe..."
              className="w-full resize-none outline-none rounded-xl px-4 py-3 text-sm leading-relaxed"
              style={{
                background: 'rgba(255,255,255,0.65)',
                border: '0.5px solid rgba(128,0,32,0.12)',
                color: '#2E0510',
                minHeight: 320,
              }}
            />
          )}

          <div className="flex items-center justify-between mt-3">
            <span className="text-[10px]" style={{ color: '#B09098' }}>
              {saving ? 'Salvando...' : salvoTexto}
            </span>
            <button
              onClick={() => salvar(conteudo)}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg disabled:opacity-40 transition-opacity hover:opacity-80"
              style={{ background: '#800020', color: '#FAF0F2' }}
            >
              <Save size={12} /> Salvar agora
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}
