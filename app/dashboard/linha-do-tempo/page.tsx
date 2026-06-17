import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Hash, CalendarDays, Clock } from 'lucide-react'

export default async function LinhaDoTempoPage({ searchParams }: { searchParams: Promise<{ universo?: string }> }) {
  const { universo } = await searchParams
  const supabase = await createClient()

  const query = supabase
    .from('threads')
    .select('id, titulo, descricao, status, tags, data_na_historia')
    .order('data_na_historia', { ascending: true })
  if (universo) query.eq('universo_id', universo)
  const { data: threads } = await query

  const comData = (threads ?? []).filter(t => t.data_na_historia)
  const semData = (threads ?? []).filter(t => !t.data_na_historia)

  const statusLabel: Record<string, string> = {
    em_andamento: 'Em andamento',
    concluida: 'Concluída',
    arquivada: 'Arquivada',
  }

  function formatarData(data: string) {
    return new Date(data + 'T12:00:00').toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: '#2E0510' }}>Linha do tempo</h1>
        <p className="text-sm mt-1" style={{ color: '#906070' }}>
          Capítulos ordenados por data de acontecimento na história
        </p>
      </div>

      {comData.length === 0 && semData.length === 0 && (
        <div className="rounded-2xl p-10 text-center" style={{ background: 'rgba(255,255,255,0.60)', border: '0.5px solid rgba(128,0,32,0.08)' }}>
          <CalendarDays size={36} className="mx-auto mb-3" style={{ color: '#B09098' }} />
          <p className="text-sm font-medium mb-1" style={{ color: '#2E0510' }}>Nenhuma thread ainda</p>
          <p className="text-xs" style={{ color: '#906070' }}>Crie threads e adicione datas para visualizar a linha do tempo.</p>
        </div>
      )}

      {/* Threads com data — linha do tempo */}
      {comData.length > 0 && (
        <div className="relative">
          {/* Linha vertical */}
          <div
            className="absolute left-[19px] top-2 bottom-2 w-px"
            style={{ background: 'rgba(128,0,32,0.15)' }}
          />

          <div className="flex flex-col gap-6">
            {comData.map((thread, i) => (
              <div key={thread.id} className="flex gap-4 items-start">
                {/* Ponto na linha */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 z-10"
                  style={{
                    background: thread.status === 'em_andamento' ? '#800020' : 'rgba(255,255,255,0.80)',
                    border: '1.5px solid rgba(128,0,32,0.30)',
                    boxShadow: thread.status === 'em_andamento' ? '0 2px 12px rgba(128,0,32,0.25)' : 'none',
                  }}
                >
                  <Hash size={13} style={{ color: thread.status === 'em_andamento' ? '#FAF0F2' : '#906070' }} />
                </div>

                {/* Card */}
                <Link
                  href={`/dashboard/threads/${thread.id}`}
                  className="flex-1 rounded-xl p-4 hover:shadow-md transition-all group"
                  style={{ background: 'rgba(255,255,255,0.60)', border: '0.5px solid rgba(128,0,32,0.08)' }}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="text-sm font-medium group-hover:underline" style={{ color: '#2E0510' }}>
                      {thread.titulo}
                    </p>
                    <span
                      className="text-[10px] px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: 'rgba(128,0,32,0.07)', color: '#906070' }}
                    >
                      {statusLabel[thread.status] ?? thread.status}
                    </span>
                  </div>
                  <p className="text-[11px] flex items-center gap-1" style={{ color: '#B09098' }}>
                    <CalendarDays size={10} />
                    {formatarData(thread.data_na_historia)}
                  </p>
                  {thread.descricao && (
                    <p className="text-xs mt-1.5 line-clamp-2" style={{ color: '#906070' }}>{thread.descricao}</p>
                  )}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Threads sem data */}
      {semData.length > 0 && (
        <div className="mt-10">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={13} style={{ color: '#B09098' }} />
            <p className="text-[10px] uppercase tracking-widest" style={{ color: '#B09098' }}>
              Sem data definida
            </p>
          </div>
          <div className="flex flex-col gap-2">
            {semData.map(thread => (
              <Link
                key={thread.id}
                href={`/dashboard/threads/${thread.id}`}
                className="flex items-center justify-between px-4 py-3 rounded-xl hover:opacity-80 transition-all"
                style={{ background: 'rgba(255,255,255,0.50)', border: '0.5px solid rgba(128,0,32,0.07)' }}
              >
                <div className="flex items-center gap-2">
                  <Hash size={11} style={{ color: '#B09098' }} />
                  <span className="text-sm" style={{ color: '#2E0510' }}>{thread.titulo}</span>
                </div>
                <span className="text-[10px]" style={{ color: '#B09098' }}>
                  {statusLabel[thread.status] ?? thread.status}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
