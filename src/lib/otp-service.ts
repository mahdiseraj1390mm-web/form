import crypto from 'crypto';
import { sql, normalizeMobile } from '@/lib/db';

const OTP_TTL_SECONDS = 120; // ۲ دقیقه اعتبار دقیق (مطابق با متن پیامک ارسالی به مراجع)
const OTP_COOLDOWN_SECONDS = 60; // ۶۰ ثانیه فاصله مجاز تا درخواست مجدد
const MAX_ATTEMPTS = 5; // حداکثر تلاش‌های مجاز اشتباه
const OTP_SECRET = process.env.OTP_SECRET_KEY || 'belhagh_otp_secure_pepper_2026';

let isTableInitialized = false;

/**
 * ایجاد خودکار و اتمیک جدول کدهای امنیتی و ایندکس‌های مربوطه در PostgreSQL
 */
export async function ensureOtpTable(): Promise<void> {
  if (isTableInitialized) return;

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS public.security_otps (
        id BIGSERIAL PRIMARY KEY,
        mobile VARCHAR(32) NOT NULL,
        purpose VARCHAR(32) NOT NULL DEFAULT 'recovery',
        code_hash VARCHAR(64) NOT NULL,
        attempts INT NOT NULL DEFAULT 0,
        max_attempts INT NOT NULL DEFAULT 5,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMPTZ NOT NULL,
        last_sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        metadata JSONB DEFAULT '{}'::jsonb
      )
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_security_otps_lookup 
      ON public.security_otps (mobile, purpose, expires_at)
    `;

    await sql`
      CREATE INDEX IF NOT EXISTS idx_security_otps_expiry 
      ON public.security_otps (expires_at)
    `;

    isTableInitialized = true;
  } catch (err) {
    console.warn('ensureOtpTable warning (DB might be offline or using fallback):', err);
  }
}

/**
 * هش‌سازی امن کد یک‌بارمصرف با استفاده از HMAC-SHA256 و Salt اختصاصی
 * این ساختار از نشت کد در صورت دسترسی غیرمجاز به دیتابیس جلوگیری می‌کند.
 */
function hashOtp(code: string, mobile: string, purpose: string): string {
  const payload = `${mobile.trim()}:${purpose.trim()}:${code.trim()}`;
  return crypto.createHmac('sha256', OTP_SECRET).update(payload).digest('hex');
}

/**
 * تبدیل ارقام فارسی و عربی به انگلیسی و پاک‌سازی هرگونه کاراکتر غیرعددی
 */
export function cleanOtpCode(rawCode: string): string {
  return String(rawCode || '')
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[^0-9]/g, '')
    .trim();
}

/**
 * حافظه محلی اضطراری (Fallback Memory Store) در صورتی که دیتابیس PostgreSQL در دسترس نباشد
 */
interface FallbackOtpEntry {
  codeHash: string;
  mobile: string;
  purpose: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number;
  metadata?: Record<string, unknown>;
}

declare global {
  var __belhaghOtpFallbackStore: Map<string, FallbackOtpEntry> | undefined;
}

const fallbackOtpStore: Map<string, FallbackOtpEntry> =
  globalThis.__belhaghOtpFallbackStore || new Map();
globalThis.__belhaghOtpFallbackStore = fallbackOtpStore;

/**
 * بررسی امکان ارسال مجدد کد (محدودیت نرخ ۶۰ ثانیه)
 */
export async function canRequestOtp(
  mobile: string,
  purpose: string = 'recovery'
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const cleanPhone = normalizeMobile(mobile);
  if (!cleanPhone || cleanPhone.length < 10) {
    return { allowed: false, retryAfter: 0 };
  }

  const now = Date.now();

  try {
    await ensureOtpTable();

    const rows = await sql`
      SELECT last_sent_at 
      FROM public.security_otps 
      WHERE mobile = ${cleanPhone} AND purpose = ${purpose}
      ORDER BY last_sent_at DESC 
      LIMIT 1
    `;

    if (rows && rows[0] && rows[0].last_sent_at) {
      const lastSentTime = new Date(rows[0].last_sent_at).getTime();
      const elapsedMs = now - lastSentTime;
      const cooldownMs = OTP_COOLDOWN_SECONDS * 1000;

      if (elapsedMs < cooldownMs) {
        const remainingSec = Math.ceil((cooldownMs - elapsedMs) / 1000);
        return { allowed: false, retryAfter: remainingSec };
      }
    }
  } catch {
    // در صورت عدم دسترسی به دیتابیس، بررسی در حافظه موقت فال‌بک
    const fallbackKey = `${cleanPhone}:${purpose}`;
    const entry = fallbackOtpStore.get(fallbackKey);
    if (entry) {
      const elapsedMs = now - entry.lastSentAt;
      const cooldownMs = OTP_COOLDOWN_SECONDS * 1000;
      if (elapsedMs < cooldownMs) {
        const remainingSec = Math.ceil((cooldownMs - elapsedMs) / 1000);
        return { allowed: false, retryAfter: remainingSec };
      }
    }
  }

  return { allowed: true };
}

/**
 * تولید امن و ذخیره کد یکبارمصرف با رمزنگاری CSPRNG
 */
export async function generateAndSaveOtp(params: {
  mobile: string;
  purpose?: string;
  metadata?: Record<string, unknown>;
  digits?: number;
}): Promise<{ code: string; expiresIn: number }> {
  const { mobile, purpose = 'recovery', metadata = {}, digits = 5 } = params;
  const cleanPhone = normalizeMobile(mobile);
  const now = Date.now();

  // ۱. تولید تصادفی امن بر پایه CSPRNG سیستم‌عامل (جایگزین Math.random)
  const minRange = Math.pow(10, digits - 1);
  const maxRange = Math.pow(10, digits) - 1;
  const rawCode = crypto.randomInt(minRange, maxRange + 1).toString();

  // ۲. محاسبه هش کد
  const codeHash = hashOtp(rawCode, cleanPhone, purpose);
  const expiresAt = new Date(now + OTP_TTL_SECONDS * 1000);

  // ۳. ذخیره‌سازی اولیه در دیتابیس PostgreSQL
  let dbSuccess = false;
  try {
    await ensureOtpTable();

    // حذف کدهای منقضی‌شده قدیمی این شماره جهت تمیز ماندن جدول
    await sql`
      DELETE FROM public.security_otps 
      WHERE mobile = ${cleanPhone} AND purpose = ${purpose}
    `.catch(() => {});

    // درج رکورد جدید با هش
    await sql`
      INSERT INTO public.security_otps 
        (mobile, purpose, code_hash, attempts, max_attempts, expires_at, last_sent_at, metadata)
      VALUES 
        (${cleanPhone}, ${purpose}, ${codeHash}, 0, ${MAX_ATTEMPTS}, ${expiresAt.toISOString()}, NOW(), ${JSON.stringify(metadata)})
    `;
    dbSuccess = true;
  } catch (err) {
    console.warn('DB OTP Insert error, writing to fallback memory:', err);
  }

  // ۴. در صورت عدم دسترسی به دیتابیس یا جهت لایه پشتیبان، در حافظه فال‌بک ثبت می‌شود
  if (!dbSuccess) {
    const fallbackKey = `${cleanPhone}:${purpose}`;
    fallbackOtpStore.set(fallbackKey, {
      codeHash,
      mobile: cleanPhone,
      purpose,
      expiresAt: expiresAt.getTime(),
      attempts: 0,
      lastSentAt: now,
      metadata,
    });
  }

  return {
    code: rawCode,
    expiresIn: OTP_TTL_SECONDS,
  };
}

/**
 * اعتبارسنجی امن کد وارد شده با مقایسه زمان‌ثابت (Constant-time comparison)
 * تضمین Single-Use و ابطال خودکار پس از بررسی
 */
export async function verifyOtp(params: {
  mobile: string;
  code: string;
  purpose?: string;
}): Promise<{ success: boolean; metadata?: Record<string, unknown>; error?: string }> {
  const { mobile, code, purpose = 'recovery' } = params;
  const cleanPhone = normalizeMobile(mobile);
  const cleanCode = cleanOtpCode(code);

  if (!cleanPhone || !cleanCode) {
    return { success: false, error: 'شماره همراه و کد تأیید الزامی است.' };
  }

  const now = Date.now();
  const inputHash = hashOtp(cleanCode, cleanPhone, purpose);
  const inputBuffer = Buffer.from(inputHash, 'hex');

  // ۱. بررسی در پایگاه‌داده PostgreSQL
  try {
    await ensureOtpTable();

    const rows = await sql`
      SELECT id, code_hash, attempts, max_attempts, metadata, expires_at
      FROM public.security_otps
      WHERE mobile = ${cleanPhone} AND purpose = ${purpose} AND expires_at > NOW()
      ORDER BY id DESC
      LIMIT 1
    `;

    if (rows && rows[0]) {
      const record = rows[0];
      const storedBuffer = Buffer.from(record.code_hash, 'hex');
      const currentAttempts = (record.attempts || 0) + 1;
      const maxAttempts = record.max_attempts || MAX_ATTEMPTS;

      // مقایسه زمان‌ثابت ایمن در برابر حملات Timing Attack
      const isMatch =
        inputBuffer.length === storedBuffer.length &&
        crypto.timingSafeEqual(inputBuffer, storedBuffer);

      if (isMatch) {
        // الف) موفق: کد مصرف شد؛ بلافاصله حذف قطعی می‌شود (تک‌منظورگی قطعی)
        await sql`DELETE FROM public.security_otps WHERE mobile = ${cleanPhone} AND purpose = ${purpose}`.catch(() => {});
        return {
          success: true,
          metadata: typeof record.metadata === 'string' ? JSON.parse(record.metadata) : record.metadata,
        };
      }

      // ب) کد اشتباه: افزایش شمارنده خطا
      if (currentAttempts >= maxAttempts) {
        // ابطال کامل کد به دلیل نقض سقف تلاش
        await sql`DELETE FROM public.security_otps WHERE id = ${record.id}`.catch(() => {});
        return {
          success: false,
          error: 'تعداد دفعات تلاش اشتباه بیش از حد مجاز بود. کد باطل شد، لطفاً مجدداً درخواست دهید.',
        };
      }

      await sql`UPDATE public.security_otps SET attempts = ${currentAttempts} WHERE id = ${record.id}`.catch(() => {});
      const remaining = maxAttempts - currentAttempts;
      return {
        success: false,
        error: `کد وارد شده صحیح نمی‌باشد. (${remaining} تلاش باقی‌مانده)`,
      };
    }
  } catch (err) {
    console.warn('DB verifyOtp warning (falling back to memory):', err);
  }

  // ۲. بررسی در حافظه موقت فال‌بک
  const fallbackKey = `${cleanPhone}:${purpose}`;
  const entry = fallbackOtpStore.get(fallbackKey);

  if (entry && entry.expiresAt > now) {
    const storedBuffer = Buffer.from(entry.codeHash, 'hex');
    entry.attempts += 1;

    const isMatch =
      inputBuffer.length === storedBuffer.length &&
      crypto.timingSafeEqual(inputBuffer, storedBuffer);

    if (isMatch) {
      fallbackOtpStore.delete(fallbackKey);
      return { success: true, metadata: entry.metadata };
    }

    if (entry.attempts >= MAX_ATTEMPTS) {
      fallbackOtpStore.delete(fallbackKey);
      return {
        success: false,
        error: 'تعداد دفعات تلاش اشتباه بیش از حد مجاز بود. کد باطل شد، لطفاً مجدداً درخواست دهید.',
      };
    }

    const remaining = MAX_ATTEMPTS - entry.attempts;
    return {
      success: false,
      error: `کد وارد شده صحیح نمی‌باشد. (${remaining} تلاش باقی‌مانده)`,
    };
  }

  return {
    success: false,
    error: 'کد تأییدی برای این شماره یافت نشد یا منقضی شده است. لطفاً مجدداً درخواست کد دهید.',
  };
}

/**
 * پاکسازی دوره‌ای رکوردهای تاریخ‌گذشته از دیتابیس
 */
export async function cleanupExpiredOtps(): Promise<void> {
  try {
    await sql`DELETE FROM public.security_otps WHERE expires_at < NOW() - INTERVAL '30 minutes'`;
  } catch {}
}
