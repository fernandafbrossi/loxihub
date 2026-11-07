'use client'

import { useEffect } from 'react'

interface BottomSheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  /** Por padrão só aparece no mobile (some em md:). */
  mobileOnly?: boolean
}

export function BottomSheet({ open, onClose, title, children, mobileOnly = true }: BottomSheetProps) {
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className={`fixed inset-0 z-50 flex flex-col justify-end ${mobileOnly ? 'md:hidden' : ''}`}>
      <div className="absolute inset-0" style={{ background: 'rgba(46,5,16,0.35)' }} onClick={onClose} />
      <div
        role="dialog"
        aria-label={title}
        className="relative rounded-t-3xl px-4 pt-2"
        style={{
          background: '#fff',
          maxHeight: '80dvh',
          overflowY: 'auto',
          paddingBottom: 'max(20px, env(safe-area-inset-bottom))',
          boxShadow: '0 -8px 32px rgba(40,5,15,0.18)',
        }}
      >
        <div className="mx-auto mb-3 h-1 w-9 rounded-full" style={{ background: 'var(--p-15)' }} />
        {title && (
          <p className="mb-2 px-2 text-sm font-medium" style={{ color: 'var(--foreground)' }}>
            {title}
          </p>
        )}
        {children}
      </div>
    </div>
  )
}
