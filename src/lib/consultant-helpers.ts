import { FormSubmission, AppointmentData, SelectOption } from '@/types/form';
import { TeamMember } from '@/types/advanced';
import { normalizeMobileNumber } from './team-constants';
import { toPersianDigits } from './persian';
import { COUNSELOR_MAP } from './belhagh-sms-helper';
export { COUNSELOR_MAP };

export interface PersianWeekDay {
  index: number;
  name: string;
  shortName: string;
}

export const PERSIAN_WEEK_DAYS: PersianWeekDay[] = [
  { index: 0, name: 'شنبه', shortName: 'ش' },
  { index: 1, name: 'یکشنبه', shortName: 'ی' },
  { index: 2, name: 'دوشنبه', shortName: 'د' },
  { index: 3, name: 'سه‌شنبه', shortName: 'س' },
  { index: 4, name: 'چهارشنبه', shortName: 'چ' },
  { index: 5, name: 'پنج‌شنبه', shortName: 'پ' },
  { index: 6, name: 'جمعه', shortName: 'ج' },
];

export interface DefinedSlot {
  dayIndex: number;
  dayName: string;
  timeRange: string;
  label: string;
  category?: string;
  fieldId: string;
}

export interface ConsultantProfile {
  id: string;
  name: string;
  genderPrefix?: 'آقا' | 'خانم';
  mobile: string;
  jobTitle: string;
  specialization: string;
  bookingFieldIds: string[];
  definedSlots: DefinedSlot[];
}

/**
 * تولید خودکار گزینه‌های نوبت‌دهی از ساختار AppointmentData
 */
export function generateSlotsFromAppointmentData(
  config: AppointmentData,
  customSlotPrefix: string = 'slot'
): SelectOption[] {
  const slotDuration = config.slotDurationMinutes || 30;
  const restDuration = config.restTimeMinutes ?? 5;
  const availableDays = config.availableDays || [0, 1, 2, 3, 4];
  const dayNames = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

  const newOptions: SelectOption[] = [];

  availableDays.forEach((dayIdx) => {
    const dayName = dayNames[dayIdx] || `روز ${dayIdx}`;
    const dayConfig = config.daySchedules?.[dayIdx];
    const periods = (dayConfig?.periods && dayConfig.periods.length > 0)
      ? dayConfig.periods
      : [{
          startHour: config.startHour || '09:00',
          endHour: config.endHour || '17:00',
        }];

    periods.forEach((period, pIdx) => {
      const [startH, startM] = (period.startHour || '09:00').split(':').map(Number);
      const [endH, endM] = (period.endHour || '17:00').split(':').map(Number);
      const startMin = (startH || 0) * 60 + (startM || 0);
      const endMin = (endH || 0) * 60 + (endM || 0);

      let currentMin = startMin;
      while (currentMin + slotDuration <= endMin) {
        const sH = Math.floor(currentMin / 60);
        const sM = currentMin % 60;
        const eH = Math.floor((currentMin + slotDuration) / 60);
        const eM = (currentMin + slotDuration) % 60;

        const formatTime = (h: number, m: number) =>
          `${h < 10 ? '0' + h : h}:${m < 10 ? '0' + m : m}`;

        const timeRange = `${toPersianDigits(formatTime(sH, sM))} الی ${toPersianDigits(formatTime(eH, eM))}`;
        const shiftPart = periods.length > 1 ? ` (نوبت ${toPersianDigits(pIdx + 1)})` : '';
        const label = `${dayName}${shiftPart} - ساعت ${timeRange}`;
        const optId = `${customSlotPrefix}_${dayIdx}_${pIdx}_${currentMin}`;

        newOptions.push({
          id: optId,
          label,
          value: optId,
        });

        currentMin += slotDuration + restDuration;
      }
    });
  });

  return newOptions;
}

/**
 * تبدیل AppointmentData به DefinedSlot[] جهت استفاده در تقویم مشاوران
 */
export function appointmentDataToDefinedSlots(
  config: AppointmentData,
  fieldId: string = 'custom_field'
): DefinedSlot[] {
  const dayNames = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
  const opts = generateSlotsFromAppointmentData(config, fieldId);
  return opts.map((opt) => {
    const parts = opt.id.split('_');
    const dayIndex = Number(parts[1]) || 0;
    const timeMatch = opt.label.match(/ساعت\s+(.+)$/);
    const timeRange = timeMatch ? timeMatch[1] : opt.label;
    return {
      dayIndex,
      dayName: dayNames[dayIndex] || 'شنبه',
      timeRange,
      label: opt.label,
      fieldId,
    };
  });
}

export interface ConsultantBookingItem {
  id: string;
  submissionId: string;
  caseCode: string;
  clientName: string;
  clientMobile: string;
  provinceCity: string;
  topic: string;
  consultantName: string;
  consultantMobile: string;
  slotValue: string;
  dayIndex: number;
  dayName: string;
  timeRange: string;
  submissionDate: string;
  createdAt?: string;
  status: string;
  rawSubmission: FormSubmission;
}

export interface ConsultantScheduleSlot {
  timeRange: string;
  label: string;
  category?: string;
  isOccupied: boolean;
  booking?: ConsultantBookingItem;
}

export interface ConsultantDaySchedule {
  dayIndex: number;
  dayName: string;
  shortName: string;
  isDayOff: boolean;
  totalSlotsCount: number;
  occupiedCount: number;
  freeCount: number;
  slots: ConsultantScheduleSlot[];
}

/**
 * فهرست جامع مشاوران مرکز مشاوره و روانشناسی بالحق به همراه زمان‌بندی دقیق
 */

export interface CounselingTopicOption {
  id: string;
  name: string;
  keywords: string[];
  description: string;
}

export const COUNSELING_TOPICS: CounselingTopicOption[] = [
  { id: 'child', name: 'مشاوره کودک', keywords: ['کودک'], description: 'پرونده‌ها و نوبت‌های تخصصی کودک' },
  { id: 'teen', name: 'مشاوره نوجوان', keywords: ['نوجوان'], description: 'پرونده‌ها و نوبت‌های تخصصی نوجوان' },
  { id: 'education', name: 'مشاوره تحصیلی', keywords: ['تحصیلی'], description: 'برنامه‌ریزی و هدایت تحصیلی' },
  { id: 'clinical', name: 'مشاوره بالینی و روان‌درمانی', keywords: ['بالینی', 'روان‌درمانی', 'فردی'], description: 'اضطراب، افسردگی و درمان‌های بالینی' },
  { id: 'family', name: 'مشاوره ازدواج و خانواده', keywords: ['خانواده', 'ازدواج', 'زوجین', 'زوج'], description: 'مشاوره پیش از ازدواج، زوج‌درمانی و خانواده' },
];

