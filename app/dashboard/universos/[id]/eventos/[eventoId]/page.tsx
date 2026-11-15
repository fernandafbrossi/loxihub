import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Pencil, CloudSun, ScrollText, ArrowUpRight, Sparkles } from 'lucide-react'
import { DeleteButton } from '@/components/delete-button'

const glassCard = {
  background: 'var(--card)',
  border: '0.5px solid var(--card-border)',
  borderRadius: '20px',
  boxShadow: 'var(--shadow-card)',
} as const

const label = 'text-[10px] font-medium uppercase tracking-wider mb-2'

export default async function EventoPage({ params }: { params: Promise<{ id: string; eventoId: string }> }) {
  const { id, eventoId } = await params
  const supabase = await createClient()

  const { data: evento } = await supabase
    .from('eventos')
    .select('*, threads(id, titulo, status)')
    .eq('id', eventoId)
    .eq('universo_id', id)
    .single()
  if (!evento) notFound()

  // Cenas em que o evento aparece (vazio se o SQL das cenas ainda não rodou)
  const { data: cenasRaw } = await supabase
    .from('contextos_cena')
    .select('id, localizacao, thread_id, threads(id, titulo)')
    .eq('evento_id', eventoId)
    .order('created_at', { ascending: true })
  const cenas = (cenasRaw ?? []) as unknown as { id: string; localizacao: string | null; thread_id: string; threads: { id: string; titulo: string } | null }[]

  const thread = evento.threads as { id: string; titulo: string; status: string } | null
  const data = new Date(evento.data_jogo + 'T12:00:00')
  const imagens: string[] = evento.imagens ?? []
  const threadConcluida = thread?.status === 'concluida'

  return (
    <div className="p-4 md:p-7 max-w-3xl">
      <Link href={`/dashboard/universos/${id}`} className="inline-flex items-center gap-1.5 text-xs mb-5 hover:opacity-70" style={{ color: 'var(--foreground-muted)' }}>
        <ArrowLeft size={13} /> Visão geral
      </Link>

      {/* Cabeçalho */}
      <div className="flex items-start gap-4 mb-6">
        <div className="w-16 h-16 rounded-full flex flex-col items-center justify-center flex-shrink-0" style={{ background: 'var(--btn-primary)', color: 'var(--primary-foreground)', boxShadow: 'var(--shadow-primary)' }}>
          <span className="text-2xl leading-none tabular-nums" style={{ fontFamily: 'var(--font-serif)' }}>{data.getDate()}</span>
          <span className="text-[9px] uppercase tracking-wider mt-0.5">{data.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</span>
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[11px] capitalize mb-0.5" style={{ color: 'var(--foreground-muted)' }}>
            {data.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
          <h1 className="text-2xl md:text-3xl leading-tight" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-serif)' }}>{evento.titulo}</h1>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={`/dashboard/universos/${id}/eventos/${eventoId}/editar`} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:opacity-70" style={{ background: 'var(--p-08)', color: 'var(--primary)' }}>
            <Pencil size={12} /> Editar
          </Link>
          <DeleteButton table="eventos" id={eventoId} redirectTo={`/dashboard/universos/${id}`} variant="light" />
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {/* Thread + tempo */}
        {(thread || evento.clima) && (
          <div className="grid sm:grid-cols-2 gap-3">
            {thread && (
              <Link href={`/dashboard/threads/${thread.id}`} className="flex items-center gap-3 p-4 transition-all hover:scale-[1.01]" style={glassCard}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--p-08)', color: 'var(--primary)' }}><ScrollText size={16} /></div>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--foreground-muted)' }}>Thread</p>
                  <p className="text-[13px] font-medium truncate" style={{ color: 'var(--foreground)' }}>{thread.titulo}</p>
                </div>
                <ArrowUpRight size={15} style={{ color: 'var(--primary)' }} />
              </Link>
            )}
            {evento.clima && (
              <div className="flex items-center gap-3 p-4" style={glassCard}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: 'var(--gold-15)', color: 'var(--gold-dark)' }}><CloudSun size={16} /></div>
                <div className="min-w-0">
                  <p className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--foreground-muted)' }}>Tempo</p>
                  <p className="text-[13px]" style={{ color: 'var(--foreground)' }}>{evento.clima}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Cenas */}
        {cenas.length > 0 && (
          <section className="p-5" style={glassCard}>
            <p className={label} style={{ color: 'var(--foreground-muted)' }}>Aparece em</p>
            <div className="flex flex-col gap-2">
              {cenas.map(c => (
                <Link key={c.id} href={`/dashboard/threads/${c.thread_id}`} className="flex items-center gap-2 text-[13px] hover:opacity-70" style={{ color: 'var(--foreground)' }}>
                  <ScrollText size={13} style={{ color: 'var(--primary)' }} />
                  <span className="font-medium">{c.threads?.titulo ?? 'Thread'}</span>
                  {c.localizacao && <span style={{ color: 'var(--foreground-muted)' }}>· {c.localizacao}</span>}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Descrição */}
        <section className="p-5" style={glassCard}>
          <p className={label} style={{ color: 'var(--foreground-muted)' }}>Sobre o evento</p>
          {evento.descricao
            ? <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>{evento.descricao}</p>
            : <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Sem descrição ainda.</p>}
        </section>

        {/* Imagens */}
        {imagens.length > 0 && (
          <section className="p-5" style={glassCard}>
            <p className={label} style={{ color: 'var(--foreground-muted)' }}>Referências</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {imagens.map((url, i) => (
                <a key={url} href={url} target="_blank" rel="noreferrer" className={`block overflow-hidden rounded-xl ${i === 0 && imagens.length > 2 ? 'sm:col-span-2 sm:row-span-2' : ''}`} style={{ background: 'var(--p-06)' }}>
                  <img src={url} alt="" className="w-full h-full object-cover aspect-square hover:scale-105 transition-transform duration-300" />
                </a>
              ))}
            </div>
          </section>
        )}

        {/* Acontecimentos */}
        <section className="p-5" style={{ ...glassCard, background: 'linear-gradient(160deg, var(--p-08), var(--card))' }}>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles size={13} style={{ color: 'var(--primary)' }} />
            <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--foreground-muted)' }}>Principais acontecimentos</p>
          </div>
          {evento.acontecimentos ? (
            <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>{evento.acontecimentos}</p>
          ) : (
            <div>
              <p className="text-xs mb-3" style={{ color: 'var(--foreground-muted)' }}>
                {threadConcluida ? 'A thread foi concluída. Registre o que aconteceu.' : 'Preencha aqui quando a thread terminar.'}
              </p>
              <Link href={`/dashboard/universos/${id}/eventos/${eventoId}/editar`} className="inline-block text-xs font-medium px-3 py-1.5 rounded-lg" style={threadConcluida ? { background: 'var(--btn-primary)', color: 'var(--primary-foreground)' } : { background: 'var(--p-08)', color: 'var(--primary)' }}>
                Escrever acontecimentos
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
