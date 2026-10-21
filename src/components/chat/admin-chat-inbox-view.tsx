'use client';

import React, { useState } from 'react';
import { useForm } from '@/context/form-context';
import { MessageSquare, Send, CheckCircle2, User, Clock, Search } from 'lucide-react';
import { formatPersianDateTime, toPersianDigits } from '@/lib/persian';

export const AdminChatInboxView: React.FC = () => {
  const { forms, chatMessages, sendChatMessage } = useForm();
  const [selectedFormId, setSelectedFormId] = useState<string>(forms[0]?.id || '');
  const [replyText, setReplyText] = useState('');

  const currentForm = forms.find((f) => f.id === selectedFormId) || forms[0];
  const messages = chatMessages.filter((m) => m.formId === selectedFormId);

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    sendChatMessage(selectedFormId, 'admin', 'پشتیبانی کارشناس', replyText.trim());
    setReplyText('');
  };

  const handleQuickTemplate = (tmpl: string) => {
    setReplyText(tmpl);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-slate-50 select-none">
      
      {/* سربرگ کارتابل پشتیبانی */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              مرکز گفتگوی آنلاین با ثبت‌کنندگان فرم‌ها
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            مشاهده سوالات کاربران حین پر کردن فرم‌ها و ارسال پاسخ بلادرنگ
          </p>
        </div>

        <select
          value={selectedFormId}
          onChange={(e) => setSelectedFormId(e.target.value)}
          className="text-xs font-bold text-slate-900 border border-slate-300 rounded-lg px-3 py-2 bg-white max-w-xs focus:ring-1 focus:ring-blue-600"
        >
          {forms.map((f) => (
            <option key={f.id} value={f.id}>
              {f.title}
            </option>
          ))}
        </select>
      </div>

      {/* چت روم پشتیبانی */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[520px]">
        
        {/* نوار بالای چت روم */}
        <div className="p-4 border-b border-slate-200 bg-slate-50/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800">گفتگوهای مرتبط با: {currentForm?.title}</span>
            <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200 font-bold">
              {toPersianDigits(messages.length)} پیام
            </span>
          </div>
          <div className="text-[11px] text-slate-400">پاسخگویی آنلاین فعال</div>
        </div>

        {/* لیست پیام‌ها */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/40 text-xs">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs">
              پیامی برای این فرم ثبت نشده است. کاربران حین تکمیل فرم می‌توانند از دکمه چت پیام ارسال کنند.
            </div>
          ) : (
            messages.map((m) => {
              const isAdmin = m.sender === 'admin';
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${isAdmin ? 'items-end' : 'items-start'}`}
                >
                  <div className="flex items-center gap-2 mb-1 px-1 text-[11px] text-slate-400">
                    <span className="font-bold text-slate-700">{m.senderName}</span>
                    <span>•</span>
                    <span>{formatPersianDateTime(m.createdAt)}</span>
                  </div>
                  <div
                    className={`max-w-[75%] p-3.5 rounded-2xl leading-relaxed ${
                      isAdmin
                        ? 'bg-slate-900 text-white rounded-tl-none shadow-sm'
                        : 'bg-white text-slate-800 border border-slate-200 rounded-tr-none shadow-sm'
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* قالب‌های پاسخ سریع */}
        <div className="p-2.5 bg-slate-100 border-t border-slate-200 flex items-center gap-2 text-[11px] overflow-x-auto">
          <span className="text-slate-500 shrink-0">پاسخ‌های آماده:</span>
          {[
            'سلام، مدارک شما بررسی شد و مشکلی ندارد.',
            'لطفاً فیلد کد ملی را بدون خط فاصله وارد نمایید.',
            'پس از پرداخت، صورتحساب به ایمیل شما ارسال می‌گردد.',
            'وقت شما در سامانه ثبت شد و پیامک تایید ارسال خواهد شد.',
          ].map((tmpl, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleQuickTemplate(tmpl)}
              className="px-2.5 py-1 bg-white border border-slate-200 rounded-md hover:border-blue-400 hover:bg-blue-50/50 whitespace-nowrap text-slate-700 transition-colors"
            >
              {tmpl.slice(0, 30)}...
            </button>
          ))}
        </div>

        {/* فرم ارسال پیام کارشناس */}
        <form onSubmit={handleSendReply} className="p-4 bg-white border-t border-slate-200 flex gap-3 text-xs">
          <input
            type="text"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="پاسخ خود را به کاربر تایپ کنید..."
            className="flex-1 px-4 py-2.5 border border-slate-300 rounded-xl focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl flex items-center gap-2 shadow-sm transition-colors"
          >
            <Send className="w-4 h-4" />
            <span>ارسال پاسخ</span>
          </button>
        </form>

      </div>

    </div>
  );
};
