'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { BookOpen, Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Email ou senha incorretos.')
      setLoading(false)
      return
    }

    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F5F0F2' }}>
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ background: 'rgba(128,0,32,0.08)' }}>
            <BookOpen size={28} style={{ color: '#800020' }} />
          </div>
          <h1 className="text-3xl font-bold tracking-tight" style={{ color: '#2E0510' }}>
            LoxiHub
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#906070' }}>
            Seu universo narrativo
          </p>
        </div>

        <div className="rounded-2xl p-6 shadow-sm border" style={{ background: 'rgba(255,255,255,0.60)', borderColor: 'rgba(128,0,32,0.10)' }}>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#2E0510' }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="seu@email.com"
                className="w-full px-4 py-2.5 rounded-lg border text-sm outline-none transition-all"
                style={{
                  background: '#F5F0F2',
                  borderColor: 'rgba(128,0,32,0.10)',
                  color: '#2E0510',
                }}
                onFocus={e => (e.target.style.borderColor = '#800020')}
                onBlur={e => (e.target.style.borderColor = 'rgba(128,0,32,0.10)')}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1.5" style={{ color: '#2E0510' }}>
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 pr-10 rounded-lg border text-sm outline-none transition-all"
                  style={{
                    background: '#F5F0F2',
                    borderColor: 'rgba(128,0,32,0.10)',
                    color: '#2E0510',
                  }}
                  onFocus={e => (e.target.style.borderColor = '#800020')}
                  onBlur={e => (e.target.style.borderColor = 'rgba(128,0,32,0.10)')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: '#906070' }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-sm text-center py-2 px-3 rounded-lg" style={{ background: 'rgba(128,0,32,0.08)', color: 'var(--destructive)' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 rounded-lg text-sm font-medium transition-opacity disabled:opacity-60"
              style={{ background: '#800020', color: '#FAF0F2' }}
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
