'use client';

import React, { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from '@/context/form-context';
import { FormRunner } from '@/components/runner/form-runner';
import { PwaInstallButton } from '@/components/pwa/pwa-install-button';
import Link from 'next/link';

function PublicFormContent() {
  const params = useParams();
  const router = useRouter();
  const rawSlug = (params?.slug as string) || '';
  let decodedSlug = rawSlug;
  try {
    decodedSlug = decodeURIComponent(rawSlug);
  } catch {}

  const { getFormBySlug, forms } = useForm();
  const [directForm, setDirectForm] = React.useState<any>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // ۱. بررسی فوری در فرم‌های کانتکست موجود
  const contextForm = getFormBySlug(decodedSlug) || getFormBySlug(rawSlug);

  React.useEffect(() => {
    if (contextForm) {
      setDirectForm(contextForm);
      setIsLoading(false);
      return;
    }

    // ۲. در صورتی که در کانتکست یافت نشد (ورود مستقیم از تب جدید یا رفرش)، واکشی بلادرنگ از سرور
    let isCancelled = false;
    setIsLoading(true);

    const targetQuery = encodeURIComponent(decodedSlug || rawSlug);
    fetch(`/api/forms?slug=${targetQuery}`, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (!isCancelled) {
          if (data?.success && data?.form) {
            setDirectForm(data.form);
          } else {
            setDirectForm(null);
          }
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [contextForm, decodedSlug, rawSlug]);

  const form = directForm || contextForm;

  React.useEffect(() => {
    document.title = form?.title ? `${form.title} | سامانه خدمات روانشناسی بالحق` : 'سامانه خدمات روانشناسی بالحق';
  }, [form]);

  if (isLoading && !form) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center animate-pulse">
        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-center p-1.5 mb-4">
          <img
            src="/images/belhagh-logo.png"
            alt="لوگوی روانشناسی بالحق"
            className="w-full h-full object-contain"
          />
        </div>
        <p className="text-xs font-bold text-slate-600">در حال دریافت و بارگذاری فرم...</p>
      </div>
    );
  }

  if (!form) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-center p-1.5 mb-4">
          <img
            src="/images/belhagh-logo.png"
            alt="لوگوی روانشناسی بالحق"
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-lg font-bold text-slate-800">فرم مورد نظر یافت نشد</h1>
        <p className="text-xs text-slate-500 mt-1 max-w-sm">
          ممکن است نشانی اینترنتی تغییر کرده باشد یا فرم توسط مدیر غیرفعال شده باشد.
        </p>
        <Link
          href="/"
          className="mt-6 px-4 py-2 bg-slate-900 text-white font-medium text-xs rounded-md hover:bg-slate-800"
        >
          بازگشت به صفحه اصلی
        </Link>
      </div>
    );
  }

  const headerTitle =
    form.generalSettings?.portalTitle ||
    form.printTemplate?.headerTitle ||
    (form.id.includes('belhagh') || form.slug === 'zexuz' || form.slug === '3uu4z'
      ? 'سامانه خدمات روانشناسی بالحق'
      : form.title || 'فرم‌افزار سازمانی');

  const hasBgImage = Boolean(form.theme?.backgroundImage);
  const pageBgStyle: React.CSSProperties = {
    backgroundColor: form.theme?.backgroundColor || '#f8fafc',
    backgroundImage: form.theme?.backgroundImage
      ? `url(${form.theme.backgroundImage})`
      : (form.theme?.backgroundGradient || undefined),
    backgroundSize: form.theme?.backgroundSize === 'repeat' ? 'auto' : (form.theme?.backgroundSize || 'cover'),
    backgroundRepeat: form.theme?.backgroundSize === 'repeat' ? 'repeat' : 'no-repeat',
    backgroundPosition: form.theme?.backgroundPosition || 'center center',
    backgroundAttachment: 'fixed',
  };

  return (
    <div 
      className="min-h-screen flex flex-col justify-between transition-all duration-300 relative"
      style={pageBgStyle}
    >
      {/* لایه پوشش تیره اختیاری روی عکس پس‌زمینه */}
      {hasBgImage && (form.theme?.backgroundOverlayOpacity || 0) > 0 && (
        <div 
          className="fixed inset-0 pointer-events-none transition-opacity z-0"
          style={{ backgroundColor: `rgba(0, 0, 0, ${form.theme?.backgroundOverlayOpacity})` }}
        />
      )}

      {/* هدر فرم عمومی - بهینه‌شده برای موبایل */}
      <header className={`py-3 sm:py-4 border-b border-slate-200/80 shadow-xs relative z-10 transition-colors ${
        hasBgImage ? 'backdrop-blur-md bg-white/85' : 'bg-white'
      }`}>
        <div className="max-w-3xl mx-auto px-3 sm:px-4 flex items-center justify-between gap-2">
          <Link href="/portal" className="flex items-center gap-2.5 min-w-0 hover:opacity-90 transition-opacity" title="مرکز خدمات روانشناسی بالحق">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-center p-0.5 shrink-0 overflow-hidden">
              <img
                src={form.generalSettings?.logoUrl || '/images/belhagh-logo.png'}
                alt="لوگوی روانشناسی بالحق"
                className="w-full h-full object-contain select-none"
              />
            </div>
            <span className="font-extrabold text-xs sm:text-sm text-slate-900 tracking-tight block truncate">
              {headerTitle}
            </span>
          </Link>

          <div className="flex items-center gap-2 shrink-0">
            <PwaInstallButton variant="public-header" />
            <span className="hidden sm:inline text-xs text-slate-500 font-medium whitespace-nowrap">
              سامانه امن ثبت داده‌ها
            </span>
          </div>
        </div>
      </header>

      {/* بوم رانر فرم */}
      <main className="flex-1 flex flex-col justify-start py-1.5 sm:py-6 relative z-10 w-full overflow-x-hidden">
        <FormRunner 
          key={form.id}
          form={form} 
          onNavigateToForm={(formIdOrSlug) => {
            const nextForm = forms.find((f) => f.id === formIdOrSlug || f.slug === formIdOrSlug);
            const targetSlug = nextForm ? nextForm.slug : formIdOrSlug;
            router.push(`/form/${targetSlug}`);
          }}
        />
      </main>

      {/* پاورقی رسمی فرم عمومی */}
      <footer className={`py-4 sm:py-6 text-center text-[11px] sm:text-xs text-slate-500 border-t border-slate-200/60 relative z-10 transition-colors ${
        hasBgImage ? 'backdrop-blur-md bg-white/85' : 'bg-white'
      }`}>
        <div className="max-w-3xl mx-auto px-3 sm:px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <img src="/images/belhagh-logo.png" alt="روانشناسی بالحق" className="h-5 w-auto object-contain" />
            <span className="font-semibold text-slate-600">مرکز خدمات روانشناسی و مشاوره بالحق</span>
          </div>
          <span className="text-[10px] sm:text-[11px] text-slate-400">سامانه امن نوبت‌دهی و پرونده الکترونیک</span>
        </div>
      </footer>
    </div>
  );
}

export default function PublicFormPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-xs text-slate-500">در حال بارگذاری فرم...</div>}>
      <PublicFormContent />
    </Suspense>
  );
}
