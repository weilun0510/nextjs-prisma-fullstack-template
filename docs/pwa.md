## PWA 简介与使用指南

### 什么是 PWA

Progressive Web App（渐进式网页应用）是一种结合 Web 与原生应用优势的应用形态。通过浏览器提供的现代能力（Service Worker、Web App Manifest、安全上下文等），实现离线可用、可安装到桌面/手机、消息推送、后台同步、快速加载等体验。

### 能力与优势

- 离线可用与弱网可用（缓存静态资源与关键数据）
- 可安装到主屏幕（独立图标、应用启动画面、独立窗口）
- 推送通知与后台同步（需用户授权）
- 性能优化（预缓存、分层缓存、SW 切面控制网络请求）
- 响应式适配（移动端友好）
- 更新策略灵活（静默更新或提醒用户刷新）

## 基础组成

- Web App Manifest：声明应用名称、图标、主题色、启动页、启动 URL、显示模式等
- Service Worker：运行在独立线程的脚本，拦截请求、管理缓存、处理离线、推送与同步
- 安全上下文（HTTPS）：绝大多数 PWA 能力（尤其是 Service Worker）需要 HTTPS

## 在本项目中如何接入（Next.js 15）

以下为最小可用接入方案，便于逐步增强（如引入 Workbox）。

### 步骤 1：创建 Manifest

在 `public/manifest.json` 添加：

```json
{
  "name": "AppName",
  "short_name": "AppName",
  "description": "AppName 渐进式网页应用",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#60a5fa",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-192x192.svg",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "maskable any"
    },
    {
      "src": "/icons/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "maskable any"
    }
  ],
  "categories": ["productivity", "lifestyle"],
  "lang": "zh-CN",
  "dir": "ltr"
}
```

在 `public/icons/` 放置对应图标。

在 `app/layout.tsx` `<head>` 中声明（或使用 Next Metadata manifest 字段）：

```tsx
<link rel="manifest" href="/manifest.json" />
<meta name="theme-color" content="#60a5fa" />
```

### 步骤 2：编写 Service Worker

在 `public/sw.js` 添加最小 SW（后续可换 Workbox）：

```js
/* global self, caches, fetch */
const CACHE_NAME = 'appName-app-shell-v1';
const APP_SHELL = ['/', '/favicon.ico', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)),
  );
  self.skipWaiting();
});

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
```

### 步骤 3：注册 Service Worker

创建 `components/sw-register.tsx`（Client Component）并在 `app/layout.tsx` 引用：

```tsx
'use client';
import { useEffect } from 'react';

/**
 * 注册 Service Worker
 * @returns null
 */
export default function SWRegister(): null {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError);
        });
    }
  }, []);
  return null;
}
```

在 `app/layout.tsx` 的 `<body>` 里加入 `<SWRegister />`。

### 步骤 4：缓存策略（建议）

- 静态资源（JS/CSS/字体/图标）：Cache First + 长缓存（通过文件名 hash）
- 页面与数据接口：Stale-While-Revalidate 或 Network First（确保最新）
- 大文件/上传：不缓存或仅缓存元数据，上传一律直传 OSS（遵循你“统一使用阿里云 OSS”的要求）

如需更强策略，建议使用 Workbox（`workbox-precaching`、`workbox-routing`、`workbox-strategies`）。

### 步骤 5：更新与版本管理

- 修改 `CACHE_NAME` 触发老缓存清理
- 使用 `self.skipWaiting()` 与 `self.clients.claim()` 控制更新生效时机
- 可在前端监听 `waiting` 状态，提示用户“有新版本，点击刷新”

### 步骤 6：安装体验优化

- manifest 中补充 `scope`、`screenshots`、`shortcuts`
- 保证首页可离线打开（App Shell）
- 减少首屏网络依赖

## 安全与部署：在不安全的 HTTPS 上能用 PWA 吗？

- 结论：不能。PWA 关键能力（尤其 Service Worker）要求“安全上下文（Secure Context）”
- 满足条件：
  - HTTPS 且证书有效（受信 CA、链路正确、无过期）
  - 或 `http://localhost`（开发例外）
- 不满足情况（将导致 SW 注册失败、不可安装等）：
  - 仅 HTTP 的线上站点
  - HTTPS 但证书无效/自签未受信/域名不匹配/过期
  - 存在主动混合内容（HTTPS 页面加载 HTTP 子资源）
- 部署建议：
  - 使用可信证书（例如 Let’s Encrypt）
  - 消除混合内容
  - 配置正确的 `Content-Type`（`application/manifest+json`）与 `Cache-Control`

## 调试与验收清单

- Lighthouse PWA 分析（Chrome DevTools → Lighthouse）
- `manifest.json` 可访问、字段完整、图标齐全
- `sw.js` 成功注册，作用域正确（通常为 `/`）
- 离线模式仍可打开首页
- 安装按钮可见（地址栏安装图标/浏览器菜单）
- 主题色、应用名称、显示模式符合预期
- 更新流程可验证（发布新构建 → 提示或静默更新）

## 常见问题

- 看不到“安装应用”：
  - 站点不安全、Manifest 缺失或不完整、首页不可离线、未长期访问
- SW 未注册：
  - 非 HTTPS/证书不可信、路径错误、语法错误、作用域超限
- 更新不生效：
  - 老版本 SW 未终止、缓存未清、需要 `skipWaiting/clientsClaim` 或提示用户刷新

## 参考资料

- [MDN：PWA 基础](https://developer.mozilla.org/docs/Web/Progressive_web_apps)
- [MDN：Service Worker](https://developer.mozilla.org/docs/Web/API/Service_Worker_API)
- [Web App Manifest](https://developer.mozilla.org/docs/Web/Manifest)
- [Workbox](https://developer.chrome.com/docs/workbox)

以上内容可直接保存为 `docs/pwa.md` 并按需扩展。
