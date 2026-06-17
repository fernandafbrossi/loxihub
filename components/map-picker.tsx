'use client'

import { useEffect, useRef, useState } from 'react'
import { Search } from 'lucide-react'

interface MapPickerProps {
  lat: number | null
  lng: number | null
  onChange?: (lat: number, lng: number) => void
  readonly?: boolean
}

export function MapPicker({ lat, lng, onChange, readonly = false }: MapPickerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markerRef = useRef<any>(null)
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [searchError, setSearchError] = useState('')

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    let L: any
    try {
      L = require('leaflet')
    } catch {
      return
    }

    delete (L.Icon.Default.prototype as any)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    })

    const initialLat = lat ?? 20
    const initialLng = lng ?? 0
    const zoom = lat != null ? 10 : 2

    const map = L.map(containerRef.current, { zoomControl: true }).setView([initialLat, initialLng], zoom)
    mapRef.current = map

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
    }).addTo(map)

    if (lat != null && lng != null) {
      markerRef.current = L.marker([lat, lng]).addTo(map)
    }

    if (!readonly) {
      map.on('click', (e: any) => {
        const { lat: clickLat, lng: clickLng } = e.latlng
        if (markerRef.current) {
          markerRef.current.setLatLng([clickLat, clickLng])
        } else {
          markerRef.current = L.marker([clickLat, clickLng]).addTo(map)
        }
        onChange?.(clickLat, clickLng)
      })
    }

    return () => {
      map.remove()
      mapRef.current = null
      markerRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!mapRef.current || lat == null || lng == null) return
    const L = require('leaflet')
    if (markerRef.current) {
      markerRef.current.setLatLng([lat, lng])
    } else {
      markerRef.current = L.marker([lat, lng]).addTo(mapRef.current)
    }
    mapRef.current.setView([lat, lng], mapRef.current.getZoom() < 5 ? 10 : mapRef.current.getZoom())
  }, [lat, lng])

  async function handleSearch() {
    const q = query.trim()
    if (!q || !mapRef.current) return
    setSearching(true)
    setSearchError('')

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`,
        { headers: { 'Accept-Language': 'pt-BR,en' } }
      )
      const data = await res.json()

      if (!data.length) {
        setSearchError('Local não encontrado.')
        return
      }

      const { lat: foundLat, lon: foundLng } = data[0]
      const la = parseFloat(foundLat)
      const ln = parseFloat(foundLng)

      const L = require('leaflet')
      mapRef.current.setView([la, ln], 12)

      if (!readonly) {
        if (markerRef.current) {
          markerRef.current.setLatLng([la, ln])
        } else {
          markerRef.current = L.marker([la, ln]).addTo(mapRef.current)
        }
        onChange?.(la, ln)
      }
    } catch {
      setSearchError('Erro ao buscar localização.')
    } finally {
      setSearching(false)
    }
  }

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {!readonly && (
        <div className="flex gap-2 mb-2">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#B09098' }} />
            <input
              type="text"
              value={query}
              onChange={e => { setQuery(e.target.value); setSearchError('') }}
              onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSearch() } }}
              placeholder="Pesquisar local (ex: Hamptons, Nova York)"
              className="w-full pl-8 pr-3 py-2 rounded-lg border text-sm outline-none"
              style={{ background: '#F5F0F2', borderColor: 'rgba(128,0,32,0.10)', color: '#2E0510' }}
            />
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={!query.trim() || searching}
            className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-opacity hover:opacity-80"
            style={{ background: '#800020', color: '#FAF0F2' }}
          >
            {searching ? '...' : 'Ir'}
          </button>
        </div>
      )}

      {searchError && (
        <p className="text-[11px] mb-1.5" style={{ color: '#906070' }}>{searchError}</p>
      )}

      <div
        ref={containerRef}
        style={{ height: 220, borderRadius: 10, overflow: 'hidden', border: '0.5px solid rgba(128,0,32,0.15)' }}
      />

      {!readonly && (
        <p className="text-[10px] mt-1" style={{ color: '#B09098' }}>
          Pesquise um local ou clique no mapa para marcar a localização
        </p>
      )}
    </>
  )
}
