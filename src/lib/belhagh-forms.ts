import { Form } from '@/types/form';

export const belhaghRegistrationForm: Form = {
  id: 'form-belhagh-registration',
  title: 'ثبت نام',
  slug: 'zexuz',
  description: 'برای دریافت خدمات روانشناسی بالحق ابتدا ثبت نام بفرمائید',
  category: 'روانشناسی و سلامت',
  mode: 'wizard',
  status: 'published',
  submissionCount: 142,
  viewCount: 1850,
  createdAt: '2026-03-01T08:00:00Z',
  updatedAt: '2026-04-15T12:00:00Z',
  steps: [
    {
      id: 'step-1',
      title: 'احراز هویت',
      description: 'بررسی عضویت اولیه در سامانه',
      fieldIds: ['f_ebadollah_member'],
    },
    {
      id: 'step-2',
      title: 'مشخصات فردی',
      description: 'ثبت اطلاعات تماس و وضعیت خانوادگی',
      fieldIds: [
        'f_name',
        'f_family',
        'f_mobile',
        'f_birth_date',
        'f_role_in_family',
        'f_family_members',
        'f_marital_status',
        'f_province_city',
      ],
    },
    {
      id: 'step-3',
      title: 'وضعیت مدرسه معارفی',
      description: 'اطلاعات تحصیلی و مدرسه معارفی',
      fieldIds: ['f_school_name', 'f_school_supervisor', 'f_mentor_name'],
    },
    {
      id: 'step-4',
      title: 'وضعیت سلامت',
      description: 'سوابق سلامت جسمی و روحی',
      fieldIds: ['f_physical_illness', 'f_mental_illness', 'f_medications'],
    },
  ],
  fields: [
    // مرحله ۱: احراز هویت
    {
      id: 'f_ebadollah_member',
      type: 'select',
      label: 'آیا عضو سایت عبادالله هستید؟',
      stepId: 'step-1',
      gridCols: 12,
      validations: { required: true },
      options: [
        { id: 'yes', label: 'بله', value: 'بله' },
        { id: 'no', label: 'خیر', value: 'خیر' },
      ],
    },
    // مرحله ۲: مشخصات فردی
    {
      id: 'f_name',
      type: 'text',
      label: 'نام:',
      placeholder: 'نام خود را وارد کنید...',
      stepId: 'step-2',
      gridCols: 6,
      validations: { required: true },
    },
    {
      id: 'f_family',
      type: 'text',
      label: 'نام خانوادگی:',
      placeholder: 'نام خانوادگی خود را وارد کنید...',
      stepId: 'step-2',
      gridCols: 6,
      validations: { required: true },
    },
    {
      id: 'f_mobile',
      type: 'mobile',
      label: 'تلفن همراه:',
      placeholder: '۰۹۱۲۳۴۵۶۷۸۹',
      stepId: 'step-2',
      gridCols: 12,
      validations: { required: true },
    },
    {
      id: 'f_birth_date',
      type: 'jalaliDate',
      label: 'تاریخ تولد:',
      placeholder: 'روز / ماه / سال',
      stepId: 'step-2',
      gridCols: 12,
      validations: { required: true },
    },
    {
      id: 'f_role_in_family',
      type: 'select',
      label: 'نقش شما در خانواده:',
      stepId: 'step-2',
      gridCols: 12,
      validations: { required: true },
      options: [
        { id: 'father', label: 'پدر خانواده', value: 'پدر' },
        { id: 'mother', label: 'مادر خانواده', value: 'مادر' },
        { id: 'daughter', label: 'دختر خانواده', value: 'دختر' },
        { id: 'son', label: 'پسر خانواده', value: 'پسر' },
      ],
    },
    {
      id: 'f_family_members',
      type: 'select',
      label: 'تعداد اعضای خانواده:',
      stepId: 'step-2',
      gridCols: 12,
      validations: { required: true, customErrorMessage: 'انتخاب تعداد اعضای خانواده الزامی است.' },
      options: [
        { id: '2', label: 'دو نفر', value: '۲ نفر' },
        { id: '3', label: 'سه نفر', value: '۳ نفر' },
        { id: '4', label: 'چهار نفر', value: '۴ نفر' },
        { id: '5', label: 'پنج نفر', value: '۵ نفر' },
        { id: '6', label: 'شش نفر', value: '۶ نفر' },
        { id: '7', label: 'هفت نفر', value: '۷ نفر' },
        { id: '8', label: 'هشت نفر و بیشتر', value: '۸ نفر و بیشتر' },
      ],
    },
    {
      id: 'f_marital_status',
      type: 'select',
      label: 'وضعیت تاهل:',
      stepId: 'step-2',
      gridCols: 12,
      validations: { required: true },
      options: [
        { id: 'single', label: 'مجرد', value: 'مجرد' },
        { id: 'married', label: 'متاهل', value: 'متأهل' },
        { id: 'divorced', label: 'مطلقه', value: 'مطلقه' },
        { id: 'widowed', label: 'همسرم فوت شده', value: 'همسرم فوت شده' },
      ],
    },
    {
      id: 'f_province_city',
      type: 'cascadingProvinceCity',
      label: 'استان و شهرستان',
      stepId: 'step-2',
      gridCols: 12,
      validations: { required: true },
    },
    // مرحله ۳: وضعیت مدرسه معارفی
    {
      id: 'f_school_name',
      type: 'text',
      label: 'نام مدرسه معارفی:',
      stepId: 'step-3',
      gridCols: 12,
      validations: { required: true, customErrorMessage: 'درج نام مدرسه معارفی الزامی است.' },
    },
    {
      id: 'f_school_supervisor',
      type: 'text',
      label: 'ناظم مدرسه:',
      stepId: 'step-3',
      gridCols: 12,
      validations: { required: true, customErrorMessage: 'درج نام ناظم مدرسه الزامی است.' },
    },
    {
      id: 'f_mentor_name',
      type: 'text',
      label: 'نام مربی تربیتی:',
      stepId: 'step-3',
      gridCols: 12,
      validations: { required: true, customErrorMessage: 'درج نام مربی تربیتی الزامی است.' },
    },
    // مرحله ۴: وضعیت سلامت
    {
      id: 'f_physical_illness',
      type: 'textarea',
      label: 'آیا سابقه بیماری جسمی دارید؟',
      placeholder: 'توضیح بفرمائید (در صورت عدم سابقه بنویسید «ندارم»)',
      stepId: 'step-4',
      gridCols: 12,
      validations: {
        required: true,
        customErrorMessage: 'تکمیل سابقه بیماری جسمی الزامی است (در صورت عدم سابقه بنویسید «ندارم»)',
      },
    },
    {
      id: 'f_mental_illness',
      type: 'textarea',
      label: 'آیا سابقه بیماری روانی دارید؟',
      placeholder: 'توضیح بفرمائید (در صورت عدم سابقه بنویسید «ندارم»)',
      stepId: 'step-4',
      gridCols: 12,
      validations: {
        required: true,
        customErrorMessage: 'تکمیل سابقه بیماری روحی/روانی الزامی است (در صورت عدم سابقه بنویسید «ندارم»)',
      },
    },
    {
      id: 'f_medications',
      type: 'textarea',
      label: 'داروهایی که مصرف کرده اید را بفرمائید',
      placeholder: 'توضیح بفرمائید (در صورت عدم مصرف بنویسید «ندارم»)',
      stepId: 'step-4',
      gridCols: 12,
      validations: {
        required: true,
        customErrorMessage: 'تکمیل بخش داروهای مصرفی الزامی است (در صورت عدم مصرف بنویسید «ندارم»)',
      },
    },
  ],
  rules: [
    {
      id: 'rule_mentor_daughter',
      sourceFieldId: 'f_role_in_family',
      operator: 'equals',
      value: 'دختر',
      action: 'show',
      targetFieldId: 'f_mentor_name',
    },
    {
      id: 'rule_mentor_daughter_fam',
      sourceFieldId: 'f_role_in_family',
      operator: 'equals',
      value: 'دختر خانواده',
      action: 'show',
      targetFieldId: 'f_mentor_name',
    },
    {
      id: 'rule_mentor_daughter_en',
      sourceFieldId: 'f_role_in_family',
      operator: 'equals',
      value: 'daughter',
      action: 'show',
      targetFieldId: 'f_mentor_name',
    },
    {
      id: 'rule_mentor_son',
      sourceFieldId: 'f_role_in_family',
      operator: 'equals',
      value: 'پسر',
      action: 'show',
      targetFieldId: 'f_mentor_name',
    },
    {
      id: 'rule_mentor_son_fam',
      sourceFieldId: 'f_role_in_family',
      operator: 'equals',
      value: 'پسر خانواده',
      action: 'show',
      targetFieldId: 'f_mentor_name',
    },
    {
      id: 'rule_mentor_son_en',
      sourceFieldId: 'f_role_in_family',
      operator: 'equals',
      value: 'son',
      action: 'show',
      targetFieldId: 'f_mentor_name',
    },
  ],
  payment: {
    enabled: false,
    type: 'fixed',
    gateway: 'shaparak_mellat',
    currency: 'IRT',
  },
  quiz: {
    enabled: false,
    durationMinutes: 0,
    passingScore: 0,
    negativeMarking: false,
    shuffleQuestions: false,
    showImmediateResult: false,
    certificateEnabled: false,
  },
  security: {
    authRequired: false,
    otpLogin: false,
    onePerNationalCode: false,
    onePerMobile: false,
    limitByIp: false,
    allowEditAfterSubmit: true,
  },
  printTemplate: {
    headerTitle: 'برگه رسمی ثبت نام خدمات روانشناسی بالحق',
    showQrCode: true,
    showTrackingCode: true,
    showDate: true,
    borderStyle: 'formal',
    customFooterText: 'سایت روانشناسی بالحق - ثبت نام با موفقیت انجام شد.',
  },
  notifications: {
    smsAdminEnabled: true,
    smsUserEnabled: true,
    emailAdminEnabled: false,
  },
  behavior: {
    redirectAfterSubmit: false,
    customSuccessMessage: 'ثبت نام شما در سامانه روانشناسی بالحق با موفقیت انجام شد.',
    showSummaryAfterSubmit: true,
    allowDownloadPdfReceipt: true,
    nextChainedForm: {
      formId: 'form-belhagh-booking',
      formSlug: '3uu4z',
      title: 'سامانه نوبت دهی مشاوره تلفنی',
      buttonText: 'بازگشت به صفحه اصلی و ورود به سامانه نوبت‌دهی',
      description: 'ثبت نام شما با موفقیت تکمیل شد. اکنون برای اخذ نوبت، بر روی کلید «بازگشت به صفحه اصلی» کلیک فرمایید تا با درج کد پرونده در قسمت ورود، نوبت مشاوره خود را رزرو نمایید:',
      prefillMapping: {
        f_mobile: 'f_mobile',
        f_province_city: 'f_province_city',
      },
    },
  },
  generalSettings: {
    identifierColor: '#084d3e',
    showPortalGate: true,
    portalTitle: 'مرکز خدمات روانشناسی بالحق',
    portalSubtitle: 'سامانه مشاوره تلفنی و پرونده مراجعین',
    portalHeroImage: '/images/belhagh-hero.png',
    showPortalHeroImage: true,
    liveChatEnabled: true,
  },
  theme: {
    themeId: 'belhagh_official',
    themeColor: '#0284c7',
    backgroundGradient: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    fontFamily: 'vazirmatn',
    borderRadius: 'xl',
    formWidth: 'standard',
    titleColor: '#0f172a',
    textColor: '#334155',
    labelColor: '#0f172a',
    buttonColor: '#0284c7',
    buttonTextColor: '#ffffff',
  },
};

