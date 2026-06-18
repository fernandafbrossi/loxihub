'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, ScrollText, MessageCircle, Heart, CornerUpLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import type { RealtimeChannel } from '@supabase/supabase-js'

type Notificacao = {
  id: string
  tipo: string
  texto: string
  url: string | null
  lida: boolean
  created_at: string
}

function tempoAtras(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const min = Math.floor(diff / 60000)
  if (min < 1) return 'agora'
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h}h`
  return `${Math.floor(h / 24)}d`
}

function TipoIcon({ tipo }: { tipo: string }) {
  const cls = 'flex-shrink-0 mt-0.5'
  const size = 13
  switch (tipo) {
    case 'novo_post':             return <ScrollText   size={size} className={cls} style={{ color: '#800020' }} />
    case 'comentario_instagram':  return <MessageCircle size={size} className={cls} style={{ color: '#800020' }} />
    case 'curtida_instagram':     return <Heart         size={size} className={cls} style={{ color: '#800020' }} />
    case 'reply_tweet':           return <CornerUpLeft  size={size} className={cls} style={{ color: '#800020' }} />
    default:                      return <Bell          size={size} className={cls} style={{ color: '#800020' }} />
  }
}

type Placement = 'up' | 'right'

export function NotificationBell({ placement = 'up' }: { placement?: Placement }) {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([])
  const [open, setOpen] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const naoLidas = notificacoes.filter(n => !n.lida).length

  useEffect(() => {
    const supabase = createClient()
    let channel: RealtimeChannel

    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      setUserId(user.id)

      const { data } = await supabase
        .from('notificacoes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (data) setNotificacoes(data)

      channel = supabase
        .channel(`notificacoes:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notificacoes',
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            setNotificacoes(prev => [payload.new as Notificacao, ...prev])
          }
        )
        .subscribe()
    }

    init()
    return () => { channel?.unsubscribe() }
  }, [])

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function marcarTodasLidas() {
    if (!userId) return
    const supabase = createClient()
    await supabase
      .from('notificacoes')
      .update({ lida: true })
      .eq('user_id', userId)
      .eq('lida', false)
    setNotificacoes(prev => prev.map(n => ({ ...n, lida: true })))
  }

  async function marcarLida(id: string) {
    const supabase = createClient()
    await supabase.from('notificacoes').update({ lida: true }).eq('id', id)
    setNotificacoes(prev => prev.map(n => n.id === id ? { ...n, lida: true } : n))
  }

  const dropdownPos = placement === 'right'
    ? 'left-full top-auto bottom-0 ml-2'
    : 'bottom-full left-0 mb-2'

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="relative w-7 h-7 flex items-center justify-center rounded-lg hover:opacity-70 transition-opacity"
        style={{ color: '#906070' }}
        title="Notificações"
      >
        <Bell size={15} />
        {naoLidas > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center"
            style={{ background: '#800020', color: '#FAF0F2' }}
          >
            {naoLidas > 9 ? '9+' : naoLidas}
          </span>
        )}
      </button>

      {open && (
        <div
          className={`absolute ${dropdownPos} w-72 rounded-xl overflow-hidden z-50`}
          style={{
            background: 'rgba(247,240,243,0.98)',
            border: '0.5px solid rgba(128,0,32,0.15)',
            boxShadow: '0 8px 32px rgba(40,5,15,0.18)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: '0.5px solid rgba(128,0,32,0.10)' }}
          >
            <span className="text-xs font-semibold" style={{ color: '#2E0510' }}>
              Notificações
            </span>
            {naoLidas > 0 && (
              <button
                onClick={marcarTodasLidas}
                className="text-[10px] hover:opacity-70 transition-opacity"
                style={{ color: '#800020' }}
              >
                Marcar tudo como lido
              </button>
            )}
          </div>

          {/* Lista */}
          <div className="max-h-80 overflow-y-auto">
            {notificacoes.length === 0 ? (
              <p className="text-center text-[11px] py-8" style={{ color: '#B09098' }}>
                Nenhuma notificação ainda
              </p>
            ) : (
              notificacoes.map(n => {
                const inner = (
                  <div className="flex items-start gap-3 px-4 py-3">
                    <TipoIcon tipo={n.tipo} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] leading-snug" style={{ color: '#2E0510' }}>
                        {n.texto}
                      </p>
                      <p className="text-[10px] mt-0.5" style={{ color: '#B09098' }}>
                        {tempoAtras(n.created_at)}
                      </p>
                    </div>
                    {!n.lida && (
                      <div
                        className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1.5"
                        style={{ background: '#800020' }}
                      />
                    )}
                  </div>
                )

                return (
                  <div
                    key={n.id}
                    style={{
                      background: n.lida ? 'transparent' : 'rgba(128,0,32,0.04)',
                      borderBottom: '0.5px solid rgba(128,0,32,0.06)',
                    }}
                  >
                    {n.url ? (
                      <Link
                        href={n.url}
                        onClick={() => { marcarLida(n.id); setOpen(false) }}
                        className="block hover:bg-[rgba(128,0,32,0.04)] transition-colors"
                      >
                        {inner}
                      </Link>
                    ) : (
                      <button
                        onClick={() => marcarLida(n.id)}
                        className="w-full text-left hover:bg-[rgba(128,0,32,0.04)] transition-colors"
                      >
                        {inner}
                      </button>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
