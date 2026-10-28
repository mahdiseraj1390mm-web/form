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
  CalendarOff
} from 'lucide-react';
import { toPersianDigits } from '@/lib/persian';

interface AppointmentSchedulerProps {
  field: FormField;
  value: any;
  onChange: (slotString: string) => void;
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

const normalizeDayName = (str: string) => 
  str.replace(/\u200c/g, '').replace(/[\s\-_]/g, '').trim();

export const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({
  field,
  value,
  onChange,
  themeColor = '#00897b',
  error,
}) => {
  const appointmentConfig = field.appointmentData;
  const slotDuration = appointmentConfig?.slotDurationMinutes ?? 30;
  const restDuration = appointmentConfig?.restTimeMinutes ?? 5;
  const holidays = appointmentConfig?.holidays || [];

  // بررسی روزهای فعال هفته
  const availableDays = useMemo(() => {
    if (appointmentConfig?.availableDays && appointmentConfig.availableDays.length > 0) {
      return appointmentConfig.availableDays;
    }
    // اگر گزینه‌های دستی دارد، روزهای موجود در گزینه‌ها را تشخیص دهیم
    if (field.options && field.options.length > 0) {
      const detectedDays = new Set<number>();
      field.options.forEach((opt) => {
        const text = normalizeDayName(opt.label);
        if (text.includes('شنبه') && !text.includes('یک') && !text.includes('دو') && !text.includes('سه') && !text.includes('چهار') && !text.includes('پنج')) detectedDays.add(0);
        if (text.includes('یکشنبه')) detectedDays.add(1);
        if (text.includes('دوشنبه')) detectedDays.add(2);
        if (text.includes('سهشنبه')) detectedDays.add(3);
        if (text.includes('چهارشنبه')) detectedDays.add(4);
        if (text.includes('پنجشنبه')) detectedDays.add(5);
        if (text.includes('جمعه')) detectedDays.add(6);
      });
      if (detectedDays.size > 0) return Array.from(detectedDays);
    }
    return [0, 1, 2, 3, 4]; // پیش‌فرض شنبه تا چهارشنبه
  }, [appointmentConfig, field.options]);

  // روز پیش‌فرض انتخابی (اولین روز کاری غیرتعطیل)
  const initialDay = availableDays.length > 0 ? availableDays[0] : 0;
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(initialDay);

  // فهرست نوبت‌های رزرو شده در پایگاه‌داده جهت جلوگیری از رزرو مجدد در همان زمان
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);

