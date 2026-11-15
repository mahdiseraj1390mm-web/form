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
  ExternalLink,
  Smartphone,
  Hash,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  Lock,
} from 'lucide-react';
import { getBankByKey, detectBankFromCardNumber, cleanCardNumber, formatCardNumberPersian } from '@/lib/iran-banks';
import { toPersianDigits, formatCurrency } from '@/lib/persian';
import { CustomPaymentLink } from '@/types/form';

export interface BankReceiptRecord {
  name: string;
  size: number;
  formattedSize: string;
  type: string;
  dataUrl?: string;
  uploadedAt?: string;
}

export interface PaymentAppInfo {
  id: string;
  name: string;
  shortName: string;
  scheme: string;
  androidIntent: string;
  bazaarUrl: string;
  myketUrl: string;
  webUrl: string;
  badgeColor: string;
  gradient: string;
  textColor: string;
  dotColor: string;
}

export const SUPPORTED_PAYMENT_APPS: PaymentAppInfo[] = [
  {
    id: 'up',
    name: 'آپ (آسان پرداخت)',
    shortName: 'آپ',
    scheme: 'upapp://',
    androidIntent: 'intent://#Intent;scheme=upapp;package=com.sibche.aspardproject.app;S.browser_fallback_url=https%3A%2F%2Fcafebazaar.ir%2Fapp%2Fcom.sibche.aspardproject.app;end',
    bazaarUrl: 'https://cafebazaar.ir/app/com.sibche.aspardproject.app',
    myketUrl: 'https://myket.ir/app/com.sibche.aspardproject.app',
    webUrl: 'https://asanpardakht.ir/',
    badgeColor: 'bg-rose-50 hover:bg-rose-100 text-rose-800 border-rose-200',
    gradient: 'from-rose-500 to-red-600',
    textColor: 'text-rose-700',
    dotColor: 'bg-rose-500',
  },
  {
    id: 'top',
    name: 'تاپ (پرداخت نوین)',
    shortName: 'تاپ',
    scheme: 'top://',
    androidIntent: 'intent://#Intent;scheme=top;package=ir.tgbs.peccharge;S.browser_fallback_url=https%3A%2F%2Fcafebazaar.ir%2Fapp%2Fir.tgbs.peccharge;end',
    bazaarUrl: 'https://cafebazaar.ir/app/ir.tgbs.peccharge',
    myketUrl: 'https://myket.ir/app/ir.tgbs.peccharge',
    webUrl: 'https://top.ir/',
    badgeColor: 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200',
    gradient: 'from-amber-500 to-orange-600',
    textColor: 'text-amber-700',
    dotColor: 'bg-amber-500',
  },
  {
    id: 'hamrahcard',
    name: 'همراه کارت',
    shortName: 'همراه کارت',
    scheme: 'hamrahcard://',
    androidIntent: 'intent://#Intent;scheme=hamrahcard;package=com.adpdigital.mbs.ayande;S.browser_fallback_url=https%3A%2F%2Fcafebazaar.ir%2Fapp%2Fcom.adpdigital.mbs.ayande;end',
    bazaarUrl: 'https://cafebazaar.ir/app/com.adpdigital.mbs.ayande',
    myketUrl: 'https://myket.ir/app/com.adpdigital.mbs.ayande',
    webUrl: 'https://hamrahcard.ir/',
    badgeColor: 'bg-sky-50 hover:bg-sky-100 text-sky-800 border-sky-200',
    gradient: 'from-sky-500 to-blue-600',
    textColor: 'text-sky-700',
    dotColor: 'bg-sky-500',
  },
  {
    id: 'blubank',
    name: 'بلو بانک (سامان)',
    shortName: 'بلوبانک',
    scheme: 'blubank://',
    androidIntent: 'intent://#Intent;scheme=blubank;package=com.samanpr.blu;S.browser_fallback_url=https%3A%2F%2Fcafebazaar.ir%2Fapp%2Fcom.samanpr.blu;end',
    bazaarUrl: 'https://cafebazaar.ir/app/com.samanpr.blu',
    myketUrl: 'https://myket.ir/app/com.samanpr.blu',
    webUrl: 'https://blubank.sb24.com/',
    badgeColor: 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border-indigo-200',
    gradient: 'from-blue-600 to-indigo-700',
    textColor: 'text-indigo-700',
    dotColor: 'bg-indigo-500',
  },
  {
    id: 'sekkeh',
    name: 'سکه (به‌پرداخت ملت)',
    shortName: 'سکه',
    scheme: 'sekkeh://',
    androidIntent: 'intent://#Intent;scheme=sekkeh;package=com.bpm.sekeh;S.browser_fallback_url=https%3A%2F%2Fcafebazaar.ir%2Fapp%2Fcom.bpm.sekeh;end',
    bazaarUrl: 'https://cafebazaar.ir/app/com.bpm.sekeh',
    myketUrl: 'https://myket.ir/app/com.bpm.sekeh',
    webUrl: 'https://sekkeh.behpardakht.com/',
    badgeColor: 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200',
    gradient: 'from-emerald-600 to-teal-700',
    textColor: 'text-emerald-700',
    dotColor: 'bg-emerald-500',
  },
  {
    id: 'bam',
    name: 'بام (همراه بانک ملی)',
    shortName: 'بام ملی',
    scheme: 'baam://',
    androidIntent: 'intent://#Intent;scheme=baam;package=ir.bmi.bam.nativeweb;S.browser_fallback_url=https%3A%2F%2Fcafebazaar.ir%2Fapp%2Fir.bmi.bam.nativeweb;end',
    bazaarUrl: 'https://cafebazaar.ir/app/ir.bmi.bam.nativeweb',
    myketUrl: 'https://myket.ir/app/ir.bmi.bam.nativeweb',
    webUrl: 'https://my.bmi.ir/',
    badgeColor: 'bg-teal-50 hover:bg-teal-100 text-teal-800 border-teal-200',
    gradient: 'from-teal-600 to-emerald-700',
    textColor: 'text-teal-700',
    dotColor: 'bg-teal-500',
  },
];

