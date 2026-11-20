'use client';

import React, { useState, useMemo } from 'react';
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
  } = useForm();
  const { currentUser } = useAdminAuth();

  const familyDossiers = useMemo(() => getFamilyDossiers(), [getFamilyDossiers]);

  const [selectedFamilyCode, setSelectedFamilyCode] = useState<string>(
    initialFamilyCode || familyDossiers[0]?.familyCode || ''
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'comparison' | 'familyForms' | 'individualForms'>('comparison');
  const [selectedFormId, setSelectedFormId] = useState<string>('form-belhagh-family-assessment');
  const [comparisonFilter, setComparisonFilter] = useState<'all' | 'divergent' | 'consensus'>('all');
  const [copiedCode, setCopiedCode] = useState(false);

  // مشاهده پرونده فردی یک عضو به صورت مودال
  const [viewingMemberCaseCode, setViewingMemberCaseCode] = useState<string | null>(null);

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

  // خانواده فعال
  const activeFamily = useMemo(() => {
    return familyDossiers.find((f) => f.familyCode === selectedFamilyCode) || familyDossiers[0];
  }, [familyDossiers, selectedFamilyCode]);

  // فرم‌های خانوادگی موجود در سیستم
  const availableFamilyForms = useMemo(() => {
    return forms.filter((f) => f.formType === 'family' || f.id === 'form-belhagh-family-assessment');
  }, [forms]);

  // مقایسه تطبیقی پاسخ‌های خانواده جاری برای فرم انتخابی
  const comparisonData = useMemo(() => {
    if (!activeFamily) {
      return {
        form: undefined,
        members: [],
        questions: [],
        consensusCount: 0,
        divergenceCount: 0,
        agreementRate: 100,
      };
    }
    const targetFormId = selectedFormId || availableFamilyForms[0]?.id || 'form-belhagh-family-assessment';
    return getFamilyFormComparison(activeFamily.familyCode, targetFormId);
  }, [activeFamily, selectedFormId, availableFamilyForms, getFamilyFormComparison]);

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

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50" dir="rtl">
      
      {/* سربرگ تب پرونده‌های خانوادگی */}
      <div className="bg-white border-b border-slate-200/90 px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-3 shrink-0 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-sm">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <span>کارتابل پرونده‌های خانوادگی</span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-200 font-bold">
                {toPersianDigits(familyDossiers.length)} خانواده
              </span>
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              تجمیع سوابق اعضای خانه، ارزیابی روابط و مقایسه تطبیقی پاسخ‌ها در جلسات مشاوره
            </p>
          </div>
        </div>

        {/* جستجوی سریع */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی خانواده، نام عضو، کد پرونده..."
            className="w-full pl-3 pr-9 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all"
          />
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* بوم اصلی: ستون کناری لیست خانواده‌ها + بوم جزئیات پرونده منتخب */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* ستون کناری: کارت‌های خانواده‌ها */}
        <div className="w-full md:w-80 lg:w-96 bg-white border-l border-slate-200/90 flex flex-col shrink-0 overflow-hidden shadow-2xs">
          <div className="p-3 bg-slate-50/70 border-b border-slate-200 text-xs font-bold text-slate-600 flex items-center justify-between">
            <span>لیست پرونده‌های خانوادگی</span>
            <span className="text-[11px] text-slate-400 font-mono">
              {toPersianDigits(filteredFamilies.length)} مورد
            </span>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
            {filteredFamilies.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                <Users className="w-8 h-8 text-slate-300 mx-auto" />
                <p>پرونده خانوادگی یافت نشد.</p>
              </div>
            ) : (
              filteredFamilies.map((fam) => {
                const isSelected = activeFamily?.familyCode === fam.familyCode;
                return (
                  <button
                    key={fam.familyCode}
                    type="button"
                    onClick={() => setSelectedFamilyCode(fam.familyCode)}
                    className={`w-full p-3.5 rounded-2xl border text-right transition-all cursor-pointer flex flex-col gap-2 ${
                      isSelected
                        ? 'border-purple-600 bg-purple-50/60 shadow-xs ring-1 ring-purple-600/30'
                        : 'border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs sm:text-sm font-black text-slate-900 truncate">
                        {fam.familyName}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-white border border-purple-200 text-purple-800">
                        {fam.familyCode}
                      </span>
                    </div>

                    {/* مشخصات اعضا و نقش‌ها */}
                    <div className="flex flex-wrap gap-1">
                      {fam.members.map((m) => (
                        <span
                          key={m.caseCode}
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${getRoleBadgeStyle(m.role)}`}
                        >
                          {m.role}: {m.fullName}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                      <span>{fam.provinceCity}</span>
                      <span className="flex items-center gap-1 font-bold text-slate-600">
                        <span>{toPersianDigits(fam.familySubmissions.length)} فرم خانوادگی</span>
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* بوم اصلی نمایش پرونده خانواده فعال */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {!activeFamily ? (
            <div className="h-full flex items-center justify-center p-12 text-center text-slate-400">
              <div>
                <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-bold">لطفاً یک خانواده را از لیست انتخاب فرمایید.</p>
              </div>
            </div>
          ) : (
            <>
              {/* سربرگ مشخصات کلی پرونده خانوادگی */}
              <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-100 to-indigo-100 text-purple-800 flex items-center justify-center font-black text-lg border border-purple-200">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                        <span>{activeFamily.familyName}</span>
                        <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-bold">
                          پرونده فعال
                        </span>
                      </h2>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span>{activeFamily.provinceCity}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span dir="ltr">{activeFamily.contactMobile}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* کد پرونده خانوادگی و دکمه‌های اقدام */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 rounded-xl border border-purple-200 text-xs font-mono font-black text-purple-900">
                      <span>کد خانواده:</span>
                      <span>{activeFamily.familyCode}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(activeFamily.familyCode);
                          setCopiedCode(true);
                          setTimeout(() => setCopiedCode(false), 2000);
                        }}
                        className="p-1 hover:bg-purple-100 rounded text-purple-600 transition"
                        title="کپی کد خانواده"
                      >
                        {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={handlePrintComparison}
                      className="p-2 sm:px-3 sm:py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                      title="چاپ گزارش تحلیلی خانواده"
                    >
                      <Printer className="w-4 h-4" />
                      <span className="hidden sm:inline">چاپ گزارش مقایسه‌ای</span>
                    </button>
                  </div>
                </div>

                {/* کارت‌های تک‌تک اعضای خانواده */}
                <div>
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-xs font-extrabold text-slate-700">اعضای ثبت‌شده در این خانواده:</span>
                    <span className="text-[11px] text-slate-400">
                      روی هر عضو کلیک کنید تا پرونده فردی او باز شود
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {activeFamily.members.map((m) => (
                      <div
                        key={m.caseCode}
                        className="p-3.5 rounded-2xl border border-slate-200/90 bg-slate-50/50 hover:bg-white hover:border-purple-300 hover:shadow-xs transition-all flex flex-col justify-between gap-3 text-right"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700 shadow-2xs">
                              <User className="w-4 h-4 text-slate-500" />
                            </div>
                            <div>
                              <div className="text-xs font-black text-slate-900">{m.fullName}</div>
                              <div className="text-[10px] text-slate-400 font-mono">کد: {m.caseCode}</div>
                            </div>
                          </div>
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${getRoleBadgeStyle(m.role)}`}>
                            {m.role}
                          </span>
                        </div>

                        <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                          <span className="text-slate-500">سن: {m.age || 'ثبت‌نشده'}</span>
                          <button
                            type="button"
                            onClick={() => {
                              if (onNavigateToClient) {
                                onNavigateToClient(m.caseCode);
                              } else {
                                setViewingMemberCaseCode(m.caseCode);
                              }
                            }}
                            className="font-bold text-purple-700 hover:text-purple-900 hover:underline flex items-center gap-0.5 cursor-pointer"
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

              {/* نوار زبانه‌ها (Tabs) پرونده خانوادگی */}
              <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('comparison')}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'comparison'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <HeartHandshake className="w-4 h-4" />
                  <span>مقایسه تطبیقی پاسخ‌های اعضا</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20 font-mono">
                    {toPersianDigits(comparisonData.questions.length)} سوال
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('familyForms')}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'familyForms'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  <span>فرم‌های خانوادگی تکمیل‌شده</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-mono">
                    {toPersianDigits(activeFamily.familySubmissions.length)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('individualForms')}
                  className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'individualForms'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>فرم‌های فردی پر شده اعضا</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-mono">
                    {toPersianDigits(activeFamily.individualSubmissions.length)}
                  </span>
                </button>
              </div>

              {/* تب اول: مقایسه تطبیقی هوشمند پاسخ‌های اعضای خانواده */}
              {activeTab === 'comparison' && (
                <div className="space-y-4 animate-in fade-in">
                  
                  {/* نوار ابزار بالای جدول مقایسه: انتخاب فرم و شاخص‌های توافق */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="text-xs font-bold text-slate-700">فرم انتخابی جهت مقایسه:</span>
                      <select
                        value={selectedFormId}
                        onChange={(e) => setSelectedFormId(e.target.value)}
                        className="px-3 py-1.5 text-xs font-extrabold border border-slate-300 rounded-xl bg-slate-50 focus:outline-none focus:ring-1 focus:ring-purple-600"
                      >
                        {availableFamilyForms.map((f) => (
                          <option key={f.id} value={f.id}>
                            {f.title}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* شاخص‌های آماری همگرایی / اختلاف نظر */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 font-extrabold flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>هم‌نظری کامل: {toPersianDigits(comparisonData.consensusCount)} سوال</span>
                      </span>

                      <span className="px-3 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 font-extrabold flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
                        <span>اختلاف دیدگاه: {toPersianDigits(comparisonData.divergenceCount)} سوال</span>
                      </span>

                      <span className="px-3 py-1 rounded-xl bg-purple-50 text-purple-900 border border-purple-200 font-black font-mono">
                        نرخ توافق: {toPersianDigits(comparisonData.agreementRate)}٪
                      </span>
                    </div>

                    {/* فیلتر نمایش */}
                    <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
                      <button
                        type="button"
                        onClick={() => setComparisonFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-xs text-slate-400">
                      موردی با این فیلتر یافت نشد.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredQuestions.map((q, qIndex) => {
                        const isDivergent = !q.isConsensus;
                        return (
                          <div
                            key={q.fieldId}
                            className={`bg-white rounded-2xl border transition-all p-4 sm:p-5 shadow-2xs space-y-3 ${
                              isDivergent
                                ? 'border-amber-300/80 bg-amber-50/10'
                                : 'border-slate-200/90'
                            }`}
                          >
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="flex items-start gap-2.5">
                                <span className="w-6 h-6 rounded-lg bg-slate-100 text-slate-600 text-xs font-bold flex items-center justify-center shrink-0 font-mono">
                                  {toPersianDigits(qIndex + 1)}
                                </span>
                                <div>
                                  <h4 className="text-xs sm:text-sm font-black text-slate-900 leading-relaxed">
                                    {q.questionLabel}
                                  </h4>
                                  {q.stepTitle && (
                                    <span className="text-[10px] text-slate-400 font-medium">
                                      مرحله: {q.stepTitle}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* نشان وضعیت توافق */}
                              <div>
                                {isDivergent ? (
                                  <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                                    <AlertCircle className="w-3.5 h-3.5 text-amber-700" />
                                    <span>اختلاف دیدگاه</span>
                                  </span>
                                ) : (
                                  <span className="text-[11px] font-black px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                    <span>هم‌نظری کامل</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* پاسخ‌های اعضای خانواده در کنار هم */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2">
                              {activeFamily.members.map((member) => {
                                const ansObj = q.memberAnswers[member.caseCode] || Object.values(q.memberAnswers).find(
                                  (a) => a.role === member.role || a.memberName === member.fullName
                                );
                                const hasAnswered = ansObj && ansObj.displayValue !== 'ثبت‌نشده';

                                return (
                                  <div
                                    key={member.caseCode}
                                    className={`p-3 rounded-xl border text-right space-y-1 transition-all ${
                                      hasAnswered
                                        ? 'bg-slate-50/80 border-slate-200'
                                        : 'bg-slate-100/40 border-dashed border-slate-200 opacity-60'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between text-[11px]">
                                      <span className="font-bold text-slate-700">{member.fullName}</span>
                                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${getRoleBadgeStyle(member.role)}`}>
                                        {member.role}
                                      </span>
                                    </div>

                                    <div className="text-xs font-extrabold text-slate-900 pt-1">
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

              {/* تب دوم: لیست فرم‌های خانوادگی پر شده */}
              {activeTab === 'familyForms' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 text-xs font-bold text-slate-700">
                    فرم‌های خانوادگی تکمیل‌شده توسط اعضای خانواده ({toPersianDigits(activeFamily.familySubmissions.length)} فرم)
                  </div>

                  <div className="space-y-3">
                    {activeFamily.familySubmissions.map((sub) => {
                      const formObj = forms.find((f) => f.id === sub.formId);
                      const title = formObj?.title || 'فرم خانوادگی';
                      const role = sub.familyRole || sub.data?.f_role_in_family || 'عضو خانواده';
                      const name = sub.data?.fullName || 'عضو خانواده';

                      return (
                        <div
                          key={sub.id}
                          className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center font-bold">
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

              {/* تب سوم: فرم‌های فردی هر یک از اعضا */}
              {activeTab === 'individualForms' && (
                <div className="space-y-4 animate-in fade-in">
                  <div className="bg-white rounded-2xl border border-slate-200 p-4 text-xs font-bold text-slate-700">
                    فرم‌هایی که هر عضو مستقلاً برای خودش پر کرده است (ثبت‌نام، نوبت‌ها و آزمون‌ها)
                  </div>

                  <div className="space-y-3">
                    {activeFamily.individualSubmissions.map((sub) => {
                      const formObj = forms.find((f) => f.id === sub.formId);
                      const title = formObj?.title || 'فرم ثبت‌شده مراجع';
                      const name = sub.data?.fullName || `${sub.data?.f_name || ''} ${sub.data?.f_family || ''}`.trim() || 'مراجع';
                      const role = sub.data?.f_role_in_family || 'عضو';

                      return (
                        <div
                          key={sub.id}
                          className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 shadow-2xs"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 flex items-center justify-center font-bold">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div>
                              <div className="text-xs sm:text-sm font-black text-slate-900">{title}</div>
                              <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                                <span>مراجع: <strong>{name}</strong></span>
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
                                const cCode = sub.data?.caseCode || sub.trackingCode;
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

            </>
          )}
        </div>
      </div>

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
