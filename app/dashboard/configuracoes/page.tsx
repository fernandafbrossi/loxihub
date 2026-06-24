import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { SettingsForm } from './settings-form'

export default async function ConfiguracoesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profileResult, universosResult, principaisResult] = await Promise.all([
    supabase.from('profiles').select('nome_display, avatar_url, bio').eq('id', user.id).single(),
    supabase.from('universos').select('id, nome, personagens(id, nome, foto_url)').order('nome'),
    supabase.from('perfil_personagem_principal').select('universo_id, personagem_id').eq('perfil_id', user.id),
  ])

  const profile = profileResult.data
  const universos = universosResult.data ?? []
  const principaisExistentes = principaisResult.data ?? []

  const principaisMap: Record<string, string> = {}
  for (const p of principaisExistentes) {
    if (p.personagem_id) principaisMap[p.universo_id] = p.personagem_id
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-8">
      <h1 className="text-xl font-semibold mb-6" style={{ color: 'var(--foreground)', fontFamily: 'var(--font-serif)' }}>
        Configurações
      </h1>
      <SettingsForm
        userId={user.id}
        nomeDisplay={profile?.nome_display ?? ''}
        avatarUrl={profile?.avatar_url ?? ''}
        bio={profile?.bio ?? ''}
        universos={universos as any}
        principaisMap={principaisMap}
      />
    </div>
  )
}
