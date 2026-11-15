import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { EventoForm } from '../evento-form'

export default async function NovoEventoPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ data?: string }>
}) {
  const { id } = await params
  const { data } = await searchParams
  const supabase = await createClient()

  const [{ data: universo }, { data: threads }] = await Promise.all([
    supabase.from('universos').select('id, nome').eq('id', id).single(),
    supabase.from('threads').select('id, titulo, status').eq('universo_id', id).order('updated_at', { ascending: false }),
  ])
  if (!universo) notFound()

  return (
    <div className="p-4 md:p-7 max-w-2xl">
      <Link href={`/dashboard/universos/${id}`} className="inline-flex items-center gap-1.5 text-xs mb-5 hover:opacity-70" style={{ color: 'var(--foreground-muted)' }}>
        <ArrowLeft size={13} /> {universo.nome}
      </Link>
      <h1 className="text-2xl mb-6" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-serif)' }}>Novo evento</h1>
      <EventoForm universoId={id} threads={threads ?? []} dataSugerida={data && /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : undefined} />
    </div>
  )
}
