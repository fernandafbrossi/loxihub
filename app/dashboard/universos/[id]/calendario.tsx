'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, ChevronRight, Plus, Star, ArrowUpRight } from 'lucide-react'

export interface EventoItem {
  id: string
  titulo: string
  data_jogo: string // YYYY-MM-DD
  thread_id: string | null
}
export interface AniversarioItem {
  nome: string
  data_nascimento: string // YYYY-MM-DD
}

interface Props {
  universoId: string
  eventos: EventoItem[]
  aniversarios: AniversarioItem[]
  hoje: string | null // data atual do jogo
}

const MESES = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
const DIAS = ['seg', 'ter', 'qua', 'qui', 'sex', 'sáb', 'dom']

const pad = (n: number) => String(n).padStart(2, '0')
const iso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`

type Item =
  | { tipo: 'evento'; data: string; titulo: string; id: string; thread_id: string | null }
  | { tipo: 'aniversario'; data: string; titulo: string; sub: string }

const glassCard = {
  background: 'var(--card)',
  border: '0.5px solid var(--card-border)',
  borderRadius: '20px',
  boxShadow: 'var(--shadow-card)',
} as const

export function Calendario({ universoId, eventos, aniversarios, hoje }: Props) {
  const base = hoje ?? new Date().toISOString().slice(0, 10)
  const [by, bm] = base.split('-').map(Number)
  const [view, setView] = useState({ y: by, m: bm - 1 })
  const [sel, setSel] = useState(base)

  // Todos os itens (eventos + aniversários) de um ano, indexados por data
  function itensDoAno(y: number): Map<string, Item[]> {
    const mapa = new Map<string, Item[]>()
    const add = (it: Item) => mapa.set(it.data, [...(mapa.get(it.data) ?? []), it])
    eventos.forEach(e => add({ tipo: 'evento', data: e.data_jogo, titulo: e.titulo, id: e.id, thread_id: e.thread_id }))
    aniversarios.forEach(a => {
      const [ny, nm, nd] = a.data_nascimento.split('-').map(Number)
      const idade = y - ny
      add({
        tipo: 'aniversario',
        data: iso(y, nm - 1, nd),
        titulo: `Aniversário de ${a.nome}`,
        sub: idade > 0 ? `Faz ${idade} anos` : 'Nascimento',
      })
    })
    return mapa
  }

  const anos = useMemo(() => {
    const ys = new Set([view.y, ...(sel ? [Number(sel.slice(0, 4))] : [])])
    const mapa = new Map<string, Item[]>()
    ys.forEach(y => itensDoAno(y).forEach((v, k) => mapa.set(k, v)))
    return mapa
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view.y, sel, eventos, aniversarios])

  const primeiroDia = (new Date(view.y, view.m, 1).getDay() + 6) % 7
  const totalDias = new Date(view.y, view.m + 1, 0).getDate()

  function mover(delta: number) {
    setView(v => {
      const m = v.m + delta
      if (m < 0) return { y: v.y - 1, m: 11 }
      if (m > 11) return { y: v.y + 1, m: 0 }
      return { y: v.y, m }
    })
  }

  // Agenda: o dia selecionado e os próximos que têm algo (máx. 4)
  const agenda = useMemo(() => {
    const datas = Array.from(anos.keys()).filter(d => d >= sel).sort()
    return datas.slice(0, 4).flatMap(d => (anos.get(d) ?? []).map(it => ({ ...it, data: d }))).slice(0, 5)
  }, [anos, sel])

  const novoHref = `/dashboard/universos/${universoId}/eventos/novo?data=${sel}`

  return (
    <>
      {/* Calendário */}
      <section className="p-5" style={glassCard} aria-label="Calendário do universo">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--foreground-muted)' }}>Calendário</p>
        </div>
        <div className="flex items-center justify-between mb-3">
          <button onClick={() => mover(-1)} aria-label="Mês anterior" className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--p-08)', color: 'var(--primary)' }}>
            <ChevronLeft size={15} />
          </button>
          <strong className="text-sm font-medium capitalize" style={{ color: 'var(--foreground)' }}>{MESES[view.m]} {view.y}</strong>
          <button onClick={() => mover(1)} aria-label="Próximo mês" className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--p-08)', color: 'var(--primary)' }}>
            <ChevronRight size={15} />
          </button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {DIAS.map(d => (
            <div key={d} className="text-[10px] uppercase tracking-wider py-1" style={{ color: 'var(--foreground-muted)' }}>{d}</div>
          ))}
          {Array.from({ length: primeiroDia }).map((_, i) => <div key={`v${i}`} />)}
          {Array.from({ length: totalDias }, (_, i) => i + 1).map(d => {
            const data = iso(view.y, view.m, d)
            const itens = anos.get(data) ?? []
            const ehHoje = data === hoje
            const ehSel = data === sel
            return (
              <button
                key={d}
                onClick={() => setSel(data)}
                aria-label={`${d} de ${MESES[view.m]}${itens.length ? `, ${itens.length} item(ns)` : ''}`}
                className="relative aspect-square rounded-xl flex items-center justify-center text-[13px] tabular-nums transition-colors hover:opacity-80"
                style={{
                  background: ehSel ? 'var(--btn-primary)' : 'transparent',
                  color: ehSel ? 'var(--primary-foreground)' : 'var(--foreground)',
                  boxShadow: ehHoje && !ehSel ? 'inset 0 0 0 1.5px var(--primary)' : undefined,
                  fontWeight: ehHoje ? 600 : 400,
                }}
              >
                {d}
                {itens.length > 0 && (
                  <span className="absolute bottom-1 flex gap-0.5">
                    {itens.slice(0, 3).map((it, i) => (
                      <i key={i} className="block w-1 h-1 rounded-full" style={{ background: ehSel ? 'var(--primary-foreground)' : it.tipo === 'aniversario' ? 'var(--gold)' : 'var(--primary)' }} />
                    ))}
                  </span>
                )}
              </button>
            )
          })}
        </div>
        <div className="flex gap-4 mt-3 text-[10px]" style={{ color: 'var(--foreground-muted)' }}>
          <span className="flex items-center gap-1.5"><i className="block w-1.5 h-1.5 rounded-full" style={{ background: 'var(--primary)' }} /> Evento</span>
          <span className="flex items-center gap-1.5"><i className="block w-1.5 h-1.5 rounded-full" style={{ background: 'var(--gold)' }} /> Aniversário</span>
        </div>
      </section>

      {/* Agenda */}
      <section className="p-5" style={glassCard} aria-label="Agenda">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--foreground-muted)' }}>Agenda</p>
          <Link href={novoHref} className="flex items-center gap-1 text-[11px] font-medium hover:opacity-70" style={{ color: 'var(--primary)' }}>
            <Plus size={12} /> Novo evento
          </Link>
        </div>

        {agenda.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-xs mb-3" style={{ color: 'var(--foreground-muted)' }}>Nenhum evento a partir deste dia.</p>
            <Link href={novoHref} className="inline-block text-xs font-medium px-3 py-1.5 rounded-lg" style={{ background: 'var(--btn-primary)', color: 'var(--primary-foreground)' }}>
              Criar evento
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {agenda.map((it, i) => {
              const dia = Number(it.data.slice(8, 10))
              const mes = Number(it.data.slice(5, 7)) - 1
              const destaque = it.data === sel
              const conteudo = (
                <>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-lg font-medium tabular-nums flex-shrink-0"
                    style={destaque
                      ? { background: 'var(--btn-primary)', color: 'var(--primary-foreground)' }
                      : { background: 'var(--p-08)', color: 'var(--primary)' }}
                  >
                    {dia}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium truncate" style={{ color: 'var(--foreground)' }}>{it.titulo}</p>
                    <p className="text-[11px] truncate" style={{ color: 'var(--foreground-muted)' }}>
                      {it.tipo === 'aniversario' ? it.sub : 'Ver evento'} · {MESES[mes]}
                    </p>
                  </div>
                  {it.tipo === 'aniversario'
                    ? <Star size={14} style={{ color: 'var(--gold)' }} />
                    : <ArrowUpRight size={15} style={{ color: 'var(--primary)' }} />}
                </>
              )
              const cls = 'flex items-center gap-3 p-2 pr-4 rounded-full transition-all hover:scale-[1.01]'
              const st = { background: 'var(--surface)', border: '0.5px solid var(--card-border)' }
              return it.tipo === 'evento' ? (
                <Link key={i} href={`/dashboard/universos/${universoId}/eventos/${it.id}`} className={cls} style={st}>{conteudo}</Link>
              ) : (
                <div key={i} className={cls} style={st}>{conteudo}</div>
              )
            })}
          </div>
        )}
      </section>
    </>
  )
}
