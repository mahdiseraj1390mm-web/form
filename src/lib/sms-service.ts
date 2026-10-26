import fs from 'fs/promises';
import path from 'path';

export const MELIPAYAMAK_USERNAME = process.env.MELIPAYAMAK_USERNAME || '9120449093';
export const MELIPAYAMAK_PASSWORD = process.env.MELIPAYAMAK_PASSWORD || '627eeb6c-8e98-4563-9160-dc2f60d293e3';

export const PATTERN_IDS = {
  CASE_REGISTRATION: 568830,      // کد پرونده مراجع: {0}
  APPOINTMENT_CLIENT: 568818,     // تایید نوبت مراجع: {0}=نام مراجع, {1}=نام مشاور, {2}=تاریخ, {3}=ساعت
  APPOINTMENT_COUNSELOR: 568805,  // اطلاع به مشاور: {0}=نام مراجع, {1}=شماره مراجع, {2}=تاریخ, {3}=ساعت
};

export interface SmsLogEntry {
  id: string;
  timestamp: string;
  type: 'case_registration' | 'appointment_client' | 'appointment_counselor';
  recipient: string;
  bodyId: number;
  args: string[];
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
    if (logs.length > 500) logs = logs.slice(0, 500);

    await fs.writeFile(SMS_LOG_PATH, JSON.stringify(logs, null, 2), 'utf8');
  } catch (err) {
    console.error('Failed to write SMS log:', err);
  }
}

/**
 * ارسال پیامک خدماتی از طریق وب‌سرویس ملی‌پیامک (SendByBaseNumber2)
 * در این روش پیامک حتی به لیست سیاه (بلک‌لیست) و در کمتر از چند ثانیه تحویل می‌شود.
 */
