import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { EventoForm } from '../../evento-form'

export default async function EditarEventoPage({ params }: { params: Promise<{ id: string; eventoId: string }> }) {
  const { id, eventoId } = await params
  const supabase = await createClient()

  const [{ data: evento }, { data: threads }] = await Promise.all([
    supabase.from('eventos').select('*').eq('id', eventoId).eq('universo_id', id).single(),
    supabase.from('threads').select('id, titulo, status').eq('universo_id', id).order('updated_at', { ascending: false }),
  ])
  if (!evento) notFound()

  return (
    <div className="p-4 md:p-7 max-w-2xl">
      <Link href={`/dashboard/universos/${id}/eventos/${eventoId}`} className="inline-flex items-center gap-1.5 text-xs mb-5 hover:opacity-70" style={{ color: 'var(--foreground-muted)' }}>
        <ArrowLeft size={13} /> {evento.titulo}
      </Link>
      <h1 className="text-2xl mb-6" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-serif)' }}>Editar evento</h1>
      <EventoForm
        universoId={id}
        threads={threads ?? []}
        inicial={{
          id: evento.id,
          titulo: evento.titulo,
          data_jogo: evento.data_jogo,
          thread_id: evento.thread_id,
          descricao: evento.descricao,
          clima: evento.clima,
          acontecimentos: evento.acontecimentos,
          imagens: evento.imagens ?? [],
        }}
      />
    </div>
  )
}
