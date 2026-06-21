'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, Link2 } from 'lucide-react'
import Link from 'next/link'

interface Personagem {
  id: string
  nome: string
  foto_url: string | null
}

interface Vinculo {
  id: string
  tipo_relacao: string
  nota: string | null
  outro: Personagem
}

interface VinculosSectionProps {
  personagemId: string
  vinculosIniciais: Vinculo[]
  todosPersonagens: Personagem[]
}

function AvatarPequeno({ p }: { p: Personagem }) {
  const [err, setErr] = useState(false)
  return p.foto_url && !err ? (
    <img
      src={p.foto_url}
      alt={p.nome}
      className="w-9 h-9 rounded-full object-cover flex-shrink-0"
      style={{ boxShadow: '0 2px 8px rgba(40,5,15,0.10)' }}
      onError={() => setErr(true)}
    />
  ) : (
    <div
      className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
      style={{
        background: 'linear-gradient(135deg, #C08090, #A06070)',
        color: '#FAF0F2',
        boxShadow: '0 2px 8px rgba(40,5,15,0.10)',
      }}
    >
      {p.nome[0].toUpperCase()}
    </div>
  )
}

export function VinculosSection({ personagemId, vinculosIniciais, todosPersonagens }: VinculosSectionProps) {
  const [vinculos, setVinculos] = useState<Vinculo[]>(vinculosIniciais)
  const [adding, setAdding] = useState(false)
  const [novoOutroId, setNovoOutroId] = useState('')
  const [novoTipo, setNovoTipo] = useState('')
  const [novaNota, setNovaNota] = useState('')
  const [saving, setSaving] = useState(false)

  const disponiveis = todosPersonagens.filter(
    p => p.id !== personagemId && !vinculos.some(v => v.outro.id === p.id)
  )

  async function adicionar() {
    if (!novoOutroId || !novoTipo.trim()) return
    setSaving(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('relacoes_personagens')
      .insert({
        personagem_a: personagemId,
        personagem_b: novoOutroId,
        tipo_relacao: novoTipo.trim(),
        nota: novaNota.trim() || null,
      })
      .select('id, tipo_relacao, nota')
      .single()

    if (data) {
      const outro = todosPersonagens.find(p => p.id === novoOutroId)!
      setVinculos(prev => [...prev, { id: data.id, tipo_relacao: data.tipo_relacao, nota: data.nota, outro }])
    }
    setNovoOutroId('')
    setNovoTipo('')
    setNovaNota('')
    setAdding(false)
    setSaving(false)
  }

  async function remover(id: string) {
    const supabase = createClient()
    await supabase.from('relacoes_personagens').delete().eq('id', id)
    setVinculos(prev => prev.filter(v => v.id !== id))
  }

  return (
    <div className="rounded-2xl p-5" style={{
      background: 'rgba(255,255,255,0.60)',
      border: '0.5px solid rgba(128,0,32,0.08)',
      backdropFilter: 'blur(8px)',
    }}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-widest" style={{ color: '#B09098' }}>
          Vínculos
        </p>
        <button
          onClick={() => setAdding(a => !a)}
          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-opacity hover:opacity-70"
          style={{ background: 'rgba(128,0,32,0.07)', color: '#800020' }}
        >
          <Plus size={10} /> Novo vínculo
        </button>
      </div>

      {adding && (
        <div
          className="mb-4 p-3 rounded-xl flex flex-col gap-2"
          style={{ background: 'rgba(128,0,32,0.04)', border: '0.5px solid rgba(128,0,32,0.12)' }}
        >
          <select
            value={novoOutroId}
            onChange={e => setNovoOutroId(e.target.value)}
            className="text-xs px-3 py-1.5 rounded-lg outline-none"
            style={{
              background: 'rgba(255,255,255,0.70)',
              border: '0.5px solid rgba(128,0,32,0.20)',
              color: novoOutroId ? '#2E0510' : '#B09098',
            }}
          >
            <option value="">Escolha um personagem...</option>
            {disponiveis.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>

          <input
            type="text"
            value={novoTipo}
            onChange={e => setNovoTipo(e.target.value)}
            placeholder="Tipo de vínculo (ex: amor, rival, amizade...)"
            className="text-xs px-3 py-1.5 rounded-lg outline-none"
            style={{
              background: 'rgba(255,255,255,0.70)',
              border: '0.5px solid rgba(128,0,32,0.20)',
              color: '#2E0510',
            }}
          />

          <input
            type="text"
            value={novaNota}
            onChange={e => setNovaNota(e.target.value)}
            placeholder="Nota curta (opcional)"
            className="text-xs px-3 py-1.5 rounded-lg outline-none"
            style={{
              background: 'rgba(255,255,255,0.70)',
              border: '0.5px solid rgba(128,0,32,0.20)',
              color: '#2E0510',
            }}
            onKeyDown={e => { if (e.key === 'Enter') adicionar() }}
          />

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setAdding(false); setNovoOutroId(''); setNovoTipo(''); setNovaNota('') }}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: 'rgba(128,0,32,0.08)', color: '#906070' }}
            >
              Cancelar
            </button>
            <button
              onClick={adicionar}
              disabled={saving || !novoOutroId || !novoTipo.trim()}
              className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-40 transition-opacity hover:opacity-80"
              style={{ background: '#800020', color: '#FAF0F2' }}
            >
              {saving ? '...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}

      {vinculos.length === 0 && !adding ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2" style={{ opacity: 0.5 }}>
          <Link2 size={20} style={{ color: '#B09098' }} />
          <p className="text-xs" style={{ color: '#B09098' }}>Nenhum vínculo ainda</p>
        </div>
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-1">
          {vinculos.map(v => (
            <div
              key={v.id}
              className="group relative flex items-center gap-3 px-4 py-3 rounded-xl flex-shrink-0"
              style={{
                background: 'rgba(255,255,255,0.55)',
                border: '0.5px solid rgba(128,0,32,0.08)',
              }}
            >
              <Link href={`/dashboard/personagens/${v.outro.id}`} className="flex items-center gap-3 hover:opacity-75 transition-opacity">
                <AvatarPequeno p={v.outro} />
                <div>
                  <p className="text-sm font-medium" style={{ color: '#2E0510' }}>{v.outro.nome}</p>
                  <p className="text-[11px]" style={{ color: '#906070' }}>{v.tipo_relacao}</p>
                  {v.nota && (
                    <p className="text-[10px] mt-0.5" style={{ color: '#B09098' }}>{v.nota}</p>
                  )}
                </div>
              </Link>
              <button
                onClick={() => remover(v.id)}
                className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                style={{ background: '#800020', color: '#FAF0F2', boxShadow: '0 1px 4px rgba(40,5,15,0.30)' }}
                title="Remover vínculo"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
