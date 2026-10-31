// عامل الخدمة هنا للإشعار وحده: لا يخزّن الصفحة ولا يعترض طلبًا،
// فكل تحديثٍ للموقع يوصل الجوال من أول فتحة
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const tab = (e.notification.data && e.notification.data.tab) || 'home';
  const url = new URL('./?tab=' + tab, self.registration.scope).href;
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) if (c.url.startsWith(self.registration.scope)) { await c.focus(); c.postMessage({ tab }); return; }
    await self.clients.openWindow(url);
  })());
});
