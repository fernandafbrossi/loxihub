import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, Users, GitBranch } from 'lucide-react'

export default async function PersonagensPage() {
  const supabase = await createClient()
  const { data: personagens } = await supabase
    .from('personagens')
    .select('*')
    .order('created_at', { ascending: true })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Personagens</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
            {personagens?.length ?? 0} personagens
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/dashboard/personagens/arvore"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-opacity hover:opacity-80"
            style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
          >
            <GitBranch size={15} />
            Árvore
          </Link>
          <Link
            href="/dashboard/personagens/novo"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
            style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
          >
            <Plus size={15} />
            Novo
          </Link>
        </div>
      </div>

      {!personagens || personagens.length === 0 ? (
        <div className="rounded-xl border p-12 text-center" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <Users size={40} className="mx-auto mb-4" style={{ color: 'var(--muted-foreground)' }} />
          <p className="font-medium mb-1" style={{ color: 'var(--foreground)' }}>Nenhum personagem ainda</p>
          <Link href="/dashboard/personagens/novo" className="text-sm hover:underline" style={{ color: 'var(--primary)' }}>
            Criar primeiro personagem
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {personagens.map(p => (
            <Link
              key={p.id}
              href={`/dashboard/personagens/${p.id}`}
              className="rounded-xl border overflow-hidden hover:shadow-md transition-all group"
              style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
            >
              <div className="h-32 flex items-center justify-center" style={{ background: 'var(--muted)' }}>
                {p.foto_url ? (
                  <img src={p.foto_url} alt={p.nome} className="w-full h-full object-cover" />
                ) : (
                  <Users size={32} style={{ color: 'var(--muted-foreground)' }} />
                )}
              </div>
              <div className="p-3">
                <p className="font-semibold text-sm group-hover:underline" style={{ color: 'var(--foreground)' }}>{p.nome}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                  {p.tipo === 'principal' ? 'Personagem principal' : 'NPC'}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
