import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import { Chat } from './chat'

export default async function ConversaPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ universo?: string }>
}) {
  const { id } = await params
  const { universo } = await searchParams
  const supabase = await createClient()

  const { data: conversa } = await supabase
    .from('dm_conversas')
    .select('id, a:personagens!dm_conversas_personagem_a_fkey(id, nome, foto_url), b:personagens!dm_conversas_personagem_b_fkey(id, nome, foto_url)')
    .eq('id', id)
    .single()
  if (!conversa) notFound()

  const [{ data: mensagens }, { data: { user } }] = await Promise.all([
    supabase
      .from('dm_mensagens')
      .select('id, personagem_id, conteudo, criado_por, created_at')
      .eq('conversa_id', id)
      .order('created_at', { ascending: true }),
    supabase.auth.getUser(),
  ])

  const c = conversa as unknown as {
    id: string
    a: { id: string; nome: string; foto_url: string | null }
    b: { id: string; nome: string; foto_url: string | null }
  }

  return (
    <Chat
      conversaId={id}
      a={c.a}
      b={c.b}
      userId={user?.id ?? ''}
      inicial={mensagens ?? []}
      voltarHref={`/dashboard/mensagens${universo ? `?universo=${universo}` : ''}`}
    />
  )
}
