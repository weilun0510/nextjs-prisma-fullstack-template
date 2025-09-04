import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { PrismaClient } from '@prisma/client';
import { getAuthCookieOptions } from '@/lib/utils';
import { log } from '@/lib/logger';

const prisma = new PrismaClient();

/**
 * 用户登录 API
 * @param request - HTTP 请求对象
 * @returns 登录响应
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // 验证输入
    if (!email || !password) {
      return NextResponse.json(
        { error: '邮箱和密码都是必填项' },
        { status: 400 },
      );
    }

    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
    }

    // 检查账户是否激活
    if (!user.isActive) {
      return NextResponse.json(
        { error: '账户已被停用，请联系管理员' },
        { status: 401 },
      );
    }

    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return NextResponse.json({ error: '邮箱或密码错误' }, { status: 401 });
    }

    // 更新最后登录时间
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // 生成 JWT token
    const jwtSecret =
      process.env.JWT_SECRET || 'development-jwt-secret-key-2024';

    if (jwtSecret === 'development-jwt-secret-key-2024') {
      log.warn('使用默认JWT密钥，生产环境请配置JWT_SECRET环境变量');
    }

    // 使用 jose 库生成 JWT
    const secret = new TextEncoder().encode(jwtSecret);
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      name: user.name,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);

    log.info('用户登录成功', { userId: user.id, email: user.email });

    // 设置 HTTP-only cookie
    const response = NextResponse.json(
      {
        message: '登录成功',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phoneNumber: user.phoneNumber,
        },
      },
      { status: 200 },
    );

    response.cookies.set('auth-token', token, getAuthCookieOptions(token));

    return response;
  } catch (error) {
    log.error('用户登录失败', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
