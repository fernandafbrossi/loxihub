'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Hash, Plus, Search, PanelLeftClose, PanelLeftOpen, X, ScrollText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

interface Thread {
  id: string
  titulo: string
  status: string
  tags?: string[] | null
}

interface PostResult {
  id: string
  conteudo: string
  thread_id: string
  thread_titulo: string
  personagem_pov: string | null
}

interface ThreadSidebarProps {
  threads: Thread[]
  currentId: string
  novaThreadHref: string
}

function useDebounce(value: string, delay: number) {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(t)
  }, [value, delay])
  return debounced
}

function Snippet({ text, query }: { text: string; query: string }) {
  const idx = text.toLowerCase().indexOf(query.toLowerCase())
  if (idx === -1) return <span className="text-[10px]" style={{ color: '#B09098' }}>{text.slice(0, 60)}…</span>
  const start = Math.max(0, idx - 20)
  const end = Math.min(text.length, idx + query.length + 40)
  const before = text.slice(start, idx)
  const match = text.slice(idx, idx + query.length)
  const after = text.slice(idx + query.length, end)
  return (
    <span className="text-[10px]" style={{ color: '#B09098' }}>
      {start > 0 && '…'}{before}
      <mark style={{ background: 'rgba(128,0,32,0.18)', color: '#800020', borderRadius: 2 }}>{match}</mark>
      {after}{end < text.length && '…'}
    </span>
  )
}

