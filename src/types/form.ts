export type FieldType =
  // ورودی‌های متنی و پایه
  | 'text'
  | 'textarea'
  | 'number'
  | 'email'
  | 'nationalCode'
  | 'mobile'
  | 'password'
  | 'persianOnlyText'
  | 'englishOnlyText'
  // انتخاب‌ها
  | 'radio'
  | 'checkbox'
  | 'select'
  | 'cascadingProvinceCity'
  | 'toggle'
  | 'likeButton'
  | 'rating'
  // تاریخ و زمان
  | 'jalaliDate'
  | 'gregorianDate'
  | 'digitalTime'
  // رسانه و مدارک
  | 'fileUpload'
  | 'imageUpload'
  | 'photoCrop'
  | 'signature'
  | 'audioRecord'
  | 'videoEmbed'
  | 'pdfEmbed'
  // ابزارهای پیشرفته
  | 'formLookup'
  | 'formula'
  | 'appointmentBooking'
  | 'barcodeScanner'
  | 'quizQuestion'
  | 'countdownTimer'
  // بخش‌بندی و نمایش
  | 'sectionDivider'
  | 'alertBox'
  // فیلدهای پیشرفته ویژه فرم‌افزار
  | 'richText'
  | 'satisfaction'
  | 'likertScale'
  | 'mapLocation'
  | 'termsCheckbox'
  | 'choiceTable';

export interface SelectOption {
  id: string;
  label: string;
  value: string;
  price?: number; // برای فرم‌های دارای محاسبه و پرداخت
  score?: number; // برای آزمون‌ها
}

export interface ValidationRules {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  customErrorMessage?: string;
  uniqueCheck?: boolean; // یکتا بودن در کل ارسالی‌ها
  verifyOtp?: boolean; // ارسال کد تایید پیامکی پیش از ثبت
  isReadOnly?: boolean; // فقط خواندنی
  isHidden?: boolean; // فیلد مخفی سیستمی
  searchable?: boolean; // قابل جستجو بودن فیلد در فرم‌ساز
}

export type ConditionOperator =
  | 'equals'
  | 'notEquals'
  | 'contains'
  | 'greaterThan'
  | 'lessThan'
  | 'isEmpty'
  | 'isNotEmpty';

export type ConditionAction =
  | 'show'
  | 'hide'
  | 'require'
  | 'disable'
  | 'setValue'
  | 'jumpToStep';

export interface ConditionalRule {
  id: string;
  targetFieldId?: string; // فیلدی که تحت تاثیر قرار می‌گیرد
  targetFieldIds?: string[]; // آرایه فیلدهای تحت تاثیر (برای چند فیلد همزمان مثل نوبت + شماره تماس)
  additionalTargetFieldId?: string; // فیلد دوم همراه (جهت نمایش همزمان در فرم‌ساز)
  targetStepIndex?: number; // مرحله‌ای که به آن پرش می‌شود
  action: ConditionAction;
  sourceFieldId: string;
  operator: ConditionOperator;
  value: any;
  customDescription?: string;
}

export interface WorkDayPeriod {
  startHour: string;
  endHour: string;
}

export interface DayScheduleConfig {
  enabled: boolean;
  periods: WorkDayPeriod[];
}

export interface AppointmentData {
  slotDurationMinutes: number; // مدت زمان هر جلسه مشاوره به دقیقه (مثلاً ۳۰، ۴۵)
  restTimeMinutes?: number; // زمان استراحت بین جلسات مشاوره به دقیقه (مثلاً ۵، ۱۰)
  availableDays?: number[]; // ایندکس روزهای فعال هفته: 0=شنبه، 1=یکشنبه، 2=دوشنبه، 3=سه‌شنبه، 4=چهارشنبه، 5=پنج‌شنبه، 6=جمعه
  startHour?: string; // ساعت شروع روز: "09:00"
  endHour?: string; // ساعت پایان روز: "18:00"
  daySchedules?: Record<number, DayScheduleConfig>; // ساعات کاری تفکیک‌شده به ازای هر روز
  holidays?: string[]; // مشخص کردن روزهای تعطیل یا مناسبتی
  capacityPerSlot?: number; // ظرفیت هر اسلات (پیش‌فرض ۱)
  maxAdvanceDays?: number; // حداکثر روزهای آتی قابل رزرو
}

