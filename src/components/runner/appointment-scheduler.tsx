'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { FormField } from '@/types/form';
import { 
  Calendar, 
  Clock, 
  Coffee, 
  CheckCircle2, 
  Ban, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight, 
  User,
  UserCheck,
  Check,
  PhoneCall
} from 'lucide-react';
import { toPersianDigits } from '@/lib/persian';
import { useForm } from '@/context/form-context';
import { ConsultantAvatar } from '@/components/consultants/consultant-avatar';
import { 
  COUNSELING_TOPICS, 
  COUNSELOR_MAP, 
  isConsultantMember, 
  cleanConsultantName, 
  getScheduleForTopic, 
  matchCounselingTopic,
  normalizeCounselingTopicId,
  hasConsultantActiveSchedule,
  formatConsultantDisplayName,
  matchTimeRanges,
  extractTimeRange,
  detectDayIndex
} from '@/lib/consultant-helpers';

interface AppointmentSchedulerProps {
  field: FormField;
  value: any;
  onChange: (
    slotString: string,
    meta?: {
      topic?: string;
      counselorName?: string;
      consultantId?: string;
      slot?: string;
      phone?: string;
    }
  ) => void;
  themeColor?: string;
  error?: string;
}

const WEEK_DAYS = [
  { index: 0, name: 'شنبه' },
  { index: 1, name: 'یکشنبه' },
  { index: 2, name: 'دوشنبه' },
  { index: 3, name: 'سه‌شنبه' },
  { index: 4, name: 'چهارشنبه' },
  { index: 5, name: 'پنج‌شنبه' },
  { index: 6, name: 'جمعه' },
];

export const normalizeDayName = (str: string) => 
  str.replace(/\u200c/g, '').replace(/[\s\-_]/g, '').trim();

/**
 * تشخیص دقیق تعلق داشتن یک عنوان نوبت/گزینه به یک روز خاص هفته
 */
export const isOptionForDay = (optionLabel: string, dayIndex: number): boolean => {
  const norm = normalizeDayName(optionLabel);
  switch (dayIndex) {
    case 0:
      return (
        norm.includes('شنبه') &&
        !norm.includes('یک') &&
        !norm.includes('دو') &&
        !norm.includes('سه') &&
        !norm.includes('چهار') &&
        !norm.includes('پنج')
      );
    case 1:
      return norm.includes('یکشنبه');
    case 2:
      return norm.includes('دوشنبه');
    case 3:
      return norm.includes('سهشنبه');
    case 4:
      return norm.includes('چهارشنبه');
    case 5:
      return norm.includes('پنجشنبه');
    case 6:
      return norm.includes('جمعه');
    default:
      return false;
  }
};

