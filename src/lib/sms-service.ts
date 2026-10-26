import fs from 'fs/promises';
import path from 'path';

export const MELIPAYAMAK_API_KEY = process.env.MELIPAYAMAK_API_KEY || '627eeb6c-8e98-4563-9160-dc2f60d293e3';

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
  bodyId?: number;
  args?: string[];
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
 * ارسال پیامک خدماتی بر اساس الگوی تاییدشده ملی‌پیامک (Console Shared Pattern)
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

  const apiKey = process.env.MELIPAYAMAK_API_KEY || MELIPAYAMAK_API_KEY;

  try {
    // روش ۱: کنسول ملی‌پیامک - ارسال سریع الگوی خدماتی
    const consoleUrl = `https://console.melipayamak.com/api/send/shared/${apiKey}`;
    const consoleRes = await fetch(consoleUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        bodyId,
        to: standardTo,
        args,
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

  // لاگ رویداد ارسال پیامک
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
 * ۱. پیامک کد پرونده پس از ثبت نام مراجع (الگوی ۵۶۸۸۳۰)
 * الگو: کد پرونده مشاوره شما:{0} این کد را بخاطر بسپارید و در اختیار کسی قرار ندهید. psy-belhagh
 */
export async function sendCaseRegistrationSms(clientMobile: string, caseCode: string): Promise<any> {
  const fallbackText = `کد پرونده مشاوره شما:${caseCode}\nاین کد را بخاطر بسپارید و در اختیار کسی قرار ندهید.\npsy-belhagh`;
  return sendSharedPatternSms(
    clientMobile,
    PATTERN_IDS.CASE_REGISTRATION,
    [caseCode],
    'case_registration',
    fallbackText
  );
}

/**
 * ۲. پیامک تایید نوبت برای مراجع (الگوی ۵۶۸۸۱۸)
 * الگو: سلام {0} عزیز نوبت مشاوره شما با موفقیت ثبت شد. نام مشاور: {1} تاریخ نوبت: {2} ساعت نوبت: {3} لطفاً در زمان تعیین‌شده برای مشاوره آماده باشید. psy-belhagh
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
  const clientName = details.clientName || 'مراجع';
  const counselorName = details.counselorName || 'مشاور مرکز';
  const date = details.date || 'تعیین‌شده';
  const time = details.time || 'تعیین‌شده';

  const fallbackText = `سلام ${clientName} عزیز نوبت مشاوره شما با موفقیت ثبت شد. نام مشاور: ${counselorName} تاریخ نوبت: ${date} ساعت نوبت: ${time} لطفاً در زمان تعیین‌شده برای مشاوره آماده باشید. psy-belhagh`;

  return sendSharedPatternSms(
    clientMobile,
    PATTERN_IDS.APPOINTMENT_CLIENT,
    [clientName, counselorName, date, time],
    'appointment_client',
    fallbackText
  );
}

/**
 * ۳. پیامک اطلاع‌رسانی نوبت به مشاور (الگوی ۵۶۸۸۰۵)
 * الگو: مشاور محترم، یک نوبت مشاوره جدید برای شما ثبت شد. نام مراجعه‌کننده: {0} شماره تماس: {1} تاریخ نوبت: {2} ساعت نوبت: {3} psy-belhagh
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
  const clientName = details.clientName || 'مُراجع محترم';
  const clientMobile = details.clientMobile || 'ثبت‌شده در پرونده';
  const date = details.date || 'تعیین‌شده';
  const time = details.time || 'تعیین‌شده';

  const fallbackText = `مشاور محترم، یک نوبت مشاوره جدید برای شما ثبت شد. نام مراجعه‌کننده: ${clientName} شماره تماس: ${clientMobile} تاریخ نوبت: ${date} ساعت نوبت: ${time} psy-belhagh`;

  return sendSharedPatternSms(
    counselorMobile,
    PATTERN_IDS.APPOINTMENT_COUNSELOR,
    [clientName, clientMobile, date, time],
    'appointment_counselor',
    fallbackText
  );
}
