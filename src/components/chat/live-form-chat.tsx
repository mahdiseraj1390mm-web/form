'use client';

import React, { useState } from 'react';
import { useForm } from '@/context/form-context';
import { MessageSquare, X, Send, User, ShieldCheck } from 'lucide-react';
import { formatPersianDateTime } from '@/lib/persian';

interface LiveFormChatProps {
  formId: string;
  formTitle: string;
}

export const LiveFormChat: React.FC<LiveFormChatProps> = ({ formId, formTitle }) => {
  const { chatMessages, sendChatMessage } = useForm();
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [senderName, setSenderName] = useState('');

  const messages = chatMessages.filter((m) => m.formId === formId);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const name = senderName.trim() || 'ثبت‌کننده فرم';
    sendChatMessage(formId, 'respondent', name, inputText.trim());
    setInputText('');

    // پاسخ شبیه‌سازی‌شده خودکار هوشمند پشتیبانی فرم
    setTimeout(() => {
      sendChatMessage(
        formId,
        'admin',
        'پشتیبان آنلاین فرم‌افزار',
        'پیام شما دریافت شد. در صورت نیاز به راهنمایی در مورد هر یک از فیلدها، پاسخگوی شما هستیم.'
      );
    }, 1500);
  };

  return (
    <div className="fixed bottom-6 left-6 z-40 select-none no-print">
      
      {/* پنجره گفتگوی آنلاین */}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-80 sm:w-96 h-[460px] flex flex-col overflow-hidden mb-3 animate-in slide-in-from-bottom duration-200 text-xs">
          
          {/* سربرگ چت */}
          <div className="bg-gradient-to-r from-slate-900 to-blue-900 p-4 text-white flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center border border-white/20">
                <MessageSquare className="w-4 h-4 text-blue-300" />
              </div>
              <div>
                <div className="font-bold text-xs truncate max-w-[200px]">گفتگوی آنلاین پشتیبانی</div>
                <div className="text-[10px] text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>پاسخگوی آنلاین آماده است</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-300 hover:text-white p-1 rounded"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* نام کاربر قبل از شروع پیام */}
          <div className="p-2 bg-slate-50 border-b border-slate-200">
            <input
              type="text"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="نام شما (اختیاری): مثال: مریم کاظمی"
              className="w-full px-2 py-1 bg-white border border-slate-200 rounded text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* لیست پیام‌ها */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-center text-slate-400 text-[11px] px-6">
                سوالی در مورد پر کردن این فرم دارید؟ در اینجا بپرسید تا همکاران ما فوراً راهنمایی کنند.
              </div>
            ) : (
              messages.map((m) => {
                const isAdmin = m.sender === 'admin';
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isAdmin ? 'items-start' : 'items-end'}`}
                  >
                    <span className="text-[10px] text-slate-400 mb-0.5 px-1">
                      {m.senderName}
                    </span>
                    <div
                      className={`max-w-[85%] p-3 rounded-2xl leading-relaxed text-xs ${
                        isAdmin
                          ? 'bg-white text-slate-800 border border-slate-200 rounded-tr-none shadow-sm'
                          : 'bg-blue-600 text-white rounded-tl-none shadow-sm'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* کادر ارسال پیام */}
          <form onSubmit={handleSendMessage} className="p-2.5 bg-white border-t border-slate-200 flex gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="پیام خود را بنویسید..."
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
            <button
              type="submit"
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg flex items-center justify-center transition-colors"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>

        </div>
      )}

      {/* دکمه شناور باز و بسته کردن چت */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-full shadow-xl flex items-center gap-2 border border-slate-700 hover:scale-105 active:scale-95 transition-all text-xs font-bold"
      >
        <MessageSquare className="w-4 h-4 text-blue-400" />
        <span>گفتگوی آنلاین با پشتیبان</span>
        {messages.filter((m) => !m.read && m.sender === 'admin').length > 0 && (
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
        )}
      </button>

    </div>
  );
};