  useEffect(() => {
    fetch('/api/cases?action=booked_slots&formId=form-belhagh-booking')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && Array.isArray(data.bookedSlots)) {
          setBookedSlots(data.bookedSlots);
        }
      })
      .catch((err) => console.warn('Fetch booked slots error:', err));
  }, [field.id]);

  // تغییر روز فعال هنگام تغییر مشاور یا فیلد
  useEffect(() => {
    if (availableDays.length > 0 && !availableDays.includes(selectedDayIndex)) {
      setSelectedDayIndex(availableDays[0]);
    }
  }, [availableDays, field.id]);

  // لیست روزهای کاری و تعطیل مشاور جهت نمایش شفاف به کاربر
  const workingDaysList = useMemo(() => {
    return WEEK_DAYS.filter((d) => availableDays.includes(d.index));
  }, [availableDays]);

  const offDaysList = useMemo(() => {
    return WEEK_DAYS.filter((d) => !availableDays.includes(d.index));
  }, [availableDays]);

  // تولید خودکار بازه‌های زمانی هوشمند برای یک روز با در نظر گرفتن ساعت شروع، پایان، مدت جلسه و استراحت
  const generatedSlotsForDay = useMemo(() => {
    const currentDay = WEEK_DAYS[selectedDayIndex];
    if (!currentDay) return [];

    const normCurrentDayName = normalizeDayName(currentDay.name);

    // اولویت با گزینه‌های از پیش تعیین‌شده متناظر با این روز است
    const matchingOptions = (field.options || []).filter((opt) => {
      const normOpt = normalizeDayName(opt.label);
      return normOpt.includes(normCurrentDayName);
    });

    if (matchingOptions.length > 0) {
      return matchingOptions.map((o) => {
        const slotLabel = o.label.trim();
        const slotVal = (o.value || o.id || '').trim();
        const isTaken = bookedSlots.some(
          (b) => b === slotLabel || b === slotVal || b.includes(slotLabel) || slotLabel.includes(b)
        );

        return {
          id: o.value || o.id,
          label: o.label,
          time: o.label.replace(/^.*ساعت\s*/, '').trim(),
          available: !isTaken,
        };
      });
    }

    // اگر روز انتخاب‌شده جزو روزهای کاری مشاور نیست، سانسی تولید نکن
    if (!availableDays.includes(selectedDayIndex)) {
      return [];
    }

    // بر اساس ساعات کاری و استراحت محاسبه کن
    const dayConfig = appointmentConfig?.daySchedules?.[selectedDayIndex];
    const period = dayConfig?.periods?.[0] || {
      startHour: appointmentConfig?.startHour || '09:00',
      endHour: appointmentConfig?.endHour || '17:00',
    };

    const [startH, startM] = (period.startHour || '09:00').split(':').map(Number);
    const [endH, endM] = (period.endHour || '17:00').split(':').map(Number);

    const startTotalMin = (startH || 9) * 60 + (startM || 0);
    const endTotalMin = (endH || 17) * 60 + (endM || 0);

    const slots: Array<{ id: string; label: string; time: string; available: boolean }> = [];
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
      const fullLabel = `${currentDay.name} - ساعت ${timeRange}`;

      slots.push({
        id: `slot_${selectedDayIndex}_${currentMin}`,
        label: fullLabel,
        time: timeRange,
        available: true,
      });

      // اضافه کردن مدت جلسه + زمان استراحت بین مشاوره‌ها
      currentMin += slotDuration + restDuration;
    }

    return slots;
  }, [field.options, appointmentConfig, selectedDayIndex, availableDays, slotDuration, restDuration, bookedSlots]);

  const isCurrentDayHoliday = !availableDays.includes(selectedDayIndex);

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
      
      {/* سربرگ مشخصات زمان‌بندی و استراحت */}
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
              <span className="text-xs font-extrabold text-slate-900 block">انتخاب روز و ساعت نوبت مشاوره</span>
              <span className="text-[10px] text-slate-500">برای مشاهده ساعات آزاد، روز کاری مورد نظر را انتخاب فرمایید</span>
            </div>
          </div>

          {/* نشانگر مدت زمان جلسه مشاوره (زمان استراحت نمایش داده نمی‌شود) */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-50 text-blue-800 font-extrabold border border-blue-200/80 shadow-xs">
              <Clock className="w-3.5 h-3.5 text-blue-600" />
              <span>مدت هر جلسه مشاوره: ۴۵ دقیقه</span>
            </span>
          </div>
        </div>

        {/* کادر تفکیک روزهای کاری و روزهای تعطیل مشاور */}
        <div className="mt-3 p-2.5 sm:p-3 rounded-xl bg-white border border-slate-200/90 text-xs space-y-2">
          {/* ردیف روزهای کاری */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-extrabold text-emerald-800 flex items-center gap-1 shrink-0 text-[11px]">
              <CalendarCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>روزهای کاری مشاور:</span>
            </span>
            <div className="flex flex-wrap items-center gap-1">
              {workingDaysList.map((day) => {
                const dayConfig = appointmentConfig?.daySchedules?.[day.index]?.periods?.[0];
                const hoursLabel = dayConfig 
                  ? ` (از ${toPersianDigits(dayConfig.startHour)} تا ${toPersianDigits(dayConfig.endHour)})`
                  : appointmentConfig?.startHour && appointmentConfig?.endHour
                  ? ` (از ${toPersianDigits(appointmentConfig.startHour)} تا ${toPersianDigits(appointmentConfig.endHour)})`
                  : '';

                return (
                  <span 
                    key={day.index} 
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold text-[11px]"
                  >
                    <span>{day.name}</span>
                    {hoursLabel && <span className="text-[10px] text-emerald-700 font-normal">{hoursLabel}</span>}
                  </span>
                );
              })}
            </div>
          </div>

          {/* ردیف روزهای تعطیل مشاور */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1.5 border-t border-slate-100">
            <span className="font-extrabold text-rose-700 flex items-center gap-1 shrink-0 text-[11px]">
              <CalendarOff className="w-3.5 h-3.5 text-rose-500" />
              <span>روزهای تعطیل مشاور:</span>
            </span>
            <div className="flex flex-wrap items-center gap-1">
              {offDaysList.length > 0 ? (
                offDaysList.map((day) => (
                  <span 
                    key={day.index} 
                    className="inline-flex items-center px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 font-medium text-[11px]"
                  >
                    {day.name} (تعطیل)
                  </span>
                ))
              ) : (
                <span className="text-slate-400 text-[11px]">بدون تعطیلی هفتگی</span>
              )}
            </div>
          </div>
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

      {/* بخش نمایش اسلات‌های زمانی روز انتخاب‌شده */}
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
                const isSelected = value === slot.label || value === slot.id;
                const isBooked = !slot.available;

                return (
                  <button
                    key={slot.id}
                    type="button"
                    disabled={isBooked}
                    onClick={() => {
                      if (!isBooked) onChange(slot.label);
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
                      <span className={`text-xs font-bold font-mono ${isBooked ? 'line-through text-slate-400' : ''}`}>
                        {slot.time || slot.label}
                      </span>
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

        {/* نمایش روزهای تعطیل خاص یا مناسبتی در صورت وجود */}
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
  );
};