export const belhaghBookingForm: Form = {
  id: 'form-belhagh-booking',
  title: 'سامانه نوبت دهی مشاوره تلفنی',
  slug: '3uu4z',
  description: 'سایت روانشناسی بالحق',
  category: 'روانشناسی و سلامت',
  mode: 'wizard',
  status: 'published',
  submissionCount: 89,
  viewCount: 1420,
  createdAt: '2026-03-01T08:30:00Z',
  updatedAt: '2026-04-15T12:00:00Z',
  steps: [
    {
      id: 'step-1',
      title: 'اطلاعات پرونده و تماس',
      description: 'نوبت‌دهی با کد پرونده مشاوره بالحق',
      fieldIds: ['f_case_code', 'f_mobile'],
    },
    {
      id: 'step-2',
      title: 'شهر محل سکونت',
      description: 'تعیین موقعیت استانی و شهری',
      fieldIds: ['f_province_city'],
    },
    {
      id: 'step-3',
      title: 'سابقه مشاوره',
      description: 'سوابق جلسات و تایید عضویت',
      fieldIds: ['f_for_whom', 'f_prev_consultation', 'f_prev_counselor_name', 'f_khankaram_member'],
    },
    {
      id: 'step-4',
      title: 'موضوع و زمان مشاوره',
      description: 'انتخاب مشاور، تقویم زمانی و رزرو وقت',
      fieldIds: ['f_booking'],
    },
    {
      id: 'step-5',
      title: 'قوانین و راهنما',
      description: 'تایید شرایط و قوانین نوبت‌دهی',
      fieldIds: ['f_alert_guideline', 'f_terms'],
    },
  ],
  fields: [
    // مرحله ۱: اطلاعات پرونده و تماس
    {
      id: 'f_case_code',
      type: 'text',
      label: 'کد پرونده مشاوره:',
      placeholder: 'مثال: SP260120',
      helpText: 'کد پرونده اختصاصی شما که در زمان ثبت‌نام صادر گردیده است',
      stepId: 'step-1',
      gridCols: 12,
      validations: { required: true },
    },
    {
      id: 'f_mobile',
      type: 'mobile',
      label: 'شماره تلفن همراه:',
      placeholder: '۰۹۱۲۳۴۵۶۷۸۹',
      helpText: 'تماس تلفنی مشاور با این شماره برقرار خواهد شد',
      stepId: 'step-1',
      gridCols: 12,
      validations: { required: true },
    },

    // مرحله ۲: شهر محل سکونت
    {
      id: 'f_province_city',
      type: 'cascadingProvinceCity',
      label: 'لیست استان و شهرستان',
      stepId: 'step-2',
      gridCols: 12,
      validations: { required: true },
    },

    // مرحله ۳: سابقه مشاوره
    {
      id: 'f_for_whom',
      type: 'select',
      label: 'دریافت نوبت برای:',
      stepId: 'step-3',
      gridCols: 12,
      validations: { required: true },
      options: [
        { id: 'self', label: 'خودم', value: 'خودم' },
        { id: 'spouse', label: 'همسرم', value: 'همسرم' },
        { id: 'children', label: 'فرزندانم', value: 'فرزندانم' },
        { id: 'both', label: 'بنده و همسرم', value: 'بنده و همسرم' },
      ],
    },
    {
      id: 'f_prev_consultation',
      type: 'select',
      label: 'تا کنون با مشاوران ما نوبت داشته اید؟',
      stepId: 'step-3',
      gridCols: 12,
      validations: { required: true },
      options: [
        { id: 'yes', label: 'بله', value: 'بله' },
        { id: 'no', label: 'خیر', value: 'خیر' },
      ],
    },
    {
      id: 'f_prev_counselor_name',
      type: 'text',
      label: 'نام مشاور یا مشاوران سابق؟',
      placeholder: 'نام مشاورانی که قبلاً با آنها جلسه داشته‌اید...',
      stepId: 'step-3',
      gridCols: 12,
      validations: { required: true, customErrorMessage: 'درج نام مشاوران سابق الزامی است.' },
    },
    {
      id: 'f_khankaram_member',
      type: 'select',
      label: 'عضو سایت خوان کرم و عبادالله هستید؟',
      stepId: 'step-3',
      gridCols: 12,
      validations: { required: true },
      options: [
        { id: 'yes', label: 'بله', value: 'بله' },
        { id: 'no', label: 'خیر', value: 'خیر' },
      ],
    },

    // مرحله ۴: موضوع و زمان مشاوره (فیلد یکپارچه و هوشمند رزرو نوبت)
    {
      id: 'f_booking',
      type: 'appointmentBooking',
      label: 'موضوع مشاوره، انتخاب مشاور و رزرو نوبت',
      placeholder: 'موضوع و مشاور مورد نظر را انتخاب و نوبت خود را تعیین فرمایید',
      helpText: 'لطفاً موضوع مشاوره، مشاور و زمان مورد نظر خود را برای جلسه مشاوره تلفنی انتخاب فرمایید.',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: true },
      appointmentData: {
        slotDurationMinutes: 45,
        restTimeMinutes: 15,
        availableDays: [0, 1, 2, 3, 4],
        startHour: '09:00',
        endHour: '20:30',
        selectedConsultants: [
          {
            consultantId: 'user-counselor-borhani',
            consultantName: 'علیرضا برهانی',
            genderPrefix: 'آقا',
            enabled: true,
            enabledTopics: ['نوجوان', 'خانواده'],
          },
          {
            consultantId: 'user-counselor-farahmandi',
            consultantName: 'یاسر فرهمندی',
            genderPrefix: 'آقا',
            enabled: true,
            enabledTopics: ['کودک'],
          },
          {
            consultantId: 'user-counselor-shavandi',
            consultantName: 'شوندی',
            genderPrefix: 'خانم',
            enabled: true,
            enabledTopics: ['کودک', 'نوجوان'],
          },
          {
            consultantId: 'user-counselor-teymourian',
            consultantName: 'تیموریان',
            genderPrefix: 'خانم',
            enabled: true,
            enabledTopics: ['کودک'],
          },
          {
            consultantId: 'user-counselor-torshizi',
            consultantName: 'جعفر ترشیزی',
            genderPrefix: 'آقا',
            enabled: true,
            enabledTopics: ['بالینی', 'فردی'],
          },
        ],
      },
    },

    // راهنمای عمومی و تعهدنامه
    {
      id: 'f_alert_guideline',
      type: 'alertBox',
      label: 'راهنمای نوبت:',
      helpText: 'نوبت شما پس از ثبت قطعی گردیده و پیامک تاییدیه به همراه شماره تماس مشاور برای شما ارسال خواهد شد.',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: false },
    },
    {
      id: 'f_terms',
      type: 'termsCheckbox',
      label: 'شرایط و ضوابط سامانه نوبت‌دهی مشاوره تلفنی بالحق را مطالعه کرده و می‌پذیرم.',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: true },
    },
  ],
  rules: [
    // نمایش فیلد نام مشاور سابق در صورت داشتن سابقه قبلی
    {
      id: 'rule_prev_counselor',
      sourceFieldId: 'f_prev_consultation',
      operator: 'equals',
      value: 'بله',
      action: 'show',
      targetFieldId: 'f_prev_counselor_name',
      customDescription: 'اگر تا کنون با مشاوران ما نوبت داشته اید؟ برابر با بله بود نام مشاور یا مشاوران سابق؟ آشکار شود، غیر از این شرایط پنهان شود',
    },
  ],
  payment: {
    enabled: false,
    type: 'fixed',
    gateway: 'shaparak_mellat',
    currency: 'IRT',
  },
  quiz: {
    enabled: false,
    durationMinutes: 0,
    passingScore: 0,
    negativeMarking: false,
    shuffleQuestions: false,
    showImmediateResult: false,
    certificateEnabled: false,
  },
  security: {
    authRequired: false,
    otpLogin: false,
    onePerNationalCode: false,
    onePerMobile: false,
    limitByIp: false,
    allowEditAfterSubmit: true,
  },
  printTemplate: {
    headerTitle: 'برگه رسمی ثبت نام خدمات روانشناسی بالحق',
    showQrCode: true,
    showTrackingCode: true,
    showDate: true,
    borderStyle: 'formal',
    customFooterText: 'سایت روانشناسی بالحق - ثبت نام با موفقیت انجام شد.',
  },
  notifications: {
    smsAdminEnabled: true,
    smsUserEnabled: true,
    emailAdminEnabled: false,
  },
  behavior: {
    redirectAfterSubmit: false,
    customSuccessMessage: 'ثبت نام شما در سامانه روانشناسی بالحق با موفقیت انجام شد.',
    showSummaryAfterSubmit: true,
    allowDownloadPdfReceipt: true,
    nextChainedForm: {
      formId: 'form-belhagh-booking',
      formSlug: '3uu4z',
      title: 'سامانه نوبت دهی مشاوره تلفنی',
      buttonText: 'بازگشت به صفحه اصلی و ورود به سامانه نوبت‌دهی',
      description: 'ثبت نام شما با موفقیت تکمیل شد. اکنون برای اخذ نوبت، بر روی کلید «بازگشت به صفحه اصلی» کلیک فرمایید تا با درج کد پرونده در قسمت ورود، نوبت مشاوره خود را رزرو نمایید:',
      prefillMapping: {
        f_mobile: 'f_mobile',
        f_province_city: 'f_province_city',
      },
    },
  },
  generalSettings: {
    identifierColor: '#084d3e',
    showPortalGate: true,
    portalTitle: 'مرکز خدمات روانشناسی بالحق',
    portalSubtitle: 'سامانه مشاوره تلفنی و پرونده مراجعین',
    portalHeroImage: '/images/belhagh-hero.png',
    showPortalHeroImage: true,
    liveChatEnabled: true,
  },
  theme: {
    themeId: 'belhagh_official',
    themeColor: '#0284c7',
    backgroundGradient: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
    fontFamily: 'vazirmatn',
    borderRadius: 'xl',
    formWidth: 'standard',
    titleColor: '#0f172a',
    textColor: '#334155',
    labelColor: '#0f172a',
    buttonColor: '#0284c7',
    buttonTextColor: '#ffffff',
  },
};

