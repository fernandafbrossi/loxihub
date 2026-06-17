'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ImageUpload } from '@/components/image-upload'

export default function NovoPersonagemPage() {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tipo, setTipo] = useState('principal')
  const [fotoUrl, setFotoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const universoId = searchParams.get('universo')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('personagens').insert({
      nome,
      descricao,
      tipo,
      foto_url: fotoUrl || null,
      criado_por: user?.id,
      ...(universoId ? { universo_id: universoId } : {}),
    })

    if (error) {
      setError('Erro ao criar personagem.')
      setLoading(false)
      return
    }

    router.push(universoId ? `/dashboard/universos/${universoId}` : '/dashboard/personagens')
    router.refresh()
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href={universoId ? `/dashboard/personagens?universo=${universoId}` : '/dashboard/personagens'} className="text-sm hover:underline" style={{ color: '#906070' }}>
        ← Voltar
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6" style={{ color: '#2E0510' }}>Novo personagem</h1>

      <div className="rounded-xl border p-6" style={{ background: 'rgba(255,255,255,0.60)', borderColor: 'rgba(128,0,32,0.10)' }}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#2E0510' }}>Foto</label>
            <ImageUpload onUpload={setFotoUrl} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#2E0510' }}>Nome *</label>
            <input
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              required
              placeholder="Nome do personagem"
              className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
              style={{ background: '#F5F0F2', borderColor: 'rgba(128,0,32,0.10)', color: '#2E0510' }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#2E0510' }}>Tipo</label>
            <select
              value={tipo}
              onChange={e => setTipo(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
              style={{ background: '#F5F0F2', borderColor: 'rgba(128,0,32,0.10)', color: '#2E0510' }}
            >
              <option value="principal">Personagem principal</option>
              <option value="npc">NPC</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#2E0510' }}>Descrição / Ficha</label>
            <textarea
              value={descricao}
              onChange={e => setDescricao(e.target.value)}
              rows={5}
              placeholder="Personalidade, aparência, história, características..."
              className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none resize-none"
              style={{ background: '#F5F0F2', borderColor: 'rgba(128,0,32,0.10)', color: '#2E0510' }}
            />
          </div>

          {error && (
            <p className="text-sm py-2 px-3 rounded-lg" style={{ background: 'rgba(128,0,32,0.08)', color: 'var(--destructive)' }}>{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Link href="/dashboard/personagens" className="flex-1 py-2.5 rounded-lg text-sm font-medium text-center border" style={{ borderColor: 'rgba(128,0,32,0.10)', color: '#2E0510' }}>
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60"
              style={{ background: '#800020', color: '#FAF0F2' }}
            >
              {loading ? 'Salvando...' : 'Criar personagem'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
