'use client'

import { useState, useRef, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Send, ChevronDown } from 'lucide-react'

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
  const cls = `w-${size} h-${size} rounded-full flex-shrink-0`
  return p.foto_url ? (
    <img src={p.foto_url} alt={p.nome} className={`${cls} object-cover`} />
  ) : (
    <div
      className={`${cls} flex items-center justify-center font-medium`}
      style={{
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

export function PostForm({ threadId, personagemPrincipal, personagens }: PostFormProps) {
  const [conteudo, setConteudo] = useState('')
  const [loading, setLoading] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

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
    setLoading(false)
    router.refresh()
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

      {/* Área de texto + botão */}
      <div
        className="flex gap-2 items-end rounded-xl px-4 py-3"
        style={{
          background: 'rgba(255,255,255,0.65)',
          border: '0.5px solid rgba(128,0,32,0.12)',
          boxShadow: '0 2px 12px rgba(40,5,15,0.05)',
        }}
      >
        <textarea
          value={conteudo}
          onChange={e => setConteudo(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter' && e.ctrlKey) handleSubmit(e as unknown as React.FormEvent)
          }}
          rows={2}
          placeholder={`Escreva como ${povNome}... (**negrito**, *itálico*, __sublinhado__)`}
          className="flex-1 text-sm outline-none resize-none bg-transparent leading-relaxed"
          style={{ color: '#2E0510' }}
        />
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
        Ctrl+Enter para enviar · **negrito** · *itálico* · __sublinhado__ · ~~riscado~~
      </p>
    </form>
  )
}
