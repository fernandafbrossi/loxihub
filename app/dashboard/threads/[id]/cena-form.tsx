'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { MapPin, X, Upload, Link, Thermometer } from 'lucide-react'

interface Personagem {
  id: string
  nome: string
  foto_url: string | null
}

interface Lugar {
  id: string
  nome: string
  lat: number | null
  lng: number | null
}

interface CenaFormProps {
  threadId: string
  personagens: Personagem[]
  lugares: Lugar[]
  /** Controle externo (usado pelo botão ＋ do composer no mobile). */
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

interface ClimaData {
  min: number
  max: number
  media: number
}

export function CenaForm({ threadId, personagens, lugares, open: openProp, onOpenChange }: CenaFormProps) {
  const [openInternal, setOpenInternal] = useState(false)
  const open = openProp ?? openInternal
  const setOpen = (v: boolean) => { setOpenInternal(v); onOpenChange?.(v) }
  const [lugarId, setLugarId] = useState('')
  const [localizacaoManual, setLocalizacaoManual] = useState('')
  const [dataCena, setDataCena] = useState('')
  const [clima, setClima] = useState<ClimaData | null>(null)
  const [buscandoClima, setBuscandoClima] = useState(false)
  const [roupas, setRoupas] = useState<Record<string, string>>({})
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [linkMode, setLinkMode] = useState<Record<string, boolean>>({})
  const [linkInputs, setLinkInputs] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const router = useRouter()

  const lugarSelecionado = lugares.find(l => l.id === lugarId)

  async function fetchClima(lugar: Lugar, data: string) {
    if (!lugar.lat || !lugar.lng || !data) return
    setBuscandoClima(true)
    setClima(null)
    try {
      const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lugar.lat}&longitude=${lugar.lng}&start_date=${data}&end_date=${data}&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean&timezone=auto`
      const res = await fetch(url)
      const json = await res.json()
      if (json.daily?.temperature_2m_mean?.[0] != null) {
        setClima({
          min: Math.round(json.daily.temperature_2m_min[0]),
          max: Math.round(json.daily.temperature_2m_max[0]),
          media: Math.round(json.daily.temperature_2m_mean[0]),
        })
      }
    } catch {
      // silently ignore
    } finally {
      setBuscandoClima(false)
    }
  }

  function handleLugarChange(newLugarId: string) {
    setLugarId(newLugarId)
    setClima(null)
    const l = lugares.find(x => x.id === newLugarId)
    if (l && dataCena) fetchClima(l, dataCena)
  }

  function handleDataChange(newData: string) {
    setDataCena(newData)
    setClima(null)
    if (lugarSelecionado && newData) fetchClima(lugarSelecionado, newData)
  }

  async function handleUpload(personagemId: string, file: File) {
    setUploading(u => ({ ...u, [personagemId]: true }))
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const filename = `roupas/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { data, error } = await supabase.storage.from('imagens').upload(filename, file, { upsert: true })
    if (!error && data) {
      const { data: urlData } = supabase.storage.from('imagens').getPublicUrl(data.path)
      setRoupas(r => ({ ...r, [personagemId]: urlData.publicUrl }))
    }
    setUploading(u => ({ ...u, [personagemId]: false }))
  }

  function confirmLink(personagemId: string) {
    const url = (linkInputs[personagemId] ?? '').trim()
    if (!url) return
    setRoupas(r => ({ ...r, [personagemId]: url }))
    setLinkMode(m => ({ ...m, [personagemId]: false }))
    setLinkInputs(l => ({ ...l, [personagemId]: '' }))
  }

  function removeRoupa(personagemId: string) {
    setRoupas(r => { const n = { ...r }; delete n[personagemId]; return n })
  }

  function toggleLinkMode(personagemId: string) {
    setLinkMode(m => ({ ...m, [personagemId]: !m[personagemId] }))
    setLinkInputs(l => ({ ...l, [personagemId]: '' }))
  }

  function handleClose() {
    setOpen(false)
    setLugarId('')
    setLocalizacaoManual('')
    setDataCena('')
    setClima(null)
    setRoupas({})
    setLinkMode({})
    setLinkInputs({})
  }

  const localizacaoFinal = lugarSelecionado ? lugarSelecionado.nome : localizacaoManual.trim()
  const temConteudo = localizacaoFinal || Object.keys(roupas).length > 0

  async function handleSubmit() {
    if (!temConteudo) return
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { data: contexto } = await supabase
      .from('contextos_cena')
      .insert({
        thread_id: threadId,
        localizacao: localizacaoFinal || null,
        lugar_id: lugarId || null,
        data_cena: dataCena || null,
        temperatura_min: clima?.min ?? null,
        temperatura_max: clima?.max ?? null,
        temperatura_media: clima?.media ?? null,
        criado_por: user?.id,
      })
      .select()
      .single()

    if (contexto) {
      const roupasEntries = Object.entries(roupas)
      if (roupasEntries.length > 0) {
        await supabase.from('roupas_contexto').insert(
          roupasEntries.map(([personagem_id, roupa_url]) => ({
            contexto_id: contexto.id, personagem_id, roupa_url,
          }))
        )
        await supabase.from('guarda_roupa').insert(
          roupasEntries.map(([personagem_id, roupa_url]) => ({
            personagem_id, roupa_url, contexto_id: contexto.id, criado_por: user?.id,
          }))
        )
      }
    }

    setSaving(false)
    handleClose()
    router.refresh()
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="hidden md:flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70 mb-2"
        style={{ background: 'var(--p-06)', color: 'var(--foreground-muted)' }}
      >
        <MapPin size={11} /> Contexto de Cena
      </button>
    )
  }

