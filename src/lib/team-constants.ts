import { TeamMember } from '@/types/advanced';

export const AVAILABLE_SIDEBAR_TABS = [
  { id: 'dashboard', label: 'داشبورد مدیریت' },
  { id: 'forms', label: 'فرم‌ها و پرسشنامه‌ها' },
  { id: 'builder', label: 'استودیو طراحی فرم' },
  { id: 'runner', label: 'پیش‌نمایش فرم زنده' },
  { id: 'submissions', label: 'پرونده مراجعین' },
  { id: 'media', label: 'مرکز اسناد و فایل‌های پیوست' },
  { id: 'chat', label: 'گفتگوی آنلاین با مراجعین' },
  { id: 'analytics', label: 'آمارها و تحلیل‌های بالینی' },
  { id: 'templates', label: 'قالب‌های آماده فرم' },
  { id: 'settings', label: 'تنظیمات و وب‌هوک‌ها' },
] as const;

export const DEFAULT_INITIAL_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'user-admin',
    name: 'امیرحسین رضایی',
    email: 'a.rezaei@paya.ir',
    mobile: '09121112233',
    username: '09121112233',
    password: 'admin@password123',
    jobTitle: 'مدیر ارشد سامانه',
    role: 'super_admin',
    status: 'active',
    invitedAt: '2026-01-10T08:00:00Z',
    lastActive: 'هم‌اکنون آنلاین',
    accessibleFormIds: ['all'],
    allowedTabs: [
      'dashboard',
      'forms',
      'builder',
      'runner',
      'submissions',
      'media',
      'chat',
      'analytics',
      'templates',
      'settings',
    ],
    requireCaseCode: false,
    permissions: {
      canCreateForms: true,
      canEditForms: true,
      canDeleteForms: true,
      canPublishForms: true,
      canViewSubmissions: true,
      canEditSubmissions: true,
      canDeleteSubmissions: true,
      canChangeStatus: true,
      canExportData: true,
      canAddComments: true,
      canManageBookings: true,
      canRescheduleBookings: true,
      canManualBook: true,
      canViewFinances: true,
      canManageSms: true,
      canManageIntegrations: true,
      canManageTeam: true,
    },
  },
  {
    id: 'user-booking-op',
    name: 'مریم نوری',
    email: 'm.nouri@psy-belhagh.com',
    mobile: '09358889900',
    username: '09358889900',
    password: 'op@123456',
    jobTitle: 'مسئول پذیرش و نوبت‌دهی تلفنی',
    role: 'booking_operator',
    status: 'active',
    invitedAt: '2026-03-01T10:30:00Z',
    lastActive: '۲ ساعت پیش',
    accessibleFormIds: ['form-belhagh-booking', 'form-belhagh-registration'],
    allowedTabs: ['submissions', 'chat'],
    requireCaseCode: true,
    permissions: {
      canCreateForms: false,
      canEditForms: false,
      canDeleteForms: false,
      canPublishForms: false,
      canViewSubmissions: true,
      canEditSubmissions: true,
      canDeleteSubmissions: false,
      canChangeStatus: true,
      canExportData: true,
      canAddComments: true,
      canManageBookings: true,
      canRescheduleBookings: true,
      canManualBook: true,
      canViewFinances: false,
      canManageSms: false,
      canManageIntegrations: false,
      canManageTeam: false,
    },
  },
  {
    id: 'user-reviewer',
    name: 'سارا سعادت',
    email: 'sara@paya.ir',
    mobile: '09193334455',
    username: '09193334455',
    password: 'rev@123456',
    jobTitle: 'کارشناس بررسی پرونده‌های روانشناسی',
    role: 'reviewer',
    status: 'active',
    invitedAt: '2026-02-15T12:00:00Z',
    lastActive: 'دیروز',
    accessibleFormIds: ['all'],
    allowedTabs: ['submissions'],
    requireCaseCode: true,
    permissions: {
      canCreateForms: false,
      canEditForms: false,
      canDeleteForms: false,
      canPublishForms: false,
      canViewSubmissions: true,
      canEditSubmissions: true,
      canDeleteSubmissions: false,
      canChangeStatus: true,
      canExportData: true,
      canAddComments: true,
      canManageBookings: false,
      canRescheduleBookings: false,
      canManualBook: false,
      canViewFinances: false,
      canManageSms: false,
      canManageIntegrations: false,
      canManageTeam: false,
    },
  },
];

export function normalizeMobileNumber(phone: string): string {
  if (!phone) return '';
  const digits = String(phone)
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[^0-9]/g, '');

  if (digits.startsWith('98') && digits.length === 12) {
    return '0' + digits.slice(2);
  }
  if (!digits.startsWith('0') && digits.length === 10) {
    return '0' + digits;
  }
  return digits;
}
