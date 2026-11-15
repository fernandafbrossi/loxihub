'use client'

import { useState } from 'react'
import Link from 'next/link'
import { CalendarDays, ChevronDown, CloudSun, ArrowUpRight } from 'lucide-react'

export interface EventoResumo {
  id: string
  universo_id: string
  titulo: string
  data_jogo: string
  descricao: string | null
  clima: string | null
  imagens: string[] | null
}

/** Chip do evento no card de cena. Ao clicar, abre o resumo ali mesmo. */
export function EventoChip({ evento, onOpenImage }: { evento: EventoResumo; onOpenImage?: (url: string) => void }) {
  const [aberto, setAberto] = useState(false)
  const imagens = evento.imagens ?? []
  const temDetalhe = !!(evento.descricao || evento.clima || imagens.length)

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setAberto(a => !a)}
        aria-expanded={aberto}
        className="self-start flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full hover:opacity-80 transition-opacity"
        style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
      >
        <CalendarDays size={11} />
        <span>{evento.titulo}</span>
        <ChevronDown size={11} style={{ transform: aberto ? 'rotate(180deg)' : undefined, transition: 'transform .15s' }} />
      </button>

      {aberto && (
        <div className="p-3 rounded-xl flex flex-col gap-2" style={{ background: 'var(--surface)', border: '0.5px solid var(--p-15)' }}>
          {evento.descricao && (
            <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>{evento.descricao}</p>
          )}
          {evento.clima && (
            <p className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--foreground-muted)' }}>
              <CloudSun size={12} style={{ color: 'var(--primary)' }} /> {evento.clima}
            </p>
          )}
          {imagens.length > 0 && (
            <div className="flex gap-1.5 flex-wrap">
              {imagens.slice(0, 5).map(url => (
                <img
                  key={url}
                  src={url}
                  alt=""
                  className="w-14 h-14 object-cover rounded-lg cursor-pointer hover:opacity-90"
                  style={{ border: '0.5px solid var(--p-12)' }}
                  onClick={() => onOpenImage?.(url)}
                />
              ))}
            </div>
          )}
          {!temDetalhe && <p className="text-[11px]" style={{ color: 'var(--foreground-muted)' }}>Este evento ainda não tem descrição.</p>}
          <Link
            href={`/dashboard/universos/${evento.universo_id}/eventos/${evento.id}`}
            className="self-start flex items-center gap-1 text-[11px] font-medium hover:opacity-70"
            style={{ color: 'var(--primary)' }}
          >
            Abrir evento <ArrowUpRight size={11} />
          </Link>
        </div>
      )}
    </div>
  )
}
