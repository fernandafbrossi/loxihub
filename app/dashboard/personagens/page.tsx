import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Users, GitBranch } from 'lucide-react'

export default async function PersonagensPage({ searchParams }: { searchParams: Promise<{ universo?: string }> }) {
  const { universo } = await searchParams
  const supabase = await createClient()
  const query = supabase.from('personagens').select('*').order('created_at', { ascending: true })
  if (universo) query.eq('universo_id', universo)
  const { data: personagens } = await query

  const principais = (personagens ?? []).filter(p => p.tipo === 'principal')
  const npcs = (personagens ?? []).filter(p => p.tipo !== 'principal')

  return (
    <div className="p-7 max-w-3xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-7">
        <div>
          <h1 className="text-xl font-semibold" style={{ color: '#2E0510' }}>Personagens</h1>
          <p className="text-xs mt-0.5" style={{ color: '#906070' }}>
            {personagens?.length ?? 0} personagens cadastrados
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/arvore${universo ? `?universo=${universo}` : ''}`}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border transition-opacity hover:opacity-70"
            style={{ borderColor: 'rgba(128,0,32,0.12)', color: '#906070', background: 'rgba(255,255,255,0.50)' }}
          >
            <GitBranch size={13} /> Vínculos
          </Link>
          <Link
            href={`/dashboard/personagens/novo${universo ? `?universo=${universo}` : ''}`}
            className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg transition-opacity hover:opacity-85"
            style={{ background: '#800020', color: '#FAF0F2', boxShadow: '0 2px 10px rgba(128,0,32,0.30)' }}
          >
            <Plus size={13} /> Novo personagem
          </Link>
        </div>
      </div>

      {!personagens || personagens.length === 0 ? (
        <div
          className="rounded-2xl p-12 text-center"
          style={{
            background: 'rgba(255,255,255,0.50)',
            border: '0.5px solid rgba(128,0,32,0.08)',
          }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(128,0,32,0.07)' }}
          >
            <Users size={24} style={{ color: '#906070' }} />
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: '#2E0510' }}>Nenhum personagem ainda</p>
          <p className="text-xs mb-4" style={{ color: '#B09098' }}>Crie o primeiro personagem para começar a escrever</p>
          <Link
            href={`/dashboard/personagens/novo${universo ? `?universo=${universo}` : ''}`}
            className="inline-flex items-center gap-1.5 text-xs px-4 py-2 rounded-lg"
            style={{ background: '#800020', color: '#FAF0F2' }}
          >
            <Plus size={12} /> Criar personagem
          </Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">

          {principais.length > 0 && (
            <section>
              <p className="text-[10px] font-medium uppercase tracking-widest mb-3" style={{ color: '#B09098' }}>
                Principais
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {principais.map(p => (
                  <PersonagemCard key={p.id} personagem={p} />
                ))}
              </div>
            </section>
          )}

          {npcs.length > 0 && (
            <section>
              <p className="text-[10px] font-medium uppercase tracking-widest mb-3" style={{ color: '#B09098' }}>
                NPCs
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {npcs.map(p => (
                  <PersonagemCard key={p.id} personagem={p} />
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  )
}

function PersonagemCard({ personagem }: { personagem: any }) {
  return (
    <Link
      href={`/dashboard/personagens/${personagem.id}`}
      className="group rounded-2xl overflow-hidden transition-all hover:shadow-md"
      style={{
        background: 'rgba(255,255,255,0.55)',
        border: '0.5px solid rgba(128,0,32,0.08)',
      }}
    >
      {/* Foto */}
      <div className="h-36 relative overflow-hidden">
        {personagem.foto_url ? (
          <img
            src={personagem.foto_url}
            alt={personagem.nome}
            className="w-full h-full object-cover transition-all duration-500 grayscale group-hover:grayscale-0 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center text-3xl font-semibold"
            style={{ background: 'linear-gradient(135deg, #800020 0%, #5C0018 100%)', color: '#FAF0F2' }}
          >
            {personagem.nome[0].toUpperCase()}
          </div>
        )}
      </div>

      {/* Nome */}
      <div className="px-3.5 py-3">
        <p className="text-sm font-medium truncate" style={{ color: '#2E0510' }}>{personagem.nome}</p>
      </div>
    </Link>
  )
}
