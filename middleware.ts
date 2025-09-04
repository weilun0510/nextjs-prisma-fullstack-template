import { NextRequest, NextResponse } from 'next/server';
import { verifyAuthMiddleware } from '@/lib/auth-utils';

/**
 * 认证中间件
 * 保护需要登录的路由
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 需要保护的路由
  const protectedRoutes = ['/demo'];

  // 检查当前路径是否需要保护
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  );

  // 如果不是保护路由，允许访问
  if (!isProtectedRoute) {
    return NextResponse.next();
  }

  // 使用 Edge Runtime 兼容的认证验证
  const authResult = await verifyAuthMiddleware(request);

  if (!authResult.success) {
    return authResult.redirectResponse;
  }

  // 认证成功，允许访问
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
