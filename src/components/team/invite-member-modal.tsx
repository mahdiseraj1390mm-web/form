'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  UserCheck,
  RotateCcw,
  Check
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
  // اطلاعات کاربری
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

  // ساعت کاری عمومی مشاور
  const [slotDurationMinutes, setSlotDurationMinutes] = useState<number>(45);
  const [restTimeMinutes, setRestTimeMinutes] = useState<number>(15);
  const [availableDays, setAvailableDays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [startHour, setStartHour] = useState<string>('09:00');
  const [endHour, setEndHour] = useState<string>('17:00');
  const [daySchedules, setDaySchedules] = useState<Record<number, DayScheduleConfig>>({});

  // ساعات کاری اختصاصی هر موضوع: topicKey -> AppointmentData
  const [topicSchedules, setTopicSchedules] = useState<Record<string, AppointmentData>>({});
  // تب فعال تنظیم ساعت کاری: 'all' برای عمومی یا کلید موضوع
  const [activeScheduleTopic, setActiveScheduleTopic] = useState<string>('all');

  useEffect(() => {
    if (editingMember) {
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

      // بازیابی ساعت کاری عمومی و اختصاصی هر موضوع
      const wh = editingMember.workingHours;
      if (wh) {
        setSlotDurationMinutes(wh.slotDurationMinutes || 45);
        setRestTimeMinutes(wh.restTimeMinutes ?? 15);
        setAvailableDays(wh.availableDays || [0, 1, 2, 3, 4]);
        setStartHour(wh.startHour || '09:00');
        setEndHour(wh.endHour || '17:00');
        setDaySchedules(wh.daySchedules || {});
        setTopicSchedules(wh.topicSchedules || editingMember.topicWorkingHours || {});
      } else {
        setSlotDurationMinutes(45);
        setRestTimeMinutes(15);
        setAvailableDays([0, 1, 2, 3, 4]);
        setStartHour('09:00');
        setEndHour('17:00');
        setDaySchedules({});
        setTopicSchedules(editingMember.topicWorkingHours || {});
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
      setAllowedTopics(['بالینی']);
      setSlotDurationMinutes(45);
      setRestTimeMinutes(15);
      setAvailableDays([0, 1, 2, 3, 4]);
      setStartHour('09:00');
      setEndHour('17:00');
      setDaySchedules({});
      setTopicSchedules({});
    }
    setActiveScheduleTopic('all');
    setCustomTopicInput('');
    setErrors({});
  }, [editingMember, isOpen]);

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
        const next = prev.filter((t) => t !== topicId);
        if (activeScheduleTopic === topicId) {
          setActiveScheduleTopic('all');
        }
        return next;
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

  // دریافت ساعات کاری جاری بر اساس تب انتخابی
  const currentSchedule = useMemo((): AppointmentData => {
    if (activeScheduleTopic === 'all') {
      return {
        slotDurationMinutes,
        restTimeMinutes,
        availableDays,
        startHour,
        endHour,
        daySchedules,
        holidays: ['جمعه'],
        capacityPerSlot: 1,
      };
    }
    const topicCustom = topicSchedules[activeScheduleTopic];
    if (topicCustom) return topicCustom;
    // در صورت عدم وجود تنظیم اختصاصی، پیش‌فرض عمومی را برمی‌گرداند
    return {
      slotDurationMinutes,
      restTimeMinutes,
      availableDays,
      startHour,
      endHour,
      daySchedules,
      holidays: ['جمعه'],
      capacityPerSlot: 1,
    };
  }, [
    activeScheduleTopic,
    slotDurationMinutes,
    restTimeMinutes,
    availableDays,
    startHour,
    endHour,
    daySchedules,
    topicSchedules,
  ]);

  const isCustomForActiveTopic = activeScheduleTopic !== 'all' && !!topicSchedules[activeScheduleTopic];

  // به‌روزرسانی ساعات کاری جاری (عمومی یا اختصاصی موضوع)
  const updateCurrentSchedule = (updater: (prev: AppointmentData) => AppointmentData) => {
    if (activeScheduleTopic === 'all') {
      const cur: AppointmentData = {
        slotDurationMinutes,
        restTimeMinutes,
        availableDays,
        startHour,
        endHour,
        daySchedules,
        holidays: ['جمعه'],
        capacityPerSlot: 1,
      };
      const next = updater(cur);
      if (next.slotDurationMinutes !== undefined) setSlotDurationMinutes(next.slotDurationMinutes);
      if (next.restTimeMinutes !== undefined) setRestTimeMinutes(next.restTimeMinutes);
      if (next.availableDays !== undefined) setAvailableDays(next.availableDays);
      if (next.startHour !== undefined) setStartHour(next.startHour);
      if (next.endHour !== undefined) setEndHour(next.endHour);
      if (next.daySchedules !== undefined) setDaySchedules(next.daySchedules);
    } else {
      setTopicSchedules((prev) => {
        const base = prev[activeScheduleTopic] || {
          slotDurationMinutes,
          restTimeMinutes,
          availableDays: [...availableDays],
          startHour,
          endHour,
          daySchedules: JSON.parse(JSON.stringify(daySchedules)),
          holidays: ['جمعه'],
          capacityPerSlot: 1,
        };
        return {
          ...prev,
          [activeScheduleTopic]: updater(base),
        };
      });
    }
  };

  const enableCustomScheduleForActiveTopic = () => {
    if (activeScheduleTopic === 'all') return;
    setTopicSchedules((prev) => ({
      ...prev,
      [activeScheduleTopic]: {
        slotDurationMinutes,
        restTimeMinutes,
        availableDays: [...availableDays],
        startHour,
        endHour,
        daySchedules: JSON.parse(JSON.stringify(daySchedules)),
        holidays: ['جمعه'],
        capacityPerSlot: 1,
      },
    }));
  };

  const disableCustomScheduleForActiveTopic = () => {
    if (activeScheduleTopic === 'all') return;
    setTopicSchedules((prev) => {
      const copy = { ...prev };
      delete copy[activeScheduleTopic];
      return copy;
    });
  };

  const toggleDayAvailable = (dayIdx: number) => {
    updateCurrentSchedule((cur) => {
      const days = cur.availableDays || [];
      const newDays = days.includes(dayIdx)
        ? days.filter((d) => d !== dayIdx)
        : [...days, dayIdx].sort((a, b) => a - b);
      return { ...cur, availableDays: newDays };
    });
  };

  const updatePeriod = (dayIdx: number, periodIdx: number, key: 'startHour' | 'endHour', val: string) => {
    updateCurrentSchedule((cur) => {
      const schedules = { ...(cur.daySchedules || {}) };
      const currentPeriods = (schedules[dayIdx]?.periods && schedules[dayIdx].periods.length > 0)
        ? [...schedules[dayIdx].periods]
        : [{ startHour: cur.startHour || '09:00', endHour: cur.endHour || '17:00' }];

      currentPeriods[periodIdx] = {
        ...currentPeriods[periodIdx],
        [key]: val,
      };

      schedules[dayIdx] = {
        enabled: true,
        periods: currentPeriods,
      };

      return { ...cur, daySchedules: schedules };
    });
  };

  const addPeriodToDay = (dayIdx: number) => {
    updateCurrentSchedule((cur) => {
      const schedules = { ...(cur.daySchedules || {}) };
      const currentPeriods = (schedules[dayIdx]?.periods && schedules[dayIdx].periods.length > 0)
        ? [...schedules[dayIdx].periods]
        : [{ startHour: cur.startHour || '09:00', endHour: cur.endHour || '17:00' }];

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

      schedules[dayIdx] = {
        enabled: true,
        periods: [...currentPeriods, { startHour: newStart, endHour: newEnd }],
      };

      return { ...cur, daySchedules: schedules };
    });
  };

  const removePeriodFromDay = (dayIdx: number, periodIdx: number) => {
    updateCurrentSchedule((cur) => {
      const schedules = { ...(cur.daySchedules || {}) };
      const currentPeriods = schedules[dayIdx]?.periods || [];
      const updated = currentPeriods.filter((_, idx) => idx !== periodIdx);
      schedules[dayIdx] = {
        enabled: updated.length > 0,
        periods: updated,
      };
      return { ...cur, daySchedules: schedules };
    });
  };

  const applyPresetDays = (presetDays: number[], sH: string, eH: string) => {
    updateCurrentSchedule((cur) => {
      const newSchedules: Record<number, DayScheduleConfig> = {};
      presetDays.forEach((d) => {
        newSchedules[d] = {
          enabled: true,
          periods: [{ startHour: sH, endHour: eH }],
        };
      });
      return {
        ...cur,
        availableDays: presetDays,
        startHour: sH,
        endHour: eH,
        daySchedules: newSchedules,
      };
    });
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

    // ساخت ساعات کاری عمومی به همراه ساعات اختصاصی هر موضوع
    const workingHoursData: AppointmentData = {
      slotDurationMinutes,
      restTimeMinutes,
      availableDays,
      startHour,
      endHour,
      daySchedules,
      holidays: ['جمعه'],
      capacityPerSlot: 1,
      topicSchedules: Object.keys(topicSchedules).length > 0 ? topicSchedules : undefined,
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
      topicWorkingHours: Object.keys(topicSchedules).length > 0 ? topicSchedules : undefined,
    });

    onClose();
  };

  // عنوان موضوع فعال جهت نمایش در پیام‌ها
  const activeTopicDisplay = useMemo(() => {
    if (activeScheduleTopic === 'all') return 'ساعت کاری عمومی';
    const topObj = COUNSELING_TOPICS.find((t) => t.id === activeScheduleTopic || t.name === activeScheduleTopic);
    return topObj ? topObj.name : activeScheduleTopic;
  }, [activeScheduleTopic]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-6xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-900 flex flex-col max-h-[94vh]">
        
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
                تنظیم اطلاعات کاربری و دسترسی‌ها (راست) و موضوعات و ساعات کاری هر موضوع (چپ)
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

        {/* بدنه فرم: دو ستونه بزرگ (راست: اطلاعات و دسترسی‌ها / چپ: موضوعات و ساعات کاری) */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* ============================================================ */}
            {/* ستون راست (۵ ستون از ۱۲): اطلاعات کاربری و دسترسی‌های مشاور */}
            {/* ============================================================ */}
            <div className="lg:col-span-5 space-y-5">
              
              {/* ۱. مشخصات هویتی و ورود به سامانه */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
                  <User className="w-4 h-4 text-blue-600" />
                  <span className="font-extrabold text-slate-800 text-xs sm:text-sm">۱. مشخصات هویتی و ورود به سامانه</span>
                </div>

                <div className="space-y-3">
                  {/* پیشوند و نام */}
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-4">
                      <label className="block font-bold text-slate-700 text-[11px] mb-1">
                        پیشوند <span className="text-rose-500">*</span>
                      </label>
                      <div className="flex rounded-xl p-0.5 bg-white border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setGenderPrefix('آقا')}
                          className={`flex-1 py-1.5 font-bold text-xs rounded-lg transition-all cursor-pointer ${
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
                          className={`flex-1 py-1.5 font-bold text-xs rounded-lg transition-all cursor-pointer ${
                            genderPrefix === 'خانم'
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          خانم
                        </button>
                      </div>
                    </div>

                    <div className="col-span-8">
                      <label className="block font-bold text-slate-700 text-[11px] mb-1">
                        نام و نام خانوادگی <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="مثال: یاسر فرهمندی"
                        className={`w-full px-3 py-1.5 border rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 text-xs ${
                          errors.name ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                        }`}
                      />
                      {errors.name && <p className="text-rose-500 text-[10px] mt-1">{errors.name}</p>}
                    </div>
                  </div>

                  {/* سمت یا تخصص مشاوره */}
                  <div>
                    <label className="block font-bold text-slate-700 text-[11px] mb-1">
                      سمت یا تخصص مشاوره
                    </label>
                    <div className="relative">
                      <Briefcase className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                      <input
                        type="text"
                        value={jobTitle}
                        onChange={(e) => setJobTitle(e.target.value)}
                        placeholder="مثال: روانشناس بالینی و خانواده"
                        className="w-full pr-9 pl-3 py-1.5 border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 text-xs"
                      />
                    </div>
                  </div>

                  {/* شماره همراه (نام کاربری) */}
                  <div>
                    <label className="block font-bold text-slate-700 text-[11px] mb-1">
                      شماره همراه (نام کاربری ورود) <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Phone className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                      <input
                        type="text"
                        value={mobile}
                        onChange={(e) => setMobile(e.target.value)}
                        placeholder="09123456789"
                        dir="ltr"
                        className={`w-full pr-9 pl-3 py-1.5 border rounded-xl bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-100 text-xs text-left ${
                          errors.mobile ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                        }`}
                      />
                    </div>
                    {errors.mobile && <p className="text-rose-500 text-[10px] mt-1">{errors.mobile}</p>}
                  </div>

                  {/* کلمه عبور */}
                  <div>
                    <label className="block font-bold text-slate-700 text-[11px] mb-1">
                      رمز عبور ورود به سامانه <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="رمز عبور حساب مشاور"
                        dir="ltr"
                        className={`w-full pr-9 pl-10 py-1.5 border rounded-xl bg-white font-mono focus:outline-none focus:ring-2 focus:ring-blue-100 text-xs text-left ${
                          errors.password ? 'border-rose-400 bg-rose-50/30' : 'border-slate-300'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute left-2.5 top-2 text-slate-400 hover:text-slate-600 focus:outline-none cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    {errors.password && <p className="text-rose-500 text-[10px] mt-1">{errors.password}</p>}
                  </div>

                  {/* وضعیت حساب مشاور */}
                  <div className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl">
                    <div>
                      <span className="font-bold text-slate-800 text-xs">وضعیت حساب کاربری</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">در صورت تعلیق، ورود مشاور مسدود می‌شود.</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setStatus('active')}
                        className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                          status === 'active'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        فعال
                      </button>
                      <button
                        type="button"
                        onClick={() => setStatus('suspended')}
                        className={`px-3 py-1 rounded-lg font-bold text-xs transition cursor-pointer ${
                          status === 'suspended'
                            ? 'bg-rose-600 text-white shadow-xs'
                            : 'bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        معلق
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* ۲. دسترسی به پرونده مراجعان */}
              <div className="p-4 bg-gradient-to-r from-amber-50/60 via-slate-50 to-blue-50/40 border border-amber-200/80 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 pb-2 border-b border-amber-200/60">
                  <ShieldAlert className="w-4 h-4 text-amber-700" />
                  <span className="font-extrabold text-slate-800 text-xs sm:text-sm">۲. دسترسی به پرونده مراجعان</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={() => setRequireCaseCode(true)}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                      requireCaseCode
                        ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-400/30'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-full border-2 ${requireCaseCode ? 'border-amber-600 bg-amber-600' : 'border-slate-300'}`} />
                      <span className="font-extrabold text-xs text-amber-950">دسترسی محدود شده</span>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1.5 leading-relaxed">
                      مشاور فقط با وارد کردن <strong>کد پرونده</strong> می‌تواند پرونده مراجع را مشاهده کند.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRequireCaseCode(false)}
                    className={`p-3 rounded-xl border text-right transition-all cursor-pointer ${
                      !requireCaseCode
                        ? 'border-emerald-500 bg-emerald-50/80 ring-2 ring-emerald-400/30'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-full border-2 ${!requireCaseCode ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'}`} />
                      <span className="font-extrabold text-xs text-emerald-950">دسترسی آزاد (نامحدود)</span>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1.5 leading-relaxed">
                      مشاور به تمام فهرست و پرونده‌های کارتابل مراجعین دسترسی آزاد خواهد داشت.
                    </p>
                  </button>
                </div>
              </div>

              {/* ۳. دسترسی به تب‌های نوار کناری سامانه */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <span className="font-extrabold text-slate-800 text-xs sm:text-sm">۳. دسترسی به تب‌های نوار کناری</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllTabs}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 cursor-pointer"
                    >
                      انتخاب همه
                    </button>
                    <span className="text-slate-300">|</span>
                    <button
                      type="button"
                      onClick={deselectAllTabs}
                      className="text-[10px] font-bold text-slate-500 hover:text-slate-700 cursor-pointer"
                    >
                      لغو همه
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_SIDEBAR_TABS.map((tab) => {
                    const isSelected = allowedTabs.includes(tab.id);
                    const IconComponent = TAB_ICONS[tab.id] || LayoutDashboard;

                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => toggleTab(tab.id)}
                        className={`flex items-center justify-between p-2 rounded-xl border text-right transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/60 text-blue-900 shadow-2xs ring-1 ring-blue-400/20'
                            : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className={`p-1 rounded-md shrink-0 ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                            <IconComponent className="w-3.5 h-3.5" />
                          </div>
                          <span className="font-bold text-[11px] truncate">{tab.label}</span>
                        </div>

                        <div>
                          {isSelected ? (
                            <CheckSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
                {errors.tabs && <p className="text-rose-500 text-[10px] mt-1">{errors.tabs}</p>}
              </div>

            </div>

            {/* ============================================================ */}
            {/* ستون چپ (۷ ستون از ۱۲): موضوعات مراجعه و ساعت کاری هر موضوع */}
            {/* ============================================================ */}
            <div className="lg:col-span-7 space-y-5">
              
              {/* ۱. موضوعات مراجعه و حوزه‌های مشاوره */}
              <div className="p-4 bg-indigo-50/40 border border-indigo-100 rounded-2xl space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-indigo-100">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                    <span className="font-extrabold text-slate-800 text-xs sm:text-sm">۱. موضوعات مراجعه و حوزه‌های تخصصی</span>
                  </div>
                  <span className="text-[10px] text-indigo-700 font-semibold bg-indigo-100/70 px-2 py-0.5 rounded-md">
                    {toPersianDigits(allowedTopics.length)} موضوع انتخاب شده
                  </span>
                </div>

                <p className="text-[11px] text-slate-600">
                  موضوعاتی که این مشاور در آن‌ها به مراجعین نوبت مشاوره می‌دهد را تیک بزنید:
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {COUNSELING_TOPICS.map((topic) => {
                    const isSelected = allowedTopics.includes(topic.id);
                    return (
                      <button
                        key={topic.id}
                        type="button"
                        onClick={() => toggleTopic(topic.id)}
                        className={`flex items-center justify-between p-2 rounded-xl border text-right transition-all cursor-pointer ${
                          isSelected
                            ? 'border-indigo-500 bg-white text-indigo-900 shadow-2xs ring-1 ring-indigo-400/20'
                            : 'border-slate-200 bg-white/70 text-slate-600 hover:bg-white'
                        }`}
                      >
                        <div className="min-w-0">
                          <span className="font-bold text-xs block truncate">{topic.name}</span>
                          <span className="text-[10px] text-slate-400 block truncate">{topic.description}</span>
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
                <div className="pt-1 flex items-center gap-2">
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
                    placeholder="افزودن موضوع تخصصی دیگر..."
                    className="flex-1 px-3 py-1.5 border border-slate-300 rounded-xl bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomTopic}
                    className="px-3 py-1.5 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 transition cursor-pointer shrink-0"
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
                          className="inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-indigo-200 text-indigo-900 rounded-lg text-xs font-semibold"
                        >
                          <span>{custTopic}</span>
                          <button
                            type="button"
                            onClick={() => toggleTopic(custTopic)}
                            className="text-slate-400 hover:text-rose-500 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                  </div>
                )}
              </div>

              {/* ۲. ساعت کاری هر موضوع (تنظیم روزها، شیفت‌ها و مدت جلسات) */}
              <div className="p-4 bg-emerald-50/30 border border-emerald-200/80 rounded-2xl space-y-4">
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-emerald-100">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-700" />
                    <div>
                      <span className="font-extrabold text-slate-800 text-xs sm:text-sm">۲. ساعت کاری هر موضوع مشاوره</span>
                      <p className="text-[10px] text-slate-500 mt-0.5">امکان تعیین روز و ساعات کاری متفاوت به ازای هر موضوع</p>
                    </div>
                  </div>
                  
                  {activeScheduleTopic !== 'all' && (
                    <div className="flex items-center gap-2">
                      {isCustomForActiveTopic ? (
                        <button
                          type="button"
                          onClick={disableCustomScheduleForActiveTopic}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer"
                          title="حذف ساعات اختصاصی و بازگشت به ساعات عمومی مشاور"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>بازنشانی به ساعت کاری عمومی</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={enableCustomScheduleForActiveTopic}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition cursor-pointer"
                        >
                          <Plus className="w-3 h-3" />
                          <span>ساعت کاری اختصاصی برای {activeTopicDisplay}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* نوار تب‌های انتخاب موضوع جهت تنظیم ساعت کاری */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200/80">
                  <button
                    type="button"
                    onClick={() => setActiveScheduleTopic('all')}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      activeScheduleTopic === 'all'
                        ? 'bg-emerald-700 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>ساعت کاری عمومی (پیش‌فرض)</span>
                  </button>

                  {allowedTopics.map((top) => {
                    const topicObj = COUNSELING_TOPICS.find((t) => t.id === top || t.name === top);
                    const topLabel = topicObj ? topicObj.name : top;
                    const hasCustom = !!topicSchedules[top] || (topicObj && !!topicSchedules[topicObj.id]);
                    const isSelected = activeScheduleTopic === top || (topicObj && activeScheduleTopic === topicObj.id);

                    return (
                      <button
                        key={top}
                        type="button"
                        onClick={() => setActiveScheduleTopic(topicObj?.id || top)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                          isSelected
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>{topLabel}</span>
                        {hasCustom ? (
                          <span className="inline-flex items-center justify-center px-1.5 py-0.2 rounded-md bg-amber-400 text-amber-950 text-[9px] font-black" title="دارای ساعات کاری اختصاصی">
                            اختصاصی
                          </span>
                        ) : (
                          <span className="text-[10px] text-slate-400 font-normal">(عمومی)</span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* وضعیت تبعیت این موضوع از ساعت کاری عمومی */}
                {activeScheduleTopic !== 'all' && !isCustomForActiveTopic && (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl flex items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <Info className="w-4 h-4 text-amber-600 shrink-0" />
                      <span className="text-amber-900 leading-relaxed text-[11px]">
                        موضوع <strong>«{activeTopicDisplay}»</strong> در حال حاضر از <strong>ساعت کاری عمومی مشاور</strong> پیروی می‌کند.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={enableCustomScheduleForActiveTopic}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg transition shrink-0 cursor-pointer shadow-xs"
                    >
                      تنظیم ساعت کاری اختصاصی برای {activeTopicDisplay}
                    </button>
                  </div>
                )}

                {activeScheduleTopic !== 'all' && isCustomForActiveTopic && (
                  <div className="p-2.5 bg-emerald-100/60 border border-emerald-300 rounded-xl flex items-center justify-between text-xs text-emerald-950">
                    <div className="flex items-center gap-2">
                      <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                      <span className="font-bold text-[11px]">
                        در حال تنظیم روزها و ساعات کاری اختصاصی برای موضوع «{activeTopicDisplay}»
                      </span>
                    </div>
                    <span className="text-[10px] text-emerald-800 bg-white/70 px-2 py-0.5 rounded-md font-semibold">
                      اختصاصی فعال است
                    </span>
                  </div>
                )}

                {/* مدت هر جلسه و زمان استراحت */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      مدت هر جلسه مشاوره ({activeTopicDisplay}):
                    </label>
                    <select
                      value={currentSchedule.slotDurationMinutes || 45}
                      onChange={(e) => updateCurrentSchedule((cur) => ({ ...cur, slotDurationMinutes: Number(e.target.value) }))}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 cursor-pointer"
                    >
                      <option value={15}>۱۵ دقیقه</option>
                      <option value={20}>۲۰ دقیقه</option>
                      <option value={30}>۳۰ دقیقه</option>
                      <option value={45}>۴۵ دقیقه (استاندارد بالحق)</option>
                      <option value={60}>۶۰ دقیقه (۱ ساعت)</option>
                      <option value={90}>۹۰ دقیقه</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      زمان استراحت بین جلسات:
                    </label>
                    <select
                      value={currentSchedule.restTimeMinutes ?? 15}
                      onChange={(e) => updateCurrentSchedule((cur) => ({ ...cur, restTimeMinutes: Number(e.target.value) }))}
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 cursor-pointer"
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
                  <span className="text-[11px] font-bold text-slate-600 block">الگوهای سریع روزهای کاری ({activeTopicDisplay}):</span>
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

                {/* لیست روزهای هفته و شیفت‌ها */}
                <div className="space-y-2 pt-1 max-h-[380px] overflow-y-auto pr-1">
                  {WEEK_DAYS.map(({ dayIdx, label }) => {
                    const curDays = currentSchedule.availableDays || [];
                    const isDayEnabled = curDays.includes(dayIdx);
                    const daySchedule = currentSchedule.daySchedules?.[dayIdx];
                    const periods: WorkDayPeriod[] = (daySchedule?.periods && daySchedule.periods.length > 0)
                      ? daySchedule.periods
                      : [{ startHour: currentSchedule.startHour || '09:00', endHour: currentSchedule.endHour || '17:00' }];

                    return (
                      <div
                        key={dayIdx}
                        className={`p-2.5 rounded-xl border transition-all ${
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
                                {toPersianDigits(periods.length)} شیفت کاری
                              </span>
                            ) : (
                              <span className="text-[10px] text-rose-500 font-semibold">(تعطیل)</span>
                            )}
                          </label>

                          {isDayEnabled && (
                            <button
                              type="button"
                              onClick={() => addPeriodToDay(dayIdx)}
                              className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 transition cursor-pointer"
                            >
                              <Plus className="w-3 h-3 text-emerald-600" />
                              <span>افزودن شیفت</span>
                            </button>
                          )}
                        </div>

                        {isDayEnabled && (
                          <div className="space-y-1.5 pt-1 border-t border-slate-100">
                            {periods.map((period, pIdx) => (
                              <div
                                key={pIdx}
                                className="flex items-center justify-between gap-2 p-1.5 rounded-lg bg-slate-50 border border-slate-200/80 text-[11px]"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-700 min-w-[45px] text-[10px]">
                                    شیفت {toPersianDigits(pIdx + 1)}:
                                  </span>
                                  <div className="flex items-center gap-1 font-mono">
                                    <span className="text-[10px] text-slate-500">از</span>
                                    <input
                                      type="time"
                                      value={period.startHour || '09:00'}
                                      onChange={(e) => updatePeriod(dayIdx, pIdx, 'startHour', e.target.value)}
                                      className="px-2 py-0.5 border border-slate-300 rounded-md text-xs bg-white text-center"
                                    />
                                    <span className="text-[10px] text-slate-500">تا</span>
                                    <input
                                      type="time"
                                      value={period.endHour || '17:00'}
                                      onChange={(e) => updatePeriod(dayIdx, pIdx, 'endHour', e.target.value)}
                                      className="px-2 py-0.5 border border-slate-300 rounded-md text-xs bg-white text-center"
                                    />
                                  </div>
                                </div>

                                {periods.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removePeriodFromDay(dayIdx, pIdx)}
                                    className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-md transition cursor-pointer"
                                    title="حذف این شیفت"
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

            </div>

          </div>

          {/* دکمه‌های انصراف و ثبت فرم */}
          <div className="pt-4 mt-6 flex items-center justify-end gap-3 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition cursor-pointer text-xs"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-7 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white font-bold rounded-xl hover:from-blue-700 hover:to-indigo-800 shadow-md shadow-blue-500/20 transition cursor-pointer text-xs"
            >
              {editingMember ? 'ذخیره تغییرات مشخصات و ساعات کاری مشاور' : 'ایجاد و ثبت مشاور جدید'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
