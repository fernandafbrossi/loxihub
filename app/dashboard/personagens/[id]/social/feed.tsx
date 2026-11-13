'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

interface PostSocial {
  id: string
  conteudo: string
  midia_url: string | null
  criado_por: string
  created_at: string
}

interface Personagem {
  id: string
  nome: string
  foto_url: string | null
  username: string | null
}

interface Props {
  posts: PostSocial[]
  personagem: Personagem
  userId: string
}

export function SocialFeed({ posts, personagem, userId }: Props) {
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const router = useRouter()

  const handle = personagem.username
    ? `@${personagem.username}`
    : `@${personagem.nome.toLowerCase().replace(/\s+/g, '_')}`

  async function handleDelete(postId: string) {
    setDeletingId(postId)
    const supabase = createClient()
    await supabase.from('posts_sociais').delete().eq('id', postId)
    router.refresh()
    setDeletingId(null)
  }

  if (posts.length === 0) {
    return (
      <div
        className="rounded-2xl py-10 text-center"
        style={{
          background: 'rgba(255,255,255,0.40)',
          border: '0.5px solid var(--p-06)',
        }}
      >
        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Nenhum post ainda</p>
        <p className="text-xs mt-1" style={{ color: 'var(--muted-light)' }}>Seja o primeiro a postar no feed</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      {posts.map(post => {
        const data = new Date(post.created_at).toLocaleDateString('pt-BR', {
          day: '2-digit', month: 'short',
        })
        const hora = new Date(post.created_at).toLocaleTimeString('pt-BR', {
          hour: '2-digit', minute: '2-digit',
        })

        return (
          <div
            key={post.id}
            className="rounded-2xl overflow-hidden group"
            style={{
              background: 'var(--card)',
              border: '0.5px solid var(--p-08)',
            }}
          >
            {/* Header do post */}
            <div className="flex items-center gap-3 px-4 pt-4 pb-3">
              <div
                className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-semibold"
                style={{
                  background: 'linear-gradient(135deg, #800020, #5C0018)',
                  color: 'var(--primary-foreground)',
                }}
              >
                {personagem.foto_url ? (
                  <img src={personagem.foto_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  personagem.nome[0].toUpperCase()
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-none" style={{ color: 'var(--foreground)' }}>
                  {personagem.nome}
                </p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted-light)' }}>
                  {handle} · {data} às {hora}
                </p>
              </div>
              <button
                onClick={() => handleDelete(post.id)}
                disabled={deletingId === post.id}
                className="opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:opacity-60 disabled:opacity-20"
                style={{ color: 'var(--foreground-muted)' }}
                title="Excluir post"
              >
                <Trash2 size={13} />
              </button>
            </div>

            {/* Conteúdo */}
            <p
              className="px-4 text-sm leading-relaxed whitespace-pre-wrap"
              style={{ color: 'var(--foreground)', paddingBottom: post.midia_url ? 12 : 16 }}
            >
              {post.conteudo}
            </p>

            {/* Mídia */}
            {post.midia_url && (
              <img
                src={post.midia_url}
                alt=""
                className="w-full object-cover"
                style={{ maxHeight: 360 }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
