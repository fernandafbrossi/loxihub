'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { Trash2, ImageIcon, X, Heart, MessageCircle, Repeat2, Pencil, Check, Send } from 'lucide-react'
import { ImageUpload } from '@/components/image-upload'
import { CharAvatar, type PersonagemBasic, type Curtida, type Comentario } from './social-client'

interface Personagem {
  id: string; nome: string; foto_url: string | null; username: string | null
}

interface Post {
  id: string; conteudo: string; midia_url: string | null
  curtidas: number; comentarios: number; retweets: number
  criado_por: string; created_at: string; data_post: string | null
}

interface Props {
  personagemId: string; personagem: Personagem; posts: Post[]
  userId: string; bio: string | null; seguindo: number; seguidores: number
  actingAs: PersonagemBasic | null
  todosPersonagens: PersonagemBasic[]
  curtidas: Curtida[]
  comentarios: Comentario[]
}

const MAX_CHARS = 280

function EditableNum({ value, icon, onSave }: { value: number; icon: React.ReactNode; onSave: (n: number) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))
  function commit() { onSave(parseInt(draft) || 0); setEditing(false) }
  return (
    <div className="flex items-center gap-1">
      {icon}
      {editing ? (
        <input type="number" min={0} value={draft} onChange={e => setDraft(e.target.value)}
          onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
          autoFocus className="w-10 text-xs text-center outline-none rounded px-1"
          style={{ background: 'rgba(128,0,32,0.07)', border: '0.5px solid rgba(128,0,32,0.20)', color: '#2E0510' }} />
      ) : (
        <button onClick={() => { setDraft(String(value)); setEditing(true) }} className="text-xs hover:underline" style={{ color: '#B09098' }}>
          {value.toLocaleString('pt-BR')}
        </button>
      )}
    </div>
  )
}

