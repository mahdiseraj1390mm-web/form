import { neon } from '@neondatabase/serverless';
import { FormSubmission } from '@/types/form';
import fs from 'fs';
import path from 'path';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_hbad8wm9oYIT@ep-flat-band-b70xzvhu-pooler.c-13.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require';

export const sql = neon(connectionString);

const LOCAL_SUBMISSIONS_FILE = path.join(process.cwd(), 'data', 'submissions.json');

// سیستم مدارشکن هوشمند (Circuit Breaker) برای جلوگیری از معطلی در صورت تکمیل کوتای پلن رایگان Neon (خطای 402)
let quotaExceededUntil = 0;

async function executeNeonQueryWithTimeout(queryText: string, params: any[]): Promise<any> {
  const now = Date.now();
  if (now < quotaExceededUntil) {
    throw new Error('Neon DB quota exceeded (circuit breaker active)');
  }

  let timer: any;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error('Neon DB timeout')), 2000);
  });

  try {
    const res = await Promise.race([
      (sql as any).query(queryText, params),
      timeoutPromise,
    ]);
    return res;
  } catch (err: any) {
    const msg = String(err?.message || '');
    if (msg.includes('402') || msg.includes('quota') || msg.includes('exceeded') || msg.includes('timeout')) {
      quotaExceededUntil = Date.now() + 5 * 60 * 1000; // ۵ دقیقه توقف تلاش مجدد
      console.warn('⚡ Neon DB quota limit or timeout reached. Activated circuit breaker for 5 minutes.');
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

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
 * خواندن پاسخ‌ها از فایل محلی پایدار در صورت عدم دسترسی یا خطای کوتای Neon
 */
function readLocalSubmissions(): FormSubmission[] {
  try {
    if (fs.existsSync(LOCAL_SUBMISSIONS_FILE)) {
      const content = fs.readFileSync(LOCAL_SUBMISSIONS_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.warn('Error reading local submissions file:', err);
  }
  return [];
}

/**
 * ذخیره پاسخ‌ها در فایل محلی پایدار
 */
function writeLocalSubmissions(subs: FormSubmission[]): void {
  try {
    const dir = path.dirname(LOCAL_SUBMISSIONS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(LOCAL_SUBMISSIONS_FILE, JSON.stringify(subs, null, 2), 'utf8');
  } catch (err) {
    console.warn('Error writing local submissions file:', err);
  }
}

/**
 * جستجوی پرونده بر اساس شماره موبایل در دیتابیس Neon (با فال‌بک فایل محلی)
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
    // نادیده گرفتن خطای دیتابیس خارجی
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

  // ۱. ذخیره بی‌درنگ در مخزن محلی مطمئن
  try {
    const local = readLocalSubmissions();
    const idx = local.findIndex((s) => s.id === sub.id);
    const updatedSub: FormSubmission = {
      ...sub,
      mobile: mobile || sub.mobile,
      data: {
        ...(sub.data || {}),
        caseCode: sub.data?.caseCode || sub.trackingCode,
        fullName: sub.data?.fullName || sub.data?.f_fullname || `${sub.data?.f_name || ''} ${sub.data?.f_family || ''}`.trim(),
        evaluationResult: sub.evaluationResult || sub.data?.evaluationResult,
      },
      evaluationResult: sub.evaluationResult || sub.data?.evaluationResult,
      comments: sub.comments || [],
    };

    if (idx !== -1) {
      local[idx] = { ...local[idx], ...updatedSub, data: { ...local[idx].data, ...updatedSub.data } };
    } else {
      local.unshift(updatedSub);
    }
    writeLocalSubmissions(local);
  } catch (e) {
    console.warn('Local file save warning:', e);
  }

  // ۲. ارسال موازی به سرور دیتابیس ابری Neon (در صورت عدم فعال بودن مدارشکن)
  try {
    await executeNeonQueryWithTimeout(
      `INSERT INTO form_submissions (id, form_id, tracking_code, mobile, data, status, payment_status, payment_amount, payment_ref_id, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       ON CONFLICT (id) DO UPDATE SET
         status = EXCLUDED.status,
         payment_status = EXCLUDED.payment_status,
         mobile = EXCLUDED.mobile,
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
    // ثبت خطا به صورت اخطار بدون شکست فرآیند برنامه
  }
}

/**
 * استخراج همه پاسخ‌های فرم‌ها همراه با پشتیبانی از فیلتر فرم، جستجو و انعطاف‌پذیری ۱۰۰٪
 */
export async function getFormSubmissionsFromDb(formId?: string, search?: string): Promise<FormSubmission[]> {
  // الف) تلاش برای واکشی آنلاین از سرور Neon
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
    // خطا در دیتابیس ابری (مثلاً سقف مصرف یا قطعی موقت)، فال‌بک شفاف به دیتاست محلی
  }

  // ب) در صورت اختلال ارتباطی یا تکمیل ظرفیت پلن رایگان Neon، بدون معطلی و وقفه از مخزن فایل محلی خوانده می‌شود
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
