'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { MultiImageUpload } from '@/components/multi-image-upload'

export interface EventoDados {
  id?: string
  titulo: string
  data_jogo: string
  thread_id: string | null
  descricao: string | null
  clima: string | null
  acontecimentos: string | null
  imagens: string[]
}

interface Props {
  universoId: string
  threads: { id: string; titulo: string; status: string }[]
  inicial?: EventoDados
  dataSugerida?: string
}

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '10px',
  fontSize: '13px',
  background: 'var(--input)',
  border: '0.5px solid var(--p-15)',
  color: 'var(--foreground)',
  outline: 'none',
} as const

const labelCls = 'block text-[10px] font-medium uppercase tracking-wider mb-1.5'

export function EventoForm({ universoId, threads, inicial, dataSugerida }: Props) {
  const router = useRouter()
  const [titulo, setTitulo] = useState(inicial?.titulo ?? '')
  const [data, setData] = useState(inicial?.data_jogo ?? dataSugerida ?? '')
  const [threadId, setThreadId] = useState(inicial?.thread_id ?? '')
  const [descricao, setDescricao] = useState(inicial?.descricao ?? '')
  const [clima, setClima] = useState(inicial?.clima ?? '')
  const [acontecimentos, setAcontecimentos] = useState(inicial?.acontecimentos ?? '')
  const [imagens, setImagens] = useState<string[]>(inicial?.imagens ?? [])
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState('')

  const thread = threads.find(t => t.id === threadId)
  const voltar = inicial?.id ? `/dashboard/universos/${universoId}/eventos/${inicial.id}` : `/dashboard/universos/${universoId}`

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setErro('')
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    const campos = {
      titulo: titulo.trim(),
      data_jogo: data,
      thread_id: threadId || null,
      descricao: descricao.trim() || null,
      clima: clima.trim() || null,
      acontecimentos: acontecimentos.trim() || null,
      imagens,
    }

    const resp = inicial?.id
      ? await supabase.from('eventos').update(campos).eq('id', inicial.id).select('id').single()
      : await supabase.from('eventos').insert({ ...campos, universo_id: universoId, criado_por: user?.id }).select('id').single()

    if (resp.error || !resp.data) {
      setErro(resp.error?.message ?? 'Não foi possível salvar.')
      setSalvando(false)
      return
    }
    router.push(`/dashboard/universos/${universoId}/eventos/${resp.data.id}`)
    router.refresh()
  }

  return (
    <form onSubmit={salvar} className="flex flex-col gap-5">
      <div className="grid sm:grid-cols-[1fr_180px] gap-3">
        <div>
          <label className={labelCls} htmlFor="ev-titulo" style={{ color: 'var(--foreground-muted)' }}>Título</label>
          <input id="ev-titulo" required value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex.: Coachella, dia 1" style={inputStyle} />
        </div>
        <div>
          <label className={labelCls} htmlFor="ev-data" style={{ color: 'var(--foreground-muted)' }}>Data no jogo</label>
          <input id="ev-data" type="date" required value={data} onChange={e => setData(e.target.value)} style={inputStyle} />
        </div>
      </div>

      <div>
        <label className={labelCls} htmlFor="ev-thread" style={{ color: 'var(--foreground-muted)' }}>Thread do evento (opcional)</label>
        <select id="ev-thread" value={threadId} onChange={e => setThreadId(e.target.value)} style={inputStyle}>
          <option value="">Nenhuma</option>
          {threads.map(t => <option key={t.id} value={t.id}>{t.titulo}{t.status === 'concluida' ? ' (concluída)' : ''}</option>)}
        </select>
      </div>

      <div>
        <label className={labelCls} htmlFor="ev-desc" style={{ color: 'var(--foreground-muted)' }}>Descrição do evento</label>
        <textarea id="ev-desc" rows={5} value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Onde é, quem vai, o que está planejado, o clima da noite…" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
      </div>

      <div>
        <label className={labelCls} htmlFor="ev-clima" style={{ color: 'var(--foreground-muted)' }}>Tempo</label>
        <input id="ev-clima" value={clima} onChange={e => setClima(e.target.value)} placeholder="Ex.: Ensolarado, 32°C, vento seco do deserto" style={inputStyle} />
      </div>

      <div>
        <p className={labelCls} style={{ color: 'var(--foreground-muted)' }}>Imagens de referência</p>
        <MultiImageUpload urls={imagens} onChange={setImagens} max={12} />
      </div>

      <div>
        <label className={labelCls} htmlFor="ev-acont" style={{ color: 'var(--foreground-muted)' }}>
          Principais acontecimentos {thread?.status === 'concluida' ? '' : '(preencha quando a thread terminar)'}
        </label>
        <textarea id="ev-acont" rows={6} value={acontecimentos} onChange={e => setAcontecimentos(e.target.value)} placeholder="O que de fato aconteceu, o que mudou entre os personagens…" style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6 }} />
      </div>

      {erro && <p className="text-xs" style={{ color: 'var(--destructive)' }}>{erro}</p>}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={salvando || !titulo.trim() || !data} className="px-5 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50" style={{ background: 'var(--btn-primary)', color: 'var(--primary-foreground)', boxShadow: 'var(--shadow-primary)' }}>
          {salvando ? 'Salvando…' : inicial?.id ? 'Salvar alterações' : 'Criar evento'}
        </button>
        <Link href={voltar} className="text-sm hover:opacity-70" style={{ color: 'var(--foreground-muted)' }}>Cancelar</Link>
      </div>
    </form>
  )
}
