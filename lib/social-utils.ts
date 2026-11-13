export interface PostMidia {
  midia_url: string | null
  midia_urls?: string[] | null
}

export function getMidias(p: PostMidia): string[] {
  if (p.midia_urls && p.midia_urls.length > 0) return p.midia_urls
  return p.midia_url ? [p.midia_url] : []
}

// Extrai o caminho no bucket 'imagens' a partir da URL pública.
export function pathNoStorage(url: string): string | null {
  const m = url.match(/\/object\/public\/imagens\/(.+?)(?:\?|$)/)
  return m ? decodeURIComponent(m[1]) : null
}

export function slugNome(nome: string): string {
  return nome.toLowerCase().replace(/\s+/g, '_')
}

// "agora", "há 5 min", "há 3 h", "há 2 d", "há 1 sem" ou "12 de março".
export function tempoRelativo(iso: string, agora = Date.now()): string {
  const diff = Math.max(0, agora - new Date(iso).getTime())
  const min = Math.floor(diff / 60_000)
  if (min < 1) return 'agora'
  if (min < 60) return `há ${min} min`
  const h = Math.floor(min / 60)
  if (h < 24) return `há ${h} h`
  const d = Math.floor(h / 24)
  if (d < 7) return `há ${d} d`
  const sem = Math.floor(d / 7)
  if (sem < 5) return `há ${sem} sem`
  const data = new Date(iso)
  const mesmoAno = data.getFullYear() === new Date(agora).getFullYear()
  return data.toLocaleDateString('pt-BR', mesmoAno
    ? { day: 'numeric', month: 'long' }
    : { day: 'numeric', month: 'long', year: 'numeric' })
}
