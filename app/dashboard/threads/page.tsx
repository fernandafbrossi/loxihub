import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function ThreadsPage({
  searchParams,
}: {
  searchParams: Promise<{ universo?: string }>
}) {
  const { universo } = await searchParams
  const supabase = await createClient()

  const query = supabase
    .from('threads')
    .select('id')
    .order('updated_at', { ascending: false })
    .limit(1)

  if (universo) query.eq('universo_id', universo)

  const { data: threads } = await query

  if (threads && threads.length > 0) {
    redirect(`/dashboard/threads/${threads[0].id}`)
  }

  // Nenhuma thread ainda — volta para o universo ou dashboard
  redirect(universo ? `/dashboard/universos/${universo}` : '/dashboard')
}
