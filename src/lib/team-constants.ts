import { TeamMember } from '@/types/advanced';

export const AVAILABLE_SIDEBAR_TABS = [
  { id: 'dashboard', label: 'داشبورد مدیریت' },
  { id: 'submissions', label: 'پرونده مراجعان' },
  { id: 'builder', label: 'طراحی فرم' },
  { id: 'runner', label: 'پیش‌نمایش' },
  { id: 'consultants', label: 'مشاوران' },
  { id: 'analytics', label: 'آمارها و تحلیل‌های بالینی' },
  { id: 'templates', label: 'قالب‌های آماده' },
  { id: 'settings', label: 'تنظیمات' },
] as const;

// اعضای تیم و ساعات کاری مشاوران به‌صورت پویا از پایگاه‌داده (PostgreSQL / data/team_members.json) بارگذاری می‌شوند
export const DEFAULT_INITIAL_TEAM_MEMBERS: TeamMember[] = [];

export function buildSuperAdminSessionUser() {
  return {
    id: 'admin',
    username: 'admin',
    name: 'مدیر ارشد سامانه',
    role: 'super_admin',
    isSuperAdmin: true,
    allowedTabs: AVAILABLE_SIDEBAR_TABS.map((t) => t.id),
    requireCaseCode: false,
    canEditWorkingHours: true,
  };
}

export function buildMemberSessionUser(member: TeamMember) {
  const userAllowedTabs =
    Array.isArray(member.allowedTabs) && member.allowedTabs.length > 0
      ? member.allowedTabs
      : ['submissions'];

  return {
    id: member.id,
    username: member.mobile || member.username || '',
    name: member.name,
    mobile: member.mobile,
    role: member.role || 'member',
    jobTitle: member.jobTitle,
    isSuperAdmin: false,
    allowedTabs: userAllowedTabs,
    requireCaseCode: member.requireCaseCode !== undefined ? member.requireCaseCode : true,
    canEditWorkingHours: member.canEditWorkingHours === true,
    consultantId: member.consultantId,
    assignedConsultantIds:
      member.assignedConsultantIds || (member.consultantId ? [member.consultantId] : []),
    allowedTopics: member.allowedTopics || [],
  };
}

export function isSuperAdminUser(
  user?: { isSuperAdmin?: boolean; username?: string; role?: string } | null
): boolean {
  return Boolean(
    user?.isSuperAdmin ||
      user?.username === 'admin' ||
      user?.role === 'super_admin'
  );
}

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
