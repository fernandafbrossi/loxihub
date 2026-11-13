'use client'

import { useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function PostCarousel({ urls }: { urls: string[] }) {
  const ref = useRef<HTMLDivElement>(null)
  const [atual, setAtual] = useState(0)

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

  if (urls.length === 0) return null

  if (urls.length === 1) {
    return <img src={urls[0]} alt="" className="w-full h-auto block" />
  }

  return (
    <div className="relative" tabIndex={0}
      onKeyDown={e => { if (e.key === 'ArrowLeft') ir(atual - 1); if (e.key === 'ArrowRight') ir(atual + 1) }}>
      <div ref={ref} onScroll={onScroll}
        className="flex overflow-x-auto snap-x snap-mandatory"
        style={{ scrollbarWidth: 'none' }}>
        {urls.map(u => (
          <div key={u} className="w-full flex-shrink-0 snap-center flex items-center justify-center"
            style={{ background: '#000' }}>
            <img src={u} alt="" className="w-full h-auto block" style={{ maxHeight: '70vh', objectFit: 'contain' }} />
          </div>
        ))}
      </div>

      <span className="absolute top-3 right-3 text-[11px] px-2 py-0.5 rounded-full"
        style={{ background: 'rgba(0,0,0,0.6)', color: '#fff' }}>
        {atual + 1}/{urls.length}
      </span>

      {atual > 0 && (
        <button type="button" onClick={() => ir(atual - 1)} aria-label="Foto anterior"
          className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.85)' }}>
          <ChevronLeft size={16} />
        </button>
      )}
      {atual < urls.length - 1 && (
        <button type="button" onClick={() => ir(atual + 1)} aria-label="Próxima foto"
          className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.85)' }}>
          <ChevronRight size={16} />
        </button>
      )}

      <div className="absolute bottom-2 inset-x-0 flex justify-center gap-1">
        {urls.map((_, i) => (
          <span key={i} className="rounded-full transition-all"
            style={{ width: 6, height: 6, background: i === atual ? 'var(--primary)' : 'rgba(255,255,255,0.7)' }} />
        ))}
      </div>
    </div>
  )
}
