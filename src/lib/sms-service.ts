import fs from 'fs/promises';
import path from 'path';

export const MELIPAYAMAK_USERNAME = process.env.MELIPAYAMAK_USERNAME || '9120449093';
export const MELIPAYAMAK_PASSWORD = process.env.MELIPAYAMAK_PASSWORD || '627eeb6c-8e98-4563-9160-dc2f60d293e3';

export const DEFAULT_PATTERN_IDS = {
  CASE_REGISTRATION: 568830,      // کد پرونده مراجع: {0}
  APPOINTMENT_CLIENT: 568818,     // تایید نوبت مراجع
  APPOINTMENT_COUNSELOR: 568805,  // اطلاع به مشاور
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
    // بازگشت مقدار پیش‌فرض
  }

  return {
    provider: 'melipayamak',
    username: MELIPAYAMAK_USERNAME,
    password: MELIPAYAMAK_PASSWORD,
    senderNumber: '50004',
    patterns: {
      case_registration: {
        bodyId: DEFAULT_PATTERN_IDS.CASE_REGISTRATION,
        title: 'پیامک صدور کد پرونده',
        description: 'ارسال کد پرونده اختصاصی به مراجع',
        template: 'با سلام\nکد پرونده شما: {0} می باشد\nلطفا این کد را ذخیره بفرمایید\nنوبت دهی ها و تست های روانشناسی بالحق با این کد انجام خواهد شد\n\nسایت روانشناسی بالحق',
        variables: ['{0}: کد پرونده'],
      },
      appointment_client: {
        bodyId: DEFAULT_PATTERN_IDS.APPOINTMENT_CLIENT,
        title: 'پیامک تأیید نوبت مراجع',
        description: 'ارسال مشخصات نوبت رزرو شده به شماره همراه مراجع',
        template: 'سلام {0} عزیز\n\nنوبت مشاوره شما با موفقیت ثبت شد.\n\nنام مشاور: {1}\nساعت نوبت: {2}\n\n{3}\nلطفاً در زمان تعیینشده با مشاور تماس بگیرید\n\nسایت روانشناسی بالحق\npsy-belhagh.com',
        variables: ['{0}: نام مراجع', '{1}: نام مشاور', '{2}: ساعت نوبت', '{3}: تاریخ نوبت'],
      },
      appointment_counselor: {
        bodyId: DEFAULT_PATTERN_IDS.APPOINTMENT_COUNSELOR,
        title: 'پیامک اطلاع‌رسانی نوبت مشاور',
        description: 'ارسال مشخصات نوبت جدید مراجع به تلفن مشاور',
        template: 'مشاور محترم، یک نوبت مشاوره جدید برای شما ثبت شد.\n\nنام مراجعهکننده: {0}\nاستان: {1} شهر: {2} \nشماره تماس: {3}\nتاریخ نوبت: {4}\nساعت نوبت: {5}',
        variables: ['{0}: نام مراجعه‌کننده', '{1}: استان', '{2}: شهر', '{3}: شماره تماس', '{4}: تاریخ نوبت', '{5}: ساعت نوبت'],
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
 * ارسال مستقیم متن کامل پیامک بدون پترن (جهت ارسال دقیق متن دلخواه کاربر کاراکتر به کاراکتر)
 */
export async function sendDirectTextSms(
  to: string,
  text: string,
  type: SmsLogEntry['type']
): Promise<{ success: boolean; response?: any }> {
  const cleanTo = to.replace(/[^0-9]/g, '');
  const standardTo = cleanTo.startsWith('98') ? '0' + cleanTo.slice(2) : cleanTo;

  let providerResponse: any = null;
  let isSuccess = false;

  const settings = await getSmsSettings();
  const username = settings.username || MELIPAYAMAK_USERNAME;
  const password = settings.password || MELIPAYAMAK_PASSWORD;
  const from = settings.senderNumber || '50004';

  try {
    const soapUrl = 'http://api.payamak-panel.com/post/Send.asmx/SendSMS';
    const formParams = new URLSearchParams();
    formParams.append('username', username);
    formParams.append('password', password);
    formParams.append('to', standardTo);
    formParams.append('from', from);
    formParams.append('text', text);
    formParams.append('isflash', 'false');

    const res = await fetch(soapUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formParams.toString(),
    });

    const resText = await res.text();
    providerResponse = resText;

    const match = resText.match(/<string[^>]*>(\d+)<\/string>/);
    if (match && match[1] && match[1].length > 5) {
      isSuccess = true;
      providerResponse = { status: 'sent', recId: match[1] };
    } else {
      const errMatch = resText.match(/<string[^>]*>(-?\d+)<\/string>/);
      const code = errMatch ? errMatch[1] : resText;
      providerResponse = { status: 'failed', code };
    }
  } catch (err: any) {
    providerResponse = { error: err.message };
  }

  await logSms({
    id: `sms-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
    type,
    recipient: standardTo,
    bodyId: 0,
    args: [],
    message: text,
    status: isSuccess ? 'sent' : 'failed',
    providerResponse,
  });

  return { success: isSuccess, response: providerResponse };
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

    const match = resText.match(/<string[^>]*>(\d+)<\/string>/);
    if (match && match[1] && match[1].length > 5) {
      isSuccess = true;
      providerResponse = { status: 'sent', recId: match[1] };
    } else {
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
 * ارسال هوشمند: ابتدا ارسال متن مستقیم دقیق تلاش می‌شود؛ در صورت عدم موفقیت خط یا بلک‌لیست، با پترن خدماتی ارسال می‌شود.
 */
export async function sendSmartSms(
  to: string,
  bodyId: number,
  args: string[],
  type: SmsLogEntry['type'],
  exactMessage: string
): Promise<{ success: boolean; response?: any }> {
  // ۱. تلاش با ارسال مستقیم متن دقیق
  const directRes = await sendDirectTextSms(to, exactMessage, type);
  if (directRes.success) {
    return directRes;
  }

  // ۲. در صورت خطا یا مسدود بودن خط، ارسال با وب‌سرویس پترن خدماتی
  return sendSharedPatternSms(to, bodyId, args, type, exactMessage);
}

/**
 * ۱. پیامک کد پرونده پس از ثبت نام مراجع (الگوی تایید شده ۵۶۸۸۳۰ یا تنظیم‌شده در پنل)
 */
export async function sendCaseRegistrationSms(clientMobile: string, caseCode: string): Promise<any> {
  const settings = await getSmsSettings();
  const pattern = settings.patterns.case_registration;
  const bodyId = pattern?.bodyId || DEFAULT_PATTERN_IDS.CASE_REGISTRATION;

  const exactText = `با سلام\nکد پرونده شما: ${caseCode} می باشد\nلطفا این کد را ذخیره بفرمایید\nنوبت دهی ها و تست های روانشناسی بالحق با این کد انجام خواهد شد\n\nسایت روانشناسی بالحق`;

  return sendSharedPatternSms(
    clientMobile,
    bodyId,
    [caseCode],
    'case_registration',
    exactText
  );
}

/**
 * ۲. پیامک تایید نوبت برای مراجع
 * متن دقیق درخواستی کاربر:
 * سلام {نام مراجع} عزیز
 * نوبت مشاوره شما با موفقیت ثبت شد.
 * نام مشاور: {نام مشاور}
 * ساعت نوبت: {ساعت نوبت}
 * {تاریخ نوبت}
 * لطفاً در زمان تعیینشده با مشاور تماس بگیرید
 * سایت روانشناسی بالحق
 * psy-belhagh.com
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

  const exactText = `سلام ${clientName} عزیز\n\nنوبت مشاوره شما با موفقیت ثبت شد.\n\nنام مشاور: ${counselorName}\nساعت نوبت: ${time}\n\n${date}\nلطفاً در زمان تعیینشده با مشاور تماس بگیرید\n\nسایت روانشناسی بالحق\npsy-belhagh.com`;

  // در پترن ۵۶۸۸۱۸ ملی‌پیامک آرگومان‌ها به ترتیب: [نام مراجع, نام مشاور, تاریخ, ساعت] هستند
  const patternArgs = [clientName, counselorName, date, time];

  return sendSmartSms(
    clientMobile,
    bodyId,
    patternArgs,
    'appointment_client',
    exactText
  );
}

/**
 * ۳. پیامک اطلاع‌رسانی نوبت به مشاور
 * متن دقیق درخواستی کاربر:
 * مشاور محترم، یک نوبت مشاوره جدید برای شما ثبت شد.
 * نام مراجعهکننده: {نام مراجعه‌کننده}
 * استان: {استان} شهر: {شهر}
 * شماره تماس: {شماره تماس}
 * تاریخ نوبت: {تاریخ نوبت}
 * ساعت نوبت: {ساعت نوبت}
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

  const settings = await getSmsSettings();
  const pattern = settings.patterns.appointment_counselor;
  const bodyId = pattern?.bodyId || DEFAULT_PATTERN_IDS.APPOINTMENT_COUNSELOR;

  const exactText = `مشاور محترم، یک نوبت مشاوره جدید برای شما ثبت شد.\n\nنام مراجعهکننده: ${clientName}\nاستان: ${province} شهر: ${city} \nشماره تماس: ${clientMobile}\nتاریخ نوبت: ${date}\nساعت نوبت: ${time}`;

  // اگر پترن ۵۶۸۸۰۵ بود، فقط ۴ آرگومان قبول می‌کند: [نام مراجع, شماره مراجع, تاریخ, ساعت]
  // اگر پترن جدید ثبت‌شده بود، هر ۶ آرگومان ارسال می‌شود
  const patternArgs = bodyId === 568805
    ? [clientName, clientMobile, date, time]
    : [clientName, province, city, clientMobile, date, time];

  return sendSmartSms(
    counselorMobile,
    bodyId,
    patternArgs,
    'appointment_counselor',
    exactText
  );
}
