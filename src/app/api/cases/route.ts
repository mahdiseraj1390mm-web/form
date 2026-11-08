import { NextRequest, NextResponse } from 'next/server';
import {
  getCaseByMobile,
  getCaseByCode,
  createCaseRecord,
  saveFormSubmissionToDb,
  normalizeMobile,
  getFormSubmissionsFromDb,
} from '@/lib/db';


// نگاشت فیلدهای مرتبط مشاورانی که چند نقش دارند (مانند نوجوان + خانواده) جهت جلوگیری از تداخل نوبت در یک ساعت
const RELATED_COUNSELOR_FIELDS: Record<string, string[]> = {
  f_booking_borhani_teen: ['f_booking_borhani_teen', 'f_booking_borhani_family'],
  f_booking_borhani_family: ['f_booking_borhani_teen', 'f_booking_borhani_family'],
  f_booking_shavandi_child: ['f_booking_shavandi_child', 'f_booking_shavandi_teen'],
  f_booking_shavandi_teen: ['f_booking_shavandi_child', 'f_booking_shavandi_teen'],
  f_booking_ansari_child: ['f_booking_ansari_child', 'f_booking_ansari_teen'],
  f_booking_ansari_teen: ['f_booking_ansari_child', 'f_booking_ansari_teen'],
  f_booking_zeynali_child: ['f_booking_zeynali_child', 'f_booking_zeynali_family'],
  f_booking_zeynali_family: ['f_booking_zeynali_child', 'f_booking_zeynali_family'],
  f_booking_rastgoo_teen: ['f_booking_rastgoo_teen', 'f_booking_rastgoo_clinical'],
  f_booking_rastgoo_clinical: ['f_booking_rastgoo_teen', 'f_booking_rastgoo_clinical'],
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mobile = searchParams.get('mobile');
  const code = searchParams.get('code');
  const formId = searchParams.get('formId');
  const action = searchParams.get('action');

  try {
    // دریافت تمامی نوبت‌های از قبل رزرو شده جهت جلوگیری از ثبت تکراری نوبت در یک زمان
    // دریافت تمامی نوبت‌های از قبل رزرو شده جهت جلوگیری از ثبت تکراری نوبت در یک زمان
    if (action === 'booked_slots') {
      const counselorField = searchParams.get('counselorField');
      // جستجو در کلیه پاسخ‌های ثبت‌شده (شامل تمامی فرم‌های رزرو نوبت مانند form-belhagh-booking و 3uu4z)
      const submissions = await getFormSubmissionsFromDb('all');
      const bookedSlots: string[] = [];

      // اگر این مشاور در نقش‌های دیگر نیز فیلد نوبت دارد، تمام فیلدهای مرتبط بررسی می‌شوند
      const targetFields = counselorField && RELATED_COUNSELOR_FIELDS[counselorField]
        ? RELATED_COUNSELOR_FIELDS[counselorField]
        : (counselorField ? [counselorField] : null);

      submissions.forEach((s) => {
        if (s.data && typeof s.data === 'object') {
          Object.entries(s.data).forEach(([key, val]) => {
            if (val && typeof val === 'string' && val.trim()) {
              if (targetFields) {
                if (targetFields.includes(key)) {
                  bookedSlots.push(val.trim());
                }
              } else if (key.startsWith('f_booking_') && !['f_booking_counselor', 'f_booking_date', 'f_booking_datetime'].includes(key)) {
                bookedSlots.push(val.trim());
              }
            }
          });
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
      return NextResponse.json({ success: true, isNew: result.isNew, caseRecord: result.caseRecord });
    }

    // ۳. ذخیره عمومی پاسخ هر فرم در Neon DB
    if (action === 'save_submission') {
      const { submission } = body;
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
        await saveFormSubmissionToDb(submission);
      }
      return NextResponse.json({ success: true });
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
