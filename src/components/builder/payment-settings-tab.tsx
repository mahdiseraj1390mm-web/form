'use client';

import React from 'react';
import { Form, PaymentSettings } from '@/types/form';
import { CreditCard, ShieldCheck, CheckCircle2, Receipt, Building } from 'lucide-react';
import { toPersianDigits } from '@/lib/persian';

interface PaymentSettingsTabProps {
  form: Form;
  onUpdateForm: (updated: Partial<Form>) => void;
}

export const PaymentSettingsTab: React.FC<PaymentSettingsTabProps> = ({ form, onUpdateForm }) => {
  const payment = form.payment;

  const handleUpdate = (updated: Partial<PaymentSettings>) => {
    onUpdateForm({
      payment: {
        ...payment,
        ...updated,
      },
    });
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-6 space-y-6">
      
      {/* هدر ماژول پرداخت */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shrink-0">
          <CreditCard className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">ماژول فاکتورساز و درگاه پرداخت آنلاین</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            امکان اتصال فرم به شبکه پرداخت الکترونیک شاپرک (درگاه‌های مستقیم به‌پرداخت ملت، سداد، سامان و درگاه‌های واسط نظیر زرین‌پال و آیدی‌پی) همراه با صدور فاکتور و شناسه و کد پرونده بانکی.
          </p>
        </div>
      </div>

      {/* فعال‌سازی پرداخت */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="text-sm font-bold text-slate-900">فعال‌سازی پرداخت آنلاین در این فرم</div>
            <p className="text-xs text-slate-500 mt-0.5">کاربر پس از تکمیل فرم، به صفحه امن پرداخت هدایت خواهد شد</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={payment.enabled}
              onChange={(e) => handleUpdate({ enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {payment.enabled && (
          <div className="space-y-6 text-xs">
            
            {/* انتخاب درگاه بانکی */}
            <div>
              <label className="block font-bold text-slate-800 mb-2">درگاه پرداخت متصل</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  { id: 'shaparak_mellat', title: 'به‌پرداخت ملت (شاپرک)', desc: 'درگاه مستقیم شاپرکی' },
                  { id: 'zarinpal', title: 'زرین‌پال (ZarinPal)', desc: 'درگاه پرداخت تجاری واسط' },
                  { id: 'parsian', title: 'تجارت الکترونیک پارسیان', desc: 'درگاه مستقیم شاپرکی' },
                ].map((gw) => (
                  <button
                    key={gw.id}
                    onClick={() => handleUpdate({ gateway: gw.id as any })}
                    className={`p-3 rounded-lg border text-right transition-all flex flex-col justify-between ${
                      payment.gateway === gw.id
                        ? 'border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-600'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center justify-between">
                        <span>{gw.title}</span>
                        {payment.gateway === gw.id && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">{gw.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* شیوه تعیین مبلغ فاکتور */}
            <div>
              <label className="block font-bold text-slate-800 mb-2">شیوه محاسبه مبلغ پرداختی</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleUpdate({ type: 'fixed' })}
                  className={`p-3 rounded-lg border text-right transition-all ${
                    payment.type === 'fixed'
                      ? 'border-blue-600 bg-blue-50/30 ring-1 ring-blue-600'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="font-bold text-slate-900">مبلغ ثابت برای تمامی مراجعین</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">مثلاً هزینه ثبت‌نام، ورودی همایش یا رزرو ثابت</div>
                </button>

                <button
                  onClick={() => handleUpdate({ type: 'formula' })}
                  className={`p-3 rounded-lg border text-right transition-all ${
                    payment.type === 'formula'
                      ? 'border-blue-600 bg-blue-50/30 ring-1 ring-blue-600'
                      : 'border-slate-200 bg-white'
                  }`}
                >
                  <div className="font-bold text-slate-900">محاسبه بر اساس اقلام و گزینه‌ها</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">جمع خودکار مبالغ بر اساس انتخاب‌های کاربر در فیلدها</div>
                </button>
              </div>
            </div>

            {payment.type === 'fixed' && (
              <div>
                <label className="block font-semibold text-slate-700 mb-1">مبلغ ثابت قابل پرداخت (تومان)</label>
                <input
                  type="number"
                  value={payment.fixedAmount || 0}
                  onChange={(e) => handleUpdate({ fixedAmount: Number(e.target.value) })}
                  className="w-full sm:w-72 px-3 py-2 border border-slate-300 rounded-md font-mono text-left"
                  placeholder="مثلا: ۵۰۰,۰۰۰"
                />
              </div>
            )}

            <div>
              <label className="block font-semibold text-slate-700 mb-1">توضیحات فاکتور (در صفحه درگاه)</label>
              <textarea
                rows={2}
                value={payment.description || ''}
                onChange={(e) => handleUpdate({ description: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md"
                placeholder="توضیحاتی که به کاربر در پیش‌فاکتور نمایش داده می‌شود..."
              />
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
