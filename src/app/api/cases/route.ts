import { NextRequest, NextResponse } from 'next/server';
import {
  getCaseByMobile,
  getCaseByCode,
  createCaseRecord,
  saveFormSubmissionToDb,
  normalizeMobile,
  getFormSubmissionsFromDb,
  updateSubmissionDataInDb,
  editSubmissionCommentInDb,
  deleteSubmissionCommentInDb,
  sql,
} from '@/lib/db';
import { matchAndMergeSafaForNewRegistration } from '@/lib/user-similarity';
import { sendRecoveryOtpSms } from '@/lib/sms-service';

interface OtpEntry {
  code: string;
  mobile: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
  caseRecord: any;
}

// ذخیره‌سازی موقت کدهای اعتبارسنجی در حافظه سرور
const recoveryOtpStore: Map<string, OtpEntry> = (globalThis as any).__belhaghRecoveryOtpStore || new Map();
(globalThis as any).__belhaghRecoveryOtpStore = recoveryOtpStore;



// شناسه‌های جامع مشاوران و کلیه نقش‌ها و فیلدهای متناظر آن‌ها جهت جلوگیری قطعی از تداخل نوبت در یک زمان
interface CounselorIdentityGroup {
  ids: string[];
  names: string[];
  mobiles: string[];
}

const COUNSELOR_IDENTITY_GROUPS: CounselorIdentityGroup[] = [
  {
    ids: ['user-counselor-borhani', 'f_booking_borhani', 'f_booking_borhani_teen', 'f_booking_borhani_family'],
    names: ['برهانی', 'علیرضا برهانی'],
    mobiles: ['09120449093'],
  },
  {
    ids: ['user-counselor-shavandi', 'f_booking_shavandi', 'f_booking_shavandi_child', 'f_booking_shavandi_teen'],
    names: ['شوندی'],
    mobiles: ['09127944985'],
  },
  {
    ids: ['user-counselor-ansari', 'f_booking_ansari', 'f_booking_ansari_child', 'f_booking_ansari_teen'],
    names: ['انصاری'],
    mobiles: ['09122301387'],
  },
  {
    ids: ['user-counselor-zeynali', 'f_booking_zeynali', 'f_booking_zeynali_child', 'f_booking_zeynali_family'],
    names: ['زینلی'],
    mobiles: ['09379709635'],
  },
  {
    ids: ['user-counselor-rastgoo', 'f_booking_rastgoo', 'f_booking_rastgoo_teen', 'f_booking_rastgoo_clinical'],
    names: ['راستگو'],
    mobiles: ['09123069447'],
  },
  {
    ids: ['user-counselor-farahmandi', 'f_booking_farahmandi'],
    names: ['فرهمندی', 'یاسر فرهمندی'],
    mobiles: ['09364280322'],
  },
  {
    ids: ['user-counselor-teymourian', 'f_booking_teymourian'],
    names: ['تیموریان'],
    mobiles: ['09140288938'],
  },
  {
    ids: ['user-counselor-abdi-education', 'f_booking_abdi_education'],
    names: ['آقای عبدی'],
    mobiles: ['09127853843'],
  },
  {
    ids: ['user-counselor-torshizi', 'f_booking_torshizi'],
    names: ['ترشیزی', 'جعفر ترشیزی'],
    mobiles: ['09155513734'],
  },
  {
    ids: ['user-counselor-yavari', 'f_booking_yavari'],
    names: ['یاوری'],
    mobiles: ['09307556919'],
  },
  {
    ids: ['user-counselor-golyayi', 'f_booking_golyayi_clinical'],
    names: ['گلیایی'],
    mobiles: ['09125140551'],
  },
  {
    ids: ['user-counselor-sedighi', 'f_booking_sedighi_family', 'f_booking_sedighi'],
    names: ['صدیقی'],
    mobiles: ['09151538227'],
  },
  {
    ids: ['user-counselor-karimi', 'f_booking_karimi_family', 'f_booking_karimi'],
    names: ['کریمی'],
    mobiles: ['09192180481'],
  },
  {
    ids: ['user-counselor-abdi-family', 'f_booking_abdi_family'],
    names: ['خانم عبدی'],
    mobiles: ['09192886258'],
  },
];

