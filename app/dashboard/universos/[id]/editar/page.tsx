'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Trash2 } from 'lucide-react'

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

export default function EditarUniversoPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ nome: '', genero: '', descricao: '', status: 'ativo' })

  useEffect(() => {
    const supabase = createClient()
    supabase.from('universos').select('nome, genero, descricao, status').eq('id', id).single()
      .then(({ data }) => {
        if (data) setForm({
          nome: data.nome ?? '',
          genero: data.genero ?? '',
          descricao: data.descricao ?? '',
          status: data.status ?? 'ativo',
        })
      })
  }, [id])

  function set(field: string, value: string) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nome.trim()) { setError('O nome é obrigatório.'); return }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: err } = await supabase
      .from('universos')
      .update({
        nome: form.nome.trim(),
        genero: form.genero || null,
        descricao: form.descricao || null,
        status: form.status,
      })
      .eq('id', id)

    if (err) { setError(err.message); setLoading(false); return }
    router.push(`/dashboard/universos/${id}`)
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('universos').delete().eq('id', id)
    router.push('/dashboard')
  }

  return (
    <div className="p-7 max-w-xl">
      <Link
        href={`/dashboard/universos/${id}`}
        className="inline-flex items-center gap-1.5 text-xs mb-6 hover:opacity-70 transition-opacity"
        style={{ color: '#906070' }}
      >
        <ArrowLeft size={13} /> Voltar ao universo
      </Link>

      <h1 className="text-xl font-medium mb-1" style={{ color: '#2E0510' }}>Editar universo</h1>
      <p className="text-xs mb-7" style={{ color: '#906070' }}>Atualize as informações do universo.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        <div>
          <label className="block text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#906070' }}>
            Nome *
          </label>
          <input
            style={inputStyle}
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
            {['ativo', 'pausado', 'arquivado'].map(s => (
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
          style={{ background: '#800020', color: '#FAF0F2', boxShadow: '0 2px 12px rgba(128,0,32,0.38)' }}
        >
          {loading ? 'Salvando...' : 'Salvar alterações'}
        </button>

      </form>

      {/* Zona de perigo */}
      <div className="mt-10 pt-6" style={{ borderTop: '0.5px solid rgba(128,0,32,0.10)' }}>
        <p className="text-[10px] font-medium uppercase tracking-wider mb-3" style={{ color: '#B09098' }}>
          Zona de perigo
        </p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-2 text-xs px-3 py-2 rounded-lg transition-all"
          style={
            confirmDelete
              ? { background: '#c0392b', color: '#fff' }
              : { background: 'rgba(192,57,43,0.08)', color: '#c0392b', border: '0.5px solid rgba(192,57,43,0.20)' }
          }
        >
          <Trash2 size={13} />
          {deleting ? 'Excluindo...' : confirmDelete ? 'Confirmar exclusão do universo' : 'Excluir universo'}
        </button>
        {confirmDelete && (
          <p className="text-[10px] mt-2" style={{ color: '#c0392b' }}>
            Isso vai excluir o universo permanentemente. Clique novamente para confirmar.
          </p>
        )}
      </div>
    </div>
  )
}
