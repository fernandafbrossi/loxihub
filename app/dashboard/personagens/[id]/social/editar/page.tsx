'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { ImageUpload } from '@/components/image-upload'

const inputStyle = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: '10px',
  fontSize: '13px',
  background: 'rgba(255,255,255,0.70)',
  border: '0.5px solid rgba(128,0,32,0.15)',
  color: '#2E0510',
  outline: 'none',
} as const

const labelStyle = {
  display: 'block',
  fontSize: '10px',
  fontWeight: 500,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.08em',
  marginBottom: '6px',
  color: '#906070',
}

export default function EditarPerfilSocialPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [username, setUsername]                   = useState('')
  const [capaUrl, setCapaUrl]                     = useState('')
  const [bioTwitter, setBioTwitter]               = useState('')
  const [bioInstagram, setBioInstagram]           = useState('')
  const [seguindoTwitter, setSeguindoTwitter]     = useState(0)
  const [seguidoresTwitter, setSeguidoresTwitter] = useState(0)
  const [seguindoInsta, setSeguindoInsta]         = useState(0)
  const [seguidoresInsta, setSeguidoresInsta]     = useState(0)
  const [loading, setLoading]                     = useState(false)
  const [error, setError]                         = useState('')

  useEffect(() => {
    const supabase = createClient()
    supabase
      .from('personagens')
      .select('username, capa_url, bio_twitter, bio_instagram, seguindo_twitter, seguidores_twitter, seguindo_instagram, seguidores_instagram')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        if (!data) return
        setUsername(data.username ?? '')
        setCapaUrl(data.capa_url ?? '')
        setBioTwitter(data.bio_twitter ?? '')
        setBioInstagram(data.bio_instagram ?? '')
        setSeguindoTwitter(data.seguindo_twitter ?? 0)
        setSeguidoresTwitter(data.seguidores_twitter ?? 0)
        setSeguindoInsta(data.seguindo_instagram ?? 0)
        setSeguidoresInsta(data.seguidores_instagram ?? 0)
      })
  }, [id])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error: err } = await supabase
      .from('personagens')
      .update({
        username:             username.trim().replace(/^@/, '') || null,
        capa_url:             capaUrl || null,
        bio_twitter:          bioTwitter.trim() || null,
        bio_instagram:        bioInstagram.trim() || null,
        seguindo_twitter:     Number(seguindoTwitter) || 0,
        seguidores_twitter:   Number(seguidoresTwitter) || 0,
        seguindo_instagram:   Number(seguindoInsta) || 0,
        seguidores_instagram: Number(seguidoresInsta) || 0,
      })
      .eq('id', id)

    if (err) { setError(err.message); setLoading(false); return }
    router.push(`/dashboard/personagens/${id}/social`)
    router.refresh()
  }

  return (
    <div className="p-7 max-w-xl">
      <Link
        href={`/dashboard/personagens/${id}/social`}
        className="inline-flex items-center gap-1.5 text-xs mb-6 hover:opacity-70 transition-opacity"
        style={{ color: '#906070' }}
      >
        <ArrowLeft size={13} /> Voltar para o perfil social
      </Link>

      <h1 className="text-xl font-medium mb-1" style={{ color: '#2E0510' }}>Editar perfil social</h1>
      <p className="text-xs mb-7" style={{ color: '#906070' }}>
        Configure o perfil de rede social deste personagem.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">

        {/* Foto de capa */}
        <div>
          <label style={labelStyle}>Foto de capa</label>
          <ImageUpload onUpload={setCapaUrl} currentUrl={capaUrl} />
        </div>

        {/* Username */}
        <div>
          <label style={labelStyle}>Username</label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm select-none" style={{ color: '#B09098' }}>@</span>
            <input
              style={{ ...inputStyle, paddingLeft: 28 }}
              value={username}
              onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_]/g, ''))}
              placeholder="nome_do_personagem"
              autoFocus
            />
          </div>
          <p className="text-[10px] mt-1" style={{ color: '#B09098' }}>Apenas letras, números e underscore</p>
        </div>

        {/* Stats Twitter */}
        <div
          className="p-4 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.50)', border: '0.5px solid rgba(128,0,32,0.08)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="#2E0510">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.856L2 2.25h6.845l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
            </svg>
            <p style={{ ...labelStyle, margin: 0 }}>Estatísticas do Twitter</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Seguindo</label>
              <input type="number" min={0} style={inputStyle} value={seguindoTwitter} onChange={e => setSeguindoTwitter(Number(e.target.value))} />
            </div>
            <div>
              <label style={labelStyle}>Seguidores</label>
              <input type="number" min={0} style={inputStyle} value={seguidoresTwitter} onChange={e => setSeguidoresTwitter(Number(e.target.value))} />
            </div>
          </div>
        </div>

        {/* Stats Instagram */}
        <div
          className="p-4 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.50)', border: '0.5px solid rgba(128,0,32,0.08)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2E0510" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="#2E0510" stroke="none" />
            </svg>
            <p style={{ ...labelStyle, margin: 0 }}>Estatísticas do Instagram</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label style={labelStyle}>Seguindo</label>
              <input type="number" min={0} style={inputStyle} value={seguindoInsta} onChange={e => setSeguindoInsta(Number(e.target.value))} />
            </div>
            <div>
              <label style={labelStyle}>Seguidores</label>
              <input type="number" min={0} style={inputStyle} value={seguidoresInsta} onChange={e => setSeguidoresInsta(Number(e.target.value))} />
            </div>
          </div>
        </div>

        {/* Bio Twitter */}
        <div
          className="p-4 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.50)', border: '0.5px solid rgba(128,0,32,0.08)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="#2E0510">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.736-8.856L2 2.25h6.845l4.259 5.63L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
            </svg>
            <label style={{ ...labelStyle, margin: 0 }}>Bio do Twitter</label>
          </div>
          <textarea
            style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
            value={bioTwitter}
            onChange={e => setBioTwitter(e.target.value)}
            placeholder="Bio que aparece no perfil do Twitter..."
            maxLength={160}
          />
          <p className="text-[10px] mt-1 text-right" style={{ color: '#B09098' }}>{bioTwitter.length}/160</p>
        </div>

        {/* Bio Instagram */}
        <div
          className="p-4 rounded-xl"
          style={{ background: 'rgba(255,255,255,0.50)', border: '0.5px solid rgba(128,0,32,0.08)' }}
        >
          <div className="flex items-center gap-2 mb-3">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#2E0510" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <circle cx="12" cy="12" r="4" />
              <circle cx="17.5" cy="6.5" r="1" fill="#2E0510" stroke="none" />
            </svg>
            <label style={{ ...labelStyle, margin: 0 }}>Bio do Instagram</label>
          </div>
          <textarea
            style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
            value={bioInstagram}
            onChange={e => setBioInstagram(e.target.value)}
            placeholder="Bio que aparece no perfil do Instagram..."
            maxLength={150}
          />
          <p className="text-[10px] mt-1 text-right" style={{ color: '#B09098' }}>{bioInstagram.length}/150</p>
        </div>

        {error && (
          <p className="text-xs px-3 py-2 rounded-lg" style={{ background: 'rgba(192,0,0,0.08)', color: '#c0392b' }}>
            {error}
          </p>
        )}

        <div className="flex gap-3 mt-2">
          <Link
            href={`/dashboard/personagens/${id}/social`}
            className="flex-1 py-2.5 rounded-xl text-xs font-medium text-center transition-opacity hover:opacity-70"
            style={{ background: 'rgba(128,0,32,0.07)', color: '#906070' }}
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium disabled:opacity-50 transition-opacity hover:opacity-80"
            style={{ background: '#800020', color: '#FAF0F2', boxShadow: '0 2px 12px rgba(128,0,32,0.35)' }}
          >
            {loading ? 'Salvando...' : 'Salvar perfil'}
          </button>
        </div>

      </form>
    </div>
  )
}
