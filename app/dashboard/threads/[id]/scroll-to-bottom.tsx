'use client'

import { useEffect, useRef } from 'react'

export function ScrollToBottom() {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    ref.current?.scrollIntoView({ behavior: 'instant' })
  }, [])
  return <div ref={ref} />
}
