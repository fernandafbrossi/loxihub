'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Hash, Plus, Search, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'

interface Thread {
  id: string
  titulo: string
  status: string
  tags?: string[] | null
}

interface ThreadSidebarProps {
  threads: Thread[]
  currentId: string
  novaThreadHref: string
}

export function ThreadSidebar({ threads, currentId, novaThreadHref }: ThreadSidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [query, setQuery] = useState('')

  const filtered = query.trim()
    ? threads.filter(t =>
        t.titulo.toLowerCase().includes(query.toLowerCase()) ||
        (t.tags ?? []).some(tag => tag.toLowerCase().includes(query.toLowerCase()))
      )
    : threads

  if (collapsed) {
    return (
      <div
        className="flex-shrink-0 flex flex-col items-center pt-4 gap-3"
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
    <div
      className="w-56 flex-shrink-0 flex flex-col overflow-hidden"
      style={{
        background: 'rgba(255,255,255,0.28)',
        borderRight: '0.5px solid rgba(128,0,32,0.10)',
      }}
    >
      {/* Header */}
      <div className="px-4 pt-5 pb-2 flex items-center justify-between">
        <p className="text-[9px] font-medium uppercase tracking-widest" style={{ color: '#B09098' }}>
          Capítulos
        </p>
        <div className="flex items-center gap-1.5">
          <Link href={novaThreadHref} title="Nova thread">
            <Plus size={13} style={{ color: '#906070' }} className="hover:opacity-70 transition-opacity" />
          </Link>
          <button onClick={() => setCollapsed(true)} title="Minimizar" className="hover:opacity-70 transition-opacity" style={{ color: '#906070' }}>
            <PanelLeftClose size={13} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-3 pb-2">
        <div className="relative">
          <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#B09098' }} />
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Buscar thread ou tag..."
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
        {filtered.length === 0 && (
          <p className="text-[10px] px-3 py-2" style={{ color: '#B09098' }}>
            Nenhuma thread encontrada.
          </p>
        )}
        {filtered.map(t => {
          const active = t.id === currentId
          return (
            <Link
              key={t.id}
              href={`/dashboard/threads/${t.id}`}
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
      </nav>
    </div>
  )
}
