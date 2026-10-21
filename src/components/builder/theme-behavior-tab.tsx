'use client';

import React from 'react';
import { Form, FormBehaviorSettings, FormThemeSettings } from '@/types/form';
import { Palette, Globe, CheckCircle2, Lock, Sliders, ExternalLink } from 'lucide-react';

interface ThemeBehaviorTabProps {
  form: Form;
  onUpdateForm: (updated: Partial<Form>) => void;
}

export const ThemeBehaviorTab: React.FC<ThemeBehaviorTabProps> = ({ form, onUpdateForm }) => {
  const behavior = form.behavior || {
    redirectAfterSubmit: false,
    redirectUrl: '',
    customSuccessMessage: 'اطلاعات شما با موفقیت در سامانه ثبت گردید.',
    showSummaryAfterSubmit: true,
    allowDownloadPdfReceipt: true,
  };

  const theme = form.theme || {
    themeColor: '#2563eb',
    fontFamily: 'vazirmatn',
    borderRadius: 'md',
    backgroundStyle: 'clean',
  };

  const handleUpdateBehavior = (updated: Partial<FormBehaviorSettings>) => {
    onUpdateForm({ behavior: { ...behavior, ...updated } });
  };

  const handleUpdateTheme = (updated: Partial<FormThemeSettings>) => {
    onUpdateForm({ theme: { ...theme, ...updated } });
  };

  const presetColors = [
    { label: 'آبی سرمه‌ای سازمانی (پیش‌فرض)', hex: '#1e3a8a' },
    { label: 'آبی رویال', hex: '#2563eb' },
    { label: 'سبز زمردی اداری', hex: '#059669' },
    { label: 'سرمه‌ای تیره متین', hex: '#0f172a' },
    { label: 'بنفش سلطنتی', hex: '#7c3aed' },
    { label: 'زرشکی رسمی', hex: '#991b1b' },
  ];

  return (
    <div className="max-w-4xl mx-auto w-full p-6 space-y-6 text-xs select-none">
      
      {/* سربرگ تم و رفتار */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
          <Palette className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">هویت بصری و رفتار فرم پس از ثبت</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            تنظیم رنگ سازمانی اختصاصی، فونت و ظاهر فرم، متن تشکر و تأییدیه، و هدایت خودکار کاربر پس از ثبت به سایت دیگر.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* استایل و تم سازمانی */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-slate-400" />
            <span>رنگ سازمانی و سبک گرافیکی</span>
          </h3>

          <div>
            <label className="block font-semibold text-slate-700 mb-2">انتخاب پالت رنگ سازمانی</label>
            <div className="flex flex-wrap gap-2 mb-3">
              {presetColors.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => handleUpdateTheme({ themeColor: c.hex })}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    theme.themeColor === c.hex ? 'scale-110 border-slate-900 ring-2 ring-blue-300' : 'border-white'
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.label}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={theme.themeColor}
                onChange={(e) => handleUpdateTheme({ themeColor: e.target.value })}
                className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
              />
              <span className="font-mono text-xs text-slate-600">{theme.themeColor}</span>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">میزان گردی گوشه‌ها (Border Radius)</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'sm', label: 'صنعتی (4px)' },
                { id: 'md', label: 'متعادل (8px)' },
                { id: 'lg', label: 'نرم (12px)' },
              ].map((r) => (
                <button
                  key={r.id}
                  onClick={() => handleUpdateTheme({ borderRadius: r.id as any })}
                  className={`py-2 px-3 rounded-lg border text-center font-medium transition-all ${
                    theme.borderRadius === r.id
                      ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* رفتار پس از ثبت */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
          <h3 className="font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>رفتار پس از ارسال نهایی</span>
          </h3>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">متن پیام تشکر و تاییدیه ثبت</label>
            <textarea
              rows={2}
              value={behavior.customSuccessMessage}
              onChange={(e) => handleUpdateBehavior({ customSuccessMessage: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white resize-none"
            />
          </div>

          <div className="space-y-3 pt-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={behavior.showSummaryAfterSubmit}
                onChange={(e) => handleUpdateBehavior({ showSummaryAfterSubmit: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="font-semibold text-slate-800">نمایش برگه خلاصه اطلاعات ثبت‌شده به کاربر</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={behavior.allowDownloadPdfReceipt}
                onChange={(e) => handleUpdateBehavior({ allowDownloadPdfReceipt: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="font-semibold text-slate-800">امکان دانلود مستقیم رسید PDF با بارکد</span>
            </label>

            <div className="pt-2 border-t border-slate-100 space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={behavior.redirectAfterSubmit}
                  onChange={(e) => handleUpdateBehavior({ redirectAfterSubmit: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="font-semibold text-slate-800">هدایت خودکار به نشانی اینترنتی دیگر (Redirect)</span>
              </label>

              {behavior.redirectAfterSubmit && (
                <div>
                  <input
                    type="url"
                    value={behavior.redirectUrl || ''}
                    onChange={(e) => handleUpdateBehavior({ redirectUrl: e.target.value })}
                    placeholder="https://yourwebsite.ir/thank-you"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono text-left bg-slate-50 text-xs"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
