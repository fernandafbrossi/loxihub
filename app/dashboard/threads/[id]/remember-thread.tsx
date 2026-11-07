'use client'

import { useEffect } from 'react'

export const lastThreadKey = (universoId: string) => `loxihub_last_thread_${universoId}`

/** Guarda no aparelho qual foi a última thread aberta em cada universo. */
export function RememberThread({ universoId, threadId }: { universoId: string | null; threadId: string }) {
  useEffect(() => {
    if (!universoId) return
    try {
      localStorage.setItem(lastThreadKey(universoId), threadId)
    } catch {}
  }, [universoId, threadId])

  return null
}
