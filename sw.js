// 앱 파일을 캐시에 넣어 두고 오프라인에서도 열리게 한다.
// 파일을 바꿔서 배포할 때는 CACHE 이름의 버전을 올린다.
const CACHE = 'habit-tracker-v5';
const APP_FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 온라인이면 새 파일을 받아 캐시를 갱신하고, 네트워크가 안 되면 캐시로 응답한다
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true })
          .then((cached) => cached || (req.mode === 'navigate' ? caches.match('./index.html') : undefined))
          .then((res) => res || Response.error())
      )
  );
});

// 페이지가 지금 동작 중인 버전을 물어보면 알려 준다 (새 버전 안내용)
self.addEventListener('message', (event) => {
  if (event.data === 'version' && event.source) event.source.postMessage({ version: CACHE });
});
