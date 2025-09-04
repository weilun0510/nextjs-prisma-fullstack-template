import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 用户注册 API
 * @param request - HTTP 请求对象
 * @returns 注册响应
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password, name, phoneNumber } = await request.json();

    // 验证输入
    if (!email || !password) {
      return NextResponse.json(
        { error: '邮箱和密码都是必填项' },
        { status: 400 },
      );
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: '请输入有效的邮箱地址' },
        { status: 400 },
      );
    }

    // 验证密码长度
    if (password.length < 6) {
      return NextResponse.json({ error: '密码长度至少为6位' }, { status: 400 });
    }

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: '该邮箱已被注册' }, { status: 409 });
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name: name || null,
        phoneNumber: phoneNumber || null,
      },
    });

    // 生成 JWT token
    const jwtSecret =
      process.env.JWT_SECRET || 'development-jwt-secret-key-2024';
    const secret = new TextEncoder().encode(jwtSecret);
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      name: user.name,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(secret);

    // 设置 HTTP-only cookie
    const response = NextResponse.json(
      {
        message: '注册成功',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phoneNumber: user.phoneNumber,
        },
      },
      { status: 201 },
    );

    response.cookies.set('auth-token', token, {
      httpOnly: true,
      secure:
        process.env.NODE_ENV === 'production' &&
        process.env.HTTPS_ENABLED === 'true',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('注册错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}
