import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { getSmsSettings, saveSmsSettings, sendSmartSms, SmsSettings } from '@/lib/sms-service';

const LOG_PATH = path.join(process.cwd(), 'data', 'sms_logs.json');

export async function GET() {
  try {
    const settings = await getSmsSettings();
    let logs = [];
    try {
      const logsRaw = await fs.readFile(LOG_PATH, 'utf8');
      logs = JSON.parse(logsRaw);
    } catch {
      logs = [];
    }

    return NextResponse.json({
      success: true,
      settings,
      logs: Array.isArray(logs) ? logs.slice(0, 50) : [],
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'save') {
      const { settings } = body;
      if (!settings) {
        return NextResponse.json({ error: 'تنظیمات ارسال نشده است' }, { status: 400 });
      }
      await saveSmsSettings(settings as SmsSettings);
      return NextResponse.json({ success: true, message: 'تنظیمات پیامک با موفقیت ذخیره شد' });
    }

    if (action === 'test') {
      const { mobile, patternKey, args } = body;
      if (!mobile) {
        return NextResponse.json({ error: 'شماره موبایل جهت تست الزامی است' }, { status: 400 });
      }

      const settings = await getSmsSettings();
      const patternConfig = (settings.patterns as any)?.[patternKey];
      if (!patternConfig) {
        return NextResponse.json({ error: 'الگوی پیامک یافت نشد' }, { status: 400 });
      }

      const testArgs = Array.isArray(args) && args.length > 0 
        ? args 
        : patternKey === 'case_registration'
        ? ['SP260120']
        : patternKey === 'appointment_client'
        ? ['مسیح مهدی پور', 'آقای فرهمندی', '۰۹:۰۰ صبح', 'یکشنبه : ۱۴۰۵/۸/۷']
        : ['مهدی سراج', 'اصفهان', 'نجف آباد', mobile, 'پنجشنبه ۱۴۰۵/۸/۷', '۰۹:۰۰ الی ۰۹:۳۰ صبح'];

      let exactMessage = patternConfig.template || 'پیامک آزمایشی سامانه';
      testArgs.forEach((arg, idx) => {
        exactMessage = exactMessage.replace(new RegExp(`\\{${idx}\\}`, 'g'), String(arg));
      });

      const result = await sendSmartSms(
        mobile,
        patternConfig.bodyId,
        testArgs,
        patternKey as any,
        exactMessage
      );

      return NextResponse.json({ success: result.success, result });
    }

    return NextResponse.json({ error: 'عملیات نامعتبر است' }, { status: 400 });
  } catch (err: any) {
    console.error('Error in /api/settings/sms:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
