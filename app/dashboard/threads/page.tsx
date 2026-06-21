import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Hash, Plus, ArrowLeft } from 'lucide-react'

const statusLabel: Record<string, string> = {
  em_andamento: 'em andamento',
  concluida: 'concluída',
  arquivada: 'arquivada',
}

const statusColor: Record<string, string> = {
  em_andamento: '#800020',
  concluida: '#906070',
  arquivada: '#B09098',
}

export default async function ThreadsPage({
  searchParams,
}: {
  searchParams: Promise<{ universo?: string }>
}) {
  const { universo } = await searchParams
  const supabase = await createClient()

  const threadsQuery = supabase
    .from('threads')
    .select('id, titulo, status, updated_at, tags')
    .order('updated_at', { ascending: false })

  if (universo) threadsQuery.eq('universo_id', universo)

  const [{ data: threads }, { data: universoData }] = await Promise.all([
    threadsQuery,
    universo
      ? supabase.from('universos').select('id, nome').eq('id', universo).single()
      : Promise.resolve({ data: null }),
  ])

  const novaHref = `/dashboard/threads/nova${universo ? `?universo=${universo}` : ''}`
  const backHref = universo ? `/dashboard/universos/${universo}` : '/dashboard'

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div
        className="sticky top-0 z-10 flex items-center gap-3 px-4 md:px-6 py-4"
        style={{
          background: 'rgba(247,240,243,0.92)',
          borderBottom: '0.5px solid rgba(128,0,32,0.08)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          paddingTop: 'max(16px, calc(env(safe-area-inset-top) + 52px))',
        }}
      >
        <Link
          href={backHref}
          className="flex-shrink-0 p-1 -ml-1 rounded-lg hover:opacity-70 transition-opacity"
          style={{ color: '#2E0510' }}
        >
          <ArrowLeft size={20} />
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-medium uppercase tracking-widest" style={{ color: '#B09098' }}>
            {universoData?.nome ?? 'Threads'}
          </p>
          <h1 className="text-sm font-medium" style={{ color: '#2E0510', fontFamily: 'var(--font-serif)' }}>
            Capítulos
          </h1>
        </div>
        <Link
          href={novaHref}
          className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-xl font-medium transition-opacity hover:opacity-80"
          style={{ background: '#800020', color: '#FAF0F2' }}
        >
          <Plus size={13} /> Novo
        </Link>
      </div>

      {/* Lista */}
      <div className="px-4 md:px-6 py-4 flex flex-col gap-2">
        {(!threads || threads.length === 0) && (
          <p className="text-sm text-center py-12" style={{ color: '#B09098' }}>
            Nenhum capítulo ainda.
          </p>
        )}

        {threads?.map((t, i) => (
          <Link
            key={t.id}
            href={`/dashboard/threads/${t.id}`}
            className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all active:opacity-70"
            style={{
              background: 'rgba(255,255,255,0.60)',
              border: '0.5px solid rgba(128,0,32,0.08)',
              boxShadow: '0 2px 8px rgba(40,5,15,0.04)',
            }}
          >
            <div
              className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium"
              style={{ background: 'rgba(128,0,32,0.07)', color: '#906070' }}
            >
              <Hash size={13} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" style={{ color: '#2E0510' }}>
                {t.titulo}
              </p>
              {t.updated_at && (
                <p className="text-[10px] mt-0.5" style={{ color: '#B09098' }}>
                  {new Date(t.updated_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                </p>
              )}
            </div>
            <span
              className="flex-shrink-0 text-[9px] font-medium px-2 py-0.5 rounded-full"
              style={{
                background: 'rgba(128,0,32,0.07)',
                color: statusColor[t.status] ?? '#906070',
              }}
            >
              {statusLabel[t.status] ?? t.status}
            </span>
          </Link>
        ))}
      </div>
    </div>
  )
}
