'use client'

import { useState } from 'react'
import { createPortal } from 'react-dom'
import { createClient } from '@/lib/supabase/client'
import { Shirt, X, Link, Upload } from 'lucide-react'

interface RoupaItem {
  id: string
  roupa_url: string
}

interface GuardaRoupaSectionProps {
  personagemId: string
  roupasIniciais: RoupaItem[]
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

function OutfitThumb({ roupa, onOpen, onDelete }: {
  roupa: RoupaItem
  onOpen: (url: string) => void
  onDelete: (id: string) => void
}) {
  const [broken, setBroken] = useState(false)

  if (broken) {
    return (
      <div className="relative group">
        <div
          className="w-20 h-28 rounded-xl flex items-center justify-center"
          style={{
            background: 'rgba(128,0,32,0.05)',
            border: '1px dashed rgba(128,0,32,0.20)',
          }}
        >
          <span className="text-[9px] text-center px-2" style={{ color: '#B09098' }}>
            imagem<br />indisponível
          </span>
        </div>
        <button
          onClick={() => onDelete(roupa.id)}
          className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-90 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow"
          style={{ background: 'rgba(46,5,16,0.80)' }}
        >
          <X size={9} color="#FAF0F2" />
        </button>
      </div>
    )
  }

  return (
    <div className="relative group">
      <img
        src={roupa.roupa_url}
        alt=""
        className="w-20 h-28 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
        style={{
          border: '0.5px solid rgba(128,0,32,0.10)',
          boxShadow: '0 2px 8px rgba(40,5,15,0.08)',
        }}
        onError={() => setBroken(true)}
        onClick={() => onOpen(roupa.roupa_url)}
      />
      <button
        onClick={() => onDelete(roupa.id)}
        className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow"
        style={{ background: 'rgba(46,5,16,0.80)' }}
      >
        <X size={9} color="#FAF0F2" />
      </button>
    </div>
  )
}

export function GuardaRoupaSection({ personagemId, roupasIniciais }: GuardaRoupaSectionProps) {
  const [roupas, setRoupas] = useState<RoupaItem[]>(roupasIniciais)
  const [uploading, setUploading] = useState(false)
  const [addMode, setAddMode] = useState<'none' | 'link'>('none')
  const [linkInput, setLinkInput] = useState('')
  const [savingLink, setSavingLink] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)

  async function saveUrl(url: string) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: novaRoupa } = await supabase
      .from('guarda_roupa')
      .insert({ personagem_id: personagemId, roupa_url: url, criado_por: user?.id })
      .select()
      .single()
    if (novaRoupa) setRoupas(r => [...r, novaRoupa])
  }

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const filename = `roupas/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { data, error } = await supabase.storage.from('imagens').upload(filename, file, { upsert: true })
    if (!error && data) {
      const { data: urlData } = supabase.storage.from('imagens').getPublicUrl(data.path)
      await saveUrl(urlData.publicUrl)
    }
    setUploading(false)
    e.target.value = ''
  }

  async function handleSaveLink() {
    const url = linkInput.trim()
    if (!url) return
    setSavingLink(true)
    await saveUrl(url)
    setSavingLink(false)
    setLinkInput('')
    setAddMode('none')
  }

  async function handleDelete(id: string) {
    const supabase = createClient()
    await supabase.from('guarda_roupa').delete().eq('id', id)
    setRoupas(r => r.filter(i => i.id !== id))
  }

  return (
    <div>
      {lightboxUrl && <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}

      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Shirt size={14} style={{ color: '#906070' }} />
          <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#906070' }}>
            Guarda-roupa
          </h2>
        </div>
        <div className="flex items-center gap-1.5">
          <label
            className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg cursor-pointer hover:opacity-70 transition-opacity"
            style={{ background: 'rgba(128,0,32,0.07)', color: '#800020' }}
          >
            <Upload size={11} />
            {uploading ? 'Enviando...' : 'Upload'}
            <input type="file" accept="image/*" className="hidden" onChange={handleUpload} disabled={uploading} />
          </label>
          <button
            onClick={() => setAddMode(m => m === 'link' ? 'none' : 'link')}
            className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg hover:opacity-70 transition-opacity"
            style={{
              background: addMode === 'link' ? '#800020' : 'rgba(128,0,32,0.07)',
              color: addMode === 'link' ? '#FAF0F2' : '#800020',
            }}
          >
            <Link size={11} /> Colar link
          </button>
        </div>
      </div>

      {addMode === 'link' && (
        <div className="mb-4">
          <div className="flex gap-2">
            <input
              type="url"
              value={linkInput}
              onChange={e => setLinkInput(e.target.value)}
              placeholder="Cole o link direto da imagem"
              autoFocus
              className="flex-1 text-xs outline-none rounded-lg px-3 py-2"
              style={{
                background: 'rgba(255,255,255,0.80)',
                border: '0.5px solid rgba(128,0,32,0.18)',
                color: '#2E0510',
              }}
              onKeyDown={e => { if (e.key === 'Enter') handleSaveLink() }}
            />
            <button
              onClick={handleSaveLink}
              disabled={savingLink || !linkInput.trim()}
              className="text-[11px] px-3 py-1.5 rounded-lg disabled:opacity-40 hover:opacity-80 transition-opacity"
              style={{ background: '#800020', color: '#FAF0F2' }}
            >
              {savingLink ? '...' : 'Adicionar'}
            </button>
            <button
              onClick={() => { setAddMode('none'); setLinkInput('') }}
              className="text-[11px] px-2.5 py-1.5 rounded-lg hover:opacity-70 transition-opacity"
              style={{ background: 'rgba(128,0,32,0.07)', color: '#906070' }}
            >
              <X size={12} />
            </button>
          </div>
          <p className="text-[10px] mt-1.5 ml-1" style={{ color: '#B09098' }}>
            No Pinterest: clique com o botão direito na imagem → "Copiar endereço da imagem"
          </p>
        </div>
      )}

      {roupas.length === 0 ? (
        <p className="text-xs" style={{ color: '#B09098' }}>Nenhuma roupa registrada ainda.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {roupas.map(r => (
            <OutfitThumb
              key={r.id}
              roupa={r}
              onOpen={setLightboxUrl}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}
