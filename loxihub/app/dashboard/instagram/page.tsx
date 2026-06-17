import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Camera, Heart, MessageCircle, Users } from 'lucide-react'

export default async function InstagramPage() {
  const supabase = await createClient()

  const { data: posts } = await supabase
    .from('posts_instagram')
    .select('*, personagens(nome, foto_url), curtidas_instagram(id), comentarios_instagram(id)')
    .order('created_at', { ascending: false })

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Instagram</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>Feed dos personagens</p>
        </div>
        <Link href="/dashboard/instagram/novo" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
          <Plus size={15} /> Novo post
        </Link>
      </div>

      {!posts || posts.length === 0 ? (
        <div className="rounded-xl border p-12 text-center" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <Camera size={40} className="mx-auto mb-4" style={{ color: 'var(--muted-foreground)' }} />
          <p className="font-medium mb-1" style={{ color: 'var(--foreground)' }}>Nenhum post ainda</p>
          <Link href="/dashboard/instagram/novo" className="text-sm hover:underline" style={{ color: 'var(--primary)' }}>Criar primeiro post</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map(post => {
            const personagem = post.personagens as { nome: string; foto_url: string | null } | null
            const curtidas = Array.isArray(post.curtidas_instagram) ? post.curtidas_instagram.length : 0
            const comentarios = Array.isArray(post.comentarios_instagram) ? post.comentarios_instagram.length : 0

            return (
              <div key={post.id} className="rounded-2xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                {/* Header */}
                <div className="flex items-center gap-3 p-4">
                  <div className="w-9 h-9 rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'var(--muted)' }}>
                    {personagem?.foto_url ? (
                      <img src={personagem.foto_url} alt={personagem.nome} className="w-full h-full object-cover" />
                    ) : (
                      <Users size={16} style={{ color: 'var(--muted-foreground)' }} />
                    )}
                  </div>
                  <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>
                    {personagem?.nome ?? 'Personagem'}
                  </span>
                </div>

                {/* Imagem */}
                {post.imagem_url && (
                  <img src={post.imagem_url} alt="" className="w-full object-cover max-h-96" />
                )}

                {/* Ações */}
                <div className="px-4 pt-3 pb-1 flex items-center gap-4">
                  <button className="flex items-center gap-1.5 hover:opacity-70 transition-opacity" style={{ color: 'var(--foreground)' }}>
                    <Heart size={22} />
                  </button>
                  <Link href={`/dashboard/instagram/${post.id}`} className="flex items-center gap-1.5 hover:opacity-70 transition-opacity" style={{ color: 'var(--foreground)' }}>
                    <MessageCircle size={22} />
                  </Link>
                </div>

                {/* Curtidas */}
                {curtidas > 0 && (
                  <p className="px-4 text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
                    {curtidas} {curtidas === 1 ? 'curtida' : 'curtidas'}
                  </p>
                )}

                {/* Legenda */}
                <div className="px-4 pb-2 mt-1">
                  <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                    <span className="font-semibold mr-1">{personagem?.nome}</span>
                    {post.legenda}
                  </p>
                </div>

                {/* Comentários */}
                <Link href={`/dashboard/instagram/${post.id}`} className="block px-4 pb-4">
                  <p className="text-sm hover:underline" style={{ color: 'var(--muted-foreground)' }}>
                    {comentarios > 0 ? `Ver todos os ${comentarios} comentários` : 'Adicionar comentário...'}
                  </p>
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
