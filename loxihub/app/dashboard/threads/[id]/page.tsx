import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Tag, ArrowLeft } from 'lucide-react'
import { PostForm } from './post-form'

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: thread } = await supabase
    .from('threads')
    .select('*')
    .eq('id', id)
    .single()

  if (!thread) notFound()

  const { data: posts } = await supabase
    .from('posts')
    .select('id, conteudo, personagem_pov, criado_por, created_at, profiles(nome_display)')
    .eq('thread_id', id)
    .order('created_at', { ascending: true })

  const { data: { user } } = await supabase.auth.getUser()
  const { data: profile } = await supabase
    .from('profiles')
    .select('nome_display, personagem_principal')
    .eq('id', user?.id)
    .single()

  const statusLabel: Record<string, string> = {
    em_andamento: 'Em andamento',
    concluida: 'Concluída',
    arquivada: 'Arquivada',
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <Link href="/dashboard/threads" className="inline-flex items-center gap-1.5 text-sm mb-5 hover:underline" style={{ color: 'var(--muted-foreground)' }}>
        <ArrowLeft size={14} />
        Threads
      </Link>

      <div className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{thread.titulo}</h1>
          <span
            className="shrink-0 text-xs px-2.5 py-1 rounded-full font-medium mt-1"
            style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
          >
            {statusLabel[thread.status] ?? thread.status}
          </span>
        </div>

        {thread.descricao && (
          <p className="mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>{thread.descricao}</p>
        )}

        {thread.tags && thread.tags.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3 flex-wrap">
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

      <div className="space-y-4 mb-8">
        {!posts || posts.length === 0 ? (
          <div className="rounded-xl border p-8 text-center" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Nenhum post ainda. Escreva o primeiro!
            </p>
          </div>
        ) : (
          posts.map(post => {
            const isMe = post.criado_por === user?.id
            return (
              <div
                key={post.id}
                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className="max-w-[85%] rounded-2xl px-5 py-4 shadow-sm"
                  style={{
                    background: isMe ? 'var(--primary)' : 'var(--card)',
                    borderColor: 'var(--border)',
                    border: isMe ? 'none' : '1px solid var(--border)',
                  }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className="text-xs font-semibold"
                      style={{ color: isMe ? 'var(--primary-foreground)' : 'var(--accent)' }}
                    >
                      {post.personagem_pov || (post.profiles as { nome_display?: string } | null)?.nome_display || 'Narrador'}
                    </span>
                  </div>
                  <p
                    className="text-sm leading-relaxed whitespace-pre-wrap"
                    style={{ color: isMe ? 'var(--primary-foreground)' : 'var(--foreground)' }}
                  >
                    {post.conteudo}
                  </p>
                  <p
                    className="text-xs mt-2"
                    style={{ color: isMe ? 'rgba(250,248,245,0.6)' : 'var(--muted-foreground)' }}
                  >
                    {new Date(post.created_at).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      {thread.status === 'em_andamento' && (
        <PostForm threadId={id} personagemPrincipal={profile?.personagem_principal ?? ''} />
      )}
    </div>
  )
}
