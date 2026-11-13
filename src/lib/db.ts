import { Pool } from 'pg';
import { Form, FormSubmission } from '@/types/form';
import { belhaghInitialSubmissions } from '@/lib/belhagh-initial-submissions';
import { safaanInitialSubmissions } from '@/lib/safaan-submissions';
import fs from 'fs';
import path from 'path';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://belhagh:belhagh@2026!secure@127.0.0.1:5432/belhagh_db';

declare global {
  // eslint-disable-next-line no-var
  var __belhagh_pg_pool: Pool | undefined;
}

const isLocal =
  connectionString.includes('localhost') ||
  connectionString.includes('127.0.0.1') ||
  connectionString.includes('192.168.');

export const pool: Pool =
  global.__belhagh_pg_pool ||
  new Pool({
    connectionString,
    ssl: isLocal ? false : { rejectUnauthorized: false },
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
  });

if (process.env.NODE_ENV !== 'production') {
  global.__belhagh_pg_pool = pool;
}

const LOCAL_SUBMISSIONS_FILE = path.join(process.cwd(), 'data', 'submissions.json');

let lastDbFailureTime = 0;
let lastDbErrorLoggedTime = 0;
const DB_FAILURE_COOLDOWN_MS = 30000;

async function executeDbQueryWithTimeout(queryText: string, params: any[] = []): Promise<any> {
  // در صورتی که دیتابیس در دسترس نباشد، تا ۳۰ ثانیه برای هر درخواست معطل نمانده و سریعاً به فایل محلی فال‌بک می‌شود
  if (Date.now() - lastDbFailureTime < DB_FAILURE_COOLDOWN_MS) {
    throw new Error('Database connection temporarily unavailable (cooling down)');
  }

  let timer: any;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('PostgreSQL DB query timeout')), 5000);
  });

  try {
    const res = await Promise.race([
      pool.query(queryText, params),
      timeoutPromise,
    ]);
    lastDbFailureTime = 0;
    return (res as any).rows;
  } catch (err: any) {
    lastDbFailureTime = Date.now();
    if (Date.now() - lastDbErrorLoggedTime > 30000) {
      console.warn('DB query error (falling back to local cache):', err?.message || err);
      lastDbErrorLoggedTime = Date.now();
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * تابع کوئری sql با پشتیبانی دوگانه:
 * ۱. تگ تمپلیت لیترال: sql`SELECT * FROM table WHERE id = ${val}`
 * ۲. متد سنتی: (sql as any).query(queryText, params)
 */
export async function sql(strings: TemplateStringsArray | string, ...values: any[]): Promise<any> {
  if (typeof strings === 'string') {
    return executeDbQueryWithTimeout(strings, values[0] || []);
  }

  let queryText = '';
  const queryParams: any[] = [];
  for (let i = 0; i < strings.length; i++) {
    queryText += strings[i];
    if (i < values.length) {
      queryParams.push(values[i]);
      queryText += `$${queryParams.length}`;
    }
  }

  return executeDbQueryWithTimeout(queryText, queryParams);
}

(sql as any).query = async (queryText: string, params: any[] = []) => {
  return executeDbQueryWithTimeout(queryText, params);
};

// نگهداری سازگاری کامل با کدهای قبلی
const executeNeonQueryWithTimeout = executeDbQueryWithTimeout;

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
  const digits = String(phone).replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, '');
  if (digits.startsWith('98') && digits.length === 12) {
    return '0' + digits.slice(2);
  }
  if (!digits.startsWith('0') && digits.length === 10) {
    return '0' + digits;
  }
  return digits;
}

/**
 * خواندن پاسخ‌ها از فایل محلی پایدار در صورت عدم دسترسی به دیتابیس
 */
function readLocalSubmissions(): FormSubmission[] {
  try {
    if (fs.existsSync(LOCAL_SUBMISSIONS_FILE)) {
      const content = fs.readFileSync(LOCAL_SUBMISSIONS_FILE, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map((s: any) => ({
          ...s,
          comments: Array.isArray(s.comments) ? s.comments : (Array.isArray(s.data?.comments) ? s.data.comments : []),
        }));
      }
    }
  } catch (err) {
    console.warn('Error reading local submissions file:', err);
  }
  return [...belhaghInitialSubmissions, ...safaanInitialSubmissions].map((s: any) => ({
    ...s,
    comments: Array.isArray(s.comments) ? s.comments : [],
  }));
}

