'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useForm } from '@/context/form-context';
import { useAdminAuth } from '@/context/admin-auth-context';
import { PwaInstallButton } from '@/components/pwa/pwa-install-button';
import { 
  Layers, 
  PlusCircle, 
  ExternalLink, 
  Bell, 
  Building2,
  Menu,
  X,
  Check,
  UserCheck,
  Clock,
  Sparkles,
  Inbox,
  LogOut,
  ChevronDown,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';

import { ConsultantAvatar } from '@/components/consultants/consultant-avatar';

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
  const { activeForm, similarityNotifications, resolveSimilarityNotification, teamMembers } = useForm();
  const { currentUser, logout } = useAdminAuth();
  const currentMember = teamMembers?.find(
    (m) =>
      (m.mobile && currentUser?.mobile && m.mobile === currentUser.mobile) ||
      (m.name && currentUser?.name && m.name === currentUser.name)
  );
  const activeUserAvatar = currentMember?.avatarUrl;
  const activeUserGender = currentMember?.genderPrefix;
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const isSuperAdmin = !!(
    currentUser?.isSuperAdmin ||
    currentUser?.username === 'admin' ||
    currentUser?.role === 'super_admin'
  );
  const allowedTabs = currentUser?.allowedTabs;

  const canCreateForms = isSuperAdmin || allowedTabs?.includes('builder') || allowedTabs?.includes('forms');
  const canPreviewForms = isSuperAdmin || allowedTabs?.includes('runner');

  const pendingNotifs = similarityNotifications ? similarityNotifications.filter((n) => !n.resolved) : [];

  // بستن منوها در صورت کلیک خارج از کادر
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    if (isNotifOpen || isUserMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isNotifOpen, isUserMenuOpen]);

  const handleLogoClick = () => {
    if (isSuperAdmin || allowedTabs?.includes('dashboard')) {
      setCurrentTab('dashboard');
    } else if (allowedTabs && allowedTabs.length > 0) {
      setCurrentTab(allowedTabs[0]);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* برند و لوگو سازمانی + دکمه منوی موبایل */}
        <div className="flex items-center gap-2 sm:gap-6">
          {/* دکمه همبرگری موبایل */}
          <button
            onClick={onToggleMobileNav}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title="منوی ناوبری"
            aria-label="باز کردن منو"
          >
            {isMobileNavOpen ? <X className="w-5 h-5 text-slate-800" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-2 sm:gap-3 cursor-pointer" onClick={handleLogoClick}>
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
              <p className="text-[11px] text-slate-500 hidden sm:block">سامانه فرم‌ساز، آزمون‌ساز و پرونده مراجعین بالحق</p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 pr-6 border-r border-slate-200 text-xs text-slate-600">
            <Building2 className="w-4 h-4 text-slate-400" />
            <span className="font-medium">مرکز خدمات روانشناسی بالحق</span>
          </div>
        </div>

        {/* دکمه‌های عملیات سریع و حساب کاربری */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <PwaInstallButton variant="header" />
          {/* اعلان‌ها و دراپ‌داون تطبیق هوشمند */}
          {isSuperAdmin && (
            <div className="relative" ref={notifRef}>
              <button 
                onClick={() => setIsNotifOpen((prev) => !prev)}
                className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors relative cursor-pointer"
                title="اعلان‌ها و تطبیق‌های هوشمند پرونده"
                aria-label="اعلان‌ها"
              >
                <Bell className="w-4 h-4" />
                {pendingNotifs.length > 0 ? (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-white animate-pulse">
                    {pendingNotifs.length}
                  </span>
                ) : (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500" />
                )}
              </button>

              {/* منوی بازشونده هوشمند اعلان‌های تطبیق هویت */}
              {isNotifOpen && (
                <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden text-right animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <span className="text-xs font-bold text-slate-900">هوش مصنوعی تطبیق مراجعین</span>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold">
                      {pendingNotifs.length} مورد منتظر تایید
                    </span>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                    {pendingNotifs.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-xs">
                        <Check className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                        <p className="font-semibold text-slate-700">هیچ مورد مشکوک یا بلاتکلیفی وجود ندارد</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          تمام ارسالی‌های جدید به پرونده‌های معتبر متصل یا با موفقیت ثبت شده‌اند.
                        </p>
                      </div>
                    ) : (
                      pendingNotifs.map((notif) => (
                        <div key={notif.id} className="p-3.5 hover:bg-slate-50/80 transition-colors space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900">
                              ثبت جدید از: {notif.registrantName || 'مراجع نامشخص'}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                              <Clock className="w-3 h-3" />
                              {new Date(notif.createdAt).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <div className="space-y-1.5">
                            {notif.candidates.map((cand, idx) => (
                              <div key={idx} className="p-2 rounded-lg border border-slate-200 bg-white text-[11px] space-y-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-bold text-slate-800 flex items-center gap-1">
                                    <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                                    پرونده موجود: {cand.userName}
                                  </span>
                                  <span className="text-emerald-700 font-extrabold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                                    {cand.matchPercent}٪ شباهت
                                  </span>
                                </div>
                                <button
                                  onClick={() => resolveSimilarityNotification(notif.id, 'confirm', cand.caseCode)}
                                  className="w-full mt-1.5 py-1.5 px-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                  <span>تایید و اتصال به پرونده {cand.caseCode}</span>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* پروفایل کاربر و منوی خروج */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 sm:gap-2 pr-1 sm:pr-2 border-r border-slate-200 hover:opacity-80 transition-opacity focus:outline-none cursor-pointer"
              title="حساب کاربری"
              aria-label="منوی حساب کاربری"
            >
              <ConsultantAvatar
                avatarUrl={activeUserAvatar}
                genderPrefix={activeUserGender}
                name={currentUser?.name}
                size="sm"
                shape="circle"
                className="w-7 h-7 sm:w-8 sm:h-8"
              />
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 hidden sm:block transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isUserMenuOpen && (
              <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-60 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden text-right animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <ConsultantAvatar
                      avatarUrl={activeUserAvatar}
                      genderPrefix={activeUserGender}
                      name={currentUser?.name}
                      size="sm"
                      shape="circle"
                      className="w-9 h-9"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {currentUser?.name || 'کاربر سامانه'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {currentUser?.mobile || currentUser?.username || 'کاربر'} (آنلاین)
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-1.5 space-y-1">
                  <div className="px-3 py-2 text-[11px] text-slate-500 bg-slate-50/60 rounded-lg flex items-center justify-between">
                    <span>سمت / سطح:</span>
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      {isSuperAdmin ? 'مدیر کل (Super Admin)' : (currentUser?.jobTitle || 'کاربر پنل')}
                    </span>
                  </div>

                  <button
                    onClick={async () => {
                      setIsUserMenuOpen(false);
                      await logout();
                    }}
                    className="w-full px-3 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center gap-2 transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>خروج از حساب کاربری</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </header>
  );
};
