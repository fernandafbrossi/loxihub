'use client'

import { useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Plus, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'

interface Props {
  urls: string[]
  onChange: (urls: string[]) => void
  max?: number
}

// Reduz a imagem no navegador (lado maior até 1440px) antes de enviar.
async function reduzirImagem(file: File, maxLado = 1440): Promise<Blob | File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file
  try {
    const bitmap = await createImageBitmap(file)
    const escala = Math.min(1, maxLado / Math.max(bitmap.width, bitmap.height))
    if (escala === 1 && file.size < 800_000) return file
    const canvas = document.createElement('canvas')
    canvas.width = Math.round(bitmap.width * escala)
    canvas.height = Math.round(bitmap.height * escala)
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const blob: Blob | null = await new Promise(res => canvas.toBlob(res, 'image/jpeg', 0.88))
    return blob ?? file
  } catch {
    return file
  }
}

export function MultiImageUpload({ urls, onChange, max = 10 }: Props) {
  const [enviando, setEnviando] = useState(0)
  const [erro, setErro] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  // Mantém a lista mais recente durante envios paralelos.
  const urlsRef = useRef(urls)
  useEffect(() => { urlsRef.current = urls }, [urls])

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivos = Array.from(e.target.files ?? [])
    e.target.value = ''
    if (arquivos.length === 0) return
    setErro(null)

    const vagas = max - urlsRef.current.length - enviando
    const selecionados = arquivos.slice(0, Math.max(0, vagas))
    if (arquivos.length > selecionados.length) setErro(`Máximo de ${max} fotos por post.`)

    const supabase = createClient()
    setEnviando(n => n + selecionados.length)

    // Envia em paralelo, mas preserva a ordem de seleção.
    const resultados = await Promise.all(selecionados.map(async file => {
      try {
        const blob = await reduzirImagem(file)
        const ext = blob === file ? (file.name.split('.').pop() || 'jpg') : 'jpg'
        const nome = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
        const { data, error } = await supabase.storage.from('imagens').upload(nome, blob, { upsert: true })
        if (error || !data) return null
        return supabase.storage.from('imagens').getPublicUrl(data.path).data.publicUrl
      } catch {
        return null
      } finally {
        setEnviando(n => n - 1)
      }
    }))

    const ok = resultados.filter((u): u is string => !!u)
    if (ok.length < selecionados.length) setErro('Algumas fotos não foram enviadas. Tente de novo.')
    if (ok.length > 0) { urlsRef.current = [...urlsRef.current, ...ok]; onChange(urlsRef.current) }
  }

  function remover(i: number) {
    onChange(urls.filter((_, idx) => idx !== i))
  }

  function mover(i: number, dir: -1 | 1) {
    const j = i + dir
    if (j < 0 || j >= urls.length) return
    const novo = [...urls]
    ;[novo[i], novo[j]] = [novo[j], novo[i]]
    onChange(novo)
  }

  const cheio = urls.length + enviando >= max

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {urls.map((url, i) => (
          <div key={url} className="relative aspect-square rounded-lg overflow-hidden group"
            style={{ background: 'var(--p-06)' }}>
            <img src={url} alt="" className="w-full h-full object-cover" />
            {i === 0 && (
              <span className="absolute top-1 left-1 text-[9px] px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(0,0,0,0.55)', color: '#fff' }}>capa</span>
            )}
            <button type="button" onClick={() => remover(i)} aria-label="Remover foto"
              className="absolute top-1 right-1 p-1 rounded-full" style={{ background: 'rgba(0,0,0,0.55)' }}>
              <X size={11} color="#fff" />
            </button>
            <div className="absolute bottom-1 inset-x-1 flex justify-between">
              <button type="button" onClick={() => mover(i, -1)} disabled={i === 0} aria-label="Mover para trás"
                className="p-1 rounded-full disabled:opacity-0" style={{ background: 'rgba(0,0,0,0.55)' }}>
                <ChevronLeft size={11} color="#fff" />
              </button>
              <button type="button" onClick={() => mover(i, 1)} disabled={i === urls.length - 1} aria-label="Mover para frente"
                className="p-1 rounded-full disabled:opacity-0" style={{ background: 'rgba(0,0,0,0.55)' }}>
                <ChevronRight size={11} color="#fff" />
              </button>
            </div>
          </div>
        ))}

        {Array.from({ length: enviando }).map((_, i) => (
          <div key={`up-${i}`} className="aspect-square rounded-lg flex items-center justify-center"
            style={{ background: 'var(--p-06)' }}>
            <Loader2 size={18} className="animate-spin" style={{ color: 'var(--muted-light)' }} />
          </div>
        ))}

        {!cheio && (
          <label className="aspect-square rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:opacity-70 transition-opacity"
            style={{ borderColor: 'var(--border)', background: 'var(--muted)' }}>
            <Plus size={18} style={{ color: 'var(--muted-foreground)' }} />
            <span className="text-[10px] mt-1" style={{ color: 'var(--muted-foreground)' }}>
              {urls.length === 0 ? 'Adicionar fotos' : 'Adicionar'}
            </span>
            <input ref={inputRef} type="file" accept="image/*" multiple onChange={handleFiles} className="hidden" />
          </label>
        )}
      </div>

      <div className="flex items-center justify-between mt-2">
        <p className="text-[10px]" style={{ color: 'var(--muted-light)' }}>{urls.length}/{max} fotos</p>
        {erro && <p className="text-[10px]" style={{ color: 'var(--destructive)' }}>{erro}</p>}
      </div>
    </div>
  )
}
