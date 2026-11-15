'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Clock, X, MapPin, Trash2, Thermometer, Link2, Unlink } from 'lucide-react'
import { EventoChip, type EventoResumo } from './evento-chip'

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
  evento_id?: string | null
  eventos?: EventoResumo | null
}

interface EventoOpcao {
  id: string
  universo_id?: string
  titulo: string
  data_jogo: string
  thread_id: string | null
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
        <X size={16} color="var(--primary-foreground)" />
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

const formatarHora = (iso: string) =>
  new Date(iso).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

function Local({ c }: { c: ContextoCena }) {
  if (!c.localizacao) return null
  return (
    <div className="flex items-center gap-1.5 flex-wrap mb-3">
      <MapPin size={11} style={{ color: 'var(--primary)', flexShrink: 0 }} />
      <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{c.localizacao}</span>
      {c.data_cena && (
        <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
          · {new Date(c.data_cena + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      )}
      {c.temperatura_media != null && (
        <span className="inline-flex items-center gap-0.5 text-xs" style={{ color: 'var(--foreground-muted)' }}>
          <Thermometer size={11} style={{ color: 'var(--primary)' }} />
          {c.temperatura_media}°C
          <span style={{ color: 'var(--muted-light)' }}> (mín {c.temperatura_min}° · máx {c.temperatura_max}°)</span>
        </span>
      )}
    </div>
  )
}

function Roupas({ lista, onOpen }: { lista: RoupaContexto[]; onOpen: (url: string) => void }) {
  if (lista.length === 0) return null
  return (
    <div className="flex flex-wrap gap-3">
      {lista.map(r => (
        <div key={r.id} className="flex flex-col items-center gap-1">
          <img
            src={r.roupa_url}
            alt=""
            className="w-16 h-24 object-cover rounded-xl cursor-pointer hover:opacity-90 transition-opacity"
            style={{ border: '0.5px solid var(--p-12)', boxShadow: '0 2px 8px rgba(40,5,15,0.06)' }}
            onClick={() => onOpen(r.roupa_url)}
            onError={e => { (e.target as HTMLImageElement).style.opacity = '0.3' }}
          />
          {r.personagens?.nome && (
            <span className="text-[9px]" style={{ color: 'var(--foreground-muted)' }}>{r.personagens.nome}</span>
          )}
        </div>
      ))}
    </div>
  )
}

type Grupo = { tipo: 'grupo'; evento: EventoResumo; itens: ContextoCena[] }
type Solto = { tipo: 'solto'; item: ContextoCena }

export function ThreadHistory({ contextos: inicial, eventos = [], threadId }: {
  contextos: ContextoCena[]
  eventos?: EventoOpcao[]
  threadId: string
}) {
  const [open, setOpen] = useState(false)
  const [contextos, setContextos] = useState<ContextoCena[]>(inicial)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [registrosAbertos, setRegistrosAbertos] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => { setContextos(inicial) }, [inicial])

  async function handleDelete(id: string) {
    setDeleting(id)
    const supabase = createClient()
    await supabase.from('contextos_cena').delete().eq('id', id)
    setContextos(c => c.filter(x => x.id !== id))
    setDeleting(null)
    router.refresh()
  }

  async function vincular(c: ContextoCena, eventoId: string | null) {
    const supabase = createClient()
    const { error } = await supabase.from('contextos_cena').update({ evento_id: eventoId }).eq('id', c.id)
    if (error) { alert('Não foi possível alterar o evento deste registro.'); return }
    const ev = eventos.find(e => e.id === eventoId)
    if (ev && !ev.thread_id) await supabase.from('eventos').update({ thread_id: threadId }).eq('id', ev.id)
    setContextos(lista => lista.map(x => x.id === c.id
      ? {
          ...x,
          evento_id: eventoId,
          eventos: ev ? { id: ev.id, universo_id: ev.universo_id ?? '', titulo: ev.titulo, data_jogo: ev.data_jogo, descricao: null, clima: null, imagens: [] } : null,
        }
      : x))
    router.refresh()
  }

  if (contextos.length === 0) return null

  // Agrupa por evento: o grupo aparece na posição do primeiro card dele
  const blocos: (Grupo | Solto)[] = []
  const grupos = new Map<string, Grupo>()
  for (const c of contextos) {
    if (c.eventos) {
      const existente = grupos.get(c.eventos.id)
      if (existente) existente.itens.push(c)
      else {
        const g: Grupo = { tipo: 'grupo', evento: c.eventos, itens: [c] }
        grupos.set(c.eventos.id, g)
        blocos.push(g)
      }
    } else {
      blocos.push({ tipo: 'solto', item: c })
    }
  }

  const botao = { background: 'var(--p-08)', color: 'var(--foreground-muted)' } as const

  return (
    <>
      {lightboxUrl && <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}

      <button
        onClick={() => setOpen(true)}
        className="flex-shrink-0 flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70"
        style={{ background: 'var(--p-07)', color: 'var(--primary)' }}
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
              borderLeft: '0.5px solid var(--p-12)',
              boxShadow: '-8px 0 32px rgba(40,5,15,0.14)',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 flex-shrink-0" style={{ borderBottom: '0.5px solid var(--p-08)' }}>
              <div className="flex items-center gap-2">
                <Clock size={13} style={{ color: 'var(--primary)' }} />
                <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>
                  Histórico de Cenas
                </span>
              </div>
              <button onClick={() => setOpen(false)}>
                <X size={14} style={{ color: 'var(--foreground-muted)' }} className="hover:opacity-70 transition-opacity" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-6">
              {blocos.map((b, i) => (
                <div key={b.tipo === 'grupo' ? `g-${b.evento.id}` : b.item.id}>
                  {i > 0 && <div className="h-px mb-6" style={{ background: 'var(--p-08)' }} />}

                  {b.tipo === 'grupo' ? (
                    <>
                      <div className="mb-3">
                        <EventoChip evento={b.evento} onOpenImage={setLightboxUrl} />
                      </div>

                      {/* Locais do evento, sem repetir */}
                      {b.itens
                        .filter((c, idx, arr) => c.localizacao && arr.findIndex(o => o.localizacao === c.localizacao && o.data_cena === c.data_cena) === idx)
                        .map(c => <Local key={c.id} c={c} />)}

                      <Roupas lista={b.itens.flatMap(c => c.roupas_contexto)} onOpen={setLightboxUrl} />

                      <button
                        onClick={() => setRegistrosAbertos(registrosAbertos === b.evento.id ? null : b.evento.id)}
                        className="mt-3 text-[10px] underline underline-offset-2 hover:opacity-70"
                        style={{ color: 'var(--foreground-muted)' }}
                      >
                        {b.itens.length} {b.itens.length === 1 ? 'registro' : 'registros'} nesta thread
                      </button>

                      {registrosAbertos === b.evento.id && (
                        <div className="mt-2 flex flex-col gap-1.5">
                          {b.itens.map(c => (
                            <div key={c.id} className="flex items-center gap-2 text-[10px]" style={{ color: 'var(--foreground-muted)' }}>
                              <span className="flex-1 truncate">
                                {formatarHora(c.created_at)}{c.localizacao ? ` · ${c.localizacao}` : c.roupas_contexto.length ? ' · roupas' : ''}
                              </span>
                              <button onClick={() => vincular(c, null)} title="Desvincular do evento" className="flex items-center gap-1 px-2 py-0.5 rounded-lg hover:opacity-70" style={botao}>
                                <Unlink size={10} />
                              </button>
                              <button onClick={() => handleDelete(c.id)} disabled={deleting === c.id} title="Apagar" className="flex items-center gap-1 px-2 py-0.5 rounded-lg hover:opacity-70 disabled:opacity-40" style={botao}>
                                <Trash2 size={10} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <span className="text-[10px]" style={{ color: 'var(--muted-light)' }}>{formatarHora(b.item.created_at)}</span>
                        <button
                          onClick={() => handleDelete(b.item.id)}
                          disabled={deleting === b.item.id}
                          className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-lg disabled:opacity-40 hover:opacity-70 transition-opacity"
                          style={botao}
                        >
                          <Trash2 size={10} />
                          {deleting === b.item.id ? '...' : 'Apagar'}
                        </button>
                      </div>

                      <Local c={b.item} />
                      <Roupas lista={b.item.roupas_contexto} onOpen={setLightboxUrl} />

                      {eventos.length > 0 && (
                        <label className="mt-3 flex items-center gap-1.5 text-[10px]" style={{ color: 'var(--foreground-muted)' }}>
                          <Link2 size={10} />
                          <select
                            value=""
                            onChange={e => { if (e.target.value) vincular(b.item, e.target.value) }}
                            aria-label="Vincular a evento"
                            className="flex-1 text-[10px] rounded-lg px-2 py-1 outline-none"
                            style={{ background: 'rgba(255,255,255,0.85)', border: '0.5px solid var(--p-15)', color: 'var(--foreground-muted)' }}
                          >
                            <option value="">Vincular a evento…</option>
                            {eventos.map(e => <option key={e.id} value={e.id}>{e.titulo}</option>)}
                          </select>
                        </label>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
