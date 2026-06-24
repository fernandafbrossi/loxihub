'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Camera, Bell, BellOff, Palette, Check, Loader2 } from 'lucide-react'

const PUBLIC_VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(base64)
  return Uint8Array.from([...raw].map(c => c.charCodeAt(0)))
}

interface Personagem {
  id: string
  nome: string
  foto_url?: string | null
}

interface Universo {
  id: string
  nome: string
  personagens: Personagem[]
}

interface SettingsFormProps {
  userId: string
  nomeDisplay: string
  avatarUrl: string
  bio: string
  universos: Universo[]
  principaisMap: Record<string, string>
}

export function SettingsForm({ userId, nomeDisplay, avatarUrl, bio, universos, principaisMap }: SettingsFormProps) {
  const [nome, setNome] = useState(nomeDisplay)
  const [bioText, setBioText] = useState(bio)
  const [avatar, setAvatar] = useState(avatarUrl)
  const [principais, setPrincipais] = useState<Record<string, string>>(principaisMap)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [notifStatus, setNotifStatus] = useState<'loading' | 'blocked' | 'active' | 'inactive'>('loading')
  const [togglingNotif, setTogglingNotif] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setNotifStatus('inactive')
      return
    }
    if (Notification.permission === 'denied') {
      setNotifStatus('blocked')
      return
    }
    if (Notification.permission === 'granted') {
      navigator.serviceWorker.ready.then(reg =>
        reg.pushManager.getSubscription().then(sub => {
          setNotifStatus(sub ? 'active' : 'inactive')
        })
      )
    } else {
      setNotifStatus('inactive')
    }
  }, [])

  async function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingAvatar(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const filename = `avatars/${userId}-${Date.now()}.${ext}`
    const { data, error } = await supabase.storage.from('imagens').upload(filename, file, { upsert: true })
    if (!error && data) {
      const { data: urlData } = supabase.storage.from('imagens').getPublicUrl(data.path)
      setAvatar(urlData.publicUrl)
    }
    setUploadingAvatar(false)
  }

  async function handleSave() {
    setSaving(true)
    const supabase = createClient()

    await supabase.from('profiles').update({
      nome_display: nome.trim() || nomeDisplay,
      avatar_url: avatar || null,
      bio: bioText.trim() || null,
    }).eq('id', userId)

    const upserts = Object.entries(principais).map(([universo_id, personagem_id]) => ({
      perfil_id: userId,
      universo_id,
      personagem_id: personagem_id || null,
    }))
    if (upserts.length > 0) {
      await supabase.from('perfil_personagem_principal').upsert(upserts, { onConflict: 'perfil_id,universo_id' })
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  async function toggleNotificacoes() {
    setTogglingNotif(true)
    try {
      if (notifStatus === 'active') {
        const reg = await navigator.serviceWorker.ready
        const sub = await reg.pushManager.getSubscription()
        if (sub) {
          await sub.unsubscribe()
          const supabase = createClient()
          await supabase.from('push_subscriptions').delete().eq('user_id', userId).eq('endpoint', sub.endpoint)
        }
        setNotifStatus('inactive')
      } else {
        const perm = await Notification.requestPermission()
        if (perm !== 'granted') { setNotifStatus('blocked'); return }
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
        setNotifStatus('active')
      }
    } catch (e) {
      console.error(e)
    }
    setTogglingNotif(false)
  }

  return (
    <div className="space-y-6">

      {/* Avatar + Nome */}
      <section
        className="rounded-2xl p-5"
        style={{ background: 'var(--card)', border: '0.5px solid var(--p-10)' }}
      >
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--foreground-muted)' }}>
          Perfil
        </h2>

        {/* Avatar */}
        <div className="flex items-center gap-4 mb-5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="relative flex-shrink-0 w-16 h-16 rounded-full overflow-hidden group"
            style={{ background: 'var(--primary)', boxShadow: '0 2px 10px var(--p-25)' }}
            disabled={uploadingAvatar}
          >
            {avatar ? (
              <img src={avatar} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="flex items-center justify-center w-full h-full text-xl font-semibold" style={{ color: 'var(--primary-foreground)' }}>
                {nome[0]?.toUpperCase() ?? '?'}
              </span>
            )}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" style={{ background: 'rgba(0,0,0,0.45)' }}>
              {uploadingAvatar
                ? <Loader2 size={18} className="animate-spin text-white" />
                : <Camera size={18} className="text-white" />
              }
            </div>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
          <div>
            <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>Foto do perfil</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-muted)' }}>Clique no círculo para trocar</p>
            {avatar && (
              <button
                type="button"
                onClick={() => setAvatar('')}
                className="text-xs mt-1 underline opacity-60 hover:opacity-100 transition-opacity"
                style={{ color: 'var(--foreground-muted)' }}
              >
                Remover foto
              </button>
            )}
          </div>
        </div>

        {/* Nome */}
        <div className="mb-4">
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
            Nome exibido
          </label>
          <input
            type="text"
            value={nome}
            onChange={e => setNome(e.target.value)}
            maxLength={50}
            placeholder="Como você quer ser chamada?"
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none transition-colors"
            style={{ background: 'var(--input)', color: 'var(--foreground)', border: '0.5px solid var(--p-10)' }}
          />
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--foreground-muted)' }}>
            Bio <span className="opacity-50">({bioText.length}/200)</span>
          </label>
          <textarea
            value={bioText}
            onChange={e => setBioText(e.target.value.slice(0, 200))}
            rows={3}
            placeholder="Uma frase sobre você como escritora..."
            className="w-full px-3 py-2.5 rounded-xl text-sm outline-none resize-none transition-colors"
            style={{ background: 'var(--input)', color: 'var(--foreground)', border: '0.5px solid var(--p-10)' }}
          />
        </div>
      </section>

      {/* Personagem principal por universo */}
      {universos.length > 0 && (
        <section
          className="rounded-2xl p-5"
          style={{ background: 'var(--card)', border: '0.5px solid var(--p-10)' }}
        >
          <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--foreground-muted)' }}>
            Personagem principal por universo
          </h2>
          <div className="space-y-3">
            {universos.map(u => (
              <div key={u.id} className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: 'var(--foreground)' }}>{u.nome}</p>
                </div>
                <select
                  value={principais[u.id] ?? ''}
                  onChange={e => setPrincipais(p => ({ ...p, [u.id]: e.target.value }))}
                  className="text-xs px-2.5 py-1.5 rounded-lg outline-none max-w-[180px]"
                  style={{ background: 'var(--input)', color: 'var(--foreground)', border: '0.5px solid var(--p-10)' }}
                >
                  <option value="">— nenhum —</option>
                  {u.personagens.map((p: Personagem) => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Notificações */}
      <section
        className="rounded-2xl p-5"
        style={{ background: 'var(--card)', border: '0.5px solid var(--p-10)' }}
      >
        <h2 className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: 'var(--foreground-muted)' }}>
          Notificações
        </h2>
        {notifStatus === 'loading' ? (
          <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>Verificando...</p>
        ) : notifStatus === 'blocked' ? (
          <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
            Notificações bloqueadas pelo navegador. Ative nas configurações do seu dispositivo.
          </p>
        ) : (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                {notifStatus === 'active' ? 'Notificações ativas' : 'Notificações desativadas'}
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--foreground-muted)' }}>
                {notifStatus === 'active'
                  ? 'Você será avisada quando sua parceira postar'
                  : 'Ative para saber quando sua parceira postar'}
              </p>
            </div>
            <button
              type="button"
              onClick={toggleNotificacoes}
              disabled={togglingNotif}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition-opacity disabled:opacity-50"
              style={notifStatus === 'active'
                ? { background: 'var(--p-10)', color: 'var(--foreground-muted)' }
                : { background: 'var(--btn-primary)', color: 'var(--primary-foreground)' }
              }
            >
              {togglingNotif
                ? <Loader2 size={13} className="animate-spin" />
                : notifStatus === 'active'
                  ? <><BellOff size={13} /> Desativar</>
                  : <><Bell size={13} /> Ativar</>
              }
            </button>
          </div>
        )}
      </section>

      {/* Tema de cores — em breve */}
      <section
        className="rounded-2xl p-5"
        style={{ background: 'var(--card)', border: '0.5px solid var(--p-10)', opacity: 0.6 }}
      >
        <div className="flex items-center gap-2 mb-1">
          <Palette size={14} style={{ color: 'var(--foreground-muted)' }} />
          <h2 className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--foreground-muted)' }}>
            Tema de cores
          </h2>
          <span
            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
            style={{ background: 'var(--p-10)', color: 'var(--primary)' }}
          >
            em breve
          </span>
        </div>
        <p className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
          Rose, Meia-noite, Místico, Floresta e mais — vamos escolher juntas.
        </p>
      </section>

      {/* Botão salvar */}
      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-opacity disabled:opacity-60"
        style={{ background: 'var(--btn-primary)', color: 'var(--primary-foreground)' }}
      >
        {saving
          ? <><Loader2 size={15} className="animate-spin" /> Salvando...</>
          : saved
            ? <><Check size={15} /> Salvo!</>
            : 'Salvar alterações'
        }
      </button>
    </div>
  )
}
