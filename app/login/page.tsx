import { LoginForm } from '@/components/login-form';
import { APP_NAME } from '@/lib/config';

export default function LoginPage() {
  return (
    <div className="page-container">
      <div className="flex  flex-col items-center justify-center py-12">
        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              {APP_NAME}
            </h1>
            <p className="mt-2 text-sm text-gray-600">{APP_NAME}</p>
          </div>
          <LoginForm />
        </div>
      </div>
    </div>
  );
}
