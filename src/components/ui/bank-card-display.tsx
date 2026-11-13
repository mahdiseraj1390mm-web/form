'use client';

import React, { useState } from 'react';
import { CreditCard, Check, Copy, Wifi } from 'lucide-react';
import { getBankByKey, detectBankFromCardNumber, cleanCardNumber, formatCardNumberPersian } from '@/lib/iran-banks';
import { toPersianDigits, formatCurrency } from '@/lib/persian';

interface BankCardDisplayProps {
  cardNumber?: string;
  cardHolder?: string;
  bankKey?: string;
  title?: string;
  description?: string;
  presetAmounts?: number[];
  showPresetAmounts?: boolean;
  showCustomAmount?: boolean;
  amountValue?: string;
  onAmountChange?: (value: string) => void;
  isReadOnly?: boolean;
  className?: string;
  showContainerBorder?: boolean;
}

export const BankCardDisplay: React.FC<BankCardDisplayProps> = ({
  cardNumber = '6037-9979-1234-5678',
  cardHolder = 'مرکز خدمات روانشناسی بالحق',
  bankKey,
  title = 'مشارکت مالی اختیاری در هزینه‌های مرکز (اختیاری)',
  description = 'در صورت تمایل، می‌توانید مبلغی را به عنوان هدیه یا مشارکت اختیاری واریز فرمایید',
  presetAmounts = [30000, 50000, 100000, 200000],
  showPresetAmounts = true,
  showCustomAmount = true,
  amountValue = '',
  onAmountChange,
  isReadOnly = false,
  className = '',
  showContainerBorder = true,
}) => {
  const [copied, setCopied] = useState(false);

  // تشخیص خودکار یا دستی بانک
  const detectedBank = detectBankFromCardNumber(cardNumber);
  const activeBank = bankKey ? getBankByKey(bankKey) : (detectedBank || getBankByKey('melli'));
  const Logo = activeBank.logoSvg;

  // کپی شماره کارت در کلیپ‌بورد
  const handleCopyCard = (e: React.MouseEvent) => {
    e.stopPropagation();
    const clean = cleanCardNumber(cardNumber);
    if (!clean) return;

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(clean);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  const formattedPersianCard = formatCardNumberPersian(cardNumber, ' - ');

  return (
    <div
      className={`rounded-2xl transition-all duration-200 select-none ${
        showContainerBorder
          ? 'p-4 sm:p-5 bg-gradient-to-br from-amber-50/60 via-orange-50/30 to-amber-100/40 border border-amber-200/80 shadow-xs'
          : ''
      } ${className}`}
      dir="rtl"
    >
      {/* سربرگ فیلد: عنوان و توضیحات */}
      {(title || description) && (
        <div className="flex items-start gap-2.5 mb-4">
          <div className="size-8 sm:size-9 rounded-xl bg-amber-100 text-amber-800 grid place-items-center shrink-0 mt-0.5 shadow-2xs border border-amber-200">
            <CreditCard className="size-4 sm:size-5" />
          </div>
          <div className="min-w-0">
            {title && (
              <span className="text-xs sm:text-sm font-black text-amber-950 block leading-tight">
                {title}
              </span>
            )}
            {description && (
              <span className="text-[11px] sm:text-xs text-amber-800/90 block mt-1 leading-relaxed">
                {description}
              </span>
            )}
          </div>
        </div>
      )}

      {/* شبکه اصلی: کارت بانکی در یک سمت، ورودی مبلغ در سمت دیگر */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
        
        {/* ۱. کارت فیزیکی بانکی فوق‌العاده شیک با تم اختصاصی بانک */}
        <div className="lg:col-span-7 flex justify-center">
          <div
            className={`w-full max-w-sm rounded-2xl p-4 sm:p-5 text-white shadow-xl relative overflow-hidden bg-gradient-to-br ${activeBank.gradient} border border-white/20 transition-all duration-300 hover:shadow-2xl hover:scale-[1.01]`}
            style={{
              aspectRatio: '1.586 / 1',
              boxShadow: '0 12px 28px -6px rgba(0,0,0,0.35), inset 0 1px 1px rgba(255,255,255,0.3)',
            }}
          >
            {/* لایه بافت و واترمارک گرافیکی پیش‌زمینه کارت */}
            <div className="absolute inset-0 pointer-events-none opacity-15 overflow-hidden">
              <svg className="w-full h-full" viewBox="0 0 400 250" fill="none" preserveAspectRatio="none">
                <circle cx="340" cy="40" r="140" stroke="white" strokeWidth="2" strokeDasharray="8 6" />
                <circle cx="340" cy="40" r="180" stroke="white" strokeWidth="1.5" />
                <path d="M-50 180 C 100 120, 220 220, 450 140" stroke="white" strokeWidth="2.5" fill="none" />
                <path d="M-50 200 C 120 140, 240 240, 450 160" stroke="white" strokeWidth="1.5" fill="none" />
              </svg>
            </div>

            {/* برق انعکاس نور شیشه‌ای در لبه بالایی */}
            <div className="absolute top-0 inset-x-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent pointer-events-none" />

            {/* بخش بالایی کارت: لوگوی بانک + نام بانک + نماد شبکه شتاب و وای‌فای */}
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/20 shadow-xs">
                  <Logo className="w-6 h-6 sm:w-7 sm:h-7" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-extrabold tracking-tight block text-white drop-shadow-sm">
                    {activeBank.name}
                  </span>
                  <span className="text-[9px] sm:text-[10px] text-white/70 block -mt-0.5">
                    کارت پرداخت شتابی
                  </span>
                </div>
              </div>

              {/* نماد تماس امن RFID و شتاب */}
              <div className="flex items-center gap-1.5 opacity-80">
                <Wifi className="w-4 h-4 rotate-90 text-white/90" />
                <span className="text-[10px] font-mono tracking-wider font-bold bg-white/15 px-2 py-0.5 rounded-md border border-white/25">
                  SHETAB
                </span>
              </div>
            </div>

            {/* بخش میانی: چیپ طلایی هوشمند EMV */}
            <div className="my-3 sm:my-3.5 relative z-10 flex items-center justify-between">
              <div
                className="w-10 sm:w-11 h-7 sm:h-8 rounded-md bg-gradient-to-br from-amber-200 via-yellow-400 to-amber-500 border border-amber-600/60 shadow-inner relative overflow-hidden"
                style={{
                  boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.8), 0 2px 4px rgba(0,0,0,0.3)',
                }}
              >
                {/* شیارهای روی چیپ طلایی */}
                <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] bg-amber-800/40" />
                <div className="absolute inset-y-0 left-1/3 w-[1px] bg-amber-800/40" />
                <div className="absolute inset-y-0 right-1/3 w-[1px] bg-amber-800/40" />
                <div className="absolute inset-1 rounded-sm border border-amber-800/30" />
              </div>

              {/* دکمه کپی شماره کارت با بازخورد سریع */}
              <button
                type="button"
                onClick={handleCopyCard}
                className="px-2.5 py-1 rounded-lg bg-black/25 hover:bg-black/40 text-white/95 text-[10px] sm:text-xs font-bold border border-white/20 backdrop-blur-xs flex items-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-xs"
                title="کپی کردن ۱۶ رقم شماره کارت"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="text-emerald-200">کپی شد!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-white/80" />
                    <span>کپی کارت</span>
                  </>
                )}
              </button>
            </div>

            {/* شماره کارت با استایل برجسته (Embossed) و ۴ گروه ارقام */}
            <div className="relative z-10 text-center my-1 sm:my-2" dir="ltr">
              <div
                className="font-mono font-black text-base sm:text-lg tracking-widest text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] select-all"
                style={{
                  textShadow: '0 2px 3px rgba(0,0,0,0.7), 0 0 2px rgba(255,255,255,0.3)',
                }}
              >
                {formattedPersianCard || '۶۰۳۷ - ۹۹۷۹ - ۱۲۳۴ - ۵۶۷۸'}
              </div>
            </div>

            {/* بخش پایینی کارت: نام صاحب کارت / نام فرد */}
            <div className="pt-1.5 sm:pt-2 flex items-end justify-between relative z-10 border-t border-white/10 mt-2">
              <div className="min-w-0 pr-1">
                <span className="text-[9px] sm:text-[10px] text-white/70 block">
                  به نام صاحب حساب:
                </span>
                <span
                  className="text-xs sm:text-sm font-black text-white truncate block max-w-[210px] sm:max-w-[240px]"
                  style={{
                    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                  }}
                >
                  {cardHolder || 'مرکز خدمات روانشناسی بالحق'}
                </span>
              </div>

              <div className="text-left shrink-0">
                <span className="text-[8px] text-white/60 block font-mono">CVV2 / EXP</span>
                <span className="text-[10px] text-white/85 font-mono font-bold tracking-wider">
                  ** / **
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ۲. بخش مبلغ دلخواه پرداختی و چیپ‌های پیش‌فرض */}
        {(showCustomAmount || showPresetAmounts) && (
          <div className="lg:col-span-5 space-y-2.5">
            {showCustomAmount && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>مبلغ دلخواه پرداختی (تومان):</span>
                  {amountValue && !isNaN(Number(amountValue.replace(/[^\d]/g, ''))) && Number(amountValue.replace(/[^\d]/g, '')) > 0 && (
                    <span className="text-[10px] font-normal text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded-full">
                      {formatCurrency(Number(amountValue.replace(/[^\d]/g, '')))}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    placeholder="مثال: ۵۰,۰۰۰"
                    value={amountValue ? toPersianDigits(amountValue) : ''}
                    onChange={(e) => {
                      if (onAmountChange) {
                        const raw = cleanCardNumber(e.target.value);
                        onAmountChange(raw);
                      }
                    }}
                    className="w-full p-2.5 rounded-xl border border-amber-300/80 bg-white text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all shadow-2xs"
                  />
                  <span className="absolute left-3 top-2.5 text-[11px] text-slate-400 font-bold pointer-events-none">
                    تومان
                  </span>
                </div>
              </div>
            )}

            {/* چیپ‌های مبالغ پیش‌فرض */}
            {showPresetAmounts && presetAmounts && presetAmounts.length > 0 && (
              <div className="space-y-1 pt-0.5">
                <span className="text-[10px] text-slate-500 font-semibold block">
                  انتخاب سریع مبالغ پیشنهادی:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {presetAmounts.map((amt) => {
                    const persianFormatted = toPersianDigits(amt.toLocaleString('fa-IR'));
                    const isSelected = amountValue?.toString().replace(/[^\d]/g, '') === amt.toString();

                    return (
                      <button
                        key={amt}
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => {
                          if (onAmountChange) {
                            onAmountChange(amt.toString());
                          }
                        }}
                        className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all cursor-pointer active:scale-95 ${
                          isSelected
                            ? 'bg-amber-600 text-white border-amber-700 shadow-xs'
                            : 'bg-white hover:bg-amber-100/80 text-amber-950 border-amber-200'
                        }`}
                      >
                        {persianFormatted} تومان
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
