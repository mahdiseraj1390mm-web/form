import ExcelJS from 'exceljs';
import { Form, FormSubmission } from '@/types/form';
import { formatPersianDateTime, getFieldDisplayValue } from '@/lib/persian';

// تنظیمات فونت رسمی بی لوتوس برای کلیه خانه‌ها
const FONT_NAME = 'B Lotus';

// تنظیمات خطوط حاشیه ظریف و شیک برای جدول‌ها
const BORDER_STYLE: Partial<ExcelJS.Borders> = {
  top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
};

export interface ClientCaseGroupExport {
  caseCode: string;
  fullName: string;
  mobile: string;
  provinceCity: string;
  submissions: FormSubmission[];
  formTitles: string[];
  totalFormsCount: number;
  latestDate: string;
  overallStatus: string;
  totalPaidAmount: number;
  roleInFamily?: string;
}

/**
 * ذخیره و ایجاد خودکار دانلود فایل اکسل در مرورگر
 */
async function saveWorkbook(workbook: ExcelJS.Workbook, fileName: string) {
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

const STATUS_TRANSLATIONS: Record<string, string> = {
  new: 'جدید',
  reviewing: 'در حال بررسی',
  approved: 'تأیید شده',
  rejected: 'رد شده',
  archived: 'بایگانی',
};

const PAYMENT_STATUS_TRANSLATIONS: Record<string, string> = {
  paid: 'پرداخت شده (موفق)',
  pending: 'در انتظار پرداخت',
  failed: 'ناموفق',
  none: 'بدون پرداخت',
};

/**
 * اعمال استایل عمومی سلول با فونت B Lotus
 */
function applyCellStyle(
  cell: ExcelJS.Cell,
  options: {
    fontName?: string;
    fontSize?: number;
    bold?: boolean;
    colorArgb?: string;
    bgColorArgb?: string;
    alignH?: 'left' | 'center' | 'right';
    alignV?: 'top' | 'middle' | 'bottom';
    wrapText?: boolean;
    hasBorder?: boolean;
  }
) {
  cell.font = {
    name: options.fontName || FONT_NAME,
    size: options.fontSize || 11,
    bold: options.bold || false,
    color: options.colorArgb ? { argb: options.colorArgb } : { argb: 'FF0F172A' },
  };

  if (options.bgColorArgb) {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: options.bgColorArgb },
    };
  }

  cell.alignment = {
    horizontal: options.alignH || 'right',
    vertical: options.alignV || 'middle',
    wrapText: options.wrapText !== false,
  };

  if (options.hasBorder !== false) {
    cell.border = BORDER_STYLE;
  }
}

/**
 * خروجی اکسل پیشرفته XLSX برای ارسالی‌های یک فرم خاص
 * همراه با فونت B Lotus، رنگ‌بندی حرفه‌ای، راست‌چین و خطوط تمیز
 */
