'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ImageUpload } from '@/components/image-upload'
import { DeleteButton } from '@/components/delete-button'

export default function EditarPersonagemPage() {
  const { id } = useParams<{ id: string }>()
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tipo, setTipo] = useState('principal')
  const [fotoUrl, setFotoUrl] = useState('')
  const [faceclaim, setFaceclaim] = useState('')
  const [dataNascimento, setDataNascimento] = useState('')
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
        setFaceclaim(data.faceclaim ?? '')
        setDataNascimento(data.data_nascimento ?? '')
      }
    })
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    await supabase
      .from('personagens')
      .update({
        nome,
        descricao,
        tipo,
        foto_url: fotoUrl || null,
        faceclaim: faceclaim || null,
        data_nascimento: dataNascimento || null,
      })
      .eq('id', id)
    router.push(`/dashboard/personagens/${id}`)
    router.refresh()
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href={`/dashboard/personagens/${id}`} className="text-sm hover:underline" style={{ color: '#906070' }}>← Voltar</Link>
      <h1 className="text-2xl font-bold mt-2 mb-6" style={{ color: '#2E0510' }}>Editar personagem</h1>

      <div className="rounded-xl border p-6" style={{ background: 'rgba(255,255,255,0.60)', borderColor: 'rgba(128,0,32,0.10)' }}>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#2E0510' }}>Foto</label>
            <ImageUpload onUpload={setFotoUrl} currentUrl={fotoUrl} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#2E0510' }}>Nome *</label>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)} required className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none" style={{ background: '#F5F0F2', borderColor: 'rgba(128,0,32,0.10)', color: '#2E0510' }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#2E0510' }}>Faceclaim (FC)</label>
              <input type="text" value={faceclaim} onChange={e => setFaceclaim(e.target.value)} placeholder="Nome do ator/atriz" className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none" style={{ background: '#F5F0F2', borderColor: 'rgba(128,0,32,0.10)', color: '#2E0510' }} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#2E0510' }}>Data de nascimento</label>
              <input type="date" value={dataNascimento} onChange={e => setDataNascimento(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none" style={{ background: '#F5F0F2', borderColor: 'rgba(128,0,32,0.10)', color: '#2E0510' }} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#2E0510' }}>Tipo</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)} className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none" style={{ background: '#F5F0F2', borderColor: 'rgba(128,0,32,0.10)', color: '#2E0510' }}>
              <option value="principal">Personagem principal</option>
              <option value="npc">NPC</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#2E0510' }}>Descrição / Ficha</label>
            <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={5} className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none resize-none" style={{ background: '#F5F0F2', borderColor: 'rgba(128,0,32,0.10)', color: '#2E0510' }} />
          </div>
          <div className="flex gap-3 pt-2">
            <Link href={`/dashboard/personagens/${id}`} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-center border" style={{ borderColor: 'rgba(128,0,32,0.10)', color: '#2E0510' }}>Cancelar</Link>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60" style={{ background: '#800020', color: '#FAF0F2' }}>
              {loading ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 rounded-xl border p-5" style={{ borderColor: 'rgba(128,0,32,0.15)', background: 'rgba(128,0,32,0.03)' }}>
        <p className="text-xs font-medium mb-3" style={{ color: '#906070' }}>Zona de perigo</p>
        <DeleteButton table="personagens" id={id} redirectTo="/dashboard/personagens" variant="light" />
      </div>
    </div>
  )
}