export const CONSULTANT_DEFAULT_TOPICS: Record<string, string[]> = {
  f_booking_farahmandi: ['child'],
  f_booking_teymourian: ['child'],
  f_booking_shavandi: ['child', 'teen'],
  f_booking_ansari: ['child', 'teen'],
  f_booking_zeynali: ['child', 'family'],
  f_booking_borhani: ['teen', 'family'],
  f_booking_rastgoo: ['teen', 'clinical'],
  f_booking_abdi_education: ['education'],
  f_booking_torshizi: ['clinical'],
  f_booking_yavari: ['clinical'],
  f_booking_golyayi: ['clinical'],
  f_booking_sedighi: ['family'],
  f_booking_karimi: ['family'],
  f_booking_abdi_family: ['family'],
  'user-reviewer': ['clinical'],
};

export const KNOWN_CONSULTANTS: ConsultantProfile[] = [
  {
    id: 'f_booking_farahmandi',
    name: 'یاسر فرهمندی',
    mobile: '09364280322',
    jobTitle: 'مشاور کودک',
    specialization: 'مشاوره و روانشناسی کودک',
    bookingFieldIds: ['f_booking_farahmandi'],
    definedSlots: [
      { dayIndex: 6, dayName: 'جمعه', timeRange: '۰۹:۰۰ الی ۰۹:۴۵', label: 'جمعه - ساعت ۰۹:۰۰ الی ۰۹:۴۵', category: 'کودک', fieldId: 'f_booking_farahmandi' },
      { dayIndex: 6, dayName: 'جمعه', timeRange: '۱۰:۰۰ الی ۱۰:۴۵', label: 'جمعه - ساعت ۱۰:۰۰ الی ۱۰:۴۵', category: 'کودک', fieldId: 'f_booking_farahmandi' },
      { dayIndex: 6, dayName: 'جمعه', timeRange: '۱۱:۰۰ الی ۱۱:۴۵', label: 'جمعه - ساعت ۱۱:۰۰ الی ۱۱:۴۵', category: 'کودک', fieldId: 'f_booking_farahmandi' },
    ],
  },
  {
    id: 'f_booking_teymourian',
    name: 'خانم تیموریان',
    mobile: '09140288938',
    jobTitle: 'مشاور کودک',
    specialization: 'مشاوره و روانشناسی کودک',
    bookingFieldIds: ['f_booking_teymourian'],
    definedSlots: [
      { dayIndex: 4, dayName: 'چهارشنبه', timeRange: '۱۰:۰۰ الی ۱۰:۴۵', label: 'چهارشنبه - ساعت ۱۰:۰۰ الی ۱۰:۴۵', category: 'کودک', fieldId: 'f_booking_teymourian' },
      { dayIndex: 4, dayName: 'چهارشنبه', timeRange: '۱۱:۰۰ الی ۱۱:۴۵', label: 'چهارشنبه - ساعت ۱۱:۰۰ الی ۱۱:۴۵', category: 'کودک', fieldId: 'f_booking_teymourian' },
      { dayIndex: 4, dayName: 'چهارشنبه', timeRange: '۱۲:۰۰ الی ۱۲:۴۵', label: 'چهارشنبه - ساعت ۱۲:۰۰ الی ۱۲:۴۵', category: 'کودک', fieldId: 'f_booking_teymourian' },
    ],
  },
  {
    id: 'f_booking_shavandi',
    name: 'خانم شوندی',
    mobile: '09127944985',
    jobTitle: 'مشاور کودک و نوجوان',
    specialization: 'مشاوره کودک و نوجوان',
    bookingFieldIds: ['f_booking_shavandi_child', 'f_booking_shavandi_teen'],
    definedSlots: [
      { dayIndex: 0, dayName: 'شنبه', timeRange: '۱۳:۰۰ الی ۱۳:۴۵', label: 'شنبه - ساعت ۱۳:۰۰ الی ۱۳:۴۵', category: 'کودک', fieldId: 'f_booking_shavandi_child' },
      { dayIndex: 0, dayName: 'شنبه', timeRange: '۱۴:۰۰ الی ۱۴:۴۵', label: 'شنبه - ساعت ۱۴:۰۰ الی ۱۴:۴۵', category: 'کودک', fieldId: 'f_booking_shavandi_child' },
      { dayIndex: 1, dayName: 'یکشنبه', timeRange: '۱۳:۰۰ الی ۱۳:۴۵', label: 'یکشنبه - ساعت ۱۳:۰۰ الی ۱۳:۴۵', category: 'نوجوان', fieldId: 'f_booking_shavandi_teen' },
      { dayIndex: 1, dayName: 'یکشنبه', timeRange: '۱۴:۰۰ الی ۱۴:۴۵', label: 'یکشنبه - ساعت ۱۴:۰۰ الی ۱۴:۴۵', category: 'نوجوان', fieldId: 'f_booking_shavandi_teen' },
      { dayIndex: 2, dayName: 'دوشنبه', timeRange: '۱۳:۰۰ الی ۱۳:۴۵', label: 'دوشنبه - ساعت ۱۳:۰۰ الی ۱۳:۴۵', category: 'کودک', fieldId: 'f_booking_shavandi_child' },
      { dayIndex: 2, dayName: 'دوشنبه', timeRange: '۱۴:۰۰ الی ۱۴:۴۵', label: 'دوشنبه - ساعت ۱۴:۰۰ الی ۱۴:۴۵', category: 'کودک', fieldId: 'f_booking_shavandi_child' },
      { dayIndex: 3, dayName: 'سه‌شنبه', timeRange: '۱۳:۰۰ الی ۱۳:۴۵', label: 'سه شنبه - ساعت ۱۳:۰۰ الی ۱۳:۴۵', category: 'نوجوان', fieldId: 'f_booking_shavandi_teen' },
      { dayIndex: 3, dayName: 'سه‌شنبه', timeRange: '۱۴:۰۰ الی ۱۴:۴۵', label: 'سه شنبه - ساعت ۱۴:۰۰ الی ۱۴:۴۵', category: 'نوجوان', fieldId: 'f_booking_shavandi_teen' },
      { dayIndex: 4, dayName: 'چهارشنبه', timeRange: '۱۳:۰۰ الی ۱۳:۴۵', label: 'چهارشنبه - ساعت ۱۳:۰۰ الی ۱۳:۴۵', category: 'کودک', fieldId: 'f_booking_shavandi_child' },
      { dayIndex: 4, dayName: 'چهارشنبه', timeRange: '۱۴:۰۰ الی ۱۴:۴۵', label: 'چهارشنبه - ساعت ۱۴:۰۰ الی ۱۴:۴۵', category: 'کودک', fieldId: 'f_booking_shavandi_child' },
    ],
  },
  {
    id: 'f_booking_ansari',
    name: 'خانم انصاری',
    mobile: '09122301387',
    jobTitle: 'مشاور کودک و نوجوان',
    specialization: 'مشاوره کودک و هدایت نوجوان',
    bookingFieldIds: ['f_booking_ansari_child', 'f_booking_ansari_teen'],
    definedSlots: [
      { dayIndex: 0, dayName: 'شنبه', timeRange: '۱۱:۰۰ الی ۱۱:۴۵', label: 'شنبه - نوبت اول: ساعت ۱۱:۰۰ الی ۱۱:۴۵', category: 'نوجوان', fieldId: 'f_booking_ansari_teen' },
      { dayIndex: 0, dayName: 'شنبه', timeRange: '۱۴:۰۰ الی ۱۴:۴۵', label: 'شنبه - نوبت دوم: ساعت ۱۴:۰۰ الی ۱۴:۴۵', category: 'نوجوان', fieldId: 'f_booking_ansari_teen' },
      { dayIndex: 0, dayName: 'شنبه', timeRange: '۱۵:۰۰ الی ۱۵:۴۵', label: 'شنبه - نوبت دوم: ساعت ۱۵:۰۰ الی ۱۵:۴۵', category: 'نوجوان', fieldId: 'f_booking_ansari_teen' },
      { dayIndex: 1, dayName: 'یکشنبه', timeRange: '۱۶:۰۰ الی ۱۶:۴۵', label: 'یکشنبه - ساعت ۱۶:۰۰ الی ۱۶:۴۵', category: 'کودک', fieldId: 'f_booking_ansari_child' },
      { dayIndex: 1, dayName: 'یکشنبه', timeRange: '۱۷:۰۰ الی ۱۷:۴۵', label: 'یکشنبه - ساعت ۱۷:۰۰ الی ۱۷:۴۵', category: 'کودک', fieldId: 'f_booking_ansari_child' },
      { dayIndex: 1, dayName: 'یکشنبه', timeRange: '۱۸:۰۰ الی ۱۸:۴۵', label: 'یکشنبه - ساعت ۱۸:۰۰ الی ۱۸:۴۵', category: 'کودک', fieldId: 'f_booking_ansari_child' },
      { dayIndex: 3, dayName: 'سه‌شنبه', timeRange: '۱۱:۰۰ الی ۱۱:۴۵', label: 'سه شنبه - نوبت اول: ساعت ۱۱:۰۰ الی ۱۱:۴۵', category: 'نوجوان', fieldId: 'f_booking_ansari_teen' },
      { dayIndex: 3, dayName: 'سه‌شنبه', timeRange: '۱۴:۰۰ الی ۱۴:۴۵', label: 'سه شنبه - نوبت دوم: ساعت ۱۴:۰۰ الی ۱۴:۴۵', category: 'نوجوان', fieldId: 'f_booking_ansari_teen' },
      { dayIndex: 3, dayName: 'سه‌شنبه', timeRange: '۱۵:۰۰ الی ۱۵:۴۵', label: 'سه شنبه - نوبت دوم: ساعت ۱۵:۰۰ الی ۱۵:۴۵', category: 'نوجوان', fieldId: 'f_booking_ansari_teen' },
    ],
  },
  {
    id: 'f_booking_zeynali',
    name: 'خانم زینلی',
    mobile: '09379709635',
    jobTitle: 'مشاور کودک و خانواده',
    specialization: 'مشاوره کودک و خانواده',
    bookingFieldIds: ['f_booking_zeynali_child', 'f_booking_zeynali_family'],
    definedSlots: [
      { dayIndex: 3, dayName: 'سه‌شنبه', timeRange: '۱۷:۰۰ الی ۱۷:۴۵', label: 'سه شنبه - ساعت ۱۷:۰۰ الی ۱۷:۴۵', category: 'خانواده', fieldId: 'f_booking_zeynali_family' },
      { dayIndex: 5, dayName: 'پنج‌شنبه', timeRange: '۰۹:۰۰ الی ۰۹:۴۵', label: 'پنجشنبه - ساعت ۰۹:۰۰ الی ۰۹:۴۵', category: 'کودک', fieldId: 'f_booking_zeynali_child' },
      { dayIndex: 5, dayName: 'پنج‌شنبه', timeRange: '۱۰:۰۰ الی ۱۰:۴۵', label: 'پنجشنبه - ساعت ۱۰:۰۰ الی ۱۰:۴۵', category: 'کودک', fieldId: 'f_booking_zeynali_child' },
    ],
  },
  {
    id: 'f_booking_borhani',
    name: 'علیرضا برهانی',
    mobile: '09120449093',
    jobTitle: 'مشاور نوجوان و خانواده',
    specialization: 'مشاوره نوجوان، ازدواج و خانواده',
    bookingFieldIds: ['f_booking_borhani_teen', 'f_booking_borhani_family'],
    definedSlots: [
      { dayIndex: 0, dayName: 'شنبه', timeRange: '۱۴:۰۰ الی ۱۴:۴۵', label: 'شنبه - ساعت ۱۴:۰۰ الی ۱۴:۴۵', category: 'نوجوان', fieldId: 'f_booking_borhani_teen' },
      { dayIndex: 0, dayName: 'شنبه', timeRange: '۱۸:۰۰ الی ۱۸:۴۵', label: 'شنبه - ساعت ۱۸:۰۰ الی ۱۸:۴۵', category: 'خانواده', fieldId: 'f_booking_borhani_family' },
      { dayIndex: 0, dayName: 'شنبه', timeRange: '۱۹:۰۰ الی ۱۹:۴۵', label: 'شنبه - ساعت ۱۹:۰۰ الی ۱۹:۴۵', category: 'خانواده', fieldId: 'f_booking_borhani_family' },
      { dayIndex: 1, dayName: 'یکشنبه', timeRange: '۱۴:۰۰ الی ۱۴:۴۵', label: 'یکشنبه - ساعت ۱۴:۰۰ الی ۱۴:۴۵', category: 'نوجوان', fieldId: 'f_booking_borhani_teen' },
      { dayIndex: 1, dayName: 'یکشنبه', timeRange: '۱۸:۰۰ الی ۱۸:۴۵', label: 'یکشنبه - ساعت ۱۸:۰۰ الی ۱۸:۴۵', category: 'خانواده', fieldId: 'f_booking_borhani_family' },
      { dayIndex: 1, dayName: 'یکشنبه', timeRange: '۱۹:۰۰ الی ۱۹:۴۵', label: 'یکشنبه - ساعت ۱۹:۰۰ الی ۱۹:۴۵', category: 'خانواده', fieldId: 'f_booking_borhani_family' },
      { dayIndex: 2, dayName: 'دوشنبه', timeRange: '۱۴:۰۰ الی ۱۴:۴۵', label: 'دوشنبه - ساعت ۱۴:۰۰ الی ۱۴:۴۵', category: 'نوجوان', fieldId: 'f_booking_borhani_teen' },
      { dayIndex: 2, dayName: 'دوشنبه', timeRange: '۱۸:۰۰ الی ۱۸:۴۵', label: 'دوشنبه - ساعت ۱۸:۰۰ الی ۱۸:۴۵', category: 'خانواده', fieldId: 'f_booking_borhani_family' },
      { dayIndex: 2, dayName: 'دوشنبه', timeRange: '۱۹:۰۰ الی ۱۹:۴۵', label: 'دوشنبه - ساعت ۱۹:۰۰ الی ۱۹:۴۵', category: 'خانواده', fieldId: 'f_booking_borhani_family' },
    ],
  },
  {
    id: 'f_booking_rastgoo',
    name: 'خانم راستگو',
    mobile: '09123069447',
    jobTitle: 'مشاور نوجوان و بالینی',
    specialization: 'مشاوره نوجوان و بالینی',
    bookingFieldIds: ['f_booking_rastgoo_teen', 'f_booking_rastgoo_clinical'],
    definedSlots: [
      { dayIndex: 1, dayName: 'یکشنبه', timeRange: '۱۰:۰۰ الی ۱۰:۴۵', label: 'یکشنبه - ساعت ۱۰:۰۰ الی ۱۰:۴۵', category: 'نوجوان', fieldId: 'f_booking_rastgoo_teen' },
      { dayIndex: 1, dayName: 'یکشنبه', timeRange: '۱۱:۰۰ الی ۱۱:۴۵', label: 'یکشنبه - ساعت ۱۱:۰۰ الی ۱۱:۴۵', category: 'نوجوان', fieldId: 'f_booking_rastgoo_teen' },
      { dayIndex: 1, dayName: 'یکشنبه', timeRange: '۱۲:۰۰ الی ۱۲:۴۵', label: 'یکشنبه - ساعت ۱۲:۰۰ الی ۱۲:۴۵', category: 'نوجوان', fieldId: 'f_booking_rastgoo_teen' },
      { dayIndex: 1, dayName: 'یکشنبه', timeRange: '۱۳:۰۰ الی ۱۳:۴۵', label: 'یکشنبه - ساعت ۱۳:۰۰ الی ۱۳:۴۵', category: 'نوجوان', fieldId: 'f_booking_rastgoo_teen' },
      { dayIndex: 1, dayName: 'یکشنبه', timeRange: '۱۸:۰۰ الی ۱۸:۴۵', label: 'یکشنبه - ساعت ۱۸:۰۰ الی ۱۸:۴۵', category: 'بالینی', fieldId: 'f_booking_rastgoo_clinical' },
      { dayIndex: 1, dayName: 'یکشنبه', timeRange: '۱۹:۰۰ الی ۱۹:۴۵', label: 'یکشنبه - ساعت ۱۹:۰۰ الی ۱۹:۴۵', category: 'بالینی', fieldId: 'f_booking_rastgoo_clinical' },
    ],
  },
  {
    id: 'f_booking_abdi_education',
    name: 'آقای عبدی',
    mobile: '09127853843',
    jobTitle: 'مشاور تحصیلی',
    specialization: 'برنامه‌ریزی و مشاوره تحصیلی',
    bookingFieldIds: ['f_booking_abdi_education'],
    definedSlots: [
      { dayIndex: 3, dayName: 'سه‌شنبه', timeRange: '۱۶:۰۰ الی ۱۶:۴۵', label: 'سه شنبه - ساعت ۱۶:۰۰ الی ۱۶:۴۵', category: 'تحصیلی', fieldId: 'f_booking_abdi_education' },
      { dayIndex: 3, dayName: 'سه‌شنبه', timeRange: '۱۷:۰۰ الی ۱۷:۴۵', label: 'سه شنبه - ساعت ۱۷:۰۰ الی ۱۷:۴۵', category: 'تحصیلی', fieldId: 'f_booking_abdi_education' },
      { dayIndex: 4, dayName: 'چهارشنبه', timeRange: '۱۶:۰۰ الی ۱۶:۴۵', label: 'چهارشنبه - ساعت ۱۶:۰۰ الی ۱۶:۴۵', category: 'تحصیلی', fieldId: 'f_booking_abdi_education' },
      { dayIndex: 4, dayName: 'چهارشنبه', timeRange: '۱۷:۰۰ الی ۱۷:۴۵', label: 'چهارشنبه - ساعت ۱۷:۰۰ الی ۱۷:۴۵', category: 'تحصیلی', fieldId: 'f_booking_abdi_education' },
    ],
  },
  {
    id: 'f_booking_torshizi',
    name: 'دکتر جعفر ترشیزی',
    mobile: '09155513734',
    jobTitle: 'مشاور و روانشناس بالینی',
    specialization: 'مشاوره بالینی و روان‌درمانی',
    bookingFieldIds: ['f_booking_torshizi'],
    definedSlots: [
      { dayIndex: 4, dayName: 'پنج‌شنبه', timeRange: '۱۰:۳۰ الی ۱۱:۱۵', label: 'پنج‌شنبه - ساعت ۱۰:۳۰ الی ۱۱:۱۵', category: 'بالینی', fieldId: 'f_booking_torshizi' },
    ],
  },
  {
    id: 'f_booking_yavari',
    name: 'خانم یاوری',
    mobile: '09307556919',
    jobTitle: 'مشاور بالینی',
    specialization: 'مشاوره بالینی، اضطراب و افسردگی',
    bookingFieldIds: ['f_booking_yavari'],
    definedSlots: [
      { dayIndex: 0, dayName: 'شنبه', timeRange: '۱۱:۰۰ الی ۱۱:۴۵', label: 'شنبه - ساعت ۱۱:۰۰ الی ۱۱:۴۵', category: 'بالینی', fieldId: 'f_booking_yavari' },
      { dayIndex: 3, dayName: 'سه‌شنبه', timeRange: '۱۳:۰۰ الی ۱۳:۴۵', label: 'سه شنبه - ساعت ۱۳:۰۰ الی ۱۳:۴۵', category: 'بالینی', fieldId: 'f_booking_yavari' },
    ],
  },
  {
    id: 'f_booking_golyayi',
    name: 'خانم گلیایی',
    mobile: '09125140551',
    jobTitle: 'مشاور بالینی',
    specialization: 'مشاوره فردی و بالینی',
    bookingFieldIds: ['f_booking_golyayi_clinical'],
    definedSlots: [
      { dayIndex: 2, dayName: 'دوشنبه', timeRange: '۱۱:۰۰ الی ۱۱:۴۵', label: 'دوشنبه - ساعت ۱۱:۰۰ الی ۱۱:۴۵', category: 'بالینی', fieldId: 'f_booking_golyayi_clinical' },
      { dayIndex: 2, dayName: 'دوشنبه', timeRange: '۱۶:۰۰ الی ۱۶:۴۵', label: 'دوشنبه - ساعت ۱۶:۰۰ الی ۱۶:۴۵', category: 'بالینی', fieldId: 'f_booking_golyayi_clinical' },
    ],
  },
  {
    id: 'f_booking_sedighi',
    name: 'دکتر صدیقی',
    mobile: '09151538227',
    jobTitle: 'مشاور ازدواج و خانواده',
    specialization: 'مشاوره ازدواج، زوج‌درمانی و خانواده',
    bookingFieldIds: ['f_booking_sedighi_family'],
    definedSlots: [
      { dayIndex: 0, dayName: 'شنبه', timeRange: '۱۷:۰۰ الی ۱۷:۴۵', label: 'شنبه - ساعت ۱۷:۰۰ الی ۱۷:۴۵', category: 'خانواده', fieldId: 'f_booking_sedighi_family' },
    ],
  },
  {
    id: 'f_booking_karimi',
    name: 'خانم کریمی',
    mobile: '09192180481',
    jobTitle: 'مشاور خانواده',
    specialization: 'مشاوره خانواده و زوجین',
    bookingFieldIds: ['f_booking_karimi_family'],
    definedSlots: [
      { dayIndex: 1, dayName: 'یکشنبه', timeRange: '۱۰:۰۰ الی ۱۰:۴۵', label: 'یکشنبه - ساعت ۱۰:۰۰ الی ۱۰:۴۵', category: 'خانواده', fieldId: 'f_booking_karimi_family' },
      { dayIndex: 1, dayName: 'یکشنبه', timeRange: '۱۱:۰۰ الی ۱۱:۴۵', label: 'یکشنبه - ساعت ۱۱:۰۰ الی ۱۱:۴۵', category: 'خانواده', fieldId: 'f_booking_karimi_family' },
      { dayIndex: 3, dayName: 'سه‌شنبه', timeRange: '۱۰:۰۰ الی ۱۰:۴۵', label: 'سه شنبه - ساعت ۱۰:۰۰ الی ۱۰:۴۵', category: 'خانواده', fieldId: 'f_booking_karimi_family' },
      { dayIndex: 3, dayName: 'سه‌شنبه', timeRange: '۱۱:۰۰ الی ۱۱:۴۵', label: 'سه شنبه - ساعت ۱۱:۰۰ الی ۱۱:۴۵', category: 'خانواده', fieldId: 'f_booking_karimi_family' },
    ],
  },
  {
    id: 'f_booking_abdi_family',
    name: 'خانم عبدی',
    mobile: '09192886258',
    jobTitle: 'مشاور خانواده',
    specialization: 'مشاوره خانواده و مهارت‌های ارتباطی',
    bookingFieldIds: ['f_booking_abdi_family'],
    definedSlots: [
      { dayIndex: 4, dayName: 'چهارشنبه', timeRange: '۰۸:۰۰ الی ۰۸:۴۵', label: 'چهارشنبه - ساعت ۰۸:۰۰ الی ۰۸:۴۵', category: 'خانواده', fieldId: 'f_booking_abdi_family' },
      { dayIndex: 4, dayName: 'چهارشنبه', timeRange: '۰۹:۰۰ الی ۰۹:۴۵', label: 'چهارشنبه - ساعت ۰۹:۰۰ الی ۰۹:۴۵', category: 'خانواده', fieldId: 'f_booking_abdi_family' },
      { dayIndex: 4, dayName: 'چهارشنبه', timeRange: '۱۰:۰۰ الی ۱۰:۴۵', label: 'چهارشنبه - ساعت ۱۰:۰۰ الی ۱۰:۴۵', category: 'خانواده', fieldId: 'f_booking_abdi_family' },
      { dayIndex: 4, dayName: 'چهارشنبه', timeRange: '۱۱:۰۰ الی ۱۱:۴۵', label: 'چهارشنبه - ساعت ۱۱:۰۰ الی ۱۱:۴۵', category: 'خانواده', fieldId: 'f_booking_abdi_family' },
      { dayIndex: 4, dayName: 'چهارشنبه', timeRange: '۱۲:۰۰ الی ۱۲:۴۵', label: 'چهارشنبه - ساعت ۱۲:۰۰ الی ۱۲:۴۵', category: 'خانواده', fieldId: 'f_booking_abdi_family' },
    ],
  },
  {
    id: 'user-reviewer',
    name: 'سارا سعادت',
    mobile: '09193334455',
    jobTitle: 'کارشناس بررسی و مشاور فردی',
    specialization: 'مشاوره فردی، بررسی پرونده‌ها و خودشناسی',
    bookingFieldIds: ['f_counselor_saadat'],
    definedSlots: [
      { dayIndex: 4, dayName: 'چهارشنبه', timeRange: '۱۱:۰۰ الی ۱۱:۴۵', label: 'چهارشنبه - ساعت ۱۱:۰۰ الی ۱۱:۴۵', category: 'فردی', fieldId: 'f_counselor_saadat' },
      { dayIndex: 4, dayName: 'چهارشنبه', timeRange: '۱۲:۰۰ الی ۱۲:۴۵', label: 'چهارشنبه - ساعت ۱۲:۰۰ الی ۱۲:۴۵', category: 'فردی', fieldId: 'f_counselor_saadat' },
    ],
  },
];

