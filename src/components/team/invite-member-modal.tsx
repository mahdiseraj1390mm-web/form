'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  UserPlus, 
  ShieldCheck, 
  LayoutDashboard,
  FolderKanban,
  PenTool,
  Eye,
  EyeOff,
  Inbox,
  FileCheck,
  Sparkles,
  BarChart3,
  Settings,
  CalendarClock,
  Lock,
  Phone, 
  Briefcase, 
  User, 
  AlertCircle,
  CheckSquare,
  Square,
  ShieldAlert,
  Info
} from 'lucide-react';
import { TeamMember, TeamRole, DetailedPermissions } from '@/types/advanced';
import { Form } from '@/types/form';
import { AVAILABLE_SIDEBAR_TABS } from '@/lib/team-constants';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (memberData: Omit<TeamMember, 'id' | 'invitedAt'>) => void;
  editingMember?: TeamMember | null;
  forms?: Form[];
}

const TAB_ICONS: Record<string, React.ElementType> = {
  dashboard: LayoutDashboard,
  forms: FolderKanban,
  builder: PenTool,
  runner: Eye,
  submissions: Inbox,
  consultants: CalendarClock,
  media: FileCheck,
  chat: Sparkles,
  analytics: BarChart3,
  templates: Sparkles,
  settings: Settings,
};

