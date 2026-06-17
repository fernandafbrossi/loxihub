'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ImageUpload } from '@/components/image-upload'

export default function EditarPersonagemPage() {
  const { id } = useParams<{ id: string }>()
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tipo, setTipo] = useState('principal')
  const [fotoUrl, setFotoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.from('personagens').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setNome(data.nome)
        setDescricao(data.descricao ?? '')
        setTipo(data.tipo)
        setFotoUrl(data.foto_url ?? '')
      }
    })
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase.from('personagens').update({ nome, descricao, tipo, foto_url: fotoUrl || null }).eq('id', id)
    router.push(`/dashboard/personagens/${id}`)
    router.refresh()
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href={`/dashboard/personagens/${id}`} className="text-sm hover:underline" style={{ color: 'var(--muted-foreground)' }}>← Voltar</Link>
      <h1 className="text-2xl font-bold mt-2 mb-6" style={{ color: 'var(--foreground)' }}>Editar personagem</h1>
      <div className="rounded-xl border p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Foto</label>
            <ImageUpload onUpload={setFotoUrl} currentUrl={fotoUrl} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Nome *</label>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)} required className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none" style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Tipo</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none" style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
              <option value="principal">Personagem principal</option>
              <option value="npc">NPC</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Descrição / Ficha</label>
            <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={5} className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none resize-none" style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
          </div>
          <div className="flex gap-3 pt-2">
            <Link href={`/dashboard/personagens/${id}`} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-center border" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>Cancelar</Link>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