/**
 * استخراج روز هفته بر اساس رشته متنی نوبت یا شناسه اسلات
 */
export function detectDayIndex(slotStr: string): number {
  if (!slotStr) return 0;
  const clean = slotStr.replace(/\u200c/g, '').replace(/[\s\-_]/g, '');

  if (clean.includes('جمعه') || clean.includes('fri')) return 6;
  if (clean.includes('پنجشنبه') || clean.includes('پنج‌شنبه') || clean.includes('thu')) return 5;
  if (clean.includes('چهارشنبه') || clean.includes('wed')) return 4;
  if (clean.includes('سهشنبه') || clean.includes('سه‌شنبه') || clean.includes('tue')) return 3;
  if (clean.includes('دوشنبه') || clean.includes('mon')) return 2;
  if (clean.includes('یکشنبه') || clean.includes('sun')) return 1;
  if (clean.includes('شنبه') || clean.includes('sat')) return 0;

  return 0;
}

/**
 * استخراج بازه ساعتی از رشته متنی نوبت (مثلاً «۱۴:۰۰ الی ۱۴:۴۵»)
 */
export function extractTimeRange(slotStr: string): string {
  if (!slotStr) return 'تعیین‌شده';
  
  if (slotStr.includes(' - ')) {
    const parts = slotStr.split(' - ');
    return parts[1].replace('ساعت', '').trim();
  }
  if (slotStr.includes('ساعت')) {
    const parts = slotStr.split('ساعت');
    return parts[1].trim();
  }
  return slotStr;
}

