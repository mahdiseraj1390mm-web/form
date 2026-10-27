'use client';

import React, { useState, useEffect } from 'react';
import { 
  Smartphone, 
  Key, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Save, 
  RefreshCw, 
  MessageSquare, 
  Clock, 
  Check, 
  ShieldCheck, 
  FileText,
  Copy,
  Info
} from 'lucide-react';
import { SmsSettings, SmsLogEntry } from '@/lib/sms-service';

export const SmsSettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<SmsSettings | null>(null);
  const [logs, setLogs] = useState<SmsLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  // وضعیت تست پیامک برای هر الگو
  const [testPhones, setTestPhones] = useState<Record<string, string>>({
    case_registration: '',
    appointment_client: '',
    appointment_counselor: '',
  });
  const [testingKey, setTestingKey] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { success: boolean; message: string }>>({});

  // بارگذاری تنظیمات و لاگ‌ها
  const loadData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/settings/sms');
      const data = await res.json();
      if (data.success) {
        setSettings(data.settings);
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error('Failed to load SMS settings:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ذخیره تنظیمات در دیتابیس
  const handleSave = async () => {
    if (!settings) return;
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const res = await fetch('/api/settings/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save', settings }),
      });
      const data = await res.json();
      if (data.success) {
        setSaveStatus({ type: 'success', message: 'تنظیمات و الگوهای پیامک با موفقیت ذخیره شدند.' });
        setTimeout(() => setSaveStatus(null), 4000);
      } else {
        setSaveStatus({ type: 'error', message: data.error || 'خطا در ذخیره تنظیمات' });
      }
    } catch (err: any) {
      setSaveStatus({ type: 'error', message: err.message || 'خطا در ارتباط با سرور' });
    } finally {
      setIsSaving(false);
    }
  };

  // ارسال پیامک آزمایشی برای یک الگوی خاص
  const handleTestSend = async (patternKey: string) => {
    const phone = testPhones[patternKey];
    if (!phone || phone.length < 10) {
      alert('لطفاً شماره موبایل معتبر (مثلاً 0912xxxxxxx) برای ارسال تست وارد فرمایید.');
      return;
    }

    setTestingKey(patternKey);
    setTestResults((prev) => ({ ...prev, [patternKey]: { success: false, message: 'در حال ارسال پیامک آزمایشی...' } }));

    try {
      const res = await fetch('/api/settings/sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test',
          patternKey,
          mobile: phone,
          args: patternKey === 'case_registration' 
            ? ['SP260120']
            : patternKey === 'appointment_client'
            ? ['مراجع آزمایشی', 'دکتر علیرضا برهانی', '1405/08/10', '16:00 عصر']
            : ['مهدی سراج', phone, '1405/08/10', '16:00 عصر'],
        }),
      });
      const data = await res.json();
      if (data.success) {
        setTestResults((prev) => ({
          ...prev,
          [patternKey]: { success: true, message: 'پیامک تستی با موفقیت ارسال و تحویل شد.' },
        }));
        loadData(); // به‌روزرسانی جدول لاگ
      } else {
        setTestResults((prev) => ({
          ...prev,
          [patternKey]: { success: false, message: data.result?.providerResponse?.code ? `کد خطای پنل: ${data.result.providerResponse.code}` : 'ارسال ناموفق بود. اعتبار یا تنظیمات وب‌سرویس را چک کنید.' },
        }));
      }
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [patternKey]: { success: false, message: err.message || 'خطا در برقراری ارتباط' },
      }));
    } finally {
      setTestingKey(null);
    }
  };

  if (isLoading || !settings) {
    return (
      <div className="flex items-center justify-center p-12 text-slate-500 gap-3">
        <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
        <span>در حال بارگذاری تنظیمات پیامک و وب‌سرویس...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-xs max-w-4xl">
      {/* اعلان وضعیت ذخیره‌سازی */}
      {saveStatus && (
        <div
          className={`p-4 rounded-xl flex items-center justify-between border ${
            saveStatus.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {saveStatus.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="font-bold text-sm">{saveStatus.message}</span>
          </div>
        </div>
      )}

      {/* ۱. تنظیمات اتصال به درگاه پیامک */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <Key className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-900">تنظیمات درگاه و وب‌سرویس پیامک</h3>
              <p className="text-[11px] text-slate-500">مشخصات اتصال به پنل پیامکی جهت ارسال خودکار پیامک‌های خدماتی</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ارسال پترن خدماتی (عبور از بلک‌لیست)</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block font-bold text-slate-700 mb-1">ارائه‌دهنده سرویس</label>
            <select
              value={settings.provider}
              onChange={(e) => setSettings({ ...settings, provider: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-semibold"
            >
              <option value="melipayamak">ملی پیامک (Melipayamak BaseNumber)</option>
              <option value="kavenegar">کاوه‌نگار (Kavenegar)</option>
              <option value="farapayamak">فراپیامک (Farapayamak)</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">نام کاربری سامانه پیامک (Username)</label>
            <input
              type="text"
              value={settings.username}
              onChange={(e) => setSettings({ ...settings, username: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-mono text-left"
              placeholder="مثال: 0912xxxxxxx"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">کلمه عبور یا کلید وب‌سرویس (Password)</label>
            <input
              type="password"
              value={settings.password}
              onChange={(e) => setSettings({ ...settings, password: e.target.value })}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-xs font-mono text-left"
              placeholder="API Key یا Password"
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between text-[11px] text-slate-500 bg-white p-3 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              سیستم به صورت خودکار از متد <strong>SendByBaseNumber2</strong> ملی‌پیامک استفاده می‌کند تا پیامک‌ها در کمتر از ۵ ثانیه حتی به خطوط دارای پیامک تبلیغاتی مسدود (بلک‌لیست) تحویل شوند.
            </span>
          </div>
        </div>
      </div>

      {/* ۲. ویرایشگر قالب‌ها و الگوهای پیامک */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-base text-slate-900 flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>مدیریت متن پیامک‌ها و کدهای الگو (Patterns)</span>
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              متن‌ها، کدهای پترن و ترتیب متغیرها را بدون نیاز به کدنویسی ویرایش و مستقیماً تست کنید.
            </p>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow transition-all active:scale-95 disabled:opacity-50 cursor-pointer text-xs"
          >
            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>ذخیره تغییرات الگوها</span>
          </button>
        </div>

        {/* لیست الگوها */}
        <div className="space-y-5">
          {/* الگوی ۱: ثبت پرونده */}
          {settings.patterns.case_registration && (
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 hover:border-blue-300 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span className="font-black text-sm text-slate-900">
                    ۱. {settings.patterns.case_registration.title}
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full font-bold">
                    ارسال به مراجع
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-600">کد الگو (Body ID):</span>
                  <input
                    type="number"
                    value={settings.patterns.case_registration.bodyId}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      setSettings({
                        ...settings,
                        patterns: {
                          ...settings.patterns,
                          case_registration: { ...settings.patterns.case_registration, bodyId: val },
                        },
                      });
                    }}
                    className="w-28 px-2.5 py-1.5 border border-slate-300 rounded-lg text-center font-mono font-bold bg-slate-50 text-xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700">متن الگو / پیامک جایگزین:</label>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-400">متغیرهای در دسترس:</span>
                    {settings.patterns.case_registration.variables?.map((v, i) => (
                      <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-mono text-[10px] border border-slate-200">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
                <textarea
                  rows={4}
                  value={settings.patterns.case_registration.template}
                  onChange={(e) => {
                    const text = e.target.value;
                    setSettings({
                      ...settings,
                      patterns: {
                        ...settings.patterns,
                        case_registration: { ...settings.patterns.case_registration, template: text },
                      },
                    });
                  }}
                  className="w-full p-3 border border-slate-300 rounded-xl bg-white font-sans text-xs leading-relaxed focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  dir="rtl"
                />
              </div>

              {/* کادر تست ارسال */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">ارسال تست فوری:</span>
                  <input
                    type="text"
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    value={testPhones.case_registration}
                    onChange={(e) => setTestPhones({ ...testPhones, case_registration: e.target.value })}
                    className="w-36 px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-mono text-left"
                  />
                  <button
                    type="button"
                    onClick={() => handleTestSend('case_registration')}
                    disabled={testingKey === 'case_registration'}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {testingKey === 'case_registration' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>ارسال تست</span>
                  </button>
                </div>

                {testResults.case_registration && (
                  <span className={`text-[11px] font-bold ${testResults.case_registration.success ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {testResults.case_registration.message}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* الگوی ۲: تایید نوبت برای مراجع */}
          {settings.patterns.appointment_client && (
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 shadow-sm space-y-4 hover:border-emerald-300 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="font-black text-sm text-slate-900">
                    ۲. {settings.patterns.appointment_client.title}
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold">
                    ارسال به مراجع
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-600">کد الگو (Body ID):</span>
                  <input
                    type="number"
                    value={settings.patterns.appointment_client.bodyId}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      setSettings({
                        ...settings,
                        patterns: {
                          ...settings.patterns,
                          appointment_client: { ...settings.patterns.appointment_client, bodyId: val },
                        },
                      });
                    }}
                    className="w-28 px-2.5 py-1.5 border border-slate-300 rounded-lg text-center font-mono font-bold bg-slate-50 text-xs"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700">متن الگو / پیامک تایید نوبت:</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-slate-400">متغیرها به ترتیب:</span>
                    {settings.patterns.appointment_client.variables?.map((v, i) => (
                      <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 rounded font-mono text-[10px] border border-emerald-200">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
                <textarea
                  rows={5}
                  value={settings.patterns.appointment_client.template}
                  onChange={(e) => {
                    const text = e.target.value;
                    setSettings({
                      ...settings,
                      patterns: {
                        ...settings.patterns,
                        appointment_client: { ...settings.patterns.appointment_client, template: text },
                      },
                    });
                  }}
                  className="w-full p-3 border border-slate-300 rounded-xl bg-white font-sans text-xs leading-relaxed focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  dir="rtl"
                />
              </div>

              {/* کادر تست ارسال */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">ارسال تست فوری:</span>
                  <input
                    type="text"
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    value={testPhones.appointment_client}
                    onChange={(e) => setTestPhones({ ...testPhones, appointment_client: e.target.value })}
                    className="w-36 px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-mono text-left"
                  />
                  <button
                    type="button"
                    onClick={() => handleTestSend('appointment_client')}
                    disabled={testingKey === 'appointment_client'}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {testingKey === 'appointment_client' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>ارسال تست</span>
                  </button>
                </div>

                {testResults.appointment_client && (
                  <span className={`text-[11px] font-bold ${testResults.appointment_client.success ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {testResults.appointment_client.message}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* الگوی ۳: اطلاع‌رسانی نوبت به مشاور */}
          {settings.patterns.appointment_counselor && (
            <div className="bg-white border-2 border-indigo-200 rounded-2xl p-5 shadow-sm space-y-4 hover:border-indigo-400 transition-colors">
              <div className="flex items-center justify-between pb-3 border-b border-indigo-100">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                  <span className="font-black text-sm text-slate-900">
                    ۳. {settings.patterns.appointment_counselor.title}
                  </span>
                  <span className="text-[11px] px-2.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-full font-bold">
                    ارسال به شماره موبایل مشاور
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-600">کد الگو (Body ID):</span>
                  <input
                    type="number"
                    value={settings.patterns.appointment_counselor.bodyId}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10) || 0;
                      setSettings({
                        ...settings,
                        patterns: {
                          ...settings.patterns,
                          appointment_counselor: { ...settings.patterns.appointment_counselor, bodyId: val },
                        },
                      });
                    }}
                    className="w-28 px-2.5 py-1.5 border border-indigo-300 rounded-lg text-center font-mono font-bold bg-indigo-50 text-xs text-indigo-950"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-slate-700">متن الگو / پیامک به مشاور:</label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-slate-400">ترتیب دقیق متغیرها:</span>
                    {settings.patterns.appointment_counselor.variables?.map((v, i) => (
                      <span key={i} className="px-2 py-0.5 bg-indigo-50 text-indigo-800 rounded font-mono text-[10px] border border-indigo-200">
                        {v}
                      </span>
                    ))}
                  </div>
                </div>
                <textarea
                  rows={5}
                  value={settings.patterns.appointment_counselor.template}
                  onChange={(e) => {
                    const text = e.target.value;
                    setSettings({
                      ...settings,
                      patterns: {
                        ...settings.patterns,
                        appointment_counselor: { ...settings.patterns.appointment_counselor, template: text },
                      },
                    });
                  }}
                  className="w-full p-3 border border-slate-300 rounded-xl bg-white font-sans text-xs leading-relaxed focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  dir="rtl"
                />
              </div>

              {/* راهنمای تطبیق دقیق جهت جلوگیری از تداخل شهر و تاریخ */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed">
                📌 <strong>نکته مهم در الگوی مشاور:</strong> متغیرهای ارسالی به ملی‌پیامک دقیقاً به ترتیب <code>[نام مراجع, شماره تماس مراجع, تاریخ نوبت, ساعت نوبت]</code> ارسال می‌شوند تا تاریخ و شماره مراجع دقیقاً در جای خود در متن پیامک مشاور بنشینند.
              </div>

              {/* کادر تست ارسال */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-700">ارسال تست به مشاور:</span>
                  <input
                    type="text"
                    placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                    value={testPhones.appointment_counselor}
                    onChange={(e) => setTestPhones({ ...testPhones, appointment_counselor: e.target.value })}
                    className="w-36 px-2.5 py-1.5 border border-slate-300 rounded-lg bg-white text-xs font-mono text-left"
                  />
                  <button
                    type="button"
                    onClick={() => handleTestSend('appointment_counselor')}
                    disabled={testingKey === 'appointment_counselor'}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {testingKey === 'appointment_counselor' ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>ارسال تست به شماره</span>
                  </button>
                </div>

                {testResults.appointment_counselor && (
                  <span className={`text-[11px] font-bold ${testResults.appointment_counselor.success ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {testResults.appointment_counselor.message}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ۳. گزارش آخرین پیامک‌های ارسالی سیستم */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-600" />
            <h4 className="font-extrabold text-sm text-slate-900">گزارش آخرین پیامک‌های ارسالی سیستم</h4>
          </div>
          <button
            type="button"
            onClick={loadData}
            className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-800 text-xs font-bold"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>بازخوانی گزارشات</span>
          </button>
        </div>

        {logs.length === 0 ? (
          <div className="text-center py-6 text-slate-400">هنوز پیامکی در سیستم لاگ نشده است.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-bold bg-slate-50/50">
                  <th className="py-2.5 px-3">زمان ارسال</th>
                  <th className="py-2.5 px-3">شماره گیرنده</th>
                  <th className="py-2.5 px-3">نوع پیامک</th>
                  <th className="py-2.5 px-3">کد الگو</th>
                  <th className="py-2.5 px-3">وضعیت ارسال</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                {logs.slice(0, 15).map((log) => {
                  const dateStr = new Date(log.timestamp).toLocaleTimeString('fa-IR');
                  return (
                    <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-3 text-slate-600">{dateStr}</td>
                      <td className="py-2.5 px-3 font-bold text-slate-900" dir="ltr">{log.recipient}</td>
                      <td className="py-2.5 px-3 font-sans text-slate-700">
                        {log.type === 'case_registration' ? 'ثبت پرونده' : log.type === 'appointment_client' ? 'تایید نوبت مراجع' : log.type === 'appointment_counselor' ? 'اطلاع به مشاور' : log.type}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{log.bodyId}</td>
                      <td className="py-2.5 px-3">
                        {log.status === 'sent' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-sans font-bold text-[10px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>موفق (تحویل به مخابرات)</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-sans font-bold text-[10px]">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            <span>ناموفق</span>
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
