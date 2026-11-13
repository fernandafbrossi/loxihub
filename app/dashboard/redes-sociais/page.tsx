import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface Personagem {
  id: string
  nome: string
  foto_url: string | null
  username: string | null
  bio_instagram: string | null
  seguidores_instagram: number | null
}

export default async function RedesSociaisPage({ searchParams }: { searchParams: Promise<{ universo?: string }> }) {
  const { universo } = await searchParams
  const supabase = await createClient()

  const query = supabase
    .from('personagens')
    .select('id, nome, foto_url, username, bio_instagram, seguidores_instagram')
    .order('nome')
  if (universo) query.eq('universo_id', universo)
  const { data: personagens } = await query

  // As contas Instagram vivem em contas_sociais (a principal é a mais antiga).
  const { data: contas } = await supabase
    .from('contas_sociais')
    .select('personagem_id, username, bio, foto_url, seguidores')
    .eq('tipo', 'instagram')
    .order('created_at')
  const principal = new Map<string, { username: string | null; bio: string | null; foto_url: string | null; seguidores: number | null }>()
  for (const c of contas ?? []) if (!principal.has(c.personagem_id)) principal.set(c.personagem_id, c)

  // Mescla a conta Instagram sobre os dados antigos do personagem.
  const lista = ((personagens ?? []) as Personagem[]).map(p => {
    const c = principal.get(p.id)
    return {
      ...p,
      foto_url: c?.foto_url ?? p.foto_url,
      username: c?.username ?? p.username,
      bio_instagram: c?.bio ?? p.bio_instagram,
      seguidores_instagram: c ? c.seguidores : p.seguidores_instagram,
      temConta: !!c || !!p.username || !!p.bio_instagram,
    }
  })

  const comRedes = lista.filter(p => p.temConta)
  const semRedes = lista.filter(p => !p.temConta)

  return (
    <div className="p-7 max-w-2xl">
      <div className="mb-7">
        <h1 className="text-xl font-medium mb-1" style={{ color: 'var(--foreground)' }}>Redes Sociais</h1>
        <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
          Perfis sociais dos personagens — Instagram.
        </p>
      </div>

      {lista.length === 0 ? (
        <div className="text-center py-16 opacity-50">
          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Nenhum personagem cadastrado ainda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {(comRedes.length > 0 ? comRedes : lista).map(p => {
            const handle = p.username
              ? `@${p.username}`
              : `@${p.nome.toLowerCase().replace(/\s+/g, '_')}`
            const segI = p.seguidores_instagram ?? 0

            return (
              <Link
                key={p.id}
                href={`/dashboard/personagens/${p.id}/social`}
                className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all hover:scale-[1.01]"
                style={{
                  background: 'var(--card)',
                  border: '0.5px solid var(--p-08)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {/* Avatar */}
                <div
                  className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-semibold text-sm"
                  style={{
                    background: 'linear-gradient(135deg, #800020, #5C0018)',
                    color: 'var(--primary-foreground)',
                  }}
                >
                  {p.foto_url
                    ? <img src={p.foto_url} alt={p.nome} className="w-full h-full object-cover" />
                    : p.nome[0].toUpperCase()
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight" style={{ color: 'var(--foreground)' }}>{p.nome}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted-light)' }}>{handle}</p>
                  {p.bio_instagram && (
                    <p className="text-[11px] mt-1 truncate" style={{ color: 'var(--foreground-muted)' }}>
                      {p.bio_instagram}
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {segI > 0 && (
                    <div className="text-center">
                      <div className="flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                          <circle cx="12" cy="12" r="4" />
                          <circle cx="17.5" cy="6.5" r="1" fill="var(--foreground)" stroke="none" />
                        </svg>
                        <span className="text-[11px] font-medium" style={{ color: 'var(--foreground)' }}>{segI.toLocaleString('pt-BR')}</span>
                      </div>
                      <p className="text-[9px]" style={{ color: 'var(--muted-light)' }}>seg.</p>
                    </div>
                  )}
                  <span className="text-[10px] px-2.5 py-1 rounded-lg" style={{ background: 'var(--p-06)', color: 'var(--foreground-muted)' }}>
                    Ver perfil →
                  </span>
                </div>
              </Link>
            )
          })}

          {/* Personagens sem redes configuradas */}
          {comRedes.length > 0 && semRedes.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-wider mb-2 px-1" style={{ color: 'var(--muted-light)' }}>
                Sem perfil configurado
              </p>
              <div className="flex flex-col gap-1.5">
                {semRedes.map(p => (
                  <Link
                    key={p.id}
                    href={`/dashboard/personagens/${p.id}/social/editar`}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl opacity-60 hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(255,255,255,0.40)', border: '0.5px solid var(--p-06)' }}
                  >
                    <div
                      className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-semibold"
                      style={{ background: 'linear-gradient(135deg, #C08090, #A06070)', color: 'var(--primary-foreground)' }}
                    >
                      {p.foto_url
                        ? <img src={p.foto_url} alt={p.nome} className="w-full h-full object-cover" />
                        : p.nome[0].toUpperCase()
                      }
                    </div>
                    <span className="text-xs flex-1" style={{ color: 'var(--foreground-muted)' }}>{p.nome}</span>
                    <span className="text-[10px]" style={{ color: 'var(--muted-light)' }}>Configurar →</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
