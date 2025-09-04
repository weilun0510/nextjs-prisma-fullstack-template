import { z } from 'zod';

// 通用验证规则
export const emailSchema = z
  .string()
  .min(1, '邮箱是必填项')
  .email('请输入有效的邮箱地址');

export const passwordSchema = z
  .string()
  .min(6, '密码长度至少为6位')
  .max(100, '密码长度不能超过100位');

export const nameSchema = z
  .string()
  .min(1, '姓名不能为空')
  .max(50, '姓名长度不能超过50位')
  .optional();

export const phoneSchema = z
  .string()
  .regex(/^1[3-9]\d{9}$/, '请输入有效的手机号码')
  .optional()
  .or(z.literal(''));

// 登录表单Schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, '密码是必填项'),
});

// 注册表单Schema
export const registerSchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
    name: nameSchema,
    phoneNumber: phoneSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  });

// 忘记密码表单Schema
export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

// 重置密码表单Schema
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: passwordSchema,
    token: z.string().min(1, 'Token不能为空'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  });

// 文件上传Schema
export const uploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 10 * 1024 * 1024, '文件大小不能超过10MB')
    .refine(
      (file) =>
        ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(
          file.type,
        ),
      '只支持 JPEG、PNG、WebP、GIF 格式的图片',
    ),
});

// 类型导出
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;
export type UploadFormData = z.infer<typeof uploadSchema>;
