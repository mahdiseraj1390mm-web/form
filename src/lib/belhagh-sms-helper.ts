export interface CounselorInfo {
  name: string;
  mobile: string;
  bookingFieldId?: string;
}

export const COUNSELOR_MAP: Record<string, { name: string; mobile: string }> = {
  // مشاوران کودک
  f_booking_farahmandi: { name: 'جناب آقای یاسر فرهمندی', mobile: '09364280322' },
  f_booking_teymourian: { name: 'سرکار خانم تیموریان', mobile: '09140288938' },
  f_booking_zeynali_child: { name: 'سرکار خانم زینلی', mobile: '09379709635' },
  f_booking_zeynali_family: { name: 'سرکار خانم زینلی', mobile: '09379709635' },
  f_booking_shavandi_child: { name: 'سرکار خانم شوندی', mobile: '09127944985' },
  f_booking_shavandi_teen: { name: 'سرکار خانم شوندی', mobile: '09127944985' },
  f_booking_ansari_child: { name: 'سرکار خانم انصاری', mobile: '09122301387' },
  f_booking_ansari_teen: { name: 'سرکار خانم انصاری', mobile: '09122301387' },

  // مشاوران نوجوان
  f_booking_borhani_teen: { name: 'جناب آقای علیرضا برهانی', mobile: '09120449093' },
  f_booking_borhani_family: { name: 'جناب آقای علیرضا برهانی', mobile: '09120449093' },

  // مشاور تحصیلی
  f_booking_abdi_education: { name: 'جناب آقای عبدی', mobile: '09127853843' },

  // مشاوران بالینی
  f_booking_torshizi: { name: 'جناب آقای دکتر ترشیزی', mobile: '09155513734' },
  f_booking_yavari: { name: 'سرکار خانم یاوری', mobile: '09307556919' },
  f_booking_rastgoo_teen: { name: 'سرکار خانم راستگو', mobile: '09123069447' },
  f_booking_rastgoo_clinical: { name: 'سرکار خانم راستگو', mobile: '09123069447' },
  f_booking_golyayi_clinical: { name: 'سرکار خانم گلیایی', mobile: '09125140551' },

  // مشاوران ازدواج و خانواده
  f_booking_sedighi_family: { name: 'جناب آقای دکتر صدیقی', mobile: '09151538227' },
  f_booking_karimi_family: { name: 'سرکار خانم کریمی', mobile: '09192180481' },
  f_booking_abdi_family: { name: 'سرکار خانم عبدی', mobile: '09192886258' },

  // شناسه‌های اکانت کاربری مشاوران در سامانه (user-counselor-*)
  'user-counselor-sedighi': { name: 'جناب آقای دکتر صدیقی', mobile: '09151538227' },
  'user-counselor-torshizi': { name: 'جناب آقای دکتر ترشیزی', mobile: '09155513734' },
  'user-counselor-borhani': { name: 'جناب آقای علیرضا برهانی', mobile: '09120449093' },
  'user-counselor-abdi': { name: 'جناب آقای عبدی', mobile: '09127853843' },
  'user-counselor-farahmandi': { name: 'جناب آقای یاسر فرهمندی', mobile: '09364280322' },
  'user-counselor-karimi': { name: 'سرکار خانم کریمی', mobile: '09192180481' },
  'user-counselor-ansari': { name: 'سرکار خانم انصاری', mobile: '09122301387' },
  'user-counselor-teymourian': { name: 'سرکار خانم تیموریان', mobile: '09140288938' },
  'user-counselor-abdi-family': { name: 'سرکار خانم عبدی', mobile: '09192886258' },
  'user-counselor-golyayi': { name: 'سرکار خانم گلیایی', mobile: '09125140551' },
  'user-counselor-yavari': { name: 'سرکار خانم یاوری', mobile: '09307556919' },
  'user-counselor-rastgoo': { name: 'سرکار خانم راستگو', mobile: '09123069447' },
  'user-counselor-zeynali': { name: 'سرکار خانم زینلی', mobile: '09379709635' },
  'user-counselor-shavandi': { name: 'سرکار خانم شوندی', mobile: '09127944985' },
};

