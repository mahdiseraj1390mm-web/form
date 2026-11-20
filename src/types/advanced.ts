import { AppointmentData } from './form';

export interface ChatMessage {
  id: string;
  formId: string;
  sender: 'respondent' | 'admin';
  senderName: string;
  text: string;
  createdAt: string;
  read: boolean;
}

export interface PrintDocumentTemplate {
  id: string;
  formId: string;
  title: string;
  paperSize: 'A4' | 'A5';
  orientation: 'portrait' | 'landscape';
  headerText: string;
  showLogo: boolean;
  showQrCode: boolean;
  showTrackingCode: boolean;
  watermarkText?: string;
  bodyContentHtml: string;
  footerText: string;
}

export interface WebhookLog {
  id: string;
  formId: string;
  event: 'submission.created' | 'payment.verified' | 'quiz.completed';
  url: string;
  payload: Record<string, any>;
  statusCode: number;
  status: 'success' | 'failed';
  createdAt: string;
}

export type TeamRole = 
  | 'super_admin'       // مدیر کل
  | 'form_builder'      // طراح فرم
  | 'reviewer'          // کارشناس بررسی و کارتابل
  | 'booking_operator'  // اپراتور نوبت‌دهی و مشاوران
  | 'auditor'           // ناظر و بازرس
  | 'custom';           // دسترسی سفارشی

export interface DetailedPermissions {
  // مدیریت فرم‌ها
  canCreateForms: boolean;
  canEditForms: boolean;
  canDeleteForms: boolean;
  canPublishForms: boolean;

  // کارتابل پاسخ‌ها و مراجعین
  canViewSubmissions: boolean;
  canEditSubmissions: boolean;
  canDeleteSubmissions: boolean;
  canChangeStatus: boolean;
  canExportData: boolean;
  canAddComments: boolean;

  // سامانه نوبت‌دهی و تقویم
  canManageBookings: boolean;
  canRescheduleBookings: boolean;
  canManualBook: boolean;

  // مالی، پیامک و تنظیمات
  canViewFinances: boolean;
  canManageSms: boolean;
  canManageIntegrations: boolean;
  canManageTeam: boolean;
  canViewFamilyDossiers?: boolean;
}

export interface FamilyMemberSummary {
  caseCode: string;
  fullName: string;
  role: string; // پدر، مادر، دختر، پسر ...
  mobile: string;
  age?: string;
  individualSubmissionsCount: number;
  familySubmissionsCount: number;
  lastActiveDate: string;
}

export interface FamilyDossierGroup {
  familyCode: string; // کد پرونده خانوادگی یکتا: FAM-SP123456
  familyName: string; // نام خانواده: خانواده حسینی
  headCaseCode?: string; // کد پرونده سرپرست یا اولین عضو ثبت‌شده
  provinceCity: string;
  contactMobile: string;
  members: FamilyMemberSummary[];
  familySubmissions: import('./form').FormSubmission[]; // ارسالی‌های خانوادگی پر شده توسط اعضا
  individualSubmissions: import('./form').FormSubmission[]; // ارسالی‌های فردی تک‌تک اعضا
  createdAt: string;
  updatedAt: string;
}

export interface FamilyQuestionComparisonItem {
  fieldId: string;
  questionLabel: string;
  stepTitle?: string;
  memberAnswers: Record<string, { role: string; memberName: string; answer: any; displayValue: string }>;
  isConsensus: boolean; // آیا پاسخ‌ها یکسان/هم‌نظر هستند؟
  divergenceLevel: 'none' | 'moderate' | 'high'; // سطح اختلاف نظر
}

export interface TeamMember {
  id: string;
  name: string;
  genderPrefix?: 'آقا' | 'خانم'; // پیشوند: آقا یا خانم
  avatarUrl?: string; // آدرس تصویر پروفایل مشاور
  email: string;
  mobile: string;
  username?: string;
  password?: string;
  jobTitle: string;
  role: TeamRole;
  status: 'active' | 'pending' | 'suspended';
  invitedAt: string;
  lastActive?: string;
  accessibleFormIds: string[]; // ['all'] یا آرایه‌ای از شناسه‌های فرم
  permissions: DetailedPermissions;
  allowedTabs: string[]; // شناسه‌های تب‌های مجاز در سایدبار
  requireCaseCode?: boolean; // آیا در صفحه پرونده مراجعین نیاز به وارد کردن کد پرونده دارد؟
  clientDossierAccess?: 'restricted' | 'unrestricted'; // دسترسی به پرونده مراجعان: محدود شده یا محدود نشده
  canEditWorkingHours?: boolean; // آیا مشاور اجازه تغییر ساعت کاری خود را دارد؟ (پیش‌فرض: خیر)
  consultantId?: string; // شناسه یا عنوان مشاور متناظر در سامانه نوبت‌دهی (در صورت انتصاب به عنوان مشاور)
  assignedConsultantIds?: string[]; // شناسه‌های مشاورین متصل به این کاربر در سامانه نوبت‌دهی
  allowedTopics?: string[]; // موضوعات و حوزه‌های مشاوره مجاز (مثلاً کودک، نوجوان، تحصیلی، بالینی، ازدواج و خانواده)
  workingHours?: AppointmentData; // ساعت کاری و روزبندی حضور مشاور (شامل topicSchedules برای هر موضوع)
  topicWorkingHours?: Record<string, AppointmentData>; // ساعات کاری تفکیک‌شده به ازای هر موضوع مشاوره
}
