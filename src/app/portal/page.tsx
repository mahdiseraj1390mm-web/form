'use client';

import React, { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from '@/context/form-context';
import { Form, ClientFormAvailability } from '@/types/form';
import { toPersianDigits, toEnglishDigits } from '@/lib/persian';
import { 
  User, 
  ChevronDown, 
  LogOut, 
  ChevronLeft, 
  FileText, 
  Layers, 
  LogIn, 
  Lock,
  CheckCircle2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import Link from 'next/link';

interface ClientSession {
  caseCode: string;
  fullName?: string;
  mobile?: string;
}

function PortalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlCaseParam = searchParams.get('case') || searchParams.get('code');
  const { forms, submissions } = useForm();

  const [session, setSession] = useState<ClientSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  // استیت فرم لاگین اولیه (در صورتی که سشن ذخیره نشده باشد)
  const [caseCodeInput, setCaseCodeInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // بستن منوی باز شوی اکانت با کلیک بیرون از آن
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (accountMenuRef.current && !accountMenuRef.current.contains(event.target as Node)) {
        setIsAccountMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // بررسی ماندگاری ورود مراجع (بررسی localStorage یا پارامتر URL)
  useEffect(() => {
    const resolveSession = async () => {
      let candidateCode = urlCaseParam?.trim() || '';

      if (!candidateCode && typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('belhagh_current_case_code');
          if (stored) candidateCode = stored.trim();
        } catch {}
      }

      if (!candidateCode) {
        setIsLoadingSession(false);
        router.replace('/form/3uu4z');
        return;
      }

      const cleanCode = toEnglishDigits(candidateCode.toUpperCase());

      // دریافت مشخصات کش‌شده در حافظه محلی
      let cachedName = '';
      let cachedMobile = '';
      if (typeof window !== 'undefined') {
        try {
          const activeData = localStorage.getItem('belhagh_active_case_data');
          if (activeData) {
            const parsed = JSON.parse(activeData);
            cachedName = `${parsed.f_name || ''} ${parsed.f_family || ''}`.trim() || parsed.fullName || '';
            cachedMobile = parsed.f_mobile || parsed.mobile || '';
          }
        } catch {}
      }

      // جستجو در سابمیشن‌های لودشده کلاینت
      const localSub = submissions.find(
        (s) =>
          s.trackingCode?.toUpperCase() === cleanCode ||
          s.data?.caseCode?.toUpperCase() === cleanCode ||
          s.id === cleanCode
      );

      if (localSub) {
        const subName = `${localSub.data?.f_name || ''} ${localSub.data?.f_family || ''}`.trim() || localSub.data?.fullName || cachedName;
        const subMobile = localSub.data?.f_mobile || localSub.mobile || cachedMobile;
        setSession({
          caseCode: cleanCode,
          fullName: subName || 'مراجع مرکز بالحق',
          mobile: subMobile,
        });
        setIsLoadingSession(false);
        return;
      }

      // استعلام مستقیم از API سرور
      try {
        const res = await fetch(`/api/cases?code=${encodeURIComponent(cleanCode)}`);
        const json = await res.json();
        if (json.success && json.found && json.caseRecord) {
          const rec = json.caseRecord;
          const fullName = `${rec.first_name || ''} ${rec.last_name || ''}`.trim() || rec.data?.fullName || cachedName || 'مراجع مرکز بالحق';
          const mobile = rec.mobile || rec.data?.f_mobile || cachedMobile || '';

          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('belhagh_current_case_code', rec.case_code || cleanCode);
            } catch {}
          }

          setSession({
            caseCode: rec.case_code || cleanCode,
            fullName,
            mobile,
          });
          setIsLoadingSession(false);
          return;
        }
      } catch (e) {
        console.warn('Portal session check error:', e);
      }

      // اگر در دیتابیس یافت نشد ولی کد ذخیره شده موجود بود
      if (candidateCode) {
        setSession({
          caseCode: cleanCode,
          fullName: cachedName || 'مراجع محترم',
          mobile: cachedMobile || '',
        });
      }
      setIsLoadingSession(false);
    };

    resolveSession();
  }, [urlCaseParam, submissions]);

  // عملیات ورود مراجع با کد پرونده
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const cleanRaw = toEnglishDigits(caseCodeInput.trim());

    if (!cleanRaw) {
      setLoginError('لطفاً کد پرونده خود را وارد فرمایید.');
      return;
    }

    const cleanCode = cleanRaw.toUpperCase();
    const isMobileFormat =
      cleanRaw.startsWith('09') ||
      (cleanRaw.length === 10 && cleanRaw.startsWith('9')) ||
      cleanRaw.startsWith('989') ||
      cleanRaw.startsWith('+98');

    if (isMobileFormat) {
      setLoginError(
        'شما شماره همراه وارد نموده‌اید. ورود به سامانه تنها با «کد پرونده اختصاصی» (مثال: SP123456) امکان‌پذیر است. در صورت فراموشی کد، لطفاً از بخش «بازیابی کد پرونده» در فرم نوبت‌دهی استفاده فرمایید.'
      );
      return;
    }

    setIsLoggingIn(true);
    let resolvedData: ClientSession | null = null;

    try {
      const res = await fetch(`/api/cases?code=${encodeURIComponent(cleanCode)}`);
      const json = await res.json();
      if (json.success && json.found && json.caseRecord) {
        const rec = json.caseRecord;
        const fullName = `${rec.first_name || ''} ${rec.last_name || ''}`.trim() || rec.data?.fullName || 'مراجع مرکز بالحق';
        resolvedData = {
          caseCode: rec.case_code || cleanCode,
          fullName,
          mobile: rec.mobile || rec.data?.f_mobile || '',
        };

        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('belhagh_current_case_code', resolvedData.caseCode);
            localStorage.setItem('belhagh_active_case_data', JSON.stringify({
              f_name: rec.first_name || '',
              f_family: rec.last_name || '',
              f_mobile: resolvedData.mobile,
              f_case_code: resolvedData.caseCode,
              ...rec.data,
            }));
          } catch {}
        }
      }
    } catch (err) {
      console.warn('Login lookup error:', err);
    }

    if (!resolvedData) {
      const match = submissions.find(
        (s) =>
          s.trackingCode?.toUpperCase() === cleanCode ||
          s.data?.caseCode?.toUpperCase() === cleanCode ||
          s.id === cleanCode
      );
      if (match) {
        resolvedData = {
          caseCode: match.trackingCode || cleanCode,
          fullName: `${match.data?.f_name || ''} ${match.data?.f_family || ''}`.trim() || 'مراجع محترم',
          mobile: match.data?.f_mobile || match.mobile || '',
        };
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('belhagh_current_case_code', resolvedData.caseCode);
            localStorage.setItem('belhagh_active_case_data', JSON.stringify(match.data || {}));
          } catch {}
        }
      }
    }

    setIsLoggingIn(false);

    if (resolvedData) {
      setSession(resolvedData);
      setCaseCodeInput('');
    } else {
      setLoginError('پرونده‌ای با این کد یافت نشد. لطفاً کد را بررسی کنید.');
    }
  };

  // عملیات خروج از حساب
  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('belhagh_current_case_code');
        localStorage.removeItem('belhagh_active_case_data');
      } catch {}
    }
    setSession(null);
    setIsAccountMenuOpen(false);
    router.push('/');
  };

  // تشخیص وضعیت دسترسی فرم
  const getFormAvailability = (f: Form): ClientFormAvailability => {
    if (f.clientAvailability) return f.clientAvailability;
    if (f.generalSettings?.clientAvailability) return f.generalSettings.clientAvailability;
    if (f.status === 'published' && f.id !== 'form-belhagh-registration' && f.slug !== 'zexuz') {
      return 'active_submittable';
    }
    return 'hidden_inactive';
  };

  // فیلتر و مرتب‌سازی فرم‌ها:
  // ۱ـ فرم‌های با امکان ثبت (روشن و قابل کلیک در بالا)
  // ۲ـ فرم‌های فعال بدون ثبت (خاکستری و غیرقابل کلیک در انتها)
  // ۳ـ فرم‌های غیرفعال کاملاً حذف می‌شوند
  const sortedForms = useMemo(() => {
    const visible = forms.filter((f) => getFormAvailability(f) !== 'hidden_inactive');

    return [...visible].sort((a, b) => {
      const stateA = getFormAvailability(a);
      const stateB = getFormAvailability(b);
      if (stateA === 'active_submittable' && stateB === 'active_readonly') return -1;
      if (stateA === 'active_readonly' && stateB === 'active_submittable') return 1;
      return 0;
    });
  }, [forms]);

  // وضعیت در حال بارگذاری اولیه سشن
  if (isLoadingSession) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-600 font-bold text-xs sm:text-sm">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-md p-1.5 flex items-center justify-center animate-pulse">
            <img src="/images/belhagh-logo.png" alt="لوگوی روانشناسی بالحق" className="w-full h-full object-contain" />
          </div>
          <span>در حال بررسی پرونده مراجع...</span>
        </div>
      </div>
    );
  }

  // در صورتی که مراجع وارد نشده باشد، به صفحه فرم نوبت‌دهی هدایت می‌شود
  if (!session) {
    if (typeof window !== 'undefined') {
      router.replace('/form/3uu4z');
    }
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center" dir="rtl">
        <div className="flex flex-col items-center gap-3 text-slate-600 font-bold text-xs sm:text-sm">
          <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-md p-1.5 flex items-center justify-center animate-pulse">
            <img src="/images/belhagh-logo.png" alt="لوگوی روانشناسی بالحق" className="w-full h-full object-contain" />
          </div>
          <span>در حال هدایت به سامانه...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 flex flex-col justify-between" dir="rtl">
      
      {/* سربرگ ناوبری با منوی باز شوی اکانت مراجع */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-xs">
        <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          
          {/* عنوان مرکز و لوگوی بالحق */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
              <img
                src="/images/belhagh-logo.png"
                alt="لوگوی روانشناسی بالحق"
                className="w-full h-full object-contain select-none"
              />
            </div>
            <span className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
              مرکز خدمات روانشناسی بالحق
            </span>
          </div>

          {/* منوی باز شوی اکانت مراجع */}
          <div className="relative shrink-0" ref={accountMenuRef}>
            <button
              type="button"
              onClick={() => setIsAccountMenuOpen((prev) => !prev)}
              className="flex items-center gap-2 py-1.5 px-3 rounded-xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:scale-[0.99] transition-all cursor-pointer bg-white"
            >
              <div className="w-6 h-6 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <User className="w-3.5 h-3.5" />
              </div>
              <span className="text-xs font-bold text-slate-800 max-w-[110px] truncate hidden sm:inline">
                {session.fullName || session.caseCode}
              </span>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isAccountMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* دراپ‌داون اکانت */}
            {isAccountMenuOpen && (
              <div className="absolute left-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-xl p-2.5 space-y-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="p-2 border-b border-slate-100 space-y-1">
                  <span className="text-xs font-extrabold text-slate-900 block truncate">
                    {session.fullName}
                  </span>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                    <span>کد پرونده:</span>
                    <span className="font-bold text-[#084d8c]">{session.caseCode}</span>
                  </div>
                  {session.mobile && (
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono">
                      <span>شماره همراه:</span>
                      <span>{toPersianDigits(session.mobile)}</span>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full flex items-center justify-between p-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer"
                >
                  <span>خروج از حساب</span>
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* بوم نمایش کارت‌های فرم زیر هم */}
      <main className="flex-1 max-w-2xl w-full mx-auto p-4 sm:p-6 space-y-3.5">
        
        {sortedForms.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 text-xs">
            در حال حاضر فرمی در این بخش در دسترس نیست.
          </div>
        ) : (
          sortedForms.map((form) => {
            const availability = getFormAvailability(form);
            const isSubmittable = availability === 'active_submittable';

            // حالت ۱: فعال با امکان ثبت (روشن، دارای هاور و کلیک‌پذیر)
            if (isSubmittable) {
              return (
                <Link
                  key={form.id}
                  href={`/form/${form.slug}`}
                  className="group block bg-white rounded-2xl border border-slate-200/90 hover:border-[#084d8c]/50 hover:shadow-md active:scale-[0.99] transition-all p-4 sm:p-5 shadow-xs cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#084d8c] flex items-center justify-center shrink-0 border border-blue-100 group-hover:bg-[#084d8c] group-hover:text-white transition-colors">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="text-sm sm:text-base font-extrabold text-slate-900 group-hover:text-[#084d8c] transition-colors truncate">
                          {form.title}
                        </h2>
                        {form.description && (
                          <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                            {form.description}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <ChevronLeft className="w-5 h-5 text-slate-400 group-hover:text-[#084d8c] group-hover:-translate-x-0.5 transition-all" />
                    </div>
                  </div>
                </Link>
              );
            }

            // حالت ۲: فعال اما بدون امکان ثبت (در انتهای لیست، خاکستری، غیرفعال و غیرقابل کلیک)
            return (
              <div
                key={form.id}
                className="bg-slate-100/70 border border-slate-200/80 rounded-2xl p-4 sm:p-5 opacity-60 cursor-not-allowed select-none"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-200 text-slate-400 flex items-center justify-center shrink-0 border border-slate-300">
                      <Lock className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-sm sm:text-base font-bold text-slate-600 truncate">
                        {form.title}
                      </h2>
                      {form.description && (
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                          {form.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <span className="text-[11px] font-bold text-slate-500 bg-slate-200/80 px-2.5 py-1 rounded-lg shrink-0">
                    غیرفعال برای ثبت
                  </span>
                </div>
              </div>
            );
          })
        )}

      </main>

      {/* پاورقی ساده و مینیمال */}
      <footer className="py-4 text-center text-[11px] text-slate-400 border-t border-slate-200/60 bg-white">
        مرکز خدمات روانشناسی بالحق
      </footer>

    </div>
  );
}

export default function PortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-500 font-bold text-xs">
            <Layers className="w-4 h-4 animate-spin text-[#084d8c]" />
            <span>در حال بارگذاری...</span>
          </div>
        </div>
      }
    >
      <PortalContent />
    </Suspense>
  );
}
