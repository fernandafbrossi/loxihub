import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Tag, Hash, Pencil, CalendarDays, ArrowLeft } from 'lucide-react'
import { PostForm } from './post-form'
import { PostsList } from './posts-list'
import { CenaForm } from './cena-form'
import { ThreadHistory } from './thread-history'
import { ThreadSidebar } from './thread-sidebar'

export default async function ThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: thread } = await supabase
    .from('threads')
    .select('*')
    .eq('id', id)
    .single()

  if (!thread) notFound()

  const threadsQuery = supabase
    .from('threads')
    .select('id, titulo, status, tags')
    .order('created_at', { ascending: true })

  if (thread.universo_id) threadsQuery.eq('universo_id', thread.universo_id)

  const [
    { data: allThreads },
    { data: posts },
    { data: { user } },
    { data: personagens },
    { data: contextos },
    { data: lugares },
  ] = await Promise.all([
    threadsQuery,
    supabase
      .from('posts')
      .select('id, conteudo, personagem_pov, criado_por, created_at')
      .eq('thread_id', id)
      .order('created_at', { ascending: true }),
    supabase.auth.getUser(),
    thread.universo_id
      ? supabase.from('personagens').select('id, nome, foto_url, tipo').eq('universo_id', thread.universo_id).order('nome', { ascending: true })
      : supabase.from('personagens').select('id, nome, foto_url, tipo').order('nome', { ascending: true }),
    supabase
      .from('contextos_cena')
      .select('id, localizacao, lugar_id, data_cena, temperatura_min, temperatura_max, temperatura_media, criado_por, created_at, roupas_contexto(id, personagem_id, roupa_url, personagens(id, nome)), lugares(id, nome)')
      .eq('thread_id', id)
      .order('created_at', { ascending: true }),
    thread.universo_id
      ? supabase.from('lugares').select('id, nome, lat, lng').eq('universo_id', thread.universo_id).order('nome', { ascending: true })
      : supabase.from('lugares').select('id, nome, lat, lng').order('nome', { ascending: true }),
  ])

  const timeline = [
    ...(posts ?? []).map(p => ({ type: 'post' as const, data: p })),
    ...(contextos ?? []).map(c => ({ type: 'contexto' as const, data: c })),
  ].sort((a, b) => new Date(a.data.created_at as string).getTime() - new Date(b.data.created_at as string).getTime())

  const statusLabel: Record<string, string> = {
    em_andamento: 'em andamento',
    concluida: 'concluída',
    arquivada: 'arquivada',
  }

  const novaThreadHref = thread.universo_id
    ? `/dashboard/threads/nova?universo=${thread.universo_id}`
    : '/dashboard/threads/nova'

  return (
    <div className="flex overflow-hidden h-[100dvh] md:h-[calc(100vh-40px)]">

      {/* ── Painel esquerdo: lista de capítulos ── */}
      <ThreadSidebar
        threads={(allThreads ?? []) as any}
        currentId={id}
        novaThreadHref={novaThreadHref}
      />

      {/* ── Painel direito ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header mobile */}
        <div
          className="md:hidden flex-shrink-0 flex items-center gap-3 px-4"
          style={{ paddingTop: 52, paddingBottom: 14, borderBottom: '0.5px solid rgba(128,0,32,0.08)' }}
        >
          <Link
            href={thread.universo_id ? `/dashboard/threads?universo=${thread.universo_id}` : '/dashboard/threads'}
            className="flex-shrink-0 p-1 -ml-1 rounded-lg hover:opacity-70 transition-opacity"
            style={{ color: '#2E0510' }}
          >
            <ArrowLeft size={20} />
          </Link>
          <Hash size={13} style={{ color: '#906070', flexShrink: 0 }} />
          <span className="text-sm font-medium truncate" style={{ color: '#2E0510' }}>{thread.titulo}</span>
          <Link
            href={`/dashboard/threads/${id}/editar`}
            className="ml-auto flex-shrink-0 p-1 rounded-lg hover:opacity-70 transition-opacity"
            style={{ color: '#906070' }}
          >
            <Pencil size={16} />
          </Link>
        </div>

        {/* Header desktop */}
        <div
          className="hidden md:flex px-6 py-4 flex-shrink-0 items-start justify-between gap-4"
          style={{ borderBottom: '0.5px solid rgba(128,0,32,0.08)' }}
        >
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Hash size={14} style={{ color: '#906070' }} />
              <h1 className="text-sm font-medium" style={{ color: '#2E0510' }}>{thread.titulo}</h1>
              <span
                className="text-[9px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(128,0,32,0.08)', color: '#906070' }}
              >
                {statusLabel[thread.status] ?? thread.status}
              </span>
            </div>
            {thread.descricao && (
              <p className="text-xs ml-5" style={{ color: '#906070' }}>{thread.descricao}</p>
            )}
            {thread.data_na_historia && (
              <div className="flex items-center gap-1 mt-1 ml-5">
                <CalendarDays size={10} style={{ color: '#B09098' }} />
                <span className="text-[10px]" style={{ color: '#906070' }}>
                  {new Date(thread.data_na_historia + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              </div>
            )}
            {thread.tags && thread.tags.length > 0 && (
              <div className="flex items-center gap-1.5 mt-1.5 ml-5 flex-wrap">
                <Tag size={10} style={{ color: '#B09098' }} />
                {thread.tags.map((tag: string) => (
                  <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(128,0,32,0.07)', color: '#906070' }}>
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <ThreadHistory contextos={(contextos ?? []) as any} />
            <Link
              href={`/dashboard/threads/${id}/editar`}
              className="flex items-center gap-1.5 text-[11px] px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70"
              style={{ background: 'rgba(128,0,32,0.07)', color: '#800020' }}
            >
              <Pencil size={12} /> Editar
            </Link>
          </div>
        </div>

        {/* Posts + Contextos */}
        <div className="flex-1 overflow-y-auto px-6 py-6">
          <PostsList
            items={timeline as any}
            userId={user?.id ?? ''}
            personagens={personagens ?? []}
            threadId={id}
          />
        </div>

        {/* Form */}
        {thread.status === 'em_andamento' && (
          <div
            className="flex-shrink-0 px-4 md:px-6 py-4"
            style={{
              borderTop: '0.5px solid rgba(128,0,32,0.08)',
              paddingBottom: 'max(16px, env(safe-area-inset-bottom))',
            }}
          >
            <CenaForm threadId={id} personagens={personagens ?? []} lugares={lugares ?? []} />
            <PostForm
              threadId={id}
              personagemPrincipal=""
              personagens={personagens ?? []}
            />
          </div>
        )}

        {thread.status !== 'em_andamento' && (
          <div
            className="flex-shrink-0 px-6 py-3 text-center"
            style={{ borderTop: '0.5px solid rgba(128,0,32,0.08)' }}
          >
            <p className="text-xs" style={{ color: '#B09098' }}>
              Esta thread está {statusLabel[thread.status]} — novos posts desativados.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}
