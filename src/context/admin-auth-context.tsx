'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { buildSuperAdminSessionUser, buildMemberSessionUser } from '@/lib/team-constants';
import { TeamMember } from '@/types/advanced';

export interface AdminUser {
  id?: string;
  username: string;
  name: string;
  role: string;
  mobile?: string;
  jobTitle?: string;
  allowedTabs?: string[];
  requireCaseCode?: boolean;
  canEditWorkingHours?: boolean;
  isSuperAdmin?: boolean;
  consultantId?: string;
  assignedConsultantIds?: string[];
  allowedTopics?: string[];
}

interface AdminAuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  currentUser: AdminUser | null;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
}

const LOCAL_STORAGE_KEY = 'belhagh_admin_auth_user';
const COOKIE_NAME = 'belhagh_admin_session';

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  // بررسی وضعیت لاگین در بارگذاری اولیه
  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      let storedUser: string | null = null;
      try {
        storedUser = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedUser) {
          const user: AdminUser = JSON.parse(storedUser);
          if (user && user.username) {
            if (isMounted) {
              setCurrentUser(user);
              setIsAuthenticated(true);
            }
          }
        }

        // استعلام از سرور جهت به‌روزرسانی سطوح دسترسی
        const res = await fetch('/api/auth/session', { cache: 'no-store' });
        const data = await res.json();

        if (isMounted) {
          if (data?.authenticated && data?.user) {
            setCurrentUser(data.user);
            setIsAuthenticated(true);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(data.user));
          } else if (res.ok && data?.authenticated === false) {
            localStorage.removeItem(LOCAL_STORAGE_KEY);
            setCurrentUser(null);
            setIsAuthenticated(false);
          } else if (!storedUser) {
            setCurrentUser(null);
            setIsAuthenticated(false);
          }
        }
      } catch {
        // در صورت خطای شبکه از اطلاعات محلی استفاده می‌شود
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    checkSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (
    username: string,
    password: string,
    rememberMe: boolean = true
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanUsername = username.trim();

    if (!cleanUsername || !password) {
      return { success: false, error: 'لطفاً نام کاربری (شماره تلفن) و رمز عبور را وارد نمایید.' };
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: cleanUsername, password, rememberMe }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          error: data.error || 'نام کاربری (شماره تلفن) یا رمز عبور اشتباه است.',
        };
      }

      const user: AdminUser = data.user;

      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
      setCurrentUser(user);
      setIsAuthenticated(true);
      return { success: true };
    } catch {
      // پشتیبان آفلاین در صورت اختلال شبکه
      if (cleanUsername === 'admin' && password === 'belhagh@12345') {
        const user: AdminUser = buildSuperAdminSessionUser();
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
        document.cookie = `${COOKIE_NAME}=${encodeURIComponent(btoa('admin:' + Date.now()))}; path=/; max-age=2592000; SameSite=Lax`;
        setCurrentUser(user);
        setIsAuthenticated(true);
        return { success: true };
      }

      // بررسی در اعضای ذخیره شده در localStorage
      try {
        const localTeamStr = localStorage.getItem('formafzar_team_members');
        if (localTeamStr) {
          const members: TeamMember[] = JSON.parse(localTeamStr);
          const cleanPhone = cleanUsername.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, '');
          const found = members.find((m) => {
            const mPhone = (m.mobile || '').replace(/[^0-9]/g, '');
            return (mPhone === cleanPhone || m.username === cleanUsername) && m.password === password;
          });

          if (found) {
            if (found.status === 'suspended') {
              return { success: false, error: 'حساب کاربری شما معلق شده است.' };
            }
            const user: AdminUser = buildMemberSessionUser(found);
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(user));
            document.cookie = `${COOKIE_NAME}=${encodeURIComponent(btoa('member:' + found.id + ':' + Date.now()))}; path=/; max-age=2592000; SameSite=Lax`;
            setCurrentUser(user);
            setIsAuthenticated(true);
            return { success: true };
          }
        }
      } catch {}

      return {
        success: false,
        error: 'خطا در برقراری ارتباط یا نام کاربری و رمز عبور اشتباه است.',
      };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {}

    localStorage.removeItem(LOCAL_STORAGE_KEY);
    document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        currentUser,
        login,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
};

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