  return (
    <>
    <div className="md:hidden fixed inset-0 z-40" style={{ background: 'rgba(46,5,16,0.35)' }} onClick={handleClose} />
    <div
      className="fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-3xl bg-white p-4 md:static md:z-auto md:max-h-none md:overflow-visible md:rounded-xl md:bg-white/75 md:mb-3"
      style={{
        border: '0.5px solid var(--p-18)',
        boxShadow: '0 2px 12px rgba(40,5,15,0.06)',
        paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5">
          <MapPin size={12} style={{ color: 'var(--primary)' }} />
          <span className="text-xs font-medium" style={{ color: 'var(--primary)' }}>Contexto de Cena</span>
        </div>
        <button type="button" onClick={handleClose}>
          <X size={13} style={{ color: 'var(--foreground-muted)' }} className="hover:opacity-70 transition-opacity" />
        </button>
      </div>

      {/* Seletor de lugar */}
      {lugares.length > 0 ? (
        <div className="mb-2">
          <select
            value={lugarId}
            onChange={e => handleLugarChange(e.target.value)}
            className="w-full text-sm outline-none rounded-lg px-3 py-2"
            style={{
              background: 'rgba(255,255,255,0.85)',
              border: '0.5px solid var(--p-15)',
              color: lugarId ? 'var(--foreground)' : 'var(--muted-light)',
            }}
          >
            <option value="">Selecionar lugar cadastrado...</option>
            {lugares.map(l => (
              <option key={l.id} value={l.id}>{l.nome}</option>
            ))}
          </select>
          {!lugarId && (
            <input
              type="text"
              value={localizacaoManual}
              onChange={e => setLocalizacaoManual(e.target.value)}
              placeholder="...ou digitar localização manualmente"
              className="w-full text-sm outline-none rounded-lg px-3 py-2 mt-2"
              style={{
                background: 'rgba(255,255,255,0.85)',
                border: '0.5px solid var(--p-15)',
                color: 'var(--foreground)',
              }}
            />
          )}
        </div>
      ) : (
        <input
          type="text"
          value={localizacaoManual}
          onChange={e => setLocalizacaoManual(e.target.value)}
          placeholder="Localização (ex: Jardim da Mansão)"
          className="w-full text-sm outline-none rounded-lg px-3 py-2 mb-2"
          style={{
            background: 'rgba(255,255,255,0.85)',
            border: '0.5px solid var(--p-15)',
            color: 'var(--foreground)',
          }}
        />
      )}

      {/* Data da cena + clima */}
      <div className="mb-3">
        <input
          type="date"
          value={dataCena}
          onChange={e => handleDataChange(e.target.value)}
          max={new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0]}
          className="w-full text-sm outline-none rounded-lg px-3 py-2"
          style={{
            background: 'rgba(255,255,255,0.85)',
            border: '0.5px solid var(--p-15)',
            color: dataCena ? 'var(--foreground)' : 'var(--muted-light)',
          }}
        />

        {buscandoClima && (
          <p className="text-[10px] mt-1.5" style={{ color: 'var(--muted-light)' }}>Buscando temperatura histórica...</p>
        )}

        {clima && lugarSelecionado && (
          <div
            className="mt-2 px-3 py-2 rounded-lg flex items-center gap-2"
            style={{ background: 'var(--p-06)', border: '0.5px solid var(--p-12)' }}
          >
            <Thermometer size={12} style={{ color: 'var(--primary)', flexShrink: 0 }} />
            <p className="text-[11px]" style={{ color: 'var(--foreground)' }}>
              <strong>{lugarSelecionado.nome}</strong>
              {dataCena && ` · ${new Date(dataCena + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`}
              {` · ${clima.media}°C `}
              <span style={{ color: 'var(--foreground-muted)' }}>(mín {clima.min}°C · máx {clima.max}°C)</span>
            </p>
          </div>
        )}

        {dataCena && lugarSelecionado && !lugarSelecionado.lat && !buscandoClima && !clima && (
          <p className="text-[10px] mt-1.5" style={{ color: 'var(--muted-light)' }}>
            Este lugar não tem coordenadas — sem dados de temperatura.
          </p>
        )}
      </div>

      {/* Roupas dos personagens */}
      {personagens.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] uppercase tracking-widest mb-2.5" style={{ color: 'var(--muted-light)' }}>
            Roupas dos personagens
          </p>
          <div className="flex flex-wrap gap-4">
            {personagens.map(p => (
              <div key={p.id} className="flex flex-col items-center gap-1.5">
                <span className="text-[10px] font-medium" style={{ color: 'var(--foreground-muted)' }}>{p.nome}</span>

                {roupas[p.id] ? (
                  <div className="relative">
                    <img src={roupas[p.id]} alt="" className="w-16 h-24 object-cover rounded-xl"
                      style={{ border: '0.5px solid var(--p-12)' }} />
                    <button type="button" onClick={() => removeRoupa(p.id)}
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full flex items-center justify-center shadow"
                      style={{ background: 'var(--primary)' }}>
                      <X size={9} color="var(--primary-foreground)" />
                    </button>
                  </div>
                ) : linkMode[p.id] ? (
                  <div className="flex flex-col gap-1" style={{ width: 80 }}>
                    <input type="url" autoFocus value={linkInputs[p.id] ?? ''}
                      onChange={e => setLinkInputs(l => ({ ...l, [p.id]: e.target.value }))}
                      placeholder="Cole o link"
                      className="w-full text-[10px] outline-none rounded-lg px-2 py-1.5"
                      style={{ background: 'rgba(255,255,255,0.90)', border: '0.5px solid var(--p-20)', color: 'var(--foreground)' }}
                      onKeyDown={e => { if (e.key === 'Enter') confirmLink(p.id) }}
                    />
                    <div className="flex gap-1">
                      <button type="button" onClick={() => confirmLink(p.id)} disabled={!linkInputs[p.id]?.trim()}
                        className="flex-1 text-[9px] py-1 rounded-lg disabled:opacity-40"
                        style={{ background: 'var(--btn-primary)', color: 'var(--primary-foreground)' }}>OK</button>
                      <button type="button" onClick={() => toggleLinkMode(p.id)}
                        className="flex-1 text-[9px] py-1 rounded-lg"
                        style={{ background: 'var(--p-08)', color: 'var(--foreground-muted)' }}>
                        <X size={9} className="mx-auto" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 items-center">
                    <label className="w-16 h-20 rounded-xl flex flex-col items-center justify-center gap-1 cursor-pointer transition-opacity hover:opacity-70"
                      style={{ border: '1px dashed var(--p-22)', background: 'rgba(255,255,255,0.55)' }}>
                      {uploading[p.id]
                        ? <span className="text-[9px]" style={{ color: 'var(--muted-light)' }}>...</span>
                        : <Upload size={13} style={{ color: 'var(--muted-light)' }} />
                      }
                      <input type="file" accept="image/*" className="hidden" disabled={uploading[p.id]}
                        onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(p.id, f) }} />
                    </label>
                    <button type="button" onClick={() => toggleLinkMode(p.id)}
                      className="flex items-center gap-0.5 text-[9px] hover:opacity-70 transition-opacity"
                      style={{ color: 'var(--muted-light)' }}>
                      <Link size={9} /> link
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 justify-end">
        <button type="button" onClick={handleClose}
          className="text-[11px] px-3 py-1.5 rounded-lg"
          style={{ background: 'var(--p-07)', color: 'var(--foreground-muted)' }}>
          Cancelar
        </button>
        <button type="button" onClick={handleSubmit}
          disabled={saving || !temConteudo}
          className="text-[11px] px-3 py-1.5 rounded-lg disabled:opacity-40 transition-opacity hover:opacity-80"
          style={{ background: 'var(--btn-primary)', color: 'var(--primary-foreground)' }}>
          {saving ? 'Salvando...' : 'Registrar'}
        </button>
      </div>
    </div>
    </>
  )
}
