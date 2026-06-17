'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  personagemId: string
  initialSeguindo: number
  initialSeguidores: number
}

export function FollowStats({ personagemId, initialSeguindo, initialSeguidores }: Props) {
  const [seguindo, setSeguindo] = useState(initialSeguindo)
  const [seguidores, setSeguidores] = useState(initialSeguidores)

  async function save(field: 'seguindo' | 'seguidores', value: number) {
    const supabase = createClient()
    await supabase.from('personagens').update({ [field]: value }).eq('id', personagemId)
  }

  return (
    <div className="flex gap-5">
      <EditableCount
        label="seguindo"
        value={seguindo}
        onChange={v => { setSeguindo(v); save('seguindo', v) }}
      />
      <EditableCount
        label="seguidores"
        value={seguidores}
        onChange={v => { setSeguidores(v); save('seguidores', v) }}
      />
    </div>
  )
}

function EditableCount({ label, value, onChange }: { label: string; value: number; onChange: (n: number) => void }) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))

  function commit() {
    const n = parseInt(draft) || 0
    onChange(n)
    setEditing(false)
  }

  return (
    <div className="flex items-baseline gap-1">
      {editing ? (
        <input
          type="number"
          value={draft}
          min={0}
          onChange={e => setDraft(e.target.value)}
          onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false) }}
          autoFocus
          className="w-14 text-sm font-semibold outline-none rounded px-1 text-center"
          style={{
            background: 'rgba(128,0,32,0.07)',
            border: '0.5px solid rgba(128,0,32,0.20)',
            color: '#2E0510',
          }}
        />
      ) : (
        <button
          onClick={() => { setDraft(String(value)); setEditing(true) }}
          className="text-sm font-semibold hover:underline"
          style={{ color: '#2E0510' }}
        >
          {value.toLocaleString('pt-BR')}
        </button>
      )}
      <span className="text-xs" style={{ color: '#906070' }}>{label}</span>
    </div>
  )
}