/**
 * ذخیره پاسخ‌ها در فایل محلی پایدار
 */
function writeLocalSubmissions(subs: FormSubmission[]): void {
  try {
    const dir = path.dirname(LOCAL_SUBMISSIONS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_SUBMISSIONS_FILE, JSON.stringify(subs), 'utf8');
  } catch (err) {
    console.warn('Error writing local submissions file:', err);
  }
}

/**
 * جستجوی پرونده بر اساس شماره موبایل در دیتابیس (با فال‌بک فایل محلی)
 */
export async function getCaseByMobile(mobile: string): Promise<CaseRecord | null> {
  const clean = normalizeMobile(mobile);
  if (!clean || clean.length < 10) return null;

  try {
    const rows = await executeNeonQueryWithTimeout(
      `SELECT * FROM belhagh_cases WHERE mobile = $1 LIMIT 1`,
      [clean]
    );
    if (rows && rows[0]) return rows[0] as CaseRecord;
  } catch (err) {
    // نادیده گرفتن خطا و استفاده از مخزن محلی
  }

  // بررسی در فایل محلی
  const localSubs = readLocalSubmissions();
  const found = localSubs.find(
    (s) => normalizeMobile(s.mobile || s.data?.f_mobile || s.data?.mobile || '') === clean
  );
  if (found) {
    const cCode = found.data?.caseCode || found.trackingCode;
    return {
      id: 1,
      case_code: cCode,
      mobile: clean,
      first_name: found.data?.f_name || found.data?.fullName || '',
      last_name: found.data?.f_family || '',
      province: found.data?.f_province_city || '',
      city: '',
      data: found.data || {},
      created_at: found.createdAt,
    };
  }

  return null;
}

/**
 * جستجوی پرونده بر اساس کد پرونده اختصاصی
 */
