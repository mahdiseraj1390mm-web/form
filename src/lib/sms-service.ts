import fs from 'fs/promises';
import path from 'path';

export const MELIPAYAMAK_USERNAME = process.env.MELIPAYAMAK_USERNAME || '9120449093';
export const MELIPAYAMAK_PASSWORD = process.env.MELIPAYAMAK_PASSWORD || '627eeb6c-8e98-4563-9160-dc2f60d293e3';

export const DEFAULT_PATTERN_IDS = {
  CASE_REGISTRATION: 568830,      // کد پرونده مراجع: {0}
  APPOINTMENT_CLIENT: 568818,     // تایید نوبت مراجع: {0}=نام مراجع, {1}=نام مشاور, {2}=تاریخ, {3}=ساعت
  APPOINTMENT_COUNSELOR: 568805,  // اطلاع به مشاور: {0}=نام مراجع, {1}=شماره مراجع, {2}=تاریخ, {3}=ساعت
};

export interface SmsPatternConfig {
  bodyId: number;
  title: string;
  description: string;
  template: string;
  variables: string[];
}

export interface SmsSettings {
  provider: string;
  username: string;
  password: string;
  senderNumber: string;
  patterns: {
    case_registration: SmsPatternConfig;
    appointment_client: SmsPatternConfig;
    appointment_counselor: SmsPatternConfig;
  };
}

export interface SmsLogEntry {
  id: string;
  timestamp: string;
  type: 'case_registration' | 'appointment_client' | 'appointment_counselor' | string;
  recipient: string;
  bodyId: number;
  args: string[];
  message: string;
  status: 'sent' | 'failed' | 'simulated';
  providerResponse?: any;
}

const SMS_SETTINGS_PATH = path.join(process.cwd(), 'data', 'sms_settings.json');
const SMS_LOG_PATH = path.join(process.cwd(), 'data', 'sms_logs.json');

/**
 * دریافت تنظیمات زنده پیامک از فایل دیتابیس یا مقادیر پیش‌فرض
 */
export async function getSmsSettings(): Promise<SmsSettings> {
  try {
    const fileData = await fs.readFile(SMS_SETTINGS_PATH, 'utf8');
    const parsed = JSON.parse(fileData);
    if (parsed && parsed.patterns) {
      return parsed;
    }
  } catch {
    // در صورت عدم وجود فایل، مقدار پیش‌فرض را بازمی‌گردانیم
  }

  return {
    provider: 'melipayamak',
    username: MELIPAYAMAK_USERNAME,
    password: MELIPAYAMAK_PASSWORD,
    senderNumber: '50004',
    patterns: {
      case_registration: {
        bodyId: DEFAULT_PATTERN_IDS.CASE_REGISTRATION,
        title: 'پیامک ثبت‌نام و صدور کد پرونده',
        description: 'ارسال کد پرونده اختصاصی به مراجع پس از تکمیل فرم ثبت پرونده',
        template: 'با سلام\nکد پرونده شما: {0} می باشد\nلطفا این کد را ذخیره بفرمایید\nنوبت دهی ها و تست های روانشناسی بالحق با این کد انجام خواهد شد\n\nسایت روانشناسی بالحق\npsy-belhagh.com',
        variables: ['{0}: کد پرونده مراجع'],
      },
      appointment_client: {
        bodyId: DEFAULT_PATTERN_IDS.APPOINTMENT_CLIENT,
        title: 'پیامک تأیید نوبت برای مراجع',
        description: 'ارسال مشخصات نوبت رزرو شده به شماره مراجع',
        template: 'سلام {0} عزیز\nنوبت مشاوره شما با موفقیت ثبت شد.\nنام مشاور: {1}\nتاریخ: {2}\nساعت نوبت: {3}\nلطفاً در زمان تعیین‌شده با مشاور تماس بگیرید\nسایت روانشناسی بالحق\npsy-belhagh.com',
        variables: ['{0}: نام مراجع', '{1}: نام مشاور', '{2}: تاریخ نوبت', '{3}: ساعت نوبت'],
      },
      appointment_counselor: {
        bodyId: DEFAULT_PATTERN_IDS.APPOINTMENT_COUNSELOR,
        title: 'پیامک اطلاع‌رسانی نوبت به مشاور',
        description: 'ارسال مشخصات نوبت جدید و شماره تماس مراجع به تلفن همراه مشاور',
        template: 'مشاور محترم، یک نوبت مشاوره جدید برای شما ثبت شد.\n\nنام مراجعه‌کننده: {0}\nشماره تماس: {1}\nتاریخ نوبت: {2}\nساعت نوبت: {3}\n\npsy-belhagh.com',
        variables: ['{0}: نام مراجعه‌کننده', '{1}: شماره تماس مراجع', '{2}: تاریخ نوبت', '{3}: ساعت نوبت'],
      },
    },
  };
}

