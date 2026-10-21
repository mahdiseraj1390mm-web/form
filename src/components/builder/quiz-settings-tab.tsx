'use client';

import React from 'react';
import { Form, QuizSettings } from '@/types/form';
import { HelpCircle, Award, Timer, Shuffle, FileSpreadsheet, ShieldAlert } from 'lucide-react';
import { toPersianDigits } from '@/lib/persian';

interface QuizSettingsTabProps {
  form: Form;
  onUpdateForm: (updated: Partial<Form>) => void;
}

export const QuizSettingsTab: React.FC<QuizSettingsTabProps> = ({ form, onUpdateForm }) => {
  const quiz = form.quiz;

  const handleUpdate = (updated: Partial<QuizSettings>) => {
    onUpdateForm({
      quiz: {
        ...quiz,
        ...updated,
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-6 space-y-6">
      
      {/* هدر آزمون‌ساز */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600 shrink-0">
          <Award className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">تنظیمات تخصصی آزمون‌ساز و پرسشنامه</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            تبدیل فرم به یک آزمون آنلاین استاندارد؛ شامل تایمر معکوس، تصحیح خودکار بر مبنای کلید سوالات، اعمال نمره منفی، جابجایی تصادفی سوالات و صدور کارنامه الکترونیکی.
          </p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm space-y-6">
        
        {/* فعال‌سازی حالت آزمون */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="text-sm font-bold text-slate-900">فعال‌سازی حالت آزمون و نمره‌دهی خودکار</div>
            <p className="text-xs text-slate-500 mt-0.5">پس از پایان، کارنامه درصد پاسخگویی و رتبه به داوطلب نمایش داده می‌شود</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={quiz.enabled}
              onChange={(e) => handleUpdate({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
          </label>
        </div>

        {quiz.enabled && (
          <div className="space-y-6 text-xs">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* تایمر معکوس آزمون */}
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Timer className="w-4 h-4 text-purple-600" />
                  <span>تایمر آزمون (مدت زمان کل)</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  مدت زمان به دقیقه (عدد ۰ یعنی بدون محدودیت زمانی)
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={quiz.durationMinutes}
                    onChange={(e) => handleUpdate({ durationMinutes: Number(e.target.value) })}
                    className="w-28 px-3 py-1.5 border border-slate-300 rounded-md bg-white font-mono text-left"
                  />
                  <span className="text-slate-600">دقیقه</span>
                </div>
              </div>

              {/* حداقل نمره قبولی */}
              <div className="p-4 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="flex items-center gap-2 font-bold text-slate-900">
                  <Award className="w-4 h-4 text-emerald-600" />
                  <span>حد نصاب قبولی (درصد)</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  حداقل درصدی که برای قبولی و صدور گواهی نیاز است
                </p>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={quiz.passingScore}
                    onChange={(e) => handleUpdate({ passingScore: Number(e.target.value) })}
                    className="w-28 px-3 py-1.5 border border-slate-300 rounded-md bg-white font-mono text-left"
                  />
                  <span className="text-slate-600">درصد (از ۱۰۰)</span>
                </div>
              </div>

            </div>

            {/* گزینه‌های پیشرفته ضد تقلب */}
            <div className="space-y-3 pt-2">
              <span className="font-bold text-slate-800">قوانین و ضدتقلب</span>
              
              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={quiz.shuffleQuestions}
                  onChange={(e) => handleUpdate({ shuffleQuestions: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 border-slate-300"
                />
                <div>
                  <div className="font-semibold text-slate-900">تصادفی‌سازی چیدمان سوالات و گزینه‌ها (Shuffle)</div>
                  <div className="text-[11px] text-slate-500">ترتیب سوالات برای هر داوطلب متفاوت نمایش داده می‌شود</div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={quiz.negativeMarking}
                  onChange={(e) => handleUpdate({ negativeMarking: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 border-slate-300"
                />
                <div>
                  <div className="font-semibold text-slate-900">اعمال نمره منفی برای پاسخ‌های نادرست</div>
                  <div className="text-[11px] text-slate-500">به ازای هر ۳ پاسخ غلط، ۱ پاسخ درست خنثی می‌شود (یک‌سوم نمره منفی)</div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={quiz.showImmediateResult}
                  onChange={(e) => handleUpdate({ showImmediateResult: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 border-slate-300"
                />
                <div>
                  <div className="font-semibold text-slate-900">نمایش آنی کارنامه و تحلیل پاسخ‌ها پس از اتمام آزمون</div>
                  <div className="text-[11px] text-slate-500">داوطلب فوراً درصد، پاسخ‌های درست و غلط و تشریح آزمون را مشاهده می‌کند</div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-colors">
                <input
                  type="checkbox"
                  checked={quiz.certificateEnabled}
                  onChange={(e) => handleUpdate({ certificateEnabled: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-purple-500 w-4 h-4 border-slate-300"
                />
                <div>
                  <div className="font-semibold text-slate-900">صدور خودکار گواهینامه معتبر با کد QR اختصاصی</div>
                  <div className="text-[11px] text-slate-500">در صورت کسب نمره قبولی، گواهینامه قابل استعلام صادر می‌شود</div>
                </div>
              </label>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
