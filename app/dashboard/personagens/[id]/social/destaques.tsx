'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { MultiImageUpload } from '@/components/multi-image-upload'
import { PostCarousel } from '@/components/post-carousel'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { pathNoStorage } from '@/lib/social-utils'

export interface Destaque {
  id: string
  conta_id: string
  titulo: string
  capa_url: string | null
  midia_urls: string[]
}

interface Props {
  contaId: string
  iniciais: Destaque[]
}

const MAX_FOTOS = 20

export function Destaques({ contaId, iniciais }: Props) {
  const [lista, setLista] = useState<Destaque[]>(iniciais)
  const [vendoId, setVendoId] = useState<string | null>(null)
  const [menuAberto, setMenuAberto] = useState(false)
  const [formAberto, setFormAberto] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [titulo, setTitulo] = useState('')
  const [fotos, setFotos] = useState<string[]>([])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [confirmarId, setConfirmarId] = useState<string | null>(null)
  const [apagando, setApagando] = useState(false)

  const vendo = lista.find(d => d.id === vendoId) ?? null

  function abrirNovo() {
    setEditandoId(null); setTitulo(''); setFotos([]); setErro(null); setFormAberto(true)
  }

  function abrirEdicao(d: Destaque) {
    setMenuAberto(false); setVendoId(null)
    setEditandoId(d.id); setTitulo(d.titulo); setFotos(d.midia_urls); setErro(null); setFormAberto(true)
  }

  async function salvar() {
    if (!titulo.trim()) { setErro('Dê um nome ao destaque.'); return }
    if (fotos.length === 0) { setErro('Adicione pelo menos uma foto.'); return }
    setSalvando(true); setErro(null)
    const supabase = createClient()
    const dados = { titulo: titulo.trim(), capa_url: fotos[0], midia_urls: fotos }

    if (editandoId) {
      const antigo = lista.find(d => d.id === editandoId)
      const { error } = await supabase.from('destaques_sociais').update(dados).eq('id', editandoId)
      if (error) { setErro('Erro ao salvar: ' + error.message); setSalvando(false); return }
      const removidas = (antigo?.midia_urls ?? []).filter(u => !fotos.includes(u)).map(pathNoStorage).filter((x): x is string => !!x)
      if (removidas.length) await supabase.storage.from('imagens').remove(removidas)
      setLista(prev => prev.map(d => d.id === editandoId ? { ...d, ...dados } : d))
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { data, error } = await supabase.from('destaques_sociais')
        .insert({ ...dados, conta_id: contaId, criado_por: user?.id }).select().single()
      if (error || !data) {
        setErro(error?.message.includes('destaques_sociais')
          ? 'Rode o schema-destaques.sql no Supabase para ativar os destaques.'
          : 'Erro ao criar: ' + (error?.message ?? ''))
        setSalvando(false); return
      }
      setLista(prev => [...prev, data as Destaque])
    }
    setSalvando(false); setFormAberto(false)
  }

  async function apagar() {
    const d = lista.find(x => x.id === confirmarId)
    if (!d) return
    setApagando(true)
    const supabase = createClient()
    const { error } = await supabase.from('destaques_sociais').delete().eq('id', d.id)
    if (!error) {
      const caminhos = d.midia_urls.map(pathNoStorage).filter((x): x is string => !!x)
      if (caminhos.length) await supabase.storage.from('imagens').remove(caminhos)
      setLista(prev => prev.filter(x => x.id !== d.id))
      setVendoId(null)
    }
    setApagando(false); setConfirmarId(null); setMenuAberto(false)
  }

  return (
    <>
      <div className="flex gap-4 overflow-x-auto px-4 pt-3 pb-2" style={{ scrollbarWidth: 'none' }}>
        {lista.map(d => (
          <button key={d.id} onClick={() => { setVendoId(d.id); setMenuAberto(false) }}
            className="flex flex-col items-center gap-1.5 flex-shrink-0 w-[68px]">
            <span className="w-[66px] h-[66px] rounded-full p-[2.5px] block" style={{ border: '1.5px solid var(--p-20)' }}>
              <span className="block w-full h-full rounded-full overflow-hidden" style={{ background: 'var(--p-06)' }}>
                {(d.capa_url ?? d.midia_urls[0]) && (
                  <img src={d.capa_url ?? d.midia_urls[0]} alt="" className="w-full h-full object-cover" />
                )}
              </span>
            </span>
            <span className="text-[11px] w-full truncate text-center" style={{ color: 'var(--foreground)' }}>{d.titulo}</span>
          </button>
        ))}

        <button onClick={abrirNovo} className="flex flex-col items-center gap-1.5 flex-shrink-0 w-[68px]" aria-label="Novo destaque">
          <span className="w-[66px] h-[66px] rounded-full flex items-center justify-center"
            style={{ border: '1.5px dashed var(--p-20)', color: 'var(--muted-light)' }}>
            <Plus size={22} />
          </span>
          <span className="text-[11px]" style={{ color: 'var(--muted-light)' }}>Novo</span>
        </button>
      </div>

      {/* Visualização (galeria simples, sem player de stories) */}
      {vendo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
          onClick={() => setVendoId(null)}>
          <div className="w-full max-w-sm rounded-2xl overflow-hidden"
            style={{ background: 'rgba(250,247,248,0.99)', boxShadow: '0 20px 60px rgba(40,5,15,0.35)' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-4 h-14">
              <span className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0" style={{ background: 'var(--p-06)' }}>
                {(vendo.capa_url ?? vendo.midia_urls[0]) && <img src={vendo.capa_url ?? vendo.midia_urls[0]} alt="" className="w-full h-full object-cover" />}
              </span>
              <p className="flex-1 text-sm font-semibold truncate" style={{ color: 'var(--foreground)' }}>{vendo.titulo}</p>
              <div className="relative">
                <button onClick={() => setMenuAberto(v => !v)} aria-label="Mais opções"
                  className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-black/5" style={{ color: 'var(--foreground)' }}>
                  <MoreHorizontal size={20} />
                </button>
                {menuAberto && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setMenuAberto(false)} />
                    <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-xl overflow-hidden"
                      style={{ background: 'rgba(255,255,255,0.99)', border: '0.5px solid var(--p-12)', boxShadow: '0 8px 24px var(--fg-12)' }}>
                      <button onClick={() => abrirEdicao(vendo)}
                        className="flex items-center gap-3 w-full px-4 h-11 text-sm text-left hover:bg-black/5" style={{ color: 'var(--foreground)' }}>
                        <Pencil size={16} /> Editar
                      </button>
                      <button onClick={() => { setMenuAberto(false); setConfirmarId(vendo.id) }}
                        className="flex items-center gap-3 w-full px-4 h-11 text-sm text-left hover:bg-black/5"
                        style={{ color: 'var(--destructive)', borderTop: '0.5px solid var(--p-08)' }}>
                        <Trash2 size={16} /> Excluir
                      </button>
                    </div>
                  </>
                )}
              </div>
              <button onClick={() => setVendoId(null)} aria-label="Fechar"
                className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center hover:bg-black/5" style={{ color: 'var(--foreground)' }}>
                <X size={20} />
              </button>
            </div>
            <PostCarousel key={vendo.id} urls={vendo.midia_urls} />
          </div>
        </div>
      )}

      {/* Criar / editar */}
      {formAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)' }}
          onClick={() => !salvando && setFormAberto(false)}>
          <div className="w-full max-w-md rounded-2xl p-5 overflow-y-auto"
            style={{ background: 'rgba(250,247,248,0.99)', maxHeight: '90vh' }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--foreground-muted)' }}>
                {editandoId ? 'Editar destaque' : 'Novo destaque'}
              </p>
              <button onClick={() => setFormAberto(false)} aria-label="Fechar" className="w-8 h-8 flex items-center justify-center" style={{ color: 'var(--muted-light)' }}>
                <X size={16} />
              </button>
            </div>
            <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--foreground-muted)' }}>Nome</p>
            <input value={titulo} onChange={e => setTitulo(e.target.value.slice(0, 20))} placeholder="Ex.: Viagens"
              className="w-full text-sm outline-none rounded-xl px-3 py-2.5 mb-4"
              style={{ background: 'rgba(255,255,255,0.70)', border: '0.5px solid var(--p-12)', color: 'var(--foreground)' }} />
            <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--foreground-muted)' }}>
              Fotos (a primeira vira a capa)
            </p>
            <MultiImageUpload urls={fotos} onChange={setFotos} max={MAX_FOTOS} />
            {erro && <p className="text-[11px] mt-3" style={{ color: 'var(--destructive)' }}>{erro}</p>}
            <div className="flex gap-2 mt-5">
              <button onClick={() => setFormAberto(false)} disabled={salvando}
                className="flex-1 py-2.5 rounded-xl text-xs" style={{ background: 'var(--p-07)', color: 'var(--foreground-muted)' }}>Cancelar</button>
              <button onClick={salvar} disabled={salvando}
                className="flex-1 py-2.5 rounded-xl text-xs font-medium disabled:opacity-40"
                style={{ background: 'var(--btn-primary)', color: 'var(--primary-foreground)' }}>
                {salvando ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog aberto={confirmarId !== null} titulo="Apagar este destaque?"
        mensagem="O destaque e as fotos dele serão removidos. Essa ação não pode ser desfeita."
        carregando={apagando} onConfirmar={apagar} onCancelar={() => !apagando && setConfirmarId(null)} />
    </>
  )
}
