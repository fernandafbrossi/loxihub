const CACHE = 'loxihub-v3';

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(['/favicon.ico'])));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Push notifications ──
self.addEventListener('push', (e) => {
  const data = e.data?.json() ?? {}
  e.waitUntil(
    self.registration.showNotification(data.title ?? 'LoxiHub', {
      body: data.body,
      icon: '/icon-192.png',
      badge: '/icon-96.png',
      data: { url: data.url ?? '/' },
    })
  )
})

self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      const target = e.notification.data?.url ?? '/'
      const existing = list.find(c => c.url.includes(self.location.origin))
      if (existing) { existing.focus(); existing.navigate(target) }
      else clients.openWindow(target)
    })
  )
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Deixa passar: Supabase, rotas de API e requests que não são GET
  if (
    e.request.method !== 'GET' ||
    url.hostname.includes('supabase.co') ||
    url.pathname.startsWith('/api/')
  ) return;

  // Navegação: tenta rede, cai no cache raiz se offline
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match('/'))
    );
    return;
  }

  // Só assets estáticos entram no cache. Páginas, dados RSC (router.refresh,
  // prefetch) e tudo dinâmico vão direto para a rede — antes eram cacheados e
  // serviam conteúdo velho (posts antigos) ao voltar para a aba.
  const isStatic =
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/_next/static/') ||
      /\.(png|jpg|jpeg|svg|ico|webp|woff2?)$/.test(url.pathname)) &&
    !url.searchParams.has('_rsc');
  if (!isStatic) return;

  // Assets estáticos: cache first, rede como fallback
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone));
        }
        return res;
      });
    })
  );
});
