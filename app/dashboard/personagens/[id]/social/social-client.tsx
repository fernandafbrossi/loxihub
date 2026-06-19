'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { TwitterTab } from './twitter-tab'
import { InstagramTab } from './instagram-tab'
import { ArrowLeft, Settings, ChevronDown, Plus, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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
  capa_url?: string | null
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
  personagemId, personagem, contas: initialContas, posts, userId,
  todosPersonagens, curtidasIniciais, comentariosIniciais,
}: Props) {
  const [tab, setTab] = useState<'twitter' | 'instagram'>('instagram')
  const [actingAs, setActingAs] = useState<PersonagemBasic | null>(todosPersonagens[0] ?? null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  const [contas, setContas] = useState(initialContas)
  const twitterContas = contas.filter(c => c.tipo === 'twitter')
  const instagramContas = contas.filter(c => c.tipo === 'instagram')

  const [selectedTwitterId, setSelectedTwitterId] = useState<string | null>(twitterContas[0]?.id ?? null)
  const [selectedInstagramId, setSelectedInstagramId] = useState<string | null>(instagramContas[0]?.id ?? null)
  const [creatingConta, setCreatingConta] = useState(false)
  const [novaNome, setNovaNome] = useState('')
  const [criandoConta, setCriandoConta] = useState(false)
  const instagramNewPostFnRef = useRef<(() => void) | null>(null)

  const currentTwitterConta = twitterContas.find(c => c.id === selectedTwitterId) ?? twitterContas[0] ?? null
  const currentInstagramConta = instagramContas.find(c => c.id === selectedInstagramId) ?? instagramContas[0] ?? null
  const currentConta = tab === 'twitter' ? currentTwitterConta : currentInstagramConta

  const twitterContaIds = new Set(twitterContas.map(c => c.id))
  const instagramContaIds = new Set(instagramContas.map(c => c.id))

  const twitterPosts = posts.filter(p =>
    twitterContaIds.has(p.conta_id ?? '') || (!p.conta_id && (!p.tipo || p.tipo === 'twitter'))
  )
  const instagramPosts = posts.filter(p =>
    instagramContaIds.has(p.conta_id ?? '') || (!p.conta_id && p.tipo === 'instagram')
  )

  const currentInstagramPostCount = instagramPosts.filter(p =>
    p.conta_id === currentInstagramConta?.id
  ).length

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) setPickerOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function criarConta() {
    if (!novaNome.trim()) return
    setCriandoConta(true)
    const supabase = createClient()
    const { data } = await supabase.from('contas_sociais')
      .insert({ personagem_id: personagemId, tipo: tab, nome: novaNome.trim() })
      .select().single()
    if (data) {
      const nova = data as Conta
      setContas(prev => [...prev, nova])
      if (tab === 'twitter') setSelectedTwitterId(nova.id)
      else setSelectedInstagramId(nova.id)
    }
    setNovaNome(''); setCreatingConta(false); setCriandoConta(false)
  }

  const handle = currentConta?.username
    ? `@${currentConta.username}`
    : `@${personagem.nome.toLowerCase().replace(/\s+/g, '_')}`

  const currentContas = tab === 'twitter' ? twitterContas : instagramContas
  const selectedId = tab === 'twitter' ? selectedTwitterId : selectedInstagramId
  const setSelectedId = tab === 'twitter' ? setSelectedTwitterId : setSelectedInstagramId

  const commonTabProps = {
    personagemId,
    personagem,
    userId,
    actingAs,
    todosPersonagens,
    curtidas: curtidasIniciais,
    comentarios: comentariosIniciais,
  }

  return (
    <div className="min-h-full flex justify-center relative px-6 py-6" style={{ background: '#FAF0F2' }}>
      {/* ── Botões flutuantes nas extremidades ── */}
      <Link href={`/dashboard/personagens/${personagemId}`}
        className="absolute left-6 top-6 flex items-center gap-1.5 text-xs hover:opacity-70 transition-opacity z-10"
        style={{ color: '#906070' }}>
        <ArrowLeft size={12} /> Perfil
      </Link>
      <Link href={`/dashboard/personagens/${personagemId}/social/editar`}
        className="absolute right-6 top-6 hover:opacity-70 transition-opacity z-10"
        style={{ color: '#906070' }}>
        <Settings size={13} />
      </Link>

    <div style={{ width: '100%', maxWidth: 760, background: '#FFFFFF', borderRadius: 16, overflow: 'hidden', minHeight: '100%' }}>
      {/* ── Header dinâmico ── */}
      {tab === 'instagram' ? (
        /* Instagram header */
        <div className="px-4 pt-10 pb-3" style={{ borderBottom: '0.5px solid rgba(128,0,32,0.08)' }}>
          <div className="flex items-center justify-center mb-4">
            <p className="text-sm font-semibold" style={{ color: '#2E0510' }}>
              {currentInstagramConta?.username ?? personagem.nome.toLowerCase().replace(/\s+/g, '_')}
            </p>
          </div>

          <div className="flex items-center gap-5 mb-3">
            <div
              className="w-[76px] h-[76px] rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-2xl"
              style={{ background: 'linear-gradient(135deg, #800020, #5C0018)', color: '#FAF0F2' }}
            >
              {(currentInstagramConta?.foto_url ?? personagem.foto_url)
                ? <img src={currentInstagramConta?.foto_url ?? personagem.foto_url ?? ''} alt="" className="w-full h-full object-cover" />
                : personagem.nome[0].toUpperCase()
              }
            </div>
            <div className="flex gap-5 flex-1">
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: '#2E0510' }}>{currentInstagramPostCount}</p>
                <p className="text-[10px]" style={{ color: '#906070' }}>publicações</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: '#2E0510' }}>{(currentInstagramConta?.seguidores ?? 0).toLocaleString('pt-BR')}</p>
                <p className="text-[10px]" style={{ color: '#906070' }}>seguidores</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: '#2E0510' }}>{(currentInstagramConta?.seguindo ?? 0).toLocaleString('pt-BR')}</p>
                <p className="text-[10px]" style={{ color: '#906070' }}>seguindo</p>
              </div>
            </div>
          </div>

          <p className="text-xs font-semibold" style={{ color: '#2E0510' }}>{personagem.nome}</p>
          {currentInstagramConta?.bio && (
            <p className="text-xs mt-1 leading-relaxed" style={{ color: '#2E0510' }}>{currentInstagramConta.bio}</p>
          )}
        </div>
      ) : (
        /* Twitter header — simples, sem banner */
        <div className="px-4 pt-4 pb-3" style={{ borderBottom: '0.5px solid rgba(128,0,32,0.08)' }}>
          <div className="flex items-center gap-3 mb-2 mt-6">
            <div
              className="w-14 h-14 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-xl"
              style={{ background: 'linear-gradient(135deg, #800020, #5C0018)', color: '#FAF0F2' }}
            >
              {(currentTwitterConta?.foto_url ?? personagem.foto_url)
                ? <img src={currentTwitterConta?.foto_url ?? personagem.foto_url ?? ''} alt="" className="w-full h-full object-cover" />
                : personagem.nome[0].toUpperCase()
              }
            </div>
            <div>
              <h1 className="text-sm font-bold leading-tight" style={{ color: '#2E0510' }}>{personagem.nome}</h1>
              <p className="text-xs mt-0.5" style={{ color: '#906070' }}>{handle}</p>
            </div>
          </div>

          {currentTwitterConta?.bio && (
            <p className="text-xs mt-1 leading-relaxed" style={{ color: '#2E0510' }}>{currentTwitterConta.bio}</p>
          )}
          {((currentTwitterConta?.seguindo ?? 0) > 0 || (currentTwitterConta?.seguidores ?? 0) > 0) && (
            <div className="flex gap-4 mt-2">
              <span className="text-xs" style={{ color: '#906070' }}>
                <strong style={{ color: '#2E0510' }}>{(currentTwitterConta?.seguindo ?? 0).toLocaleString('pt-BR')}</strong> seguindo
              </span>
              <span className="text-xs" style={{ color: '#906070' }}>
                <strong style={{ color: '#2E0510' }}>{(currentTwitterConta?.seguidores ?? 0).toLocaleString('pt-BR')}</strong> seguidores
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Tab switcher ── */}
      <div className="flex border-b mx-0" style={{ borderColor: 'rgba(128,0,32,0.10)' }}>
        <button
          onClick={() => setTab('instagram')}
          className="flex items-center gap-2 px-6 py-3 text-xs font-medium transition-all relative"
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
        <button
          onClick={() => setTab('twitter')}
          className="flex items-center gap-2 px-6 py-3 text-xs font-medium transition-all relative"
          style={{ color: tab === 'twitter' ? '#800020' : '#B09098' }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.856L2 2.25h6.845l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
          </svg>
          Twitter
          {tab === 'twitter' && <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full" style={{ background: '#800020' }} />}
        </button>
      </div>

      {/* ── Seletores de conta + nova conta ── */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1 flex-wrap">
        {currentContas.map(c => (
          <button key={c.id}
            onClick={() => setSelectedId(c.id)}
            className="text-[11px] px-2.5 py-1 rounded-full font-medium transition-all"
            style={{
              background: c.id === selectedId ? '#800020' : 'rgba(128,0,32,0.07)',
              color: c.id === selectedId ? '#FAF0F2' : '#906070',
            }}>
            {c.username ? `@${c.username}` : c.nome}
          </button>
        ))}
        {tab === 'instagram' && !creatingConta && (
          <button
            onClick={() => instagramNewPostFnRef.current?.()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-opacity hover:opacity-70 ml-auto"
            style={{ background: 'rgba(128,0,32,0.10)', color: '#800020' }}>
            <Plus size={13} /> novo post
          </button>
        )}
        {creatingConta ? (
          <div className="flex items-center gap-1.5">
            <input
              value={novaNome} onChange={e => setNovaNome(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') criarConta(); if (e.key === 'Escape') { setCreatingConta(false); setNovaNome('') } }}
              placeholder="nome da conta" autoFocus
              className="text-[11px] px-2.5 py-1 rounded-xl outline-none w-28"
              style={{ background: 'rgba(255,255,255,0.90)', border: '0.5px solid rgba(128,0,32,0.20)', color: '#2E0510' }}
            />
            <button onClick={criarConta} disabled={criandoConta || !novaNome.trim()}
              className="text-[11px] px-2.5 py-1 rounded-full font-medium disabled:opacity-40"
              style={{ background: '#800020', color: '#FAF0F2' }}>
              {criandoConta ? '...' : 'Criar'}
            </button>
            <button onClick={() => { setCreatingConta(false); setNovaNome('') }} style={{ color: '#B09098' }}>
              <X size={12} />
            </button>
          </div>
        ) : (
          <button onClick={() => setCreatingConta(true)}
            className="flex items-center gap-1 text-[11px] transition-opacity hover:opacity-70"
            style={{ color: '#B09098' }}>
            <Plus size={12} /> nova conta
          </button>
        )}
      </div>

      {/* ── Agindo como ── */}
      <div className="px-4 pb-1">
        <div className="relative inline-block" ref={pickerRef}>
          <button
            onClick={() => setPickerOpen(v => !v)}
            className="flex items-center gap-2 text-xs px-3 py-1.5 rounded-xl transition-opacity hover:opacity-80"
            style={{ background: 'rgba(128,0,32,0.07)', border: '0.5px solid rgba(128,0,32,0.12)', color: '#906070' }}
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
            <div className="absolute top-full left-0 mt-1 z-20 rounded-xl overflow-hidden py-1 min-w-[180px]"
              style={{ background: 'rgba(255,255,255,0.97)', border: '0.5px solid rgba(128,0,32,0.12)', boxShadow: '0 8px 24px rgba(40,5,15,0.12)', backdropFilter: 'blur(8px)' }}>
              {todosPersonagens.map(p => (
                <button key={p.id}
                  onClick={() => { setActingAs(p); setPickerOpen(false) }}
                  className="flex items-center gap-2.5 w-full px-3 py-2 text-left transition-colors hover:opacity-75"
                  style={{ background: actingAs?.id === p.id ? 'rgba(128,0,32,0.07)' : 'transparent' }}>
                  <CharAvatar p={p} size={24} />
                  <span className="text-xs font-medium" style={{ color: '#2E0510' }}>{p.nome}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Conteúdo da aba ── */}
      <div className="px-4 pt-3 pb-8">
        {tab === 'twitter'
          ? <TwitterTab {...commonTabProps} currentConta={currentTwitterConta} allPosts={twitterPosts} />
          : <InstagramTab {...commonTabProps} currentConta={currentInstagramConta} allPosts={instagramPosts} onNewPostRef={fn => { instagramNewPostFnRef.current = fn }} />
        }
      </div>
    </div>
    </div>
  )
}

export function CharAvatar({ p, size }: { p: PersonagemBasic; size: number }) {
  return (
    <div className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.4, background: 'linear-gradient(135deg, #800020, #5C0018)', color: '#FAF0F2' }}>
      {p.foto_url
        ? <img src={p.foto_url} alt={p.nome} className="w-full h-full object-cover" />
        : p.nome[0].toUpperCase()
      }
    </div>
  )
}

export function AccountAvatar({ conta, personagem, size }: {
  conta: Conta | null
  personagem: { nome: string; foto_url: string | null }
  size: number
}) {
  const fotoUrl = conta?.foto_url ?? personagem.foto_url
  return (
    <div className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-semibold"
      style={{ width: size, height: size, minWidth: size, minHeight: size, fontSize: size * 0.38, background: 'linear-gradient(135deg, #800020, #5C0018)', color: '#FAF0F2' }}>
      {fotoUrl
        ? <img src={fotoUrl} alt="" className="w-full h-full object-cover" />
        : personagem.nome[0].toUpperCase()
      }
    </div>
  )
}
