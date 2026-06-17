import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus } from 'lucide-react'

const glassCard = {
  background: 'rgba(255,255,255,0.60)',
  border: '0.5px solid rgba(255,255,255,0.92)',
  borderRadius: '14px',
  boxShadow: '0 4px 24px rgba(40,5,15,0.07), 0 1px 3px rgba(40,5,15,0.04), inset 0 1px 0 rgba(255,255,255,0.88)',
} as const

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const seteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const [
    { data: universos },
    { data: recentThreads },
    { data: recentPosts },
    { count: postsEssaSemana },
    { count: postsSociaisEssaSemana },
    { count: threadsAtivas },
    { data: postsThreadsSemana },
  ] = await Promise.all([
    supabase.from('universos').select('id, nome, genero, status, created_at').order('updated_at', { ascending: false }),
    supabase.from('threads').select('id, titulo, status, updated_at, universos(nome)').order('updated_at', { ascending: false }).limit(4),
    supabase.from('posts_sociais').select('id, personagem_id, conteudo, tipo, created_at, personagens(nome)').order('created_at', { ascending: false }).limit(3),
    supabase.from('posts').select('id', { count: 'exact', head: true }).gte('created_at', seteDiasAtras),
    supabase.from('posts_sociais').select('id', { count: 'exact', head: true }).gte('created_at', seteDiasAtras),
    supabase.from('threads').select('id', { count: 'exact', head: true }).eq('status', 'em_andamento'),
    supabase.from('posts').select('thread_id').gte('created_at', seteDiasAtras),
  ])

  const totalPostsSemana = (postsEssaSemana ?? 0) + (postsSociaisEssaSemana ?? 0)
  const threadsComAtividade = new Set((postsThreadsSemana ?? []).map((p: any) => p.thread_id)).size

  const displayName = user?.email?.split('@')[0] ?? 'você'

  const statusLabel: Record<string, string> = {
    ativo: 'ativo',
    pausado: 'pausado',
    arquivado: 'arquivado',
  }

  return (
    <div className="p-7 max-w-3xl">

      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-xl font-medium" style={{ color: '#2E0510', fontFamily: 'var(--font-serif)' }}>
            Olá, {displayName} ✦
          </h1>
          <p className="mt-1 text-xs" style={{ color: '#906070' }}>
            {universos && universos.length > 0
              ? `${universos.length} universo${universos.length > 1 ? 's' : ''} ativo${universos.length > 1 ? 's' : ''}`
              : 'Nenhum universo ainda — crie o primeiro!'}
          </p>
        </div>
        <Link
          href="/dashboard/universos/novo"
          className="flex items-center gap-1.5 text-xs font-medium px-3.5 py-2 rounded-lg transition-opacity hover:opacity-80"
          style={{
            background: '#800020',
            color: '#FAF0F2',
            boxShadow: '0 2px 12px rgba(128,0,32,0.38)',
          }}
        >
          <Plus size={13} />
          Novo universo
        </Link>
      </div>

      {/* Universos */}
      <div className="mb-7">
        <p className="text-[10px] font-medium uppercase tracking-wider mb-3" style={{ color: '#906070' }}>
          Universos
        </p>

        {!universos || universos.length === 0 ? (
          <Link
            href="/dashboard/universos/novo"
            className="flex flex-col items-center justify-center p-10 transition-all hover:scale-[1.01]"
            style={{
              ...glassCard,
              border: '1px dashed rgba(128,0,32,0.22)',
              background: 'rgba(255,255,255,0.30)',
            }}
          >
            <Plus size={24} style={{ color: '#800020', marginBottom: 8 }} />
            <p className="text-sm font-medium" style={{ color: '#800020' }}>Criar primeiro universo</p>
            <p className="text-xs mt-1" style={{ color: '#906070' }}>Cada universo tem seus personagens, threads e lugares</p>
          </Link>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {universos.map(u => (
              <Link
                key={u.id}
                href={`/dashboard/universos/${u.id}`}
                className="p-4 transition-all hover:scale-[1.01] block"
                style={glassCard}
              >
                <div className="flex items-start justify-between mb-3">
                  <span
                    className="text-[9px] font-medium px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(201,169,110,0.15)', color: '#7A5A20' }}
                  >
                    {u.genero ?? 'Sem gênero'}
                  </span>
                  <span
                    className="text-[9px] font-medium px-2 py-0.5 rounded-full"
                    style={
                      u.status === 'ativo'
                        ? { background: 'linear-gradient(135deg, #800020, #A0002A)', color: '#FAF0F2', boxShadow: '0 1px 6px rgba(128,0,32,0.30)' }
                        : { background: 'rgba(128,0,32,0.09)', color: '#906070' }
                    }
                  >
                    {statusLabel[u.status] ?? u.status}
                  </span>
                </div>
                <p className="text-sm font-medium mb-1" style={{ color: '#2E0510', fontFamily: 'var(--font-serif)' }}>{u.nome}</p>
                <div
                  className="mt-3 pt-3 flex items-center justify-between"
                  style={{ borderTop: '0.5px solid rgba(128,0,32,0.08)' }}
                >
                  <span className="text-[10px]" style={{ color: '#906070' }}>Ver universo →</span>
                </div>
              </Link>
            ))}

            <Link
              href="/dashboard/universos/novo"
              className="flex items-center justify-center p-4 transition-all hover:scale-[1.01]"
              style={{
                ...glassCard,
                border: '1px dashed rgba(128,0,32,0.20)',
                background: 'rgba(255,255,255,0.25)',
                minHeight: 100,
              }}
            >
              <span className="text-xs" style={{ color: '#906070' }}>+ Novo universo</span>
            </Link>
          </div>
        )}
      </div>

      {/* Atividade recente */}
      {((recentThreads && recentThreads.length > 0) || (recentPosts && recentPosts.length > 0)) && (
        <div className="mb-7">
          <p className="text-[10px] font-medium uppercase tracking-wider mb-3" style={{ color: '#906070' }}>
            Atividade recente
          </p>
          <div className="flex flex-col gap-2">
            {(recentThreads ?? []).map((t: any) => (
              <Link
                key={`t-${t.id}`}
                href={`/dashboard/threads/${t.id}`}
                className="flex items-center gap-3 p-3.5 transition-all hover:scale-[1.005]"
                style={glassCard}
              >
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#C9A96E' }} />
                <span className="text-xs font-medium flex-1" style={{ color: '#2E0510' }}>{t.titulo}</span>
                {t.universos?.nome && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0" style={{ background: 'rgba(201,169,110,0.12)', color: '#7A5A20' }}>
                    {t.universos.nome}
                  </span>
                )}
                <span className="text-[10px]" style={{ color: '#B09098' }}>thread</span>
              </Link>
            ))}
            {(recentPosts ?? []).map((p: any) => (
              <Link
                key={`p-${p.id}`}
                href={`/dashboard/personagens/${p.personagem_id}/social`}
                className="flex items-center gap-3 p-3.5 transition-all hover:scale-[1.005]"
                style={glassCard}
              >
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#906070' }} />
                <span className="text-xs font-medium flex-1 truncate" style={{ color: '#2E0510' }}>
                  {p.personagens?.nome ?? 'Personagem'} · {p.tipo === 'twitter' ? 'Twitter' : 'Instagram'}
                </span>
                <span className="text-[10px]" style={{ color: '#B09098' }}>post</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Estatísticas da semana */}
      <div>
        <p className="text-[10px] font-medium uppercase tracking-wider mb-3" style={{ color: '#906070' }}>
          Essa semana
        </p>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4" style={glassCard}>
            <p className="text-2xl font-medium" style={{ color: '#2E0510', fontFamily: 'var(--font-serif)' }}>
              {totalPostsSemana}
            </p>
            <p className="text-[10px] mt-1" style={{ color: '#906070' }}>
              {totalPostsSemana === 1 ? 'post escrito' : 'posts escritos'}
            </p>
          </div>

          <div className="p-4" style={glassCard}>
            <p className="text-2xl font-medium" style={{ color: '#2E0510', fontFamily: 'var(--font-serif)' }}>
              {threadsAtivas ?? 0}
            </p>
            <p className="text-[10px] mt-1" style={{ color: '#906070' }}>
              {(threadsAtivas ?? 0) === 1 ? 'thread ativa' : 'threads ativas'}
            </p>
          </div>

          <div className="p-4" style={glassCard}>
            <p className="text-2xl font-medium" style={{ color: '#2E0510', fontFamily: 'var(--font-serif)' }}>
              {threadsComAtividade}
            </p>
            <p className="text-[10px] mt-1" style={{ color: '#906070' }}>
              {threadsComAtividade === 1 ? 'thread com atividade' : 'threads com atividade'}
            </p>
          </div>
        </div>
      </div>

    </div>
  )
}
