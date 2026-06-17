'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ImageUpload } from '@/components/image-upload'

interface Personagem { id: string; nome: string }

export default function NovoPostInstagramPage() {
  const [personagens, setPersonagens] = useState<Personagem[]>([])
  const [personagemId, setPersonagemId] = useState('')
  const [legenda, setLegenda] = useState('')
  const [imagemUrl, setImagemUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.from('personagens').select('id, nome').order('nome').then(({ data }) => setPersonagens(data ?? []))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('posts_instagram').insert({
      legenda,
      imagem_url: imagemUrl || null,
      personagem_id: personagemId || null,
      criado_por: user?.id,
    })
    router.push('/dashboard/instagram')
    router.refresh()
  }

  return (
    <div className="p-6 max-w-md mx-auto">
      <Link href="/dashboard/instagram" className="text-sm hover:underline" style={{ color: 'var(--muted-foreground)' }}>← Voltar</Link>
      <h1 className="text-2xl font-bold mt-2 mb-6" style={{ color: 'var(--foreground)' }}>Novo post</h1>
      <div className="rounded-xl border p-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Foto</label>
            <ImageUpload onUpload={setImagemUrl} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Personagem</label>
            <select value={personagemId} onChange={e => setPersonagemId(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none" style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
              <option value="">Sem personagem (narrador)</option>
              {personagens.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: 'var(--foreground)' }}>Legenda *</label>
            <textarea value={legenda} onChange={e => setLegenda(e.target.value)} required rows={4} placeholder="Escreva a legenda do post..." className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none resize-none" style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }} />
          </div>
          <div className="flex gap-3 pt-2">
            <Link href="/dashboard/instagram" className="flex-1 py-2.5 rounded-lg text-sm font-medium text-center border" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>Cancelar</Link>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
              {loading ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
