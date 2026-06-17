'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BookOpen, ScrollText, MapPin, Users, Camera, MessageSquare, Moon, Sun, LogOut, Menu, X } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard', label: 'Início', icon: BookOpen },
  { href: '/dashboard/threads', label: 'Threads', icon: ScrollText },
  { href: '/dashboard/lugares', label: 'Lugares', icon: MapPin },
  { href: '/dashboard/personagens', label: 'Personagens', icon: Users },
  { href: '/dashboard/instagram', label: 'Instagram', icon: Camera },
  { href: '/dashboard/twitter', label: 'Twitter', icon: MessageSquare },
]

export function Sidebar() {
  const pathname = usePathname()
  const { theme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(false)
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="p-5 border-b" style={{ borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'var(--primary)' }}>
            <BookOpen size={16} style={{ color: 'var(--primary-foreground)' }} />
          </div>
          <span className="font-bold text-lg tracking-tight" style={{ color: 'var(--foreground)' }}>LoxiHub</span>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all',
                active
                  ? 'font-medium'
                  : 'hover:opacity-80'
              )}
              style={{
                background: active ? 'var(--primary)' : 'transparent',
                color: active ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
              }}
            >
              <Icon size={17} />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t space-y-1" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full hover:opacity-80 transition-all"
          style={{ color: 'var(--muted-foreground)' }}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
          {theme === 'dark' ? 'Modo claro' : 'Modo escuro'}
        </button>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full hover:opacity-80 transition-all"
          style={{ color: 'var(--muted-foreground)' }}
        >
          <LogOut size={17} />
          Sair
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-56 min-h-screen border-r shrink-0" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 border-b" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: 'var(--primary)' }}>
            <BookOpen size={14} style={{ color: 'var(--primary-foreground)' }} />
          </div>
          <span className="font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>LoxiHub</span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} style={{ color: 'var(--foreground)' }}>
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 flex">
          <div className="w-64 min-h-screen border-r" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="pt-14">
              <SidebarContent />
            </div>
          </div>
          <div className="flex-1 bg-black/40" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  )
}
