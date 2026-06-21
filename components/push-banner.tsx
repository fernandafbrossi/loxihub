'use client'

import { useState, useEffect } from 'react'
import { Bell, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const PUBLIC_VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

export function PushBanner() {
  const [visible, setVisible] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return
    if (Notification.permission !== 'default') return
    if (localStorage.getItem('push_banner_dismissed')) return
    // Mostra o banner depois de 2s para não assustar na abertura
    const t = setTimeout(() => setVisible(true), 2000)
    return () => clearTimeout(t)
  }, [])

  async function ativar() {
    setLoading(true)
    try {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') { setVisible(false); return }

      const reg = await navigator.serviceWorker.ready
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY),
      })

      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription: sub.toJSON(), userId: user.id }),
        })
      }
    } catch (e) {
      console.error(e)
    }
    setVisible(false)
  }

  function dispensar() {
    localStorage.setItem('push_banner_dismissed', '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-lg md:left-auto md:right-6 md:w-80"
      style={{
        background: 'rgba(46,5,16,0.96)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.12)' }}
      >
        <Bell size={16} style={{ color: '#FAF0F2' }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium" style={{ color: '#FAF0F2' }}>
          Ativar notificações
        </p>
        <p className="text-[10px]" style={{ color: 'rgba(250,240,242,0.60)' }}>
          Saiba quando sua parceira postar
        </p>
      </div>
      <button
        onClick={ativar}
        disabled={loading}
        className="flex-shrink-0 text-[11px] font-medium px-3 py-1.5 rounded-lg transition-opacity disabled:opacity-50"
        style={{ background: '#800020', color: '#FAF0F2' }}
      >
        {loading ? '...' : 'Ativar'}
      </button>
      <button onClick={dispensar} className="flex-shrink-0 opacity-50 hover:opacity-100 transition-opacity" style={{ color: '#FAF0F2' }}>
        <X size={14} />
      </button>
    </div>
  )
}
