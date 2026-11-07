import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { NovaConversa } from './nova-conversa'
import { PersonagemAvatar } from './avatar'

type Pers = { id: string; nome: string; foto_url: string | null }

function hora(iso: string) {
  const d = new Date(iso)
  const hoje = new Date()
  return d.toDateString() === hoje.toDateString()
    ? d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
}

export default async function MensagensPage({
  searchParams,
}: {
  searchParams: Promise<{ universo?: string }>
}) {
  const { universo } = await searchParams
  const supabase = await createClient()

  const convQuery = supabase
    .from('dm_conversas')
    .select('id, ultima_msg_em, a:personagens!dm_conversas_personagem_a_fkey(id, nome, foto_url), b:personagens!dm_conversas_personagem_b_fkey(id, nome, foto_url)')
    .order('ultima_msg_em', { ascending: false })
  const persQuery = supabase.from('personagens').select('id, nome, foto_url').order('nome', { ascending: true })
  if (universo) {
    convQuery.eq('universo_id', universo)
    persQuery.eq('universo_id', universo)
  }

  const [{ data: conversas }, { data: personagens }] = await Promise.all([convQuery, persQuery])
  const lista = (conversas ?? []) as unknown as { id: string; ultima_msg_em: string; a: Pers; b: Pers }[]

  // última mensagem de cada conversa
  const ultimas: Record<string, { conteudo: string; personagem_nome: string }> = {}
  if (lista.length) {
    const { data: msgs } = await supabase
      .from('dm_mensagens')
      .select('conversa_id, conteudo, personagens(nome)')
      .in('conversa_id', lista.map(c => c.id))
      .order('created_at', { ascending: false })
      .limit(200)
    for (const m of (msgs ?? []) as unknown as { conversa_id: string; conteudo: string; personagens: { nome: string } | null }[]) {
      if (!ultimas[m.conversa_id]) ultimas[m.conversa_id] = { conteudo: m.conteudo, personagem_nome: m.personagens?.nome ?? '' }
    }
  }

  const q = universo ? `?universo=${universo}` : ''

  return (
    <div className="h-[100dvh] md:h-[calc(100vh-40px)] overflow-y-auto">
      <div className="max-w-xl mx-auto px-4 md:px-6 pt-[68px] md:pt-8 pb-8">
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-base font-medium flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <MessageCircle size={16} style={{ color: 'var(--primary)' }} /> Mensagens
          </h1>
          <NovaConversa personagens={(personagens ?? []) as Pers[]} universoId={universo ?? null} />
        </div>

        {lista.length === 0 ? (
          <p className="text-center text-xs py-16" style={{ color: 'var(--muted-light)' }}>
            Nenhuma conversa ainda. Comece uma entre dois personagens.
          </p>
        ) : (
          <div className="rounded-2xl overflow-hidden" style={{ background: 'var(--card)', border: '0.5px solid var(--p-10)' }}>
            {lista.map(c => {
              const u = ultimas[c.id]
              return (
                <Link
                  key={c.id}
                  href={`/dashboard/mensagens/${c.id}${q}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-[var(--p-04)] transition-colors"
                  style={{ borderBottom: '0.5px solid var(--p-06)' }}
                >
                  <div className="flex -space-x-3">
                    <PersonagemAvatar nome={c.a.nome} foto_url={c.a.foto_url} size={40} />
                    <PersonagemAvatar nome={c.b.nome} foto_url={c.b.foto_url} size={40} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
                      {c.a.nome} &amp; {c.b.nome}
                    </p>
                    <p className="text-xs truncate" style={{ color: 'var(--foreground-muted)' }}>
                      {u ? `${u.personagem_nome}: ${u.conteudo}` : 'Sem mensagens'}
                    </p>
                  </div>
                  <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--muted-light)' }}>
                    {hora(c.ultima_msg_em)}
                  </span>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