export async function exportFormSubmissionsToXLSX(form: Form, submissions: FormSubmission[]) {
  if (!submissions || submissions.length === 0) {
    alert('پاسخی برای استخراج وجود ندارد.');
    return;
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'سامانه هوشمند بالحق';
  workbook.lastModifiedBy = 'مدیریت بالحق';
  workbook.created = new Date();

  const safeSheetName = (form.title || 'پاسخ‌ها')
    .slice(0, 31)
    .replace(/[\/\\:*?\[\]]/g, '_');

  const worksheet = workbook.addWorksheet(safeSheetName, {
    views: [{ rightToLeft: true }],
  });

  // فیلدهای معتبر که محتوای ورودی دارند
  const dataFields = (form.fields || []).filter(
    (f) => !['sectionDivider', 'alertBox', 'richText', 'pdfEmbed', 'videoEmbed'].includes(f.type)
  );

  // تعریف ستون‌های اصلی
  const columns: Array<{
    header: string;
    key: string;
    width: number;
    align: 'left' | 'center' | 'right';
  }> = [
    { header: 'ردیف', key: 'rowNum', width: 9, align: 'center' },
    { header: 'کد پیگیری / پرونده', key: 'trackingCode', width: 22, align: 'center' },
    { header: 'نام و نام خانوادگی', key: 'fullName', width: 26, align: 'right' },
    { header: 'تاریخ و ساعت ثبت', key: 'createdAt', width: 22, align: 'center' },
    { header: 'وضعیت بررسی', key: 'status', width: 16, align: 'center' },
    ...dataFields.map((f) => ({
      header: f.label || f.id,
      key: `field_${f.id}`,
      width: Math.min(Math.max((f.label || f.id).length * 2, 18), 45),
      align: 'right' as const,
    })),
    { header: 'وضعیت پرداخت', key: 'paymentStatus', width: 18, align: 'center' },
    { header: 'مبلغ پرداختی (تومان)', key: 'paymentAmount', width: 22, align: 'center' },
    { header: 'نتیجه آزمون', key: 'quizResult', width: 24, align: 'center' },
  ];

  const totalCols = columns.length;

  // سطر ۱: عنوان اصلی شیک سرمه‌ای
  const titleRow = worksheet.addRow([`گزارش جامع پاسخ‌های دریافتی: ${form.title || 'فرم'}`]);
  worksheet.mergeCells(1, 1, 1, totalCols);
  titleRow.height = 38;
  applyCellStyle(worksheet.getCell(1, 1), {
    fontSize: 14,
    bold: true,
    colorArgb: 'FFFFFFFF',
    bgColorArgb: 'FF1E3A8A', // سرمه‌ای تیره رسمی
    alignH: 'center',
    alignV: 'middle',
  });

  // سطر ۲: اطلاعات متا و مشخصات سامانه
  const metaText = `مرکز مشاوره و روانشناسی بالحق   |   تاریخ صدور گزارش: ${formatPersianDateTime(new Date().toISOString())}   |   تعداد کل رکوردها: ${submissions.length} پاسخ دریافتی`;
  const metaRow = worksheet.addRow([metaText]);
  worksheet.mergeCells(2, 1, 2, totalCols);
  metaRow.height = 24;
  applyCellStyle(worksheet.getCell(2, 1), {
    fontSize: 10,
    colorArgb: 'FF334155',
    bgColorArgb: 'FFF1F5F9', // طوسی بسیار ملایم
    alignH: 'center',
    alignV: 'middle',
  });

  // سطر ۳: سربرگ‌های ستون‌ها (آبی با نوشته سفید)
  const headerRow = worksheet.addRow(columns.map((c) => c.header));
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    applyCellStyle(cell, {
      fontSize: 11,
      bold: true,
      colorArgb: 'FFFFFFFF',
      bgColorArgb: 'FF1E40AF', // آبی رسمی
      alignH: 'center',
      alignV: 'middle',
      wrapText: true,
    });
  });

  // سطرهای داده با رنگ‌بندی متناوب (یک در میان)
  submissions.forEach((sub, index) => {
    const fullName =
      sub.data.fullName ||
      sub.data.f_fullname ||
      sub.data.q_fullname ||
      sub.data.f_buyer_name ||
      'نامشخص';

    const quizText = sub.quizResult
      ? `${sub.quizResult.score}٪ (${sub.quizResult.passed ? 'قبول' : 'مردود'} - ${sub.quizResult.correctCount} از ${sub.quizResult.answersCount})`
      : 'ندارد';

    const rowData: Record<string, any> = {
      rowNum: index + 1,
      trackingCode: sub.trackingCode || `FA-${sub.id.slice(-6)}`,
      fullName,
      createdAt: formatPersianDateTime(sub.createdAt),
      status: STATUS_TRANSLATIONS[sub.status] || sub.status,
      paymentStatus: PAYMENT_STATUS_TRANSLATIONS[sub.paymentStatus || 'none'] || 'بدون پرداخت',
      paymentAmount: sub.paymentAmount ? Number(sub.paymentAmount).toLocaleString('fa-IR') : '۰',
      quizResult: quizText,
    };

    dataFields.forEach((field) => {
      const rawVal = sub.data[field.id];
      rowData[`field_${field.id}`] =
        rawVal !== undefined && rawVal !== null ? getFieldDisplayValue(field, rawVal) : '-';
    });

    const values = columns.map((c) => rowData[c.key]);
    const row = worksheet.addRow(values);
    row.height = 26;

    const isEven = index % 2 === 0;
    const bgArgb = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    row.eachCell((cell, colNumber) => {
      const colDef = columns[colNumber - 1];
      applyCellStyle(cell, {
        fontSize: 11,
        colorArgb: 'FF0F172A',
        bgColorArgb: bgArgb,
        alignH: colDef?.align || 'right',
        alignV: 'middle',
      });

      // کد رهگیری برجسته
      if (colDef?.key === 'trackingCode') {
        cell.font = { name: FONT_NAME, size: 11, bold: true, color: { argb: 'FF1D4ED8' } };
      }

      // وضعیت بررسی با رنگ اختصاصی
      if (colDef?.key === 'status') {
        if (sub.status === 'approved') {
          cell.font = { name: FONT_NAME, size: 11, bold: true, color: { argb: 'FF15803D' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
        } else if (sub.status === 'rejected') {
          cell.font = { name: FONT_NAME, size: 11, bold: true, color: { argb: 'FFB91C1C' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEE2E2' } };
        } else if (sub.status === 'reviewing') {
          cell.font = { name: FONT_NAME, size: 11, bold: true, color: { argb: 'FFB45309' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        } else if (sub.status === 'new') {
          cell.font = { name: FONT_NAME, size: 11, bold: true, color: { argb: 'FF1E40AF' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDBEAFE' } };
        }
      }

      // وضعیت پرداخت موفق
      if (colDef?.key === 'paymentStatus' && sub.paymentStatus === 'paid') {
        cell.font = { name: FONT_NAME, size: 11, bold: true, color: { argb: 'FF0D9488' } };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFCCFBF1' } };
      }
    });
  });

  // ست کردن عرض ستون‌ها
  worksheet.columns = columns.map((col) => ({
    key: col.key,
    width: col.width,
  }));

  const safeTitle = (form.title || 'فرم').replace(/[\/\\:*?"<>|]/g, '_').trim();
  const dateStr = new Date().toISOString().slice(0, 10);
  await saveWorkbook(workbook, `گزارش_پاسخ‌های_${safeTitle}_${dateStr}.xlsx`);
}

/**
 * خروجی اکسل XLSX برای کارتابل پرونده‌های مراجعین
 */
export async function exportClientCasesToXLSX(cases: ClientCaseGroupExport[]) {
  if (!cases || cases.length === 0) {
    alert('پرونده‌ای برای استخراج وجود ندارد.');
    return;
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'سامانه هوشمند بالحق';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('کارتابل مراجعین', {
    views: [{ rightToLeft: true }],
  });

  const columns: Array<{
    header: string;
    key: string;
    width: number;
    align: 'left' | 'center' | 'right';
  }> = [
    { header: 'ردیف', key: 'rowNum', width: 9, align: 'center' },
    { header: 'کد پرونده', key: 'caseCode', width: 20, align: 'center' },
    { header: 'نام و نام خانوادگی مراجع', key: 'fullName', width: 26, align: 'right' },
    { header: 'شماره همراه', key: 'mobile', width: 18, align: 'center' },
    { header: 'نقش در خانواده', key: 'roleInFamily', width: 18, align: 'center' },
    { header: 'استان / شهر', key: 'provinceCity', width: 18, align: 'center' },
    { header: 'تعداد فرم‌ها', key: 'totalFormsCount', width: 16, align: 'center' },
    { header: 'عناوین فرم‌های تکمیل‌شده', key: 'formTitles', width: 38, align: 'right' },
    { header: 'تاریخ آخرین ثبت / مراجعه', key: 'latestDate', width: 22, align: 'center' },
    { header: 'وضعیت پرونده', key: 'overallStatus', width: 16, align: 'center' },
    { header: 'مجموع پرداختی (تومان)', key: 'totalPaidAmount', width: 22, align: 'center' },
  ];

  const totalCols = columns.length;

  // سطر ۱: عنوان اصلی شیک
  const titleRow = worksheet.addRow(['کارتابل جامع پرونده‌های مراجعین - مرکز مشاوره و خدمات روانشناختی بالحق']);
  worksheet.mergeCells(1, 1, 1, totalCols);
  titleRow.height = 38;
  applyCellStyle(worksheet.getCell(1, 1), {
    fontSize: 14,
    bold: true,
    colorArgb: 'FFFFFFFF',
    bgColorArgb: 'FF0F172A', // اسلیت تیره
    alignH: 'center',
    alignV: 'middle',
  });

  // سطر ۲: متا
  const metaText = `تاریخ تهیه گزارش: ${formatPersianDateTime(new Date().toISOString())}   |   تعداد پرونده‌های منتخب: ${cases.length} پرونده   |   نرم‌افزار جامع بالحق`;
  const metaRow = worksheet.addRow([metaText]);
  worksheet.mergeCells(2, 1, 2, totalCols);
  metaRow.height = 24;
  applyCellStyle(worksheet.getCell(2, 1), {
    fontSize: 10,
    colorArgb: 'FF334155',
    bgColorArgb: 'FFF1F5F9',
    alignH: 'center',
    alignV: 'middle',
  });

  // سطر ۳: سربرگ‌ها
  const headerRow = worksheet.addRow(columns.map((c) => c.header));
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    applyCellStyle(cell, {
      fontSize: 11,
      bold: true,
      colorArgb: 'FFFFFFFF',
      bgColorArgb: 'FF0284C7', // فیروزه‌ای / اسکای پررنگ
      alignH: 'center',
      alignV: 'middle',
      wrapText: true,
    });
  });

  // سطرهای پرونده‌ها
  cases.forEach((c, index) => {
    const rowValues = [
      index + 1,
      c.caseCode,
      c.fullName,
      c.mobile,
      c.roleInFamily || '-',
      c.provinceCity,
      c.totalFormsCount,
      c.formTitles.join('، '),
      formatPersianDateTime(c.latestDate),
      STATUS_TRANSLATIONS[c.overallStatus] || c.overallStatus,
      c.totalPaidAmount ? Number(c.totalPaidAmount).toLocaleString('fa-IR') : '۰',
    ];

    const row = worksheet.addRow(rowValues);
    row.height = 26;
    const isEven = index % 2 === 0;
    const bgArgb = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    row.eachCell((cell, colNumber) => {
      const colDef = columns[colNumber - 1];
      applyCellStyle(cell, {
        fontSize: 11,
        colorArgb: 'FF0F172A',
        bgColorArgb: bgArgb,
        alignH: colDef?.align || 'center',
        alignV: 'middle',
      });

      if (colDef?.key === 'caseCode') {
        cell.font = { name: FONT_NAME, size: 11, bold: true, color: { argb: 'FF0284C7' } };
      }
      if (colDef?.key === 'fullName') {
        cell.font = { name: FONT_NAME, size: 11, bold: true, color: { argb: 'FF0F172A' } };
      }
      if (colDef?.key === 'overallStatus') {
        if (c.overallStatus === 'approved') {
          cell.font = { name: FONT_NAME, size: 11, bold: true, color: { argb: 'FF15803D' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
        } else if (c.overallStatus === 'reviewing') {
          cell.font = { name: FONT_NAME, size: 11, bold: true, color: { argb: 'FFB45309' } };
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
        }
      }
    });
  });

  worksheet.columns = columns.map((col) => ({
    key: col.key,
    width: col.width,
  }));

  const dateStr = new Date().toISOString().slice(0, 10);
  await saveWorkbook(workbook, `کارتابل_پرونده‌های_بالحق_${dateStr}.xlsx`);
}

/**
 * خروجی اکسل XLSX برای لیست عمومی کل پاسخ‌ها
 */
export async function exportSubmissionsListToXLSX(
  submissions: FormSubmission[],
  forms: Form[],
  titlePrefix = 'بانک_پاسخ‌های_سامانه'
) {
  if (!submissions || submissions.length === 0) {
    alert('پاسخی برای استخراج وجود ندارد.');
    return;
  }

  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'سامانه هوشمند بالحق';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('پاسخ‌های دریافتی', {
    views: [{ rightToLeft: true }],
  });

  const columns: Array<{
    header: string;
    key: string;
    width: number;
    align: 'left' | 'center' | 'right';
  }> = [
    { header: 'ردیف', key: 'rowNum', width: 9, align: 'center' },
    { header: 'کد پیگیری', key: 'trackingCode', width: 22, align: 'center' },
    { header: 'عنوان فرم', key: 'formTitle', width: 32, align: 'right' },
    { header: 'نام و نام خانوادگی مراجع', key: 'fullName', width: 24, align: 'right' },
    { header: 'تاریخ ثبت', key: 'createdAt', width: 22, align: 'center' },
    { header: 'وضعیت بررسی', key: 'status', width: 16, align: 'center' },
    { header: 'وضعیت پرداخت', key: 'paymentStatus', width: 18, align: 'center' },
    { header: 'مبلغ (تومان)', key: 'paymentAmount', width: 22, align: 'center' },
  ];

  const totalCols = columns.length;

  // سطر ۱: عنوان
  const titleRow = worksheet.addRow(['بانک جامع پاسخ‌های دریافتی - مرکز مشاوره و روانشناسی بالحق']);
  worksheet.mergeCells(1, 1, 1, totalCols);
  titleRow.height = 38;
  applyCellStyle(worksheet.getCell(1, 1), {
    fontSize: 14,
    bold: true,
    colorArgb: 'FFFFFFFF',
    bgColorArgb: 'FF1E293B',
    alignH: 'center',
    alignV: 'middle',
  });

  // سطر ۲: متا
  const metaText = `تاریخ تهیه خروجی: ${formatPersianDateTime(new Date().toISOString())}   |   تعداد کل پاسخ‌ها: ${submissions.length} مورد`;
  const metaRow = worksheet.addRow([metaText]);
  worksheet.mergeCells(2, 1, 2, totalCols);
  metaRow.height = 24;
  applyCellStyle(worksheet.getCell(2, 1), {
    fontSize: 10,
    colorArgb: 'FF334155',
    bgColorArgb: 'FFF1F5F9',
    alignH: 'center',
    alignV: 'middle',
  });

  // سطر ۳: سربرگ‌ها
  const headerRow = worksheet.addRow(columns.map((c) => c.header));
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    applyCellStyle(cell, {
      fontSize: 11,
      bold: true,
      colorArgb: 'FFFFFFFF',
      bgColorArgb: 'FF334155',
      alignH: 'center',
      alignV: 'middle',
      wrapText: true,
    });
  });

  const formMap = new Map(forms.map((f) => [f.id, f.title]));

  submissions.forEach((sub, index) => {
    const formTitle = formMap.get(sub.formId) || 'فرم عمومی';
    const fullName =
      sub.data.fullName ||
      sub.data.f_fullname ||
      sub.data.q_fullname ||
      sub.data.f_buyer_name ||
      'نامشخص';

    const rowValues = [
      index + 1,
      sub.trackingCode || `FA-${sub.id.slice(-6)}`,
      formTitle,
      fullName,
      formatPersianDateTime(sub.createdAt),
      STATUS_TRANSLATIONS[sub.status] || sub.status,
      PAYMENT_STATUS_TRANSLATIONS[sub.paymentStatus || 'none'] || 'بدون پرداخت',
      sub.paymentAmount ? Number(sub.paymentAmount).toLocaleString('fa-IR') : '۰',
    ];

    const row = worksheet.addRow(rowValues);
    row.height = 26;
    const isEven = index % 2 === 0;
    const bgArgb = isEven ? 'FFFFFFFF' : 'FFF8FAFC';

    row.eachCell((cell, colNumber) => {
      const colDef = columns[colNumber - 1];
      applyCellStyle(cell, {
        fontSize: 11,
        colorArgb: 'FF0F172A',
        bgColorArgb: bgArgb,
        alignH: colDef?.align || 'center',
        alignV: 'middle',
      });

      if (colDef?.key === 'trackingCode') {
        cell.font = { name: FONT_NAME, size: 11, bold: true, color: { argb: 'FF2563EB' } };
      }
    });
  });

  worksheet.columns = columns.map((col) => ({
    key: col.key,
    width: col.width,
  }));

  const dateStr = new Date().toISOString().slice(0, 10);
  await saveWorkbook(workbook, `${titlePrefix}_${dateStr}.xlsx`);
}

/**
 * خروجی اکسل کامل پرونده یک مراجع خاص شامل دو شیت: مشخصات پرونده و جزئیات پاسخ‌های فرم‌ها
 */
export async function exportSingleClientDossierToXLSX(
  clientCase: ClientCaseGroupExport,
  forms: Form[]
) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'سامانه هوشمند بالحق';
  workbook.created = new Date();

  // برگه ۱: مشخصات هویتی و خلاصه پرونده
  const summarySheet = workbook.addWorksheet('مشخصات پرونده', {
    views: [{ rightToLeft: true }],
  });

  const summaryTitleRow = summarySheet.addRow([`خلاصه پرونده مراجع: ${clientCase.fullName} (${clientCase.caseCode})`]);
  summarySheet.mergeCells(1, 1, 1, 4);
  summaryTitleRow.height = 38;
  applyCellStyle(summarySheet.getCell(1, 1), {
    fontSize: 14,
    bold: true,
    colorArgb: 'FFFFFFFF',
    bgColorArgb: 'FF0F172A',
    alignH: 'center',
    alignV: 'middle',
  });

  const profileItems = [
    ['کد پرونده:', clientCase.caseCode, 'وضعیت کلی پرونده:', STATUS_TRANSLATIONS[clientCase.overallStatus] || clientCase.overallStatus],
    ['نام و نام خانوادگی:', clientCase.fullName, 'شماره همراه:', clientCase.mobile],
    ['نقش در خانواده:', clientCase.roleInFamily || 'نامشخص', 'استان / شهر:', clientCase.provinceCity],
    ['تعداد فرم‌های تکمیل‌شده:', clientCase.totalFormsCount, 'مجموع مبالغ پرداختی:', `${Number(clientCase.totalPaidAmount || 0).toLocaleString('fa-IR')} تومان`],
    ['تاریخ آخرین ارسالی / نوبت:', formatPersianDateTime(clientCase.latestDate), 'عناوین فرم‌ها:', clientCase.formTitles.join('، ')],
  ];

  profileItems.forEach((item, idx) => {
    const row = summarySheet.addRow(item);
    row.height = 28;
    const isEven = idx % 2 === 0;
    const bgArgb = isEven ? 'FFF8FAFC' : 'FFFFFFFF';

    [1, 3].forEach((colIdx) => {
      applyCellStyle(row.getCell(colIdx), {
        fontSize: 11,
        bold: true,
        colorArgb: 'FF1E293B',
        bgColorArgb: 'FFE2E8F0',
        alignH: 'right',
        alignV: 'middle',
      });
    });

    [2, 4].forEach((colIdx) => {
      applyCellStyle(row.getCell(colIdx), {
        fontSize: 11,
        colorArgb: 'FF0F172A',
        bgColorArgb: bgArgb,
        alignH: 'right',
        alignV: 'middle',
      });
    });
  });

  summarySheet.columns = [
    { width: 22 },
    { width: 32 },
    { width: 22 },
    { width: 36 },
  ];

  // برگه ۲: لیست کامل فرم‌ها و پاسخ‌های این مراجع
  const responsesSheet = workbook.addWorksheet('فرم‌های تکمیل‌شده', {
    views: [{ rightToLeft: true }],
  });

  const respColumns = [
    { header: 'ردیف', width: 9 },
    { header: 'عنوان فرم', width: 30 },
    { header: 'کد پیگیری', width: 20 },
    { header: 'تاریخ ثبت', width: 22 },
    { header: 'وضعیت بررسی', width: 18 },
    { header: 'پرداخت', width: 18 },
    { header: 'مبلغ (تومان)', width: 18 },
    { header: 'نتیجه آزمون', width: 20 },
  ];

  const respTitleRow = responsesSheet.addRow([`پاسخ‌های ثبت‌شده مراجع «${clientCase.fullName}»`]);
  responsesSheet.mergeCells(1, 1, 1, respColumns.length);
  respTitleRow.height = 36;
  applyCellStyle(responsesSheet.getCell(1, 1), {
    fontSize: 13,
    bold: true,
    colorArgb: 'FFFFFFFF',
    bgColorArgb: 'FF0284C7',
    alignH: 'center',
    alignV: 'middle',
  });

  const respHeaderRow = responsesSheet.addRow(respColumns.map((c) => c.header));
  respHeaderRow.height = 30;
  respHeaderRow.eachCell((cell) => {
    applyCellStyle(cell, {
      fontSize: 11,
      bold: true,
      colorArgb: 'FFFFFFFF',
      bgColorArgb: 'FF0369A1',
      alignH: 'center',
      alignV: 'middle',
    });
  });

  const formMap = new Map(forms.map((f) => [f.id, f.title]));

  clientCase.submissions.forEach((sub, idx) => {
    const quizText = sub.quizResult
      ? `${sub.quizResult.score}٪ (${sub.quizResult.passed ? 'قبول' : 'مردود'})`
      : 'ندارد';

    const row = responsesSheet.addRow([
      idx + 1,
      formMap.get(sub.formId) || 'فرم',
      sub.trackingCode,
      formatPersianDateTime(sub.createdAt),
      STATUS_TRANSLATIONS[sub.status] || sub.status,
      PAYMENT_STATUS_TRANSLATIONS[sub.paymentStatus || 'none'] || 'بدون پرداخت',
      sub.paymentAmount ? Number(sub.paymentAmount).toLocaleString('fa-IR') : '۰',
      quizText,
    ]);
    row.height = 26;

    const bgArgb = idx % 2 === 0 ? 'FFFFFFFF' : 'FFF8FAFC';
    row.eachCell((cell, colNum) => {
      applyCellStyle(cell, {
        fontSize: 11,
        colorArgb: 'FF0F172A',
        bgColorArgb: bgArgb,
        alignH: colNum === 2 ? 'right' : 'center',
        alignV: 'middle',
      });
    });
  });

  responsesSheet.columns = respColumns.map((col) => ({ width: col.width }));

  const safeName = clientCase.fullName.replace(/[\/\\:*?"<>|]/g, '_').trim();
  const dateStr = new Date().toISOString().slice(0, 10);
  await saveWorkbook(workbook, `پرونده_${safeName}_${clientCase.caseCode}_${dateStr}.xlsx`);
}

// برای سازگاری کامل با کدهای قبلی
export const exportFormSubmissionsToCSV = exportFormSubmissionsToXLSX;
