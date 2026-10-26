'use client';

import React, { useState, useRef } from 'react';
import { useForm } from '@/context/form-context';
import { 
  FolderLock, 
  LogIn, 
  Type, 
  Image as ImageIcon, 
  UploadCloud, 
  Trash2, 
  ExternalLink, 
  CheckCircle2, 
  Eye, 
  Check,
  Copy,
  Info,
  Loader2
} from 'lucide-react';

export const PortalSettingsTab: React.FC = () => {
  const { forms, activeForm, updateForm, setActiveForm } = useForm();
  
  // انتخاب فرم هدف؛ اولویت با فرم بالحق ثبت‌نام یا فرم فعال
  const [selectedFormId, setSelectedFormId] = useState<string>(() => {
    if (activeForm) return activeForm.id;
    const belhaghForm = forms.find((f) => f.id === 'form-belhagh-registration' || f.slug === 'zexuz');
    return belhaghForm ? belhaghForm.id : forms[0]?.id || '';
  });

  const [savedToast, setSavedToast] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingBg, setUploadingBg] = useState(false);

  const heroFileInputRef = useRef<HTMLInputElement | null>(null);
  const bgFileInputRef = useRef<HTMLInputElement | null>(null);

  const currentForm = forms.find((f) => f.id === selectedFormId) || activeForm || forms[0];

  if (!currentForm) {
    return (
      <div className="p-8 text-center text-slate-500">
        <FolderLock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
        <p className="font-bold">فرمی در سامانه یافت نشد.</p>
      </div>
    );
  }

  const generalSettings = currentForm.generalSettings || {};
  const isPortalGateActive = generalSettings.showPortalGate ?? (currentForm.id === 'form-belhagh-registration' || currentForm.slug === 'zexuz');

  // تصویر سربرگ: اگر هیچ تصویری انتخاب نشده باشد، مقدار خالی است و هیچ تصویر پیش‌فرضی نمایش داده نمی‌شود
  const heroImage =
    generalSettings.portalHeroImage && generalSettings.portalHeroImage !== '/images/belhagh-hero.png'
      ? generalSettings.portalHeroImage
      : '';

  const updateGeneral = (props: Partial<typeof generalSettings>) => {
    updateForm(currentForm.id, {
      generalSettings: {
        ...generalSettings,
        ...props,
      },
    });
  };

  const updateThemeBg = (bgImage: string) => {
    updateForm(currentForm.id, {
      theme: {
        ...(currentForm.theme || { themeColor: '#0284c7', fontFamily: 'vazirmatn', borderRadius: 'md' }),
        backgroundImage: bgImage,
        backgroundSize: currentForm.theme?.backgroundSize || 'cover',
        backgroundPosition: currentForm.theme?.backgroundPosition || 'center',
      },
    });
  };

  const handleHeroFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      setUploadingHero(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        updateGeneral({ portalHeroImage: data.url, showPortalHeroImage: true });
        triggerSavedFeedback();
      } else {
        alert('خطا در بارگذاری تصویر: ' + (data.error || 'ناشناخته'));
      }
    } catch (err) {
      console.error('Hero upload error:', err);
      alert('خطا در ارتباط با سرور هنگام آپلود تصویر');
    } finally {
      setUploadingHero(false);
    }
  };

  const handleBgFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    try {
      setUploadingBg(true);
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.success && data.url) {
        updateThemeBg(data.url);
        triggerSavedFeedback();
      } else {
        alert('خطا در بارگذاری عکس پس‌زمینه: ' + (data.error || 'ناشناخته'));
      }
    } catch (err) {
      console.error('Bg upload error:', err);
      alert('خطا در ارتباط با سرور هنگام آپلود عکس پس‌زمینه');
    } finally {
      setUploadingBg(false);
    }
  };

  const triggerSavedFeedback = () => {
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2500);
  };

  const copyPortalLink = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const portalUrl = `${origin}/form/${currentForm.slug}`;
    navigator.clipboard.writeText(portalUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="space-y-6">
      
      {/* سربرگ تب پورتال پرونده */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-l from-emerald-50 via-teal-50/50 to-white border border-emerald-200/80 shadow-xs">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-[#084d3e] text-white flex items-center justify-center font-bold shadow-sm shrink-0">
            <LogIn className="w-5 h-5 text-emerald-200" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-extrabold text-slate-900">تنظیمات صفحه ورود (پورتال پرونده)</h2>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-[#084d3e] border border-emerald-300">
                دروازه پرونده مراجعین
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              مدیریت عنوان، زیرعنوان، تصویر سربرگ و ظاهر کارت ورود مراجعین به پرونده
            </p>
          </div>
        </div>

        {/* دکمه‌های اقدام سریع */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={copyPortalLink}
            className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="کپی لینک اختصاصی فرم"
          >
            {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-500" />}
            <span>{copiedLink ? 'کپی شد!' : 'کپی نشانی صفحه'}</span>
          </button>

          <a
            href={`/form/${currentForm.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-[#084d3e] hover:bg-[#063b2f] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
          >
            <ExternalLink className="w-4 h-4" />
            <span>مشاهده صفحه عمومی</span>
          </a>
        </div>
      </div>

      {/* انتخاب فرم هدف برای اعمال تنظیمات */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <span>انتخاب فرم مورد نظر جهت تنظیم پورتال:</span>
          </label>
          <span className="text-xs text-slate-500">
            فرم فعلی: <strong className="text-emerald-900">{currentForm.title}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-1">
          {forms.map((f) => {
            const isSelected = f.id === currentForm.id;
            const isBelhagh = f.id === 'form-belhagh-registration' || f.slug === 'zexuz';
            const hasGate = f.generalSettings?.showPortalGate ?? isBelhagh;
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => {
                  setSelectedFormId(f.id);
                  setActiveForm(f);
                }}
                className={`p-3 rounded-xl border text-right transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/70 ring-2 ring-emerald-500/20 shadow-2xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <span className={`text-xs font-extrabold line-clamp-1 ${isSelected ? 'text-emerald-950' : 'text-slate-800'}`}>
                    {f.title}
                  </span>
                  {isSelected && (
                    <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1" />
                  )}
                </div>
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span className="font-mono">/form/{f.slug}</span>
                  <span className={`px-1.5 py-0.5 rounded font-bold ${
                    hasGate ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {hasGate ? 'دروازه فعال' : 'بدون دروازه'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ۱. فعال‌سازی دروازه ورود (پورتال پرونده) */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-xs">
        <label className="flex items-start justify-between gap-4 cursor-pointer">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <FolderLock className="w-5 h-5 text-emerald-700 shrink-0" />
              <span className="text-sm font-extrabold text-slate-900">
                نمایش دروازه پورتال پرونده پیش از ورود به فرم
              </span>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed max-w-2xl">
              در صورت فعال بودن، مراجع ابتدا کادر «ورود به پرونده با کد پرونده / ثبت‌نام جدید» را می‌بیند و با وارد کردن کد پرونده، به پرونده شخصی خود و فیلدهای فرم دسترسی پیدا می‌کند. در صورت غیرفعال بودن، فرم بلافاصله با فیلدها باز خواهد شد.
            </p>
          </div>
          <div className="relative inline-flex items-center shrink-0 mt-1">
            <input
              type="checkbox"
              checked={isPortalGateActive}
              onChange={(e) => {
                updateGeneral({ showPortalGate: e.target.checked });
                triggerSavedFeedback();
              }}
              className="w-5 h-5 text-[#084d3e] rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
          </div>
        </label>

        <div className={`p-3 rounded-xl text-xs flex items-center gap-2 font-bold ${
          isPortalGateActive 
            ? 'bg-emerald-50 text-emerald-900 border border-emerald-200' 
            : 'bg-amber-50 text-amber-900 border border-amber-200'
        }`}>
          <Info className="w-4 h-4 shrink-0" />
          <span>
            {isPortalGateActive 
              ? 'دروازه ورودی پرونده هم‌اکنون برای این فرم فعال است.' 
              : 'دروازه ورودی پورتال غیرفعال است (فرم به صورت مستقیم بدون صفحه ورود باز می‌شود).'}
          </span>
        </div>
      </div>

      {/* ۲. عنوان‌گونه و سربرگ پورتال */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <Type className="w-4 h-4 text-emerald-700" />
            <label className="text-sm font-extrabold text-slate-900">
              نوشته عنوان‌گونه (عنوان صفحه و سربرگ پورتال)
            </label>
          </div>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            این عبارت در نوار هدر بالای صفحه و سربرگ کادر پورتال نمایش داده می‌شود (مثال: «مرکز خدمات روانشناسی بالحق» یا نام کلینیک/سامانه شما).
          </p>
        </div>

        <div>
          <input
            type="text"
            value={generalSettings.portalTitle ?? ''}
            placeholder="مرکز خدمات روانشناسی بالحق"
            onChange={(e) => updateGeneral({ portalTitle: e.target.value })}
            className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white font-bold text-slate-800 transition-colors"
          />
          <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
            <span>پیش‌فرض: مرکز خدمات روانشناسی بالحق</span>
            <button
              type="button"
              onClick={() => {
                updateGeneral({ portalTitle: 'مرکز خدمات روانشناسی بالحق' });
                triggerSavedFeedback();
              }}
              className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline cursor-pointer"
            >
              بازنشانی به پیش‌فرض بالحق
            </button>
          </div>
        </div>
      </div>

      {/* ۳. زیرعنوان یا توضیح کوتاه پورتال */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
        <div>
          <span className="text-sm font-extrabold text-slate-900 block">زیرعنوان یا توضیح کوتاه پورتال</span>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            متن مکمل که زیر عنوان اصلی در کادر ورودی پورتال قرار می‌گیرد (مثال: «ورود به پرونده یا ثبت‌نام جدید»).
          </p>
        </div>
        <input
          type="text"
          value={generalSettings.portalSubtitle ?? ''}
          placeholder="ورود به پرونده یا ثبت‌نام جدید"
          onChange={(e) => updateGeneral({ portalSubtitle: e.target.value })}
          className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white text-slate-700 transition-colors"
        />
      </div>

      {/* ۴. تصویر سربرگ اختصاصی پورتال (Hero Banner) */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-emerald-700" />
            <span className="text-sm font-extrabold text-slate-900">تصویر سربرگ پورتال (بنر کادر ورود)</span>
          </div>
          {heroImage && (
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={generalSettings.showPortalHeroImage !== false}
                onChange={(e) => {
                  updateGeneral({ showPortalHeroImage: e.target.checked });
                  triggerSavedFeedback();
                }}
                className="w-4 h-4 text-emerald-600 rounded border-slate-300"
              />
              <span>نمایش تصویر</span>
            </label>
          )}
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          تصویر سربرگ کارت پورتال؛ هیچ تصویر پیش‌فرضی وجود ندارد و در صورت بارگذاری تصویر جدید، تصویر در سرور ذخیره شده و برای تمامی کاربران و دستگاه‌ها به صورت یکپارچه نمایش داده می‌شود.
        </p>

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

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 pt-1">
          <div className="w-36 h-20 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 shadow-2xs">
            {heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={heroImage}
                alt="Portal Hero"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[11px] text-slate-400 font-bold">بدون تصویر</span>
            )}
          </div>
          <div className="flex-1 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={uploadingHero}
              onClick={() => heroFileInputRef.current?.click()}
              className="px-3.5 py-2 bg-[#084d3e] hover:bg-[#063b2f] text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-60"
            >
              {uploadingHero ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال ذخیره در سرور...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>{heroImage ? 'تغییر تصویر (آپلود در سرور)' : 'بارگذاری تصویر سربرگ'}</span>
                </>
              )}
            </button>
            {heroImage && (
              <button
                type="button"
                onClick={() => {
                  updateGeneral({ portalHeroImage: '', showPortalHeroImage: false });
                  triggerSavedFeedback();
                }}
                className="px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer border border-rose-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>حذف تصویر</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ۵. تصویر پس‌زمینه سراسری صفحه فرم */}
      <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-extrabold text-slate-900">تصویر پس‌زمینه سراسری صفحه فرم</span>
          </div>
          {currentForm.theme?.backgroundImage && (
            <button
              type="button"
              onClick={() => {
                updateThemeBg('');
                triggerSavedFeedback();
              }}
              className="text-xs text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
            >
              <Trash2 className="w-3 h-3" />
              <span>حذف عکس پس‌زمینه</span>
            </button>
          )}
        </div>
        <p className="text-xs text-slate-500 leading-relaxed">
          تصویر پس‌زمینه که در کل صفحه عمومی فرم و پشت دروازه پورتال قرار می‌گیرد.
        </p>

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

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3.5 pt-1">
          <div className="w-36 h-20 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center shrink-0 shadow-2xs">
            {currentForm.theme?.backgroundImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={currentForm.theme.backgroundImage}
                alt="Background"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[11px] text-slate-400 font-bold">بدون عکس</span>
            )}
          </div>
          <div className="flex-1 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={uploadingBg}
              onClick={() => bgFileInputRef.current?.click()}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs disabled:opacity-60"
            >
              {uploadingBg ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>در حال آپلود...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  <span>بارگذاری عکس پس‌زمینه</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                updateThemeBg('https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1600&q=80');
                triggerSavedFeedback();
              }}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition cursor-pointer"
            >
              طبیعت آرام
            </button>
            <button
              type="button"
              onClick={() => {
                updateThemeBg('https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1600&q=80');
                triggerSavedFeedback();
              }}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 transition cursor-pointer"
            >
              دفتر کار مدرن
            </button>
          </div>
        </div>
      </div>

      {/* ۶. پیش‌نمایش زنده از ظاهر دروازه پورتال */}
      <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-emerald-700" />
          <span className="text-sm font-extrabold text-slate-900">پیش‌نمایش شماتیک ظاهر کارت ورود مراجعین</span>
        </div>
        <p className="text-xs text-slate-500">
          نمای زیر خلاصه‌ای از تجربه دیداری مراجع به محض ورود به فرم است:
        </p>

        <div className="max-w-xs mx-auto relative rounded-3xl border border-stone-300 shadow-md overflow-hidden mt-3 min-h-[380px] flex flex-col justify-end text-center bg-stone-100">
          {heroImage && generalSettings.showPortalHeroImage !== false ? (
            <div className="absolute inset-0 w-full h-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={heroImage}
                alt="Banner Preview"
                className="w-full h-full object-cover object-top select-none pointer-events-none"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white/95 via-white/50 to-transparent pointer-events-none" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-50 via-teal-50 to-white pointer-events-none" />
          )}
          <div className="relative z-10 p-4 space-y-2.5 text-center">
            {generalSettings.portalTitle && (
              <h4 className="font-extrabold text-sm text-[#084d3e] tracking-tight drop-shadow-2xs">
                {generalSettings.portalTitle}
              </h4>
            )}
            {generalSettings.portalSubtitle && (
              <p className="text-[11px] text-stone-700 font-bold drop-shadow-2xs">
                {generalSettings.portalSubtitle}
              </p>
            )}
            <div className="pt-1 flex flex-col gap-2">
              <div className="w-full py-2.5 px-3 rounded-full bg-[#084d3e] text-white text-xs font-black text-center shadow-xs">
                ورود
              </div>
              <div className="w-full py-2.5 px-3 rounded-full bg-white text-[#084d3e] text-xs font-black text-center border-2 border-[#084d3e] shadow-xs">
                ثبت نام
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* دکمه ذخیره کلی و فیدبک */}
      <div className="pt-2 flex items-center justify-between border-t border-slate-100">
        <div className="flex items-center gap-2">
          {savedToast && (
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>تنظیمات صفحه پورتال با موفقیت در پایگاه‌داده ذخیره شد.</span>
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={triggerSavedFeedback}
          className="px-6 py-2.5 bg-[#084d3e] hover:bg-[#063b2f] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span>ذخیره تنظیمات پورتال</span>
        </button>
      </div>

    </div>
  );
};
