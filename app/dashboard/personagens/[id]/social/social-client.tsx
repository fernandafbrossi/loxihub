'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { InstagramTab } from './instagram-tab'
import { ArrowLeft, Settings, ChevronDown, Plus } from 'lucide-react'

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
  tipo: 'instagram'
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
  const [actingAs, setActingAs] = useState<PersonagemBasic | null>(todosPersonagens[0] ?? null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const pickerRef = useRef<HTMLDivElement>(null)

  const [contas, setContas] = useState(initialContas)
  const instagramContas = contas.filter(c => c.tipo === 'instagram')

  const [selectedInstagramId, setSelectedInstagramId] = useState<string | null>(instagramContas[0]?.id ?? null)
  const instagramNewPostFnRef = useRef<(() => void) | null>(null)

  const currentInstagramConta = instagramContas.find(c => c.id === selectedInstagramId) ?? instagramContas[0] ?? null
  const currentConta = currentInstagramConta

  const instagramContaIds = new Set(instagramContas.map(c => c.id))

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


  const handle = currentConta?.username
    ? `@${currentConta.username}`
    : `@${personagem.nome.toLowerCase().replace(/\s+/g, '_')}`

  const currentContas = instagramContas
  const selectedId = selectedInstagramId
  const setSelectedId = setSelectedInstagramId

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
    <div className="min-h-full flex justify-center relative px-4 py-4" style={{ background: 'var(--primary-foreground)' }}>
      {/* ── Botões flutuantes nas extremidades ── */}
      <Link href={`/dashboard/personagens/${personagemId}`}
        className="absolute left-6 top-6 flex items-center gap-1.5 text-xs hover:opacity-70 transition-opacity z-10"
        style={{ color: 'var(--foreground-muted)' }}>
        <ArrowLeft size={12} /> Perfil
      </Link>
      <Link href={`/dashboard/personagens/${personagemId}/social/editar`}
        className="absolute right-6 top-6 hover:opacity-70 transition-opacity z-10"
        style={{ color: 'var(--foreground-muted)' }}>
        <Settings size={17} />
      </Link>

    <div style={{ width: '100%', maxWidth: 1100, background: '#FFFFFF', borderRadius: 16, overflow: 'hidden', minHeight: '100%', position: 'relative' }}>

      {/* ── Agindo como (dentro do card branco) ── */}
      <div className="absolute right-14 top-4 z-10" ref={pickerRef}>
        <button
          onClick={() => setPickerOpen(v => !v)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl transition-opacity hover:opacity-80"
          style={{ background: 'var(--p-07)', border: '0.5px solid var(--p-12)', color: 'var(--foreground-muted)', fontSize: 11 }}
        >
          <span style={{ color: 'var(--muted-light)' }}>Agindo como</span>
          {actingAs ? (
            <>
              <CharAvatar p={actingAs} size={16} />
              <span className="font-medium" style={{ color: 'var(--foreground)' }}>{actingAs.nome}</span>
            </>
          ) : (
            <span style={{ color: 'var(--muted-light)' }}>ninguém</span>
          )}
          <ChevronDown size={10} style={{ color: 'var(--muted-light)' }} />
        </button>
        {pickerOpen && (
          <div className="absolute top-full right-0 mt-1 z-20 rounded-xl overflow-hidden py-1 min-w-[160px]"
            style={{ background: 'rgba(255,255,255,0.97)', border: '0.5px solid var(--p-12)', boxShadow: '0 8px 24px var(--fg-12)', backdropFilter: 'blur(8px)' }}>
            {todosPersonagens.map(p => (
              <button key={p.id}
                onClick={() => { setActingAs(p); setPickerOpen(false) }}
                className="flex items-center gap-2 w-full px-3 py-1.5 text-left transition-colors hover:opacity-75"
                style={{ background: actingAs?.id === p.id ? 'var(--p-07)' : 'transparent', fontSize: 11 }}>
                <CharAvatar p={p} size={20} />
                <span className="font-medium" style={{ color: 'var(--foreground)' }}>{p.nome}</span>
              </button>
            ))}
          </div>
        )}
      </div>

    <div style={{ maxWidth: 680, margin: '0 auto' }}>
      {/* ── Header dinâmico ── */}
      {/* Instagram header */}
      {(
        <div className="px-4 pt-10 pb-3" style={{ borderBottom: '0.5px solid var(--p-08)' }}>
          <div className="flex items-center justify-center mb-4">
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
              {currentInstagramConta?.username ?? personagem.nome.toLowerCase().replace(/\s+/g, '_')}
            </p>
          </div>

          <div className="flex items-center gap-5 mb-3">
            <div
              className="w-[76px] h-[76px] rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-bold text-2xl"
              style={{ background: 'linear-gradient(135deg, #800020, #5C0018)', color: 'var(--primary-foreground)' }}
            >
              {(currentInstagramConta?.foto_url ?? personagem.foto_url)
                ? <img src={currentInstagramConta?.foto_url ?? personagem.foto_url ?? ''} alt="" className="w-full h-full object-cover" />
                : personagem.nome[0].toUpperCase()
              }
            </div>
            <div className="flex gap-5 flex-1">
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{currentInstagramPostCount}</p>
                <p className="text-[10px]" style={{ color: 'var(--foreground-muted)' }}>publicações</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{(currentInstagramConta?.seguidores ?? 0).toLocaleString('pt-BR')}</p>
                <p className="text-[10px]" style={{ color: 'var(--foreground-muted)' }}>seguidores</p>
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>{(currentInstagramConta?.seguindo ?? 0).toLocaleString('pt-BR')}</p>
                <p className="text-[10px]" style={{ color: 'var(--foreground-muted)' }}>seguindo</p>
              </div>
            </div>
          </div>

          <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>{personagem.nome}</p>
          {currentInstagramConta?.bio && (
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--foreground)' }}>{currentInstagramConta.bio}</p>
          )}
        </div>
      )}

      {/* ── Seletores de conta + nova conta ── */}
      <div className="flex items-center gap-2 px-4 pt-3 pb-1 flex-wrap">
        {currentContas.map(c => (
          <button key={c.id}
            onClick={() => setSelectedId(c.id)}
            className="text-[11px] px-2.5 py-1 rounded-full font-medium transition-all"
            style={{
              background: c.id === selectedId ? 'var(--primary)' : 'var(--p-07)',
              color: c.id === selectedId ? 'var(--primary-foreground)' : 'var(--foreground-muted)',
            }}>
            {c.username ? `@${c.username}` : c.nome}
          </button>
        ))}
        {(
          <button
            onClick={() => instagramNewPostFnRef.current?.()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-opacity hover:opacity-70 ml-auto"
            style={{ background: 'var(--p-10)', color: 'var(--primary)' }}>
            <Plus size={13} /> novo post
          </button>
        )}
      </div>

      {/* ── Conteúdo da aba ── */}
      <div className="px-4 pt-3 pb-8">
        <InstagramTab {...commonTabProps} currentConta={currentInstagramConta} allPosts={instagramPosts} onNewPostRef={fn => { instagramNewPostFnRef.current = fn }} />
      </div>
    </div>
    </div>
    </div>
  )
}

export function CharAvatar({ p, size }: { p: PersonagemBasic; size: number }) {
  return (
    <div className="rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center font-semibold"
      style={{ width: size, height: size, fontSize: size * 0.4, background: 'linear-gradient(135deg, #800020, #5C0018)', color: 'var(--primary-foreground)' }}>
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
      style={{ width: size, height: size, minWidth: size, minHeight: size, fontSize: size * 0.38, background: 'linear-gradient(135deg, #800020, #5C0018)', color: 'var(--primary-foreground)' }}>
      {fotoUrl
        ? <img src={fotoUrl} alt="" className="w-full h-full object-cover" />
        : personagem.nome[0].toUpperCase()
      }
    </div>
  )
}
