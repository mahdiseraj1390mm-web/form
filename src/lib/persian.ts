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
export function generateCaseCode(prefix: string = 'SP'): string {
  // فرمت اختصاصی: شروع با حروف SP و ۶ رقم عدد (مثال: SP849201)
  const randomDigits = Math.floor(100000 + Math.random() * 900000).toString();
  return `SP${randomDigits}`;
}

/**
 * ایجاد کد پرونده یکتای اداری
 */
export function generateTrackingCode(prefix: string = 'SP'): string {
  return generateCaseCode(prefix);
}

/**
 * دریافت سال جاری شمسی به صورت کاملاً پویا و بر مبنای تقویم رسمی
 */
export function getCurrentJalaliYear(): number {
  try {
    const formatted = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', { year: 'numeric' }).format(new Date());
    const match = formatted.match(/\d{4}/);
    if (match) {
      const year = parseInt(match[0], 10);
      if (year >= 1400 && year <= 1500) {
        return year;
      }
    }
  } catch (e) {
    // fallback
  }
  return 1405;
}

/**
 * استخراج دقیق سال تولد شمسی از ورودی‌های گوناگون (مانند 1374/09/07، 74، 1374، 07/09/1374، 74/09/07 و ...)
 */
export function extractBirthYear(raw: any): number | null {
  if (!raw) return null;
  const str = toEnglishDigits(String(raw)).trim();
  if (!str) return null;

  // ۱. اگر رشته حاوی ۴ رقم سال شمسی باشد (۱۳۰۰ تا ۱۴۹۹)
  const match4 = str.match(/(13\d{2}|14\d{2})/);
  if (match4) {
    return parseInt(match4[1], 10);
  }

  // ۲. تفکیک بخش‌ها بر اساس جداکننده‌ها
  const parts = str.split(/[\/\-\.\s]/).filter(Boolean);
  if (parts.length === 1) {
    const num = parseInt(parts[0], 10);
    if (!isNaN(num)) {
      if (num >= 1300 && num <= 1499) return num;
      if (num >= 20 && num <= 99) return 1300 + num; // مثال: متولدین ۱۳۲۰ تا ۱۳۹۹
      if (num >= 0 && num < 20) return 1400 + num;  // مثال: متولدین ۱۴۰۰ تا ۱۴۱۹
    }
  } else if (parts.length >= 2) {
    const first = parseInt(parts[0], 10);
    const last = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(first) && first >= 1300 && first <= 1499) return first;
    if (!isNaN(last) && last >= 1300 && last <= 1499) return last;
    if (!isNaN(first) && first >= 20 && first <= 99 && (isNaN(last) || last <= 31)) return 1300 + first;
    if (!isNaN(last) && last >= 20 && last <= 99 && (isNaN(first) || first <= 31)) return 1300 + last;
    if (!isNaN(first) && first >= 0 && first < 20 && last > 12) return 1400 + first;
    if (!isNaN(last) && last >= 0 && last < 20 && first > 12) return 1400 + last;
  }

  return null;
}

/**
 * محاسبه دقیق سن شمسی
 * مطابق با عرف ایران و سیستم‌های پرونده: سال جاری منهای سال تولد
 * مثال برای متولد ۷۴ (۱۳۷۴) در سال جاری (۱۴۰۵): ۱۴۰۵ - ۱۳۷۴ = ۳۱ سال
 */
export function calculateJalaliAge(birthDateOrYear: any, fallbackAge?: any): number | null {
  const bYear = extractBirthYear(birthDateOrYear);
  if (bYear) {
    const currentYear = getCurrentJalaliYear();
    const age = currentYear - bYear;
    return Math.max(0, age);
  }

  // اگر سن مستقیماً به عنوان عدد وارد شده باشد
  if (fallbackAge !== undefined && fallbackAge !== null && fallbackAge !== '') {
    const num = parseInt(toEnglishDigits(String(fallbackAge)), 10);
    if (!isNaN(num) && num > 0 && num < 125) {
      return num;
    }
  }

  const directNum = parseInt(toEnglishDigits(String(birthDateOrYear || '')), 10);
  if (!isNaN(directNum) && directNum > 0 && directNum < 125) {
    return directNum;
  }

  return null;
}

/**
 * نمایش متنی و فارسی سن مراجع (مانند: «۳۱ سال» یا «ثبت‌نشده»)
 */
export function formatClientAge(birthDateOrYear: any, fallbackAge?: any): string {
  const age = calculateJalaliAge(birthDateOrYear, fallbackAge);
  if (age === null) return 'ثبت‌نشده';
  if (age === 0) return 'کمتر از یک سال';
  return `${toPersianDigits(age)} سال`;
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
    return formatted;
  } catch {
    return isoString;
  }
}

/**
 * دریافت نام ماه شمسی از تاریخ ISO
 */
export function getJalaliMonthName(isoString: string): string {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('fa-IR', { month: 'long' }).format(date);
  } catch {
    return '';
  }
}

/**
 * دریافت خلاصه بیشترین آیتم بر اساس مقادیر واقعی برای نمایش در فوتر نمودارها
 */
export function getTopItemSummary(
  items: Array<{ label: string; value: number }>,
  defaultUnit: string = 'مورد'
): string {
  if (!items || items.length === 0) return 'هنوز داده‌ای ثبت نشده است';
  const valid = items.filter((it) => it.value > 0);
  if (valid.length === 0) return 'هنوز داده‌ای ثبت نشده است';
  const top = [...valid].sort((a, b) => b.value - a.value)[0];
  return `بیشترین: ${top.label} (${toPersianDigits(top.value)} ${defaultUnit})`;
}
