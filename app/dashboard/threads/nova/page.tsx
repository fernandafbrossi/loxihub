'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import { X, Plus } from 'lucide-react'
import Link from 'next/link'

export default function NovaThreadPage() {
  const [titulo, setTitulo] = useState('')
  const [descricao, setDescricao] = useState('')
  const [status, setStatus] = useState('em_andamento')
  const [tagInput, setTagInput] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const universoId = searchParams.get('universo')

  function addTag() {
    const t = tagInput.trim().toLowerCase()
    if (t && !tags.includes(t)) {
      setTags([...tags, t])
    }
    setTagInput('')
  }

  function removeTag(tag: string) {
    setTags(tags.filter(t => t !== tag))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('threads').insert({
      titulo,
      descricao,
      status,
      tags,
      criado_por: user?.id,
      ...(universoId ? { universo_id: universoId } : {}),
    })

    if (error) {
      setError('Erro ao criar thread. Tente novamente.')
      setLoading(false)
      return
    }

    router.push(universoId ? `/dashboard/universos/${universoId}` : '/dashboard/threads')
    router.refresh()
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href={universoId ? `/dashboard/threads?universo=${universoId}` : '/dashboard/threads'} className="text-sm hover:underline" style={{ color: '#906070' }}>
          ← Voltar
        </Link>
        <h1 className="text-2xl font-bold mt-2" style={{ color: '#2E0510' }}>Nova thread</h1>
      </div>

      <div className="rounded-xl border p-6" style={{ background: 'rgba(255,255,255,0.60)', borderColor: 'rgba(128,0,32,0.10)' }}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#2E0510' }}>
              Título *
            </label>
            <input
              type="text"
              value={titulo}
              onChange={e => setTitulo(e.target.value)}
              required
              placeholder="Nome do capítulo..."
              className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
              style={{ background: '#F5F0F2', borderColor: 'rgba(128,0,32,0.10)', color: '#2E0510' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#2E0510' }}>
              Descrição
            </label>
            <textarea
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              rows={3}
              placeholder="Resumo ou sinopse da thread..."
              className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none resize-none"
              style={{ background: '#F5F0F2', borderColor: 'rgba(128,0,32,0.10)', color: '#2E0510' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#2E0510' }}>
              Status
            </label>
            <select
              value={status}
              onChange={e => setStatus(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
              style={{ background: '#F5F0F2', borderColor: 'rgba(128,0,32,0.10)', color: '#2E0510' }}
            >
              <option value="em_andamento">Em andamento</option>
              <option value="concluida">Concluída</option>
              <option value="arquivada">Arquivada</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#2E0510' }}>
              Tags
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag() } }}
                placeholder="Ex: angst, fluff, flashback..."
                className="flex-1 px-4 py-2.5 rounded-lg border text-sm outline-none"
                style={{ background: '#F5F0F2', borderColor: 'rgba(128,0,32,0.10)', color: '#2E0510' }}
              />
              <button
                type="button"
                onClick={addTag}
                className="px-3 py-2.5 rounded-lg border text-sm"
                style={{ background: 'rgba(128,0,32,0.08)', borderColor: 'rgba(128,0,32,0.10)', color: '#2E0510' }}
              >
                <Plus size={16} />
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map(tag => (
                  <span
                    key={tag}
                    className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full"
                    style={{ background: 'rgba(128,0,32,0.08)', color: '#906070' }}
                  >
                    {tag}
                    <button type="button" onClick={() => removeTag(tag)}>
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {error && (
            <p className="text-sm py-2 px-3 rounded-lg" style={{ background: 'rgba(128,0,32,0.08)', color: 'var(--destructive)' }}>
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Link
              href={universoId ? `/dashboard/threads?universo=${universoId}` : '/dashboard/threads'}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium text-center border"
              style={{ borderColor: 'rgba(128,0,32,0.10)', color: '#2E0510' }}
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60"
              style={{ background: '#800020', color: '#FAF0F2' }}
            >
              {loading ? 'Criando...' : 'Criar thread'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
