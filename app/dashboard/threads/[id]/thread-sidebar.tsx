'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { Hash, Plus, Search, PanelLeftClose, PanelLeftOpen, X, ScrollText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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

export function ThreadSidebar({ threads, currentId, novaThreadHref }: ThreadSidebarProps) {
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

  const hasQuery = query.trim().length >= 2
  const threadIdsFromPosts = new Set(postResults.map(p => p.thread_id))
  const threadsThatMatch = hasQuery ? threads.filter(t => threadIdsFromPosts.has(t.id) && !filteredThreads.find(ft => ft.id === t.id)) : []

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

        {/* Threads por título */}
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

        {/* Resultados de posts */}
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
