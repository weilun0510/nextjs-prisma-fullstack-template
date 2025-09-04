import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 设置认证 Cookie 的配置选项
 * 根据环境动态设置 secure 属性
 */
export function getAuthCookieOptions(
  token: string,
  maxAge: number = 7 * 24 * 60 * 60 * 1000,
) {
  return {
    httpOnly: true,
    secure:
      process.env.NODE_ENV === 'production' &&
      process.env.HTTPS_ENABLED === 'true',
    sameSite: 'lax' as const,
    maxAge,
    path: '/',
  };
}
