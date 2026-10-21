'use client';

import React, { useState } from 'react';
import { useForm } from '@/context/form-context';
import { FormSubmission, SubmissionStatus } from '@/types/form';
import { 
  Inbox, 
  Search, 
  Filter, 
  Download, 
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
  Table as TableIcon
} from 'lucide-react';
import { formatPersianDateTime, formatCurrency, toPersianDigits, getFieldDisplayValue } from '@/lib/persian';

export const SubmissionsHub: React.FC = () => {
  const { forms, activeForm, submissions, updateSubmissionStatus, addSubmissionComment } = useForm();
  
  const [selectedFormId, setSelectedFormId] = useState<string>(activeForm?.id || forms[0]?.id || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'kanban'>('table');
  const [activeSubmission, setActiveSubmission] = useState<FormSubmission | null>(null);
  const [newCommentText, setNewCommentText] = useState('');

  const currentForm = forms.find((f) => f.id === selectedFormId) || forms[0];
  
  // فیلتر رکوردهای ارسالی فرم جاری
  const formSubmissions = submissions.filter((s) => s.formId === selectedFormId);

  const filteredSubmissions = formSubmissions.filter((s) => {
    // جستجو بر اساس کد پیگیری یا داده‌ها
    const matchesSearch =
      s.trackingCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      JSON.stringify(s.data).toLowerCase().includes(searchQuery.toLowerCase());
    
    // فیلتر وضعیت
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const statusConfigs: Record<SubmissionStatus, { label: string; color: string; bg: string; border: string }> = {
    new: { label: 'جدید', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
    reviewing: { label: 'در حال بررسی', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
    approved: { label: 'تأیید شده', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
    rejected: { label: 'رد شده', color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200' },
    archived: { label: 'بایگانی', color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-200' },
  };

  // دانلود خروجی استاندارد CSV با پشتیبانی کامل از حروف فارسی (BOM)
  const handleExportCSV = () => {
    if (!currentForm || filteredSubmissions.length === 0) return;

    const headers = ['کد پرونده', 'تاریخ ثبت', 'وضعیت', 'وضعیت پرداخت', ...currentForm.fields.map((f) => f.label)];
    
    const rows = filteredSubmissions.map((s) => {
      const fieldValues = currentForm.fields.map((f) => {
        const val = s.data[f.id];
        if (val === undefined || val === null) return '';
        if (typeof val === 'object') return JSON.stringify(val);
        return getFieldDisplayValue(f, val).replace(/"/g, '""');
      });

      return [
        s.trackingCode,
        formatPersianDateTime(s.createdAt),
        statusConfigs[s.status]?.label || s.status,
        s.paymentStatus === 'paid' ? 'پرداخت شده' : 'بدون پرداخت',
        ...fieldValues,
      ];
    });

    const csvContent = '\uFEFF' + [headers, ...rows].map((e) => `"${e.join('","')}"`).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `form_submissions_${currentForm.slug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddComment = () => {
    if (!activeSubmission || !newCommentText.trim()) return;
    addSubmissionComment(activeSubmission.id, 'مدیر سیستم', 'سرپرست بررسی', newCommentText.trim());
    setNewCommentText('');
    // بروزرسانی استیت مودال
    const updated = submissions.find((s) => s.id === activeSubmission.id);
    if (updated) setActiveSubmission(updated);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-50">
      
      {/* نوار سربرگ کارتابل */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-sm">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200 shrink-0">
            <Inbox className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-extrabold text-slate-900">بانک ارسالی‌ها و کارتابل</h1>
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {toPersianDigits(filteredSubmissions.length)} رکورد
              </span>
            </div>
            <p className="text-xs text-slate-500">مدیریت پاسخ‌ها، تغییر وضعیت گردش کار و خروجی داده‌ها</p>
          </div>
        </div>

        {/* سوییچ فرم و ابزارهای بالا */}
        <div className="flex items-center gap-3 flex-wrap">
          <select
            value={selectedFormId}
            onChange={(e) => setSelectedFormId(e.target.value)}
            className="text-xs font-bold text-slate-900 border border-slate-300 rounded-md px-3 py-2 bg-white max-w-xs truncate focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            {forms.map((f) => (
              <option key={f.id} value={f.id}>
                {f.title} ({toPersianDigits(f.submissionCount)} ثبت)
              </option>
            ))}
          </select>

          {/* سوییچ نما: جدول / کانبان */}
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-100 text-xs">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                viewMode === 'table' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>جدول داده</span>
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>کانبان بورد</span>
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-300 rounded-md shadow-sm transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>خروجی اکسل (CSV)</span>
          </button>
        </div>

      </div>

      {/* نوار جستجو و فیلترها */}
      <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex items-center justify-between gap-4 text-xs shrink-0">
        <div className="flex items-center gap-3 flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در کد پرونده یا اطلاعات ثبت شده..."
              className="w-full pl-3 pr-8 py-1.5 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-600 bg-slate-50/50"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-[11px]">فیلتر وضعیت:</span>
          <div className="flex items-center gap-1">
            {[
              { id: 'all', label: 'همه' },
              { id: 'new', label: 'جدید' },
              { id: 'reviewing', label: 'در حال بررسی' },
              { id: 'approved', label: 'تأیید شده' },
              { id: 'rejected', label: 'رد شده' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStatusFilter(st.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
                  statusFilter === st.id
                    ? 'bg-slate-900 text-white font-bold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* نمای جدول داده‌ها */}
      {viewMode === 'table' && (
        <div className="flex-1 overflow-auto p-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <table className="w-full text-right text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="p-3.5 w-12 text-center">#</th>
                  <th className="p-3.5">کد پرونده</th>
                  <th className="p-3.5">وضعیت گردش کار</th>
                  <th className="p-3.5">وضعیت مالی</th>
                  {currentForm?.fields.slice(0, 4).map((f) => (
                    <th key={f.id} className="p-3.5 truncate max-w-[150px]">
                      {f.label}
                    </th>
                  ))}
                  <th className="p-3.5">تاریخ ثبت</th>
                  <th className="p-3.5 text-center w-24">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredSubmissions.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-12 text-center text-slate-400 text-xs">
                      رکوردی با مشخصات درخواستی یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredSubmissions.map((sub, index) => {
                    const st = statusConfigs[sub.status] || statusConfigs.new;

                    return (
                      <tr key={sub.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 text-center text-slate-400 font-mono text-[11px]">
                          {index + 1}
                        </td>
                        <td className="p-3.5 font-mono font-bold text-blue-700">
                          {sub.trackingCode}
                        </td>
                        <td className="p-3.5">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${st.bg} ${st.color} ${st.border}`}>
                            {st.label}
                          </span>
                        </td>
                        <td className="p-3.5">
                          {sub.paymentStatus === 'paid' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              <span>پرداخت شده</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">بدون هزینه</span>
                          )}
                        </td>
                        {currentForm?.fields.slice(0, 4).map((f) => {
                          const val = sub.data[f.id];
                          const displayVal = getFieldDisplayValue(f, val);
                          return (
                            <td key={f.id} className="p-3.5 truncate max-w-[150px] text-slate-800">
                              {f.type === 'signature' && val ? (
                                <span className="text-emerald-600 font-bold text-[10px]">دارای امضا ✓</span>
                              ) : (
                                displayVal
                              )}
                            </td>
                          );
                        })}
                        <td className="p-3.5 text-slate-500 text-[11px]">
                          {formatPersianDateTime(sub.createdAt)}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            onClick={() => setActiveSubmission(sub)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded border border-slate-200 transition-colors"
                          >
                            مشاهده
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

      {/* نمای کانبان بورد هوشمند */}
      {viewMode === 'kanban' && (
        <div className="flex-1 overflow-x-auto p-6">
          <div className="flex gap-4 min-w-[1000px] h-full items-start">
            {(['new', 'reviewing', 'approved', 'rejected'] as SubmissionStatus[]).map((statusKey) => {
              const conf = statusConfigs[statusKey];
              const columnItems = filteredSubmissions.filter((s) => s.status === statusKey);

              return (
                <div key={statusKey} className="w-72 bg-slate-100/80 rounded-xl p-3 border border-slate-200 flex flex-col max-h-full">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-200">
                    <span className="font-bold text-xs text-slate-800">{conf.label}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white text-slate-600 border border-slate-200">
                      {toPersianDigits(columnItems.length)}
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-2 pr-0.5">
                    {columnItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => setActiveSubmission(item)}
                        className="p-3 bg-white rounded-lg border border-slate-200 shadow-sm hover:border-blue-400 hover:shadow-md transition-all cursor-pointer space-y-2 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-blue-700 text-[11px]">
                            {item.trackingCode}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {formatPersianDateTime(item.createdAt).split(' ')[0]}
                          </span>
                        </div>

                        {/* پیش‌نمایش فیلد اول (معمولا نام) */}
                        <div className="font-semibold text-slate-900 truncate">
                          {Object.values(item.data)[0] || 'ثبت بدون نام'}
                        </div>

                        {/* تغییر سریع وضعیت */}
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <select
                            value={item.status}
                            onChange={(e) => {
                              e.stopPropagation();
                              updateSubmissionStatus(item.id, e.target.value as any);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="text-[10px] font-medium border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50 text-slate-700"
                          >
                            <option value="new">جدید</option>
                            <option value="reviewing">در حال بررسی</option>
                            <option value="approved">تأیید</option>
                            <option value="rejected">رد</option>
                          </select>

                          {item.comments.length > 0 && (
                            <span className="text-[10px] text-slate-500 flex items-center gap-1">
                              <MessageSquare className="w-3 h-3 text-slate-400" />
                              <span>{toPersianDigits(item.comments.length)}</span>
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* مودال مشاهده جزئیات کامل ثبت و یادداشت‌های تیمی */}
      {activeSubmission && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 text-xs">
            
            {/* سربرگ مودال */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-500">کد پرونده:</div>
                <div className="text-sm font-extrabold text-blue-800 font-mono">
                  {activeSubmission.trackingCode}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <select
                  value={activeSubmission.status}
                  onChange={(e) => {
                    updateSubmissionStatus(activeSubmission.id, e.target.value as any);
                    setActiveSubmission({ ...activeSubmission, status: e.target.value as any });
                  }}
                  className="px-2.5 py-1 text-xs font-bold border border-slate-300 rounded-md bg-white text-slate-800"
                >
                  <option value="new">وضعیت: جدید</option>
                  <option value="reviewing">وضعیت: در حال بررسی</option>
                  <option value="approved">وضعیت: تأیید نهایی</option>
                  <option value="rejected">وضعیت: رد شده</option>
                </select>

                <button
                  onClick={() => setActiveSubmission(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-800 rounded-md"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* بدنه داده‌ها */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              
              {/* لیست فیلدها و پاسخ‌ها */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-900 border-b border-slate-100 pb-1">
                  پاسخ‌های ثبت شده کاربر
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {currentForm?.fields.map((f) => {
                    const val = activeSubmission.data[f.id];
                    return (
                      <div key={f.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200/80">
                        <span className="text-[11px] text-slate-500 block mb-0.5">{f.label}</span>
                        {f.type === 'signature' && val ? (
                          <img src={val} alt="امضا" className="h-14 border border-slate-200 bg-white rounded mt-1 p-1" />
                        ) : (
                          <span className="font-semibold text-slate-900">{getFieldDisplayValue(f, val)}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* یادداشت‌ها و کامنت‌های درون‌سازمانی */}
              <div className="space-y-3 pt-2 border-t border-slate-100">
                <h4 className="font-bold text-slate-900 flex items-center justify-between">
                  <span>یادداشت‌ها و دیدگاه‌های تیمی</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {toPersianDigits(activeSubmission.comments.length)} پیام
                  </span>
                </h4>

                <div className="space-y-2">
                  {activeSubmission.comments.map((c) => (
                    <div key={c.id} className="p-3 bg-blue-50/50 border border-blue-100 rounded-lg text-xs space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-blue-900">{c.authorName} ({c.authorRole})</span>
                        <span className="text-slate-400">{formatPersianDateTime(c.createdAt)}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{c.content}</p>
                    </div>
                  ))}
                </div>

                {/* فرم ارسال دیدگاه جدید */}
                <div className="flex gap-2 pt-2">
                  <input
                    type="text"
                    value={newCommentText}
                    onChange={(e) => setNewCommentText(e.target.value)}
                    placeholder="ثبت یادداشت یا ارجاع برای همکاران..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-md text-xs focus:ring-1 focus:ring-blue-600"
                  />
                  <button
                    onClick={handleAddComment}
                    className="px-4 py-2 bg-slate-900 text-white font-bold rounded-md hover:bg-slate-800 transition-colors"
                  >
                    ثبت یادداشت
                  </button>
                </div>
              </div>

            </div>

            {/* دکمه‌های فوتر مودال */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-slate-700 border border-slate-300 rounded-md hover:bg-slate-100"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>چاپ این فرم</span>
              </button>

              <button
                onClick={() => setActiveSubmission(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-md hover:bg-slate-800"
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
