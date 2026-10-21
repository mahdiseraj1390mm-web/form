'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserPlus, 
  ShieldCheck, 
  Layers, 
  FileText, 
  Calendar, 
  Sliders, 
  Check, 
  CheckSquare, 
  Square, 
  Phone, 
  Mail, 
  Briefcase, 
  User, 
  AlertCircle,
  MessageSquare
} from 'lucide-react';
import { TeamMember, TeamRole, DetailedPermissions } from '@/types/advanced';
import { Form } from '@/types/form';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memberData: Omit<TeamMember, 'id' | 'invitedAt'>) => void;
  editingMember?: TeamMember | null;
  forms: Form[];
}

const DEFAULT_PERMISSIONS: DetailedPermissions = {
  canCreateForms: false,
  canEditForms: false,
  canDeleteForms: false,
  canPublishForms: false,
  canViewSubmissions: true,
  canEditSubmissions: false,
  canDeleteSubmissions: false,
  canChangeStatus: true,
  canExportData: false,
  canAddComments: true,
  canManageBookings: false,
  canRescheduleBookings: false,
  canManualBook: false,
  canViewFinances: false,
  canManageSms: false,
  canManageIntegrations: false,
  canManageTeam: false,
};

const ROLE_PRESETS: Record<TeamRole, { title: string; desc: string; permissions: DetailedPermissions }> = {
  super_admin: {
    title: 'مدیر کل (Super Admin)',
    desc: 'دسترسی نامحدود به تمامی بخش‌ها، فرم‌ها، تنظیمات و دعوت همکاران',
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
  booking_operator: {
    title: 'اپراتور نوبت‌دهی و پذیرش',
    desc: 'مدیریت تقویم، ثبت نوبت دستی مراجعین، تماس تلفنی و تایید زمان‌ها',
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
  reviewer: {
    title: 'کارشناس بررسی و کارتابل',
    desc: 'بررسی پرونده‌های مراجعین، درج نظر کارشناسی و تغییر وضعیت پرونده',
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
  form_builder: {
    title: 'طراح و مدیر فرم‌ها',
    desc: 'طراحی، ویرایش فیلدها، تعیین شروط و قالب‌های ظاهری فرم‌ها',
    permissions: {
      canCreateForms: true,
      canEditForms: true,
      canDeleteForms: true,
      canPublishForms: true,
      canViewSubmissions: true,
      canEditSubmissions: false,
      canDeleteSubmissions: false,
      canChangeStatus: false,
      canExportData: true,
      canAddComments: false,
      canManageBookings: false,
      canRescheduleBookings: false,
      canManualBook: false,
      canViewFinances: false,
      canManageSms: false,
      canManageIntegrations: false,
      canManageTeam: false,
    },
  },
  auditor: {
    title: 'ناظر و بازرس (فقط مشاهده)',
    desc: 'مشاهده گزارش‌ها، آمار مراجعین و خروجی اکسل بدون امکان دستکاری',
    permissions: {
      canCreateForms: false,
      canEditForms: false,
      canDeleteForms: false,
      canPublishForms: false,
      canViewSubmissions: true,
      canEditSubmissions: false,
      canDeleteSubmissions: false,
      canChangeStatus: false,
      canExportData: true,
      canAddComments: false,
      canManageBookings: false,
      canRescheduleBookings: false,
      canManualBook: false,
      canViewFinances: true,
      canManageSms: false,
      canManageIntegrations: false,
      canManageTeam: false,
    },
  },
  custom: {
    title: 'سطح دسترسی سفارشی',
    desc: 'تعیین دقیق و دلخواه تک‌تک مجوزها و محدوده‌های دسترسی',
    permissions: { ...DEFAULT_PERMISSIONS },
  },
};

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingMember,
  forms,
}) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [role, setRole] = useState<TeamRole>('reviewer');
  const [status, setStatus] = useState<'active' | 'pending' | 'suspended'>('active');
  const [isAllForms, setIsAllForms] = useState(true);
  const [selectedFormIds, setSelectedFormIds] = useState<string[]>([]);
  const [permissions, setPermissions] = useState<DetailedPermissions>({ ...ROLE_PRESETS.reviewer.permissions });
  const [sendSmsInvite, setSendSmsInvite] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingMember) {
      setName(editingMember.name);
      setMobile(editingMember.mobile);
      setEmail(editingMember.email);
      setJobTitle(editingMember.jobTitle);
      setRole(editingMember.role);
      setStatus(editingMember.status);
      const isAll = editingMember.accessibleFormIds.includes('all');
      setIsAllForms(isAll);
      setSelectedFormIds(isAll ? [] : editingMember.accessibleFormIds);
      setPermissions({ ...editingMember.permissions });
      setSendSmsInvite(false);
    } else {
      setName('');
      setMobile('');
      setEmail('');
      setJobTitle('');
      setRole('booking_operator');
      setStatus('active');
      setIsAllForms(true);
      setSelectedFormIds([]);
      setPermissions({ ...ROLE_PRESETS.booking_operator.permissions });
      setSendSmsInvite(true);
    }
    setErrors({});
  }, [editingMember, isOpen]);

  if (!isOpen) return null;

  const handleRoleChange = (newRole: TeamRole) => {
    setRole(newRole);
    if (newRole !== 'custom') {
      setPermissions({ ...ROLE_PRESETS[newRole].permissions });
      if (newRole === 'super_admin') {
        setIsAllForms(true);
      }
    }
  };

  const handlePermissionToggle = (key: keyof DetailedPermissions) => {
    setPermissions((prev) => {
      const updated = { ...prev, [key]: !prev[key] };
      // اگر تغییری داده شد و نقشی غیر از custom بود، نقش به custom تغییر کند تا مشخص باشد شخصی‌سازی شده
      setRole('custom');
      return updated;
    });
  };

  const setCategoryPermissions = (keys: (keyof DetailedPermissions)[], value: boolean) => {
    setPermissions((prev) => {
      const updated = { ...prev };
      keys.forEach((k) => {
        updated[k] = value;
      });
      setRole('custom');
      return updated;
    });
  };

  const toggleFormSelection = (formId: string) => {
    setSelectedFormIds((prev) =>
      prev.includes(formId) ? prev.filter((id) => id !== formId) : [...prev, formId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'نام و نام خانوادگی را وارد کنید';
    if (!mobile.trim()) {
      newErrors.mobile = 'شماره موبایل را وارد کنید';
    } else if (!/^09\d{9}$/.test(mobile.trim())) {
      newErrors.mobile = 'شماره موبایل باید ۱۱ رقم و با ۰۹ شروع شود';
    }
    if (!jobTitle.trim()) newErrors.jobTitle = 'سمت یا عنوان شغلی را مشخص کنید';
    if (!isAllForms && selectedFormIds.length === 0) {
      newErrors.forms = 'حداقل یک فرم را انتخاب کنید یا گزینه دسترسی به همه فرم‌ها را بزنید';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      name: name.trim(),
      mobile: mobile.trim(),
      email: email.trim() || `${mobile.trim()}@system.local`,
      jobTitle: jobTitle.trim(),
      role,
      status,
      accessibleFormIds: isAllForms ? ['all'] : selectedFormIds,
      permissions,
    });
    onClose();
  };

  const permissionGroups: {
    title: string;
    icon: React.ReactNode;
    keys: (keyof DetailedPermissions)[];
    labels: Record<keyof DetailedPermissions, string>;
  }[] = [
    {
      title: 'مدیریت و طراحی فرم‌ها',
      icon: <Layers className="w-4 h-4 text-blue-600" />,
      keys: ['canCreateForms', 'canEditForms', 'canDeleteForms', 'canPublishForms'],
      labels: {
        canCreateForms: 'ایجاد فرم و قالب جدید',
        canEditForms: 'ویرایش فیلدها و ساختار فرم‌ها',
        canDeleteForms: 'حذف فرم‌ها از سیستم',
        canPublishForms: 'تغییر وضعیت انتشار و فعال/غیرفعال‌سازی',
        canViewSubmissions: '',
        canEditSubmissions: '',
        canDeleteSubmissions: '',
        canChangeStatus: '',
        canExportData: '',
        canAddComments: '',
        canManageBookings: '',
        canRescheduleBookings: '',
        canManualBook: '',
        canViewFinances: '',
        canManageSms: '',
        canManageIntegrations: '',
        canManageTeam: '',
      },
    },
    {
      title: 'کارتابل مراجعین و پاسخ‌ها',
      icon: <FileText className="w-4 h-4 text-emerald-600" />,
      keys: [
        'canViewSubmissions',
        'canEditSubmissions',
        'canDeleteSubmissions',
        'canChangeStatus',
        'canExportData',
        'canAddComments',
      ],
      labels: {
        canViewSubmissions: 'مشاهده لیست پاسخ‌ها و پرونده‌های ثبت‌شده',
        canEditSubmissions: 'ویرایش اطلاعات و مدارک ثبت‌شده مراجعین',
        canDeleteSubmissions: 'حذف پاسخ و پرونده‌ها از کارتابل',
        canChangeStatus: 'تغییر وضعیت پرونده (تایید، رد، در حال بررسی)',
        canExportData: 'خروجی اکسل (Excel/CSV) و چاپ پرونده‌ها',
        canAddComments: 'ثبت یادداشت‌های داخلی و پیام برای همکاران',
        canCreateForms: '',
        canEditForms: '',
        canDeleteForms: '',
        canPublishForms: '',
        canManageBookings: '',
        canRescheduleBookings: '',
        canManualBook: '',
        canViewFinances: '',
        canManageSms: '',
        canManageIntegrations: '',
        canManageTeam: '',
      },
    },
    {
      title: 'سامانه نوبت‌دهی مشاوره و تقویم',
      icon: <Calendar className="w-4 h-4 text-teal-600" />,
      keys: ['canManageBookings', 'canRescheduleBookings', 'canManualBook'],
      labels: {
        canManageBookings: 'مشاهده تقویم و مدیریت نوبت‌های رزرو شده',
        canRescheduleBookings: 'تغییر زمان نوبت‌ها، جابجایی و لغو نوبت',
        canManualBook: 'رزرو دستی نوبت مشاوره برای مراجعین تلفنی',
        canCreateForms: '',
        canEditForms: '',
        canDeleteForms: '',
        canPublishForms: '',
        canViewSubmissions: '',
        canEditSubmissions: '',
        canDeleteSubmissions: '',
        canChangeStatus: '',
        canExportData: '',
        canAddComments: '',
        canViewFinances: '',
        canManageSms: '',
        canManageIntegrations: '',
        canManageTeam: '',
      },
    },
    {
      title: 'تنظیمات سیستمی، پیامک و مالی',
      icon: <Sliders className="w-4 h-4 text-purple-600" />,
      keys: ['canViewFinances', 'canManageSms', 'canManageIntegrations', 'canManageTeam'],
      labels: {
        canViewFinances: 'مشاهده درگاه‌های بانکی، کارمزدها و صورت‌حساب مالی',
        canManageSms: 'مشاهده لاگ پیامک‌ها و ارسال پیامک گروهی/تکی',
        canManageIntegrations: 'تنظیمات وب‌هوک و کلیدهای API',
        canManageTeam: 'مدیریت و دعوت همکاران جدید و ویرایش دسترسی‌ها',
        canCreateForms: '',
        canEditForms: '',
        canDeleteForms: '',
        canPublishForms: '',
        canViewSubmissions: '',
        canEditSubmissions: '',
        canDeleteSubmissions: '',
        canChangeStatus: '',
        canExportData: '',
        canAddComments: '',
        canManageBookings: '',
        canRescheduleBookings: '',
        canManualBook: '',
      },
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-8 overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {editingMember ? 'ویرایش اطلاعات و دسترسی‌های همکار' : 'دعوت همکار جدید و تعیین سطح دسترسی'}
              </h2>
              <p className="text-xs text-slate-300">
                مشخصات فردی، نقش سازمانی و مجوزهای دقیق دسترسی به بخش‌های مختلف را تعیین کنید.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center transition text-slate-300 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(85vh-120px)] overflow-y-auto">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
              <User className="w-4 h-4 text-blue-600" />
              <span>مشخصات فردی و اطلاعات تماس همکار</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  نام و نام خانوادگی <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثلاً: محمد کمالی"
                    className={`w-full pr-9 pl-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                      errors.name ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:ring-blue-100'
                    }`}
                  />
                </div>
                {errors.name && <p className="text-[11px] text-rose-500 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  شماره موبایل (جهت ارسال پیامک ورود) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                  <input
                    type="tel"
                    dir="ltr"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="0912xxxxxxx"
                    className={`w-full pr-9 pl-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 bg-white font-mono text-left ${
                      errors.mobile ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:ring-blue-100'
                    }`}
                  />
                </div>
                {errors.mobile && <p className="text-[11px] text-rose-500 mt-1">{errors.mobile}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  سمت سازمانی / عنوان شغلی <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="مثلاً: مسئول نوبت‌دهی مشاوره تلفنی"
                    className={`w-full pr-9 pl-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 bg-white ${
                      errors.jobTitle ? 'border-rose-400 focus:ring-rose-200' : 'border-slate-300 focus:ring-blue-100'
                    }`}
                  />
                </div>
                {errors.jobTitle && <p className="text-[11px] text-rose-500 mt-1">{errors.jobTitle}</p>}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  آدرس ایمیل سازمانی (اختیاری)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                  <input
                    type="email"
                    dir="ltr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="colleague@domain.com"
                    className="w-full pr-9 pl-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-100 bg-white font-mono text-left"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Role Preset Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>الگوی نقش و سطح دسترسی پایه (Role Presets)</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                با انتخاب هر الگو، مجوزهای زیر به صورت هوشمند تنظیم می‌شوند
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {(Object.keys(ROLE_PRESETS) as TeamRole[]).map((rKey) => {
                const preset = ROLE_PRESETS[rKey];
                const isSelected = role === rKey;
                return (
                  <button
                    key={rKey}
                    type="button"
                    onClick={() => handleRoleChange(rKey)}
                    className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-600 shadow-sm'
                        : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className={`text-xs font-bold ${isSelected ? 'text-blue-900' : 'text-slate-800'}`}>
                        {preset.title}
                      </span>
                      {isSelected && (
                        <span className="w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-[10px]">
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      {preset.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Granular Permissions Checklist */}
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-teal-600" />
                  <span>دسترسی‌ها و مجوزهای جزئی (Granular Permissions)</span>
                </h3>
                <p className="text-[11px] text-slate-400">
                  می‌توانید هر یک از مجوزها را مستقل از نقش پایه تیک بزنید یا لغو کنید.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {permissionGroups.map((group, gIdx) => {
                const allChecked = group.keys.every((k) => permissions[k]);
                const someChecked = group.keys.some((k) => permissions[k]);

                return (
                  <div key={gIdx} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                    <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-slate-800">
                        {group.icon}
                        <span>{group.title}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setCategoryPermissions(group.keys, !allChecked)}
                        className="text-[10px] text-blue-600 hover:underline font-medium"
                      >
                        {allChecked ? 'لغو همه' : 'انتخاب همه'}
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      {group.keys.map((permKey) => (
                        <label
                          key={permKey}
                          className="flex items-start gap-2 p-1.5 rounded-lg hover:bg-white cursor-pointer transition select-none"
                        >
                          <input
                            type="checkbox"
                            checked={permissions[permKey]}
                            onChange={() => handlePermissionToggle(permKey)}
                            className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5 border-slate-300"
                          />
                          <span className="text-[11px] text-slate-700 leading-tight">
                            {group.labels[permKey]}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Form Scope */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2 pb-2 border-b border-slate-100">
              <FileText className="w-4 h-4 text-indigo-600" />
              <span>محدوده فرم‌های مجاز برای همکار</span>
            </h3>

            <div className="space-y-2">
              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="formScope"
                  checked={isAllForms}
                  onChange={() => setIsAllForms(true)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800">دسترسی به تمامی فرم‌های سامانه</span>
                  <p className="text-[11px] text-slate-400">
                    همکار به کارتابل و تنظیمات تمام فرم‌های فعلی و فرم‌های جدیدی که ساخته می‌شوند دسترسی دارد.
                  </p>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="formScope"
                  checked={!isAllForms}
                  onChange={() => setIsAllForms(false)}
                  className="text-blue-600 focus:ring-blue-500"
                />
                <div>
                  <span className="text-xs font-bold text-slate-800">دسترسی محدود به فرم‌های مشخص‌شده</span>
                  <p className="text-[11px] text-slate-400">
                    همکار صرفاً اطلاعات و کارتابل فرم‌های تیک‌خورده زیر را مشاهده خواهد کرد.
                  </p>
                </div>
              </label>
            </div>

            {!isAllForms && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 mt-2">
                <span className="text-[11px] font-bold text-slate-700">فرم‌های مجاز را انتخاب کنید:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                  {forms.map((f) => {
                    const isChecked = selectedFormIds.includes(f.id);
                    return (
                      <label
                        key={f.id}
                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition ${
                          isChecked ? 'bg-blue-50/60 border-blue-300 font-bold text-blue-900' : 'bg-white border-slate-200 text-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleFormSelection(f.id)}
                          className="rounded text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
                        />
                        <span className="truncate">{f.title}</span>
                      </label>
                    );
                  })}
                </div>
                {errors.forms && <p className="text-[11px] text-rose-500 mt-1">{errors.forms}</p>}
              </div>
            )}
          </div>

          {/* Section 5: Invitation Options (SMS) */}
          {!editingMember && (
            <div className="p-3.5 bg-sky-50 border border-sky-200 rounded-xl space-y-2">
              <label className="flex items-start gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendSmsInvite}
                  onChange={(e) => setSendSmsInvite(e.target.checked)}
                  className="mt-0.5 rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                />
                <div>
                  <span className="text-xs font-bold text-sky-900 flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                    ارسال پیامک دعوت‌نامه و اطلاعات ورود به سامانه
                  </span>
                  <p className="text-[11px] text-sky-700 leading-relaxed mt-0.5">
                    پیامکی حاوی لینک ورود، نام کاربری ({mobile || 'شماره موبایل'}) و کلمه عبور موقت برای همکار ارسال خواهد شد.
                  </p>
                </div>
              </label>

              {sendSmsInvite && (
                <div className="p-2.5 bg-white border border-sky-100 rounded-lg text-[11px] text-slate-600 font-sans leading-relaxed">
                  <span className="font-bold text-slate-700">پیش‌نمایش پیامک:</span>
                  <div className="mt-1 p-2 bg-slate-50 rounded border border-slate-200 text-slate-700">
                    همکار گرامی {name || '...'}، دعوت‌نامه شما به عنوان «{jobTitle || 'عضو سامانه'}» در پنل فرم‌افزار صادر شد. جهت ورود و تعیین رمز عبور به لینک زیر مراجعه فرمایید:
                    <br />
                    <span className="font-mono text-blue-600">https://panel.formafzar.ir/invite/setup</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:from-blue-700 hover:to-indigo-700 transition flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>{editingMember ? 'ذخیره تغییرات دسترسی' : 'ثبت و ارسال دعوت‌نامه'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
