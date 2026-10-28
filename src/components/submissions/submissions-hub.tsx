'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useForm } from '@/context/form-context';
import { FormSubmission, SubmissionStatus, Form } from '@/types/form';
import { ClientDossierFullview } from './client-dossier-fullview';
import { exportClientCasesToXLSX, exportSubmissionsListToXLSX, exportFormSubmissionsToXLSX } from '@/lib/excel-export';
import { 
  Inbox, 
  Search, 
  Filter, 
  Download, 
  FileSpreadsheet,
  Printer, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  AlertCircle, 
  MessageSquare, 
  ChevronDown, 
  User, 
  Columns, 
  CreditCard, 
  Eye, 
  Send,
  Kanban,
  Table as TableIcon,
  FolderOpen,
  Calendar,
  Phone,
  MapPin,
  FileText,
  BadgeCheck,
  Sparkles,
  Layers,
  ArrowUpRight,
  X
} from 'lucide-react';
import { formatPersianDateTime, formatCurrency, toPersianDigits, getFieldDisplayValue } from '@/lib/persian';

interface ClientCaseGroup {
  caseCode: string;
  fullName: string;
  mobile: string;
  provinceCity: string;
  submissions: FormSubmission[];
  formTitles: string[];
  totalFormsCount: number;
  latestDate: string;
  overallStatus: SubmissionStatus;
  totalPaidAmount: number;
  roleInFamily?: string;
}