/**
 * بررسی یکسانی دو بازه زمانی نوبت
 */
export function matchTimeRanges(t1: string, t2: string): boolean {
  if (!t1 || !t2) return false;
  const c1 = t1.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, '');
  const c2 = t2.replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, '');
  return c1 === c2 || (c1.length >= 4 && c2.length >= 4 && (c1.includes(c2) || c2.includes(c1)));
}

/**
 * تطبیق نام مشاور با پاکسازی پیشوندها
 */
export function cleanConsultantName(name: string): string {
  if (!name) return '';
  return name
    .replace(/^(جناب\s+)?(آقای|خانم|دکتر|استاد|سرکار\s+خانم)\s+/, '')
    .replace(/\s*\(.*?\)/g, '')
    .replace(/^(مشاور|روانشناس)\s+/, '')
    .trim();
}

/**
 * استخراج مشخصات نوبت رزرو شده از فرم مراجع
 */
export function extractBookingItemFromSubmission(sub: FormSubmission): ConsultantBookingItem | null {
  if (!sub || !sub.data) return null;
  const d = sub.data;

  // ۱. بررسی فیلدهای رزرو booking
  let matchedFieldId = '';
  let slotValue = '';
  let consultantName = '';
  let consultantMobile = '';

  for (const [fieldId, info] of Object.entries(COUNSELOR_MAP)) {
    if (d[fieldId]) {
      matchedFieldId = fieldId;
      slotValue = String(d[fieldId]);
      consultantName = info.name;
      consultantMobile = info.mobile;
      break;
    }
  }

  // ۲. در صورت عدم یافتن در COUNSELOR_MAP، بررسی فیلدهای متنی و عمومی
  if (!matchedFieldId) {
    if (d.f_counselor) {
      consultantName = String(d.f_counselor);
    } else if (d.f_booking_counselor) {
      consultantName = String(d.f_booking_counselor);
    } else if (d.counselorName) {
      consultantName = String(d.counselorName);
    } else if (d.counselor) {
      consultantName = String(d.counselor);
    } else if (d.f_prev_counselor_name) {
      consultantName = String(d.f_prev_counselor_name);
    } else {
      const topicFields = [d.f_counselor_child, d.f_counselor_teen, d.f_counselor_education, d.f_counselor_clinical, d.f_counselor_family].filter(Boolean);
      if (topicFields.length > 0) {
        consultantName = String(topicFields[0]);
      }
    }

    if (d.f_booking_datetime) {
      slotValue = String(d.f_booking_datetime);
    } else if (d.f_booking_date) {
      slotValue = `${d.f_booking_date} ${d.f_booking_time || ''}`.trim();
    } else if (d.f_booking_slot) {
      slotValue = String(d.f_booking_slot);
    }
  }

  // اگر هیچ مشاوری و هیچ فیلد نوبتی ثبت نشده باشد، به هیچ وجه نوبت محسوب نمی‌شود
  if (!consultantName && !matchedFieldId && !slotValue) {
    return null;
  }

  // اگر حتی فرم نوبت‌دهی باشد اما کاربر مشاور انتخاب نکرده باشد، نباید نوبت به نام مشاور فیک ثبت شود
  if (!consultantName) {
    return null;
  }

  if (!slotValue) {
    slotValue = 'زمان هماهنگ‌نشده';
  }

  const cleanName = cleanConsultantName(consultantName);
  const dayIdx = detectDayIndex(slotValue);
  const dayName = PERSIAN_WEEK_DAYS[dayIdx]?.name || 'شنبه';
  const timeRange = extractTimeRange(slotValue);

  const clientName = `${d.f_name || ''} ${d.f_family || ''}`.trim() || d.fullName || d.f_applicant_name || 'مراجع محترم';
  const caseCode = d.caseCode || sub.trackingCode || 'ثبت‌نشده';
  const clientMobile = d.f_mobile || d.mobile || d.f_phone || sub.mobile || '';
  const provinceCity = d.f_province_city || d.province_city || '';
  const topic = d.f_topic || d.f_counseling_subject || 'مشاوره تخصصی';

  return {
    id: sub.id,
    submissionId: sub.id,
    caseCode,
    clientName,
    clientMobile,
    provinceCity,
    topic,
    consultantName: consultantName || cleanName,
    consultantMobile,
    slotValue,
    dayIndex: dayIdx,
    dayName,
    timeRange,
    submissionDate: sub.createdAt || '',
    createdAt: sub.createdAt || '',
    status: sub.status || 'approved',
    rawSubmission: sub,
  };
}

