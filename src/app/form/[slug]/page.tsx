'use client';

import React, { Suspense } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from '@/context/form-context';
import { FormRunner } from '@/components/runner/form-runner';
import { Layers } from 'lucide-react';
import Link from 'next/link';

function PublicFormContent() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const { getFormBySlug, forms } = useForm();

  const form = getFormBySlug(slug);

  if (!form) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-xl bg-slate-200 text-slate-500 flex items-center justify-center mb-4">
          <Layers className="w-6 h-6" />
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
      ? 'مرکز خدمات روانشناسی بالحق'
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
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
              <Layers className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-400" />
            </div>
            <span className="font-extrabold text-xs sm:text-sm text-slate-900 tracking-tight block truncate">
              {headerTitle}
            </span>
          </div>

          <div className="text-[10px] sm:text-xs text-slate-500 font-medium whitespace-nowrap shrink-0">
            سامانه امن ثبت داده‌ها
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
        <div className="max-w-3xl mx-auto px-3 sm:px-4 flex flex-col sm:flex-row items-center justify-between gap-1.5 sm:gap-2">
          <span>قدرت گرفته از سامانه فرم‌افزار سازمانی</span>
          <span className="text-[10px] sm:text-[11px] text-slate-400">رمزنگاری اطلاعات و اعتبارسنجی شبکه شاپرک</span>
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
