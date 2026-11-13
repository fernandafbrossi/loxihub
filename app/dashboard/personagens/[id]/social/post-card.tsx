'use client'

import { useRef, useState } from 'react'
import { Heart, MessageCircle, Send, Bookmark, MoreHorizontal, Pencil, Trash2, Check } from 'lucide-react'
import { MultiImageUpload } from '@/components/multi-image-upload'
import { PostCarousel } from '@/components/post-carousel'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { TextoRico } from '@/components/texto-rico'
import { getMidias, tempoRelativo } from '@/lib/social-utils'
import {
  AccountAvatar, CharAvatar,
  type PersonagemBasic, type Curtida, type Comentario, type ComentarioCurtida, type Conta, type Post,
} from './social-client'

type Eng = { curtidas: number; comentarios: number }

interface Props {
  post: Post
  /** 'duas-colunas' (desktop: foto ao lado dos comentários) ou 'feed' (celular: tudo em coluna). */
  layout: 'duas-colunas' | 'feed'
  /** Post de outro personagem (aba Marcadas): sem editar/excluir. */
  somenteLeitura?: boolean
  personagem: { id: string; nome: string; foto_url: string | null }
  conta: Conta | null
  handle: string
  eng: Eng
  curtidas: Curtida[]
  comentarios: Comentario[]
  comentarioCurtidas: ComentarioCurtida[]
  actingAs: PersonagemBasic | null
  todosPersonagens: PersonagemBasic[]
  erro: string | null
  onToggleCurtida: (postId: string) => void
  onCurtirComentario: (comentarioId: string) => void
  onComentar: (postId: string, texto: string) => Promise<void>
  onDeleteComentario: (comentarioId: string) => Promise<void>
  onDelete: (post: Post) => Promise<void>
  onSalvar: (post: Post, legenda: string, midias: string[]) => Promise<string | null>
  onEngagement: (postId: string, field: keyof Eng, value: number) => void
}

const LIMITE_LEGENDA = 125

// Número ao lado do ícone (como no Instagram). Tocar nele permite ajustar o total.
function Contador({ valor, onSalvar, rotulo }: { valor: number; onSalvar: (total: number) => void; rotulo: string }) {
  const [editando, setEditando] = useState(false)
  const [rascunho, setRascunho] = useState(String(valor))
  function confirmar() { onSalvar(Math.max(0, parseInt(rascunho) || 0)); setEditando(false) }
  if (editando) {
    return (
      <input type="number" min={0} value={rascunho} onChange={e => setRascunho(e.target.value)} aria-label={rotulo}
        onBlur={confirmar} onKeyDown={e => { if (e.key === 'Enter') confirmar(); if (e.key === 'Escape') setEditando(false) }}
        autoFocus className="w-16 h-8 text-sm text-center outline-none rounded-md"
        style={{ background: 'var(--p-07)', border: '0.5px solid var(--p-20)', color: 'var(--foreground)' }} />
    )
  }
  return (
    <button onClick={() => { setRascunho(String(valor)); setEditando(true) }} aria-label={`${rotulo}: ${valor}. Tocar para ajustar`}
      className="h-10 pr-2 text-sm font-semibold tabular-nums" style={{ color: 'var(--foreground)' }}>
      {valor.toLocaleString('pt-BR')}
    </button>
  )
}

function lerSalvos(): string[] {
  try { return JSON.parse(localStorage.getItem('loxihub:posts-salvos') ?? '[]') } catch { return [] }
}

