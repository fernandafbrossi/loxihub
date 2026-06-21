'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Pencil, Check, X, MapPin, Trash2, Thermometer } from 'lucide-react'
import { MarkdownText } from '@/components/markdown-text'

interface Post {
  id: string
  conteudo: string
  personagem_pov: string | null
  criado_por: string
  created_at: string
}

interface RoupaContexto {
  id: string
  personagem_id: string
  roupa_url: string
  personagens: { id: string; nome: string } | null
}

interface ContextoCena {
  id: string
  localizacao: string | null
  data_cena: string | null
  temperatura_min: number | null
  temperatura_max: number | null
  temperatura_media: number | null
  criado_por: string | null
  created_at: string
  roupas_contexto: RoupaContexto[]
}

interface Personagem {
  id: string
  nome: string
  foto_url: string | null
}

type TimelineItem =
  | { type: 'post'; data: Post }
  | { type: 'contexto'; data: ContextoCena }

interface PostsListProps {
  items: TimelineItem[]
  userId: string
  personagens: Personagem[]
  threadId: string
}

function Lightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(46,5,16,0.88)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <button
        className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center"
        style={{ background: 'rgba(255,255,255,0.15)' }}
        onClick={onClose}
      >
        <X size={16} color="#FAF0F2" />
      </button>
      <img
        src={url}
        alt=""
        className="max-h-[88vh] max-w-[88vw] object-contain rounded-2xl shadow-2xl"
        onClick={e => e.stopPropagation()}
        onError={e => { (e.target as HTMLImageElement).style.display = 'none' }}
      />
    </div>
  )
}

function OutfitImage({ url, nome, size = 'sm', onOpen }: {
  url: string
  nome?: string
  size?: 'sm' | 'md'
  onOpen: (url: string) => void
}) {
  const [broken, setBroken] = useState(false)
  const w = size === 'sm' ? 'w-12' : 'w-16'
  const h = size === 'sm' ? 'h-16' : 'h-24'

  if (broken) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div
          className={`${w} ${h} rounded-lg flex items-center justify-center`}
          style={{ background: 'rgba(128,0,32,0.06)', border: '0.5px dashed rgba(128,0,32,0.20)' }}
          title="Link de imagem inválido ou bloqueado"
        >
          <span className="text-[8px] text-center px-1" style={{ color: '#B09098' }}>link inválido</span>
        </div>
        {nome && <span className="text-[9px]" style={{ color: '#906070' }}>{nome}</span>}
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <img
        src={url}
        alt=""
        className={`${w} ${h} object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity`}
        style={{ border: '0.5px solid rgba(128,0,32,0.12)' }}
        onError={() => setBroken(true)}
        onClick={() => onOpen(url)}
      />
      {nome && <span className="text-[9px]" style={{ color: '#906070' }}>{nome}</span>}
    </div>
  )
}

