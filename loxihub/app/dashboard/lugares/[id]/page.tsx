import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin } from 'lucide-react'

export default async function LugarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()
  const { data: lugar } = await supabase.from('lugares').select('*').eq('id', id).single()
  if (!lugar) notFound()

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Link href="/dashboard/lugares" className="inline-flex items-center gap-1.5 text-sm mb-5 hover:underline" style={{ color: 'var(--muted-foreground)' }}>
        <ArrowLeft size={14} /> Lugares
      </Link>
      <div className="rounded-xl border overflow-hidden" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        {lugar.foto_url ? (
          <img src={lugar.foto_url} alt={lugar.nome} className="w-full h-56 object-cover" />
        ) : (
          <div className="w-full h-56 flex items-center justify-center" style={{ background: 'var(--muted)' }}>
            <MapPin size={48} style={{ color: 'var(--muted-foreground)' }} />
          </div>
        )}
        <div className="p-5">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-xl font-bold" style={{ color: 'var(--foreground)' }}>{lugar.nome}</h1>
            {lugar.tipo && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>{lugar.tipo}</span>
            )}
          </div>
          {lugar.descricao && (
            <p className="text-sm leading-relaxed mt-3 whitespace-pre-wrap" style={{ color: 'var(--foreground)' }}>{lugar.descricao}</p>
          )}
        </div>
      </div>
    </div>
  )
}
