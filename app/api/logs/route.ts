import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';

interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  data?: Record<string, unknown>;
  stack?: string;
  url?: string;
  userAgent?: string;
  userId?: number;
}

/**
 * 日志收集 API
 * 接收客户端发送的日志并进行处理
 */
export async function POST(request: NextRequest) {
  try {
    // 验证用户身份（可选，根据需求决定）
    const auth = await verifyToken();

    const logEntry: LogEntry = await request.json();

    // 验证日志数据格式
    if (!logEntry.timestamp || !logEntry.level || !logEntry.message) {
      return NextResponse.json({ error: '日志数据格式无效' }, { status: 400 });
    }

    // 添加用户ID（如果已认证）
    if (auth.success) {
      logEntry.userId = auth.userId;
    }

    // 只处理重要级别的日志
    if (logEntry.level !== 'warn' && logEntry.level !== 'error') {
      return NextResponse.json({ success: true });
    }

    // 在生产环境中，这里可以：
    // 1. 存储到数据库
    // 2. 发送到日志聚合服务（如 ELK Stack、Splunk）
    // 3. 发送到错误监控服务（如 Sentry）
    // 4. 发送告警通知

    // 示例：控制台输出（开发环境）
    if (process.env.NODE_ENV === 'development') {
      console.log('收到客户端日志:', {
        level: logEntry.level,
        message: logEntry.message,
        timestamp: logEntry.timestamp,
        userId: logEntry.userId,
        url: logEntry.url,
        stack: logEntry.stack,
      });
    }

    // 生产环境处理逻辑
    if (process.env.NODE_ENV === 'production') {
      // TODO: 实现生产环境日志处理
      // - 存储到数据库
      // - 发送到监控服务
      // - 错误告警等
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // 避免日志API本身的错误影响应用
    console.error('日志API错误:', error);

    return NextResponse.json({ error: '日志处理失败' }, { status: 500 });
  }
}
