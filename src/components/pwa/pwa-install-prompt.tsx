'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { usePwaInstall } from '@/context/pwa-context';
import {
  Download,
  X,
  Share,
  PlusSquare,
  Smartphone,
  Monitor,
  CheckCircle2,
  MoreVertical,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';

export const PwaInstallPrompt: React.FC = () => {
  const {
    isStandalone,
    isPromptOpen,
    justInstalledToast,
    canNativeInstall,
    platform,
    isMobile,
    triggerInstall,
    dismissPrompt,
  } = usePwaInstall();

  const [copiedUrl, setCopiedUrl] = useState(false);

  const handleCopyCurrentUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedUrl(true);
      setTimeout(() => setCopiedUrl(false), 2500);
    } catch {
      // Fallback ignored
    }
  };

  if (justInstalledToast) {
    return (
      <div
        dir="rtl"
        className="fixed bottom-5 right-5 z-50 max-w-sm bg-[#084d3e] text-white px-4 py-3 rounded-2xl shadow-xl border border-emerald-400/30 flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-4 duration-200 no-print"
      >
        <CheckCircle2 className="w-5 h-5 text-emerald-300 shrink-0" />
        <span className="text-xs font-bold leading-relaxed">
          وب‌اپلیکیشن روانشناسی بالحق با موفقیت نصب شد!
        </span>
      </div>
    );
  }

  if (isStandalone || !isPromptOpen) {
    return null;
  }

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-label="پیشنهاد نصب وب‌اپلیکیشن روانشناسی بالحق"
      className="fixed bottom-4 inset-x-3 sm:inset-x-auto sm:right-6 sm:bottom-6 sm:w-[400px] z-50 no-print animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="bg-white/95 backdrop-blur-xl border border-slate-200/90 rounded-3xl shadow-[0_20px_50px_rgba(15,23,42,0.18)] overflow-hidden">
        {/* نوار رنگی بالای کارت */}
        <div className="h-1.5 w-full bg-gradient-to-l from-[#084d3e] via-teal-500 to-sky-500" />

        <div className="p-4 sm:p-5 space-y-3.5">
          {/* سربرگ با لوگو و دکمه بستن */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-13 h-13 rounded-2xl overflow-hidden border border-slate-200 shadow-xs shrink-0 bg-white">
                <Image
                  src="/icons/icon-192x192.png"
                  alt="لوگوی روانشناسی بالحق"
                  width={52}
                  height={52}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-[#084d3e] border border-emerald-200/70">
                    {isMobile ? (
                      <Smartphone className="w-3 h-3" />
                    ) : (
                      <Monitor className="w-3 h-3" />
                    )}
                    نسخه اپلیکیشن (PWA)
                  </span>
                </div>
                <h3 className="text-sm font-black text-slate-900 mt-1 truncate">
                  نصب اپلیکیشن روانشناسی بالحق
                </h3>
              </div>
            </div>

            <button
              type="button"
              onClick={dismissPrompt}
              aria-label="بستن پیشنهاد نصب"
              className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* توضیحات متناسب با پلتفرم */}
          {canNativeInstall ? (
            <>
              <p className="text-xs text-slate-600 leading-relaxed">
                {isMobile
                  ? 'برای دسترسی سریع از صفحه اصلی گوشی، بارگذاری سریع‌تر و نمایش تمام‌صفحه بدون نیاز به مرورگر، وب‌اپلیکیشن را نصب کنید.'
                  : 'برای دسترسی مستقیم از دسکتاپ یا منوی استارت و اجرای تمام‌صفحه مانند یک نرم‌افزار مستقل، این سامانه را روی سیستم خود نصب کنید.'}
              </p>

              <div className="flex items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={triggerInstall}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#084d3e] hover:bg-[#063b2f] active:scale-[0.99] text-white text-xs font-extrabold shadow-md shadow-emerald-900/15 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>نصب اپلیکیشن</span>
                </button>
                <button
                  type="button"
                  onClick={dismissPrompt}
                  className="py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                >
                  فعلاً نه
                </button>
              </div>
            </>
          ) : platform === 'ios' ? (
            <>
              <p className="text-xs text-slate-600 leading-relaxed">
                برای نصب اپلیکیشن روی آیفون یا آیپد، این دو مرحله ساده را در مرورگر Safari انجام دهید:
              </p>

              <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3 space-y-2.5 text-xs text-slate-700">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-[#084d3e] text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    ۱
                  </span>
                  <span className="leading-relaxed">
                    دکمه اشتراک‌گذاری{' '}
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-sky-600 font-bold mx-0.5 align-middle">
                      <Share className="w-3.5 h-3.5" />
                      Share
                    </span>{' '}
                    را در نوار پایین یا بالای مرورگر لمس کنید.
                  </span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-[#084d3e] text-white font-black text-[11px] flex items-center justify-center shrink-0">
                    ۲
                  </span>
                  <span className="leading-relaxed">
                    گزینه{' '}
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-white border border-slate-200 text-slate-900 font-bold mx-0.5 align-middle">
                      <PlusSquare className="w-3.5 h-3.5 text-[#084d3e]" />
                      Add to Home Screen
                    </span>{' '}
                    (افزودن به صفحه اصلی) و سپس Add را بزنید.
                  </span>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={dismissPrompt}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  متوجه شدم
                </button>
              </div>
            </>
          ) : platform === 'in-app' ? (
            <>
              <p className="text-xs text-slate-600 leading-relaxed">
                شما اکنون داخل مرورگر داخلی پیام‌رسان هستید. برای نصب وب‌اپلیکیشن روی صفحه اصلی، لینک را در مرورگر اصلی گوشی (Chrome در اندروید یا Safari در آیفون) باز کنید:
              </p>

              <div className="flex items-center gap-2 pt-0.5">
                <button
                  type="button"
                  onClick={handleCopyCurrentUrl}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#084d3e] hover:bg-[#063b2f] text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedUrl ? (
                    <>
                      <Check className="w-4 h-4 text-emerald-300" />
                      <span>لینک کپی شد!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>کپی لینک برای باز کردن در مرورگر</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={dismissPrompt}
                  className="py-2.5 px-3.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold transition-colors cursor-pointer"
                >
                  بستن
                </button>
              </div>
            </>
          ) : platform === 'mac-safari' ? (
            <>
              <p className="text-xs text-slate-600 leading-relaxed">
                در مرورگر Safari مک، از منوی بالای صفحه گزینه{' '}
                <span className="font-bold text-slate-900">File ← Add to Dock</span>{' '}
                یا آیکون اشتراک‌گذاری{' '}
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-bold">
                  <ExternalLink className="w-3 h-3" />
                  Add to Dock
                </span>{' '}
                را انتخاب کنید تا سامانه به صورت اپلیکیشن مستقل نصب شود.
              </p>
              <button
                type="button"
                onClick={dismissPrompt}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                متوجه شدم
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-slate-600 leading-relaxed">
                برای نصب وب‌اپلیکیشن، از منوی مرورگر{' '}
                <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-slate-100 text-slate-800 font-bold mx-0.5">
                  <MoreVertical className="w-3.5 h-3.5" />
                </span>{' '}
                یا آیکون نصب در نوار آدرس، گزینه{' '}
                <span className="font-bold text-slate-900">
                  «نصب برنامه / Add to Home Screen»
                </span>{' '}
                را انتخاب کنید.
              </p>
              <button
                type="button"
                onClick={dismissPrompt}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                متوجه شدم
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