/**
 * انطباق یک عضو تیم با پروفایل مشاور در سامانه
 */
export function matchMemberToConsultant(
  member: TeamMember,
  customProfiles: ConsultantProfile[] = []
): ConsultantProfile {
  const allProfiles = [...KNOWN_CONSULTANTS, ...customProfiles];

  // ۱. انطباق با consultantId صریح یا شناسه‌های منتسب شده
  const cIds = [
    member.consultantId,
    ...(member.assignedConsultantIds || []),
  ].filter(Boolean) as string[];

  for (const cId of cIds) {
    const found = allProfiles.find(
      (p) => p.id === cId || p.bookingFieldIds.includes(cId)
    );
    if (found) return found;
  }

  // ۲. انطباق با شماره تلفن همراه
  const memberPhone = normalizeMobileNumber(member.mobile || member.username || '');
  if (memberPhone && memberPhone.length >= 10) {
    const found = allProfiles.find((p) => {
      const pPhone = normalizeMobileNumber(p.mobile);
      return pPhone && pPhone === memberPhone;
    });
    if (found) return found;
  }

  // ۳. انطباق با نام خانوادگی یا نام مشاور (بدون واژه‌های عمومی)
  const cleanMemName = cleanConsultantName(member.name);
  const GENERIC_WORDS = ['مشاور', 'مشاوره', 'مرکز', 'بالحق', 'دکتر', 'روانشناس', 'استاد', 'همکار', 'تخصصی', 'عمومی', 'کارشناس'];
  const isGeneric = (str: string) => !str || str.length < 3 || GENERIC_WORDS.includes(str.trim());

  if (!isGeneric(cleanMemName)) {
    const found = allProfiles.find((p) => {
      const cleanPName = cleanConsultantName(p.name);
      if (isGeneric(cleanPName)) return false;
      return cleanMemName === cleanPName || cleanMemName.includes(cleanPName) || cleanPName.includes(cleanMemName);
    });
    if (found) return found;
  }

  // ۴. در غیر این صورت ساخت پروفایل با ساعات کاری تعریف‌شده مشاور
  const customSlots = member.workingHours
    ? appointmentDataToDefinedSlots(member.workingHours, member.consultantId || member.id)
    : [];

  return {
    id: member.id || 'custom-user',
    name: member.name || 'مشاور',
    genderPrefix: member.genderPrefix,
    mobile: member.mobile || member.username || '',
    jobTitle: member.jobTitle || 'مشاور',
    specialization: member.jobTitle || 'مشاوره تخصصی',
    bookingFieldIds: member.consultantId ? [member.consultantId] : (member.id ? [member.id] : []),
    definedSlots: customSlots,
  };
}

