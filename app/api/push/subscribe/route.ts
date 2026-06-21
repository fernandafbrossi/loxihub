import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const { subscription, userId } = await req.json()
  if (!subscription?.endpoint || !userId) {
    return NextResponse.json({ error: 'invalid' }, { status: 400 })
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || user.id !== userId) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId,
      endpoint: subscription.endpoint,
      p256dh: subscription.keys.p256dh,
      auth_key: subscription.keys.auth,
    },
    { onConflict: 'endpoint' }
  )

  return NextResponse.json({ ok: true })
}
