'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { X, Trash2, Heart, MessageCircle, Pencil, Check, Send } from 'lucide-react'
import { ImageUpload } from '@/components/image-upload'
import { AccountAvatar, CharAvatar, type PersonagemBasic, type Curtida, type Comentario, type Conta, type Post } from './social-client'

interface Personagem { id: string; nome: string; foto_url: string | null }

interface Props {
  personagemId: string
  personagem: Personagem
  currentConta: Conta | null
  allPosts: Post[]
  userId: string
  actingAs: PersonagemBasic | null
  todosPersonagens: PersonagemBasic[]
  curtidas: Curtida[]
  comentarios: Comentario[]
  onNewPostRef?: (fn: () => void) => void
}

function EditableNum({ value, icon, label, onSave }: { value: number; icon: React.ReactNode; label: string; onSave: (n: number) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))
  function commit() { onSave(parseInt(draft) || 0); setEditing(false) }
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      {editing ? (
        <input type="number" min={0} value={draft} onChange={e => setDraft(e.target.value)}
          onBlur={commit} onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
          autoFocus className="w-12 text-xs text-center outline-none rounded px-1"
          style={{ background: 'rgba(128,0,32,0.07)', border: '0.5px solid rgba(128,0,32,0.20)', color: '#2E0510' }} />
      ) : (
        <button onClick={() => { setDraft(String(value)); setEditing(true) }} className="text-xs font-medium hover:underline" style={{ color: '#2E0510' }}>
          {value.toLocaleString('pt-BR')}
        </button>
      )}
      <span className="text-xs" style={{ color: '#B09098' }}>{label}</span>
    </div>
  )
}

function nowLocalStr() {
  const d = new Date(); d.setMinutes(d.getMinutes() - d.getTimezoneOffset())
  return d.toISOString().slice(0, 16)
}