/**
 * واکشی تمام نوبت‌های رزرو شده مربوط به یک مشاور خاص
 */
/**
 * بررسی قطعی و دقیق اینکه آیا نوبت به یک مشاور خاص یا حوزه‌های مجاز وی تعلق دارد یا خیر.
 * این متد از نشت نوبت‌های سایر مشاوران اکیداً جلوگیری می‌کند.
 */
export function isBookingAssignedToConsultant(
  booking: ConsultantBookingItem,
  consultant: ConsultantProfile,
  allowedTopics?: string[]
): boolean {
  if (!booking || !consultant) return false;

  const rawData = booking.rawSubmission?.data || {};

  // ۱. تطبیق مستقیم بر اساس شناسه‌های فیلد رزرو فرم (مطمئن‌ترین روش)
  if (consultant.bookingFieldIds && consultant.bookingFieldIds.length > 0) {
    const fieldMatch = consultant.bookingFieldIds.some((fId) => Boolean(rawData[fId]));
    if (fieldMatch) return true;
  }

  // ۲. تطبیق بر اساس شماره تلفن همراه مشاور (حداقل ۱۰ رقم)
  const cPhone = normalizeMobileNumber(consultant.mobile);
  const bPhone = normalizeMobileNumber(booking.consultantMobile);
  if (cPhone && bPhone && cPhone.length >= 10 && bPhone.length >= 10 && cPhone === bPhone) {
    return true;
  }

  // ۳. تطبیق بر اساس نام اختصاصی مشاور (بدون واژه‌های عمومی)
  const cleanC = cleanConsultantName(consultant.name);
  const cleanB = cleanConsultantName(booking.consultantName);

  const GENERIC_STOPWORDS = ['مشاور', 'مشاوره', 'مرکز', 'بالحق', 'دکتر', 'روانشناس', 'استاد', 'همکار', 'تخصصی', 'عمومی', 'کارشناس'];
  const isGeneric = (str: string) => !str || str.length < 3 || GENERIC_STOPWORDS.includes(str.trim());

  if (!isGeneric(cleanC) && !isGeneric(cleanB)) {
    // اگر نام‌ها برابر باشند یا نام خانوادگی اختصاصی یکسان باشد
    if (cleanC === cleanB || cleanB.includes(cleanC) || cleanC.includes(cleanB)) {
      return true;
    }
  }

  // ۴. تطبیق بر اساس موضوعات مجاز مشاوره (allowedTopics) برای مشاورانی با چند نقش
  if (allowedTopics && allowedTopics.length > 0) {
    const topicText = (booking.topic || '').toLowerCase();
    const isTopicAllowed = allowedTopics.some((tId) => {
      const topicObj = COUNSELING_TOPICS.find((ct) => ct.id === tId);
      if (!topicObj) return false;
      return topicObj.keywords.some((kw) => topicText.includes(kw));
    });

    if (isTopicAllowed) {
      // بررسی عدم تعلق صریح به مشاور دیگر
      const belongsToOther = KNOWN_CONSULTANTS.some((otherC) => {
        if (otherC.id === consultant.id) return false;
        if (otherC.bookingFieldIds.some((fId) => Boolean(rawData[fId]))) return true;
        const otherPhone = normalizeMobileNumber(otherC.mobile);
        if (otherPhone && bPhone && otherPhone.length >= 10 && otherPhone === bPhone) return true;
        const otherClean = cleanConsultantName(otherC.name);
        if (!isGeneric(otherClean) && !isGeneric(cleanB) && (cleanB.includes(otherClean) || otherClean.includes(cleanB))) {
          return true;
        }
        return false;
      });

      if (!belongsToOther) {
        return true;
      }
    }
  }

  return false;
}

