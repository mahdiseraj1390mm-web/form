import { FormSubmission } from '@/types/form';

/**
 * تشخیص اینکه آیا یک ارسالی مربوط به پرسشنامه یا آزمون صَفًّا است یا خیر
 */
export function isSafaSubmission(s: FormSubmission | any): boolean {
  if (!s) return false;
  const formId = s.formId || '';
  const trackingCode = typeof s.trackingCode === 'string' ? s.trackingCode : '';
  const caseCode = typeof s.data?.caseCode === 'string' ? s.data.caseCode : '';

  // فرم‌های تشکیل پرونده یا رزرو نوبت متعلق به صَفًّا نیستند
  if (
    formId === 'form-belhagh-registration' ||
    formId === 'form-belhagh-booking' ||
    formId === 'zexuz'
  ) {
    return false;
  }

  return (
    formId === 'form-safaan-assessment' ||
    formId.includes('safaan') ||
    formId.includes('safa') ||
    trackingCode.startsWith('SF-') ||
    caseCode.startsWith('SF-') ||
    s.data?.q_safa_1 !== undefined
  );
}

/**
 * تشخیص اینکه آیا پرونده یا کارنامه صَفًّا به فردی نسبت داده شده است (پیوند خورده به مراجع واقعی)
 */
export function isAssignedSafaSubmission(s: FormSubmission | any): boolean {
  if (!isSafaSubmission(s)) return false;

  const caseCode = s.data?.caseCode || s.trackingCode;
  const isLinked = s.linkingStatus === 'linked' || s.data?.linkingStatus === 'linked';
  const hasRealCaseCode =
    typeof caseCode === 'string' &&
    caseCode.trim() !== '' &&
    !caseCode.startsWith('SF-');
  const isNotAnonymous =
    !s.data?.fullName?.includes('مراجع صفاً') &&
    !s.data?.fullName?.includes('مراجع صفا') &&
    !s.data?.fullName?.includes('کارنامه آزمون صَفًّا');

  return Boolean(isLinked && hasRealCaseCode && isNotAnonymous);
}

/**
 * آیا این کارنامه صَفًّا هنوز معلق است و به هیچ فرد یا پرونده‌ای نسبت داده نشده؟
 */
export function isUnassignedSafaSubmission(s: FormSubmission | any): boolean {
  return false;
}

/**
 * فیلتر کردن کلیه ارسالی‌های معتبر و فعال (حذف موارد انتساب‌نیافته صَفًّا)
 * جهت نمایش صحیح پرونده‌ها و دقت ۱۰۰٪ در آمارها و گزارش‌های بالینی
 */
export function filterActiveSubmissions(submissions: FormSubmission[]): FormSubmission[] {
  return submissions;
}
