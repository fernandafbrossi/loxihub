'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Plus, Star, Pencil, Trash2, X, ScrollText } from 'lucide-react'

export interface CanonItem {
  id: string
  categoria: string
  titulo: string
  texto: string | null
  destaque: boolean
  personagem_id: string | null
  thread_id: string | null
}

interface Props {
  universoId: string
  canons: CanonItem[]
  personagens: { id: string; nome: string }[]
  threads: { id: string; titulo: string }[]
  tabelaOk: boolean
}

export const CATEGORIAS_BASE = [
  'Aparência', 'Personalidade', 'Passado', 'Relacionamento', 'Memórias',
  'Segredos', 'Rotina e hábitos', 'Trabalho e posses', 'Regras do mundo', 'Cronologia',
]
const NOVA = '__nova__'

const glassCard = {
  background: 'var(--card)',
  border: '0.5px solid var(--card-border)',
  borderRadius: '20px',
  boxShadow: 'var(--shadow-card)',
} as const

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  borderRadius: '10px',
  fontSize: '13px',
  background: 'var(--input)',
  border: '0.5px solid var(--p-15)',
  color: 'var(--foreground)',
  outline: 'none',
} as const

const lbl = 'block text-[10px] font-medium uppercase tracking-wider mb-1'

export function Canons({ universoId, canons, personagens, threads, tabelaOk }: Props) {
  const router = useRouter()
  const [filtro, setFiltro] = useState<string>('todas')
  const [form, setForm] = useState<{ aberto: boolean; editando: CanonItem | null }>({ aberto: false, editando: null })

  // Lista de categorias: as base + as que já foram criadas neste universo
  const categorias = useMemo(() => {
    const extras = canons.map(c => c.categoria).filter(c => !CATEGORIAS_BASE.includes(c))
    return [...CATEGORIAS_BASE, ...Array.from(new Set(extras)).sort()]
  }, [canons])

  const usadas = useMemo(() => Array.from(new Set(canons.map(c => c.categoria))), [canons])
  const lista = canons
    .filter(c => filtro === 'todas' || c.categoria === filtro)
    .sort((a, b) => Number(b.destaque) - Number(a.destaque))

  const nomeDe = (id: string | null) => personagens.find(p => p.id === id)?.nome
  const threadDe = (id: string | null) => threads.find(t => t.id === id)

  async function alternarDestaque(c: CanonItem) {
    await createClient().from('canons').update({ destaque: !c.destaque }).eq('id', c.id)
    router.refresh()
  }
  async function excluir(c: CanonItem) {
    await createClient().from('canons').delete().eq('id', c.id)
    router.refresh()
  }

  return (
    <section className="p-5" style={glassCard} aria-label="Canons">
      <div className="flex items-center justify-between mb-3 gap-3">
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider" style={{ color: 'var(--foreground-muted)' }}>Canons</p>
          <p className="text-[11px]" style={{ color: 'var(--foreground-muted)' }}>Fatos estabelecidos que não podem se contradizer</p>
        </div>
        {tabelaOk && !form.aberto && (
          <button onClick={() => setForm({ aberto: true, editando: null })} className="flex items-center gap-1 text-[11px] font-medium hover:opacity-70 whitespace-nowrap" style={{ color: 'var(--primary)' }}>
            <Plus size={12} /> Novo canon
          </button>
        )}
      </div>

      {!tabelaOk && (
        <p className="text-xs p-3 rounded-xl" style={{ background: 'var(--p-08)', color: 'var(--primary)', border: '1px dashed var(--p-25)' }}>
          Rode <code>supabase/schema-canons.sql</code> no SQL Editor do Supabase para ativar os canons.
        </p>
      )}

      {tabelaOk && form.aberto && (
        <CanonForm
          key={form.editando?.id ?? 'novo'}
          universoId={universoId}
          categorias={categorias}
          personagens={personagens}
          threads={threads}
          inicial={form.editando}
          categoriaInicial={filtro !== 'todas' ? filtro : undefined}
          onFechar={() => setForm({ aberto: false, editando: null })}
          onSalvo={() => { setForm({ aberto: false, editando: null }); router.refresh() }}
        />
      )}

      {tabelaOk && usadas.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-3">
          {['todas', ...usadas].map(c => (
            <button
              key={c}
              onClick={() => setFiltro(c)}
              className="text-[11px] font-medium px-3 py-1 rounded-full"
              style={filtro === c
                ? { background: 'var(--btn-primary)', color: 'var(--primary-foreground)' }
                : { background: 'var(--p-08)', color: 'var(--primary)' }}
            >
              {c === 'todas' ? 'Todas' : c}
            </button>
          ))}
        </div>
      )}

      {tabelaOk && canons.length === 0 && !form.aberto && (
        <p className="text-xs py-4 text-center" style={{ color: 'var(--foreground-muted)' }}>
          Nenhum canon ainda. Registre o que já foi estabelecido, como a cor dos olhos da Lia ou quem sabe do segredo.
        </p>
      )}

      <div className="grid sm:grid-cols-2 gap-2.5">
        {lista.map(c => {
          const th = threadDe(c.thread_id)
          return (
            <article key={c.id} className="p-3.5 rounded-2xl flex flex-col gap-1.5" style={{ background: 'var(--surface)', border: '0.5px solid var(--card-border)' }}>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-medium px-2 py-0.5 rounded-full" style={{ background: 'var(--p-09)', color: 'var(--primary-dark)' }}>{c.categoria}</span>
                {nomeDe(c.personagem_id) && (
                  <Link href={`/dashboard/personagens/${c.personagem_id}`} className="text-[10px] font-medium hover:opacity-70" style={{ color: 'var(--primary)' }}>
                    {nomeDe(c.personagem_id)}
                  </Link>
                )}
                <div className="ml-auto flex items-center gap-0.5">
                  <button onClick={() => alternarDestaque(c)} aria-label={c.destaque ? 'Tirar destaque' : 'Destacar'} className="p-1 hover:opacity-70">
                    <Star size={13} style={{ color: 'var(--gold-dark)' }} fill={c.destaque ? 'currentColor' : 'none'} />
                  </button>
                  <button onClick={() => setForm({ aberto: true, editando: c })} aria-label="Editar" className="p-1 hover:opacity-70"><Pencil size={12} style={{ color: 'var(--foreground-muted)' }} /></button>
                  <button onClick={() => excluir(c)} aria-label="Excluir" className="p-1 hover:opacity-70"><Trash2 size={12} style={{ color: 'var(--foreground-muted)' }} /></button>
                </div>
              </div>
              <p className="text-[13px] font-medium" style={{ color: 'var(--foreground)' }}>{c.titulo}</p>
              {c.texto && <p className="text-xs leading-relaxed whitespace-pre-wrap" style={{ color: 'var(--foreground-muted)' }}>{c.texto}</p>}
              {th && (
                <Link href={`/dashboard/threads/${th.id}`} className="flex items-center gap-1 text-[10px] hover:opacity-70 mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
                  <ScrollText size={10} /> <span className="truncate">{th.titulo}</span>
                </Link>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}

function CanonForm({ universoId, categorias, personagens, threads, inicial, categoriaInicial, onFechar, onSalvo }: {
  universoId: string
  categorias: string[]
  personagens: { id: string; nome: string }[]
  threads: { id: string; titulo: string }[]
  inicial: CanonItem | null
  categoriaInicial?: string
  onFechar: () => void
  onSalvo: () => void
}) {
  const [categoria, setCategoria] = useState(inicial?.categoria ?? categoriaInicial ?? categorias[0])
  const [nova, setNova] = useState('')
  const [titulo, setTitulo] = useState(inicial?.titulo ?? '')
  const [texto, setTexto] = useState(inicial?.texto ?? '')
  const [personagemId, setPersonagemId] = useState(inicial?.personagem_id ?? '')
  const [threadId, setThreadId] = useState(inicial?.thread_id ?? '')
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const categoriaFinal = categoria === NOVA ? nova.trim() : categoria

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    if (!categoriaFinal) return
    setSalvando(true)
    setErro('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const campos = {
      categoria: categoriaFinal,
      titulo: titulo.trim(),
      texto: texto.trim() || null,
      personagem_id: personagemId || null,
      thread_id: threadId || null,
    }
    const { error } = inicial
      ? await supabase.from('canons').update(campos).eq('id', inicial.id)
      : await supabase.from('canons').insert({ ...campos, universo_id: universoId, criado_por: user?.id })
    if (error) { setErro(error.message); setSalvando(false); return }
    onSalvo()
  }

  return (
    <form onSubmit={salvar} className="mb-4 p-4 rounded-2xl flex flex-col gap-3" style={{ background: 'var(--p-05)', border: '1px dashed var(--p-25)' }}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium" style={{ color: 'var(--foreground)' }}>{inicial ? 'Editar canon' : 'Novo canon'}</p>
        <button type="button" onClick={onFechar} aria-label="Fechar" className="hover:opacity-70"><X size={14} style={{ color: 'var(--foreground-muted)' }} /></button>
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className={lbl} htmlFor="cn-cat" style={{ color: 'var(--foreground-muted)' }}>Categoria</label>
          <select id="cn-cat" value={categoria} onChange={e => setCategoria(e.target.value)} style={inputStyle}>
            {categorias.map(c => <option key={c} value={c}>{c}</option>)}
            <option value={NOVA}>+ Nova categoria…</option>
          </select>
          {categoria === NOVA && (
            <input aria-label="Nome da nova categoria" autoFocus value={nova} onChange={e => setNova(e.target.value)} placeholder="Nome da categoria" style={{ ...inputStyle, marginTop: 6 }} />
          )}
        </div>
        <div>
          <label className={lbl} htmlFor="cn-pers" style={{ color: 'var(--foreground-muted)' }}>Personagem</label>
          <select id="cn-pers" value={personagemId} onChange={e => setPersonagemId(e.target.value)} style={inputStyle}>
            <option value="">Nenhum (do universo)</option>
            {personagens.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className={lbl} htmlFor="cn-tit" style={{ color: 'var(--foreground-muted)' }}>Canon</label>
        <input id="cn-tit" required value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex.: Olhos verdes" style={inputStyle} />
      </div>
      <div>
        <label className={lbl} htmlFor="cn-txt" style={{ color: 'var(--foreground-muted)' }}>Detalhes (opcional)</label>
        <textarea id="cn-txt" rows={3} value={texto} onChange={e => setTexto(e.target.value)} style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }} />
      </div>
      <div>
        <label className={lbl} htmlFor="cn-th" style={{ color: 'var(--foreground-muted)' }}>Thread de origem (opcional)</label>
        <select id="cn-th" value={threadId} onChange={e => setThreadId(e.target.value)} style={inputStyle}>
          <option value="">Nenhuma</option>
          {threads.map(t => <option key={t.id} value={t.id}>{t.titulo}</option>)}
        </select>
      </div>

      {erro && <p className="text-xs" style={{ color: 'var(--destructive)' }}>{erro}</p>}
      <div className="flex gap-3 items-center">
        <button type="submit" disabled={salvando || !titulo.trim() || !categoriaFinal} className="px-4 py-2 rounded-xl text-xs font-medium disabled:opacity-50" style={{ background: 'var(--btn-primary)', color: 'var(--primary-foreground)' }}>
          {salvando ? 'Salvando…' : 'Salvar'}
        </button>
        <button type="button" onClick={onFechar} className="text-xs hover:opacity-70" style={{ color: 'var(--foreground-muted)' }}>Cancelar</button>
      </div>
    </form>
  )
}