/**
 * ساخت دیپ‌لینک اختصاصی و اینتنت اندروید به همراه تزریق مستقیم شماره کارت و مبلغ
 */
export function buildPaymentAppLinks(
  app: PaymentAppInfo,
  rawCardNumber: string,
  amountInTomans: number
): { deepLinkScheme: string; androidIntent: string } {
  const cleanCard = cleanCardNumber(rawCardNumber);
  const amountRials = amountInTomans > 0 ? amountInTomans * 10 : 0;
  const encodedDesc = encodeURIComponent('واریز بالحق');

  // ساخت کوئری‌استرینگ با تمام متغیرهای استاندارد در اپلیکیشن‌های پرداخت و کارت‌به‌کارت
  const params = new URLSearchParams();
  if (cleanCard) {
    params.set('card', cleanCard);
    params.set('dest', cleanCard);
    params.set('destination', cleanCard);
    params.set('pan', cleanCard);
    params.set('destCard', cleanCard);
  }
  if (amountRials > 0) {
    params.set('amount', String(amountRials));
    params.set('amountRials', String(amountRials));
    params.set('amountTomans', String(amountInTomans));
    params.set('price', String(amountRials));
  }
  params.set('desc', encodedDesc);

  const q = params.toString();
  // آدرس فال‌بک رسمی در کافه بازار برای جلوگیری ۱۰۰٪ از خطای «مورد یافت نشد» در گوگل‌پلی
  const fallbackUrl = encodeURIComponent(app.bazaarUrl || app.webUrl);

  switch (app.id) {
    case 'up': {
      // آپ (آسان پرداخت) - شناسه رسمی بسته در اندروید com.sibche.aspardproject.app
      return {
        deepLinkScheme: `upapp://?${q}`,
        androidIntent: `intent://#Intent;scheme=upapp;package=com.sibche.aspardproject.app;S.card=${cleanCard};S.amount=${amountRials};S.browser_fallback_url=${fallbackUrl};end`,
      };
    }
    case 'hamrahcard': {
      // همراه کارت - شناسه رسمی بسته در اندروید com.adpdigital.mbs.ayande
      return {
        deepLinkScheme: `hamrahcard://?${q}`,
        androidIntent: `intent://#Intent;scheme=hamrahcard;package=com.adpdigital.mbs.ayande;S.destination=${cleanCard};S.amount=${amountRials};S.browser_fallback_url=${fallbackUrl};end`,
      };
    }
    case 'blubank': {
      // بلوبانک سامان - شناسه رسمی بسته در اندروید com.samanpr.blu
      return {
        deepLinkScheme: `blubank://?${q}`,
        androidIntent: `intent://#Intent;scheme=blubank;package=com.samanpr.blu;S.dest=${cleanCard};S.amount=${amountRials};S.browser_fallback_url=${fallbackUrl};end`,
      };
    }
    case 'top': {
      // تاپ پرداخت نوین - شناسه رسمی بسته در اندروید ir.tgbs.peccharge
      return {
        deepLinkScheme: `top://?${q}`,
        androidIntent: `intent://#Intent;scheme=top;package=ir.tgbs.peccharge;S.card=${cleanCard};S.amount=${amountRials};S.browser_fallback_url=${fallbackUrl};end`,
      };
    }
    case 'sekkeh': {
      // سکه به‌پرداخت ملت - شناسه رسمی بسته در اندروید com.bpm.sekeh
      return {
        deepLinkScheme: `sekkeh://?${q}`,
        androidIntent: `intent://#Intent;scheme=sekkeh;package=com.bpm.sekeh;S.card=${cleanCard};S.amount=${amountRials};S.browser_fallback_url=${fallbackUrl};end`,
      };
    }
    case 'bam': {
      // همراه بانک ملی (سامانه بام) - شناسه رسمی بسته در اندروید ir.bmi.bam.nativeweb
      return {
        deepLinkScheme: `baam://?${q}`,
        androidIntent: `intent://#Intent;scheme=baam;package=ir.bmi.bam.nativeweb;S.card=${cleanCard};S.amount=${amountRials};S.browser_fallback_url=${fallbackUrl};end`,
      };
    }
    default: {
      const cleanScheme = app.scheme.replace('://', '');
      return {
        deepLinkScheme: `${app.scheme}?${q}`,
        androidIntent: `intent://#Intent;scheme=${cleanScheme};S.browser_fallback_url=${fallbackUrl};end`,
      };
    }
  }
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
  // افزوده شده: تنظیمات اپلیکیشن‌های پرداخت و کد رهگیری
  enableAppShortcuts?: boolean;
  allowedApps?: string[];
  customLinks?: CustomPaymentLink[];
  enableTrackingCode?: boolean;
  requireTrackingCode?: boolean;
  trackingCodeTitle?: string;
  trackingCodeValue?: string;
  onTrackingCodeChange?: (code: string) => void;
  allowOnlineGatewaySwitch?: boolean;
  paymentMode?: 'card' | 'online';
  onPaymentModeChange?: (mode: 'card' | 'online') => void;
  onDirectPayClick?: () => void;
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
  enableAppShortcuts = true,
  allowedApps,
  customLinks = [],
  enableTrackingCode = true,
  requireTrackingCode = false,
  trackingCodeTitle,
  trackingCodeValue = '',
  onTrackingCodeChange,
  allowOnlineGatewaySwitch = false,
  paymentMode = 'card',
  onPaymentModeChange,
  onDirectPayClick,
}) => {
  const [copied, setCopied] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showLightbox, setShowLightbox] = useState(false);
  const [launchedToast, setLaunchedToast] = useState<{ appName: string; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // محاسبه عددی مبلغ
  const parsedAmount = amountValue ? Number(amountValue.replace(/[^\d]/g, '')) : 0;

  // وضعیت دستیار هوشمند انتقال وجه به اپلیکیشن یا لینک وب
  const [activeAssistant, setActiveAssistant] = useState<{
    app?: PaymentAppInfo;
    customLink?: CustomPaymentLink;
    deepLinkScheme: string;
    androidIntent: string;
    cleanCard: string;
    amountTomans: number;
    amountRials: number;
    copiedCard: boolean;
    copiedAmountTomans: boolean;
    copiedAmountRials: boolean;
  } | null>(null);

  // تشخیص خودکار یا دستی بانک
  const detectedBank = detectBankFromCardNumber(cardNumber);
  const activeBank = bankKey ? getBankByKey(bankKey) : (detectedBank || getBankByKey('melli'));
  const Logo = activeBank.logoSvg;

  // فیلتر کردن اپلیکیشن‌های فعال
  const activePaymentApps = useMemo(() => {
    if (!allowedApps || allowedApps.length === 0) {
      return SUPPORTED_PAYMENT_APPS;
    }
    return SUPPORTED_PAYMENT_APPS.filter((a) => allowedApps.includes(a.id));
  }, [allowedApps]);

  // کپی شماره کارت در کلیپ‌بورد
  const handleCopyCard = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const clean = cleanCardNumber(cardNumber);
    if (!clean) return;

    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(clean);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  // کپی خودکار شماره کارت، ساخت دیپ‌لینک با پارامترهای مبلغ و کارت و ارجاع مستقیم به اپلیکیشن
  const handleLaunchApp = (app: PaymentAppInfo) => {
    if (isReadOnly) return;
    const clean = cleanCardNumber(cardNumber);
    if (!clean) return;

    const amountTomans = parsedAmount || 0;
    const amountRials = amountTomans * 10;
    const links = buildPaymentAppLinks(app, clean, amountTomans);

    // ۱. کپی خودکار شماره ۱۶ رقمی کارت در کلیپ‌بورد (جهت فعال‌سازی قابلیت Smart Clipboard در اپ‌های همراه کارت، بلوبانک، آپ)
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(clean);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }

    // ۲. فعال‌سازی پنجره دستیار هوشمند انتقال وجه با تمام امکانات کپی و ارجاع
    setActiveAssistant({
      app,
      deepLinkScheme: links.deepLinkScheme,
      androidIntent: links.androidIntent,
      cleanCard: clean,
      amountTomans,
      amountRials,
      copiedCard: true,
      copiedAmountTomans: false,
      copiedAmountRials: false,
    });

    // ۳. ارسال دیپ‌لینک اختصاصی به سیستم‌عامل
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent || '';
      const isAndroid = /Android/i.test(ua);
      const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);

      if (isAndroid && links.androidIntent) {
        window.location.href = links.androidIntent;
      } else if (isMobile && links.deepLinkScheme) {
        window.location.href = links.deepLinkScheme;
      }
    }
  };

  // کپی خودکار شماره کارت، جایگزینی متغیرها در لینک و باز کردن درگاه یا سامانه کارت‌به‌کارت وب
  const handleLaunchCustomLink = (link: CustomPaymentLink) => {
    if (isReadOnly) return;
    const clean = cleanCardNumber(cardNumber);
    if (!clean) return;

    const amountTomans = parsedAmount || 0;
    const amountRials = amountTomans * 10;

    // ۱. کپی خودکار شماره ۱۶ رقمی کارت مقصد در کلیپ‌بورد
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(clean);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }

    // ۲. جایگزینی متغیرهای احتمالی در URL (مبلغ، کارت و...)
    let finalUrl = (link.url || '').trim();
    if (!/^https?:\/\//i.test(finalUrl) && !/^[a-z0-9+.-]+:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }
    finalUrl = finalUrl
      .replace(/\{card\}/gi, clean)
      .replace(/\{cardNumber\}/gi, clean)
      .replace(/\{destCard\}/gi, clean)
      .replace(/\{amount\}/gi, String(amountTomans || ''))
      .replace(/\{amountTomans\}/gi, String(amountTomans || ''))
      .replace(/\{amountRials\}/gi, String(amountRials || ''));

    // ۳. نمایش اعلان کپی شماره کارت
    setLaunchedToast({
      appName: link.title,
      message: 'شماره کارت ۱۶ رقمی در حافظه کپی شد و سامانه پرداخت در برگه جدید باز گردید.',
    });

    // ۴. باز کردن لینک در تب جدید
    if (typeof window !== 'undefined') {
      window.open(finalUrl, '_blank', 'noopener,noreferrer');
    }

    // ۵. فعال‌سازی پنجره دستیار با قابلیت کپی مجدد و ثبت کد پیگیری
    setActiveAssistant({
      customLink: link,
      deepLinkScheme: finalUrl,
      androidIntent: '',
      cleanCard: clean,
      amountTomans,
      amountRials,
      copiedCard: true,
      copiedAmountTomans: false,
      copiedAmountRials: false,
    });
  };

  // متد کپی مبلغ به تومان
  const copyAmountTomans = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!activeAssistant || !activeAssistant.amountTomans) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(String(activeAssistant.amountTomans));
      setActiveAssistant((prev) => prev ? { ...prev, copiedAmountTomans: true } : null);
      setTimeout(() => {
        setActiveAssistant((prev) => prev ? { ...prev, copiedAmountTomans: false } : null);
      }, 2000);
    }
  };

  // متد کپی مبلغ به ریال
  const copyAmountRials = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!activeAssistant || !activeAssistant.amountRials) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(String(activeAssistant.amountRials));
      setActiveAssistant((prev) => prev ? { ...prev, copiedAmountRials: true } : null);
      setTimeout(() => {
        setActiveAssistant((prev) => prev ? { ...prev, copiedAmountRials: false } : null);
      }, 2000);
    }
  };

  // فراخوانی دستی یا مجدد اپلیکیشن یا لینک از درون پنجره راهنما
  const handleLaunchDirectly = () => {
    if (!activeAssistant) return;
    if (activeAssistant.customLink) {
      if (typeof window !== 'undefined' && activeAssistant.deepLinkScheme) {
        window.open(activeAssistant.deepLinkScheme, '_blank', 'noopener,noreferrer');
      }
      return;
    }
    const targetApp = activeAssistant.app;
    if (!targetApp) return;
    if (typeof window !== 'undefined') {
      const ua = navigator.userAgent || '';
      const isAndroid = /Android/i.test(ua);
      const isMobile = /Android|iPhone|iPad|iPod/i.test(ua);

      if (isAndroid && activeAssistant.androidIntent) {
        window.location.href = activeAssistant.androidIntent;
      } else if (isMobile && activeAssistant.deepLinkScheme) {
        window.location.href = activeAssistant.deepLinkScheme;
      } else {
        window.open(targetApp.webUrl || targetApp.bazaarUrl, '_blank', 'noopener,noreferrer');
      }
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
        <div className="flex items-start gap-2.5 mb-3.5">
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

      {/* سوییچ دوگانه نحوه پرداخت در صورت فعال بودن (روش ترکیبی شاپرک / کارت به کارت) */}
      {allowOnlineGatewaySwitch && (
        <div className="mb-4 p-1 rounded-2xl bg-amber-200/50 border border-amber-300/70 flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPaymentModeChange && onPaymentModeChange('card')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              paymentMode === 'card'
                ? 'bg-white text-amber-950 shadow-xs border border-amber-300/80'
                : 'text-amber-900/70 hover:text-amber-950 hover:bg-white/40'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-amber-600" />
            <span>کارت به کارت (آپ، تاپ و...)</span>
          </button>
          <button
            type="button"
            onClick={() => onPaymentModeChange && onPaymentModeChange('online')}
            className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              paymentMode === 'online'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-emerald-900/80 hover:text-emerald-950 hover:bg-white/40'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>پرداخت آنلاین شاپرک (تأیید آنی)</span>
          </button>
        </div>
      )}

      {/* در صورتی که مراجع گزینه پرداخت آنلاین اینترنتی شاپرک را انتخاب کرده باشد */}
      {allowOnlineGatewaySwitch && paymentMode === 'online' ? (
        <div className="p-4 sm:p-5 bg-white rounded-2xl border border-emerald-300 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 grid place-items-center shrink-0 border border-emerald-200">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <span className="text-sm font-extrabold text-slate-900 block">
                پرداخت امن مستقیم از طریق شبکه شاپرک
              </span>
              <span className="text-xs text-slate-500 block mt-0.5 leading-relaxed">
                با کلیه کارت‌های عضو شتاب، همراه با دریافت خودکار شناسه پرداخت و تأییدیه آنی بدون نیاز به بارگذاری فیش.
              </span>
            </div>
          </div>

          {/* انتخاب یا ورود مبلغ */}
          {(showCustomAmount || showPresetAmounts) && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              {showCustomAmount && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                    <span>مبلغ پرداختی (تومان):</span>
                    {parsedAmount > 0 && (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-mono">
                        {formatCurrency(parsedAmount)}
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
                      className="w-full p-2.5 rounded-xl border border-emerald-300 bg-white text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-2xs"
                    />
                    <span className="absolute left-3 top-2.5 text-[11px] text-slate-400 font-bold pointer-events-none">
                      تومان
                    </span>
                  </div>
                </div>
              )}

              {showPresetAmounts && presetAmounts && presetAmounts.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {presetAmounts.map((amt) => {
                    const persianFormatted = toPersianDigits(amt.toLocaleString('fa-IR'));
                    const isSelected = amountValue?.toString().replace(/[^\d]/g, '') === amt.toString();
                    return (
                      <button
                        key={amt}
                        type="button"
                        disabled={isReadOnly}
                        onClick={() => onAmountChange && onAmountChange(amt.toString())}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                            : 'bg-slate-50 hover:bg-emerald-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {persianFormatted} تومان
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* دکمه اتصال مستقیم به درگاه آنلاین */}
          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>اتصال ایمن SSL ۲۵۶ بیت تحت نظارت بانک مرکزی</span>
            </div>
            {onDirectPayClick && (
              <button
                type="button"
                onClick={onDirectPayClick}
                disabled={isReadOnly || parsedAmount <= 0}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <CreditCard className="w-4 h-4" />
                <span>ورود به درگاه پرداخت شاپرک ({parsedAmount > 0 ? formatCurrency(parsedAmount) : 'تعیین مبلغ'})</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        /* حالت کارت به کارت سنتی و هوشمند با اپلیکیشن‌ها */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          
          {/* ۱. کارت فیزیکی بانکی فوق‌العاده شیک با تم اختصاصی بانک */}
          <div className="lg:col-span-7 flex flex-col items-center">
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

            {/* نوار پرش مستقیم به اپلیکیشن‌های پرداخت و همراه بانک یا لینک‌های اختصاصی */}
            {((enableAppShortcuts && activePaymentApps.length > 0) || (customLinks && customLinks.some(l => l.enabled !== false && l.title && l.url))) && (
              <div className="w-full max-w-sm mt-3 pt-3 border-t border-amber-200/80 space-y-2.5">
                {enableAppShortcuts && activePaymentApps.length > 0 && (
                  <>
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-extrabold text-slate-800 flex items-center gap-1.5">
                        <Smartphone className="w-3.5 h-3.5 text-amber-600" />
                        <span>انتقال مستقیم با اپلیکیشن‌ها:</span>
                      </span>
                      <span className="text-[10px] text-amber-800 bg-amber-100 font-bold px-2 py-0.5 rounded-full border border-amber-200">
                        تزریق خودکار کارت و مبلغ
                      </span>
                    </div>

                    {/* دکمه‌های شکیل اپلیکیشن‌ها */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                      {activePaymentApps.map((app) => (
                        <button
                          key={app.id}
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => handleLaunchApp(app)}
                          className={`px-2 py-2 rounded-xl border text-[11px] font-extrabold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95 shadow-2xs ${app.badgeColor}`}
                          title={`انتقال کارت به کارت در ${app.name} با مبلغ و شماره کارت`}
                        >
                          <span className={`w-2 h-2 rounded-full ${app.dotColor} shrink-0`} />
                          <span className="truncate">{app.shortName}</span>
                          <ArrowUpRight className="w-3 h-3 opacity-60 shrink-0" />
                        </button>
                      ))}
                    </div>
                  </>
                )}

                {/* لینک‌های پرداخت و کارت‌به‌کارت سفارشی (مانند قبضینو، زیبال و...) */}
                {customLinks && customLinks.some(l => l.enabled !== false && l.title && l.url) && (
                  <div className="space-y-1.5 pt-0.5">
                    {customLinks
                      .filter((l) => l.enabled !== false && l.title && l.url)
                      .map((link) => (
                        <button
                          key={link.id}
                          type="button"
                          disabled={isReadOnly}
                          onClick={() => handleLaunchCustomLink(link)}
                          className="w-full px-3 py-2.5 rounded-xl border border-amber-300 bg-gradient-to-r from-amber-50 via-white to-amber-50/70 hover:from-amber-100/90 hover:to-orange-100 text-amber-950 font-bold text-xs flex items-center justify-between transition-all cursor-pointer active:scale-98 shadow-2xs group"
                          title={`انتقال وجه از طریق ${link.title}`}
                        >
                          <div className="flex items-center gap-2 truncate">
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 group-hover:scale-125 transition-transform" />
                            <span className="truncate">{link.title}</span>
                          </div>
                          <ArrowUpRight className="w-3.5 h-3.5 text-amber-700 shrink-0 opacity-70 group-hover:opacity-100 group-hover:-translate-x-0.5 transition-all" />
                        </button>
                      ))}
                  </div>
                )}

                {/* بنر راهنمای بازخورد هنگام کلیک روی اپلیکیشن یا لینک */}
                {launchedToast && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-950 text-[11px] flex items-start gap-2 animate-in fade-in slide-in-from-top-1">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div className="leading-relaxed flex-1">
                      <span className="font-bold block text-slate-800">شماره کارت در حافظه کپی شد</span>
                      <span className="text-[10px] text-slate-600 block mt-0.5 leading-relaxed">
                        {launchedToast.message || `در حال باز کردن ${launchedToast.appName}... پس از انتقال، کد رهگیری را در کادر زیر وارد فرمایید.`}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLaunchedToast(null)}
                      className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ۲. ستون مبالغ دلخواه پرداختی، چیپ‌های پیش‌فرض، کد رهگیری و بارگذاری تصویر فیش */}
          <div className="lg:col-span-5 space-y-3">
            {/* الف. ورود مبلغ دلخواه */}
            {showCustomAmount && (
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span>مبلغ دلخواه پرداختی (تومان):</span>
                  {parsedAmount > 0 && (
                    <span className="text-[10px] font-normal text-amber-900 bg-amber-100/70 px-2 py-0.5 rounded-full">
                      {formatCurrency(parsedAmount)}
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

            {/* ج. فیلد ورود کد رهگیری / شماره پیگیری بانکی */}
            {enableTrackingCode && (
              <div className="space-y-1 pt-1.5 border-t border-amber-200/80">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                    <Hash className="w-3.5 h-3.5 text-amber-600" />
                    <span>{trackingCodeTitle || (requireTrackingCode ? 'کد رهگیری / شماره پیگیری (الزامی):' : 'کد پیگیری تراکنش (اختیاری):')}</span>
                    {requireTrackingCode && <span className="text-rose-500 font-bold">*</span>}
                  </label>
                  {trackingCodeValue && (
                    <span className="text-[10px] text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>کد ثبت شد</span>
                    </span>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    disabled={isReadOnly}
                    placeholder="مثال: ۴۸۱۹۳۰۲۹ یا شماره ارجاع"
                    value={trackingCodeValue ? toPersianDigits(trackingCodeValue) : ''}
                    onChange={(e) => {
                      if (onTrackingCodeChange) {
                        const raw = cleanCardNumber(e.target.value);
                        onTrackingCodeChange(raw);
                      }
                    }}
                    className="w-full p-2.5 rounded-xl border border-amber-300/80 bg-white text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none transition-all shadow-2xs placeholder:font-sans placeholder:font-normal"
                  />
                  {trackingCodeValue && !isReadOnly && (
                    <button
                      type="button"
                      onClick={() => onTrackingCodeChange && onTrackingCodeChange('')}
                      className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer p-0.5"
                      title="پاک کردن"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <span className="text-[10px] text-slate-400 block leading-tight">
                  ارقام کد رهگیری درج شده در رسید اپلیکیشن پرداخت (آپ یا همراه بانک) را وارد فرمایید.
                </span>
              </div>
            )}

            {/* د. بخش بارگذاری تصویر فیش واریزی */}
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

        </div>
      )}

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

      {/* پنجره مودال دستیار هوشمند کارت‌به‌کارت و انتقال مستقیم وجه */}
      {activeAssistant && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in select-text"
          onClick={() => setActiveAssistant(null)}
          dir="rtl"
        >
          <div
            className="relative max-w-md w-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-amber-200 p-4 sm:p-6 space-y-4 max-h-[92vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* سربرگ مودال */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-9 h-9 rounded-xl ${activeAssistant.app ? `bg-gradient-to-br ${activeAssistant.app.gradient}` : 'bg-gradient-to-br from-amber-500 to-orange-600'} text-white grid place-items-center font-bold text-xs shadow-xs`}
                >
                  {activeAssistant.customLink ? <ExternalLink className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900 leading-tight">
                    {activeAssistant.customLink ? activeAssistant.customLink.title : (activeAssistant.app?.name || 'انتقال وجه')}
                  </h3>
                  <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                    {activeAssistant.customLink
                      ? 'کپی خودکار شماره کارت و هدایت به سامانه پرداخت'
                      : 'تزریق خودکار کارت مقصد و مبلغ به اپلیکیشن'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActiveAssistant(null)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer transition-colors"
                title="بستن"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* کادر ۱: شماره کارت مقصد */}
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-slate-700 flex items-center gap-1">
                  <CreditCard className="w-3.5 h-3.5 text-amber-600" />
                  <span>شماره کارت ۱۶ رقمی مقصد:</span>
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span>در حافظه گوشی کپی شد</span>
                </span>
              </div>
              <div className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                <span className="font-mono font-bold text-sm text-slate-900 tracking-wider select-all" dir="ltr">
                  {formatCardNumberPersian(activeAssistant.cleanCard, ' - ')}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
                      navigator.clipboard.writeText(activeAssistant.cleanCard);
                      setActiveAssistant((p) => p ? { ...p, copiedCard: true } : null);
                      setTimeout(() => setActiveAssistant((p) => p ? { ...p, copiedCard: false } : null), 2000);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-950 text-xs font-bold border border-amber-200 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                >
                  <Copy className="w-3.5 h-3.5 text-amber-700" />
                  <span>{activeAssistant.copiedCard ? 'کپی شد' : 'کپی مجدد'}</span>
                </button>
              </div>
              <div className="text-[10px] text-slate-500 flex items-center justify-between px-1">
                <span>به نام: {cardHolder || 'مرکز خدمات روانشناسی بالحق'}</span>
                <span>بانک: {activeBank.name}</span>
              </div>
            </div>

            {/* کادر ۲: مبلغ انتقال */}
            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-amber-950 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>مبلغ انتقال وجه:</span>
                </span>
                {activeAssistant.amountTomans > 0 ? (
                  <span className="text-[10px] text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                    مبلغ مشخص شده
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-500 font-normal">
                    مبلغ دلخواه
                  </span>
                )}
              </div>

              {activeAssistant.amountTomans > 0 ? (
                <div className="space-y-1.5">
                  <div className="bg-white p-2.5 rounded-xl border border-amber-200 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-sm font-black text-amber-950 font-mono">
                        {toPersianDigits(formatCurrency(activeAssistant.amountTomans))} تومان
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        ({toPersianDigits(formatCurrency(activeAssistant.amountRials))} ریال)
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={copyAmountTomans}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-[11px] font-bold border border-slate-300 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                        title="کپی رقم تومان برای جایگذاری"
                      >
                        {activeAssistant.copiedAmountTomans ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">کپی شد</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-slate-600" />
                            <span>کپی تومان</span>
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={copyAmountRials}
                        className="px-2 py-1 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-950 text-[11px] font-bold border border-amber-300 flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                        title="کپی رقم ریال برای جایگذاری در اپلیکیشن"
                      >
                        {activeAssistant.copiedAmountRials ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">کپی شد</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-amber-800" />
                            <span>کپی ریال</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-[11px] text-slate-600 bg-white p-2.5 rounded-xl border border-amber-100 leading-relaxed">
                  مبلغ در فرم مشخص نشده است. می‌توانید در اپلیکیشن، مبلغ دلخواه خود را وارد فرمایید یا ابتدا در کادر مبلغ فرم، رقم مدنظر را مشخص نمایید.
                </p>
              )}
            </div>

            {/* راهنمای هوشمند نحوه انتقال خودکار */}
            <div className="p-3 rounded-2xl bg-sky-50/80 border border-sky-200 text-[11px] text-sky-950 space-y-1.5">
              <span className="font-extrabold flex items-center gap-1 text-sky-900">
                <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0" />
                <span>نحوه عملکرد انتقال خودکار:</span>
              </span>
              <ul className="text-[10px] text-slate-700 space-y-1 pr-4 list-disc leading-relaxed">
                <li>
                  <strong>شماره کارت مقصد:</strong> به اپلیکیشن فرستاده شد و در کلیپ‌بورد ذخیره گردید. اپلیکیشن‌های پرداخت (همراه کارت، بلوبانک، آپ) به محض باز شدن شماره کارت را از حافظه تشخیص داده و کادر مقصد را به صورت خودکار پر می‌کنند.
                </li>
                <li>
                  <strong>مبلغ واریز:</strong> پارامتر مبلغ در لینک مستقیم ارسال شده است. همچنین با دکمه‌های بالا می‌توانید فوراً آن را کپی کرده و در اپلیکیشن بچسبانید.
                </li>
                <li>
                  <strong>ثبت کد رهگیری:</strong> پس از انجام کارت‌به‌کارت در برنامه، کد رهگیری بانکی را در کادر فرم ثبت نمایید.
                </li>
              </ul>
            </div>

            {/* دکمه‌های اقدام و هدایت */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleLaunchDirectly}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-700 hover:to-amber-800 text-white font-black text-xs shadow-md shadow-amber-900/10 flex items-center justify-center gap-2 cursor-pointer active:scale-98 transition-all"
              >
                {activeAssistant.customLink ? (
                  <>
                    <ExternalLink className="w-4 h-4" />
                    <span>ورود به {activeAssistant.customLink.title}</span>
                  </>
                ) : (
                  <>
                    <ArrowUpRight className="w-4 h-4" />
                    <span>ورود مستقیم به {activeAssistant.app?.name || 'اپلیکیشن'}</span>
                  </>
                )}
              </button>

              {activeAssistant.app && (
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  {activeAssistant.app.webUrl && (
                    <a
                      href={activeAssistant.app.webUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                      <span>نسخه تحت وب</span>
                    </a>
                  )}
                  {activeAssistant.app.bazaarUrl && (
                    <a
                      href={activeAssistant.app.bazaarUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold flex items-center justify-center gap-1 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-slate-500" />
                      <span>دانلود از کافه بازار</span>
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* دکمه بستن و ادامه فرم */}
            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setActiveAssistant(null)}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer"
              >
                بازگشت به فرم و ثبت کد پیگیری
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
