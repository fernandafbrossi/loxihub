'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ScrollText, MapPin, Users, Home, LogOut, Menu, X, ArrowLeft, Smartphone, CalendarDays, PanelLeftClose, PanelLeftOpen, GitBranch, Lock } from 'lucide-react'
import { NotificationBell } from '@/components/notifications-bell'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

const globalNav = [
  { href: '/dashboard', label: 'Início', icon: Home, exact: true },
]

interface SidebarProps {
  userEmail?: string
}

export function Sidebar({ userEmail }: SidebarProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [universoNome, setUniversoNome] = useState<string | null>(null)
  const [universoFromContext, setUniversoFromContext] = useState<string | null>(null)
  const router = useRouter()

  const universoMatch = pathname.match(/^\/dashboard\/universos\/([^/]+)/)

  useEffect(() => {
    // 1. Tenta query param (?universo=)
    const params = new URLSearchParams(window.location.search)
    const fromQuery = params.get('universo')
    if (fromQuery) { setUniversoFromContext(fromQuery); return }

    // 2. Tenta buscar universo_id do recurso atual (personagem, lugar, thread)
    const resourceMatch = pathname.match(
      /^\/dashboard\/(personagens|lugares|threads)\/([0-9a-f-]{36})/
    )
    if (resourceMatch) {
      const table = resourceMatch[1]
      const id = resourceMatch[2]
      const supabase = createClient()
      supabase.from(table).select('universo_id').eq('id', id).single()
        .then(({ data }) => setUniversoFromContext(data?.universo_id ?? null))
      return
    }

    setUniversoFromContext(null)
  }, [pathname])

  const universoId = universoMatch?.[1] ?? universoFromContext ?? null

  useEffect(() => {
    if (!universoId) { setUniversoNome(null); return }
    const supabase = createClient()
    supabase.from('universos').select('nome').eq('id', universoId).single()
      .then(({ data }) => setUniversoNome(data?.nome ?? null))
  }, [universoId])

  const universoNav = universoId ? [
    { href: `/dashboard/universos/${universoId}`, label: 'Visão geral', icon: Home, exact: true },
    { href: `/dashboard/threads?universo=${universoId}`, label: 'Threads', icon: ScrollText },
    { href: `/dashboard/personagens?universo=${universoId}`, label: 'Personagens', icon: Users },
    { href: `/dashboard/lugares?universo=${universoId}`, label: 'Lugares', icon: MapPin },
    { href: `/dashboard/redes-sociais?universo=${universoId}`, label: 'Redes Sociais', icon: Smartphone },
    { href: `/dashboard/arvore?universo=${universoId}`, label: 'Vínculos', icon: GitBranch },
    { href: `/dashboard/linha-do-tempo?universo=${universoId}`, label: 'Linha do tempo', icon: CalendarDays },
    { href: `/dashboard/universos/${universoId}/segredos`, label: 'Segredos', icon: Lock },
  ] : []

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href.split('?')[0]
    return pathname.startsWith(href.split('?')[0])
  }

  const displayName = userEmail?.split('@')[0] ?? 'você'
  const navItems = universoId ? universoNav : globalNav

  // ── Collapsed (icons only) ──
  const CollapsedSidebar = () => (
    <aside
      className="hidden md:flex flex-col items-center shrink-0 py-5 gap-4"
      style={{
        width: 52,
        background: 'rgba(255,255,255,0.42)',
        borderRight: '0.5px solid rgba(128,0,32,0.10)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      {/* Dot logo */}
      <div
        className="w-2.5 h-2.5 rounded-full mb-2"
        style={{ background: 'linear-gradient(135deg, #C9A96E, #A07840)', boxShadow: '0 0 0 3px rgba(201,169,110,0.20)' }}
      />

      {/* Nav icons */}
      <nav className="flex flex-col items-center gap-1 flex-1">
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              title={label}
              className="w-9 h-9 flex items-center justify-center rounded-lg transition-all"
              style={{
                background: active ? 'linear-gradient(135deg, #800020 0%, #A0002A 100%)' : 'transparent',
                color: active ? '#FAF0F2' : '#906070',
                boxShadow: active ? '0 3px 14px rgba(128,0,32,0.42), inset 0 1px 0 rgba(255,255,255,0.12)' : 'none',
              }}
            >
              <Icon size={16} />
            </Link>
          )
        })}
      </nav>

      {/* Notifications + expand */}
      <div className="flex flex-col items-center gap-2">
        <NotificationBell placement="right" />
        <button
          onClick={() => setCollapsed(false)}
          title="Expandir menu"
          className="w-9 h-9 flex items-center justify-center rounded-lg hover:opacity-70 transition-opacity"
          style={{ color: '#906070' }}
        >
          <PanelLeftOpen size={15} />
        </button>
      </div>
    </aside>
  )

  const SidebarContent = () => (
    <div className="flex flex-col h-full">

      {/* Logo / contexto */}
      <div className="px-5 pt-6 pb-5">
        {universoId ? (
          <div>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-[10px] mb-3 hover:opacity-70 transition-opacity"
              style={{ color: '#906070' }}
            >
              <ArrowLeft size={11} /> Universos
            </Link>
            <div className="flex items-center gap-2">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: '#800020', boxShadow: '0 0 0 3px rgba(128,0,32,0.15)' }}
              />
              <span className="text-sm font-medium leading-tight" style={{ color: '#2E0510' }}>
                {universoNome ?? '...'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #C9A96E, #A07840)', boxShadow: '0 0 0 3px rgba(201,169,110,0.20)' }}
              />
              <span className="text-base font-medium tracking-tight" style={{ color: '#2E0510', fontFamily: 'var(--font-serif)' }}>
                LoxiHub
              </span>
            </div>
            <button
              onClick={() => setCollapsed(true)}
              title="Recolher menu"
              className="hover:opacity-60 transition-opacity"
              style={{ color: '#B09098' }}
            >
              <PanelLeftClose size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 flex flex-col gap-0.5">
        <p className="text-[9px] font-medium uppercase tracking-widest px-2 mb-1" style={{ color: '#B09098' }}>
          {universoId ? 'Universo' : 'Menu'}
        </p>
        {navItems.map(({ href, label, icon: Icon, exact }) => {
          const active = isActive(href, exact)
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all"
              style={{
                background: active ? 'linear-gradient(135deg, #800020 0%, #A0002A 100%)' : 'transparent',
                color: active ? '#FAF0F2' : '#906070',
                boxShadow: active ? '0 3px 14px rgba(128,0,32,0.42), inset 0 1px 0 rgba(255,255,255,0.12)' : 'none',
              }}
            >
              <Icon size={15} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div
        className="px-3 py-4 mx-3 mb-4 rounded-xl"
        style={{ background: 'rgba(128,0,32,0.06)', border: '0.5px solid rgba(128,0,32,0.10)' }}
      >
        <div className="flex items-center gap-2.5 mb-3">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #800020, #5C0018)',
              color: '#FAF0F2',
              boxShadow: '0 1px 6px rgba(40,5,15,0.22)',
            }}
          >
            {displayName[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate" style={{ color: '#2E0510' }}>{displayName}</p>
            <p className="text-[10px]" style={{ color: '#906070' }}>online</p>
          </div>
          <NotificationBell placement="up" />
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 text-[11px] w-full px-1 py-1 rounded transition-opacity hover:opacity-70"
          style={{ color: '#906070' }}
        >
          <LogOut size={13} />
          Sair
        </button>
      </div>
    </div>
  )

  if (collapsed) return <CollapsedSidebar />

  return (
    <>
      {/* Desktop */}
      <aside
        className="hidden md:flex flex-col w-52 shrink-0"
        style={{
          background: 'rgba(255,255,255,0.42)',
          borderRight: '0.5px solid rgba(128,0,32,0.10)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <div
        className="md:hidden fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3"
        style={{
          background: 'rgba(247,240,243,0.90)',
          borderBottom: '0.5px solid rgba(128,0,32,0.10)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
        }}
      >
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: '#800020', boxShadow: '0 0 0 2px rgba(128,0,32,0.15)' }} />
          <span className="text-sm font-medium" style={{ color: '#2E0510' }}>
            {universoNome ?? 'LoxiHub'}
          </span>
        </div>
        <button onClick={() => setMobileOpen(!mobileOpen)} style={{ color: '#2E0510' }}>
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-30 flex">
          <div
            className="w-60 min-h-screen"
            style={{
              background: 'rgba(247,240,243,0.95)',
              borderRight: '0.5px solid rgba(128,0,32,0.10)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
            }}
          >
            <div className="pt-14"><SidebarContent /></div>
          </div>
          <div className="flex-1 bg-black/30" onClick={() => setMobileOpen(false)} />
        </div>
      )}
    </>
  )
}