export function getBookingsForConsultant(
  consultant: ConsultantProfile,
  submissions: FormSubmission[],
  allowedTopics?: string[]
): ConsultantBookingItem[] {
  const allBookings = getAllBookingItems(submissions);
  return allBookings.filter((b) => isBookingAssignedToConsultant(b, consultant, allowedTopics));
}

/**
 * ساخت تایم‌لاین کامل ۷ روزه هفتگی با تفکیک زمان‌های اشغال‌شده و زمان‌های خالی
 */
export function buildWeeklyScheduleForConsultant(
  consultant: ConsultantProfile,
  submissions: FormSubmission[],
  allowedTopics?: string[]
): ConsultantDaySchedule[] {
  const bookings = getBookingsForConsultant(consultant, submissions, allowedTopics);

  return PERSIAN_WEEK_DAYS.map((day) => {
    // ۱. استخراج اسلات‌های از پیش تعریف‌شده برای این روز
    const definedForDay = consultant.definedSlots.filter((s) => s.dayIndex === day.index);
    const bookingsForDay = bookings.filter((b) => b.dayIndex === day.index);

    const scheduleSlots: ConsultantScheduleSlot[] = [];
    const matchedBookingIds = new Set<string>();

    // برای هر اسلات تعریف‌شده، بررسی می‌کنیم که آیا رزرو شده است یا خیر
    definedForDay.forEach((ds) => {
      const matchedBooking = bookingsForDay.find((b) => {
        if (matchedBookingIds.has(b.id)) return false;
        // بررسی تطبیق اسلات یا بازه ساعتی
        const labelMatch = b.slotValue && (b.slotValue.includes(ds.timeRange) || ds.label.includes(b.timeRange));
        const timeMatch = matchTimeRanges(b.timeRange, ds.timeRange);
        return labelMatch || timeMatch;
      });

      if (matchedBooking) {
        matchedBookingIds.add(matchedBooking.id);
        scheduleSlots.push({
          timeRange: ds.timeRange,
          label: ds.label,
          category: ds.category,
          isOccupied: true,
          booking: matchedBooking,
        });
      } else {
        scheduleSlots.push({
          timeRange: ds.timeRange,
          label: ds.label,
          category: ds.category,
          isOccupied: false,
        });
      }
    });

    // ۲. اضافه کردن نوبت‌هایی که خارج از اسلات‌های از پیش تعریف‌شده ثبت شده‌اند
    bookingsForDay.forEach((b) => {
      if (!matchedBookingIds.has(b.id)) {
        matchedBookingIds.add(b.id);
        scheduleSlots.push({
          timeRange: b.timeRange || 'تعیین‌شده',
          label: b.slotValue || `${day.name} - ${b.timeRange}`,
          category: b.topic,
          isOccupied: true,
          booking: b,
        });
      }
    });

    // ۳. مرتب‌سازی زمانی اسلات‌ها
    scheduleSlots.sort((a, b) => a.timeRange.localeCompare(b.timeRange));

    const totalSlotsCount = scheduleSlots.length;
    const occupiedCount = scheduleSlots.filter((s) => s.isOccupied).length;
    const freeCount = scheduleSlots.filter((s) => !s.isOccupied).length;

    return {
      dayIndex: day.index,
      dayName: day.name,
      shortName: day.shortName,
      isDayOff: totalSlotsCount === 0,
      totalSlotsCount,
      occupiedCount,
      freeCount,
      slots: scheduleSlots,
    };
  });
}

