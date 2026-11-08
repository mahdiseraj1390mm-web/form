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
  Info,
  Clock,
  Plus,
  Trash2,
  CalendarDays,
  UserCheck
} from 'lucide-react';
import { TeamMember, TeamRole, DetailedPermissions } from '@/types/advanced';
import { Form, AppointmentData, WorkDayPeriod, DayScheduleConfig } from '@/types/form';
import { AVAILABLE_SIDEBAR_TABS } from '@/lib/team-constants';
import { COUNSELING_TOPICS, KNOWN_CONSULTANTS } from '@/lib/consultant-helpers';
import { toPersianDigits } from '@/lib/persian';

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

const WEEK_DAYS = [
  { dayIdx: 0, label: 'شنبه' },
  { dayIdx: 1, label: 'یکشنبه' },
  { dayIdx: 2, label: 'دوشنبه' },
  { dayIdx: 3, label: 'سه‌شنبه' },
  { dayIdx: 4, label: 'چهارشنبه' },
  { dayIdx: 5, label: 'پنج‌شنبه' },
  { dayIdx: 6, label: 'جمعه' },
];

export const InviteMemberModal: React.FC<InviteMemberModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingMember,
}) => {
  const [genderPrefix, setGenderPrefix] = useState<'آقا' | 'خانم'>('آقا');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [jobTitle, setJobTitle] = useState('');
  const [status, setStatus] = useState<'active' | 'suspended'>('active');
  const [allowedTabs, setAllowedTabs] = useState<string[]>(['submissions', 'consultants']);
  const [requireCaseCode, setRequireCaseCode] = useState(true);
  const [consultantId, setConsultantId] = useState('');
  const [allowedTopics, setAllowedTopics] = useState<string[]>([]);
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  // ساعت کاری مشاور
  const [slotDurationMinutes, setSlotDurationMinutes] = useState<number>(45);
  const [restTimeMinutes, setRestTimeMinutes] = useState<number>(15);
  const [availableDays, setAvailableDays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [startHour, setStartHour] = useState<string>('09:00');
  const [endHour, setEndHour] = useState<string>('17:00');
  const [daySchedules, setDaySchedules] = useState<Record<number, DayScheduleConfig>>({});

  useEffect(() => {
    if (editingMember) {
      // استخراج پیشوند از genderPrefix یا ابتدای نام
      let initialPrefix: 'آقا' | 'خانم' = editingMember.genderPrefix || 'آقا';
      let cleanName = editingMember.name || '';
      if (!editingMember.genderPrefix) {
        if (cleanName.startsWith('خانم')) {
          initialPrefix = 'خانم';
          cleanName = cleanName.replace(/^خانم\s+/, '');
        } else if (cleanName.startsWith('آقای') || cleanName.startsWith('آقا')) {
          initialPrefix = 'آقا';
          cleanName = cleanName.replace(/^آقای?\s+/, '');
        }
      }

      setGenderPrefix(initialPrefix);
      setName(cleanName);
      setMobile(editingMember.mobile || editingMember.username || '');
      setPassword(editingMember.password || '');
      setJobTitle(editingMember.jobTitle || '');
      setStatus(editingMember.status === 'suspended' ? 'suspended' : 'active');
      setAllowedTabs(
        Array.isArray(editingMember.allowedTabs) && editingMember.allowedTabs.length > 0
          ? editingMember.allowedTabs
          : ['submissions', 'consultants']
      );
      const isRestricted = editingMember.clientDossierAccess 
        ? editingMember.clientDossierAccess === 'restricted'
        : (editingMember.requireCaseCode !== undefined ? editingMember.requireCaseCode : true);
      setRequireCaseCode(isRestricted);
      setConsultantId(editingMember.consultantId || '');

      const topicMap: Record<string, string> = {
        teen: 'نوجوان',
        child: 'کودک',
        family: 'خانواده',
        clinical: 'بالینی',
        academic: 'تحصیلی',
        individual: 'فردی',
      };
      const loadedTopics = (editingMember.allowedTopics || []).map((t) => topicMap[t] || t);
      setAllowedTopics(loadedTopics);

      // بازیابی ساعت کاری
      const wh = editingMember.workingHours;
      if (wh) {
        setSlotDurationMinutes(wh.slotDurationMinutes || 45);
        setRestTimeMinutes(wh.restTimeMinutes ?? 15);
        setAvailableDays(wh.availableDays || [0, 1, 2, 3, 4]);
        setStartHour(wh.startHour || '09:00');
        setEndHour(wh.endHour || '17:00');
        setDaySchedules(wh.daySchedules || {});
      } else {
        // ساعات کاری پیش‌فرض استاندارد
        setSlotDurationMinutes(45);
        setRestTimeMinutes(15);
        setAvailableDays([0, 1, 2, 3, 4]);
        setStartHour('09:00');
        setEndHour('17:00');
        setDaySchedules({});
      }
    } else {
      setGenderPrefix('آقا');
      setName('');
      setMobile('');
      setPassword('');
      setJobTitle('مشاور تخصصی');
      setStatus('active');
      setAllowedTabs(['submissions', 'consultants']);
      setRequireCaseCode(true);
      setConsultantId('');
      setAllowedTopics(['clinical']);
      setSlotDurationMinutes(45);
      setRestTimeMinutes(15);
      setAvailableDays([0, 1, 2, 3, 4]);
      setStartHour('09:00');
      setEndHour('17:00');
      setDaySchedules({});
    }
    setCustomTopicInput('');
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

  const toggleTopic = (topicId: string) => {
    setAllowedTopics((prev) => {
      if (prev.includes(topicId)) {
        return prev.filter((t) => t !== topicId);
      } else {
        return [...prev, topicId];
      }
    });
  };

  const handleAddCustomTopic = () => {
    const val = customTopicInput.trim();
    if (val && !allowedTopics.includes(val)) {
      setAllowedTopics((prev) => [...prev, val]);
      setCustomTopicInput('');
    }
  };

  const toggleDayAvailable = (dayIdx: number) => {
    setAvailableDays((prev) => {
      if (prev.includes(dayIdx)) {
        return prev.filter((d) => d !== dayIdx);
      } else {
        return [...prev, dayIdx].sort((a, b) => a - b);
      }
    });
  };

  const updatePeriod = (dayIdx: number, periodIdx: number, key: 'startHour' | 'endHour', val: string) => {
    setDaySchedules((prev) => {
      const currentPeriods = (prev[dayIdx]?.periods && prev[dayIdx].periods.length > 0)
        ? [...prev[dayIdx].periods]
        : [{ startHour: startHour || '09:00', endHour: endHour || '17:00' }];

      currentPeriods[periodIdx] = {
        ...currentPeriods[periodIdx],
        [key]: val,
      };

      return {
        ...prev,
        [dayIdx]: {
          enabled: true,
          periods: currentPeriods,
        },
      };
    });
  };

  const addPeriodToDay = (dayIdx: number) => {
    setDaySchedules((prev) => {
      const currentPeriods = (prev[dayIdx]?.periods && prev[dayIdx].periods.length > 0)
        ? [...prev[dayIdx].periods]
        : [{ startHour: startHour || '09:00', endHour: endHour || '17:00' }];

      const lastPeriod = currentPeriods[currentPeriods.length - 1];
      let newStart = '16:00';
      let newEnd = '19:00';
      if (lastPeriod && lastPeriod.endHour) {
        const [h, m] = lastPeriod.endHour.split(':').map(Number);
        const nextH = Math.min(20, (h || 14) + 1);
        const nextEndH = Math.min(22, nextH + 2);
        newStart = `${nextH < 10 ? '0' + nextH : nextH}:${m < 10 ? '0' + m : m || '00'}`;
        newEnd = `${nextEndH < 10 ? '0' + nextEndH : nextEndH}:${m < 10 ? '0' + m : m || '00'}`;
      }

      return {
        ...prev,
        [dayIdx]: {
          enabled: true,
          periods: [...currentPeriods, { startHour: newStart, endHour: newEnd }],
        },
      };
    });
  };

  const removePeriodFromDay = (dayIdx: number, periodIdx: number) => {
    setDaySchedules((prev) => {
      const currentPeriods = prev[dayIdx]?.periods || [];
      const updated = currentPeriods.filter((_, idx) => idx !== periodIdx);
      return {
        ...prev,
        [dayIdx]: {
          enabled: updated.length > 0,
          periods: updated,
        },
      };
    });
  };

  const applyPresetDays = (presetDays: number[], sH: string, eH: string) => {
    setAvailableDays(presetDays);
    const newSchedules: Record<number, DayScheduleConfig> = {};
    presetDays.forEach((d) => {
      newSchedules[d] = {
        enabled: true,
        periods: [{ startHour: sH, endHour: eH }],
      };
    });
    setDaySchedules(newSchedules);
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
      newErrors.password = 'رمز عبور را تعیین کنید';
    } else if (password.trim().length < 4) {
      newErrors.password = 'رمز عبور باید حداقل ۴ نویسه باشد';
    }

    if (allowedTabs.length === 0) {
      newErrors.tabs = 'حداقل یک تب از منوی کناری را برای دسترسی مشاور انتخاب کنید';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // ساخت ساعات کاری
    const workingHoursData: AppointmentData = {
      slotDurationMinutes,
      restTimeMinutes,
      availableDays,
      startHour,
      endHour,
      daySchedules,
      holidays: ['جمعه'],
      capacityPerSlot: 1,
    };

    onSave({
      name: name.trim(),
      genderPrefix,
      mobile: cleanMobile,
      username: cleanMobile,
      password: password.trim(),
      email: `${cleanMobile}@paya.local`,
      jobTitle: jobTitle.trim() || 'مشاور مرکز',
      role: 'custom',
      status,
      accessibleFormIds: ['all'],
      permissions: DEFAULT_DETAILED_PERMISSIONS,
      allowedTabs,
      requireCaseCode,
      clientDossierAccess: requireCaseCode ? 'restricted' : 'unrestricted',
      consultantId: consultantId.trim() || undefined,
      allowedTopics: allowedTopics.length > 0 ? allowedTopics : undefined,
      workingHours: workingHoursData,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-900 flex flex-col max-h-[92vh]">
        
        {/* سربرگ مودال */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 ring-1 ring-white/20">
              <UserCheck className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">
                {editingMember ? 'ویرایش مشخصات و ساعات کاری مشاور' : 'تعریف مشاور جدید و تعیین مشخصات'}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                تنظیم پیشوند، نام، موضوعات مشاوره، ساعات کاری هفتگی و مجوزهای سیستم
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* بدنه فرم */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 text-xs overflow-y-auto flex-1">
          
          {/* ۱. مشخصات هویتی و ورود */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
              <User className="w-4 h-4 text-blue-600" />
              <span className="font-extrabold text-slate-800 text-sm">۱. مشخصات هویتی و ورود به سامانه</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5">
              {/* پیشوند و نام و نام خانوادگی */}
              <div className="sm:col-span-3">
                <label className="block font-bold text-slate-700 mb-1.5">
                  پیشوند <span className="text-rose-500">*</span>
                </label>
                <div className="flex rounded-xl p-0.5 bg-slate-100 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setGenderPrefix('آقا')}
                    className={`flex-1 py-2 font-bold text-xs rounded-lg transition-all ${
                      genderPrefix === 'آقا'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    آقا
                  </button>
                  <button
                    type="button"
                    onClick={() => setGenderPrefix('خانم')}
                    className={`flex-1 py-2 font-bold text-xs rounded-lg transition-all ${
                      genderPrefix === 'خانم'
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    خانم
                  </button>
                </div>
              </div>

              <div className="sm:col-span-5">
                <label className="block font-bold text-slate-700 mb-1.5">
                  نام و نام خانوادگی <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="مثال: یاسر فرهمندی"
                    className={`w-full pr-9 pl-3 py-2 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 text-xs ${
                      errors.name ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                    }`}
                  />
                </div>
                {errors.name && <p className="text-rose-500 text-[11px] mt-1">{errors.name}</p>}
              </div>

              {/* سمت یا تخصص مشاوره */}
              <div className="sm:col-span-4">
                <label className="block font-bold text-slate-700 mb-1.5">
                  تخصص یا سمت
                </label>
                <div className="relative">
                  <Briefcase className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="مثال: روانشناس بالینی"
                    className="w-full pr-9 pl-3 py-2 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 text-xs"
                  />
                </div>
              </div>

              {/* شماره تلفن همراه (نام کاربری) */}
              <div className="sm:col-span-6">
                <label className="block font-bold text-slate-700 mb-1.5">
                  شماره همراه (نام کاربری ورود) <span className="text-rose-500">*</span>
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
                {errors.mobile && <p className="text-rose-500 text-[11px] mt-1">{errors.mobile}</p>}
              </div>

              {/* رمز عبور */}
              <div className="sm:col-span-6">
                <label className="block font-bold text-slate-700 mb-1.5">
                  رمز عبور ورود <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="کلمه عبور جهت ورود مشاور"
                    dir="ltr"
                    className={`w-full pr-9 pl-10 py-2 border rounded-xl bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-100 text-xs text-left ${
                      errors.password ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-2.5 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-rose-500 text-[11px] mt-1">{errors.password}</p>}
              </div>
            </div>

            {/* وضعیت حساب */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <span className="font-bold text-slate-800">وضعیت حساب کاربری مشاور</span>
                <p className="text-[11px] text-slate-500 mt-0.5">در صورت تعلیق، ورود مشاور به سیستم و رزرو نوبت غیرفعال می‌شود.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('active')}
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
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
                  className={`px-3 py-1.5 rounded-lg font-bold text-xs transition cursor-pointer ${
                    status === 'suspended'
                      ? 'bg-rose-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  معلق
                </button>
              </div>
            </div>
          </div>

          {/* ۲. موضوعات مراجعه و حوزه‌های مشاوره */}
          <div className="space-y-3 p-4 bg-indigo-50/40 border border-indigo-100 rounded-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="font-extrabold text-slate-800 text-sm">۲. موضوعات مراجعه و حوزه‌های تخصصی مشاور</span>
              </div>
              <span className="text-[11px] text-indigo-700 font-semibold">امکان انتخاب چند موضوع</span>
            </div>

            <p className="text-[11px] text-slate-600">
              موضوعاتی که این مشاور در آن‌ها به مراجعین نوبت مشاوره می‌دهد را تیک بزنید:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
              {COUNSELING_TOPICS.map((topic) => {
                const isSelected = allowedTopics.includes(topic.id);
                return (
                  <button
                    key={topic.id}
                    type="button"
                    onClick={() => toggleTopic(topic.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-right transition-all cursor-pointer ${
                      isSelected
                        ? 'border-indigo-500 bg-white text-indigo-900 shadow-xs ring-1 ring-indigo-400/20'
                        : 'border-slate-200 bg-white/70 text-slate-600 hover:bg-white'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs block">{topic.name}</span>
                      <span className="text-[10px] text-slate-400">{topic.description}</span>
                    </div>
                    <div>
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 shrink-0" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* افزودن موضوع دلخواه */}
            <div className="pt-2 flex items-center gap-2">
              <input
                type="text"
                value={customTopicInput}
                onChange={(e) => setCustomTopicInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomTopic();
                  }
                }}
                placeholder="افزودن موضوع یا حوزه تخصصی دیگر..."
                className="flex-1 px-3 py-1.5 border border-slate-300 rounded-xl bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="button"
                onClick={handleAddCustomTopic}
                className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition cursor-pointer"
              >
                + افزودن
              </button>
            </div>

            {/* نمایش موضوعات سفارشی اضافه‌شده */}
            {allowedTopics.filter((t) => !COUNSELING_TOPICS.some((c) => c.id === t)).length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {allowedTopics
                  .filter((t) => !COUNSELING_TOPICS.some((c) => c.id === t))
                  .map((custTopic) => (
                    <span
                      key={custTopic}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-indigo-200 text-indigo-900 rounded-lg text-xs font-semibold"
                    >
                      <span>{custTopic}</span>
                      <button
                        type="button"
                        onClick={() => toggleTopic(custTopic)}
                        className="text-slate-400 hover:text-rose-500"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* ۳. ساعت کاری مشاور (مشابه فرم نوبت‌دهی) */}
          <div className="space-y-4 p-4 bg-emerald-50/30 border border-emerald-200/80 rounded-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span className="font-extrabold text-slate-800 text-sm">۳. ساعت کاری مشاور (تنظیم روزها و نوبت‌ها)</span>
              </div>
              <span className="text-[10px] text-emerald-700 font-semibold">همگام‌سازی مستقیم با فرم نوبت‌دهی</span>
            </div>

            {/* مدت هر جلسه و زمان استراحت */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  مدت هر جلسه مشاوره:
                </label>
                <select
                  value={slotDurationMinutes}
                  onChange={(e) => setSlotDurationMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 cursor-pointer"
                >
                  <option value={15}>۱۵ دقیقه</option>
                  <option value={20}>۲۰ دقیقه</option>
                  <option value={30}>۳۰ دقیقه</option>
                  <option value={45}>۴۵ دقیقه (استاندارد جلسات بالحق)</option>
                  <option value={60}>۶۰ دقیقه (۱ ساعت)</option>
                  <option value={90}>۹۰ دقیقه</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  زمان استراحت بین جلسات:
                </label>
                <select
                  value={restTimeMinutes}
                  onChange={(e) => setRestTimeMinutes(Number(e.target.value))}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 cursor-pointer"
                >
                  <option value={0}>بدون استراحت (۰ دقیقه)</option>
                  <option value={5}>۵ دقیقه</option>
                  <option value={10}>۱۰ دقیقه</option>
                  <option value={15}>۱۵ دقیقه (استاندارد)</option>
                  <option value={20}>۲۰ دقیقه</option>
                  <option value={30}>۳۰ دقیقه</option>
                </select>
              </div>
            </div>

            {/* الگوهای آماده روزهای حضور */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold text-slate-600 block">الگوهای سریع روزهای کاری مشاور:</span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'شنبه تا چهارشنبه (۰۹-۱۷)', days: [0, 1, 2, 3, 4], s: '09:00', e: '17:00' },
                  { label: 'روزهای زوج (شنبه، دوشنبه، چهارشنبه)', days: [0, 2, 4], s: '10:00', e: '18:00' },
                  { label: 'روزهای فرد (یکشنبه، سه‌شنبه)', days: [1, 3], s: '10:00', e: '18:00' },
                  { label: 'فقط پنج‌شنبه‌ها (۰۹-۱۳)', days: [5], s: '09:00', e: '13:00' },
                  { label: 'فقط جمعه‌ها (۰۹-۱۲)', days: [6], s: '09:00', e: '12:00' },
                  { label: 'همه روزها بجز جمعه', days: [0, 1, 2, 3, 4, 5], s: '09:00', e: '17:00' },
                ].map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => applyPresetDays(preset.days, preset.s, preset.e)}
                    className="px-2 py-1 text-[10px] rounded-lg bg-white hover:bg-emerald-100/60 text-slate-700 hover:text-emerald-900 border border-slate-200 transition-colors cursor-pointer font-medium"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* لیست روزهای هفته و ساعات شیفت */}
            <div className="space-y-2 pt-2">
              {WEEK_DAYS.map(({ dayIdx, label }) => {
                const isDayEnabled = availableDays.includes(dayIdx);
                const daySchedule = daySchedules[dayIdx];
                const periods: WorkDayPeriod[] = (daySchedule?.periods && daySchedule.periods.length > 0)
                  ? daySchedule.periods
                  : [{ startHour, endHour }];

                return (
                  <div
                    key={dayIdx}
                    className={`p-3 rounded-2xl border transition-all ${
                      isDayEnabled
                        ? 'bg-white border-slate-300 shadow-2xs space-y-2'
                        : 'bg-slate-100/50 border-slate-200 opacity-60 flex items-center justify-between'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 select-none">
                        <input
                          type="checkbox"
                          checked={isDayEnabled}
                          onChange={() => toggleDayAvailable(dayIdx)}
                          className="w-4 h-4 text-emerald-600 rounded border-slate-300 cursor-pointer"
                        />
                        <span className="text-xs">{label}</span>
                        {isDayEnabled ? (
                          <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md font-semibold border border-emerald-100">
                            {toPersianDigits(periods.length)} نوبت کاری
                          </span>
                        ) : (
                          <span className="text-[10px] text-rose-500 font-semibold">(تعطیل)</span>
                        )}
                      </label>

                      {isDayEnabled && (
                        <button
                          type="button"
                          onClick={() => addPeriodToDay(dayIdx)}
                          className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200 transition cursor-pointer"
                        >
                          <Plus className="w-3 h-3 text-emerald-600" />
                          <span>افزودن شیفت جدید</span>
                        </button>
                      )}
                    </div>

                    {isDayEnabled && (
                      <div className="space-y-1.5 pt-1.5 border-t border-slate-100">
                        {periods.map((period, pIdx) => (
                          <div
                            key={pIdx}
                            className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px]"
                          >
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-700 min-w-[50px]">
                                نوبت {toPersianDigits(pIdx + 1)}:
                              </span>
                              <div className="flex items-center gap-1 font-mono">
                                <span className="text-[10px] text-slate-500">از</span>
                                <input
                                  type="time"
                                  value={period.startHour || '09:00'}
                                  onChange={(e) => updatePeriod(dayIdx, pIdx, 'startHour', e.target.value)}
                                  className="px-2 py-1 border border-slate-300 rounded-lg text-xs bg-white text-center"
                                />
                                <span className="text-[10px] text-slate-500">تا</span>
                                <input
                                  type="time"
                                  value={period.endHour || '17:00'}
                                  onChange={(e) => updatePeriod(dayIdx, pIdx, 'endHour', e.target.value)}
                                  className="px-2 py-1 border border-slate-300 rounded-lg text-xs bg-white text-center"
                                />
                              </div>
                            </div>

                            {periods.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removePeriodFromDay(dayIdx, pIdx)}
                                className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                                title="حذف این نوبت"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ۴. تنظیمات دسترسی به پرونده‌های مراجعین */}
          <div className="p-4 bg-gradient-to-r from-amber-50/60 via-slate-50 to-blue-50/40 border border-amber-200/80 rounded-2xl space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-amber-200/60">
              <ShieldAlert className="w-4 h-4 text-amber-700" />
              <span className="font-extrabold text-slate-800 text-sm">۴. دسترسی به پرونده مراجعان</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                type="button"
                onClick={() => setRequireCaseCode(true)}
                className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
                  requireCaseCode
                    ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-400/30'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full border-2 ${requireCaseCode ? 'border-amber-600 bg-amber-600' : 'border-slate-300'}`} />
                  <span className="font-extrabold text-xs text-amber-950">دسترسی محدود شده</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                  مشاور برای مشاهده پرونده هر مراجع، ملزم به وارد کردن <strong>کد پرونده</strong> مراجع است. لیست کامل مراجعین دیگر برای وی نمایش داده نمی‌شود.
                </p>
              </button>

              <button
                type="button"
                onClick={() => setRequireCaseCode(false)}
                className={`p-3.5 rounded-2xl border text-right transition-all cursor-pointer ${
                  !requireCaseCode
                    ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-400/30'
                    : 'border-slate-200 bg-white hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded-full border-2 ${!requireCaseCode ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'}`} />
                  <span className="font-extrabold text-xs text-emerald-950">دسترسی محدود نشده (آزاد)</span>
                </div>
                <p className="text-[11px] text-slate-600 mt-2 leading-relaxed">
                  مشاور مانند مدیریت سیستم، به <strong>کل فهرست پرونده‌ها و کارتابل مراجعین</strong> دسترسی آزاد و نامحدود خواهد داشت.
                </p>
              </button>
            </div>
          </div>

          {/* ۵. میزان دسترسی به سامانه بر اساس تب‌های نوار کناری */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                <span className="font-extrabold text-slate-800 text-sm">۵. دسترسی به تب‌های نوار کناری سامانه</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={selectAllTabs}
                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                >
                  انتخاب همه
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={deselectAllTabs}
                  className="text-[11px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                >
                  لغو همه
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              تب‌هایی که در این قسمت تیک بزنید در منوی کناری مشاور فعال بوده و امکان ورود به آن‌ها را خواهد داشت:
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

          {/* دکمه‌های عملیات */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-700 shadow-md shadow-blue-500/20 transition cursor-pointer"
            >
              {editingMember ? 'ذخیره تغییرات مشاور' : 'ایجاد و ثبت مشاور'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};