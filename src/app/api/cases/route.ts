import { NextRequest, NextResponse } from 'next/server';
import {
  getCaseByMobile,
  getCaseByCode,
  createCaseRecord,
  saveFormSubmissionToDb,
  normalizeMobile,
  getFormSubmissionsFromDb,
} from '@/lib/db';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const mobile = searchParams.get('mobile');
  const code = searchParams.get('code');
  const formId = searchParams.get('formId');
  const action = searchParams.get('action');

  try {
    // دریافت تمامی نوبت‌های از قبل رزرو شده جهت جلوگیری از ثبت تکراری نوبت در یک زمان
    if (action === 'booked_slots') {
      const targetFormId = formId || 'form-belhagh-booking';
      const submissions = await getFormSubmissionsFromDb(targetFormId);
      const bookedSlots: string[] = [];

      submissions.forEach((s) => {
        if (s.data && typeof s.data === 'object') {
          Object.entries(s.data).forEach(([key, val]) => {
            if (key.startsWith('f_booking_') && val && typeof val === 'string') {
              bookedSlots.push(val.trim());
            }
          });
        }
      });

      return NextResponse.json({ success: true, bookedSlots });
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
        await saveFormSubmissionToDb(submission);
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'عملیات نامعتبر است' }, { status: 400 });
  } catch (err: any) {
    console.error('Error in /api/cases POST:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
