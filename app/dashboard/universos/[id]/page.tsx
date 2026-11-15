import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ScrollText, Users, MapPin, ArrowLeft, Pencil, Plus, ArrowUpRight } from 'lucide-react'
import { Calendario, type EventoItem, type AniversarioItem } from './calendario'
import { ThreadAtual, type ThreadAtualItem } from './thread-atual'
import { Canons, type CanonItem } from './canons'

const glassCard = {
  background: 'var(--card)',
  border: '0.5px solid var(--card-border)',
  borderRadius: '20px',
  boxShadow: 'var(--shadow-card)',
} as const

const label = 'text-[10px] font-medium uppercase tracking-wider'

function limpar(texto: string, max = 170) {
  const t = texto.replace(/<[^>]*>/g, ' ').replace(/[*_#>`~]/g, '').replace(/\s+/g, ' ').trim()
  return t.length > max ? t.slice(0, max).trimEnd() + '…' : t
}

function quando(iso: string) {
  const min = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (min < 60) return `há ${min} min`
  const h = Math.round(min / 60)
  if (h < 24) return `há ${h}h`
  const d = Math.round(h / 24)
  return d === 1 ? 'ontem' : `há ${d} dias`
}

export default async function UniversoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: universo },
    { data: threads },
    { count: personagensCount },
    { count: lugaresCount },
    { data: personagens },
    { data: eventosRaw, error: eventosErro },
    { data: { user } },
    { data: canonsRaw, error: canonsErro },
  ] = await Promise.all([
    supabase.from('universos').select('*').eq('id', id).single(),
    supabase.from('threads').select('id, titulo, status, updated_at').eq('universo_id', id).order('updated_at', { ascending: false }),
    supabase.from('personagens').select('*', { count: 'exact', head: true }).eq('universo_id', id),
    supabase.from('lugares').select('*', { count: 'exact', head: true }).eq('universo_id', id),
    supabase.from('personagens').select('id, nome, foto_url, data_nascimento').eq('universo_id', id).order('nome'),
    supabase.from('eventos').select('id, titulo, data_jogo, thread_id').eq('universo_id', id).order('data_jogo'),
    supabase.auth.getUser(),
    supabase.from('canons').select('id, categoria, titulo, texto, destaque, personagem_id, thread_id').eq('universo_id', id).order('created_at', { ascending: false }),
  ])

  if (!universo) notFound()

  const todasThreads = threads ?? []
  const emAndamento = todasThreads.filter(t => t.status === 'em_andamento')
  const idsThreads = todasThreads.map(t => t.id)
  const idsAndamento = emAndamento.map(t => t.id)

  const [{ data: ultimaCena }, { data: postsRecentes }] = await Promise.all([
    idsThreads.length
      ? supabase.from('contextos_cena').select('thread_id, data_cena').in('thread_id', idsThreads).not('data_cena', 'is', null).order('data_cena', { ascending: false }).limit(200)
      : Promise.resolve({ data: [] as { thread_id: string; data_cena: string }[] }),
    idsAndamento.length
      ? supabase.from('posts').select('thread_id, conteudo, personagem_pov, criado_por, created_at').in('thread_id', idsAndamento).order('created_at', { ascending: false }).limit(300)
      : Promise.resolve({ data: [] as { thread_id: string; conteudo: string; personagem_pov: string | null; criado_por: string | null; created_at: string }[] }),
  ])

  // Data atual do jogo: a data de cena mais recente do universo
  const hoje: string | null = ultimaCena?.[0]?.data_cena ?? null
  const threadDaData = ultimaCena?.[0] ? todasThreads.find(t => t.id === ultimaCena[0].thread_id) : null

  // Último post de cada thread em andamento
  const ultimoPost = new Map<string, NonNullable<typeof postsRecentes>[number]>()
  for (const p of postsRecentes ?? []) if (!ultimoPost.has(p.thread_id)) ultimoPost.set(p.thread_id, p)
  const dataCenaPorThread = new Map<string, string>()
  for (const c of ultimaCena ?? []) if (!dataCenaPorThread.has(c.thread_id)) dataCenaPorThread.set(c.thread_id, c.data_cena)

  const itensThread: ThreadAtualItem[] = emAndamento.map(t => {
    const p = ultimoPost.get(t.id)
    return {
      id: t.id,
      titulo: t.titulo,
      dataCena: dataCenaPorThread.get(t.id) ?? null,
      trecho: p ? limpar(p.conteudo) : null,
      autor: p?.personagem_pov ?? null,
      quando: p ? quando(p.created_at) : null,
      suaVez: !!p && !!user && p.criado_por !== user.id,
    }
  })
  const threadsAtuais = [...itensThread].sort((a, b) => Number(b.suaVez) - Number(a.suaVez)).slice(0, 6)
  const continuar = threadsAtuais[0]

  const eventos: EventoItem[] = (eventosRaw ?? []) as EventoItem[]
  const aniversarios: AniversarioItem[] = (personagens ?? [])
    .filter(p => p.data_nascimento)
    .map(p => ({ nome: p.nome, data_nascimento: p.data_nascimento as string }))

  const novaThreadHref = `/dashboard/threads/nova?universo=${id}`
  const novoEventoHref = `/dashboard/universos/${id}/eventos/novo${hoje ? `?data=${hoje}` : ''}`

  const pastas = [
    { label: 'Threads', icon: ScrollText, count: todasThreads.length, href: `/dashboard/threads?universo=${id}`, desc: 'Capítulos e cenas' },
    { label: 'Personagens', icon: Users, count: personagensCount ?? 0, href: `/dashboard/personagens?universo=${id}`, desc: 'Fichas e perfis' },
    { label: 'Lugares', icon: MapPin, count: lugaresCount ?? 0, href: `/dashboard/lugares?universo=${id}`, desc: 'Cenários e mapas' },
  ]

  const dataObj = hoje ? new Date(hoje + 'T12:00:00') : null

  return (
    <div className="p-4 md:p-7 max-w-4xl">

      <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-xs mb-4 hover:opacity-70 transition-opacity" style={{ color: 'var(--foreground-muted)' }}>
        <ArrowLeft size={13} /> Todos os universos
      </Link>

      {/* Hero */}
      <section
        className="relative overflow-hidden mb-5 p-6 md:p-8 grid md:grid-cols-[1.4fr_1fr] gap-6 items-end"
        style={{ borderRadius: '24px', background: 'linear-gradient(135deg, #5C0018 0%, #800020 55%, #A8133A 100%)', color: '#FFF1F4', boxShadow: 'var(--shadow-app)' }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {universo.genero && <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.16)' }}>{universo.genero}</span>}
            <span className="text-[10px] font-medium px-2.5 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.16)' }}>{universo.status}</span>
          </div>
          <h1 className="text-3xl md:text-4xl leading-tight mb-2" style={{ fontFamily: 'var(--font-serif)' }}>{universo.nome}</h1>
          {universo.descricao && <p className="text-sm leading-relaxed mb-5 max-w-md" style={{ color: 'rgba(255,241,244,0.82)' }}>{universo.descricao}</p>}
          <div className="flex gap-2.5 flex-wrap">
            <Link
              href={continuar ? `/dashboard/threads/${continuar.id}` : novaThreadHref}
              className="inline-flex items-center gap-2.5 pl-4 pr-1 py-1 rounded-full text-xs font-medium"
              style={{ background: '#FFF1F4', color: '#5C0018' }}
            >
              {continuar ? 'Continuar thread' : 'Criar thread'}
              <span className="w-7 h-7 rounded-full flex items-center justify-center" style={{ background: '#800020', color: '#FFF1F4' }}><ArrowUpRight size={14} /></span>
            </Link>
            <Link href={novoEventoHref} className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-medium" style={{ border: '1px solid rgba(255,255,255,0.4)' }}>
              <Plus size={13} /> Novo evento
            </Link>
            <Link href={`/dashboard/universos/${id}/editar`} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-full text-xs opacity-80 hover:opacity-100" style={{ border: '1px solid rgba(255,255,255,0.25)' }}>
              <Pencil size={12} /> Editar
            </Link>
          </div>
        </div>

        <div className="md:text-right">
          <p className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: 'rgba(255,241,244,0.7)' }}>Hoje no jogo</p>
          {dataObj ? (
            <>
              <p className="leading-none text-6xl md:text-7xl" style={{ fontFamily: 'var(--font-serif)' }}>{dataObj.getDate()}</p>
              <p className="text-sm font-medium uppercase tracking-wider mt-1.5">
                {dataObj.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </p>
              <p className="text-[11px] mt-1" style={{ color: 'rgba(255,241,244,0.72)' }}>
                {dataObj.toLocaleDateString('pt-BR', { weekday: 'long' })}
                {threadDaData && <> · da thread <Link href={`/dashboard/threads/${threadDaData.id}`} className="underline underline-offset-2">{threadDaData.titulo}</Link></>}
              </p>
            </>
          ) : (
            <p className="text-sm max-w-[22ch] md:ml-auto" style={{ color: 'rgba(255,241,244,0.8)' }}>
              Ainda sem data. Ela aparece quando uma thread tiver um card de cena com data.
            </p>
          )}
        </div>
      </section>

      {eventosErro && (
        <div className="mb-5 p-3 text-xs rounded-xl" style={{ background: 'var(--p-08)', color: 'var(--primary)', border: '1px dashed var(--p-25)' }}>
          A tabela de eventos ainda não existe. Rode o arquivo <code>supabase/schema-eventos.sql</code> no SQL Editor do Supabase para ativar o calendário.
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-4 items-stretch">

        <Calendario universoId={id} eventos={eventos} aniversarios={aniversarios} hoje={hoje} />

        {/* Coluna lateral */}
        <aside className="flex flex-col gap-4">
          <section className="p-5 flex-1" style={glassCard}>
            <div className="flex items-center justify-between mb-3">
              <p className={label} style={{ color: 'var(--foreground-muted)' }}>Personagens</p>
              <Link href={`/dashboard/personagens?universo=${id}`} className="text-[11px] hover:opacity-70" style={{ color: 'var(--primary)' }}>Ver todos →</Link>
            </div>
            <div className="flex flex-col gap-2">
              {(personagens ?? []).slice(0, 6).map(p => (
                <Link key={p.id} href={`/dashboard/personagens/${p.id}`} className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full transition-all hover:scale-[1.01]" style={{ background: 'var(--surface)', border: '0.5px solid var(--card-border)' }}>
                  <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-xs font-medium flex-shrink-0" style={{ background: p.foto_url ? 'transparent' : 'linear-gradient(135deg,#800020,#5C0018)', color: 'var(--primary-foreground)' }}>
                    {p.foto_url ? <img src={p.foto_url} alt="" className="w-full h-full object-cover" /> : p.nome[0].toUpperCase()}
                  </div>
                  <span className="text-xs font-medium truncate" style={{ color: 'var(--foreground)' }}>{p.nome}</span>
                </Link>
              ))}
              <Link href={`/dashboard/personagens/novo?universo=${id}`} className="flex items-center justify-center gap-1.5 py-2 rounded-full text-[11px]" style={{ border: '1px dashed var(--p-25)', color: 'var(--primary)' }}>
                <Plus size={12} /> Novo personagem
              </Link>
            </div>
          </section>
        </aside>

        <div>
          <ThreadAtual threads={threadsAtuais} novaHref={novaThreadHref} />
        </div>

        {/* Pastas */}
        <section className="grid grid-cols-3 gap-3 md:col-span-2" aria-label="Seções">
          {pastas.map(({ label: l, icon: Icon, count, href, desc }) => (
            <Link key={l} href={href} className="p-4 transition-all hover:scale-[1.02] block" style={{ ...glassCard, borderRadius: '18px' }}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: 'var(--p-08)', color: 'var(--primary)' }}><Icon size={15} /></div>
              <p className="text-2xl font-medium leading-none mb-1 tabular-nums" style={{ color: 'var(--foreground)' }}>{count}</p>
              <p className="text-[11px] font-medium" style={{ color: 'var(--foreground)' }}>{l}</p>
              <p className="text-[10px] hidden sm:block" style={{ color: 'var(--foreground-muted)' }}>{desc}</p>
            </Link>
          ))}
        </section>

        <div className="md:col-span-2">
          <Canons
            universoId={id}
            canons={(canonsRaw ?? []) as CanonItem[]}
            personagens={(personagens ?? []).map(p => ({ id: p.id, nome: p.nome }))}
            threads={todasThreads.map(t => ({ id: t.id, titulo: t.titulo }))}
            tabelaOk={!canonsErro}
          />
        </div>
      </div>
    </div>
  )
}
