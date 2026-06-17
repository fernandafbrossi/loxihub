'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { ImageUpload } from '@/components/image-upload'
import { Send, Image as ImageIcon, X } from 'lucide-react'

interface Personagem {
  id: string
  nome: string
  foto_url: string | null
  username: string | null
}

export function SocialPostForm({ personagemId, personagem }: { personagemId: string; personagem: Personagem }) {
  const [conteudo, setConteudo] = useState('')
  const [midiaUrl, setMidiaUrl] = useState('')
  const [showImagem, setShowImagem] = useState(false)
  const [loading, setLoading] = useState(false)
  const [focused, setFocused] = useState(false)
  const router = useRouter()

  const handle = personagem.username
    ? `@${personagem.username}`
    : `@${personagem.nome.toLowerCase().replace(/\s+/g, '_')}`

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!conteudo.trim()) return
    setLoading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    await supabase.from('posts_sociais').insert({
      personagem_id: personagemId,
      conteudo: conteudo.trim(),
      midia_url: midiaUrl || null,
      criado_por: user?.id,
    })

    setConteudo('')
    setMidiaUrl('')
    setShowImagem(false)
    setFocused(false)
    setLoading(false)
    router.refresh()
  }

  return (
    <form onSubmit={handleSubmit}>
      <div
        className="rounded-2xl p-4 transition-all"
        style={{
          background: 'rgba(255,255,255,0.60)',
          border: `0.5px solid ${focused ? 'rgba(128,0,32,0.20)' : 'rgba(128,0,32,0.08)'}`,
          boxShadow: focused ? '0 4px 16px rgba(128,0,32,0.08)' : 'none',
        }}
      >
        <div className="flex gap-3">
          {/* Avatar */}
          <div
            className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-xs font-semibold"
            style={{
              background: 'linear-gradient(135deg, #800020, #5C0018)',
              color: '#FAF0F2',
            }}
          >
            {personagem.foto_url ? (
              <img src={personagem.foto_url} alt="" className="w-full h-full object-cover" />
            ) : (
              personagem.nome[0].toUpperCase()
            )}
          </div>

          <div className="flex-1">
            <textarea
              value={conteudo}
              onChange={e => setConteudo(e.target.value)}
              onFocus={() => setFocused(true)}
              placeholder={`O que ${personagem.nome} está pensando?`}
              rows={focused ? 3 : 1}
              className="w-full text-sm outline-none resize-none bg-transparent leading-relaxed"
              style={{ color: '#2E0510' }}
            />

            {showImagem && (
              <div className="mt-3">
                <ImageUpload onUpload={setMidiaUrl} currentUrl={midiaUrl} />
              </div>
            )}

            {focused && (
              <div className="flex items-center justify-between mt-3 pt-3"
                style={{ borderTop: '0.5px solid rgba(128,0,32,0.08)' }}>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowImagem(v => !v)}
                    className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-opacity hover:opacity-70"
                    style={{
                      background: showImagem ? 'rgba(128,0,32,0.10)' : 'transparent',
                      color: '#906070',
                    }}
                  >
                    {showImagem ? <X size={12} /> : <ImageIcon size={12} />}
                    {showImagem ? 'Remover imagem' : 'Adicionar imagem'}
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => { setFocused(false); setConteudo(''); setMidiaUrl(''); setShowImagem(false) }}
                    className="text-xs px-3 py-1.5 rounded-lg transition-opacity hover:opacity-70"
                    style={{ color: '#906070' }}
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !conteudo.trim()}
                    className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg disabled:opacity-40 transition-opacity hover:opacity-80"
                    style={{ background: '#800020', color: '#FAF0F2' }}
                  >
                    <Send size={11} /> {loading ? 'Postando...' : 'Postar'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </form>
  )
}
