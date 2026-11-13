'use client';

import React, { useState, useMemo } from 'react';
import { useForm } from '@/context/form-context';
import { useAdminAuth } from '@/context/admin-auth-context';
import { isSuperAdminUser } from '@/lib/team-constants';
import { Form } from '@/types/form';
import { 
  FolderKanban, 
  PlusCircle, 
  PenTool, 
  Eye, 
  Inbox, 
  Share2, 
  Trash2, 
  Copy, 
  Check, 
  QrCode, 
  Code2, 
  ExternalLink,
  Layers,
  BarChart3,
  FileText,
  Download,
  FileSpreadsheet,
  ChevronDown,
  Search,
} from 'lucide-react';
import { toPersianDigits, formatPersianDateTime } from '@/lib/persian';
import { isAssignedSafaSubmission } from '@/lib/safa-utils';

const FORM_STATUS_MAP: Record<
  'published' | 'draft' | 'archived',
  {
    label: string;
    badgeClass: string;
    dotClass: string;
    pulse: boolean;
  }
> = {
  published: {
    label: 'منتشر شده (فعال)',
    badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100',
    dotClass: 'bg-emerald-500',
    pulse: true,
  },
  draft: {
    label: 'پیش‌نویس',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100',
    dotClass: 'bg-amber-500',
    pulse: false,
  },
  archived: {
    label: 'بایگانی‌شده',
    badgeClass: 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200',
    dotClass: 'bg-slate-400',
    pulse: false,
  },
};

interface FormsListViewProps {
  onOpenNewFormModal: () => void;
  onNavigateTab: (tab: string) => void;
}

