import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, ScrollText, Tag } from 'lucide-react'

export default async function ThreadsPage() {
  const supabase = await createClient()

  const { data: threads } = await supabase
    .from('threads')
    .select('id, titulo, descricao, status, tags, updated_at, capa_url')
    .order('updated_at', { ascending: false })

  const statusLabel: Record<string, string> = {
    em_andamento: 'Em andamento',
    concluida: 'Concluída',
    arquivada: 'Arquivada',
  }

  const statusColor: Record<string, string> = {
    em_andamento: '#c9956a',
    concluida: '#8b5e3c',
    arquivada: '#a89a8e',
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Threads</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {threads?.length ?? 0} {threads?.length === 1 ? 'capítulo' : 'capítulos'}
          </p>
        </div>
        <Link
          href="/dashboard/threads/nova"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-opacity hover:opacity-90"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          <Plus size={16} />
          Nova thread
        </Link>
      </div>

      {!threads || threads.length === 0 ? (
        <div className="rounded-xl border p-12 text-center" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <ScrollText size={40} className="mx-auto mb-4" style={{ color: 'var(--muted-foreground)' }} />
          <p className="font-medium mb-1" style={{ color: 'var(--foreground)' }}>Nenhuma thread ainda</p>
          <p className="text-sm mb-4" style={{ color: 'var(--muted-foreground)' }}>
            Comece criando o primeiro capítulo da história
          </p>
          <Link
            href="/dashboard/threads/nova"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            <Plus size={16} />
            Criar primeira thread
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {threads.map(thread => (
            <Link
              key={thread.id}
              href={`/dashboard/threads/${thread.id}`}
              className="group rounded-xl border p-5 hover:shadow-md transition-all"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-base truncate group-hover:underline" style={{ color: 'var(--foreground)' }}>
                    {thread.titulo}
                  </h2>
                  {thread.descricao && (
                    <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>
                      {thread.descricao}
                    </p>
                  )}
                  {thread.tags && thread.tags.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <Tag size={12} style={{ color: 'var(--muted-foreground)' }} />
                      {thread.tags.map((tag: string) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <span
                  className="shrink-0 text-xs px-2.5 py-1 rounded-full font-medium"
                  style={{
                    background: 'var(--muted)',
                    color: statusColor[thread.status] ?? 'var(--muted-foreground)',
                  }}
                >
                  {statusLabel[thread.status] ?? thread.status}
                </span>
              </div>
              <p className="text-xs mt-3" style={{ color: 'var(--muted-foreground)' }}>
                Atualizada em {new Date(thread.updated_at).toLocaleDateString('pt-BR')}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
