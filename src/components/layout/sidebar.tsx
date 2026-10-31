'use client';

import React from 'react';
import { 
  LayoutDashboard, 
  PenTool, 
  Inbox, 
  BarChart3, 
  Settings, 
  Sparkles, 
  Eye, 
  FileCheck, 
  FolderKanban, 
  X,
  LogOut
} from 'lucide-react';
import { useForm } from '@/context/form-context';
import { useAdminAuth } from '@/context/admin-auth-context';
import { toPersianDigits } from '@/lib/persian';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  currentTab, 
  setCurrentTab,
  isOpenMobile = false,
  onCloseMobile
}) => {
  const { forms, submissions, activeForm } = useForm();
  const { logout } = useAdminAuth();

  const totalSubmissions = submissions.length;

  const navItems = [
    {
      id: 'dashboard',
      label: 'داشبورد مدیریت',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'forms',
      label: 'فرم‌های من',
      icon: FolderKanban,
      badge: toPersianDigits(forms.length),
    },
    {
      id: 'builder',
      label: 'استودیو طراحی فرم',
      icon: PenTool,
      badge: activeForm ? 'فعال' : null,
      highlight: true,
    },
    {
      id: 'runner',
      label: 'پیش‌نمایش فرم زنده',
      icon: Eye,
      badge: null,
    },
    {
      id: 'submissions',
      label: 'بانک ارسالی‌ها و کارتابل',
      icon: Inbox,
      badge: toPersianDigits(totalSubmissions),
    },
    {
      id: 'media',
      label: 'مرکز اسناد و فایل‌های پیوست',
      icon: FileCheck,
      badge: null,
    },
    {
      id: 'chat',
      label: 'گفتگوی آنلاین با کاربران',
      icon: Sparkles,
      badge: 'زنده',
    },
    {
      id: 'analytics',
      label: 'تحلیل آماری و نمودارها',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'templates',
      label: 'قالب‌های آماده آماده',
      icon: Sparkles,
      badge: '۴ قالب',
    },
    {
      id: 'settings',
      label: 'تنظیمات و وب‌هوک‌ها',
      icon: Settings,
      badge: null,
    },
  ];

  const handleSelectTab = (tabId: string) => {
    setCurrentTab(tabId);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navContent = (
    <div className="flex flex-col justify-between h-full space-y-6">
      <div className="space-y-4 sm:space-y-6">
        
        {/* فرم در حال ویرایش */}
        {activeForm && (
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <div className="text-[11px] font-medium text-slate-500 mb-1 flex items-center justify-between">
              <span>فرم انتخابی</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="text-xs font-bold text-slate-900 truncate" title={activeForm.title}>
              {activeForm.title}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1.5">
              <span>{toPersianDigits(activeForm.fields.length)} فیلد</span>
              <span>•</span>
              <span>{activeForm.mode === 'wizard' ? 'مرحله‌ای' : 'کلاسیک'}</span>
            </div>
          </div>
        )}

        {/* منوهای ناوبری */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-slate-900 text-white font-semibold shadow-sm'
                    : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100 active:bg-slate-200'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                      isActive
                        ? 'bg-slate-800 text-blue-300'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* وضعیت حافظه و زیرساخت */}
      <div className="p-3 rounded-lg border border-slate-200/70 bg-slate-50/50 text-[11px] space-y-2">
        <div className="flex items-center justify-between text-slate-600">
          <span>فضای ابری مصرفی</span>
          <span className="font-semibold text-slate-900">۱.۲ از ۵۰ گیگابایت</span>
        </div>
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div className="bg-blue-600 h-full w-[24%]" />
        </div>
        <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
          <span>سرور شاپرک: فعال</span>
          <span className="text-emerald-600 font-medium">پایدار ۱۰۰٪</span>
        </div>
      </div>

      {/* دکمه خروج سریع از پنل مدیریت */}
      <button
        onClick={async () => {
          if (onCloseMobile) onCloseMobile();
          await logout();
        }}
        className="w-full mt-2 py-2 px-3 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors flex items-center justify-center gap-2 cursor-pointer"
        title="خروج از حساب مدیریت"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span>خروج از حساب مدیریت</span>
      </button>
    </div>
  );

  return (
    <>
      {/* سایدبار دسکتاپ - ثابت و استاندارد */}
      <aside className="hidden md:flex w-64 bg-white border-l border-slate-200 shrink-0 min-h-[calc(100vh-4rem)] flex-col justify-between p-4">
        {navContent}
      </aside>

      {/* سایدبار موبایل - کشویی با بک‌دراپ */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex justify-end">
          {/* بک‌دراپ تیره با امکان کلیک برای بستن */}
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity" 
            onClick={onCloseMobile}
          />

          {/* بدنه کشویی سایدبار */}
          <div className="relative w-72 max-w-[85vw] bg-white h-full shadow-2xl p-4 flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-200 z-10">
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-900">منوی مدیریت فرم‌افزار</span>
              <button
                onClick={onCloseMobile}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                title="بستن منو"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              {navContent}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
