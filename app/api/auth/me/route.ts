import { NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const auth = await verifyToken();
    if (!auth.success) {
      return auth.response;
    }

    // 获取完整用户信息
    const user = await prisma.user.findUnique({
      where: { id: auth.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phoneNumber: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        { error: '用户不存在或已被禁用' },
        { status: 401 },
      );
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}
