'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useForm } from '@/context/form-context';
import { useAdminAuth } from '@/context/admin-auth-context';
import { FamilyDossierGroup, FamilyMemberSummary, FamilyQuestionComparisonItem } from '@/types/advanced';
import { Form } from '@/types/form';
import {
  Users,
  User,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Eye,
  Printer,
  Search,
  ChevronRight,
  ChevronLeft,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  Filter,
  Layers,
  FileText,
  HeartHandshake,
  ShieldCheck,
  Sparkles,
  HelpCircle,
  Clock,
  ArrowUpRight,
  Activity,
  Award,
  X,
  RefreshCw,
  Hash,
  BadgeCheck,
  FileSpreadsheet,
} from 'lucide-react';
import {
  toPersianDigits,
  formatPersianDateTime,
  formatPersianDateOnly,
  formatCurrency,
} from '@/lib/persian';
import { ClientDossierFullview } from '@/components/submissions/client-dossier-fullview';

interface FamilyDossiersViewProps {
  initialFamilyCode?: string;
  onNavigateToClient?: (caseCode: string) => void;
}

export const FamilyDossiersView: React.FC<FamilyDossiersViewProps> = ({
  initialFamilyCode,
  onNavigateToClient,
}) => {
  const {
    getFamilyDossiers,
    getFamilyFormComparison,
    forms,
    submissions,
    refreshSubmissionsFromDb,
  } = useForm();
  const { currentUser } = useAdminAuth();

  const familyDossiers = useMemo(() => getFamilyDossiers(), [getFamilyDossiers]);

  // وضعیت انتخاب پرونده خانوادگی برای نمایش تمام‌صفحه (مانند پرونده مراجعان)
  const [activeFamilyModal, setActiveFamilyModal] = useState<FamilyDossierGroup | null>(null);

  // جستجو و فیلترها
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'comparison' | 'familyForms' | 'individualForms'>('comparison');
  const [selectedFormId, setSelectedFormId] = useState<string>('');
  const [comparisonFilter, setComparisonFilter] = useState<'all' | 'divergent' | 'consensus'>('all');
  const [copiedCode, setCopiedCode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // مشاهده پرونده فردی یک عضو به صورت مودال
  const [viewingMemberCaseCode, setViewingMemberCaseCode] = useState<string | null>(null);

  // فرم‌های خانوادگی موجود در سیستم
  const availableFamilyForms = useMemo(() => {
    return forms.filter((f) => f.formType === 'family' || f.id === 'form-belhagh-family-assessment');
  }, [forms]);

  // تنظیم خودکار اولین فرم خانوادگی موجود
  useEffect(() => {
    if (!selectedFormId && availableFamilyForms.length > 0) {
      setSelectedFormId(availableFamilyForms[0].id);
    }
  }, [availableFamilyForms, selectedFormId]);

  // باز شدن خودکار در صورت ارسال initialFamilyCode
  useEffect(() => {
    if (initialFamilyCode && familyDossiers.length > 0) {
      const match = familyDossiers.find(
        (f) => f.familyCode.toLowerCase() === initialFamilyCode.toLowerCase()
      );
      if (match) {
        setActiveFamilyModal(match);
      }
    }
  }, [initialFamilyCode, familyDossiers]);

  // خانواده‌های فیلترشده در جستجو
  const filteredFamilies = useMemo(() => {
    if (!searchQuery.trim()) return familyDossiers;
    const q = searchQuery.trim().toLowerCase();
    return familyDossiers.filter((fam) => {
      return (
        fam.familyName.toLowerCase().includes(q) ||
        fam.familyCode.toLowerCase().includes(q) ||
        fam.contactMobile.includes(q) ||
        fam.provinceCity.toLowerCase().includes(q) ||
        fam.members.some((m) => m.fullName.toLowerCase().includes(q) || m.caseCode.toLowerCase().includes(q))
      );
    });
  }, [familyDossiers, searchQuery]);

  // خانواده فعال در مودال تمام‌صفحه
  const liveActiveFamily = useMemo(() => {
    if (!activeFamilyModal) return null;
    return familyDossiers.find((f) => f.familyCode === activeFamilyModal.familyCode) || activeFamilyModal;
  }, [familyDossiers, activeFamilyModal]);

  // مقایسه تطبیقی پاسخ‌های خانواده جاری برای فرم انتخابی
  const comparisonData = useMemo(() => {
    if (!liveActiveFamily) {
      return {
        form: undefined,
        members: [],
        questions: [],
        consensusCount: 0,
        divergenceCount: 0,
        agreementRate: 100,
      };
    }
    const targetFormId = selectedFormId || availableFamilyForms[0]?.id;
    if (!targetFormId) {
      return {
        form: undefined,
        members: [],
        questions: [],
        consensusCount: 0,
        divergenceCount: 0,
        agreementRate: 100,
      };
    }
    return getFamilyFormComparison(liveActiveFamily.familyCode, targetFormId);
  }, [liveActiveFamily, selectedFormId, availableFamilyForms, getFamilyFormComparison]);

  // سوالات فیلترشده بر مبنای توافق یا اختلاف
  const filteredQuestions = useMemo(() => {
    if (comparisonFilter === 'all') return comparisonData.questions;
    if (comparisonFilter === 'divergent') return comparisonData.questions.filter((q) => !q.isConsensus);
    return comparisonData.questions.filter((q) => q.isConsensus);
  }, [comparisonData.questions, comparisonFilter]);

  // استخراج پرونده مراجع برای نمایش مودال پرونده فردی
  const selectedMemberCaseGroup = useMemo(() => {
    if (!viewingMemberCaseCode) return null;
    const memberSubs = submissions.filter((s) => {
      const c = (s.data?.caseCode || s.trackingCode || '').replace(/^sub-case-/, '').replace(/^sub-/, '');
      return c.toLowerCase() === viewingMemberCaseCode.toLowerCase();
    });
    if (memberSubs.length === 0) return null;
    const first = memberSubs[0];
    return {
      caseCode: viewingMemberCaseCode,
      fullName: first.data?.fullName || `${first.data?.f_name || ''} ${first.data?.f_family || ''}`.trim() || 'مراجع',
      mobile: first.data?.f_mobile || first.mobile || '',
      provinceCity: first.data?.f_province_city || 'ثبت‌نشده',
      submissions: memberSubs,
      formTitles: Array.from(new Set(memberSubs.map((s) => forms.find((f) => f.id === s.formId)?.title || 'فرم'))),
      totalFormsCount: memberSubs.length,
      latestDate: memberSubs[memberSubs.length - 1].createdAt,
      overallStatus: first.status,
      totalPaidAmount: 0,
      roleInFamily: first.data?.f_role_in_family,
    };
  }, [viewingMemberCaseCode, submissions, forms]);

  const getRoleBadgeStyle = (role: string) => {
    if (role.includes('پدر')) {
      return 'bg-blue-50 text-blue-800 border-blue-200 ring-blue-500/20';
    }
    if (role.includes('مادر')) {
      return 'bg-emerald-50 text-emerald-800 border-emerald-200 ring-emerald-500/20';
    }
    if (role.includes('پسر') || role.includes('فرزند پسر')) {
      return 'bg-amber-50 text-amber-800 border-amber-200 ring-amber-500/20';
    }
    if (role.includes('دختر') || role.includes('فرزند دختر')) {
      return 'bg-purple-50 text-purple-800 border-purple-200 ring-purple-500/20';
    }
    if (role.includes('همسر')) {
      return 'bg-teal-50 text-teal-800 border-teal-200 ring-teal-500/20';
    }
    return 'bg-slate-100 text-slate-800 border-slate-200 ring-slate-400/20';
  };

  const handlePrintComparison = () => {
    if (typeof window === 'undefined') return;
    window.print();
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refreshSubmissionsFromDb('all');
    } finally {
      setIsRefreshing(false);
    }
  };

  const adminName = currentUser?.name || 'مدیر سامانه بالحق';
  const adminRole = currentUser?.role === 'super_admin' ? 'مدیریت ارشد مرکز' : 'کارشناس بالینی';
  const adminInitials = adminName.slice(0, 2);

  return (
    <div className="relative flex-1 flex flex-col h-full overflow-hidden bg-slate-50 overscroll-contain" dir="rtl">
      
      {/* سربرگ استاندارد کارتابل پرونده‌های خانوادگی */}
      <div className="bg-white border-b border-slate-200/90 px-4 sm:px-6 py-3.5 sm:py-4 flex flex-col md:flex-row md:items-center justify-between gap-3.5 shrink-0 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-200/80 shrink-0 shadow-xs">
            <Users className="w-5 h-5 text-purple-700" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-black text-slate-900 tracking-tight">
                کارتابل پرونده‌های خانوادگی
              </h1>
              <span className="text-[11px] px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200/80 font-bold font-mono">
                {toPersianDigits(familyDossiers.length)} خانواده ثبت‌شده
              </span>
            </div>
            <p className="text-slate-400 text-[11px] sm:text-xs mt-0.5 font-medium">
              تجمیع سوابق اعضای خانه، ارزیابی روابط و مقایسه تطبیقی پاسخ‌ها در جلسات مشاوره
            </p>
          </div>
        </div>

        {/* دکمه‌های عملیات بالای سربرگ */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-purple-800 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl shadow-2xs transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            title="به‌روزرسانی و دریافت آخرین اطلاعات از سرور"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-purple-600 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>تازه‌سازی</span>
          </button>
        </div>
      </div>

      {/* نوار جستجو و آمار خلاصه */}
      <div className="bg-white border-b border-slate-200/80 px-4 sm:px-6 py-2.5 sm:py-3 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-2.5 text-xs shrink-0 shadow-2xs">
        <div className="flex items-center gap-3 flex-1 min-w-0 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در نام خانواده، کد خانواده، کد پرونده اعضا، شماره تلفن یا شهر..."
              className="w-full pl-3 pr-9 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 bg-slate-50/70 focus:bg-white transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5 text-slate-500">
          <span className="text-[11px] hidden sm:inline">تعداد نتایج:</span>
          <span className="text-xs font-bold text-purple-900 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 font-mono">
            {toPersianDigits(filteredFamilies.length)} خانواده
          </span>
        </div>
      </div>

      {/* محتوای کارتابل: لیست پرونده‌های خانوادگی (جدول در دسکتاپ و کارتی در موبایل) */}
      <div className="flex-1 overflow-auto p-3 sm:p-6 overscroll-contain">
        
        {/* ۱. نمایش جدولی استاندارد ویژه لپ‌تاپ و دسکتاپ */}
        <div className="hidden md:block bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-right text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-extrabold">
                  <th className="p-3.5 sm:p-4 text-center w-12">#</th>
                  <th className="p-3.5 sm:p-4">کد پرونده خانوادگی</th>
                  <th className="p-3.5 sm:p-4">عنوان خانواده</th>
                  <th className="p-3.5 sm:p-4">اعضای ثبت‌شده در خانواده</th>
                  <th className="p-3.5 sm:p-4">شماره تماس و استان</th>
                  <th className="p-3.5 sm:p-4 text-center">فرم‌های مشترک خانوادگی</th>
                  <th className="p-3.5 sm:p-4 text-center">فرم‌های فردی اعضا</th>
                  <th className="p-3.5 sm:p-4">آخرین فعالیت</th>
                  <th className="p-3.5 sm:p-4 text-center w-36">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFamilies.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-16 text-center text-slate-400 text-sm">
                      پرونده خانوادگی با این مشخصات یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredFamilies.map((fam, index) => {
                    return (
                      <tr
                        key={fam.familyCode}
                        onClick={() => setActiveFamilyModal(fam)}
                        className="hover:bg-purple-50/40 transition-colors cursor-pointer group"
                      >
                        <td className="p-3.5 sm:p-4 text-center text-slate-400 font-mono text-xs">
                          {toPersianDigits(index + 1)}
                        </td>

                        {/* کد پرونده خانوادگی */}
                        <td className="p-3.5 sm:p-4">
                          <span className="font-mono font-extrabold text-purple-900 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200 inline-block text-xs group-hover:border-purple-300">
                            {fam.familyCode}
                          </span>
                        </td>

                        {/* نام و مشخصات خانواده */}
                        <td className="p-3.5 sm:p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-mono font-bold text-[11px] shrink-0 shadow-2xs">
                              <Users className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="font-black text-slate-900 block text-xs group-hover:text-purple-900 transition-colors">
                                {fam.familyName}
                              </span>
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.2 rounded-full border border-emerald-200 inline-block mt-0.5">
                                پرونده فعال
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* اعضای خانواده و نقش‌ها */}
                        <td className="p-3.5 sm:p-4">
                          <div className="flex flex-wrap gap-1.5 max-w-xs">
                            {fam.members.map((m) => (
                              <span
                                key={m.caseCode}
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getRoleBadgeStyle(m.role)}`}
                                title={`${m.fullName} (${m.caseCode})`}
                              >
                                {m.role}: {m.fullName}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* شماره تماس و استان */}
                        <td className="p-3.5 sm:p-4">
                          <span className="font-mono text-xs text-slate-700 block" dir="ltr">
                            {toPersianDigits(fam.contactMobile)}
                          </span>
                          <span className="text-[11px] text-slate-400 block">{fam.provinceCity}</span>
                        </td>

                        {/* تعداد فرم‌های خانوادگی تکمیل‌شده */}
                        <td className="p-3.5 sm:p-4 text-center">
                          <span className="px-3 py-1 rounded-full bg-purple-50 text-purple-800 font-extrabold text-xs border border-purple-200 shadow-2xs inline-flex items-center gap-1.5">
                            <HeartHandshake className="w-3.5 h-3.5 text-purple-600" />
                            <span>{toPersianDigits(fam.familySubmissions.length)} فرم مشترک</span>
                          </span>
                        </td>

                        {/* تعداد فرم‌های فردی پر شده اعضا */}
                        <td className="p-3.5 sm:p-4 text-center">
                          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-700 font-extrabold text-xs border border-slate-200 inline-flex items-center gap-1.5">
                            <FileText className="w-3.5 h-3.5 text-slate-500" />
                            <span>{toPersianDigits(fam.individualSubmissions.length)} فرم فردی</span>
                          </span>
                        </td>

                        {/* آخرین فعالیت */}
                        <td className="p-3.5 sm:p-4 text-xs text-slate-500">
                          {formatPersianDateTime(fam.updatedAt || fam.createdAt)}
                        </td>

                        {/* عملیات: مشاهده پرونده */}
                        <td className="p-3.5 sm:p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setActiveFamilyModal(fam)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                            title="مشاهده پرونده کامل خانوادگی"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>مشاهده پرونده</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ۲. نمایش کارتی مدرن، مجزا و لمسی اختصاصی برای گوشی تلفن همراه */}
        <div className="block md:hidden space-y-3.5 pb-4">
          {filteredFamilies.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs p-12 text-center text-slate-400 text-xs space-y-2">
              <Users className="w-8 h-8 mx-auto text-slate-300" />
              <p className="font-bold text-slate-600">پرونده خانوادگی با این مشخصات یافت نشد.</p>
            </div>
          ) : (
            filteredFamilies.map((fam) => {
              return (
                <div
                  key={fam.familyCode}
                  onClick={() => setActiveFamilyModal(fam)}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-purple-200/80 transition-all duration-200 p-4 space-y-3.5 cursor-pointer"
                >
                  {/* ردیف بالا: آواتار، نام خانواده و کد خانواده */}
                  <div className="flex items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-xs">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="font-black text-slate-900 text-sm block tracking-tight">
                          {fam.familyName}
                        </span>
                        <span className="text-[11px] text-slate-500 font-medium block truncate">
                          {fam.provinceCity}
                        </span>
                      </div>
                    </div>

                    <span className="font-mono font-bold text-[11px] px-2.5 py-1 rounded-lg bg-purple-50 text-purple-900 border border-purple-200 shrink-0">
                      {fam.familyCode}
                    </span>
                  </div>

                  {/* اعضای خانواده */}
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {fam.members.map((m) => (
                      <span
                        key={m.caseCode}
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getRoleBadgeStyle(m.role)}`}
                      >
                        {m.role}: {m.fullName}
                      </span>
                    ))}
                  </div>

                  {/* خلاصه تعداد فرم‌ها و شماره تماس */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50/90 p-3 rounded-2xl border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">فرم‌های مشترک:</span>
                      <span className="font-bold text-purple-800">
                        {toPersianDigits(fam.familySubmissions.length)} فرم
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block mb-0.5">شماره تماس:</span>
                      <span className="font-mono text-slate-700" dir="ltr">
                        {toPersianDigits(fam.contactMobile)}
                      </span>
                    </div>
                  </div>

                  {/* دکمه ورود به پرونده */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveFamilyModal(fam);
                    }}
                    className="w-full py-2.5 bg-purple-700 hover:bg-purple-800 text-white text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Eye className="w-4 h-4" />
                    <span>مشاهده پرونده کامل خانوادگی</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* ============================================================== */}
      {/* نمای تمام‌صفحه اختصاصی پرونده خانوادگی (همانند پرونده مراجعان) */}
      {/* ============================================================== */}
      {liveActiveFamily && (
        <div
          id="printable-family-dossier"
          className="fixed inset-0 z-50 overflow-y-scroll overflow-x-hidden bg-[#f5f7fa] text-slate-800 print:static print:inset-auto print:overflow-visible print:bg-white print:h-auto print:min-h-0 print:z-auto print:block"
          dir="rtl"
        >
          {/* رابط کاربری تعاملی صفحه مانیتور */}
          <div className="flex flex-col min-h-screen min-w-0 print:block">
            
            {/* سربرگ ناوبری سراسری برند بالحق (هدر چسبان) */}
            <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur shadow-2xs print:hidden">
              <div className="mx-auto flex w-full items-center justify-between gap-4 px-4 sm:px-8 lg:px-12 py-3.5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-white border border-slate-200/90 shadow-2xs p-1 flex items-center justify-center shrink-0 overflow-hidden">
                    <img
                      src="/images/belhagh-logo.png"
                      alt="مرکز خدمات روانشناسی بالحق"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <div className="text-sm font-black text-[#173f6b]">مرکز خدمات روانشناسی بالحق</div>
                    <div className="mt-0.5 text-[11px] text-slate-400">سامانه یکپارچه مدیریت پرونده‌های خانوادگی</div>
                  </div>
                </div>

                <div className="hidden w-full max-w-md items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 lg:flex">
                  <Users className="size-4 text-purple-600" />
                  <input
                    type="text"
                    readOnly
                    value={`پرونده فعال خانوادگی: ${liveActiveFamily.familyName} (${liveActiveFamily.familyCode})`}
                    className="w-full bg-transparent text-xs text-slate-600 focus:outline-none cursor-default font-medium"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={handlePrintComparison}
                    className="px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    title="چاپ گزارش تحلیلی خانواده"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">چاپ گزارش</span>
                  </button>

                  <div className="text-left hidden sm:block">
                    <div className="text-xs font-bold text-slate-900">{adminName}</div>
                    <div className="mt-0.5 text-[10px] text-slate-400">{adminRole}</div>
                  </div>
                  <div className="grid size-10 place-items-center rounded-full bg-purple-100 text-sm font-black text-purple-800">
                    {adminInitials}
                  </div>

                  <button
                    onClick={() => setActiveFamilyModal(null)}
                    className="grid size-10 place-items-center rounded-full border border-slate-200 bg-white text-slate-500 hover:bg-slate-100 hover:text-slate-800 transition cursor-pointer"
                    title="بستن پرونده خانوادگی"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              </div>
            </header>

            {/* بوم اصلی محتوای پرونده خانوادگی */}
            <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
              
              {/* ۱. کارت شناسنامه جامع پرونده خانوادگی */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3.5">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center font-black text-xl shadow-md">
                      <Users className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg sm:text-2xl font-black text-slate-900">
                          {liveActiveFamily.familyName}
                        </h2>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                          پرونده فعال خانوادگی
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>استان و شهر: {liveActiveFamily.provinceCity}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>شماره تماس سرپرست: <strong className="font-mono text-slate-800" dir="ltr">{liveActiveFamily.contactMobile}</strong></span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* کد یکتای پرونده خانوادگی و کپی */}
                  <div className="flex flex-wrap items-center gap-2.5">
                    <div className="flex items-center gap-2 px-3.5 py-2 bg-purple-50 rounded-2xl border border-purple-200 text-xs font-mono font-black text-purple-900">
                      <Hash className="w-4 h-4 text-purple-600" />
                      <span>کد پرونده خانوادگی:</span>
                      <span className="font-extrabold">{liveActiveFamily.familyCode}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(liveActiveFamily.familyCode);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2000);
                        }}
                        className="p-1 hover:bg-purple-100 rounded text-purple-600 transition cursor-pointer"
                        title="کپی کد خانواده"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* ۴ شاخص کلیدی وضعیت پرونده خانواده */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 rounded-2xl bg-purple-50/60 border border-purple-100 text-purple-900">
                    <span className="text-[11px] text-purple-600 block mb-1">اعضای ثبت‌شده:</span>
                    <span className="text-base font-black">{toPersianDigits(liveActiveFamily.members.length)} نفر</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 text-blue-900">
                    <span className="text-[11px] text-blue-600 block mb-1">فرم‌های مشترک تکمیل‌شده:</span>
                    <span className="text-base font-black">{toPersianDigits(liveActiveFamily.familySubmissions.length)} فرم</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-indigo-900">
                    <span className="text-[11px] text-indigo-600 block mb-1">فرم‌های فردی اعضا:</span>
                    <span className="text-base font-black">{toPersianDigits(liveActiveFamily.individualSubmissions.length)} فرم</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-emerald-900">
                    <span className="text-[11px] text-emerald-600 block mb-1">نرخ وفاق و توافق کلی:</span>
                    <span className="text-base font-black font-mono">{toPersianDigits(comparisonData.agreementRate)}٪</span>
                  </div>
                </div>

                {/* کارت‌های تک‌تک اعضای خانواده */}
                <div className="pt-2">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                      <Users className="w-4 h-4 text-purple-600" />
                      <span>اعضای ثبت‌شده در این خانواده:</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      روی «مشاهده پرونده فردی» هر عضو کلیک کنید تا پرونده شخصی او باز شود
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {liveActiveFamily.members.map((m) => (
                      <div
                        key={m.caseCode}
                        className="p-4 rounded-2xl border border-slate-200/90 bg-slate-50/60 hover:bg-white hover:border-purple-300 hover:shadow-xs transition-all flex flex-col justify-between gap-3 text-right"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 shadow-2xs">
                              <User className="w-5 h-5 text-slate-500" />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-black text-slate-900">{m.fullName}</div>
                              <div className="text-[11px] text-slate-400 font-mono">کد مراجع: {m.caseCode}</div>
                            </div>
                          </div>
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border ${getRoleBadgeStyle(m.role)}`}>
                            {m.role}
                          </span>
                        </div>

                        <div className="pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-medium">سن: {m.age || 'ثبت‌نشده'}</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (onNavigateToClient) {
                                onNavigateToClient(m.caseCode);
                              } else {
                                setViewingMemberCaseCode(m.caseCode);
                              }
                            }}
                            className="font-bold text-purple-700 hover:text-purple-900 hover:underline flex items-center gap-1 cursor-pointer bg-white px-2.5 py-1 rounded-lg border border-purple-200 shadow-2xs"
                          >
                            <span>مشاهده پرونده فردی</span>
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* ۲. نوار زبانه‌های اصلی پرونده خانوادگی */}
              <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-1 print:hidden">
                <button
                  type="button"
                  onClick={() => setActiveTab('comparison')}
                  className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'comparison'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>مقایسه تطبیقی پاسخ‌های اعضا</span>
                  <span className="text-[11px] px-2 py-0.2 rounded-full bg-white/20 font-mono font-bold">
                    {toPersianDigits(comparisonData.questions.length)} سوال
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('familyForms')}
                  className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'familyForms'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>فرم‌های خانوادگی تکمیل‌شده</span>
                  <span className="text-[11px] px-2 py-0.2 rounded-full bg-slate-100 text-slate-700 font-mono font-bold">
                    {toPersianDigits(liveActiveFamily.familySubmissions.length)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('individualForms')}
                  className={`px-4 sm:px-5 py-2.5 rounded-2xl text-xs sm:text-sm font-black transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'individualForms'
                      ? 'bg-purple-700 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>فرم‌های فردی پر شده اعضا</span>
                  <span className="text-[11px] px-2 py-0.2 rounded-full bg-slate-100 text-slate-700 font-mono font-bold">
                    {toPersianDigits(liveActiveFamily.individualSubmissions.length)}
                  </span>
                </button>
              </div>

              {/* ۳. محتوای زبانه ۱: ماتریس مقایسه تطبیقی سوال‌به‌سوال */}
              {activeTab === 'comparison' && (
                <div className="space-y-4 animate-in fade-in">
                  
                  {/* نوار ابزار بالای جدول مقایسه: انتخاب فرم و شاخص‌های توافق */}
                  <div className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-2xs print:border-none print:shadow-none">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs font-extrabold text-slate-700">فرم انتخابی جهت مقایسه:</span>
                      <select
                        value={selectedFormId}
                        onChange={(e) => setSelectedFormId(e.target.value)}
                        className="px-3.5 py-2 text-xs font-black border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-purple-600/20"
                      >
                        {availableFamilyForms.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* شاخص‌های آماری همگرایی / اختلاف نظر */}
                    <div className="flex items-center gap-2 text-xs flex-wrap">
                      <span className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>هم‌نظری کامل: {toPersianDigits(comparisonData.consensusCount)} سوال</span>
                      </span>

                      <span className="px-3 py-1.5 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-extrabold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>اختلاف دیدگاه: {toPersianDigits(comparisonData.divergenceCount)} سوال</span>
                      </span>

                      <span className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-900 border border-purple-200 font-black font-mono">
                        نرخ توافق: {toPersianDigits(comparisonData.agreementRate)}٪
                      </span>
                    </div>

                    {/* فیلتر نمایش */}
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl print:hidden">
                      <button
                        type="button"
                        onClick={() => setComparisonFilter('all')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          comparisonFilter === 'all'
                            ? 'bg-white text-slate-900 shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        همه سوالات
                      </button>
                      <button
                        type="button"
                        onClick={() => setComparisonFilter('divergent')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          comparisonFilter === 'divergent'
                            ? 'bg-amber-500 text-white shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        فقط اختلاف‌نظرها ⚠️
                      </button>
                      <button
                        type="button"
                        onClick={() => setComparisonFilter('consensus')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          comparisonFilter === 'consensus'
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : 'text-slate-500 hover:text-slate-800'
                        }`}
                      >
                        فقط توافق‌ها ✓
                      </button>
                    </div>
                  </div>

                  {/* ماتریس مقایسه‌ای سوال به سوال */}
                  {filteredQuestions.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center text-xs text-slate-400 space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto" />
                      <p className="font-bold text-slate-600">موردی با این فیلتر یافت نشد.</p>
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {filteredQuestions.map((q, qIndex) => {
                        const isDivergent = !q.isConsensus;
                        return (
                          <div
                            key={q.fieldId}
                            className={`bg-white rounded-3xl border transition-all p-4 sm:p-5 shadow-2xs space-y-3.5 ${
                              isDivergent
                                ? 'border-amber-300/80 bg-amber-50/10'
                                : 'border-slate-200/90'
                            }`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2.5">
                              <div className="flex items-start gap-2.5">
                                <span className="w-7 h-7 rounded-xl bg-slate-100 text-slate-600 text-xs font-black flex items-center justify-center shrink-0 font-mono">
                                  {toPersianDigits(qIndex + 1)}
                                </span>
                                <div>
                                  <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-relaxed">
                                    {q.questionLabel}
                                  </h4>
                                  {q.stepTitle && (
                                    <span className="text-[11px] text-slate-400 font-medium">
                                      مرحله: {q.stepTitle}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* نشان وضعیت توافق */}
                              <div>
                                {isDivergent ? (
                                  <span className="text-[11px] font-black px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1.5">
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                                    <span>اختلاف دیدگاه</span>
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-black px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>هم‌نظری کامل</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* پاسخ‌های اعضای خانواده در کنار هم */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-2">
                              {liveActiveFamily.members.map((member) => {
                                const ansObj = q.memberAnswers[member.caseCode] || Object.values(q.memberAnswers).find(
                                  (a) => a.role === member.role || a.memberName === member.fullName
                                );
                                const hasAnswered = ansObj && ansObj.displayValue !== 'ثبت‌نشده';

                                return (
                                  <div
                                    key={member.caseCode}
                                    className={`p-3.5 rounded-2xl border text-right space-y-1.5 transition-all ${
                                      hasAnswered
                                        ? 'bg-slate-50/80 border-slate-200'
                                        : 'bg-slate-100/40 border-dashed border-slate-200 opacity-60'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="font-black text-slate-800">{member.fullName}</span>
                                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${getRoleBadgeStyle(member.role)}`}>
                                        {member.role}
                                      </span>
                                    </div>

                                    <div className="text-xs sm:text-sm font-black text-slate-900 pt-1">
                                      {hasAnswered ? ansObj.displayValue : 'پاسخی ثبت نکرده است'}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              )}

              {/* ۴. محتوای زبانه ۲: فرم‌های خانوادگی تکمیل‌شده */}
              {activeTab === 'familyForms' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>فرم‌های خانوادگی تکمیل‌شده توسط اعضای خانواده ({toPersianDigits(liveActiveFamily.familySubmissions.length)} فرم)</span>
                    <span className="text-[11px] text-slate-400">تمام فرم‌های مشترک ثبت‌شده در پایگاه داده</span>
                  </div>

                  <div className="space-y-3">
                    {liveActiveFamily.familySubmissions.map((sub) => {
                      const formObj = forms.find((f) => f.id === sub.formId);
                      const title = formObj?.title || 'فرم خانوادگی';
                      const role = sub.familyRole || sub.data?.f_role_in_family || 'عضو خانواده';
                      const name = sub.data?.fullName || 'عضو خانواده';

                      return (
                        <div
                          key={sub.id}
                          className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold">
                              <Users className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-black text-slate-900">{title}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                                <span>تکمیل‌شده توسط: <strong>{name}</strong></span>
                                <span>•</span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${getRoleBadgeStyle(role)}`}>
                                  نقش: {role}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-slate-400 font-mono">
                              {formatPersianDateTime(sub.createdAt)}
                            </span>
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>ثبت قطعی</span>
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* ۵. محتوای زبانه ۳: فرم‌های فردی هر یک از اعضا */}
              {activeTab === 'individualForms' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 text-xs font-bold text-slate-700 flex items-center justify-between">
                    <span>فرم‌هایی که هر عضو مستقلاً برای خودش پر کرده است ({toPersianDigits(liveActiveFamily.individualSubmissions.length)} فرم)</span>
                    <span className="text-[11px] text-slate-400">سوابق پذیرش، ثبت‌نام، نوبت‌ها و پرسشنامه‌های بالینی فردی</span>
                  </div>

                  <div className="space-y-3">
                    {liveActiveFamily.individualSubmissions.map((sub) => {
                      const formObj = forms.find((f) => f.id === sub.formId);
                      const title = formObj?.title || 'فرم ثبت‌شده مراجع';
                      const name = sub.data?.fullName || `${sub.data?.f_name || ''} ${sub.data?.f_family || ''}`.trim() || 'مراجع';
                      const role = sub.data?.f_role_in_family || 'عضو';
                      const cCode = (sub.data?.caseCode || sub.trackingCode || '').replace(/^sub-case-/, '').replace(/^sub-/, '');

                      return (
                        <div
                          key={sub.id}
                          className="bg-white rounded-3xl border border-slate-200/90 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-black text-slate-900">{title}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                                <span>مراجع: <strong>{name}</strong></span>
                                <span>•</span>
                                <span className="font-mono text-slate-400">({cCode})</span>
                                <span>•</span>
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${getRoleBadgeStyle(role)}`}>
                                  نقش: {role}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-slate-400 font-mono">
                              {formatPersianDateTime(sub.createdAt)}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                if (onNavigateToClient) {
                                  onNavigateToClient(cCode);
                                } else {
                                  setViewingMemberCaseCode(cCode);
                                }
                              }}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition flex items-center gap-1 cursor-pointer"
                            >
                              <span>مشاهده پرونده مراجع</span>
                              <ArrowLeft className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </main>
          </div>
        </div>
      )}

      {/* مودال مشاهده پرونده فردی مراجع در صورت کلیک روی عضو */}
      {selectedMemberCaseGroup && (
        <ClientDossierFullview
          clientCase={selectedMemberCaseGroup as any}
          onClose={() => setViewingMemberCaseCode(null)}
        />
      )}

    </div>
  );
};
