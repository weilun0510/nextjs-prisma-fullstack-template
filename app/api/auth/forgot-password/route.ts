import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';
import { randomBytes } from 'crypto';
import { config, APP_NAME } from '@/lib/config';

const prisma = new PrismaClient();

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json(
        { success: false, error: '邮箱不能为空' },
        { status: 400 },
      );
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // 邮箱不存在也返回成功，防止信息泄露
      return NextResponse.json({ success: true });
    }
    // 生成token，有效期30分钟
    const token = randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 30 * 60 * 1000);
    // 保存token到数据库（可用User表扩展字段，或新建PasswordReset表）
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        token,
        expiresAt: expires,
      },
    });
    // 发送邮件
    const resetUrl = `${config.app.url}/reset-password?token=${token}`;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    await transporter.sendMail({
      from: `${config.email.from.name} <${config.email.from.email}>`,
      to: email,
      subject: `重置您的${APP_NAME}账户密码`,
      text: `您好，\n\n请点击下方链接重置您的密码（30分钟内有效）：\n${resetUrl}\n\n如果不是您本人操作，请忽略此邮件。`,
      html: `<div style="font-family:Arial,sans-serif;font-size:15px;color:#222;line-height:1.7;max-width:480px;margin:auto;">
        <h2 style="color:#3b82f6;">${APP_NAME}密码重置</h2>
        <p>您好，</p>
        <p>您正在进行密码重置操作，请点击下方按钮重置您的密码（30分钟内有效）：</p>
        <div style="margin:24px 0;text-align:center;">
          <a href="${resetUrl}" target="_blank" style="display:inline-block;padding:12px 32px;background:#6366f1;color:#fff;text-decoration:none;border-radius:6px;font-weight:bold;font-size:16px;">重置密码</a>
        </div>
        <p>如果按钮无法点击，请复制以下链接到浏览器打开：</p>
        <div style="word-break:break-all;background:#f3f4f6;padding:8px 12px;border-radius:4px;font-size:13px;">${resetUrl}</div>
        <p style="color:#888;font-size:13px;margin-top:24px;">如果不是您本人操作，请忽略此邮件。</p>
        <p style="color:#888;font-size:13px;">${APP_NAME}团队</p>
      </div>`,
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('找回密码邮件发送失败:', error);
    return NextResponse.json(
      { success: false, error: '发送失败，请稍后再试' },
      { status: 500 },
    );
  }
}
