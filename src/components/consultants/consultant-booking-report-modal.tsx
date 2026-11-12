'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Sparkles, Check, ChevronDown, CalendarClock, User, FileText } from 'lucide-react';
import { useForm } from '@/context/form-context';
import { useAdminAuth } from '@/context/admin-auth-context';
import type { ConsultantBookingItem } from '@/lib/consultant-helpers';
import { toPersianDigits, formatPersianDateTime } from '@/lib/persian';

interface ConsultantBookingReportModalProps {
  booking: ConsultantBookingItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

const CLINICAL_CATEGORIES = [
  'تقویت رابطه زوجین',
  'تاب‌آوری',
  'نشخوار فکری',
  'وسواس فکری',
  'کنترل هیجان',
  'مهارت‌های حل مسئله',
  'اضطراب و استرس',
  'سایر موارد',
];

const CLINICAL_STATUSES = [
  { id: 'regressing', label: 'عقب گرد', color: 'rose' },
  { id: 'needs_followup', label: 'نیازمند پیگیری', color: 'amber' },
  { id: 'optimal', label: 'وضعیت مطلوب', color: 'blue' },
  { id: 'growing', label: 'در حال رشد', color: 'emerald' },
] as const;

function getClientCaseIdentifier(booking: ConsultantBookingItem): string {
  if (booking.caseCode && booking.caseCode !== 'ثبت‌نشده' && booking.caseCode !== 'فاقد کد' && booking.caseCode.trim()) {
    return booking.caseCode.trim();
  }
  if (booking.submissionId && booking.submissionId.trim()) {
    return booking.submissionId.trim();
  }
  if (booking.id && booking.id.trim()) {
    return booking.id.trim();
  }
  return booking.clientMobile ? `client_${booking.clientMobile}` : 'unknown_case';
}

function cleanRecommendationCategory(text: string): string {
  return text.replace(/^\[محور بالینی:\s*[^\]]+\]\s*/, '').trim();
}

function extractCategoryFromRecommendation(text: string): string {
  const match = text.match(/^\[محور بالینی:\s*([^\]]+)\]/);
  return match ? match[1].trim() : '';
}

