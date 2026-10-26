/* オフライン対応。圏外(すすきのの地下など)でも、アプリ本体・店のデータ・いちど見た地図が出る
   - 自分のサイトのファイル: キャッシュを先に出して、裏で更新(stale-while-revalidate)
   - maplibre / firebase の読み込み: キャッシュ優先
   - 地図(OpenFreeMap の style・タイル・文字): いちど見た分をキャッシュ(上限あり)
   - Firestore などそのほかは通さない(触らない) */
const VER = 'loo-sw-1';
const APP = VER + '-app', LIB = VER + '-lib', MAP = VER + '-map';
const MAP_LIMIT = 600;
const CORE = ['./', 'index.html', 'privacy.html', 'manifest.webmanifest', 'icon-192.png', 'apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => !k.startsWith(VER)).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const cacheable = r => r && (r.ok || r.type === 'opaque');

async function staleWhileRevalidate(req, name, limit) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  const net = fetch(req).then(r => { if (cacheable(r)) { cache.put(req, r.clone()); if (limit) trim(cache, limit); } return r; }).catch(() => null);
  return hit || (await net) || Response.error();
}

async function cacheFirst(req, name) {
  const cache = await caches.open(name);
  const hit = await cache.match(req);
  if (hit) return hit;
  try { const r = await fetch(req); if (cacheable(r)) cache.put(req, r.clone()); return r; }
  catch (e) { return Response.error(); }
}

async function trim(cache, limit) {
  const keys = await cache.keys();
  if (keys.length > limit) await Promise.all(keys.slice(0, keys.length - limit).map(k => cache.delete(k)));
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const u = new URL(req.url);
  if (u.origin === self.location.origin) {
    // ?v= スタンプが付いたファイルはそのまま別のキャッシュ項目になる。ページ本体は検索文字を無視して探す
    e.respondWith(req.mode === 'navigate'
      ? staleWhileRevalidate(new Request(u.origin + u.pathname), APP)
      : staleWhileRevalidate(req, APP));
  } else if (u.hostname === 'unpkg.com' || u.hostname === 'www.gstatic.com') {
    e.respondWith(cacheFirst(req, LIB));
  } else if (u.hostname.endsWith('openfreemap.org')) {
    e.respondWith(staleWhileRevalidate(req, MAP, MAP_LIMIT));
  }
});