export function PostCard(props: Props) {
  const {
    post, layout, somenteLeitura = false, personagem, conta, handle, eng, curtidas, comentarios, comentarioCurtidas,
    actingAs, todosPersonagens, erro,
    onToggleCurtida, onCurtirComentario, onComentar, onDeleteComentario, onDelete, onSalvar, onEngagement,
  } = props

  const [menuAberto, setMenuAberto] = useState(false)
  const [confirmarPost, setConfirmarPost] = useState(false)
  const [apagandoPost, setApagandoPost] = useState(false)
  const [comentarioParaApagar, setComentarioParaApagar] = useState<string | null>(null)
  const [apagandoComentario, setApagandoComentario] = useState(false)

  const [editando, setEditando] = useState(false)
  const [editLegenda, setEditLegenda] = useState('')
  const [editMidias, setEditMidias] = useState<string[]>([])
  const [salvando, setSalvando] = useState(false)
  const [erroEdicao, setErroEdicao] = useState<string | null>(null)

  const [legendaAberta, setLegendaAberta] = useState(false)
  const [comentariosAbertos, setComentariosAbertos] = useState(layout === 'duas-colunas')
  const [rascunho, setRascunho] = useState('')
  const [enviando, setEnviando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const [burst, setBurst] = useState(0)
  const [salvo, setSalvo] = useState(() => typeof window !== 'undefined' && lerSalvos().includes(post.id))
  const [aviso, setAviso] = useState<string | null>(null)

  const midias = getMidias(post)
  const jaCurtiu = actingAs ? curtidas.some(c => c.personagem_id === actingAs.id) : false
  const totalComentarios = comentarios.length + eng.comentarios
  const totalCurtidas = curtidas.length + eng.curtidas
  const dataIso = post.data_post || post.created_at
  const duasColunas = layout === 'duas-colunas'

  function mostrarAviso(msg: string) {
    setAviso(msg)
    setTimeout(() => setAviso(null), 2000)
  }

  function duploToque() {
    if (!actingAs) return
    setBurst(b => b + 1)
    if (!jaCurtiu) onToggleCurtida(post.id)
  }

  function alternarSalvo() {
    const lista = lerSalvos()
    const novo = salvo ? lista.filter(id => id !== post.id) : [...lista, post.id]
    try { localStorage.setItem('loxihub:posts-salvos', JSON.stringify(novo)) } catch { /* sem storage */ }
    setSalvo(!salvo)
  }

  async function compartilhar() {
    const url = `${window.location.origin}/dashboard/personagens/${personagem.id}/social?post=${post.id}`
    try {
      if (navigator.share) { await navigator.share({ url }); return }
      await navigator.clipboard.writeText(url)
      mostrarAviso('Link copiado')
    } catch { /* cancelado */ }
  }

  function responder(nome: string, username?: string | null) {
    const alvo = username ?? nome.toLowerCase().replace(/\s+/g, '_')
    setRascunho(`@${alvo} `)
    setComentariosAbertos(true)
    inputRef.current?.focus()
  }

  async function enviar() {
    if (!actingAs || !rascunho.trim()) return
    setEnviando(true)
    await onComentar(post.id, rascunho.trim())
    setRascunho(''); setEnviando(false)
    setComentariosAbertos(true)
  }

  async function confirmarApagarPost() {
    setApagandoPost(true)
    await onDelete(post)
    setApagandoPost(false); setConfirmarPost(false)
  }

  async function confirmarApagarComentario() {
    if (!comentarioParaApagar) return
    setApagandoComentario(true)
    await onDeleteComentario(comentarioParaApagar)
    setApagandoComentario(false); setComentarioParaApagar(null)
  }

  function iniciarEdicao() {
    setMenuAberto(false)
    setEditLegenda(post.conteudo); setEditMidias(midias); setErroEdicao(null)
    setEditando(true)
  }

  async function salvarEdicao() {
    if (editMidias.length === 0) { setErroEdicao('O post precisa de pelo menos uma foto.'); return }
    setSalvando(true)
    const msg = await onSalvar(post, editLegenda.trim(), editMidias)
    setSalvando(false)
    if (msg) setErroEdicao(msg)
    else setEditando(false)
  }

  const pequeno = { color: 'var(--muted-light)' }

  // ── Blocos ──────────────────────────────────────────────

  const cabecalho = (
    <div className="flex items-center gap-3 px-4 py-2.5 flex-shrink-0" style={{ borderBottom: duasColunas ? '0.5px solid var(--p-08)' : 'none' }}>
      <AccountAvatar conta={conta} personagem={personagem} size={34} />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-semibold leading-none truncate" style={{ color: 'var(--foreground)' }}>{personagem.nome}</p>
        <p className="text-[10px] mt-1 truncate" style={pequeno}>{handle}</p>
      </div>
      {!somenteLeitura && <div className="relative">
        <button onClick={() => setMenuAberto(v => !v)} aria-label="Mais opções" aria-expanded={menuAberto}
          className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center transition-colors hover:bg-black/5"
          style={{ color: 'var(--foreground)' }}>
          <MoreHorizontal size={20} />
        </button>
        {menuAberto && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setMenuAberto(false)} />
            <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-xl overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.99)', border: '0.5px solid var(--p-12)', boxShadow: '0 8px 24px var(--fg-12)' }}>
              <button onClick={iniciarEdicao}
                className="flex items-center gap-3 w-full px-4 h-11 text-sm text-left transition-colors hover:bg-black/5"
                style={{ color: 'var(--foreground)' }}>
                <Pencil size={16} /> Editar
              </button>
              <button onClick={() => { setMenuAberto(false); setConfirmarPost(true) }}
                className="flex items-center gap-3 w-full px-4 h-11 text-sm text-left transition-colors hover:bg-black/5"
                style={{ color: 'var(--destructive)', borderTop: '0.5px solid var(--p-08)' }}>
                <Trash2 size={16} /> Excluir
              </button>
            </div>
          </>
        )}
      </div>}
    </div>
  )

  const midia = editando ? (
    <div className="px-4 pt-3 flex-shrink-0">
      <MultiImageUpload urls={editMidias} onChange={setEditMidias} />
    </div>
  ) : (
    <PostCarousel key={post.id} urls={midias} onDoubleTap={duploToque}
      style={duasColunas ? { height: 'min(85vh, 720px)', maxWidth: '60vw', flexShrink: 0 } : { width: '100%' }}>
      {burst > 0 && (
        <span key={burst} className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <Heart size={84} fill="#fff" stroke="#fff" style={{ animation: 'heartPop 0.8s ease-out forwards', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.35))' }} />
        </span>
      )}
    </PostCarousel>
  )

  const botoes = (
    <div className="flex items-center gap-1 -ml-2">
      <button onClick={() => onToggleCurtida(post.id)} disabled={!actingAs} aria-label={jaCurtiu ? 'Descurtir' : 'Curtir'}
        className="w-10 h-10 flex items-center justify-center transition-transform active:scale-90 disabled:opacity-40">
        <Heart size={24} fill={jaCurtiu ? 'var(--primary)' : 'none'} stroke={jaCurtiu ? 'var(--primary)' : 'var(--foreground)'} />
      </button>
      <span className="-ml-2.5 mr-1.5">
        <Contador valor={totalCurtidas} rotulo="Curtidas"
          onSalvar={t => onEngagement(post.id, 'curtidas', Math.max(0, t - curtidas.length))} />
      </span>
      <button onClick={() => { setComentariosAbertos(true); inputRef.current?.focus() }} aria-label="Comentar"
        className="w-10 h-10 flex items-center justify-center transition-opacity hover:opacity-60">
        <MessageCircle size={24} style={{ color: 'var(--foreground)' }} />
      </button>
      <span className="-ml-2.5 mr-1.5">
        <Contador valor={totalComentarios} rotulo="Comentários"
          onSalvar={t => onEngagement(post.id, 'comentarios', Math.max(0, t - comentarios.length))} />
      </span>
      <button onClick={compartilhar} aria-label="Compartilhar"
        className="w-10 h-10 flex items-center justify-center transition-opacity hover:opacity-60">
        <Send size={22} style={{ color: 'var(--foreground)' }} />
      </button>
      <button onClick={alternarSalvo} aria-label={salvo ? 'Remover dos salvos' : 'Salvar'} aria-pressed={salvo}
        className="w-10 h-10 ml-auto -mr-2 flex items-center justify-center transition-opacity hover:opacity-60">
        <Bookmark size={23} fill={salvo ? 'var(--foreground)' : 'none'} style={{ color: 'var(--foreground)' }} />
      </button>
    </div>
  )

  const curtidoPor = (() => {
    if (curtidas.length === 0) return null
    const primeiro = todosPersonagens.find(x => x.id === curtidas[0]?.personagem_id)
    const outras = Math.max(0, curtidas.length - 1) + eng.curtidas
    return (
      <div className="flex items-center gap-2">
        <CharAvatar p={primeiro ?? { id: '', nome: '?', foto_url: null }} size={18} />
        <p className="text-xs" style={{ color: 'var(--foreground)' }}>
          Curtido por <span className="font-semibold">{primeiro?.nome ?? '?'}</span>
          {outras > 0 && <> e <span className="font-semibold">{outras === 1 ? 'outra pessoa' : 'outras pessoas'}</span></>}
        </p>
      </div>
    )
  })()

  const legenda = editando ? (
    <div className="mb-2">
      <textarea value={editLegenda} onChange={e => setEditLegenda(e.target.value)} rows={3} autoFocus
        className="w-full text-sm outline-none resize-none rounded-lg px-3 py-2"
        style={{ background: 'rgba(255,255,255,0.70)', border: '0.5px solid var(--p-20)', color: 'var(--foreground)' }} />
      {erroEdicao && <p className="text-[11px] mt-1" style={{ color: 'var(--destructive)' }}>{erroEdicao}</p>}
      <div className="flex gap-2 mt-2">
        <button onClick={salvarEdicao} disabled={salvando}
          className="flex items-center gap-1.5 text-xs px-3.5 h-9 rounded-lg disabled:opacity-50"
          style={{ background: 'var(--btn-primary)', color: 'var(--primary-foreground)' }}>
          <Check size={13} /> {salvando ? 'Salvando...' : 'Salvar'}
        </button>
        <button onClick={() => setEditando(false)} disabled={salvando}
          className="text-xs px-3.5 h-9 rounded-lg" style={{ background: 'var(--p-07)', color: 'var(--foreground-muted)' }}>
          Cancelar
        </button>
      </div>
    </div>
  ) : post.conteudo ? (
    <p className="text-[13px] leading-relaxed whitespace-pre-wrap break-words" style={{ color: 'var(--foreground)' }}>
      <span className="font-semibold">{personagem.nome} </span>
      {legendaAberta || post.conteudo.length <= LIMITE_LEGENDA
        ? <TextoRico texto={post.conteudo} personagens={todosPersonagens} />
        : <>
            <TextoRico texto={post.conteudo.slice(0, LIMITE_LEGENDA).trimEnd()} personagens={todosPersonagens} />…{' '}
            <button onClick={() => setLegendaAberta(true)} style={pequeno}>mais</button>
          </>}
    </p>
  ) : null

  const listaComentarios = comentarios.map(c => {
    const autor = c.personagens as PersonagemBasic | null
    const nCurt = comentarioCurtidas.filter(x => x.comentario_id === c.id).length
    const euCurti = actingAs ? comentarioCurtidas.some(x => x.comentario_id === c.id && x.personagem_id === actingAs.id) : false
    const autorCompleto = todosPersonagens.find(p => p.id === autor?.id)
    return (
      <div key={c.id} className="flex items-start gap-2.5 py-2 group">
        {autor && <CharAvatar p={autor} size={28} />}
        <div className="flex-1 min-w-0">
          <p className="text-[13px] leading-snug break-words" style={{ color: 'var(--foreground)' }}>
            <span className="font-semibold">{autor?.nome ?? '?'} </span>
            <TextoRico texto={c.conteudo} personagens={todosPersonagens} />
          </p>
          <div className="flex items-center gap-3 mt-1 text-[11px]" style={pequeno}>
            <span>{tempoRelativo(c.created_at)}</span>
            {nCurt > 0 && <span className="font-semibold">{nCurt} {nCurt === 1 ? 'curtida' : 'curtidas'}</span>}
            {actingAs && autor && (
              <button onClick={() => responder(autor.nome, autorCompleto?.username)} className="font-semibold py-1">Responder</button>
            )}
            <button onClick={() => setComentarioParaApagar(c.id)} aria-label="Apagar comentário"
              className="ml-auto flex items-center gap-1 py-1 px-1.5 -mr-1.5 rounded md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:text-[var(--destructive)]">
              <Trash2 size={13} />
            </button>
          </div>
        </div>
        <button onClick={() => onCurtirComentario(c.id)} disabled={!actingAs} aria-label={euCurti ? 'Descurtir comentário' : 'Curtir comentário'}
          className="w-8 h-8 -mr-1 flex items-center justify-center flex-shrink-0 disabled:opacity-30">
          <Heart size={14} fill={euCurti ? 'var(--primary)' : 'none'} stroke={euCurti ? 'var(--primary)' : 'var(--muted-light)'} />
        </button>
      </div>
    )
  })

  const campoComentario = actingAs ? (
    <div className="flex items-center gap-2.5 px-4 py-2.5 flex-shrink-0" style={{ borderTop: '0.5px solid var(--p-08)' }}>
      <CharAvatar p={actingAs} size={28} />
      <input ref={inputRef} value={rascunho} onChange={e => setRascunho(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') enviar() }}
        placeholder={`Comentar como ${actingAs.nome}...`}
        className="flex-1 min-w-0 text-[13px] outline-none bg-transparent h-9" style={{ color: 'var(--foreground)' }} />
      <button onClick={enviar} disabled={enviando || !rascunho.trim()} aria-label="Publicar comentário"
        className="text-xs font-semibold px-1 h-9 disabled:opacity-30 transition-opacity" style={{ color: 'var(--primary)' }}>
        Publicar
      </button>
    </div>
  ) : (
    <p className="text-[11px] text-center py-3 flex-shrink-0" style={{ ...pequeno, borderTop: '0.5px solid var(--p-08)' }}>
      Selecione um personagem acima para interagir
    </p>
  )

  const rodape = (
    <div className="px-4 pt-2 pb-2.5 flex-shrink-0 flex flex-col gap-1.5">
      {botoes}
      {curtidoPor}
      {!duasColunas && legenda}
      {!duasColunas && totalComentarios > 0 && !comentariosAbertos && (
        <button onClick={() => setComentariosAbertos(true)} className="text-xs text-left" style={pequeno}>
          Ver {totalComentarios === 1 ? 'o comentário' : `todos os ${totalComentarios.toLocaleString('pt-BR')} comentários`}
        </button>
      )}
      <p className="text-[10px] uppercase tracking-wide" style={pequeno}>{tempoRelativo(dataIso)}</p>
      {(erro || aviso) && (
        <p className="text-[11px]" style={{ color: erro ? 'var(--destructive)' : 'var(--foreground-muted)' }}>{erro ?? aviso}</p>
      )}
    </div>
  )

  const dialogos = (
    <>
      <ConfirmDialog aberto={confirmarPost} titulo="Apagar este post?"
        mensagem="O post, as fotos, os comentários e as curtidas serão removidos. Essa ação não pode ser desfeita."
        carregando={apagandoPost} onConfirmar={confirmarApagarPost} onCancelar={() => !apagandoPost && setConfirmarPost(false)} />
      <ConfirmDialog aberto={comentarioParaApagar !== null} titulo="Apagar este comentário?"
        mensagem="Essa ação não pode ser desfeita."
        carregando={apagandoComentario} onConfirmar={confirmarApagarComentario} onCancelar={() => !apagandoComentario && setComentarioParaApagar(null)} />
    </>
  )

  if (duasColunas) {
    return (
      <div className="flex w-full min-h-0" style={{ maxHeight: 'min(85vh, 720px)' }}>
        {midia}
        <div className="flex flex-col flex-1 min-w-[320px] min-h-0" style={{ background: 'rgba(250,247,248,0.99)' }}>
          {cabecalho}
          <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
            {legenda && <div className="flex items-start gap-2.5 pb-3 mb-1" style={{ borderBottom: editando ? 'none' : undefined }}>
              {!editando && <AccountAvatar conta={conta} personagem={personagem} size={28} />}
              <div className="flex-1 min-w-0">{legenda}</div>
            </div>}
            {listaComentarios.length === 0 && !editando
              ? <p className="text-[11px] text-center py-4" style={pequeno}>Sem comentários ainda</p>
              : listaComentarios}
          </div>
          <div style={{ borderTop: '0.5px solid var(--p-08)' }}>{rodape}</div>
          {campoComentario}
        </div>
        {dialogos}
      </div>
    )
  }

  return (
    <article className="w-full" style={{ background: 'rgba(250,247,248,0.99)' }}>
      {cabecalho}
      {midia}
      {rodape}
      {comentariosAbertos && listaComentarios.length > 0 && <div className="px-4 pb-2">{listaComentarios}</div>}
      {campoComentario}
      {dialogos}
    </article>
  )
}