export interface ConsultantListItem {
  profile: ConsultantProfile;
  member?: TeamMember;
  bookings: ConsultantBookingItem[];
}

/**
 * استخراج تمامی نوبت‌های ثبت‌شده در سامانه
 */
export function getAllBookingItems(submissions: FormSubmission[]): ConsultantBookingItem[] {
  const items: ConsultantBookingItem[] = [];
  const seenSubIds = new Set<string>();

  for (const sub of submissions) {
    if (!sub) continue;
    const isBookingForm = sub.formId === 'form-belhagh-booking' || sub.formId === '3uu4z';
    const hasBookingKey = sub.data && Object.keys(sub.data).some(
      (k) => (k.startsWith('f_booking_') || k.startsWith('f_counselor') || k === 'f_counselor' || k === 'f_topic') && sub.data[k]
    );

    if (isBookingForm || hasBookingKey || sub.data?.f_counselor || sub.data?.f_booking_counselor) {
      const item = extractBookingItemFromSubmission(sub);
      if (item && !seenSubIds.has(item.id)) {
        seenSubIds.add(item.id);
        items.push(item);
      }
    }
  }

  return items;
}

/**
 * تجمیع کامل و هوشمند لیست مشاوران به همراه نوبت‌های تخصیص‌یافته
 * تضمین می‌کند که تمامی نوبت‌های واقعی در سیستم به مشاور متناظر متصل شده و هیچ نوبتی از قلم نیفتد.
 */
export function buildAllConsultantsWithBookings(
  teamMembers: TeamMember[],
  submissions: FormSubmission[]
): {
  consultantsList: ConsultantListItem[];
  allBookings: ConsultantBookingItem[];
  totalBookingsCount: number;
  uniqueClientsCount: number;
} {
  const allBookings = getAllBookingItems(submissions);
  const consultantsMap = new Map<string, ConsultantListItem>();

  // ۱. اعضای تیم تعریف‌شده در سامانه که به عنوان مشاور فعالند
  teamMembers.forEach((member) => {
    const isConsultantUser =
      member.allowedTabs?.includes('consultants') ||
      (member.jobTitle && (member.jobTitle.includes('مشاور') || member.jobTitle.includes('روانشناس'))) ||
      Boolean(member.consultantId) ||
      (member.allowedTopics && member.allowedTopics.length > 0) ||
      KNOWN_CONSULTANTS.some(
        (k) =>
          (member.mobile && normalizeMobileNumber(k.mobile) === normalizeMobileNumber(member.mobile)) ||
          cleanConsultantName(k.name) === cleanConsultantName(member.name)
      );

    if (isConsultantUser && member.role !== 'super_admin') {
      const prof = matchMemberToConsultant(member);
      consultantsMap.set(prof.id, {
        profile: prof,
        member,
        bookings: [],
      });
    }
  });

  // ۲. اضافه کردن مشاوران رسمی مرکز بالحق (ساعت کاری دست‌نخورده حفظ می‌شود)
  KNOWN_CONSULTANTS.forEach((kc) => {
    const cleanKPhone = normalizeMobileNumber(kc.mobile);
    const existing = Array.from(consultantsMap.values()).find(
      (c) => normalizeMobileNumber(c.profile.mobile) === cleanKPhone || c.profile.id === kc.id
    );

    if (!existing) {
      consultantsMap.set(kc.id, {
        profile: kc,
        bookings: [],
      });
    } else {
      // ساعت کاری دقیقاً همان زمان‌بندی تعیین‌شده رسمی حفظ می‌شود
      if (existing.profile.definedSlots.length === 0 && kc.definedSlots.length > 0) {
        existing.profile.definedSlots = kc.definedSlots;
      }
      if (existing.profile.bookingFieldIds.length === 0 && kc.bookingFieldIds.length > 0) {
        existing.profile.bookingFieldIds = kc.bookingFieldIds;
      }
    }
  });

  // ۳. تخصیص ایمن نوبت‌ها بر اساس فیلتر قطعی بدون نشت
  for (const booking of allBookings) {
    let assigned = false;
    for (const item of consultantsMap.values()) {
      const memberAllowedTopics = item.member?.allowedTopics;
      if (isBookingAssignedToConsultant(booking, item.profile, memberAllowedTopics)) {
        item.bookings.push(booking);
        assigned = true;
        break;
      }
    }

    // در صورتی که نوبت برای مشاوری باشد که در سیستم پیش‌فرض نیست اما نام صریح دارد
    if (!assigned) {
      const cleanBName = cleanConsultantName(booking.consultantName);
      const GENERIC_WORDS = ['مشاور', 'مشاوره', 'مرکز', 'بالحق', 'دکتر', 'روانشناس', 'استاد', 'همکار', 'تخصصی', 'عمومی'];
      if (cleanBName && cleanBName.length >= 3 && !GENERIC_WORDS.includes(cleanBName)) {
        const dynamicKey = `dyn_${cleanBName}`;
        let dynamicEntry = consultantsMap.get(dynamicKey);
        if (!dynamicEntry) {
          const dynProfile: ConsultantProfile = {
            id: dynamicKey,
            name: booking.consultantName,
            mobile: booking.consultantMobile || '',
            jobTitle: 'مشاور',
            specialization: booking.topic || 'مشاوره تخصصی',
            bookingFieldIds: [],
            definedSlots: [],
          };
          dynamicEntry = {
            profile: dynProfile,
            bookings: [],
          };
          consultantsMap.set(dynamicKey, dynamicEntry);
        }
        dynamicEntry.bookings.push(booking);
      }
    }
  }

  const consultantsList = Array.from(consultantsMap.values());
  const uniqueClients = new Set(allBookings.map((b) => b.caseCode || b.clientMobile).filter(Boolean));

  return {
    consultantsList,
    allBookings,
    totalBookingsCount: allBookings.length,
    uniqueClientsCount: uniqueClients.size,
  };
}
