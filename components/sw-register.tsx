'use client';

import { toast } from '@/hooks/use-toast';
import { useEffect } from 'react';

export default function SWRegister() {
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

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const handleControllerChange = () => {
        toast({
          title: '新版本可用，请刷新页面',
          description: '新版本可用，请刷新页面以获取最新内容',
        });
      };

      // 监控service worker更新
      // 当页面的控制权切换到一个新的 Service Worker 时（sw.js文件中的CACHE_NAME发生变化时），会触发controllerchange事件
      navigator.serviceWorker.addEventListener(
        'controllerchange',
        handleControllerChange,
      );

      return () => {
        navigator.serviceWorker.removeEventListener(
          'controllerchange',
          handleControllerChange,
        );
      };
    }
  }, []);

  return null;
}
