// عامل الخدمة هنا للإشعار وحده: لا يخزّن الصفحة ولا يعترض طلبًا،
// فكل تحديثٍ للموقع يوصل الجوال من أول فتحة
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

// الإشعار يصل من خادم «يومي» نفسه والجوال مقفل. والآيفون يشترط إشعارًا مع كل دفعة
self.addEventListener('push', e => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { title: e.data && e.data.text() }; }
  const icon = new URL('wael-icon-512.png?v=3', self.registration.scope).href;
  e.waitUntil(self.registration.showNotification(d.title || 'مشروع الحمادي', {
    body: d.body || '', icon, badge: icon, dir: 'rtl', lang: 'ar',
    // بوسم الموعد نفسه: لو وصل مرتين ما يتكرّر على الشاشة
    tag: d.tag || 'hammadi', data: { tab: d.tab || 'm' },
  }));
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  const tab = (e.notification.data && e.notification.data.tab) || 'm';
  const url = new URL('./?tab=' + tab, self.registration.scope).href;
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of all) if (c.url.startsWith(self.registration.scope)) { await c.focus(); c.postMessage({ tab }); return; }
    await self.clients.openWindow(url);
  })());
});
