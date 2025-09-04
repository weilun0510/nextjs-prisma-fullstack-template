'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from '@/lib/auth-context';
import { log } from '@/lib/logger';
import { useErrorHandler } from '@/components/error-boundary';
import { toast } from '@/hooks/use-toast';
import { AlertCircle, CheckCircle, Bug } from 'lucide-react';

// 演示表单Schema
const demoSchema = z.object({
  email: z.string().min(1, '邮箱是必填项').email('请输入有效的邮箱地址'),
  message: z
    .string()
    .min(10, '消息至少10个字符')
    .max(500, '消息不能超过500个字符'),
});

type DemoFormData = z.infer<typeof demoSchema>;

export default function DemoPage() {
  const { user, logout } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const throwError = useErrorHandler();

  const form = useForm<DemoFormData>({
    resolver: zodResolver(demoSchema),
    defaultValues: {
      email: user?.email || '',
      message: '',
    },
  });

  const handleDemoSubmit = async (data: DemoFormData) => {
    setIsSubmitting(true);

    try {
      log.userAction('演示表单提交', { email: data.email });

      // 模拟API调用
      await new Promise((resolve) => setTimeout(resolve, 1000));

      toast({
        title: '提交成功！',
        description: '演示表单已成功提交',
      });

      form.reset();
    } catch (error) {
      log.error('演示表单提交失败', error);
      toast({
        title: '提交失败',
        description: '请稍后重试',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleTestError = () => {
    log.warn('用户触发了测试错误');
    throwError(new Error('这是一个测试错误，用于演示错误边界功能'));
  };

  const handleTestLog = () => {
    log.debug('这是一个调试日志');
    log.info('这是一个信息日志');
    log.warn('这是一个警告日志');
    log.error('这是一个错误日志');
    log.performance('页面加载时间', 1500, 'ms');

    toast({
      title: '日志测试完成',
      description: '请查看浏览器控制台查看日志输出',
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold">演示页面</h1>
        <p className="text-muted-foreground mt-2">
          展示新的表单验证和错误处理功能
        </p>
      </div>

      {/* 用户信息 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            用户信息
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p>
              <strong>ID:</strong> {user?.id}
            </p>
            <p>
              <strong>邮箱:</strong> {user?.email}
            </p>
            <p>
              <strong>姓名:</strong> {user?.name || '未设置'}
            </p>
            <p>
              <strong>手机:</strong> {user?.phoneNumber || '未设置'}
            </p>
          </div>
          <Button onClick={logout} variant="outline" className="mt-4">
            退出登录
          </Button>
        </CardContent>
      </Card>

      {/* 表单验证演示 */}
      <Card>
        <CardHeader>
          <CardTitle>React Hook Form + Zod 验证演示</CardTitle>
          <CardDescription>
            使用 React Hook Form 和 Zod 进行表单验证
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleDemoSubmit)}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>邮箱地址</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="输入邮箱地址"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>消息内容</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="输入消息内容（10-500字符）"
                        {...field}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? '提交中...' : '提交演示表单'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* 错误处理和日志演示 */}
      <Card>
        <CardHeader>
          <CardTitle>错误处理和日志系统演示</CardTitle>
          <CardDescription>测试错误边界和日志记录功能</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              点击下方按钮测试不同的功能，注意观察控制台输出和错误处理
            </AlertDescription>
          </Alert>

          <div className="flex gap-4">
            <Button onClick={handleTestLog} variant="outline">
              测试日志记录
            </Button>
            <Button onClick={handleTestError} variant="destructive">
              <Bug className="mr-2 h-4 w-4" />
              触发错误边界
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
