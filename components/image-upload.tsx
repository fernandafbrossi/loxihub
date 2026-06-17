'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Upload, X } from 'lucide-react'

interface ImageUploadProps {
  onUpload: (url: string) => void
  currentUrl?: string
  className?: string
}

export function ImageUpload({ onUpload, currentUrl, className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(currentUrl || '')

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const supabase = createClient()
    const ext = file.name.split('.').pop()
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`

    const { data, error } = await supabase.storage
      .from('imagens')
      .upload(filename, file, { upsert: true })

    if (!error && data) {
      const { data: urlData } = supabase.storage.from('imagens').getPublicUrl(data.path)
      setPreview(urlData.publicUrl)
      onUpload(urlData.publicUrl)
    }

    setUploading(false)
  }

  function handleRemove() {
    setPreview('')
    onUpload('')
  }

  return (
    <div className={className}>
      {preview ? (
        <div className="relative rounded-lg overflow-hidden">
          <img src={preview} alt="" className="w-full h-48 object-cover" />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-2 right-2 p-1.5 rounded-full shadow"
            style={{ background: 'var(--card)' }}
          >
            <X size={14} style={{ color: 'var(--foreground)' }} />
          </button>
        </div>
      ) : (
        <label
          className="flex flex-col items-center justify-center w-full h-36 rounded-lg border-2 border-dashed cursor-pointer hover:opacity-70 transition-opacity"
          style={{ borderColor: 'var(--border)', background: 'var(--muted)' }}
        >
          <Upload size={20} style={{ color: 'var(--muted-foreground)' }} />
          <span className="text-xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
            {uploading ? 'Enviando...' : 'Clique para enviar imagem'}
          </span>
          <input
            type="file"
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
            disabled={uploading}
          />
        </label>
      )}
    </div>
  )
}
