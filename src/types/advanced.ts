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
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  mobile: string;
  jobTitle: string;
  role: TeamRole;
  status: 'active' | 'pending' | 'suspended';
  invitedAt: string;
  lastActive?: string;
  accessibleFormIds: string[]; // ['all'] یا آرایه‌ای از شناسه‌های فرم
  permissions: DetailedPermissions;
}

