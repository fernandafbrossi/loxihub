'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Send, ChevronDown, Bold, Italic, Underline, Strikethrough } from 'lucide-react'

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
        color: '#FAF0F2',
        fontSize: size <= 5 ? 9 : 11,
      }}
    >
      {p.nome[0].toUpperCase()}
    </div>
  )
}

function GroupLabel({ label }: { label: string }) {
  return (
    <p className="px-3 pt-2 pb-1 text-[9px] font-medium uppercase tracking-widest" style={{ color: '#B09098' }}>
      {label}
    </p>
  )
}

// Renderiza o texto com os marcadores markdown visíveis e o conteúdo formatado
function renderWithMarkers(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  let key = 0

  const lines = text.split('\n')
  for (let li = 0; li < lines.length; li++) {
    const line = lines[li]
    let j = 0
    let plain = ''

    const flush = () => {
      if (plain) { nodes.push(<span key={key++}>{plain}</span>); plain = '' }
    }

    const defs: [RegExp, string, React.CSSProperties][] = [
      [/^\*\*(.+?)\*\*/, '**', { fontWeight: 700 }],
      [/^\*([^*\n]+?)\*(?!\*)/, '*', { fontStyle: 'italic' }],
      [/^__(.+?)__/, '__', { textDecoration: 'underline' }],
      [/^~~(.+?)~~/, '~~', { textDecoration: 'line-through' }],
    ]

    while (j < line.length) {
      const rest = line.slice(j)
      let matched = false

      for (const [re, marker, style] of defs) {
        const m = rest.match(re)
        if (m) {
          flush()
          nodes.push(
            <span key={key++} style={{ ...style, color: 'rgba(46,5,16,0.28)' }}>{marker}</span>,
            <span key={key++} style={style}>{m[1]}</span>,
            <span key={key++} style={{ ...style, color: 'rgba(46,5,16,0.28)' }}>{marker}</span>
          )
          j += m[0].length
          matched = true
          break
        }
      }

      if (!matched) {
        plain += line[j++]
      }
    }

    flush()
    if (li < lines.length - 1) nodes.push(<br key={`br-${li}`} />)
  }

  return nodes
}

// Estilos compartilhados entre textarea e mirror para garantir alinhamento pixel-perfect
const SHARED_TEXT_STYLE: React.CSSProperties = {
  fontFamily: 'inherit',
  fontSize: 14,
  lineHeight: '1.5',
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  overflowWrap: 'break-word',
}

