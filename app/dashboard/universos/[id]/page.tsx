import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ScrollText, Users, MapPin, ArrowLeft, Pencil } from 'lucide-react'

const glassCard = {
  background: 'rgba(255,255,255,0.60)',
  border: '0.5px solid rgba(255,255,255,0.92)',
  borderRadius: '14px',
  boxShadow: '0 4px 24px rgba(40,5,15,0.07), 0 1px 3px rgba(40,5,15,0.04), inset 0 1px 0 rgba(255,255,255,0.88)',
} as const

export default async function UniversoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [
    { data: universo },
    { count: threadsCount },
    { count: personagensCount },
    { count: lugaresCount },
    { data: recentThreads },
    { data: personagens },
  ] = await Promise.all([
    supabase.from('universos').select('*').eq('id', id).single(),
    supabase.from('threads').select('*', { count: 'exact', head: true }).eq('universo_id', id),
    supabase.from('personagens').select('*', { count: 'exact', head: true }).eq('universo_id', id),
    supabase.from('lugares').select('*', { count: 'exact', head: true }).eq('universo_id', id),
    supabase.from('threads').select('id, titulo, status, updated_at').eq('universo_id', id).order('updated_at', { ascending: false }).limit(5),
    supabase.from('personagens').select('id, nome, foto_url').eq('universo_id', id).limit(6),
  ])

  if (!universo) notFound()

  const secoes = [
    { label: 'Threads', icon: ScrollText, count: threadsCount ?? 0, href: `/dashboard/threads?universo=${id}`, desc: 'Capítulos e cenas' },
    { label: 'Personagens', icon: Users, count: personagensCount ?? 0, href: `/dashboard/personagens?universo=${id}`, desc: 'Fichas e perfis' },
    { label: 'Lugares', icon: MapPin, count: lugaresCount ?? 0, href: `/dashboard/lugares?universo=${id}`, desc: 'Cenários e mapas' },
  ]

  return (
    <div className="p-7 max-w-3xl">

      {/* Voltar */}
      <Link
        href="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs mb-5 hover:opacity-70 transition-opacity"
        style={{ color: '#906070' }}
      >
        <ArrowLeft size={13} /> Todos os universos
      </Link>

      {/* Header do universo */}
      <div className="mb-7 flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            {universo.genero && (
              <span
                className="text-[9px] font-medium px-2 py-0.5 rounded-full"
                style={{ background: 'rgba(128,0,32,0.09)', color: '#5C0018' }}
              >
                {universo.genero}
              </span>
            )}
            <span
              className="text-[9px] font-medium px-2 py-0.5 rounded-full"
              style={
                universo.status === 'ativo'
                  ? { background: '#800020', color: '#FAF0F2', boxShadow: '0 1px 6px rgba(128,0,32,0.28)' }
                  : { background: 'rgba(128,0,32,0.09)', color: '#906070' }
              }
            >
              {universo.status}
            </span>
          </div>
          <h1 className="text-2xl font-medium" style={{ color: '#2E0510' }}>{universo.nome}</h1>
          {universo.descricao && (
            <p className="mt-1.5 text-sm leading-relaxed max-w-lg" style={{ color: '#906070' }}>
              {universo.descricao}
            </p>
          )}
        </div>
        <Link
          href={`/dashboard/universos/${id}/editar`}
          className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg hover:opacity-70 transition-opacity"
          style={{ background: 'rgba(128,0,32,0.08)', color: '#800020' }}
        >
          <Pencil size={12} /> Editar
        </Link>
      </div>

      {/* Seções principais */}
      <div className="grid grid-cols-3 gap-3 mb-7">
        {secoes.map(({ label, icon: Icon, count, href, desc }) => (
          <Link key={label} href={href} className="p-4 transition-all hover:scale-[1.02] block" style={glassCard}>
            <div className="flex items-center gap-2 mb-3">
              <Icon size={14} style={{ color: '#800020' }} />
              <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: '#906070' }}>
                {label}
              </span>
            </div>
            <p className="text-2xl font-medium mb-0.5" style={{ color: '#2E0510' }}>{count}</p>
            <p className="text-[10px]" style={{ color: '#906070' }}>{desc}</p>
          </Link>
        ))}
      </div>

      {/* Personagens em destaque */}
      {personagens && personagens.length > 0 && (
        <div className="mb-7">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: '#906070' }}>Personagens</p>
            <Link href={`/dashboard/personagens?universo=${id}`} className="text-[11px] hover:opacity-70" style={{ color: '#800020' }}>
              Ver todos →
            </Link>
          </div>
          <div className="flex gap-3 flex-wrap">
            {personagens.map(p => (
              <Link
                key={p.id}
                href={`/dashboard/personagens/${p.id}`}
                className="flex flex-col items-center gap-2 transition-all hover:scale-105"
              >
                <div
                  className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center text-sm font-medium"
                  style={{
                    background: p.foto_url ? 'transparent' : 'linear-gradient(135deg,#800020,#5C0018)',
                    color: '#FAF0F2',
                    boxShadow: '0 2px 10px rgba(40,5,15,0.18)',
                  }}
                >
                  {p.foto_url
                    ? <img src={p.foto_url} alt={p.nome} className="w-full h-full object-cover" />
                    : p.nome[0].toUpperCase()
                  }
                </div>
                <span className="text-[10px] font-medium" style={{ color: '#2E0510' }}>{p.nome}</span>
              </Link>
            ))}
            <Link
              href={`/dashboard/personagens/novo?universo=${id}`}
              className="flex flex-col items-center gap-2 transition-all hover:scale-105"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-lg"
                style={{ background: 'rgba(128,0,32,0.08)', color: '#800020', border: '1px dashed rgba(128,0,32,0.25)' }}
              >
                +
              </div>
              <span className="text-[10px]" style={{ color: '#906070' }}>Novo</span>
            </Link>
          </div>
        </div>
      )}

      {/* Threads recentes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: '#906070' }}>Threads recentes</p>
          <Link href={`/dashboard/threads?universo=${id}`} className="text-[11px] hover:opacity-70" style={{ color: '#800020' }}>
            Ver todas →
          </Link>
        </div>

        {!recentThreads || recentThreads.length === 0 ? (
          <div className="p-6 text-center" style={glassCard}>
            <p className="text-xs mb-3" style={{ color: '#906070' }}>Nenhuma thread neste universo ainda.</p>
            <Link
              href={`/dashboard/threads/nova?universo=${id}`}
              className="inline-block text-xs font-medium px-3 py-1.5 rounded-lg"
              style={{ background: '#800020', color: '#FAF0F2' }}
            >
              Criar primeira thread
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {recentThreads.map(t => (
              <Link
                key={t.id}
                href={`/dashboard/threads/${t.id}`}
                className="flex items-center gap-3 p-3.5 transition-all hover:scale-[1.005]"
                style={glassCard}
              >
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#800020' }} />
                <span className="text-xs font-medium flex-1" style={{ color: '#2E0510' }}>{t.titulo}</span>
                <span
                  className="text-[9px] font-medium px-2 py-0.5 rounded-full"
                  style={
                    t.status === 'em_andamento'
                      ? { background: '#800020', color: '#FAF0F2' }
                      : { background: 'rgba(128,0,32,0.09)', color: '#906070' }
                  }
                >
                  {t.status === 'em_andamento' ? 'em andamento' : t.status}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

    </div>
  )
}
