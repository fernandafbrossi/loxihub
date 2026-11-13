'use client'

import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  urls: string[]
  /** Toque/clique duplo na foto (curtir). */
  onDoubleTap?: () => void
  /** Camada sobreposta (ex.: coração animado). */
  children?: React.ReactNode
  style?: React.CSSProperties
}

// Proporção da 1ª foto, limitada como no Instagram: de 4:5 (retrato) a 1,91:1 (paisagem).
const RATIO_MIN = 0.8
const RATIO_MAX = 1.91

export function PostCarousel({ urls, onDoubleTap, children, style }: Props) {
  const ref = useRef<HTMLDivElement>(null)
  const ultimoToque = useRef(0)
  const [atual, setAtual] = useState(0)
  const [ratio, setRatio] = useState(1)

  function onScroll() {
    const el = ref.current
    if (!el) return
    setAtual(Math.round(el.scrollLeft / el.clientWidth))
  }

  function ir(i: number) {
    const el = ref.current
    if (!el || i < 0 || i >= urls.length) return
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  function onClick(e: React.MouseEvent) {
    if ((e.target as HTMLElement).closest('button')) return
    const agora = Date.now()
    if (agora - ultimoToque.current < 320) {
      ultimoToque.current = 0
      onDoubleTap?.()
    } else {
      ultimoToque.current = agora
    }
  }

  if (urls.length === 0) return null

  return (
    <div className="relative select-none overflow-hidden" tabIndex={0}
      style={{ aspectRatio: String(ratio), background: 'var(--p-06)', ...style }}
      onClick={onClick}
      onKeyDown={e => { if (e.key === 'ArrowLeft') ir(atual - 1); if (e.key === 'ArrowRight') ir(atual + 1) }}>
      <div ref={ref} onScroll={onScroll}
        className="flex overflow-x-auto snap-x snap-mandatory h-full"
        style={{ scrollbarWidth: 'none' }}>
        {urls.map((u, i) => (
          <div key={u} className="w-full h-full flex-shrink-0 snap-center">
            <img src={u} alt="" draggable={false} className="w-full h-full object-cover"
              onLoad={i === 0 ? e => {
                const { naturalWidth: w, naturalHeight: h } = e.currentTarget
                if (w && h) setRatio(Math.min(RATIO_MAX, Math.max(RATIO_MIN, w / h)))
              } : undefined} />
          </div>
        ))}
      </div>

      {children}

      {urls.length > 1 && (
        <>
          <span className="absolute top-3 right-3 text-[11px] px-2 py-0.5 rounded-full pointer-events-none"
            style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
            {atual + 1}/{urls.length}
          </span>

          {atual > 0 && (
            <button type="button" onClick={() => ir(atual - 1)} aria-label="Foto anterior"
              className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.85)' }}>
              <ChevronLeft size={16} />
            </button>
          )}
          {atual < urls.length - 1 && (
            <button type="button" onClick={() => ir(atual + 1)} aria-label="Próxima foto"
              className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full items-center justify-center"
              style={{ background: 'rgba(255,255,255,0.85)' }}>
              <ChevronRight size={16} />
            </button>
          )}

          <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1 pointer-events-none">
            {urls.map((_, i) => (
              <span key={i} className="rounded-full transition-all"
                style={{ width: 6, height: 6, background: i === atual ? 'var(--primary)' : 'rgba(255,255,255,0.7)' }} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
