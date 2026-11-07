'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Send, ChevronDown, Bold, Italic, Underline, Strikethrough, Plus, Check } from 'lucide-react'
import { RichTextEditor, type RichTextEditorHandle } from '@/components/rich-text-editor'
import { BottomSheet } from '@/components/bottom-sheet'
import { CenaForm } from './cena-form'

const LAST_PERSONAGEM_KEY = 'loxihub_last_personagem_id'

interface Personagem {
  id: string
  nome: string
  foto_url: string | null
  tipo: string | null
}

interface PostFormProps {
  threadId: string
  personagemPrincipal: string
  personagens: Personagem[]
  lugares: { id: string; nome: string; lat: number | null; lng: number | null }[]
}

function Avatar({ p, size = 5 }: { p: { nome: string; foto_url: string | null }; size?: number }) {
  const px = size * 4
  return p.foto_url ? (
    <div
      className="rounded-full flex-shrink-0"
      style={{
        width: px,
        height: px,
        backgroundImage: `url(${p.foto_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        flexShrink: 0,
      }}
    />
  ) : (
    <div
      className="rounded-full flex items-center justify-center font-medium"
      style={{
        width: px,
        height: px,
        flexShrink: 0,
        background: 'linear-gradient(135deg, #800020, #5C0018)',
        color: 'var(--primary-foreground)',
        fontSize: size <= 5 ? 9 : 11,
      }}
    >
      {p.nome[0].toUpperCase()}
    </div>
  )
}

function GroupLabel({ label }: { label: string }) {
  return (
    <p className="px-3 pt-2 pb-1 text-[9px] font-medium uppercase tracking-widest" style={{ color: 'var(--muted-light)' }}>
      {label}
    </p>
  )
}


const DRAFT_KEY = (threadId: string) => `loxihub_draft_${threadId}`

export function PostForm({ threadId, personagemPrincipal, personagens, lugares }: PostFormProps) {
  const [cenaOpen, setCenaOpen] = useState(false)
  const [sheetOpen, setSheetOpen] = useState(false)
  const [focused, setFocused] = useState(false)
  const [activeFmts, setActiveFmts] = useState<string[]>([])
  const [conteudo, setConteudo] = useState(() => {
    if (typeof window === 'undefined') return ''
    return localStorage.getItem(DRAFT_KEY(threadId)) ?? ''
  })
  const [loading, setLoading] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<RichTextEditorHandle>(null)
  const router = useRouter()

  const FORMAT_MARKERS: Record<string, string> = { bold: '**', italic: '*', underline: '__', strikethrough: '~~' }

  function applyFormat(format: string) {
    editorRef.current?.applyFormat(FORMAT_MARKERS[format])
  }

  const principais = personagens
    .filter(p => p.tipo !== 'npc')
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

  const npcs = personagens
    .filter(p => p.tipo === 'npc')
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

  function getInitialPersonagem(): Personagem | null {
    if (typeof window !== 'undefined') {
      const lastId = localStorage.getItem(LAST_PERSONAGEM_KEY)
      if (lastId) {
        const found = personagens.find(p => p.id === lastId)
        if (found) return found
      }
    }
    return personagens.find(p => p.nome === personagemPrincipal)
      ?? principais[0]
      ?? personagens[0]
      ?? null
  }

  const [selectedPersonagem, setSelectedPersonagem] = useState<Personagem | null>(getInitialPersonagem)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    if (conteudo) {
      localStorage.setItem(DRAFT_KEY(threadId), conteudo)
    } else {
      localStorage.removeItem(DRAFT_KEY(threadId))
    }
  }, [conteudo, threadId])

  function selectPersonagem(p: Personagem) {
    setSelectedPersonagem(p)
    localStorage.setItem(LAST_PERSONAGEM_KEY, p.id)
    setDropdownOpen(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!conteudo.trim()) return
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const { error } = await supabase.from('posts').insert({
      thread_id: threadId,
      conteudo: conteudo.trim(),
      personagem_pov: selectedPersonagem?.nome ?? null,
      criado_por: user?.id,
    })

    if (error) {
      // mantém o texto (rascunho) para não perder o post
      setLoading(false)
      alert('Não foi possível enviar o post. Tente novamente.')
      return
    }

    setConteudo('')
    localStorage.removeItem(DRAFT_KEY(threadId))
    setLoading(false)
    router.refresh()
  }

  const povNome = selectedPersonagem?.nome ?? 'Narrador'

  const keepFocus = {
    onPointerDown: (e: React.PointerEvent) => e.preventDefault(),
    onMouseDown: (e: React.MouseEvent) => e.preventDefault(),
  }

  const formatButtons = ([['bold', Bold, 'Negrito'], ['italic', Italic, 'Itálico'], ['underline', Underline, 'Sublinhado'], ['strikethrough', Strikethrough, 'Riscado']] as const).map(([fmt, Icon, label]) => {
    const active = activeFmts.includes(FORMAT_MARKERS[fmt])
    return (
      <button
        key={fmt}
        type="button"
        aria-label={label}
        aria-pressed={active}
        title={label}
        {...keepFocus}
        onClick={() => applyFormat(fmt)}
        className="w-11 h-9 md:w-auto md:h-auto md:p-1.5 rounded-lg md:rounded-md flex items-center justify-center transition-colors"
        style={{
          background: active ? 'var(--primary)' : 'var(--p-07)',
          color: active ? 'var(--primary-foreground)' : 'var(--primary)',
        }}
      >
        <Icon size={16} />
      </button>
    )
  })

  function renderPersonagemRow(p: Personagem, muted: boolean, onPick: () => void, big: boolean) {
    return (
      <button
        key={p.id}
        type="button"
        onClick={onPick}
        className={`flex items-center gap-3 w-full text-left transition-colors hover:opacity-80 ${big ? 'px-3 py-2.5 rounded-xl' : 'px-3 py-2'}`}
        style={{ background: selectedPersonagem?.id === p.id ? 'var(--p-08)' : 'transparent' }}
      >
        <Avatar p={p} size={big ? 9 : 6} />
        <span
          className={big ? 'text-sm' : 'text-xs'}
          style={{ color: muted ? 'var(--foreground-muted)' : 'var(--foreground)', fontWeight: muted ? 400 : 500 }}
        >
          {p.nome}
        </span>
        {big && selectedPersonagem?.id === p.id && <Check size={16} className="ml-auto" style={{ color: 'var(--primary)' }} />}
      </button>
    )
  }

  return (
    <>
    <CenaForm
      threadId={threadId}
      personagens={personagens}
      lugares={lugares}
      open={cenaOpen}
      onOpenChange={setCenaOpen}
    />
    <form onSubmit={handleSubmit}>

      {/* Seletor de personagem — desktop (dropdown) */}
      <div className="relative mb-2 hidden md:block" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen(o => !o)}
          className="flex items-center gap-2 px-2 py-1 rounded-lg transition-opacity hover:opacity-70"
        >
          {selectedPersonagem
            ? <Avatar p={selectedPersonagem} size={5} />
            : <div className="w-5 h-5 rounded-full" style={{ background: 'var(--p-15)' }} />
          }
          <span className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>{povNome}</span>
          <ChevronDown size={11} style={{ color: 'var(--foreground-muted)' }} />
        </button>

        {dropdownOpen && (
          <div
            className="absolute bottom-full left-0 mb-1 z-20 rounded-xl overflow-hidden py-1"
            style={{
              background: 'rgba(255,255,255,0.97)',
              border: '0.5px solid var(--p-15)',
              boxShadow: '0 8px 24px var(--fg-12)',
              minWidth: 200,
              maxHeight: 320,
              overflowY: 'auto',
              backdropFilter: 'blur(8px)',
            }}
          >
            {principais.length > 0 && (
              <>
                <GroupLabel label="Personagens principais" />
                {principais.map(p => renderPersonagemRow(p, false, () => selectPersonagem(p), false))}
              </>
            )}
            {npcs.length > 0 && (
              <>
                {principais.length > 0 && (
                  <div style={{ height: 1, background: 'var(--p-08)', margin: '4px 12px' }} />
                )}
                <GroupLabel label="NPCs" />
                {npcs.map(p => renderPersonagemRow(p, true, () => selectPersonagem(p), false))}
              </>
            )}
            {personagens.length === 0 && (
              <p className="px-3 py-2 text-xs" style={{ color: 'var(--foreground-muted)' }}>
                Nenhum personagem criado ainda.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Toolbar de formatação — desktop (sempre visível) */}
      <div className="hidden md:flex gap-1.5 mb-2">{formatButtons}</div>

      {/* Faixa de formatação — mobile (só com o campo em foco) */}
      {focused && (
        <div className="md:hidden flex items-center gap-1.5 mb-2 px-1">{formatButtons}</div>
      )}

      {/* Barra de escrita: ＋  [avatar + campo]  enviar */}
      <div className="flex items-end gap-2">
        <button
          type="button"
          aria-label="Contexto de cena"
          {...keepFocus}
          onClick={() => setCenaOpen(true)}
          className="md:hidden flex-shrink-0 w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: 'var(--p-10)', color: 'var(--primary)' }}
        >
          <Plus size={20} />
        </button>

        <div
          className="flex-1 min-w-0 flex items-end gap-2 rounded-3xl md:rounded-xl pl-1.5 pr-4 md:px-4 py-1.5 md:py-3"
          style={{
            background: 'rgba(255,255,255,0.65)',
            border: '0.5px solid var(--p-12)',
            boxShadow: '0 2px 12px rgba(40,5,15,0.05)',
          }}
        >
          <button
            type="button"
            aria-label={`Falando como ${povNome}. Trocar personagem`}
            {...keepFocus}
            onClick={() => setSheetOpen(true)}
            className="md:hidden flex-shrink-0 w-9 h-9 flex items-center justify-center"
          >
            {selectedPersonagem
              ? <Avatar p={selectedPersonagem} size={8} />
              : <div className="w-8 h-8 rounded-full" style={{ background: 'var(--p-15)' }} />
            }
          </button>

          <div
            className="flex-1 min-w-0 py-2 md:py-0 text-base md:text-sm"
            style={{ lineHeight: '1.4', color: 'var(--foreground)' }}
          >
            <RichTextEditor
              ref={editorRef}
              value={conteudo}
              onChange={setConteudo}
              onSubmit={() => handleSubmit({ preventDefault: () => {} } as React.FormEvent)}
              onFocusChange={setFocused}
              onActiveFormatsChange={setActiveFmts}
              placeholder={`Escreva como ${povNome}...`}
              style={{ color: 'var(--foreground)', maxHeight: '10rem' }}
            />
          </div>
        </div>

        <button
          type="submit"
          aria-label="Enviar"
          disabled={loading || !conteudo.trim()}
          {...keepFocus}
          className="flex-shrink-0 w-11 h-11 md:w-8 md:h-8 rounded-full md:rounded-lg flex items-center justify-center disabled:opacity-30 transition-opacity hover:opacity-80"
          style={{ background: 'var(--btn-primary)', color: 'var(--primary-foreground)' }}
        >
          <Send size={16} />
        </button>
      </div>

      <p className="hidden md:block text-[10px] mt-1.5 ml-1" style={{ color: 'var(--muted-light)' }}>
        Ctrl+Enter para enviar
      </p>

      {/* Seletor de personagem — mobile (bottom sheet) */}
      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)} title="Falar como">
        {principais.length > 0 && (
          <>
            <GroupLabel label="Personagens principais" />
            {principais.map(p => renderPersonagemRow(p, false, () => { selectPersonagem(p); setSheetOpen(false) }, true))}
          </>
        )}
        {npcs.length > 0 && (
          <>
            <GroupLabel label="NPCs" />
            {npcs.map(p => renderPersonagemRow(p, true, () => { selectPersonagem(p); setSheetOpen(false) }, true))}
          </>
        )}
        {personagens.length === 0 && (
          <p className="px-3 py-2 text-sm" style={{ color: 'var(--foreground-muted)' }}>
            Nenhum personagem criado ainda.
          </p>
        )}
      </BottomSheet>
    </form>
    </>
  )
}