function SidebarContent({
  threads,
  currentId,
  novaThreadHref,
  onClose,
}: {
  threads: Thread[]
  currentId: string
  novaThreadHref: string
  onClose?: () => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [query, setQuery] = useState('')
  const [postResults, setPostResults] = useState<PostResult[]>([])
  const [searching, setSearching] = useState(false)
  const debouncedQuery = useDebounce(query, 350)

  const filteredThreads = query.trim()
    ? threads.filter(t =>
        t.titulo.toLowerCase().includes(query.toLowerCase()) ||
        (t.tags ?? []).some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      )
    : threads

  useEffect(() => {
    if (!debouncedQuery.trim() || debouncedQuery.trim().length < 2) {
      setPostResults([])
      return
    }
    setSearching(true)
    const supabase = createClient()
    supabase
      .from('posts')
      .select('id, conteudo, thread_id, personagem_pov, threads(id, titulo)')
      .ilike('conteudo', `%${debouncedQuery}%`)
      .limit(12)
      .then(({ data }) => {
        if (!data) { setPostResults([]); setSearching(false); return }
        setPostResults(data.map((p: any) => ({
          id: p.id,
          conteudo: p.conteudo,
          thread_id: p.thread_id,
          thread_titulo: (p.threads as any)?.titulo ?? 'Thread',
          personagem_pov: p.personagem_pov,
        })))
        setSearching(false)
      })
  }, [debouncedQuery])

  const hasQuery = query.trim().length >= 2

  if (collapsed) {
    return (
      <div
        className="hidden md:flex flex-shrink-0 flex-col items-center pt-4 gap-3"
        style={{
          width: 40,
          background: 'rgba(255,255,255,0.28)',
          borderRight: '0.5px solid rgba(128,0,32,0.10)',
        }}
      >
        <button
          onClick={() => setCollapsed(false)}
          title="Expandir capítulos"
          className="hover:opacity-70 transition-opacity"
          style={{ color: '#906070' }}
        >
          <PanelLeftOpen size={16} />
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="px-4 pt-5 pb-2 flex items-center justify-between flex-shrink-0">
        <p className="text-[9px] font-medium uppercase tracking-widest" style={{ color: '#B09098' }}>
          Capítulos
        </p>
        <div className="flex items-center gap-1.5">
          <Link href={novaThreadHref} title="Nova thread" onClick={onClose}>
            <Plus size={13} style={{ color: '#906070' }} className="hover:opacity-70 transition-opacity" />
          </Link>
          {/* Desktop collapse */}
          <button
            onClick={() => setCollapsed(true)}
            title="Minimizar"
            className="hidden md:block hover:opacity-70 transition-opacity"
            style={{ color: '#906070' }}
          >
            <PanelLeftClose size={13} />
          </button>
          {/* Mobile close */}
          {onClose && (
            <button
              onClick={onClose}
              title="Fechar"
              className="md:hidden hover:opacity-70 transition-opacity"
              style={{ color: '#906070' }}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pb-2 flex-shrink-0">
        <div className="relative">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#B09098' }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar em tudo..."
            className="w-full pl-7 pr-6 py-1.5 rounded-lg text-[11px] outline-none"
            style={{
              background: 'rgba(255,255,255,0.55)',
              border: '0.5px solid rgba(128,0,32,0.12)',
              color: '#2E0510',
            }}
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
              style={{ color: '#B09098' }}
            >
              <X size={10} />
            </button>
          )}
        </div>
      </div>

      {/* Thread list */}
      <nav className="flex-1 overflow-y-auto px-2 pb-4 flex flex-col gap-0.5">
        {filteredThreads.length === 0 && !hasQuery && (
          <p className="text-[10px] px-3 py-2" style={{ color: '#B09098' }}>
            Nenhuma thread encontrada.
          </p>
        )}
        {filteredThreads.map(t => {
          const active = t.id === currentId
          return (
            <Link
              key={t.id}
              href={`/dashboard/threads/${t.id}`}
              onClick={onClose}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all"
              style={{
                background: active ? '#800020' : 'transparent',
                color: active ? '#FAF0F2' : '#906070',
                boxShadow: active ? '0 2px 10px rgba(128,0,32,0.30)' : 'none',
                fontWeight: active ? 500 : 400,
              }}
            >
              <Hash size={11} style={{ flexShrink: 0 }} />
              <span className="truncate">{t.titulo}</span>
            </Link>
          )
        })}

        {hasQuery && (
          <>
            {searching && (
              <p className="text-[10px] px-3 py-2" style={{ color: '#B09098' }}>Buscando posts...</p>
            )}
            {!searching && postResults.length === 0 && filteredThreads.length === 0 && (
              <p className="text-[10px] px-3 py-2" style={{ color: '#B09098' }}>Nenhum resultado encontrado.</p>
            )}
            {!searching && postResults.length > 0 && (
              <>
                <p className="text-[9px] font-medium uppercase tracking-widest px-3 pt-3 pb-1" style={{ color: '#B09098' }}>
                  Posts ({postResults.length})
                </p>
                {postResults.map(p => (
                  <Link
                    key={p.id}
                    href={`/dashboard/threads/${p.thread_id}`}
                    onClick={onClose}
                    className="flex flex-col gap-0.5 px-3 py-2 rounded-lg transition-all hover:opacity-80"
                    style={{ background: 'rgba(128,0,32,0.04)' }}
                  >
                    <div className="flex items-center gap-1.5">
                      <ScrollText size={9} style={{ color: '#906070', flexShrink: 0 }} />
                      <span className="text-[10px] font-medium truncate" style={{ color: '#800020' }}>
                        {p.thread_titulo}
                      </span>
                    </div>
                    {p.personagem_pov && (
                      <span className="text-[9px]" style={{ color: '#906070' }}>{p.personagem_pov}</span>
                    )}
                    <Snippet text={p.conteudo} query={debouncedQuery} />
                  </Link>
                ))}
              </>
            )}
          </>
        )}
      </nav>
    </div>
  )
}

export function ThreadSidebar({ threads, currentId, novaThreadHref }: ThreadSidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  // Swipe right from left edge to open; swipe left to close
  useEffect(() => {
    let startX = 0
    let startY = 0

    const onTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX
      startY = e.touches[0].clientY
    }

    const onTouchEnd = (e: TouchEvent) => {
      const dx = e.changedTouches[0].clientX - startX
      const dy = Math.abs(e.changedTouches[0].clientY - startY)
      if (dy > 60) return // mostly vertical — ignore

      if (!mobileOpen && startX < 40 && dx > 60) {
        setMobileOpen(true)
      } else if (mobileOpen && dx < -60) {
        setMobileOpen(false)
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })
    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [mobileOpen])

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [mobileOpen])

  return (
    <>
      {/* Desktop sidebar */}
      <div
        className="hidden md:flex w-56 flex-shrink-0 flex-col overflow-hidden"
        style={{
          background: 'rgba(255,255,255,0.28)',
          borderRight: '0.5px solid rgba(128,0,32,0.10)',
        }}
      >
        <SidebarContent
          threads={threads}
          currentId={currentId}
          novaThreadHref={novaThreadHref}
        />
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          {/* Sidebar panel */}
          <div
            className="w-64 h-full flex flex-col"
            style={{
              background: 'rgba(247,240,243,0.97)',
              borderRight: '0.5px solid rgba(128,0,32,0.10)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              paddingTop: 'env(safe-area-inset-top)',
            }}
          >
            <SidebarContent
              threads={threads}
              currentId={currentId}
              novaThreadHref={novaThreadHref}
              onClose={() => setMobileOpen(false)}
            />
          </div>
          {/* Backdrop */}
          <div
            className="flex-1"
            style={{ background: 'rgba(46,5,16,0.35)' }}
            onClick={() => setMobileOpen(false)}
          />
        </div>
      )}
    </>
  )
}
