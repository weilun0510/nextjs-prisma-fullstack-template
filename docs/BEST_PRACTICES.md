# 🎯 最佳实践指南

使用此 Next.js 全栈模板的代码质量和开发规范指南。

## 📁 项目结构规范

### 组件组织

```
components/
├── ui/                 # shadcn/ui 基础组件
├── layout/             # 布局相关组件
├── features/           # 功能特定组件
│   ├── auth/
│   ├── dashboard/
│   └── posts/
└── shared/             # 共享组件
```

**命名规范：**

- 组件文件：PascalCase（如 `UserProfile.tsx`）
- 目录：kebab-case（如 `user-profile/`）
- 索引文件：`index.tsx`

### API 路由组织

```
app/api/
├── auth/               # 认证相关
├── users/              # 用户管理
│   ├── route.ts        # GET /api/users, POST /api/users
│   └── [id]/
│       ├── route.ts    # GET /api/users/[id], PUT /api/users/[id]
│       └── posts/
│           └── route.ts # GET /api/users/[id]/posts
└── posts/              # 文章管理
```

### 页面组织

```
app/
├── (auth)/             # 认证页面组
├── (dashboard)/        # 仪表板页面组
└── (public)/           # 公开页面组
```

## 🔧 代码质量

### TypeScript 配置

```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "exactOptionalPropertyTypes": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### 类型定义组织

```typescript
// types/index.ts
export interface User {
  id: number;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export type UserRole = 'admin' | 'user' | 'moderator';

// API 响应类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
```

## 🎨 组件设计模式

### 复合组件模式

```typescript
// components/card/index.tsx
export const Card = {
  Root: CardRoot,
  Header: CardHeader,
  Content: CardContent,
  Footer: CardFooter,
};

// 使用方式
<Card.Root>
  <Card.Header>
    <Card.Title>标题</Card.Title>
  </Card.Header>
  <Card.Content>内容</Card.Content>
</Card.Root>
```

### 自定义 Hooks

```typescript
// hooks/use-api.ts
export function useApi<T>(url: string, options?: RequestInit) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }, [url, options]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}
```

## 🎨 样式和设计

### Tailwind CSS 最佳实践

**组件样式抽取：**

```typescript
// lib/styles.ts
import { type VariantProps, cva } from 'class-variance-authority';

export const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-input hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);
```

**响应式设计：**

```tsx
// 移动优先设计
<div
  className="
  grid grid-cols-1 gap-4
  sm:grid-cols-2 sm:gap-6
  md:grid-cols-3 md:gap-8
  lg:grid-cols-4
  xl:grid-cols-5
"
>
  {items.map((item) => (
    <Card key={item.id} />
  ))}
</div>
```

## 📝 表单处理

### 表单验证架构

```typescript
// schemas/user.ts
export const userProfileSchema = z.object({
  personal: z.object({
    firstName: z.string().min(1, '名字是必填项'),
    lastName: z.string().min(1, '姓氏是必填项'),
    avatar: z.string().url('请提供有效的头像URL').optional(),
  }),
  contact: z.object({
    email: z.string().email('邮箱格式不正确'),
    phone: z
      .string()
      .regex(/^1[3-9]\d{9}$/, '手机号格式不正确')
      .optional(),
  }),
  preferences: z.object({
    newsletter: z.boolean().default(false),
    notifications: z.boolean().default(true),
    theme: z.enum(['light', 'dark', 'system']).default('system'),
  }),
});

export type UserProfileFormData = z.infer<typeof userProfileSchema>;
```

### 表单状态持久化

```typescript
// hooks/use-form-persist.ts
export function useFormPersist<T>(key: string, form: UseFormReturn<T>) {
  const { watch, reset } = form;

  // 监听表单变化并保存到 localStorage
  useEffect(() => {
    const subscription = watch((data) => {
      localStorage.setItem(key, JSON.stringify(data));
    });

    return () => subscription.unsubscribe();
  }, [watch, key]);

  // 组件挂载时恢复表单数据
  useEffect(() => {
    const savedData = localStorage.getItem(key);
    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        reset(parsedData);
      } catch (error) {
        console.error('Failed to restore form data:', error);
      }
    }
  }, [key, reset]);

  const clearSaved = useCallback(() => {
    localStorage.removeItem(key);
  }, [key]);

  return { clearSaved };
}
```

## 🗄️ 数据管理

### Prisma 最佳实践

**查询优化：**

```typescript
// lib/queries/user.ts
export async function getUserWithPosts(userId: number) {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      posts: {
        select: {
          id: true,
          title: true,
          published: true,
          createdAt: true,
        },
        where: {
          published: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 10,
      },
      _count: {
        select: {
          posts: true,
          followers: true,
        },
      },
    },
  });
}
```

**事务处理：**

```typescript
// lib/services/user.ts
export async function createUserWithProfile(userData: CreateUserData) {
  return await prisma.$transaction(async (tx) => {
    // 创建用户
    const user = await tx.user.create({
      data: {
        email: userData.email,
        name: userData.name,
        password: await hashPassword(userData.password),
      },
    });

    // 创建用户配置
    await tx.userProfile.create({
      data: {
        userId: user.id,
        bio: '',
        avatar: '',
      },
    });

    return user;
  });
}
```

## 🔒 安全最佳实践

### 输入验证

```typescript
// lib/middleware/validation.ts
export function validateRequest<T>(schema: z.ZodSchema<T>) {
  return async (request: NextRequest) => {
    try {
      const body = await request.json();
      const validatedData = schema.parse(body);
      return { success: true, data: validatedData };
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          success: false,
          error: 'Validation failed',
          details: error.errors,
        };
      }
      throw error;
    }
  };
}
```

### 权限控制

```typescript
// lib/auth/permissions.ts
export const permissions = {
  users: {
    read: ['admin', 'moderator', 'user'],
    create: ['admin'],
    update: ['admin', 'moderator'],
    delete: ['admin'],
  },
  posts: {
    read: ['admin', 'moderator', 'user', 'guest'],
    create: ['admin', 'moderator', 'user'],
    update: ['admin', 'moderator'],
    delete: ['admin'],
  },
} as const;