export const SubmissionsHub: React.FC = () => {
  const { forms, activeForm, submissions, updateSubmissionStatus, addSubmissionComment, refreshSubmissionsFromDb } = useForm();
  // همگام‌سازی کاملاً خودکار و زنده با پایگاه‌داده سرور
  useEffect(() => {
    // ۱. دریافت بلافاصله در بدو ورود به کارتابل
    refreshSubmissionsFromDb('all');

    // ۲. به‌روزرسانی خودکار در پس‌زمینه هر ۱۵ ثانیه بدون نیاز به هیچ کلیک
    const interval = setInterval(() => {
      refreshSubmissionsFromDb('all');
    }, 15000);

    // ۳. دریافت آخرین اطلاعات به محض بازگشت کاربر به تب مرورگر
    const handleFocus = () => {
      refreshSubmissionsFromDb('all');
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [refreshSubmissionsFromDb]);
  
  // دو زبانه اصلی: کارتابل پرونده‌های مراجعین (پیش‌فرض) و بانک ارسالی‌های تفکیکی فرم‌ها
  const [hubTab, setHubTab] = useState<'cases' | 'submissions'>('cases');
  const [selectedFormId, setSelectedFormId] = useState<string>(activeForm?.id || forms[0]?.id || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeCaseModal, setActiveCaseModal] = useState<ClientCaseGroup | null>(null);
  const [activeSubmissionModal, setActiveSubmissionModal] = useState<FormSubmission | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  const statusConfigs: Record<SubmissionStatus, { label: string; color: string; bg: string; border: string }> = {
    new: { label: 'جدید', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    reviewing: { label: 'در حال بررسی', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
    approved: { label: 'تأیید شده / فعال', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    rejected: { label: 'رد شده', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
    archived: { label: 'بایگانی', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-200' },
  };

  // گروه‌بندی هوشمند پاسخ‌ها به پرونده‌های مراجعین
  const clientCases: ClientCaseGroup[] = useMemo(() => {
    const caseMap = new Map<string, ClientCaseGroup>();

    submissions.forEach((sub) => {
      // استخراج کد پرونده، شماره همراه، یا نام
      const caseCode = sub.data.caseCode || sub.trackingCode || `CASE-${sub.id.slice(-6)}`;
      
      const candidateName =
        sub.data.fullName ||
        (sub.data.f_name || sub.data.f_family ? `${sub.data.f_name || ''} ${sub.data.f_family || ''}`.trim() : '') ||
        sub.data.f_fullname ||
        sub.data.f_applicant_name ||
        sub.data.q_fullname ||
        sub.data.f_buyer_name ||
        '';

      const fullName = candidateName || 'مراجع مرکز بالحق';
      const mobile = sub.data.f_mobile || sub.data.bk_mobile || sub.data.mobile || (sub as any).mobile || '۰۹۱۲۰۰۰۰۰۰۰';
      const provinceCity = sub.data.f_province_city || 'ثبت‌نشده';
      const roleInFamily = sub.data.f_role_in_family;

      const formObj = forms.find((f) => f.id === sub.formId);
      const formTitle = formObj ? formObj.title : 'فرم ثبت‌شده';

      if (!caseMap.has(caseCode)) {
        caseMap.set(caseCode, {
          caseCode,
          fullName,
          mobile,
          provinceCity,
          submissions: [sub],
          formTitles: [formTitle],
          totalFormsCount: 1,
          latestDate: sub.createdAt,
          overallStatus: sub.status,
          totalPaidAmount: sub.paymentStatus === 'paid' ? (sub.paymentAmount || 0) : 0,
          roleInFamily,
        });
      } else {
        const existing = caseMap.get(caseCode)!;
        existing.submissions.push(sub);
        if (!existing.formTitles.includes(formTitle)) {
          existing.formTitles.push(formTitle);
        }
        existing.totalFormsCount = existing.submissions.length;
        if (new Date(sub.createdAt) > new Date(existing.latestDate)) {
          existing.latestDate = sub.createdAt;
        }
        if (sub.paymentStatus === 'paid') {
          existing.totalPaidAmount += (sub.paymentAmount || 0);
        }
        if (candidateName && (existing.fullName === 'مراجع مرکز بالحق' || !existing.fullName)) {
          existing.fullName = candidateName;
        }
      }
    });

    return Array.from(caseMap.values()).sort(
      (a, b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime()
    );
  }, [submissions, forms]);

  // فیلتر پرونده‌های مراجعین
  const filteredCases = useMemo(() => {
    return clientCases.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        c.caseCode.toLowerCase().includes(q) ||
        c.fullName.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        c.provinceCity.toLowerCase().includes(q) ||
        c.submissions.some((s) => {
          const sName = `${s.data?.f_name || ''} ${s.data?.f_family || ''}`.trim().toLowerCase();
          return sName.includes(q) || (s.data?.fullName && String(s.data.fullName).toLowerCase().includes(q));
        });

      const matchesStatus = statusFilter === 'all' || c.overallStatus === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [clientCases, searchQuery, statusFilter]);

  // فیلتر ارسالی‌های تکی فرم‌ها
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      const matchesForm = selectedFormId === 'all' || s.formId === selectedFormId;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        s.trackingCode.toLowerCase().includes(q) ||
        JSON.stringify(s.data).toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

      return matchesForm && matchesSearch && matchesStatus;
    });
  }, [submissions, selectedFormId, searchQuery, statusFilter]);

  const [isExporting, setIsExporting] = useState(false);

  const handleExportExcel = async () => {
    try {
      setIsExporting(true);
      if (hubTab === 'cases') {
        if (filteredCases.length === 0) {
          alert('پرونده‌ای برای خروجی اکسل وجود ندارد.');
          return;
        }
        await exportClientCasesToXLSX(filteredCases);
      } else {
        if (filteredSubmissions.length === 0) {
          alert('پاسخی برای خروجی اکسل وجود ندارد.');
          return;
        }
        if (selectedFormId !== 'all') {
          const selectedForm = forms.find((f) => f.id === selectedFormId);
          if (selectedForm) {
            await exportFormSubmissionsToXLSX(selectedForm, filteredSubmissions);
            return;
          }
        }
        await exportSubmissionsListToXLSX(filteredSubmissions, forms);
      }
    } catch (err) {
      console.error('Export Excel error:', err);
      alert('خطا در ایجاد فایل اکسل.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddComment = () => {
    if (!activeSubmissionModal || !newCommentText.trim()) return;
    addSubmissionComment(activeSubmissionModal.id, 'مدیر سیستم', 'سرپرست پذیرش بالحق', newCommentText.trim());
    setNewCommentText('');
    const updated = submissions.find((s) => s.id === activeSubmissionModal.id);
    if (updated) setActiveSubmissionModal(updated);
  };

  return (
    <div className="relative flex-1 flex flex-col h-full overflow-hidden bg-slate-50 overscroll-contain">
      
      {/* سربرگ مدرن کارتابل و نوار سوییچ زبانه */}
      <div className="bg-white border-b border-slate-200/90 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xs">
        
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center border border-sky-200/80 shrink-0 shadow-xs">
            <FolderOpen className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                کارتابل مراجعین و بانک ارسالی‌ها
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-800 border border-sky-200/60">
                {toPersianDigits(clientCases.length)} پرونده فعال
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              مدیریت یکپارچه پرونده‌های روانشناسی، نوبت‌ها و استعلام تعداد فرم‌های تکمیل‌شده
            </p>
          </div>
        </div>

        {/* سوییچر بین پرونده‌های مراجعین و کل پاسخ‌های فرم‌ها */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-100/80 text-xs">
            <button
              onClick={() => setHubTab('cases')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                hubTab === 'cases'
                  ? 'bg-white text-sky-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4 text-sky-600" />
              <span>کارتابل پرونده‌های مراجعین ({toPersianDigits(clientCases.length)})</span>
            </button>
            <button
              onClick={() => setHubTab('submissions')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                hubTab === 'submissions'
                  ? 'bg-white text-sky-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Inbox className="w-4 h-4 text-slate-500" />
              <span>کل پاسخ‌های دریافتی ({toPersianDigits(submissions.length)})</span>
            </button>
          </div>


          <button
            onClick={handleExportExcel}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300/80 rounded-xl shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            title="خروجی فایل اکسل XLSX با فونت B Lotus" 
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>{isExporting ? 'در حال صدور...' : 'خروجی اکسل (XLSX)'}</span>
          </button>
        </div>

      </div>

      {/* نوار جستجو، فیلترها و انتخاب فرم */}
      <div className="bg-white border-b border-slate-200/80 px-6 py-3 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0 shadow-2xs">
        <div className="flex items-center gap-3 flex-1 min-w-[260px] max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در کد پرونده، نام مراجع، شماره تلفن یا شهر..."
              className="w-full pl-3 pr-9 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 bg-slate-50/70 focus:bg-white transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {hubTab === 'submissions' && (
            <select
              value={selectedFormId}
              onChange={(e) => setSelectedFormId(e.target.value)}
              className="text-xs font-bold text-slate-800 border border-slate-300 rounded-xl px-3 py-2 bg-white max-w-xs focus:ring-2 focus:ring-sky-500/20"
            >
              <option value="all">تمام فرم‌ها ({toPersianDigits(submissions.length)} پاسخ)</option>
              {forms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title}
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 text-xs">وضعیت:</span>
            {[
              { id: 'all', label: 'همه' },
              { id: 'new', label: 'جدید' },
              { id: 'reviewing', label: 'در حال بررسی' },
              { id: 'approved', label: 'تأیید شده' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  statusFilter === st.id
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* محتوای کارتابل: ۱. کارتابل پرونده‌های مراجعین بالحق */}
      {hubTab === 'cases' && (
        <div className="flex-1 overflow-auto p-4 sm:p-6 overscroll-contain">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            <table className="w-full text-right text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-extrabold">
                  <th className="p-3.5 sm:p-4 text-center w-12">#</th>
                  <th className="p-3.5 sm:p-4">کد پرونده مراجع</th>
                  <th className="p-3.5 sm:p-4">مشخصات مراجع</th>
                  <th className="p-3.5 sm:p-4">شماره تماس و استان</th>
                  <th className="p-3.5 sm:p-4 text-center">تعداد فرم‌ها و پرسشنامه‌ها</th>
                  <th className="p-3.5 sm:p-4">وضعیت پرونده</th>
                  <th className="p-3.5 sm:p-4">وضعیت مالی</th>
                  <th className="p-3.5 sm:p-4">آخرین فعالیت</th>
                  <th className="p-3.5 sm:p-4 text-center w-28">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCases.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-16 text-center text-slate-400 text-sm">
                      پرونده‌ای با این مشخصات یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredCases.map((c, index) => {
                    const st = statusConfigs[c.overallStatus] || statusConfigs.new;

                    return (
                      <tr key={c.caseCode} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 sm:p-4 text-center text-slate-400 font-mono text-xs">
                          {toPersianDigits(index + 1)}
                        </td>

                        {/* کد پرونده */}
                        <td className="p-3.5 sm:p-4">
                          <span className="font-mono font-extrabold text-sky-800 bg-sky-50 px-2.5 py-1 rounded-lg border border-sky-200/80 inline-block text-xs">
                            {c.caseCode}
                          </span>
                        </td>

                        {/* نام مراجع و آواتار */}
                        <td className="p-3.5 sm:p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-sky-500 to-blue-600 text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                              {c.fullName.slice(0, 1)}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block">{c.fullName}</span>
                              {c.roleInFamily && (
                                <span className="text-[11px] text-slate-400 block -mt-0.5">
                                  نقش: {c.roleInFamily} خانواده
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* شماره تماس و استان */}
                        <td className="p-3.5 sm:p-4">
                          <span className="font-mono text-xs text-slate-700 block">{toPersianDigits(c.mobile)}</span>
                          <span className="text-[11px] text-slate-400 block">{c.provinceCity}</span>
                        </td>

                        {/* تعداد فرم‌ها و پرسشنامه‌های تکمیل‌شده */}
                        <td className="p-3.5 sm:p-4 text-center">
                          <div className="inline-flex flex-col items-center">
                            <span className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 font-extrabold text-xs border border-indigo-200 shadow-2xs flex items-center gap-1.5">
                              <BadgeCheck className="w-3.5 h-3.5 text-indigo-600" />
                              <span>{toPersianDigits(c.totalFormsCount)} فرم تکمیل‌شده</span>
                            </span>
                            <span className="text-[10px] text-slate-400 mt-1 max-w-[160px] truncate" title={c.formTitles.join(' + ')}>
                              {c.formTitles.join(' + ')}
                            </span>
                          </div>
                        </td>

                        {/* وضعیت پرونده */}
                        <td className="p-3.5 sm:p-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${st.bg} ${st.color} ${st.border}`}>
                            <span className="w-1.5 h-1.5 rounded-full bg-current" />
                            <span>{st.label}</span>
                          </span>
                        </td>

                        {/* وضعیت مالی */}
                        <td className="p-3.5 sm:p-4">
                          {c.totalPaidAmount > 0 ? (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 inline-block font-mono">
                              {formatCurrency(c.totalPaidAmount, 'IRT')}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">بدون هزینه</span>
                          )}
                        </td>

                        {/* آخرین فعالیت */}
                        <td className="p-3.5 sm:p-4 text-xs text-slate-500">
                          {formatPersianDateTime(c.latestDate)}
                        </td>

                        {/* عملیات: مشاهده پرونده */}
                        <td className="p-3.5 sm:p-4 text-center">
                          <button
                            onClick={() => setActiveCaseModal(c)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
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
      )}

      {/* محتوای کارتابل: ۲. بانک کلیه ارسالی‌های تفکیکی فرم‌ها */}
      {hubTab === 'submissions' && (
        <div className="flex-1 overflow-auto p-4 sm:p-6 overscroll-contain">
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            <table className="w-full text-right text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-600 font-extrabold">
                  <th className="p-3.5 sm:p-4 text-center w-12">#</th>
                  <th className="p-3.5 sm:p-4">کد پرونده</th>
                  <th className="p-3.5 sm:p-4">عنوان فرم</th>
                  <th className="p-3.5 sm:p-4">وضعیت</th>
                  <th className="p-3.5 sm:p-4">پرداخت</th>
                  <th className="p-3.5 sm:p-4">تاریخ ثبت</th>
                  <th className="p-3.5 sm:p-4 text-center w-24">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-16 text-center text-slate-400 text-sm">
                      پاسخی برای این فرم یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((sub, index) => {
                    const formObj = forms.find((f) => f.id === sub.formId);
                    const st = statusConfigs[sub.status] || statusConfigs.new;

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5 sm:p-4 text-center text-slate-400 font-mono text-xs">
                          {toPersianDigits(index + 1)}
                        </td>
                        <td className="p-3.5 sm:p-4 font-mono font-bold text-sky-800">
                          {sub.trackingCode}
                        </td>
                        <td className="p-3.5 sm:p-4 font-bold text-slate-900">
                          {formObj ? formObj.title : sub.formId}
                        </td>
                        <td className="p-3.5 sm:p-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-xs font-bold border ${st.bg} ${st.color} ${st.border}`}>
                            <span>{st.label}</span>
                          </span>
                        </td>
                        <td className="p-3.5 sm:p-4">
                          {sub.paymentStatus === 'paid' ? (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              {formatCurrency(sub.paymentAmount || 0, 'IRT')}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">بدون پرداخت</span>
                          )}
                        </td>
                        <td className="p-3.5 sm:p-4 text-xs text-slate-500">
                          {formatPersianDateTime(sub.createdAt)}
                        </td>
                        <td className="p-3.5 sm:p-4 text-center">
                          <button
                            onClick={() => setActiveSubmissionModal(sub)}
                            className="p-1.5 text-slate-600 hover:text-sky-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="مشاهده جزئیات ثبت"
                          >
                            <Eye className="w-4 h-4" />
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
      )}

      {/* نمای اختصاصی تمام‌صفحه پرونده مراجعین با تحلیل در یک نگاه، پیگیری، و گزارش نموداری فرم‌ها */}
      {activeCaseModal && (
        <ClientDossierFullview
          clientCase={activeCaseModal}
          onClose={() => setActiveCaseModal(null)}
          onStatusChange={(newStatus) => {
            setActiveCaseModal((prev) => (prev ? { ...prev, overallStatus: newStatus } : null));
          }}
        />
      )}

      {/* مودال مشاهده رکورد تکی ارسالی */}
      {activeSubmissionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 border border-slate-200 shadow-2xl text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  جزئیات رکورد: {activeSubmissionModal.trackingCode}
                </h3>
              </div>
              <button
                onClick={() => setActiveSubmissionModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3 overscroll-contain">
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(activeSubmissionModal.data).map(([k, v]) => (
                  <div key={k} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">{k}:</span>
                    <span className="font-bold text-slate-800">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveSubmissionModal(null)}
                className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
