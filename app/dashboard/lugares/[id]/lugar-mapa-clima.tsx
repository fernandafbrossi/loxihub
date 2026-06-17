'use client'

import { useState } from 'react'
import { Thermometer, CloudSun } from 'lucide-react'

interface Props {
  lat: number | null
  lng: number | null
  nome: string
}

interface ClimaResult {
  data: string
  min: number
  max: number
  media: number
}

export function LugarMapaClima({ lat, lng, nome }: Props) {
  const [dataBusca, setDataBusca] = useState('')
  const [clima, setClima] = useState<ClimaResult | null>(null)
  const [buscando, setBuscando] = useState(false)
  const [erroClima, setErroClima] = useState('')

  async function buscarClima() {
    if (!lat || !lng || !dataBusca) return
    setBuscando(true)
    setErroClima('')
    setClima(null)

    try {
      const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lng}&start_date=${dataBusca}&end_date=${dataBusca}&daily=temperature_2m_max,temperature_2m_min,temperature_2m_mean&timezone=auto`
      const res = await fetch(url)
      const json = await res.json()

      if (json.daily?.temperature_2m_mean?.[0] != null) {
        setClima({
          data: dataBusca,
          min: Math.round(json.daily.temperature_2m_min[0]),
          max: Math.round(json.daily.temperature_2m_max[0]),
          media: Math.round(json.daily.temperature_2m_mean[0]),
        })
      } else {
        setErroClima('Não foi possível obter dados para esta data.')
      }
    } catch {
      setErroClima('Erro ao consultar histórico climático.')
    } finally {
      setBuscando(false)
    }
  }

  const hasCoords = lat != null && lng != null

  return (
    <div className="space-y-4">
      {hasCoords && (
        <div>
          <p className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: '#906070' }}>
            <span className="inline-flex items-center gap-1"><CloudSun size={11} /> Histórico de temperatura</span>
          </p>
          <div className="flex gap-2">
            <input
              type="date"
              value={dataBusca}
              onChange={e => setDataBusca(e.target.value)}
              max={new Date(Date.now() - 86400000 * 5).toISOString().split('T')[0]}
              className="flex-1 px-3 py-2 rounded-lg border text-sm outline-none"
              style={{ background: '#F5F0F2', borderColor: 'rgba(128,0,32,0.10)', color: '#2E0510' }}
            />
            <button
              type="button"
              onClick={buscarClima}
              disabled={!dataBusca || buscando}
              className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50 transition-opacity hover:opacity-80"
              style={{ background: '#800020', color: '#FAF0F2' }}
            >
              {buscando ? '...' : 'Consultar'}
            </button>
          </div>

          {erroClima && (
            <p className="text-xs mt-2" style={{ color: '#906070' }}>{erroClima}</p>
          )}

          {clima && (
            <div
              className="mt-3 p-4 rounded-xl flex items-center gap-4"
              style={{ background: 'rgba(128,0,32,0.06)', border: '0.5px solid rgba(128,0,32,0.12)' }}
            >
              <Thermometer size={20} style={{ color: '#800020', flexShrink: 0 }} />
              <div>
                <p className="text-xs font-medium mb-0.5" style={{ color: '#2E0510' }}>
                  {nome} — {new Date(clima.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
                <p className="text-sm" style={{ color: '#906070' }}>
                  Média <strong style={{ color: '#2E0510' }}>{clima.media}°C</strong>
                  &nbsp;·&nbsp; Mín {clima.min}°C &nbsp;·&nbsp; Máx {clima.max}°C
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
