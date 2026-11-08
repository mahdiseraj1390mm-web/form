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
  Info, 
  CalendarCheck, 
  CalendarOff,
  User,
  UserCheck,
  Check,
  PhoneCall
} from 'lucide-react';
import { toPersianDigits } from '@/lib/persian';
import { useForm } from '@/context/form-context';
import { COUNSELING_TOPICS, COUNSELOR_MAP, isConsultantMember, cleanConsultantName } from '@/lib/consultant-helpers';

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
  const { teamMembers } = useForm();

  // بررسی حالت چندمشاوره‌ای (رزرو نوبت منحصراً از میان مشاوران تعریف‌شده در سامانه امکان‌پذیر است)
  const selectedConsultants = useMemo(() => {
    const definedConsultants = (teamMembers || []).filter(isConsultantMember);

    // اولویت قطعی با مشاوران ثبت‌شده در دیتابیس سامانه با ساعات کاری فعال است
    if (definedConsultants.length > 0) {
      return definedConsultants
        .filter((m) => {
          const hasAvailableDays = Array.isArray(m.workingHours?.availableDays) && m.workingHours.availableDays.length > 0;
          return m.status === 'active' && hasAvailableDays;
        })
        .map((m) => {
          const prefix = m.genderPrefix || (m.name.startsWith('خانم') ? 'خانم' : 'آقا');
          const topics = (m.allowedTopics && m.allowedTopics.length > 0)
            ? m.allowedTopics
            : ['مشاوره تخصصی'];
          return {
            consultantId: m.id,
            consultantName: m.name,
            genderPrefix: prefix as 'آقا' | 'خانم',
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

  // تمام موضوعات فعال در این فرم
  const availableTopicIds = useMemo(() => {
    const set = new Set<string>();
    selectedConsultants.forEach((c) => {
      (c.enabledTopics || []).forEach((t) => set.add(t));
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

  // مشاوران پوشش‌دهنده موضوع انتخابی
  const consultantsForTopic = useMemo(() => {
    if (!selectedTopicId) return selectedConsultants;
    return selectedConsultants.filter((c) => {
      const topics = c.enabledTopics || [];
      return topics.some((t) => {
        if (t === selectedTopicId) return true;
        const topicObj = COUNSELING_TOPICS.find(
          (ct) => ct.id === selectedTopicId || ct.name === selectedTopicId || ct.keywords.includes(selectedTopicId)
        );
        if (topicObj) {
          if (topicObj.id === t || topicObj.name === t || topicObj.keywords.includes(t)) return true;
        }
        return false;
      });
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

  // تنظیمات نوبت‌دهی موثر (ساعت سفارشی فرم > ساعت مشاور > تنظیمات عمومی فیلد)
  const appointmentConfig = useMemo(() => {
    if (!hasMultiConsultantMode) return field.appointmentData;
    return (
      activeConsultantConfig?.customWorkingHours ||
      matchingMember?.workingHours ||
      field.appointmentData
    );
  }, [hasMultiConsultantMode, activeConsultantConfig, matchingMember, field.appointmentData]);

  const slotDuration = appointmentConfig?.slotDurationMinutes ?? 30;
  const restDuration = appointmentConfig?.restTimeMinutes ?? 5;
  const holidays = appointmentConfig?.holidays || [];

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

  // روز پیش‌فرض انتخابی
  const initialDay = availableDays.length > 0 ? availableDays[0] : 0;
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(initialDay);

  // نوبت‌های رزرو شده در پایگاه داده
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

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

  useEffect(() => {
    if (availableDays.length > 0) {
      setSelectedDayIndex(availableDays[0]);
    }
  }, [field.id, selectedConsultantId]);

  useEffect(() => {
    if (availableDays.length > 0 && !availableDays.includes(selectedDayIndex)) {
      setSelectedDayIndex(availableDays[0]);
    }
  }, [availableDays, selectedDayIndex]);

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

  const offDaysList = useMemo(() => {
    return WEEK_DAYS.filter((d) => !availableDays.includes(d.index));
  }, [availableDays]);

  // تولید خودکار بازه‌های زمانی
  const generatedSlotsForDay = useMemo(() => {
    const currentDay = WEEK_DAYS[selectedDayIndex];
    if (!currentDay) return [];

    if (!availableDays.includes(selectedDayIndex)) {
      return [];
    }

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
        const fullLabel = `${currentDay.name}${shiftPart} - ساعت ${timeRange}`;
        const optId = `slot_${selectedDayIndex}_${pIdx}_${currentMin}`;

        const isTaken = bookedSlots.some(
          (b) => b === fullLabel || b === optId || (b.includes(currentDay.name) && b.includes(timeRange))
        );

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
  }, [appointmentConfig, selectedDayIndex, availableDays, slotDuration, restDuration, bookedSlots]);

  const isCurrentDayHoliday = !availableDays.includes(selectedDayIndex);

  const handleSelectSlot = (slotLabel: string) => {
    if (hasMultiConsultantMode) {
      const topicObj = COUNSELING_TOPICS.find((t) => t.id === selectedTopicId);
      const topicName = topicObj ? topicObj.name : (selectedTopicId || 'مشاوره تخصصی');
      const prefix = activeConsultantConfig?.genderPrefix ? `${activeConsultantConfig.genderPrefix} ` : '';
      const consultantFullName = activeConsultantConfig
        ? `${prefix}${activeConsultantConfig.consultantName}`
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
                const topicObj = COUNSELING_TOPICS.find((t) => t.id === topId || t.name === topId || t.keywords.includes(topId));
                const isSelected = selectedTopicId === topId;
                return (
                  <button
                    key={topId}
                    type="button"
                    onClick={() => {
                      setSelectedTopicId(topId);
                      setSelectedConsultantId('');
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
                  const prefix = consultant.genderPrefix ? `${consultant.genderPrefix} ` : '';
                  const fullName = `${prefix}${consultant.consultantName}`;

                  return (
                    <button
                      key={consultant.consultantId}
                      type="button"
                      onClick={() => setSelectedConsultantId(consultant.consultantId)}
                      className={`p-3 rounded-2xl border text-right transition-all cursor-pointer flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'border-blue-500 bg-white shadow-sm ring-2 ring-blue-300 text-blue-950'
                          : 'border-slate-200 bg-white/80 hover:bg-white text-slate-700 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold ${
                          isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          <User className="w-4 h-4" />
                        </div>
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

          {/* زیرفیلد ۳: اطلاعات تماس و راهنمای ارتباط با مشاور */}
          {activeConsultantConfig && (
            <div className="pt-2 border-t border-indigo-100/70">
              <div className="p-3.5 bg-gradient-to-r from-blue-50/90 via-sky-50/70 to-indigo-50/90 border border-blue-200/90 rounded-2xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
                    <PhoneCall className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-blue-950 text-xs">
                        مشاور انتخاب‌شده: {activeConsultantConfig.genderPrefix ? `${activeConsultantConfig.genderPrefix} ` : ''}{activeConsultantConfig.consultantName}
                      </span>
                      <span className="text-[10px] bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                        مشاوره تلفنی
                      </span>
                    </div>
                    {consultantMobile ? (
                      <span className="text-[11px] text-blue-800 font-mono mt-1 block">
                        📞 شماره تماس مستقیم: <strong className="font-bold text-blue-950">{toPersianDigits(consultantMobile)}</strong>
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="text-[11px] text-slate-600 font-medium bg-white/80 px-3 py-1.5 rounded-xl border border-blue-100">
                  جلسه مشاوره به صورت تماس تلفنی در ساعت مقرر رزرو شده با این شماره انجام می‌شود.
                </div>
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
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2">
                <div 
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white shrink-0"
                  style={{ backgroundColor: themeColor }}
                >
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-extrabold text-slate-900 block">
                    {hasMultiConsultantMode ? '۳. انتخاب روز و ساعت نوبت مشاوره' : 'انتخاب روز و ساعت نوبت مشاوره'}
                  </span>
                  <span className="text-[10px] text-slate-500">برای مشاهده ساعات آزاد، روز کاری مورد نظر را انتخاب فرمایید</span>
                </div>
              </div>

              {/* نشانگر مدت زمان جلسه مشاوره */}
              <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-800 font-extrabold border border-blue-200/80 shadow-xs">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>مدت هر جلسه مشاوره: {toPersianDigits(slotDuration)} دقیقه</span>
                </span>
              </div>
            </div>

            {/* روزهای کاری مشاور */}
            <div className="mt-3 p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/90 text-xs space-y-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-extrabold text-emerald-800 flex items-center gap-1 shrink-0 text-[11px]">
                  <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>روزهای کاری مشاور:</span>
                </span>
                <div className="flex flex-wrap items-center gap-1.5">
                  {workingDaysList.map((day) => {
                    const hoursLabel = getDayHoursDisplay(day.index);
                    return (
                      <span 
                        key={day.index} 
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200/90 font-bold text-[11px] shadow-xs"
                      >
                        <span className="font-extrabold">{day.name}</span>
                        {hoursLabel && (
                          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100/80 px-1.5 py-0.5 rounded">
                            ({hoursLabel})
                          </span>
                        )}
                      </span>
                    );
                  })}
                </div>
              </div>

              {offDaysList.length > 0 && (
                <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-100">
                  <span className="font-extrabold text-rose-700 flex items-center gap-1 shrink-0 text-[11px]">
                    <CalendarOff className="w-3.5 h-3.5 text-rose-500" />
                    <span>روزهای تعطیل مشاور:</span>
                  </span>
                  <div className="flex flex-wrap items-center gap-1">
                    {offDaysList.map((day) => (
                      <span 
                        key={day.index} 
                        className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-medium text-[11px]"
                      >
                        {day.name} (تعطیل)
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* لیست دکمه‌های روزهای هفته (روزبندی) */}
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 sm:gap-2 mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-slate-200/70">
              {WEEK_DAYS.map((day) => {
                const isDayAvailable = availableDays.includes(day.index);
                const isSelected = selectedDayIndex === day.index;

                return (
                  <button
                    key={day.index}
                    type="button"
                    onClick={() => setSelectedDayIndex(day.index)}
                    className={`py-2 px-1 rounded-xl text-center transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer touch-manipulation min-h-[44px] ${
                      isSelected
                        ? 'text-white font-extrabold shadow-sm scale-102 ring-2'
                        : isDayAvailable
                        ? 'bg-white hover:bg-slate-100 text-slate-700 font-bold border border-slate-200'
                        : 'bg-rose-50/40 hover:bg-rose-50 text-slate-500 border border-rose-200/60'
                    }`}
                    style={{
                      backgroundColor: isSelected ? themeColor : undefined,
                      borderColor: isSelected ? themeColor : undefined,
                    }}
                  >
                    <span className="text-xs font-bold">{day.name}</span>
                    <span className={`text-[9px] font-bold ${
                      isSelected
                        ? 'text-white/95'
                        : isDayAvailable
                        ? 'text-emerald-700'
                        : 'text-rose-600'
                    }`}>
                      {isDayAvailable ? 'فعال' : 'تعطیل'}
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
                    <span>نوبت‌های {WEEK_DAYS[selectedDayIndex]?.name}:</span>
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

            {/* تعطیلات مناسبتی */}
            {holidays.length > 0 && (
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
                <Info className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span>تعطیلات مناسبتی ثبت‌شده مشاور: {holidays.join('، ')}</span>
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