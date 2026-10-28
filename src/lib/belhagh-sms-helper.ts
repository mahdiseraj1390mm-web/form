export interface CounselorInfo {
  name: string;
  mobile: string;
  bookingFieldId: string;
}

export const COUNSELOR_MAP: Record<string, { name: string; mobile: string }> = {
  // مشاوران کودک
  f_booking_farahmandi: { name: 'جناب آقای یاسر فرهمندی', mobile: '09364280322' },
  f_booking_teymourian: { name: 'سرکار خانم تیموریان', mobile: '09140288938' },
  f_booking_zeynali_child: { name: 'سرکار خانم زینلی', mobile: '09379709635' },
  f_booking_shavandi_child: { name: 'سرکار خانم شوندی', mobile: '09127944985' },
  f_booking_ansari_child: { name: 'سرکار خانم انصاری', mobile: '09122301387' },

  // مشاوران نوجوان
  f_booking_borhani_teen: { name: 'جناب آقای برهانی', mobile: '09120449093' },
  f_booking_shavandi_teen: { name: 'سرکار خانم شوندی', mobile: '09127944985' },
  f_booking_rastgoo_teen: { name: 'سرکار خانم راستگو', mobile: '09123069447' },
  f_booking_ansari_teen: { name: 'سرکار خانم انصاری', mobile: '09122301387' },

  // مشاور تحصیلی
  f_booking_abdi_education: { name: 'جناب آقای عبدی', mobile: '09127853843' },

  // مشاوران بالینی
  f_booking_torshizi: { name: 'جناب آقای دکتر ترشیزی', mobile: '09155513734' },
  f_booking_yavari: { name: 'سرکار خانم یاوری', mobile: '09307556919' },
  f_booking_rastgoo_clinical: { name: 'سرکار خانم راستگو', mobile: '09123069447' },
  f_booking_golyayi_clinical: { name: 'سرکار خانم گلیایی', mobile: '09125140551' },

  // مشاوران ازدواج و خانواده
  f_booking_sedighi_family: { name: 'جناب آقای دکتر صدیقی', mobile: '09151538227' },
  f_booking_borhani_family: { name: 'جناب آقای برهانی', mobile: '09120449093' },
  f_booking_zeynali_family: { name: 'سرکار خانم زینلی', mobile: '09379709635' },
  f_booking_karimi_family: { name: 'سرکار خانم کریمی', mobile: '09192180481' },
  f_booking_abdi_family: { name: 'سرکار خانم عبدی', mobile: '09192886258' },
};

/**
 * تبدیل ارقام فارسی به انگلیسی جهت محاسبات
 */
function normalizePersianDigits(str: string): string {
  return str.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));
}

/**
 * تبدیل نام روز هفته به تاریخ دقیق شمسی (مثلاً: «پنجشنبه ۱۴۰۵/۰۸/۰۷»)
 */
export function formatJalaliDateFromDay(dayName: string): string {
  if (!dayName) return 'تاریخ تعیین‌شده';
  
  // اگر از قبل در رشته تاریخ عددی شمسی یا فرمت ۱۴۰... وجود دارد
  if (dayName.includes('۱۴۰') || dayName.includes('140') || dayName.includes('/')) {
    return dayName;
  }

  const cleanName = dayName.replace(/\u200c/g, '').replace(/[\s\-_]/g, '').trim();
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
    return `${dayName} ${shamsiDate}`;
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
  let matchedBookingField = '';
  let slotValue = '';

  for (const fieldId of Object.keys(COUNSELOR_MAP)) {
    if (formData[fieldId]) {
      matchedBookingField = fieldId;
      slotValue = String(formData[fieldId]);
      break;
    }
  }

  let counselorInfo = matchedBookingField
    ? { ...COUNSELOR_MAP[matchedBookingField] }
    : { name: 'مشاور مرکز روانشناسی بالحق', mobile: '' };

  // جستجوی تکمیلی بر اساس فیلدهای انتخابی مشاور در صورت خالی بودن
  if (!counselorInfo.mobile || counselorInfo.name === 'مشاور مرکز روانشناسی بالحق') {
    const counselorFields = [
      formData.f_counselor_child,
      formData.f_counselor_teen,
      formData.f_counselor_education,
      formData.f_counselor_clinical,
      formData.f_counselor_family,
    ].filter(Boolean);

    const nameToMobileMap: Record<string, { name: string; mobile: string }> = {
      'فرهمندی': { name: 'جناب آقای یاسر فرهمندی', mobile: '09364280322' },
      'تیموریان': { name: 'سرکار خانم تیموریان', mobile: '09140288938' },
      'شوندی': { name: 'سرکار خانم شوندی', mobile: '09127944985' },
      'انصاری': { name: 'سرکار خانم انصاری', mobile: '09122301387' },
      'زینلی': { name: 'سرکار خانم زینلی', mobile: '09379709635' },
      'برهانی': { name: 'جناب آقای برهانی', mobile: '09120449093' },
      'راستگو': { name: 'سرکار خانم راستگو', mobile: '09123069447' },
      'خانم عبدی': { name: 'سرکار خانم عبدی', mobile: '09192886258' },
      'آقای عبدی': { name: 'جناب آقای عبدی', mobile: '09127853843' },
      'ترشیزی': { name: 'جناب آقای دکتر ترشیزی', mobile: '09155513734' },
      'یاوری': { name: 'سرکار خانم یاوری', mobile: '09307556919' },
      'گلیایی': { name: 'سرکار خانم گلیایی', mobile: '09125140551' },
      'صدیقی': { name: 'جناب آقای دکتر صدیقی', mobile: '09151538227' },
      'کریمی': { name: 'سرکار خانم کریمی', mobile: '09192180481' },
    };

    for (const val of counselorFields) {
      const valStr = String(val);
      for (const [key, info] of Object.entries(nameToMobileMap)) {
        if (valStr.includes(key)) {
          counselorInfo = { ...info };
          break;
        }
      }
      if (counselorInfo.mobile) break;
    }
  }

  // تفکیک روز/تاریخ و ساعت از رشته نوبت (مثلاً: «پنجشنبه - ساعت ۰۹:۰۰ الی ۰۹:۳۰»)
  let rawDatePart = 'مشخص‌شده در سامانه';
  let rawTimePart = 'تعیین‌شده';

  if (slotValue) {
    if (slotValue.includes(' - ')) {
      const parts = slotValue.split(' - ');
      rawDatePart = parts[0].trim();
      rawTimePart = parts[1].replace('ساعت', '').trim();
    } else if (slotValue.includes('ساعت')) {
      const parts = slotValue.split('ساعت');
      rawDatePart = parts[0].trim() || 'روز تعیین‌شده';
      rawTimePart = parts[1].trim();
    } else {
      rawDatePart = slotValue;
    }
  }

  // تبدیل روز به تاریخ کامل شمسی
  const datePart = formatJalaliDateFromDay(rawDatePart);
  // مشخص کردن دقیق صبح یا شب
  const timePart = formatExactTime(rawTimePart);

  const clientName = `${formData.f_name || ''} ${formData.f_family || ''}`.trim() || formData.f_applicant_name || 'مُراجع محترم';
  const clientMobile = formData.f_mobile || formData.mobile || formData.f_phone || '';

  // استخراج استان و شهر مراجع
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
    counselorName: counselorInfo.name,
    counselorMobile: counselorInfo.mobile,
    slotValue,
    date: datePart,
    time: timePart,
    clientName,
    clientMobile,
    province,
    city,
  };
}
