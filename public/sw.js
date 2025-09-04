/* global self, caches, fetch */
const CACHE_NAME = 'app-shell-v1'; // 版本标识，每次更新时需要修改
const APP_SHELL = ['/', '/favicon.ico', '/manifest.json'];

/**
 * 安装事件：预缓存核心路由，并立即激活新 SW
 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

/**
 * 拦截网络请求：仅处理 http/https 的 GET 请求
 * - 优先返回缓存
 * - 回源成功后写入缓存（仅缓存 basic/200 响应）
 * - 忽略 chrome-extension:、data: 等不受支持的协议
 */
self.addEventListener('fetch', (event) => {
  event.respondWith(
    (async () => {
      const request = event.request;

      // 只处理 GET
      if (request.method !== 'GET') {
        return fetch(request);
      }

      // 仅缓存 http/https 协议
      const url = new URL(request.url);
      if (url.protocol !== 'http:' && url.protocol !== 'https:') {
        return fetch(request);
      }

      // 命中缓存直接返回
      const cached = await caches.match(request);
      if (cached) {
        return cached;
      }

      try {
        const response = await fetch(request);

        // 非可缓存响应直接透传
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }

        // 克隆并尝试写入缓存
        const responseToCache = response.clone();
        try {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(request, responseToCache);
        } catch {
          // 忽略缓存写入失败（比如某些响应不可缓存）
        }

        return response;
      } catch {
        // 回源失败，兜底到首页缓存
        return caches.match('/');
      }
    })(),
  );
});

/**
 * 激活事件：清理旧缓存并立即接管客户端
 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        }),
      );
    }),
  );
  self.clients.claim();
});
