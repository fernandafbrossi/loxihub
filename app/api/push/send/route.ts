import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@/lib/supabase/server'

webpush.setVapidDetails(
  'mailto:' + (process.env.VAPID_SUBJECT ?? 'fernandafaustinib@gmail.com'),
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? '',
  process.env.VAPID_PRIVATE_KEY ?? ''
)

export async function POST(req: NextRequest) {
  // Verifica o secret do webhook
  const secret = req.headers.get('x-webhook-secret')
  if (secret !== process.env.PUSH_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  const body = await req.json()
  // Supabase webhook envia { type, table, record, ... }
  const notificacao = body.record
  if (!notificacao?.user_id) {
    return NextResponse.json({ ok: true })
  }

  const supabase = await createClient()
  const { data: subs } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth_key')
    .eq('user_id', notificacao.user_id)

  if (!subs || subs.length === 0) {
    return NextResponse.json({ ok: true })
  }

  const payload = JSON.stringify({
    title: 'LoxiHub',
    body: notificacao.texto,
    url: notificacao.url ?? '/',
  })

  await Promise.allSettled(
    subs.map(s =>
      webpush.sendNotification(
        { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth_key } },
        payload
      )
    )
  )

  return NextResponse.json({ ok: true })
}
