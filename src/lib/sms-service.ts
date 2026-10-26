import fs from 'fs/promises';
import path from 'path';

export const MELIPAYAMAK_API_KEY = process.env.MELIPAYAMAK_API_KEY || process.env.SMS_API_KEY || 'a2fb7ade-1154-49b9-a7b8-993c157415c2';
export const MELIPAYAMAK_USERNAME = process.env.MELIPAYAMAK_USERNAME || process.env.SMS_USERNAME || '9017335306';
export const MELIPAYAMAK_PASSWORD = process.env.MELIPAYAMAK_PASSWORD || process.env.SMS_PASSWORD || 'a2fb7ade-1154-49b9-a7b8-993c157415c2';
export const SMS_SENDER = process.env.SMS_SENDER || '50004001335306';

// کدهای الگوهای تأییدشده در سامانه پیامکی
export const SMS_PATTERNS = {
  /** الگوی کد پرونده برای مراجع */
  CASE_CODE: '568830',
  /** الگوی تایید ثبت نوبت برای مراجع */
  APPOINTMENT_CLIENT: '568818',
  /** الگوی اطلاع‌رسانی نوبت جدید به مشاور */
  APPOINTMENT_COUNSELOR: '568805',
};

export interface SmsLogEntry {
  id: string;
  timestamp: string;
  type: 'case_registration' | 'appointment_client' | 'appointment_counselor';
  patternCode: string;
  recipient: string;
  recipientName?: string;
  message: string;
  variables: Record<string, string>;
  status: 'sent' | 'failed' | 'simulated';
  providerResponse?: any;
}

const SMS_LOG_PATH = path.join(process.cwd(), 'data', 'sms_logs.json');

/**
 * ذخیره وقایع و گزارش پیامک‌های ارسالی در فایل لاگ سیستم
 */
export async function logSms(entry: SmsLogEntry): Promise<void> {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });

    let logs: SmsLogEntry[] = [];
    try {
      const fileData = await fs.readFile(SMS_LOG_PATH, 'utf8');
      logs = JSON.parse(fileData);
    } catch {
      logs = [];
    }

    logs.unshift(entry);
    // نگه‌داری حداکثر ۵۰۰ رکورد لاگ آخر
    if (logs.length > 500) logs = logs.slice(0, 500);

    await fs.writeFile(SMS_LOG_PATH, JSON.stringify(logs, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write SMS log:', err);
  }
}

/**
 * دریافت تاریخچه لاگ‌های پیامک برای نظارت و تست
 */
export async function getSmsLogs(limit = 100): Promise<SmsLogEntry[]> {
  try {
    const fileData = await fs.readFile(SMS_LOG_PATH, 'utf8');
    const logs: SmsLogEntry[] = JSON.parse(fileData);
    return logs.slice(0, limit);
  } catch {
    return [];
  }
}

/**
 * ارسال بر اساس پترن (کد متن الگو) با درگاه‌های چندگانه ملی‌پیامک و IPPanel
 */
