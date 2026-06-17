'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

const GENEROS = ['Fantasia', 'Romance', 'Drama', 'Ficção científica', 'Terror', 'Contemporâneo', 'Histórico', 'Outro']

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '10px',
  fontSize: '13px',
  background: 'rgba(255,255,255,0.70)',
  border: '0.5px solid rgba(128,0,32,0.15)',
  color: '#2E0510',
  outline: 'none',
} as const

export default function NovoUniversoPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nome: '',
    genero: '',
    descricao: '',
    status: 'ativo',
  })

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) { setError('O nome é obrigatório.'); return }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data, error: err } = await supabase
      .from('universos')
      .insert({
        nome: form.nome.trim(),
        genero: form.genero || null,
        descricao: form.descricao || null,
        status: form.status,
        user_id: user!.id,
      })
      .select('id')
      .single()

    if (err) { setError(err.message); setLoading(false); return }
    router.push(`/dashboard/universos/${data.id}`)
  }

  return (
    <div className="p-7 max-w-xl">
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs mb-6 hover:opacity-70 transition-opacity"
        style={{ color: '#906070' }}
      >
        <ArrowLeft size={13} /> Voltar
      </Link>

      <h1 className="text-xl font-medium mb-1" style={{ color: '#2E0510' }}>Novo universo</h1>
      <p className="text-xs mb-7" style={{ color: '#906070' }}>Cada universo tem seus personagens, threads e lugares próprios.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        <div>
          <label className="block text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#906070' }}>
            Nome *
          </label>
          <input
            style={inputStyle}
            placeholder="Ex: Renascença Sombria"
            value={form.nome}
            onChange={e => set('nome', e.target.value)}
            autoFocus
          />
        </div>

        <div>
          <label className="block text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#906070' }}>
            Gênero
          </label>
          <div className="flex flex-wrap gap-2">
            {GENEROS.map(g => (
              <button
                key={g}
                type="button"
                onClick={() => set('genero', form.genero === g ? '' : g)}
                className="text-[11px] px-3 py-1.5 rounded-full transition-all"
                style={
                  form.genero === g
                    ? { background: '#800020', color: '#FAF0F2', border: '0.5px solid #800020' }
                    : { background: 'rgba(255,255,255,0.60)', color: '#906070', border: '0.5px solid rgba(128,0,32,0.15)' }
                }
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#906070' }}>
            Descrição
          </label>
          <textarea
            style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }}
            placeholder="Qual é a proposta desse universo?"
            value={form.descricao}
            onChange={e => set('descricao', e.target.value)}
          />
        </div>

        <div>
          <label className="block text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#906070' }}>
            Status
          </label>
          <div className="flex gap-2">
            {['ativo', 'pausado'].map(s => (
              <button
                key={s}
                type="button"
                onClick={() => set('status', s)}
                className="text-[11px] px-3 py-1.5 rounded-full capitalize transition-all"
                style={
                  form.status === s
                    ? { background: '#800020', color: '#FAF0F2', border: '0.5px solid #800020' }
                    : { background: 'rgba(255,255,255,0.60)', color: '#906070', border: '0.5px solid rgba(128,0,32,0.15)' }
                }
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-xs" style={{ color: '#c0392b' }}>{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 py-2.5 rounded-xl text-sm font-medium transition-opacity hover:opacity-80 disabled:opacity-50"
          style={{
            background: '#800020',
            color: '#FAF0F2',
            boxShadow: '0 2px 12px rgba(128,0,32,0.38)',
          }}
        >
          {loading ? 'Criando...' : 'Criar universo'}
        </button>

      </form>
    </div>
  )
}