export const FormsListView: React.FC<FormsListViewProps> = ({
  onOpenNewFormModal,
  onNavigateTab,
}) => {
  const { forms, submissions, setActiveForm, deleteForm, updateForm } = useForm();
  const { currentUser } = useAdminAuth();
  const isSuperAdmin = isSuperAdminUser(currentUser);
  const [sharingForm, setSharingForm] = useState<Form | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [reportsFormId, setReportsFormId] = useState<string | null>(null);
  const [exportingFormId, setExportingFormId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [openStatusMenuId, setOpenStatusMenuId] = useState<string | null>(null);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  const handleStatusChange = (form: Form, newStatus: 'published' | 'draft' | 'archived') => {
    updateForm(form.id, { status: newStatus });
    const label = FORM_STATUS_MAP[newStatus]?.label || newStatus;
    setStatusToast(`وضعیت فرم «${form.title}» به «${label}» تغییر یافت.`);
    setTimeout(() => setStatusToast(null), 3000);
  };

  const filteredForms = useMemo(() => {
    return forms.filter((form) => {
      const formStatus = form.status || 'published';
      if (statusFilter !== 'all' && formStatus !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        const titleMatch = (form.title || '').toLowerCase().includes(query);
        const descMatch = (form.description || '').toLowerCase().includes(query);
        const catMatch = (form.category || '').toLowerCase().includes(query);
        if (!titleMatch && !descMatch && !catMatch) return false;
      }
      return true;
    });
  }, [forms, statusFilter, searchQuery]);

  const handleExportFormExcel = async (form: Form) => {
    if (!isSuperAdmin) return;
    const formSubs = form.id === 'form-safaan-assessment'
      ? submissions.filter((s) => s.formId === form.id && isAssignedSafaSubmission(s))
      : submissions.filter((s) => s.formId === form.id);
    if (formSubs.length === 0) {
      alert(`هنوز پاسخی برای فرم «${form.title}» ثبت نشده است.`);
      return;
    }
    try {
      setExportingFormId(form.id);
      const { exportFormSubmissionsToXLSX } = await import('@/lib/excel-export');
      await exportFormSubmissionsToXLSX(form, formSubs);
    } catch (err) {
      console.error('Error exporting Excel:', err);
      alert('خطا در صدور فایل اکسل.');
    } finally {
      setExportingFormId(null);
    }
  };

  const handleShare = (form: Form) => {
    setSharingForm(form);
  };

  const formPublicUrl = (form: Form) => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/form/${form.slug}`;
    }
    return `https://formafzar.ir/form/${form.slug}`;
  };

  const copyToClipboard = (text: string, type: 'link' | 'embed') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedEmbed(true);
      setTimeout(() => setCopiedEmbed(false), 2000);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 pb-20 sm:pb-12 space-y-6 bg-slate-50 overscroll-contain">
      
      {/* سربرگ فرم‌ها */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
            مدیریت فرم‌ها و سامانه‌ها
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            فهرست تمامی فرم‌های سازمانی، آزمون‌ها و فاکتورسازها با لینک‌های اختصاصی اشتراک‌گذاری
          </p>
        </div>

        <button
          onClick={onOpenNewFormModal}
          className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center gap-2 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>ساخت فرم جدید</span>
        </button>
      </div>

      {/* نوار جستجو و فیلتر وضعیت */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* تب‌های فیلتر وضعیت */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span>همه</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusFilter === 'all' ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
              {toPersianDigits(forms.length)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('published')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'published'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-emerald-50 hover:text-emerald-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span>منتشر شده</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusFilter === 'published' ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-100 text-emerald-800'}`}>
              {toPersianDigits(forms.filter((f) => (f.status || 'published') === 'published').length)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('draft')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'draft'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-amber-50 hover:text-amber-800'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span>پیش‌نویس</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusFilter === 'draft' ? 'bg-amber-700 text-amber-100' : 'bg-amber-100 text-amber-800'}`}>
              {toPersianDigits(forms.filter((f) => f.status === 'draft').length)}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('archived')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'archived'
                ? 'bg-slate-700 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-slate-400 shrink-0" />
            <span>بایگانی‌شده</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${statusFilter === 'archived' ? 'bg-slate-600 text-slate-100' : 'bg-slate-100 text-slate-600'}`}>
              {toPersianDigits(forms.filter((f) => f.status === 'archived').length)}
            </span>
          </button>
        </div>

        {/* کادر جستجو */}
        <div className="relative min-w-[220px]">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجوی نام یا موضوع فرم..."
            className="w-full pl-3 pr-9 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all text-right"
          />
        </div>
      </div>

      {/* شبکه فرم‌ها */}
      {filteredForms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <FolderKanban className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-800">هیچ فرمی یافت نشد</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            با فیلتر انتخابی یا عبارت جستجو فرمی پیدا نشد. می‌توانید فیلتر را تغییر دهید یا فرم جدید ایجاد نمایید.
          </p>
          <button
            onClick={() => {
              setStatusFilter('all');
              setSearchQuery('');
            }}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
          >
            نمایش همه فرم‌ها
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredForms.map((form) => {
            const formStatus: 'published' | 'draft' | 'archived' = form.status || 'published';
            const statusCfg = FORM_STATUS_MAP[formStatus];

            return (
              <div
                key={form.id}
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveForm(form);
                  onNavigateTab('runner');
                }}
                className={`bg-white rounded-2xl border shadow-xs hover:shadow-md transition-all flex flex-col justify-between overflow-visible p-6 space-y-4 cursor-pointer relative ${
                  formStatus === 'published'
                    ? 'border-slate-200 hover:border-emerald-400'
                    : formStatus === 'draft'
                    ? 'border-amber-200/90 bg-amber-50/15 hover:border-amber-400'
                    : 'border-slate-200 bg-slate-50/40 opacity-85'
                }`}
              >
                <div>
                  {/* ردیف بالا: وضعیت فرم در سمت چپ، دسته‌بندی و حالت در سمت راست */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        {form.category}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium px-2 py-0.5 bg-slate-100 rounded-md border border-slate-200">
                        {form.mode === 'wizard' ? 'مرحله‌ای' : 'کلاسیک'}
                      </span>
                    </div>

                    {/* بج وضعیت فرم با امکان کلیک برای تغییر سریع */}
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setOpenStatusMenuId(openStatusMenuId === form.id ? null : form.id)}
                        className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs ${statusCfg.badgeClass}`}
                        title="کلیک برای تغییر وضعیت فرم"
                      >
                        <span className={`w-2 h-2 rounded-full ${statusCfg.dotClass} ${statusCfg.pulse ? 'animate-pulse' : ''}`} />
                        <span>{statusCfg.label}</span>
                        <ChevronDown className="w-3 h-3 opacity-60" />
                      </button>

                      {/* منوی بازشو برای تغییر سریع وضعیت */}
                      {openStatusMenuId === form.id && (
                        <>
                          <div
                            className="fixed inset-0 z-30"
                            onClick={() => setOpenStatusMenuId(null)}
                          />
                          <div className="absolute left-0 mt-1.5 w-44 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 text-right animate-in fade-in slide-in-from-top-1 duration-150">
                            <div className="px-3 py-1 text-[10px] font-extrabold text-slate-400 border-b border-slate-100 mb-1">
                              تغییر وضعیت فرم:
                            </div>
                            {(['published', 'draft', 'archived'] as const).map((st) => {
                              const isCur = formStatus === st;
                              const cfg = FORM_STATUS_MAP[st];
                              return (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => {
                                    handleStatusChange(form, st);
                                    setOpenStatusMenuId(null);
                                  }}
                                  className={`w-full px-3 py-1.5 text-xs flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                                    isCur ? 'bg-slate-50 font-bold text-slate-900' : 'text-slate-600 hover:bg-slate-100'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${cfg.dotClass}`} />
                                    <span>{cfg.label}</span>
                                  </div>
                                  {isCur && <Check className="w-3.5 h-3.5 text-blue-600" />}
                                </button>
                              );
                            })}
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <h3 className="font-extrabold text-slate-900 text-sm line-clamp-1" title={form.title}>
                    {form.title}
                  </h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                    {form.description || 'بدون توضیحات اولیه...'}
                  </p>
                </div>

            {/* آمار فرم */}
            <div className="grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center text-xs">
              <div className="p-2 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 block">فیلدها</span>
                <span className="font-bold text-slate-800 font-mono">
                  {toPersianDigits(form.fields.length)}
                </span>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 block">پاسخ‌های واقعی</span>
                <span className="font-bold text-blue-700 font-mono">
                  {toPersianDigits(
                    form.id === 'form-safaan-assessment'
                      ? submissions.filter((s) => s.formId === form.id && isAssignedSafaSubmission(s)).length
                      : submissions.filter((s) => s.formId === form.id).length
                  )}
                </span>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg">
                <span className="text-[10px] text-slate-400 block">شروط منطقی</span>
                <span className="font-bold text-slate-800 font-mono">
                  {toPersianDigits(form.rules.length)}
                </span>
              </div>
            </div>

            {/* دکمه‌های کنترل */}
            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveForm(form);
                    onNavigateTab('builder');
                  }}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-md text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>طراحی</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveForm(form);
                    onNavigateTab('runner');
                  }}
                  className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-md transition-colors"
                  title="پیش‌نمایش فرم زنده"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShare(form);
                  }}
                  className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-md transition-colors"
                  title="اشتراک‌گذاری و کد تعبیه"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveForm(form);
                    setReportsFormId(form.id);
                    onNavigateTab('analytics');
                  }}
                  className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-md transition-colors"
                  title="مشاهده گزارش‌های آماری فرم"
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
                {isSuperAdmin && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleExportFormExcel(form);
                    }}
                    disabled={exportingFormId === form.id}
                    className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors cursor-pointer"
                    title="خروجی مستقیم اکسل (XLSX) با فونت B Lotus"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  </button>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm('آیا از حذف این فرم اطمینان دارید؟')) deleteForm(form.id);
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                title="حذف فرم"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

          </div>
        );
      })}
      </div>
      )}

      {/* مودال اشتراک‌گذاری فرم و کدهای تعبیه */}
      {sharingForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 pt-16 sm:pt-20 pb-4 animate-in fade-in overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 text-xs space-y-5 max-h-[calc(100dvh-5.5rem)] sm:max-h-[calc(100vh-6.5rem)] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Share2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-sm text-slate-900">اشتراک‌گذاری و انتشار فرم</h3>
              </div>
              <button
                onClick={() => setSharingForm(null)}
                className="text-slate-400 hover:text-slate-800 p-1"
              >
                ✕
              </button>
            </div>

            {/* لینک مستقیم */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800">لینک مستقیم فرم عمومی:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={formPublicUrl(sharingForm)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-md font-mono text-left bg-slate-50 text-xs"
                />
                <button
                  onClick={() => copyToClipboard(formPublicUrl(sharingForm), 'link')}
                  className="px-3 py-2 bg-blue-600 text-white font-bold rounded-md hover:bg-blue-700 flex items-center gap-1"
                >
                  {copiedLink ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? 'کپی شد' : 'کپی'}</span>
                </button>
              </div>
            </div>

            {/* کد آی‌فریم و تعبیه (Embed Code) */}
            <div className="space-y-1.5">
              <label className="font-bold text-slate-800">کد تعبیه در سایت یا وردپرس (iFrame):</label>
              <div className="flex gap-2">
                <textarea
                  readOnly
                  rows={2}
                  value={`<iframe src="${formPublicUrl(sharingForm)}" width="100%" height="800" frameborder="0"></iframe>`}
                  className="flex-1 px-3 py-1.5 border border-slate-300 rounded-md font-mono text-left bg-slate-50 text-[11px] resize-none"
                />
                <button
                  onClick={() =>
                    copyToClipboard(
                      `<iframe src="${formPublicUrl(sharingForm)}" width="100%" height="800" frameborder="0"></iframe>`,
                      'embed'
                    )
                  }
                  className="px-3 py-2 bg-slate-900 text-white font-bold rounded-md hover:bg-slate-800 flex items-center gap-1 self-start"
                >
                  {copiedEmbed ? <Check className="w-4 h-4" /> : <Code2 className="w-4 h-4" />}
                  <span>کپی</span>
                </button>
              </div>
            </div>

            {/* بارکد QR Code */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-4">
              <div className="w-16 h-16 bg-white border border-slate-300 rounded-lg p-1.5 flex items-center justify-center shrink-0">
                <QrCode className="w-12 h-12 text-slate-900" />
              </div>
              <div className="space-y-1">
                <span className="font-bold text-slate-900 block">بارکد هوشمند پاسخگویی</span>
                <p className="text-[11px] text-slate-500">
                  داوطلبان و مشتریان می‌توانند با اسکن این کد با دوربین موبایل، مستقیماً فرم را تکمیل نمایند.
                </p>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSharingForm(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-md"
              >
                بستن پنجره
              </button>
            </div>

          </div>
        </div>
      )}

      {/* پیام بازخورد تغییر وضعیت */}
      {statusToast && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-slate-900/95 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 border border-slate-800">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{statusToast}</span>
        </div>
      )}

    </div>
  );
};
