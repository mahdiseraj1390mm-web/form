'use client';

import React from 'react';
import { Form, PrintTemplateSettings } from '@/types/form';
import { Printer, QrCode, FileText, CheckCircle2 } from 'lucide-react';
import { toPersianDigits } from '@/lib/persian';

interface PrintTemplateTabProps {
  form: Form;
  onUpdateForm: (updated: Partial<Form>) => void;
}

export const PrintTemplateTab: React.FC<PrintTemplateTabProps> = ({ form, onUpdateForm }) => {
  const print = form.printTemplate;

  const handleUpdate = (updated: Partial<PrintTemplateSettings>) => {
    onUpdateForm({
      printTemplate: {
        ...print,
        ...updated,
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-6 space-y-6">
      
      {/* هدر ماژول قالب چاپ */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shrink-0">
          <Printer className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">طراح قالب‌های چاپ رسمی و صدور PDF</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            تنظیم سربرگ رسمی، بارکد دوبعدی (QR Code) جهت استعلام اصالت، کدهای رهگیری، و چاپ دسته‌جمعی یا تکی فرم‌های ارسالی.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* پنل تنظیمات قالب */}
        <div className="lg:col-span-5 bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-slate-800 mb-1">عنوان سربرگ چاپی</label>
            <input
              type="text"
              value={print.headerTitle}
              onChange={(e) => handleUpdate({ headerTitle: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-800 mb-1">متن پاورقی سند رسمی</label>
            <textarea
              rows={2}
              value={print.customFooterText || ''}
              onChange={(e) => handleUpdate({ customFooterText: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-md"
              placeholder="شامل قوانین یا اعلام محرمانگی..."
            />
          </div>

          <div className="space-y-2 pt-2 border-t border-slate-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={print.showQrCode}
                onChange={(e) => handleUpdate({ showQrCode: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="font-medium text-slate-800">درج بارکد QR استعلام الکترونیک</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={print.showTrackingCode}
                onChange={(e) => handleUpdate({ showTrackingCode: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="font-medium text-slate-800">درج کد پیگیری و شماره ثبت یکتا</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={print.showDate}
                onChange={(e) => handleUpdate({ showDate: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="font-medium text-slate-800">درج تاریخ و ساعت ثبت به شمسی</span>
            </label>
          </div>
        </div>

        {/* پیش‌نمایش برگه چاپی رسمی A4 */}
        <div className="lg:col-span-7 bg-white p-8 rounded-xl border border-slate-300 shadow-md min-h-[460px] flex flex-col justify-between text-xs font-serif select-none">
          
          {/* سربرگ برگه A4 */}
          <div className="border-b-2 border-slate-900 pb-4">
            <div className="flex items-center justify-between">
              <div className="text-right">
                <div className="text-base font-extrabold text-slate-900">{print.headerTitle}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">سامانه جامع فرم‌های سازمانی کشور</div>
              </div>

              {print.showQrCode && (
                <div className="w-14 h-14 border border-slate-300 rounded p-1 flex items-center justify-center bg-slate-50">
                  <QrCode className="w-10 h-10 text-slate-800" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-600 pt-3 font-sans">
              {print.showTrackingCode && <span>شماره ثبت: FA-1403-XXXXXX</span>}
              {print.showDate && <span>تاریخ صدور: ۲۸ فروردین ۱۴۰۳</span>}
              <span>وضعیت: نهایی و معتبر</span>
            </div>
          </div>

          {/* محتوای پیش‌نمایش اقلام */}
          <div className="py-6 space-y-3 font-sans">
            <div className="text-[11px] font-bold text-slate-700 bg-slate-100 p-1.5 rounded">
              مشخصات ثبت شده در فرم
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              {form.fields.slice(0, 4).map((f) => (
                <div key={f.id} className="p-2 border border-slate-200 rounded flex justify-between">
                  <span className="text-slate-500">{f.label}:</span>
                  <span className="font-semibold text-slate-900">اطلاعات کاربر</span>
                </div>
              ))}
            </div>
          </div>

          {/* پاورقی برگه چاپی */}
          <div className="border-t border-slate-300 pt-3 text-[10px] text-slate-500 text-center font-sans">
            {print.customFooterText || 'این سند به صورت سیستمی تولید شده و فاقد خط‌خوردگی است.'}
          </div>

        </div>

      </div>

    </div>
  );
};
