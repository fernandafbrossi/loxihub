'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { X, Plus, Trash2, ArrowLeft } from 'lucide-react'

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

export default function EditarThreadPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [status, setStatus] = useState('em_andamento')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [dataNaHistoria, setDataNaHistoria] = useState('')
  const [universoId, setUniversoId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase.from('threads').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setTitulo(data.titulo ?? '')
        setDescricao(data.descricao ?? '')
        setStatus(data.status ?? 'em_andamento')
        setTags(data.tags ?? [])
        setDataNaHistoria(data.data_na_historia ?? '')
        setUniversoId(data.universo_id ?? null)
      }
    })
  }, [id])

  function addTag() {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) setTags(prev => [...prev, t])
    setTagInput('')
  }

  function removeTag(tag: string) {
    setTags(prev => prev.filter(t => t !== tag))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!titulo.trim()) { setError('O título é obrigatório.'); return }
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: err } = await supabase
      .from('threads')
      .update({
        titulo: titulo.trim(),
        descricao: descricao.trim() || null,
        status,
        tags,
        data_na_historia: dataNaHistoria || null,
      })
      .eq('id', id)

    if (err) { setError(err.message); setLoading(false); return }
    router.push(`/dashboard/threads/${id}`)
    router.refresh()
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    setError('')
    const supabase = createClient()

    const { error: postsErr } = await supabase.from('posts').delete().eq('thread_id', id)
    if (postsErr) {
      setError('Erro ao excluir posts: ' + postsErr.message)
      setDeleting(false); setConfirmDelete(false); return
    }

    const { error: err, count } = await supabase
      .from('threads').delete({ count: 'exact' }).eq('id', id)

    if (err) {
      setError('Erro ao excluir thread: ' + err.message)
      setDeleting(false); setConfirmDelete(false); return
    }

    if (count === 0) {
      setError('Nenhuma thread foi excluída. Verifique as permissões no Supabase (política RLS de DELETE).')
      setDeleting(false); setConfirmDelete(false); return
    }

    const destino = universoId ? `/dashboard/universos/${universoId}` : '/dashboard'
    router.push(destino)
    router.refresh()
  }

  return (
    <div className="p-7 max-w-xl">
      <Link
        href={`/dashboard/threads/${id}`}
        className="inline-flex items-center gap-1.5 text-xs mb-6 hover:opacity-70 transition-opacity"
        style={{ color: '#906070' }}
      >
        <ArrowLeft size={13} /> Voltar para a thread
      </Link>

      <h1 className="text-xl font-medium mb-1" style={{ color: '#2E0510' }}>Editar thread</h1>
      <p className="text-xs mb-7" style={{ color: '#906070' }}>Altere o título, descrição, status, data ou tags.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">

        <div>
          <label className="block text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#906070' }}>
            Título *
          </label>
          <input
            style={inputStyle}
            value={titulo}
            onChange={e => setTitulo(e.target.value)}
            placeholder="Nome do capítulo..."
            autoFocus
          />
        </div>

        <div>
          <label className="block text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#906070' }}>
            Descrição
          </label>
          <textarea
            style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            value={descricao}
            onChange={e => setDescricao(e.target.value)}
            placeholder="Resumo ou sinopse..."
          />
        </div>

        <div>
          <label className="block text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#906070' }}>
            Data na história
          </label>
          <input
            type="date"
            style={inputStyle}
            value={dataNaHistoria}
            onChange={e => setDataNaHistoria(e.target.value)}
          />
          <p className="text-[10px] mt-1" style={{ color: '#B09098' }}>
            Quando este capítulo acontece na história (permite datas passadas para flashbacks).
          </p>
        </div>

        <div>
          <label className="block text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#906070' }}>
            Status
          </label>
          <div className="flex gap-2">
            {[
              { value: 'em_andamento', label: 'Em andamento' },
              { value: 'concluida', label: 'Concluída' },
              { value: 'arquivada', label: 'Arquivada' },
            ].map(s => (
              <button
                key={s.value}
                type="button"
                onClick={() => setStatus(s.value)}
                className="text-[11px] px-3 py-1.5 rounded-full transition-all"
                style={
                  status === s.value
                    ? { background: '#800020', color: '#FAF0F2', border: '0.5px solid #800020', boxShadow: '0 2px 8px rgba(128,0,32,0.30)' }
                    : { background: 'rgba(255,255,255,0.60)', color: '#906070', border: '0.5px solid rgba(128,0,32,0.15)' }
                }
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: '#906070' }}>
            Tags
          </label>
          <div className="flex gap-2 mb-2">
            <input
              style={{ ...inputStyle, width: 'auto', flex: 1 }}
              value={tagInput}
              onChange={e => setTagInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
              placeholder="Ex: angst, fluff..."
            />
            <button
              type="button"
              onClick={addTag}
              className="px-3 rounded-lg transition-opacity hover:opacity-70"
              style={{ background: 'rgba(128,0,32,0.08)', color: '#800020', border: '0.5px solid rgba(128,0,32,0.15)' }}
            >
              <Plus size={15} />
            </button>
          </div>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {tags.map(tag => (
                <span
                  key={tag}
                  className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(128,0,32,0.08)', color: '#906070' }}
                >
                  {tag}
                  <button type="button" onClick={() => removeTag(tag)} className="hover:opacity-60">
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {error && (
          <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(192,0,0,0.08)', color: '#c0392b' }}>
            {error}
          </p>
        )}

        <div className="flex gap-3 mt-2">
          <Link
            href={`/dashboard/threads/${id}`}
            className="flex-1 py-2.5 rounded-xl text-xs font-medium text-center transition-opacity hover:opacity-70"
            style={{ background: 'rgba(128,0,32,0.07)', color: '#906070' }}
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-opacity hover:opacity-80"
            style={{ background: '#800020', color: '#FAF0F2', boxShadow: '0 2px 12px rgba(128,0,32,0.35)' }}
          >
            {loading ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </div>

      </form>

      <div
        className="mt-8 p-4 rounded-xl"
        style={{ border: '0.5px solid rgba(192,0,0,0.20)', background: 'rgba(192,0,0,0.03)' }}
      >
        <p className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: '#c0392b' }}>
          Zona de perigo
        </p>
        <p className="text-xs mb-3" style={{ color: '#906070' }}>
          Excluir a thread apaga todos os posts permanentemente. Esta ação não pode ser desfeita.
        </p>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="flex items-center gap-2 text-xs font-medium px-4 py-2 rounded-lg transition-all disabled:opacity-50"
          style={
            confirmDelete
              ? { background: '#c0392b', color: '#fff', boxShadow: '0 2px 8px rgba(192,0,0,0.30)' }
              : { background: 'rgba(192,0,0,0.08)', color: '#c0392b' }
          }
        >
          <Trash2 size={13} />
          {deleting ? 'Excluindo...' : confirmDelete ? 'Confirmar exclusão' : 'Excluir thread'}
        </button>
        {confirmDelete && !deleting && (
          <button
            onClick={() => setConfirmDelete(false)}
            className="ml-2 text-xs px-3 py-2 rounded-lg"
            style={{ color: '#906070' }}
          >
            Cancelar
          </button>
        )}
      </div>
    </div>
  )
}
