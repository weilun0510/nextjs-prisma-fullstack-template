import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { AuthProvider } from '@/lib/auth-context';
import ErrorBoundary from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import './globals.css';
import { config } from '@/lib/config';
import SWRegister from '@/components/sw-register';
import PWAInstallPrompt from '@/components/pwa-install-prompt';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: config.app.name,
  description: config.app.description,
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ErrorBoundary>
          <AuthProvider>
            {children}

            {/* Toast 通知组件 */}
            <Toaster />
          </AuthProvider>
        </ErrorBoundary>

        {/* 注册服务端推送 */}
        <SWRegister />

        {/* 注册PWA安装提示 */}
        <PWAInstallPrompt />
      </body>
    </html>
  );
}