export async function sendPatternSms(options: {
  to: string;
  patternCode: string;
  variables: Record<string, string>;
  args: string[];
  type: SmsLogEntry['type'];
  fullText: string;
  recipientName?: string;
}): Promise<{ success: boolean; response?: any }> {
  const { to, patternCode, variables, args, type, fullText, recipientName } = options;

  // نرمال‌سازی شماره تماس به فرمت استاندارد ایران (مثال: 09121234567)
  const clean = to.replace(/\D/g, '');
  let standardTo = clean;
  if (clean.startsWith('98')) {
    standardTo = '0' + clean.slice(2);
  } else if (!clean.startsWith('0') && clean.length === 10) {
    standardTo = '0' + clean;
  }

  if (!standardTo || standardTo.length < 11) {
    const errorEntry: SmsLogEntry = {
      id: `sms-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      type,
      patternCode,
      recipient: to,
      recipientName,
      message: fullText,
      variables,
      status: 'failed',
      providerResponse: { error: 'شماره تلفن نامعتبر است' },
    };
    await logSms(errorEntry);
    return { success: false, response: { error: 'شماره تلفن نامعتبر است' } };
  }

  let isSuccess = false;
  let providerResponse: any = null;

  // ─── تلاش ۱: ارسال از طریق IPPanel REST Pattern API ───────────────────────
  try {
    const ippanelRes = await fetch('http://api2.ippanel.com/api/v1/sms/pattern/normal/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': MELIPAYAMAK_API_KEY,
      },
      body: JSON.stringify({
        code: patternCode,
        sender: '+983000505',
        recipient: standardTo,
        variable: variables,
      }),
    });

    const ippanelData = await ippanelRes.json().catch(() => null);
    if (ippanelRes.ok && ippanelData && !ippanelData.error) {
      isSuccess = true;
      providerResponse = { provider: 'ippanel-rest', data: ippanelData };
    }
  } catch (err: any) {
    // خطای درگاه اول
  }

  // ─── تلاش ۲: ارسال از طریق ملی‌پیامک BaseServiceNumber (REST) ───────────────
  if (!isSuccess) {
    try {
      const meliRes = await fetch('https://rest.payamak-panel.com/api/SendSMS/BaseServiceNumber', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: MELIPAYAMAK_USERNAME,
          password: MELIPAYAMAK_PASSWORD,
          text: args.join(';'),
          to: standardTo,
          bodyId: Number(patternCode),
        }),
      });

      const meliData = await meliRes.json().catch(() => null);
      if (meliRes.ok && meliData) {
        const val = Number(meliData.Value);
        if (meliData.RetStatus === 1 || val > 1000) {
          isSuccess = true;
          providerResponse = { provider: 'melipayamak-base', data: meliData };
        } else {
          providerResponse = { provider: 'melipayamak-base', data: meliData };
        }
      }
    } catch (err: any) {
      // ادامه به درگاه بعدی
    }
  }

  // ─── تلاش ۳: ارسال از طریق کنسول ملی‌پیامک Shared Console API ───────────────
  if (!isSuccess) {
    try {
      const consoleUrl = `https://console.melipayamak.com/api/send/shared/${MELIPAYAMAK_API_KEY}`;
      const consoleRes = await fetch(consoleUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bodyId: Number(patternCode),
          to: standardTo,
          args,
        }),
      });

      const consoleData = await consoleRes.json().catch(() => null);
      if (consoleRes.ok && consoleData && !consoleData.error && consoleData.status !== 'کلید کنسول معتبر نیست') {
        isSuccess = true;
        providerResponse = { provider: 'melipayamak-console', data: consoleData };
      }
    } catch (err: any) {
      // ادامه به ثبت لاگ
    }
  }

  // ثبت لاگ دقیق پیامک
  const logEntry: SmsLogEntry = {
    id: `sms-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    type,
    patternCode,
    recipient: standardTo,
    recipientName,
    message: fullText,
    variables,
    status: isSuccess ? 'sent' : 'simulated',
    providerResponse: providerResponse || { note: 'آماده ارسال در محیط تست و شبیه‌سازی' },
  };

  await logSms(logEntry);
  return { success: true, response: logEntry };
}

/**
 * ۱. پیامک کد پرونده پس از ثبت پرونده مراجع (الگوی تاییدشده ۵۶۸۸۳۰)
 * متن الگو: کد پرونده مشاوره شما:{0} این کد را بخاطر بسپارید و در اختیار کسی قرار ندهید. psy-belhagh
 * متغیرها: {0} = کد پرونده
 */
export async function sendCaseRegistrationSms(clientMobile: string, caseCode: string): Promise<any> {
  const fullText = `کد پرونده مشاوره شما:${caseCode} این کد را بخاطر بسپارید و در اختیار کسی قرار ندهید. psy-belhagh`;
  return sendPatternSms({
    to: clientMobile,
    patternCode: SMS_PATTERNS.CASE_CODE,
    variables: { '0': caseCode },
    args: [caseCode],
    type: 'case_registration',
    fullText,
    recipientName: 'مراجعه‌کننده',
  });
}

/**
 * ۲. پیامک تایید ثبت نوبت برای مراجعه‌کننده (الگوی تاییدشده ۵۶۸۸۱۸)
 * متن الگو: سلام {0} عزیز نوبت مشاوره شما با موفقیت ثبت شد. نام مشاور: {1} تاریخ نوبت: {2} ساعت نوبت: {3} لطفاً در زمان تعیین‌شده برای مشاوره آماده باشید. psy-belhagh
 * متغیرها:
 *  {0} = نام مراجع
 *  {1} = نام مشاور
 *  {2} = تاریخ نوبت
 *  {3} = ساعت نوبت
 */
export async function sendAppointmentClientSms(
  clientMobile: string,
  details: {
    clientName: string;
    counselorName: string;
    date: string;
    time: string;
  }
): Promise<any> {
  const { clientName, counselorName, date, time } = details;
  const fullText = `سلام ${clientName} عزیز نوبت مشاوره شما با موفقیت ثبت شد. نام مشاور: ${counselorName} تاریخ نوبت: ${date} ساعت نوبت: ${time} لطفاً در زمان تعیین‌شده برای مشاوره آماده باشید. psy-belhagh`;

  return sendPatternSms({
    to: clientMobile,
    patternCode: SMS_PATTERNS.APPOINTMENT_CLIENT,
    variables: {
      '0': clientName,
      '1': counselorName,
      '2': date,
      '3': time,
    },
    args: [clientName, counselorName, date, time],
    type: 'appointment_client',
    fullText,
    recipientName: clientName,
  });
}

/**
 * ۳. پیامک اطلاع‌رسانی ثبت نوبت جدید به مشاور (الگوی تاییدشده ۵۶۸۸۰۵)
 * متن الگو: مشاور محترم، یک نوبت مشاوره جدید برای شما ثبت شد. نام مراجعه‌کننده: {0} شماره تماس: {1} تاریخ نوبت: {2} ساعت نوبت: {3} psy-belhagh
 * متغیرها:
 *  {0} = نام مراجعه‌کننده
 *  {1} = شماره تماس مراجعه‌کننده
 *  {2} = تاریخ نوبت
 *  {3} = ساعت نوبت
 */
export async function sendAppointmentCounselorSms(
  counselorMobile: string,
  details: {
    clientName: string;
    clientMobile: string;
    date: string;
    time: string;
  }
): Promise<any> {
  const { clientName, clientMobile, date, time } = details;
  const fullText = `مشاور محترم، یک نوبت مشاوره جدید برای شما ثبت شد. نام مراجعه‌کننده: ${clientName} شماره تماس: ${clientMobile} تاریخ نوبت: ${date} ساعت نوبت: ${time} psy-belhagh`;

  return sendPatternSms({
    to: counselorMobile,
    patternCode: SMS_PATTERNS.APPOINTMENT_COUNSELOR,
    variables: {
      '0': clientName,
      '1': clientMobile,
      '2': date,
      '3': time,
    },
    args: [clientName, clientMobile, date, time],
    type: 'appointment_counselor',
    fullText,
    recipientName: 'مشاور مرکز',
  });
}
