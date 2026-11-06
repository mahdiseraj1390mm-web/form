import { FormSubmission } from '@/types/form';
import { TeamMember } from '@/types/advanced';
import { normalizeMobileNumber } from './team-constants';
import { toPersianDigits } from './persian';
import { COUNSELOR_MAP } from './belhagh-sms-helper';

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
  mobile: string;
  jobTitle: string;
  specialization: string;
  bookingFieldIds: string[];
  definedSlots: DefinedSlot[];
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

  const isBookingForm = sub.formId === 'form-belhagh-booking' || sub.formId === '3uu4z';

  // اگر نه مشاور مشخص بود و نه اسلات و نه فرم نوبت‌دهی بود، نوبت نیست
  if (!consultantName && !slotValue && !isBookingForm) {
    return null;
  }

  if (!consultantName && isBookingForm) {
    consultantName = 'مشاور مرکز (پذیرش نوبت)';
  }

  if (!slotValue && isBookingForm) {
    slotValue = 'نوبت ثبت‌شده در سامانه';
  }

  const cleanName = cleanConsultantName(consultantName || 'مشاور مرکز');
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

  // ۱. انطباق با consultantId صریح
  if (member.consultantId) {
    const cId = member.consultantId;
    const found = allProfiles.find((p) => p.id === cId || p.bookingFieldIds.includes(cId));
    if (found) return found;
  }

  // ۲. انطباق با شماره تلفن همراه
  const memberPhone = normalizeMobileNumber(member.mobile || member.username || '');
  if (memberPhone) {
    const found = allProfiles.find((p) => normalizeMobileNumber(p.mobile) === memberPhone);
    if (found) return found;
  }

  // ۳. انطباق با نام خانوادگی یا نام مشاور
  const cleanMemName = cleanConsultantName(member.name);
  if (cleanMemName) {
    const found = allProfiles.find((p) => {
      const cleanPName = cleanConsultantName(p.name);
      return cleanMemName.includes(cleanPName) || cleanPName.includes(cleanMemName);
    });
    if (found) return found;
  }

  // ۴. در غیر این صورت، ساخت یک پروفایل پویا برای این عضو تیم
  return {
    id: member.id,
    name: member.name,
    mobile: member.mobile || member.username || '',
    jobTitle: member.jobTitle || 'مشاور مرکز',
    specialization: member.jobTitle || 'مشاوره تخصصی',
    bookingFieldIds: [],
    definedSlots: [
      { dayIndex: 0, dayName: 'شنبه', timeRange: '۱۰:۰۰ الی ۱۰:۴۵', label: 'شنبه - ۱۰:۰۰ الی ۱۰:۴۵', category: 'عمومی', fieldId: member.id },
      { dayIndex: 0, dayName: 'شنبه', timeRange: '۱۱:۰۰ الی ۱۱:۴۵', label: 'شنبه - ۱۱:۰۰ الی ۱۱:۴۵', category: 'عمومی', fieldId: member.id },
      { dayIndex: 2, dayName: 'دوشنبه', timeRange: '۱۴:۰۰ الی ۱۴:۴۵', label: 'دوشنبه - ۱۴:۰۰ الی ۱۴:۴۵', category: 'عمومی', fieldId: member.id },
      { dayIndex: 2, dayName: 'دوشنبه', timeRange: '۱۵:۰۰ الی ۱۵:۴۵', label: 'دوشنبه - ۱۵:۰۰ الی ۱۵:۴۵', category: 'عمومی', fieldId: member.id },
      { dayIndex: 4, dayName: 'چهارشنبه', timeRange: '۱۰:۰۰ الی ۱۰:۴۵', label: 'چهارشنبه - ۱۰:۰۰ الی ۱۰:۴۵', category: 'عمومی', fieldId: member.id },
      { dayIndex: 4, dayName: 'چهارشنبه', timeRange: '۱۱:۰۰ الی ۱۱:۴۵', label: 'چهارشنبه - ۱۱:۰۰ الی ۱۱:۴۵', category: 'عمومی', fieldId: member.id },
    ],
  };
}

/**
 * واکشی تمام نوبت‌های رزرو شده مربوط به یک مشاور خاص
 */
export function getBookingsForConsultant(
  consultant: ConsultantProfile,
  submissions: FormSubmission[]
): ConsultantBookingItem[] {
  const cleanCName = cleanConsultantName(consultant.name);
  const cleanPhone = normalizeMobileNumber(consultant.mobile);

  const results: ConsultantBookingItem[] = [];

  for (const sub of submissions) {
    const item = extractBookingItemFromSubmission(sub);
    if (!item) continue;

    // تطبیق بر اساس فیلد نوبت
    const fieldMatch = consultant.bookingFieldIds.length > 0 && consultant.bookingFieldIds.some((fId) => sub.data?.[fId]);

    // تطبیق بر اساس شماره تلفن
    const phoneMatch = cleanPhone && normalizeMobileNumber(item.consultantMobile) === cleanPhone;

    // تطبیق بر اساس نام مشاور
    const itemCleanName = cleanConsultantName(item.consultantName);
    const nameMatch = cleanCName && (itemCleanName.includes(cleanCName) || cleanCName.includes(itemCleanName));

    if (fieldMatch || phoneMatch || nameMatch) {
      results.push(item);
    }
  }

  return results;
}

