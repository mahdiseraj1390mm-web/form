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
  deleteSubmissionFromDb,
  deleteCaseFromDb,
} from '@/lib/db';
import { matchAndMergeSafaForNewRegistration } from '@/lib/user-similarity';
import { sendRecoveryOtpSms } from '@/lib/sms-service';
import { canRequestOtp, generateAndSaveOtp, verifyOtp } from '@/lib/otp-service';
import { resolveSessionActor } from '@/lib/team-store';

const AUTH_COOKIE_NAME = 'belhagh_admin_session';

/**
 * بررسی دسترسی اختصاصی مدیر کل سامانه (Super Admin) جهت انجام عملیات‌های حساس مانند حذف پرونده یا فرم‌ها
 */
async function verifySuperAdminPermission(req: NextRequest): Promise<boolean> {
  // ۱. بررسی مقدار کوکی نشست مدیر در درخواست
  const cookieVal = req.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (cookieVal) {
    const actor = await resolveSessionActor(cookieVal);
    if (actor?.type === 'admin') return true;
    if (actor?.type === 'member' && (actor.member.role === 'super_admin' || (actor.member as any).isSuperAdmin)) {
      return true;
    }
  }

  // ۲. بررسی هدر Authorization
  const authHeader = req.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const actor = await resolveSessionActor(token);
    if (actor?.type === 'admin') return true;
    if (actor?.type === 'member' && (actor.member.role === 'super_admin' || (actor.member as any).isSuperAdmin)) {
      return true;
    }
  }

  // ۳. بررسی در هدر خام کوکی
  const rawCookieHeader = req.headers.get('cookie') || '';
  const match = rawCookieHeader.match(new RegExp('(^|;\\s*)' + AUTH_COOKIE_NAME + '=([^;]+)'));
  if (match && match[2]) {
    const actor = await resolveSessionActor(match[2]);
    if (actor?.type === 'admin') return true;
    if (actor?.type === 'member' && (actor.member.role === 'super_admin' || (actor.member as any).isSuperAdmin)) {
      return true;
    }
  }

  return false;
}



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

    // استعلام امن مشخصات پرونده مراجع جهت نمایش در فرم نوبت‌دهی (بدون افشای پاسخ‌های آزمون‌ها و اطلاعات محرمانه)
    if (action === 'lookup') {
      const targetCode = code ? code.trim() : '';
      const targetMobile = mobile ? normalizeMobile(mobile) : '';
      const caseRecord = (targetCode ? await getCaseByCode(targetCode) : null) || (targetMobile ? await getCaseByMobile(targetMobile) : null);
      if (caseRecord) {
        const safeData = {
          f_name: caseRecord.first_name || caseRecord.data?.f_name || '',
          f_family: caseRecord.last_name || caseRecord.data?.f_family || '',
          f_mobile: caseRecord.mobile || caseRecord.data?.f_mobile || '',
          f_province_city: (caseRecord.province && caseRecord.city) ? `${caseRecord.province} - ${caseRecord.city}` : (caseRecord.data?.f_province_city || ''),
          f_role_in_family: caseRecord.data?.f_role_in_family || '',
        };
        return NextResponse.json({
          success: true,
          found: true,
          caseRecord: {
            case_code: caseRecord.case_code,
            first_name: caseRecord.first_name,
            last_name: caseRecord.last_name,
            mobile: caseRecord.mobile,
            province: caseRecord.province,
            city: caseRecord.city,
            data: safeData,
          },
        });
      }
      return NextResponse.json({ success: true, found: false, message: 'پرونده‌ای با این مشخصات یافت نشد.' });
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
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    console.error('Error in /api/cases GET:', err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

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
      const rateCheck = await canRequestOtp(clean, 'recovery');
      if (!rateCheck.allowed) {
        return NextResponse.json({
          success: false,
          error: `لطفاً ${rateCheck.retryAfter} ثانیه دیگر جهت درخواست مجدد کد شکیبا باشید.`,
          retryAfter: rateCheck.retryAfter,
        }, { status: 429 });
      }

      // تولید امن و ذخیره هش کد با انقضای ۱۲۰ ثانیه (۲ دقیقه) و CSPRNG
      const { code, expiresIn } = await generateAndSaveOtp({
        mobile: clean,
        purpose: 'recovery',
        metadata: { caseCode: caseRecord.case_code },
        digits: 5,
      });

      try {
        await sendRecoveryOtpSms(clean, code);
      } catch (smsErr) {
        console.error('Failed to send OTP SMS in API:', smsErr);
      }

      return NextResponse.json({
        success: true,
        found: true,
        expiresIn,
        message: 'کد تأیید ۵ رقمی به شماره همراه شما پیامک شد.',
      });
    }

    // ۰.۲. اعتبارسنجی کد یکبارمصرف و بازگرداندن امن کد پرونده
    if (action === 'verify_recovery_otp') {
      const { mobile, code } = body;
      const clean = normalizeMobile(mobile);

      if (!clean || !code) {
        return NextResponse.json({ success: false, error: 'شماره همراه و کد تأیید الزامی است.' }, { status: 400 });
      }

      const verifyRes = await verifyOtp({
        mobile: clean,
        code: String(code),
        purpose: 'recovery',
      });

      if (!verifyRes.success) {
        return NextResponse.json({ success: false, error: verifyRes.error }, { status: 400 });
      }

      const caseCode = typeof verifyRes.metadata?.caseCode === 'string' ? verifyRes.metadata.caseCode : undefined;
      const caseRecord = (caseCode ? await getCaseByCode(caseCode) : null) || (await getCaseByMobile(clean));
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

        // اگر فرم ثبت‌نام بود، ایجاد رکورد اصلی در belhagh_cases و همانندسازی کارنامه صفان به صورت اتمیک
        if (submission.formId === 'form-belhagh-registration' || submission.formId === 'zexuz') {
          try {
            const clientMobile = normalizeMobile(submission.mobile || submission.data?.f_mobile || '');
            const cCode = submission.data?.caseCode || submission.trackingCode;
            if (clientMobile && cCode) {
              await createCaseRecord(cCode, clientMobile, submission.data || {});
            }
          } catch (e) {
            console.warn('Auto createCaseRecord in save_submission warning:', e);
          }

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

    // ۷. حذف یک فرم پر شده توسط مراجع (منحصراً برای ادمین)
    if (action === 'delete_submission') {
      const isAllowed = await verifySuperAdminPermission(req);
      if (!isAllowed) {
        return NextResponse.json(
          { success: false, error: 'تنها مدیر ارشد سامانه مجاز به حذف فرم‌های تکمیل‌شده مراجعان می‌باشد.' },
          { status: 403 }
        );
      }

      const { submissionId } = body;
      if (!submissionId) {
        return NextResponse.json({ success: false, error: 'شناسه فرم مشخص نشده است.' }, { status: 400 });
      }

      const ok = await deleteSubmissionFromDb(submissionId);
      return NextResponse.json({ success: ok, message: 'فرم تکمیل‌شده با موفقیت حذف گردید.' });
    }

    // ۸. حذف کامل پرونده مراجع شامل کلیه فرم‌ها و سوابق (منحصراً برای ادمین)
    if (action === 'delete_case') {
      const isAllowed = await verifySuperAdminPermission(req);
      if (!isAllowed) {
        return NextResponse.json(
          { success: false, error: 'تنها مدیر ارشد سامانه مجاز به حذف پرونده مراجعان می‌باشد.' },
          { status: 403 }
        );
      }

      const { caseCode, mobile } = body;
      if (!caseCode && !mobile) {
        return NextResponse.json(
          { success: false, error: 'کد پرونده یا شماره همراه مراجع مشخص نشده است.' },
          { status: 400 }
        );
      }

      const ok = await deleteCaseFromDb(caseCode, mobile);
      return NextResponse.json({
        success: ok,
        message: 'پرونده مراجع و کلیه فرم‌ها و سوابق متناظر با آن با موفقیت حذف گردید.',
      });
    }

    return NextResponse.json({ error: 'عملیات نامعتبر است' }, { status: 400 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    console.error('Error in /api/cases POST:', err);
    return NextResponse.json({ error: errorMsg }, { status: 500 });
  }
}

/**
 * مدیریت درخواست‌های مستقیم متد DELETE برای حذف فرم یا پرونده
 */
export async function DELETE(req: NextRequest) {
  try {
    const isAllowed = await verifySuperAdminPermission(req);
    if (!isAllowed) {
      return NextResponse.json(
        { success: false, error: 'تنها مدیر ارشد سامانه مجاز به حذف پرونده یا فرم‌های تکمیل‌شده می‌باشد.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const submissionId = searchParams.get('submissionId') || searchParams.get('subId');
    const caseCode = searchParams.get('caseCode') || searchParams.get('code');
    const mobile = searchParams.get('mobile');

    if (submissionId) {
      const ok = await deleteSubmissionFromDb(submissionId);
      return NextResponse.json({ success: ok, message: 'فرم تکمیل‌شده با موفقیت حذف گردید.' });
    }

    if (caseCode || mobile) {
      const ok = await deleteCaseFromDb(caseCode || '', mobile || undefined);
      return NextResponse.json({
        success: ok,
        message: 'پرونده مراجع و کلیه فرم‌های آن با موفقیت حذف گردید.',
      });
    }

    return NextResponse.json({ success: false, error: 'پارامتر حذف ارسال نشده است.' }, { status: 400 });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Server error';
    console.error('Error in /api/cases DELETE:', err);
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}
