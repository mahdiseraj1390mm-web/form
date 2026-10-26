import { NextRequest, NextResponse } from 'next/server';
import {
  sendCaseRegistrationSms,
  sendAppointmentClientSms,
  sendAppointmentCounselorSms,
  getSmsLogs,
} from '@/lib/sms-service';

/**
 * دریافت گزارش پیامک‌های اخیر
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get('limit')) || 50;
    const logs = await getSmsLogs(limit);
    return NextResponse.json({ success: true, count: logs.length, logs });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/**
 * ارسال پیامک بر اساس الگوهای تاییدشده مرکز مشاوره روانشناسی بالحق
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    // ۱. پیامک کد پرونده پس از ثبت نام مراجع (الگوی ۵۶۸۸۳۰)
    if (action === 'case_registration') {
      const { mobile, caseCode } = body;
      if (!mobile || !caseCode) {
        return NextResponse.json({ error: 'شماره موبایل و کد پرونده الزامی است' }, { status: 400 });
      }
      const res = await sendCaseRegistrationSms(mobile, caseCode);
      return NextResponse.json({ success: true, res });
    }

    // ۲ و ۳. ثبت نوبت مشاوره (ارسال همزمان به مراجع و مشاور)
    if (action === 'appointment_booked') {
      const {
        clientMobile,
        counselorMobile,
        clientName,
        counselorName,
        date,
        time,
      } = body;

      const results: { client?: any; counselor?: any } = {};

      // ۲. الگوی ۵۶۸۸۱۸: تأیید ثبت نوبت برای مراجع
      if (clientMobile) {
        results.client = await sendAppointmentClientSms(clientMobile, {
          clientName: clientName || 'مراجعه‌کننده محترم',
          counselorName: counselorName || 'مشاور مرکز',
          date: date || 'روز تعیین‌شده',
          time: time || 'ساعت مقرر',
        });
      }

      // ۳. الگوی ۵۶۸۸۰۵: اطلاع‌رسانی ثبت نوبت به مشاور
      if (counselorMobile) {
        results.counselor = await sendAppointmentCounselorSms(counselorMobile, {
          clientName: clientName || 'مراجعه‌کننده محترم',
          clientMobile: clientMobile || 'مشخص‌شده در سامانه',
          date: date || 'روز تعیین‌شده',
          time: time || 'ساعت مقرر',
        });
      }

      return NextResponse.json({ success: true, results });
    }

    return NextResponse.json({ error: 'اکشن نامعتبر است' }, { status: 400 });
  } catch (err: any) {
    console.error('Error in /api/sms/send:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
