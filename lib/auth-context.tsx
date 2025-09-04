'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  email: string;
  name: string | null;
  phoneNumber: string | null;
  isActive: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    name?: string,
    phoneNumber?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  /**
   * 获取当前用户信息，仅在检测到 auth-token 时才请求后端
   */
  const fetchUser = async () => {
    try {
      const response = await fetch('/api/auth/me');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('获取用户信息失败:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  // 登录函数
  const login = async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '登录失败');
    }

    // 设置用户状态
    setUser(data.user);
    console.log('登录成功，用户状态已更新:', data.user);

    // 等待状态更新后再跳转
    setTimeout(() => {
      console.log('跳转');
      router.push('/demo-page');
    }, 100);
  };

  // 注销函数
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
      });
    } catch (error) {
      console.error('注销请求失败:', error);
    }

    setUser(null);
    router.push('/login');
    router.refresh();
  };

  // 注册函数
  const register = async (
    email: string,
    password: string,
    name?: string,
    phoneNumber?: string,
  ) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name, phoneNumber }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || '注册失败');
    }

    // setUser(data.user); // 不自动设置用户状态
    console.log('注册成功:', data.user);

    // 自动填充登录页
    sessionStorage.setItem('autoLoginEmail', email);
    sessionStorage.setItem('autoLoginPassword', password);

    setTimeout(() => {
      router.push('/login'); // 跳转到登录页
    }, 100);
  };

  // 刷新用户信息
  const refreshUser = async () => {
    await fetchUser();
  };

  // 初始化时获取用户信息
  useEffect(() => {
    fetchUser();
  }, []);

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth 必须在 AuthProvider 内使用');
  }
  return context;
}

export function useRequireAuth() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  return { user, loading };
}
