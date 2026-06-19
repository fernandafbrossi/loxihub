'use client'

import { useState, useRef, useEffect } from 'react'
import { TwitterTab } from './twitter-tab'
import { InstagramTab } from './instagram-tab'
import { ChevronDown } from 'lucide-react'

export interface PersonagemBasic {
  id: string
  nome: string
  foto_url: string | null
}

export interface Curtida {
  id: string
  post_id: string
  personagem_id: string
}

export interface Comentario {
  id: string
  post_id: string
  personagem_id: string
  conteudo: string
  created_at: string
  personagens: PersonagemBasic | null
}

export interface Conta {
  id: string
  tipo: 'twitter' | 'instagram'
  nome: string
  username: string | null
  bio: string | null
  foto_url: string | null
  seguidores: number
  seguindo: number
}

export interface Post {
  id: string
  conteudo: string
  midia_url: string | null
  curtidas: number
  comentarios: number
  retweets: number
  criado_por: string
  created_at: string
  tipo: string | null
  data_post: string | null
  conta_id: string | null
}

interface Personagem {
  id: string
  nome: string
  foto_url: string | null
}

interface Props {
  personagemId: string
  personagem: Personagem
  contas: Conta[]
  posts: Post[]
  userId: string
  todosPersonagens: PersonagemBasic[]
  curtidasIniciais: Curtida[]
  comentariosIniciais: Comentario[]
}

export function SocialClient({
  personagemId, personagem, contas, posts, userId,
  todosPersonagens, curtidasIniciais, comentariosIniciais,
}: Props) {
  const [tab, setTab] = useState<'twitter' | 'instagram'>('twitter')
  const [actingAs, setActingAs] = useState<PersonagemBasic | null>(todosPersonagens[0] ?? null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const twitterContas = contas.filter(c => c.tipo === 'twitter')
  const instagramContas = contas.filter(c => c.tipo === 'instagram')
  const twitterContaIds = new Set(twitterContas.map(c => c.id))
  const instagramContaIds = new Set(instagramContas.map(c => c.id))

  const twitterPosts = posts.filter(p =>
    twitterContaIds.has(p.conta_id ?? '') || (!p.conta_id && (!p.tipo || p.tipo === 'twitter'))
  )
  const instagramPosts = posts.filter(p =>
    instagramContaIds.has(p.conta_id ?? '') || (!p.conta_id && p.tipo === 'instagram')
  )

  const commonProps = {
    personagemId,
    personagem,
    userId,
    actingAs,
    todosPersonagens,
    curtidas: curtidasIniciais,
    comentarios: comentariosIniciais,
  }

  return (
    <div>
      {/* Seletor "Agindo como" */}
      <div className="mx-6 mb-2 mt-3">
        <div className="relative inline-block" ref={pickerRef}>
          <button
            onClick={() => setPickerOpen(v => !v)}
            className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl transition-opacity hover:opacity-80"
            style={{
              background: 'rgba(128,0,32,0.07)',
              border: '0.5px solid rgba(128,0,32,0.12)',
              color: '#906070',
            }}
          >
            <span style={{ color: '#B09098' }}>Agindo como</span>
            {actingAs ? (
              <>
                <CharAvatar p={actingAs} size={18} />
                <span className="font-medium" style={{ color: '#2E0510' }}>{actingAs.nome}</span>
              </>
            ) : (
              <span style={{ color: '#B09098' }}>ninguém</span>
            )}
            <ChevronDown size={11} style={{ color: '#B09098' }} />
          </button>

          {pickerOpen && (
            <div
              className="absolute top-full left-0 mt-1 z-20 rounded-xl overflow-hidden py-1 min-w-[180px]"
              style={{
                background: 'rgba(255,255,255,0.97)',
                border: '0.5px solid rgba(128,0,32,0.12)',
                boxShadow: '0 8px 24px rgba(40,5,15,0.12)',
                backdropFilter: 'blur(8px)',
              }}
            >
              {todosPersonagens.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setActingAs(p); setPickerOpen(false) }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors hover:opacity-75"
                  style={{ background: actingAs?.id === p.id ? 'rgba(128,0,32,0.07)' : 'transparent' }}
                >
                  <CharAvatar p={p} size={24} />
                  <span className="text-xs font-medium" style={{ color: '#2E0510' }}>{p.nome}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Tab switcher */}
      <div className="flex border-b mx-6 mt-2" style={{ borderColor: 'rgba(128,0,32,0.10)' }}>
        <button
          onClick={() => setTab('twitter')}
          className="flex items-center gap-2 px-4 py-3 text-xs font-medium transition-all relative"
          style={{ color: tab === 'twitter' ? '#800020' : '#B09098' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.856L2 2.25h6.845l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
          </svg>
          Twitter
          {tab === 'twitter' && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: '#800020' }} />}
        </button>

        <button
          onClick={() => setTab('instagram')}
          className="flex items-center gap-2 px-4 py-3 text-xs font-medium transition-all relative"
          style={{ color: tab === 'instagram' ? '#800020' : '#B09098' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
          </svg>
          Instagram
          {tab === 'instagram' && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: '#800020' }} />}
        </button>
      </div>

      <div className="px-6 pt-5 pb-8">
        {tab === 'twitter'
          ? <TwitterTab {...commonProps} contas={twitterContas} allPosts={twitterPosts} />
          : <InstagramTab {...commonProps} contas={instagramContas} allPosts={instagramPosts} />
        }
      </div>
    </div>
  )
}

export function CharAvatar({ p, size }: { p: PersonagemBasic; size: number }) {
  return (
    <div
      className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-semibold"
      style={{
        width: size, height: size, fontSize: size * 0.4,
        background: 'linear-gradient(135deg, #800020, #5C0018)',
        color: '#FAF0F2',
      }}
    >
      {p.foto_url
        ? <img src={p.foto_url} alt={p.nome} className="w-full h-full object-cover" />
        : p.nome[0].toUpperCase()
      }
    </div>
  )
}

export function AccountAvatar({
  conta, personagem, size,
}: {
  conta: Conta | null
  personagem: { nome: string; foto_url: string | null }
  size: number
}) {
  const fotoUrl = conta?.foto_url ?? personagem.foto_url
  return (
    <div
      className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-semibold"
      style={{
        width: size, height: size, minWidth: size, minHeight: size, fontSize: size * 0.38,
        background: 'linear-gradient(135deg, #800020, #5C0018)',
        color: '#FAF0F2',
      }}
    >
      {fotoUrl
        ? <img src={fotoUrl} alt="" className="w-full h-full object-cover" />
        : personagem.nome[0].toUpperCase()
      }
    </div>
  )
}
