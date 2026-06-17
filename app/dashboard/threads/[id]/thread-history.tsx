'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Clock, X, MapPin, Trash2, Thermometer } from 'lucide-react'

interface RoupaContexto {
  id: string
  personagem_id: string
  roupa_url: string
  personagens: { id: string; nome: string } | null
}

interface ContextoCena {
  id: string
  localizacao: string | null
  data_cena: string | null
  temperatura_min: number | null
  temperatura_max: number | null
  temperatura_media: number | null
  criado_por: string | null
  created_at: string
  roupas_contexto: RoupaContexto[]
}

function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
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
    </div>
  )
}

export function ThreadHistory({ contextos: inicial }: { contextos: ContextoCena[] }) {
  const [open, setOpen] = useState(false)
  const [contextos, setContextos] = useState<ContextoCena[]>(inicial)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const router = useRouter()

  async function handleDelete(id: string) {
    setDeleting(id)
    const supabase = createClient()
    await supabase.from('contextos_cena').delete().eq('id', id)
    setContextos(c => c.filter(x => x.id !== id))
    setDeleting(null)
    router.refresh()
  }

  if (contextos.length === 0) return null

  return (
    <>
      {lightboxUrl && <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}

      <button
        onClick={() => setOpen(true)}
        className="flex-shrink-0 flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70"
        style={{ background: 'rgba(128,0,32,0.07)', color: '#800020' }}
      >
        <Clock size={12} /> Histórico
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-end"
          style={{ background: 'rgba(46,5,16,0.35)', backdropFilter: 'blur(2px)' }}
          onClick={() => setOpen(false)}
        >
          <div
            className="h-full w-80 overflow-y-auto flex flex-col"
            style={{
              background: 'rgba(250,240,242,0.98)',
              borderLeft: '0.5px solid rgba(128,0,32,0.12)',
              boxShadow: '-8px 0 32px rgba(40,5,15,0.14)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Cabeçalho do painel */}
            <div
              className="flex items-center justify-between px-5 py-4 flex-shrink-0"
              style={{ borderBottom: '0.5px solid rgba(128,0,32,0.08)' }}
            >
              <div className="flex items-center gap-2">
                <Clock size={13} style={{ color: '#800020' }} />
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#800020' }}>
                  Histórico de Cenas
                </span>
              </div>
              <button onClick={() => setOpen(false)}>
                <X size={14} style={{ color: '#906070' }} className="hover:opacity-70 transition-opacity" />
              </button>
            </div>

            {/* Lista de contextos */}
            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-6">
              {contextos.map((c, i) => {
                const hora = new Date(c.created_at).toLocaleString('pt-BR', {
                  day: '2-digit', month: '2-digit', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })
                return (
                  <div key={c.id}>
                    {i > 0 && (
                      <div className="h-px mb-6" style={{ background: 'rgba(128,0,32,0.08)' }} />
                    )}

                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[10px]" style={{ color: '#B09098' }}>{hora}</span>
                      <button
                        onClick={() => handleDelete(c.id)}
                        disabled={deleting === c.id}
                        className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg disabled:opacity-40 hover:opacity-70 transition-opacity"
                        style={{ background: 'rgba(128,0,32,0.08)', color: '#906070' }}
                      >
                        <Trash2 size={10} />
                        {deleting === c.id ? '...' : 'Apagar'}
                      </button>
                    </div>

                    {c.localizacao && (
                      <div className="flex items-center gap-1.5 flex-wrap mb-3">
                        <MapPin size={11} style={{ color: '#800020', flexShrink: 0 }} />
                        <span className="text-sm font-medium" style={{ color: '#2E0510' }}>{c.localizacao}</span>
                        {c.data_cena && (
                          <span className="text-xs" style={{ color: '#906070' }}>
                            · {new Date(c.data_cena + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </span>
                        )}
                        {c.temperatura_media != null && (
                          <span className="inline-flex items-center gap-0.5 text-xs" style={{ color: '#906070' }}>
                            <Thermometer size={11} style={{ color: '#800020' }} />
                            {c.temperatura_media}°C
                            <span style={{ color: '#B09098' }}> (mín {c.temperatura_min}° · máx {c.temperatura_max}°)</span>
                          </span>
                        )}
                      </div>
                    )}

                    {c.roupas_contexto.length > 0 && (
                      <div className="flex flex-wrap gap-3">
                        {c.roupas_contexto.map(r => (
                          <div key={r.id} className="flex flex-col items-center gap-1">
                            <img
                              src={r.roupa_url}
                              alt=""
                              className="w-16 h-24 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
                              style={{
                                border: '0.5px solid rgba(128,0,32,0.12)',
                                boxShadow: '0 2px 8px rgba(40,5,15,0.06)',
                              }}
                              onClick={() => setLightboxUrl(r.roupa_url)}
                              onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3' }}
                            />
                            {r.personagens?.nome && (
                              <span className="text-[9px]" style={{ color: '#906070' }}>
                                {r.personagens.nome}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