// نگاشت فیلدهای مرتبط مشاورانی که چند نقش دارند (مانند نوجوان + خانواده) جهت جلوگیری از تداخل نوبت در یک ساعت
const RELATED_COUNSELOR_FIELDS: Record<string, string[]> = {
  user_counselor_borhani: ['f_booking_borhani_teen', 'f_booking_borhani_family', 'user-counselor-borhani', 'f_booking_borhani'],
  'user-counselor-borhani': ['f_booking_borhani_teen', 'f_booking_borhani_family', 'user-counselor-borhani', 'f_booking_borhani'],
  f_booking_borhani_teen: ['f_booking_borhani_teen', 'f_booking_borhani_family', 'user-counselor-borhani', 'f_booking_borhani'],
  f_booking_borhani_family: ['f_booking_borhani_teen', 'f_booking_borhani_family', 'user-counselor-borhani', 'f_booking_borhani'],
  'user-counselor-shavandi': ['f_booking_shavandi_child', 'f_booking_shavandi_teen', 'user-counselor-shavandi', 'f_booking_shavandi'],
  f_booking_shavandi_child: ['f_booking_shavandi_child', 'f_booking_shavandi_teen', 'user-counselor-shavandi', 'f_booking_shavandi'],
  f_booking_shavandi_teen: ['f_booking_shavandi_child', 'f_booking_shavandi_teen', 'user-counselor-shavandi', 'f_booking_shavandi'],
  'user-counselor-ansari': ['f_booking_ansari_child', 'f_booking_ansari_teen', 'user-counselor-ansari', 'f_booking_ansari'],
  f_booking_ansari_child: ['f_booking_ansari_child', 'f_booking_ansari_teen', 'user-counselor-ansari', 'f_booking_ansari'],
  f_booking_ansari_teen: ['f_booking_ansari_child', 'f_booking_ansari_teen', 'user-counselor-ansari', 'f_booking_ansari'],
  'user-counselor-zeynali': ['f_booking_zeynali_child', 'f_booking_zeynali_family', 'user-counselor-zeynali', 'f_booking_zeynali'],
  f_booking_zeynali_child: ['f_booking_zeynali_child', 'f_booking_zeynali_family', 'user-counselor-zeynali', 'f_booking_zeynali'],
  f_booking_zeynali_family: ['f_booking_zeynali_child', 'f_booking_zeynali_family', 'user-counselor-zeynali', 'f_booking_zeynali'],
  'user-counselor-rastgoo': ['f_booking_rastgoo_teen', 'f_booking_rastgoo_clinical', 'user-counselor-rastgoo', 'f_booking_rastgoo'],
  f_booking_rastgoo_teen: ['f_booking_rastgoo_teen', 'f_booking_rastgoo_clinical', 'user-counselor-rastgoo', 'f_booking_rastgoo'],
  f_booking_rastgoo_clinical: ['f_booking_rastgoo_teen', 'f_booking_rastgoo_clinical', 'user-counselor-rastgoo', 'f_booking_rastgoo'],
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mobile = searchParams.get('mobile');
  const code = searchParams.get('code');
  const formId = searchParams.get('formId');
  const action = searchParams.get('action');

  try {
    // دریافت تمامی نوبت‌های از قبل رزرو شده جهت جلوگیری از ثبت تکراری نوبت در یک زمان
    if (action === 'booked_slots') {
      const counselorField = searchParams.get('counselorField') || '';
      const cleanCounselorField = counselorField.trim();
      // جستجو در کلیه پاسخ‌های ثبت‌شده (شامل تمامی فرم‌های رزرو نوبت مانند form-belhagh-booking و 3uu4z)
      const submissions = await getFormSubmissionsFromDb('all');
      const bookedSlots: string[] = [];

      // یافتن گروه هویتی مشاور بر اساس شناسه یا نام
      const matchedGroup = cleanCounselorField
        ? COUNSELOR_IDENTITY_GROUPS.find(
            (g) =>
              g.ids.includes(cleanCounselorField) ||
              g.names.some((n) => cleanCounselorField.includes(n) || n.includes(cleanCounselorField))
          )
        : null;

      const targetFieldIds = matchedGroup
        ? matchedGroup.ids
        : (cleanCounselorField && RELATED_COUNSELOR_FIELDS[cleanCounselorField]
            ? RELATED_COUNSELOR_FIELDS[cleanCounselorField]
            : (cleanCounselorField ? [cleanCounselorField] : []));

      submissions.forEach((s) => {
        if (!s.data || typeof s.data !== 'object') return;
        const d = s.data;

        let belongsToThisCounselor = false;

        if (matchedGroup) {
          // بررسی تعلق قطعی این پرونده/نوبت به مشاور مورد نظر
          if (d.counselorId && matchedGroup.ids.includes(String(d.counselorId).trim())) {
            belongsToThisCounselor = true;
          } else if (d.counselorField && matchedGroup.ids.includes(String(d.counselorField).trim())) {
            belongsToThisCounselor = true;
          } else if (matchedGroup.ids.some((id) => Boolean(d[id]))) {
            belongsToThisCounselor = true;
          } else {
            const rawCounselorName = String(d.counselorName || d.f_counselor || d.counselor || '');
            if (rawCounselorName && matchedGroup.names.some((n) => rawCounselorName.includes(n))) {
              belongsToThisCounselor = true;
            } else if (d.f_booking && typeof d.f_booking === 'string') {
              if (matchedGroup.names.some((n) => (d.f_booking as string).includes(n))) {
                belongsToThisCounselor = true;
              }
            }
          }
        } else if (targetFieldIds.length > 0) {
          belongsToThisCounselor = targetFieldIds.some((fId) => Boolean(d[fId]) || d.counselorId === fId || d.counselorField === fId);
        } else {
          // در صورتی که هیچ مشاوری مشخص نشده باشد، تمام فیلدهای رزرو عمومی لحاظ می‌شوند
          belongsToThisCounselor = true;
        }

        if (belongsToThisCounselor) {
          // استخراج تمام مقادیر نوبت این پرونده
          if (d.f_booking_slot && typeof d.f_booking_slot === 'string' && d.f_booking_slot.trim()) {
            bookedSlots.push(d.f_booking_slot.trim());
          }

          if (matchedGroup) {
            matchedGroup.ids.forEach((fId) => {
              if (d[fId] && typeof d[fId] === 'string' && d[fId].trim()) {
                bookedSlots.push(d[fId].trim());
              }
            });
          } else {
            targetFieldIds.forEach((fId) => {
              if (d[fId] && typeof d[fId] === 'string' && d[fId].trim()) {
                bookedSlots.push(d[fId].trim());
              }
            });
          }

          if (d.f_booking && typeof d.f_booking === 'string') {
            const str = d.f_booking.trim();
            if (str.includes('نوبت:')) {
              const part = str.split('نوبت:')[1]?.trim();
              if (part) bookedSlots.push(part);
            } else {
              bookedSlots.push(str);
            }
          }

          if (d.slot && typeof d.slot === 'string' && d.slot.trim()) {
            bookedSlots.push(d.slot.trim());
          }
        }
      });

      return NextResponse.json({ success: true, bookedSlots: Array.from(new Set(bookedSlots)) });
    }

    if (mobile) {
      const clean = normalizeMobile(mobile);
      const caseRecord = await getCaseByMobile(clean);
      if (caseRecord) {
        return NextResponse.json({ success: true, found: true, caseRecord });
      }
      return NextResponse.json({ success: true, found: false, message: 'پرونده‌ای با این شماره همراه یافت نشد.' });
    }

    if (code) {
      const caseRecord = await getCaseByCode(code);
      if (caseRecord) {
        return NextResponse.json({ success: true, found: true, caseRecord });
      }
      return NextResponse.json({ success: true, found: false, message: 'پرونده‌ای با این کد یافت نشد.' });
    }

    const searchQuery = searchParams.get('q') || searchParams.get('search');

    if (formId || searchQuery) {
      const submissions = await getFormSubmissionsFromDb(formId || 'all', searchQuery || undefined);
      return NextResponse.json({ success: true, submissions });
    }

    return NextResponse.json({ error: 'پارامترهای جستجو ارسال نشده است' }, { status: 400 });
  } catch (err: any) {
    console.error('Error in /api/cases GET:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

// عملیات پایدار و چندپردازنده‌ای کد یکبارمصرف بازیابی پرونده
async function saveRecoveryOtp(cleanMobile: string, code: string, caseCode: string, caseRecord: any) {
  const now = Date.now();
  recoveryOtpStore.set(cleanMobile, {
    code,
    mobile: cleanMobile,
    expiresAt: now + 300000, // ۵ دقیقه
    attempts: 0,
    lastSentAt: now,
    caseRecord,
  });

  try {
    // پاک‌سازی خودکار کدهای منقضی‌شده قدیمی جهت حفظ کارایی
    await sql`DELETE FROM public.recovery_otps WHERE expires_at < NOW() - INTERVAL '1 hour'`.catch(() => {});

    await sql`
      INSERT INTO public.recovery_otps (mobile, code, case_code, expires_at)
      VALUES (${cleanMobile}, ${code}, ${caseCode}, NOW() + INTERVAL '5 minutes')
    `;
  } catch (err) {
    console.warn('saveRecoveryOtp DB warning:', err);
  }
}

async function verifyRecoveryOtp(cleanMobile: string, cleanCode: string): Promise<{ success: boolean; caseCode?: string; error?: string }> {
  // ۱. بررسی در جدول پایدار public.recovery_otps
  try {
    const rows = await sql`
      SELECT * FROM public.recovery_otps 
      WHERE mobile = ${cleanMobile} AND expires_at > NOW() 
      ORDER BY created_at DESC 
      LIMIT 10
    `;

    if (rows && rows.length > 0) {
      // بررسی تطابق با هر کدام از کدهای معتبر ارسالی در ۵ دقیقه اخیر
      const match = rows.find((r: any) => String(r.code).trim() === cleanCode);
      if (match) {
        await sql`DELETE FROM public.recovery_otps WHERE mobile = ${cleanMobile}`.catch(() => {});
        recoveryOtpStore.delete(cleanMobile);
        return { success: true, caseCode: match.case_code };
      }

      // اعمال شمارش خطای تلاش روی تمام رکوردهای فعال این شماره
      const maxAttempts = Math.max(...rows.map((r: any) => r.attempts || 0));
      const newAttempts = maxAttempts + 1;
      if (newAttempts >= 5) {
        await sql`DELETE FROM public.recovery_otps WHERE mobile = ${cleanMobile}`.catch(() => {});
        recoveryOtpStore.delete(cleanMobile);
        return { success: false, error: 'تعداد دفعات تلاش اشتباه بیش از حد مجاز بود. لطفاً مجدداً کد درخواست نمایید.' };
      }

      await sql`UPDATE public.recovery_otps SET attempts = ${newAttempts} WHERE mobile = ${cleanMobile}`.catch(() => {});
      return { success: false, error: `کد وارد شده صحیح نمی‌باشد. (${5 - newAttempts} تلاش باقی‌مانده)` };
    }
  } catch (err) {
    console.warn('verifyRecoveryOtp DB error, fallback to memory:', err);
  }

  // ۲. فال‌بک در حافظه سرور
  const otpEntry = recoveryOtpStore.get(cleanMobile);
  if (!otpEntry) {
    return { success: false, error: 'کد تأییدی برای این شماره ثبت نشده یا منقضی شده است. لطفاً مجدداً درخواست دهید.' };
  }
  if (Date.now() > otpEntry.expiresAt) {
    recoveryOtpStore.delete(cleanMobile);
    return { success: false, error: 'کد تأیید منقضی شده است. لطفاً مجدداً درخواست کد فرمایید.' };
  }
  if (otpEntry.attempts >= 5) {
    recoveryOtpStore.delete(cleanMobile);
    return { success: false, error: 'تعداد دفعات تلاش اشتباه بیش از حد مجاز بود. لطفاً مجدداً کد جدید درخواست نمایید.' };
  }
  if (otpEntry.code !== cleanCode) {
    otpEntry.attempts += 1;
    return { success: false, error: `کد وارد شده صحیح نمی‌باشد. (${5 - otpEntry.attempts} تلاش باقی‌مانده)` };
  }

  const cCode = otpEntry.caseRecord?.case_code;
  recoveryOtpStore.delete(cleanMobile);
  return { success: true, caseCode: cCode };
}

async function canSendOtp(cleanMobile: string): Promise<{ allowed: boolean; retryAfter?: number }> {
  const now = Date.now();
  try {
    const rows = await sql`
      SELECT created_at FROM public.recovery_otps 
      WHERE mobile = ${cleanMobile} 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    if (rows && rows[0]) {
      const lastTime = new Date(rows[0].created_at).getTime();
      if (now - lastTime < 60000) {
        const remaining = Math.ceil((60000 - (now - lastTime)) / 1000);
        return { allowed: false, retryAfter: remaining };
      }
    }
  } catch {}

  const existingOtp = recoveryOtpStore.get(cleanMobile);
  if (existingOtp && (now - existingOtp.lastSentAt) < 60000) {
    const remaining = Math.ceil((60000 - (now - existingOtp.lastSentAt)) / 1000);
    return { allowed: false, retryAfter: remaining };
  }

  return { allowed: true };
}

    // ۰.۱. ارسال کد یکبارمصرف (OTP) جهت بازیابی امن شماره پرونده
    if (action === 'send_recovery_otp') {
      const { mobile } = body;
      const clean = normalizeMobile(mobile);
      if (!clean || clean.length < 10) {
        return NextResponse.json({ success: false, error: 'شماره همراه معتبر وارد فرمایید.' }, { status: 400 });
      }

      // بررسی وجود پرونده برای این شماره در دیتابیس یا سابمیشن‌ها
      const caseRecord = await getCaseByMobile(clean);
      if (!caseRecord || !caseRecord.case_code) {
        return NextResponse.json({
          success: false,
          found: false,
          message: 'پرونده‌ای با این شماره همراه در سامانه یافت نشد.',
        });
      }

      // محدودیت نرخ ارسال: حداقل ۶۰ ثانیه فاصله بین ارسال‌ها
      const rateCheck = await canSendOtp(clean);
      if (!rateCheck.allowed) {
        return NextResponse.json({
          success: false,
          error: `لطفاً ${rateCheck.retryAfter} ثانیه دیگر جهت درخواست مجدد کد شکیبا باشید.`,
          retryAfter: rateCheck.retryAfter,
        }, { status: 429 });
      }

      // تولید کد تصادفی ۵ رقمی
      const code = Math.floor(10000 + Math.random() * 90000).toString();

      await saveRecoveryOtp(clean, code, caseRecord.case_code, caseRecord);

      try {
        await sendRecoveryOtpSms(clean, code);
      } catch (smsErr) {
        console.error('Failed to send OTP SMS in API:', smsErr);
      }

      return NextResponse.json({
        success: true,
        found: true,
        expiresIn: 300,
        message: 'کد تأیید ۵ رقمی به شماره همراه شما پیامک شد.',
      });
    }

    // ۰.۲. اعتبارسنجی کد یکبارمصرف و بازگرداندن امن کد پرونده
    if (action === 'verify_recovery_otp') {
      const { mobile, code } = body;
      const clean = normalizeMobile(mobile);
      const cleanCode = String(code || '').replace(/[^0-9]/g, '');

      if (!clean || !cleanCode) {
        return NextResponse.json({ success: false, error: 'شماره همراه و کد تأیید الزامی است.' }, { status: 400 });
      }

      const verifyRes = await verifyRecoveryOtp(clean, cleanCode);
      if (!verifyRes.success) {
        return NextResponse.json({ success: false, error: verifyRes.error }, { status: 400 });
      }

      const caseCode = verifyRes.caseCode!;
      const caseRecord = (await getCaseByCode(caseCode)) || (await getCaseByMobile(clean));
      if (!caseRecord) {
        return NextResponse.json({ success: false, error: 'پرونده با این کد یافت نشد.' }, { status: 404 });
      }

      const fullName = `${caseRecord.first_name || ''} ${caseRecord.last_name || ''}`.trim() || caseRecord.data?.fullName || 'مراجع محترم';

      return NextResponse.json({
        success: true,
        verified: true,
        caseCode: caseRecord.case_code,
        fullName,
        caseRecord: {
          id: caseRecord.id,
          case_code: caseRecord.case_code,
          first_name: caseRecord.first_name,
          last_name: caseRecord.last_name,
          mobile: clean,
          province: caseRecord.province,
          city: caseRecord.city,
          data: {
            ...(caseRecord.data || {}),
            f_name: caseRecord.first_name || caseRecord.data?.f_name || '',
            f_family: caseRecord.last_name || caseRecord.data?.f_family || '',
            f_mobile: clean,
            f_case_code: caseRecord.case_code,
            fullName,
          },
        },
        message: 'هویت شما با موفقیت تأیید شد.',
      });
    }

    // ۱. بررسی ثبت‌نام تکراری قبل از ثبت فرم
    if (action === 'check_registration') {
      const { mobile } = body;
      const clean = normalizeMobile(mobile);
      if (!clean) {
        return NextResponse.json({ error: 'شماره موبایل الزامی است' }, { status: 400 });
      }

      const existing = await getCaseByMobile(clean);
      if (existing) {
        return NextResponse.json({
          exists: true,
          caseCode: existing.case_code,
          name: `${existing.first_name || ''} ${existing.last_name || ''}`.trim() || 'مراجع محترم',
          message: 'شما قبلاً ثبت نام کرده اید و باید شماره پرونده را بازیابی کنید',
        });
      }

      return NextResponse.json({ exists: false });
    }

    // ۲. ثبت یا صدور قطعی پرونده در Neon PostgreSQL
    if (action === 'register_case') {
      const { caseCode, mobile, data } = body;
      const clean = normalizeMobile(mobile);
      if (!clean) {
        return NextResponse.json({ error: 'شماره همراه معتبر نیست' }, { status: 400 });
      }

      const result = await createCaseRecord(caseCode, clean, data || {});

      // همانندسازی و ادغام خودکار کارنامه آزمون صفان با بیشترین شباهت در بک‌اند
      let mergedSafaSubmission = null;
      try {
        const allSubs = await getFormSubmissionsFromDb('all');
        const regSub = allSubs.find(
          (s) =>
            (s.data?.caseCode === caseCode || s.trackingCode === caseCode || s.mobile === clean) &&
            (s.formId === 'form-belhagh-registration' || s.formId === 'zexuz')
        ) || {
          id: `sub-case-${caseCode}`,
          formId: 'form-belhagh-registration',
          trackingCode: caseCode,
          mobile: clean,
          data: { ...(data || {}), caseCode, mobile: clean },
          status: 'new',
          paymentStatus: 'none',
          createdAt: new Date().toISOString(),
          comments: [],
        };

        const mergeRes = matchAndMergeSafaForNewRegistration(regSub, allSubs);
        if (mergeRes.mergedSafa) {
          await saveFormSubmissionToDb(mergeRes.mergedSafa);
          await saveFormSubmissionToDb(mergeRes.updatedRegistrationSub);
          mergedSafaSubmission = mergeRes.mergedSafa;
        }
      } catch (err) {
        console.warn('Backend auto-merge safa on register_case error:', err);
      }

      return NextResponse.json({
        success: true,
        isNew: result.isNew,
        caseRecord: result.caseRecord,
        mergedSafa: mergedSafaSubmission,
      });
    }

    // ۳. ذخیره عمومی پاسخ هر فرم در Neon DB
    if (action === 'save_submission') {
      const { submission } = body;
      let mergedSafaSubmission = null;
      if (submission) {
        if (submission.formId === 'form-belhagh-booking') {
          const subData = submission.data || {};
          const hasSlot = Object.keys(subData).some(
            (k) =>
              k.startsWith('f_booking_') &&
              !['f_booking_counselor', 'f_booking_date'].includes(k) &&
              subData[k] &&
              String(subData[k]).trim() !== ''
          );
          if (!hasSlot) {
            return NextResponse.json(
              { error: 'انتخاب روز و ساعت جلسه مشاوره الزامی است' },
              { status: 400 }
            );
          }
        }

        // اگر فرم ثبت‌نام بود، همانندسازی و ادغام خودکار کارنامه صفان با بالاترین ضریب شباهت انجام گیرد
        if (submission.formId === 'form-belhagh-registration' || submission.formId === 'zexuz') {
          try {
            const allSubs = await getFormSubmissionsFromDb('all');
            const mergeRes = matchAndMergeSafaForNewRegistration(submission, allSubs);
            if (mergeRes.mergedSafa) {
              await saveFormSubmissionToDb(mergeRes.mergedSafa);
              await saveFormSubmissionToDb(mergeRes.updatedRegistrationSub);
              mergedSafaSubmission = mergeRes.mergedSafa;
            } else {
              await saveFormSubmissionToDb(submission);
            }
          } catch (err) {
            console.warn('Backend auto-merge safa on save_submission error:', err);
            await saveFormSubmissionToDb(submission);
          }
        } else {
          await saveFormSubmissionToDb(submission);
        }
      }
      return NextResponse.json({ success: true, mergedSafa: mergedSafaSubmission });
    }

    // ۴. به‌روزرسانی اطلاعات ویرایش‌شده پرونده توسط مشاور
    if (action === 'update_submission_data') {
      const { submissionId, updatedFields } = body;
      if (!submissionId || !updatedFields) {
        return NextResponse.json({ error: 'شناسه یا فیلدهای ارسالی ناقص است' }, { status: 400 });
      }
      await updateSubmissionDataInDb(submissionId, updatedFields);
      return NextResponse.json({ success: true });
    }

    // ۴.۱. به‌روزرسانی وضعیت ارسالی و پرونده
    if (action === 'update_submission_status') {
      const { submissionId, status } = body;
      if (!submissionId || !status) {
        return NextResponse.json({ error: 'شناسه یا وضعیت ارسالی ناقص است' }, { status: 400 });
      }
      await updateSubmissionDataInDb(submissionId, { status, caseStatus: status, clinical_status: status });
      return NextResponse.json({ success: true });
    }

    // ۵. ویرایش متن یادداشت / پیگیری مراجع
    if (action === 'edit_submission_comment') {
      const { submissionId, commentId, newContent } = body;
      if (!submissionId || !commentId || !newContent) {
        return NextResponse.json({ error: 'اطلاعات ویرایش پیگیری ناقص است' }, { status: 400 });
      }
      await editSubmissionCommentInDb(submissionId, commentId, newContent);
      return NextResponse.json({ success: true });
    }

    // ۶. حذف یادداشت / پیگیری مراجع
    if (action === 'delete_submission_comment') {
      const { submissionId, commentId } = body;
      if (!submissionId || !commentId) {
        return NextResponse.json({ error: 'اطلاعات حذف پیگیری ناقص است' }, { status: 400 });
      }
      await deleteSubmissionCommentInDb(submissionId, commentId);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'عملیات نامعتبر است' }, { status: 400 });
  } catch (err: any) {
    console.error('Error in /api/cases POST:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
