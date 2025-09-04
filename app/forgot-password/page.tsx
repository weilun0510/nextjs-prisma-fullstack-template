'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Mail, KeyRound } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.error || '发送失败，请稍后再试');
      }
    } catch {
      setError('发送失败，请检查网络或稍后再试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-container flex flex-col items-center justify-center py-12 min-h-[80vh] bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="mx-auto w-full max-w-md">
        <Card className="shadow-xl border-0">
          <CardHeader className="text-center pb-2">
            <div className="flex flex-col items-center gap-2 mb-2">
              <KeyRound className="h-10 w-10 text-blue-600" />
              <CardTitle className="text-2xl font-bold">找回密码</CardTitle>
            </div>
            <p className="text-gray-500 text-sm mb-2">
              请输入您注册时使用的邮箱，我们会发送重置密码链接到您的邮箱。
            </p>
          </CardHeader>
          <hr className="my-2 border-gray-200" />
          <CardContent>
            {success ? (
              <Alert className="mb-6 bg-green-50 border-green-200">
                <Mail className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  如果该邮箱已注册，我们已发送重置密码邮件，请查收。
                </AlertDescription>
              </Alert>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div>
                  <Input
                    type="email"
                    placeholder="请输入注册邮箱"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isSubmitting}
                    className="h-12 text-base"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full h-12 text-base"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? '发送中...' : '发送重置邮件'}
                </Button>
              </form>
            )}
            <div className="mt-8 text-center text-xs text-gray-400">
              <span>如有疑问请联系管理员或客服邮箱</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