export interface FormField {
  id: string;
  type: FieldType;
  label: string;
  name?: string; // نام انگلیسی متغیر فیلد (جهت وب‌هوک و فرمول‌ها)
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  stepId?: string; // متعلق به کدام مرحله (در فرم‌های مرحله‌ای)
  panelId?: string; // متعلق به کدام پنل بخش‌بندی فرم
  gridCols?: 1 | 2 | 3 | 4 | 6 | 12; // چیدمان ستونی
  validations: ValidationRules;
  options?: SelectOption[];
  formulaExpression?: string; // فرمول ریاضی مثل {f_price} * 1.09
  lookupFormId?: string; // فرم متصل برای واکشی داده
  lookupSourceFieldId?: string;
  embedUrl?: string; // برای ویدیو یا PDF
  quizData?: {
    correctOptionId?: string;
    points: number;
    negativePoints?: number;
    explanation?: string;
  };
  appointmentData?: AppointmentData;
  pageBreakAfter?: boolean; // انتقال به صفحه بعد پس از این پرسش (دکمه بعدی)
  nextButtonText?: string; // متن دکمه بعدی (مثلاً "بعدی"، "ادامه")
  autoAdvanceOnSelect?: boolean; // رفتن خودکار به سوال بعد با انتخاب گزینه
  isRepeatable?: boolean; // فیلد با قابلیت تکرار
  hideLabel?: boolean; // مخفی‌سازی عنوان فیلد
  panelBasedDefault?: boolean; // انتخاب پیش‌فرض بر اساس شماره پنل
  styling?: {
    labelColor?: string;
    backgroundColor?: string;
    borderColor?: string;
  };
}

export interface FormPanel {
  id: string;
  title?: string;
  description?: string;
  columns?: 1 | 2 | 3 | 4;
}

export interface FormStep {
  id: string;
  title: string;
  description?: string;
  fieldIds: string[];
}

export interface PaymentSettings {
  enabled: boolean;
  type: 'fixed' | 'formula' | 'customInput';
  fixedAmount?: number;
  formulaFieldId?: string;
  gateway: 'shaparak_mellat' | 'zarinpal' | 'idpay' | 'parsian' | 'sadad';
  currency: 'IRT' | 'IRR';
  description?: string;
  taxPercent?: number; // ارزش افزوده (مثلاً ۱۰٪)
}

export interface QuizSettings {
  enabled: boolean;
  durationMinutes: number; // تایمر آزمون (0 یعنی بدون محدودیت)
  passingScore: number;
  negativeMarking: boolean;
  negativeRatio?: number; // مثلا ۰.۳۳ نمره منفی
  shuffleQuestions: boolean;
  showImmediateResult: boolean;
  certificateEnabled: boolean;
  certificateTitle?: string;
}

export interface SecuritySettings {
  authRequired: boolean; // نیاز به لاگین
  otpLogin: boolean; // ورود با شماره همراه و کد پیامک
  maxSubmissions?: number; // ظرفیت کل ثبت نام
  startDate?: string; // تاریخ باز شدن فرم
  endDate?: string; // تاریخ بسته شدن فرم
  onePerNationalCode: boolean; // هر کد ملی یک بار
  onePerMobile: boolean; // هر شماره موبایل یک بار
  limitByIp: boolean;
  allowEditAfterSubmit: boolean;
  passwordProtected?: boolean;
  formPassword?: string;
}

export interface PrintTemplateSettings {
  headerTitle: string;
  showQrCode: boolean;
  showTrackingCode: boolean;
  showDate: boolean;
  logoUrl?: string;
  customFooterText?: string;
  borderStyle: 'classic' | 'minimal' | 'formal';
  paperSize?: 'A4' | 'A5';
  orientation?: 'portrait' | 'landscape';
}

export interface NotificationSettings {
  smsAdminEnabled: boolean;
  adminMobile?: string;
  smsUserEnabled: boolean;
  userMobileFieldId?: string;
  smsTemplateText?: string;
  emailAdminEnabled: boolean;
  adminEmail?: string;
  webhookUrl?: string;
}

