'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ImageUpload } from '@/components/image-upload'
import dynamic from 'next/dynamic'

const MapPicker = dynamic(() => import('@/components/map-picker').then(m => m.MapPicker), { ssr: false })

const TIPOS = ['Casa', 'Estabelecimento', 'Cidade', 'Bairro', 'País', 'Natureza', 'Outro']

interface Personagem { id: string; nome: string }

export default function NovoLugarPage() {
  const [nome, setNome] = useState('')
  const [descricao, setDescricao] = useState('')
  const [tipo, setTipo] = useState('')
  const [fotoUrl, setFotoUrl] = useState('')
  const [lat, setLat] = useState<number | null>(null)
  const [lng, setLng] = useState<number | null>(null)
  const [personagens, setPersonagens] = useState<Personagem[]>([])
  const [selectedPersonagens, setSelectedPersonagens] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const universoId = searchParams.get('universo')

  useEffect(() => {
    const supabase = createClient()
    const q = supabase.from('personagens').select('id, nome').order('nome')
    if (universoId) q.eq('universo_id', universoId)
    q.then(({ data }) => { if (data) setPersonagens(data) })
  }, [universoId])

  function togglePersonagem(id: string) {
    setSelectedPersonagens(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: lugar } = await supabase.from('lugares').insert({
      nome, descricao, tipo, foto_url: fotoUrl || null,
      lat: lat ?? null, lng: lng ?? null,
      criado_por: user?.id,
      ...(universoId ? { universo_id: universoId } : {}),
    }).select().single()

    if (lugar && selectedPersonagens.length > 0) {
      await supabase.from('lugar_personagens').insert(
        selectedPersonagens.map(personagem_id => ({ lugar_id: lugar.id, personagem_id }))
      )
    }

    router.push(universoId ? `/dashboard/universos/${universoId}` : '/dashboard/lugares')
    router.refresh()
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href={universoId ? `/dashboard/lugares?universo=${universoId}` : '/dashboard/lugares'} className="text-sm hover:underline" style={{ color: '#906070' }}>← Voltar</Link>
      <h1 className="text-2xl font-bold mt-2 mb-6" style={{ color: '#2E0510' }}>Novo lugar</h1>
      <div className="rounded-xl border p-6" style={{ background: 'rgba(255,255,255,0.60)', borderColor: 'rgba(128,0,32,0.10)' }}>
        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#2E0510' }}>Foto</label>
            <ImageUpload onUpload={setFotoUrl} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#2E0510' }}>Nome *</label>
            <input type="text" value={nome} onChange={e => setNome(e.target.value)} required placeholder="Nome do lugar"
              className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
              style={{ background: '#F5F0F2', borderColor: 'rgba(128,0,32,0.10)', color: '#2E0510' }} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#2E0510' }}>Tipo</label>
            <select value={tipo} onChange={e => setTipo(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none"
              style={{ background: '#F5F0F2', borderColor: 'rgba(128,0,32,0.10)', color: '#2E0510' }}>
              <option value="">Selecionar tipo...</option>
              {TIPOS.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#2E0510' }}>Descrição</label>
            <textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={4}
              placeholder="Descreva o lugar, sua atmosfera, o que tem lá..."
              className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none resize-none"
              style={{ background: '#F5F0F2', borderColor: 'rgba(128,0,32,0.10)', color: '#2E0510' }} />
          </div>

          {personagens.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#2E0510' }}>Personagens vinculados</label>
              <p className="text-xs mb-2" style={{ color: '#906070' }}>Ex: casa, local de trabalho, ponto de encontro...</p>
              <div className="flex flex-wrap gap-2">
                {personagens.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePersonagem(p.id)}
                    className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                    style={
                      selectedPersonagens.includes(p.id)
                        ? { background: '#800020', color: '#FAF0F2' }
                        : { background: 'rgba(128,0,32,0.08)', color: '#906070', border: '0.5px solid rgba(128,0,32,0.15)' }
                    }
                  >
                    {p.nome}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: '#2E0510' }}>Localização no mapa</label>
            <MapPicker lat={lat} lng={lng} onChange={(la, ln) => { setLat(la); setLng(ln) }} />
            {lat != null && (
              <p className="text-[10px] mt-1" style={{ color: '#906070' }}>
                Coordenadas: {lat.toFixed(5)}, {lng?.toFixed(5)}
                <button type="button" onClick={() => { setLat(null); setLng(null) }} className="ml-2 underline">limpar</button>
              </p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <Link href={universoId ? `/dashboard/lugares?universo=${universoId}` : '/dashboard/lugares'} className="flex-1 py-2.5 rounded-lg text-sm font-medium text-center border"
              style={{ borderColor: 'rgba(128,0,32,0.10)', color: '#2E0510' }}>Cancelar</Link>
            <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-lg text-sm font-medium disabled:opacity-60"
              style={{ background: '#800020', color: '#FAF0F2' }}>
              {loading ? 'Salvando...' : 'Criar lugar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