export const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({
  field,
  value,
  onChange,
  themeColor = '#00897b',
  error,
}) => {
  const { teamMembers, counselingTopics } = useForm();
  const allTopicsList = useMemo(
    () => (counselingTopics && counselingTopics.length > 0 ? counselingTopics : COUNSELING_TOPICS),
    [counselingTopics]
  );

  // بررسی حالت چندمشاوره‌ای (رزرو نوبت منحصراً از میان مشاوران تعریف‌شده در سامانه امکان‌پذیر است)
  const selectedConsultants = useMemo(() => {
    const definedConsultants = (teamMembers || []).filter(isConsultantMember);

    // اولویت قطعی با مشاوران ثبت‌شده در دیتابیس سامانه با ساعات کاری فعال است
    if (definedConsultants.length > 0) {
      return definedConsultants
        .filter((m) => m.status === 'active' && hasConsultantActiveSchedule(m.workingHours))
        .map((m) => {
          const prefix = m.genderPrefix || (m.name.startsWith('خانم') ? 'خانم' : 'آقا');
          const rawTopics = (m.allowedTopics && m.allowedTopics.length > 0)
            ? m.allowedTopics
            : ['مشاوره تخصصی'];
          const topics = Array.from(
            new Set(rawTopics.map((t) => normalizeCounselingTopicId(t) || t))
          );
          return {
            consultantId: m.id,
            consultantName: m.name,
            genderPrefix: prefix as 'آقا' | 'خانم',
            avatarUrl: m.avatarUrl,
            enabled: true,
            enabledTopics: topics,
            customWorkingHours: m.workingHours,
          };
        });
    }

    const configuredList = (field.appointmentData?.selectedConsultants || []).filter((sc) => sc.enabled);
    return configuredList;
  }, [field.appointmentData?.selectedConsultants, teamMembers]);

  const hasMultiConsultantMode = selectedConsultants.length > 0;

  // تمام موضوعات فعال و یکتا در این فرم (جلوگیری از نمایش دکمه‌های تکراری)
  const availableTopicIds = useMemo(() => {
    const set = new Set<string>();
    selectedConsultants.forEach((c) => {
      (c.enabledTopics || []).forEach((t) => {
        const canonical = normalizeCounselingTopicId(t) || t;
        const topicSched = getScheduleForTopic(c.customWorkingHours, canonical);
        if (Array.isArray(topicSched?.availableDays) && topicSched.availableDays.length > 0) {
          set.add(canonical);
        }
      });
    });
    return Array.from(set);
  }, [selectedConsultants]);

  // وضعیت‌های انتخاب مراجع در حالت چندمشاوره‌ای
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [selectedConsultantId, setSelectedConsultantId] = useState<string>('');

  // انتخاب خودکار در صورت تک‌موضوع یا تک‌مشاور
  useEffect(() => {
    if (hasMultiConsultantMode) {
      if (availableTopicIds.length === 1 && !selectedTopicId) {
        setSelectedTopicId(availableTopicIds[0]);
      }
    }
  }, [hasMultiConsultantMode, availableTopicIds, selectedTopicId]);

  // مشاوران پوشش‌دهنده موضوع انتخابی که در این موضوع دارای روزهای کاری فعال هستند
  const consultantsForTopic = useMemo(() => {
    if (!selectedTopicId) return selectedConsultants;
    const selNorm = normalizeCounselingTopicId(selectedTopicId);
    return selectedConsultants.filter((c) => {
      const topics = c.enabledTopics || [];
      const coversTopic = topics.some((t) => {
        if (t === selectedTopicId || normalizeCounselingTopicId(t) === selNorm) return true;
        const topicObj = matchCounselingTopic(selectedTopicId);
        if (topicObj) {
          if (topicObj.id === t || topicObj.name === t || topicObj.keywords.includes(t)) return true;
        }
        return false;
      });
      if (!coversTopic) return false;
      const topicSched = getScheduleForTopic(c.customWorkingHours, selectedTopicId);
      return Array.isArray(topicSched?.availableDays) && topicSched.availableDays.length > 0;
    });
  }, [selectedConsultants, selectedTopicId]);

  useEffect(() => {
    if (hasMultiConsultantMode) {
      if (consultantsForTopic.length === 1 && !selectedConsultantId) {
        setSelectedConsultantId(consultantsForTopic[0].consultantId);
      } else if (selectedConsultantId && !consultantsForTopic.some((c) => c.consultantId === selectedConsultantId)) {
        setSelectedConsultantId(consultantsForTopic[0]?.consultantId || '');
      }
    }
  }, [hasMultiConsultantMode, consultantsForTopic, selectedConsultantId]);

  // مشاور فعال انتخابی
  const activeConsultantConfig = useMemo(() => {
    if (!hasMultiConsultantMode) return null;
    return selectedConsultants.find((c) => c.consultantId === selectedConsultantId) || null;
  }, [hasMultiConsultantMode, selectedConsultants, selectedConsultantId]);

  const matchingMember = useMemo(() => {
    if (!activeConsultantConfig) return null;
    return (
      (teamMembers || []).find(
        (m) =>
          m.id === activeConsultantConfig.consultantId ||
          m.consultantId === activeConsultantConfig.consultantId ||
          m.name === activeConsultantConfig.consultantName ||
          (m.genderPrefix && `${m.genderPrefix} ${m.name}` === activeConsultantConfig.consultantName) ||
          cleanConsultantName(m.name) === cleanConsultantName(activeConsultantConfig.consultantName)
      ) || null
    );
  }, [teamMembers, activeConsultantConfig]);

  const consultantMobile = useMemo(() => {
    if (matchingMember?.mobile) return matchingMember.mobile;
    if (activeConsultantConfig?.consultantId) {
      const info = COUNSELOR_MAP[activeConsultantConfig.consultantId];
      if (info?.mobile) return info.mobile;
    }
    return '';
  }, [matchingMember, activeConsultantConfig]);

  // تنظیمات نوبت‌دهی موثر (ساعت سفارشی فرم یا ساعت مشاور در سیستم، تطبیق‌یافته بر اساس موضوع انتخابی)
  const appointmentConfig = useMemo(() => {
    if (!hasMultiConsultantMode) return field.appointmentData;

    // ۱. ساعات کاری سفارشی این فرم یا ساعات کاری تعریف‌شده مشاور در سامانه
    const baseSchedule =
      activeConsultantConfig?.customWorkingHours ||
      matchingMember?.workingHours ||
      field.appointmentData;

    // ۲. استخراج دقیق ساعات و روزبندی اختصاصی برای موضوع انتخابی مراجع
    return getScheduleForTopic(baseSchedule, selectedTopicId) || baseSchedule;
  }, [hasMultiConsultantMode, activeConsultantConfig, matchingMember, field.appointmentData, selectedTopicId]);

  const slotDuration = appointmentConfig?.slotDurationMinutes ?? 30;
  const restDuration = appointmentConfig?.restTimeMinutes ?? 5;

  // بررسی روزهای فعال هفته
  const availableDays = useMemo(() => {
    if (appointmentConfig?.availableDays && appointmentConfig.availableDays.length > 0) {
      return appointmentConfig.availableDays;
    }
    if (field.options && field.options.length > 0 && !hasMultiConsultantMode) {
      const detectedDays = new Set<number>();
      field.options.forEach((opt) => {
        for (let d = 0; d < 7; d++) {
          if (isOptionForDay(opt.label, d)) {
            detectedDays.add(d);
          }
        }
      });
      if (detectedDays.size > 0) return Array.from(detectedDays).sort((a, b) => a - b);
    }
    return [0, 1, 2, 3, 4];
  }, [appointmentConfig, field.options, hasMultiConsultantMode]);

  // هفته انتخابی برای رزرو نوبت (۰ = هفته جاری، ۱ = هفته آینده، و ...)
  const [weekOffset, setWeekOffset] = useState<number>(0);

  // نوبت‌های رزرو شده در پایگاه داده
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  // محاسبه روزهای هفته جاری و هفته‌های بعد بر مبنای تقویم شمسی
  const today = useMemo(() => new Date(), []);
  const todayPersianDayIndex = (today.getDay() + 1) % 7;

  const currentWeekSaturday = useMemo(() => {
    const sat = new Date(today);
    sat.setDate(today.getDate() - todayPersianDayIndex);
    sat.setHours(0, 0, 0, 0);
    return sat;
  }, [today, todayPersianDayIndex]);

  const weekSaturday = useMemo(() => {
    const sat = new Date(currentWeekSaturday);
    sat.setDate(currentWeekSaturday.getDate() + weekOffset * 7);
    sat.setHours(0, 0, 0, 0);
    return sat;
  }, [currentWeekSaturday, weekOffset]);

  const weekDaysWithDates = useMemo(() => {
    return WEEK_DAYS.map((day) => {
      const dayDate = new Date(weekSaturday);
      dayDate.setDate(weekSaturday.getDate() + day.index);
      dayDate.setHours(0, 0, 0, 0);

      const isAvailableInConfig = availableDays.includes(day.index);
      const isPast = weekOffset === 0 && day.index < todayPersianDayIndex;
      const isSelectable = isAvailableInConfig && !isPast;

      const dateFormatted = new Intl.DateTimeFormat('fa-IR', {
        day: 'numeric',
        month: 'short',
      }).format(dayDate);

      const fullDateFormatted = new Intl.DateTimeFormat('fa-IR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(dayDate);

      return {
        ...day,
        date: dayDate,
        dateFormatted,
        fullDateFormatted,
        isAvailableInConfig,
        isPast,
        isSelectable,
      };
    });
  }, [weekSaturday, availableDays, weekOffset, todayPersianDayIndex]);

  const weekRangeLabel = useMemo(() => {
    if (weekDaysWithDates.length < 7) return '';
    return `${weekDaysWithDates[0].dateFormatted} تا ${weekDaysWithDates[6].dateFormatted}`;
  }, [weekDaysWithDates]);

  // روز پیش‌فرض انتخابی
  const initialDay = useMemo(() => {
    const firstSelectable = weekDaysWithDates.find((d) => d.isSelectable);
    return firstSelectable ? firstSelectable.index : (availableDays[0] ?? 0);
  }, [weekDaysWithDates, availableDays]);

  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(initialDay);

  useEffect(() => {
    const counselorParam = selectedConsultantId
      ? `&counselorField=${encodeURIComponent(selectedConsultantId)}`
      : field.id
      ? `&counselorField=${encodeURIComponent(field.id)}`
      : '';
    fetch(`/api/cases?action=booked_slots&formId=form-belhagh-booking${counselorParam}`)
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.bookedSlots)) {
          setBookedSlots(data.bookedSlots);
        }
      })
      .catch((err) => console.warn('Fetch booked slots error:', err));
  }, [field.id, selectedConsultantId]);

  // بروزرسانی روز انتخابی هنگام تغییر هفته، مشاور یا موضوع
  useEffect(() => {
    const currentDayInfo = weekDaysWithDates.find((d) => d.index === selectedDayIndex);
    if (!currentDayInfo?.isSelectable) {
      const firstSelectable = weekDaysWithDates.find((d) => d.isSelectable);
      if (firstSelectable) {
        setSelectedDayIndex(firstSelectable.index);
      }
    }
  }, [weekOffset, weekDaysWithDates, selectedDayIndex]);

  // محاسبه ساعات کاری روز
  const getDayHoursDisplay = (dayIndex: number): string => {
    const daySchedule = appointmentConfig?.daySchedules?.[dayIndex];
    if (daySchedule?.periods && daySchedule.periods.length > 0) {
      if (daySchedule.periods.length === 1) {
        const p = daySchedule.periods[0];
        return `از ${toPersianDigits(p.startHour)} تا ${toPersianDigits(p.endHour)}`;
      }
      return daySchedule.periods
        .map((p, idx) => `نوبت ${toPersianDigits(idx + 1)}: ${toPersianDigits(p.startHour)} تا ${toPersianDigits(p.endHour)}`)
        .join(' و ');
    }

    if (!hasMultiConsultantMode && field.options && field.options.length > 0) {
      const dayOpts = field.options.filter((opt) => isOptionForDay(opt.label, dayIndex));
      if (dayOpts.length > 0) {
        return dayOpts.map((o) => o.label.replace(/^.*ساعت\s*/, '')).slice(0, 2).join('، ');
      }
    }

    return (appointmentConfig?.startHour && appointmentConfig?.endHour)
      ? `از ${toPersianDigits(appointmentConfig.startHour)} تا ${toPersianDigits(appointmentConfig.endHour)}`
      : '';
  };

  const workingDaysList = useMemo(() => {
    return WEEK_DAYS.filter((d) => availableDays.includes(d.index));
  }, [availableDays]);

  const selectedDayObj = weekDaysWithDates[selectedDayIndex];

  // تولید خودکار بازه‌های زمانی برای روز انتخابی
  const generatedSlotsForDay = useMemo(() => {
    const currentDay = WEEK_DAYS[selectedDayIndex];
    if (!currentDay || !selectedDayObj?.isSelectable) return [];

    // بر اساس ساعات کاری و استراحت تفکیک‌شده محاسبه کن
    const dayConfig = appointmentConfig?.daySchedules?.[selectedDayIndex];
    const periods = (dayConfig?.periods && dayConfig.periods.length > 0)
      ? dayConfig.periods
      : (appointmentConfig?.startHour && appointmentConfig?.endHour)
      ? [{
          startHour: appointmentConfig.startHour,
          endHour: appointmentConfig.endHour,
        }]
      : [{ startHour: '09:00', endHour: '17:00' }];

    const slots: Array<{ id: string; label: string; time: string; shiftName?: string; available: boolean }> = [];
    const dayDateFormatted = selectedDayObj.dateFormatted;

    periods.forEach((period, pIdx) => {
      const [startH, startM] = (period.startHour || '09:00').split(':').map(Number);
      const [endH, endM] = (period.endHour || '17:00').split(':').map(Number);

      const startTotalMin = (startH || 0) * 60 + (startM || 0);
      const endTotalMin = (endH || 0) * 60 + (endM || 0);

      let currentMin = startTotalMin;

      while (currentMin + slotDuration <= endTotalMin) {
        const slotStartH = Math.floor(currentMin / 60);
        const slotStartM = currentMin % 60;
        const slotEndMin = currentMin + slotDuration;
        const slotEndH = Math.floor(slotEndMin / 60);
        const slotEndM = slotEndMin % 60;

        const formatTime = (h: number, m: number) =>
          `${toPersianDigits(h < 10 ? '0' + h : h)}:${toPersianDigits(m < 10 ? '0' + m : m)}`;

        const timeRange = `${formatTime(slotStartH, slotStartM)} الی ${formatTime(slotEndH, slotEndM)}`;
        const shiftPart = periods.length > 1 ? ` (نوبت ${toPersianDigits(pIdx + 1)})` : '';
        const fullLabel = dayDateFormatted
          ? `${currentDay.name} (${dayDateFormatted})${shiftPart} - ساعت ${timeRange}`
          : `${currentDay.name}${shiftPart} - ساعت ${timeRange}`;
        const optId = `slot_${selectedDayObj.fullDateFormatted}_${pIdx}_${currentMin}`;

        const isTaken = bookedSlots.some((b) => {
          if (!b) return false;
          if (b === fullLabel || b === optId) return true;
          if (dayDateFormatted && b.includes(dayDateFormatted) && (b.includes(timeRange) || matchTimeRanges(extractTimeRange(b), timeRange))) {
            return true;
          }
          if (weekOffset === 0 && !b.includes('آبان') && !b.includes('آذر') && !b.includes('دی') && !b.includes('بهمن') && !b.includes('اسفند') && !b.includes('فروردین') && !b.includes('اردیبهشت') && !b.includes('خرداد') && !b.includes('تیر') && !b.includes('مرداد') && !b.includes('شهریور') && !b.includes('مهر')) {
            if (detectDayIndex(b) === selectedDayIndex && matchTimeRanges(extractTimeRange(b), timeRange)) {
              return true;
            }
          }
          return false;
        });

        slots.push({
          id: optId,
          label: fullLabel,
          time: timeRange,
          shiftName: periods.length > 1 ? `نوبت ${toPersianDigits(pIdx + 1)}` : undefined,
          available: !isTaken,
        });

        currentMin += slotDuration + restDuration;
      }
    });

    return slots;
  }, [appointmentConfig, selectedDayIndex, selectedDayObj, slotDuration, restDuration, bookedSlots, weekOffset]);

  const isCurrentDayHoliday = !selectedDayObj?.isSelectable;

  const handleSelectSlot = (slotLabel: string) => {
    if (hasMultiConsultantMode) {
      const topicObj = matchCounselingTopic(selectedTopicId);
      const topicName = topicObj ? topicObj.name : (selectedTopicId || 'مشاوره تخصصی');
      const consultantFullName = activeConsultantConfig
        ? formatConsultantDisplayName(activeConsultantConfig.consultantName, activeConsultantConfig.genderPrefix)
        : 'مشاور';
      const formatted = `موضوع: ${topicName} | مشاور: ${consultantFullName} | نوبت: ${slotLabel}`;
      onChange(formatted, {
        topic: topicName,
        counselorName: consultantFullName,
        consultantId: activeConsultantConfig?.consultantId,
        slot: slotLabel,
        phone: consultantMobile,
      });
    } else {
      onChange(slotLabel, { slot: slotLabel });
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs space-y-0 text-slate-900">
      
      {/* در حالت چندمشاوره‌ای: گام ۱ (موضوع) و گام ۲ (مشاور) */}
      {hasMultiConsultantMode && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-indigo-50/30 to-slate-50 border-b border-slate-200/80 space-y-4">
          
          {/* گام ۱: انتخاب موضوع مراجعه */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white font-extrabold text-[11px] flex items-center justify-center">
                ۱
              </span>
              <span className="font-extrabold text-xs text-slate-800">
                موضوع مراجعه خود را انتخاب فرمایید:
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {availableTopicIds.map((topId) => {
                const topicObj = allTopicsList.find(
                  (t) => t.id === topId || t.name === topId || (Array.isArray(t.keywords) && t.keywords.includes(topId))
                );
                const isSelected = selectedTopicId === topId;
                return (
                  <button
                    key={topId}
                    type="button"
                    onClick={() => {
                      setSelectedTopicId(topId);
                      setSelectedConsultantId('');
                      if (value) onChange('');
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-sm ring-2 ring-indigo-300'
                        : 'bg-white border border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50/40'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    <span>{topicObj ? topicObj.name : topId}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* گام ۲: انتخاب مشاور */}
          {selectedTopicId && (
            <div className="space-y-2 pt-2 border-t border-indigo-100/70">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-extrabold text-[11px] flex items-center justify-center">
                  ۲
                </span>
                <span className="font-extrabold text-xs text-slate-800">
                  مشاور مورد نظر خود را انتخاب فرمایید:
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {consultantsForTopic.map((consultant) => {
                  const isSelected = selectedConsultantId === consultant.consultantId;
                  const fullName = formatConsultantDisplayName(consultant.consultantName, consultant.genderPrefix);

                  return (
                    <button
                      key={consultant.consultantId}
                      type="button"
                      onClick={() => {
                        setSelectedConsultantId(consultant.consultantId);
                        if (value) onChange('');
                      }}
                      className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'border-blue-500 bg-white shadow-sm ring-2 ring-blue-300 text-blue-950'
                          : 'border-slate-200 bg-white/80 hover:bg-white text-slate-700 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <ConsultantAvatar
                          avatarUrl={consultant.avatarUrl}
                          genderPrefix={consultant.genderPrefix}
                          name={consultant.consultantName}
                          size="sm"
                        />
                        <div>
                          <span className="font-extrabold text-xs block">{fullName}</span>
                          <span className="text-[10px] text-slate-500">مشاور تخصصی</span>
                        </div>
                      </div>

                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      )}

      {/* گام ۳: جدول زمان‌بندی و انتخاب نوبت */}
      {(!hasMultiConsultantMode || (selectedTopicId && selectedConsultantId)) ? (
        <div className="space-y-0">
          
          {/* سربرگ مشخصات زمان‌بندی و روزهای حضور */}
          <div className="p-3.5 sm:p-4 bg-slate-50 border-b border-slate-200/80">
            <div className="flex flex-wrap items-center justify-between gap-3">
              {/* عنوان و راهنمای راست */}
              <div className="flex items-center gap-2">
                <div 
                  className="w-8 h-8 rounded-xl flex items-center justify-center text-white shrink-0 shadow-xs"
                  style={{ backgroundColor: themeColor }}
                >
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs sm:text-sm font-extrabold text-slate-900 block">
                    {hasMultiConsultantMode ? '۳. انتخاب روز و ساعت نوبت مشاوره' : 'انتخاب روز و ساعت نوبت مشاوره'}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-slate-500 block">
                    برای مشاهده ساعات آزاد، روز کاری مورد نظر را انتخاب فرمایید
                  </span>
                </div>
              </div>

              {/* ناوبری هفته‌ها (سمت چپ) */}
              <div className="flex items-center gap-1 sm:gap-1.5 bg-white px-2 py-1.5 rounded-xl border border-slate-200/90 shadow-2xs">
                {/* دکمه هفته قبل (فلش راست در راست‌به‌چپ) */}
                <button
                  type="button"
                  onClick={() => setWeekOffset((prev) => Math.max(0, prev - 1))}
                  disabled={weekOffset <= 0}
                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="هفته قبل"
                  aria-label="هفته قبل"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* برچسب هفته و بازه تاریخ */}
                <div className="text-center px-1.5 min-w-[110px] sm:min-w-[130px]">
                  <span className="text-xs font-black text-slate-800 block leading-tight">
                    {weekOffset === 0 ? 'هفته جاری' : weekOffset === 1 ? 'هفته آینده' : `${toPersianDigits(weekOffset)} هفته بعد`}
                  </span>
                  <span className="text-[10px] text-slate-500 font-bold block leading-tight mt-0.5">
                    {weekRangeLabel}
                  </span>
                </div>

                {/* دکمه هفته بعد (فلش چپ در راست‌به‌چپ) */}
                <button
                  type="button"
                  onClick={() => setWeekOffset((prev) => prev + 1)}
                  disabled={weekOffset >= 8}
                  className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:opacity-25 disabled:cursor-not-allowed transition-colors cursor-pointer"
                  title="هفته بعد"
                  aria-label="هفته بعد"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* لیست دکمه‌های روزهای هفته (روزبندی با نام روز و تاریخ) */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 sm:gap-2 mt-3 pt-3 border-t border-slate-200/70">
              {weekDaysWithDates.map((day) => {
                const isSelected = selectedDayIndex === day.index && day.isSelectable;

                return (
                  <button
                    key={day.index}
                    type="button"
                    disabled={!day.isSelectable}
                    onClick={() => {
                      if (day.isSelectable) {
                        setSelectedDayIndex(day.index);
                      }
                    }}
                    className={`py-2 px-1 rounded-xl text-center transition-all flex flex-col items-center justify-center gap-0.5 select-none min-h-[54px] sm:min-h-[58px] ${
                      !day.isSelectable
                        ? 'bg-slate-100/90 text-slate-400 border border-slate-200 cursor-not-allowed opacity-60'
                        : isSelected
                        ? 'text-white font-extrabold shadow-sm scale-102 ring-2 cursor-pointer'
                        : 'bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 hover:border-slate-300 cursor-pointer'
                    }`}
                    style={{
                      backgroundColor: isSelected ? themeColor : undefined,
                      borderColor: isSelected ? themeColor : undefined,
                    }}
                  >
                    <span className={`text-xs ${isSelected ? 'font-black text-white' : !day.isSelectable ? 'font-semibold text-slate-400' : 'font-extrabold text-slate-800'}`}>
                      {day.name}
                    </span>
                    <span className={`text-[10px] ${isSelected ? 'font-bold text-white/95' : !day.isSelectable ? 'font-medium text-slate-400' : 'font-bold text-slate-600'}`}>
                      {day.dateFormatted}
                    </span>
                    <span className={`text-[9px] font-bold ${
                      isSelected
                        ? 'text-white/90'
                        : !day.isSelectable
                        ? 'text-slate-400'
                        : 'text-emerald-700'
                    }`}>
                      {day.isPast ? 'سپری‌شده' : day.isAvailableInConfig ? 'فعال' : 'تعطیل'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* نوبت‌های روز انتخاب‌شده */}
          <div className="p-4 sm:p-5">
            {isCurrentDayHoliday ? (
              <div className="py-6 px-4 text-center rounded-xl bg-rose-50/50 border border-rose-200/70 space-y-3">
                <div className="w-10 h-10 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-extrabold text-rose-900">
                    مشاور در روز {WEEK_DAYS[selectedDayIndex]?.name} تعطیل می‌باشد
                  </p>
                  <p className="text-[11px] text-rose-700 mt-1">
                    نوبت‌دهی فقط در روزهای کاری فعال مشاور انجام می‌شود.
                  </p>
                </div>
                {workingDaysList.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSelectedDayIndex(workingDaysList[0].index)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>مشاهده نوبت‌های روز {workingDaysList[0].name} (کاری)</span>
                  </button>
                )}
              </div>
            ) : generatedSlotsForDay.length === 0 ? (
              <div className="py-8 text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <Clock className="w-5 h-5" />
                </div>
                <p className="text-xs font-bold text-slate-700">هیچ نوبت آزادی برای این روز تعریف نشده است</p>
                <p className="text-[11px] text-slate-400">سایر روزهای کاری مشاور را در نوار بالا انتخاب فرمایید.</p>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>نوبت‌های {WEEK_DAYS[selectedDayIndex]?.name}{selectedDayObj?.dateFormatted ? ` (${selectedDayObj.dateFormatted})` : ''}:</span>
                  </span>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {toPersianDigits(generatedSlotsForDay.filter((s) => s.available).length)} نوبت آزاد باقی‌مانده
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {generatedSlotsForDay.map((slot) => {
                    const isSelected = value && (value === slot.label || value === slot.id || (typeof value === 'string' && value.includes(slot.label)));
                    const isBooked = !slot.available;

                    return (
                      <button
                        key={slot.id}
                        type="button"
                        disabled={isBooked}
                        onClick={() => {
                          if (!isBooked) handleSelectSlot(slot.label);
                        }}
                        className={`p-3 sm:p-3.5 rounded-xl sm:rounded-2xl border text-right transition-all flex items-center justify-between gap-2 touch-manipulation min-h-[46px] ${
                          isBooked
                            ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed opacity-75'
                            : isSelected
                            ? 'border-2 text-white font-extrabold shadow-sm scale-[1.01] cursor-pointer'
                            : 'border-slate-200 bg-slate-50/60 hover:bg-slate-100/80 text-slate-700 hover:border-slate-300 cursor-pointer'
                        }`}
                        style={{
                          backgroundColor: isBooked ? undefined : isSelected ? themeColor : undefined,
                          borderColor: isBooked ? undefined : isSelected ? themeColor : undefined,
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {isBooked ? (
                            <Ban className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                          ) : (
                            <Clock className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                          )}
                          <div className="flex flex-col text-right">
                            <span className={`text-xs font-bold font-mono ${isBooked ? 'line-through text-slate-400' : ''}`}>
                              {slot.time || slot.label}
                            </span>
                            {slot.shiftName && (
                              <span className={`text-[10px] ${isSelected ? 'text-white/90 font-medium' : 'text-emerald-700 font-semibold'}`}>
                                {slot.shiftName}
                              </span>
                            )}
                          </div>
                        </div>

                        {isBooked ? (
                          <span className="text-[10px] bg-rose-100 text-rose-800 font-extrabold px-2 py-0.5 rounded-full shrink-0">
                            رزرو شده
                          </span>
                        ) : isSelected ? (
                          <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* بازخورد نوبت انتخاب‌شده */}
            {value && (
              <div 
                className="mt-4 p-3 rounded-xl border flex items-center justify-between text-xs font-bold"
                style={{ 
                  backgroundColor: `${themeColor}12`, 
                  borderColor: `${themeColor}40`,
                  color: themeColor 
                }}
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>نوبت انتخابی شما: {value}</span>
                </div>
                <button
                  type="button"
                  onClick={() => onChange('')}
                  className="text-[11px] underline opacity-80 hover:opacity-100 cursor-pointer"
                >
                  تغییر نوبت
                </button>
              </div>
            )}

            {error && (
              <p className="text-rose-500 text-xs font-bold mt-2">
                {error}
              </p>
            )}
          </div>

        </div>
      ) : (
        <div className="p-8 text-center text-slate-400 text-xs space-y-1">
          <Clock className="w-6 h-6 mx-auto text-slate-300 mb-1" />
          <p className="font-bold text-slate-600">لطفاً ابتدا موضوع و مشاور مورد نظر را انتخاب فرمایید</p>
          <p className="text-[11px]">پس از انتخاب مشاور، روزها و ساعات آزاد نمایش داده خواهند شد.</p>
        </div>
      )}

    </div>
  );
};