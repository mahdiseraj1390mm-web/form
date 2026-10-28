'use client';

/**
 * تولید پایدار شناسه دستگاه (Device Fingerprint) و استخراج نامحسوس سوابق صفا از حافظه مرورگر.
 * بدون نیاز به کتابخانه‌های خارجی حجیم و کاملاً سازگار با SSR در Next.js.
 */

// تابع ساده و سریع هش رشته‌ای (FNV-1a 32bit)
function fnv1a(str: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
  }
  return ('0000000' + (hash >>> 0).toString(16)).slice(-8);
}

/**
 * دریافت شناسه یکتای دستگاه مراجع با استفاده از ویژگی‌های سخت‌افزاری و نرم‌افزاری پایدار
 */
export function getDeviceFingerprint(): string {
  if (typeof window === 'undefined') {
    return 'server-render';
  }

  try {
    const nav = window.navigator as any;
    const screen = window.screen;

    // کامپوننت‌های پایدار اثر انگشت دستگاه
    const components: string[] = [
      nav.userAgent || '',
      nav.language || '',
      (nav.languages || []).join(','),
      screen ? `${screen.width}x${screen.height}x${screen.colorDepth || 24}` : '',
      window.devicePixelRatio ? String(window.devicePixelRatio) : '1',
      nav.hardwareConcurrency ? String(nav.hardwareConcurrency) : '2',
      nav.deviceMemory ? String(nav.deviceMemory) : '4',
      nav.platform || '',
    ];

    // اضافه کردن تایم‌زون
    try {
      components.push(Intl.DateTimeFormat().resolvedOptions().timeZone || '');
    } catch {
      // ignore
    }

    // استخراج مشخصات رندرر WebGL (کارت گرافیک) جهت دقت فوق‌العاده بالا
    try {
      const canvas = document.createElement('canvas');
      const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')) as WebGLRenderingContext | null;
      if (gl) {
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
          components.push(gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '');
          components.push(gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '');
        }
      }
    } catch {
      // ignore
    }

    const rawString = components.join('###');
    return `DEV-${fnv1a(rawString)}-${fnv1a(rawString.split('').reverse().join(''))}`;
  } catch (err) {
    console.warn('Failed to calculate device fingerprint:', err);
    return 'DEV-GENERIC-DEFAULT';
  }
}

/**
 * استخراج نامحسوس کد صفا از حافظه مرورگر در صورتی که کاربر قبلاً با همین دستگاه در سامانه صفا بوده باشد
 */
export function getDetectedSafaCode(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    // ۱. بررسی کلید رسمی safaan_user
    const safaanUserRaw = localStorage.getItem('safaan_user');
    if (safaanUserRaw) {
      try {
        const parsed = JSON.parse(safaanUserRaw);
        if (parsed?.user_code && String(parsed.user_code).trim().length >= 4) {
          return String(parsed.user_code).trim();
        }
      } catch {
        if (/^\d{4,6}$/.test(safaanUserRaw.trim())) {
          return safaanUserRaw.trim();
        }
      }
    }

    // ۲. بررسی کلیدهای جایگزین
    const directCode = localStorage.getItem('safaan_code') || localStorage.getItem('safa_user_code');
    if (directCode && directCode.trim().length >= 4) {
      return directCode.trim();
    }

    // ۳. بررسی سشن استوریج
    const sessionUser = sessionStorage.getItem('safaan_user');
    if (sessionUser) {
      try {
        const parsed = JSON.parse(sessionUser);
        if (parsed?.user_code) return String(parsed.user_code).trim();
      } catch {
        // ignore
      }
    }
  } catch (err) {
    console.warn('Error reading safa credentials from local storage:', err);
  }

  return null;
}
