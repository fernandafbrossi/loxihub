'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Send } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { MarkdownText } from '@/components/markdown-text'
import { PersonagemAvatar } from '../avatar'

type Pers = { id: string; nome: string; foto_url: string | null }
type Msg = { id: string; personagem_id: string; conteudo: string; criado_por: string | null; created_at: string }

const LAST_KEY = (conversaId: string) => `loxihub_dm_remetente_${conversaId}`

function diaLabel(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: 'long' })
}

export function Chat({
  conversaId, a, b, userId, inicial, voltarHref,
}: {
  conversaId: string
  a: Pers
  b: Pers
  userId: string
  inicial: Msg[]
  voltarHref: string
}) {
  const [msgs, setMsgs] = useState<Msg[]>(inicial)
  const [texto, setTexto] = useState('')
  const [remetenteId, setRemetenteId] = useState<string>(a.id)
  const [enviando, setEnviando] = useState(false)
  const fimRef = useRef<HTMLDivElement>(null)

  // lembra quem estava "digitando" nessa conversa
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LAST_KEY(conversaId))
      if (saved === a.id || saved === b.id) setRemetenteId(saved)
    } catch {}
  }, [conversaId, a.id, b.id])

  // realtime: mensagens novas (da outra usuária ou de outra aba)
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`dm-${conversaId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'dm_mensagens', filter: `conversa_id=eq.${conversaId}` },
        payload => {
          const nova = payload.new as Msg
          setMsgs(prev => (prev.some(m => m.id === nova.id) ? prev : [...prev, nova]))
        }
      )
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [conversaId])

  useEffect(() => {
    fimRef.current?.scrollIntoView({ block: 'end' })
  }, [msgs.length])

  function escolher(id: string) {
    setRemetenteId(id)
    try { localStorage.setItem(LAST_KEY(conversaId), id) } catch {}
  }

  async function enviar() {
    const conteudo = texto.trim()
    if (!conteudo || enviando) return
    setEnviando(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('dm_mensagens')
      .insert({ conversa_id: conversaId, personagem_id: remetenteId, conteudo, criado_por: userId })
      .select('id, personagem_id, conteudo, criado_por, created_at')
      .single()
    setEnviando(false)
    if (error || !data) {
      alert('Não foi possível enviar. Tente novamente.')
      return
    }
    setTexto('')
    setMsgs(prev => (prev.some(m => m.id === data.id) ? prev : [...prev, data]))
  }

  const porId: Record<string, Pers> = { [a.id]: a, [b.id]: b }
  const remetente = porId[remetenteId]

  return (
    <div className="flex flex-col h-[100dvh] md:h-[calc(100vh-40px)]">
      {/* Header */}
      <div
        className="flex-shrink-0 flex items-center gap-3 px-4 pt-[52px] pb-3 md:pt-4"
        style={{ borderBottom: '0.5px solid var(--p-08)' }}
      >
        <Link href={voltarHref} className="p-1 -ml-1 hover:opacity-70" style={{ color: 'var(--foreground-muted)' }}>
          <ArrowLeft size={18} />
        </Link>
        <div className="flex -space-x-2">
          <PersonagemAvatar nome={a.nome} foto_url={a.foto_url} size={32} />
          <PersonagemAvatar nome={b.nome} foto_url={b.foto_url} size={32} />
        </div>
        <p className="text-sm font-medium truncate" style={{ color: 'var(--foreground)' }}>
          {a.nome} &amp; {b.nome}
        </p>
      </div>

      {/* Mensagens */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {msgs.length === 0 && (
          <p className="text-center text-xs py-12" style={{ color: 'var(--muted-light)' }}>
            Nenhuma mensagem ainda. Escolha quem está digitando e comece.
          </p>
        )}
        {msgs.map((m, i) => {
          const prev = msgs[i - 1]
          const novoDia = !prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString()
          const mesmoAutor = !!prev && !novoDia && prev.personagem_id === m.personagem_id
          const direita = m.personagem_id === a.id
          const autor = porId[m.personagem_id]
          return (
            <div key={m.id}>
              {novoDia && (
                <p className="text-center text-[10px] my-3 capitalize" style={{ color: 'var(--muted-light)' }}>
                  {diaLabel(m.created_at)}
                </p>
              )}
              <div className={`flex items-end gap-2 ${direita ? 'justify-end' : 'justify-start'} ${mesmoAutor ? 'mt-0.5' : 'mt-2'}`}>
                {!direita && (
                  <div style={{ width: 24 }}>
                    {!mesmoAutor && autor && <PersonagemAvatar nome={autor.nome} foto_url={autor.foto_url} size={24} />}
                  </div>
                )}
                <div
                  className="max-w-[78%] px-3.5 py-2 text-sm leading-snug break-words"
                  style={{
                    borderRadius: 18,
                    background: direita ? 'var(--btn-primary)' : 'var(--card)',
                    color: direita ? 'var(--primary-foreground)' : 'var(--foreground)',
                    border: direita ? 'none' : '0.5px solid var(--p-10)',
                  }}
                >
                  <MarkdownText text={m.conteudo} />
                  <span className="block text-[9px] mt-0.5 text-right opacity-60">
                    {new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={fimRef} />
      </div>

      {/* Compositor */}
      <div
        className="flex-shrink-0 px-4 pt-3"
        style={{ borderTop: '0.5px solid var(--p-08)', paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px]" style={{ color: 'var(--muted-light)' }}>Digitando como</span>
          {[a, b].map(p => (
            <button
              key={p.id}
              type="button"
              onClick={() => escolher(p.id)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs transition-opacity"
              style={{
                background: remetenteId === p.id ? 'var(--p-15)' : 'transparent',
                color: 'var(--foreground)',
                opacity: remetenteId === p.id ? 1 : 0.5,
              }}
            >
              <PersonagemAvatar nome={p.nome} foto_url={p.foto_url} size={18} />
              {p.nome}
            </button>
          ))}
        </div>
        <div
          className="flex items-end gap-2 rounded-2xl px-3 py-2"
          style={{ background: 'rgba(255,255,255,0.65)', border: '0.5px solid var(--p-12)' }}
        >
          <textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            onKeyDown={e => {
              // Enter envia no desktop; no celular Enter quebra linha
              if (e.key === 'Enter' && !e.shiftKey && window.matchMedia('(min-width: 768px)').matches) {
                e.preventDefault()
                enviar()
              }
            }}
            rows={1}
            placeholder={`Mensagem como ${remetente.nome}…`}
            className="flex-1 resize-none bg-transparent outline-none text-sm max-h-32 py-1.5"
            style={{ color: 'var(--foreground)' }}
          />
          <button
            type="button"
            onClick={enviar}
            disabled={enviando || !texto.trim()}
            className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center disabled:opacity-30"
            style={{ background: 'var(--btn-primary)', color: 'var(--primary-foreground)' }}
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
