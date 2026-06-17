'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { ArrowLeft, Plus, X, Users } from 'lucide-react'

interface Personagem { id: string; nome: string; foto_url: string | null }
interface Relacao { id: string; personagem_a: string; personagem_b: string; tipo_relacao: string }

const TIPOS_RELACAO = ['cônjuge', 'pai/mãe de', 'filho/a de', 'irmão/irmã de', 'adotado/a por', 'adotou']

export default function ArvoreGenealogicaPage() {
  const [personagens, setPersonagens] = useState<Personagem[]>([])
  const [relacoes, setRelacoes] = useState<Relacao[]>([])
  const [showForm, setShowForm] = useState(false)
  const [pessoaA, setPessoaA] = useState('')
  const [pessoaB, setPessoaB] = useState('')
  const [tipoRelacao, setTipoRelacao] = useState(TIPOS_RELACAO[0])
  const [saving, setSaving] = useState(false)

  async function load() {
    const supabase = createClient()
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from('personagens').select('id, nome, foto_url').order('nome'),
      supabase.from('relacoes_personagens').select('*'),
    ])
    setPersonagens(p ?? [])
    setRelacoes(r ?? [])
  }

  useEffect(() => { load() }, [])

  async function addRelacao(e: React.FormEvent) {
    e.preventDefault()
    if (!pessoaA || !pessoaB || pessoaA === pessoaB) return
    setSaving(true)
    const supabase = createClient()
    await supabase.from('relacoes_personagens').insert({ personagem_a: pessoaA, personagem_b: pessoaB, tipo_relacao: tipoRelacao })
    await load()
    setPessoaA('')
    setPessoaB('')
    setShowForm(false)
    setSaving(false)
  }

  async function removeRelacao(id: string) {
    const supabase = createClient()
    await supabase.from('relacoes_personagens').delete().eq('id', id)
    setRelacoes(relacoes.filter(r => r.id !== id))
  }

  function getNome(id: string) {
    return personagens.find(p => p.id === id)?.nome ?? '?'
  }
  function getFoto(id: string) {
    return personagens.find(p => p.id === id)?.foto_url ?? null
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link href="/dashboard/personagens" className="inline-flex items-center gap-1.5 text-sm hover:underline" style={{ color: 'var(--muted-foreground)' }}>
            <ArrowLeft size={14} /> Personagens
          </Link>
          <span style={{ color: 'var(--muted-foreground)' }}>/</span>
          <h1 className="text-lg font-bold" style={{ color: 'var(--foreground)' }}>Árvore genealógica</h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
          style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
        >
          <Plus size={15} /> Adicionar relação
        </button>
      </div>

      {showForm && (
        <div className="rounded-xl border p-5 mb-6" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <h2 className="font-semibold mb-4" style={{ color: 'var(--foreground)' }}>Nova relação</h2>
          <form onSubmit={addRelacao} className="space-y-4">
            <div className="grid grid-cols-3 gap-3 items-center">
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Personagem A</label>
                <select value={pessoaA} onChange={e => setPessoaA(e.target.value)} required className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                  <option value="">Selecionar...</option>
                  {personagens.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Tipo de relação</label>
                <select value={tipoRelacao} onChange={e => setTipoRelacao(e.target.value)} className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                  {TIPOS_RELACAO.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs mb-1" style={{ color: 'var(--muted-foreground)' }}>Personagem B</label>
                <select value={pessoaB} onChange={e => setPessoaB(e.target.value)} required className="w-full px-3 py-2 rounded-lg border text-sm outline-none" style={{ background: 'var(--background)', borderColor: 'var(--border)', color: 'var(--foreground)' }}>
                  <option value="">Selecionar...</option>
                  {personagens.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm border" style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}>Cancelar</button>
              <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-60" style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}>
                {saving ? 'Salvando...' : 'Adicionar'}
              </button>
            </div>
          </form>
        </div>
      )}

      {personagens.length === 0 ? (
        <div className="rounded-xl border p-12 text-center" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
          <Users size={40} className="mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
          <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Crie personagens primeiro para montar a árvore.{' '}
            <Link href="/dashboard/personagens/novo" className="hover:underline" style={{ color: 'var(--primary)' }}>Criar personagem</Link>
          </p>
        </div>
      ) : (
        <>
          {/* Visual tree */}
          <div className="rounded-xl border p-6 mb-6 overflow-auto" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
            <div className="flex flex-wrap gap-6 justify-center min-h-32">
              {personagens.map(p => (
                <Link key={p.id} href={`/dashboard/personagens/${p.id}`} className="flex flex-col items-center gap-2 group">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 flex items-center justify-center transition-all group-hover:scale-105"
                    style={{ borderColor: 'var(--primary)', background: 'var(--muted)' }}>
                    {p.foto_url ? (
                      <img src={p.foto_url} alt={p.nome} className="w-full h-full object-cover" />
                    ) : (
                      <Users size={24} style={{ color: 'var(--muted-foreground)' }} />
                    )}
                  </div>
                  <span className="text-xs font-medium text-center max-w-20 truncate" style={{ color: 'var(--foreground)' }}>{p.nome}</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Relações listadas */}
          <div>
            <h2 className="font-semibold mb-3" style={{ color: 'var(--foreground)' }}>
              Relações ({relacoes.length})
            </h2>
            {relacoes.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Nenhuma relação cadastrada ainda.</p>
            ) : (
              <div className="space-y-2">
                {relacoes.map(r => (
                  <div key={r.id} className="flex items-center justify-between p-4 rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'var(--muted)' }}>
                          {getFoto(r.personagem_a) ? <img src={getFoto(r.personagem_a)!} alt="" className="w-full h-full object-cover" /> : <Users size={14} style={{ color: 'var(--muted-foreground)' }} />}
                        </div>
                        <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{getNome(r.personagem_a)}</span>
                      </div>
                      <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: 'var(--muted)', color: 'var(--accent)' }}>
                        {r.tipo_relacao}
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'var(--muted)' }}>
                          {getFoto(r.personagem_b) ? <img src={getFoto(r.personagem_b)!} alt="" className="w-full h-full object-cover" /> : <Users size={14} style={{ color: 'var(--muted-foreground)' }} />}
                        </div>
                        <span className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>{getNome(r.personagem_b)}</span>
                      </div>
                    </div>
                    <button onClick={() => removeRelacao(r.id)} className="p-1.5 rounded-lg hover:opacity-70" style={{ color: 'var(--muted-foreground)' }}>
                      <X size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