export const COUNSELOR_NAME_TO_MOBILE: Record<string, { name: string; mobile: string }> = {
  'فرهمندی': { name: 'جناب آقای یاسر فرهمندی', mobile: '09364280322' },
  'تیموریان': { name: 'سرکار خانم تیموریان', mobile: '09140288938' },
  'شوندی': { name: 'سرکار خانم شوندی', mobile: '09127944985' },
  'انصاری': { name: 'سرکار خانم انصاری', mobile: '09122301387' },
  'زینلی': { name: 'سرکار خانم زینلی', mobile: '09379709635' },
  'برهانی': { name: 'جناب آقای علیرضا برهانی', mobile: '09120449093' },
  'راستگو': { name: 'سرکار خانم راستگو', mobile: '09123069447' },
  'خانم عبدی': { name: 'سرکار خانم عبدی', mobile: '09192886258' },
  'آقای عبدی': { name: 'جناب آقای عبدی', mobile: '09127853843' },
  'ترشیزی': { name: 'جناب آقای دکتر ترشیزی', mobile: '09155513734' },
  'یاوری': { name: 'سرکار خانم یاوری', mobile: '09307556919' },
  'گلیایی': { name: 'سرکار خانم گلیایی', mobile: '09125140551' },
  'صدیقی': { name: 'جناب آقای دکتر صدیقی', mobile: '09151538227' },
  'کریمی': { name: 'سرکار خانم کریمی', mobile: '09192180481' },
};

/**
 * تبدیل ارقام فارسی به انگلیسی جهت محاسبات
 */
function normalizePersianDigits(str: string): string {
  return str.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
}

/**
 * تبدیل نام روز هفته به تاریخ دقیق شمسی (مثلاً: «پنجشنبه ۱۴۰۵/۰۸/۲۲»)
 */
export function formatJalaliDateFromDay(dayName: string): string {
  if (!dayName) return 'تاریخ تعیین‌شده';
  
  // اگر از قبل در رشته تاریخ عددی شمسی یا فرمت ۱۴۰... وجود دارد
  if (dayName.includes('۱۴۰') || dayName.includes('140') || dayName.includes('/')) {
    return dayName;
  }

  const cleanName = dayName
    .replace(/\([^)]*\)/g, '')
    .replace(/\u200c/g, '')
    .replace(/[\s\-_]/g, '')
    .trim();

  const dayMap: Record<string, number> = {
    'شنبه': 6,
    'یکشنبه': 0,
    'دوشنبه': 1,
    'سهشنبه': 2,
    'چهارشنبه': 3,
    'پنجشنبه': 4,
    'پنج‌شنبه': 4,
    'جمعه': 5
  };

  const targetDay = dayMap[cleanName];
  if (targetDay === undefined) {
    return dayName;
  }

  const now = new Date();
  const currentDay = now.getDay();
  let diff = (targetDay - currentDay + 7) % 7;

  const targetDate = new Date(now.getTime() + diff * 24 * 60 * 60 * 1000);
  
  try {
    const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const shamsiDate = formatter.format(targetDate);
    const displayDay = dayName.replace(/\([^)]*\)/g, '').trim();
    return `${displayDay} ${shamsiDate}`;
  } catch {
    return dayName;
  }
}

/**
 * قالب‌بندی زمان دقیق با مشخص کردن صریح صبح، عصر یا شب (مثلاً «۰۹:۰۰ الی ۰۹:۳۰ (صبح)» یا «۲۱:۰۰ (شب)»)
 */
export function formatExactTime(timeStr: string): string {
  if (!timeStr) return 'زمان مشخص‌شده';

  const cleanTime = timeStr.replace(/ساعت/g, '').trim();
  
  // اگر قبلاً قید صبح یا عصر یا شب در آن هست
  if (cleanTime.includes('صبح') || cleanTime.includes('عصر') || cleanTime.includes('شب') || cleanTime.includes('ظهر')) {
    return cleanTime;
  }

  const englishStr = normalizePersianDigits(cleanTime);
  const match = englishStr.match(/(\d{1,2})(?::(\d{2}))?/);

  let period = '';
  if (match) {
    const hour = parseInt(match[1], 10);
    if (hour >= 5 && hour < 12) {
      period = 'صبح';
    } else if (hour >= 12 && hour < 16) {
      period = 'ظهر';
    } else if (hour >= 16 && hour < 19) {
      period = 'عصر';
    } else if (hour >= 19 || hour < 5) {
      period = 'شب';
    }
  }

  if (period) {
    return `${cleanTime} ${period}`;
  }
  return cleanTime;
}

/**
 * استخراج مشخصات کامل نوبت، مشاور و مراجع از داده‌های فرم با تاریخ شمسی و زمان تفکیک‌شده صبح/شب
 */
