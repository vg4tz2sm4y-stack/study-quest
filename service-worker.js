// index.html이나 이미지를 바꿔서 배포할 때마다 아래 숫자를 올려야, 이미 설치된 기기에서도 새 버전이 보입니다.
const CACHE = 'study-quest-v4';

// 없으면 앱이 동작하지 않는 핵심 파일
const CORE = ['./index.html', './manifest.json'];

// 오프라인에서도 바로 보이게 미리 받아 두는 지역 NPC 초상 (하나가 빠져 있어도 설치는 실패하지 않는다)
const EXTRA = [
  './study-quest-npc-noa.png',
  './study-quest-npc-elian.png',
  './study-quest-npc-ian.png',
  './study-quest-npc-adel.png',
  './study-quest-npc-veiled.png',
  './study-quest-npc-unveiled.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(async cache => {
      await cache.addAll(CORE);
      await Promise.all(EXTRA.map(url => cache.add(url).catch(() => {})));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  event.respondWith(
    caches.match(req).then(cached => {
      if (cached) return cached;
      return fetch(req).then(res => {
        // 같은 출처의 이미지는 처음 불러올 때 함께 저장해, 이후 오프라인에서도 초상·아이콘이 보이게 한다.
        // (오디오는 Range 요청 때문에 iOS에서 재생이 깨질 수 있어 저장하지 않는다.)
        if (res && res.status === 200 && req.destination === 'image' && new URL(req.url).origin === self.location.origin) {
          const copy = res.clone();
          caches.open(CACHE).then(cache => cache.put(req, copy));
        }
        return res;
      });
    })
  );
});
