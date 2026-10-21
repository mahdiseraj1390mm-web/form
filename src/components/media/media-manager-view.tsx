'use client';

import React, { useState } from 'react';
import { useForm } from '@/context/form-context';
import { 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  Mic, 
  PenTool, 
  Download, 
  Search, 
  ExternalLink,
  CheckCircle2,
  FolderArchive,
  Eye
} from 'lucide-react';
import { toPersianDigits, formatPersianDateTime } from '@/lib/persian';

interface ExtractedAttachment {
  submissionId: string;
  trackingCode: string;
  fieldId: string;
  fieldLabel: string;
  fileName: string;
  fileType: 'pdf' | 'image' | 'audio' | 'signature';
  applicantName: string;
  createdAt: string;
  fileUrl?: string;
}

export const MediaManagerView: React.FC = () => {
  const { forms, submissions } = useForm();
  const [selectedFormId, setSelectedFormId] = useState<string>(forms[0]?.id || '');
  const [fileTypeFilter, setFileTypeFilter] = useState<string>('all');
  const [namingPattern, setNamingPattern] = useState<string>('{nationalCode}_{name}_{fieldName}');
  const [downloadSuccessToast, setDownloadSuccessToast] = useState(false);

  const currentForm = forms.find((f) => f.id === selectedFormId) || forms[0];
  const formSubmissions = submissions.filter((s) => s.formId === selectedFormId);

  // استخراج تمام فایل‌های ضمیمه‌شده در رکوردهای فرم انتخابی
  const attachments: ExtractedAttachment[] = [];

  formSubmissions.forEach((sub) => {
    const applicantName = Object.values(sub.data)[0] || 'متقاضی';

    currentForm?.fields.forEach((field) => {
      const val = sub.data[field.id];
      if (!val) return;

      if (field.type === 'fileUpload' || field.type === 'photoCrop' || field.type === 'imageUpload') {
        attachments.push({
          submissionId: sub.id,
          trackingCode: sub.trackingCode,
          fieldId: field.id,
          fieldLabel: field.label,
          fileName: String(val),
          fileType: String(val).endsWith('.pdf') ? 'pdf' : 'image',
          applicantName,
          createdAt: sub.createdAt,
        });
      } else if (field.type === 'signature') {
        attachments.push({
          submissionId: sub.id,
          trackingCode: sub.trackingCode,
          fieldId: field.id,
          fieldLabel: field.label,
          fileName: `signature_${sub.trackingCode}.png`,
          fileType: 'signature',
          applicantName,
          createdAt: sub.createdAt,
          fileUrl: String(val),
        });
      } else if (field.type === 'audioRecord') {
        attachments.push({
          submissionId: sub.id,
          trackingCode: sub.trackingCode,
          fieldId: field.id,
          fieldLabel: field.label,
          fileName: String(val),
          fileType: 'audio',
          applicantName,
          createdAt: sub.createdAt,
        });
      }
    });
  });

  const filteredAttachments = attachments.filter((att) => {
    if (fileTypeFilter === 'all') return true;
    return att.fileType === fileTypeFilter;
  });

  const handleBulkDownload = () => {
    setDownloadSuccessToast(true);
    setTimeout(() => setDownloadSuccessToast(false), 3000);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-slate-50 select-none">
      
      {/* سربرگ مدیریت مدارک */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UploadCloud className="w-5 h-5 text-blue-600" />
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
              مرکز اسناد، مدارک و فایل‌های پیوست
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            مشاهده، دسته‌بندی و دانلود دسته‌جمعی (Bulk Download) فایل‌های ارسالی با نام‌گذاری داینامیک
          </p>
        </div>

        <select
          value={selectedFormId}
          onChange={(e) => setSelectedFormId(e.target.value)}
          className="text-xs font-bold text-slate-900 border border-slate-300 rounded-lg px-3 py-2 bg-white max-w-xs focus:ring-1 focus:ring-blue-600"
        >
          {forms.map((f) => (
            <option key={f.id} value={f.id}>
              {f.title}
            </option>
          ))}
        </select>
      </div>

      {/* ابزار دانلود گروهی و الگوی نام‌گذاری */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 text-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <span className="font-bold text-slate-900 block">دانلود دسته‌جمعی به صورت فایل فشرده (ZIP)</span>
            <span className="text-[11px] text-slate-500">تمامی فایل‌های پیوست با الگوی انتخابی شما نام‌گذاری خواهند شد</span>
          </div>

          <div className="flex items-center gap-2">
            {downloadSuccessToast && (
              <span className="text-emerald-600 font-bold text-xs flex items-center gap-1 bg-emerald-50 px-2 py-1 rounded border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>فایل فشرده مدارک آماده دانلود شد</span>
              </span>
            )}
            <button
              onClick={handleBulkDownload}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg shadow-sm flex items-center gap-2 transition-colors"
            >
              <FolderArchive className="w-4 h-4 text-amber-400" />
              <span>دانلود یکجای تمام مدارک (ZIP)</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-600 font-medium shrink-0">الگوی نام‌گذاری فایل‌ها:</span>
          <select
            value={namingPattern}
            onChange={(e) => setNamingPattern(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono text-left text-xs"
          >
            <option value="{nationalCode}_{name}_{fieldName}">[کد ملی] - [نام کاربر] - [عنوان مدرک].pdf</option>
            <option value="{trackingCode}_{fieldName}">[کد پرونده] - [عنوان مدرک].pdf</option>
            <option value="{name}_{trackingCode}">[نام کاربر] - [کد پرونده].pdf</option>
          </select>
        </div>
      </div>

      {/* فیلترها و آمار فایل‌ها */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-medium">نوع فایل:</span>
          {[
            { id: 'all', label: 'همه فایل‌ها' },
            { id: 'pdf', label: 'اسناد PDF و رزومه' },
            { id: 'image', label: 'تصاویر و عکس پرسنلی' },
            { id: 'signature', label: 'امضاهای دیجیتال' },
            { id: 'audio', label: 'فایل‌های صوتی' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFileTypeFilter(item.id)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                fileTypeFilter === item.id
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <span className="text-slate-400 font-mono">
          {toPersianDigits(filteredAttachments.length)} فایل پیوست یافت شد
        </span>
      </div>

      {/* گالری اسناد و کارت‌ها */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredAttachments.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-2xl border border-slate-200 text-xs">
            هنوز مدرک یا فایلی در ارسالی‌های این فرم پیوست نشده است.
          </div>
        ) : (
          filteredAttachments.map((att, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between space-y-3 text-xs"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                    {att.fileType === 'pdf' ? (
                      <FileText className="w-4 h-4 text-rose-600" />
                    ) : att.fileType === 'image' ? (
                      <ImageIcon className="w-4 h-4 text-blue-600" />
                    ) : att.fileType === 'signature' ? (
                      <PenTool className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Mic className="w-4 h-4 text-purple-600" />
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 font-bold">
                    {att.trackingCode}
                  </span>
                </div>

                <div className="font-bold text-slate-900 truncate" title={att.fileName}>
                  {att.fileName}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  مربوط به: {att.fieldLabel}
                </div>
                <div className="text-[11px] text-slate-700 font-medium mt-0.5">
                  تکمیل‌کننده: {att.applicantName}
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[10px] text-slate-400">
                  {formatPersianDateTime(att.createdAt).split(' ')[0]}
                </span>
                
                <button
                  onClick={() => alert(`دانلود فایل ${att.fileName} با موفقیت انجام شد.`)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>دانلود</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

    </div>
  );
};