export function hasPermission(
  userRole: UserRole,
  resource: keyof typeof permissions,
  action: string,
): boolean {
  const resourcePermissions = permissions[resource];
  if (!resourcePermissions) return false;

  const allowedRoles =
    resourcePermissions[action as keyof typeof resourcePermissions];
  return allowedRoles?.includes(userRole) ?? false;
}
```

## 🚀 性能优化

### React 组件优化

```typescript
// components/user-card.tsx
interface UserCardProps {
  user: User;
  onEdit?: (user: User) => void;
}

export const UserCard = React.memo<UserCardProps>(({ user, onEdit }) => {
  const handleEdit = useCallback(() => {
    onEdit?.(user);
  }, [onEdit, user]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{user.name}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{user.email}</p>
        {onEdit && (
          <Button onClick={handleEdit}>Edit</Button>
        )}
      </CardContent>
    </Card>
  );
});
```

### 图片优化

```typescript
// components/responsive-image.tsx
interface ResponsiveImageProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  sizes?: string;
  priority?: boolean;
}

export function ResponsiveImage({
  src,
  alt,
  width,
  height,
  sizes = "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw",
  priority = false,
}: ResponsiveImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      priority={priority}
      placeholder="blur"
      blurDataURL="data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD..."
      className="object-cover"
    />
  );
}
```

### 代码分割

```typescript
// app/dashboard/page.tsx
import dynamic from 'next/dynamic';

const Charts = dynamic(() => import('@/components/charts'), {
  loading: () => <ChartsSkeleton />,
  ssr: false,
});

const DataTable = dynamic(() => import('@/components/data-table'), {
  loading: () => <TableSkeleton />,
});

export default function DashboardPage() {
  return (
    <div className="space-y-8">
      <Charts />
      <DataTable />
    </div>
  );
}
```

## 🧪 测试策略

### 测试工具配置

```typescript
// __tests__/utils/test-utils.tsx
import { render } from '@testing-library/react';
import { AuthProvider } from '@/lib/auth-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

function TestProviders({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {children}
      </AuthProvider>
    </QueryClientProvider>
  );
}

export function renderWithProviders(ui: React.ReactElement) {
  return render(ui, { wrapper: TestProviders });
}

export * from '@testing-library/react';
```

### API 集成测试

```typescript
// __tests__/api/users.test.ts
import { createMocks } from 'node-mocks-http';
import { GET, POST } from '@/app/api/users/route';

describe('/api/users', () => {
  beforeEach(() => {
    // 清理数据库或重置 mocks
  });

  describe('GET /api/users', () => {
    it('should return paginated users', async () => {
      const { req } = createMocks({
        method: 'GET',
        query: { page: '1', limit: '10' },
      });

      const response = await GET(req as any);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty('users');
      expect(data).toHaveProperty('pagination');
    });
  });
});
```

## 📚 错误处理

### 统一错误处理

```typescript
// lib/errors.ts
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = 'INTERNAL_ERROR',
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    public details?: any,
  ) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

// 全局错误处理器
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: error.message,
        code: error.code,
        ...(error instanceof ValidationError && { details: error.details }),
      },
      { status: error.statusCode },
    );
  }

  console.error('Unhandled error:', error);

  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}
```

### JSDoc 注释规范

````typescript
/**
 * 用户服务类，提供用户相关的业务逻辑
 * @example
 * ```typescript
 * const userService = new UserService();
 * const user = await userService.createUser({
 *   email: 'test@example.com',
 *   name: 'Test User'
 * });
 * ```
 */
export class UserService {
  /**
   * 创建新用户
   * @param userData - 用户数据
   * @param userData.email - 用户邮箱
   * @param userData.name - 用户姓名
   * @returns Promise<User> 创建的用户对象
   * @throws {ValidationError} 当输入数据无效时
   * @throws {ConflictError} 当邮箱已存在时
   */
  async createUser(userData: CreateUserData): Promise<User> {
    // 实现逻辑
  }
}
````

---

🎯 这些最佳实践将帮助你构建高质量、可维护的应用程序。根据项目需求灵活应用这些模式和规范。
