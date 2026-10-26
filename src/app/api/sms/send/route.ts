import { NextRequest, NextResponse } from 'next/server';
import {
  sendCaseRegistrationSms,
  sendAppointmentClientSms,
  sendAppointmentCounselorSms,
} from '@/lib/sms-service';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'case_registration') {
      const { mobile, caseCode } = body;
      if (!mobile || !caseCode) {
        return NextResponse.json({ error: 'شماره موبایل و کد پرونده الزامی است' }, { status: 400 });
      }
      const res = await sendCaseRegistrationSms(mobile, caseCode);
      return NextResponse.json({ success: true, res });
    }

    if (action === 'appointment_booked') {
      const { clientMobile, counselorMobile, clientName, counselorName, date, time } = body;
      const results: any = {};

      if (clientMobile) {
        results.client = await sendAppointmentClientSms(clientMobile, {
          date: date || 'تعیین‌شده',
          time: time || 'مشخص‌شده',
          counselorName: counselorName || 'مشاور مرکز',
        });
      }

      if (counselorMobile) {
        results.counselor = await sendAppointmentCounselorSms(counselorMobile, {
          clientName: clientName || 'مُراجع محترم',
          date: date || 'تعیین‌شده',
          time: time || 'مشخص‌شده',
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
