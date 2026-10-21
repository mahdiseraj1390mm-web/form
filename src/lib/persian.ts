/**
 * الگوریتم استاندارد اعتبارسنجی کد ملی ۱۰ رقمی جمهوری اسلامی ایران
 */
export function isValidIranianNationalCode(code: string): boolean {
  if (!code || typeof code !== 'string') return false;
  
  // تبدیل ارقام فارسی یا عربی به انگلیسی
  const cleanCode = toEnglishDigits(code.trim());
  
  if (!/^\d{10}$/.test(cleanCode)) return false;

  // کدهای تکراری مانند 1111111111 یا 0000000000 معتبر نیستند
  const allIdentical = /^(\d)\1{9}$/.test(cleanCode);
  if (allIdentical) return false;

  const checkDigit = parseInt(cleanCode.charAt(9), 10);
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cleanCode.charAt(i), 10) * (10 - i);
  }

  const remainder = sum % 11;

  if (remainder < 2) {
    return checkDigit === remainder;
  } else {
    return checkDigit === 11 - remainder;
  }
}

/**
 * اعتبارسنجی شماره همراه ایرانی (شروع با 09 و ۱۱ رقم)
 */
export function isValidIranianMobile(mobile: string): boolean {
  if (!mobile) return false;
  const clean = toEnglishDigits(mobile.trim().replace(/\s+/g, ''));
  return /^09\d{9}$/.test(clean);
}

/**
 * تبدیل ارقام انگلیسی به فارسی
 */
export function toPersianDigits(input: string | number): string {
  if (input === null || input === undefined) return '';
  const str = input.toString();
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return str.replace(/\d/g, (d) => persianDigits[parseInt(d, 10)]);
}

/**
 * تبدیل ارقام فارسی/عربی به انگلیسی
 */
export function toEnglishDigits(input: string): string {
  if (!input) return '';
  return input
    .replace(/[۰-۹]/g, (d) => (d.charCodeAt(0) - 1776).toString())
    .replace(/[٠-٩]/g, (d) => (d.charCodeAt(0) - 1632).toString());
}

/**
 * قالب‌بندی مبلغ به تومان با جداکننده سه رقمی
 */
export function formatCurrency(amount: number, currency: 'IRT' | 'IRR' = 'IRT'): string {
  if (isNaN(amount)) return '۰ تومان';
  const formattedNumber = toPersianDigits(amount.toLocaleString('en-US'));
  return `${formattedNumber} ${currency === 'IRT' ? 'تومان' : 'ریال'}`;
}

/**
 * ایجاد کد پیگیری یکتای اداری تصادفی
 */
export function generateTrackingCode(prefix: string = 'FA'): string {
  const randomPart = Math.floor(100000 + Math.random() * 900000).toString();
  const yearSuffix = '1403';
  return `${prefix}-${yearSuffix}-${randomPart}`;
}

/**
 * تبدیل تاریخ میلادی ISO به رشته شمسی ساده و خوانا
 */
export function formatPersianDateTime(isoString: string): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch {
    return isoString;
  }
}

export function formatPersianDateOnly(isoString: string): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return isoString;
  }
}
