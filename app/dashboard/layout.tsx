import { Sidebar } from '@/components/sidebar'
import { PushBanner } from '@/components/push-banner'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('nome_display, avatar_url')
    .eq('id', user.id)
    .single()

  return (
    <div
      className="min-h-screen md:p-5 flex items-start justify-center"
      style={{ background: 'var(--bg-page)' }}
    >
      <div
        className="flex w-full md:rounded-2xl overflow-hidden min-h-screen md:min-h-[calc(100vh-40px)]"
        style={{
          background: 'var(--bg-inner)',
          boxShadow: '0 8px 48px rgba(40,5,15,0.22), 0 2px 8px rgba(40,5,15,0.10)',
        }}
      >
        <Sidebar userEmail={user.email} displayName={profile?.nome_display} avatarUrl={profile?.avatar_url ?? undefined} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
      <PushBanner />
    </div>
  )
}
