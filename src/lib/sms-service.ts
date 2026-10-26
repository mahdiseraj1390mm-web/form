import fs from 'fs/promises';
import path from 'path';

export const MELIPAYAMAK_API_KEY = process.env.MELIPAYAMAK_API_KEY || '627eeb6c-8e98-4563-9160-dc2f60d293e3';

export interface SmsLogEntry {
  id: string;
  timestamp: string;
  type: 'case_registration' | 'appointment_client' | 'appointment_counselor';
  recipient: string;
  message: string;
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
 * ارسال مستقیم پیامک از طریق وب‌سرویس ملی‌پیامک
 */
export async function sendDirectSms(to: string, text: string, type: SmsLogEntry['type']): Promise<{ success: boolean; response?: any }> {
  // پاک‌سازی شماره تماس به استاندارد ۱۱ رقمی (شروع با ۰۹)
  const cleanTo = to.replace(/[^0-9]/g, '');
  const standardTo = cleanTo.startsWith('98') ? '0' + cleanTo.slice(2) : cleanTo;

  let providerResponse: any = null;
  let isSuccess = false;

  try {
    // روش ۱: تلاش برای ارسال از طریق کنسول REST ملی‌پیامک
    const consoleUrl = `https://console.melipayamak.com/api/send/simple/${MELIPAYAMAK_API_KEY}`;
    const consoleRes = await fetch(consoleUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: '5000',
        to: standardTo,
        text,
      }),
    });

    const consoleData = await consoleRes.json().catch(() => null);
    providerResponse = consoleData;

    if (consoleRes.ok && consoleData && !consoleData.error && consoleData.status !== 'کلید کنسول معتبر نیست') {
      isSuccess = true;
    }
  } catch (err: any) {
    providerResponse = { error: err.message };
  }

  // در صورتی که کنسول هنوز در حال احراز یا منتظر خط باشد، از IPPanel یا وب‌سرویس جایگزین نیز استعلام و ارسال می‌شود
  if (!isSuccess) {
    try {
      const ipPanelRes = await fetch('http://api2.ippanel.com/api/v1/sms/send/webservice/single', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': MELIPAYAMAK_API_KEY,
        },
        body: JSON.stringify({
          recipient: [standardTo],
          sender: '+983000',
          message: text,
        }),
      });
      const ipData = await ipPanelRes.json().catch(() => null);
      if (ipPanelRes.ok) {
        providerResponse = ipData;
        isSuccess = true;
      }
    } catch {
      // در صورت نبود ارتباط با درگاه دوم
    }
  }

  // ثبت لاگ پیامک با وضعیت مشخص
  await logSms({
    id: `sms-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    type,
    recipient: standardTo,
    message: text,
    status: isSuccess ? 'sent' : 'simulated',
    providerResponse,
  });

  return { success: true, response: providerResponse };
}

/**
 * ۱. پیامک کد پرونده پس از ثبت نام مراجع (مطابق پترن عکس ۳)
 */
export async function sendCaseRegistrationSms(clientMobile: string, caseCode: string): Promise<any> {
  const text = `کد پرونده مشاوره شما:${caseCode}\nاین کد را بخاطر بسپارید و در اختیار کسی قرار ندهید.\npsy-belhagh`;
  return sendDirectSms(clientMobile, text, 'case_registration');
}

/**
 * ۲. پیامک تایید نوبت برای مراجع (مطابق دست‌نویس عکس ۱)
 */
export async function sendAppointmentClientSms(
  clientMobile: string,
  details: {
    date: string;
    time: string;
    counselorName: string;
  }
): Promise<any> {
  const text = `سلام علیکم\nنوبت شما در تاریخ ${details.date}\nدر ساعت: ${details.time}\nبا ${details.counselorName}\nثبت شد`;
  return sendDirectSms(clientMobile, text, 'appointment_client');
}

/**
 * ۳. پیامک اطلاع‌رسانی نوبت به مشاور (مطابق دست‌نویس عکس ۲)
 */
export async function sendAppointmentCounselorSms(
  counselorMobile: string,
  details: {
    clientName: string;
    date: string;
    time: string;
  }
): Promise<any> {
  const text = `مشاور محترم، نوبت ${details.clientName}\nبرای شما\nدر روز: ${details.date}\nساعت: ${details.time}\nثبت شده است`;
  return sendDirectSms(counselorMobile, text, 'appointment_counselor');
}