export const safaanAssessmentForm: Form = {
  "id": "form-safaan-assessment",
  "title": "پرسشنامه جامع خودسنجی صفاً",
  "slug": "safaan",
  "description": "سنجش علمی و هوشمند مسیر سلامت، بلوغ فردی و جهت‌گیری قرآنی ـ ولایی زندگی (شامل ۱۷ مؤلفه و ۵۷ سؤال لیکرت ۵ گزینه‌ای)",
  "category": "روانشناسی و سلامت",
  "mode": "wizard",
  "status": "published",
  "submissionCount": 124,
  "viewCount": 940,
  "createdAt": "2026-03-15T09:00:00Z",
  "updatedAt": "2026-10-28T20:00:00Z",
  "steps": [
    {
      "id": "step-comp-1",
      "title": "مؤلفه 1: آرامش و صلح درونی",
      "description": "توانایی حفظ ثبات روانی و آرامش در شرایط غیرمنتظره و فشارهای روانی.",
      "fieldIds": [
        "q_safa_1",
        "q_safa_2",
        "q_safa_3"
      ]
    },
    {
      "id": "step-comp-2",
      "title": "مؤلفه 2: خودآگاهی",
      "description": "شناخت دقیق ریشه‌های هیجانات، دلایل واکنش‌ها و سهم خود در تعارض‌ها.",
      "fieldIds": [
        "q_safa_4",
        "q_safa_5",
        "q_safa_6"
      ]
    },
    {
      "id": "step-comp-3",
      "title": "مؤلفه 3: پذیرش خود و تلاش برای بهتر شدن",
      "description": "دیدن نقص‌ها بدون سرزنش ویرانگر خود و استقبال واقع‌بینانه از نقد و اصلاح.",
      "fieldIds": [
        "q_safa_7",
        "q_safa_8",
        "q_safa_9"
      ]
    },
    {
      "id": "step-comp-4",
      "title": "مؤلفه 4: تعقل و خردورزی",
      "description": "بررسی سنجیده پیامد تصمیم‌ها، پذیرش شواهد تازه و دوری از پیش‌داوری شتابزده.",
      "fieldIds": [
        "q_safa_10",
        "q_safa_11",
        "q_safa_12"
      ]
    },
    {
      "id": "step-comp-5",
      "title": "مؤلفه 5: کنترل و مدیریت هیجان",
      "description": "ایجاد فاصله میان انگیزش و واکنش، و مهار خشم بدون آسیب‌رسانی به روابط.",
      "fieldIds": [
        "q_safa_13",
        "q_safa_14",
        "q_safa_15"
      ]
    },
    {
      "id": "step-comp-6",
      "title": "مؤلفه 6: رهایی از توقع و وابستگی",
      "description": "خدمت بی‌چشم‌داشت، استقلال ارزشی از نگاه دیگران و اجتناب از باج‌دهی عاطفی.",
      "fieldIds": [
        "q_safa_16",
        "q_safa_17",
        "q_safa_18"
      ]
    },
    {
      "id": "step-comp-7",
      "title": "مؤلفه 7: محبت و خیرخواهی",
      "description": "شادی از توفیق دیگران، لحاظ کردن خیر عمومی و کمک خالصانه بدون طلب پاداش.",
      "fieldIds": [
        "q_safa_19",
        "q_safa_20",
        "q_safa_21"
      ]
    },
    {
      "id": "step-comp-8",
      "title": "مؤلفه 8: پذیرش دیگران و پرهیز از قضاوت",
      "description": "احترام به تفاوت‌ها، فهم بستر رفتاری افراد و تفکیک نقد عمل از داوری شخصیت.",
      "fieldIds": [
        "q_safa_22",
        "q_safa_23",
        "q_safa_24"
      ]
    },
    {
      "id": "step-comp-9",
      "title": "مؤلفه 9: گذشت و بخشش",
      "description": "عبور از خطای گذشته، دیدن واقع‌بینانه افراد و پایان دادن به بازپخش کینه‌ها.",
      "fieldIds": [
        "q_safa_25",
        "q_safa_26",
        "q_safa_27"
      ]
    },
    {
      "id": "step-comp-10",
      "title": "مؤلفه 10: همدلی",
      "description": "فهم عمیق دنیای هیجانی دیگران پیش از نسخه‌پیچی، حتی در شرایط اختلاف نظر.",
      "fieldIds": [
        "q_safa_28",
        "q_safa_29",
        "q_safa_30"
      ]
    },
    {
      "id": "step-comp-11",
      "title": "مؤلفه 11: مرزبندی سالم",
      "description": "مهارت قاطعانه «نه» گفتن محترمانه، خط‌کشی در برابر سوءاستفاده و دفاع منطقی از حق.",
      "fieldIds": [
        "q_safa_31",
        "q_safa_32",
        "q_safa_33"
      ]
    },
    {
      "id": "step-comp-12",
      "title": "مؤلفه 12: صداقت و هماهنگی حرف و عمل",
      "description": "وفای به عهد، تطابق ادعا با رفتار روزمره و شفافیت بدون نقاب در روابط.",
      "fieldIds": [
        "q_safa_34",
        "q_safa_35",
        "q_safa_36"
      ]
    },
    {
      "id": "step-comp-13",
      "title": "مؤلفه 13: مسئولیت‌پذیری و وفاداری",
      "description": "پذیرش پیامد اشتباه و اهتمام به جبران آن، و پاسداری متعهدانه از پیوندهای انسانی.",
      "fieldIds": [
        "q_safa_37",
        "q_safa_38",
        "q_safa_39"
      ]
    },
    {
      "id": "step-comp-14",
      "title": "مؤلفه 14: فروتنی",
      "description": "شجاعت اعتراف به ندانستن، یادگیری متواضعانه از داناترها و پذیرش خطاپذیری خود.",
      "fieldIds": [
        "q_safa_40",
        "q_safa_41",
        "q_safa_42"
      ]
    },
    {
      "id": "step-comp-15",
      "title": "مؤلفه 15: رشددهندگی و خیررسانی",
      "description": "توانمندسازی دیگران برای استقلال، تذکر مشفقانه و محترمانه، و شوق به تعالی انسان‌ها.",
      "fieldIds": [
        "q_safa_43",
        "q_safa_44",
        "q_safa_45"
      ]
    },
    {
      "id": "step-comp-16",
      "title": "مؤلفه 16: سازندگی و پیونددهندگی در روابط",
      "description": "تمرکز بر حل مسئله به جای مچ‌گیری، پیشگیری از دودستگی و ترمیم هوشمندانه ارتباطات.",
      "fieldIds": [
        "q_safa_46",
        "q_safa_47",
        "q_safa_48"
      ]
    },
    {
      "id": "step-comp-17",
      "title": "مؤلفه 17: غایت، معنا و جهت‌گیری قرآنی ـ ولایی",
      "description": "تنظیم آگاهانه افق زندگی بر پایه عبودیت، ارزش‌های قرآنی و تبعیت از الگوی اهل‌بیت(ع).",
      "fieldIds": [
        "q_safa_49",
        "q_safa_50",
        "q_safa_51",
        "q_safa_52",
        "q_safa_53",
        "q_safa_54",
        "q_safa_55",
        "q_safa_56",
        "q_safa_57"
      ]
    }
  ],
  "fields": [
    {
      "id": "q_safa_1",
      "type": "likertScale",
      "label": "سؤال 1: وقتی شرایط مطابق انتظارم پیش نمی‌رود، می‌توانم آرامش خودم را حفظ کنم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-1",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «آرامش و صلح درونی»"
    },
    {
      "id": "q_safa_2",
      "type": "likertScale",
      "label": "سؤال 2: حتی در شرایط سخت و پراسترس، می‌توانم ثبات و آرامش خودم را تا حد زیادی حفظ کنم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-1",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «آرامش و صلح درونی»"
    },
    {
      "id": "q_safa_3",
      "type": "likertScale",
      "label": "سؤال 3: یک اتفاق یا ناراحتی کوچک معمولاً نمی‌تواند تمام حال و آرامش من را به‌هم بریزد.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-1",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «آرامش و صلح درونی»"
    },
    {
      "id": "q_safa_4",
      "type": "likertScale",
      "label": "سؤال 4: معمولاً می‌فهمم چه چیزی باعث ناراحتی، عصبانیت یا نگرانی من شده است.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-2",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «خودآگاهی»"
    },
    {
      "id": "q_safa_5",
      "type": "likertScale",
      "label": "سؤال 5: وقتی واکنش شدیدی نشان می‌دهم، می‌توانم بعداً دلیل آن را در خودم بررسی کنم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-2",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «خودآگاهی»"
    },
    {
      "id": "q_safa_6",
      "type": "likertScale",
      "label": "سؤال 6: در اختلاف‌ها می‌توانم سهم و نقش خودم را در ایجاد یا ادامهٔ مشکل ببینم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-2",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «خودآگاهی»"
    },
    {
      "id": "q_safa_7",
      "type": "likertScale",
      "label": "سؤال 7: می‌توانم ضعف‌ها و اشتباهات خودم را ببینم، بدون اینکه خودم را تحقیر کنم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-3",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «پذیرش خود و تلاش برای بهتر شدن»"
    },
    {
      "id": "q_safa_8",
      "type": "likertScale",
      "label": "سؤال 8: وقتی متوجه اشتباه خودم می‌شوم، برای اصلاح آن اقدام می‌کنم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-3",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «پذیرش خود و تلاش برای بهتر شدن»"
    },
    {
      "id": "q_safa_9",
      "type": "likertScale",
      "label": "سؤال 9: وقتی کسی ایرادی واقعی در رفتار من می‌گیرد، می‌توانم پیش از دفاع‌کردن، دربارهٔ حرفش فکر کنم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-3",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «پذیرش خود و تلاش برای بهتر شدن»"
    },
    {
      "id": "q_safa_10",
      "type": "likertScale",
      "label": "سؤال 10: پیش از تصمیم‌های مهم، پیامدهای احتمالی انتخابم را بررسی می‌کنم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-4",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «تعقل و خردورزی»"
    },
    {
      "id": "q_safa_11",
      "type": "likertScale",
      "label": "سؤال 11: اگر با دلیل یا شواهدی روبه‌رو شوم که با نظر من متفاوت است، می‌توانم در دیدگاهم تجدیدنظر کنم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-4",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «تعقل و خردورزی»"
    },
    {
      "id": "q_safa_12",
      "type": "likertScale",
      "label": "سؤال 12: پیش از قضاوت دربارهٔ یک فرد یا اتفاق، تلاش می‌کنم اطلاعات و شواهد کافی داشته باشم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-4",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «تعقل و خردورزی»"
    },
    {
      "id": "q_safa_13",
      "type": "likertScale",
      "label": "سؤال 13: وقتی عصبانی می‌شوم، می‌توانم پیش از واکنش کمی فاصله بگیرم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-5",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «کنترل و مدیریت هیجان»"
    },
    {
      "id": "q_safa_14",
      "type": "likertScale",
      "label": "سؤال 14: می‌توانم ناراحتی یا خشم خودم را بدون توهین یا آسیب‌زدن به دیگران بیان کنم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-5",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «کنترل و مدیریت هیجان»"
    },
    {
      "id": "q_safa_15",
      "type": "likertScale",
      "label": "سؤال 15: وقتی هیجان شدیدی دارم، می‌توانم رفتار خودم را مدیریت کنم تا بعداً از آن پشیمان نشوم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-5",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «کنترل و مدیریت هیجان»"
    },
    {
      "id": "q_safa_16",
      "type": "likertScale",
      "label": "سؤال 16: اگر برای کسی کاری انجام دهم، لزوماً انتظار ندارم همان کار را برای من انجام دهد.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-6",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «رهایی از توقع و وابستگی»"
    },
    {
      "id": "q_safa_17",
      "type": "likertScale",
      "label": "سؤال 17: اگر دیگران آن‌طور که انتظار دارم به من توجه نکنند، ارزش خودم را زیر سؤال نمی‌برم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-6",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «رهایی از توقع و وابستگی»"
    },
    {
      "id": "q_safa_18",
      "type": "likertScale",
      "label": "سؤال 18: برای به‌دست‌آوردن محبت یا تأیید دیگران، خودم را بیش از حد تغییر نمی‌دهم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-6",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «رهایی از توقع و وابستگی»"
    },
    {
      "id": "q_safa_19",
      "type": "likertScale",
      "label": "سؤال 19: وقتی بتوانم، بدون انتظار پاداش به دیگران کمک می‌کنم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-7",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «محبت و خیرخواهی»"
    },
    {
      "id": "q_safa_20",
      "type": "likertScale",
      "label": "سؤال 20: موفقیت و خوشحالی دیگران می‌تواند واقعاً مرا خوشحال کند.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-7",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «محبت و خیرخواهی»"
    },
    {
      "id": "q_safa_21",
      "type": "likertScale",
      "label": "سؤال 21: هنگام تصمیم‌گیری، علاوه بر منافع خودم، خیر و منافع دیگران را نیز در نظر می‌گیرم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-7",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «محبت و خیرخواهی»"
    },
    {
      "id": "q_safa_22",
      "type": "likertScale",
      "label": "سؤال 22: می‌توانم با کسی که دیدگاه یا سبک زندگی متفاوتی دارد، رابطه‌ای محترمانه داشته باشم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-8",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «پذیرش دیگران و پرهیز از قضاوت»"
    },
    {
      "id": "q_safa_23",
      "type": "likertScale",
      "label": "سؤال 23: پیش از قضاوت دربارهٔ رفتار کسی، تلاش می‌کنم شرایط و دلیل رفتارش را بفهمم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-8",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «پذیرش دیگران و پرهیز از قضاوت»"
    },
    {
      "id": "q_safa_24",
      "type": "likertScale",
      "label": "سؤال 24: وقتی رفتار کسی را نمی‌پسندم، می‌توانم میان نپسندیدن یک رفتار و ارزش‌گذاری دربارهٔ شخصیت آن فرد تفاوت بگذارم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-8",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «پذیرش دیگران و پرهیز از قضاوت»"
    },
    {
      "id": "q_safa_25",
      "type": "likertScale",
      "label": "سؤال 25: می‌توانم به‌تدریج از ناراحتی ناشی از خطاهای دیگران عبور کنم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-9",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «گذشت و بخشش»"
    },
    {
      "id": "q_safa_26",
      "type": "likertScale",
      "label": "سؤال 26: می‌توانم خطای یک فرد را در اندازهٔ واقعی خودش ببینم و اجازه ندهم یک رفتار بد، تمام خوبی‌های او را از بین ببرد.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-9",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «گذشت و بخشش»"
    },
    {
      "id": "q_safa_27",
      "type": "likertScale",
      "label": "سؤال 27: می‌توانم پس از عذرخواهی یا اصلاح یک رفتار، اتفاق گذشته را دوباره و دوباره به رابطه برنگردانم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-9",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «گذشت و بخشش»"
    },
    {
      "id": "q_safa_28",
      "type": "likertScale",
      "label": "سؤال 28: وقتی کسی ناراحت است، پیش از ارائهٔ راه‌حل سعی می‌کنم احساس او را بفهمم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-10",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «همدلی»"
    },
    {
      "id": "q_safa_29",
      "type": "likertScale",
      "label": "سؤال 29: می‌توانم احساسات کسی را درک کنم، حتی اگر با رفتار یا نظر او موافق نباشم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-10",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «همدلی»"
    },
    {
      "id": "q_safa_30",
      "type": "likertScale",
      "label": "سؤال 30: هنگام اختلاف، علاوه بر احساس و خواستهٔ خودم، احساس و خواستهٔ طرف مقابل را هم در نظر می‌گیرم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-10",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «همدلی»"
    },
    {
      "id": "q_safa_31",
      "type": "likertScale",
      "label": "سؤال 31: وقتی کاری را نمی‌خواهم یا نمی‌توانم انجام دهم، می‌توانم محترمانه «نه» بگویم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-11",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «مرزبندی سالم»"
    },
    {
      "id": "q_safa_32",
      "type": "likertScale",
      "label": "سؤال 32: اگر کسی از محبت یا اعتماد من سوءاستفاده کند، می‌توانم برای رابطه حدومرز تعیین کنم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-11",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «مرزبندی سالم»"
    },
    {
      "id": "q_safa_33",
      "type": "likertScale",
      "label": "سؤال 33: می‌توانم بدون پرخاشگری از حق و نیاز منطقی خودم دفاع کنم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-11",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «مرزبندی سالم»"
    },
    {
      "id": "q_safa_34",
      "type": "likertScale",
      "label": "سؤال 34: چیزی را که از دیگران انتظار دارم، تا حد زیادی خودم نیز رعایت می‌کنم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-12",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «صداقت و هماهنگی حرف و عمل»"
    },
    {
      "id": "q_safa_35",
      "type": "likertScale",
      "label": "سؤال 35: اگر قولی بدهم، برای انجام‌دادن آن جدی هستم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-12",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «صداقت و هماهنگی حرف و عمل»"
    },
    {
      "id": "q_safa_36",
      "type": "likertScale",
      "label": "سؤال 36: در روابط با دیگران می‌توانم خود واقعی‌ام را نشان دهم و نیازی ندارم خودم را بهتر از آنچه هستم نشان بدهم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-12",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «صداقت و هماهنگی حرف و عمل»"
    },
    {
      "id": "q_safa_37",
      "type": "likertScale",
      "label": "سؤال 37: وقتی اشتباه می‌کنم، می‌توانم مسئولیت آن را بپذیرم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-13",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «مسئولیت‌پذیری و وفاداری»"
    },
    {
      "id": "q_safa_38",
      "type": "likertScale",
      "label": "سؤال 38: وقتی رفتارم به کسی آسیب می‌زند، برای جبران آن اقدام می‌کنم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-13",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «مسئولیت‌پذیری و وفاداری»"
    },
    {
      "id": "q_safa_39",
      "type": "likertScale",
      "label": "سؤال 39: برای حفظ روابط مهم زندگی‌ام، حتی در زمان اختلاف و ناراحتی، مسئولانه تلاش می‌کنم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-13",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «مسئولیت‌پذیری و وفاداری»"
    },
    {
      "id": "q_safa_40",
      "type": "likertScale",
      "label": "سؤال 40: می‌توانم به‌راحتی بگویم «نمی‌دانم».",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-14",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «فروتنی»"
    },
    {
      "id": "q_safa_41",
      "type": "likertScale",
      "label": "سؤال 41: وقتی کسی در زمینه‌ای از من آگاه‌تر یا باتجربه‌تر است، می‌توانم بدون احساس برتری‌طلبی از او یاد بگیرم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-14",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «فروتنی»"
    },
    {
      "id": "q_safa_42",
      "type": "likertScale",
      "label": "سؤال 42: وقتی متوجه می‌شوم اشتباه کرده‌ام، می‌توانم آن را بپذیرم و در صورت نیاز از دیگران بازخورد بگیرم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-14",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «فروتنی»"
    },
    {
      "id": "q_safa_43",
      "type": "likertScale",
      "label": "سؤال 43: وقتی به کسی کمک می‌کنم، ترجیح می‌دهم او در آینده بتواند روی پای خودش بایستد.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-15",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «رشددهندگی و خیررسانی»"
    },
    {
      "id": "q_safa_44",
      "type": "likertScale",
      "label": "سؤال 44: هنگام تذکردادن به دیگران، تلاش می‌کنم هم محبت را حفظ کنم و هم نکتهٔ لازم را محترمانه بیان کنم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-15",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «رشددهندگی و خیررسانی»"
    },
    {
      "id": "q_safa_45",
      "type": "likertScale",
      "label": "سؤال 45: از اینکه دیگران با کمک یا راهنمایی من رشد و پیشرفت کنند، خوشحال می‌شوم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-15",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «رشددهندگی و خیررسانی»"
    },
    {
      "id": "q_safa_46",
      "type": "likertScale",
      "label": "سؤال 46: در اختلاف‌ها بیشتر به‌دنبال حل مسئله و نزدیک‌شدن افراد هستم تا پیدا کردن مقصر.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-16",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «سازندگی و پیونددهندگی در روابط»"
    },
    {
      "id": "q_safa_47",
      "type": "likertScale",
      "label": "سؤال 47: در روابط، مراقب هستم حرف یا رفتار من باعث بدبینی، فاصله یا بی‌اعتمادی میان افراد نشود.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-16",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «سازندگی و پیونددهندگی در روابط»"
    },
    {
      "id": "q_safa_48",
      "type": "likertScale",
      "label": "سؤال 48: وقتی رابطه‌ای برای من مهم است، برای حفظ و ترمیم آن تلاش می‌کنم و اجازه نمی‌دهم یک حرف، شایعه یا اختلاف کوچک به‌راحتی آن را تخریب کند.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-16",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «سازندگی و پیونددهندگی در روابط»"
    },
    {
      "id": "q_safa_49",
      "type": "likertScale",
      "label": "سؤال 49: در زندگی، هدفی فراتر از رفاه، درآمد، موقعیت، شهرت و موفقیت شخصی برای خودم در نظر گرفته‌ام.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-17",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «غایت، معنا و جهت‌گیری قرآنی ـ ولایی»"
    },
    {
      "id": "q_safa_50",
      "type": "likertScale",
      "label": "سؤال 50: در تصمیم‌های مهم زندگی، به این فکر می‌کنم که انتخاب من مرا به چه نوع انسانی تبدیل خواهد کرد.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-17",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «غایت، معنا و جهت‌گیری قرآنی ـ ولایی»"
    },
    {
      "id": "q_safa_51",
      "type": "likertScale",
      "label": "سؤال 51: در انتخاب‌های مهم زندگی، تلاش می‌کنم ببینم تصمیم من تا چه اندازه با آنچه خداوند درست و شایسته می‌داند هماهنگ است.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-17",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «غایت، معنا و جهت‌گیری قرآنی ـ ولایی»"
    },
    {
      "id": "q_safa_52",
      "type": "likertScale",
      "label": "سؤال 52: وقتی خواستهٔ شخصی من با یک ارزش اخلاقی و الهی تعارض پیدا می‌کند، می‌توانم خواستهٔ خودم را محدود کنم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-17",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «غایت، معنا و جهت‌گیری قرآنی ـ ولایی»"
    },
    {
      "id": "q_safa_53",
      "type": "likertScale",
      "label": "سؤال 53: تلاش می‌کنم ارزش‌هایی مانند صداقت، عدالت، احسان، گذشت، وفای به عهد و پرهیز از ظلم در رفتار روزمره‌ام دیده شوند.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-17",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «غایت، معنا و جهت‌گیری قرآنی ـ ولایی»"
    },
    {
      "id": "q_safa_54",
      "type": "likertScale",
      "label": "سؤال 54: وقتی متوجه می‌شوم یکی از رفتارها یا عادت‌های من با ارزش‌هایی که به آنها باور دارم سازگار نیست، برای اصلاح آن اقدام می‌کنم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-17",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «غایت، معنا و جهت‌گیری قرآنی ـ ولایی»"
    },
    {
      "id": "q_safa_55",
      "type": "likertScale",
      "label": "سؤال 55: محبت و باور من به اهل‌بیت(ع) در انتخاب‌ها و رفتارهای روزمره‌ام نیز اثر می‌گذارد.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-17",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «غایت، معنا و جهت‌گیری قرآنی ـ ولایی»"
    },
    {
      "id": "q_safa_56",
      "type": "likertScale",
      "label": "سؤال 56: در مسیر رشد خودم، تلاش می‌کنم رفتار و اخلاقم را به الگوهایی که از پیامبر(ص) و اهل‌بیت(ع) آموخته‌ام نزدیک‌تر کنم.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-17",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «غایت، معنا و جهت‌گیری قرآنی ـ ولایی»"
    },
    {
      "id": "q_safa_57",
      "type": "likertScale",
      "label": "سؤال 57: وقتی بین منفعت شخصی و مسیری که آن را حق و مورد رضایت خداوند می‌دانم قرار می‌گیرم، تلاش می‌کنم منفعت شخصی تنها معیار تصمیم من نباشد.",
      "placeholder": "یکی از گزینه‌ها را انتخاب کنید",
      "stepId": "step-comp-17",
      "gridCols": 12,
      "validations": {
        "required": true
      },
      "options": [
        {
          "id": "opt-1",
          "label": "تقریباً هیچ وقت",
          "value": "1",
          "score": 1
        },
        {
          "id": "opt-2",
          "label": "بهندرت",
          "value": "2",
          "score": 2
        },
        {
          "id": "opt-3",
          "label": "گاهی",
          "value": "3",
          "score": 3
        },
        {
          "id": "opt-4",
          "label": "بیشتر اوقات",
          "value": "4",
          "score": 4
        },
        {
          "id": "opt-5",
          "label": "تقریباً همیشه",
          "value": "5",
          "score": 5
        }
      ],
      "helpText": "مربوط به مؤلفه «غایت، معنا و جهت‌گیری قرآنی ـ ولایی»"
    }
  ],
  "rules": [],
  "payment": {
    "enabled": false,
    "type": "fixed",
    "gateway": "zarinpal",
    "currency": "IRT"
  },
  "quiz": {
    "enabled": false,
    "durationMinutes": 0,
    "passingScore": 70,
    "negativeMarking": false,
    "shuffleQuestions": false,
    "showImmediateResult": true,
    "certificateEnabled": false
  },
  "evaluation": {
    "enabled": true,
    "chartType": "radar",
    "showGrowthPriorities": true,
    "showAlignmentAnalysis": true,
    "scaleMin": 1,
    "scaleMax": 5,
    "components": [
      {
        "id": "comp-1",
        "code": 1,
        "title": "آرامش و صلح درونی",
        "description": "توانایی حفظ ثبات روانی و آرامش در شرایط غیرمنتظره و فشارهای روانی.",
        "questionFieldIds": [
          "q_safa_1",
          "q_safa_2",
          "q_safa_3"
        ],
        "minRaw": 3,
        "maxRaw": 15,
        "group": "behavioral"
      },
      {
        "id": "comp-2",
        "code": 2,
        "title": "خودآگاهی",
        "description": "شناخت دقیق ریشه‌های هیجانات، دلایل واکنش‌ها و سهم خود در تعارض‌ها.",
        "questionFieldIds": [
          "q_safa_4",
          "q_safa_5",
          "q_safa_6"
        ],
        "minRaw": 3,
        "maxRaw": 15,
        "group": "behavioral"
      },
      {
        "id": "comp-3",
        "code": 3,
        "title": "پذیرش خود و تلاش برای بهتر شدن",
        "description": "دیدن نقص‌ها بدون سرزنش ویرانگر خود و استقبال واقع‌بینانه از نقد و اصلاح.",
        "questionFieldIds": [
          "q_safa_7",
          "q_safa_8",
          "q_safa_9"
        ],
        "minRaw": 3,
        "maxRaw": 15,
        "group": "behavioral"
      },
      {
        "id": "comp-4",
        "code": 4,
        "title": "تعقل و خردورزی",
        "description": "بررسی سنجیده پیامد تصمیم‌ها، پذیرش شواهد تازه و دوری از پیش‌داوری شتابزده.",
        "questionFieldIds": [
          "q_safa_10",
          "q_safa_11",
          "q_safa_12"
        ],
        "minRaw": 3,
        "maxRaw": 15,
        "group": "behavioral"
      },
      {
        "id": "comp-5",
        "code": 5,
        "title": "کنترل و مدیریت هیجان",
        "description": "ایجاد فاصله میان انگیزش و واکنش، و مهار خشم بدون آسیب‌رسانی به روابط.",
        "questionFieldIds": [
          "q_safa_13",
          "q_safa_14",
          "q_safa_15"
        ],
        "minRaw": 3,
        "maxRaw": 15,
        "group": "behavioral"
      },
      {
        "id": "comp-6",
        "code": 6,
        "title": "رهایی از توقع و وابستگی",
        "description": "خدمت بی‌چشم‌داشت، استقلال ارزشی از نگاه دیگران و اجتناب از باج‌دهی عاطفی.",
        "questionFieldIds": [
          "q_safa_16",
          "q_safa_17",
          "q_safa_18"
        ],
        "minRaw": 3,
        "maxRaw": 15,
        "group": "behavioral"
      },
      {
        "id": "comp-7",
        "code": 7,
        "title": "محبت و خیرخواهی",
        "description": "شادی از توفیق دیگران، لحاظ کردن خیر عمومی و کمک خالصانه بدون طلب پاداش.",
        "questionFieldIds": [
          "q_safa_19",
          "q_safa_20",
          "q_safa_21"
        ],
        "minRaw": 3,
        "maxRaw": 15,
        "group": "behavioral"
      },
      {
        "id": "comp-8",
        "code": 8,
        "title": "پذیرش دیگران و پرهیز از قضاوت",
        "description": "احترام به تفاوت‌ها، فهم بستر رفتاری افراد و تفکیک نقد عمل از داوری شخصیت.",
        "questionFieldIds": [
          "q_safa_22",
          "q_safa_23",
          "q_safa_24"
        ],
        "minRaw": 3,
        "maxRaw": 15,
        "group": "behavioral"
      },
      {
        "id": "comp-9",
        "code": 9,
        "title": "گذشت و بخشش",
        "description": "عبور از خطای گذشته، دیدن واقع‌بینانه افراد و پایان دادن به بازپخش کینه‌ها.",
        "questionFieldIds": [
          "q_safa_25",
          "q_safa_26",
          "q_safa_27"
        ],
        "minRaw": 3,
        "maxRaw": 15,
        "group": "behavioral"
      },
      {
        "id": "comp-10",
        "code": 10,
        "title": "همدلی",
        "description": "فهم عمیق دنیای هیجانی دیگران پیش از نسخه‌پیچی، حتی در شرایط اختلاف نظر.",
        "questionFieldIds": [
          "q_safa_28",
          "q_safa_29",
          "q_safa_30"
        ],
        "minRaw": 3,
        "maxRaw": 15,
        "group": "behavioral"
      },
      {
        "id": "comp-11",
        "code": 11,
        "title": "مرزبندی سالم",
        "description": "مهارت قاطعانه «نه» گفتن محترمانه، خط‌کشی در برابر سوءاستفاده و دفاع منطقی از حق.",
        "questionFieldIds": [
          "q_safa_31",
          "q_safa_32",
          "q_safa_33"
        ],
        "minRaw": 3,
        "maxRaw": 15,
        "group": "behavioral"
      },
      {
        "id": "comp-12",
        "code": 12,
        "title": "صداقت و هماهنگی حرف و عمل",
        "description": "وفای به عهد، تطابق ادعا با رفتار روزمره و شفافیت بدون نقاب در روابط.",
        "questionFieldIds": [
          "q_safa_34",
          "q_safa_35",
          "q_safa_36"
        ],
        "minRaw": 3,
        "maxRaw": 15,
        "group": "behavioral"
      },
      {
        "id": "comp-13",
        "code": 13,
        "title": "مسئولیت‌پذیری و وفاداری",
        "description": "پذیرش پیامد اشتباه و اهتمام به جبران آن، و پاسداری متعهدانه از پیوندهای انسانی.",
        "questionFieldIds": [
          "q_safa_37",
          "q_safa_38",
          "q_safa_39"
        ],
        "minRaw": 3,
        "maxRaw": 15,
        "group": "behavioral"
      },
      {
        "id": "comp-14",
        "code": 14,
        "title": "فروتنی",
        "description": "شجاعت اعتراف به ندانستن، یادگیری متواضعانه از داناترها و پذیرش خطاپذیری خود.",
        "questionFieldIds": [
          "q_safa_40",
          "q_safa_41",
          "q_safa_42"
        ],
        "minRaw": 3,
        "maxRaw": 15,
        "group": "behavioral"
      },
      {
        "id": "comp-15",
        "code": 15,
        "title": "رشددهندگی و خیررسانی",
        "description": "توانمندسازی دیگران برای استقلال، تذکر مشفقانه و محترمانه، و شوق به تعالی انسان‌ها.",
        "questionFieldIds": [
          "q_safa_43",
          "q_safa_44",
          "q_safa_45"
        ],
        "minRaw": 3,
        "maxRaw": 15,
        "group": "behavioral"
      },
      {
        "id": "comp-16",
        "code": 16,
        "title": "سازندگی و پیونددهندگی در روابط",
        "description": "تمرکز بر حل مسئله به جای مچ‌گیری، پیشگیری از دودستگی و ترمیم هوشمندانه ارتباطات.",
        "questionFieldIds": [
          "q_safa_46",
          "q_safa_47",
          "q_safa_48"
        ],
        "minRaw": 3,
        "maxRaw": 15,
        "group": "behavioral"
      },
      {
        "id": "comp-17",
        "code": 17,
        "title": "غایت، معنا و جهت‌گیری قرآنی ـ ولایی",
        "description": "تنظیم آگاهانه افق زندگی بر پایه عبودیت، ارزش‌های قرآنی و تبعیت از الگوی اهل‌بیت(ع).",
        "questionFieldIds": [
          "q_safa_49",
          "q_safa_50",
          "q_safa_51",
          "q_safa_52",
          "q_safa_53",
          "q_safa_54",
          "q_safa_55",
          "q_safa_56",
          "q_safa_57"
        ],
        "minRaw": 9,
        "maxRaw": 45,
        "group": "faith"
      }
    ]
  },
  "security": {
    "authRequired": false,
    "otpLogin": false,
    "onePerNationalCode": false,
    "onePerMobile": false,
    "limitByIp": false,
    "allowEditAfterSubmit": true
  },
  "printTemplate": {
    "headerTitle": "کارنامه جامع خودسنجی صفاً - مرکز مشاوره و روانشناسی بالحق",
    "showQrCode": true,
    "showTrackingCode": true,
    "showDate": true,
    "borderStyle": "formal",
    "paperSize": "A4",
    "orientation": "portrait",
    "customFooterText": "سامانه خودسنجی مسیر رشد و بلوغ بالحق - صفاً"
  },
  "notifications": {
    "smsAdminEnabled": false,
    "smsUserEnabled": false,
    "emailAdminEnabled": false
  },
  "behavior": {
    "redirectAfterSubmit": false,
    "customSuccessMessage": "پاسخ‌های شما با موفقیت ثبت شد و کارنامه تحلیلی صفاً تولید گردید.",
    "showSummaryAfterSubmit": true,
    "allowDownloadPdfReceipt": true
  },
  "theme": {
    "themeColor": "#0284c7",
    "fontFamily": "vazirmatn",
    "borderRadius": "md",
    "formWidth": "wide"
  },
  "generalSettings": {
    "identifierColor": "#0284c7",
    "portalTitle": "سامانه خودسنجی صفاً",
    "portalSubtitle": "مسیر سلامت، بلوغ و جهت‌گیری قرآنی ـ ولایی",
    "liveChatEnabled": true
  }
};
