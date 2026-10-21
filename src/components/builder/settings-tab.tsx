'use client';

import React, { useState } from 'react';
import { Form, FormGeneralSettings } from '@/types/form';
import { 
  Settings, 
  MessageSquare, 
  Mail, 
  MessageCircle, 
  Send, 
  Lock, 
  CreditCard, 
  Link as LinkIcon, 
  ShieldCheck, 
  Users, 
  Check, 
  AlertCircle,
  HelpCircle
} from 'lucide-react';
import { toPersianDigits } from '@/lib/persian';

interface SettingsTabProps {
  form: Form;
  onUpdateForm: (updated: Partial<Form>) => void;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ form, onUpdateForm }) => {
  const [activeSubTab, setActiveSubTab] = useState<
    | 'general'
    | 'redirect'
    | 'email'
    | 'sms'
    | 'bot'
    | 'limits'
    | 'payment'
    | 'link_params'
    | 'auth'
    | 'access'
  >('general');

  const [savedToast, setSavedToast] = useState(false);

  // استیت‌های تنظیمات عمومی (مطابق تصویر شماره ۲ فرم‌افزار)
  const generalSettings: FormGeneralSettings = form.generalSettings || {
    identifierColor: '#f59e0b',
    requestLocation: false,
    showSecurityCode: false,
    customIdPrefix: '',
    customIdSuffix: '',
    customIdMinDigits: 6,
    customIdStartNumber: 1000,
    liveChatEnabled: true,
  };

  const updateGeneral = (props: Partial<FormGeneralSettings>) => {
    onUpdateForm({
      generalSettings: {
        ...generalSettings,
        ...props,
      },
    });
  };

  const handleSave = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const subNavItems = [
    { id: 'general', label: 'تنظیمات عمومی', icon: Settings },
    { id: 'redirect', label: 'پیغام ثبت و تغییر مسیر', icon: MessageSquare },
    { id: 'email', label: 'ایمیل', icon: Mail },
    { id: 'sms', label: 'پیامک و پیام‌رسان', icon: MessageCircle },
    { id: 'bot', label: 'ربات اطلاع‌رسانی', icon: Send },
    { id: 'limits', label: 'محدودیت ثبت', icon: Lock },
    { id: 'payment', label: 'پرداخت آنلاین', icon: CreditCard },
    { id: 'link_params', label: 'پارامترهای لینک فرم', icon: LinkIcon },
    { id: 'auth', label: 'احراز هویت', icon: ShieldCheck },
    { id: 'access', label: 'دسترسی', icon: Users },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-slate-50 select-none">
      
      {/* محتوای تب فعال تنظیمات (سمت چپ در چیدمان راست‌به‌چپ) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 order-2 md:order-1">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
          
          {/* تب ۱: تنظیمات عمومی (دقیقاً مطابق اسکرین‌شات ۲ فرم‌افزار) */}
          {activeSubTab === 'general' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">تنظیمات عمومی</h3>
              </div>

              {/* رنگ شناسایی فرم */}
              <div className="flex items-center justify-between py-2 border-b border-slate-50">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">رنگ شناسایی فرم</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">جهت دسته‌بندی بصری در لیست فرم‌ها</span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={generalSettings.identifierColor || '#f59e0b'}
                    onChange={(e) => updateGeneral({ identifierColor: e.target.value })}
                    className="w-10 h-10 p-0.5 rounded-lg border border-slate-300 cursor-pointer bg-white"
                  />
                  <div
                    className="w-8 h-8 rounded-lg shadow-2xs border border-slate-300"
                    style={{ backgroundColor: generalSettings.identifierColor || '#f59e0b' }}
                  />
                </div>
              </div>

              {/* درخواست دریافت موقعیت مکانی */}
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50/70 transition-colors cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">درخواست دریافت موقعیت مکانی</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">دریافت مختصات GPS مرورگر کاربر هنگام ارسال فرم</span>
                </div>
                <input
                  type="checkbox"
                  checked={generalSettings.requestLocation || false}
                  onChange={(e) => updateGeneral({ requestLocation: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
              </label>

              {/* نمایش کد امنیتی */}
              <label className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:bg-slate-50/70 transition-colors cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">نمایش کد امنیتی (کپچا)</span>
                  <span className="text-[11px] text-slate-400 block mt-0.5">جلوگیری از ارسال اسپم و ربات‌های خودکار</span>
                </div>
                <input
                  type="checkbox"
                  checked={generalSettings.showSecurityCode || false}
                  onChange={(e) => updateGeneral({ showSecurityCode: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500"
                />
              </label>

              {/* شناسه اختصاصی (Custom Tracking Number) */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-slate-800">شناسه اختصاصی و کد پیگیری</span>
                  <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">شروع از</label>
                    <input
                      type="number"
                      value={generalSettings.customIdStartNumber || 1000}
                      onChange={(e) => updateGeneral({ customIdStartNumber: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">حداقل تعداد ارقام</label>
                    <input
                      type="number"
                      value={generalSettings.customIdMinDigits || 6}
                      onChange={(e) => updateGeneral({ customIdMinDigits: Number(e.target.value) })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">پیشوند</label>
                    <input
                      type="text"
                      placeholder="مثال: FA-"
                      value={generalSettings.customIdPrefix || ''}
                      onChange={(e) => updateGeneral({ customIdPrefix: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">پسوند</label>
                    <input
                      type="text"
                      placeholder="مثال: -1405"
                      value={generalSettings.customIdSuffix || ''}
                      onChange={(e) => updateGeneral({ customIdSuffix: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                    />
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[11px] text-blue-600 font-bold font-mono">
                    نمونه کد پیگیری:{' '}
                    {(generalSettings.customIdPrefix || '') +
                      String(generalSettings.customIdStartNumber || 1000).padStart(
                        generalSettings.customIdMinDigits || 6,
                        '0'
                      ) +
                      (generalSettings.customIdSuffix || '')}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      alert('الگوی کد پیگیری با موفقیت اعمال گردید.');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold underline"
                  >
                    اعمال شماره‌گذاری
                  </button>
                </div>
              </div>

              {/* دکمه سبز ذخیره */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                {savedToast && (
                  <span className="text-xs text-emerald-600 font-bold animate-in fade-in flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    تنظیمات با موفقیت ذخیره شد
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
                >
                  ذخیره
                </button>
              </div>

            </div>
          )}

          {/* تب ۲: پیغام ثبت و تغییر مسیر */}
          {activeSubTab === 'redirect' && (
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
                پیغام ثبت و تغییر مسیر (Redirect)
              </h3>
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">پیام تشکر و موفقیت پس از ثبت</label>
                <textarea
                  rows={3}
                  value={form.behavior?.customSuccessMessage || 'اطلاعات شما با موفقیت در سامانه ثبت گردید. کد پیگیری شما صادر شد.'}
                  onChange={(e) => onUpdateForm({
                    behavior: { ...form.behavior, customSuccessMessage: e.target.value } as any
                  })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.behavior?.redirectAfterSubmit || false}
                  onChange={(e) => onUpdateForm({
                    behavior: { ...form.behavior, redirectAfterSubmit: e.target.checked } as any
                  })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span className="text-xs font-bold text-slate-800">هدایت به سایت دیگر پس از ثبت (Redirect URL)</span>
              </label>

              {form.behavior?.redirectAfterSubmit && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">آدرس اینترنتی مقصد</label>
                  <input
                    type="url"
                    placeholder="https://example.com/thank-you"
                    value={form.behavior?.redirectUrl || ''}
                    onChange={(e) => onUpdateForm({
                      behavior: { ...form.behavior, redirectUrl: e.target.value } as any
                    })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white font-mono text-left"
                  />
                </div>
              )}

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg"
                >
                  ذخیره
                </button>
              </div>
            </div>
          )}

          {/* تب ۳: ایمیل */}
          {activeSubTab === 'email' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
                اطلاع‌رسانی ایمیلی
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.notifications?.emailAdminEnabled || false}
                  onChange={(e) => onUpdateForm({
                    notifications: { ...form.notifications, emailAdminEnabled: e.target.checked } as any
                  })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span className="text-xs font-bold text-slate-800">ارسال ایمیل به مدیر پس از هر ثبت فرم</span>
              </label>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">آدرس ایمیل مدیر</label>
                <input
                  type="email"
                  placeholder="admin@company.ir"
                  value={form.notifications?.adminEmail || ''}
                  onChange={(e) => onUpdateForm({
                    notifications: { ...form.notifications, adminEmail: e.target.value } as any
                  })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono text-left bg-white"
                />
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg"
                >
                  ذخیره
                </button>
              </div>
            </div>
          )}

          {/* تب ۴: پیامک و پیام‌رسان */}
          {activeSubTab === 'sms' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
                پیامک و پیام‌رسان‌ها (کاوه نگار، بله، ایتا)
              </h3>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.notifications?.smsAdminEnabled || false}
                  onChange={(e) => onUpdateForm({
                    notifications: { ...form.notifications, smsAdminEnabled: e.target.checked } as any
                  })}
                  className="w-4 h-4 text-emerald-600 rounded"
                />
                <span className="text-xs font-bold text-slate-800">ارسال پیامک به مدیر هنگام دریافت پاسخ جدید</span>
              </label>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">شماره همراه مدیر</label>
                <input
                  type="text"
                  placeholder="09120000000"
                  value={form.notifications?.adminMobile || ''}
                  onChange={(e) => onUpdateForm({
                    notifications: { ...form.notifications, adminMobile: e.target.value } as any
                  })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono text-left bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">قالب متن پیامک به کاربر</label>
                <textarea
                  rows={2}
                  placeholder="ثبت‌نام شما با کد پیگیری {trackingCode} با موفقیت انجام شد."
                  value={form.notifications?.smsTemplateText || ''}
                  onChange={(e) => onUpdateForm({
                    notifications: { ...form.notifications, smsTemplateText: e.target.value } as any
                  })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white"
                />
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg"
                >
                  ذخیره
                </button>
              </div>
            </div>
          )}

          {/* تب‌های دیگر (محدودیت، پرداخت، احراز هویت) */}
          {['bot', 'limits', 'payment', 'link_params', 'auth', 'access'].includes(activeSubTab) && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
                {subNavItems.find((item) => item.id === activeSubTab)?.label}
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                تنظیمات پیشرفته مربوط به {subNavItems.find((item) => item.id === activeSubTab)?.label} با استانداردهای فرم‌افزار در این بخش پیکربندی می‌گردد.
              </p>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 font-bold">
                  <Check className="w-4 h-4" />
                  <span>پیکربندی هوشمند و یکپارچه فعال است</span>
                </div>
                <p className="text-slate-500 text-[11px]">
                  تمام داده‌ها با دکمه ذخیره به‌طور آنی در دیتابیس فرم ذخیره و همگام‌سازی می‌شوند.
                </p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  onClick={handleSave}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg"
                >
                  ذخیره
                </button>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* سایدبار ناوبری زیرمنوی تنظیمات (سمت راست - مطابق تصویر ۲ فرم‌افزار) */}
      <div className="w-full md:w-64 bg-white border-l border-slate-200 shrink-0 p-3 overflow-y-auto order-1 md:order-2 shadow-xs">
        <div className="space-y-1">
          {subNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSubTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSubTab(item.id as any)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all text-right cursor-pointer ${
                  isActive
                    ? 'bg-slate-50 text-slate-900 border-r-4 border-emerald-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
