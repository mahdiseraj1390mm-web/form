'use client';

import React from 'react';
import { useForm } from '@/context/form-context';
import { 
  Layers, 
  PlusCircle, 
  ExternalLink, 
  Bell, 
  Building2,
  Menu,
  X
} from 'lucide-react';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openNewFormModal: () => void;
  isMobileNavOpen?: boolean;
  onToggleMobileNav?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  openNewFormModal,
  isMobileNavOpen = false,
  onToggleMobileNav,
}) => {
  const { forms, activeForm, submissions } = useForm();

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* برند و لوگو سازمانی + دکمه منوی موبایل */}
        <div className="flex items-center gap-2 sm:gap-6">
          {/* دکمه همبرگری موبایل */}
          <button
            onClick={onToggleMobileNav}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            title="منوی ناوبری"
            aria-label="باز کردن منو"
          >
            {isMobileNavOpen ? <X className="w-5 h-5 text-slate-800" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={() => setCurrentTab('dashboard')}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold shadow-sm border border-slate-800 shrink-0">
              <Layers className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-extrabold text-base sm:text-lg text-slate-900 tracking-tight">فرم‌افزار</span>
                <span className="text-[10px] sm:text-[11px] font-semibold px-1.5 sm:px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                  سازمانی Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">سامانه فرم‌ساز، آزمون‌ساز و گردش کار پیشرفته</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 pr-6 border-r border-slate-200 text-xs text-slate-600">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="font-medium">سازمان راهکارهای ابری پایا</span>
          </div>
        </div>

        {/* دکمه‌های اکشن بالا */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {activeForm && (
            <button
              onClick={() => setCurrentTab('runner')}
              className="hidden lg:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors border border-slate-200"
              title="پیش‌نمایش زنده فرم عمومی"
            >
              <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
              <span>مشاهده فرم کاربر: {activeForm.title.slice(0, 18)}...</span>
            </button>
          )}

          <button
            onClick={openNewFormModal}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 rounded-md shadow-sm transition-all whitespace-nowrap"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden xs:inline">ایجاد فرم جدید</span>
            <span className="xs:hidden">فرم جدید</span>
          </button>

          <div className="h-6 w-px bg-slate-200 mx-0.5 sm:mx-1 hidden sm:block" />

          {/* اعلان‌ها و وضعیت */}
          <div className="relative">
            <button 
              className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition-colors relative"
              title="اعلان‌های سیستم"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
            </button>
          </div>

          <div className="flex items-center gap-2 pr-1 sm:pr-2 border-r border-slate-200">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-800 text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-100 shrink-0">
              مدیر
            </div>
          </div>
        </div>

      </div>
    </header>
  );
};
