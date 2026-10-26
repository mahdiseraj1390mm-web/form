export interface CounselorInfo {
  name: string;
  mobile: string;
  bookingFieldId: string;
}

export const COUNSELOR_MAP: Record<string, { name: string; mobile: string }> = {
  f_booking_farahmandi: { name: 'جناب آقای یاسر فرهمندی', mobile: '09364280322' },
  f_booking_teymourian: { name: 'سرکار خانم تیموریان', mobile: '09140288938' },
  f_booking_shavandi_child: { name: 'سرکار خانم شوندی', mobile: '09127944985' },
  f_booking_ansari_child: { name: 'سرکار خانم انصاری', mobile: '09122301387' },
  f_booking_zeynali_child: { name: 'سرکار خانم زینلی', mobile: '09379709635' },
  f_booking_borhani_teen: { name: 'جناب آقای علیرضا برهانی', mobile: '09120449093' },
  f_booking_shavandi_teen: { name: 'سرکار خانم شوندی', mobile: '09127944985' },
  f_booking_rastgoo_teen: { name: 'سرکار خانم راستگو', mobile: '09123069447' },
  f_booking_ansari_teen: { name: 'سرکار خانم نوشین انصاری', mobile: '09122301387' },
  f_booking_abdi_education: { name: 'جناب آقای عبدی', mobile: '09127853843' },
  f_booking_torshizi: { name: 'جناب آقای ترشیزی', mobile: '09155513734' },
  f_booking_yavari: { name: 'سرکار خانم یاوری', mobile: '09307556919' },
  f_booking_rastgoo_clinical: { name: 'سرکار خانم راستگو', mobile: '09123069447' },
  f_booking_golyayi_clinical: { name: 'سرکار خانم گلیایی', mobile: '09125140551' },
  f_booking_sedighi_family: { name: 'جناب آقای صدیقی', mobile: '09151538227' },
  f_booking_borhani_family: { name: 'جناب آقای برهانی', mobile: '09120449093' },
  f_booking_zeynali_family: { name: 'سرکار خانم زینلی', mobile: '09379709635' },
  f_booking_karimi_family: { name: 'سرکار خانم کریمی', mobile: '09192180481' },
  f_booking_abdi_family: { name: 'سرکار خانم عبدی', mobile: '09192886258' },
};

/**
 * استخراج مشخصات کامل نوبت، مشاور و مراجع از داده‌های فرم
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

  const counselorInfo = matchedBookingField
    ? COUNSELOR_MAP[matchedBookingField]
    : { name: 'مشاور مرکز روانشناسی بالحق', mobile: '' };

  // تفکیک روز/تاریخ و ساعت از رشته نوبت (مثلاً: «پنجشنبه - ساعت ۱۰:۳۰ الی ۱۱:۰۰»)
  let datePart = 'مشخص‌شده در سامانه';
  let timePart = 'تعیین‌شده';

  if (slotValue) {
    if (slotValue.includes(' - ')) {
      const parts = slotValue.split(' - ');
      datePart = parts[0].trim();
      timePart = parts[1].replace('ساعت', '').trim();
    } else if (slotValue.includes('ساعت')) {
      const parts = slotValue.split('ساعت');
      datePart = parts[0].trim() || 'روز تعیین‌شده';
      timePart = parts[1].trim();
    } else {
      datePart = slotValue;
    }
  }

  const clientName = `${formData.f_name || ''} ${formData.f_family || ''}`.trim() || formData.f_applicant_name || 'مُراجع محترم';
  const clientMobile = formData.f_mobile || formData.mobile || formData.f_phone || '';

  return {
    counselorName: counselorInfo.name,
    counselorMobile: counselorInfo.mobile,
    slotValue,
    date: datePart,
    time: timePart,
    clientName,
    clientMobile,
  };
}