export function extractBookingDetails(formData: Record<string, any>) {
  let counselorName = '';
  let counselorMobile = '';
  let slotValue = '';
  let parsedBookingCounselor = '';

  // ۱. استخراج سانس (slotValue):
  // اولویت ۱: فیلد متادیتای اختصاصی f_booking_slot
  if (formData.f_booking_slot && typeof formData.f_booking_slot === 'string' && formData.f_booking_slot.trim()) {
    slotValue = formData.f_booking_slot.trim();
  }

  // اولویت ۲: فیلد یکپارچه f_booking (مثلاً «موضوع: ... | مشاور: دکتر صدیقی | نوبت: دوشنبه - ساعت ۱۷:۰۰ الی ۱۸:۰۰»)
  if (formData.f_booking && typeof formData.f_booking === 'string') {
    const bookingStr = formData.f_booking.trim();
    if (bookingStr.includes('|')) {
      const parts = bookingStr.split('|').map((p) => p.trim());
      for (const part of parts) {
        if (part.includes('مشاور:')) {
          parsedBookingCounselor = part.replace(/.*مشاور:\s*/, '').trim();
        }
        if (!slotValue && part.includes('نوبت:')) {
          slotValue = part.replace(/.*نوبت:\s*/, '').trim();
        }
      }
    } else if (!slotValue) {
      slotValue = bookingStr;
    }
  }

  // اولویت ۳: کلیدهای حساب مشاور (user-counselor-*)
  if (!slotValue) {
    const userCounselorKey = Object.keys(formData).find(
      (k) => k.startsWith('user-counselor-') && formData[k] && typeof formData[k] === 'string'
    );
    if (userCounselorKey) {
      slotValue = String(formData[userCounselorKey]).trim();
    }
  }

  // اولویت ۴: فیلدهای قدیمی بر اساس کلیدهای COUNSELOR_MAP
  if (!slotValue) {
    for (const fieldId of Object.keys(COUNSELOR_MAP)) {
      if (formData[fieldId]) {
        slotValue = String(formData[fieldId]).trim();
        break;
      }
    }
  }

  // ۲. استخراج نام و شماره تماس مشاور:
  // الف) بررسی فیلدهای مستقیم ذخیره‌شده در متادیتای فرم
  if (formData.counselorName || formData.f_counselor || formData.counselor || parsedBookingCounselor) {
    counselorName = String(
      formData.counselorName || formData.f_counselor || formData.counselor || parsedBookingCounselor
    ).trim();
  }

  if (formData.counselorPhone || formData.counselorMobile || formData.f_counselor_mobile) {
    counselorMobile = String(
      formData.counselorPhone || formData.counselorMobile || formData.f_counselor_mobile
    ).trim();
  }

  // ب) بررسی بر اساس شناسه مشاور (counselorId یا counselorField یا کلید user-counselor-*)
  const counselorId =
    formData.counselorId ||
    formData.counselorField ||
    Object.keys(formData).find((k) => k.startsWith('user-counselor-') && formData[k]) ||
    '';

  if (counselorId && COUNSELOR_MAP[counselorId]) {
    if (!counselorMobile) counselorMobile = COUNSELOR_MAP[counselorId].mobile;
    if (!counselorName || counselorName === 'مشاور') counselorName = COUNSELOR_MAP[counselorId].name;
  }

  // ج) بررسی بر اساس فیلدهای قدیمی فرم (f_booking_*)
  for (const fieldId of Object.keys(COUNSELOR_MAP)) {
    if (formData[fieldId] && COUNSELOR_MAP[fieldId]) {
      if (!counselorMobile) counselorMobile = COUNSELOR_MAP[fieldId].mobile;
      if (!counselorName || counselorName === 'مشاور') counselorName = COUNSELOR_MAP[fieldId].name;
      break;
    }
  }

  // د) جستجوی تکمیلی بر اساس کلمات کلیدی نام مشاور در صورت خالی بودن شماره
  if (!counselorMobile && counselorName) {
    const normalizedName = counselorName
      .replace(/جناب\s*آقای/g, '')
      .replace(/سرکار\s*خانم/g, '')
      .replace(/دکتر/g, '')
      .replace(/آقای/g, '')
      .replace(/خانم/g, '')
      .trim();

    if (counselorName.includes('عبدی')) {
      if (counselorName.includes('خانم') || (formData.f_topic && String(formData.f_topic).includes('خانواده'))) {
        counselorMobile = COUNSELOR_NAME_TO_MOBILE['خانم عبدی'].mobile;
        if (!counselorName) counselorName = COUNSELOR_NAME_TO_MOBILE['خانم عبدی'].name;
      } else {
        counselorMobile = COUNSELOR_NAME_TO_MOBILE['آقای عبدی'].mobile;
        if (!counselorName) counselorName = COUNSELOR_NAME_TO_MOBILE['آقای عبدی'].name;
      }
    } else {
      for (const [key, info] of Object.entries(COUNSELOR_NAME_TO_MOBILE)) {
        if (counselorName.includes(key) || (normalizedName && normalizedName.includes(key))) {
          counselorMobile = info.mobile;
          if (!counselorName || counselorName.length < info.name.length) {
            counselorName = info.name;
          }
          break;
        }
      }
    }
  }

  // هـ) جستجو در فیلدهای قدیمی موضوعی (f_counselor_child و ...) در صورت خالی بودن
  if (!counselorMobile) {
    const legacyCounselorFields = [
      formData.f_counselor_child,
      formData.f_counselor_teen,
      formData.f_counselor_education,
      formData.f_counselor_clinical,
      formData.f_counselor_family,
    ].filter(Boolean);

    for (const val of legacyCounselorFields) {
      const valStr = String(val);
      for (const [key, info] of Object.entries(COUNSELOR_NAME_TO_MOBILE)) {
        if (valStr.includes(key)) {
          counselorMobile = info.mobile;
          if (!counselorName || counselorName === 'مشاور مرکز روانشناسی بالحق') {
            counselorName = info.name;
          }
          break;
        }
      }
      if (counselorMobile) break;
    }
  }

  // اگر پس از تمام بررسی‌ها هنوز نام تعیین نشده بود
  if (!counselorName) {
    counselorName = 'مشاور مرکز روانشناسی بالحق';
  }

  // ۳. تفکیک روز/تاریخ و ساعت از رشته نوبت (مثلاً: «پنجشنبه - ساعت ۰۹:۰۰ الی ۰۹:۳۰»)
  let rawDatePart = 'مشخص‌شده در سامانه';
  let rawTimePart = 'تعیین‌شده';

  if (slotValue) {
    if (slotValue.includes(' - ')) {
      const parts = slotValue.split(' - ');
      rawDatePart = parts[0].trim();
      rawTimePart = parts.slice(1).join(' - ').replace(/ساعت/g, '').trim();
    } else if (slotValue.includes('ساعت')) {
      const parts = slotValue.split('ساعت');
      rawDatePart = parts[0].trim() || 'روز تعیین‌شده';
      rawTimePart = parts.slice(1).join('ساعت').trim();
    } else {
      rawDatePart = slotValue;
    }
  }

  // تبدیل روز به تاریخ کامل شمسی
  const datePart = formatJalaliDateFromDay(rawDatePart);
  // مشخص کردن دقیق صبح یا شب
  const timePart = formatExactTime(rawTimePart);

  // ۴. استخراج نام و شماره همراه مراجع (با تضمین عدم تداخل با شماره مشاور)
  const clientName = (
    formData.fullName ||
    formData.f_fullname ||
    formData.name ||
    formData.f_client_name ||
    `${formData.f_name || ''} ${formData.f_family || ''}`.trim() ||
    formData.f_applicant_name ||
    'مراجع محترم'
  ).trim();

  const clientMobile = (
    formData.f_mobile ||
    formData.mobile ||
    formData.bk_mobile ||
    (formData.f_phone && formData.f_phone !== counselorMobile ? formData.f_phone : '') ||
    ''
  ).trim();

  // ۵. استخراج استان و شهر مراجع
  const rawProvinceCity = formData.f_province_city || formData.province_city || '';
  let province = '';
  let city = '';
  if (rawProvinceCity) {
    if (rawProvinceCity.includes(' - ')) {
      const parts = rawProvinceCity.split(' - ');
      province = parts[0]?.trim() || '';
      city = parts[1]?.trim() || '';
    } else {
      province = rawProvinceCity;
      city = rawProvinceCity;
    }
  }
  if (!province && formData.f_province_city_province) {
    province = formData.f_province_city_province;
  }
  if (!city && formData.f_province_city_city) {
    city = formData.f_province_city_city;
  }
  if (!province) province = 'مشخص‌نشده';
  if (!city) city = 'مشخص‌نشده';

  return {
    counselorName,
    counselorMobile,
    slotValue,
    date: datePart,
    time: timePart,
    clientName,
    clientMobile,
    province,
    city,
  };
}
