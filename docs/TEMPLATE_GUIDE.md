# 📋 模板使用指南

完整的 Next.js 全栈开发模板使用指南，帮助你快速上手和深度自定义。

## 🚀 快速启动

### 1️⃣ 创建项目

```bash
# 克隆模板
git clone https://github.com/your-username/nextjs-fullstack-template.git my-project
cd my-project

# 安装依赖
npm install
```

### 2️⃣ 配置环境

```bash
# 运行配置向导（推荐）
npm run setup

# 或手动配置
cp env.example .env.local
# 编辑 .env.local 文件
```

### 3️⃣ 数据库初始化

```bash
npm run db:generate  # 生成 Prisma 客户端
npm run db:push      # 创建数据库表
npm run db:seed      # 导入种子数据
```

### 4️⃣ 启动开发

```bash
npm run dev          # 启动开发服务器
# 访问 http://localhost:3000
```

### 5️⃣ 测试账号

- **邮箱**: `test@prisma.io`
- **密码**: `123456`

## 🎨 自定义配置

### 品牌设置

**应用名称和标题**

```typescript
// lib/config.ts
export const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME || 'Your App Name';

export const config = {
  app: {
    name: APP_NAME,
    description: 'Your app description',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://your-domain.com',
  },
  // ...其他配置
};
```

**PWA 配置**

```json
// public/manifest.json
{
  "name": "Your App Name",
  "short_name": "YourApp",
  "description": "Your app description",
  "theme_color": "#your-color",
  "background_color": "#your-bg-color"
}
```

**更新图标**

- 替换 `public/icons/icon-192x192.svg`
- 替换 `public/icons/icon-512x512.svg`
- 替换 `public/favicon.ico`

### 样式主题

**Tailwind 颜色主题**

```css
/* app/globals.css */
:root {
  --primary: 222.2 84% 4.9%; /* 主色调 */
  --primary-foreground: 210 40% 98%;
  --secondary: 210 40% 96%; /* 次要色调 */
  --accent: 210 40% 94%; /* 强调色 */
  /* 自定义你的颜色变量 */
}
```

### 数据模型设计

根据你的业务需求修改 `prisma/schema.prisma`：

```prisma
// 示例：博客应用
model Post {
  id        Int       @id @default(autoincrement())
  title     String
  content   String?   @db.Text
  published Boolean   @default(false)
  authorId  Int
  author    User      @relation(fields: [authorId], references: [id])
  tags      Tag[]     @relation("PostTags")
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([authorId])
  @@index([published])
}

model Tag {
  id    Int    @id @default(autoincrement())
  name  String @unique
  posts Post[] @relation("PostTags")
}

// 扩展用户模型
model User {
  id       Int    @id @default(autoincrement())
  email    String @unique
  name     String?
  avatar   String?
  bio      String?
  posts    Post[] // 添加关系
  // ...现有字段
}
```

然后运行：

```bash
npm run db:push
```

## 🔧 开发指导

### API 路由开发

**创建新的 API 端点**

```typescript
// app/api/posts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth-utils';
import prisma from '@/lib/prisma';
import { z } from 'zod';

const createPostSchema = z.object({
  title: z.string().min(1).max(100),
  content: z.string().optional(),
  published: z.boolean().default(false),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const published = searchParams.get('published') === 'true';

    const posts = await prisma.post.findMany({
      where: published ? { published: true } : {},
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
        tags: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(posts);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch posts' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyToken();
    if (!auth.success) return auth.response;

    const body = await request.json();
    const validatedData = createPostSchema.parse(body);

    const post = await prisma.post.create({
      data: {
        ...validatedData,
        authorId: auth.userId,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 },
      );
    }

    return NextResponse.json(
      { error: 'Failed to create post' },
      { status: 500 },
    );
  }
}
```

### 页面和组件开发

**创建新页面**

```typescript
// app/posts/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth-context';

interface Post {
  id: number;
  title: string;
  content: string;
  published: boolean;
  author: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: string;
}

export default function PostsPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const response = await fetch('/api/posts?published=true');
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Failed to fetch posts:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Posts</h1>
        {user && (
          <Button onClick={() => router.push('/posts/create')}>
            Create Post
          </Button>
        )}
      </div>

      <div className="grid gap-6">
        {posts.map((post) => (
          <Card key={post.id}>
            <CardHeader>
              <CardTitle>{post.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                By {post.author.name} on {new Date(post.createdAt).toLocaleDateString()}
              </p>
            </CardHeader>
            <CardContent>
              <p className="line-clamp-3">{post.content}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### UI 组件添加

**使用 shadcn/ui 添加新组件**

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add form
npx shadcn-ui@latest add dialog
npx shadcn-ui@latest add data-table
```

## 🔧 高级配置

### 环境变量管理

**开发环境** (`.env.local`)

