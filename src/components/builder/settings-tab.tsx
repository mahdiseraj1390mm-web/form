'use client';

import React, { useState, useRef } from 'react';
import { 
  Form, 
  FormGeneralSettings, 
  SecuritySettings, 
  PaymentSettings, 
  NotificationSettings, 
  FormBehaviorSettings 
} from '@/types/form';
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
  HelpCircle,
  FolderLock,
  Globe,
  Smartphone,
  Calendar,
  FileCheck2,
  Download,
  Image as ImageIcon,
  Type,
  Trash2,
  UploadCloud,
  RefreshCw,
  Sparkles,
  LogIn
} from 'lucide-react';
import { toPersianDigits, formatCurrency } from '@/lib/persian';

interface SettingsTabProps {
  form: Form;
  onUpdateForm: (updated: Partial<Form>) => void;
  initialSubTab?: string;
}

export const SettingsTab: React.FC<SettingsTabProps> = ({ form, onUpdateForm, initialSubTab }) => {
  const [activeSubTab, setActiveSubTab] = useState<
    | 'general'
    | 'login_page'
    | 'redirect'
    | 'email'
    | 'sms'
    | 'bot'
    | 'limits'
    | 'payment'
    | 'link_params'
    | 'auth'
    | 'access'
  >((initialSubTab as any) || 'general');

  const [savedToast, setSavedToast] = useState(false);

  // تنظیمات عمومی
  const generalSettings: FormGeneralSettings = form.generalSettings || {
    identifierColor: '#0284c7',
    showPortalGate: false,
    requestLocation: false,
    showSecurityCode: false,
    customIdPrefix: 'BH-',
    customIdSuffix: '',
    customIdMinDigits: 6,
    customIdStartNumber: 1000,
    liveChatEnabled: true,
  };

  // تنظیمات امنیتی و محدودیت‌ها
  const sec: SecuritySettings = form.security || {
    authRequired: false,
    otpLogin: false,
    maxSubmissions: undefined,
    startDate: undefined,
    endDate: undefined,
    onePerNationalCode: false,
    onePerMobile: false,
    limitByIp: false,
    allowEditAfterSubmit: true,
    passwordProtected: false,
    formPassword: '',
  };

  // تنظیمات پرداخت
  const pay: PaymentSettings = form.payment || {
    enabled: false,
    type: 'fixed',
    fixedAmount: 150000,
    gateway: 'shaparak_mellat',
    currency: 'IRT',
    description: 'پرداخت نوبت مشاوره روانشناسی',
    taxPercent: 0,
  };

  // تنظیمات رفتار و هدایت
  const behavior: FormBehaviorSettings = form.behavior || {
    redirectAfterSubmit: false,
    redirectUrl: '',
    customSuccessMessage: 'اطلاعات و نوبت شما با موفقیت در سامانه ثبت گردید.',
    showSummaryAfterSubmit: true,
    allowDownloadPdfReceipt: true,
  };

  // تنظیمات اعلان و پیامک
  const notif: NotificationSettings = form.notifications || {
    smsAdminEnabled: false,
    adminMobile: '',
    smsUserEnabled: true,
    smsTemplateText: 'مراجع گرامی، پرونده شما با کد {trackingCode} در سامانه بالحق ثبت شد.',
    emailAdminEnabled: false,
    adminEmail: '',
    webhookUrl: '',
  };

  const updateGeneral = (props: Partial<FormGeneralSettings>) => {
    onUpdateForm({
      generalSettings: {
        ...generalSettings,
        ...props,
      },
    });
  };

  const bgFileInputRef = useRef<HTMLInputElement | null>(null);
  const heroFileInputRef = useRef<HTMLInputElement | null>(null);

  const updateThemeBg = (bgImage: string) => {
    onUpdateForm({
      theme: {
        ...(form.theme || { themeColor: '#0284c7', fontFamily: 'vazirmatn', borderRadius: 'md' }),
        backgroundImage: bgImage,
        backgroundSize: form.theme?.backgroundSize || 'cover',
        backgroundPosition: form.theme?.backgroundPosition || 'center',
      },
    });
  };

  const handleBgFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        updateThemeBg(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleHeroFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        updateGeneral({ portalHeroImage: e.target.result as string, showPortalHeroImage: true });
      }
    };
    reader.readAsDataURL(file);
  };

  const updateSec = (props: Partial<SecuritySettings>) => {
    onUpdateForm({
      security: {
        ...sec,
        ...props,
      },
    });
  };

  const updatePay = (props: Partial<PaymentSettings>) => {
    onUpdateForm({
      payment: {
        ...pay,
        ...props,
      },
    });
  };

  const updateBehavior = (props: Partial<FormBehaviorSettings>) => {
    onUpdateForm({
      behavior: {
        ...behavior,
        ...props,
      },
    });
  };

  const updateNotif = (props: Partial<NotificationSettings>) => {
    onUpdateForm({
      notifications: {
        ...notif,
        ...props,
      },
    });
  };

  const handleSave = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const subNavItems = [
    { id: 'general', label: 'تنظیمات عمومی فرم', icon: Settings },
    { id: 'login_page', label: 'صفحه ورود (پورتال پرونده)', icon: LogIn },
    { id: 'redirect', label: 'پیغام ثبت و تغییر مسیر', icon: MessageSquare },
    { id: 'limits', label: 'محدودیت ثبت و ظرفیت', icon: Lock },
    { id: 'auth', label: 'احراز هویت و دسترسی', icon: ShieldCheck },
    { id: 'payment', label: 'پرداخت آنلاین شاپرک', icon: CreditCard },
    { id: 'sms', label: 'پیامک و اطلاع‌رسانی', icon: MessageCircle },
    { id: 'email', label: 'اطلاع‌رسانی ایمیل', icon: Mail },
    { id: 'link_params', label: 'پارامترهای لینک فرم', icon: LinkIcon },
    { id: 'bot', label: 'ربات پیام‌رسان (ایتا/بله)', icon: Send },
    { id: 'access', label: 'دسترسی همکاران', icon: Users },
  ];

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-slate-50">
      
      {/* محتوای تب فعال تنظیمات */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 order-2 md:order-1 overscroll-contain">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-slate-200/90 shadow-sm p-6 sm:p-8 space-y-6">
          
          {/* تب ۱: تنظیمات عمومی */}
          {activeSubTab === 'general' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-800">تنظیمات عمومی فرم</h3>
                <p className="text-xs text-slate-500 mt-0.5">پیکربندی هویت، نحوه نمایش اولیه و کدهای پیگیری</p>
              </div>

              {/* بنر ارجاع سریع به تب صفحه ورود */}
              <div
                onClick={() => setActiveSubTab('login_page')}
                className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-50 transition-all flex items-center justify-between cursor-pointer group shadow-2xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#084d3e] text-white flex items-center justify-center font-bold shadow-xs group-hover:scale-105 transition-transform">
                    <LogIn className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-sm font-extrabold text-slate-800 block">
                      تنظیمات صفحه ورود و پورتال پرونده
                    </span>
                    <span className="text-xs text-slate-600 block mt-0.5">
                      تنظیمات اختصاصی عنوان‌گونه، بنر سربرگ و دروازه ورودی مراجعین به تب «صفحه ورود» منتقل شد.
                    </span>
                  </div>
                </div>
                <span className="text-xs font-bold text-[#084d3e] bg-white px-3.5 py-1.5 rounded-xl border border-emerald-300 group-hover:border-emerald-500 shadow-2xs transition-all flex items-center gap-1">
                  <span>مشاهده صفحه ورود</span>
                  <span>&larr;</span>
                </span>
              </div>

              {/* رنگ شناسایی فرم */}
              <div className="flex items-center justify-between p-4 rounded-2xl border border-slate-100">
                <div>
                  <span className="text-sm font-bold text-slate-800 block">رنگ شناسایی فرم</span>
                  <span className="text-xs text-slate-500 block mt-0.5">جهت دسته‌بندی بصری در لیست فرم‌ها</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <input
                    type="color"
                    value={generalSettings.identifierColor || '#0284c7'}
                    onChange={(e) => updateGeneral({ identifierColor: e.target.value })}
                    className="w-10 h-10 p-0.5 rounded-xl border border-slate-300 cursor-pointer bg-white"
                  />
                  <div
                    className="w-8 h-8 rounded-xl shadow-2xs border border-slate-300"
                    style={{ backgroundColor: generalSettings.identifierColor || '#0284c7' }}
                  />
                </div>
              </div>

              {/* چت آنلاین */}
              <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50/70 transition-colors cursor-pointer">
                <div>
                  <span className="text-sm font-bold text-slate-800 block">فعال‌سازی گفتگوی آنلاین (پشتیبانی زنده)</span>
                  <span className="text-xs text-slate-500 block mt-0.5">نمایش دکمه چت در گوشه فرم برای سوالات مراجعین حین ثبت‌نام</span>
                </div>
                <input
                  type="checkbox"
                  checked={generalSettings.liveChatEnabled !== false}
                  onChange={(e) => updateGeneral({ liveChatEnabled: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                />
              </label>

              {/* درخواست موقعیت مکانی */}
              <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50/70 transition-colors cursor-pointer">
                <div>
                  <span className="text-sm font-bold text-slate-800 block">درخواست دریافت موقعیت مکانی (GPS)</span>
                  <span className="text-xs text-slate-500 block mt-0.5">ثبت مختصات جغرافیایی مراجع هنگام ارسال اطلاعات</span>
                </div>
                <input
                  type="checkbox"
                  checked={generalSettings.requestLocation || false}
                  onChange={(e) => updateGeneral({ requestLocation: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                />
              </label>

              {/* کد امنیتی */}
              <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50/70 transition-colors cursor-pointer">
                <div>
                  <span className="text-sm font-bold text-slate-800 block">نمایش کد امنیتی ضداسپم (Captcha)</span>
                  <span className="text-xs text-slate-500 block mt-0.5">جلوگیری از ارسال‌های خودکار و ربات‌ها</span>
                </div>
                <input
                  type="checkbox"
                  checked={generalSettings.showSecurityCode || false}
                  onChange={(e) => updateGeneral({ showSecurityCode: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                />
              </label>

              {/* شناسه اختصاصی و کد پیگیری */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-800">الگوی شناسه اختصاصی و کد پرونده</span>
                  <HelpCircle className="w-4 h-4 text-slate-400" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">پیشوند</label>
                    <input
                      type="text"
                      placeholder="مثال: BH-"
                      value={generalSettings.customIdPrefix || ''}
                      onChange={(e) => updateGeneral({ customIdPrefix: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">شروع شماره‌گذاری از</label>
                    <input
                      type="number"
                      value={generalSettings.customIdStartNumber || 1000}
                      onChange={(e) => updateGeneral({ customIdStartNumber: Number(e.target.value) })}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                </div>

                <div className="pt-1 flex items-center justify-between">
                  <span className="text-xs text-sky-700 font-bold font-mono">
                    نمونه کد پرونده:{' '}
                    {(generalSettings.customIdPrefix || '') +
                      String(generalSettings.customIdStartNumber || 1000).padStart(
                        generalSettings.customIdMinDigits || 6,
                        '0'
                      ) +
                      (generalSettings.customIdSuffix || '')}
                  </span>
                </div>
              </div>

            </div>
          )}

          {/* تب اختصاصی: صفحه ورود (پورتال پرونده) */}
          {activeSubTab === 'login_page' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">تنظیمات صفحه ورود (پورتال پرونده)</h3>
                  <p className="text-xs text-slate-500 mt-0.5">پیکربندی دروازه ورودی مراجعین، امکان ورود با کد پرونده، عنوان‌گونه و بنر اختصاصی</p>
                </div>
                <div className="w-9 h-9 rounded-xl bg-emerald-100 text-[#084d3e] flex items-center justify-center font-bold">
                  <LogIn className="w-4 h-4" />
                </div>
              </div>

              {/* فعال‌سازی صفحه پورتال پرونده (دروازه ورود با کد پرونده) */}
              <label className="flex items-start justify-between p-4 rounded-2xl border border-slate-200 bg-slate-50/70 hover:bg-slate-50 transition-colors cursor-pointer">
                <div>
                  <div className="flex items-center gap-2">
                    <FolderLock className="w-4 h-4 text-sky-600" />
                    <span className="text-sm font-bold text-slate-800">نمایش دروازه پورتال پرونده پیش از ورود به فرم</span>
                  </div>
                  <span className="text-xs text-slate-500 block mt-1 leading-relaxed">
                    در صورت فعال بودن، مراجع ابتدا کادر «ورود به پرونده با کد پرونده / ثبت‌نام جدید» را می‌بیند. در صورت غیرفعال بودن، فرم بلافاصله با فیلدها باز خواهد شد.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={generalSettings.showPortalGate ?? (form.id === 'form-belhagh-registration' || form.slug === 'zexuz')}
                  onChange={(e) => updateGeneral({ showPortalGate: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500 mt-1"
                />
              </label>

              {/* نوشته عنوان‌گونه صفحه و پورتال (قابل تغییر) */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-bold text-slate-800">نوشته عنوان‌گونه (عنوان صفحه و سربرگ پورتال)</span>
                  </div>
                  <span className="text-xs text-slate-500 block mt-1 leading-relaxed">
                    این عبارت در نوار هدر بالای صفحه و سربرگ کادر پورتال نمایش داده می‌شود (مثال: «مرکز خدمات روانشناسی بالحق» یا نام کلینیک/سامانه شما).
                  </span>
                </div>
                <div>
                  <input
                    type="text"
                    value={generalSettings.portalTitle ?? ''}
                    placeholder="مرکز خدمات روانشناسی بالحق"
                    onChange={(e) => updateGeneral({ portalTitle: e.target.value })}
                    className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white font-bold text-slate-800 transition-colors"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                    <span>پیش‌فرض: مرکز خدمات روانشناسی بالحق</span>
                    <button
                      type="button"
                      onClick={() => updateGeneral({ portalTitle: 'مرکز خدمات روانشناسی بالحق' })}
                      className="text-emerald-600 hover:underline font-bold cursor-pointer"
                    >
                      بازنشانی به پیش‌فرض
                    </button>
                  </div>
                </div>
              </div>

              {/* زیرعنوان یا توضیح کوتاه پورتال */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
                <div>
                  <span className="text-sm font-bold text-slate-800 block">زیرعنوان یا توضیح کوتاه پورتال</span>
                  <span className="text-xs text-slate-500 block mt-1 leading-relaxed">
                    متن مکمل که زیر عنوان اصلی در کادر ورودی پورتال قرار می‌گیرد (مثال: «سامانه مشاوره تلفنی و پرونده مراجعین»).
                  </span>
                </div>
                <input
                  type="text"
                  value={generalSettings.portalSubtitle ?? ''}
                  placeholder="سامانه مشاوره تلفنی و پرونده مراجعین"
                  onChange={(e) => updateGeneral({ portalSubtitle: e.target.value })}
                  className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white text-slate-700 transition-colors"
                />
              </div>

              {/* تصویر سربرگ اختصاصی پورتال (Hero Banner) */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-emerald-600" />
                    <span className="text-sm font-bold text-slate-800">تصویر سربرگ پورتال (بنر بالای کادر)</span>
                  </div>
                  <label className="flex items-center gap-1.5 text-xs font-bold text-slate-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={generalSettings.showPortalHeroImage !== false}
                      onChange={(e) => updateGeneral({ showPortalHeroImage: e.target.checked })}
                      className="w-3.5 h-3.5 text-emerald-600 rounded border-slate-300"
                    />
                    <span>نمایش بنر</span>
                  </label>
                </div>
                <span className="text-xs text-slate-500 block leading-relaxed">
                  تصویر تصویرسازی بالای کارت پورتال؛ می‌توانید عکس دلخواه خود را بارگذاری کرده یا از تصویر پیش‌فرض بالحق استفاده کنید.
                </span>

                <input
                  ref={heroFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleHeroFileUpload(e.target.files[0]);
                    }
                  }}
                />

                <div className="flex items-center gap-3">
                  <div className="w-28 h-16 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={generalSettings.portalHeroImage || form.theme?.portalHeroImage || '/images/belhagh-hero.png'}
                      alt="Portal Hero"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => heroFileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>بارگذاری تصویر جدید</span>
                    </button>
                    {(generalSettings.portalHeroImage || form.theme?.portalHeroImage) && (
                      <button
                        type="button"
                        onClick={() => updateGeneral({ portalHeroImage: '/images/belhagh-hero.png' })}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer border border-slate-200"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span>بازنشانی به بنر پیش‌فرض</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* تصویر پس‌زمینه کلی صفحه فرم */}
              <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-bold text-slate-800">تصویر پس‌زمینه سراسری صفحه فرم</span>
                  </div>
                  {form.theme?.backgroundImage && (
                    <button
                      type="button"
                      onClick={() => updateThemeBg('')}
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>حذف عکس پس‌زمینه</span>
                    </button>
                  )}
                </div>
                <span className="text-xs text-slate-500 block leading-relaxed">
                  تصویر پس‌زمینه که در کل صفحه عمومی فرم و پشت دروازه پورتال قرار می‌گیرد (قابل تنظیم در تب قالب نیز هست).
                </span>

                <input
                  ref={bgFileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleBgFileUpload(e.target.files[0]);
                    }
                  }}
                />

                <div className="flex items-center gap-3">
                  <div className="w-28 h-16 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0">
                    {form.theme?.backgroundImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={form.theme.backgroundImage}
                        alt="Background"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-[10px] text-slate-400 font-bold">بدون عکس</span>
                    )}
                  </div>
                  <div className="flex-1 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => bgFileInputRef.current?.click()}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <UploadCloud className="w-3.5 h-3.5" />
                      <span>بارگذاری عکس پس‌زمینه</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => updateThemeBg('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80')}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    >
                      طبیعت آرام
                    </button>
                    <button
                      type="button"
                      onClick={() => updateThemeBg('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80')}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
                    >
                      دفتر کار مدرن
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSubTab === 'redirect' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-800">پیغام ثبت و تغییر مسیر (Redirect)</h3>
                <p className="text-xs text-slate-500 mt-0.5">تنظیمات صفحه تشکر و رفتار مرورگر پس از ارسال فرم</p>
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-semibold text-slate-700 mb-1.5">متن پیام تشکر و رسید موفقیت</label>
                <textarea
                  rows={3}
                  value={behavior.customSuccessMessage || ''}
                  onChange={(e) => updateBehavior({ customSuccessMessage: e.target.value })}
                  placeholder="اطلاعات شما با موفقیت ثبت شد. کد پیگیری شما صادر گردید."
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                />
              </div>

              <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50/70 transition-colors cursor-pointer">
                <div>
                  <span className="text-sm font-bold text-slate-800 block">نمایش خلاصه پاسخ‌ها پس از ارسال</span>
                  <span className="text-xs text-slate-500 block mt-0.5">مراجع بتواند پاسخ‌های واردشده را پیش از خروج مشاهده کند</span>
                </div>
                <input
                  type="checkbox"
                  checked={behavior.showSummaryAfterSubmit !== false}
                  onChange={(e) => updateBehavior({ showSummaryAfterSubmit: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                />
              </label>

              <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50/70 transition-colors cursor-pointer">
                <div>
                  <span className="text-sm font-bold text-slate-800 block">امکان دانلود فیش رسید چاپی (PDF)</span>
                  <span className="text-xs text-slate-500 block mt-0.5">نمایش دکمه دریافت نسخه چاپی رسید ثبت‌نام با نشان بالحق</span>
                </div>
                <input
                  type="checkbox"
                  checked={behavior.allowDownloadPdfReceipt !== false}
                  onChange={(e) => updateBehavior({ allowDownloadPdfReceipt: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                />
              </label>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={behavior.redirectAfterSubmit || false}
                    onChange={(e) => updateBehavior({ redirectAfterSubmit: e.target.checked })}
                    className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                  />
                  <span className="text-sm font-bold text-slate-800">هدایت خودکار به سایت دیگر پس از ثبت (Redirect URL)</span>
                </label>

                {behavior.redirectAfterSubmit && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">آدرس اینترنتی مقصد</label>
                    <input
                      type="url"
                      placeholder="https://psy-belhagh.com/thank-you"
                      value={behavior.redirectUrl || ''}
                      onChange={(e) => updateBehavior({ redirectUrl: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl font-mono text-left bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* تب ۳: محدودیت ثبت و ظرفیت */}
          {activeSubTab === 'limits' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-800">محدودیت‌های ثبت و ظرفیت فرم</h3>
                <p className="text-xs text-slate-500 mt-0.5">تعیین سقف مراجعین، بازه زمانی فعال بودن و پیشگیری از ثبت تکراری</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-slate-800 block">سقف کل ظرفیت (تعداد پاسخ مجاز)</label>
                  <p className="text-xs text-slate-500">پس از رسیدن به این تعداد، فرم به طور خودکار بسته می‌شود</p>
                  <input
                    type="number"
                    value={sec.maxSubmissions || ''}
                    onChange={(e) => updateSec({ maxSubmissions: e.target.value ? Number(e.target.value) : undefined })}
                    placeholder="مثال: ۲۵۰ (خالی = نامحدود)"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl bg-white font-mono text-left"
                  />
                </div>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/50 space-y-1.5">
                  <label className="text-xs sm:text-sm font-bold text-slate-800 block">تاریخ انقضا و بسته‌شدن خودکار</label>
                  <p className="text-xs text-slate-500">از این تاریخ به بعد، پیام «مهلت ثبت‌نام به پایان رسیده» نمایش می‌یابد</p>
                  <input
                    type="text"
                    value={sec.endDate || ''}
                    onChange={(e) => updateSec({ endDate: e.target.value })}
                    placeholder="۱۴۰۵/۰۸/۳۰"
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl bg-white font-mono text-left"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50/70 transition-colors cursor-pointer">
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">هر کد ملی فقط یک‌بار مجاز به ثبت است</span>
                    <span className="text-xs text-slate-500 block mt-0.5">ممانعت سیستمی از تشکیل چند پرونده همزمان برای یک فرد</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={sec.onePerNationalCode || false}
                    onChange={(e) => updateSec({ onePerNationalCode: e.target.checked })}
                    className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50/70 transition-colors cursor-pointer">
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">هر شماره همراه فقط یک‌بار مجاز است</span>
                    <span className="text-xs text-slate-500 block mt-0.5">جلوگیری از ثبت تکراری با یک شماره موبایل</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={sec.onePerMobile || false}
                    onChange={(e) => updateSec({ onePerMobile: e.target.checked })}
                    className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50/70 transition-colors cursor-pointer">
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">محدودیت بر اساس آدرس IP کاربر</span>
                    <span className="text-xs text-slate-500 block mt-0.5">امکان ثبت حداکثر یک بار از هر دستگاه/شبکه</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={sec.limitByIp || false}
                    onChange={(e) => updateSec({ limitByIp: e.target.checked })}
                    className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                  />
                </label>
              </div>
            </div>
          )}

          {/* تب ۴: احراز هویت و دسترسی */}
          {activeSubTab === 'auth' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-800">احراز هویت و امنیت فرم</h3>
                <p className="text-xs text-slate-500 mt-0.5">تنظیمات ورود، تایید پیامکی و رمز عبور محافظتی</p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50/70 transition-colors cursor-pointer">
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">تایید شماره تلفن همراه با کد پیامکی (OTP)</span>
                    <span className="text-xs text-slate-500 block mt-0.5">ارسال رمز یک‌بارمصرف به موبایل متقاضی پیش از تایید نهایی</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={sec.otpLogin || false}
                    onChange={(e) => updateSec({ otpLogin: e.target.checked })}
                    className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                  />
                </label>

                <label className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 hover:bg-slate-50/70 transition-colors cursor-pointer">
                  <div>
                    <span className="text-sm font-bold text-slate-800 block">اجازه ویرایش اطلاعات پس از ثبت نهایی</span>
                    <span className="text-xs text-slate-500 block mt-0.5">مراجع با کد پرونده خود بتواند تا ۷۲ ساعت اطلاعات را تصحیح کند</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={sec.allowEditAfterSubmit !== false}
                    onChange={(e) => updateSec({ allowEditAfterSubmit: e.target.checked })}
                    className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                  />
                </label>

                <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={sec.passwordProtected || false}
                      onChange={(e) => updateSec({ passwordProtected: e.target.checked })}
                      className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                    />
                    <span className="text-sm font-bold text-slate-800">محافظت از فرم با رمز عبور ورود</span>
                  </label>

                  {sec.passwordProtected && (
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">رمز عبور دسترسی</label>
                      <input
                        type="text"
                        placeholder="کلمه عبور ورود به این فرم"
                        value={sec.formPassword || ''}
                        onChange={(e) => updateSec({ formPassword: e.target.value })}
                        className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl bg-white font-mono"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* تب ۵: پرداخت آنلاین شاپرک */}
          {activeSubTab === 'payment' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-800">پرداخت الکترونیک و درگاه بانکی</h3>
                  <p className="text-xs text-slate-500 mt-0.5">اتصال مستقیم به شبکه پرداخت شاپرک یا درگاه‌های واسط</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={pay.enabled || false}
                    onChange={(e) => updatePay({ enabled: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:right-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  <span className="mr-3 text-xs font-bold text-slate-900">
                    {pay.enabled ? 'پرداخت فعال' : 'پرداخت غیرفعال'}
                  </span>
                </label>
              </div>

              {pay.enabled ? (
                <div className="space-y-4 animate-in fade-in">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">درگاه پرداخت مورد استفاده</label>
                      <select
                        value={pay.gateway}
                        onChange={(e) => updatePay({ gateway: e.target.value as any })}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                      >
                        <option value="shaparak_mellat">به‌پرداخت ملت (شاپرک مستقیم)</option>
                        <option value="sadad">سداد بانک ملی ایران</option>
                        <option value="parsian">تجارت الکترونیک پارسیان</option>
                        <option value="zarinpal">زرین‌پال (ZarinPal)</option>
                        <option value="idpay">آی‌دی‌پی (IDPay)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">واحد پول</label>
                      <select
                        value={pay.currency}
                        onChange={(e) => updatePay({ currency: e.target.value as any })}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-sky-500/20"
                      >
                        <option value="IRT">تومان (IRT)</option>
                        <option value="IRR">ریال (IRR)</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">مبلغ ثابت فاکتور ({pay.currency === 'IRT' ? 'تومان' : 'ریال'})</label>
                      <input
                        type="number"
                        value={pay.fixedAmount || 0}
                        onChange={(e) => updatePay({ fixedAmount: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl bg-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">ارزش افزوده (مالیات ٪)</label>
                      <input
                        type="number"
                        value={pay.taxPercent || 0}
                        onChange={(e) => updatePay({ taxPercent: Number(e.target.value) })}
                        placeholder="مثال: ۱۰"
                        className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl bg-white font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">توضیحات فاکتور در صفحه پرداخت</label>
                    <input
                      type="text"
                      value={pay.description || ''}
                      onChange={(e) => updatePay({ description: e.target.value })}
                      placeholder="مثال: هزینه جلسه مشاوره و خدمات روانشناسی بالحق"
                      className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl bg-white"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
                  درگاه پرداخت برای این فرم خاموش است. در صورت نیاز به دریافت هزینه ثبت‌نام، ویزیت یا نوبت‌دهی، دکمه بالا را فعال نمایید.
                </div>
              )}
            </div>
          )}

          {/* تب ۶: پیامک و اطلاع‌رسانی */}
          {activeSubTab === 'sms' && (
            <div className="space-y-6">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-800">پیامک و اطلاع‌رسانی پیامکی</h3>
                <p className="text-xs text-slate-500 mt-0.5">ارسال خودکار پیامک به مراجع و مدیر سامانه (کاوه نگار / وب‌سرویس پیامکی)</p>
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notif.smsAdminEnabled || false}
                    onChange={(e) => updateNotif({ smsAdminEnabled: e.target.checked })}
                    className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                  />
                  <span className="text-sm font-bold text-slate-800">ارسال پیامک به مدیر هنگام دریافت پاسخ جدید</span>
                </label>

                {notif.smsAdminEnabled && (
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">شماره همراه مدیر</label>
                    <input
                      type="text"
                      placeholder="09120000000"
                      value={notif.adminMobile || ''}
                      onChange={(e) => updateNotif({ adminMobile: e.target.value })}
                      className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl font-mono text-left bg-white"
                    />
                  </div>
                )}
              </div>

              <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50/60 space-y-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={notif.smsUserEnabled !== false}
                    onChange={(e) => updateNotif({ smsUserEnabled: e.target.checked })}
                    className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                  />
                  <span className="text-sm font-bold text-slate-800">ارسال پیامک تایید و کد پیگیری به مراجع</span>
                </label>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">قالب متن پیامک مراجع</label>
                  <textarea
                    rows={3}
                    placeholder="مراجع گرامی، ثبت‌نام شما در بالحق با کد {trackingCode} انجام گردید."
                    value={notif.smsTemplateText || ''}
                    onChange={(e) => updateNotif({ smsTemplateText: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl bg-white"
                  />
                  <span className="text-[11px] text-slate-400 mt-1 block">متغیرهای مجاز: {`{trackingCode}`}، {`{fullName}`}، {`{date}`}</span>
                </div>
              </div>
            </div>
          )}

          {/* تب ۷: ایمیل */}
          {activeSubTab === 'email' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-800">اطلاع‌رسانی ایمیلی</h3>
                <p className="text-xs text-slate-500 mt-0.5">ارسال نسخه الکترونیکی پاسخ به ایمیل متقاضی یا مدیر</p>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notif.emailAdminEnabled || false}
                  onChange={(e) => updateNotif({ emailAdminEnabled: e.target.checked })}
                  className="w-4 h-4 text-sky-600 rounded border-slate-300 focus:ring-sky-500"
                />
                <span className="text-sm font-bold text-slate-800">ارسال ایمیل به مدیر پس از هر ثبت فرم</span>
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">آدرس ایمیل مدیر</label>
                <input
                  type="email"
                  placeholder="admin@psy-belhagh.com"
                  value={notif.adminEmail || ''}
                  onChange={(e) => updateNotif({ adminEmail: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl font-mono text-left bg-white"
                />
              </div>
            </div>
          )}

          {/* تب ۸: پارامترهای لینک فرم */}
          {activeSubTab === 'link_params' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-800">پارامترهای لینک فرم (URL Prefill)</h3>
                <p className="text-xs text-slate-500 mt-0.5">پیش‌پر کردن خودکار فیلدهای فرم از طریق پارامترهای Query آدرس اینترنتی</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-700 space-y-3 leading-relaxed">
                <p>شما می‌توانید فیلدهای این فرم را از قبل پر کنید تا هنگام ورود مراجع، مشخصات آماده باشد. مثال:</p>
                <div className="p-3 bg-white rounded-xl border border-slate-300 font-mono text-left text-xs text-sky-800 break-all" dir="ltr">
                  https://psy-belhagh.com/form/{form.slug}?f_mobile=09121112233
                </div>
              </div>
            </div>
          )}

          {/* تب ۹: ربات پیام‌رسان */}
          {activeSubTab === 'bot' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-800">ربات پیام‌رسان (ایتا، بله، تلگرام)</h3>
                <p className="text-xs text-slate-500 mt-0.5">ارسال بلادرنگ پیام اعلان به کانال یا گروه پشتیبانی در پیام‌رسان‌های ایرانی</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 text-xs">
                <label className="block font-semibold text-slate-700">شناسه وب‌هوک ربات (Webhook URL)</label>
                <input
                  type="url"
                  placeholder="https://eitaa.com/api/bot.../sendMessage"
                  value={notif.webhookUrl || ''}
                  onChange={(e) => updateNotif({ webhookUrl: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm border border-slate-300 rounded-xl font-mono text-left bg-white"
                />
              </div>
            </div>
          )}

          {/* تب ۱۰: دسترسی همکاران */}
          {activeSubTab === 'access' && (
            <div className="space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-base font-extrabold text-slate-800">دسترسی و نقش‌های همکاران</h3>
                <p className="text-xs text-slate-500 mt-0.5">تعیین سطوح دسترسی کارشناسان به این فرم و ارسالی‌های آن</p>
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 space-y-2">
                <p className="font-semibold text-slate-800">سطح دسترسی پیش‌فرض:</p>
                <p>مدیران ارشد و اپراتورهای نوبت‌دهی مرکز بالحق به صورت خودکار به پاسخ‌های این سامانه دسترسی دارند.</p>
              </div>
            </div>
          )}

          {/* دکمه ذخیره تنظیمات */}
          <div className="pt-5 border-t border-slate-100 flex items-center justify-between">
            {savedToast ? (
              <span className="text-xs sm:text-sm text-emerald-600 font-bold animate-in fade-in flex items-center gap-1.5">
                <Check className="w-4 h-4" />
                <span>تنظیمات فرم با موفقیت ذخیره شد</span>
              </span>
            ) : (
              <span className="text-xs text-slate-400">تمام تغییرات با زدن دکمه ذخیره اعمال می‌شوند.</span>
            )}

            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 active:bg-sky-800 text-white font-bold text-xs sm:text-sm rounded-xl shadow-xs transition-all cursor-pointer"
            >
              ذخیره تنظیمات
            </button>
          </div>

        </div>
      </div>

      {/* سایدبار ناوبری زیرمنوی تنظیمات */}
      <div className="w-full md:w-64 bg-white border-l border-slate-200/90 shrink-0 p-3 overflow-y-auto order-1 md:order-2 shadow-xs overscroll-contain">
        <div className="space-y-1">
          {subNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSubTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSubTab(item.id as any)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all text-right cursor-pointer ${
                  isActive
                    ? 'bg-sky-50 text-sky-900 border-r-4 border-sky-600 shadow-2xs font-extrabold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-sky-600' : 'text-slate-400'}`} />
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
