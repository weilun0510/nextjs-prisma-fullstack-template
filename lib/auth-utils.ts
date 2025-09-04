import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import { jwtVerify } from 'jose'; // Edge Runtime 兼容的 JWT 库

export interface AuthResult {
  success: true;
  userId: number;
  user: {
    userId: number;
    email: string;
    name: string;
  };
}

export interface AuthError {
  success: false;
  response: NextResponse;
}

/**
 * 验证请求中的 JWT token
 * @param request - NextRequest 对象（可选，用于兼容性）
 * @returns 验证结果或错误响应
 */
export async function verifyToken(): Promise<AuthResult | AuthError> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;

    if (!token) {
      return {
        success: false,
        response: NextResponse.json({ error: '未授权' }, { status: 401 }),
      };
    }

    // 验证 token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
      email: string;
      name: string;
    };

    return {
      success: true,
      userId: decoded.userId,
      user: {
        userId: decoded.userId,
        email: decoded.email,
        name: decoded.name,
      },
    };
  } catch (error) {
    console.error('JWT 验证失败:', error);
    return {
      success: false,
      response: NextResponse.json({ error: '认证失败' }, { status: 401 }),
    };
  }
}

/**
 * 中间件专用的认证验证函数
 * 使用 jose 库，兼容 Edge Runtime
 * 为什么不用上面的 verifyToken？（jsonwebtoken 库使用了 Node.js 的 crypto 模块，Edge Runtime 不支持）
 */
export async function verifyAuthMiddleware(request: NextRequest): Promise<{
  success: boolean;
  userId?: number;
  redirectResponse?: NextResponse;
}> {
  try {
    const token = request.cookies.get('auth-token')?.value;

    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
      return {
        success: false,
        redirectResponse: NextResponse.redirect(loginUrl),
      };
    }

    // 使用 jose 库验证 JWT (Edge Runtime 兼容)
    const jwtSecret =
      process.env.JWT_SECRET || 'development-jwt-secret-key-2024';
    const secret = new TextEncoder().encode(jwtSecret);
    const { payload } = await jwtVerify(token, secret);

    return {
      success: true,
      userId: payload.userId as number,
    };
  } catch (error) {
    console.error('中间件 JWT 验证失败:', {
      error: error instanceof Error ? error.message : '未知错误',
      pathname: request.nextUrl.pathname,
      tokenExists: !!request.cookies.get('auth-token')?.value,
      jwtSecret: process.env.JWT_SECRET ? '已设置' : '未设置',
    });

    // token 无效，清除 cookie 并重定向到登录页
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === 'production' &&
        process.env.HTTPS_ENABLED === 'true',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return {
      success: false,
      redirectResponse: response,
    };
  }
}
