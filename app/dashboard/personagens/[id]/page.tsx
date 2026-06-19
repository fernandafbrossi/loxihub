import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Pencil, ArrowLeft, Smartphone, Hash } from 'lucide-react'
import { GuardaRoupaSection } from './guarda-roupa-section'
import { InspoSection } from './inspo-section'
import { VinculosSection } from './vinculos-section'

const card = {
  background: 'rgba(255,255,255,0.60)',
  border: '0.5px solid rgba(128,0,32,0.08)',
  backdropFilter: 'blur(8px)',
} as const

export default async function PersonagemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: personagem } = await supabase
    .from('personagens')
    .select('*')
    .eq('id', id)
    .single()

  if (!personagem) notFound()

  const relacoesFetch = supabase
    .from('relacoes_personagens')
    .select('id, tipo_relacao, nota, personagem_a, personagem_b')
    .or(`personagem_a.eq.${id},personagem_b.eq.${id}`)

  const postsFetch = supabase
    .from('posts')
    .select('id, conteudo, created_at, thread_id, threads(id, titulo)')
    .eq('personagem_pov', personagem.nome)
    .order('created_at', { ascending: false })

  const guardaRoupaFetch = supabase
    .from('guarda_roupa')
    .select('id, roupa_url')
    .eq('personagem_id', id)
    .order('created_at', { ascending: true })

  const inspoFetch = supabase
    .from('inspo_personagem')
    .select('id, url')
    .eq('personagem_id', id)
    .order('created_at', { ascending: true })

  const todosPersonagensFetch = supabase
    .from('personagens')
    .select('id, nome, foto_url')
    .order('nome', { ascending: true })

  const [{ data: relacoes }, { data: posts }, { data: guarda_roupa }, { data: inspo }, { data: todosPersonagens }] = await Promise.all([
    relacoesFetch, postsFetch, guardaRoupaFetch, inspoFetch, todosPersonagensFetch,
  ])

  function getPersonagem(pid: string) {
    return (todosPersonagens ?? []).find(p => p.id === pid)
  }

  const threadsMap = new Map<string, { id: string; titulo: string; count: number }>()
  for (const post of (posts ?? [])) {
    const thread = post.threads as unknown as { id: string; titulo: string } | null
    if (!thread) continue
    const existing = threadsMap.get(thread.id)
    if (existing) existing.count++
    else threadsMap.set(thread.id, { id: thread.id, titulo: thread.titulo, count: 1 })
  }
  const threads = Array.from(threadsMap.values())

  const tipoLabel = personagem.tipo === 'principal' ? 'Personagem principal' : 'NPC'

  return (
    <div className="flex-1 overflow-y-auto px-6 py-6">
      <div className="max-w-4xl mx-auto flex flex-col gap-4">

        {/* ── Voltar ── */}
        <Link
          href="/dashboard/personagens"
          className="inline-flex items-center gap-1.5 text-xs self-start hover:opacity-70 transition-opacity"
          style={{ color: '#906070' }}
        >
          <ArrowLeft size={13} /> Personagens
        </Link>

        {/* ── Topo: Avatar + Bio ── */}
        <div className="rounded-2xl p-6 flex gap-6 items-start relative" style={card}>

          {/* Botão editar — canto superior direito */}
          <Link
            href={`/dashboard/personagens/${id}/editar`}
            className="absolute top-4 right-4 flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-opacity hover:opacity-70"
            style={{ background: 'rgba(128,0,32,0.07)', color: '#800020' }}
          >
            <Pencil size={11} /> Editar
          </Link>

          {/* Avatar + tipo + ações */}
          <div className="flex flex-col items-center gap-3 flex-shrink-0" style={{ width: 140 }}>
            <div
              className="w-32 h-32 rounded-full overflow-hidden flex items-center justify-center flex-shrink-0"
              style={{
                background: 'linear-gradient(135deg, #C08090, #800020)',
                boxShadow: '0 4px 24px rgba(128,0,32,0.20)',
              }}
            >
              {personagem.foto_url ? (
                <img src={personagem.foto_url} alt={personagem.nome} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-semibold" style={{ color: '#FAF0F2' }}>
                  {personagem.nome[0].toUpperCase()}
                </span>
              )}
            </div>

            <span
              className="text-[10px] font-medium px-2.5 py-0.5 rounded-full text-center"
              style={{ background: 'rgba(128,0,32,0.08)', color: '#906070' }}
            >
              {tipoLabel}
            </span>

            <Link
              href={`/dashboard/personagens/${id}/social`}
              className="flex items-center justify-center gap-1.5 text-[11px] px-2 py-1.5 rounded-lg transition-opacity hover:opacity-70 w-full"
              style={{ background: 'rgba(128,0,32,0.07)', color: '#800020' }}
            >
              <Smartphone size={11} /> Rede social
            </Link>

            {personagem.faceclaim && (
              <div className="flex items-center justify-center gap-1 text-[11px] px-2 py-1.5 rounded-lg w-full truncate" style={{ background: 'rgba(128,0,32,0.07)', color: '#800020' }}>
                <span className="shrink-0 opacity-60">fc:</span>
                <span className="truncate">{personagem.faceclaim}</span>
              </div>
            )}

            {personagem.data_nascimento && (() => {
              const hoje = new Date()
              const nasc = new Date(personagem.data_nascimento + 'T12:00:00')
              let idade = hoje.getFullYear() - nasc.getFullYear()
              const m = hoje.getMonth() - nasc.getMonth()
              if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--
              return (
                <div className="flex items-center justify-center gap-1 text-[11px] px-2 py-1.5 rounded-lg w-full" style={{ background: 'rgba(128,0,32,0.07)', color: '#800020' }}>
                  <span className="opacity-60">idade:</span>
                  <span>{idade} anos</span>
                </div>
              )
            })()}
          </div>

          {/* Nome + FC + Idade + Bio */}
          <div className="flex-1 min-w-0 pt-1">
            <h1 className="text-2xl font-semibold mb-1" style={{ color: '#2E0510' }}>
              {personagem.nome}
            </h1>

            <p className="text-[10px] uppercase tracking-widest mb-2" style={{ color: '#B09098' }}>
              Biografia
            </p>
            {personagem.descricao ? (
              <div
                className="text-sm leading-relaxed whitespace-pre-wrap overflow-y-auto pr-1"
                style={{ color: '#2E0510', maxHeight: 220 }}
              >
                {personagem.descricao}
              </div>
            ) : (
              <p className="text-sm" style={{ color: '#B09098' }}>
                Nenhuma biografia ainda.{' '}
                <Link href={`/dashboard/personagens/${id}/editar`} className="hover:underline" style={{ color: '#800020' }}>
                  Adicionar
                </Link>
              </p>
            )}
          </div>
        </div>

        {/* ── Meio: Guarda-roupa + Threads ── */}
        <div className="grid grid-cols-2 gap-4">

          {/* Guarda-roupa */}
          <div className="rounded-2xl p-5" style={card}>
            <GuardaRoupaSection personagemId={id} roupasIniciais={guarda_roupa ?? []} />
          </div>

          {/* Threads */}
          <div className="rounded-2xl p-5" style={card}>
            <p className="text-[10px] uppercase tracking-widest mb-3" style={{ color: '#B09098' }}>
              Threads
            </p>
            {threads.length === 0 ? (
              <p className="text-xs" style={{ color: '#B09098' }}>Nenhuma participação ainda.</p>
            ) : (
              <div className="flex flex-col overflow-y-auto" style={{ maxHeight: 220 }}>
                {threads.map(t => (
                  <Link
                    key={t.id}
                    href={`/dashboard/threads/${t.id}`}
                    className="flex items-center justify-between py-2.5 transition-opacity hover:opacity-70"
                    style={{ borderBottom: '0.5px solid rgba(128,0,32,0.07)' }}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Hash size={11} style={{ color: '#906070', flexShrink: 0 }} />
                      <span className="text-sm truncate" style={{ color: '#2E0510' }}>{t.titulo}</span>
                    </div>
                    <span
                      className="text-[10px] flex-shrink-0 ml-2 px-2 py-0.5 rounded-full"
                      style={{ background: 'rgba(128,0,32,0.07)', color: '#906070' }}
                    >
                      {t.count} {t.count === 1 ? 'post' : 'posts'}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Inspo ── */}
        <div className="rounded-2xl p-5" style={card}>
          <InspoSection personagemId={id} inspoInicial={inspo ?? []} />
        </div>

        {/* ── Vínculos ── */}
        <VinculosSection
          personagemId={id}
          vinculosIniciais={(relacoes ?? []).map(r => {
            const outroId = r.personagem_a === id ? r.personagem_b : r.personagem_a
            const outro = getPersonagem(outroId) ?? { id: outroId, nome: '?', foto_url: null }
            return { id: r.id, tipo_relacao: r.tipo_relacao, nota: r.nota ?? null, outro }
          })}
          todosPersonagens={todosPersonagens ?? []}
        />

      </div>
    </div>
  )
}
