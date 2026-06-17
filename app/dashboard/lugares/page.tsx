import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { Plus, MapPin } from 'lucide-react'

export default async function LugaresPage({ searchParams }: { searchParams: Promise<{ universo?: string }> }) {
  const { universo } = await searchParams
  const supabase = await createClient()
  const query = supabase.from('lugares').select('*').order('created_at', { ascending: false })
  if (universo) query.eq('universo_id', universo)
  const { data: lugares } = await query

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: '#2E0510' }}>Lugares</h1>
          <p className="text-sm mt-0.5" style={{ color: '#906070' }}>{lugares?.length ?? 0} locações</p>
        </div>
        <Link href={`/dashboard/lugares/novo${universo ? `?universo=${universo}` : ''}`} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90" style={{ background: '#800020', color: '#FAF0F2' }}>
          <Plus size={15} /> Novo lugar
        </Link>
      </div>

      {!lugares || lugares.length === 0 ? (
        <div className="rounded-xl border p-12 text-center" style={{ background: 'rgba(255,255,255,0.60)', borderColor: 'rgba(128,0,32,0.10)' }}>
          <MapPin size={40} className="mx-auto mb-4" style={{ color: '#906070' }} />
          <p className="font-medium mb-1" style={{ color: '#2E0510' }}>Nenhum lugar ainda</p>
          <Link href="/dashboard/lugares/novo" className="text-sm hover:underline" style={{ color: '#800020' }}>Cadastrar primeiro lugar</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {lugares.map(l => (
            <Link key={l.id} href={`/dashboard/lugares/${l.id}`} className="rounded-xl border overflow-hidden hover:shadow-md transition-all group" style={{ background: 'rgba(255,255,255,0.60)', borderColor: 'rgba(128,0,32,0.10)' }}>
              <div className="h-40 flex items-center justify-center" style={{ background: 'rgba(128,0,32,0.08)' }}>
                {l.foto_url ? (
                  <img src={l.foto_url} alt={l.nome} className="w-full h-full object-cover transition-all duration-500 grayscale group-hover:grayscale-0" />
                ) : (
                  <MapPin size={32} style={{ color: '#906070' }} />
                )}
              </div>
              <div className="p-4">
                <p className="font-semibold group-hover:underline" style={{ color: '#2E0510' }}>{l.nome}</p>
                {l.tipo && <p className="text-xs mt-0.5" style={{ color: '#906070' }}>{l.tipo}</p>}
                {l.descricao && <p className="text-sm mt-1 line-clamp-2" style={{ color: '#906070' }}>{l.descricao}</p>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
