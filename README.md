# 🚀 Next.js 全栈开发模板

一个现代化的 Next.js 15 全栈开发模板，集成了最佳实践和企业级功能。

## ✨ 特性

### 🏗️ 技术栈

- **前端**: Next.js 15 + React 19 + TypeScript
- **UI**: shadcn/ui + Tailwind CSS + Lucide Icons
- **后端**: Next.js API Routes
- **数据库**: MySQL + Prisma ORM
- **认证**: JWT + HTTP-only Cookies
- **表单**: React Hook Form + Zod 验证
- **样式**: Tailwind CSS + CSS Variables
- **PWA**: Service Worker + Web App Manifest

### 🔧 开发体验

- ✅ TypeScript 类型安全
- ✅ ESLint + Prettier 代码规范
- ✅ 统一的表单验证系统
- ✅ 全局错误处理边界
- ✅ 结构化日志系统
- ✅ 热重载开发环境

### 🛡️ 企业级功能

- ✅ JWT 认证系统
- ✅ 用户注册/登录/密码重置
- ✅ 文件上传（支持阿里云 OSS）
- ✅ 错误监控和日志收集
- ✅ 权限中间件保护
- ✅ PWA 支持

## 🚀 快速开始

### 1. 克隆模板

```bash
git clone https://github.com/your-username/nextjs-fullstack-template.git my-project
cd my-project
```

### 2. 安装依赖

```bash
npm install
```

### 3. 环境配置

```bash
cp env.example .env
```

编辑 `.env` 文件，配置必要的环境变量：

```env
# 数据库
DATABASE_URL="mysql://username:password@localhost:3306/your_db"

# JWT 密钥
JWT_SECRET="your-super-secret-jwt-key"

# 邮件服务（可选）
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"

# 应用配置
NEXT_PUBLIC_APP_NAME="Your App Name"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. 数据库设置

```bash
# 生成 Prisma 客户端
npm run db:generate

# 推送数据库架构
npm run db:push

# 初始化种子数据
npm run db:seed
```

### 5. 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 📚 项目结构

```
your-app/
├── app/                      # Next.js 15 App Router
│   ├── api/                  # API 路由
│   │   ├── auth/            # 认证相关 API
│   │   ├── logs/            # 日志收集 API
│   │   └── upload/          # 文件上传 API
│   ├── (auth)/              # 认证页面组
│   │   ├── login/
│   │   ├── register/
│   │   ├── forgot-password/
│   │   └── reset-password/
│   ├── demo-page/           # 功能演示页面
│   ├── globals.css          # 全局样式
│   ├── layout.tsx           # 根布局
│   └── page.tsx             # 首页
├── components/              # React 组件
│   ├── ui/                  # shadcn/ui 基础组件
│   ├── login-form/          # 登录表单组件
│   ├── error-boundary.tsx   # 错误边界组件
│   ├── pwa-install-prompt.tsx
│   └── sw-register.tsx
├── lib/                     # 工具库和配置
│   ├── auth-context.tsx     # 认证上下文
│   ├── auth-utils.ts        # 认证工具函数
│   ├── config.ts            # 应用配置
│   ├── logger.ts            # 日志系统
│   ├── prisma.ts            # Prisma 客户端
│   ├── schemas.ts           # Zod 验证规则
│   └── utils.ts             # 通用工具函数
├── prisma/                  # 数据库相关
│   ├── schema.prisma        # 数据库模型
│   └── seed.ts              # 种子数据
├── public/                  # 静态资源
│   ├── icons/               # PWA 图标
│   ├── manifest.json        # Web App Manifest
│   └── sw.js                # Service Worker
└── hooks/                   # 自定义 React Hooks
    └── use-toast.ts
```

## 🔧 核心功能

### 认证系统

```typescript
// 使用认证 Hook
import { useAuth } from '@/lib/auth-context';

function MyComponent() {
  const { user, login, logout, register } = useAuth();

  // 登录
  await login('email@example.com', 'password');

  // 注册
  await register('email@example.com', 'password', 'John Doe');

  // 登出
  await logout();
}
```

### 表单验证

```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginFormData } from '@/lib/schemas';

function LoginForm() {
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (data: LoginFormData) => {
    // 类型安全的表单数据
    console.log(data.email, data.password);
  };
}
```

### 日志记录

```typescript
import { log } from '@/lib/logger';

// 不同级别的日志
log.debug('调试信息');
log.info('用户登录', { userId: 123 });
log.warn('警告信息');
log.error('错误信息', error);

// 专用日志方法
log.userAction('点击按钮', { buttonId: 'submit' });
log.apiError('API 调用失败', error, { endpoint: '/api/users' });
log.performance('页面加载时间', 1200, 'ms');
```

### 错误处理

```typescript
import { useErrorHandler } from '@/components/error-boundary';

function MyComponent() {
  const throwError = useErrorHandler();

  const handleError = () => {
    // 触发全局错误边界
    throwError(new Error('Something went wrong'));
  };
}
```

## 🎨 自定义配置

### 1. 应用名称和品牌

编辑 `lib/config.ts`:

```typescript
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Your App Name';
```

### 2. 数据库模型

编辑 `prisma/schema.prisma` 添加你的数据模型：

```prisma
model Post {
  id        Int      @id @default(autoincrement())
  title     String
  content   String?
  published Boolean  @default(false)
  authorId  Int
  author    User     @relation(fields: [authorId], references: [id])
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### 3. API 路由

在 `app/api/` 下创建新的 API 路由：

```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const auth = await verifyToken();
  if (!auth.success) return auth.response;

  const posts = await prisma.post.findMany();
  return NextResponse.json(posts);
}
```

### 4. UI 组件

使用 shadcn/ui 添加新组件：

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add form
npx shadcn-ui@latest add dialog
```

## 📦 部署

### Vercel (推荐)

1. 连接你的 GitHub 仓库到 Vercel
2. 配置环境变量
3. 自动部署

### 手动部署

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 🛠️ 开发脚本

```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 代码检查
npm run format       # 代码格式化
npm run type-check   # 类型检查
npm run db:generate  # 生成 Prisma 客户端
npm run db:push      # 推送数据库变更
npm run db:studio    # 打开 Prisma Studio
npm run db:seed      # 运行种子数据
```

## 📝 待办事项

使用此模板创建新项目时，记得：

- [ ] 更新 `package.json` 中的项目信息
- [ ] 修改 `lib/config.ts` 中的应用名称
- [ ] 配置 `.env` 环境变量
- [ ] 自定义 `prisma/schema.prisma` 数据模型
- [ ] 更新 PWA 图标 (`public/icons/`)
- [ ] 配置邮件服务

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

[MIT License](LICENSE)

---

## 🎉 测试账号

完成数据库初始化后，可以使用以下测试账号：

- **邮箱**: `test@prisma.io`
- **密码**: `123456`

---

⭐ 如果这个模板对你有帮助，请给个 star！
