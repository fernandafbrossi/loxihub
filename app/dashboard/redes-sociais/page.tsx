import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

interface Personagem {
  id: string
  nome: string
  foto_url: string | null
  username: string | null
  bio_twitter: string | null
  bio_instagram: string | null
  seguidores_twitter: number | null
  seguidores_instagram: number | null
}

export default async function RedesSociaisPage({ searchParams }: { searchParams: Promise<{ universo?: string }> }) {
  const { universo } = await searchParams
  const supabase = await createClient()

  const query = supabase
    .from('personagens')
    .select('id, nome, foto_url, username, bio_twitter, bio_instagram, seguidores_twitter, seguidores_instagram')
    .order('nome')
  if (universo) query.eq('universo_id', universo)
  const { data: personagens } = await query

  const lista = (personagens ?? []) as Personagem[]

  const comRedes = lista.filter(p => p.username || p.bio_twitter || p.bio_instagram)
  const semRedes = lista.filter(p => !p.username && !p.bio_twitter && !p.bio_instagram)

  return (
    <div className="p-7 max-w-2xl">
      <div className="mb-7">
        <h1 className="text-xl font-medium mb-1" style={{ color: '#2E0510' }}>Redes Sociais</h1>
        <p className="text-xs" style={{ color: '#906070' }}>
          Perfis sociais dos personagens — Twitter e Instagram.
        </p>
      </div>

      {lista.length === 0 ? (
        <div className="text-center py-16 opacity-50">
          <p className="text-sm" style={{ color: '#906070' }}>Nenhum personagem cadastrado ainda.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {(comRedes.length > 0 ? comRedes : lista).map(p => {
            const handle = p.username
              ? `@${p.username}`
              : `@${p.nome.toLowerCase().replace(/\s+/g, '_')}`
            const segT = p.seguidores_twitter ?? 0
            const segI = p.seguidores_instagram ?? 0

            return (
              <Link
                key={p.id}
                href={`/dashboard/personagens/${p.id}/social`}
                className="flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all hover:scale-[1.01]"
                style={{
                  background: 'rgba(255,255,255,0.60)',
                  border: '0.5px solid rgba(128,0,32,0.08)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                {/* Avatar */}
                <div
                  className="w-11 h-11 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-semibold text-sm"
                  style={{
                    background: 'linear-gradient(135deg, #800020, #5C0018)',
                    color: '#FAF0F2',
                  }}
                >
                  {p.foto_url
                    ? <img src={p.foto_url} alt={p.nome} className="w-full h-full object-cover" />
                    : p.nome[0].toUpperCase()
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight" style={{ color: '#2E0510' }}>{p.nome}</p>
                  <p className="text-[11px] mt-0.5" style={{ color: '#B09098' }}>{handle}</p>
                  {(p.bio_twitter || p.bio_instagram) && (
                    <p className="text-[11px] mt-1 truncate" style={{ color: '#906070' }}>
                      {p.bio_twitter || p.bio_instagram}
                    </p>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 flex-shrink-0">
                  {segT > 0 && (
                    <div className="text-center">
                      <div className="flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="#2E0510">
                          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.856L2 2.25h6.845l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
                        </svg>
                        <span className="text-[11px] font-medium" style={{ color: '#2E0510' }}>{segT.toLocaleString('pt-BR')}</span>
                      </div>
                      <p className="text-[9px]" style={{ color: '#B09098' }}>seg.</p>
                    </div>
                  )}
                  {segI > 0 && (
                    <div className="text-center">
                      <div className="flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2E0510" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                          <circle cx="12" cy="12" r="4" />
                          <circle cx="17.5" cy="6.5" r="1" fill="#2E0510" stroke="none" />
                        </svg>
                        <span className="text-[11px] font-medium" style={{ color: '#2E0510' }}>{segI.toLocaleString('pt-BR')}</span>
                      </div>
                      <p className="text-[9px]" style={{ color: '#B09098' }}>seg.</p>
                    </div>
                  )}
                  <span className="text-[10px] px-2.5 py-1 rounded-lg" style={{ background: 'rgba(128,0,32,0.06)', color: '#906070' }}>
                    Ver perfil →
                  </span>
                </div>
              </Link>
            )
          })}

          {/* Personagens sem redes configuradas */}
          {comRedes.length > 0 && semRedes.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] uppercase tracking-wider mb-2 px-1" style={{ color: '#B09098' }}>
                Sem perfil configurado
              </p>
              <div className="flex flex-col gap-1.5">
                {semRedes.map(p => (
                  <Link
                    key={p.id}
                    href={`/dashboard/personagens/${p.id}/social/editar`}
                    className="flex items-center gap-3 px-4 py-3 rounded-xl opacity-60 hover:opacity-100 transition-opacity"
                    style={{ background: 'rgba(255,255,255,0.40)', border: '0.5px solid rgba(128,0,32,0.06)' }}
                  >
                    <div
                      className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-semibold"
                      style={{ background: 'linear-gradient(135deg, #C08090, #A06070)', color: '#FAF0F2' }}
                    >
                      {p.foto_url
                        ? <img src={p.foto_url} alt={p.nome} className="w-full h-full object-cover" />
                        : p.nome[0].toUpperCase()
                      }
                    </div>
                    <span className="text-xs flex-1" style={{ color: '#906070' }}>{p.nome}</span>
                    <span className="text-[10px]" style={{ color: '#B09098' }}>Configurar →</span>
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
