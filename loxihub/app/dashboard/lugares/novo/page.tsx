'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ImageUpload } from '@/components/image-upload'

const TIPOS = ['Casa', 'Estabelecimento', 'Cidade', 'Bairro', 'País', 'Natureza', 'Outro']

export default function NovoLugarPage() {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tipo, setTipo] = useState('')
  const [fotoUrl, setFotoUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('lugares').insert({ nome, descricao, tipo, foto_url: fotoUrl || null, criado_por: user?.id })
    router.push('/dashboard/lugares')
    router.refresh()
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href="/dashboard/lugares" className="text-sm hover:underline" style={{ color: 'var(--muted-foreground)' }}>← Voltar</Link>
      <h1 className="text-2xl font-bold mt-2 mb-6" style={{ color: 'var(--foreground)' }}>Novo lugar</h1>
      <div className="rounded-xl border p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Foto</label>
            <ImageUpload onUpload={setFotoUrl} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Nome *</label>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)} required placeholder="Nome do lugar" className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none" style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Tipo</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none" style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
              <option value="">Selecionar tipo...</option>
              {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Descrição</label>
            <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={4} placeholder="Descreva o lugar, sua atmosfera, o que tem lá..." className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none resize-none" style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
          </div>
          <div className="flex gap-3 pt-2">
            <Link href="/dashboard/lugares" className="flex-1 py-2.5 rounded-lg text-sm font-medium text-center border" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>Cancelar</Link>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
              {loading ? 'Salvando...' : 'Criar lugar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