export async function getCaseByCode(caseCode: string): Promise<CaseRecord | null> {
  if (!caseCode) return null;
  const digits = caseCode.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).trim();
  const cleanCode = digits.toUpperCase();
  const strippedCode = cleanCode.replace(/^(SF|CASE|SP)-/i, '');

  try {
    const rows = await executeNeonQueryWithTimeout(
      `SELECT * FROM belhagh_cases 
       WHERE UPPER(case_code) = $1 OR UPPER(case_code) = $2 OR UPPER(case_code) = $3 
       LIMIT 1`,
      [cleanCode, `SF-${strippedCode}`, `CASE-${strippedCode}`]
    );
    if (rows && rows[0]) {
      return rows[0] as CaseRecord;
    }

    const subRows = await executeNeonQueryWithTimeout(
      `SELECT * FROM form_submissions 
       WHERE UPPER(tracking_code) = $1 
          OR UPPER(tracking_code) = $2 
          OR data->>'caseCode' = $1 
          OR data->>'caseCode' = $2 
          OR data->>'userCode' = $1 
          OR data->>'userCode' = $3
          OR tracking_code ILIKE $4
       ORDER BY created_at DESC LIMIT 1`,
      [cleanCode, `SF-${strippedCode}`, strippedCode, `%${strippedCode}%`]
    );

    if (subRows && subRows[0]) {
      const sub = subRows[0];
      const dataObj = typeof sub.data === 'string' ? JSON.parse(sub.data) : sub.data || {};
      return {
        id: sub.id,
        case_code: sub.tracking_code || dataObj.caseCode || cleanCode,
        mobile: sub.mobile || dataObj.mobile || '',
        first_name: dataObj.fullName || dataObj.f_name || 'مراجع صفاً',
        last_name: dataObj.f_family || '',
        province: dataObj.province || dataObj.f_province_city_province || '',
        city: dataObj.city || dataObj.f_province_city_city || '',
        data: dataObj,
        created_at: sub.created_at,
      };
    }
  } catch (err) {
    // نادیده گرفتن خطا و استفاده از مخزن محلی
  }

  // بررسی در فایل محلی
  const localSubs = readLocalSubmissions();
  const found = localSubs.find((s) => {
    const track = (s.trackingCode || '').toUpperCase();
    const cCode = (s.data?.caseCode || '').toUpperCase();
    const uCode = (s.data?.user_code || '').toUpperCase();
    return (
      track === cleanCode ||
      track === `SF-${strippedCode}` ||
      cCode === cleanCode ||
      uCode === strippedCode ||
      track.includes(strippedCode)
    );
  });

  if (found) {
    return {
      id: 1,
      case_code: found.data?.caseCode || found.trackingCode,
      mobile: found.mobile || found.data?.f_mobile || '',
      first_name: found.data?.fullName || found.data?.f_name || '',
      last_name: found.data?.f_family || '',
      province: found.data?.f_province_city || '',
      city: '',
      data: found.data || {},
      created_at: found.createdAt,
    };
  }

  return null;
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

  const newRecord: CaseRecord = {
    id: Date.now(),
    case_code: cleanCode,
    mobile: cleanMobile,
    first_name: firstName,
    last_name: lastName,
    province,
    city,
    data: { ...data, caseCode: cleanCode },
    created_at: new Date().toISOString(),
  };

  try {
    const rows = await executeNeonQueryWithTimeout(
      `INSERT INTO belhagh_cases (case_code, mobile, first_name, last_name, province, city, data)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [cleanCode, cleanMobile, firstName, lastName, province, city, JSON.stringify(data)]
    );
    if (rows && rows[0]) newRecord.id = rows[0].id;
  } catch (err) {
    // نادیده گرفتن خطای دیتابیس
  }

  // ثبت در جدول form_submissions و فایل محلی
  const subObj: FormSubmission = {
    id: `sub-case-${cleanCode}`,
    formId: 'form-belhagh-registration',
    trackingCode: cleanCode,
    mobile: cleanMobile,
    data: { ...data, caseCode: cleanCode, fullName: `${firstName} ${lastName}`.trim() },
    status: 'new',
    paymentStatus: 'none',
    createdAt: new Date().toISOString(),
    comments: [],
  };

  await saveFormSubmissionToDb(subObj);
  return { isNew: true, caseRecord: newRecord };
}

/**
 * ذخیره رویداد پاسخ فرم در پایگاه‌داده با به‌روزرسانی همزمان فایل پایدار
 */
export async function saveFormSubmissionToDb(sub: FormSubmission): Promise<void> {
  const mobile = normalizeMobile(String(sub.data?.f_mobile || sub.data?.mobile || sub.data?.f_phone || sub.mobile || ''));
  const isReg = sub.formId === 'form-belhagh-registration' || sub.formId === 'zexuz';
  const isBooking = sub.formId === 'form-belhagh-booking' || sub.formId === '3uu4z';
  const bookingSlot = Object.entries(sub.data || {}).find(([k, v]) => k.startsWith('f_booking_') && v)?.[1];
  const cCode = sub.data?.caseCode || sub.trackingCode;
  const canonicalId = (isReg && cCode)
    ? (cCode.startsWith('sub-case-') ? cCode : `sub-case-${cCode}`)
    : sub.id;

  const commentsList = Array.isArray(sub.comments)
    ? sub.comments
    : (Array.isArray(sub.data?.comments) ? sub.data.comments : []);

  const updatedSub: FormSubmission = {
    ...sub,
    id: canonicalId,
    mobile: mobile || sub.mobile,
    data: {
      ...(sub.data || {}),
      caseCode: cCode,
      fullName: sub.data?.fullName || sub.data?.f_fullname || `${sub.data?.f_name || ''} ${sub.data?.f_family || ''}`.trim(),
      evaluationResult: sub.evaluationResult || sub.data?.evaluationResult,
      comments: commentsList,
    },
    evaluationResult: sub.evaluationResult || sub.data?.evaluationResult,
    comments: commentsList,
  };

  // ۱. ذخیره بی‌درنگ در مخزن محلی مطمئن
  try {
    const local = readLocalSubmissions();
    const idx = local.findIndex((s) =>
      s.id === canonicalId ||
      s.id === sub.id ||
      (isReg && ((cCode && (s.trackingCode === cCode || s.data?.caseCode === cCode)) || (mobile && (s.mobile === mobile || s.data?.f_mobile === mobile)))) ||
      (isBooking && cCode && bookingSlot && (s.trackingCode === cCode || s.data?.caseCode === cCode) && JSON.stringify(s.data || {}).includes(String(bookingSlot)))
    );

    if (idx !== -1) {
      local[idx] = { ...local[idx], ...updatedSub, data: { ...local[idx].data, ...updatedSub.data } };
    } else {
      local.unshift(updatedSub);
    }
    writeLocalSubmissions(local);
  } catch (e) {
    console.warn('Local file save warning:', e);
  }

  // ۲. ارسال به پایگاه‌داده PostgreSQL
  try {
    // برای فرم‌های ثبت‌نام، رکوردهای تکراری احتمالی پیشین با شناسه‌های قدیمی پاکسازی می‌شوند
    if (isReg && (cCode || mobile)) {
      await executeNeonQueryWithTimeout(
        `DELETE FROM form_submissions 
         WHERE (form_id = 'form-belhagh-registration' OR form_id = 'zexuz')
           AND id != $1 
           AND (
             tracking_code = $2 
             OR data->>'caseCode' = $2 
             OR mobile = $3
           )`,
        [canonicalId, cCode, mobile]
      ).catch(() => {});
    }

    // برای فرم‌های رزرو نوبت مشاوره، رکوردهای تکراری ناشی از دابل‌کلیک مراجع برای همان زمان پاکسازی می‌شوند
    if (isBooking && cCode && bookingSlot) {
      await executeNeonQueryWithTimeout(
        `DELETE FROM form_submissions 
         WHERE (form_id = 'form-belhagh-booking' OR form_id = '3uu4z')
           AND id != $1 
           AND (tracking_code = $2 OR data->>'caseCode' = $2)
           AND data::text LIKE $3`,
        [canonicalId, cCode, `%${bookingSlot}%`]
      ).catch(() => {});
    }

    await executeNeonQueryWithTimeout(
      `INSERT INTO form_submissions (id, form_id, tracking_code, mobile, data, status, payment_status, payment_amount, payment_ref_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
         tracking_code = EXCLUDED.tracking_code,
         status = EXCLUDED.status,
         payment_status = EXCLUDED.payment_status,
         mobile = EXCLUDED.mobile,
         data = EXCLUDED.data`,
      [
        canonicalId,
        sub.formId,
        cCode || sub.trackingCode || null,
        mobile || null,
        JSON.stringify(updatedSub.data || {}),
        sub.status || 'new',
        sub.paymentStatus || 'none',
        sub.paymentAmount || null,
        sub.paymentRefId || null,
        sub.createdAt || new Date().toISOString(),
      ]
    );
  } catch (err) {
    // ثبت خطا به صورت اخطار بدون شکست فرآیند برنامه
  }
}

/**
 * استخراج همه پاسخ‌های فرم‌ها همراه با پشتیبانی از فیلتر فرم، جستجو و انعطاف‌پذیری ۱۰۰٪
 */

/**
 * به‌روزرسانی فیلدهای داده پرونده/پاسخ فرم در دیتابیس و فایل پایدار
 */
export async function updateSubmissionDataInDb(
  submissionId: string,
  updatedFields: Record<string, any>
): Promise<boolean> {
  if (!submissionId || !updatedFields) return false;

  const cleanId = submissionId.trim();
  const bareCode = cleanId.replace(/^sub-case-/, '').replace(/^sub-/, '').trim();
  const cCode = updatedFields.caseCode || bareCode || cleanId;
  const newFullName = `${updatedFields.f_name || ''} ${updatedFields.f_family || ''}`.trim();
  const newMobile = normalizeMobile(updatedFields.f_mobile || updatedFields.mobile || '');
  const statusToUpdate = updatedFields.clinical_status || updatedFields.caseStatus || updatedFields.status;

  // ۱. به‌روزرسانی در مخزن فایل محلی
  try {
    const local = readLocalSubmissions();
    let updatedCount = 0;
    for (let i = 0; i < local.length; i++) {
      const s = local[i];
      const sCode = (s.data?.caseCode || s.trackingCode || '').trim();
      const sBare = sCode.replace(/^sub-case-/, '').replace(/^sub-/, '').trim();
      const isMatch =
        s.id === cleanId ||
        s.trackingCode === cleanId ||
        s.data?.caseCode === cleanId ||
        (bareCode && (s.id === `sub-case-${bareCode}` || s.trackingCode === bareCode || s.data?.caseCode === bareCode || sBare === bareCode)) ||
        (cCode && (s.trackingCode === cCode || s.data?.caseCode === cCode));

      if (isMatch) {
        local[i] = {
          ...s,
          status: (statusToUpdate && ['regressing', 'needs_followup', 'growing', 'optimal', 'approved', 'rejected', 'new'].includes(statusToUpdate))
            ? statusToUpdate
            : s.status,
          mobile: newMobile || s.mobile,
          data: {
            ...(s.data || {}),
            ...updatedFields,
            ...(statusToUpdate ? { caseStatus: statusToUpdate, clinical_status: statusToUpdate } : {}),
            ...(newFullName ? { fullName: newFullName } : {}),
            ...(cCode ? { caseCode: cCode } : {}),
          },
        };
        updatedCount++;
      }
    }
    if (updatedCount > 0) {
      writeLocalSubmissions(local);
    }
  } catch (err) {
    console.warn('Local updateSubmissionData warning:', err);
  }

  // ۲. به‌روزرسانی در پایگاه‌داده PostgreSQL
  try {
    await executeNeonQueryWithTimeout(
      `UPDATE form_submissions 
       SET data = data || $1::jsonb,
           mobile = COALESCE($2, mobile),
           status = COALESCE($4, status)
       WHERE id = $3 OR tracking_code = $3 OR data->>'caseCode' = $3 OR tracking_code = $5 OR data->>'caseCode' = $5`,
      [JSON.stringify(updatedFields), newMobile || null, cleanId, statusToUpdate || null, bareCode || cleanId]
    );

    if (newFullName || newMobile) {
      const parts = newFullName.split(' ');
      const fName = parts[0] || '';
      const lName = parts.slice(1).join(' ') || '';
      await executeNeonQueryWithTimeout(
        `UPDATE belhagh_cases 
         SET first_name = COALESCE($1, first_name),
             last_name = COALESCE($2, last_name),
             mobile = COALESCE($3, mobile),
             data = data || $4::jsonb
         WHERE case_code = $5 OR mobile = $3`,
        [fName || null, lName || null, newMobile || null, JSON.stringify(updatedFields), cleanId]
      ).catch(() => {});
    }
  } catch (err) {
    console.warn('DB updateSubmissionData warning:', err);
  }

  return true;
}

/**
 * ویرایش متن یادداشت/پیگیری در پرونده مراجع
 */
export async function editSubmissionCommentInDb(
  submissionId: string,
  commentId: string,
  newContent: string
): Promise<boolean> {
  if (!submissionId || !commentId || !newContent.trim()) return false;
  const cleanId = submissionId.trim();

  // ۱. فایل محلی
  try {
    const local = readLocalSubmissions();
    let found = false;
    for (const s of local) {
      if (
        s.id === cleanId ||
        s.trackingCode === cleanId ||
        s.data?.caseCode === cleanId
      ) {
        if (Array.isArray(s.comments)) {
          const c = s.comments.find((item: any) => item.id === commentId);
          if (c) {
            c.content = newContent.trim();
            (c as any).updatedAt = new Date().toISOString();
            found = true;
          }
        }
        if (s.data && Array.isArray(s.data.comments)) {
          const c = s.data.comments.find((item: any) => item.id === commentId);
          if (c) {
            c.content = newContent.trim();
            (c as any).updatedAt = new Date().toISOString();
            found = true;
          }
        }
      }
    }
    if (found) writeLocalSubmissions(local);
  } catch (err) {
    console.warn('Local editSubmissionComment warning:', err);
  }

  // ۲. دیتابیس
  try {
    const rows = await executeNeonQueryWithTimeout(
      `SELECT id, data FROM form_submissions WHERE id = $1 OR tracking_code = $1 OR data->>'caseCode' = $1 LIMIT 1`,
      [cleanId]
    );
    if (rows && rows[0]) {
      const dataObj = typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data || {};
      if (Array.isArray(dataObj.comments)) {
        const c = dataObj.comments.find((item: any) => item.id === commentId);
        if (c) {
          c.content = newContent.trim();
          (c as any).updatedAt = new Date().toISOString();
          await executeNeonQueryWithTimeout(
            `UPDATE form_submissions SET data = $1 WHERE id = $2`,
            [JSON.stringify(dataObj), rows[0].id]
          );
        }
      }
    }
  } catch (err) {
    console.warn('DB editSubmissionComment warning:', err);
  }

  return true;
}

/**
 * حذف یادداشت/پیگیری از پرونده مراجع
 */
export async function deleteSubmissionCommentInDb(
  submissionId: string,
  commentId: string
): Promise<boolean> {
  if (!submissionId || !commentId) return false;
  const cleanId = submissionId.trim();

  // ۱. فایل محلی
  try {
    const local = readLocalSubmissions();
    let found = false;
    for (const s of local) {
      if (
        s.id === cleanId ||
        s.trackingCode === cleanId ||
        s.data?.caseCode === cleanId
      ) {
        if (Array.isArray(s.comments)) {
          s.comments = s.comments.filter((item) => item.id !== commentId);
          found = true;
        }
        if (s.data && Array.isArray(s.data.comments)) {
          s.data.comments = s.data.comments.filter((item) => item.id !== commentId);
          found = true;
        }
      }
    }
    if (found) writeLocalSubmissions(local);
  } catch (err) {
    console.warn('Local deleteSubmissionComment warning:', err);
  }

  // ۲. دیتابیس
  try {
    const rows = await executeNeonQueryWithTimeout(
      `SELECT id, data FROM form_submissions WHERE id = $1 OR tracking_code = $1 OR data->>'caseCode' = $1 LIMIT 1`,
      [cleanId]
    );
    if (rows && rows[0]) {
      const dataObj = typeof rows[0].data === 'string' ? JSON.parse(rows[0].data) : rows[0].data || {};
      if (Array.isArray(dataObj.comments)) {
        dataObj.comments = dataObj.comments.filter((item: any) => item.id !== commentId);
        await executeNeonQueryWithTimeout(
          `UPDATE form_submissions SET data = $1 WHERE id = $2`,
          [JSON.stringify(dataObj), rows[0].id]
        );
      }
    }
  } catch (err) {
    console.warn('DB deleteSubmissionComment warning:', err);
  }

  return true;
}

export async function getFormSubmissionsFromDb(formId?: string, search?: string): Promise<FormSubmission[]> {
  // الف) تلاش برای واکشی از پایگاه‌داده PostgreSQL
  try {
    const isFiltered = formId && formId !== 'all';
    let query = isFiltered
      ? `SELECT * FROM form_submissions WHERE form_id = $1`
      : `SELECT * FROM form_submissions WHERE 1=1`;
    const params: any[] = isFiltered ? [formId] : [];

    if (search && search.trim()) {
      const cleanSearch = search.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d))).trim();
      const stripped = cleanSearch.replace(/^(SF|CASE|SP)-/i, '');

      params.push(`%${cleanSearch}%`);
      const p1 = `$${params.length}`;
      params.push(`%${stripped}%`);
      const p2 = `$${params.length}`;

      query += ` AND (
        tracking_code ILIKE ${p1} OR tracking_code ILIKE ${p2}
        OR data->>'caseCode' ILIKE ${p1} OR data->>'caseCode' ILIKE ${p2}
        OR data->>'userCode' ILIKE ${p1} OR data->>'userCode' ILIKE ${p2}
        OR data->>'fullName' ILIKE ${p1}
        OR mobile ILIKE ${p1}
      )`;
    }

    query += ` ORDER BY created_at DESC LIMIT 3000`;
    const rows = await executeNeonQueryWithTimeout(query, params);

    if (rows && rows.length > 0) {
      return rows.map((r: any) => {
        const parsedData = typeof r.data === 'string' ? JSON.parse(r.data) : r.data || {};
        return {
          id: r.id,
          formId: r.form_id,
          trackingCode: r.tracking_code,
          data: parsedData,
          evaluationResult: parsedData.evaluationResult,
          status: r.status,
          paymentStatus: r.payment_status,
          paymentAmount: r.payment_amount ? Number(r.payment_amount) : undefined,
          paymentRefId: r.payment_ref_id,
          createdAt: r.created_at,
          mobile: r.mobile || parsedData.mobile || parsedData.f_mobile || '',
          userIp: '185.143.232.19',
          comments: parsedData.comments || [],
        };
      });
    }
  } catch (err: any) {
    // در صورت خطا در دیتابیس، فال‌بک شفاف به مخزن محلی
  }

  // ب) در صورت اختلال، بدون معطلی و وقفه از مخزن فایل محلی خوانده می‌شود
  const local = readLocalSubmissions();
  let result = local;

  if (formId && formId !== 'all') {
    result = result.filter((s) => s.formId === formId);
  }

  if (search && search.trim()) {
    const cleanSearch = search
      .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
      .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
      .trim()
      .toLowerCase();
    const stripped = cleanSearch.replace(/^(sf|case|sp)-/i, '');

    result = result.filter((s) => {
      const track = (s.trackingCode || '').toLowerCase();
      const cCode = (s.data?.caseCode || '').toLowerCase();
      const uCode = (s.data?.user_code || '').toLowerCase();
      const name = (s.data?.fullName || '').toLowerCase();
      const mob = normalizeMobile(s.mobile || s.data?.mobile || s.data?.f_mobile || '');

      return (
        track.includes(cleanSearch) ||
        track.includes(stripped) ||
        cCode.includes(cleanSearch) ||
        cCode.includes(stripped) ||
        uCode.includes(stripped) ||
        name.includes(cleanSearch) ||
        mob.includes(cleanSearch)
      );
    });
  }

  return result;
}

/**
 * دریافت لیست فرم‌ها از جدول forms در پایگاه داده PostgreSQL
 */
export async function getFormsFromDb(): Promise<Form[] | null> {
  try {
    await executeDbQueryWithTimeout(`
      CREATE TABLE IF NOT EXISTS forms (
        id VARCHAR(255) PRIMARY KEY,
        slug VARCHAR(255),
        title TEXT,
        data JSONB,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    const rows = await executeDbQueryWithTimeout(`SELECT data FROM forms ORDER BY id`);
    if (rows && rows.length > 0) {
      return rows.map((r: any) => (typeof r.data === 'string' ? JSON.parse(r.data) : r.data));
    }
  } catch (err: any) {
    console.warn('PostgreSQL getFormsFromDb warning:', err?.message || err);
  }
  return null;
}

/**
 * ذخیره یا به‌روزرسانی فرم‌ها در جدول forms در پایگاه داده PostgreSQL
 */
export async function saveFormsToPostgres(forms: Form[]): Promise<void> {
  try {
    await executeDbQueryWithTimeout(`
      CREATE TABLE IF NOT EXISTS forms (
        id VARCHAR(255) PRIMARY KEY,
        slug VARCHAR(255),
        title TEXT,
        data JSONB,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    for (const form of forms) {
      await executeDbQueryWithTimeout(
        `INSERT INTO forms (id, slug, title, data, updated_at)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET
           slug = EXCLUDED.slug,
           title = EXCLUDED.title,
           data = EXCLUDED.data,
           updated_at = CURRENT_TIMESTAMP`,
        [form.id, form.slug, form.title, JSON.stringify(form)]
      );
    }

    if (forms.length > 0) {
      const activeIds = forms.map((f) => f.id);
      await executeDbQueryWithTimeout(
        `DELETE FROM forms WHERE NOT (id = ANY($1::varchar[]))`,
        [activeIds]
      );
    }
  } catch (err: any) {
    console.warn('PostgreSQL saveFormsToPostgres warning:', err?.message || err);
  }
}

/**
 * حذف فرم از جدول forms در پایگاه داده PostgreSQL
 */
export async function deleteFormFromPostgres(id: string): Promise<void> {
  try {
    await executeDbQueryWithTimeout(`DELETE FROM forms WHERE id = $1 OR slug = $1`, [id]);
  } catch (err: any) {
    console.warn('PostgreSQL deleteFormFromPostgres warning:', err?.message || err);
  }
}

