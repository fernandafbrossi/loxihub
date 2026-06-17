import { createClient } from '@/lib/supabase/server'
import { ScrollText, MapPin, Users, BookOpen } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { count: threadsCount } = await supabase
    .from('threads')
    .select('*', { count: 'exact', head: true })

  const { count: lugaresCount } = await supabase
    .from('lugares')
    .select('*', { count: 'exact', head: true })

  const { count: personagensCount } = await supabase
    .from('personagens')
    .select('*', { count: 'exact', head: true })

  const { data: recentThreads } = await supabase
    .from('threads')
    .select('id, titulo, status, updated_at')
    .order('updated_at', { ascending: false })
    .limit(5)

  const stats = [
    { label: 'Threads', value: threadsCount ?? 0, icon: ScrollText, href: '/dashboard/threads' },
    { label: 'Lugares', value: lugaresCount ?? 0, icon: MapPin, href: '/dashboard/lugares' },
    { label: 'Personagens', value: personagensCount ?? 0, icon: Users, href: '/dashboard/personagens' },
  ]

  const statusLabel: Record<string, string> = {
    em_andamento: 'Em andamento',
    concluida: 'Concluída',
    arquivada: 'Arquivada',
  }

  const statusColor: Record<string, string> = {
    em_andamento: 'var(--accent)',
    concluida: 'var(--primary)',
    arquivada: 'var(--muted-foreground)',
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
          Bem-vinda de volta ✦
        </h1>
        <p className="mt-1 text-sm" style={{ color: 'var(--muted-foreground)' }}>
          {user?.email}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon, href }) => (
          <Link
            key={label}
            href={href}
            className="rounded-xl p-4 border transition-all hover:shadow-md"
            style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center gap-2 mb-2">
              <Icon size={16} style={{ color: 'var(--primary)' }} />
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{label}</span>
            </div>
            <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{value}</p>
          </Link>
        ))}
      </div>

      {/* Recent threads */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold" style={{ color: 'var(--foreground)' }}>Threads recentes</h2>
          <Link href="/dashboard/threads" className="text-sm hover:underline" style={{ color: 'var(--primary)' }}>
            Ver todas
          </Link>
        </div>

        {!recentThreads || recentThreads.length === 0 ? (
          <div className="rounded-xl border p-8 text-center" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <BookOpen size={32} className="mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Nenhuma thread ainda.{' '}
              <Link href="/dashboard/threads/nova" className="hover:underline" style={{ color: 'var(--primary)' }}>
                Criar a primeira
              </Link>
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {recentThreads.map(thread => (
              <Link
                key={thread.id}
                href={`/dashboard/threads/${thread.id}`}
                className="flex items-center justify-between p-4 rounded-xl border hover:shadow-sm transition-all"
                style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
              >
                <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                  {thread.titulo}
                </span>
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: 'var(--muted)',
                    color: statusColor[thread.status] ?? 'var(--muted-foreground)',
                  }}
                >
                  {statusLabel[thread.status] ?? thread.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