export const ConsultantBookingReportModal: React.FC<ConsultantBookingReportModalProps> = ({
  booking,
  isOpen,
  onClose,
  onSaved,
}) => {
  const { currentUser } = useAdminAuth();
  const { updateSubmissionStatus, updateSubmissionData, addSubmissionComment } = useForm();

  const [reportForm, setReportForm] = useState({
    reviewed: '',
    challenges: '',
    recommendation: '',
  });
  const [selectedClinicalCategory, setSelectedClinicalCategory] = useState<string>('');
  const [isClinicalCategoryOpen, setIsClinicalCategoryOpen] = useState(false);
  const [selectedAppointmentStatus, setSelectedAppointmentStatus] = useState<string>('');
  const [savedReport, setSavedReport] = useState(false);
  const [isDone, setIsDone] = useState(false);

  // لود اطلاعات گزارش جلسه به صورت اختصاصی برای پرونده و نوبت جاری
  useEffect(() => {
    if (!booking || !isOpen) return;

    const caseIdentifier = getClientCaseIdentifier(booking);
    const bookingId = booking.id;
    const storageKey = `belhagh_real_sessions_v3_${caseIdentifier}`;

    let loadedReport: { reviewed?: string; challenges?: string; recommendation?: string } | null = null;
    let loadedStatus = '';
    let loadedCategory = '';
    let hasPreviousReport = false;

    // ۱. بررسی اختصاصی localStorage برای این پرونده و این نوبت
    if (typeof window !== 'undefined') {
      try {
        const specificKey = `belhagh_booking_report_${caseIdentifier}_${bookingId}`;
        const savedSpecific = localStorage.getItem(specificKey);
        if (savedSpecific) {
          const parsed = JSON.parse(savedSpecific);
          if (parsed && (parsed.reviewed || parsed.challenges || parsed.recommendation)) {
            loadedReport = parsed;
            loadedStatus = parsed.status || '';
            loadedCategory = parsed.category || '';
            hasPreviousReport = true;
          }
        }

        if (!loadedReport) {
          const savedList = localStorage.getItem(storageKey);
          if (savedList) {
            const list = JSON.parse(savedList);
            if (Array.isArray(list)) {
              const found = list.find(
                (item: any) =>
                  item.id === bookingId ||
                  item.id === booking.submissionId ||
                  (item.date && booking.slotValue && item.date === booking.slotValue)
              );
              if (found) {
                loadedReport = {
                  reviewed: found.reviewed ?? found.report?.reviewed ?? '',
                  challenges: found.challenges ?? found.report?.challenges ?? '',
                  recommendation: found.recommendation ?? found.report?.recommendation ?? '',
                };
                loadedCategory = found.category || '';
                loadedStatus = found.report?.status || (found.status === 'done' ? 'optimal' : '');
                if (found.status === 'done' || found.report || found.recommendation) {
                  hasPreviousReport = true;
                }
              }
            }
          }
        }
      } catch (e) {
        console.error('Failed reading saved report from localStorage', e);
      }
    }

    // ۲. بررسی ارسالی خام دیتابیس در صورت عدم وجود در localStorage
    if (!loadedReport && booking.rawSubmission?.data) {
      const d = booking.rawSubmission.data;
      if (d.report_reviewed || d.report_challenges || d.report_recommendation || d.report) {
        loadedReport = {
          reviewed: d.report_reviewed || d.report?.reviewed || '',
          challenges: d.report_challenges || d.report?.challenges || '',
          recommendation: d.report_recommendation || d.report?.recommendation || '',
        };
        loadedCategory = d.clinical_category || d.category || '';
        loadedStatus = d.clinical_status || d.session_status || '';
        hasPreviousReport = true;
      }
    }

    if (loadedReport) {
      const cleanedRec = cleanRecommendationCategory(loadedReport.recommendation || '');
      const cat = loadedCategory || extractCategoryFromRecommendation(loadedReport.recommendation || '');
      setReportForm({
        reviewed: loadedReport.reviewed || '',
        challenges: loadedReport.challenges || '',
        recommendation: cleanedRec,
      });
      setSelectedClinicalCategory(cat);
      if (loadedStatus && ['regressing', 'needs_followup', 'optimal', 'growing'].includes(loadedStatus)) {
        setSelectedAppointmentStatus(loadedStatus);
      } else {
        setSelectedAppointmentStatus(hasPreviousReport ? 'optimal' : '');
      }
      setIsDone(hasPreviousReport);
    } else {
      setReportForm({ reviewed: '', challenges: '', recommendation: '' });
      setSelectedClinicalCategory('');
      setSelectedAppointmentStatus('');
      setIsDone(booking.status === 'done');
    }

    setIsClinicalCategoryOpen(false);
    setSavedReport(false);
  }, [booking, isOpen]);

  // زمان نمایش داده‌شده نوبت
  const displayDateTime = useMemo(() => {
    if (!booking) return '';
    if (booking.slotValue && booking.slotValue !== 'زمان هماهنگ‌نشده') {
      return toPersianDigits(booking.slotValue);
    }
    if (booking.dayName && booking.timeRange) {
      return `${booking.dayName} - ساعت ${toPersianDigits(booking.timeRange)}`;
    }
    if (booking.createdAt) {
      return toPersianDigits(formatPersianDateTime(booking.createdAt));
    }
    return 'زمان هماهنگ‌نشده';
  }, [booking]);

  if (!isOpen || !booking) return null;

  const isRequiredFieldsComplete =
    Boolean(reportForm.reviewed.trim()) &&
    Boolean(reportForm.challenges.trim()) &&
    Boolean(selectedAppointmentStatus);

  const handleSubmitReport = () => {
    if (!isRequiredFieldsComplete) return;
    const catPrefix = selectedClinicalCategory ? `[محور بالینی: ${selectedClinicalCategory}] ` : '';
    const cleanRecText = reportForm.recommendation.trim().replace(/^\[محور بالینی:\s*[^\]]+\]\s*/, '');
    const fullRecommendation = cleanRecText
      ? `${catPrefix}${cleanRecText}`
      : (selectedClinicalCategory ? `[محور بالینی: ${selectedClinicalCategory}]` : '');
    const caseIdentifier = getClientCaseIdentifier(booking);
    const bookingId = booking.id;
    const statusToSave = selectedAppointmentStatus || 'optimal';

    const reportPayload = {
      counselor: booking.consultantName,
      date: displayDateTime,
      reviewed: reportForm.reviewed.trim(),
      challenges: reportForm.challenges.trim(),
      recommendation: fullRecommendation,
      category: selectedClinicalCategory,
      status: statusToSave,
      updatedAt: new Date().toISOString(),
    };

    // ۱. ذخیره ایزوله در localStorage بر اساس caseIdentifier و bookingId
    if (typeof window !== 'undefined') {
      try {
        const specificKey = `belhagh_booking_report_${caseIdentifier}_${bookingId}`;
        localStorage.setItem(specificKey, JSON.stringify(reportPayload));

        const storageKey = `belhagh_real_sessions_v3_${caseIdentifier}`;
        const savedList = localStorage.getItem(storageKey);
        let sessionList: any[] = [];
        if (savedList) {
          try {
            const parsed = JSON.parse(savedList);
            if (Array.isArray(parsed)) sessionList = parsed;
          } catch {}
        }

        const existingIndex = sessionList.findIndex(
          (item) => item.id === bookingId || item.id === booking.submissionId
        );
        const updatedItem = {
          id: bookingId,
          date: displayDateTime,
          topic: booking.topic,
          counselor: booking.consultantName,
          status: 'done',
          category: selectedClinicalCategory,
          reviewed: reportForm.reviewed.trim(),
          challenges: reportForm.challenges.trim(),
          recommendation: fullRecommendation,
          report: reportPayload,
        };

        if (existingIndex >= 0) {
          sessionList[existingIndex] = updatedItem;
        } else {
          sessionList.push(updatedItem);
        }
        localStorage.setItem(storageKey, JSON.stringify(sessionList));
      } catch (e) {
        console.error('Failed saving to localStorage', e);
      }
    }

    // ۲. به‌روزرسانی داده‌های فرم و ثبت در پایگاه‌داده/Context
    if (updateSubmissionData && booking.submissionId) {
      updateSubmissionData(booking.submissionId, {
        session_status: 'done',
        clinical_status: statusToSave,
        clinical_category: selectedClinicalCategory,
        report_reviewed: reportForm.reviewed.trim(),
        report_challenges: reportForm.challenges.trim(),
        report_recommendation: fullRecommendation,
        report: reportPayload,
      });
    }

    if (updateSubmissionStatus && booking.submissionId) {
      updateSubmissionStatus(booking.submissionId, statusToSave as any);
    }

    setIsDone(true);
    setSavedReport(true);
    if (onSaved) onSaved();

    window.setTimeout(() => {
      onClose();
    }, 900);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-3 sm:p-5 pt-16 sm:pt-20 pb-4 backdrop-blur-sm overflow-y-auto"
      onMouseDown={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
      dir="rtl"
    >
      <section className="max-h-[calc(100dvh-5.5rem)] sm:max-h-[calc(100vh-6.5rem)] w-full max-w-2xl flex flex-col overflow-hidden rounded-2xl sm:rounded-3xl bg-white shadow-2xl border border-slate-200">
        {/* نوار بالایی مودال */}
        <div className="shrink-0 flex items-center justify-between border-b border-slate-100 bg-white/95 p-4 sm:p-5 backdrop-blur">
          <div>
            <div className="text-base font-black text-slate-900">ثبت گزارش جلسه مشاوره</div>
            <div className="mt-1 text-[11px] text-slate-400">
              {displayDateTime} · مشاور تعیین‌شده: {booking.consultantName || 'مشاور مرکز'}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-9 place-items-center rounded-full bg-slate-100 text-lg text-slate-500 hover:bg-slate-200 transition cursor-pointer"
            title="بستن"
          >
            ×
          </button>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          {/* بنر وضعیت بررسی نوبت */}
          <div
            className={`mb-4 flex items-center justify-between rounded-2xl px-4 py-2.5 text-xs font-bold ${
              !isDone
                ? 'bg-blue-50 text-blue-700 border border-blue-100'
                : 'bg-slate-100 text-slate-600 border border-slate-200/60'
            }`}
          >
            <span>
              {!isDone
                ? '📌 این نوبت هنوز بررسی نشده است (با ثبت، وضعیت به انجام‌شده تغییر می‌کند).'
                : '✓ گزارش این جلسه قبلاً ثبت شده است و می‌توانید آن را تکمیل یا اصلاح کنید.'}
            </span>
          </div>

          {/* بخش هایلایت ویژه: نسخه و توصیه‌های تجویزی مشاور */}
          <div className="mb-5 rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50/90 via-amber-50/40 to-orange-50/30 p-4.5 shadow-sm ring-4 ring-amber-500/5">
            <div className="flex items-center justify-between pb-3 border-b border-amber-200/80 mb-3.5">
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-xl bg-amber-500 text-white shadow-xs">
                  <Sparkles className="size-4" />
                </span>
                <div>
                  <h3 className="text-sm font-black text-amber-950">نسخه و توصیه‌های تجویزی مشاور</h3>
                  <p className="text-[11px] text-amber-800/80">راهکارها، تمرین‌ها و پروتکل تجویزی جلسه</p>
                </div>
              </div>
            </div>

            {/* منوی کشویی / کرکره‌ای انتخاب سرفصل بالینی */}
            <div className="relative">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                  <span>سرفصل بالینی توصیه:</span>
                </span>
                {selectedClinicalCategory && (
                  <button
                    type="button"
                    onClick={() => setSelectedClinicalCategory('')}
                    className="text-[11px] text-amber-800 hover:text-rose-600 font-bold flex items-center gap-1 cursor-pointer transition"
                    title="حذف سرفصل انتخابی"
                  >
                    حذف انتخاب سرفصل ×
                  </button>
                )}
              </div>

              {/* دکمه ماشه‌ای باز و بسته کردن منوی کشویی / کرکره‌ای */}
              <button
                type="button"
                onClick={() => setIsClinicalCategoryOpen((prev) => !prev)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                  isClinicalCategoryOpen
                    ? 'bg-white border-amber-400 ring-2 ring-amber-200 shadow-sm'
                    : selectedClinicalCategory
                    ? 'bg-amber-100/90 border-amber-300 text-amber-950 hover:bg-amber-100 shadow-xs'
                    : 'bg-white border-amber-200/90 text-slate-600 hover:bg-white hover:border-amber-300 shadow-xs'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="size-2 rounded-full bg-amber-500 shrink-0" />
                  {selectedClinicalCategory ? (
                    <span className="font-black text-amber-950 truncate">
                      سرفصل انتخاب‌شده: <span className="text-[#173f6b] font-black">{selectedClinicalCategory}</span>
                    </span>
                  ) : (
                    <span className="text-slate-500 font-medium truncate">
                      جهت انتخاب سرفصل بالینی کلیک کنید...
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0 text-amber-800 mr-2">
                  <span className="text-[11px] font-bold hidden sm:inline">
                    {isClinicalCategoryOpen ? 'بستن منو' : 'باز کردن گزینه‌ها'}
                  </span>
                  <ChevronDown
                    className={`size-4 transition-transform duration-300 ${
                      isClinicalCategoryOpen ? 'rotate-180 text-amber-950' : 'text-amber-700'
                    }`}
                  />
                </div>
              </button>

              {/* پنل کشویی / کرکره‌ای بازشونده گزینه‌ها */}
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${
                  isClinicalCategoryOpen ? 'max-h-96 mt-2 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'
                }`}
              >
                <div className="rounded-xl border border-amber-200 bg-white/95 p-3 shadow-md backdrop-blur-xs">
                  <div className="text-[11px] font-bold text-amber-900/80 mb-2 px-1 flex items-center justify-between">
                    <span>یکی از سرفصل‌های بالینی زیر را انتخاب فرمایید:</span>
                    <span className="text-[10px] text-amber-700">کلیک جهت انتخاب و بستن منو</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {CLINICAL_CATEGORIES.map((cat) => {
                      const isSel = selectedClinicalCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => {
                            setSelectedClinicalCategory(isSel ? '' : cat);
                            setIsClinicalCategoryOpen(false);
                          }}
                          className={`px-2.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer text-center flex items-center justify-between gap-1 border ${
                            isSel
                              ? 'bg-[#173f6b] text-white border-[#173f6b] shadow-sm ring-2 ring-blue-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-amber-50 hover:border-amber-300 hover:text-amber-900'
                          }`}
                        >
                          <span className="truncate">{cat}</span>
                          {isSel && <Check className="size-3.5 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* کادر متنی نسخه و توصیه‌های تجویزی */}
            <div className="mt-3.5">
              <textarea
                value={reportForm.recommendation}
                onChange={(e) => setReportForm((old) => ({ ...old, recommendation: e.target.value }))}
                placeholder="راهکارها، تمرین‌ها و پروتکل تجویزی برای مراجع (ذیل سرفصل انتخابی)..."
                rows={4}
                className="w-full resize-none rounded-xl border border-amber-300/80 bg-white p-3.5 text-sm leading-7 outline-none transition placeholder:text-slate-300 focus:border-amber-500 focus:ring-4 focus:ring-amber-200/50 text-slate-800 shadow-xs"
              />
            </div>
          </div>

          <div className="space-y-5">
            {/* بخش ۱: موارد بررسی‌شده */}
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-black text-slate-700">
                <span className="grid size-6 place-items-center rounded-full bg-blue-50 text-[10px] text-blue-700 font-bold font-mono">
                  ۱
                </span>
                موارد بررسی‌شده در جلسه <span className="text-rose-500">*</span>
              </span>
              <textarea
                required
                value={reportForm.reviewed}
                onChange={(e) => setReportForm((old) => ({ ...old, reviewed: e.target.value }))}
                placeholder="مباحث، شرح‌حال و سرفصل‌های گفت‌وگو شده در جلسه..."
                rows={3}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </label>

            {/* بخش ۲: معضلات و چالش‌ها */}
            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-xs font-black text-slate-700">
                <span className="grid size-6 place-items-center rounded-full bg-blue-50 text-[10px] text-blue-700 font-bold font-mono">
                  ۲
                </span>
                معضلات و چالش‌های مراجع <span className="text-rose-500">*</span>
              </span>
              <textarea
                required
                value={reportForm.challenges}
                onChange={(e) => setReportForm((old) => ({ ...old, challenges: e.target.value }))}
                placeholder="مشکلات رفتاری، خانوادگی، روحی یا تحصیلی تشخیص داده‌شده..."
                rows={3}
                className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm leading-7 outline-none transition placeholder:text-slate-300 focus:border-blue-400 focus:bg-white focus:ring-4 focus:ring-blue-50"
              />
            </label>

            {/* بخش ۳: آخرین وضعیت بالینی مراجع (۴ دکمه استاندارد) */}
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="flex items-center gap-2 text-xs font-black text-slate-700">
                <span className="grid size-6 place-items-center rounded-full bg-blue-50 text-[10px] text-blue-700 font-bold font-mono">
                  ۳
                </span>
                تعیین آخرین وضعیت پرونده مراجع بر اساس این جلسه: <span className="text-rose-500">*</span>
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {CLINICAL_STATUSES.map((st) => {
                  const isSel = selectedAppointmentStatus === st.id;
                  return (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => setSelectedAppointmentStatus(st.id)}
                      className={`py-2.5 px-2 rounded-xl text-xs font-black transition-all cursor-pointer border text-center ${
                        isSel
                          ? st.color === 'rose'
                            ? 'bg-rose-600 text-white border-rose-600 shadow-xs ring-2 ring-rose-200'
                            : st.color === 'amber'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-xs ring-2 ring-amber-200'
                            : st.color === 'emerald'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs ring-2 ring-emerald-200'
                            : 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {st.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* باکس مشخصات مشاور و تاریخ جلسه */}
          <div className="mt-5 grid grid-cols-2 gap-3 rounded-2xl border border-slate-100 p-4 text-xs">
            <div>
              <span className="text-slate-400">مشاور ثبت‌کننده</span>
              <div className="mt-1 font-bold text-slate-800">{booking.consultantName || 'مشاور مرکز'}</div>
            </div>
            <div>
              <span className="text-slate-400">تاریخ جلسه</span>
              <div className="mt-1 font-bold text-slate-800 font-mono">
                {displayDateTime.split('،')[0]}
              </div>
            </div>
          </div>

          {/* پیام موفقیت ذخیره */}
          {savedReport && (
            <div className="mt-4 flex items-center gap-2 rounded-xl bg-emerald-50 p-3 text-xs font-bold text-emerald-700 animate-in fade-in">
              <Check className="size-4" />
              گزارش جلسه و وضعیت بالینی پرونده با موفقیت ذخیره گردید.
            </div>
          )}

          {!isRequiredFieldsComplete && (
            <p className="mt-4 text-[11px] font-bold text-rose-600 text-center">
              تکمیل موارد ۱، ۲ و انتخاب وضعیت در مورد ۳ برای ثبت گزارش الزامی است.
            </p>
          )}

          {/* دکمه ارسال و ذخیره */}
          <button
            type="button"
            onClick={handleSubmitReport}
            disabled={!isRequiredFieldsComplete}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#173f6b] px-5 py-4 text-sm font-black text-white transition hover:bg-[#0f3155] disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer shadow-md"
          >
            <Check className="size-4" />
            ثبت گزارش جلسه و تعیین وضعیت مراجع
          </button>
        </div>
      </section>
    </div>
  );
};
