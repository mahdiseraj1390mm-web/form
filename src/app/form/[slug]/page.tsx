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

  return (
    <div className="min-h-screen bg-slate-100/60 flex flex-col justify-between">
      {/* هدر ساده فرم عمومی */}
      <header className="py-4 border-b border-slate-200/80 bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
              <Layers className="w-4 h-4 text-blue-400" />
            </div>
            <span className="font-extrabold text-sm text-slate-900 tracking-tight">فرم‌افزار</span>
          </div>

          <div className="text-[11px] text-slate-400">
            سامانه امن ثبت و دریافت داده‌ها
          </div>
        </div>
      </header>

      {/* بوم رانر فرم */}
      <main className="flex-1 flex flex-col justify-center">
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
      <footer className="py-6 text-center text-xs text-slate-400 border-t border-slate-200/60 bg-white">
        <div className="max-w-3xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>قدرت گرفته از سامانه فرم‌افزار سازمانی</span>
          <span className="text-[11px]">رمزنگاری اطلاعات و اعتبارسنجی شبکه شاپرک</span>
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
