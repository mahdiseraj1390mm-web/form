'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Form, FormSubmission, FormField, ConditionalRule, SubmissionStatus, EvaluationResult, SimilarityNotification } from '@/types/form';
import { ChatMessage, WebhookLog, TeamMember, TeamRole, DetailedPermissions } from '@/types/advanced';
import { initialForms, initialSubmissions } from '@/lib/mock-data';
import { quizSubmissions, recruitmentSubmissions, orderSubmissions } from '@/lib/additional-mock-submissions';
import { safaanInitialSubmissions } from '@/lib/safaan-submissions';
import { belhaghInitialSubmissions } from '@/lib/belhagh-initial-submissions';
import { evaluateSubmissionSimilarity, reclaimDossierWithExplicitCode, ClientProfileSummary } from '@/lib/user-similarity';

export const allInitialSubmissions: FormSubmission[] = [
  ...belhaghInitialSubmissions,
  ...safaanInitialSubmissions,
];
import { belhaghRegistrationForm, belhaghBookingForm, safaanAssessmentForm } from '@/lib/belhagh-forms';
import { generateTrackingCode } from '@/lib/persian';

export const initialTeamMembers: TeamMember[] = [
  {
    id: 'user-admin',
    name: 'امیرحسین رضایی',
    email: 'a.rezaei@paya.ir',
    mobile: '09121112233',
    jobTitle: 'مدیر ارشد سامانه',
    role: 'super_admin',
    status: 'active',
    invitedAt: '2026-01-10T08:00:00Z',
    lastActive: 'هم‌اکنون آنلاین',
    accessibleFormIds: ['all'],
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
    jobTitle: 'مسئول پذیرش و نوبت‌دهی تلفنی',
    role: 'booking_operator',
    status: 'active',
    invitedAt: '2026-03-01T10:30:00Z',
    lastActive: '۲ ساعت پیش',
    accessibleFormIds: ['form-belhagh-booking', 'form-belhagh-registration'],
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
    jobTitle: 'کارشناس بررسی پرونده‌های روانشناسی',
    role: 'reviewer',
    status: 'active',
    invitedAt: '2026-02-15T12:00:00Z',
    lastActive: 'دیروز',
    accessibleFormIds: ['all'],
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

interface FormContextType {
  forms: Form[];
  submissions: FormSubmission[];
  similarityNotifications: SimilarityNotification[];
  resolveSimilarityNotification: (notificationId: string, action: 'confirm' | 'reject', selectedCaseCode?: string) => void;
  chatMessages: ChatMessage[];
  webhookLogs: WebhookLog[];
  teamMembers: TeamMember[];
  activeForm: Form | null;
  setActiveForm: (form: Form | null) => void;
  getFormById: (id: string) => Form | undefined;
  getFormBySlug: (slug: string) => Form | undefined;
  createForm: (newForm: Partial<Form>) => Form;
  updateForm: (id: string, updated: Partial<Form>) => void;
  deleteForm: (id: string) => void;
  addFieldToForm: (formId: string, field: FormField) => void;
  updateFieldInForm: (formId: string, fieldId: string, updated: Partial<FormField>) => void;
  removeFieldFromForm: (formId: string, fieldId: string) => void;
  reorderFieldsInForm: (formId: string, newFields: FormField[]) => void;
  addRuleToForm: (formId: string, rule: ConditionalRule) => void;
  removeRuleFromForm: (formId: string, ruleId: string) => void;
  submitFormResponse: (formId: string, data: Record<string, any>, paymentInfo?: any, quizResult?: any, evaluationResult?: EvaluationResult, meta?: { deviceFingerprint?: string; detectedSafaCode?: string }) => FormSubmission;
  updateSubmissionStatus: (submissionId: string, newStatus: SubmissionStatus) => void;
  addSubmissionComment: (submissionId: string, authorName: string, authorRole: string, content: string) => void;
  getSubmissionsByFormId: (formId: string) => FormSubmission[];
  refreshSubmissionsFromDb: (formId?: string) => Promise<void>;
  sendChatMessage: (formId: string, sender: 'respondent' | 'admin', senderName: string, text: string) => void;
  getChatMessagesByFormId: (formId: string) => ChatMessage[];
  addWebhookLog: (log: Omit<WebhookLog, 'id' | 'createdAt'>) => void;
  inviteTeamMember: (member: Omit<TeamMember, 'id' | 'invitedAt'>) => TeamMember;
  updateTeamMember: (id: string, updated: Partial<TeamMember>) => void;
  deleteTeamMember: (id: string) => void;
  toggleTeamMemberStatus: (id: string) => void;
}

const initialChatMessages: ChatMessage[] = [
  {
    id: 'msg-1',
    formId: 'form-recruitment-01',
    sender: 'respondent',
    senderName: 'سهراب مرادی',
    text: 'سلام، آیا امکان ویرایش رزومه بارگذاری‌شده پس از ثبت نهایی وجود دارد؟',
    createdAt: '2026-04-18T10:10:00Z',
    read: true,
  },
  {
    id: 'msg-2',
    formId: 'form-recruitment-01',
    sender: 'admin',
    senderName: 'پشتیبانی کارگزینی',
    text: 'درود بر شما، بله از طریق کد پیگیری می‌توانید تا ۴۸ ساعت به صفحه ویرایش دسترسی داشته باشید.',
    createdAt: '2026-04-18T10:12:00Z',
    read: true,
  },
  {
    id: 'msg-3',
    formId: 'form-order-03',
    sender: 'respondent',
    senderName: 'خریدار محترم',
    text: 'سلام، آیا فاکتور رسمی همراه با کد اقتصادی صادر می‌گردد؟',
    createdAt: '2026-04-19T14:30:00Z',
    read: false,
  },
];

const initialWebhookLogs: WebhookLog[] = [
  {
    id: 'wh-1',
    formId: 'form-order-03',
    event: 'payment.verified',
    url: 'https://api.paya.ir/webhooks/orders',
    payload: { trackingCode: 'FA-1403-339811', amount: 12500000, status: 'paid' },
    statusCode: 200,
    status: 'success',
    createdAt: '2026-04-18T17:41:00Z',
  },
  {
    id: 'wh-2',
    formId: 'form-recruitment-01',
    event: 'submission.created',
    url: 'https://crm.paya.ir/leads',
    payload: { trackingCode: 'FA-1403-882319', jobRole: 'fullstack_dev' },
    statusCode: 200,
    status: 'success',
    createdAt: '2026-04-18T10:15:00Z',
  },
];

const FormContext = createContext<FormContextType | undefined>(undefined);

export function FormProvider({ children }: { children: React.ReactNode }) {
  const [forms, setForms] = useState<Form[]>(initialForms);
  const [submissions, setSubmissions] = useState<FormSubmission[]>(allInitialSubmissions);
  const [similarityNotifications, setSimilarityNotifications] = useState<SimilarityNotification[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatMessages);
  const [webhookLogs, setWebhookLogs] = useState<WebhookLog[]>(initialWebhookLogs);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(initialTeamMembers);
  const [activeForm, setActiveForm] = useState<Form | null>(initialForms[0]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    try {
      const CACHE_VERSION = 'v-2026-10-29-safaan-1071-sp-v12';
      const storedVersion = localStorage.getItem('formafzar_cache_ver');
      if (storedVersion !== CACHE_VERSION) {
        localStorage.removeItem('formafzar_forms');
        localStorage.removeItem('formafzar_submissions');
        localStorage.removeItem('belhagh_active_case_data');
        localStorage.removeItem('belhagh_current_case_code');
        localStorage.setItem('formafzar_cache_ver', CACHE_VERSION);
      }
      // پاکسازی کدهای منسوخ با پیشوند BH- از حافظه مرورگر
      const curStoredCase = localStorage.getItem('belhagh_current_case_code');
      if (curStoredCase && (curStoredCase.startsWith('BH-') || curStoredCase.includes('-'))) {
        localStorage.removeItem('belhagh_current_case_code');
        localStorage.removeItem('belhagh_active_case_data');
      }
      const storedForms = localStorage.getItem('formafzar_forms');
      const storedSubmissions = localStorage.getItem('formafzar_submissions');
      const storedChat = localStorage.getItem('formafzar_chat');
      const storedLogs = localStorage.getItem('formafzar_webhooks');
      const storedTeam = localStorage.getItem('formafzar_team_members');
      const storedNotifs = localStorage.getItem('formafzar_sim_notifs');
      if (storedNotifs) {
        try { setSimilarityNotifications(JSON.parse(storedNotifs)); } catch {}
      }
      if (storedForms) {
        const parsed: Form[] = JSON.parse(storedForms);
        const initialFormMap = new Map<string, Form>();
        initialForms.forEach((f) => {
          initialFormMap.set(f.id, f);
          initialFormMap.set(f.slug, f);
        });
        // تضمین به‌روزرسانی فرم‌های پایه به آخرین نسخه همراه با حفظ تغییرات کاربر در تنظیمات و قالب
        const updated = parsed.map((f) => {
          const base = initialFormMap.get(f.id) || initialFormMap.get(f.slug);
          if (!base) return f;
          return {
            ...base,
            ...f,
            generalSettings: {
              ...base.generalSettings,
              ...f.generalSettings,
            },
            theme: {
              ...(base.theme || { themeColor: '#0284c7', fontFamily: 'vazirmatn', borderRadius: 'md' }),
              ...(f.theme || {}),
              themeColor: f.theme?.themeColor || base.theme?.themeColor || '#0284c7',
            },
            steps: base.steps || f.steps,
            fields: base.fields || f.fields,
          };
        });
        initialForms.forEach((f) => {
          if (!updated.some((u) => u.id === f.id || u.slug === f.slug)) {
            updated.unshift(f);
          }
        });
        setForms(updated);
        if (updated.length > 0) setActiveForm(updated[0]);
      }
      if (storedSubmissions) {
        try {
          const parsed = JSON.parse(storedSubmissions);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // پالایش قطعی هرگونه داده فیک و تستی قدیمی
            const cleanParsed = parsed.filter(
              (s: any) =>
                !s.id?.startsWith('sub-bh-') &&
                !s.id?.startsWith('sub-qz-') &&
                !s.id?.startsWith('sub-rc-') &&
                !s.id?.startsWith('sub-ord-')
            );
            const existingIds = new Set(cleanParsed.map((s: any) => s.id));
            const merged = [...cleanParsed];
            allInitialSubmissions.forEach((s) => {
              if (!existingIds.has(s.id)) merged.push(s);
            });
            setSubmissions(merged);
          } else {
            setSubmissions(allInitialSubmissions);
          }
        } catch {
          setSubmissions(allInitialSubmissions);
        }
      } else {
        setSubmissions(allInitialSubmissions);
      }
      if (storedChat) setChatMessages(JSON.parse(storedChat));
      if (storedLogs) setWebhookLogs(JSON.parse(storedLogs));
      if (storedTeam) {
        setTeamMembers(JSON.parse(storedTeam));
      } else {
        setTeamMembers(initialTeamMembers);
      }
    } catch {
      // استفاده از مقادیر اولیه
    }
    setIsInitialized(true);

    // همگام‌سازی کلیه پاسخ‌های فرم از پایگاه‌داده سرور با هر بار بارگذاری صفحه ادمین
    fetch('/api/cases?formId=all', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data?.submissions && Array.isArray(data.submissions) && data.submissions.length > 0) {
          setSubmissions(data.submissions);
          try {
            localStorage.setItem('formafzar_submissions', JSON.stringify(data.submissions));
          } catch {}
        }
      })
      .catch((err) => console.warn('Could not load submissions from DB:', err));

    // همگام‌سازی از پایگاه‌داده سرور تا تمامی کاربران و دستگاه‌ها آخرین فرم‌ها و بنرها را مشاهده کنند (بدون کش)
    fetch(`/api/forms?_nocache=${Date.now()}`, { cache: 'no-store', headers: { 'Pragma': 'no-cache', 'Cache-Control': 'no-cache' } })
      .then((res) => res.json())
      .then((data) => {
        if (data?.forms && Array.isArray(data.forms) && data.forms.length > 0) {
          setForms(data.forms);
          setActiveForm((prev) => {
            if (!prev) return data.forms[0];
            return data.forms.find((f: Form) => f.id === prev.id) || data.forms[0];
          });
          try {
            localStorage.setItem('formafzar_forms', JSON.stringify(data.forms));
          } catch {
            // ignore
          }
        }
      })
      .catch((err) => {
        console.warn('Could not sync forms from /api/forms:', err);
      });
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    try {
      localStorage.setItem('formafzar_forms', JSON.stringify(forms));
      localStorage.setItem('formafzar_submissions', JSON.stringify(submissions));
      localStorage.setItem('formafzar_chat', JSON.stringify(chatMessages));
      localStorage.setItem('formafzar_webhooks', JSON.stringify(webhookLogs));
      localStorage.setItem('formafzar_team_members', JSON.stringify(teamMembers));
      localStorage.setItem('formafzar_sim_notifs', JSON.stringify(similarityNotifications));
    } catch {
      // ignore
    }
  }, [forms, submissions, chatMessages, webhookLogs, teamMembers, isInitialized]);

  const getFormById = (id: string) => {
    const found = forms.find((f) => f.id === id || f.slug === id);
    if (found) return found;
    if (id === 'form-belhagh-booking' || id === '3uu4z') return belhaghBookingForm;
    if (id === 'form-belhagh-registration' || id === 'zexuz') return belhaghRegistrationForm;
    if (id === 'form-safaan-assessment' || id === 'safaan') return safaanAssessmentForm;
    return forms.find((f) => f.id === id);
  };
  const getFormBySlug = (slug: string) => {
    const found = forms.find((f) => f.slug === slug || f.id === slug);
    if (found) return found;
    if (slug === '3uu4z' || slug === 'form-belhagh-booking') return belhaghBookingForm;
    if (slug === 'zexuz' || slug === 'form-belhagh-registration') return belhaghRegistrationForm;
    if (slug === 'safaan' || slug === 'form-safaan-assessment') return safaanAssessmentForm;
    return forms.find((f) => f.slug === slug || f.id === slug);
  };

  const createForm = (newForm: Partial<Form>): Form => {
    const created: Form = {
      id: `form-${Date.now()}`,
      title: newForm.title || 'فرم بدون نام',
      slug: (newForm.title || 'form').toLowerCase().replace(/\s+/g, '-') + `-${Date.now().toString().slice(-4)}`,
      description: newForm.description || '',
      category: newForm.category || 'عمومی و سازمانی',
      mode: newForm.mode || 'classic',
      status: 'draft',
      fields: newForm.fields || [],
      steps: newForm.steps || [],
      rules: newForm.rules || [],
      payment: newForm.payment || {
        enabled: false,
        type: 'fixed',
        gateway: 'shaparak_mellat',
        currency: 'IRT',
      },
      quiz: newForm.quiz || {
        enabled: false,
        durationMinutes: 0,
        passingScore: 70,
        negativeMarking: false,
        shuffleQuestions: false,
        showImmediateResult: false,
        certificateEnabled: false,
      },
      security: newForm.security || {
        authRequired: false,
        otpLogin: false,
        onePerNationalCode: false,
        onePerMobile: false,
        limitByIp: false,
        allowEditAfterSubmit: false,
      },
      printTemplate: newForm.printTemplate || {
        headerTitle: newForm.title || 'رسید رسمی ثبت فرم',
        showQrCode: true,
        showTrackingCode: true,
        showDate: true,
        borderStyle: 'formal',
      },
      notifications: newForm.notifications || {
        smsAdminEnabled: false,
        smsUserEnabled: false,
        emailAdminEnabled: false,
      },
      behavior: newForm.behavior || {
        redirectAfterSubmit: false,
        redirectUrl: '',
        customSuccessMessage: 'اطلاعات شما با موفقیت در سامانه ثبت گردید.',
        showSummaryAfterSubmit: true,
        allowDownloadPdfReceipt: true,
      },
      theme: newForm.theme || {
        themeColor: '#1e3a8a',
        fontFamily: 'vazirmatn',
        borderRadius: 'md',
        backgroundStyle: 'clean',
      },
      submissionCount: 0,
      viewCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setForms((prev) => [created, ...prev]);
    setActiveForm(created);
    return created;
  };

  const updateForm = (id: string, updated: Partial<Form>) => {
    setForms((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          const updatedForm = { ...f, ...updated, updatedAt: new Date().toISOString() };
          if (activeForm?.id === id) setActiveForm(updatedForm);
          return updatedForm;
        }
        return f;
      })
    );

    // ذخیره همگام در سرور تا تغییرات برای تمامی کاربران و بازدیدکنندگان پایدار باشد
    fetch('/api/forms', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ formId: id, updated }),
    }).catch((err) => {
      console.warn('Failed to sync form update to server DB:', err);
    });
  };

  const deleteForm = (id: string) => {
    setForms((prev) => prev.filter((f) => f.id !== id));
    if (activeForm?.id === id) {
      setActiveForm(forms.find((f) => f.id !== id) || null);
    }
  };

  const addFieldToForm = (formId: string, field: FormField) => {
    setForms((prev) =>
      prev.map((f) => {
        if (f.id === formId) {
          return {
            ...f,
            fields: [...f.fields, field],
            updatedAt: new Date().toISOString(),
          };
        }
        return f;
      })
    );
  };

  const updateFieldInForm = (formId: string, fieldId: string, updated: Partial<FormField>) => {
    setForms((prev) =>
      prev.map((f) => {
        if (f.id === formId) {
          return {
            ...f,
            fields: f.fields.map((fld) => (fld.id === fieldId ? { ...fld, ...updated } : fld)),
            updatedAt: new Date().toISOString(),
          };
        }
        return f;
      })
    );
  };

  const removeFieldFromForm = (formId: string, fieldId: string) => {
    setForms((prev) =>
      prev.map((f) => {
        if (f.id === formId) {
          return {
            ...f,
            fields: f.fields.filter((fld) => fld.id !== fieldId),
            updatedAt: new Date().toISOString(),
          };
        }
        return f;
      })
    );
  };

  const reorderFieldsInForm = (formId: string, newFields: FormField[]) => {
    setForms((prev) =>
      prev.map((f) => {
        if (f.id === formId) {
          return { ...f, fields: newFields, updatedAt: new Date().toISOString() };
        }
        return f;
      })
    );
  };

  const addRuleToForm = (formId: string, rule: ConditionalRule) => {
    setForms((prev) =>
      prev.map((f) => {
        if (f.id === formId) {
          return { ...f, rules: [...f.rules, rule], updatedAt: new Date().toISOString() };
        }
        return f;
      })
    );
  };

  const removeRuleFromForm = (formId: string, ruleId: string) => {
    setForms((prev) =>
      prev.map((f) => {
        if (f.id === formId) {
          return { ...f, rules: f.rules.filter((r) => r.id !== ruleId), updatedAt: new Date().toISOString() };
        }
        return f;
      })
    );
  };

  const submitFormResponse = (
    formId: string,
    data: Record<string, any>,
    paymentInfo?: any,
    quizResult?: any,
    evaluationResult?: EvaluationResult,
    meta?: { deviceFingerprint?: string; detectedSafaCode?: string }
  ): FormSubmission => {
    const trackingCode = generateTrackingCode('پرونده');
    let submissionData = { ...data };
    let assignedLinkingStatus: 'linked' | 'pending_match' | 'requires_admin_resolution' = 'linked';
    let assignedCandidates: string[] | undefined;

    // استخراج خلاصه‌ای از پروفایل‌های موجود جهت ارزیابی تشابه
    const profileMap = new Map<string, ClientProfileSummary>();
    submissions.forEach((s) => {
      const cCode = s.data?.caseCode || s.trackingCode;
      if (cCode && !profileMap.has(cCode)) {
        profileMap.set(cCode, {
          caseCode: cCode,
          fullName: s.data?.fullName || `${s.data?.f_name || ''} ${s.data?.f_family || ''}`.trim() || '',
          mobile: s.data?.f_mobile || s.data?.bk_mobile || '',
          schoolName: s.data?.f_school_name || s.data?.school_name,
          provinceCity: s.data?.f_province_city || s.data?.province,
          birthYear: s.data?.birth_year,
          deviceFingerprint: s.deviceFingerprint,
          safaUserCode: s.detectedSafaCode || (cCode.startsWith('SF-') ? cCode.replace('SF-', '') : undefined),
        });
      }
    });
    const existingProfiles = Array.from(profileMap.values());

    const initialSubObj: FormSubmission = {
      id: `sub-${Date.now()}`,
      formId,
      trackingCode,
      data: submissionData,
      status: 'new',
      paymentStatus: paymentInfo?.status || 'none',
      paymentAmount: paymentInfo?.amount,
      paymentRefId: paymentInfo?.refId,
      paymentDate: paymentInfo?.date,
      quizResult,
      evaluationResult,
      deviceFingerprint: meta?.deviceFingerprint,
      detectedSafaCode: meta?.detectedSafaCode,
      userIp: '185.143.232.19',
      createdAt: new Date().toISOString(),
      comments: [],
    };

    // ۱. بررسی اصالت کد صریح دستگاه (Authoritative Reclaiming)
    if (meta?.detectedSafaCode) {
      const reclaimRes = reclaimDossierWithExplicitCode(
        meta.detectedSafaCode,
        initialSubObj,
        submissions,
        existingProfiles
      );
      if (reclaimRes.displacedUserId) {
        setSubmissions(reclaimRes.updatedSubmissions);
      }
      submissionData.caseCode = reclaimRes.reassignedCaseCode;
      assignedLinkingStatus = 'linked';
    } else {
      // ۲. ارزیابی تشابه فازی
      const simDecision = evaluateSubmissionSimilarity(initialSubObj, existingProfiles);
      assignedLinkingStatus = simDecision.status;

      if (simDecision.status === 'linked' && simDecision.matchedCaseCode) {
        if (!simDecision.matchedCaseCode.startsWith('BH-') && !simDecision.matchedCaseCode.includes('-')) {
          submissionData.caseCode = simDecision.matchedCaseCode;
        }
      } else if (simDecision.status === 'requires_admin_resolution' && simDecision.notification) {
        setSimilarityNotifications((prev) => [simDecision.notification!, ...prev]);
        assignedCandidates = simDecision.notification.candidates.map((c) => c.caseCode);
      }
    }

    // ۳. اگر ثبت‌نام جدید است، بررسی و الحاق پرونده‌های معلق صفا به این کاربر جدید
    if (formId === 'form-belhagh-registration') {
      const isLegacyCode = (code?: string) => !code || code.startsWith('BH-') || code.includes('-');
      const candidateCode = !isLegacyCode(submissionData.caseCode)
        ? submissionData.caseCode
        : !isLegacyCode(data.caseCode)
          ? data.caseCode
          : trackingCode;
      submissionData.caseCode = candidateCode;
    }

    const newSubmission: FormSubmission = {
      ...initialSubObj,
      data: submissionData,
      linkingStatus: assignedLinkingStatus,
      candidateUserIds: assignedCandidates,
    };

    setSubmissions((prev) => [newSubmission, ...prev]);

    setForms((prev) =>
      prev.map((f) => (f.id === formId ? { ...f, submissionCount: f.submissionCount + 1 } : f))
    );

    // ثبت اتوماتیک وب‌هوک لاگ در صورت داشتن وب‌هوک
    const targetForm = forms.find((f) => f.id === formId);
    if (targetForm?.notifications.webhookUrl) {
      addWebhookLog({
        formId,
        event: 'submission.created',
        url: targetForm.notifications.webhookUrl,
        payload: { trackingCode, data },
        statusCode: 200,
        status: 'success',
      });
    }

    return newSubmission;
  };

  const resolveSimilarityNotification = (
    notificationId: string,
    action: 'confirm' | 'reject',
    selectedCaseCode?: string
  ) => {
    setSimilarityNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, resolved: true } : n))
    );

    const notif = similarityNotifications.find((n) => n.id === notificationId);
    if (!notif) return;

    if (action === 'confirm' && selectedCaseCode) {
      setSubmissions((prev) =>
        prev.map((s) => {
          if (s.id === notif.submissionId) {
            return {
              ...s,
              linkingStatus: 'linked',
              data: { ...s.data, caseCode: selectedCaseCode },
              reconciledAt: new Date().toISOString(),
              reconciledReason: `تایید انتساب دستی توسط مدیر به پرونده ${selectedCaseCode}`,
            };
          }
          return s;
        })
      );
    } else if (action === 'reject') {
      setSubmissions((prev) =>
        prev.map((s) => {
          if (s.id === notif.submissionId) {
            return {
              ...s,
              linkingStatus: 'pending_match',
              reconciledAt: new Date().toISOString(),
              reconciledReason: 'رد انتساب کاندیدها توسط مدیر - انتقال به صف انتظار تطابق',
            };
          }
          return s;
        })
      );
    }
  };

  const updateSubmissionStatus = (submissionId: string, newStatus: SubmissionStatus) => {
    setSubmissions((prev) =>
      prev.map((s) => (s.id === submissionId ? { ...s, status: newStatus, updatedAt: new Date().toISOString() } : s))
    );
  };

  const addSubmissionComment = (
    submissionId: string,
    authorName: string,
    authorRole: string,
    content: string
  ) => {
    setSubmissions((prev) =>
      prev.map((s) => {
        if (s.id === submissionId) {
          return {
            ...s,
            comments: [
              ...s.comments,
              {
                id: `c-${Date.now()}`,
                authorName,
                authorRole,
                content,
                createdAt: new Date().toISOString(),
              },
            ],
          };
        }
        return s;
      })
    );
  };

  const getSubmissionsByFormId = (formId: string) => submissions.filter((s) => s.formId === formId);

  // واکشی پاسخ‌های فرم از دیتابیس ابری Neon و ادغام با وضعیت موجود
  const refreshSubmissionsFromDb = async (formId?: string): Promise<void> => {
    try {
      const url = formId ? `/api/cases?formId=${formId}` : "/api/cases?formId=all";
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();
      if (!data?.submissions || !Array.isArray(data.submissions)) return;
      const dbSubmissions: FormSubmission[] = data.submissions;
      if (formId === 'all' || !formId) {
        setSubmissions(dbSubmissions);
        try {
          localStorage.setItem('formafzar_submissions', JSON.stringify(dbSubmissions));
        } catch {}
        return;
      }
      setSubmissions((prev) => {
        const cleanPrev = prev.filter(
          (s) =>
            !s.id.startsWith('sub-bh-') &&
            !s.id.startsWith('sub-qz-') &&
            !s.id.startsWith('sub-rc-') &&
            !s.id.startsWith('sub-ord-')
        );
        const existingIds = new Set(cleanPrev.map((s) => s.id));
        const merged = [...cleanPrev];
        dbSubmissions.forEach((s) => {
          if (!existingIds.has(s.id)) {
            merged.push(s);
          } else {
            const idx = merged.findIndex((m) => m.id === s.id);
            if (idx !== -1) merged[idx] = { ...merged[idx], ...s };
          }
        });
        return merged;
      });
    } catch (err) {
      console.warn('refreshSubmissionsFromDb error:', err);
    }
  };

  const sendChatMessage = (
    formId: string,
    sender: 'respondent' | 'admin',
    senderName: string,
    text: string
  ) => {
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      formId,
      sender,
      senderName,
      text,
      createdAt: new Date().toISOString(),
      read: sender === 'admin',
    };
    setChatMessages((prev) => [...prev, newMsg]);
  };

  const getChatMessagesByFormId = (formId: string) => chatMessages.filter((m) => m.formId === formId);

  const addWebhookLog = (log: Omit<WebhookLog, 'id' | 'createdAt'>) => {
    const newLog: WebhookLog = {
      ...log,
      id: `wh-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setWebhookLogs((prev) => [newLog, ...prev]);
  };

  const inviteTeamMember = (member: Omit<TeamMember, 'id' | 'invitedAt'>): TeamMember => {
    const newMember: TeamMember = {
      ...member,
      id: `user-${Date.now()}`,
      invitedAt: new Date().toISOString(),
      lastActive: 'به‌تازگی دعوت شده',
    };
    setTeamMembers((prev) => [newMember, ...prev]);
    return newMember;
  };

  const updateTeamMember = (id: string, updated: Partial<TeamMember>) => {
    setTeamMembers((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updated } : m))
    );
  };

  const deleteTeamMember = (id: string) => {
    setTeamMembers((prev) => prev.filter((m) => m.id !== id));
  };

  const toggleTeamMemberStatus = (id: string) => {
    setTeamMembers((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status: m.status === 'active' ? 'suspended' : 'active' }
          : m
      )
    );
  };

  return (
    <FormContext.Provider
      value={{
        forms,
        submissions,
        similarityNotifications,
        resolveSimilarityNotification,
        chatMessages,
        webhookLogs,
        teamMembers,
        activeForm,
        setActiveForm,
        getFormById,
        getFormBySlug,
        createForm,
        updateForm,
        deleteForm,
        addFieldToForm,
        updateFieldInForm,
        removeFieldFromForm,
        reorderFieldsInForm,
        addRuleToForm,
        removeRuleFromForm,
        submitFormResponse,
        updateSubmissionStatus,
        addSubmissionComment,
        getSubmissionsByFormId,
        refreshSubmissionsFromDb,
        sendChatMessage,
        getChatMessagesByFormId,
        addWebhookLog,
        inviteTeamMember,
        updateTeamMember,
        deleteTeamMember,
        toggleTeamMemberStatus,
      }}
    >
      {children}
    </FormContext.Provider>
  );
}

export function useForm() {
  const context = useContext(FormContext);
  if (!context) throw new Error('useForm must be used within a FormProvider');
  return context;
}
