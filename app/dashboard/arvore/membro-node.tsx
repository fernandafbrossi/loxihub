'use client'

import { Handle, Position } from '@xyflow/react'
import type { NodeProps } from '@xyflow/react'
import { Users } from 'lucide-react'
import { useState } from 'react'

export interface MembroData extends Record<string, unknown> {
  nome: string
  foto_url: string | null
  personagem_id: string | null
  status: 'ativo' | 'falecido' | 'npc'
  notas: string | null
  onDelete: (id: string) => void
}

const handleStyle = { opacity: 0, width: 1, height: 1, minWidth: 1, minHeight: 1 }

export function MembroNode({ id, data }: NodeProps) {
  const [hovered, setHovered] = useState(false)
  const d = data as MembroData
  const isDead = d.status === 'falecido'
  const isNpc = d.status === 'npc'
  const ringColor = isDead ? '#9a8a8a' : isNpc ? '#906070' : '#800020'

  // Grayscale when not hovered; deceased stays slightly gray even on hover
  const filterStyle = hovered
    ? isDead ? 'grayscale(30%) brightness(0.85)' : 'none'
    : isDead ? 'grayscale(100%) brightness(0.7)' : 'grayscale(90%)'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
        position: 'relative', outline: 'none',
        filter: filterStyle,
        transition: 'filter 0.3s ease',
      }}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Top} id="top" style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="bot" style={handleStyle} />
      <Handle type="source" position={Position.Right} id="r" style={handleStyle} />
      <Handle type="target" position={Position.Left} id="l" style={handleStyle} />

      <div style={{ position: 'relative', width: 72, height: 72 }}>
        {/* Photo */}
        <div
          onClick={() => d.personagem_id && (window.location.href = `/dashboard/personagens/${d.personagem_id}`)}
          style={{
            width: 52, height: 52,
            borderRadius: '50%',
            overflow: 'hidden',
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            background: '#c9a8a8',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: d.personagem_id ? 'pointer' : 'default',
            zIndex: 1,
          }}
        >
          {d.foto_url
            ? <img src={d.foto_url} alt={d.nome} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <Users size={18} style={{ color: '#906070' }} />
          }
        </div>

        {/* Ornate double ring */}
        <svg
          viewBox="0 0 72 72"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none', overflow: 'visible' }}
        >
          <circle cx="36" cy="36" r="29" fill="none" stroke={ringColor} strokeWidth="0.8"
            strokeDasharray={isDead ? '5 3' : undefined} opacity="0.6" />
        </svg>

        {/* Delete button — shown on hover, outside filter thanks to hovered condition */}
        {hovered && (
          <button
            onClick={(e) => { e.stopPropagation(); d.onDelete(id) }}
            style={{
              position: 'absolute', top: -6, right: -6,
              width: 20, height: 20,
              borderRadius: '50%',
              background: '#800020',
              color: '#FAF0F2',
              border: 'none',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              fontSize: 14,
              lineHeight: 1,
              fontFamily: 'sans-serif',
            }}
            title="Remover membro"
          >×</button>
        )}
      </div>

      {/* Name */}
      <span style={{
        fontSize: 10.5,
        fontFamily: 'Georgia, serif',
        color: isDead ? '#906070' : '#2E0510',
        textAlign: 'center',
        maxWidth: 90,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: 'block',
      }}>
        {isDead ? '† ' : ''}{d.nome}
      </span>

      {isNpc && !d.personagem_id && (
        <span style={{ fontSize: 8, color: '#B09098', fontFamily: 'sans-serif', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          sem ficha
        </span>
      )}
    </div>
  )
}
