'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Clock, 
  Calendar, 
  Plus, 
  Trash2, 
  Sparkles, 
  CheckCircle2, 
  Check,
  AlertCircle,
  RotateCcw,
  Info
} from 'lucide-react';
import { AppointmentData, WorkDayPeriod, DayScheduleConfig } from '@/types/form';
import { COUNSELING_TOPICS } from '@/lib/consultant-helpers';
import { toPersianDigits } from '@/lib/persian';

interface ConsultantScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  consultantName?: string;
  initialSchedule?: AppointmentData;
  topics?: string[];
  onSave: (schedule: AppointmentData) => void;
}

const WEEK_DAYS = [
  { dayIdx: 0, label: 'شنبه' },
  { dayIdx: 1, label: 'یکشنبه' },
  { dayIdx: 2, label: 'دوشنبه' },
  { dayIdx: 3, label: 'سه‌شنبه' },
  { dayIdx: 4, label: 'چهارشنبه' },
  { dayIdx: 5, label: 'پنج‌شنبه' },
  { dayIdx: 6, label: 'جمعه' },
];

export const ConsultantScheduleModal: React.FC<ConsultantScheduleModalProps> = ({
  isOpen,
  onClose,
  title = 'تنظیم و ویرایش ساعات کاری',
  description,
  consultantName,
  initialSchedule,
  topics = [],
  onSave,
}) => {
  // ساعت کاری عمومی
  const [slotDurationMinutes, setSlotDurationMinutes] = useState<number>(45);
  const [restTimeMinutes, setRestTimeMinutes] = useState<number>(15);
  const [availableDays, setAvailableDays] = useState<number[]>([0, 1, 2, 3, 4]);
  const [startHour, setStartHour] = useState<string>('09:00');
  const [endHour, setEndHour] = useState<string>('17:00');
  const [daySchedules, setDaySchedules] = useState<Record<number, DayScheduleConfig>>({});

  // ساعات کاری موضوعات
  const [topicSchedules, setTopicSchedules] = useState<Record<string, AppointmentData>>({});
  const [activeTopic, setActiveTopic] = useState<string>('all');

  useEffect(() => {
    if (initialSchedule) {
      setSlotDurationMinutes(initialSchedule.slotDurationMinutes || 45);
      setRestTimeMinutes(initialSchedule.restTimeMinutes ?? 15);
      setAvailableDays(initialSchedule.availableDays || [0, 1, 2, 3, 4]);
      setStartHour(initialSchedule.startHour || '09:00');
      setEndHour(initialSchedule.endHour || '17:00');
      setDaySchedules(initialSchedule.daySchedules || {});
      setTopicSchedules(initialSchedule.topicSchedules || {});
    } else {
      setSlotDurationMinutes(45);
      setRestTimeMinutes(15);
      setAvailableDays([0, 1, 2, 3, 4]);
      setStartHour('09:00');
      setEndHour('17:00');
      setDaySchedules({});
      setTopicSchedules({});
    }
    setActiveTopic('all');
  }, [initialSchedule, isOpen]);

  // استخراج تمام کلیدهای موضوعی فعال (ترکیب topics ورودی و کلیدهای درون topicSchedules)
  const availableTopics = useMemo(() => {
    const set = new Set<string>(topics || []);
    if (initialSchedule?.topicSchedules) {
      Object.keys(initialSchedule.topicSchedules).forEach((k) => set.add(k));
    }
    return Array.from(set);
  }, [topics, initialSchedule]);

  // دریافت برنامه جاری (عمومی یا موضوع انتخابی)
  const currentSchedule = (): AppointmentData => {
    if (activeTopic === 'all') {
      return {
        slotDurationMinutes,
        restTimeMinutes,
        availableDays,
        startHour,
        endHour,
        daySchedules,
        holidays: initialSchedule?.holidays || ['جمعه'],
        capacityPerSlot: initialSchedule?.capacityPerSlot || 1,
      };
    }
    const custom = topicSchedules[activeTopic];
    if (custom) return custom;
    return {
      slotDurationMinutes,
      restTimeMinutes,
      availableDays,
      startHour,
      endHour,
      daySchedules,
      holidays: initialSchedule?.holidays || ['جمعه'],
      capacityPerSlot: initialSchedule?.capacityPerSlot || 1,
    };
  };

  const isCustomForActiveTopic = activeTopic !== 'all' && !!topicSchedules[activeTopic];

  const updateCurrentSchedule = (updater: (prev: AppointmentData) => AppointmentData) => {
    if (activeTopic === 'all') {
      const cur: AppointmentData = {
        slotDurationMinutes,
        restTimeMinutes,
        availableDays,
        startHour,
        endHour,
        daySchedules,
        holidays: initialSchedule?.holidays || ['جمعه'],
        capacityPerSlot: initialSchedule?.capacityPerSlot || 1,
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
        const base = prev[activeTopic] || {
          slotDurationMinutes,
          restTimeMinutes,
          availableDays: [...availableDays],
          startHour,
          endHour,
          daySchedules: JSON.parse(JSON.stringify(daySchedules)),
          holidays: initialSchedule?.holidays || ['جمعه'],
          capacityPerSlot: initialSchedule?.capacityPerSlot || 1,
        };
        return {
          ...prev,
          [activeTopic]: updater(base),
        };
      });
    }
  };

  const enableCustomForActiveTopic = () => {
    if (activeTopic === 'all') return;
    setTopicSchedules((prev) => ({
      ...prev,
      [activeTopic]: {
        slotDurationMinutes,
        restTimeMinutes,
        availableDays: [...availableDays],
        startHour,
        endHour,
        daySchedules: JSON.parse(JSON.stringify(daySchedules)),
        holidays: initialSchedule?.holidays || ['جمعه'],
        capacityPerSlot: initialSchedule?.capacityPerSlot || 1,
      },
    }));
  };

  const disableCustomForActiveTopic = () => {
    if (activeTopic === 'all') return;
    setTopicSchedules((prev) => {
      const copy = { ...prev };
      delete copy[activeTopic];
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

  const handleSave = () => {
    const updated: AppointmentData = {
      slotDurationMinutes,
      restTimeMinutes,
      availableDays,
      startHour,
      endHour,
      daySchedules,
      holidays: initialSchedule?.holidays || ['جمعه'],
      capacityPerSlot: initialSchedule?.capacityPerSlot || 1,
      topicSchedules: Object.keys(topicSchedules).length > 0 ? topicSchedules : undefined,
    };
    onSave(updated);
    onClose();
  };

  const cur = currentSchedule();
  const activeTopicDisplay = useMemo(() => {
    if (activeTopic === 'all') return 'ساعت کاری عمومی';
    const topObj = COUNSELING_TOPICS.find((t) => t.id === activeTopic || t.name === activeTopic);
    return topObj ? topObj.name : activeTopic;
  }, [activeTopic]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-3xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 text-slate-900 flex flex-col max-h-[92vh]">
        
        {/* سربرگ */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 ring-1 ring-white/20">
              <Clock className="w-5 h-5 text-emerald-300" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-tight">
                {title}
              </h2>
              <p className="text-xs text-slate-300 mt-0.5">
                {description || (consultantName ? `تنظیم روزهای حضور و ساعات کاری ${consultantName}` : 'تنظیم روزها، شیفت‌ها و مدت جلسات')}
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

        {/* محتوای تنظیمات ساعات کاری */}
        <div className="p-5 sm:p-6 space-y-4 text-xs overflow-y-auto flex-1">
          
          {/* تب‌های موضوعی در صورت وجود موضوعات */}
          {availableTopics.length > 0 && (
            <div className="space-y-2 p-3 bg-emerald-50/50 border border-emerald-200/80 rounded-2xl">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-slate-800 text-xs">
                  تنظیم ساعت کاری بر اساس موضوع مراجعه:
                </span>
                {activeTopic !== 'all' && (
                  <div>
                    {isCustomForActiveTopic ? (
                      <button
                        type="button"
                        onClick={disableCustomForActiveTopic}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>بازنشانی به ساعت کاری عمومی</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={enableCustomForActiveTopic}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-emerald-800 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>تعریف ساعت اختصاصی برای {activeTopicDisplay}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* نوار دکمه‌های تب موضوع */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTopic('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                    activeTopic === 'all'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>ساعت کاری عمومی</span>
                </button>

                {availableTopics.map((topKey) => {
                  const topObj = COUNSELING_TOPICS.find((t) => t.id === topKey || t.name === topKey);
                  const topLabel = topObj ? topObj.name : topKey;
                  const hasCustom = !!topicSchedules[topKey] || (topObj && !!topicSchedules[topObj.id]);
                  const isSelected = activeTopic === topKey || (topObj && activeTopic === topObj.id);

                  return (
                    <button
                      key={topKey}
                      type="button"
                      onClick={() => setActiveTopic(topObj?.id || topKey)}
                      className={`px-3 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
                        isSelected
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>{topLabel}</span>
                      {hasCustom ? (
                        <span className="px-1.5 py-0.2 bg-amber-400 text-amber-950 font-black text-[9px] rounded-md">
                          اختصاصی
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-normal">(عمومی)</span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* پیام اطلاع‌رسانی وضعیت تب */}
              {activeTopic !== 'all' && !isCustomForActiveTopic && (
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-center justify-between">
                  <span>این موضوع در حال حاضر از ساعت کاری عمومی پیروی می‌کند.</span>
                  <button
                    type="button"
                    onClick={enableCustomForActiveTopic}
                    className="font-bold underline text-amber-800 hover:text-amber-950 cursor-pointer"
                  >
                    فعال‌سازی ساعت اختصاصی
                  </button>
                </div>
              )}
            </div>
          )}
          
          {/* مدت جلسه و استراحت */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-2xl">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                مدت زمان هر جلسه ({activeTopicDisplay}):
              </label>
              <select
                value={cur.slotDurationMinutes || 45}
                onChange={(e) => updateCurrentSchedule((c) => ({ ...c, slotDurationMinutes: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 cursor-pointer"
              >
                <option value={15}>۱۵ دقیقه</option>
                <option value={20}>۲۰ دقیقه</option>
                <option value={30}>۳۰ دقیقه</option>
                <option value={45}>۴۵ دقیقه (استاندارد)</option>
                <option value={60}>۶۰ دقیقه (۱ ساعت)</option>
                <option value={90}>۹۰ دقیقه</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                زمان استراحت بین جلسات:
              </label>
              <select
                value={cur.restTimeMinutes ?? 15}
                onChange={(e) => updateCurrentSchedule((c) => ({ ...c, restTimeMinutes: Number(e.target.value) }))}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-emerald-200 cursor-pointer"
              >
                <option value={0}>بدون استراحت (۰ دقیقه)</option>
                <option value={5}>۵ دقیقه</option>
                <option value={10}>۱۰ دقیقه</option>
                <option value={15}>۱۵ دقیقه</option>
                <option value={20}>۲۰ دقیقه</option>
                <option value={30}>۳۰ دقیقه</option>
              </select>
            </div>
          </div>

          {/* الگوهای آماده روزها */}
          <div className="space-y-1.5">
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
                  className="px-2.5 py-1 text-[10px] rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 border border-slate-200 transition-colors cursor-pointer font-medium"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* جدول روزهای کاری */}
          <div className="space-y-2 pt-1">
            {WEEK_DAYS.map(({ dayIdx, label }) => {
              const curDays = cur.availableDays || [];
              const isDayEnabled = curDays.includes(dayIdx);
              const daySchedule = cur.daySchedules?.[dayIdx];
              const periods: WorkDayPeriod[] = (daySchedule?.periods && daySchedule.periods.length > 0)
                ? daySchedule.periods
                : [{ startHour: cur.startHour || '09:00', endHour: cur.endHour || '17:00' }];

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
                        className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg border border-emerald-200 transition cursor-pointer"
                      >
                        <Plus className="w-3 h-3 text-emerald-600" />
                        <span>افزودن شیفت</span>
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
                              شیفت {toPersianDigits(pIdx + 1)}:
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

        {/* دکمه‌های فوتر */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            انصراف
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-bold rounded-xl hover:from-emerald-700 hover:to-teal-800 shadow-md shadow-emerald-600/20 transition cursor-pointer"
          >
            ذخیره ساعات کاری
          </button>
        </div>

      </div>
    </div>
  );
};
