import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, MapPin } from 'lucide-react'

export default async function LugaresPage() {
  const supabase = await createClient()
  const { data: lugares } = await supabase.from('lugares').select('*').order('created_at', { ascending: false })

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>Lugares</h1>
          <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{lugares?.length ?? 0} locações</p>
        </div>
        <Link href="/dashboard/lugares/novo" className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
          <Plus size={15} /> Novo lugar
        </Link>
      </div>

      {!lugares || lugares.length === 0 ? (
        <div className="rounded-xl border p-12 text-center" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <MapPin size={40} className="mx-auto mb-4" style={{ color: 'var(--muted-foreground)' }} />
          <p className="font-medium mb-1" style={{ color: 'var(--foreground)' }}>Nenhum lugar ainda</p>
          <Link href="/dashboard/lugares/novo" className="text-sm hover:underline" style={{ color: 'var(--primary)' }}>Cadastrar primeiro lugar</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {lugares.map(l => (
            <Link key={l.id} href={`/dashboard/lugares/${l.id}`} className="rounded-xl border overflow-hidden hover:shadow-md transition-all group" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
              <div className="h-40 flex items-center justify-center" style={{ background: 'var(--muted)' }}>
                {l.foto_url ? (
                  <img src={l.foto_url} alt={l.nome} className="w-full h-full object-cover" />
                ) : (
                  <MapPin size={32} style={{ color: 'var(--muted-foreground)' }} />
                )}
              </div>
              <div className="p-4">
                <p className="font-semibold group-hover:underline" style={{ color: 'var(--foreground)' }}>{l.nome}</p>
                {l.tipo && <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>{l.tipo}</p>}
                {l.descricao && <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>{l.descricao}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