/**
 * ساخت تایم‌لاین کامل ۷ روزه هفتگی با تفکیک زمان‌های اشغال‌شده و زمان‌های خالی
 */
export function buildWeeklyScheduleForConsultant(
  consultant: ConsultantProfile,
  submissions: FormSubmission[]
): ConsultantDaySchedule[] {
  const bookings = getBookingsForConsultant(consultant, submissions);

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

  // ۱. اعضای تیم تعریف‌شده در سامانه (به جز سوپرادمین)
  teamMembers.forEach((member) => {
    const isConsultantUser =
      member.allowedTabs?.includes('consultants') ||
      (member.jobTitle && (member.jobTitle.includes('مشاور') || member.jobTitle.includes('روانشناس'))) ||
      Boolean(member.consultantId) ||
      KNOWN_CONSULTANTS.some(
        (k) =>
          normalizeMobileNumber(k.mobile) === normalizeMobileNumber(member.mobile) ||
          cleanConsultantName(k.name) === cleanConsultantName(member.name)
      );

    if (isConsultantUser || member.role !== 'super_admin') {
      const prof = matchMemberToConsultant(member);
      consultantsMap.set(prof.id, {
        profile: prof,
        member,
        bookings: [],
      });
    }
  });

  // ۲. اضافه کردن مشاوران رسمی مرکز بالحق
  KNOWN_CONSULTANTS.forEach((kc) => {
    const cleanKPhone = normalizeMobileNumber(kc.mobile);
    const existing = Array.from(consultantsMap.values()).find(
      (c) => normalizeMobileNumber(c.profile.mobile) === cleanKPhone
    );

    if (!existing) {
      consultantsMap.set(kc.id, {
        profile: kc,
        bookings: [],
      });
    }
  });

  // ۳. تخصیص تک‌تک نوبت‌های ثبت‌شده به مشاوران
  for (const booking of allBookings) {
    let assigned = false;
    const cleanBName = cleanConsultantName(booking.consultantName);
    const cleanBMobile = normalizeMobileNumber(booking.consultantMobile);

    for (const item of consultantsMap.values()) {
      // الف: تطبیق بر اساس فیلد رزرو فرم (مثلاً f_booking_farahmandi)
      const fieldMatch =
        booking.rawSubmission.data &&
        item.profile.bookingFieldIds.some((fId) => booking.rawSubmission.data[fId]);

      // ب: تطبیق بر اساس شماره تلفن همراه مشاور
      const itemPhone = normalizeMobileNumber(item.profile.mobile);
      const phoneMatch = cleanBMobile && itemPhone && cleanBMobile === itemPhone;

      // ج: تطبیق بر اساس نام مشاور
      const cleanPName = cleanConsultantName(item.profile.name);
      const nameMatch =
        cleanBName &&
        cleanPName &&
        (cleanBName.includes(cleanPName) || cleanPName.includes(cleanBName));

      if (fieldMatch || phoneMatch || nameMatch) {
        item.bookings.push(booking);
        assigned = true;
        break;
      }
    }

    // د: اگر نوبت به هیچ یک از مشاوران موجود اختصاص نیافت (مثلاً «دکتر علوی» یا «مشاور مرکز»):
    // ایجاد مشاور جدید به صورت پویا تا نوبت و مراجع دقیقاً نمایش داده شوند
    if (!assigned) {
      const dynamicKey = `dyn_${cleanBName || 'center'}`;
      let dynamicEntry = consultantsMap.get(dynamicKey);
      if (!dynamicEntry) {
        const dynProfile: ConsultantProfile = {
          id: dynamicKey,
          name: booking.consultantName || 'مشاور مرکز (پذیرش نوبت)',
          mobile: booking.consultantMobile || '',
          jobTitle: 'مشاور تخصصی مرکز',
          specialization: booking.topic || 'مشاوره',
          bookingFieldIds: [],
          definedSlots: [
            {
              dayIndex: booking.dayIndex,
              dayName: booking.dayName,
              timeRange: booking.timeRange,
              label: booking.slotValue,
              category: booking.topic,
              fieldId: dynamicKey,
            },
          ],
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

  // ۴. مرتب‌سازی لیست مشاوران:
  // اولویت اول با مشاورانی که نوبت رزرو شده دارند (تعداد بیشتر نوبت‌ها)
  // اولویت دوم با اعضای تیم تعریف‌شده
  const consultantsList = Array.from(consultantsMap.values()).sort((a, b) => {
    if (b.bookings.length !== a.bookings.length) {
      return b.bookings.length - a.bookings.length;
    }
    if (a.member && !b.member) return -1;
    if (!a.member && b.member) return 1;
    return a.profile.name.localeCompare(b.profile.name, 'fa');
  });

  const uniqueClients = new Set<string>();
  allBookings.forEach((b) => {
    if (b.caseCode && b.caseCode !== 'ثبت‌نشده') {
      uniqueClients.add(b.caseCode);
    } else if (b.clientMobile) {
      uniqueClients.add(b.clientMobile);
    }
  });

  return {
    consultantsList,
    allBookings,
    totalBookingsCount: allBookings.length,
    uniqueClientsCount: uniqueClients.size,
  };
}
