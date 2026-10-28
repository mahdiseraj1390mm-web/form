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
      validations: { required: false },
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
      validations: { required: false },
    },
    {
      id: 'f_school_supervisor',
      type: 'text',
      label: 'ناظم مدرسه:',
      stepId: 'step-3',
      gridCols: 12,
      validations: { required: false },
    },
    {
      id: 'f_mentor_name',
      type: 'text',
      label: 'نام مربی تربیتی:',
      stepId: 'step-3',
      gridCols: 12,
      validations: { required: false },
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
      fieldIds: [
        'f_topic',
        // مشاوران بر اساس موضوع
        'f_counselor_child',
        'f_counselor_teen',
        'f_counselor_education',
        'f_counselor_clinical',
        'f_counselor_family',
        // رزرواسیون بر اساس مشاور انتخابی
        'f_booking_farahmandi',
        'f_booking_teymourian',
        'f_booking_shavandi_child',
        'f_booking_ansari_child',
        'f_booking_zeynali_child',
        'f_booking_borhani_teen',
        'f_booking_shavandi_teen',
        'f_booking_rastgoo_teen',
        'f_booking_ansari_teen',
        'f_booking_abdi_education',
        'f_booking_torshizi',
        'f_booking_yavari',
        'f_booking_rastgoo_clinical',
        'f_booking_golyayi_clinical',
        'f_booking_sedighi_family',
        'f_booking_borhani_family',
        'f_booking_zeynali_family',
        'f_booking_karimi_family',
        'f_booking_abdi_family',
        // شماره تماس و تاییدیه مشاور
        'f_phone_farahmandi',
        'f_phone_teymourian',
        'f_phone_shavandi',
        'f_phone_ansari',
        'f_phone_ansari_teen',
        'f_phone_zeynali',
        'f_phone_zeynali_family',
        'f_phone_borhani',
        'f_phone_borhani_family',
        'f_phone_rastgoo',
        'f_phone_rastgoo_clin',
        'f_phone_abdi',
        'f_phone_torshizi',
        'f_phone_yavari',
        'f_phone_golyayi',
        'f_phone_sedighi',
        'f_phone_karimi',
        'f_phone_abdi_family',
        // راهنما و شرایط
        'f_alert_guideline',
        'f_terms',
      ],
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
      validations: { required: false },
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

    // مرحله ۴: موضوع و زمان مشاوره
    {
      id: 'f_topic',
      type: 'select',
      label: 'موضوع مراجعه؟',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: true, searchable: true },
      options: [
        { id: 'opt_topic_1', label: 'کودک', value: 'کودک' },
        { id: 'opt_topic_2', label: 'نوجوان', value: 'نوجوان' },
        { id: 'opt_topic_3', label: 'تحصیلی', value: 'تحصیلی' },
        { id: 'opt_topic_4', label: 'بالینی (اضطراب، افسردگی، وسواس)', value: 'بالینی (اضطراب، افسردگی، وسواس)' },
        { id: 'opt_topic_5', label: 'ازدواج و خانواده', value: 'ازدواج و خانواده' },
      ],
    },

    // فهرست مشاوران بر اساس موضوع
    {
      id: 'f_counselor_child',
      type: 'select',
      label: 'مشاوران کودک',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: true },
      options: [
        { id: 'opt_child_1', label: 'آقای فرهمندی', value: 'آقای فرهمندی' },
        { id: 'opt_child_2', label: 'خانم تیموریان', value: 'خانم تیموریان' },
        { id: 'opt_child_3', label: 'خانم شوندی', value: 'خانم شوندی' },
        { id: 'opt_child_4', label: 'خانم انصاری', value: 'خانم انصاری' },
        { id: 'opt_child_5', label: 'خانم زینلی', value: 'خانم زینلی' },
      ],
    },
    {
      id: 'f_counselor_teen',
      type: 'select',
      label: 'مشاوران نوجوان',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: true },
      options: [
        { id: 'opt_teen_1', label: 'آقای برهانی', value: 'آقای برهانی' },
        { id: 'opt_teen_2', label: 'خانم شوندی', value: 'خانم شوندی' },
        { id: 'opt_teen_3', label: 'خانم راستگو', value: 'خانم راستگو' },
        { id: 'opt_teen_4', label: 'خانم انصاری', value: 'خانم انصاری' },
      ],
    },
    {
      id: 'f_counselor_education',
      type: 'select',
      label: 'مشاوران تحصیلی',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: true },
      options: [
        { id: 'opt_edu_abdi', label: 'آقای عبدی', value: 'آقای عبدی' },
      ],
    },
    {
      id: 'f_counselor_clinical',
      type: 'select',
      label: 'مشاوران بالینی',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: true },
      options: [
        { id: 'opt_clin_torshizi', label: 'آقای دکتر ترشیزی (فعلاً بدون نوبت‌دهی)', value: 'آقای ترشیزی' },
        { id: 'opt_clin_yavari', label: 'خانم یاوری', value: 'خانم یاوری' },
        { id: 'opt_clin_rastgoo', label: 'خانم راستگو', value: 'خانم راستگو' },
        { id: 'opt_clin_golyayi', label: 'خانم گلیایی', value: 'خانم گلیایی' },
      ],
    },
    {
      id: 'f_counselor_family',
      type: 'select',
      label: 'مشاوران ازدواج و خانواده:',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: true },
      options: [
        { id: 'opt_fam_sedighi', label: 'دکتر صدیقی (بدون روز و نوبت‌دهی)', value: 'آقای صدیقی (ازدواج و خانواده)' },
        { id: 'opt_fam_borhani', label: 'آقا برهانی', value: 'آقای برهانی (ازدواج و خانواده)' },
        { id: 'opt_fam_zeynali', label: 'خانم زینلی', value: 'خانم زینلی (خانواده)' },
        { id: 'opt_fam_karimi', label: 'خانم کریمی', value: 'خانم کریمی (خانواده)' },
        { id: 'opt_fam_abdi', label: 'خانم عبدی', value: 'خانم عبدی (خانواده)' },
      ],
    },

    // رزرواسیون اختصاصی مشاوران کودک
    {
      id: 'f_booking_farahmandi',
      type: 'appointmentBooking',
      label: 'رزرو نوبت از آقای فرهمندی',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: true },
      appointmentData: {
        slotDurationMinutes: 30,
        restTimeMinutes: 0,
        availableDays: [6], // جمعه
        startHour: '09:00',
        endHour: '12:00',
        holidays: [],
      },
      options: [
        { id: 'slot_farahmandi_1', label: 'جمعه - ساعت ۰۹:۰۰ الی ۰۹:۴۵', value: 'fri_0900' },
        { id: 'slot_farahmandi_2', label: 'جمعه - ساعت ۱۰:۰۰ الی ۱۰:۴۵', value: 'fri_1000' },
        { id: 'slot_farahmandi_3', label: 'جمعه - ساعت ۱۱:۰۰ الی ۱۱:۴۵', value: 'fri_1100' },
      ],
    },
    {
      id: 'f_phone_farahmandi',
      type: 'alertBox',
      label: 'شماره تماس آقای یاسر فرهمندی: 09364280322',
      helpText: 'شماره تماس آقای یاسر فرهمندی: ۰۹۳۶۴۲۸۰۳۲۲',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: false },
    },

    {
      id: 'f_booking_teymourian',
      type: 'appointmentBooking',
      label: 'رزرو نوبت از خانم تیموریان',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: true },
      appointmentData: {
        slotDurationMinutes: 30,
        restTimeMinutes: 5,
        availableDays: [4], // چهارشنبه
        startHour: '10:00',
        endHour: '13:00',
        holidays: ['جمعه'],
      },
      options: [
        { id: 'slot_teymourian_1', label: 'چهارشنبه - ساعت ۱۰:۰۰ الی ۱۰:۴۵', value: 'wed_1000' },
        { id: 'slot_teymourian_2', label: 'چهارشنبه - ساعت ۱۱:۰۰ الی ۱۱:۴۵', value: 'wed_1100' },
        { id: 'slot_teymourian_3', label: 'چهارشنبه - ساعت ۱۲:۰۰ الی ۱۲:۴۵', value: 'wed_1200' },
      ],
    },
    {
      id: 'f_phone_teymourian',
      type: 'alertBox',
      label: 'شماره تماس خانم تیموریان: 09140288938',
      helpText: 'شماره تماس خانم تیموریان: ۰۹۱۴۰۲۸۸۹۳۸',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: false },
    },

    {
      id: 'f_booking_shavandi_child',
      type: 'appointmentBooking',
      label: 'رزرو نوبت مشاوره کودک از خانم شوندی',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: true },
      appointmentData: {
        slotDurationMinutes: 60,
        restTimeMinutes: 0,
        availableDays: [0, 2, 4], // شنبه، دوشنبه و چهارشنبه
        startHour: '13:00',
        endHour: '15:00',
        holidays: ['جمعه'],
      },
      options: [
        { id: 'slot_shavandi_c1', label: 'شنبه - ساعت ۱۳:۰۰ الی ۱۳:۴۵', value: 'sat_1300' },
        { id: 'slot_shavandi_c2', label: 'شنبه - ساعت ۱۴:۰۰ الی ۱۴:۴۵', value: 'sat_1400' },
        { id: 'slot_shavandi_c3', label: 'دوشنبه - ساعت ۱۳:۰۰ الی ۱۳:۴۵', value: 'mon_1300' },
        { id: 'slot_shavandi_c4', label: 'دوشنبه - ساعت ۱۴:۰۰ الی ۱۴:۴۵', value: 'mon_1400' },
        { id: 'slot_shavandi_c5', label: 'چهارشنبه - ساعت ۱۳:۰۰ الی ۱۳:۴۵', value: 'wed_1300' },
        { id: 'slot_shavandi_c6', label: 'چهارشنبه - ساعت ۱۴:۰۰ الی ۱۴:۴۵', value: 'wed_1400' },
      ],
    },
    {
      id: 'f_phone_shavandi',
      type: 'alertBox',
      label: 'شماره تماس سر کار خانم شوندی: 09127944985',
      helpText: 'شماره تماس سر کار خانم شوندی: ۰۹۱۲۷۹۴۴۹۸۵',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: false },
    },

    {
      id: 'f_booking_ansari_child',
      type: 'appointmentBooking',
      label: 'رزرو نوبت کودک از خانم انصاری',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: true },
      appointmentData: {
        slotDurationMinutes: 60,
        restTimeMinutes: 0,
        availableDays: [1], // یکشنبه
        startHour: '16:00',
        endHour: '19:00',
        holidays: ['جمعه'],
      },
      options: [
        { id: 'slot_ansari_c1', label: 'یکشنبه - ساعت ۱۶:۰۰ الی ۱۶:۴۵', value: 'sun_1600' },
        { id: 'slot_ansari_c2', label: 'یکشنبه - ساعت ۱۷:۰۰ الی ۱۷:۴۵', value: 'sun_1700' },
        { id: 'slot_ansari_c3', label: 'یکشنبه - ساعت ۱۸:۰۰ الی ۱۸:۴۵', value: 'sun_1800' },
      ],
    },
    {
      id: 'f_phone_ansari',
      type: 'alertBox',
      label: 'شماره تماس خانم انصاری: 09122301387',
      helpText: 'شماره تماس خانم انصاری: ۰۹۱۲۲۳۰۱۳۸۷',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: false },
    },

    {
      id: 'f_booking_zeynali_child',
      type: 'appointmentBooking',
      label: 'رزرو نوبت کودک خانم زینلی',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: true },
      appointmentData: {
        slotDurationMinutes: 45,
        restTimeMinutes: 15,
        availableDays: [5], // پنجشنبه
        startHour: '09:00',
        endHour: '11:00',
        holidays: ['جمعه'],
      },
      options: [
        { id: 'slot_zeynali_c1', label: 'پنجشنبه - ساعت ۰۹:۰۰ الی ۰۹:۴۵', value: 'thu_0900' },
        { id: 'slot_zeynali_c2', label: 'پنجشنبه - ساعت ۱۰:۰۰ الی ۱۰:۴۵', value: 'thu_1000' },
      ],
    },
    {
      id: 'f_phone_zeynali',
      type: 'alertBox',
      label: 'شماره تماس سرکار خانم زینلی: 09379709635',
      helpText: 'شماره تماس سرکار خانم زینلی: ۰۹۳۷۹۷۰۹۶۳۵',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: false },
    },

    // رزرواسیون اختصاصی مشاوران نوجوان
    {
      id: 'f_booking_borhani_teen',
      type: 'appointmentBooking',
      label: 'رزرو نوبت نوجوان از آقای برهانی',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: true },
      appointmentData: {
        slotDurationMinutes: 45,
        restTimeMinutes: 15,
        availableDays: [0, 1, 2], // شنبه تا دوشنبه
        startHour: '14:00',
        endHour: '15:00',
        holidays: ['جمعه'],
      },
      options: [
        { id: 'slot_borhani_t1', label: 'شنبه - ساعت ۱۴:۰۰ الی ۱۴:۴۵', value: 'sat_1400' },
        { id: 'slot_borhani_t2', label: 'یکشنبه - ساعت ۱۴:۰۰ الی ۱۴:۴۵', value: 'sun_1400' },
        { id: 'slot_borhani_t3', label: 'دوشنبه - ساعت ۱۴:۰۰ الی ۱۴:۴۵', value: 'mon_1400' },
      ],
    },
    {
      id: 'f_phone_borhani',
      type: 'alertBox',
      label: 'شماره تماس آقای علیرضا برهانی: 09120449093',
      helpText: 'روزهای نوبت‌دهی نوجوان: شنبه تا دوشنبه ساعت ۱۴:۰۰ الی ۱۵:۰۰ (یک نوبت ۴۵ دقیقه‌ای) | شماره تماس: ۰۹۱۲۰۴۴۹۰۹۳',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: false },
    },

    {
      id: 'f_booking_shavandi_teen',
      type: 'appointmentBooking',
      label: 'رزرو نوبت نوجوان از خانم شوندی',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: true },
      appointmentData: {
        slotDurationMinutes: 60,
        restTimeMinutes: 0,
        availableDays: [1, 3], // یکشنبه و سه‌شنبه
        startHour: '13:00',
        endHour: '15:00',
        holidays: ['جمعه'],
      },
      options: [
        { id: 'slot_shavandi_t1', label: 'یکشنبه - ساعت ۱۳:۰۰ الی ۱۳:۴۵', value: 'sun_1300' },
        { id: 'slot_shavandi_t2', label: 'یکشنبه - ساعت ۱۴:۰۰ الی ۱۴:۴۵', value: 'sun_1400' },
        { id: 'slot_shavandi_t3', label: 'سه شنبه - ساعت ۱۳:۰۰ الی ۱۳:۴۵', value: 'tue_1300' },
        { id: 'slot_shavandi_t4', label: 'سه شنبه - ساعت ۱۴:۰۰ الی ۱۴:۴۵', value: 'tue_1400' },
      ],
    },
    {
      id: 'f_phone_shavandi_teen',
      type: 'alertBox',
      label: 'شماره تماس خانم شوندی: 09127944985',
      helpText: 'شماره تماس سر کار خانم شوندی: ۰۹۱۲۷۹۴۴۹۸۵',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: false },
    },

    {
      id: 'f_booking_rastgoo_teen',
      type: 'appointmentBooking',
      label: 'رزرو نوبت از خانم راستگو',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: true },
      appointmentData: {
        slotDurationMinutes: 60,
        restTimeMinutes: 0,
        availableDays: [1], // یکشنبه
        startHour: '10:00',
        endHour: '14:00',
        holidays: ['جمعه'],
      },
      options: [
        { id: 'slot_rastgoo_t1', label: 'یکشنبه - ساعت ۱۰:۰۰ الی ۱۰:۴۵', value: 'sun_1000' },
        { id: 'slot_rastgoo_t2', label: 'یکشنبه - ساعت ۱۱:۰۰ الی ۱۱:۴۵', value: 'sun_1100' },
        { id: 'slot_rastgoo_t3', label: 'یکشنبه - ساعت ۱۲:۰۰ الی ۱۲:۴۵', value: 'sun_1200' },
        { id: 'slot_rastgoo_t4', label: 'یکشنبه - ساعت ۱۳:۰۰ الی ۱۳:۴۵', value: 'sun_1300' },
      ],
    },
    {
      id: 'f_phone_rastgoo_teen',
      type: 'alertBox',
      label: 'شماره تماس سرکار خانم راستگو: 09123069447',
      helpText: 'شماره تماس سرکار خانم راستگو: ۰۹۱۲۳۰۶۹۴۴۷',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: false },
    },

    {
      id: 'f_booking_ansari_teen',
      type: 'appointmentBooking',
      label: 'رزرو نوبت نوجوان از خانم انصاری',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: true },
      appointmentData: {
        slotDurationMinutes: 60,
        restTimeMinutes: 0,
        availableDays: [0, 3], // شنبه و سه‌شنبه
        startHour: '11:00',
        endHour: '16:00',
        holidays: ['جمعه'],
      },
      options: [
        { id: 'slot_ansari_t1', label: 'شنبه - نوبت اول: ساعت ۱۱:۰۰ الی ۱۱:۴۵', value: 'sat_1100' },
        { id: 'slot_ansari_t2', label: 'شنبه - نوبت دوم: ساعت ۱۴:۰۰ الی ۱۴:۴۵', value: 'sat_1400' },
        { id: 'slot_ansari_t3', label: 'شنبه - نوبت دوم: ساعت ۱۵:۰۰ الی ۱۵:۴۵', value: 'sat_1500' },
        { id: 'slot_ansari_t4', label: 'سه شنبه - نوبت اول: ساعت ۱۱:۰۰ الی ۱۱:۴۵', value: 'tue_1100' },
        { id: 'slot_ansari_t5', label: 'سه شنبه - نوبت دوم: ساعت ۱۴:۰۰ الی ۱۴:۴۵', value: 'tue_1400' },
        { id: 'slot_ansari_t6', label: 'سه شنبه - نوبت دوم: ساعت ۱۵:۰۰ الی ۱۵:۴۵', value: 'tue_1500' },
      ],
    },
    {
      id: 'f_phone_ansari_teen',
      type: 'alertBox',
      label: 'شماره تماس خانم نوشین انصاری: 09122301387',
      helpText: 'شماره تماس خانم نوشین انصاری: ۰۹۱۲۲۳۰۱۳۸۷',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: false },
    },

    // رزرواسیون اختصاصی مشاور تحصیلی
    {
      id: 'f_booking_abdi_education',
      type: 'appointmentBooking',
      label: 'رزرو نوبت از آقای عبدی',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: true },
      appointmentData: {
        slotDurationMinutes: 60,
        restTimeMinutes: 0,
        availableDays: [3, 4], // سه‌شنبه و چهارشنبه
        startHour: '16:00',
        endHour: '18:00',
        holidays: ['جمعه'],
      },
      options: [
        { id: 'slot_abdi_1', label: 'سه شنبه - ساعت ۱۶:۰۰ الی ۱۶:۴۵', value: 'tue_1600' },
        { id: 'slot_abdi_2', label: 'سه شنبه - ساعت ۱۷:۰۰ الی ۱۷:۴۵', value: 'tue_1700' },
        { id: 'slot_abdi_3', label: 'چهارشنبه - ساعت ۱۶:۰۰ الی ۱۶:۴۵', value: 'wed_1600' },
        { id: 'slot_abdi_4', label: 'چهارشنبه - ساعت ۱۷:۰۰ الی ۱۷:۴۵', value: 'wed_1700' },
      ],
    },
    {
      id: 'f_phone_abdi',
      type: 'alertBox',
      label: 'شماره تماس آقای عبدی: 09127853843',
      helpText: 'شماره تماس آقای عبدی: ۰۹۱۲۷۸۵۳۸۴۳',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: false },
    },

    // رزرواسیون اختصاصی مشاوران بالینی
    {
      id: 'f_booking_torshizi',
      type: 'appointmentBooking',
      label: 'رزرو نوبت از آقای دکتر ترشیزی',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: false },
      appointmentData: {
        slotDurationMinutes: 30,
        restTimeMinutes: 0,
        availableDays: [],
        startHour: '00:00',
        endHour: '00:00',
        holidays: [],
      },
      options: [],
    },
    {
      id: 'f_phone_torshizi',
      type: 'alertBox',
      label: 'شماره تماس جناب آقای دکتر ترشیزی: 09155513734',
      helpText: 'در حال حاضر برای جناب آقای دکتر ترشیزی در بخش بالینی نوبتی تعریف نشده است. جهت هماهنگی با شماره ۰۹۱۵۵۵۱۳۷۳۴ تماس حاصل فرمایید.',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: false },
    },

    {
      id: 'f_booking_yavari',
      type: 'appointmentBooking',
      label: 'رزرو نوبت از خانم یاوری',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: true },
      appointmentData: {
        slotDurationMinutes: 60,
        restTimeMinutes: 0,
        availableDays: [0, 3], // شنبه و سه‌شنبه
        startHour: '11:00',
        endHour: '14:00',
        holidays: ['جمعه'],
      },
      options: [
        { id: 'slot_yavari_1', label: 'شنبه - ساعت ۱۱:۰۰ الی ۱۱:۴۵', value: 'sat_1100' },
        { id: 'slot_yavari_2', label: 'سه شنبه - ساعت ۱۳:۰۰ الی ۱۳:۴۵', value: 'tue_1300' },
      ],
    },
    {
      id: 'f_phone_yavari',
      type: 'alertBox',
      label: 'شماره تماس خانم یاوری: 09307556919',
      helpText: 'شماره تماس خانم یاوری: ۰۹۳۰۷۵۵۶۹۱۹',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: false },
    },

    {
      id: 'f_booking_rastgoo_clinical',
      type: 'appointmentBooking',
      label: 'رزرو نوبت بالینی خانم راستگو',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: true },
      appointmentData: {
        slotDurationMinutes: 60,
        restTimeMinutes: 0,
        availableDays: [1], // یکشنبه
        startHour: '18:00',
        endHour: '20:00',
        holidays: ['جمعه'],
      },
      options: [
        { id: 'slot_rastgoo_c1', label: 'یکشنبه - ساعت ۱۸:۰۰ الی ۱۸:۴۵', value: 'sun_1800' },
        { id: 'slot_rastgoo_c2', label: 'یکشنبه - ساعت ۱۹:۰۰ الی ۱۹:۴۵', value: 'sun_1900' },
      ],
    },
    {
      id: 'f_phone_rastgoo_clin',
      type: 'alertBox',
      label: 'شماره تماس خانم راستگو: 09123069447',
      helpText: 'شماره تماس سرکار خانم راستگو: ۰۹۱۲۳۰۶۹۴۴۷',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: false },
    },

    {
      id: 'f_booking_golyayi_clinical',
      type: 'appointmentBooking',
      label: 'رزرو نوبت بالینی خانم گلیایی',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: true },
      appointmentData: {
        slotDurationMinutes: 60,
        restTimeMinutes: 0,
        availableDays: [2], // دوشنبه
        startHour: '11:00',
        endHour: '12:00',
        holidays: ['جمعه'],
      },
      options: [
        { id: 'slot_golyayi_1', label: 'دوشنبه - ساعت ۱۱:۰۰ الی ۱۱:۴۵', value: 'mon_1100' },
      ],
    },
    {
      id: 'f_phone_golyayi',
      type: 'alertBox',
      label: 'شماره تماس سرکار خانم گلیایی: 09125140551',
      helpText: 'شماره تماس سرکار خانم کلیایی: ۰۹۱۲۵۱۴۰۵۵۱',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: false },
    },

    // رزرواسیون اختصاصی مشاوران ازدواج و خانواده
    {
      id: 'f_booking_sedighi_family',
      type: 'appointmentBooking',
      label: 'رزرو نوبت از آقای دکتر صدیقی',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: false },
      appointmentData: {
        slotDurationMinutes: 30,
        restTimeMinutes: 0,
        availableDays: [],
        startHour: '00:00',
        endHour: '00:00',
        holidays: [],
      },
      options: [],
    },
    {
      id: 'f_phone_sedighi',
      type: 'alertBox',
      label: 'شماره تماس جناب آقای دکتر صدیقی: 09151538227',
      helpText: 'در حال حاضر در بخش ازدواج و خانواده روز و نوبتی برای جناب آقای دکتر صدیقی تعریف نشده است. جهت هماهنگی با شماره ۰۹۱۵۱۵۳۸۲۲۷ تماس حاصل فرمایید.',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: false },
    },

    {
      id: 'f_booking_borhani_family',
      type: 'appointmentBooking',
      label: 'رزرو نوبت خانواده و ازدواج از آقای برهانی',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: true },
      appointmentData: {
        slotDurationMinutes: 45,
        restTimeMinutes: 15,
        availableDays: [0, 1, 2], // شنبه تا دوشنبه
        startHour: '18:00',
        endHour: '20:00',
        holidays: ['جمعه'],
      },
      options: [
        { id: 'slot_borhani_f1', label: 'شنبه - ساعت ۱۸:۰۰ الی ۱۸:۴۵', value: 'sat_1800' },
        { id: 'slot_borhani_f2', label: 'شنبه - ساعت ۱۹:۰۰ الی ۱۹:۴۵', value: 'sat_1900' },
        { id: 'slot_borhani_f3', label: 'یکشنبه - ساعت ۱۸:۰۰ الی ۱۸:۴۵', value: 'sun_1800' },
        { id: 'slot_borhani_f4', label: 'یکشنبه - ساعت ۱۹:۰۰ الی ۱۹:۴۵', value: 'sun_1900' },
        { id: 'slot_borhani_f5', label: 'دوشنبه - ساعت ۱۸:۰۰ الی ۱۸:۴۵', value: 'mon_1800' },
        { id: 'slot_borhani_f6', label: 'دوشنبه - ساعت ۱۹:۰۰ الی ۱۹:۴۵', value: 'mon_1900' },
      ],
    },
    {
      id: 'f_phone_borhani_family',
      type: 'alertBox',
      label: 'شماره تماس جناب آقای برهانی: 09120449093',
      helpText: 'روزهای نوبت‌دهی خانواده: شنبه تا دوشنبه ساعت ۱۸:۰۰ الی ۲۰:۰۰ (دو نوبت ۴۵ دقیقه‌ای) | شماره تماس: ۰۹۱۲۰۴۴۹۰۹۳',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: false },
    },

    {
      id: 'f_booking_zeynali_family',
      type: 'appointmentBooking',
      label: 'رزرو نوبت از خانم زینلی',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: true },
      appointmentData: {
        slotDurationMinutes: 30,
        restTimeMinutes: 0,
        availableDays: [3], // سه‌شنبه
        startHour: '17:00',
        endHour: '18:00',
        holidays: ['جمعه'],
      },
      options: [
        { id: 'slot_zeynali_f1', label: 'سه شنبه - ساعت ۱۷:۰۰ الی ۱۷:۴۵', value: 'tue_1700' },
      ],
    },
    {
      id: 'f_phone_zeynali_family',
      type: 'alertBox',
      label: 'شماره تماس سرکار خانم زینلی: 09379709635',
      helpText: 'شماره تماس سرکار خانم زینلی: ۰۹۳۷۹۷۰۹۶۳۵',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: false },
    },

    {
      id: 'f_booking_karimi_family',
      type: 'appointmentBooking',
      label: 'رزرو نوبت از خانم کریمی',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: true },
      appointmentData: {
        slotDurationMinutes: 30,
        restTimeMinutes: 0,
        availableDays: [1, 3], // یکشنبه و سه‌شنبه
        startHour: '10:00',
        endHour: '12:00',
        holidays: ['جمعه'],
      },
      options: [
        { id: 'slot_karimi_1', label: 'یکشنبه - ساعت ۱۰:۰۰ الی ۱۰:۴۵', value: 'sun_1000' },
        { id: 'slot_karimi_2', label: 'یکشنبه - ساعت ۱۱:۰۰ الی ۱۱:۴۵', value: 'sun_1100' },
        { id: 'slot_karimi_3', label: 'سه شنبه - ساعت ۱۰:۰۰ الی ۱۰:۴۵', value: 'tue_1000' },
        { id: 'slot_karimi_4', label: 'سه شنبه - ساعت ۱۱:۰۰ الی ۱۱:۴۵', value: 'tue_1100' },
      ],
    },
    {
      id: 'f_phone_karimi',
      type: 'alertBox',
      label: 'شماره تماس خانم کریمی: 09192180481',
      helpText: 'شماره تماس خانم کریمی: ۰۹۱۹۲۱۸۰۴۸۱',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: false },
    },

    {
      id: 'f_booking_abdi_family',
      type: 'appointmentBooking',
      label: 'رزرو نوبت خانواده از خانم عبدی',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: true },
      appointmentData: {
        slotDurationMinutes: 60,
        restTimeMinutes: 0,
        availableDays: [4], // چهارشنبه
        startHour: '08:00',
        endHour: '13:00',
        holidays: ['جمعه'],
      },
      options: [
        { id: 'slot_abdi_f1', label: 'چهارشنبه - ساعت ۰۸:۰۰ الی ۰۸:۴۵', value: 'wed_0800' },
        { id: 'slot_abdi_f2', label: 'چهارشنبه - ساعت ۰۹:۰۰ الی ۰۹:۴۵', value: 'wed_0900' },
        { id: 'slot_abdi_f3', label: 'چهارشنبه - ساعت ۱۰:۰۰ الی ۱۰:۴۵', value: 'wed_1000' },
        { id: 'slot_abdi_f4', label: 'چهارشنبه - ساعت ۱۱:۰۰ الی ۱۱:۴۵', value: 'wed_1100' },
        { id: 'slot_abdi_f5', label: 'چهارشنبه - ساعت ۱۲:۰۰ الی ۱۲:۴۵', value: 'wed_1200' },
      ],
    },
    {
      id: 'f_phone_abdi_family',
      type: 'alertBox',
      label: 'شماره تماس خانم عبدی: 09192886258',
      helpText: 'شماره تماس خانم عبدی: ۰۹۱۹۲۸۸۶۲۵۸',
      stepId: 'step-4',
      gridCols: 12,
      validations: { required: false },
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
      value: 'yes',
      action: 'show',
      targetFieldId: 'f_prev_counselor_name',
    },

    // نمایش لیست مشاوران بر اساس موضوع انتخابی (مطابق با عکس ۳)
    {
      id: 'rule_topic_child',
      sourceFieldId: 'f_topic',
      operator: 'equals',
      value: 'کودک',
      action: 'show',
      targetFieldId: 'f_counselor_child',
    },
    {
      id: 'rule_topic_education',
      sourceFieldId: 'f_topic',
      operator: 'equals',
      value: 'تحصیلی',
      action: 'show',
      targetFieldId: 'f_counselor_education',
    },
    {
      id: 'rule_topic_clinical',
      sourceFieldId: 'f_topic',
      operator: 'equals',
      value: 'بالینی (اضطراب، افسردگی، وسواس)',
      action: 'show',
      targetFieldId: 'f_counselor_clinical',
    },
    {
      id: 'rule_topic_family',
      sourceFieldId: 'f_topic',
      operator: 'equals',
      value: 'ازدواج و خانواده',
      action: 'show',
      targetFieldId: 'f_counselor_family',
    },
    {
      id: 'rule_topic_teen',
      sourceFieldId: 'f_topic',
      operator: 'equals',
      value: 'نوجوان',
      action: 'show',
      targetFieldId: 'f_counselor_teen',
    },

    // مشاوران کودک: نمایش تقویم نوبت و شماره تماس (مطابق با عکس ۵)
    {
      id: 'rule_child_farahmandi',
      sourceFieldId: 'f_counselor_child',
      operator: 'equals',
      value: 'آقای فرهمندی',
      action: 'show',
      targetFieldId: 'f_booking_farahmandi',
      additionalTargetFieldId: 'f_phone_farahmandi',
      targetFieldIds: ['f_booking_farahmandi', 'f_phone_farahmandi'],
    },
    {
      id: 'rule_child_zeynali',
      sourceFieldId: 'f_counselor_child',
      operator: 'equals',
      value: 'خانم زینلی',
      action: 'show',
      targetFieldId: 'f_booking_zeynali_child',
      additionalTargetFieldId: 'f_phone_zeynali',
      targetFieldIds: ['f_booking_zeynali_child', 'f_phone_zeynali'],
    },
    {
      id: 'rule_child_shavandi',
      sourceFieldId: 'f_counselor_child',
      operator: 'equals',
      value: 'خانم شوندی',
      action: 'show',
      targetFieldId: 'f_booking_shavandi_child',
      additionalTargetFieldId: 'f_phone_shavandi',
      targetFieldIds: ['f_booking_shavandi_child', 'f_phone_shavandi'],
    },
    {
      id: 'rule_child_ansari',
      sourceFieldId: 'f_counselor_child',
      operator: 'equals',
      value: 'خانم انصاری',
      action: 'show',
      targetFieldId: 'f_booking_ansari_child',
      additionalTargetFieldId: 'f_phone_ansari',
      targetFieldIds: ['f_booking_ansari_child', 'f_phone_ansari'],
    },
    {
      id: 'rule_child_teymourian',
      sourceFieldId: 'f_counselor_child',
      operator: 'equals',
      value: 'خانم تیموریان',
      action: 'show',
      targetFieldId: 'f_booking_teymourian',
      additionalTargetFieldId: 'f_phone_teymourian',
      targetFieldIds: ['f_booking_teymourian', 'f_phone_teymourian'],
    },

    // مشاوران نوجوان: شروط نمایش تقویم نوبت و شماره تماس (دقیقاً مطابق عکس ۱)
    {
      id: 'rule_teen_shavandi_booking',
      sourceFieldId: 'f_counselor_teen',
      operator: 'equals',
      value: 'خانم شوندی',
      action: 'show',
      targetFieldId: 'f_booking_shavandi_teen',
    },
    {
      id: 'rule_teen_rastgoo_booking',
      sourceFieldId: 'f_counselor_teen',
      operator: 'equals',
      value: 'خانم راستگو',
      action: 'show',
      targetFieldId: 'f_booking_rastgoo_teen',
    },
    {
      id: 'rule_teen_shavandi_phone',
      sourceFieldId: 'f_counselor_teen',
      operator: 'equals',
      value: 'خانم شوندی',
      action: 'show',
      targetFieldId: 'f_phone_shavandi_teen',
    },
    {
      id: 'rule_teen_rastgoo_phone',
      sourceFieldId: 'f_counselor_teen',
      operator: 'equals',
      value: 'خانم راستگو',
      action: 'show',
      targetFieldId: 'f_phone_rastgoo_teen',
    },
    {
      id: 'rule_teen_borhani',
      sourceFieldId: 'f_counselor_teen',
      operator: 'equals',
      value: 'آقای برهانی',
      action: 'show',
      targetFieldId: 'f_booking_borhani_teen',
      additionalTargetFieldId: 'f_phone_borhani',
      targetFieldIds: ['f_booking_borhani_teen', 'f_phone_borhani'],
    },
    {
      id: 'rule_teen_ansari',
      sourceFieldId: 'f_counselor_teen',
      operator: 'equals',
      value: 'خانم انصاری',
      action: 'show',
      targetFieldId: 'f_booking_ansari_teen',
      additionalTargetFieldId: 'f_phone_ansari_teen',
      targetFieldIds: ['f_booking_ansari_teen', 'f_phone_ansari_teen'],
    },

    // مشاوران تحصیلی: شروط نمایش تقویم نوبت و شماره تماس (دقیقاً مطابق عکس ۲)
    {
      id: 'rule_edu_abdi_booking',
      sourceFieldId: 'f_counselor_education',
      operator: 'equals',
      value: 'آقای عبدی',
      action: 'show',
      targetFieldId: 'f_booking_abdi_education',
    },
    {
      id: 'rule_edu_abdi_phone',
      sourceFieldId: 'f_counselor_education',
      operator: 'equals',
      value: 'آقای عبدی',
      action: 'show',
      targetFieldId: 'f_phone_abdi',
    },

    // مشاوران بالینی: شروط نمایش تقویم نوبت و شماره تماس (دقیقاً مطابق عکس ۳)
    {
      id: 'rule_clin_yavari_booking',
      sourceFieldId: 'f_counselor_clinical',
      operator: 'equals',
      value: 'خانم یاوری',
      action: 'show',
      targetFieldId: 'f_booking_yavari',
    },
    {
      id: 'rule_clin_torshizi_phone',
      sourceFieldId: 'f_counselor_clinical',
      operator: 'equals',
      value: 'آقای ترشیزی',
      action: 'show',
      targetFieldId: 'f_phone_torshizi',
    },
    {
      id: 'rule_clin_yavari_phone',
      sourceFieldId: 'f_counselor_clinical',
      operator: 'equals',
      value: 'خانم یاوری',
      action: 'show',
      targetFieldId: 'f_phone_yavari',
    },
    {
      id: 'rule_clin_rastgoo',
      sourceFieldId: 'f_counselor_clinical',
      operator: 'equals',
      value: 'خانم راستگو',
      action: 'show',
      targetFieldId: 'f_booking_rastgoo_clinical',
      additionalTargetFieldId: 'f_phone_rastgoo_clin',
      targetFieldIds: ['f_booking_rastgoo_clinical', 'f_phone_rastgoo_clin'],
    },
    {
      id: 'rule_clin_golyayi',
      sourceFieldId: 'f_counselor_clinical',
      operator: 'equals',
      value: 'خانم گلیایی',
      action: 'show',
      targetFieldId: 'f_booking_golyayi_clinical',
      additionalTargetFieldId: 'f_phone_golyayi',
      targetFieldIds: ['f_booking_golyayi_clinical', 'f_phone_golyayi'],
    },

    // مشاوران ازدواج و خانواده: شروط نمایش تقویم نوبت و شماره تماس (دقیقاً مطابق با تصاویر ارسالی فرم‌افزار)
    {
      id: 'rule_fam_borhani',
      sourceFieldId: 'f_counselor_family',
      operator: 'equals',
      value: 'آقای برهانی (ازدواج و خانواده)',
      action: 'show',
      targetFieldId: 'f_booking_borhani_family',
      additionalTargetFieldId: 'f_phone_borhani_family',
      targetFieldIds: ['f_booking_borhani_family', 'f_phone_borhani_family'],
    },
    {
      id: 'rule_fam_zeynali_booking',
      sourceFieldId: 'f_counselor_family',
      operator: 'equals',
      value: 'خانم زینلی (خانواده)',
      action: 'show',
      targetFieldId: 'f_booking_zeynali_family',
      customDescription: 'اگر مشاوران ازدواج و خانواده: برابر با خانم زینلی (خانواده) بود رزرو نوبت از خانم زینلی آشکار شود، غیر از این شرایط پنهان شود',
    },
    {
      id: 'rule_fam_karimi_booking',
      sourceFieldId: 'f_counselor_family',
      operator: 'equals',
      value: 'خانم کریمی (خانواده)',
      action: 'show',
      targetFieldId: 'f_booking_karimi_family',
      customDescription: 'اگر مشاوران ازدواج و خانواده: برابر با خانم کریمی (خانواده) بود رزرو نوبت از خانم کریمی آشکار شود، غیر از این شرایط پنهان شود',
    },
    {
      id: 'rule_fam_sedighi_phone',
      sourceFieldId: 'f_counselor_family',
      operator: 'equals',
      value: 'آقای صدیقی (ازدواج و خانواده)',
      action: 'show',
      targetFieldId: 'f_phone_sedighi',
      customDescription: 'اگر مشاوران ازدواج و خانواده: برابر با آقای صدیقی (ازدواج و خانواده) بود شماره تماس آقای صدیقی: 09151538227 آشکار شود، غیر از این شرایط پنهان شود',
    },
    {
      id: 'rule_fam_borhani_phone',
      sourceFieldId: 'f_counselor_family',
      operator: 'equals',
      value: 'آقای برهانی (ازدواج و خانواده)',
      action: 'show',
      targetFieldId: 'f_phone_borhani_family',
      customDescription: 'اگر مشاوران ازدواج و خانواده: برابر با آقای برهانی (ازدواج و خانواده) بود شماره تماس آقای برهانی: 09120449093 آشکار شود، غیر از این شرایط پنهان شود',
    },
    {
      id: 'rule_fam_zeynali_phone',
      sourceFieldId: 'f_counselor_family',
      operator: 'equals',
      value: 'خانم زینلی (خانواده)',
      action: 'show',
      targetFieldId: 'f_phone_zeynali_family',
      customDescription: 'اگر مشاوران ازدواج و خانواده: برابر با خانم زینلی (خانواده) بود شماره تماس سرکار خانم زینلی: 09379709635 آشکار شود، غیر از این شرایط پنهان شود',
    },
    {
      id: 'rule_fam_karimi_phone',
      sourceFieldId: 'f_counselor_family',
      operator: 'equals',
      value: 'خانم کریمی (خانواده)',
      action: 'show',
      targetFieldId: 'f_phone_karimi',
      customDescription: 'اگر مشاوران ازدواج و خانواده: برابر با خانم کریمی (خانواده) بود شماره تماس خانم کریمی: 09192180481 آشکار شود، غیر از این شرایط پنهان شود',
    },
    {
      id: 'rule_fam_abdi',
      sourceFieldId: 'f_counselor_family',
      operator: 'equals',
      value: 'خانم عبدی (خانواده)',
      action: 'show',
      targetFieldId: 'f_booking_abdi_family',
      additionalTargetFieldId: 'f_phone_abdi_family',
      targetFieldIds: ['f_booking_abdi_family', 'f_phone_abdi_family'],
      customDescription: 'اگر مشاوران ازدواج و خانواده: برابر با خانم عبدی (خانواده) بود رزرو نوبت خانواده از خانم عبدی آشکار شود، غیر از این شرایط پنهان شود و شماره تماس خانم عبدی: 09192886258 آشکار شود، غیر از این شرایط پنهان شود',
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
    headerTitle: 'برگه رسمی نوبت مشاوره تلفنی',
    showQrCode: true,
    showTrackingCode: true,
    showDate: true,
    borderStyle: 'formal',
    customFooterText: 'مرکز مشاوره و روانشناسی بالحق - با آرزوی سلامت و آرامش برای شما',
  },
  notifications: {
    smsAdminEnabled: true,
    smsUserEnabled: true,
    emailAdminEnabled: false,
  },
  behavior: {
    redirectAfterSubmit: false,
    customSuccessMessage: 'نوبت مشاوره تلفنی شما با موفقیت رزرو شد.',
    showSummaryAfterSubmit: true,
    allowDownloadPdfReceipt: true,
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
    themeColor: '#00897b',
    backgroundColor: '#f0fdf4',
    backgroundImage: '/images/nature-tree.jpg',
    backgroundOverlayOpacity: 0,
    fontFamily: 'vazirmatn',
    borderRadius: 'xl',
    formWidth: 'standard',
    titleColor: '#004d40',
    textColor: '#334155',
    labelColor: '#0f172a',
    buttonColor: '#00897b',
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
