/**
 * 应用配置
 */
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'AppName';

export const config = {
  // 应用信息
  app: {
    name: APP_NAME,
    description: APP_NAME,
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },

  // 邮件配置
  email: {
    from: {
      email: process.env.SMTP_USER || '13566106399@163.com',
      name: process.env.FROM_NAME || APP_NAME,
    },
  },

  // 阿里云OSS配置
  oss: {
    region: process.env.OSS_REGION || '',
    accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
    bucket: process.env.OSS_BUCKET || '',
    endpoint: process.env.OSS_ENDPOINT || '',
  },
} as const;
