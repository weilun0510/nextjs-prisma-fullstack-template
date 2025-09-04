'use client';
import { Suspense } from 'react';
import ResetPasswordForm from './reset-password-form';

// 加载中的回退组件
function ResetPasswordFallback() {
  return (
    <div className="page-container flex flex-col items-center justify-center py-12">
      <div className="mx-auto w-full max-w-md">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
