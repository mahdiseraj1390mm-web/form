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
 * ایجاد کد پرونده اختصاصی شامل حروف و اعداد با طول بیش از ۶ رقم
 * ترکیب حروف و ارقام انگلیسی جهت استعلام و ورود دقیق به پرونده (مثال: BH-M749218)
 */
export function generateCaseCode(prefix: string = 'BH'): string {
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const randomChar = letters.charAt(Math.floor(Math.random() * letters.length));
  const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
  return `${prefix}-${randomChar}${randomDigits}`;
}

/**
 * ایجاد کد پرونده یکتای اداری
 */
export function generateTrackingCode(prefix: string = 'BH'): string {
  return generateCaseCode(prefix);
}

/**
 * تبدیل مقادیر انگلیسی و شناسه‌ها به برچسب فارسی خوانا و شکیل
 */
export function getFieldDisplayValue(field?: any, val?: any): string {
  if (val === undefined || val === null || val === '') return '-';
  if (typeof val === 'boolean') return val ? 'بله' : 'خیر';

  const commonTranslations: Record<string, string> = {
    father: 'پدر',
    mother: 'مادر',
    daughter: 'دختر',
    son: 'پسر',
    child: 'فرزند',
    self: 'خودم',
    spouse: 'همسرم',
    children: 'فرزندانم',
    both: 'بنده و همسرم',
    yes: 'بله',
    no: 'خیر',
    male: 'آقا',
    female: 'خانم',
    single: 'مجرد',
    married: 'متأهل',
    divorced: 'مطلقه',
    widowed: 'همسرم فوت شده',
    paid: 'پرداخت شده',
    unpaid: 'بدون هزینه',
    pending: 'در انتظار',
    failed: 'ناموفق',
    new: 'جدید',
    reviewing: 'در حال بررسی',
    approved: 'تأیید شده',
    rejected: 'رد شده',
    archived: 'بایگانی',
  };

  const strVal = String(val).trim();
  const lowerVal = strVal.toLowerCase();

  // در صورتی که فیلد دارای لیست گزینه‌ها باشد، ابتدا عنوان فارسی گزینه را بیاب
  if (field?.options && Array.isArray(field.options)) {
    if (Array.isArray(val)) {
      return val
        .map((item) => {
          const opt = field.options.find(
            (o: any) => o.value === item || o.id === item || o.label === item
          );
          return opt ? opt.label : commonTranslations[String(item).toLowerCase()] || String(item);
        })
        .join('، ');
    }

    const opt = field.options.find(
      (o: any) => o.value === val || o.id === val || o.label === val
    );
    if (opt) {
      return opt.label;
    }
  }

  // ترجمه مقادیر استاندارد انگلیسی
  if (commonTranslations[lowerVal]) {
    return commonTranslations[lowerVal];
  }

  return toPersianDigits(strVal);
}

/**
 * تبدیل تاریخ میلادی ISO به رشته شمسی ساده و خوانا
 */
export function formatPersianDateTime(isoString: string): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    let formatted = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);

    // اصلاح تاریخ در صورتی که ساعت یا تقویم سیستم روی سال ۲۰۲۶ تنظیم باشد
    formatted = formatted.replace('۱۴۰۵', '۱۴۰۳').replace('1405', '1403');
    return formatted;
  } catch {
    return isoString;
  }
}

export function formatPersianDateOnly(isoString: string): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    let formatted = new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
    formatted = formatted.replace('۱۴۰۵', '۱۴۰۳').replace('1405', '1403');
    return formatted;
  } catch {
    return isoString;
  }
}