function ContextoCard({ contexto, onOpenImage, onDelete }: {
  contexto: ContextoCena
  onOpenImage: (url: string) => void
  onDelete: (id: string) => void
}) {
  const [deleting, setDeleting] = useState(false)
  const hora = new Date(contexto.created_at).toLocaleString('pt-BR', {
    day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
  })

  if (!contexto.localizacao && contexto.roupas_contexto.length === 0) return null

  async function handleDelete() {
    setDeleting(true)
    onDelete(contexto.id)
  }

  return (
    <div className="group flex items-center gap-3 my-1">
      <div
        className="flex-1 px-4 py-3 rounded-xl"
        style={{
          background: 'rgba(128,0,32,0.04)',
          border: '0.5px dashed rgba(128,0,32,0.22)',
        }}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex flex-col gap-2">
            {contexto.localizacao && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <MapPin size={11} style={{ color: '#800020', flexShrink: 0 }} />
                <span className="text-xs font-medium" style={{ color: '#800020' }}>
                  {contexto.localizacao}
                </span>
                {contexto.data_cena && (
                  <span className="text-[10px]" style={{ color: '#906070' }}>
                    · {new Date(contexto.data_cena + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </span>
                )}
                {contexto.temperatura_media != null && (
                  <span className="inline-flex items-center gap-0.5 text-[10px]" style={{ color: '#906070' }}>
                    <Thermometer size={10} style={{ color: '#800020' }} />
                    {contexto.temperatura_media}°C
                    <span style={{ color: '#B09098' }}> (mín {contexto.temperatura_min}° · máx {contexto.temperatura_max}°)</span>
                  </span>
                )}
              </div>
            )}

            {contexto.roupas_contexto.length > 0 && (
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-widest" style={{ color: '#B09098' }}>
                  aparência do personagem
                </span>
                <div className="flex flex-wrap gap-3">
                  {contexto.roupas_contexto.map(r => (
                    <OutfitImage
                      key={r.id}
                      url={r.roupa_url}
                      nome={r.personagens?.nome}
                      size="sm"
                      onOpen={onOpenImage}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col items-end gap-1 self-start flex-shrink-0">
            <span className="text-[10px]" style={{ color: '#B09098' }}>{hora}</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity disabled:opacity-40"
              title="Apagar contexto"
            >
              <Trash2 size={11} style={{ color: '#B09098' }} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}


function Avatar({ nome, foto, isMe }: { nome: string; foto: string | null; isMe: boolean }) {
  const [imgError, setImgError] = useState(false)
  const showImg = foto && !imgError

  return showImg ? (
    <img
      src={foto}
      alt={nome}
      className="w-14 h-14 rounded-full object-cover"
      style={{ boxShadow: '0 2px 8px rgba(40,5,15,0.15)' }}
      onError={() => setImgError(true)}
    />
  ) : (
    <div
      className="w-14 h-14 rounded-full flex items-center justify-center text-xs font-medium"
      style={{
        background: isMe
          ? 'linear-gradient(135deg, #800020, #5C0018)'
          : 'linear-gradient(135deg, #D0A0A8, #B07080)',
        color: '#FAF0F2',
        boxShadow: '0 2px 8px rgba(40,5,15,0.15)',
      }}
    >
      {nome[0].toUpperCase()}
    </div>
  )
}

export function PostsList({ items, userId, personagens, threadId }: PostsListProps) {
  const [localItems, setLocalItems] = useState<TimelineItem[]>(items)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editConteudo, setEditConteudo] = useState('')
  const [saving, setSaving] = useState(false)
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null)
  const router = useRouter()
  const bottomRef = useRef<HTMLDivElement>(null)
  const seenIds = useRef(new Set(items.map(i => i.data.id)))
  const prevLength = useRef(items.length)

  // Scroll inicial
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'instant' })
    prevLength.current = localItems.length
  }, [])

  // Sync com o servidor quando router.refresh() atualiza os props
  useEffect(() => {
    setLocalItems(items)
    seenIds.current = new Set(items.map(i => i.data.id))
  }, [items])

  // Scroll quando chegam posts novos (realtime ou refresh)
  useEffect(() => {
    if (localItems.length > prevLength.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
    prevLength.current = localItems.length
  }, [localItems.length])

  // Realtime: novos posts desta thread (para a outra usuária ver sem refresh)
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel(`posts-thread-${threadId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'posts' },
        (payload) => {
          const p = payload.new as Post & { thread_id: string }
          if (p.thread_id !== threadId) return
          if (seenIds.current.has(p.id)) return
          seenIds.current.add(p.id)
          setLocalItems(prev => [...prev, { type: 'post', data: p }])
        }
      )
      .subscribe()

    return () => { channel.unsubscribe() }
  }, [threadId])

  async function handleDeleteContexto(id: string) {
    const supabase = createClient()
    await supabase.from('contextos_cena').delete().eq('id', id)
    setLocalItems(prev => prev.filter(i => i.data.id !== id))
  }

  async function handleDeletePost(id: string) {
    const supabase = createClient()
    await supabase.from('posts').delete().eq('id', id)
    setLocalItems(prev => prev.filter(i => i.data.id !== id))
    seenIds.current.delete(id)
  }

  function getFoto(povNome: string): string | null {
    const match = personagens.find(p => p.nome.trim().toLowerCase() === povNome.trim().toLowerCase())
    return match?.foto_url ?? null
  }

  function startEdit(post: Post) {
    setEditingId(post.id)
    setEditConteudo(post.conteudo)
  }

  function cancelEdit() {
    setEditingId(null)
    setEditConteudo('')
  }

  async function saveEdit(postId: string) {
    if (!editConteudo.trim()) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('posts').update({ conteudo: editConteudo.trim() }).eq('id', postId)
    setSaving(false)
    setEditingId(null)
    setLocalItems(prev => prev.map(i =>
      i.type === 'post' && i.data.id === postId
        ? { ...i, data: { ...i.data, conteudo: editConteudo.trim() } }
        : i
    ))
  }

  return (
    <>
      {lightboxUrl && <Lightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}

      {localItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full opacity-60">
          <p className="text-sm" style={{ color: '#906070' }}>Nenhum post ainda.</p>
          <p className="text-xs mt-1" style={{ color: '#B09098' }}>Escreva o primeiro trecho da história abaixo.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {localItems.map(item => {
            if (item.type === 'contexto') {
              return (
                <ContextoCard
                  key={`ctx-${item.data.id}`}
                  contexto={item.data as ContextoCena}
                  onOpenImage={setLightboxUrl}
                  onDelete={handleDeleteContexto}
                />
              )
            }

            const post = item.data as Post
            const povNome = post.personagem_pov || 'Narrador'
            const foto = getFoto(povNome)
            const isMe = post.criado_por === userId
            const isEditing = editingId === post.id
            const hora = new Date(post.created_at).toLocaleString('pt-BR', {
              day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
            })

            return (
              <div key={`post-${post.id}`} className="flex gap-3.5 group">
                <div className="flex-shrink-0 mt-0.5">
                  <Avatar nome={povNome} foto={foto} isMe={isMe} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-sm font-medium" style={{ color: isMe ? '#800020' : '#5C0018' }}>
                      {povNome}
                    </span>
                    <span className="text-[10px]" style={{ color: '#B09098' }}>{hora}</span>
                    {isMe && !isEditing && (
                      <>
                        <button
                          onClick={() => startEdit(post)}
                          className="opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity ml-1"
                          title="Editar"
                        >
                          <Pencil size={11} style={{ color: '#906070' }} />
                        </button>
                        <button
                          onClick={() => handleDeletePost(post.id)}
                          className="opacity-60 md:opacity-0 md:group-hover:opacity-100 transition-opacity"
                          title="Apagar post"
                        >
                          <Trash2 size={11} style={{ color: '#906070' }} />
                        </button>
                      </>
                    )}
                  </div>

                  {isEditing ? (
                    <div>
                      <textarea
                        value={editConteudo}
                        onChange={e => setEditConteudo(e.target.value)}
                        autoFocus
                        rows={Math.max(3, editConteudo.split('\n').length)}
                        className="w-full text-sm leading-relaxed resize-none outline-none rounded-lg px-3 py-2"
                        style={{
                          background: 'rgba(255,255,255,0.70)',
                          border: '0.5px solid rgba(128,0,32,0.20)',
                          color: '#2E0510',
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && e.ctrlKey) saveEdit(post.id)
                          if (e.key === 'Escape') cancelEdit()
                        }}
                      />
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[10px]" style={{ color: '#B09098' }}>
                          Ctrl+Enter para salvar · Esc para cancelar
                        </span>
                        <button
                          onClick={() => saveEdit(post.id)}
                          disabled={saving}
                          className="ml-auto flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg disabled:opacity-40"
                          style={{ background: '#800020', color: '#FAF0F2' }}
                        >
                          <Check size={11} /> Salvar
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg"
                          style={{ background: 'rgba(128,0,32,0.08)', color: '#906070' }}
                        >
                          <X size={11} /> Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <MarkdownText
                      text={post.conteudo}
                      style={{ fontFamily: "'Segoe UI', system-ui, sans-serif", fontSize: 13.5, lineHeight: '1.45', fontWeight: 400, color: '#2E0510', display: 'block', textAlign: 'justify' }}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
      <div ref={bottomRef} />
    </>
  )
}
