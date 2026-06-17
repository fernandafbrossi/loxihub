import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Pencil } from 'lucide-react'
import { DeleteButton } from '@/components/delete-button'
import { LugarMapaClima } from './lugar-mapa-clima'

export default async function LugarPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = await createClient()

  const [{ data: lugar }, { data: vinculados }] = await Promise.all([
    supabase.from('lugares').select('*').eq('id', id).single(),
    supabase
      .from('lugar_personagens')
      .select('personagem_id, personagens(id, nome, foto_url)')
      .eq('lugar_id', id),
  ])

  if (!lugar) notFound()

  const personagens = (vinculados ?? []).map((v: any) => v.personagens).filter(Boolean)

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <Link href="/dashboard/lugares" className="inline-flex items-center gap-1.5 text-sm hover:underline" style={{ color: '#906070' }}>
          <ArrowLeft size={14} /> Lugares
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/lugares/${id}/editar`}
            className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-opacity hover:opacity-70"
            style={{ background: 'rgba(128,0,32,0.07)', color: '#800020' }}
          >
            <Pencil size={12} /> Editar
          </Link>
          <DeleteButton table="lugares" id={id} redirectTo="/dashboard/lugares" variant="light" />
        </div>
      </div>

      <div className="rounded-xl border overflow-hidden" style={{ background: 'rgba(255,255,255,0.60)', borderColor: 'rgba(128,0,32,0.10)' }}>
        {lugar.foto_url ? (
          <img src={lugar.foto_url} alt={lugar.nome} className="w-full h-56 object-cover" />
        ) : (
          <div className="w-full h-40 flex items-center justify-center" style={{ background: 'rgba(128,0,32,0.08)' }}>
            <MapPin size={48} style={{ color: '#906070' }} />
          </div>
        )}

        <div className="p-5 space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold" style={{ color: '#2E0510' }}>{lugar.nome}</h1>
              {lugar.tipo && (
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(128,0,32,0.08)', color: '#906070' }}>{lugar.tipo}</span>
              )}
            </div>
            {lugar.descricao && (
              <p className="text-sm leading-relaxed mt-2 whitespace-pre-wrap" style={{ color: '#2E0510' }}>{lugar.descricao}</p>
            )}
          </div>

          {personagens.length > 0 && (
            <div>
              <p className="text-[10px] font-medium uppercase tracking-wider mb-2.5" style={{ color: '#906070' }}>Personagens</p>
              <div className="flex flex-wrap gap-3">
                {personagens.map((p: any) => (
                  <Link key={p.id} href={`/dashboard/personagens/${p.id}`} className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                    <div
                      className="w-7 h-7 rounded-full overflow-hidden flex items-center justify-center text-xs font-medium"
                      style={{
                        background: p.foto_url ? 'transparent' : 'linear-gradient(135deg,#800020,#5C0018)',
                        color: '#FAF0F2',
                      }}
                    >
                      {p.foto_url
                        ? <img src={p.foto_url} alt={p.nome} className="w-full h-full object-cover" />
                        : p.nome[0].toUpperCase()
                      }
                    </div>
                    <span className="text-xs font-medium" style={{ color: '#2E0510' }}>{p.nome}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <LugarMapaClima
            lat={lugar.lat}
            lng={lugar.lng}
            nome={lugar.nome}
          />
        </div>
      </div>
    </div>
  )
}