export interface FormBehaviorSettings {
  redirectAfterSubmit: boolean;
  redirectUrl?: string;
  customSuccessMessage?: string;
  showSummaryAfterSubmit: boolean;
  allowDownloadPdfReceipt: boolean;
  nextChainedForm?: {
    formId: string;
    formSlug: string;
    title: string;
    buttonText: string;
    description?: string;
    prefillMapping?: Record<string, string>;
  };
}

export interface FormGeneralSettings {
  identifierColor?: string; // رنگ شناسایی فرم (مطابق فرم‌افزار)
  requestLocation?: boolean; // درخواست دریافت موقعیت مکانی
  showSecurityCode?: boolean; // نمایش کد امنیتی
  customIdPrefix?: string; // پیشوند
  customIdSuffix?: string; // پسوند
  customIdMinDigits?: number; // حداقل تعداد ارقام
  customIdStartNumber?: number; // شروع از
  liveChatEnabled?: boolean; // گفتگوی آنلاین برای این فرم فعال شود
}

export interface FormShareSettings {
  shareMode: 'public' | 'domainRestricted'; // دریافت لینک انتشار یا انتشار فقط در سایت مشخص شده
  allowedDomains?: string[]; // لیست سایت‌های مجاز
  customSubdomain?: string; // زیر دامنه اختصاصی
}

export interface FormThemeSettings {
  themeId?: string; // شناسه قالب مثل formafzar, garden, nature, ...
  themeColor: string; // کد رنگ هگز سازمانی
  backgroundColor?: string; // رنگ پس‌زمینه کلی
  backgroundGradient?: string; // گرادیانت یا استایل پس‌زمینه
  backgroundImage?: string; // عکس پس‌زمینه
  backgroundSize?: 'cover' | 'contain' | 'repeat' | 'auto'; // اندازه عکس
  backgroundPosition?: 'center' | 'top' | 'bottom' | 'right' | 'left'; // موقعیت قرارگیری
  backgroundOverlayOpacity?: number; // شفافیت پس‌زمینه
  fontFamily: 'vazirmatn' | 'iranyekan' | 'shabnam' | 'system';
  fontSize?: 'sm' | 'base' | 'lg';
  titleColor?: string;
  textColor?: string;
  labelColor?: string;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full'; // دور کادر: تیز، گرد، دایره‌ای
  borderWidth?: number; // ضخامت دور کادر
  borderColor?: string; // رنگ دور کادر
  shadow?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  formWidth?: 'compact' | 'standard' | 'wide' | 'full'; // اندازه فرم
  cardBackgroundColor?: string; // رنگ کارت فرم
  inputBackgroundColor?: string; // رنگ فیلدها
  inputBorderColor?: string;
  inputBorderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  buttonColor?: string; // رنگ دکمه‌ها
  buttonTextColor?: string;
  buttonBorderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  backgroundStyle?: 'clean' | 'subtle_grid' | 'slate_soft';
}

export interface Form {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;
  mode: 'classic' | 'wizard' | 'singleQuestion'; // کلاسیک (یک صفحه)، چندمرحله‌ای، یا تک‌سوالی (اسلایدی با دکمه بعدی)
  status: 'published' | 'draft' | 'archived';
  fields: FormField[];
  panels?: FormPanel[];
  steps: FormStep[];
  rules: ConditionalRule[];
  payment: PaymentSettings;
  quiz: QuizSettings;
  security: SecuritySettings;
  printTemplate: PrintTemplateSettings;
  notifications: NotificationSettings;
  behavior?: FormBehaviorSettings;
  theme?: FormThemeSettings;
  generalSettings?: FormGeneralSettings;
  shareSettings?: FormShareSettings;
  submissionCount: number;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubmissionComment {
  id: string;
  authorName: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

export type SubmissionStatus = 'new' | 'reviewing' | 'approved' | 'rejected' | 'archived';

export interface FormSubmission {
  id: string;
  formId: string;
  trackingCode: string;
  data: Record<string, any>;
  status: SubmissionStatus;
  paymentStatus?: 'none' | 'pending' | 'paid' | 'failed';
  paymentAmount?: number;
  paymentRefId?: string;
  paymentDate?: string;
  quizResult?: {
    score: number;
    maxScore: number;
    passed: boolean;
    answersCount: number;
    correctCount: number;
  };
  userIp?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt?: string;
  comments: SubmissionComment[];
}