function nowLocalStr() {
  const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export function TwitterTab({ personagemId, personagem, posts: initialPosts, userId, bio, seguindo, seguidores, actingAs, todosPersonagens, curtidas: initCurtidas, comentarios: initComentarios }: Props) {
  const [conteudo, setConteudo] = useState('')
  const [midiaUrl, setMidiaUrl] = useState('')
  const [showImg, setShowImg] = useState(false)
  const [dataPost, setDataPost] = useState(nowLocalStr())
  const [loading, setLoading] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editConteudo, setEditConteudo] = useState('')
  const [openComentsId, setOpenComentsId] = useState<string | null>(null)
  const [novoComentario, setNovoComentario] = useState('')
  const [enviandoComentario, setEnviandoComentario] = useState(false)

  const [engagements, setEngagements] = useState<Record<string, { curtidas: number; comentarios: number; retweets: number }>>(() => {
    const init: Record<string, any> = {}
    for (const p of initialPosts) init[p.id] = { curtidas: p.curtidas ?? 0, comentarios: p.comentarios ?? 0, retweets: p.retweets ?? 0 }
    return init
  })
  const [curtidas, setCurtidas] = useState<Curtida[]>(initCurtidas)
  const [comentarios, setComentarios] = useState<Comentario[]>(initComentarios)

  const router = useRouter()

  const handle = personagem.username
    ? `@${personagem.username}`
    : `@${personagem.nome.toLowerCase().replace(/\s+/g, '_')}`

  const remaining = MAX_CHARS - conteudo.length
  const overLimit = remaining < 0
  const nearLimit = remaining <= 20

  async function handlePost() {
    if (!conteudo.trim() || overLimit) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('posts_sociais').insert({
      personagem_id: personagemId, conteudo: conteudo.trim(), midia_url: midiaUrl || null,
      tipo: 'twitter', data_post: new Date(dataPost).toISOString(),
      curtidas: 0, comentarios: 0, retweets: 0, criado_por: user?.id,
    })
    setConteudo(''); setMidiaUrl(''); setShowImg(false); setLoading(false)
    setDataPost(nowLocalStr()); router.refresh()
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const supabase = createClient()
    await supabase.from('posts_sociais').delete().eq('id', id)
    router.refresh(); setDeletingId(null)
  }

  async function saveEdit(id: string) {
    const supabase = createClient()
    await supabase.from('posts_sociais').update({ conteudo: editConteudo.trim() }).eq('id', id)
    setEditingId(null); router.refresh()
  }

  async function updateEngagement(postId: string, field: 'curtidas' | 'comentarios' | 'retweets', value: number) {
    setEngagements(prev => ({ ...prev, [postId]: { ...prev[postId], [field]: value } }))
    const supabase = createClient()
    await supabase.from('posts_sociais').update({ [field]: value }).eq('id', postId)
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

  async function enviarComentario(postId: string) {
    if (!actingAs || !novoComentario.trim()) return
    setEnviandoComentario(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data } = await supabase.from('comentarios_sociais')
      .insert({ post_id: postId, personagem_id: actingAs.id, conteudo: novoComentario.trim(), criado_por: user?.id })
      .select('*, personagens(id, nome, foto_url)').single()
    if (data) setComentarios(prev => [...prev, data])
    setNovoComentario(''); setEnviandoComentario(false)
  }

  async function deletarComentario(comentarioId: string) {
    const supabase = createClient()
    await supabase.from('comentarios_sociais').delete().eq('id', comentarioId)
    setComentarios(prev => prev.filter(c => c.id !== comentarioId))
  }

  return (
    <div>
      {/* Bio + stats Twitter */}
      {(bio || seguindo > 0 || seguidores > 0) && (
        <div className="mb-5 pb-5" style={{ borderBottom: '0.5px solid rgba(128,0,32,0.08)' }}>
          {bio && <p className="text-sm leading-relaxed mb-3" style={{ color: '#2E0510' }}>{bio}</p>}
          <div className="flex gap-5">
            <span className="text-xs" style={{ color: '#906070' }}>
              <strong style={{ color: '#2E0510' }}>{seguindo.toLocaleString('pt-BR')}</strong> seguindo
            </span>
            <span className="text-xs" style={{ color: '#906070' }}>
              <strong style={{ color: '#2E0510' }}>{seguidores.toLocaleString('pt-BR')}</strong> seguidores
            </span>
          </div>
        </div>
      )}

      {/* Compose */}
      <div className="rounded-2xl p-4 mb-5"
        style={{ background: 'rgba(255,255,255,0.60)', border: '0.5px solid rgba(128,0,32,0.10)' }}>
        <div className="flex gap-3">
          <AvatarImg personagem={personagem} />
          <div className="flex-1">
            <textarea value={conteudo} onChange={e => setConteudo(e.target.value)}
              placeholder="O que está acontecendo?" rows={3}
              className="w-full text-sm outline-none resize-none bg-transparent leading-relaxed"
              style={{ color: '#2E0510' }} />

            {showImg && (
              <div className="mt-2">
                <ImageUpload onUpload={setMidiaUrl} currentUrl={midiaUrl} />
              </div>
            )}

            <div className="flex items-center gap-2 mt-3">
              <label className="text-[10px] uppercase tracking-wider" style={{ color: '#B09098' }}>Data</label>
              <input type="datetime-local" value={dataPost} onChange={e => setDataPost(e.target.value)}
                className="text-xs outline-none rounded-lg px-2 py-1"
                style={{ background: 'rgba(128,0,32,0.05)', border: '0.5px solid rgba(128,0,32,0.12)', color: '#906070' }} />
            </div>

            <div className="flex items-center justify-between mt-3 pt-3"
              style={{ borderTop: '0.5px solid rgba(128,0,32,0.08)' }}>
              <button onClick={() => setShowImg(v => !v)} type="button"
                className="p-1.5 rounded-lg transition-opacity hover:opacity-60" style={{ color: '#906070' }}>
                {showImg ? <X size={15} /> : <ImageIcon size={15} />}
              </button>
              <div className="flex items-center gap-3">
                {conteudo.length > 0 && (
                  <svg viewBox="0 0 36 36" className="w-7 h-7 -rotate-90">
                    <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(128,0,32,0.12)" strokeWidth="3" />
                    <circle cx="18" cy="18" r="15.9" fill="none"
                      stroke={overLimit ? '#c0392b' : nearLimit ? '#e67e22' : '#800020'}
                      strokeWidth="3"
                      strokeDasharray={`${Math.min((conteudo.length / MAX_CHARS) * 100, 100)} 100`}
                      strokeLinecap="round" />
                  </svg>
                )}
                {nearLimit && (
                  <span className="text-xs font-medium" style={{ color: overLimit ? '#c0392b' : '#e67e22' }}>{remaining}</span>
                )}
                <button onClick={handlePost} disabled={loading || !conteudo.trim() || overLimit}
                  className="text-xs font-semibold px-4 py-1.5 rounded-full disabled:opacity-40 transition-opacity hover:opacity-80"
                  style={{ background: '#800020', color: '#FAF0F2' }}>
                  {loading ? 'Postando...' : 'Tweetar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feed */}
      {initialPosts.length === 0 ? (
        <div className="text-center py-10 opacity-50">
          <p className="text-sm" style={{ color: '#906070' }}>Nenhum tweet ainda</p>
        </div>
      ) : (
        <div className="flex flex-col">
          {initialPosts.map((post, i) => {
            const eng = engagements[post.id] ?? { curtidas: 0, comentarios: 0, retweets: 0 }
            const postCurtidas = curtidas.filter(c => c.post_id === post.id)
            const postComentarios = comentarios.filter(c => c.post_id === post.id)
            const jaCurtiu = actingAs ? postCurtidas.some(c => c.personagem_id === actingAs.id) : false
            const comentariosAbertos = openComentsId === post.id
            const hora = new Date(post.data_post || post.created_at).toLocaleString('pt-BR', {
              day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
            })
            const isEditing = editingId === post.id

            return (
              <div key={post.id} className="group"
                style={{ borderTop: i === 0 ? '0.5px solid rgba(128,0,32,0.08)' : 'none', borderBottom: '0.5px solid rgba(128,0,32,0.08)' }}>

                {/* Tweet principal */}
                <div className="flex gap-3 py-4">
                  <AvatarImg personagem={personagem} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-2 mb-1">
                      <span className="text-sm font-semibold" style={{ color: '#2E0510' }}>{personagem.nome}</span>
                      <span className="text-xs" style={{ color: '#B09098' }}>{handle}</span>
                      <span className="text-xs" style={{ color: '#B09098' }}>· {hora}</span>
                    </div>

                    {isEditing ? (
                      <div>
                        <textarea value={editConteudo} onChange={e => setEditConteudo(e.target.value)}
                          rows={3} autoFocus
                          className="w-full text-sm outline-none resize-none rounded-lg px-3 py-2"
                          style={{ background: 'rgba(255,255,255,0.70)', border: '0.5px solid rgba(128,0,32,0.20)', color: '#2E0510' }} />
                        <div className="flex gap-2 mt-1.5">
                          <button onClick={() => saveEdit(post.id)}
                            className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg"
                            style={{ background: '#800020', color: '#FAF0F2' }}><Check size={11} /> Salvar</button>
                          <button onClick={() => setEditingId(null)}
                            className="text-[11px] px-2.5 py-1 rounded-lg"
                            style={{ background: 'rgba(128,0,32,0.07)', color: '#906070' }}>Cancelar</button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: '#2E0510' }}>{post.conteudo}</p>
                    )}

                    {post.midia_url && !isEditing && (
                      <img src={post.midia_url} alt="" className="mt-3 rounded-2xl w-full object-cover" style={{ maxHeight: 300 }} />
                    )}

                    {/* Engajamento */}
                    {!isEditing && (
                      <div className="flex items-center gap-4 mt-3">
                        {/* Comentários — toggle seção */}
                        <button onClick={() => setOpenComentsId(comentariosAbertos ? null : post.id)}
                          className="flex items-center gap-1 transition-opacity hover:opacity-60"
                          title="Ver comentários">
                          <MessageCircle size={14} style={{ color: comentariosAbertos ? '#800020' : '#B09098' }} />
                          <span className="text-xs" style={{ color: '#B09098' }}>{postComentarios.length}</span>
                        </button>

                        {/* Retweets fictícios */}
                        <EditableNum value={eng.retweets}
                          icon={<Repeat2 size={14} style={{ color: '#B09098' }} />}
                          onSave={v => updateEngagement(post.id, 'retweets', v)} />

                        {/* Curtida real */}
                        <button onClick={() => toggleCurtida(post.id)} disabled={!actingAs}
                          className="flex items-center gap-1 transition-transform hover:scale-110 disabled:opacity-30"
                          title={actingAs ? `Curtir como ${actingAs.nome}` : 'Selecione um personagem'}>
                          <Heart size={14} fill={jaCurtiu ? '#800020' : 'none'} stroke={jaCurtiu ? '#800020' : '#B09098'} />
                          <span className="text-xs" style={{ color: jaCurtiu ? '#800020' : '#B09098' }}>{postCurtidas.length}</span>
                        </button>

                        {/* Curtidas totais editáveis */}
                        <EditableNum value={eng.curtidas}
                          icon={<Heart size={13} style={{ color: '#B09098' }} />}
                          onSave={v => updateEngagement(post.id, 'curtidas', v)} />

                        {/* Comentários totais editáveis */}
                        <EditableNum value={eng.comentarios}
                          icon={<MessageCircle size={13} style={{ color: '#B09098' }} />}
                          onSave={v => updateEngagement(post.id, 'comentarios', v)} />
                      </div>
                    )}

                    {/* Quem curtiu (avatares reais) */}
                    {postCurtidas.length > 0 && !isEditing && (
                      <div className="flex items-center gap-1.5 mt-2">
                        {postCurtidas.slice(0, 6).map(c => {
                          const p = { id: c.personagem_id, nome: '?', foto_url: null, ...todosPersonagens.find(x => x.id === c.personagem_id) } as PersonagemBasic
                          return <div key={c.id} title={p.nome}><CharAvatar p={p} size={16} /></div>
                        })}
                        <span className="text-[10px]" style={{ color: '#B09098' }}>curtiram</span>
                      </div>
                    )}
                  </div>

                  {/* Ações editar/deletar */}
                  <div className="flex flex-col gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                    {!isEditing && (
                      <button onClick={() => { setEditingId(post.id); setEditConteudo(post.conteudo) }}
                        className="p-1 hover:opacity-60 transition-opacity" style={{ color: '#B09098' }}>
                        <Pencil size={13} />
                      </button>
                    )}
                    <button onClick={() => handleDelete(post.id)} disabled={deletingId === post.id}
                      className="p-1 hover:opacity-60 transition-opacity disabled:opacity-20" style={{ color: '#B09098' }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Seção de comentários */}
                {comentariosAbertos && (
                  <div className="ml-12 mb-3 rounded-xl overflow-hidden"
                    style={{ background: 'rgba(255,255,255,0.50)', border: '0.5px solid rgba(128,0,32,0.08)' }}>

                    {/* Lista de comentários */}
                    {postComentarios.length === 0 ? (
                      <p className="text-[10px] text-center py-3" style={{ color: '#B09098' }}>Sem respostas ainda</p>
                    ) : (
                      <div className="divide-y" style={{ '--tw-divide-opacity': 1 } as any}>
                        {postComentarios.map(c => {
                          const autor = c.personagens as PersonagemBasic | null
                          return (
                            <div key={c.id} className="flex items-start gap-2 px-3 py-2.5 group/c">
                              {autor && <CharAvatar p={autor} size={24} />}
                              <div className="flex-1 min-w-0">
                                <span className="text-[11px] font-semibold" style={{ color: '#2E0510' }}>{autor?.nome ?? '?'} </span>
                                <span className="text-[11px]" style={{ color: '#2E0510' }}>{c.conteudo}</span>
                              </div>
                              <button onClick={() => deletarComentario(c.id)}
                                className="opacity-0 group-hover/c:opacity-100 flex-shrink-0 transition-opacity p-0.5 hover:opacity-60"
                                style={{ color: '#B09098' }}><Trash2 size={11} /></button>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Campo novo comentário */}
                    {actingAs ? (
                      <div className="flex items-center gap-2 px-3 py-2.5"
                        style={{ borderTop: '0.5px solid rgba(128,0,32,0.08)' }}>
                        <CharAvatar p={actingAs} size={22} />
                        <input value={novoComentario} onChange={e => setNovoComentario(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') enviarComentario(post.id) }}
                          placeholder={`Responder como ${actingAs.nome}...`}
                          className="flex-1 text-xs outline-none bg-transparent" style={{ color: '#2E0510' }} />
                        <button onClick={() => enviarComentario(post.id)}
                          disabled={enviandoComentario || !novoComentario.trim()}
                          className="disabled:opacity-30 transition-opacity hover:opacity-70" style={{ color: '#800020' }}>
                          <Send size={14} />
                        </button>
                      </div>
                    ) : (
                      <p className="text-[10px] text-center py-2" style={{ color: '#B09098', borderTop: '0.5px solid rgba(128,0,32,0.08)' }}>
                        Selecione um personagem acima para responder
                      </p>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function AvatarImg({ personagem }: { personagem: Personagem }) {
  return (
    <div className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-semibold"
      style={{ background: 'linear-gradient(135deg, #800020, #5C0018)', color: '#FAF0F2', minWidth: 36, minHeight: 36 }}>
      {personagem.foto_url
        ? <img src={personagem.foto_url} alt="" className="w-full h-full object-cover" />
        : personagem.nome[0].toUpperCase()}
    </div>
  )
}
