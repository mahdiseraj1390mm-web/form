'use client';

import React, { useState, useRef, useMemo } from 'react';
import {
  CreditCard,
  Check,
  Copy,
  Wifi,
  UploadCloud,
  FileImage,
  ZoomIn,
  Eye,
  Trash2,
  RefreshCw,
  X,
  Download,
  AlertCircle,
} from 'lucide-react';
import { getBankByKey, detectBankFromCardNumber, cleanCardNumber, formatCardNumberPersian } from '@/lib/iran-banks';
import { toPersianDigits, formatCurrency } from '@/lib/persian';

export interface BankReceiptRecord {
  name: string;
  size: number;
  formattedSize: string;
  type: string;
  dataUrl?: string;
  uploadedAt?: string;
}

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
  allowReceiptUpload?: boolean;
  requireReceipt?: boolean;
  receiptTitle?: string;
  receiptValue?: BankReceiptRecord | any;
  onReceiptChange?: (receipt: BankReceiptRecord | null) => void;
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
  allowReceiptUpload = true,
  requireReceipt = false,
  receiptTitle,
  receiptValue,
  onReceiptChange,
  isReadOnly = false,
  className = '',
  showContainerBorder = true,
}) => {
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

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

  // نرمال‌سازی داده فیش واریزی
  const receiptRecord: BankReceiptRecord | null = useMemo(() => {
    if (!receiptValue) return null;
    if (typeof receiptValue === 'object' && receiptValue.dataUrl) return receiptValue;
    if (typeof receiptValue === 'object' && receiptValue.name) return receiptValue;
    if (typeof receiptValue === 'string' && receiptValue.trim()) {
      return {
        name: 'فیش واریزی',
        size: 0,
        formattedSize: '',
        type: 'image/jpeg',
        dataUrl: receiptValue.startsWith('data:') || receiptValue.startsWith('http') ? receiptValue : undefined,
      };
    }
    return null;
  }, [receiptValue]);

  // فرمت حجم فایل به فارسی
  const formatFileSize = (bytes: number): string => {
    if (!bytes) return '';
    if (bytes < 1024) return `${toPersianDigits(bytes)} بایت`;
    if (bytes < 1024 * 1024) return `${toPersianDigits(Math.round(bytes / 1024))} کیلوبایت`;
    return `${toPersianDigits((bytes / (1024 * 1024)).toFixed(1))} مگابایت`;
  };

  // پردازش فایل انتخابی کاربر
  const processReceiptFile = (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith('image/')) {
      setUploadError('لطفاً یک فایل تصویری معتبر (JPG، PNG، WEBP) انتخاب فرمایید.');
      return;
    }
    // سقف ۱۰ مگابایت
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('حجم تصویر فیش بیشتر از سقف مجاز (۱۰ مگابایت) است.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const record: BankReceiptRecord = {
        name: file.name,
        size: file.size,
        formattedSize: formatFileSize(file.size),
        type: file.type,
        dataUrl: e.target?.result as string,
        uploadedAt: new Date().toISOString(),
      };
      if (onReceiptChange) {
        onReceiptChange(record);
      }
    };
    reader.onerror = () => {
      setUploadError('خطا در خواندن فایل تصویر.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processReceiptFile(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTriggerUpload = () => {
    if (isReadOnly) return;
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isReadOnly) setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isReadOnly) return;
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processReceiptFile(file);
    }
  };

  const handleRemoveReceipt = (e: React.MouseEvent) => {
    e.stopPropagation();
    setUploadError(null);
    if (onReceiptChange) {
      onReceiptChange(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

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

      {/* شبکه اصلی: کارت بانکی در یک سمت، ورودی مبلغ و فیش در سمت دیگر */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
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
                <circle cx="340" cy="180" stroke="white" strokeWidth="1.5" />
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

        {/* ۲. ستون مبالغ دلخواه پرداختی، چیپ‌های پیش‌فرض و بارگذاری تصویر فیش */}
        {(showCustomAmount || showPresetAmounts || allowReceiptUpload) && (
          <div className="lg:col-span-5 space-y-2.5">
            {/* الف. ورود مبلغ دلخواه */}
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

            {/* ب. چیپ‌های مبالغ پیش‌فرض */}
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

            {/* ج. بخش بارگذاری تصویر فیش واریزی */}
            {allowReceiptUpload && (
              <div className="pt-2 border-t border-amber-200/80 space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                    <span>{receiptTitle || (requireReceipt ? 'تصویر فیش واریزی (الزامی):' : 'تصویر فیش واریزی (اختیاری):')}</span>
                    {requireReceipt && <span className="text-rose-500 font-bold">*</span>}
                  </label>
                  {receiptRecord && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>فیش پیوست شد</span>
                    </span>
                  )}
                </div>

                {/* دراپ‌زون بارگذاری یا نمایش فیش انتخاب‌شده */}
                {!receiptRecord ? (
                  <div
                    onClick={handleTriggerUpload}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`group relative flex items-center gap-2.5 p-2.5 rounded-xl border border-dashed transition-all cursor-pointer ${
                      isDragging
                        ? 'border-amber-500 bg-amber-100/80 scale-[1.01]'
                        : 'border-amber-300 hover:border-amber-500 bg-white/80 hover:bg-amber-50/70'
                    } ${isReadOnly ? 'opacity-60 pointer-events-none' : ''} shadow-2xs`}
                  >
                    <div className="size-9 rounded-lg bg-amber-100 group-hover:bg-amber-200 text-amber-800 grid place-items-center shrink-0 transition-transform group-hover:scale-105">
                      <UploadCloud className="size-4.5" />
                    </div>
                    <div className="min-w-0 flex-1 text-right">
                      <span className="text-[11px] font-bold text-slate-700 block group-hover:text-amber-950 transition-colors">
                        بارگذاری یا کشیدن تصویر فیش واریز
                      </span>
                      <span className="text-[10px] text-slate-400 block truncate">
                        فرمت‌های JPG، PNG یا WEBP (حداکثر ۱۰ مگابایت)
                      </span>
                    </div>
                  </div>
                ) : (
                  /* کارت پیش‌نمایش فیش پیوست‌شده */
                  <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white border border-amber-300 shadow-2xs">
                    {/* تصویر بندانگشتی با دکمه بزرگ‌نمایی */}
                    <div
                      onClick={() => setShowLightbox(true)}
                      className="size-11 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 relative shrink-0 cursor-pointer group"
                      title="کلیک برای بزرگ‌نمایی تصویر فیش"
                    >
                      {receiptRecord.dataUrl ? (
                        <img
                          src={receiptRecord.dataUrl}
                          alt={receiptRecord.name || 'فیش واریزی'}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-200"
                        />
                      ) : (
                        <div className="w-full h-full grid place-items-center text-slate-400">
                          <FileImage className="size-5" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                        <ZoomIn className="size-4" />
                      </div>
                    </div>

                    {/* اطلاعات فایل */}
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-slate-800 truncate" title={receiptRecord.name}>
                        {receiptRecord.name || 'تصویر فیش واریزی'}
                      </p>
                      <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                        {receiptRecord.formattedSize || ''}
                      </p>
                    </div>

                    {/* دکمه‌های عملیات */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => setShowLightbox(true)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-amber-700 hover:bg-amber-50 transition-colors cursor-pointer"
                        title="مشاهده بزرگ‌نمایی فیش"
                      >
                        <Eye className="size-3.5" />
                      </button>
                      {!isReadOnly && (
                        <>
                          <button
                            type="button"
                            onClick={handleTriggerUpload}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors cursor-pointer"
                            title="تغییر تصویر فیش"
                          >
                            <RefreshCw className="size-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={handleRemoveReceipt}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="حذف فیش"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}

                {/* ورودی پنهان فایل */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isReadOnly}
                />

                {/* پیام خطای آپلود در صورت نامعتبر بودن فرمت یا حجم */}
                {uploadError && (
                  <p className="text-[10px] font-bold text-rose-600 flex items-center gap-1 pt-0.5">
                    <AlertCircle className="size-3 shrink-0" />
                    <span>{uploadError}</span>
                  </p>
                )}
              </div>
            )}
          </div>
        )}

      </div>

      {/* پنجره مودال بزرگ‌نمایی تصویر فیش (Lightbox) */}
      {showLightbox && receiptRecord?.dataUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in select-text"
          onClick={() => setShowLightbox(false)}
        >
          <div
            className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-4 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileImage className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-xs font-bold text-slate-800 truncate max-w-xs sm:max-w-md">
                  {receiptRecord.name || 'پیش‌نمایش تصویر فیش واریزی'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={receiptRecord.dataUrl}
                  download={receiptRecord.name || 'fish-varizi.jpg'}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                  title="دانلود تصویر فیش"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setShowLightbox(false)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                  title="بستن"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="max-h-[65vh] overflow-auto flex items-center justify-center bg-slate-900/5 rounded-xl p-2">
              <img
                src={receiptRecord.dataUrl}
                alt={receiptRecord.name || 'فیش واریزی'}
                className="max-h-[60vh] w-auto max-w-full rounded-lg object-contain shadow-sm"
              />
            </div>

            <div className="text-[11px] text-slate-500 flex items-center justify-between pt-1">
              <span>اندازه فایل: {receiptRecord.formattedSize || ''}</span>
              <button
                type="button"
                onClick={() => setShowLightbox(false)}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs transition-colors cursor-pointer"
              >
                بستن پنجره
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
