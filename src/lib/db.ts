import { neon } from '@neondatabase/serverless';
import { FormSubmission } from '@/types/form';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_hbad8wm9oYIT@ep-flat-band-b70xzvhu-pooler.c-13.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

export const sql = neon(connectionString);

export interface CaseRecord {
  id: number;
  case_code: string;
  mobile: string;
  first_name?: string;
  last_name?: string;
  province?: string;
  city?: string;
  data: Record<string, any>;
  created_at: string;
}

/**
 * استانداردسازی شماره موبایل به فرمت ۱۱ رقمی ایرانی (۰۹۱۲۳۴۵۶۷۸۹)
 */
export function normalizeMobile(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, '');
  if (digits.startsWith('98') && digits.length === 12) {
    return '0' + digits.slice(2);
  }
  if (!digits.startsWith('0') && digits.length === 10) {
    return '0' + digits;
  }
  return digits;
}

/**
 * جستجوی پرونده بر اساس شماره موبایل در دیتابیس Neon
 */
export async function getCaseByMobile(mobile: string): Promise<CaseRecord | null> {
  const clean = normalizeMobile(mobile);
  if (!clean || clean.length < 10) return null;

  try {
    const rows = await sql.query(
      `SELECT * FROM belhagh_cases WHERE mobile = $1 LIMIT 1`,
      [clean]
    );
    return (rows[0] as CaseRecord) || null;
  } catch (err) {
    console.error('Error in getCaseByMobile:', err);
    return null;
  }
}

/**
 * جستجوی پرونده بر اساس کد پرونده اختصاصی
 */
export async function getCaseByCode(caseCode: string): Promise<CaseRecord | null> {
  if (!caseCode) return null;
  const cleanCode = caseCode.trim().toUpperCase();

  try {
    const rows = await sql.query(
      `SELECT * FROM belhagh_cases WHERE UPPER(case_code) = $1 LIMIT 1`,
      [cleanCode]
    );
    return (rows[0] as CaseRecord) || null;
  } catch (err) {
    console.error('Error in getCaseByCode:', err);
    return null;
  }
}

/**
 * ثبت پرونده جدید یا بازگرداندن پرونده قبلی در صورت ثبت‌نام تکراری
 */
export async function createCaseRecord(
  caseCode: string,
  mobile: string,
  data: Record<string, any>
): Promise<{ isNew: boolean; caseRecord: CaseRecord }> {
  const cleanMobile = normalizeMobile(mobile);
  const cleanCode = caseCode.trim().toUpperCase();

  // ۱. بررسی وجود قبلی شماره همراه
  const existing = await getCaseByMobile(cleanMobile);
  if (existing) {
    return { isNew: false, caseRecord: existing };
  }

  const firstName = data.f_name || data.f_applicant_name || '';
  const lastName = data.f_family || '';
  let province = data.f_province_city_province || '';
  let city = data.f_province_city_city || '';

  if (data.f_province_city && typeof data.f_province_city === 'string' && data.f_province_city.includes(' - ')) {
    const parts = data.f_province_city.split(' - ');
    if (!province) province = parts[0]?.trim() || '';
    if (!city) city = parts[1]?.trim() || '';
  }

  try {
    const rows = await sql.query(
      `INSERT INTO belhagh_cases (case_code, mobile, first_name, last_name, province, city, data)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [cleanCode, cleanMobile, firstName, lastName, province, city, JSON.stringify(data)]
    );

    // ثبت همگام در جدول form_submissions برای نمایش فوری در کارتابل
    try {
      await sql.query(
        `INSERT INTO form_submissions (id, form_id, tracking_code, mobile, data, status, payment_status, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
        [
          `sub-case-${cleanCode}`,
          'form-belhagh-registration',
          cleanCode,
          cleanMobile,
          JSON.stringify({ ...data, caseCode: cleanCode }),
          'new',
          'none',
          new Date().toISOString()
        ]
      );
    } catch (e) {
      console.warn('Sync to form_submissions warning:', e);
    }

    return { isNew: true, caseRecord: rows[0] as CaseRecord };
  } catch (err: any) {
    // در صورت وجود همزمان (race condition)
    const fallback = await getCaseByMobile(cleanMobile);
    if (fallback) {
      return { isNew: false, caseRecord: fallback };
    }
    throw err;
  }
}

/**
 * ذخیره رویداد پاسخ فرم در دیتابیس
 */
export async function saveFormSubmissionToDb(sub: FormSubmission): Promise<void> {
  const mobile = normalizeMobile(String(sub.data?.f_mobile || sub.data?.mobile || sub.data?.f_phone || ''));

  try {
    await sql.query(
      `INSERT INTO form_submissions (id, form_id, tracking_code, mobile, data, status, payment_status, payment_amount, payment_ref_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         payment_status = EXCLUDED.payment_status,
         data = EXCLUDED.data`,
      [
        sub.id,
        sub.formId,
        sub.trackingCode || null,
        mobile || null,
        JSON.stringify(sub.data || {}),
        sub.status || 'new',
        sub.paymentStatus || 'none',
        sub.paymentAmount || null,
        sub.paymentRefId || null,
        sub.createdAt || new Date().toISOString(),
      ]
    );
  } catch (err) {
    console.error('Error saving form submission to DB:', err);
  }
}

/**
 * استخراج همه پاسخ‌های فرم‌ها از پایگاه‌داده
 */
export async function getFormSubmissionsFromDb(formId?: string): Promise<FormSubmission[]> {
  try {
    const isFiltered = formId && formId !== 'all';
    const query = isFiltered
      ? `SELECT * FROM form_submissions WHERE form_id = $1 ORDER BY created_at DESC LIMIT 500`
      : `SELECT * FROM form_submissions ORDER BY created_at DESC LIMIT 500`;
    const params = isFiltered ? [formId] : [];
    const rows = await sql.query(query, params);

    return rows.map((r: any) => ({
      id: r.id,
      formId: r.form_id,
      trackingCode: r.tracking_code,
      data: typeof r.data === 'string' ? JSON.parse(r.data) : r.data,
      status: r.status,
      paymentStatus: r.payment_status,
      paymentAmount: r.payment_amount ? Number(r.payment_amount) : undefined,
      paymentRefId: r.payment_ref_id,
      createdAt: r.created_at,
      userIp: '185.143.232.19',
      comments: [],
    }));
  } catch (err) {
    console.error('Error fetching submissions from DB:', err);
    return [];
  }
}
