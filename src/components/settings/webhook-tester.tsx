'use client';

import React, { useState } from 'react';
import { useForm } from '@/context/form-context';
import { Webhook, Send, CheckCircle2, AlertCircle, RefreshCw, Code2 } from 'lucide-react';
import { formatPersianDateTime, toPersianDigits } from '@/lib/persian';

export const WebhookTester: React.FC = () => {
  const { webhookLogs, addWebhookLog, forms } = useForm();
  const [testUrl, setTestUrl] = useState('https://crm.paya.ir/api/v1/webhook-receiver');
  const [isSending, setIsSending] = useState(false);
  const [selectedLog, setSelectedLog] = useState<any>(webhookLogs[0] || null);

  const handleSendTestWebhook = () => {
    setIsSending(true);
    setTimeout(() => {
      setIsSending(false);
      const newEntry = {
        formId: forms[0]?.id || 'form-1',
        event: 'submission.created' as const,
        url: testUrl,
        payload: {
          event: 'submission.created',
          trackingCode: `FA-1403-${Math.floor(100000 + Math.random() * 900000)}`,
          formTitle: forms[0]?.title || 'فرم استخدامی',
          data: {
            applicant_name: 'علیرضا حسینی',
            national_code: '0019283746',
            mobile: '09121112233',
            submission_date: new Date().toISOString(),
          },
        },
        statusCode: 200,
        status: 'success' as const,
      };

      addWebhookLog(newEntry);
      setSelectedLog(newEntry);
    }, 1000);
  };

  return (
    <div className="space-y-6 text-xs select-none">
      
      {/* ارسال تست وب‌هوک */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
        <div>
          <span className="font-bold text-slate-900 block">شبیه‌ساز و ارسال درخواست آزمایشی وب‌هوک (POST)</span>
          <span className="text-[11px] text-slate-500">
            برای اطمینان از دریافت وب‌هوک توسط سرور حسابداری یا CRM خود، آدرس را وارد و روی ارسال کلیک فرمایید.
          </span>
        </div>

        <div className="flex gap-2">
          <input
            type="url"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            className="flex-1 px-3 py-2 border border-slate-300 rounded-lg font-mono text-left bg-white text-xs"
          />
          <button
            onClick={handleSendTestWebhook}
            disabled={isSending}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg flex items-center gap-2 shadow-sm transition-colors whitespace-nowrap"
          >
            {isSending ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>در حال ارسال...</span>
              </>
            ) : (
              <>
                <Send className="w-3.5 h-3.5 text-blue-400" />
                <span>ارسال پیلود تست</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* لیست رویدادها و لاگ‌های اخیر */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        
        {/* لیست لاگ‌ها */}
        <div className="md:col-span-5 bg-white rounded-xl border border-slate-200 p-3 space-y-2">
          <div className="font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
            <span>تاریخچه رویدادهای وب‌هوک</span>
            <span className="text-[10px] text-slate-400">{toPersianDigits(webhookLogs.length)} لاگ</span>
          </div>

          <div className="space-y-1.5 max-h-72 overflow-y-auto">
            {webhookLogs.map((log) => (
              <div
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                  selectedLog?.id === log.id
                    ? 'border-blue-600 bg-blue-50/40 font-bold'
                    : 'border-slate-200 bg-slate-50 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[11px] text-blue-700">{log.event}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold">
                    HTTP {log.statusCode}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 truncate font-mono" dir="ltr">
                  {log.url}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* پیش‌نمایش JSON ارسالی */}
        <div className="md:col-span-7 bg-slate-950 rounded-xl p-4 text-slate-200 font-mono text-[11px] space-y-2 overflow-x-auto shadow-inner">
          <div className="flex items-center justify-between text-slate-400 pb-2 border-b border-slate-800">
            <span className="flex items-center gap-1.5">
              <Code2 className="w-3.5 h-3.5 text-blue-400" />
              <span>محتوای بسته ارسالی (JSON Payload)</span>
            </span>
            <span className="text-emerald-400">Content-Type: application/json</span>
          </div>
          <pre className="text-emerald-400 pt-2 leading-relaxed" dir="ltr">
            {selectedLog ? JSON.stringify(selectedLog.payload, null, 2) : '// رویدادی انتخاب نشده است'}
          </pre>
        </div>

      </div>

    </div>
  );
};
