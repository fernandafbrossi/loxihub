'use client'

import { useEffect } from 'react'

interface Props {
  aberto: boolean
  titulo: string
  mensagem: string
  confirmarLabel?: string
  carregando?: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

export function ConfirmDialog({
  aberto, titulo, mensagem, confirmarLabel = 'Apagar', carregando = false, onConfirmar, onCancelar,
}: Props) {
  useEffect(() => {
    if (!aberto) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { e.stopPropagation(); onCancelar() }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [aberto, onCancelar])

  if (!aberto) return null

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)' }}
      onClick={e => { e.stopPropagation(); onCancelar() }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="confirm-titulo"
        className="w-full max-w-xs rounded-2xl overflow-hidden text-center"
        style={{ background: 'rgba(250,247,248,0.99)', boxShadow: '0 20px 60px rgba(40,5,15,0.35)' }}
        onClick={e => e.stopPropagation()}>
        <div className="px-6 pt-6 pb-5">
          <p id="confirm-titulo" className="text-sm font-semibold mb-1.5" style={{ color: 'var(--foreground)' }}>{titulo}</p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--foreground-muted)' }}>{mensagem}</p>
        </div>
        <div className="flex flex-col" style={{ borderTop: '0.5px solid var(--p-08)' }}>
          <button type="button" onClick={onConfirmar} disabled={carregando}
            className="h-12 text-sm font-semibold disabled:opacity-50 transition-opacity hover:opacity-70"
            style={{ color: 'var(--destructive)', borderBottom: '0.5px solid var(--p-08)' }}>
            {carregando ? 'Apagando...' : confirmarLabel}
          </button>
          <button type="button" autoFocus onClick={onCancelar} disabled={carregando}
            className="h-12 text-sm transition-opacity hover:opacity-70"
            style={{ color: 'var(--foreground)' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}
