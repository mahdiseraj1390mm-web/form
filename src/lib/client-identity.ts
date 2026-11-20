/**
 * مدیریت یکپارچه هویت و مشخصات مراجعان مرکز مشاوره و روانشناسی بالحق
 * منبع واحد حقیقت (Single Source of Truth) برای نرمال‌سازی و استخراج مشخصات مراجع
 */

export const PLACEHOLDER_CLIENT_NAMES: readonly string[] = [
  'مراجع محترم',
  'مُراجع محترم',
  'مراجع',
  'مُراجع',
  'مراجع مرکز بالحق',
  'مراجع محترم مرکز بالحق',
  'مراجع صفاً',
  'مراجع صفا',
  'کاربر ناشناس',
  'کاربر مهمان',
  'ثبت‌نشده',
  'بدون نام',
  'ناشناس',
];

/**
 * تشخیص نامعتبر بودن یا پیش‌فرض بودن نام مراجع
 */
export function isPlaceholderClientName(name: string | undefined | null): boolean {
  if (!name) return true;
  const clean = String(name).trim();
  if (!clean) return true;
  return PLACEHOLDER_CLIENT_NAMES.includes(clean);
}

/**
 * استانداردسازی کد پرونده (تبدیل اعداد فارسی، حذف پیشوندهای فنی، حروف بزرگ انگلیسی)
 */
export function normalizeCaseCode(code: any): string {
  if (!code) return '';
  return String(code)
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/^sub-case-/i, '')
    .replace(/^sub-/i, '')
    .trim()
    .toUpperCase();
}

/**
 * استانداردسازی شماره همراه ایران به فرمت ۱۰ رقم نهایی (بدون صفر اول و پیشوند کشور)
 */
export function normalize10DigitMobile(phone: any): string {
  if (!phone) return '';
  const digits = String(phone)
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/\D/g, '');
  return digits.length >= 10 ? digits.slice(-10) : digits;
}

/**
 * استخراج تفکیک‌شده و استاندارد نام، نام‌خانوادگی و نام کامل از داده‌های فرم
 * جلوگیری قطعی از تکرار نام (مانند «علی رضایی رضایی») و حذف نام‌های پیش‌فرض
 */
export function extractCleanName(data: Record<string, any> | undefined | null): {
  firstName: string;
  lastName: string;
  fullName: string;
} {
  if (!data || typeof data !== 'object') {
    return { firstName: '', lastName: '', fullName: '' };
  }

  const rawFName = String(data.f_name || data.firstName || data.f_applicant_name || '').trim();
  const rawLName = String(data.f_family || data.lastName || '').trim();
  const rawFullName = String(data.fullName || data.f_fullname || data.f_client_name || '').trim();

  let firstName = isPlaceholderClientName(rawFName) ? '' : rawFName;
  let lastName = isPlaceholderClientName(rawLName) ? '' : rawLName;
  let fullName = isPlaceholderClientName(rawFullName) ? '' : rawFullName;

  // اگر نام کامل وجود دارد ولی نام یا نام‌خانوادگی تفکیک نشده است
  if (fullName && (!firstName || !lastName)) {
    const parts = fullName.split(/\s+/).filter(Boolean);
    if (!firstName && parts.length > 0) {
      firstName = parts[0];
    }
    if (!lastName && parts.length > 1) {
      lastName = parts.slice(1).join(' ');
    }
  }

  // در صورتی که نام و نام‌خانوادگی موجود است
  if (firstName || lastName) {
    if (lastName && firstName.endsWith(` ${lastName}`)) {
      firstName = firstName.slice(0, -(lastName.length + 1)).trim();
    }
    const combined = `${firstName} ${lastName}`.trim();
    if (!fullName || fullName === firstName || fullName === lastName) {
      fullName = combined;
    }
  }

  return { firstName, lastName, fullName };
}
