import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();
    if (!token || !password) {
      return NextResponse.json(
        { success: false, error: '参数不完整' },
        { status: 400 },
      );
    }
    const reset = await prisma.passwordResetToken.findUnique({
      where: { token },
    });
    if (!reset || reset.expiresAt < new Date()) {
      return NextResponse.json(
        { success: false, error: '重置链接无效或已过期' },
        { status: 400 },
      );
    }
    // 更新用户密码
    const hash = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { id: reset.userId },
      data: { password: hash },
    });
    // 删除token
    await prisma.passwordResetToken.delete({ where: { token } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('重置密码失败:', error);
    return NextResponse.json(
      { success: false, error: '重置失败，请稍后再试' },
      { status: 500 },
    );
  }
}
