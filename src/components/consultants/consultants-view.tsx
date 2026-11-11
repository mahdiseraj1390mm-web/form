'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { 
  CalendarClock, 
  Calendar, 
  Clock, 
  User, 
  Users, 
  CheckCircle2, 
  Ban, 
  AlertCircle, 
  Search, 
  Filter, 
  ArrowRight, 
  ExternalLink, 
  Phone, 
  MapPin, 
  Sparkles, 
  ShieldCheck, 
  FileText, 
  ChevronLeft, 
  ChevronRight, 
  CalendarDays, 
  Grid, 
  List, 
  Eye, 
  Settings, 
  PlusCircle,
  Briefcase,
  ChevronDown,
  UserCheck,
  Check,
  Building2,
  Inbox
} from 'lucide-react';
import { useForm } from '@/context/form-context';
import { useAdminAuth } from '@/context/admin-auth-context';
import type { 
  ConsultantProfile, 
  ConsultantBookingItem, 
  ConsultantDaySchedule,
  ConsultantListItem,
} from '@/lib/consultant-helpers';
import { 
  PERSIAN_WEEK_DAYS, 
  matchMemberToConsultant, 
  getBookingsForConsultant, 
  buildWeeklyScheduleForConsultant,
  buildAllConsultantsWithBookings,
  cleanConsultantName,
  detectDayIndex,
  COUNSELING_TOPICS,
  KNOWN_CONSULTANTS,
  CONSULTANT_DEFAULT_TOPICS
} from '@/lib/consultant-helpers';
import { ClientDossierFullview, ClientCaseGroup } from '@/components/submissions/client-dossier-fullview';
import { toPersianDigits, formatPersianDateTime } from '@/lib/persian';
import { ConsultantScheduleModal } from './consultant-schedule-modal';
import { ConsultantBookingReportModal } from './consultant-booking-report-modal';

interface ConsultantsViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const ConsultantsView: React.FC<ConsultantsViewProps> = ({ onNavigateTab }) => {
  const { currentUser } = useAdminAuth();
  const { teamMembers, submissions, forms, updateTeamMember } = useForm();

  const isSuperAdmin = !!(
    currentUser?.isSuperAdmin ||
    currentUser?.username === 'admin' ||
    currentUser?.role === 'super_admin'
  );

  // وضعیت‌های ناوبری در نمای ادمین
  const [adminViewMode, setAdminViewMode] = useState<'list' | 'timeline'>('list');
  const [selectedConsultantId, setSelectedConsultantId] = useState<string>('');
  
  // وضعیت‌های ناوبری در نمای مشاور
  const [consultantTab] = useState<'timeline' | 'clients'>('clients');
  const [activeDayIndex, setActiveDayIndex] = useState<number>(0);
  const [timelineMode, setTimelineMode] = useState<'day' | 'week'>('day');
  const [isSelfScheduleModalOpen, setIsSelfScheduleModalOpen] = useState(false);

