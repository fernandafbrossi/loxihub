'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, ArrowRight, ArrowUpRight } from 'lucide-react'

export interface ThreadAtualItem {
  id: string
  titulo: string
  dataCena: string | null
  trecho: string | null
  autor: string | null
  quando: string | null
  suaVez: boolean
}

const card = {
  background: 'linear-gradient(160deg, var(--p-08), var(--card))',
  border: '0.5px solid var(--card-border)',
  borderRadius: '20px',
  boxShadow: 'var(--shadow-card)',
} as const

export function ThreadAtual({ threads, novaHref }: { threads: ThreadAtualItem[]; novaHref: string }) {
  const [i, setI] = useState(0)

  if (threads.length === 0) {
    return (
      <section className="p-5" style={card}>
        <p className="text-[10px] font-medium uppercase tracking-wider mb-3" style={{ color: 'var(--foreground-muted)' }}>Thread atual</p>
        <p className="text-xs mb-3" style={{ color: 'var(--foreground-muted)' }}>Nenhuma thread em andamento.</p>
        <Link href={novaHref} className="inline-block text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: 'var(--btn-primary)', color: 'var(--primary-foreground)' }}>
          Criar thread
        </Link>
      </section>
    )
  }

  const t = threads[i]
  const nav = { background: 'var(--p-10)', color: 'var(--primary)' } as const

  return (
    <section className="p-5" style={card} aria-label="Thread atual">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--foreground-muted)' }}>Thread atual</p>
        {threads.length > 1 && (
          <div className="flex items-center gap-2 text-xs tabular-nums" style={{ color: 'var(--foreground-muted)' }}>
            <button onClick={() => setI((i + threads.length - 1) % threads.length)} aria-label="Thread anterior" className="w-7 h-7 rounded-full flex items-center justify-center" style={nav}><ArrowLeft size={13} /></button>
            <span><b style={{ color: 'var(--foreground)' }}>{i + 1}</b>/{threads.length}</span>
            <button onClick={() => setI((i + 1) % threads.length)} aria-label="Próxima thread" className="w-7 h-7 rounded-full flex items-center justify-center" style={nav}><ArrowRight size={13} /></button>
          </div>
        )}
      </div>

      <div className="grid gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full"
              style={t.suaVez ? { background: 'var(--primary)', color: 'var(--primary-foreground)' } : { background: 'var(--p-09)', color: 'var(--foreground-muted)' }}
            >
              {t.suaVez ? 'sua vez' : 'aguardando'}
            </span>
            {t.dataCena && (
              <span className="text-[11px]" style={{ color: 'var(--foreground-muted)' }}>
                {new Date(t.dataCena + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })} no jogo
              </span>
            )}
          </div>
          <h3 className="text-2xl leading-tight mb-4 break-words" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-serif)' }}>{t.titulo}</h3>
          <Link
            href={`/dashboard/threads/${t.id}`}
            className="inline-flex items-center gap-2.5 pl-4 pr-1 py-1 rounded-full text-xs font-medium max-w-full"
            style={{ background: 'var(--btn-primary)', color: 'var(--primary-foreground)', boxShadow: 'var(--shadow-primary)' }}
          >
            <span className="truncate">Continuar {t.titulo}</span>
            <span className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'var(--primary-foreground)', color: 'var(--primary)' }}><ArrowUpRight size={14} /></span>
          </Link>
        </div>

        {t.trecho && (
          <blockquote className="p-3.5 rounded-xl text-[12.5px] leading-relaxed" style={{ background: 'var(--surface)', border: '1px dashed var(--p-18)', color: 'var(--foreground)' }}>
            {t.trecho}
            {(t.autor || t.quando) && (
              <cite className="block not-italic text-[11px] mt-1.5" style={{ color: 'var(--foreground-muted)' }}>
                {[t.autor, t.quando].filter(Boolean).join(', ')}
              </cite>
            )}
          </blockquote>
        )}
      </div>
    </section>
  )
}
