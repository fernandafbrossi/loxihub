'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronDown, ChevronUp, Trash2, Plus } from 'lucide-react'
import { ImageUpload } from '@/components/image-upload'

interface Conta {
  id: string
  tipo: 'instagram'
  nome: string
  username: string | null
  bio: string | null
  foto_url: string | null
  seguidores: number
  seguindo: number
}

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '10px',
  fontSize: '13px',
  background: 'rgba(255,255,255,0.70)',
  border: '0.5px solid var(--p-15)',
  color: 'var(--foreground)',
  outline: 'none',
} as const

const labelStyle = {
  display: 'block',
  fontSize: '10px',
  fontWeight: 500,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  marginBottom: '6px',
  color: 'var(--foreground-muted)',
}

function ContaCard({ conta, personagemId, onUpdated, onDeleted }: {
  conta: Conta
  personagemId: string
  onUpdated: (c: Conta) => void
  onDeleted: (id: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [nome, setNome] = useState(conta.nome)
  const [username, setUsername] = useState(conta.username ?? '')
  const [bio, setBio] = useState(conta.bio ?? '')
  const [fotoUrl, setFotoUrl] = useState(conta.foto_url ?? '')
  const [seguidores, setSeguidores] = useState(conta.seguidores)
  const [seguindo, setSeguindo] = useState(conta.seguindo)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState('')

  async function save() {
    setSaving(true); setError('')
    const supabase = createClient()
    const { error: err } = await supabase.from('contas_sociais').update({
      nome: nome.trim() || 'principal',
      username: username.trim().replace(/^@/, '') || null,
      bio: bio.trim() || null,
      foto_url: fotoUrl || null,
      seguidores: Number(seguidores) || 0,
      seguindo: Number(seguindo) || 0,
    }).eq('id', conta.id)
    if (err) { setError(err.message); setSaving(false); return }
    onUpdated({ ...conta, nome: nome.trim() || 'principal', username: username.trim().replace(/^@/, '') || null, bio: bio.trim() || null, foto_url: fotoUrl || null, seguidores: Number(seguidores) || 0, seguindo: Number(seguindo) || 0 })
    setSaving(false); setOpen(false)
  }

  async function deleteConta() {
    if (!confirm(`Excluir a conta "${conta.nome}"? Os posts vinculados a ela serão desvinculados.`)) return
    setDeleting(true)
    const supabase = createClient()
    await supabase.from('contas_sociais').delete().eq('id', conta.id)
    onDeleted(conta.id)
  }

  const bioMax = 150

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: '0.5px solid var(--p-10)' }}>
      {/* Header da conta */}
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors hover:opacity-90"
        style={{ background: 'var(--card)' }}
        onClick={() => setOpen(v => !v)}
      >
        {/* Avatar */}
        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-semibold"
          style={{ background: 'linear-gradient(135deg, #800020, #5C0018)', color: 'var(--primary-foreground)' }}>
          {fotoUrl
            ? <img src={fotoUrl} alt="" className="w-full h-full object-cover" />
            : (username || nome)[0]?.toUpperCase() ?? '?'
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>
            {username ? `@${username}` : conta.nome}
          </p>
          {username && <p className="text-[10px]" style={{ color: 'var(--muted-light)' }}>{conta.nome}</p>}
        </div>
        <button onClick={e => { e.stopPropagation(); deleteConta() }}
          disabled={deleting}
          className="p-1.5 transition-opacity hover:opacity-60 disabled:opacity-30"
          style={{ color: 'var(--muted-light)' }}>
          <Trash2 size={13} />
        </button>
        {open ? <ChevronUp size={14} style={{ color: 'var(--muted-light)' }} /> : <ChevronDown size={14} style={{ color: 'var(--muted-light)' }} />}
      </div>

      {/* Form editável */}
      {open && (
        <div className="px-4 pb-4 pt-3 flex flex-col gap-4" style={{ background: 'rgba(255,255,255,0.40)' }}>
          <div>
            <label style={labelStyle}>Nome da conta</label>
            <input style={inputStyle} value={nome} onChange={e => setNome(e.target.value)} placeholder="ex: principal, finsta, alt..." />
            <p className="text-[10px] mt-1" style={{ color: 'var(--muted-light)' }}>Identificador interno (não aparece no feed)</p>
          </div>

          <div>
            <label style={labelStyle}>Foto de perfil desta conta</label>
            <ImageUpload onUpload={setFotoUrl} currentUrl={fotoUrl} />
          </div>

          <div>
            <label style={labelStyle}>Username</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm select-none" style={{ color: 'var(--muted-light)' }}>@</span>
              <input
                style={{ ...inputStyle, paddingLeft: 28 }}
                value={username}
                onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
                placeholder="nome_do_personagem"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Seguindo</label>
              <input type="number" min={0} style={inputStyle} value={seguindo} onChange={e => setSeguindo(Number(e.target.value))} />
            </div>
            <div>
              <label style={labelStyle}>Seguidores</label>
              <input type="number" min={0} style={inputStyle} value={seguidores} onChange={e => setSeguidores(Number(e.target.value))} />
            </div>
          </div>

          <div>
            <label style={labelStyle}>Bio</label>
            <textarea
              style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
              value={bio}
              onChange={e => setBio(e.target.value)}
              placeholder={`Bio que aparece no perfil do Instagram...`}
              maxLength={bioMax}
            />
            <p className="text-[10px] mt-1 text-right" style={{ color: 'var(--muted-light)' }}>{bio.length}/{bioMax}</p>
          </div>

          {error && (
            <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(192,0,0,0.08)', color: 'var(--destructive)' }}>{error}</p>
          )}

          <div className="flex gap-2">
            <button onClick={() => setOpen(false)}
              className="flex-1 py-2 rounded-xl text-xs transition-opacity hover:opacity-70"
              style={{ background: 'var(--p-07)', color: 'var(--foreground-muted)' }}>Cancelar</button>
            <button onClick={save} disabled={saving}
              className="flex-1 py-2 rounded-xl text-xs font-medium disabled:opacity-50 transition-opacity hover:opacity-80"
              style={{ background: 'var(--btn-primary)', color: 'var(--primary-foreground)' }}>
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function TipoSection({ tipo, contas, personagemId, onAdd, onUpdated, onDeleted }: {
  tipo: 'instagram'
  contas: Conta[]
  personagemId: string
  onAdd: (c: Conta) => void
  onUpdated: (c: Conta) => void
  onDeleted: (id: string) => void
}) {
  const [creating, setCreating] = useState(false)
  const [novaNome, setNovaNome] = useState('')
  const [criando, setCriando] = useState(false)

  async function criar() {
    if (!novaNome.trim()) return
    setCriando(true)
    const supabase = createClient()
    const { data } = await supabase.from('contas_sociais')
      .insert({ personagem_id: personagemId, tipo, nome: novaNome.trim() })
      .select().single()
    if (data) onAdd(data as Conta)
    setNovaNome(''); setCreating(false); setCriando(false)
  }

  const icon = (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--foreground)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="1" fill="var(--foreground)" stroke="none" />
    </svg>
  )

  return (
    <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: 'rgba(255,255,255,0.50)', border: '0.5px solid var(--p-08)' }}>
      <div className="flex items-center gap-2">
        {icon}
        <p style={{ ...labelStyle as any, margin: 0 }}>Instagram</p>
        <span className="text-[10px] ml-auto" style={{ color: 'var(--muted-light)' }}>{contas.length} {contas.length === 1 ? 'conta' : 'contas'}</span>
      </div>

      {contas.length === 0 && !creating && (
        <p className="text-xs text-center py-2" style={{ color: 'var(--muted-light)' }}>Nenhuma conta ainda</p>
      )}

      {contas.map(c => (
        <ContaCard key={c.id} conta={c} personagemId={personagemId} onUpdated={onUpdated} onDeleted={onDeleted} />
      ))}

      {creating ? (
        <div className="flex items-center gap-2 pt-1">
          <input
            value={novaNome} onChange={e => setNovaNome(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') criar(); if (e.key === 'Escape') { setCreating(false); setNovaNome('') } }}
            placeholder="nome da nova conta (ex: finsta)" autoFocus
            className="flex-1 text-xs px-3 py-2 rounded-xl outline-none"
            style={{ background: 'rgba(255,255,255,0.80)', border: '0.5px solid var(--p-15)', color: 'var(--foreground)' }}
          />
          <button onClick={criar} disabled={criando || !novaNome.trim()}
            className="text-xs px-3 py-2 rounded-xl font-medium disabled:opacity-40"
            style={{ background: 'var(--btn-primary)', color: 'var(--primary-foreground)' }}>
            {criando ? '...' : 'Criar'}
          </button>
          <button onClick={() => { setCreating(false); setNovaNome('') }}
            className="text-xs px-2 py-2 rounded-xl"
            style={{ background: 'var(--p-07)', color: 'var(--foreground-muted)' }}>✕</button>
        </div>
      ) : (
        <button onClick={() => setCreating(true)}
          className="flex items-center gap-2 text-xs py-2 transition-opacity hover:opacity-70"
          style={{ color: 'var(--muted-light)' }}>
          <Plus size={13} /> Adicionar conta Instagram
        </button>
      )}
    </div>
  )
}

export default function GerenciarContasPage() {
  const { id } = useParams<{ id: string }>()
  const [contas, setContas] = useState<Conta[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()
    supabase.from('contas_sociais').select('*').eq('personagem_id', id).order('created_at')
      .then(({ data }) => { setContas((data ?? []) as Conta[]); setLoading(false) })
  }, [id])

  const instagramContas = contas.filter(c => c.tipo === 'instagram')

  function handleAdd(c: Conta) { setContas(prev => [...prev, c]) }
  function handleUpdated(c: Conta) { setContas(prev => prev.map(x => x.id === c.id ? c : x)) }
  function handleDeleted(id: string) { setContas(prev => prev.filter(x => x.id !== id)) }

  return (
    <div className="p-7 max-w-xl">
      <Link
        href={`/dashboard/personagens/${id}/social`}
        className="inline-flex items-center gap-1.5 text-xs mb-6 hover:opacity-70 transition-opacity"
        style={{ color: 'var(--foreground-muted)' }}
      >
        <ArrowLeft size={13} /> Voltar para o perfil social
      </Link>

      <h1 className="text-xl font-medium mb-1" style={{ color: 'var(--foreground)' }}>Gerenciar contas sociais</h1>
      <p className="text-xs mb-7" style={{ color: 'var(--foreground-muted)' }}>
        Configure os perfis de cada rede social. Cada conta pode ter foto, username, bio e estatísticas próprios.
      </p>

      {loading ? (
        <div className="text-center py-10 opacity-40">
          <p className="text-sm" style={{ color: 'var(--foreground-muted)' }}>Carregando...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          <TipoSection
            tipo="instagram"
            contas={instagramContas}
            personagemId={id}
            onAdd={handleAdd}
            onUpdated={handleUpdated}
            onDeleted={handleDeleted}
          />
        </div>
      )}
    </div>
  )
}
