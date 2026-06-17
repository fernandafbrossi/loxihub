import { Sidebar } from '@/components/sidebar'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div
      className="min-h-screen p-5 flex items-start justify-center"
      style={{ background: 'linear-gradient(145deg, #B8A8B0 0%, #A898A2 50%, #B4A4AE 100%)' }}
    >
      <div
        className="flex w-full rounded-2xl overflow-hidden"
        style={{
          minHeight: 'calc(100vh - 40px)',
          background: 'linear-gradient(160deg, #F7F0F3 0%, #EDE4EA 100%)',
          boxShadow: '0 8px 48px rgba(40,5,15,0.22), 0 2px 8px rgba(40,5,15,0.10)',
        }}
      >
        <Sidebar userEmail={user.email} />
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