export async function sendSharedPatternSms(
  to: string,
  bodyId: number,
  args: string[],
  type: SmsLogEntry['type'],
  fallbackMessage: string
): Promise<{ success: boolean; response?: any }> {
  // پاک‌سازی شماره تماس به استاندارد ۱۱ رقمی (شروع با ۰۹)
  const cleanTo = to.replace(/[^0-9]/g, '');
  const standardTo = cleanTo.startsWith('98') ? '0' + cleanTo.slice(2) : cleanTo;

  let providerResponse: any = null;
  let isSuccess = false;

  const username = process.env.MELIPAYAMAK_USERNAME || MELIPAYAMAK_USERNAME;
  const password = process.env.MELIPAYAMAK_PASSWORD || MELIPAYAMAK_PASSWORD;

  // در وب‌سرویس ملی‌پیامک، آرگومان‌ها با کاراکتر ; از یکدیگر تفکیک می‌شوند
  const textJoined = args.join(';');

  try {
    // روش ۱: وب‌سرویس قدرتمند SendByBaseNumber2 ملی‌پیامک
    const soapUrl = 'http://api.payamak-panel.com/post/Send.asmx/SendByBaseNumber2';
    const formParams = new URLSearchParams();
    formParams.append('username', username);
    formParams.append('password', password);
    formParams.append('text', textJoined);
    formParams.append('to', standardTo);
    formParams.append('bodyId', String(bodyId));

    const res = await fetch(soapUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formParams.toString(),
    });

    const resText = await res.text();
    providerResponse = resText;

    // در ملی‌پیامک اگر پاسخ یک رشته عددی بزرگ (شناسه پیگیری ارسال RecID) باشد، ارسال موفق بوده است
    const match = resText.match(/<string[^>]*>(\d+)<\/string>/);
    if (match && match[1] && match[1].length > 5) {
      isSuccess = true;
      providerResponse = { status: 'sent', recId: match[1] };
    } else {
      // در صورت دریافت عدد منفی، خطا رخ داده است
      const errMatch = resText.match(/<string[^>]*>(-?\d+)<\/string>/);
      const code = errMatch ? errMatch[1] : resText;
      providerResponse = { status: 'failed', code };
    }
  } catch (err: any) {
    providerResponse = { error: err.message };
  }

  // ثبت در فایل لاگ سیستم
  await logSms({
    id: `sms-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    type,
    recipient: standardTo,
    bodyId,
    args,
    message: fallbackMessage,
    status: isSuccess ? 'sent' : 'failed',
    providerResponse,
  });

  return { success: isSuccess, response: providerResponse };
}

/**
 * ۱. پیامک کد پرونده پس از ثبت نام مراجع (الگوی تایید شده ۵۶۸۸۳۰)
 * الگو: با سلام کد پرونده شما: {0} می باشد لطفا این کد را ذخیره بفرمایید نوبت دهی ها و تست های روانشناسی بالحق با این کد انجام خواهد شد سایت روانشناسی بالحق
 */
export async function sendCaseRegistrationSms(clientMobile: string, caseCode: string): Promise<any> {
  const fallbackText = `با سلام\nکد پرونده شما: ${caseCode} می باشد\nلطفا این کد را ذخیره بفرمایید\nنوبت دهی ها و تست های روانشناسی بالحق با این کد انجام خواهد شد\n\nسایت روانشناسی بالحق`;
  return sendSharedPatternSms(
    clientMobile,
    PATTERN_IDS.CASE_REGISTRATION,
    [caseCode],
    'case_registration',
    fallbackText
  );
}

/**
 * ۲. پیامک تایید نوبت برای مراجع (الگوی تایید شده ۵۶۸۸۱۸)
 * الگو: سلام {0} عزیز نوبت مشاوره شما با موفقیت ثبت شد. نام مشاور: {1} ساعت نوبت: {3} لطفاً در زمان تعیین‌شده با مشاور تماس بگیرید سایت روانشناسی بالحق psy-belhagh.com
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
  const clientName = details.clientName || 'مُراجع';
  const counselorName = details.counselorName || 'مشاور مرکز';
  const date = details.date || 'تعیین‌شده';
  const time = details.time || 'تعیین‌شده';

  const fallbackText = `سلام ${clientName} عزیز\n\nنوبت مشاوره شما با موفقیت ثبت شد.\n\nنام مشاور: ${counselorName}\nساعت نوبت: ${time}\n\nلطفاً در زمان تعیین‌شده با مشاور تماس بگیرید\n\nسایت روانشناسی بالحق\npsy-belhagh.com`;

  return sendSharedPatternSms(
    clientMobile,
    PATTERN_IDS.APPOINTMENT_CLIENT,
    [clientName, counselorName, date, time],
    'appointment_client',
    fallbackText
  );
}

/**
 * ۳. پیامک اطلاع‌رسانی نوبت به مشاور (الگوی تایید شده ۵۶۸۸۰۵)
 * الگو: مشاور محترم، یک نوبت مشاوره جدید برای شما ثبت شد. نام مراجعه‌کننده: {0} استان: {1} شهر: {2} شماره تماس: {3} تاریخ نوبت: {4} ساعت نوبت: {5}
 */
export async function sendAppointmentCounselorSms(
  counselorMobile: string,
  details: {
    clientName: string;
    province?: string;
    city?: string;
    clientMobile: string;
    date: string;
    time: string;
  }
): Promise<any> {
  const clientName = details.clientName || 'مُراجع محترم';
  const province = details.province || 'مشخص‌نشده';
  const city = details.city || 'مشخص‌نشده';
  const clientMobile = details.clientMobile || 'ثبت‌شده در پرونده';
  const date = details.date || 'تعیین‌شده';
  const time = details.time || 'تعیین‌شده';

  const fallbackText = `مشاور محترم، یک نوبت مشاوره جدید برای شما ثبت شد.\n\nنام مراجعه‌کننده: ${clientName}\nاستان: ${province} شهر: ${city}\nشماره تماس: ${clientMobile}\nتاریخ نوبت: ${date}\nساعت نوبت: ${time}`;

  return sendSharedPatternSms(
    counselorMobile,
    PATTERN_IDS.APPOINTMENT_COUNSELOR,
    [clientName, province, city, clientMobile, date, time],
    'appointment_counselor',
    fallbackText
  );
}
