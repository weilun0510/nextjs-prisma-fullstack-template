import { NextResponse } from 'next/server';

/**
 * 用户注销 API
 * @returns 注销响应
 */
export async function POST() {
  try {
    const response = NextResponse.json(
      { message: '注销成功' },
      { status: 200 },
    );

    // 清除认证 cookie
    response.cookies.set('auth-token', '', {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === 'production' &&
        process.env.HTTPS_ENABLED === 'true',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('注销错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
