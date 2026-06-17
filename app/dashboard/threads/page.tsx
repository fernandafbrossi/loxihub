'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function ThreadsPage() {
  const router = useRouter()

  useEffect(() => {
    const universo = new URLSearchParams(window.location.search).get('universo')
    const supabase = createClient()
    const query = supabase.from('threads').select('id').order('updated_at', { ascending: false }).limit(1)
    if (universo) query.eq('universo_id', universo)
    query.then(({ data }) => {
      if (data && data.length > 0) {
        router.replace(`/dashboard/threads/${data[0].id}${universo ? `?universo=${universo}` : ''}`)
      } else {
        router.replace(`/dashboard/threads/nova${universo ? `?universo=${universo}` : ''}`)
      }
    })
  }, [router])

  return null
}
