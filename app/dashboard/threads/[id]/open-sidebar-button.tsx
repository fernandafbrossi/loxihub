'use client'

import { ChevronRight } from 'lucide-react'

export function OpenSidebarButton({ titulo }: { titulo: string }) {
  function open() {
    window.dispatchEvent(new Event('open-thread-sidebar'))
  }

  return (
    <button
      onClick={open}
      className="flex items-center gap-1 flex-shrink-0 p-1 -ml-1 rounded-lg hover:opacity-70 transition-opacity"
      style={{ color: '#2E0510' }}
    >
      <span className="text-sm font-medium truncate max-w-[180px]">{titulo}</span>
      <ChevronRight size={14} style={{ color: '#906070' }} />
    </button>
  )
}