export function InstagramTab({
  personagemId, personagem, currentConta, allPosts,
  actingAs, todosPersonagens, curtidas: initCurtidas, comentarios: initComentarios,
  onNewPostRef,
}: Props) {
  const [showForm, setShowForm] = useState(false)
  const [midiaUrl, setMidiaUrl] = useState('')
  const [legenda, setLegenda] = useState('')
  const [dataPost, setDataPost] = useState(nowLocalStr())
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState<Post | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingCaption, setEditingCaption] = useState(false)
  const [editCaption, setEditCaption] = useState('')
  const [novoComentario, setNovoComentario] = useState('')
  const [enviandoComentario, setEnviandoComentario] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  const [engagements, setEngagements] = useState<Record<string, { curtidas: number; comentarios: number }>>(() => {
    const init: Record<string, any> = {}
    for (const p of allPosts) init[p.id] = { curtidas: p.curtidas ?? 0, comentarios: p.comentarios ?? 0 }
    return init
  })
  const [curtidas, setCurtidas] = useState<Curtida[]>(initCurtidas)
  const [comentarios, setComentarios] = useState<Comentario[]>(initComentarios)

  const router = useRouter()

  // expõe setShowForm para o pai via ref callback
  if (onNewPostRef) onNewPostRef(() => setShowForm(true))

  const posts = allPosts.filter(p => p.conta_id === currentConta?.id || (!p.conta_id && p.tipo === 'instagram'))

  const handle = currentConta?.username
    ? `@${currentConta.username}`
    : `@${personagem.nome.toLowerCase().replace(/\s+/g, '_')}`

  async function handlePost() {
    if (!midiaUrl || !currentConta) return
    setLoading(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    await supabase.from('posts_sociais').insert({
      personagem_id: personagemId, conteudo: legenda.trim(), midia_url: midiaUrl,
      tipo: 'instagram', conta_id: currentConta.id,
      data_post: new Date(dataPost).toISOString(),
      curtidas: 0, comentarios: 0, criado_por: user?.id,
    })
    setMidiaUrl(''); setLegenda(''); setShowForm(false)
    setDataPost(nowLocalStr()); setLoading(false)
    router.refresh()
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const supabase = createClient()
    await supabase.from('posts_sociais').delete().eq('id', id)
    setSelected(null); router.refresh(); setDeletingId(null)
  }

  async function updateEngagement(postId: string, field: 'curtidas' | 'comentarios', value: number) {
    setSaveError(null)
    setEngagements(prev => ({ ...prev, [postId]: { ...prev[postId], [field]: value } }))
    if (selected?.id === postId) setSelected(s => s ? { ...s, [field]: value } : s)
    const supabase = createClient()
    const { error } = await supabase.from('posts_sociais').update({ [field]: value }).eq('id', postId)
    if (error) setSaveError('Erro ao salvar: ' + error.message)
  }

  async function saveCaption(postId: string) {
    const supabase = createClient()
    await supabase.from('posts_sociais').update({ conteudo: editCaption.trim() }).eq('id', postId)
    setSelected(s => s ? { ...s, conteudo: editCaption.trim() } : s)
    setEditingCaption(false); router.refresh()
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

  if (!currentConta) {
    return (
      <div className="text-center py-10 opacity-50">
        <p className="text-sm" style={{ color: '#906070' }}>Nenhuma conta Instagram ainda</p>
        <p className="text-xs mt-1" style={{ color: '#B09098' }}>Crie uma conta Instagram em Gerenciar contas</p>
      </div>
    )
  }

  return (
    <div>
      {saveError && (
        <p className="text-[11px] mb-3 px-2 py-1.5 rounded-lg" style={{ background: 'rgba(192,0,0,0.08)', color: '#c0392b' }}>
          {saveError}
        </p>
      )}

      {/* Form */}
      {showForm && (
        <div className="rounded-2xl p-5 mb-5" style={{ background: 'rgba(255,255,255,0.65)', border: '0.5px solid rgba(128,0,32,0.12)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#906070' }}>Nova publicação</p>
            <button onClick={() => { setShowForm(false); setMidiaUrl(''); setLegenda('') }} style={{ color: '#B09098' }}><X size={14} /></button>
          </div>
          <div className="mb-4">
            <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: '#906070' }}>Foto *</p>
            <ImageUpload onUpload={setMidiaUrl} currentUrl={midiaUrl} />
          </div>
          <div className="mb-4">
            <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: '#906070' }}>Legenda</p>
            <textarea value={legenda} onChange={e => setLegenda(e.target.value)} placeholder="Escreva uma legenda..." rows={3}
              className="w-full text-sm outline-none resize-none rounded-xl px-3 py-2.5"
              style={{ background: 'rgba(255,255,255,0.70)', border: '0.5px solid rgba(128,0,32,0.12)', color: '#2E0510' }} />
          </div>
          <div className="mb-5">
            <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: '#906070' }}>Data da publicação</p>
            <input type="datetime-local" value={dataPost} onChange={e => setDataPost(e.target.value)}
              className="text-xs outline-none rounded-xl px-3 py-2"
              style={{ background: 'rgba(255,255,255,0.70)', border: '0.5px solid rgba(128,0,32,0.12)', color: '#906070' }} />
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setShowForm(false); setMidiaUrl(''); setLegenda('') }}
              className="flex-1 py-2 rounded-xl text-xs transition-opacity hover:opacity-70"
              style={{ background: 'rgba(128,0,32,0.07)', color: '#906070' }}>Cancelar</button>
            <button onClick={handlePost} disabled={loading || !midiaUrl}
              className="flex-1 py-2 rounded-xl text-xs font-medium disabled:opacity-40 transition-opacity hover:opacity-80"
              style={{ background: '#800020', color: '#FAF0F2' }}>{loading ? 'Publicando...' : 'Publicar'}</button>
          </div>
        </div>
      )}

      {/* Grid */}
      {posts.length === 0 ? (
        <div className="text-center py-10 opacity-50"><p className="text-sm" style={{ color: '#906070' }}>Nenhuma publicação ainda</p></div>
      ) : (
        <div className="grid grid-cols-3 gap-0.5 rounded-xl overflow-hidden">
          {posts.map(post => {
            const eng = engagements[post.id] ?? { curtidas: 0, comentarios: 0 }
            const postCurtidas = curtidas.filter(c => c.post_id === post.id)
            const postComentarios = comentarios.filter(c => c.post_id === post.id)
            const totalCurtidas = postCurtidas.length + eng.curtidas
            const totalComentarios = postComentarios.length + eng.comentarios
            return (
              <button key={post.id} onClick={() => { setSelected(post); setEditingCaption(false) }}
                className="relative aspect-square overflow-hidden group" style={{ background: 'rgba(128,0,32,0.06)' }}>
                {post.midia_url
                  ? <img src={post.midia_url} alt="" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  : <div className="w-full h-full flex items-center justify-center text-3xl" style={{ color: '#C09098' }}>{personagem.nome[0]}</div>
                }
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3"
                  style={{ background: 'rgba(46,5,16,0.40)' }}>
                  <span className="flex items-center gap-1 text-xs font-semibold text-white"><Heart size={14} fill="white" /> {totalCurtidas}</span>
                  <span className="flex items-center gap-1 text-xs font-semibold text-white"><MessageCircle size={14} fill="white" stroke="white" /> {totalComentarios}</span>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {selected && (() => {
        const eng = engagements[selected.id] ?? { curtidas: 0, comentarios: 0 }
        const postCurtidas = curtidas.filter(c => c.post_id === selected.id)
        const postComentarios = comentarios.filter(c => c.post_id === selected.id)
        const jaCurtiu = actingAs ? postCurtidas.some(c => c.personagem_id === actingAs.id) : false
        const dataLabel = new Date(selected.data_post || selected.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
        const totalCurtidas = postCurtidas.length + eng.curtidas

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
            onClick={() => { setSelected(null); setEditingCaption(false) }}>
            <div className="w-full max-w-sm rounded-2xl overflow-hidden flex flex-col"
              style={{ background: 'rgba(245,240,242,0.98)', boxShadow: '0 20px 60px rgba(40,5,15,0.30)', maxHeight: '90vh' }}
              onClick={e => e.stopPropagation()}>

              <div className="flex items-center gap-3 px-4 py-3 flex-shrink-0" style={{ borderBottom: '0.5px solid rgba(128,0,32,0.08)' }}>
                <AccountAvatar conta={currentConta} personagem={personagem} size={32} />
                <div className="flex-1">
                  <p className="text-xs font-semibold leading-none" style={{ color: '#2E0510' }}>{personagem.nome}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: '#B09098' }}>{handle}</p>
                </div>
                <button onClick={() => { setEditingCaption(true); setEditCaption(selected.conteudo) }}
                  className="p-1.5 rounded-lg hover:opacity-60 transition-opacity" style={{ color: '#906070' }}><Pencil size={13} /></button>
                <button onClick={() => handleDelete(selected.id)} disabled={deletingId === selected.id}
                  className="p-1.5 rounded-lg hover:opacity-60 transition-opacity disabled:opacity-30" style={{ color: '#906070' }}><Trash2 size={13} /></button>
                <button onClick={() => { setSelected(null); setEditingCaption(false) }} style={{ color: '#B09098' }}><X size={16} /></button>
              </div>

              {selected.midia_url && <img src={selected.midia_url} alt="" className="w-full object-cover flex-shrink-0" style={{ maxHeight: 280 }} />}

              <div className="px-4 pt-3 pb-2 flex-shrink-0">
                <div className="flex items-center gap-3 mb-2">
                  <button onClick={() => toggleCurtida(selected.id)} disabled={!actingAs}
                    className="transition-transform hover:scale-110 disabled:opacity-40">
                    <Heart size={20} fill={jaCurtiu ? '#800020' : 'none'} stroke={jaCurtiu ? '#800020' : '#906070'} />
                  </button>
                  <MessageCircle size={20} style={{ color: '#906070' }} />
                </div>

                <div className="flex items-center gap-4 mb-2">
                  <EditableNum value={eng.curtidas} icon={<Heart size={12} style={{ color: '#C09098' }} />} label="curtidas" onSave={v => updateEngagement(selected.id, 'curtidas', v)} />
                  <EditableNum value={eng.comentarios} icon={<MessageCircle size={12} style={{ color: '#C09098' }} />} label="comentários" onSave={v => updateEngagement(selected.id, 'comentarios', v)} />
                </div>

                {postCurtidas.length > 0 && (() => {
                  const primeiro = todosPersonagens.find(x => x.id === postCurtidas[0].personagem_id)
                  const totalOutras = (postCurtidas.length - 1) + eng.curtidas
                  return (
                    <div className="flex items-center gap-2 mb-2">
                      <CharAvatar p={primeiro ?? { id: '', nome: '?', foto_url: null }} size={18} />
                      <p className="text-[11px]" style={{ color: '#2E0510' }}>
                        Curtido por <span className="font-semibold">{primeiro?.nome ?? '?'}</span>
                        {totalOutras > 0 && <> e <span className="font-semibold">{totalOutras.toLocaleString('pt-BR')} {totalOutras === 1 ? 'outra pessoa' : 'outras pessoas'}</span></>}
                      </p>
                    </div>
                  )
                })()}

                {editingCaption ? (
                  <div className="mb-2">
                    <textarea value={editCaption} onChange={e => setEditCaption(e.target.value)} rows={3} autoFocus
                      className="w-full text-xs outline-none resize-none rounded-lg px-2 py-2"
                      style={{ background: 'rgba(255,255,255,0.70)', border: '0.5px solid rgba(128,0,32,0.20)', color: '#2E0510' }} />
                    <div className="flex gap-2 mt-1">
                      <button onClick={() => saveCaption(selected.id)} className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded-lg" style={{ background: '#800020', color: '#FAF0F2' }}><Check size={11} /> Salvar</button>
                      <button onClick={() => setEditingCaption(false)} className="text-[11px] px-2.5 py-1 rounded-lg" style={{ background: 'rgba(128,0,32,0.07)', color: '#906070' }}>Cancelar</button>
                    </div>
                  </div>
                ) : selected.conteudo ? (
                  <p className="text-xs leading-relaxed mb-1" style={{ color: '#2E0510' }}>
                    <span className="font-semibold">{personagem.nome} </span>{selected.conteudo}
                  </p>
                ) : null}
                <p className="text-[10px]" style={{ color: '#B09098' }}>{dataLabel}</p>
                {saveError && <p className="text-[10px] mt-1 px-2 py-1 rounded" style={{ background: 'rgba(192,0,0,0.08)', color: '#c0392b' }}>{saveError}</p>}
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-2" style={{ borderTop: '0.5px solid rgba(128,0,32,0.08)' }}>
                {postComentarios.length === 0
                  ? <p className="text-[10px] text-center py-2" style={{ color: '#B09098' }}>Sem comentários ainda</p>
                  : postComentarios.map(c => {
                    const autor = c.personagens as PersonagemBasic | null
                    return (
                      <div key={c.id} className="flex items-start gap-2 py-1.5 group">
                        {autor && <CharAvatar p={autor} size={22} />}
                        <div className="flex-1 min-w-0">
                          <span className="text-[11px] font-semibold" style={{ color: '#2E0510' }}>{autor?.nome ?? '?'} </span>
                          <span className="text-[11px]" style={{ color: '#2E0510' }}>{c.conteudo}</span>
                        </div>
                        <button onClick={() => deletarComentario(c.id)}
                          className="opacity-60 md:opacity-0 md:group-hover:opacity-100 flex-shrink-0 transition-opacity p-0.5 hover:opacity-60"
                          style={{ color: '#B09098' }}><Trash2 size={11} /></button>
                      </div>
                    )
                  })
                }
              </div>

              {actingAs ? (
                <div className="flex items-center gap-2 px-4 py-3 flex-shrink-0" style={{ borderTop: '0.5px solid rgba(128,0,32,0.08)' }}>
                  <CharAvatar p={actingAs} size={26} />
                  <input value={novoComentario} onChange={e => setNovoComentario(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter') enviarComentario(selected.id) }}
                    placeholder={`Comentar como ${actingAs.nome}...`}
                    className="flex-1 text-xs outline-none bg-transparent" style={{ color: '#2E0510' }} />
                  <button onClick={() => enviarComentario(selected.id)} disabled={enviandoComentario || !novoComentario.trim()}
                    className="disabled:opacity-30 transition-opacity hover:opacity-70" style={{ color: '#800020' }}>
                    <Send size={15} />
                  </button>
                </div>
              ) : (
                <p className="text-[10px] text-center py-2 flex-shrink-0" style={{ color: '#B09098', borderTop: '0.5px solid rgba(128,0,32,0.08)' }}>
                  Selecione um personagem acima para interagir
                </p>
              )}
            </div>
          </div>
        )
      })()}
    </div>
  )
}
