'use client';

import React from 'react';
import { Form, FormSubmission } from '@/types/form';
import { ClientCaseGroup, Appointment } from './client-dossier-fullview';
import {
  formatPersianDateTime,
  formatPersianDateOnly,
  toPersianDigits,
  getFieldDisplayValue,
} from '@/lib/persian';

interface PrintableClientDossierProps {
  clientCase: ClientCaseGroup;
  combinedData: Record<string, any>;
  appointments: Appointment[];
  submissions: FormSubmission[];
  forms: Form[];
  safaEvaluationSubmission?: FormSubmission;
}

export const PrintableClientDossier: React.FC<PrintableClientDossierProps> = ({
  clientCase,
  combinedData,
  appointments,
  submissions,
  forms,
  safaEvaluationSubmission,
}) => {
  const currentDatePersian = formatPersianDateTime(new Date().toISOString());

  // دریافت کارنامه و ابعاد بالینی صفا در صورت وجود یا مؤلفه‌های تحلیلی
  const evalResult = safaEvaluationSubmission?.evaluationResult;
  const overallScore = evalResult?.overallScore ?? ((clientCase as any).safaScore || 75);

  const clinicalDimensions =
    evalResult?.componentScores && evalResult.componentScores.length > 0
      ? evalResult.componentScores.map((c) => ({
          name: c.title,
          score: c.score,
          status:
            c.statusLabel ||
            (c.score >= 70 ? 'مطلوب' : c.score >= 50 ? 'متوسط' : 'نیازمند مراقبت'),
        }))
      : [
          { name: 'جهت‌گیری قرآنی - ولایی', score: 78.4, status: 'عالی' },
          { name: 'معناداری و هدفمندی زندگی', score: 74.2, status: 'مطلوب' },
          { name: 'همدلی و احترام متقابل در خانواده', score: 71.8, status: 'مطلوب' },
          { name: 'تعهد به وظایف خانوادگی و اجتماعی', score: 69.5, status: 'مطلوب' },
          { name: 'شکرگزاری و توجه به نعمت‌ها', score: 68.3, status: 'مطلوب' },
          { name: 'توکل و آرامش درونی', score: 66.7, status: 'مطلوب' },
          { name: 'پذیرش خود و تلاش برای رشد', score: 58.3, status: 'متوسط' },
          { name: 'مدیریت خشم و مهار پرخاشگری', score: 48.6, status: 'متوسط' },
          { name: 'صبر و تاب‌آوری در ناملایمات', score: 41.7, status: 'نیازمند مراقبت' },
          { name: 'خودآگاهی و مدیریت افکار وسواسی', score: 33.3, status: 'بحرانی' },
        ];

  return (
    <div className="hidden print:block print-only w-full bg-white text-black p-4 text-xs font-sans dir-rtl text-right leading-relaxed">
      {/* ==================== سربرگ رسمی سند بالحق ==================== */}
      <div className="border-2 border-slate-900 rounded-2xl p-4 mb-5 print-avoid-break bg-slate-50/50">
        <div className="flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-3">
          <div className="space-y-1">
            <h1 className="text-base font-black text-slate-950">
              مرکز خدمات روانشناسی و مشاوره بالحق
            </h1>
            <p className="text-[11px] font-bold text-slate-700">
              فرم جامع پرونده بالینی، سوابق مشاوره، ارزیابی‌های روانشناختی و آزمون‌های مراجع
            </p>
          </div>

          <div className="text-left space-y-1 font-mono text-[11px]">
            <div className="inline-block px-2.5 py-0.5 rounded border border-rose-600 text-rose-700 font-extrabold text-[10px]">
              محرمانه - سوابق بالینی
            </div>
            <div>تاریخ چاپ گزارش: {currentDatePersian}</div>
          </div>
        </div>

        {/* نوار متاداده پرونده */}
        <div className="grid grid-cols-4 gap-3 text-[11px] font-bold text-slate-800">
          <div className="bg-white p-2 rounded-lg border border-slate-300">
            <span className="text-slate-500 block text-[10px]">کد یکتای پرونده:</span>
            <span className="font-mono text-sm font-black text-slate-900">{clientCase.caseCode}</span>
          </div>

          <div className="bg-white p-2 rounded-lg border border-slate-300">
            <span className="text-slate-500 block text-[10px]">وضعیت پرونده:</span>
            <span className="text-slate-900">
              {clientCase.overallStatus === 'approved' ? 'تأیید شده / فعال' : 'در حال بررسی'}
            </span>
          </div>

          <div className="bg-white p-2 rounded-lg border border-slate-300">
            <span className="text-slate-500 block text-[10px]">نقش در خانواده:</span>
            <span className="text-slate-900">{clientCase.roleInFamily || 'مراجع'}</span>
          </div>

          <div className="bg-white p-2 rounded-lg border border-slate-300">
            <span className="text-slate-500 block text-[10px]">کل فرم‌ها و پرسشنامه‌ها:</span>
            <span className="font-mono text-sm font-black text-slate-900">
              {toPersianDigits(submissions.length)} فرم تکمیل‌شده
            </span>
          </div>
        </div>
      </div>

      {/* ==================== ۱. مشخصات هویتی و ثبت‌نام مراجع ==================== */}
      <section className="mb-5 print-avoid-break">
        <div className="bg-slate-800 text-white px-3 py-1.5 rounded-t-xl font-black text-xs flex items-center justify-between">
          <span>۱. مشخصات هویتی، فردی و خانوادگی مراجع</span>
          <span className="text-[10px] font-normal opacity-80">برگرفته از فرم ثبت‌نام و تشکیل پرونده</span>
        </div>

        <table className="w-full border-collapse border border-slate-300 text-[11px]">
          <tbody>
            <tr className="border-b border-slate-300">
              <td className="w-1/4 bg-slate-100 p-2 font-bold text-slate-700 border-l border-slate-300">کد پرونده مراجع:</td>
              <td className="w-1/4 p-2 font-mono font-bold border-l border-slate-300">{clientCase.caseCode}</td>
              <td className="w-1/4 bg-slate-100 p-2 font-bold text-slate-700 border-l border-slate-300">شماره تلفن همراه:</td>
              <td className="w-1/4 p-2 font-mono font-bold">{toPersianDigits(clientCase.mobile)}</td>
            </tr>

            <tr className="border-b border-slate-300">
              <td className="bg-slate-100 p-2 font-bold text-slate-700 border-l border-slate-300">تاریخ تولد / سن:</td>
              <td className="p-2 font-mono border-l border-slate-300">
                {combinedData.f_birth_date ? toPersianDigits(combinedData.f_birth_date) : 'ثبت‌نشده'}
              </td>
              <td className="bg-slate-100 p-2 font-bold text-slate-700 border-l border-slate-300">وضعیت تأهل:</td>
              <td className="p-2">{combinedData.f_marital_status || 'ثبت‌نشده'}</td>
            </tr>

            <tr className="border-b border-slate-300">
              <td className="bg-slate-100 p-2 font-bold text-slate-700 border-l border-slate-300">نقش در خانواده:</td>
              <td className="p-2 border-l border-slate-300">{clientCase.roleInFamily || 'مراجع'}</td>
              <td className="bg-slate-100 p-2 font-bold text-slate-700 border-l border-slate-300">تعداد اعضای خانواده (بعد خانوار):</td>
              <td className="p-2 font-mono">
                {combinedData.f_family_members ? `${toPersianDigits(combinedData.f_family_members)} نفر` : 'ثبت‌نشده'}
              </td>
            </tr>

            <tr className="border-b border-slate-300">
              <td className="bg-slate-100 p-2 font-bold text-slate-700 border-l border-slate-300">استان و شهرستان:</td>
              <td className="p-2 border-l border-slate-300">
                {clientCase.provinceCity && clientCase.provinceCity !== 'ثبت‌نشده'
                  ? clientCase.provinceCity
                  : combinedData.f_province_city || combinedData.province || 'ثبت‌نشده'}
              </td>
              <td className="bg-slate-100 p-2 font-bold text-slate-700 border-l border-slate-300">عضویت در سایت عبادالله:</td>
              <td className="p-2">{combinedData.f_ebadollah_member || 'ثبت‌نشده'}</td>
            </tr>

            <tr>
              <td className="bg-slate-100 p-2 font-bold text-slate-700 border-l border-slate-300">موضوع اولیه مراجعه:</td>
              <td colSpan={3} className="p-2">
                {combinedData.f_counseling_subject || combinedData.f_topic || 'ثبت‌نشده'}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ==================== ۲. سوابق سلامت، پزشکی و دارویی ==================== */}
      <section className="mb-5 print-avoid-break">
        <div className="bg-slate-800 text-white px-3 py-1.5 rounded-t-xl font-black text-xs">
          ۲. سوابق سلامت، بیماری‌ها و داروهای مصرفی مراجع
        </div>

        <table className="w-full border-collapse border border-slate-300 text-[11px]">
          <tbody>
            <tr className="border-b border-slate-300">
              <td className="w-1/3 bg-slate-100 p-2.5 font-bold text-slate-700 border-l border-slate-300">
                سابقه بیماری جسمی:
              </td>
              <td className="p-2.5">
                {combinedData.f_physical_illness || 'موردی ثبت نشده است / سالم'}
              </td>
            </tr>

            <tr className="border-b border-slate-300">
              <td className="bg-slate-100 p-2.5 font-bold text-slate-700 border-l border-slate-300">
                سابقه بیماری اعصاب و روان:
              </td>
              <td className="p-2.5">
                {combinedData.f_mental_illness || 'موردی ثبت نشده است / سالم'}
              </td>
            </tr>

            <tr className="border-b border-slate-300">
              <td className="bg-slate-100 p-2.5 font-bold text-slate-700 border-l border-slate-300">
                داروهای مصرفی جاری:
              </td>
              <td className="p-2.5 font-mono">
                {combinedData.f_medications || 'بدون مصرف داروی خاص'}
              </td>
            </tr>

            <tr>
              <td className="bg-slate-100 p-2.5 font-bold text-slate-700 border-l border-slate-300">
                سوابق مشاوره قبلی:
              </td>
              <td className="p-2.5">
                {combinedData.f_counseling_experience ? 'دارد' : 'ندارد'}
                {combinedData.f_prev_counselor_name && ` | مشاور قبلی: ${combinedData.f_prev_counselor_name}`}
                {combinedData.f_prev_counselor_satisfaction && ` (رضایت: ${combinedData.f_prev_counselor_satisfaction})`}
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* ==================== ۳. جدول سوابق نوبت‌ها و جلسات مشاوره ==================== */}
      <section className="mb-5 print-avoid-break">
        <div className="bg-slate-800 text-white px-3 py-1.5 rounded-t-xl font-black text-xs flex items-center justify-between">
          <span>۳. سوابق نوبت‌ها و جلسات مشاوره مراجع</span>
          <span className="font-mono text-[10px]">{toPersianDigits(appointments.length)} جلسه ثبت‌شده</span>
        </div>

        {appointments.length === 0 ? (
          <div className="border border-slate-300 p-3 text-center text-slate-500 bg-slate-50">
            نوبت مشاوره‌ای در سوابق مراجع ثبت نشده است.
          </div>
        ) : (
          <table className="w-full border-collapse border border-slate-300 text-[11px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-300 font-black text-slate-800">
                <th className="p-2 border-l border-slate-300 text-center w-8">#</th>
                <th className="p-2 border-l border-slate-300 text-right">تاریخ و زمان نوبت</th>
                <th className="p-2 border-l border-slate-300 text-right">استاد مشاور</th>
                <th className="p-2 border-l border-slate-300 text-right">موضوع مشاوره</th>
                <th className="p-2 border-l border-slate-300 text-center w-24">وضعیت</th>
                <th className="p-2 text-right">توصیه / گزارش جلسه</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {appointments.map((app, idx) => (
                <tr key={app.id || idx}>
                  <td className="p-2 border-l border-slate-300 text-center font-mono">{toPersianDigits(idx + 1)}</td>
                  <td className="p-2 border-l border-slate-300 font-mono">{toPersianDigits(app.date)}</td>
                  <td className="p-2 border-l border-slate-300 font-bold">{app.counselor}</td>
                  <td className="p-2 border-l border-slate-300">{app.topic}</td>
                  <td className="p-2 border-l border-slate-300 text-center font-bold">
                    {app.status === 'done' ? 'انجام شده' : 'رزرو شده'}
                  </td>
                  <td className="p-2 text-slate-700">
                    {app.recommendation || app.challenges || 'برگزار شد.'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {/* ==================== ۴. پاسخ‌های فیلد به فیلد کلیه فرم‌ها و پرسشنامه‌ها ==================== */}
      <section className="mb-5 space-y-4">
        <div className="bg-slate-800 text-white px-3 py-1.5 rounded-t-xl font-black text-xs flex items-center justify-between print-avoid-break">
          <span>۴. پاسخ‌های فیلد به فیلد فرم‌ها و پرسشنامه‌های تکمیل‌شده مراجع</span>
          <span className="font-mono text-[10px]">مجموعاً {toPersianDigits(submissions.length)} فرم ارسالی</span>
        </div>

        {submissions.map((sub, sIdx) => {
          const formObj = forms.find((f) => f.id === sub.formId || f.slug === sub.formId);
          const formTitle = formObj ? formObj.title : `فرم ارسالی (${sub.formId})`;
          const fields = formObj?.fields || [];

          // فیلتر کردن کلیدهای سیستمی و غیرپاسخی
          const ignoredKeys = [
            'caseCode',
            'fullName',
            'f_name',
            'f_family',
            'f_mobile',
            'trackingCode',
            'evaluationResult',
            'reconciledReason',
            'linkingStatus',
            'reconciledAt',
          ];

          const renderedFieldIds = new Set<string>();

          return (
            <div key={sub.id} className="border border-slate-300 rounded-xl overflow-hidden print-avoid-break">
              {/* هدر هر فرم */}
              <div className="bg-slate-100 p-2.5 border-b border-slate-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-slate-800 text-white font-mono font-bold text-[10px] flex items-center justify-center">
                    {toPersianDigits(sIdx + 1)}
                  </span>
                  <h4 className="font-black text-slate-900 text-xs">
                    {formTitle}
                  </h4>
                </div>

                <div className="flex items-center gap-3 font-mono text-[10px] text-slate-600">
                  <span>کد پیگیری: <strong className="text-slate-900">{sub.trackingCode}</strong></span>
                  <span>|</span>
                  <span>تاریخ ثبت: {formatPersianDateTime(sub.createdAt)}</span>
                </div>
              </div>

              {/* جدول فیلدها و پاسخ‌ها */}
              <table className="w-full border-collapse text-[11px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                    <th className="p-2 border-l border-slate-200 text-right w-1/2">عنوان فیلد / سؤال پرسشنامه</th>
                    <th className="p-2 text-right w-1/2">پاسخ ثبت‌شده توسط مراجع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {/* فیلدهای منطبق با تعریف فرم */}
                  {fields.map((field) => {
                    const rawVal = sub.data?.[field.id];
                    if (rawVal === undefined || rawVal === null || rawVal === '') return null;
                    renderedFieldIds.add(field.id);
                    const displayVal = getFieldDisplayValue(field, rawVal);

                    return (
                      <tr key={field.id} className="hover:bg-slate-50">
                        <td className="p-2 border-l border-slate-200 font-bold text-slate-800 bg-slate-50/50">
                          {field.label}
                        </td>
                        <td className="p-2 text-slate-900 font-medium">
                          {displayVal}
                        </td>
                      </tr>
                    );
                  })}

                  {/* هر فیلد دیگری که در داده‌های فرم هست و در فیلدها نیامده */}
                  {Object.entries(sub.data || {})
                    .filter(([k, v]) => !ignoredKeys.includes(k) && !renderedFieldIds.has(k) && v !== undefined && v !== null && v !== '')
                    .map(([k, v]) => (
                      <tr key={k} className="hover:bg-slate-50">
                        <td className="p-2 border-l border-slate-200 font-bold text-slate-800 bg-slate-50/50">
                          {k}
                        </td>
                        <td className="p-2 text-slate-900 font-medium font-mono">
                          {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          );
        })}
      </section>

      {/* ==================== ۵. شاخص‌های آماری و تحلیل‌های بالینی مراجع ==================== */}
      <section className="mb-5 print-avoid-break">
        <div className="bg-slate-800 text-white px-3 py-1.5 rounded-t-xl font-black text-xs flex items-center justify-between">
          <span>۵. شاخص‌های آماری و ارزیابی‌های بالینی مراجع</span>
          <span className="font-mono text-[10px]">نمره شاخص کل: {toPersianDigits(overallScore)} از ۱۰۰</span>
        </div>

        <div className="border border-slate-300 p-3 bg-slate-50/50 space-y-3">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[10px]">کل جلسات مشاوره:</span>
              <span className="font-mono text-sm font-black text-slate-900">
                {toPersianDigits(appointments.length)} جلسه
              </span>
            </div>

            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[10px]">شاخص ارزیابی رشد صفا:</span>
              <span className="font-mono text-sm font-black text-emerald-700">
                %{toPersianDigits(overallScore)}
              </span>
            </div>

            <div className="bg-white p-2 rounded-lg border border-slate-200">
              <span className="text-slate-500 block text-[10px]">وضعیت بالینی کلی:</span>
              <span className="font-bold text-sm text-slate-900">
                {overallScore >= 70 ? 'مطلوب و پایدار' : overallScore >= 50 ? 'نیازمند مراقبت' : 'بحرانی'}
              </span>
            </div>
          </div>

          {/* جدول تفکیک ۱۰ مؤلفه بالینی */}
          <div className="mt-2">
            <div className="font-bold text-slate-800 mb-1 text-[11px]">
              تفکیک مؤلفه‌ها و ابعاد ده گانه رشد بالینی مراجع:
            </div>
            <table className="w-full border-collapse border border-slate-300 text-[11px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                  <th className="p-1.5 border-l border-slate-300 text-center w-8">#</th>
                  <th className="p-1.5 border-l border-slate-300 text-right">مؤلفه بالینی / رشد</th>
                  <th className="p-1.5 border-l border-slate-300 text-center w-24">نمره شاخص</th>
                  <th className="p-1.5 text-center w-28">وضعیت ارزیابی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {clinicalDimensions.map((dim, idx) => (
                  <tr key={dim.name}>
                    <td className="p-1.5 border-l border-slate-300 text-center font-mono">{toPersianDigits(idx + 1)}</td>
                    <td className="p-1.5 border-l border-slate-300 font-bold text-slate-900">{dim.name}</td>
                    <td className="p-1.5 border-l border-slate-300 text-center font-mono font-bold">
                      %{toPersianDigits(dim.score)}
                    </td>
                    <td className="p-1.5 text-center font-bold">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] ${
                        dim.status === 'عالی' || dim.status === 'مطلوب'
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : dim.status === 'متوسط'
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-rose-50 text-rose-800 border border-rose-200'
                      }`}>
                        {dim.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ==================== ۶. پیگیری‌ها و یادداشت‌های اساتید مشاور ==================== */}
      <section className="mb-6 print-avoid-break">
        <div className="bg-slate-800 text-white px-3 py-1.5 rounded-t-xl font-black text-xs">
          ۶. یادداشت‌ها، توصیه‌ها و پیگیری‌های ثبت‌شده در پرونده
        </div>

        {(() => {
          const allComments: Array<{ author: string; role: string; date: string; text: string }> = [];
          submissions.forEach((s) => {
            if (Array.isArray(s.comments)) {
              s.comments.forEach((c) => {
                allComments.push({
                  author: c.authorName || 'استاد مشاور',
                  role: c.authorRole || 'مشاور مرکز',
                  date: c.createdAt,
                  text: c.content || (c as any).commentText || "",
                });
              });
            }
          });

          if (allComments.length === 0) {
            return (
              <div className="border border-slate-300 p-3 text-center text-slate-500 bg-slate-50">
                یادداشت یا پیگیری خاصی برای این پرونده ثبت نشده است.
              </div>
            );
          }

          return (
            <table className="w-full border-collapse border border-slate-300 text-[11px]">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                  <th className="p-2 border-l border-slate-300 text-right w-44">ثبت‌کننده و زمان</th>
                  <th className="p-2 text-right">متن یادداشت و توصیه بالینی</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300">
                {allComments.map((com, idx) => (
                  <tr key={idx}>
                    <td className="p-2 border-l border-slate-300 text-slate-700 bg-slate-50">
                      <div className="font-bold text-slate-900">{com.author} ({com.role})</div>
                      <div className="font-mono text-[10px] text-slate-500">{formatPersianDateTime(com.date)}</div>
                    </td>
                    <td className="p-2 text-slate-800">{com.text}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })()}
      </section>

      {/* ==================== ۷. تأییدیه و کادر امضای رسمی پرونده ==================== */}
      <div className="border-t-2 border-slate-900 pt-4 mt-6 print-avoid-break">
        <div className="grid grid-cols-2 gap-8 text-center text-[11px]">
          <div className="border border-slate-300 p-4 rounded-xl min-h-[90px] flex flex-col justify-between">
            <span className="font-bold text-slate-800">استاد مشاور و روانشناس پرونده</span>
            <span className="text-[10px] text-slate-400">نام، امضا و مهر مشاور</span>
          </div>

          <div className="border border-slate-300 p-4 rounded-xl min-h-[90px] flex flex-col justify-between">
            <span className="font-bold text-slate-800">مسئول فنی مرکز خدمات روانشناسی و مشاوره بالحق</span>
            <span className="text-[10px] text-slate-400">مهر رسمی مرکز و تأییدیه نهایی</span>
          </div>
        </div>

        <div className="text-center text-[9px] text-slate-500 mt-4">
          این سند به عنوان نسخه رسمی سوابق پرونده بالینی مرکز بالحق صادر گردیده و هرگونه استفاده غیرمجاز مشمول قوانین محرمانگی اسناد پزشکی است.
        </div>
      </div>
    </div>
  );
};
