import Link from 'next/link'
import { slugNome } from '@/lib/social-utils'

interface PersonagemMencao {
  id: string
  nome: string
  username?: string | null
}

const PADRAO = /(#[\p{L}\p{N}_]+|@[\p{L}\p{N}_.]+)/gu

// Renderiza texto com #hashtags destacadas e @menções que levam ao perfil do personagem.
export function TextoRico({ texto, personagens }: { texto: string; personagens: PersonagemMencao[] }) {
  const partes = texto.split(PADRAO)
  return (
    <>
      {partes.map((parte, i) => {
        if (parte.startsWith('#')) {
          return <span key={i} style={{ color: 'var(--primary)' }}>{parte}</span>
        }
        if (parte.startsWith('@')) {
          const handle = parte.slice(1).replace(/\.+$/, '').toLowerCase()
          const alvo = personagens.find(p =>
            p.username?.toLowerCase() === handle || slugNome(p.nome) === handle)
          if (alvo) {
            return (
              <Link key={i} href={`/dashboard/personagens/${alvo.id}/social`}
                className="hover:underline" style={{ color: 'var(--primary)' }}>
                {parte}
              </Link>
            )
          }
          return <span key={i} style={{ color: 'var(--primary)' }}>{parte}</span>
        }
        return <span key={i}>{parte}</span>
      })}
    </>
  )
}
