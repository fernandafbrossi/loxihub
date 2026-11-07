import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  // Verifica o secret do webhook
  const secret = req.headers.get('x-webhook-secret')
  if (!process.env.PUSH_WEBHOOK_SECRET || secret !== process.env.PUSH_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 })
  }

  // Configurado dentro do handler: chaves ausentes não derrubam o import da rota
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY
  if (!vapidPublic || !vapidPrivate) {
    console.error('[push/send] chaves VAPID ausentes')
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 })
  }
  webpush.setVapidDetails(
    'mailto:' + (process.env.VAPID_SUBJECT ?? 'fernandafaustinib@gmail.com'),
    vapidPublic,
    vapidPrivate
  )

  const body = await req.json()
  // Supabase webhook envia { type, table, record, ... }
  const notificacao = body.record
  if (!notificacao?.user_id) {
    return NextResponse.json({ ok: true })
  }

  // Webhook não tem sessão de usuária: precisa da service role para ler push_subscriptions (RLS)
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    console.error('[push/send] SUPABASE_SERVICE_ROLE_KEY ausente')
    return NextResponse.json({ error: 'server_misconfigured' }, { status: 500 })
  }
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceKey, {
    auth: { persistSession: false },
  })
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