```env
NODE_ENV=development
DATABASE_URL="mysql://root:password@localhost:3306/myapp_dev"
JWT_SECRET="dev-secret-key"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**生产环境** (`.env.production`)

```env
NODE_ENV=production
DATABASE_URL="your-production-database-url"
JWT_SECRET="super-strong-production-secret"
NEXT_PUBLIC_APP_URL="https://your-domain.com"
```

### 数据库配置

**本地开发 - Docker MySQL**

```bash
# 启动 MySQL 容器
docker run --name mysql-dev \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=myapp_dev \
  -p 3306:3306 \
  -d mysql:8.0
```

**生产部署 - PlanetScale**

```env
DATABASE_URL="mysql://username:password@host:3306/database?sslaccept=strict"
```

### 邮件服务配置

**Gmail SMTP**

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"  # 使用应用专用密码
```

**SendGrid**

```env
SMTP_HOST="smtp.sendgrid.net"
SMTP_PORT="587"
SMTP_USER="apikey"
SMTP_PASSWORD="your-sendgrid-api-key"
```

### 文件上传配置

**阿里云 OSS**

```env
OSS_REGION="oss-cn-hangzhou"
OSS_ACCESS_KEY_ID="your-access-key-id"
OSS_ACCESS_KEY_SECRET="your-access-key-secret"
OSS_BUCKET="your-bucket-name"
OSS_ENDPOINT="https://oss-cn-hangzhou.aliyuncs.com"
```

## 📦 部署指南

### Vercel 部署（推荐）

1. **连接 GitHub**
   - 登录 Vercel
   - 导入你的 GitHub 仓库

2. **配置环境变量**

   ```
   DATABASE_URL=your-production-database-url
   JWT_SECRET=your-super-secret-jwt-key
   NEXT_PUBLIC_APP_NAME=Your App Name
   NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
   ```

3. **自动部署**
   - 推送到 main 分支自动部署
   - 预览部署支持 PR

### 手动部署

```bash
# 构建生产版本
npm run build

# 启动生产服务器
npm start
```

## 🧪 测试策略

### 单元测试

```typescript
// __tests__/lib/utils.test.ts
import { cn } from '@/lib/utils';

describe('cn utility', () => {
  it('should merge class names correctly', () => {
    expect(cn('class1', 'class2')).toBe('class1 class2');
  });
});
```

### API 测试

```typescript
// __tests__/api/posts.test.ts
import { POST } from '@/app/api/posts/route';
import { NextRequest } from 'next/server';

describe('/api/posts', () => {
  it('should create a new post', async () => {
    const request = new NextRequest('http://localhost/api/posts', {
      method: 'POST',
      body: JSON.stringify({
        title: 'Test Post',
        content: 'Test content',
      }),
    });

    const response = await POST(request);
    expect(response.status).toBe(201);
  });
});
```

### 组件测试

```typescript
// __tests__/components/post-form.test.tsx
import { render, screen } from '@testing-library/react';
import { PostForm } from '@/components/post-form';

describe('PostForm', () => {
  it('should render form fields', () => {
    render(<PostForm onSubmit={jest.fn()} />);

    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByLabelText('Content')).toBeInTheDocument();
  });
});
```

## 🔍 性能优化

### 图片优化

```typescript
import Image from 'next/image';

// 使用 Next.js Image 组件
<Image
  src="/hero.jpg"
  alt="Hero image"
  width={800}
  height={400}
  priority
  placeholder="blur"
  blurDataURL="data:image/jpeg;base64,..."
/>
```

### 懒加载

```typescript
import dynamic from 'next/dynamic';

// 动态导入重型组件
const Chart = dynamic(() => import('@/components/chart'), {
  loading: () => <p>Loading chart...</p>,
  ssr: false,
});
```

### 数据库优化

```typescript
// 使用 Prisma 查询优化
const posts = await prisma.post.findMany({
  select: {
    id: true,
    title: true,
    // 只选择需要的字段
  },
  where: {
    published: true,
  },
  orderBy: {
    createdAt: 'desc',
  },
  take: 10, // 分页
  skip: page * 10,
});
```

## 🔐 安全最佳实践

### 环境变量安全

- 生产环境使用强密码
- 定期轮换 JWT 密钥
- 不要在客户端暴露敏感信息

### 输入验证

- 所有 API 端点使用 Zod 验证
- 防止 SQL 注入（Prisma 自动处理）
- XSS 防护（React 自动转义）

### 认证安全

- JWT 使用 HTTP-only cookies
- 实现会话过期机制
- 添加速率限制

## 📚 学习资源

### 官方文档

- [Next.js 文档](https://nextjs.org/docs)
- [Prisma 文档](https://www.prisma.io/docs)
- [shadcn/ui 文档](https://ui.shadcn.com)
- [Tailwind CSS 文档](https://tailwindcss.com/docs)

### 最佳实践

- [Next.js 最佳实践](https://nextjs.org/docs/app/building-your-application)
- [React 设计模式](https://react.dev/learn)
- [TypeScript 指南](https://www.typescriptlang.org/docs)

---

🎉 **恭喜！** 你现在已经掌握了模板的核心用法。开始构建你的应用吧！

有问题？查看其他文档或提交 GitHub Issue。
