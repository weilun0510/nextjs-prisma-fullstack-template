import { APP_NAME } from '@/lib/config';
import Link from 'next/link';

export default async function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center -mt-16">
      <h1 className="text-4xl font-bold mb-8 font-[family-name:var(--font-geist-sans)] text-[#333333]">
        {APP_NAME}
      </h1>
      <Link href="/login">登录</Link>
    </div>
  );
}
