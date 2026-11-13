'use client'

import { useEffect, useState, useSyncExternalStore } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { X, Heart, MessageCircle, Layers, ArrowLeft, Grid3x3, SquareUser } from 'lucide-react'
import { MultiImageUpload } from '@/components/multi-image-upload'
import { getMidias, pathNoStorage, slugNome } from '@/lib/social-utils'
import { PostCard } from './post-card'
import type { PersonagemBasic, Curtida, Comentario, ComentarioCurtida, Conta, Post } from './social-client'

interface Personagem { id: string; nome: string; foto_url: string | null }

interface Props {
  personagemId: string
  personagem: Personagem
  currentConta: Conta | null
  allPosts: Post[]
  postsMarcados?: Post[]
  contasMarcadas?: Conta[]
  userId: string
  actingAs: PersonagemBasic | null
  todosPersonagens: PersonagemBasic[]
  curtidas: Curtida[]
  comentarios: Comentario[]
  comentarioCurtidas?: ComentarioCurtida[]
  postInicialId?: string | null
  onNewPostRef?: (fn: () => void) => void
}

type Eng = { curtidas: number; comentarios: number }

function nowLocalStr() {
  const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

const MQ_DESKTOP = '(min-width: 768px)'
function assinarDesktop(cb: () => void) {
  const mq = window.matchMedia(MQ_DESKTOP)
  mq.addEventListener('change', cb)
  return () => mq.removeEventListener('change', cb)
}

export function InstagramTab({
  personagemId, personagem, currentConta, allPosts,
  actingAs, todosPersonagens, curtidas: initCurtidas, comentarios: initComentarios,
  comentarioCurtidas: initComentarioCurtidas = [], postInicialId = null,
  postsMarcados = [], contasMarcadas = [],
  onNewPostRef,
}: Props) {
  const [showForm, setShowForm] = useState(false)
  const [midias, setMidias] = useState<string[]>([])
  const [legenda, setLegenda] = useState('')
  const [dataPost, setDataPost] = useState(nowLocalStr())
  const [loading, setLoading] = useState(false)
  const [aba, setAba] = useState<'posts' | 'marcadas'>('posts')
  const [selectedId, setSelectedId] = useState<string | null>(postInicialId)
  const [saveError, setSaveError] = useState<string | null>(null)

  // Alterações locais enquanto o servidor ainda não devolveu os dados atualizados.
  const [edicoes, setEdicoes] = useState<Record<string, Partial<Post>>>({})
  const [removidos, setRemovidos] = useState<string[]>([])

  const [engagements, setEngagements] = useState<Record<string, Eng>>(() => {
    const init: Record<string, Eng> = {}
    for (const p of [...allPosts, ...postsMarcados]) init[p.id] = { curtidas: p.curtidas ?? 0, comentarios: p.comentarios ?? 0 }
    return init
  })
  const [curtidas, setCurtidas] = useState<Curtida[]>(initCurtidas)
  const [comentarios, setComentarios] = useState<Comentario[]>(initComentarios)
  const [comentarioCurtidas, setComentarioCurtidas] = useState<ComentarioCurtida[]>(initComentarioCurtidas)

  const router = useRouter()

  // Fecha o post e tira o ?post= da URL (vindo de notificação ou link compartilhado).
  function fechar() {
    setSelectedId(null)
    if (new URL(window.location.href).searchParams.has('post')) {
      window.history.replaceState(null, '', window.location.pathname)
    }
  }
  const isDesktop = useSyncExternalStore(
    assinarDesktop,
    () => window.matchMedia(MQ_DESKTOP).matches,
    () => true,
  )

  // expõe setShowForm para o pai via ref callback
  if (onNewPostRef) onNewPostRef(() => setShowForm(true))

  const posts: Post[] = allPosts
    .filter(p => p.conta_id === currentConta?.id || (!p.conta_id && p.tipo === 'instagram'))
    .filter(p => !removidos.includes(p.id))
    .map(p => ({ ...p, ...edicoes[p.id] }))

  const marcadas: Post[] = postsMarcados.filter(p => !removidos.includes(p.id)).map(p => ({ ...p, ...edicoes[p.id] }))
  const lista = aba === 'marcadas' ? marcadas : posts
  const selected = [...posts, ...marcadas].find(p => p.id === selectedId) ?? null
  const aberto = selected !== null

  const handle = currentConta?.username
    ? `@${currentConta.username}`
    : `@${slugNome(personagem.nome)}`

  // Trava a rolagem da página e fecha com Esc enquanto o post está aberto.
  useEffect(() => {
    if (!aberto) return
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') fechar() }
    window.addEventListener('keydown', onKey)
    return () => { document.body.style.overflow = anterior; window.removeEventListener('keydown', onKey) }
  }, [aberto])

  // No celular, o feed abre já rolado até o post escolhido.
  useEffect(() => {
    if (aberto && !isDesktop && selectedId) {
      document.getElementById(`post-${selectedId}`)?.scrollIntoView({ block: 'start' })
    }
  }, [aberto, isDesktop, selectedId])

  async function handlePost() {
    if (midias.length === 0 || !currentConta) return
    setLoading(true)
    setSaveError(null)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const base = {
      personagem_id: personagemId, conteudo: legenda.trim(), midia_url: midias[0],
      tipo: 'instagram', conta_id: currentConta.id,
      data_post: new Date(dataPost).toISOString(),
      curtidas: 0, comentarios: 0, criado_por: user?.id,
    }
    let { error } = await supabase.from('posts_sociais').insert({ ...base, midia_urls: midias })
    if (error && /midia_urls/.test(error.message)) {
      // Migração ainda não rodada: salva só a capa.
      ;({ error } = await supabase.from('posts_sociais').insert(base))
    }
    if (error) { setSaveError('Erro ao publicar: ' + error.message); setLoading(false); return }
    setMidias([]); setLegenda(''); setShowForm(false)
    setDataPost(nowLocalStr()); setLoading(false)
    router.refresh()
  }

  async function handleDelete(post: Post) {
    const supabase = createClient()
    const { error } = await supabase.from('posts_sociais').delete().eq('id', post.id)
    if (error) { setSaveError('Erro ao apagar: ' + error.message); return }
    const caminhos = getMidias(post).map(pathNoStorage).filter((x): x is string => !!x)
    if (caminhos.length) await supabase.storage.from('imagens').remove(caminhos)
    setRemovidos(prev => [...prev, post.id])
    fechar()
    router.refresh()
  }

  async function handleSalvar(post: Post, novaLegenda: string, novasMidias: string[]): Promise<string | null> {
    const supabase = createClient()
    const { error } = await supabase.from('posts_sociais')
      .update({ conteudo: novaLegenda, midia_url: novasMidias[0], midia_urls: novasMidias }).eq('id', post.id)
    if (error) return 'Erro ao salvar: ' + error.message
    const removidas = getMidias(post).filter(u => !novasMidias.includes(u)).map(pathNoStorage).filter((x): x is string => !!x)
    if (removidas.length) await supabase.storage.from('imagens').remove(removidas)
    setEdicoes(prev => ({ ...prev, [post.id]: { conteudo: novaLegenda, midia_url: novasMidias[0], midia_urls: novasMidias } }))
    router.refresh()
    return null
  }

  async function updateEngagement(postId: string, field: keyof Eng, value: number) {
    setSaveError(null)
    setEngagements(prev => ({ ...prev, [postId]: { ...prev[postId], [field]: value } }))
    const supabase = createClient()
    const { error } = await supabase.from('posts_sociais').update({ [field]: value }).eq('id', postId)
    if (error) setSaveError('Erro ao salvar: ' + error.message)
  }

  async function toggleCurtida(postId: string) {
    if (!actingAs) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const existing = curtidas.find(c => c.post_id === postId && c.personagem_id === actingAs.id)
    if (existing) {
      await supabase.from('curtidas_sociais').delete().eq('id', existing.id)
      setCurtidas(prev => prev.filter(c => c.id !== existing.id))
    } else {
      const { data } = await supabase.from('curtidas_sociais')
        .insert({ post_id: postId, personagem_id: actingAs.id, criado_por: user?.id })
        .select().single()
      if (data) setCurtidas(prev => [...prev, data])
    }
  }

  async function curtirComentario(comentarioId: string) {
    if (!actingAs) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const existing = comentarioCurtidas.find(c => c.comentario_id === comentarioId && c.personagem_id === actingAs.id)
    if (existing) {
      await supabase.from('curtidas_comentarios_sociais').delete().eq('id', existing.id)
      setComentarioCurtidas(prev => prev.filter(c => c.id !== existing.id))
    } else {
      const { data, error } = await supabase.from('curtidas_comentarios_sociais')
        .insert({ comentario_id: comentarioId, personagem_id: actingAs.id, criado_por: user?.id })
        .select('id, comentario_id, personagem_id').single()
      if (error) setSaveError('Não foi possível curtir o comentário (rode schema-curtidas-comentarios.sql no Supabase).')
      else if (data) setComentarioCurtidas(prev => [...prev, data])
    }
  }

  async function enviarComentario(postId: string, texto: string) {
    if (!actingAs) return
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('comentarios_sociais')
      .insert({ post_id: postId, personagem_id: actingAs.id, conteudo: texto, criado_por: user?.id })
      .select('*, personagens(id, nome, foto_url)').single()
    if (data) setComentarios(prev => [...prev, data])
  }

  async function deletarComentario(comentarioId: string) {
    const supabase = createClient()
    await supabase.from('comentarios_sociais').delete().eq('id', comentarioId)
    setComentarios(prev => prev.filter(c => c.id !== comentarioId))
  }

  if (!currentConta) {
    return (
      <div className="text-center py-10 opacity-50">
        <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Nenhuma conta Instagram ainda</p>
        <p className="text-xs mt-1" style={{ color: 'var(--muted-light)' }}>Crie uma conta Instagram em Gerenciar contas</p>
      </div>
    )
  }

  function renderCard(post: Post, layout: 'duas-colunas' | 'feed') {
    const meu = !post.personagem_id || post.personagem_id === personagemId
    const autor = meu ? personagem : (todosPersonagens.find(p => p.id === post.personagem_id) ?? personagem)
    const contaAutor = meu ? currentConta : (contasMarcadas.find(c => c.id === post.conta_id) ?? null)
    const handleAutor = meu ? handle : `@${contaAutor?.username ?? slugNome(autor.nome)}`
    return (
      <PostCard key={post.id} post={post} layout={layout} somenteLeitura={!meu}
        personagem={autor} conta={contaAutor} handle={handleAutor}
        eng={engagements[post.id] ?? { curtidas: 0, comentarios: 0 }}
        curtidas={curtidas.filter(c => c.post_id === post.id)}
        comentarios={comentarios.filter(c => c.post_id === post.id)}
        comentarioCurtidas={comentarioCurtidas}
        actingAs={actingAs} todosPersonagens={todosPersonagens} erro={post.id === selectedId ? saveError : null}
        onToggleCurtida={toggleCurtida} onCurtirComentario={curtirComentario}
        onComentar={enviarComentario} onDeleteComentario={deletarComentario}
        onDelete={handleDelete} onSalvar={handleSalvar} onEngagement={updateEngagement} />
    )
  }

  return (
    <div>
      <style>{`@keyframes heartPop {
        0% { transform: scale(0.4); opacity: 0 }
        20% { transform: scale(1.15); opacity: 1 }
        40% { transform: scale(0.95) }
        100% { transform: scale(1.1); opacity: 0 }
      }`}</style>

      {saveError && !aberto && (
        <p className="text-[11px] mb-3 px-2 py-1.5 rounded-lg" style={{ background: 'rgba(192,0,0,0.08)', color: 'var(--destructive)' }}>
          {saveError}
        </p>
      )}

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl p-5 mb-5" style={{ background: 'rgba(255,255,255,0.65)', border: '0.5px solid var(--p-12)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--foreground-muted)' }}>Nova publicação</p>
            <button onClick={() => { setShowForm(false); setMidias([]); setLegenda('') }} aria-label="Fechar"
              className="w-8 h-8 flex items-center justify-center" style={{ color: 'var(--muted-light)' }}><X size={16} /></button>
          </div>
          <div className="mb-4">
            <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--foreground-muted)' }}>Fotos * (até 10)</p>
            <MultiImageUpload urls={midias} onChange={setMidias} />
          </div>
          <div className="mb-4">
            <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--foreground-muted)' }}>Legenda</p>
            <textarea value={legenda} onChange={e => setLegenda(e.target.value)} placeholder="Escreva uma legenda... use #hashtags e @menções" rows={3}
              className="w-full text-sm outline-none resize-none rounded-xl px-3 py-2.5"
              style={{ background: 'rgba(255,255,255,0.70)', border: '0.5px solid var(--p-12)', color: 'var(--foreground)' }} />
          </div>
          <div className="mb-5">
            <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--foreground-muted)' }}>Data da publicação</p>
            <input type="datetime-local" value={dataPost} onChange={e => setDataPost(e.target.value)}
              className="text-xs outline-none rounded-xl px-3 py-2"
              style={{ background: 'rgba(255,255,255,0.70)', border: '0.5px solid var(--p-12)', color: 'var(--foreground-muted)' }} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setShowForm(false); setMidias([]); setLegenda('') }}
              className="flex-1 py-2.5 rounded-xl text-xs transition-opacity hover:opacity-70"
              style={{ background: 'var(--p-07)', color: 'var(--foreground-muted)' }}>Cancelar</button>
            <button onClick={handlePost} disabled={loading || midias.length === 0}
              className="flex-1 py-2.5 rounded-xl text-xs font-medium disabled:opacity-40 transition-opacity hover:opacity-80"
              style={{ background: 'var(--btn-primary)', color: 'var(--primary-foreground)' }}>{loading ? 'Publicando...' : 'Publicar'}</button>
          </div>
        </div>
      )}

      {/* Abas */}
      <div className="flex mb-3" style={{ borderBottom: '0.5px solid var(--p-08)' }} role="tablist">
        {([['posts', Grid3x3, 'Publicações'], ['marcadas', SquareUser, 'Marcadas']] as const).map(([id, Icone, rotulo]) => (
          <button key={id} role="tab" aria-selected={aba === id} aria-label={rotulo} onClick={() => setAba(id)}
            className="flex-1 h-11 flex items-center justify-center transition-colors"
            style={{
              color: aba === id ? 'var(--foreground)' : 'var(--muted-light)',
              borderBottom: aba === id ? '1.5px solid var(--foreground)' : '1.5px solid transparent',
              marginBottom: -1,
            }}>
            <Icone size={22} />
          </button>
        ))}
      </div>

      {/* Grid (3:4, como no Instagram atual) */}
      {lista.length === 0 ? (
        <div className="text-center py-10 opacity-50">
          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>
            {aba === 'marcadas' ? 'Nenhuma publicação com este perfil marcado' : 'Nenhuma publicação ainda'}
          </p>
          {aba === 'marcadas' && <p className="text-xs mt-1" style={{ color: 'var(--muted-light)' }}>Aparecem aqui os posts de outros personagens que mencionam @{currentConta.username ?? slugNome(personagem.nome)}</p>}
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5 rounded-xl overflow-hidden">
          {lista.map(post => {
            const eng = engagements[post.id] ?? { curtidas: 0, comentarios: 0 }
            const totalCurtidas = curtidas.filter(c => c.post_id === post.id).length + eng.curtidas
            const totalComentarios = comentarios.filter(c => c.post_id === post.id).length + eng.comentarios
            const fotos = getMidias(post)
            return (
              <button key={post.id} onClick={() => { setSelectedId(post.id); setSaveError(null) }}
                className="relative overflow-hidden group" style={{ background: 'var(--p-06)', aspectRatio: '3 / 4' }}>
                {fotos.length > 0
                  ? <img src={fotos[0]} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  : <div className="w-full h-full flex items-center justify-center text-3xl" style={{ color: '#C09098' }}>{personagem.nome[0]}</div>
                }
                {fotos.length > 1 && (
                  <Layers size={16} color="#fff" className="absolute top-1.5 right-1.5 drop-shadow" />
                )}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3"
                  style={{ background: 'var(--fg-40)' }}>
                  <span className="flex items-center gap-1 text-xs font-semibold text-white"><Heart size={14} fill="white" /> {totalCurtidas}</span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-white"><MessageCircle size={14} fill="white" stroke="white" /> {totalComentarios}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Post aberto: duas colunas no desktop; feed rolável em tela cheia no celular */}
      {selected && isDesktop && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
          onClick={fechar}>
          <button onClick={fechar} aria-label="Fechar"
            className="absolute top-4 right-4 w-11 h-11 rounded-full flex items-center justify-center transition-opacity hover:opacity-80"
            style={{ background: 'rgba(255,255,255,0.15)' }}>
            <X size={22} color="#fff" />
          </button>
          <div className="rounded-2xl overflow-hidden flex"
            style={{ boxShadow: '0 20px 60px rgba(40,5,15,0.30)', maxWidth: 1100, maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}>
            {renderCard(selected, 'duas-colunas')}
          </div>
        </div>
      )}

      {selected && !isDesktop && (
        <div className="fixed inset-0 z-50 overflow-y-auto" style={{ background: 'rgba(250,247,248,0.99)' }}>
          <div className="sticky top-0 z-30 flex items-center gap-1 h-12 px-1"
            style={{ background: 'rgba(250,247,248,0.97)', borderBottom: '0.5px solid var(--p-08)', backdropFilter: 'blur(8px)' }}>
            <button onClick={fechar} aria-label="Voltar"
              className="w-11 h-11 flex items-center justify-center" style={{ color: 'var(--foreground)' }}>
              <ArrowLeft size={22} />
            </button>
            <p className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Publicações</p>
          </div>
          {lista.map(p => (
            <div key={p.id} id={`post-${p.id}`} style={{ scrollMarginTop: 48, borderBottom: '0.5px solid var(--p-08)' }}>
              {renderCard(p, 'feed')}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
