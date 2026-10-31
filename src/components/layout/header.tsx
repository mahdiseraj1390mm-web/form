'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useForm } from '@/context/form-context';
import { useAdminAuth } from '@/context/admin-auth-context';
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
  const { activeForm, similarityNotifications, resolveSimilarityNotification } = useForm();
  const { currentUser, logout } = useAdminAuth();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

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

          {/* اعلان‌ها و دراپ‌داون تطبیق هوشمند */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setIsNotifOpen((prev) => !prev)}
              className="p-1.5 sm:p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors relative"
              title="اعلان‌ها و تطبیق‌های هوشمند پرونده"
              aria-label="اعلان‌ها"
            >
              <Bell className="w-4 h-4" />
              {pendingNotifs.length > 0 ? (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-[10px] font-bold text-white flex items-center justify-center ring-2 ring-white animate-pulse">
                  {pendingNotifs.length}
                </span>
              ) : (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white" />
              )}
            </button>

            {/* پاپ‌اور سریع و بدون حاشیه اعلان‌های تطبیق برای مدیر */}
            {isNotifOpen && (
              <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-[calc(100vw-24px)] max-w-[420px] bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden text-right animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800">تطبیق‌های هوشمند پرونده</h4>
                      <p className="text-[10px] text-slate-500">بررسی تشابه مراجعان جدید با سوابق ارزیابی</p>
                    </div>
                  </div>
                  {pendingNotifs.length > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                      {pendingNotifs.length} مورد معلق
                    </span>
                  )}
                </div>

                <div className="max-h-[70vh] overflow-y-auto divide-y divide-slate-100 p-2 space-y-2">
                  {pendingNotifs.length === 0 ? (
                    <div className="p-6 text-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                        <Inbox className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">هیچ مورد تطبیقی در انتظار تایید نیست</p>
                      <p className="text-[11px] text-slate-500 leading-relaxed">
                        پرونده‌های همتا با شباهت قطعی متصل شده‌اند و موارد مبهم در صف پردازش خودکار شبانه قرار می‌گیرند.
                      </p>
                    </div>
                  ) : (
                    pendingNotifs.map((notif) => (
                      <div key={notif.id} className="p-3 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200/80 space-y-3 transition-colors">
                        {/* عنوان مراجع ثبت‌نام‌شده */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full bg-amber-500" />
                              <span className="text-xs font-extrabold text-slate-900">{notif.registrantName}</span>
                            </div>
                            {notif.registrantMobile && (
                              <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                                تلفن: {notif.registrantMobile}
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            چند لحظه پیش
                          </span>
                        </div>

                        <p className="text-[11px] text-slate-600 bg-white p-2 rounded-lg border border-slate-200/60 leading-relaxed">
                          ⚠️ چند پرونده با درصد شباهت یکسان شناسایی شد؛ پرونده مورد نظر را جهت انتساب انتخاب نمایید:
                        </p>

                        {/* کارت‌های کاندیداها */}
                        <div className="space-y-2">
                          {notif.candidates.map((cand) => (
                            <div 
                              key={cand.caseCode} 
                              className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-2 hover:border-blue-300 transition-all shadow-xs"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5">
                                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                                  <span className="text-xs font-bold text-slate-800">{cand.userName}</span>
                                  <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1 rounded">
                                    {cand.caseCode}
                                  </span>
                                </div>
                                <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  {cand.matchPercent}٪ شباهت
                                </span>
                              </div>

                              {/* فیلدهای منطبق و نامنطبق */}
                              <div className="flex flex-wrap gap-1 text-[10px]">
                                {cand.matchedFields.map((f, i) => (
                                  <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 font-medium border border-emerald-200/60">
                                    ✓ {f}
                                  </span>
                                ))}
                                {cand.unmatchedFields.map((f, i) => (
                                  <span key={i} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-rose-50 text-rose-600 font-medium border border-rose-200/60">
                                    ✕ {f}
                                  </span>
                                ))}
                              </div>

                              {/* دکمه تایید و انتساب 1 کلیک */}
                              <button
                                onClick={() => resolveSimilarityNotification(notif.id, 'confirm', cand.caseCode)}
                                className="w-full mt-1.5 py-1.5 px-2.5 rounded-md bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>تایید و اتصال به پرونده {cand.caseCode}</span>
                              </button>
                            </div>
                          ))}
                        </div>

                        {/* دکمه رد همه و انتقال به صف انتظار */}
                        <div className="pt-1 flex items-center justify-between border-t border-slate-200/60 text-xs">
                          <button
                            onClick={() => resolveSimilarityNotification(notif.id, 'reject')}
                            className="w-full py-1.5 px-2 rounded-md bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-600 font-medium text-[11px] flex items-center justify-center gap-1 transition-colors border border-slate-200/80"
                          >
                            <X className="w-3 h-3" />
                            <span>هیچ‌کدام منطبق نیست (انتقال به صف انتظار شبانه)</span>
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="p-2.5 bg-slate-50 border-t border-slate-200 text-center">
                  <span className="text-[10px] text-slate-400">
                    موتور پردازش شبانه آخر وقت پرونده‌های رد شده را با ثبت‌نامی‌های جدید بازبینی می‌کند.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* پروفایل مدیر و منوی خروج */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen((prev) => !prev)}
              className="flex items-center gap-1.5 sm:gap-2 pr-1 sm:pr-2 border-r border-slate-200 hover:opacity-80 transition-opacity focus:outline-none cursor-pointer"
              title="حساب کاربری مدیریت"
              aria-label="منوی حساب کاربری"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs ring-2 ring-slate-100 shadow-sm shrink-0">
                مدیر
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-500 hidden sm:block transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isUserMenuOpen && (
              <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden text-right animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-3.5 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                      مدیر
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {currentUser?.name || 'مدیر ارشد سامانه'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        admin (آنلاین)
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-1.5 space-y-1">
                  <div className="px-3 py-2 text-[11px] text-slate-500 bg-slate-50/60 rounded-lg flex items-center justify-between">
                    <span>سطح دسترسی:</span>
                    <span className="font-bold text-slate-700 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      مدیر کل (Super Admin)
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
                    <span>خروج از پنل مدیریت</span>
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
