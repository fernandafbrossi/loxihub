'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, Images } from 'lucide-react'

interface InspoItem {
  id: string
  url: string
}

interface InspoSectionProps {
  personagemId: string
  inspoInicial: InspoItem[]
}

function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center"
      style={{ background: 'rgba(46,5,16,0.88)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.15)' }}
        onClick={onClose}
      >
        <X size={16} color="#FAF0F2" />
      </button>
      <img
        src={url}
        alt=""
        className="max-h-[88vh] max-w-[88vw] object-contain rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
      />
    </div>,
    document.body
  )
}

function InspoImage({ item, onRemove, onOpen }: {
  item: InspoItem
  onRemove: (id: string) => void
  onOpen: (url: string) => void
}) {
  const [broken, setBroken] = useState(false)

  return (
    <div className="relative group flex-shrink-0">
      {broken ? (
        <div
          className="w-24 h-32 rounded-xl flex items-center justify-center"
          style={{ background: 'rgba(128,0,32,0.06)', border: '0.5px dashed rgba(128,0,32,0.20)' }}
        >
          <span className="text-[9px] text-center px-1" style={{ color: '#B09098' }}>link inválido</span>
        </div>
      ) : (
        <img
          src={item.url}
          alt=""
          className="w-24 h-32 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
          style={{ border: '0.5px solid rgba(128,0,32,0.12)' }}
          onError={() => setBroken(true)}
          onClick={() => onOpen(item.url)}
        />
      )}
      <button
        onClick={() => onRemove(item.id)}
        className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
        style={{ background: '#800020', color: '#FAF0F2', boxShadow: '0 1px 4px rgba(40,5,15,0.30)' }}
        title="Remover"
      >
        <X size={10} />
      </button>
    </div>
  )
}

export function InspoSection({ personagemId, inspoInicial }: InspoSectionProps) {
  const [inspos, setInspos] = useState<InspoItem[]>(inspoInicial)
  const [adding, setAdding] = useState(false)
  const [novaUrl, setNovaUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  async function adicionar() {
    const url = novaUrl.trim()
    if (!url) return
    setSaving(true)
    const supabase = createClient()
    const { data } = await supabase
      .from('inspo_personagem')
      .insert({ personagem_id: personagemId, url })
      .select('id, url')
      .single()
    if (data) setInspos(prev => [...prev, data])
    setNovaUrl('')
    setAdding(false)
    setSaving(false)
  }

  async function remover(id: string) {
    const supabase = createClient()
    await supabase.from('inspo_personagem').delete().eq('id', id)
    setInspos(prev => prev.filter(i => i.id !== id))
  }

  return (
    <div>
      {lightboxUrl && <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}

      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] uppercase tracking-widest" style={{ color: '#B09098' }}>
          Inspo
        </p>
        <button
          onClick={() => setAdding(a => !a)}
          className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg transition-opacity hover:opacity-70"
          style={{ background: 'rgba(128,0,32,0.07)', color: '#800020' }}
        >
          <Plus size={10} /> Adicionar
        </button>
      </div>

      {adding && (
        <div className="mb-3 flex gap-2">
          <input
            type="text"
            value={novaUrl}
            onChange={e => setNovaUrl(e.target.value)}
            placeholder="Cole a URL da imagem (Pinterest, etc.)"
            autoFocus
            className="flex-1 text-xs px-3 py-1.5 rounded-lg outline-none"
            style={{
              background: 'rgba(255,255,255,0.70)',
              border: '0.5px solid rgba(128,0,32,0.20)',
              color: '#2E0510',
            }}
            onKeyDown={e => {
              if (e.key === 'Enter') adicionar()
              if (e.key === 'Escape') { setAdding(false); setNovaUrl('') }
            }}
          />
          <button
            onClick={adicionar}
            disabled={saving || !novaUrl.trim()}
            className="text-xs px-3 py-1.5 rounded-lg disabled:opacity-40 transition-opacity hover:opacity-80"
            style={{ background: '#800020', color: '#FAF0F2' }}
          >
            {saving ? '...' : 'OK'}
          </button>
        </div>
      )}

      {inspos.length === 0 && !adding ? (
        <div className="flex flex-col items-center justify-center py-6 gap-2" style={{ opacity: 0.5 }}>
          <Images size={22} style={{ color: '#B09098' }} />
          <p className="text-xs" style={{ color: '#B09098' }}>Nenhuma inspo ainda</p>
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {inspos.map(item => (
            <InspoImage key={item.id} item={item} onRemove={remover} onOpen={setLightboxUrl} />
          ))}
        </div>
      )}
    </div>
  )
}
