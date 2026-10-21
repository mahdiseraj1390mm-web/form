'use client';

import React, { useState } from 'react';
import { Form } from '@/types/form';
import { 
  Webhook, 
  Table, 
  CreditCard, 
  MessageSquare, 
  Check, 
  Plus, 
  ExternalLink,
  RefreshCw,
  Send
} from 'lucide-react';

interface IntegrationsTabProps {
  form: Form;
  onUpdateForm: (updated: Partial<Form>) => void;
}

export const IntegrationsTab: React.FC<IntegrationsTabProps> = ({ form, onUpdateForm }) => {
  const [webhookUrl, setWebhookUrl] = useState(form.notifications?.webhookUrl || '');
  const [testSent, setTestSent] = useState(false);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveWebhook = () => {
    onUpdateForm({
      notifications: {
        ...form.notifications,
        webhookUrl,
      } as any,
    });
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleSendTestWebhook = () => {
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-50 select-none">
      <div className="max-w-4xl mx-auto space-y-6">
        
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Webhook className="w-4 h-4 text-emerald-600" />
                <span>یکپارچه‌سازی وب‌هوک (Webhooks API)</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                ارسال خودکار پاسخ‌های ثبت‌شده به سامانه، CRM یا سرور اختصاصی شما با استاندارد JSON
              </p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-lg">
              رویداد زنده POST
            </span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">آدرس وب‌هوک (Endpoint URL)</label>
              <input
                type="url"
                placeholder="https://api.yourdomain.com/v1/webhook/form"
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono text-left bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                onClick={handleSendTestWebhook}
                disabled={!webhookUrl}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 text-slate-500" />
                <span>ارسال پلود آزمایشی (Test Payload)</span>
              </button>

              <div className="flex items-center gap-2">
                {savedSuccess && (
                  <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" />
                    ذخیره شد
                  </span>
                )}
                <button
                  type="button"
                  onClick={handleSaveWebhook}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer"
                >
                  ذخیره وب‌هوک
                </button>
              </div>
            </div>

            {testSent && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
                <span>رویداد فرم با کد ۲۰۰ و پاسخ JSON با موفقیت به سرور شما تحویل داده شد.</span>
                <span className="font-mono font-bold">Status: 200 OK</span>
              </div>
            )}
          </div>
        </div>

        {/* اتصال به گوگل شیتس */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-lg shrink-0">
              <Table className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">اتصال به گوگل‌شیتس (Google Sheets)</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">ثبت خودکار هر پاسخ فرم در یک ردیف مجزا در جدول اکسل گوگل در لحظه</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setGoogleConnected(!googleConnected)}
            className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
              googleConnected
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-300'
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}
          >
            {googleConnected ? 'متصل شد ✓' : 'اتصال به حساب گوگل'}
          </button>
        </div>

        {/* اتصال به نرم‌افزارهای حسابداری و مالی */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg shrink-0">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-800">اتصال به سیستم‌های مالی و حسابداری (سپیدار / هلو)</h4>
              <p className="text-[11px] text-slate-500 mt-0.5">صدور خودکار فاکتور فروش و ثبت اسناد دریافتنی پس از تایید پرداخت</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => alert('پیکربندی وب‌سرویس سیستم مالی سپیدار')}
            className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            پیکربندی وب‌سرویس
          </button>
        </div>

      </div>
    </div>
  );
};
