import { Form, FormSubmission } from '@/types/form';
import { formatPersianDateTime, getFieldDisplayValue, toPersianDigits } from '@/lib/persian';

/**
 * ایجاد خروجی اکسل استاندارد با فرمت CSV همراه با بایت اردر مارک (UTF-8 BOM)
 * سازگاری کامل ۱۰۰٪ با تمامی نسخه‌های مایکروسافت اکسل در ویندوز و مک بدون به‌هم‌ریختگی حروف فارسی
 */
export function exportFormSubmissionsToCSV(form: Form, submissions: FormSubmission[]) {
  if (!submissions || submissions.length === 0) {
    alert('پاسخی برای استخراج وجود ندارد.');
    return;
  }

  // فیلدهای معتبر که ورودی کاربر را ذخیره می‌کنند (به جز جداکننده‌ها و هشدارهای متنی)
  const dataFields = form.fields.filter(
    (f) => !['sectionDivider', 'alertBox', 'richText', 'pdfEmbed', 'videoEmbed'].includes(f.type)
  );

  // عناوین ستون‌های فایل اکسل
  const headers = [
    'ردیف',
    'کد پیگیری / پرونده',
    'نام و نام خانوادگی',
    'تاریخ و ساعت ثبت',
    'وضعیت بررسی',
    ...dataFields.map((f) => f.label || f.id),
    'وضعیت پرداخت',
    'مبلغ پرداختی (تومان)',
    'نتیجه آزمون (درصد و قبولی)',
  ];

  const escapeCSV = (str: any) => {
    if (str === null || str === undefined) return '';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = submissions.map((sub, index) => {
    const fullName =
      sub.data.fullName ||
      sub.data.f_fullname ||
      sub.data.q_fullname ||
      sub.data.f_buyer_name ||
      'نامشخص';

    const statusTranslations: Record<string, string> = {
      new: 'جدید',
      reviewing: 'در حال بررسی',
      approved: 'تأیید شده',
      rejected: 'رد شده',
      archived: 'بایگانی',
    };

    const paymentStatusText =
      sub.paymentStatus === 'paid'
        ? 'پرداخت شده (موفق)'
        : sub.paymentStatus === 'pending'
        ? 'در انتظار پرداخت'
        : sub.paymentStatus === 'failed'
        ? 'ناموفق'
        : 'بدون پرداخت';

    const quizText = sub.quizResult
      ? `${sub.quizResult.score}٪ (${sub.quizResult.passed ? 'قبول' : 'مردود'} - ${sub.quizResult.correctCount} از ${sub.quizResult.answersCount})`
      : 'ندارد';

    const fieldValues = dataFields.map((field) => {
      const rawVal = sub.data[field.id];
      if (rawVal === undefined || rawVal === null) return '-';
      return getFieldDisplayValue(field, rawVal);
    });

    return [
      escapeCSV(index + 1),
      escapeCSV(sub.trackingCode || `FA-${sub.id.slice(-6)}`),
      escapeCSV(fullName),
      escapeCSV(formatPersianDateTime(sub.createdAt)),
      escapeCSV(statusTranslations[sub.status] || sub.status),
      ...fieldValues.map(escapeCSV),
      escapeCSV(paymentStatusText),
      escapeCSV(sub.paymentAmount ? sub.paymentAmount.toLocaleString('en-US') : '0'),
      escapeCSV(quizText),
    ].join(',');
  });

  const BOM = '\uFEFF';
  const csvContent = BOM + [headers.map(escapeCSV).join(','), ...rows].join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeTitle = (form.title || 'فرم').replace(/[\/\\:*?"<>|]/g, '_').trim();
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `گزارش_پاسخ‌های_${safeTitle}_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * ایجاد خروجی اکسل پیشرفته جدول‌دار HTML/XLS با استایل‌دهی و راست‌چین
 */
export function exportFormSubmissionsToXLS(form: Form, submissions: FormSubmission[]) {
  if (!submissions || submissions.length === 0) {
    alert('پاسخی برای استخراج وجود ندارد.');
    return;
  }

  const dataFields = form.fields.filter(
    (f) => !['sectionDivider', 'alertBox', 'richText', 'pdfEmbed', 'videoEmbed'].includes(f.type)
  );

  const headers = [
    'ردیف',
    'کد پیگیری',
    'نام و نام خانوادگی',
    'تاریخ ثبت',
    'وضعیت',
    ...dataFields.map((f) => f.label || f.id),
    'پرداخت',
    'مبلغ (تومان)',
    'نتیجه آزمون',
  ];

  const statusTranslations: Record<string, string> = {
    new: 'جدید',
    reviewing: 'در حال بررسی',
    approved: 'تأیید شده',
    rejected: 'رد شده',
    archived: 'بایگانی',
  };

  const rowsHtml = submissions
    .map((sub, index) => {
      const fullName =
        sub.data.fullName ||
        sub.data.f_fullname ||
        sub.data.q_fullname ||
        sub.data.f_buyer_name ||
        'نامشخص';

      const fieldCells = dataFields
        .map((field) => {
          const rawVal = sub.data[field.id];
          const val = rawVal !== undefined && rawVal !== null ? getFieldDisplayValue(field, rawVal) : '-';
          return `<td style="border: 1px solid #cbd5e1; padding: 8px; text-align: right;">${val}</td>`;
        })
        .join('');

      const quizText = sub.quizResult
        ? `${toPersianDigits(sub.quizResult.score)}٪ (${sub.quizResult.passed ? 'قبول' : 'مردود'})`
        : '-';

      const paymentText = sub.paymentStatus === 'paid' ? 'موفق' : 'ندارد';
      const paymentAmountText = sub.paymentAmount ? toPersianDigits(sub.paymentAmount.toLocaleString('en-US')) : '۰';

      return `
        <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f8fafc'};">
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${toPersianDigits(index + 1)}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold; text-align: center;">${sub.trackingCode}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; font-weight: bold;">${fullName}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px;">${formatPersianDateTime(sub.createdAt)}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${statusTranslations[sub.status] || sub.status}</td>
          ${fieldCells}
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${paymentText}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${paymentAmountText}</td>
          <td style="border: 1px solid #cbd5e1; padding: 8px; text-align: center;">${quizText}</td>
        </tr>
      `;
    })
    .join('');

  const headersHtml = headers
    .map(
      (h) =>
        `<th style="background-color: #0284c7; color: #ffffff; border: 1px solid #0369a1; padding: 10px; font-weight: bold; text-align: center;">${h}</th>`
    )
    .join('');

  const htmlContent = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>${(form.title || 'گزارش').slice(0, 30)}</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayRightToLeft/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          body { font-family: Tahoma, Arial, sans-serif; direction: rtl; }
          table { border-collapse: collapse; width: 100%; }
        </style>
      </head>
      <body>
        <div style="font-family: Tahoma, Arial; direction: rtl; padding: 15px;">
          <h2 style="color: #0f172a; margin-bottom: 4px;">گزارش جامع پاسخ‌های دریافتی: ${form.title}</h2>
          <p style="color: #64748b; font-size: 12px; margin-top: 0;">تاریخ تهیه گزارش: ${formatPersianDateTime(new Date().toISOString())} | تعداد کل رکوردها: ${toPersianDigits(submissions.length)} پاسخ</p>
          <table>
            <thead>
              <tr>${headersHtml}</tr>
            </thead>
            <tbody>
              ${rowsHtml}
            </tbody>
          </table>
        </div>
      </body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const safeTitle = (form.title || 'فرم').replace(/[\/\\:*?"<>|]/g, '_').trim();
  const dateStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('href', url);
  link.setAttribute('download', `گزارش_رسمی_${safeTitle}_${dateStr}.xls`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
