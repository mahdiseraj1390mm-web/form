'use client';

import React, { useState } from 'react';
import { useForm } from '@/context/form-context';
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
} from 'lucide-react';
import { toPersianDigits, formatPersianDateTime } from '@/lib/persian';
import { exportFormSubmissionsToXLSX } from '@/lib/excel-export';

interface FormsListViewProps {
  onOpenNewFormModal: () => void;
  onNavigateTab: (tab: string) => void;
}

export const FormsListView: React.FC<FormsListViewProps> = ({
  onOpenNewFormModal,
  onNavigateTab,
}) => {
  const { forms, submissions, setActiveForm, deleteForm } = useForm();
  const [sharingForm, setSharingForm] = useState<Form | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  const [reportsFormId, setReportsFormId] = useState<string | null>(null);
  const [exportingFormId, setExportingFormId] = useState<string | null>(null);

  const handleExportFormExcel = async (form: Form) => {
    const formSubs = submissions.filter((s) => s.formId === form.id);
    if (formSubs.length === 0) {
      alert(`هنوز پاسخی برای فرم «${form.title}» ثبت نشده است.`);
      return;
    }
    try {
      setExportingFormId(form.id);
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

      {/* شبکه فرم‌ها */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {forms.map((form) => (
          <div
            key={form.id}
            onClick={() => {
              setActiveForm(form);
              setReportsFormId(form.id);
              onNavigateTab('analytics');
            }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-400 transition-all flex flex-col justify-between overflow-hidden p-6 space-y-4 cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {form.category}
                </span>
                <span className="text-[11px] text-slate-400">
                  {form.mode === 'wizard' ? 'مرحله‌ای' : 'کلاسیک'}
                </span>
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
                  {toPersianDigits(submissions.filter((s) => s.formId === form.id).length)}
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
                  onClick={() => {
                    setActiveForm(form);
                    onNavigateTab('builder');
                  }}
                  className="px-3 py-1.5 bg-slate-900 text-white rounded-md text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-1.5"
                >
                  <PenTool className="w-3.5 h-3.5" />
                  <span>طراحی</span>
                </button>
                <button
                  onClick={() => {
                    setActiveForm(form);
                    onNavigateTab('runner');
                  }}
                  className="p-1.5 text-slate-600 hover:text-emerald-600 hover:bg-slate-100 rounded-md transition-colors"
                  title="پیش‌نمایش فرم زنده"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleShare(form)}
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
              </div>

              <button
                onClick={() => {
                  if (confirm('آیا از حذف این فرم اطمینان دارید؟')) deleteForm(form.id);
                }}
                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                title="حذف فرم"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

          </div>
        ))}
      </div>

      {/* مودال اشتراک‌گذاری فرم و کدهای تعبیه */}
      {sharingForm && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 text-xs space-y-5">
            
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

    </div>
  );
};
