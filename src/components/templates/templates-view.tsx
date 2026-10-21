'use client';

import React from 'react';
import { useForm } from '@/context/form-context';
import { initialForms } from '@/lib/mock-data';
import { Sparkles, Layers, ArrowLeft, CheckCircle2, ShieldCheck, CreditCard, Award, Calendar } from 'lucide-react';
import { toPersianDigits } from '@/lib/persian';

interface TemplatesViewProps {
  onSelectTemplate: (templateId: string) => void;
}

export const TemplatesView: React.FC<TemplatesViewProps> = ({ onSelectTemplate }) => {
  const { createForm, setActiveForm } = useForm();

  const handleUseTemplate = (templateIndex: number) => {
    const base = initialForms[templateIndex];
    if (!base) return;

    const newCreated = createForm({
      title: `${base.title} (نسخه سفارشی)`,
      description: base.description,
      category: base.category,
      mode: base.mode,
      fields: JSON.parse(JSON.stringify(base.fields)),
      steps: JSON.parse(JSON.stringify(base.steps)),
      rules: JSON.parse(JSON.stringify(base.rules)),
      payment: JSON.parse(JSON.stringify(base.payment)),
      quiz: JSON.parse(JSON.stringify(base.quiz)),
      security: JSON.parse(JSON.stringify(base.security)),
      printTemplate: JSON.parse(JSON.stringify(base.printTemplate)),
    });

    setActiveForm(newCreated);
    onSelectTemplate(newCreated.id);
  };

  const templateBadges = [
    { icon: ShieldCheck, text: 'اعتبارسنجی ثبت‌احوال' },
    { icon: CreditCard, text: 'درگاه شاپرک' },
    { icon: Award, text: 'کارنامه هوشمند' },
    { icon: Calendar, text: 'رزرو بدون تداخل' },
  ];

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-slate-50">
      
      {/* سربرگ قالب‌ها */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              بانک قالب‌های استاندارد و آماده سازمانی
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            با یک کلیک از میان الگوهای آماده استفاده کنید و فیلدها و شروط را شخصی‌سازی فرمایید
          </p>
        </div>
      </div>

      {/* لیست قالب‌های آماده */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {initialForms.map((tmpl, idx) => (
          <div
            key={tmpl.id}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md hover:border-blue-400 transition-all p-6 flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {tmpl.category}
                </span>
                <span className="text-xs text-blue-600 font-bold">
                  {tmpl.mode === 'wizard' ? 'چندمرحله‌ای (Wizard)' : 'تک‌صفحه‌ای'}
                </span>
              </div>

              <h3 className="font-extrabold text-base text-slate-900">{tmpl.title}</h3>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{tmpl.description}</p>

              {/* ویژگی‌های شاخص این قالب */}
              <div className="pt-4 flex flex-wrap gap-2 text-[11px]">
                {tmpl.fields.some((f) => f.type === 'nationalCode') && (
                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                    کد ملی ۱۰ رقمی
                  </span>
                )}
                {tmpl.payment.enabled && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded">
                    درگاه شاپرک
                  </span>
                )}
                {tmpl.quiz.enabled && (
                  <span className="px-2 py-0.5 bg-purple-50 text-purple-700 border border-purple-200 rounded">
                    آزمون با تایمر
                  </span>
                )}
                {tmpl.fields.some((f) => f.type === 'signature') && (
                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded">
                    امضای دیجیتال
                  </span>
                )}
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                  {toPersianDigits(tmpl.fields.length)} فیلد آماده
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">طراحی استاندارد Enterprise</span>
              <button
                onClick={() => handleUseTemplate(idx)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm transition-colors"
              >
                <span>استفاده از این قالب</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
};
