type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  data?: Record<string, unknown>;
  stack?: string;
  url?: string;
  userAgent?: string;
  userId?: number;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private isClient = typeof window !== 'undefined';

  private formatMessage(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>,
  ): LogEntry {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
    };

    if (data) {
      entry.data = data;
    }

    // 在客户端添加额外信息
    if (this.isClient) {
      entry.url = window.location.href;
      entry.userAgent = navigator.userAgent;
    }

    return entry;
  }

  private shouldLog(level: LogLevel): boolean {
    // 开发环境记录所有日志
    if (this.isDevelopment) {
      return true;
    }

    // 生产环境只记录 warn 和 error
    return level === 'warn' || level === 'error';
  }

  private writeLog(entry: LogEntry) {
    if (!this.shouldLog(entry.level)) {
      return;
    }

    // 控制台输出（开发环境）
    if (this.isDevelopment) {
      const style = this.getConsoleStyle(entry.level);
      console.log(
        `%c[${entry.level.toUpperCase()}] ${entry.timestamp}`,
        style,
        entry.message,
        entry.data || '',
      );
    }

    // 生产环境可以发送到远程日志服务
    if (!this.isDevelopment && this.isClient) {
      this.sendToRemoteLogger(entry);
    }
  }

  private getConsoleStyle(level: LogLevel): string {
    const styles = {
      debug: 'color: #6B7280; font-weight: normal;',
      info: 'color: #3B82F6; font-weight: normal;',
      warn: 'color: #F59E0B; font-weight: bold;',
      error: 'color: #EF4444; font-weight: bold;',
    };
    return styles[level];
  }

  private async sendToRemoteLogger(entry: LogEntry) {
    try {
      // 这里可以集成远程日志服务
      // 例如：发送到自己的日志 API、Sentry、LogRocket 等

      // 示例：发送到自己的日志 API
      if (entry.level === 'error' || entry.level === 'warn') {
        await fetch('/api/logs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(entry),
        }).catch(() => {
          // 忽略日志发送失败，避免无限循环
        });
      }
    } catch {
      // 静默失败，避免日志记录本身引起错误
    }
  }

  debug(message: string, data?: Record<string, unknown>) {
    this.writeLog(this.formatMessage('debug', message, data));
  }

  info(message: string, data?: Record<string, unknown>) {
    this.writeLog(this.formatMessage('info', message, data));
  }

  warn(message: string, data?: Record<string, unknown>) {
    this.writeLog(this.formatMessage('warn', message, data));
  }

  error(
    message: string,
    error?: Error | unknown,
    data?: Record<string, unknown>,
  ) {
    const entry = this.formatMessage('error', message, data);

    if (error instanceof Error) {
      entry.stack = error.stack;
    } else if (error) {
      entry.data = { ...entry.data, error };
    }

    this.writeLog(entry);
  }

  // API 错误专用方法
  apiError(message: string, error: unknown, context?: Record<string, unknown>) {
    this.error(`API Error: ${message}`, error, {
      context,
      type: 'api_error',
    });
  }

  // 用户操作日志
  userAction(action: string, data?: Record<string, unknown>) {
    this.info(`User Action: ${action}`, {
      ...data,
      type: 'user_action',
    });
  }

  // 性能日志
  performance(metric: string, value: number, unit: string = 'ms') {
    this.info(`Performance: ${metric}`, {
      metric,
      value,
      unit,
      type: 'performance',
    });
  }
}

// 创建全局日志实例
export const logger = new Logger();

// 便捷方法导出
export const log = {
  debug: logger.debug.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),
  apiError: logger.apiError.bind(logger),
  userAction: logger.userAction.bind(logger),
  performance: logger.performance.bind(logger),
};

// 替换原有的 console 方法（可选）
export function replaceConsole() {
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    console.log = (...args) => logger.info(args.join(' '));
    console.warn = (...args) => logger.warn(args.join(' '));
    console.error = (...args) => logger.error(args.join(' '));
  }
}

export default logger;