/**
 * ذخیره تنظیمات جدید پیامک
 */
export async function saveSmsSettings(settings: SmsSettings): Promise<void> {
  const dataDir = path.join(process.cwd(), 'data');
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(SMS_SETTINGS_PATH, JSON.stringify(settings, null, 2), 'utf8');
}

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

  // بارگذاری اعتبار پنل از تنظیمات زنده سیستم
  const settings = await getSmsSettings();
  const username = settings.username || MELIPAYAMAK_USERNAME;
  const password = settings.password || MELIPAYAMAK_PASSWORD;

  // در وب‌سرویس ملی‌پیامک، آرگومان‌ها با کاراکتر ; از یکدیگر تفکیک می‌شوند
  const textJoined = args.join(';');

  try {
    // وب‌سرویس SendByBaseNumber2 ملی‌پیامک
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
      // در صورت دریافت عدد منفی یا هر پیام خطا
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
 * ۱. پیامک کد پرونده پس از ثبت نام مراجع (الگوی تایید شده ۵۶۸۸۳۰ یا تنظیم‌شده در پنل)
 */
export async function sendCaseRegistrationSms(clientMobile: string, caseCode: string): Promise<any> {
  const settings = await getSmsSettings();
  const pattern = settings.patterns.case_registration;
  const bodyId = pattern?.bodyId || DEFAULT_PATTERN_IDS.CASE_REGISTRATION;

  let fallbackText = pattern?.template
    ? pattern.template.replace(/\{0\}/g, caseCode)
    : `با سلام\nکد پرونده شما: ${caseCode} می باشد\nلطفا این کد را ذخیره بفرمایید\nنوبت دهی ها و تست های روانشناسی بالحق با این کد انجام خواهد شد\n\nسایت روانشناسی بالحق`;

  return sendSharedPatternSms(
    clientMobile,
    bodyId,
    [caseCode],
    'case_registration',
    fallbackText
  );
}

/**
 * ۲. پیامک تایید نوبت برای مراجع (الگوی تایید شده ۵۶۸۸۱۸ یا تنظیم‌شده در پنل)
 * ترتیب دقیق آرگومان‌های پترن ملی‌پیامک:
 * {0} = نام مراجع
 * {1} = نام مشاور
 * {2} = تاریخ نوبت
 * {3} = ساعت نوبت
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

  const settings = await getSmsSettings();
  const pattern = settings.patterns.appointment_client;
  const bodyId = pattern?.bodyId || DEFAULT_PATTERN_IDS.APPOINTMENT_CLIENT;

  let fallbackText = pattern?.template
    ? pattern.template
        .replace(/\{0\}/g, clientName)
        .replace(/\{1\}/g, counselorName)
        .replace(/\{2\}/g, date)
        .replace(/\{3\}/g, time)
    : `سلام ${clientName} عزیز\n\nنوبت مشاوره شما با موفقیت ثبت شد.\n\nنام مشاور: ${counselorName}\nساعت نوبت: ${time}\n\nلطفاً در زمان تعیین‌شده با مشاور تماس بگیرید\n\nسایت روانشناسی بالحق\npsy-belhagh.com`;

  return sendSharedPatternSms(
    clientMobile,
    bodyId,
    [clientName, counselorName, date, time],
    'appointment_client',
    fallbackText
  );
}

/**
 * ۳. پیامک اطلاع‌رسانی نوبت به مشاور (الگوی تایید شده ۵۶۸۸۰۵ یا تنظیم‌شده در پنل)
 * ترتیب دقیق آرگومان‌های پترن ملی‌پیامک:
 * {0} = نام مراجعه‌کننده
 * {1} = شماره تماس مراجع
 * {2} = تاریخ نوبت شمسی
 * {3} = ساعت نوبت
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

  const settings = await getSmsSettings();
  const pattern = settings.patterns.appointment_counselor;
  const bodyId = pattern?.bodyId || DEFAULT_PATTERN_IDS.APPOINTMENT_COUNSELOR;

  let fallbackText = pattern?.template
    ? pattern.template
        .replace(/\{0\}/g, clientName)
        .replace(/\{1\}/g, clientMobile)
        .replace(/\{2\}/g, date)
        .replace(/\{3\}/g, time)
    : `مشاور محترم، یک نوبت مشاوره جدید برای شما ثبت شد.\n\nنام مراجعه‌کننده: ${clientName}\nشماره تماس: ${clientMobile}\nتاریخ نوبت: ${date}\nساعت نوبت: ${time}\n\npsy-belhagh.com`;

  return sendSharedPatternSms(
    counselorMobile,
    bodyId,
    [clientName, clientMobile, date, time],
    'appointment_counselor',
    fallbackText
  );
}