  // فیلتر و جستجو
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTopic, setFilterTopic] = useState<'all' | 'child' | 'teen' | 'education' | 'clinical' | 'family'>('all');
  const [onlyWithBookings, setOnlyWithBookings] = useState(false);

  // پرونده مراجع جهت نمایش در مودال اختصاصی
  const [selectedClientGroup, setSelectedClientGroup] = useState<ClientCaseGroup | null>(null);
  const [viewingBooking, setViewingBooking] = useState<ConsultantBookingItem | null>(null);

  // ۱. استخراج و تجمیع هوشمند تمامی مشاوران و نوبت‌های ثبت‌شده در سامانه
  const {
    consultantsList: allConsultantsList,
    allBookings,
    totalBookingsCount,
    uniqueClientsCount,
  } = useMemo(() => {
    return buildAllConsultantsWithBookings(teamMembers, submissions);
  }, [teamMembers, submissions]);

  // ۲. شناسایی پروفایل مشاور در صورتی که کاربر جاری مشاور باشد
  const currentMember = useMemo(() => {
    if (!currentUser) return null;
    return (
      teamMembers.find(
        (m) =>
          m.id === currentUser.id ||
          m.mobile === currentUser.mobile ||
          m.username === currentUser.username
      ) || null
    );
  }, [currentUser, teamMembers]);

  const currentConsultantProfile = useMemo<ConsultantProfile>(() => {
    if (currentMember) {
      return matchMemberToConsultant(currentMember);
    }
    // در صورت عدم انطباق صریح با اعضای تیم، بررسی در میان مشاوران شناخته‌شده یا دارای نوبت
    const matchByPhone = allConsultantsList.find(
      (c) => c.profile.mobile && c.profile.mobile === currentUser?.mobile
    );
    if (matchByPhone) return matchByPhone.profile;

    return {
      id: currentUser?.id || 'custom-user',
      name: currentUser?.name || 'مشاور مرکز',
      mobile: currentUser?.mobile || currentUser?.username || '',
      jobTitle: currentUser?.jobTitle || 'مشاور تخصصی',
      specialization: currentUser?.jobTitle || 'مشاوره',
      bookingFieldIds: [],
      definedSlots: [],
    };
  }, [currentMember, currentUser, allConsultantsList]);

  // ۳. مشاور فعال انتخابی برای مشاهده تایم‌لاین توسط ادمین
  const activeTimelineConsultant = useMemo<ConsultantProfile>(() => {
    if (!isSuperAdmin) {
      return currentConsultantProfile;
    }
    if (selectedConsultantId) {
      const found = allConsultantsList.find(
        (c) =>
          c.profile.id === selectedConsultantId ||
          c.profile.bookingFieldIds.includes(selectedConsultantId)
      );
      if (found) return found.profile;
    }
    const fallbackProfile: ConsultantProfile = {
      id: 'empty',
      name: 'مشاوری یافت نشد',
      mobile: '',
      jobTitle: 'مشاور',
      specialization: '',
      bookingFieldIds: [],
      definedSlots: [],
    };
    return allConsultantsList[0]?.profile || fallbackProfile;
  }, [isSuperAdmin, currentConsultantProfile, selectedConsultantId, allConsultantsList]);

  // موضوعات و حوزه‌های مشاوره مجاز برای مشاور جاری
  const allowedTopics = useMemo<string[]>(() => {
    if (isSuperAdmin) return [];
    return (currentMember?.allowedTopics && currentMember.allowedTopics.length > 0)
      ? currentMember.allowedTopics
      : (currentUser?.allowedTopics || []);
  }, [isSuperAdmin, currentMember, currentUser]);

  // ۴. تایم‌لاین هفتگی مشاور فعال (بدون نشت نوبت‌های سایرین)
  const weeklySchedule = useMemo<ConsultantDaySchedule[]>(() => {
    return buildWeeklyScheduleForConsultant(activeTimelineConsultant, submissions, allowedTopics);
  }, [activeTimelineConsultant, submissions, allowedTopics]);

  // ۵. نوبت‌های مشاور فعال جاری (ایزوله‌سازی دقیق نوبت‌های مراجعان مشاور)
  const activeConsultantBookings = useMemo<ConsultantBookingItem[]>(() => {
    if (isSuperAdmin) {
      const found = allConsultantsList.find((c) => c.profile.id === activeTimelineConsultant.id);
      if (found) return found.bookings;
    }
    return getBookingsForConsultant(activeTimelineConsultant, submissions, allowedTopics);
  }, [isSuperAdmin, allConsultantsList, activeTimelineConsultant, submissions, allowedTopics]);

  // تب موضوع انتخابی جهت تفکیک نوبت‌ها برای مشاورانی که چند موضوع دارند (مانند نوجوان و خانواده)
  const [selectedTopicTab, setSelectedTopicTab] = useState<string>('all');

  // عضو متناظر مشاور فعال و موضوعات اختصاصی وی
  const activeConsultantMember = useMemo(() => {
    return (
      teamMembers.find(
        (m) =>
          m.id === activeTimelineConsultant.id ||
          m.consultantId === activeTimelineConsultant.id ||
          (m.assignedConsultantIds && m.assignedConsultantIds.includes(activeTimelineConsultant.id)) ||
          cleanConsultantName(m.name) === cleanConsultantName(activeTimelineConsultant.name)
      ) || null
    );
  }, [teamMembers, activeTimelineConsultant]);

  const activeConsultantTopics = useMemo<string[]>(() => {
    const fromMember = activeConsultantMember?.allowedTopics || [];
    if (fromMember.length > 0) return fromMember;
    const fromKnown = KNOWN_CONSULTANTS.find(
      (k) => k.id === activeTimelineConsultant.id || k.bookingFieldIds.includes(activeTimelineConsultant.id)
    );
    if (fromKnown && CONSULTANT_DEFAULT_TOPICS[fromKnown.id]) {
      return CONSULTANT_DEFAULT_TOPICS[fromKnown.id];
    }
    return [];
  }, [activeConsultantMember, activeTimelineConsultant]);

  useEffect(() => {
    setSelectedTopicTab('all');
  }, [activeTimelineConsultant.id]);

  // فیلتر کردن نوبت‌های مشاور بر اساس موضوع انتخابی
  const displayedConsultantBookings = useMemo(() => {
    if (selectedTopicTab === 'all') return activeConsultantBookings;
    const topObj = COUNSELING_TOPICS.find((t) => t.id === selectedTopicTab || t.name === selectedTopicTab);
    const keywords = topObj ? [topObj.id, topObj.name, ...topObj.keywords] : [selectedTopicTab];
    return activeConsultantBookings.filter((b) => {
      const t = (b.topic || '').toLowerCase();
      return keywords.some((kw) => t.includes(kw.toLowerCase()));
    });
  }, [activeConsultantBookings, selectedTopicTab]);

  const rawDaySchedule = weeklySchedule[activeDayIndex] || weeklySchedule[0];
  const currentDaySchedule = useMemo(() => {
    if (!rawDaySchedule) return rawDaySchedule;
    if (selectedTopicTab === 'all') return rawDaySchedule;

    const topObj = COUNSELING_TOPICS.find((t) => t.id === selectedTopicTab || t.name === selectedTopicTab);
    const keywords = topObj ? [topObj.id, topObj.name, ...topObj.keywords] : [selectedTopicTab];

    const filteredSlots = rawDaySchedule.slots.filter((slot) => {
      if (!slot.isOccupied) return true;
      const cat = (slot.category || slot.booking?.topic || '').toLowerCase();
      return keywords.some((kw) => cat.includes(kw.toLowerCase()));
    });

    const occCount = filteredSlots.filter((s) => s.isOccupied).length;
    return {
      ...rawDaySchedule,
      occupiedCount: occCount,
      freeCount: filteredSlots.length - occCount,
      slots: filteredSlots,
    };
  }, [rawDaySchedule, selectedTopicTab]);

  // باز کردن پرونده مراجع
  const handleOpenClientDossier = (booking: ConsultantBookingItem) => {
    const rawList = submissions.filter(
      (s) =>
        (s.data?.caseCode && s.data.caseCode === booking.caseCode) ||
        s.trackingCode === booking.caseCode ||
        (booking.clientMobile &&
          (s.data?.f_mobile === booking.clientMobile || s.mobile === booking.clientMobile))
    );

    const matchingSubs = rawList.length > 0 ? rawList : [booking.rawSubmission];
    const totalPaid = matchingSubs.reduce((acc, curr) => acc + (curr.paymentAmount || 0), 0);
    const overallStatus = (matchingSubs[0]?.status || 'approved') as any;

    const group: ClientCaseGroup = {
      caseCode: booking.caseCode,
      fullName: booking.clientName,
      mobile: booking.clientMobile,
      provinceCity: booking.provinceCity || 'مشخص‌نشده',
      submissions: matchingSubs,
      formTitles: matchingSubs.map((s) => {
        const f = forms.find((fm) => fm.id === s.formId);
        return f ? f.title : 'فرم نوبت‌دهی مشاوره';
      }),
      totalFormsCount: matchingSubs.length,
      latestDate: booking.submissionDate || new Date().toISOString(),
      overallStatus,
      totalPaidAmount: totalPaid,
    };

    setSelectedClientGroup(group);
  };

  // فیلتر کردن لیست مشاوران برای ادمین
  const filteredConsultantsList = useMemo(() => {
    return allConsultantsList.filter((item) => {
      const prof = item.profile;
      const mem = item.member;

      // فیلتر جستجو
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matchName =
          prof.name.toLowerCase().includes(q) ||
          (mem?.name && mem.name.toLowerCase().includes(q));
        const matchPhone =
          prof.mobile.includes(q) || (mem?.mobile && mem.mobile.includes(q));
        const matchJob =
          (prof.jobTitle && prof.jobTitle.toLowerCase().includes(q)) ||
          (mem?.jobTitle && mem.jobTitle.toLowerCase().includes(q));
        const matchClient = item.bookings.some(
          (b) =>
            b.clientName.toLowerCase().includes(q) ||
            b.caseCode.toLowerCase().includes(q) ||
            b.clientMobile.includes(q)
        );

        if (!matchName && !matchPhone && !matchJob && !matchClient) {
          return false;
        }
      }

      // فیلتر موضوع/تخصص
      if (filterTopic !== 'all') {
        const topicMap: Record<string, string[]> = {
          child: ['کودک'],
          teen: ['نوجوان'],
          education: ['تحصیلی'],
          clinical: ['بالینی'],
          family: ['خانواده', 'ازدواج'],
        };
        const keywords = topicMap[filterTopic] || [];
        const specMatch = keywords.some(
          (kw) =>
            prof.specialization.includes(kw) ||
            prof.jobTitle.includes(kw) ||
            item.bookings.some((b) => b.topic.includes(kw))
        );
        if (!specMatch) return false;
      }

      // فیلتر فقط مشاوران دارای نوبت
      if (onlyWithBookings && item.bookings.length === 0) {
        return false;
      }

      return true;
    });
  }, [allConsultantsList, searchQuery, filterTopic, onlyWithBookings]);

  // آمار کلی سامانه برای ادمین
  const overallStats = useMemo(() => {
    const consultantsWithCases = allConsultantsList.filter((c) => c.bookings.length > 0).length;

    return {
      totalConsultantsCount: allConsultantsList.length,
      totalBookingsCount,
      uniqueClientsCount,
      consultantsWithCases,
    };
  }, [allConsultantsList, totalBookingsCount, uniqueClientsCount]);

  // -------------------------------------------------------------
  // نمای مشترک تایم‌لاین هفتگی مشاور (نمایش اسلات‌های اشغال شده و خالی)
  // -------------------------------------------------------------
  const renderWeeklyTimelineContent = () => {
    return (
      <div className="space-y-5">
        {/* نوار انتخاب روزهای هفته + سوییچ حالت نمایش (روزانه / کل هفته) */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
          
          {/* دکمه‌های ۷ روز هفته */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {PERSIAN_WEEK_DAYS.map((day) => {
              const isSelected = activeDayIndex === day.index;
              const dayData = weeklySchedule[day.index];
              const occupied = dayData ? dayData.occupiedCount : 0;
              const total = dayData ? dayData.totalSlotsCount : 0;

              return (
                <button
                  key={day.index}
                  type="button"
                  onClick={() => setActiveDayIndex(day.index)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20'
                      : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200/80'
                  }`}
                >
                  <span>{day.name}</span>
                  {occupied > 0 ? (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        isSelected
                          ? 'bg-white text-blue-700 font-extrabold'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {toPersianDigits(occupied)} رزرو
                    </span>
                  ) : total > 0 ? (
                    <span className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                      خالی
                    </span>
                  ) : (
                    <span className={`text-[9px] ${isSelected ? 'text-blue-200' : 'text-rose-400'}`}>
                      تعطیل
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* تغییر حالت بین تفصیلی روزانه و جدول کل هفته */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl self-end sm:self-auto shrink-0 border border-slate-200">
            <button
              type="button"
              onClick={() => setTimelineMode('day')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                timelineMode === 'day'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>نمای روز {PERSIAN_WEEK_DAYS[activeDayIndex]?.name}</span>
            </button>
            <button
              type="button"
              onClick={() => setTimelineMode('week')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                timelineMode === 'week'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>جدول کل هفته</span>
            </button>
          </div>
        </div>

        {/* نوار تفکیک موضوعی نوبت‌ها برای مشاورانی که چند نوع نوبت دارند (مانند نوجوان و خانواده) */}
        {activeConsultantTopics.length > 1 && (
          <div className="flex items-center gap-2 p-2.5 bg-gradient-to-r from-slate-100 via-indigo-50/40 to-slate-100 rounded-2xl border border-slate-200/90 flex-wrap">
            <span className="text-xs font-extrabold text-slate-800 px-2 flex items-center gap-1.5 shrink-0">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>تفکیک موضوعی نوبت‌ها:</span>
            </span>

            <button
              type="button"
              onClick={() => setSelectedTopicTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                selectedTopicTab === 'all'
                  ? 'bg-white text-slate-900 shadow-xs border border-slate-200 ring-2 ring-slate-400/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
              }`}
            >
              <span>همه موضوعات</span>
              <span className="px-1.5 py-0.5 rounded-md text-[10px] bg-slate-100 text-slate-700 font-mono font-extrabold">
                {toPersianDigits(activeConsultantBookings.length)}
              </span>
            </button>

            {activeConsultantTopics.map((topKey) => {
              const topObj = COUNSELING_TOPICS.find((t) => t.id === topKey || t.name === topKey);
              const topName = topObj ? topObj.name : `مشاوره ${topKey}`;
              const count = activeConsultantBookings.filter((b) => {
                const t = (b.topic || '').toLowerCase();
                const kw = topObj ? [topObj.id, topObj.name, ...topObj.keywords] : [topKey];
                return kw.some((k) => t.includes(k.toLowerCase()));
              }).length;

              const isSelected = selectedTopicTab === topKey;

              return (
                <button
                  key={topKey}
                  type="button"
                  onClick={() => setSelectedTopicTab(topKey)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-500/20'
                      : 'bg-white/80 text-slate-700 hover:bg-white border border-slate-200'
                  }`}
                >
                  <span>{topName}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-extrabold ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-700 border border-blue-100'
                    }`}
                  >
                    {toPersianDigits(count)} نوبت
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* حالت ۱: نمایش تفصیلی روز انتخاب‌شده (محور زمانی عمودی) */}
        {timelineMode === 'day' && (
          <div className="space-y-4">
            
            {/* سربرگ خلاصه وضعیت روز انتخاب شده */}
            <div className="p-4 bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-white rounded-2xl border border-blue-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-sm">
                  {PERSIAN_WEEK_DAYS[activeDayIndex]?.shortName}
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    تایم‌لاین نوبت‌های روز {PERSIAN_WEEK_DAYS[activeDayIndex]?.name}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    مشاور: {activeTimelineConsultant.name} ({activeTimelineConsultant.jobTitle})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-xl border border-emerald-200 font-bold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{toPersianDigits(currentDaySchedule?.occupiedCount || 0)} نوبت اشغال‌شده</span>
                </div>
                <div className="flex items-center gap-1.5 bg-slate-50 text-slate-700 px-3 py-1.5 rounded-xl border border-slate-200 font-medium">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>{toPersianDigits(currentDaySchedule?.freeCount || 0)} زمان خالی</span>
                </div>
              </div>
            </div>

            {/* لیست اسلات‌های زمانی این روز */}
            {currentDaySchedule?.slots.length === 0 ? (
              <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-200 space-y-2">
                <CalendarDays className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-700">
                  مشاور در روز {PERSIAN_WEEK_DAYS[activeDayIndex]?.name} برنامه کاری ندارد
                </p>
                <p className="text-[11px] text-slate-400">
                  برای این روز اسلاتی از قبل تعریف نشده و نوبتی نیز رزرو نگردیده است.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {currentDaySchedule?.slots.map((slot, idx) => {
                  const isOcc = slot.isOccupied;
                  const b = slot.booking;

                  return (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl border transition-all ${
                        isOcc
                          ? 'bg-gradient-to-r from-emerald-50/70 via-white to-blue-50/30 border-emerald-300/80 shadow-xs ring-1 ring-emerald-400/20'
                          : 'bg-white border-slate-200/90 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        
                        {/* زمان نوبت و نشانگر وضعیت */}
                        <div className="flex items-start md:items-center gap-3">
                          <div
                            className={`p-2.5 rounded-xl flex items-center justify-center shrink-0 ${
                              isOcc
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            <Clock className="w-5 h-5" />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-sm font-mono text-slate-900">
                                {slot.timeRange}
                              </span>

                              {isOcc ? (
                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white shadow-2xs">
                                  اشغال‌شده (رزرو توسط مراجع)
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                  زمان آزاد و خالی
                                </span>
                              )}

                              {slot.category && (
                                <span
                                  className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-md border ${
                                    slot.category.includes('نوجوان')
                                      ? 'bg-sky-50 text-sky-800 border-sky-200'
                                      : slot.category.includes('خانواده') || slot.category.includes('ازدواج')
                                      ? 'bg-purple-50 text-purple-800 border-purple-200'
                                      : slot.category.includes('کودک')
                                      ? 'bg-amber-50 text-amber-800 border-amber-200'
                                      : slot.category.includes('بالینی')
                                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                      : 'bg-blue-50 text-blue-700 border-blue-200'
                                  }`}
                                >
                                  {slot.category}
                                </span>
                              )}
                            </div>

                            <p className="text-[11px] text-slate-500">
                              {isOcc
                                ? 'این تایم توسط مراجع در سامانه رزرو شده است.'
                                : 'این ساعت خالی و آماده رزرو برای مراجعین می‌باشد.'}
                            </p>
                          </div>
                        </div>

                        {/* اطلاعات فردی که نوبت را رزرو کرده است */}
                        {isOcc && b && (
                          <div className="flex flex-col sm:flex-row sm:items-center gap-3 bg-white/80 p-3 rounded-xl border border-emerald-200/70 md:max-w-md w-full justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-xs text-slate-900">
                                  {b.clientName}
                                </span>
                                <span className="font-mono text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                                  {b.caseCode}
                                </span>
                              </div>

                              <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                                {b.clientMobile ? (
                                  <a
                                    href={`tel:${b.clientMobile}`}
                                    className="font-mono text-blue-700 hover:underline flex items-center gap-1 font-bold"
                                    title="تماس مستقیم با مراجع"
                                  >
                                    <Phone className="w-3 h-3 text-emerald-600" />
                                    <span>{b.clientMobile}</span>
                                  </a>
                                ) : (
                                  <span className="font-mono text-slate-400">بدون شماره</span>
                                )}
                                {b.provinceCity && (
                                  <>
                                    <span>•</span>
                                    <span className="flex items-center gap-0.5 text-slate-600 truncate max-w-[140px]">
                                      <MapPin className="w-3 h-3 text-slate-400" />
                                      <span>{b.provinceCity}</span>
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 shrink-0 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-emerald-100">
                              <button
                                type="button"
                                onClick={() => setViewingBooking(b)}
                                className="px-2.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-xs shadow-2xs transition flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <CalendarClock className="w-3.5 h-3.5 text-emerald-600" />
                                <span>مشاهده نوبت</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleOpenClientDossier(b)}
                                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>مشاهده پرونده</span>
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* حالت ۲: نمایش جدول کل روزهای هفته (ستون به ستون) */}
        {timelineMode === 'week' && (
          <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
            {weeklySchedule.map((day) => {
              return (
                <div
                  key={day.dayIndex}
                  className="bg-white rounded-2xl border border-slate-200/90 p-3 space-y-3 flex flex-col shadow-2xs"
                >
                  <div className="pb-2 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-900">{day.dayName}</h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        {toPersianDigits(day.occupiedCount)} از {toPersianDigits(day.totalSlotsCount)} اشغال
                      </p>
                    </div>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                        day.occupiedCount > 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : day.totalSlotsCount > 0
                          ? 'bg-slate-100 text-slate-600'
                          : 'bg-rose-50 text-rose-600'
                      }`}
                    >
                      {day.occupiedCount > 0
                        ? `${day.occupiedCount} رزرو`
                        : day.totalSlotsCount > 0
                        ? 'خالی'
                        : 'تعطیل'}
                    </span>
                  </div>

                  <div className="space-y-2 flex-1">
                    {day.slots.length === 0 ? (
                      <div className="py-8 text-center text-[10px] text-slate-400">
                        تعطیل
                      </div>
                    ) : (
                      day.slots.map((s, idx) => {
                        const isOcc = s.isOccupied;
                        const b = s.booking;

                        return (
                          <div
                            key={idx}
                            onClick={() => {
                              if (isOcc && b) handleOpenClientDossier(b);
                            }}
                            className={`p-2 rounded-xl text-xs border transition ${
                              isOcc
                                ? 'bg-emerald-50/80 border-emerald-300 text-emerald-950 cursor-pointer hover:bg-emerald-100 shadow-2xs'
                                : 'bg-slate-50/80 border-slate-200/70 text-slate-500'
                            }`}
                            title={isOcc && b ? `کلیک جهت مشاهده پرونده ${b.clientName}` : 'زمان خالی'}
                          >
                            <div className="flex items-center justify-between font-mono font-bold text-[11px]">
                              <span>{s.timeRange}</span>
                              {isOcc ? (
                                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                              )}
                            </div>

                            {isOcc && b ? (
                              <div className="mt-1 pt-1 border-t border-emerald-200/60">
                                <div className="font-extrabold text-[11px] truncate">{b.clientName}</div>
                                <div className="text-[10px] text-slate-500 font-mono truncate">{b.caseCode}</div>
                              </div>
                            ) : (
                              <div className="mt-1 text-[10px] text-slate-400">خالی</div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>
    );
  };

  // -------------------------------------------------------------
  // مودال مشاهده جزئیات نوبت اخذ شده
  // -------------------------------------------------------------
  const renderBookingDetailsModal = () => {
    if (!viewingBooking) return null;
    return (
      <ConsultantBookingReportModal
        booking={viewingBooking}
        isOpen={!!viewingBooking}
        onClose={() => setViewingBooking(null)}
      />
    );
  };

  // -------------------------------------------------------------
  // نمای ۱: پنل اختصاصی مشاور (کاربری که نقش مشاور دارد و لاگین کرده است)
  // -------------------------------------------------------------
  if (!isSuperAdmin) {
    return (
      <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50/60 p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* سربرگ مشخصات مشاور */}
        <div className="p-5 bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-700 text-white font-black text-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                {currentConsultantProfile.name.slice(0, 2)}
              </div>
              <span
                className="absolute -bottom-1 -left-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white"
                title="آنلاین"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-100 text-blue-800">
                  پنل اختصاصی مشاور
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  حساب کاربری فعال
                </span>
                {allowedTopics.length > 0 && (
                  <div className="flex items-center gap-1">
                    {allowedTopics.map((topId) => {
                      const topicObj = COUNSELING_TOPICS.find((t) => t.id === topId);
                      return (
                        <span
                          key={topId}
                          className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200"
                        >
                          {topicObj?.name || topId}
                        </span>
                      );
                    })}
                  </div>
                )}
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                {currentConsultantProfile.name}
              </h2>
              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                <span className="font-semibold text-slate-700">{currentConsultantProfile.jobTitle}</span>
                <span>•</span>
                <span className="font-mono text-slate-600 flex items-center gap-1 font-bold">
                  <Phone className="w-3.5 h-3.5 text-blue-500" />
                  <span>{currentConsultantProfile.mobile}</span>
                </span>
              </div>
            </div>
          </div>

          {/* آمارهای سریع مشاور */}
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <div className="px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-center">
              <span className="text-[10px] text-slate-500 font-medium">کل پرونده‌های من</span>
              <div className="text-base font-extrabold text-slate-900 mt-0.5">
                {toPersianDigits(activeConsultantBookings.length)} مراجع
              </div>
            </div>

            <div className="px-3.5 py-2.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center">
              <span className="text-[10px] text-emerald-700 font-medium">نوبت‌های رزرو شده</span>
              <div className="text-base font-extrabold text-emerald-800 mt-0.5">
                {toPersianDigits(activeConsultantBookings.length)} نوبت
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsSelfScheduleModalOpen(true)}
              className="col-span-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-700 text-white font-extrabold text-xs rounded-2xl shadow-sm hover:from-emerald-700 hover:to-teal-800 transition flex items-center gap-2 cursor-pointer w-full sm:w-auto justify-center"
            >
              <Clock className="w-4 h-4" />
              <span>تنظیم و ویرایش ساعات کاری من</span>
            </button>
          </div>
        </div>

        {/* تب تایم‌لاین نوبت‌ها و نوار تب بالای پنل مشاور فعلاً پنهان شده است؛ منطق و بک‌اند تایم‌لاین برای نسخه‌های آتی حفظ شده است */}
        {/* محتوای تب فعال مشاور */}
        {consultantTab === 'timeline' ? (
          renderWeeklyTimelineContent()
        ) : (
          <div className="space-y-4">
            
            {/* لیست پرونده‌های رزرو شده این مشاور */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">
                    لیست پرونده‌های مراجعین اختصاصی شما
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    مراجعانی که نوبت مشاوره خود را با شما ثبت نموده‌اند
                  </p>
                </div>

                {/* دکمه‌های تفکیک موضوعی در کارتابل پرونده‌ها */}
                {activeConsultantTopics.length > 1 && (
                  <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setSelectedTopicTab('all')}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                        selectedTopicTab === 'all'
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <span>همه پرونده‌ها</span>
                      <span className="font-mono text-[10px] text-slate-500">({toPersianDigits(activeConsultantBookings.length)})</span>
                    </button>
                    {activeConsultantTopics.map((topKey) => {
                      const topObj = COUNSELING_TOPICS.find((t) => t.id === topKey || t.name === topKey);
                      const topName = topObj ? topObj.name : topKey;
                      const count = activeConsultantBookings.filter((b) => {
                        const t = (b.topic || '').toLowerCase();
                        const kw = topObj ? [topObj.id, topObj.name, ...topObj.keywords] : [topKey];
                        return kw.some((k) => t.includes(k.toLowerCase()));
                      }).length;
                      const isSelected = selectedTopicTab === topKey;

                      return (
                        <button
                          key={topKey}
                          type="button"
                          onClick={() => setSelectedTopicTab(topKey)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          <span>{topName}</span>
                          <span className={`font-mono text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>({toPersianDigits(count)})</span>
                        </button>
                      );
                    })}
                  </div>
                )}

                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-xl shrink-0 self-start sm:self-auto">
                  {toPersianDigits(displayedConsultantBookings.length)} مراجع در این بخش
                </span>
              </div>

              {displayedConsultantBookings.length === 0 ? (
                <div className="p-12 text-center text-slate-400 space-y-2">
                  <Inbox className="w-10 h-10 mx-auto text-slate-300" />
                  <p className="font-bold text-xs text-slate-700">پرونده‌ای در این موضوع یافت نشد</p>
                  <p className="text-[11px]">به محض ثبت نوبت توسط مراجع، مشخصات پرونده در این جدول درج می‌گردد.</p>
                </div>
              ) : (
                <>
                  {/* نمایش جدولی استاندارد برای تبلت و دسکتاپ */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-right text-xs">
                      <thead>
                        <tr className="bg-slate-50/80 text-slate-600 border-b border-slate-200 font-bold">
                          <th className="py-3 px-4">کد پرونده</th>
                          <th className="py-3 px-4">نام و نام خانوادگی</th>
                          <th className="py-3 px-4">شماره تماس</th>
                          <th className="py-3 px-4">زمان نوبت رزرو شده</th>
                          <th className="py-3 px-4">موضوع مشاوره</th>
                          <th className="py-3 px-4">استان و شهر</th>
                          <th className="py-3 px-4 text-center">اقدام</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {displayedConsultantBookings.map((b) => (
                          <tr key={b.id} className="hover:bg-slate-50/60 transition">
                            <td className="py-3.5 px-4 font-mono font-bold text-blue-700">
                              {b.caseCode}
                            </td>
                            <td className="py-3.5 px-4 font-extrabold text-slate-900">
                              {b.clientName}
                            </td>
                            <td className="py-3.5 px-4 font-mono text-slate-600" dir="ltr">
                              {b.clientMobile}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-800">
                              <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                                {b.slotValue || `${b.dayName} - ${b.timeRange}`}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600">
                              <span
                                className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md border ${
                                  b.topic.includes('نوجوان')
                                    ? 'bg-sky-50 text-sky-800 border-sky-200'
                                    : b.topic.includes('خانواده') || b.topic.includes('ازدواج')
                                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                                    : b.topic.includes('کودک')
                                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                                    : b.topic.includes('بالینی')
                                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}
                              >
                                {b.topic}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-500">
                              {b.provinceCity || '—'}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => setViewingBooking(b)}
                                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg font-bold text-xs transition shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <CalendarClock className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>مشاهده نوبت</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenClientDossier(b)}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs transition shadow-2xs flex items-center justify-center gap-1 cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>مشاهده پرونده کامل</span>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* نمایش کارتی بهینه و لمسی اختصاصی برای موبایل */}
                  <div className="block md:hidden divide-y divide-slate-100">
                    {displayedConsultantBookings.map((b) => (
                      <div key={b.id} className="p-4 space-y-3 bg-white hover:bg-slate-50/70 transition">
                        {/* سربرگ کارت: نام مراجع و کد پرونده */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold flex items-center justify-center text-xs shrink-0">
                              <User className="w-4 h-4" />
                            </div>
                            <div>
                              <h4 className="font-extrabold text-sm text-slate-900 leading-tight">{b.clientName}</h4>
                              <span className="font-mono text-[11px] font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md inline-block mt-0.5 border border-blue-100">
                                {b.caseCode}
                              </span>
                            </div>
                          </div>

                          <span className="text-[10px] font-extrabold px-2 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-mono text-center">
                            {b.slotValue || `${b.dayName} - ${b.timeRange}`}
                          </span>
                        </div>

                        {/* اطلاعات تماس، موضوع و شهر */}
                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-3 rounded-2xl border border-slate-100">
                          <div>
                            <span className="text-slate-400 block text-[10px] mb-0.5">موضوع مشاوره:</span>
                            <span className="font-bold text-slate-800 truncate block">{b.topic}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[10px] mb-0.5">شهر / استان:</span>
                            <span className="font-medium text-slate-700 truncate block">{b.provinceCity || 'ثبت‌نشده'}</span>
                          </div>
                          <div className="col-span-2 flex items-center justify-between pt-1.5 border-t border-slate-200/60 mt-0.5">
                            <span className="text-slate-400 text-[10px]">شماره تماس:</span>
                            {b.clientMobile ? (
                              <a
                                href={`tel:${b.clientMobile}`}
                                className="font-mono font-bold text-blue-700 flex items-center gap-1.5 hover:underline py-0.5"
                                title="تماس تلفنی با مراجع"
                              >
                                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                                <span>{b.clientMobile}</span>
                              </a>
                            ) : (
                              <span className="text-slate-400">ثبت‌نشده</span>
                            )}
                          </div>
                        </div>

                        {/* دکمه‌های اقدام لمسی */}
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => setViewingBooking(b)}
                            className="py-2.5 px-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <CalendarClock className="w-3.5 h-3.5 text-slate-500" />
                            <span>مشاهده نوبت</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenClientDossier(b)}
                            className="py-2.5 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>پرونده کامل</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

          </div>
        )}

        
      {/* مودال مشاهده نوبت اخذ شده */}
      {renderBookingDetailsModal()}

        {/* مودال مشاهده پرونده کامل مراجع */}
        {selectedClientGroup && (
          <ClientDossierFullview
            clientCase={selectedClientGroup}
            onClose={() => setSelectedClientGroup(null)}
          />
        )}

        {/* مودال ویرایش ساعات کاری مشاور جاری */}
        <ConsultantScheduleModal
          isOpen={isSelfScheduleModalOpen}
          onClose={() => setIsSelfScheduleModalOpen(false)}
          title="تنظیم و ویرایش ساعات کاری من"
          description={`تنظیم روزهای حضور، شیفت‌ها و مدت جلسات - ${currentConsultantProfile.name}`}
          initialSchedule={currentMember?.workingHours}
          topics={currentMember?.allowedTopics}
          onSave={(newSchedule) => {
            if (currentMember) {
              updateTeamMember(currentMember.id, { 
                workingHours: newSchedule,
                topicWorkingHours: newSchedule.topicSchedules 
              });
            }
          }}
        />

      </div>
    );
  }

  // -------------------------------------------------------------
  // نمای ۲: پنل مدیریت کل مشاوران برای ادمین (لیست کاربران و نوبت‌های هر مشاور)
  // -------------------------------------------------------------
  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50/60 p-4 sm:p-6 lg:p-8 space-y-6 text-slate-900">
      
      {/* سربرگ بخش مدیریت مشاوران */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-600 text-white shadow-sm shadow-blue-500/20">
              <CalendarClock className="w-5 h-5" />
            </span>
            <h1 className="text-lg font-black tracking-tight text-slate-900">
              سامانه مشاوران و تایم‌لاین نوبت‌دهی
            </h1>
          </div>
          <p className="text-xs text-slate-500">
            مشاهده مشاوران تعریف‌شده در تنظیمات، پرونده‌های رزرو شده هر مشاور و تقویم اشغال زمانی
          </p>
        </div>

        {/* دکمه‌های اقدام ادمین */}
        {adminViewMode === 'timeline' && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setAdminViewMode('list')}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <ArrowRight className="w-4 h-4" />
              <span>بازگشت به لیست همه مشاوران</span>
            </button>
          </div>
        )}
      </div>

      {/* کارت‌های آمار کلی */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <span className="text-[11px] text-slate-500 font-bold">کل مشاوران مرکز</span>
          <div className="text-xl font-black text-slate-900 mt-1">
            {toPersianDigits(overallStats.totalConsultantsCount)} نفر
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <span className="text-[11px] text-blue-600 font-bold">کل نوبت‌های رزرو شده</span>
          <div className="text-xl font-black text-blue-700 mt-1">
            {toPersianDigits(overallStats.totalBookingsCount)} نوبت
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <span className="text-[11px] text-emerald-600 font-bold">مراجعین یکتا</span>
          <div className="text-xl font-black text-emerald-700 mt-1">
            {toPersianDigits(overallStats.uniqueClientsCount)} مراجع
          </div>
        </div>

        <div className="p-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <span className="text-[11px] text-purple-600 font-bold">مشاوران دارای پرونده</span>
          <div className="text-xl font-black text-purple-700 mt-1">
            {toPersianDigits(overallStats.consultantsWithCases)} نفر
          </div>
        </div>
      </div>

      {/* اگر ادمین در حالت مشاهده تایم‌لاین یک مشاور خاص باشد */}
      {adminViewMode === 'timeline' ? (
        <div className="space-y-5">
          {/* نوار بالایی انتخاب مشاور برای نمایش تایم‌لاین */}
          <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-sm">
                {activeTimelineConsultant.name.slice(0, 2)}
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-slate-900">
                  تایم‌لاین هفتگی: {activeTimelineConsultant.name}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activeTimelineConsultant.jobTitle} | شماره تماس: {activeTimelineConsultant.mobile}
                </p>
              </div>
            </div>

            {/* سوییچ سریع به مشاور دیگر */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-bold">انتخاب مشاور:</span>
              <select
                value={activeTimelineConsultant.id}
                onChange={(e) => setSelectedConsultantId(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 rounded-xl bg-white text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
              >
                {allConsultantsList.map((item) => (
                  <option key={item.profile.id} value={item.profile.id}>
                    {item.profile.genderPrefix ? `${item.profile.genderPrefix} ` : ''}{item.profile.name} ({toPersianDigits(item.bookings.length)} نوبت)
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* محتوای تایم‌لاین هفتگی */}
          {renderWeeklyTimelineContent()}
        </div>
      ) : (
        /* حالت اصلی ادمین: لیست کاربران/مشاوران و نمایش چه کسانی از آنها نوبت گرفته‌اند */
        <div className="space-y-5">
          
          {/* نوار جستجو و فیلتر مشاوران */}
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-2 border-b border-slate-200">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="جستجوی مشاور، نام مراجع، کد پرونده یا تلفن..."
                className="w-full pr-9 pl-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* فیلتر تخصص */}
              <select
                value={filterTopic}
                onChange={(e) => setFilterTopic(e.target.value as any)}
                className="px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100 cursor-pointer"
              >
                <option value="all">همه گرایش‌ها و تخصص‌ها</option>
                <option value="child">مشاوره کودک</option>
                <option value="teen">مشاوره نوجوان</option>
                <option value="education">مشاوره تحصیلی</option>
                <option value="clinical">مشاوره بالینی</option>
                <option value="family">مشاوره ازدواج و خانواده</option>
              </select>

              {/* چک‌باکس فقط مشاوران دارای نوبت */}
              <button
                type="button"
                onClick={() => setOnlyWithBookings((prev) => !prev)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  onlyWithBookings
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                }`}
              >
                <Check className={`w-3.5 h-3.5 ${onlyWithBookings ? 'opacity-100' : 'opacity-0'}`} />
                <span>فقط مشاوران دارای نوبت</span>
              </button>
            </div>
          </div>

          {/* لیست کارت‌های مشاوران */}
          {filteredConsultantsList.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-dashed border-slate-200 space-y-2">
              <Users className="w-10 h-10 text-slate-300 mx-auto" />
              <p className="text-xs font-bold text-slate-700">مشاوری با این مشخصات یافت نشد</p>
              <p className="text-[11px] text-slate-400">عبارت جستجو یا فیلترها را بررسی فرمایید.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredConsultantsList.map((item) => {
                const prof = item.profile;
                const mem = item.member;
                const bookings = item.bookings;
                const hasBookings = bookings.length > 0;

                return (
                  <div
                    key={prof.id}
                    className="p-5 bg-white border border-slate-200 rounded-3xl shadow-xs hover:border-slate-300 transition space-y-4"
                  >
                    {/* مشخصات مشاور */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-100 to-indigo-100 border border-slate-300 text-indigo-950 font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                          {prof.genderPrefix ? prof.genderPrefix : prof.name.slice(0, 2)}
                        </div>

                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            {prof.genderPrefix && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                prof.genderPrefix === 'خانم'
                                  ? 'bg-purple-50 text-purple-700 border-purple-200'
                                  : 'bg-blue-50 text-blue-700 border-blue-200'
                              }`}>
                                {prof.genderPrefix}
                              </span>
                            )}
                            <span className="font-extrabold text-sm text-slate-900">{prof.genderPrefix ? `${prof.genderPrefix} ` : ''}{prof.name}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                              {prof.jobTitle}
                            </span>
                            {mem && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                                مشاور رسمی سامانه
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                            <span className="font-mono text-slate-600 flex items-center gap-1 font-bold">
                              <Phone className="w-3.5 h-3.5 text-blue-500" />
                              <span>نام کاربری / تلفن: {prof.mobile}</span>
                            </span>
                            <span>•</span>
                            <span className="text-slate-600">{prof.specialization}</span>
                          </div>
                        </div>
                      </div>

                      {/* آمار و دکمه مشاهده تایم‌لاین */}
                      <div className="flex items-center gap-3">
                        <div className="text-left md:text-right">
                          <span className="text-[10px] text-slate-400 font-bold">تعداد نوبت‌های دریافتی:</span>
                          <div className="text-sm font-black text-blue-700 mt-0.5">
                            {toPersianDigits(bookings.length)} نوبت رزرو شده
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedConsultantId(prof.id);
                            setAdminViewMode('timeline');
                          }}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                        >
                          <CalendarClock className="w-4 h-4" />
                          <span>مشاهده تایم‌لاین هفتگی</span>
                        </button>
                      </div>
                    </div>

                    {/* چه کسانی از این مشاور نوبت مشاوره گرفته‌اند */}
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-xs text-slate-800 flex items-center gap-1.5">
                          <UserCheck className="w-4 h-4 text-emerald-600" />
                          <span>پرونده‌هایی که از {prof.name} نوبت مشاوره گرفته‌اند:</span>
                        </span>
                        <span className="text-[11px] font-bold text-slate-400">
                          {hasBookings ? `${toPersianDigits(bookings.length)} پرونده` : 'بدون نوبت'}
                        </span>
                      </div>

                      {!hasBookings ? (
                        <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-400">
                          هنوز نوبتی برای این مشاور رزرو نگردیده است.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                          {bookings.map((b) => (
                            <div
                              key={b.id}
                              className="p-3 bg-slate-50/70 hover:bg-blue-50/40 rounded-xl border border-slate-200 hover:border-blue-300 transition space-y-2"
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-extrabold text-xs text-slate-900">{b.clientName}</span>
                                <span className="font-mono text-[10px] font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                                  {b.caseCode}
                                </span>
                              </div>

                              <div className="space-y-1 text-[11px] text-slate-600">
                                <div className="flex items-center gap-1 text-emerald-800 font-bold">
                                  <Clock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                  <span className="truncate">{b.slotValue || `${b.dayName} - ${b.timeRange}`}</span>
                                </div>
                                <div className="flex items-center gap-1 text-slate-500 font-mono">
                                  <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                  <span>{b.clientMobile || 'بدون شماره'}</span>
                                </div>
                                <div className="text-[10px] text-slate-500 truncate">
                                  موضوع: {b.topic}
                                </div>
                              </div>

                              <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                                <button
                                  type="button"
                                  onClick={() => setViewingBooking(b)}
                                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1 cursor-pointer transition"
                                >
                                  <CalendarClock className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>مشاهده نوبت</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => handleOpenClientDossier(b)}
                                  className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer transition"
                                >
                                  <span>مشاهده پرونده مراجع</span>
                                  <ExternalLink className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      )}

      {/* مودال مشاهده نوبت اخذ شده */}
      {renderBookingDetailsModal()}

      {/* مودال مشاهده پرونده کامل مراجع */}
      {selectedClientGroup && (
        <ClientDossierFullview
          clientCase={selectedClientGroup}
          onClose={() => setSelectedClientGroup(null)}
        />
      )}

    </div>
  );
};