const DEFAULT_DETAILED_PERMISSIONS: DetailedPermissions = {
  canCreateForms: true,
  canEditForms: true,
  canDeleteForms: false,
  canPublishForms: true,
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
};

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingMember,
}) => {
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [status, setStatus] = useState<'active' | 'suspended'>('active');
  const [allowedTabs, setAllowedTabs] = useState<string[]>(['submissions']);
  const [requireCaseCode, setRequireCaseCode] = useState(true);
  const [consultantId, setConsultantId] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (editingMember) {
      setName(editingMember.name || '');
      setMobile(editingMember.mobile || editingMember.username || '');
      setPassword(editingMember.password || '');
      setJobTitle(editingMember.jobTitle || '');
      setStatus(editingMember.status === 'suspended' ? 'suspended' : 'active');
      setAllowedTabs(
        Array.isArray(editingMember.allowedTabs) && editingMember.allowedTabs.length > 0
          ? editingMember.allowedTabs
          : ['submissions']
      );
      setRequireCaseCode(editingMember.requireCaseCode !== undefined ? editingMember.requireCaseCode : true);
      setConsultantId(editingMember.consultantId || '');
    } else {
      setName('');
      setMobile('');
      setPassword('');
      setJobTitle('همکار اداری و پذیرش');
      setStatus('active');
      setAllowedTabs(['submissions']);
      setRequireCaseCode(true);
      setConsultantId('');
    }
    setErrors({});
  }, [editingMember, isOpen]);

  if (!isOpen) return null;

  const toggleTab = (tabId: string) => {
    setAllowedTabs((prev) => {
      if (prev.includes(tabId)) {
        return prev.filter((id) => id !== tabId);
      } else {
        return [...prev, tabId];
      }
    });
  };

  const selectAllTabs = () => {
    setAllowedTabs(AVAILABLE_SIDEBAR_TABS.map((t) => t.id));
  };

  const deselectAllTabs = () => {
    setAllowedTabs([]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!name.trim()) newErrors.name = 'نام و نام خانوادگی را وارد کنید';
    
    const cleanMobile = mobile.trim().replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, '');
    if (!cleanMobile) {
      newErrors.mobile = 'شماره تلفن (نام کاربری) را وارد کنید';
    } else if (cleanMobile.length < 10) {
      newErrors.mobile = 'شماره تلفن باید معتبر باشد (حداقل ۱۰ یا ۱۱ رقم)';
    }

    if (!password.trim()) {
      newErrors.password = 'رمز عبور کاربر را تعیین کنید';
    } else if (password.trim().length < 4) {
      newErrors.password = 'رمز عبور باید حداقل ۴ نویسه باشد';
    }

    if (allowedTabs.length === 0) {
      newErrors.tabs = 'حداقل یک تب از منوی کناری را برای دسترسی کاربر انتخاب کنید';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    onSave({
      name: name.trim(),
      mobile: cleanMobile,
      username: cleanMobile,
      password: password.trim(),
      email: `${cleanMobile}@paya.local`,
      jobTitle: jobTitle.trim() || 'همکار سامانه',
      role: 'custom',
      status,
      accessibleFormIds: ['all'],
      permissions: DEFAULT_DETAILED_PERMISSIONS,
      allowedTabs,
      requireCaseCode,
      consultantId: consultantId.trim() || undefined,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-900">
        
        {/* سربرگ مودال */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 ring-1 ring-white/20">
              <UserPlus className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">
                {editingMember ? 'ویرایش اطلاعات و دسترسی‌های کاربر' : 'تعریف کاربر جدید و تعیین دسترسی‌ها'}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                تنظیم نام کاربری (تلفن)، رمز عبور و مجوزهای تب‌های منوی کناری
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* فرم مشخصات و دسترسی‌ها */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs max-h-[calc(85vh-5rem)] overflow-y-auto">
          
          {/* مشخصات کاربری و رمز عبور */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <User className="w-4 h-4 text-blue-600" />
              <span className="font-bold text-slate-800 text-sm">مشخصات هویتی و ورود به سامانه</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* نام و نام خانوادگی */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  نام و نام خانوادگی <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: زهرا مرادی"
                    className={`w-full pr-9 pl-3 py-2 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 text-xs ${
                      errors.name ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                    }`}
                  />
                </div>
                {errors.name && <p className="text-rose-500 text-[11px] mt-1">{errors.name}</p>}
              </div>

              {/* عنوان شغلی / سمت */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  سمت یا عنوان شغلی
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="مثال: اپراتور پذیرش / مشاور"
                    className="w-full pr-9 pl-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 text-xs"
                  />
                </div>
              </div>

              {/* مشاور متناظر در سامانه نوبت‌دهی (اختیاری) */}
              <div className="sm:col-span-2">
                <label className="block font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <CalendarClock className="w-3.5 h-3.5 text-blue-600" />
                  <span>انتساب به پروفایل مشاور در سامانه نوبت‌دهی (اختیاری)</span>
                </label>
                <select
                  value={consultantId}
                  onChange={(e) => setConsultantId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 text-xs cursor-pointer"
                >
                  <option value="">تطبیق خودکار و هوشمند بر اساس نام یا شماره همراه مشاور</option>
                  <option value="f_booking_farahmandi">جناب آقای یاسر فرهمندی (مشاور کودک - ۰۹۳۶۴۲۸۰۳۲۲)</option>
                  <option value="f_booking_teymourian">سرکار خانم تیموریان (مشاور کودک - ۰۹۱۴۰۲۸۸۹۳۸)</option>
                  <option value="f_booking_shavandi_child">سرکار خانم شوندی (مشاور کودک و نوجوان - ۰۹۱۲۷۹۴۴۹۸۵)</option>
                  <option value="f_booking_ansari_child">سرکار خانم انصاری (مشاور کودک و نوجوان - ۰۹۱۲۲۳۰۱۳۸۷)</option>
                  <option value="f_booking_zeynali_child">سرکار خانم زینلی (مشاور کودک و خانواده - ۰۹۳۷۹۷۰۹۶۳۵)</option>
                  <option value="f_booking_borhani_teen">جناب آقای علیرضا برهانی (مشاور نوجوان و خانواده - ۰۹۱۲۰۴۴۹۰۹۳)</option>
                  <option value="f_booking_rastgoo_teen">سرکار خانم راستگو (مشاور نوجوان و بالینی - ۰۹۱۲۳۰۶۹۴۴۷)</option>
                  <option value="f_booking_abdi_education">جناب آقای عبدی (مشاور تحصیلی - ۰۹۱۲۷۸۵۳۸۴۳)</option>
                  <option value="f_booking_torshizi">جناب آقای دکتر ترشیزی (مشاور بالینی - ۰۹۱۵۵۵۱۳۷۳۴)</option>
                  <option value="f_booking_yavari">سرکار خانم یاوری (مشاور بالینی - ۰۹۳۰۷۵۵۶۹۱۹)</option>
                  <option value="f_booking_golyayi_clinical">سرکار خانم گلیایی (مشاور بالینی - ۰۹۱۲۵۱۴۰۵۵۱)</option>
                  <option value="f_booking_sedighi_family">جناب آقای دکتر صدیقی (مشاور ازدواج و خانواده - ۰۹۱۵۱۵۳۸۲۲۷)</option>
                  <option value="f_booking_karimi_family">سرکار خانم کریمی (مشاور خانواده - ۰۹۱۹۲۱۸۰۴۸۱)</option>
                  <option value="f_booking_abdi_family">سرکار خانم عبدی (مشاور خانواده - ۰۹۱۹۲۸۸۶۲۵۸)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1">
                  در صورت انتخاب، پرونده‌ها و تایم‌لاین این مشاور مستقیماً به این حساب کاربری متصل می‌گردد.
                </p>
              </div>

              {/* نام کاربری (شماره تلفن) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  نام کاربری (شماره تلفن) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    placeholder="09123456789"
                    dir="ltr"
                    className={`w-full pr-9 pl-3 py-2 border rounded-xl bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-100 text-xs text-left ${
                      errors.mobile ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                    }`}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  کاربر با وارد کردن این شماره در صفحه ورود، وارد پنل می‌شود.
                </p>
                {errors.mobile && <p className="text-rose-500 text-[11px] mt-0.5">{errors.mobile}</p>}
              </div>

              {/* رمز عبور */}
              <div>
                <label className="block font-bold text-slate-700 mb-1.5">
                  رمز عبور تعریف‌شده <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="کلمه عبور جهت ورود کاربر"
                    dir="ltr"
                    className={`w-full pr-9 pl-10 py-2 border rounded-xl bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-100 text-xs text-left ${
                      errors.password ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
                    title={showPassword ? 'مخفی‌سازی' : 'نمایش رمز'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  رمز عبوری که ادمین برای این کاربر تعیین می‌کند.
                </p>
                {errors.password && <p className="text-rose-500 text-[11px] mt-0.5">{errors.password}</p>}
              </div>
            </div>

            {/* وضعیت کاربر */}
            <div className="pt-1 flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span className="font-bold text-slate-800">وضعیت دسترسی حساب کاربری</span>
                <p className="text-[11px] text-slate-500 mt-0.5">در صورت تعلیق، ورود کاربر به سیستم مسدود می‌شود.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${
                    status === 'active'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  فعال
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('suspended')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition ${
                    status === 'suspended'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  غیرفعال / تعلیق
                </button>
              </div>
            </div>
          </div>

          {/* دسترسی به تب‌های منوی کناری */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span className="font-bold text-slate-800 text-sm">دسترسی به تب‌های کناری سامانه</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllTabs}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
                >
                  انتخاب همه
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={deselectAllTabs}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-700"
                >
                  لغو همه
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              فقط تب‌هایی که در این قسمت تیک بزنید در منوی کناری کاربر نمایش داده می‌شوند و کاربر امکان ورود به آن‌ها را خواهد داشت:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              {AVAILABLE_SIDEBAR_TABS.map((tab) => {
                const isSelected = allowedTabs.includes(tab.id);
                const IconComponent = TAB_ICONS[tab.id] || LayoutDashboard;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => toggleTab(tab.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-right transition-all cursor-pointer ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50/50 text-blue-900 shadow-xs ring-1 ring-blue-400/20'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs">{tab.label}</span>
                    </div>

                    <div>
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
            {errors.tabs && <p className="text-rose-500 text-[11px] mt-1">{errors.tabs}</p>}
          </div>

          {/* تنظیمات صفحه پرونده مراجعین */}
          <div className="p-4 bg-gradient-to-r from-amber-50/70 via-blue-50/40 to-slate-50 border border-amber-200/80 rounded-2xl space-y-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-amber-500/10 text-amber-700 mt-0.5">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={requireCaseCode}
                    onChange={(e) => setRequireCaseCode(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                  />
                  <span className="font-extrabold text-slate-900 text-xs">
                    محدودیت پرونده مراجعین: الزام به وارد کردن کد پرونده
                  </span>
                </label>

                <p className="text-[11px] text-slate-600 leading-relaxed mt-2 pr-6">
                  {requireCaseCode ? (
                    <span className="text-amber-900 font-medium">
                      فعال است: وقتی کاربر وارد تب «پرونده مراجعین» می‌شود، باکسی جهت درخواست کد پرونده ظاهر می‌شود. کاربر صرفاً با وارد کردن کد پرونده می‌تواند آن پرونده خاص را مشاهده کند و در غیر این صورت هیچ پرونده‌ای برای او نمایش داده نمی‌شود.
                    </span>
                  ) : (
                    <span className="text-slate-500">
                      غیرفعال است: این کاربر مانند مدیر کل، به کل فهرست پرونده‌ها و کارتابل مراجعین دسترسی آزاد خواهد داشت.
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* دکمه‌های عملیات */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 transition"
            >
              {editingMember ? 'ذخیره تغییرات کاربر' : 'ایجاد و ثبت کاربر'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
