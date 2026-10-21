'use client';

import React from 'react';
import { Form, SecuritySettings, NotificationSettings } from '@/types/form';
import { ShieldCheck, Lock, BellRing, Smartphone, Globe, AlertTriangle } from 'lucide-react';
import { toPersianDigits } from '@/lib/persian';

interface SecuritySettingsTabProps {
  form: Form;
  onUpdateForm: (updated: Partial<Form>) => void;
}

export const SecuritySettingsTab: React.FC<SecuritySettingsTabProps> = ({ form, onUpdateForm }) => {
  const sec = form.security;
  const notif = form.notifications;

  const handleUpdateSec = (updated: Partial<SecuritySettings>) => {
    onUpdateForm({ security: { ...sec, ...updated } });
  };

  const handleUpdateNotif = (updated: Partial<NotificationSettings>) => {
    onUpdateForm({ notifications: { ...notif, ...updated } });
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-6 space-y-6">
      
      {/* هدر امنیت و کنترل دسترسی */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">محدودیت‌های ثبت، امنیت و اطلاع‌رسانی پیامکی</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            تعیین ظرفیت مجاز فرم، جلوگیری از ثبت نام‌های تکراری بر اساس کد ملی یا شماره همراه، و اتصال به وب‌سرویس پیامک و وب‌هوک.
          </p>
        </div>
      </div>

      {/* قوانین ثبت و محدودیت‌ها */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm space-y-4 text-xs">
        <h3 className="text-xs font-bold text-slate-900 pb-2 border-b border-slate-100">
          قوانین کنترل ظرفیت و ممانعت از ارسال تکراری
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
            <label className="font-bold text-slate-900 block">سقف کل ثبت‌های مجاز (ظرفیت فرم)</label>
            <p className="text-[11px] text-slate-500">پس از رسیدن به این تعداد، فرم به طور خودکار بسته می‌شود</p>
            <input
              type="number"
              value={sec.maxSubmissions || ''}
              onChange={(e) => handleUpdateSec({ maxSubmissions: Number(e.target.value) })}
              placeholder="مثال: ۲۵۰ (خالی = نامحدود)"
              className="w-full px-3 py-1.5 border border-slate-300 rounded-md bg-white font-mono text-left"
            />
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
            <label className="font-bold text-slate-900 block">کنترل آدرس IP و دستگاه</label>
            <p className="text-[11px] text-slate-500">جلوگیری از ارسال اسپم و ربات‌ها</p>
            <label className="flex items-center gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={sec.limitByIp}
                onChange={(e) => handleUpdateSec({ limitByIp: e.target.checked })}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="font-semibold text-slate-800">محدود کردن ثبت‌های مکرر از یک IP</span>
            </label>
          </div>

        </div>

        <div className="space-y-2 pt-2">
          <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={sec.onePerNationalCode}
              onChange={(e) => handleUpdateSec({ onePerNationalCode: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <div>
              <div className="font-semibold text-slate-900">یکتا بودن کد ملی (هر کد ملی فقط ۱ بار مجاز به ثبت است)</div>
              <div className="text-[11px] text-slate-500">از ورود مجدد کدهای ملی تکراری در کل سابقه فرم جلوگیری به عمل می‌آید</div>
            </div>
          </label>

          <label className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 bg-white cursor-pointer hover:bg-slate-50 transition-colors">
            <input
              type="checkbox"
              checked={sec.onePerMobile}
              onChange={(e) => handleUpdateSec({ onePerMobile: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <div>
              <div className="font-semibold text-slate-900">یکتا بودن شماره همراه (هر موبایل فقط ۱ ثبت)</div>
              <div className="text-[11px] text-slate-500">مناسب قرعه‌کشی‌ها، نظرسنجی‌ها و ثبت‌نام همایش</div>
            </div>
          </label>
        </div>

      </div>

      {/* اطلاع‌رسانی پیامکی و وب‌هوک */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm space-y-4 text-xs">
        <h3 className="text-xs font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
          <span>اطلاع‌رسانی پیامکی و وب‌هوک سازمانی</span>
          <span className="text-[10px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            سامانه پیامک ملی / کاوه‌نگار
          </span>
        </h3>

        <div className="space-y-4">
          <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-900">
            <input
              type="checkbox"
              checked={notif.smsAdminEnabled}
              onChange={(e) => handleUpdateNotif({ smsAdminEnabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span>ارسال پیامک آنی به مدیر پس از هر ثبت فرم</span>
          </label>

          {notif.smsAdminEnabled && (
            <div className="mr-6">
              <label className="block text-slate-600 mb-1">شماره همراه مدیر:</label>
              <input
                type="text"
                value={notif.adminMobile || ''}
                onChange={(e) => handleUpdateNotif({ adminMobile: e.target.value })}
                placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                className="w-full sm:w-64 px-3 py-1.5 border border-slate-300 rounded-md font-mono text-left"
              />
            </div>
          )}

          <div className="pt-2 border-t border-slate-100">
            <label className="block font-semibold text-slate-800 mb-1">آدرس وب‌هوک اختصاصی (Webhook URL)</label>
            <p className="text-[11px] text-slate-500 mb-2">اطلاعات هر ثبت جدید با متد POST به این آدرس ارسال می‌گردد (جهت اتصال به CRM و حسابداری)</p>
            <input
              type="url"
              value={notif.webhookUrl || ''}
              onChange={(e) => handleUpdateNotif({ webhookUrl: e.target.value })}
              placeholder="https://api.yourcompany.com/webhooks/form-submissions"
              className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-left text-xs bg-slate-50"
            />
          </div>
        </div>

      </div>

    </div>
  );
};