export function PostForm({ threadId, personagemPrincipal, personagens }: PostFormProps) {
  const [conteudo, setConteudo] = useState('')
  const [loading, setLoading] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mirrorRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const FORMAT_MARKERS: Record<string, string> = { bold: '**', italic: '*', underline: '__', strikethrough: '~~' }

  function applyFormat(format: string) {
    const el = textareaRef.current
    if (!el) return
    const start = el.selectionStart
    const end = el.selectionEnd
    const marker = FORMAT_MARKERS[format]
    const selected = conteudo.slice(start, end)
    const next = conteudo.slice(0, start) + marker + selected + marker + conteudo.slice(end)
    setConteudo(next)
    setTimeout(() => { el.focus(); el.setSelectionRange(start + marker.length, end + marker.length) }, 0)
  }

  // Sincroniza o scroll do mirror com o da textarea quando o conteúdo excede maxHeight
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    const sync = () => {
      if (mirrorRef.current) {
        mirrorRef.current.style.transform = `translateY(-${ta.scrollTop}px)`
      }
    }
    ta.addEventListener('scroll', sync)
    return () => ta.removeEventListener('scroll', sync)
  }, [])

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

    await supabase.from('posts').insert({
      thread_id: threadId,
      conteudo: conteudo.trim(),
      personagem_pov: selectedPersonagem?.nome ?? null,
      criado_por: user?.id,
    })

    setConteudo('')
    if (textareaRef.current) textareaRef.current.style.height = 'auto'
    if (mirrorRef.current) mirrorRef.current.style.transform = ''
    setLoading(false)
    router.refresh()
  }

  function autoResize(el: HTMLTextAreaElement) {
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }

  const povNome = selectedPersonagem?.nome ?? 'Narrador'

  return (
    <form onSubmit={handleSubmit}>

      {/* Seletor de personagem */}
      <div className="relative mb-2" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setDropdownOpen(o => !o)}
          className="flex items-center gap-2 px-2 py-1 rounded-lg transition-opacity hover:opacity-70"
        >
          {selectedPersonagem
            ? <Avatar p={selectedPersonagem} size={5} />
            : <div className="w-5 h-5 rounded-full" style={{ background: 'rgba(128,0,32,0.15)' }} />
          }
          <span className="text-xs font-medium" style={{ color: '#2E0510' }}>{povNome}</span>
          <ChevronDown size={11} style={{ color: '#906070' }} />
        </button>

        {dropdownOpen && (
          <div
            className="absolute bottom-full left-0 mb-1 z-20 rounded-xl overflow-hidden py-1"
            style={{
              background: 'rgba(255,255,255,0.97)',
              border: '0.5px solid rgba(128,0,32,0.15)',
              boxShadow: '0 8px 24px rgba(40,5,15,0.12)',
              minWidth: 200,
              maxHeight: 320,
              overflowY: 'auto',
              backdropFilter: 'blur(8px)',
            }}
          >
            {principais.length > 0 && (
              <>
                <GroupLabel label="Personagens principais" />
                {principais.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectPersonagem(p)}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors hover:opacity-80"
                    style={{ background: selectedPersonagem?.id === p.id ? 'rgba(128,0,32,0.08)' : 'transparent' }}
                  >
                    <Avatar p={p} size={6} />
                    <span className="text-xs font-medium" style={{ color: '#2E0510' }}>{p.nome}</span>
                  </button>
                ))}
              </>
            )}

            {npcs.length > 0 && (
              <>
                {principais.length > 0 && (
                  <div style={{ height: 1, background: 'rgba(128,0,32,0.08)', margin: '4px 12px' }} />
                )}
                <GroupLabel label="NPCs" />
                {npcs.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectPersonagem(p)}
                    className="flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors hover:opacity-80"
                    style={{ background: selectedPersonagem?.id === p.id ? 'rgba(128,0,32,0.08)' : 'transparent' }}
                  >
                    <Avatar p={p} size={6} />
                    <span className="text-xs" style={{ color: '#906070' }}>{p.nome}</span>
                  </button>
                ))}
              </>
            )}

            {personagens.length === 0 && (
              <p className="px-3 py-2 text-xs" style={{ color: '#906070' }}>
                Nenhum personagem criado ainda.
              </p>
            )}
          </div>
        )}
      </div>

      {/* Toolbar de formatação */}
      <div className="flex gap-1 mb-2">
        {([['bold', Bold, 'Negrito'], ['italic', Italic, 'Itálico'], ['underline', Underline, 'Sublinhado'], ['strikethrough', Strikethrough, 'Riscado']] as const).map(([fmt, Icon, label]) => (
          <button
            key={fmt}
            type="button"
            title={label}
            onClick={() => applyFormat(fmt)}
            className="p-1.5 rounded-md transition-opacity hover:opacity-70"
            style={{ background: 'rgba(128,0,32,0.07)', color: '#800020' }}
          >
            <Icon size={12} />
          </button>
        ))}
      </div>

      {/* Área de texto + botão */}
      <div
        className="flex gap-2 items-end rounded-xl px-4 py-3"
        style={{
          background: 'rgba(255,255,255,0.65)',
          border: '0.5px solid rgba(128,0,32,0.12)',
          boxShadow: '0 2px 12px rgba(40,5,15,0.05)',
        }}
      >
        {/* Overlay: mirror atrás + textarea por cima */}
        <div className="relative flex-1" style={{ minHeight: '1.5rem' }}>
          {/* Mirror - renderiza o markdown formatado */}
          <div
            ref={mirrorRef}
            aria-hidden
            style={{
              ...SHARED_TEXT_STYLE,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              color: '#2E0510',
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            {conteudo === ''
              ? <span style={{ color: 'rgba(144,96,112,0.55)' }}>{`Escreva como ${povNome}...`}</span>
              : renderWithMarkers(conteudo)
            }
          </div>

          {/* Textarea - texto invisível, cursor visível */}
          <textarea
            ref={textareaRef}
            value={conteudo}
            onChange={e => { setConteudo(e.target.value); autoResize(e.target) }}
            onKeyDown={e => {
              if (e.key === 'Enter' && e.ctrlKey) handleSubmit(e as unknown as React.FormEvent)
            }}
            rows={1}
            aria-label={`Escreva como ${povNome}`}
            className="relative w-full outline-none resize-none bg-transparent"
            style={{
              ...SHARED_TEXT_STYLE,
              color: 'transparent',
              caretColor: '#2E0510',
              minHeight: '1.5rem',
              maxHeight: '16rem',
              overflowY: 'auto',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading || !conteudo.trim()}
          className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center disabled:opacity-30 transition-opacity hover:opacity-80"
          style={{ background: '#800020', color: '#FAF0F2' }}
        >
          <Send size={14} />
        </button>
      </div>
      <p className="text-[10px] mt-1.5 ml-1" style={{ color: '#B09098' }}>
        Ctrl+Enter para enviar
      </p>
    </form>
  )
}
