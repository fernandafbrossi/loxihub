import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Users, Pencil } from 'lucide-react'

export default async function PersonagemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const { data: personagem } = await supabase
    .from('personagens')
    .select('*')
    .eq('id', id)
    .single()

  if (!personagem) notFound()

  // Busca relações e personagens envolvidos separadamente para evitar tipagem complexa
  const { data: relacoes } = await supabase
    .from('relacoes_personagens')
    .select('id, tipo_relacao, personagem_a, personagem_b')
    .or(`personagem_a.eq.${id},personagem_b.eq.${id}`)

  // Coleta todos os IDs de personagens relacionados
  const outrosIds = (relacoes ?? []).map(r => r.personagem_a === id ? r.personagem_b : r.personagem_a)
  const { data: outrosPersonagens } = outrosIds.length > 0
    ? await supabase.from('personagens').select('id, nome, foto_url').in('id', outrosIds)
    : { data: [] }

  function getPersonagem(pid: string) {
    return (outrosPersonagens ?? []).find(p => p.id === pid)
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <Link href="/dashboard/personagens" className="inline-flex items-center gap-1.5 text-sm hover:underline" style={{ color: 'var(--muted-foreground)' }}>
          <ArrowLeft size={14} /> Personagens
        </Link>
        <Link
          href={`/dashboard/personagens/${id}/editar`}
          className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border"
          style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
        >
          <Pencil size={13} /> Editar
        </Link>
      </div>

      <div className="rounded-xl border overflow-hidden mb-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        {personagem.foto_url ? (
          <img src={personagem.foto_url} alt={personagem.nome} className="w-full h-56 object-cover" />
        ) : (
          <div className="w-full h-56 flex items-center justify-center" style={{ background: 'var(--muted)' }}>
            <Users size={48} style={{ color: 'var(--muted-foreground)' }} />
          </div>
        )}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{personagem.nome}</h1>
            <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
              {personagem.tipo === 'principal' ? 'Principal' : 'NPC'}
            </span>
          </div>
          {personagem.descricao && (
            <p className="text-sm leading-relaxed mt-3 whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>
              {personagem.descricao}
            </p>
          )}
        </div>
      </div>

      {relacoes && relacoes.length > 0 && (
        <div>
          <h2 className="font-semibold mb-3" style={{ color: 'var(--foreground)' }}>Relações</h2>
          <div className="space-y-2">
            {relacoes.map(r => {
              const outroId = r.personagem_a === id ? r.personagem_b : r.personagem_a
              const outro = getPersonagem(outroId)
              return (
                <Link
                  key={r.id}
                  href={`/dashboard/personagens/${outroId}`}
                  className="flex items-center gap-3 p-3 rounded-xl border hover:shadow-sm transition-all"
                  style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
                >
                  <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center shrink-0" style={{ background: 'var(--muted)' }}>
                    {outro?.foto_url ? (
                      <img src={outro.foto_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <Users size={16} style={{ color: 'var(--muted-foreground)' }} />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{outro?.nome ?? '?'}</p>
                    <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{r.tipo_relacao}</p>
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
