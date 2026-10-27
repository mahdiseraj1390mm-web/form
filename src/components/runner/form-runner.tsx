'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Form, FormField, FormSubmission } from '@/types/form';
import { useForm } from '@/context/form-context';
import { 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  ArrowRight, 
  ArrowLeft, 
  Printer, 
  RotateCcw, 
  CreditCard, 
  Timer, 
  Award, 
  Smartphone, 
  PenTool, 
  UploadCloud, 
  Mic, 
  Calendar, 
  Clock, 
  Check, 
  QrCode,
  ShieldCheck,
  FileCheck2,
  ThumbsUp,
  MapPin,
  Crop,
  Video,
  FileText,
  Download,
  Trash2,
  RefreshCw,
  Loader2,
  Eye,
  X,
  PhoneCall,
  CalendarDays,
  KeyRound,
  User,
  UserPlus,
  FolderLock,
  Copy,
  ExternalLink,
  HelpCircle,
  Home,
  LogIn,
  LogOut,
  FileEdit,
  ChevronLeft,
  Search,
  Sparkles
} from 'lucide-react';
import { 
  isValidIranianNationalCode, 
  isValidIranianMobile, 
  toPersianDigits, 
  toEnglishDigits,
  formatCurrency, 
  formatPersianDateTime,
  generateCaseCode,
  getFieldDisplayValue
} from '@/lib/persian';
import { extractBookingDetails } from '@/lib/belhagh-sms-helper';
import { iranProvinces } from '@/lib/iran-geo';
import { PaymentModal } from './payment-modal';
import { AppointmentScheduler } from './appointment-scheduler';

interface FormRunnerProps {
  form: Form;
  onBackToStudio?: () => void;
  onNavigateToForm?: (formIdOrSlug: string, initialData?: Record<string, any>) => void;
  initialFormData?: Record<string, any>;
}

interface UploadedFileRecord {
  name: string;
  size: number;
  formattedSize: string;
  type: string;
  dataUrl?: string;
}

const RealFileUploadField: React.FC<{
  field: FormField;
  value: any;
  onChange: (val: any) => void;
  error?: string;
}> = ({ field, value, onChange, error }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [localError, setLocalError] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const isImageField = field.type === 'imageUpload' || field.type === 'photoCrop';
  const acceptTypes = isImageField
    ? 'image/jpeg,image/png,image/webp,image/gif,image/svg+xml'
    : (field.validations?.pattern || '*/*');

  const fileData: UploadedFileRecord | null = useMemo(() => {
    if (!value) return null;
    if (typeof value === 'object' && value.name) return value;
    if (typeof value === 'string') {
      return {
        name: value,
        size: 0,
        formattedSize: '',
        type: isImageField ? 'image/png' : 'application/octet-stream',
        dataUrl: value.startsWith('data:') ? value : undefined,
      };
    }
    return null;
  }, [value, isImageField]);

  const formatSize = (bytes: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${toPersianDigits(bytes)} بایت`;
    if (bytes < 1024 * 1024) return `${toPersianDigits(Math.round(bytes / 1024))} کیلوبایت`;
    return `${toPersianDigits((bytes / (1024 * 1024)).toFixed(1))} مگابایت`;
  };

  const processFile = (file: File) => {
    setLocalError(null);
    const maxSizeBytes = (field.validations?.max ? field.validations.max : 20) * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      setLocalError(`حجم فایل بیشتر از سقف مجاز (${toPersianDigits(field.validations?.max || 20)} مگابایت) است.`);
      return;
    }

    if (isImageField && !file.type.startsWith('image/')) {
      setLocalError('لطفاً یک فایل تصویری معتبر انتخاب کنید.');
      return;
    }

    setUploadProgress(20);
    const interval = setInterval(() => {
      setUploadProgress((prev) => {
        if (prev === null) return 20;
        if (prev >= 85) {
          clearInterval(interval);
          return 85;
        }
        return prev + 25;
      });
    }, 70);

    const reader = new FileReader();
    reader.onload = (e) => {
      clearInterval(interval);
      setUploadProgress(100);
      setTimeout(() => {
        setUploadProgress(null);
        const record: UploadedFileRecord = {
          name: file.name,
          size: file.size,
          formattedSize: formatSize(file.size),
          type: file.type,
          dataUrl: e.target?.result as string,
        };
        onChange(record);
      }, 200);
    };
    reader.onerror = () => {
      clearInterval(interval);
      setUploadProgress(null);
      setLocalError('خطا در خواندن فایل.');
    };
    reader.readAsDataURL(file);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-2">
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptTypes}
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.[0]) processFile(e.target.files[0]);
        }}
      />

      {uploadProgress !== null && (
        <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/70 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-blue-900">
            <span className="flex items-center gap-1.5">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
              <span>در حال بارگذاری فایل...</span>
            </span>
            <span>{toPersianDigits(uploadProgress)}٪</span>
          </div>
          <div className="w-full bg-blue-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-200"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {uploadProgress === null && fileData ? (
        <div className="p-3 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 overflow-hidden">
            {fileData.dataUrl && fileData.type.startsWith('image/') ? (
              <div 
                onClick={() => setPreviewOpen(true)}
                className="w-12 h-12 rounded-lg overflow-hidden border border-emerald-300 shrink-0 cursor-pointer hover:opacity-90 relative group"
                title="مشاهده تصویر بزرگ"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={fileData.dataUrl} alt={fileData.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <Eye className="w-4 h-4 text-white" />
                </div>
              </div>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
            )}
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-slate-800 truncate" title={fileData.name}>
                {fileData.name}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-[11px] text-emerald-800 font-medium">
                {fileData.formattedSize && <span>{fileData.formattedSize}</span>}
                <span className="flex items-center gap-0.5 text-emerald-700 font-bold">
                  <CheckCircle2 className="w-3 h-3" />
                  بارگذاری شد
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {fileData.dataUrl && (
              <a
                href={fileData.dataUrl}
                download={fileData.name}
                className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                title="دانلود فایل"
              >
                <Download className="w-4 h-4" />
              </a>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
              title="تغییر فایل"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleClear}
              className="p-1.5 text-rose-600 hover:text-rose-700 hover:bg-rose-100 rounded-lg transition-colors"
              title="حذف فایل"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : uploadProgress === null && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
          }}
          className={`border-2 border-dashed rounded-xl p-4 sm:p-5 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-blue-500 bg-blue-50/70 scale-[0.99]'
              : 'border-slate-300 hover:border-blue-400 bg-slate-50/60 hover:bg-blue-50/30'
          }`}
        >
          <UploadCloud className="w-7 h-7 text-blue-600 mx-auto mb-1.5" />
          <span className="text-xs font-bold text-slate-800 block">
            {isImageField
              ? 'انتخاب تصویر یا کشیدن عکس به این بخش'
              : 'کلیک کنید یا فایل را اینجا بکشید و رها کنید'}
          </span>
          <span className="text-[10px] text-slate-500 mt-1 block">
            {isImageField
              ? 'فرمت‌های مجاز: JPG, PNG, WEBP, GIF (حداکثر ۲۰ مگابایت)'
              : 'فرمت‌های مجاز: PDF, Word, Excel, ZIP, تصاویر (حداکثر ۲۰ مگابایت)'}
          </span>
          <span className="mt-2.5 inline-block px-3 py-1 text-[11px] font-bold bg-white text-blue-600 border border-blue-200 rounded-lg hover:bg-blue-50 shadow-2xs pointer-events-none">
            انتخاب فایل از سیستم
          </span>
        </div>
      )}

      {previewOpen && fileData?.dataUrl && (
        <div
          onClick={() => setPreviewOpen(false)}
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 backdrop-blur-xs"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl max-w-2xl max-h-[90vh] overflow-hidden p-3 shadow-2xl relative flex flex-col"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800">{fileData.name}</span>
              <button
                type="button"
                onClick={() => setPreviewOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={fileData.dataUrl} alt={fileData.name} className="max-h-[75vh] object-contain rounded-lg" />
          </div>
        </div>
      )}

      {localError && (
        <div className="text-[11px] text-rose-600 font-bold flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{localError}</span>
        </div>
      )}
    </div>
  );
};

// کامپوننت ورود و انتخاب تاریخ شمسی با امکان ورود دستی و بدون اجبار مقادیر پیش‌فرض
const JalaliDateFieldInput: React.FC<{
  field: FormField;
  value: any;
  onChange: (val: string) => void;
  hasError?: boolean;
}> = ({ field, value, onChange, hasError }) => {
  const parseValue = (val: any) => {
    if (!val || typeof val !== 'string') return { y: '', m: '', d: '' };
    const clean = toEnglishDigits(val).trim();
    const parts = clean.split('/');
    if (parts.length === 3) {
      return { y: parts[0] || '', m: parts[1] || '', d: parts[2] || '' };
    }
    return { y: '', m: '', d: '' };
  };

  const [isManualInput, setIsManualInput] = useState(false);
  const [manualText, setManualText] = useState(String(value || ''));

  const currentParts = parseValue(value);
  const [day, setDay] = useState(currentParts.d);
  const [month, setMonth] = useState(currentParts.m);
  const [year, setYear] = useState(currentParts.y);

  useEffect(() => {
    const p = parseValue(value);
    setDay(p.d);
    setMonth(p.m);
    setYear(p.y);
    setManualText(String(value || ''));
  }, [value]);

  const handleUpdate = (newY: string, newM: string, newD: string) => {
    setYear(newY);
    setMonth(newM);
    setDay(newD);
    if (newY && newM && newD) {
      const cleanY = toEnglishDigits(newY.trim());
      const cleanM = toEnglishDigits(newM.trim()).padStart(2, '0');
      const cleanD = toEnglishDigits(newD.trim()).padStart(2, '0');
      const combined = `${cleanY}/${cleanM}/${cleanD}`;
      onChange(combined);
      setManualText(combined);
    } else {
      const cleanY = newY ? toEnglishDigits(newY.trim()) : '';
      const cleanM = newM ? toEnglishDigits(newM.trim()).padStart(2, '0') : '';
      const cleanD = newD ? toEnglishDigits(newD.trim()).padStart(2, '0') : '';
      if (cleanY || cleanM || cleanD) {
        onChange(`${cleanY}/${cleanM}/${cleanD}`);
      } else {
        onChange('');
      }
    }
  };

  const handleDirectManualText = (txt: string) => {
    setManualText(txt);
    const clean = toEnglishDigits(txt.trim());
    onChange(clean);
    const p = parseValue(clean);
    if (p.y && p.m && p.d) {
      setYear(p.y);
      setMonth(p.m);
      setDay(p.d);
    }
  };

  const isCompleteDate = Boolean(year && month && day && year.length === 4);

  return (
    <div className="space-y-2">
      {/* سوییچ بین ورود دستی مستقیم و انتخابگر منویی */}
      <div className="flex items-center justify-between text-[11px] pb-0.5">
        <span className="text-slate-500 font-medium">
          {isManualInput ? 'حالت: تایپ مستقیم و دستی تاریخ' : 'حالت: انتخاب ۳ بخشی (روز / ماه / سال)'}
        </span>
        <button
          type="button"
          onClick={() => setIsManualInput(!isManualInput)}
          className="text-blue-600 hover:text-blue-800 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
        >
          {isManualInput ? (
            <>
              <Calendar className="w-3.5 h-3.5" />
              <span>انتخاب از منوی کشویی</span>
            </>
          ) : (
            <>
              <FileEdit className="w-3.5 h-3.5" />
              <span>تایپ مستقیم و دستی تاریخ</span>
            </>
          )}
        </button>
      </div>

      {isManualInput ? (
        /* حالت تایپ دستی مستقیم */
        <div>
          <input
            type="text"
            value={manualText}
            onChange={(e) => handleDirectManualText(e.target.value)}
            placeholder="مثال: ۱۳۷۸/۰۵/۲۴ یا 1378/05/24"
            dir="ltr"
            className={`w-full px-3 py-2 text-xs border rounded-md font-mono text-center focus:outline-none focus:ring-1 bg-white ${
              hasError ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-600'
            }`}
          />
          <p className="text-[10px] text-slate-400 mt-1">
            می‌توانید تاریخ تولد را با ارقام فارسی یا انگلیسی به همراه خط مورب (/) مستقیماً تایپ فرمایید.
          </p>
        </div>
      ) : (
        /* حالت انتخاب ۳ بخشی (بدون تحمیل پیش‌فرض خودکار) */
        <div className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            {/* ستون راست (RTL): روز */}
            <div>
              <select
                value={day}
                onChange={(e) => handleUpdate(year, month, e.target.value)}
                className={`w-full px-2 py-2 text-xs border rounded-md focus:outline-none focus:ring-1 bg-white text-slate-800 ${
                  hasError ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-600'
                }`}
              >
                <option value="">روز</option>
                {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={String(d).padStart(2, '0')}>
                    {toPersianDigits(d)}
                  </option>
                ))}
              </select>
            </div>

            {/* ستون وسط: ماه */}
            <div>
              <select
                value={month}
                onChange={(e) => handleUpdate(year, e.target.value, day)}
                className={`w-full px-2 py-2 text-xs border rounded-md focus:outline-none focus:ring-1 bg-white text-slate-800 ${
                  hasError ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-600'
                }`}
              >
                <option value="">ماه</option>
                {[
                  { val: '01', name: 'فروردین' },
                  { val: '02', name: 'اردیبهشت' },
                  { val: '03', name: 'خرداد' },
                  { val: '04', name: 'تیر' },
                  { val: '05', name: 'مرداد' },
                  { val: '06', name: 'شهریور' },
                  { val: '07', name: 'مهر' },
                  { val: '08', name: 'آبان' },
                  { val: '09', name: 'آذر' },
                  { val: '10', name: 'دی' },
                  { val: '11', name: 'بهمن' },
                  { val: '12', name: 'اسفند' },
                ].map((m) => (
                  <option key={m.val} value={m.val}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* ستون چپ: سال با امکان تایپ دستی مستقیم عدد سال و منوی کشویی */}
            <div>
              <input
                type="text"
                list={`years_${field.id}`}
                value={year}
                onChange={(e) => {
                  const clean = toEnglishDigits(e.target.value).replace(/\D/g, '').slice(0, 4);
                  handleUpdate(clean, month, day);
                }}
                placeholder="سال (تایپ یا انتخاب)"
                maxLength={4}
                dir="ltr"
                className={`w-full px-2 py-2 text-xs border rounded-md text-center font-mono focus:outline-none focus:ring-1 bg-white text-slate-800 ${
                  hasError ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-600'
                }`}
              />
              <datalist id={`years_${field.id}`}>
                {Array.from({ length: 85 }, (_, i) => 1403 - i).map((y) => (
                  <option key={y} value={String(y)}>
                    {toPersianDigits(y)}
                  </option>
                ))}
              </datalist>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 flex items-center justify-between">
            <span>نکته: سال تولد را می‌توانید مستقیماً با کیبورد در کادر سال تایپ فرمایید.</span>
          </div>
        </div>
      )}

      {/* برچسب تأییدیه تاریخ انتخاب شده فقط در صورت کامل بودن هر سه بخش */}
      {isCompleteDate && (
        <div className="text-[11px] text-blue-700 font-semibold bg-blue-50/70 py-1 px-2.5 rounded border border-blue-200/60 inline-flex items-center gap-1.5 animate-in fade-in">
          <Calendar className="w-3 h-3 text-blue-600" />
          <span>تاریخ انتخاب شده: {toPersianDigits(`${year}/${month.padStart(2, '0')}/${day.padStart(2, '0')}`)}</span>
        </div>
      )}
    </div>
  );
};

export const FormRunner: React.FC<FormRunnerProps> = ({ 
  form, 
  onBackToStudio,
  onNavigateToForm,
  initialFormData,
}) => {
  const { submitFormResponse, submissions } = useForm();
  const isBelhaghFamily = form.id.includes('belhagh') || form.slug === 'zexuz' || form.slug === '3uu4z';
  
  // استیت مقادیر فیلدها
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [internalPageIndex, setInternalPageIndex] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // استیت اعتبارسنجی پیامکی موبایل
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [enteredOtp, setEnteredOtp] = useState('');
  
  // استیت تایمر آزمون
  const [remainingSeconds, setRemainingSeconds] = useState(
    form.quiz.enabled && form.quiz.durationMinutes > 0 ? form.quiz.durationMinutes * 60 : 0
  );
  
  // استیت ضبط صدا
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [hasRecordedAudio, setHasRecordedAudio] = useState(false);

  // استیت وضعیت امضای دیجیتال
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // استیت قفل امنیتی فرم
  const [isPasswordUnlocked, setIsPasswordUnlocked] = useState(!form.security.passwordProtected);
  const [enteredPassword, setEnteredPassword] = useState('');
  const [passwordError, setPasswordError] = useState(false);
  
  // استیت درگاه پرداخت
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [calculatedAmount, setCalculatedAmount] = useState<number>(0);

  // استیت نتیجه ثبت موفق
  const [submittedResult, setSubmittedResult] = useState<FormSubmission | null>(null);

  const isCasePortalForm =
    form.generalSettings?.showPortalGate === true
      ? true
      : form.generalSettings?.showPortalGate === false
      ? false
      :
    (form.id === 'form-belhagh-registration' ||
      form.id === 'form-belhagh-booking' ||
      form.slug === 'zexuz' ||
      form.slug === '3uu4z' ||
      Boolean(form.security?.authRequired));

  // استیت‌های پورتال ورودی پرونده (ورود / ثبت نام / بازیابی کد)
  const [authGateMode, setAuthGateMode] = useState<'portal' | 'filling' | 'viewCase'>(
    isCasePortalForm ? 'portal' : 'filling'
  );
  const [isLoginBoxOpen, setIsLoginBoxOpen] = useState(false);
  const [caseCodeInput, setCaseCodeInput] = useState('');
  const [caseCodeError, setCaseCodeError] = useState<string | null>(null);
  const [activeCaseSubmission, setActiveCaseSubmission] = useState<FormSubmission | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // استیت بازیابی کد پرونده با شماره تلفن همراه
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotMobileInput, setForgotMobileInput] = useState('');
  const [forgotResult, setForgotResult] = useState<{
    found: boolean;
    caseCode?: string;
    message: string;
    sub?: FormSubmission;
  } | null>(null);

  // ثبت‌نام قبلی شناسایی‌شده در سامانه
  const [duplicateCaseInfo, setDuplicateCaseInfo] = useState<{
    exists: boolean;
    caseCode: string;
    name?: string;
    message: string;
  } | null>(null);

  // وضعیت ذخیره / کپی کد پرونده در کلیپ‌بورد
  const [copiedCodeToast, setCopiedCodeToast] = useState(false);

  // تابع ذخیره و چاپ هوشمند کد پرونده برای موبایل و دسکتاپ
  const handleSaveAndPrintCaseCode = async () => {
    const code = submittedResult?.trackingCode || '';
    if (!code) return;

    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(code);
      }
    } catch (e) {}

    setCopiedCodeToast(true);
    setTimeout(() => setCopiedCodeToast(false), 4000);

    // اشتراک‌گذاری نیتیو در موبایل (جهت ذخیره در واتساپ، پیامک، یادداشت‌ها)
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'کد پرونده سامانه روانشناسی بالحق',
          text: `کد پرونده اختصاصی شما در مرکز روانشناسی بالحق: ${code}\nجهت ورود به سامانه و دریافت نوبت مشاوره این کد را ذخیره داشته باشید.\nhttps://s.psy-belhagh.com/form/3uu4z`,
        });
        return;
      } catch (e) {}
    }

    // دستور چاپ در صورت اتصال به پرینتر یا مرورگر دسکتاپ
    if (typeof window !== 'undefined' && typeof window.print === 'function') {
      try {
        window.print();
      } catch (e) {}
    }
  };

  // زمان ورود به هر مرحله جهت جلوگیری از پرش و ثبت تصادفی ناشی از دابل‌کلیک در مرحله قبل
  const [stepEnteredAt, setStepEnteredAt] = useState<number>(Date.now());
  useEffect(() => {
    setStepEnteredAt(Date.now());
  }, [currentStepIndex]);

  // انتقال به فرم ثبت نام یا ورود به مراحل ثبت نام
  const handleStartRegistration = () => {
    const isReg = form.id === 'form-belhagh-registration' || form.slug === 'zexuz';
    if (isReg) {
      setAuthGateMode('filling');
      setCurrentStepIndex(0);
      setInternalPageIndex(0);
    } else {
      // هدایت خودکار به فرم ثبت نام در صورتی که مراجع در فرم دیگری است
      if (onNavigateToForm) {
        onNavigateToForm('zexuz');
      } else if (typeof window !== 'undefined') {
        window.location.href = '/form/zexuz';
      }
    }
  };

  // ورود به پرونده با کد پرونده
  const handleCaseLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setCaseCodeError(null);
    const cleanCode = toEnglishDigits(caseCodeInput.trim().toUpperCase());
    if (!cleanCode) {
      setCaseCodeError('لطفاً کد پرونده خود را وارد فرمایید.');
      return;
    }

    let found: any = null;

    // ۱. استعلام اول و مستقیم از دیتابیس ابری Neon (مرجع اصلی و قطعی پرونده‌ها)
    try {
      const res = await fetch(`/api/cases?code=${encodeURIComponent(cleanCode)}`);
      const json = await res.json();
      if (json.success && json.found && json.caseRecord) {
        const rec = json.caseRecord;
        found = {
          id: `case-${rec.id}`,
          formId: 'form-belhagh-registration',
          trackingCode: rec.case_code,
          status: 'approved',
          createdAt: rec.created_at,
          comments: [],
          data: {
            ...rec.data,
            f_name: rec.first_name || rec.data?.f_name || '',
            f_family: rec.last_name || rec.data?.f_family || '',
            f_mobile: rec.mobile || rec.data?.f_mobile || '',
            f_province_city: (rec.province && rec.city) ? `${rec.province} - ${rec.city}` : (rec.data?.f_province_city || ''),
            f_role_in_family: rec.data?.f_role_in_family || '',
            f_case_code: rec.case_code,
          },
        };
      }
    } catch (err) {
      console.warn('API case lookup error:', err);
    }

    // ۲. در صورت قطع ارتباط شبکه، بررسی در حافظه محلی به عنوان پشتیبان
    if (!found) {
      let allSubs = [...submissions];
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('formafzar_submissions');
          if (stored) allSubs = [...allSubs, ...JSON.parse(stored)];
          const storedCases = localStorage.getItem('belhagh_all_cases');
          if (storedCases) allSubs = [...allSubs, ...JSON.parse(storedCases)];
        } catch (err) {}
      }

      found = allSubs.find(
        (s) =>
          s.trackingCode?.toUpperCase() === cleanCode ||
          s.trackingCode?.toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanCode.replace(/[^A-Z0-9]/g, '')
      );
    }

    if (found) {
      setActiveCaseSubmission(found);
      setIsLoginBoxOpen(false);
      const caseCode = found.trackingCode;
      const prefilledData = {
        ...found.data,
        f_name: found.data?.f_name || found.data?.f_applicant_name || '',
        f_family: found.data?.f_family || '',
        f_mobile: found.data?.f_mobile || found.data?.mobile || '',
        f_province_city: found.data?.f_province_city || '',
        f_role_in_family: found.data?.f_role_in_family || '',
        f_case_code: caseCode,
      };

      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('belhagh_current_case_code', caseCode);
          localStorage.setItem('belhagh_active_case_data', JSON.stringify(prefilledData));
        } catch (err) {}
      }

      setFormData((prev) => ({
        ...prev,
        ...prefilledData,
      }));

      // انتقال مستقیم به صفحه نوبت‌دهی بدون نمایش صفحه میانی
      if (form.id === 'form-belhagh-booking' || form.slug === '3uu4z') {
        setAuthGateMode('filling');
        setCurrentStepIndex(0);
        setInternalPageIndex(0);
      } else {
        if (onNavigateToForm) {
          onNavigateToForm('3uu4z');
        } else if (typeof window !== 'undefined') {
          window.location.href = '/form/3uu4z';
        }
      }
    } else {
      setCaseCodeError('پرونده‌ای با این کد یافت نشد. لطفاً کد را بررسی کنید.');
    }
  };

  // بازیابی کد پرونده با شماره تلفن همراه
  const handleForgotLookup = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPhone = toEnglishDigits(forgotMobileInput.trim().replace(/\s+/g, ''));
    if (!cleanPhone || !isValidIranianMobile(cleanPhone)) {
      setForgotResult({
        found: false,
        message: 'لطفاً یک شماره همراه معتبر ۱۱ رقمی (شروع با ۰۹) وارد فرمایید.',
      });
      return;
    }

    let found: any = null;

    // ۱. استعلام اول و قطعی از دیتابیس ابری Neon (مرجع اصلی)
    try {
      const res = await fetch(`/api/cases?mobile=${encodeURIComponent(cleanPhone)}`);
      const json = await res.json();
      if (json.success && json.found && json.caseRecord) {
        const rec = json.caseRecord;
        found = {
          id: `case-${rec.id}`,
          formId: 'form-belhagh-registration',
          trackingCode: rec.case_code,
          status: 'approved',
          createdAt: rec.created_at,
          comments: [],
          data: {
            ...rec.data,
            f_name: rec.first_name || rec.data?.f_name || '',
            f_family: rec.last_name || rec.data?.f_family || '',
            f_mobile: rec.mobile || rec.data?.f_mobile || cleanPhone,
            f_province_city: (rec.province && rec.city) ? `${rec.province} - ${rec.city}` : (rec.data?.f_province_city || ''),
            f_role_in_family: rec.data?.f_role_in_family || '',
            f_case_code: rec.case_code,
          },
        };
      }
    } catch (err) {
      console.warn('API forgot lookup error:', err);
    }

    // ۲. در صورت قطع شبکه، بررسی به عنوان پشتیبان در حافظه محلی
    if (!found) {
      let allSubs = [...submissions];
      if (typeof window !== 'undefined') {
        try {
          const stored = localStorage.getItem('formafzar_submissions');
          if (stored) allSubs = [...allSubs, ...JSON.parse(stored)];
          const storedCases = localStorage.getItem('belhagh_all_cases');
          if (storedCases) allSubs = [...allSubs, ...JSON.parse(storedCases)];
        } catch (err) {}
      }

      found = allSubs.find((s) => {
        const subPhone = toEnglishDigits(String(s.data?.f_mobile || s.data?.mobile || s.data?.f_phone || '')).trim();
        return subPhone === cleanPhone || (subPhone.length >= 10 && cleanPhone.endsWith(subPhone));
      });
    }

    if (found && found.trackingCode) {
      // بروزرسانی حافظه محلی با کد معتبر دیتابیس
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('belhagh_current_case_code', found.trackingCode);
          localStorage.setItem('belhagh_active_case_data', JSON.stringify(found.data));
        } catch (err) {}
      }

      setForgotResult({
        found: true,
        caseCode: found.trackingCode,
        message: 'پرونده شما با موفقیت شناسایی شد! کد پرونده قبلی شما بازیابی گردید.',
        sub: found,
      });
    } else {
      setForgotResult({
        found: false,
        message: 'با این شماره همراه هیچ پرونده‌ای در سامانه یافت نشد.',
      });
    }
  };

  // لود مقادیر پیش‌فرض و مقادیر از پیش‌پر شده (از فرم ثبت نام قبلی)
  useEffect(() => {
    setSubmittedResult(null);
    setCurrentStepIndex(0);

    // ورود مستقیم به نوبت‌دهی در صورت وجود پرونده فعال از پیش ثبت‌شده
    if (typeof window !== 'undefined' && (form.id === 'form-belhagh-booking' || form.slug === '3uu4z')) {
      try {
        const storedCaseJson = localStorage.getItem('belhagh_active_case_data');
        if (storedCaseJson) {
          const caseData = JSON.parse(storedCaseJson);
          setFormData((prev) => ({
            ...prev,
            ...caseData,
            f_name: caseData.f_name || caseData.f_applicant_name || prev.f_name || '',
            f_family: caseData.f_family || prev.f_family || '',
            f_mobile: caseData.f_mobile || caseData.mobile || prev.f_mobile || '',
            f_province_city: caseData.f_province_city || prev.f_province_city || '',
            f_role_in_family: caseData.f_role_in_family || prev.f_role_in_family || '',
            f_case_code: caseData.f_case_code || caseData.caseCode,
          }));
          setAuthGateMode('filling');
        }
      } catch (err) {}
    }
    setInternalPageIndex(0);
    setErrors({});
    setOtpVerified(false);
    setOtpSent(false);
    setIsLoginBoxOpen(false);
    setCaseCodeError(null);

    const defaults: Record<string, any> = {};
    form.fields.forEach((f) => {
      if (f.defaultValue !== undefined) defaults[f.id] = f.defaultValue;
    });

    let prefilled: Record<string, any> = {};
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem('prefill_' + form.slug) || sessionStorage.getItem('prefill_' + form.id);
        if (stored) {
          prefilled = JSON.parse(stored);
        }
      } catch (e) {}
    }
    if (initialFormData) {
      prefilled = { ...prefilled, ...initialFormData };
    }

    // بازتوزیع خودکار مقادیر استان و شهرستان در صورت وجود در پیش‌پُرها
    form.fields.forEach((f) => {
      if (f.type === 'cascadingProvinceCity') {
        const val = prefilled[f.id];
        if (typeof val === 'string' && val.includes(' - ')) {
          const parts = val.split(' - ');
          const provName = parts[0]?.trim();
          const cityName = parts[1]?.trim();
          const pObj = iranProvinces.find((p) => p.name === provName || p.id === provName);
          if (pObj) {
            prefilled[`${f.id}_province`] = pObj.id;
            prefilled[`${f.id}_city`] = cityName;
          }
        }
      }
    });

    setFormData({ ...defaults, ...prefilled });
    if (Object.keys(prefilled).length > 0 || !isCasePortalForm) {
      setAuthGateMode('filling');
    }
  }, [form.id, form.slug, form.fields, initialFormData]);

  // بازیابی خودکار اطلاعات هویتی مراجع بر اساس کد پرونده در فرم نوبت‌دهی
  useEffect(() => {
    if (form.id !== 'form-belhagh-booking' && form.slug !== '3uu4z') return;
    const rawCode = formData.f_case_code;
    if (!rawCode || typeof rawCode !== 'string') return;
    const cleanCode = toEnglishDigits(rawCode.trim().toUpperCase());
    if (cleanCode.length < 5) return;

    if (formData.f_name && formData.f_mobile) return;

    let allSubs = [...submissions];
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('formafzar_submissions');
        if (stored) allSubs = [...allSubs, ...JSON.parse(stored)];
        const storedCases = localStorage.getItem('belhagh_all_cases');
        if (storedCases) allSubs = [...allSubs, ...JSON.parse(storedCases)];
      } catch (err) {}
    }

    const found = allSubs.find(
      (s) =>
        s.trackingCode?.toUpperCase() === cleanCode ||
        s.trackingCode?.toUpperCase().replace(/[^A-Z0-9]/g, '') === cleanCode.replace(/[^A-Z0-9]/g, '')
    );

    if (found && found.data) {
      setFormData((prev) => ({
        ...prev,
        f_name: found.data.f_name || found.data.f_applicant_name || prev.f_name || '',
        f_family: found.data.f_family || prev.f_family || '',
        f_mobile: found.data.f_mobile || found.data.mobile || prev.f_mobile || '',
        f_province_city: found.data.f_province_city || prev.f_province_city || '',
        f_role_in_family: found.data.f_role_in_family || prev.f_role_in_family || '',
      }));
    }
  }, [formData.f_case_code, form.id, form.slug, formData.f_name, formData.f_mobile, submissions]);

  const handleGoToNextChainedForm = () => {
    const targetSlug = form.behavior?.nextChainedForm?.formSlug || '3uu4z';
    const targetId = form.behavior?.nextChainedForm?.formId || 'form-belhagh-booking';

    const prefilledData: Record<string, any> = {};
    if (form.behavior?.nextChainedForm?.prefillMapping) {
      Object.entries(form.behavior.nextChainedForm.prefillMapping).forEach(([sourceKey, targetKey]) => {
        if (formData[sourceKey] !== undefined) {
          prefilledData[targetKey] = formData[sourceKey];
          if (formData[`${sourceKey}_province`]) {
            prefilledData[`${targetKey}_province`] = formData[`${sourceKey}_province`];
          }
          if (formData[`${sourceKey}_city`]) {
            prefilledData[`${targetKey}_city`] = formData[`${sourceKey}_city`];
          }
        }
      });
    }

    if (formData['f_name'] && !prefilledData['f_name']) prefilledData['f_name'] = formData['f_name'];
    if (formData['f_family'] && !prefilledData['f_family']) prefilledData['f_family'] = formData['f_family'];
    if (formData['f_mobile'] && !prefilledData['f_mobile']) prefilledData['f_mobile'] = formData['f_mobile'];
    if (formData['f_province_city'] && !prefilledData['f_province_city']) prefilledData['f_province_city'] = formData['f_province_city'];
    if (formData['f_role_in_family'] && !prefilledData['f_role_in_family']) prefilledData['f_role_in_family'] = formData['f_role_in_family'];

    const activeCode = submittedResult?.trackingCode || activeCaseSubmission?.trackingCode;
    if (activeCode) {
      prefilledData['f_case_code'] = activeCode;
    }

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('prefill_' + targetSlug, JSON.stringify(prefilledData));
        sessionStorage.setItem('prefill_' + targetId, JSON.stringify(prefilledData));
        if (activeCode) {
          localStorage.setItem('belhagh_current_case_code', activeCode);
        }
      } catch (e) {}
    }

    // پاکسازی کامل وضعیت ارسال فرم جاری
    setSubmittedResult(null);
    setCurrentStepIndex(0);
    setInternalPageIndex(0);
    setErrors({});

    if (onNavigateToForm) {
      onNavigateToForm(targetSlug || targetId, prefilledData);
    } else if (typeof window !== 'undefined') {
      window.location.href = '/form/' + targetSlug;
    }
  };

  // تایمر معکوس آزمون
  useEffect(() => {
    if (!form.quiz.enabled || remainingSeconds <= 0) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [form.quiz.enabled, remainingSeconds]);

  // محاسبه مبلغ پرداخت و فاکتور
  useEffect(() => {
    if (!form.payment.enabled) return;
    if (form.payment.type === 'fixed') {
      setCalculatedAmount(form.payment.fixedAmount || 0);
    } else {
      let total = 0;
      form.fields.forEach((f) => {
        const val = formData[f.id];
        if (val && f.options) {
          const selectedOpt = f.options.find((o) => o.value === val || o.id === val);
          if (selectedOpt && selectedOpt.price) {
            total += selectedOpt.price;
          }
        }
      });
      // اعمال مالیات بر ارزش افزوده در صورت وجود
      if (form.payment.taxPercent) {
        total = Math.round(total * (1 + form.payment.taxPercent / 100));
      }
      setCalculatedAmount(total);
    }
  }, [form.payment, formData, form.fields]);

  // ارزیابی شروط منطقی (نمایش/مخفی‌سازی فیلدها)
  const isFieldVisible = (fieldId: string): boolean => {
    const matchingRules = form.rules.filter(
      (r) =>
        r.targetFieldId === fieldId ||
        r.additionalTargetFieldId === fieldId ||
        r.targetFieldIds?.includes(fieldId)
    );
    if (matchingRules.length === 0) return true;

    const evalCondition = (rule: any) => {
      const sourceVal = formData[rule.sourceFieldId];
      const sourceField = form.fields.find((f) => f.id === rule.sourceFieldId);
      const selectedOption = sourceField?.options?.find(
        (opt) =>
          opt.value === sourceVal ||
          opt.label === sourceVal ||
          opt.id === sourceVal
      );

      const checkValMatch = (val: any, expected: any) => {
        if (val === undefined || val === null) return false;
        const sVal = String(val).trim();
        const sExp = String(expected).trim();
        if (sVal === sExp) return true;

        const aliases: Record<string, string[]> = {
          'بله': ['yes', 'بله'],
          'yes': ['yes', 'بله'],
          'خیر': ['no', 'خیر'],
          'no': ['no', 'خیر'],
          'پدر': ['father', 'پدر', 'پدر خانواده'],
          'مادر': ['mother', 'مادر', 'مادر خانواده'],
          'دختر': ['daughter', 'دختر', 'دختر خانواده'],
          'پسر': ['son', 'پسر', 'پسر خانواده'],
        };

        if (aliases[sVal] && aliases[sVal].includes(sExp)) return true;
        if (aliases[sExp] && aliases[sExp].includes(sVal)) return true;

        if (
          selectedOption &&
          (String(selectedOption.label).trim() === sExp ||
            String(selectedOption.value).trim() === sExp)
        ) {
          return true;
        }
        return false;
      };

      switch (rule.operator) {
        case 'equals':
          return checkValMatch(sourceVal, rule.value);
        case 'notEquals':
          return !checkValMatch(sourceVal, rule.value);
        case 'contains':
          return sourceVal && String(sourceVal).includes(rule.value);
        case 'isEmpty':
          return !sourceVal || sourceVal === '';
        case 'isNotEmpty':
          return !!sourceVal && sourceVal !== '';
        default:
          return false;
      }
    };

    const showRules = matchingRules.filter((r) => r.action === 'show');
    const hideRules = matchingRules.filter((r) => r.action === 'hide');

    if (showRules.length > 0) {
      const anyShowMatches = showRules.some(evalCondition);
      if (!anyShowMatches) return false;
    }

    if (hideRules.length > 0) {
      const anyHideMatches = hideRules.some(evalCondition);
      if (anyHideMatches) return false;
    }

    return true;
  };

  // بررسی شرط مجاز بودن دکمه «مرحله بعد» - دسترسی به تمام مراحل از جمله مرحله ۴ همواره مجاز است
  const canProceedToNextStep = useMemo(() => {
    return true;
  }, []);

  const handleFieldChange = (fieldId: string, val: any) => {
    setFormData((prev) => ({ ...prev, [fieldId]: val }));
    if (errors[fieldId]) {
      setErrors((prev) => {
        const cp = { ...prev };
        delete cp[fieldId];
        return cp;
      });
    }
  };

  // مدیریت رسم امضای دیجیتال روی Canvas
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#0f172a';
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    if (canvasRef.current) {
      const signatureDataUrl = canvasRef.current.toDataURL();
      const sigField = form.fields.find((f) => f.type === 'signature');
      if (sigField) handleFieldChange(sigField.id, signatureDataUrl);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    const sigField = form.fields.find((f) => f.type === 'signature');
    if (sigField) handleFieldChange(sigField.id, null);
  };

  // شبیه‌سازی ضبط صدا
  const handleToggleAudioRecord = (fieldId: string) => {
    if (!isRecordingAudio) {
      setIsRecordingAudio(true);
      setTimeout(() => {
        setIsRecordingAudio(false);
        setHasRecordedAudio(true);
        handleFieldChange(fieldId, 'voice_recording_1405.mp3');
      }, 3000);
    }
  };

  // اعتبارسنجی فیلدهای مرحله فعلی یا کل فرم
  const validateFields = (fieldsToValidate: FormField[]): boolean => {
    const newErrors: Record<string, string> = {};

    fieldsToValidate.forEach((f) => {
      if (!isFieldVisible(f.id)) return;

      const val = formData[f.id];

      // فیلد انتخاب استانی و شهری
      if (f.type === 'cascadingProvinceCity') {
        const prov = formData[`${f.id}_province`];
        const city = formData[`${f.id}_city`];
        if (f.validations?.required) {
          if (!prov || prov === '') {
            newErrors[f.id] = 'لطفاً استان محل سکونت را انتخاب فرمایید.';
            return;
          }
          if (!city || city === '') {
            newErrors[f.id] = 'لطفاً شهرستان محل سکونت را انتخاب فرمایید.';
            return;
          }
        }
        return;
      }

      // الزامی بودن
      if (f.validations?.required && (!val || val === '' || (typeof val === 'string' && val.trim() === ''))) {
        newErrors[f.id] = f.validations?.customErrorMessage || 'تکمیل این فیلد الزامی است.';
        return;
      }

      // اعتبارسنجی کد ملی ایران
      if (f.type === 'nationalCode' && val) {
        if (!isValidIranianNationalCode(val)) {
          newErrors[f.id] = 'کد ملی ۱۰ رقمی وارد شده نامعتبر است.';
          return;
        }
      }

      // اعتبارسنجی شماره همراه ایران
      if (f.type === 'mobile' && val) {
        if (!isValidIranianMobile(val)) {
          newErrors[f.id] = 'شماره همراه باید ۱۱ رقم و با ۰۹ آغاز شود.';
          return;
        }
        if (f.validations.verifyOtp && !otpVerified) {
          newErrors[f.id] = 'لطفاً کد تایید پیامکی را تایید نمایید.';
          return;
        }
      }

      // فقط حروف فارسی
      if (f.type === 'persianOnlyText' && val) {
        if (!/^[\u0600-\u06FF\s]+$/.test(val)) {
          newErrors[f.id] = 'لطفاً تنها از حروف فارسی استفاده فرمایید.';
          return;
        }
      }

      // فقط حروف انگلیسی
      if (f.type === 'englishOnlyText' && val) {
        if (!/^[a-zA-Z0-9_\-\s]+$/.test(val)) {
          newErrors[f.id] = 'Please enter English characters only.';
          return;
        }
      }

      // حداقل کاراکتر
      if (f.validations.minLength && val && String(val).length < f.validations.minLength) {
        newErrors[f.id] = `حداقل ${toPersianDigits(f.validations.minLength)} کاراکتر وارد کنید.`;
        return;
      }
    });

    setErrors(newErrors);
    const errKeys = Object.keys(newErrors);
    if (errKeys.length > 0) {
      setTimeout(() => {
        const el = document.getElementById(`field-${errKeys[0]}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 60);
      return false;
    }
    return true;
  };

  // فیلدهای قابل نمایش مرحله جاری
  const currentStep = form.mode === 'wizard' && form.steps && form.steps.length > 0 
    ? form.steps[currentStepIndex] 
    : null;

  const currentStepFields = useMemo(() => {
    if (!currentStep) return form.fields;

    // اگر مرحله لیست مشخصی از فیلدها دارد
    if (currentStep.fieldIds && currentStep.fieldIds.length > 0) {
      return currentStep.fieldIds
        .map((fid) => form.fields.find((f) => f.id === fid))
        .filter((f): f is FormField => !!f);
    }

    // فیلتر فیلدهایی که متعلق به این مرحله هستند
    return form.fields.filter((f) => f.stepId === currentStep.id);
  }, [currentStep, form.fields]);

  // تقسیم فیلدها به صفحات بر اساس حالت تک‌سوالی یا دکمه‌های شکست صفحه (pageBreakAfter)
  const isSingleQuestionMode = form.mode === 'singleQuestion';
  const hasPageBreaks = currentStepFields.some((f) => f.pageBreakAfter);

  const pages: FormField[][] = useMemo(() => {
    if (isSingleQuestionMode) {
      return currentStepFields.map((f) => [f]);
    }
    if (hasPageBreaks) {
      const result: FormField[][] = [];
      let currentGroup: FormField[] = [];
      currentStepFields.forEach((f) => {
        currentGroup.push(f);
        if (f.pageBreakAfter) {
          result.push(currentGroup);
          currentGroup = [];
        }
      });
      if (currentGroup.length > 0) {
        result.push(currentGroup);
      }
      return result.length > 0 ? result : [currentStepFields];
    }
    return [currentStepFields];
  }, [currentStepFields, isSingleQuestionMode, hasPageBreaks]);

  const activePageIndex = Math.min(internalPageIndex, Math.max(0, pages.length - 1));
  const activePageFields = pages[activePageIndex] || currentStepFields;

  const handleNextPage = () => {
    if (!validateFields(activePageFields)) return;
    setErrors({});
    if (activePageIndex < pages.length - 1) {
      setInternalPageIndex(activePageIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevPage = () => {
    setErrors({});
    if (activePageIndex > 0) {
      setInternalPageIndex(activePageIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // اعتبارسنجی ثبت نام تکراری بر اساس دیتابیس
  const checkDuplicateMobile = async (rawMobile: string): Promise<boolean> => {
    const clean = toEnglishDigits(rawMobile.replace(/\s+/g, ''));
    if (!clean || clean.length < 10) return false;
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'check_registration', mobile: clean }),
      });
      const data = await res.json();
      if (data.exists) {
        setDuplicateCaseInfo(data);
        setErrors((prev) => ({
          ...prev,
          f_mobile: 'شما قبلاً ثبت نام کرده اید و باید شماره پرونده را بازیابی کنید',
        }));
        return true;
      }
    } catch (err) {
      console.warn('Check registration error:', err);
    }
    return false;
  };

  const handleNextStep = async () => {
    if (!form.steps || form.steps.length === 0) return;
    if (!validateFields(currentStepFields)) return;

    // بررسی ثبت‌نام تکراری در مرحله اول فرم ثبت نام مراجع
    if ((form.id === 'form-belhagh-registration' || form.slug === 'zexuz') && currentStepIndex === 0) {
      const mobileVal = formData.f_mobile || formData.mobile;
      if (mobileVal) {
        const isDuplicate = await checkDuplicateMobile(mobileVal);
        if (isDuplicate) {
          const el = document.getElementById('field-f_mobile');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
    }

    if (currentStepIndex < form.steps.length - 1) {
      setCurrentStepIndex((prev) => Math.min(prev + 1, form.steps.length - 1));
      setInternalPageIndex(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setInternalPageIndex(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // جلوگیری قطعی از پرش از روی مرحله چهارم و ثبت تصادفی ناشی از دابل‌کلیک
    if (Date.now() - stepEnteredAt < 700) {
      return;
    }

    if (pages.length > 1 && activePageIndex < pages.length - 1) {
      handleNextPage();
      return;
    }

    // اگر فرم ویزارد است و هنوز به مرحله آخر نرسیده‌ایم، هرگز نباید فرم سابمیت شود
    if (form.mode === 'wizard' && form.steps && form.steps.length > 0 && currentStepIndex < form.steps.length - 1) {
      handleNextStep();
      return;
    }

    // در مرحله چهارم تا وقتی تمام بخش‌ها تکمیل نشده فرم به هیچ عنوان تکمیل و ثبت نگردد
    if ((form.id === 'form-belhagh-registration' || form.slug === 'zexuz') && currentStepIndex === 3) {
      const step4Fields = ['f_physical_illness', 'f_mental_illness', 'f_medications'];
      const emptyStep4 = step4Fields.filter((fid) => {
        const val = formData[fid];
        return !val || (typeof val === 'string' && val.trim() === '');
      });
      if (emptyStep4.length > 0) {
        const step4Errors: Record<string, string> = {};
        emptyStep4.forEach((fid) => {
          step4Errors[fid] = 'تکمیل تمام بخش‌های مرحله چهارم الزامی است (در صورت عدم سابقه بنویسید «ندارم»).';
        });
        setErrors((prev) => ({ ...prev, ...step4Errors }));
        setTimeout(() => {
          const el = document.getElementById(`field-${emptyStep4[0]}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 60);
        return;
      }
    }

    const fieldsToValidate = form.fields;
    if (!validateFields(fieldsToValidate)) return;

    // بررسی ثبت‌نام تکراری قبل از ثبت نهایی فرم ثبت‌نام مراجع
    if (form.id === 'form-belhagh-registration' || form.slug === 'zexuz') {
      const mobileVal = formData.f_mobile || formData.mobile;
      if (mobileVal) {
        const isDuplicate = await checkDuplicateMobile(mobileVal);
        if (isDuplicate) {
          const el = document.getElementById('field-f_mobile');
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          return;
        }
      }
    }

    if (form.payment.enabled && calculatedAmount > 0) {
      setIsPaymentOpen(true);
      return;
    }

    finalizeSubmission();
  };

  const finalizeSubmission = (paymentRefId?: string) => {
    let quizResult = undefined;
    if (form.quiz.enabled) {
      let correct = 0;
      let totalQuestions = 0;
      let score = 0;

      form.fields.forEach((f) => {
        if (f.type === 'quizQuestion' && f.quizData) {
          totalQuestions++;
          const selected = formData[f.id];
          if (selected === f.quizData.correctOptionId) {
            correct++;
            score += f.quizData.points;
          } else if (selected && form.quiz.negativeMarking && f.quizData.negativePoints) {
            score -= f.quizData.negativePoints;
          }
        }
      });

      const maxScore = totalQuestions * 25;
      const finalPercentage = Math.max(0, Math.round((score / maxScore) * 100));
      quizResult = {
        score: finalPercentage,
        maxScore: 100,
        passed: finalPercentage >= form.quiz.passingScore,
        answersCount: totalQuestions,
        correctCount: correct,
      };
    }

    const paymentInfo = paymentRefId
      ? {
          status: 'paid',
          amount: calculatedAmount,
          refId: paymentRefId,
          date: new Date().toISOString(),
        }
      : undefined;

    // ایجاد یا حفظ کد پرونده اختصاصی (مثلاً SP849201)
    const existingCaseCode = formData.f_case_code || formData.caseCode || (typeof window !== 'undefined' ? localStorage.getItem('belhagh_current_case_code') : null);
    const newCaseCode = existingCaseCode || generateCaseCode('SP');

    const sub = submitFormResponse(form.id, { ...formData, caseCode: newCaseCode }, paymentInfo, quizResult);
    const finalSub: FormSubmission = {
      ...sub,
      trackingCode: newCaseCode,
    };

    setSubmittedResult(finalSub);
    setActiveCaseSubmission(finalSub);

    // ۱. ارسال پیامک کد پرونده پس از ثبت نام مراجع (مطابق پترن عکس ۳)
    if (form.id === 'form-belhagh-registration' || form.slug === 'zexuz') {
      const clientMobile = formData.f_mobile || formData.mobile;
      if (clientMobile) {
        fetch('/api/sms/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'case_registration',
            mobile: clientMobile,
            caseCode: newCaseCode,
          }),
        }).catch((err) => console.warn('SMS dispatch error:', err));
      }
    }

    // ثبت یا نگهداری دائم پرونده در دیتابیس ابری Neon PostgreSQL
    if (form.id === 'form-belhagh-registration' || form.slug === 'zexuz') {
      const clientMobile = formData.f_mobile || formData.mobile;
      if (clientMobile) {
        fetch('/api/cases', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'register_case',
            caseCode: newCaseCode,
            mobile: clientMobile,
            data: formData,
          }),
        }).catch((err) => console.warn('Case DB save error:', err));
      }
    }

    // ذخیره سابمیشن در دیتابیس ابری Neon PostgreSQL
    fetch('/api/cases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save_submission',
        submission: finalSub,
      }),
    }).catch((err) => console.warn('Submission DB save error:', err));

    // ۲ و ۳. ارسال پیامک تایید نوبت برای مراجع و مشاور (فرم نوبت‌دهی 3uu4z)
    if (form.id === 'form-belhagh-booking' || form.slug === '3uu4z') {
      const booking = extractBookingDetails({ ...formData, ...finalSub.data });
      fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'appointment_booked',
          clientMobile: booking.clientMobile,
          counselorMobile: booking.counselorMobile,
          clientName: booking.clientName,
          counselorName: booking.counselorName,
          date: booking.date,
          time: booking.time,
          province: booking.province,
          city: booking.city,
        }),
      }).catch((err) => console.warn('SMS booking dispatch error:', err));
    }

    // ذخیره دائمی پرونده در localStorage
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('belhagh_current_case_code', newCaseCode);
        const existing = localStorage.getItem('belhagh_all_cases');
        const list = existing ? JSON.parse(existing) : [];
        list.unshift(finalSub);
        localStorage.setItem('belhagh_all_cases', JSON.stringify(list));
      } catch (err) {}
    }

    // هدایت به صفحه دیگر در صورت تنظیم در فرم
    if (form.behavior?.redirectAfterSubmit && form.behavior.redirectUrl) {
      setTimeout(() => {
        window.location.href = form.behavior!.redirectUrl!;
      }, 2500);
    }
  };

  // اگر فرم دارای قفل رمز عبور است
  if (!isPasswordUnlocked) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white rounded-2xl border border-slate-200 shadow-xl text-center space-y-5">
        <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto border border-blue-200">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-base font-extrabold text-slate-900">فرم محافظت‌شده سازمانی</h2>
          <p className="text-xs text-slate-500 mt-1">مشاهده این فرم مستلزم وارد کردن کلمه عبور مجاز است.</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (enteredPassword === (form.security.formPassword || '1234')) {
              setIsPasswordUnlocked(true);
              setPasswordError(false);
            } else {
              setPasswordError(true);
            }
          }}
          className="space-y-3"
        >
          <input
            type="password"
            value={enteredPassword}
            onChange={(e) => setEnteredPassword(e.target.value)}
            placeholder="کلمه عبور فرم را وارد کنید"
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-center font-mono focus:ring-1 focus:ring-blue-600 focus:outline-none"
            required
          />
          {passwordError && (
            <div className="text-[11px] text-rose-600 font-bold">کلمه عبور اشتباه است.</div>
          )}
          <button
            type="submit"
            className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors"
          >
            ورود به فرم
          </button>
        </form>
      </div>
    );
  }

  // صفحه تأیید نهایی ثبت فرم و رسید چاپی
  if (submittedResult) {
    const isBookingForm = form.id === 'form-belhagh-booking' || form.slug === '3uu4z';

    // در فرم نوبت‌دهی، مشخصات نوبت رزرو شده نمایش داده می‌شود نه کادر ذخیره مجدد پرونده
    if (isBookingForm) {
      const booking = extractBookingDetails({ ...formData, ...submittedResult.data });
      return (
        <div className="max-w-2xl mx-auto my-6 sm:my-12 p-5 sm:p-8 bg-white rounded-3xl border border-emerald-200 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-200 shadow-sm">
            <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10" />
          </div>

          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              نوبت مشاوره شما با موفقیت ثبت شد
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
              پیامک تأیید نوبت برای شما و مشاور محترم ارسال گردید.
            </p>
          </div>

          {/* کارت مشخصات کامل نوبت رزرو شده */}
          <div className="bg-gradient-to-br from-emerald-50/80 via-teal-50/40 to-slate-50 rounded-2xl border-2 border-emerald-300/80 p-5 sm:p-6 text-right space-y-4 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-200/60">
              <span className="font-extrabold text-sm sm:text-base text-emerald-950 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-700" />
                <span>مشخصات نوبت مشاوره تلفنی</span>
              </span>
              <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold">
                تأیید قطعی
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3 text-xs sm:text-sm">
              <div className="p-3 bg-white/95 rounded-xl border border-emerald-100 flex items-center justify-between">
                <span className="text-slate-500">مشاور انتخابی:</span>
                <span className="font-extrabold text-slate-900">{booking.counselorName}</span>
              </div>
              <div className="p-3 bg-white/95 rounded-xl border border-emerald-100 flex items-center justify-between">
                <span className="text-slate-500">تاریخ نوبت (شمسی):</span>
                <span className="font-extrabold text-emerald-800">{booking.date}</span>
              </div>
              <div className="p-3 bg-white/95 rounded-xl border border-emerald-100 flex items-center justify-between">
                <span className="text-slate-500">ساعت نوبت:</span>
                <span className="font-extrabold text-emerald-800">{booking.time}</span>
              </div>
              <div className="p-3 bg-white/95 rounded-xl border border-emerald-100 flex items-center justify-between">
                <span className="text-slate-500">مراجع محترم:</span>
                <span className="font-extrabold text-slate-900">{booking.clientName}</span>
              </div>
              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-center justify-between">
                <span className="text-emerald-950 font-bold flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-emerald-700" />
                  <span>شماره تماس مشاور:</span>
                </span>
                <a href={`tel:${booking.counselorMobile || '09120449093'}`} className="font-mono font-black text-emerald-800 text-sm hover:underline" dir="ltr">
                  {booking.counselorMobile || '09120449093'}
                </a>
              </div>
              {submittedResult.trackingCode && (
                <div className="p-3 bg-white/95 rounded-xl border border-emerald-100 flex items-center justify-between">
                  <span className="text-slate-500">کد پرونده مراجع:</span>
                  <span className="font-mono font-black text-blue-800 tracking-wider" dir="ltr">{submittedResult.trackingCode}</span>
                </div>
              )}
            </div>

            <div className="p-4 bg-emerald-900/5 rounded-xl border border-emerald-200 text-emerald-950 text-xs sm:text-sm font-semibold leading-relaxed flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                📞 <strong>راهنمای تماس با مشاور:</strong> مشاور در ساعت مقرر در دسترس و منتظر تماس شما خواهد بود. لطفاً رأس ساعت تعیین‌شده با شماره مشاور ({booking.counselorMobile || '09120449093'}) تماس بگیرید.
              </div>
              {booking.counselorMobile && (
                <a
                  href={`tel:${booking.counselorMobile}`}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 shrink-0 transition-colors shadow-sm"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>تماس با مشاور</span>
                </a>
              )}
            </div>
          </div>

          {/* دکمه‌های بازگشت و عملیات نهایی */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3 print:hidden">
            <button
              type="button"
              onClick={() => {
                setSubmittedResult(null);
                setAuthGateMode('portal');
                setIsLoginBoxOpen(false);
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#084d3e] hover:bg-[#063e32] active:scale-[0.99] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              <Home className="w-4 h-4" />
              <span>بازگشت به صفحه اصلی سامانه</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (typeof window === 'undefined') return;
                try {
                  const printWin = window.open('', '_blank');
                  if (printWin) {
                    printWin.document.write(`<!DOCTYPE html><html dir="rtl" lang="fa"><head><meta charset="utf-8"><title>رسید نوبت مشاوره روانشناسی بالحق</title><meta name="viewport" content="width=device-width, initial-scale=1.0"><style>body { font-family: Tahoma, system-ui, sans-serif; padding: 20px; direction: rtl; text-align: right; background: #f8fafc; color: #1e293b; } .card { max-width: 480px; margin: 20px auto; background: #fff; border: 2px solid #059669; border-radius: 16px; padding: 24px; box-shadow: 0 4px 12px rgba(0,0,0,0.08); } h2 { color: #065f46; text-align: center; margin: 0 0 20px; font-size: 18px; border-bottom: 2px solid #ecfdf5; padding-bottom: 12px; } .row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px dashed #e2e8f0; font-size: 14px; } .label { color: #64748b; font-weight: 500; } .val { font-weight: bold; color: #0f172a; } .highlight { color: #047857; font-size: 15px; } .guide { margin-top: 18px; background: #ecfdf5; border: 1px solid #a7f3d0; padding: 14px; border-radius: 12px; font-size: 13px; line-height: 1.7; color: #064e3b; } .btn { display: block; width: 100%; margin-top: 20px; padding: 14px; background: #084d3e; color: #fff; text-align: center; border-radius: 10px; font-weight: bold; font-size: 14px; border: none; cursor: pointer; } @media print { .btn { display: none !important; } body { background: #fff; padding: 0; } .card { box-shadow: none; border: 1px solid #ccc; } }</style></head><body><div class="card"><h2>رسید نوبت مشاوره تلفنی بالحق</h2><div class="row"><span class="label">مشاور انتخابی:</span><span class="val">${booking.counselorName}</span></div><div class="row"><span class="label">تاریخ نوبت:</span><span class="val highlight">${booking.date}</span></div><div class="row"><span class="label">ساعت نوبت:</span><span class="val highlight">${booking.time}</span></div><div class="row"><span class="label">مراجع محترم:</span><span class="val">${booking.clientName}</span></div><div class="row"><span class="label">شماره تماس مشاور:</span><span class="val" dir="ltr">${booking.counselorMobile || '09120449093'}</span></div><div class="row"><span class="label">کد پرونده:</span><span class="val" dir="ltr">${submittedResult.trackingCode || '-'}</span></div><div class="guide">📞 <strong>راهنما:</strong> لطفاً رأس ساعت مقرر با شماره مشاور (${booking.counselorMobile || '09120449093'}) تماس حاصل فرمایید.</div><button class="btn" onclick="window.print()">چاپ / ذخیره به صورت PDF</button></div><script>window.onload=function(){setTimeout(function(){window.print();},300);};</script></body></html>`);
                    printWin.document.close();
                    return;
                  }
                } catch (e) {
                  console.error('Print window error:', e);
                }
                window.print();
              }}
              className="inline-flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm hover:bg-slate-800 active:scale-[0.99] transition-all cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>چاپ رسید نوبت</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="max-w-2xl mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 shadow-xl text-center space-y-6">
        
        <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border-2 border-emerald-200">
          <CheckCircle2 className="w-8 h-8" />
        </div>

        <div>
          <h2 className="text-xl font-extrabold text-slate-900">
            {form.behavior?.customSuccessMessage || 'فرم با موفقیت ثبت گردید'}
          </h2>
          <p className="text-xs text-slate-500 mt-1">اطلاعات شما در پایگاه امن سامانه فرم‌افزار ذخیره شد.</p>
        </div>

        {/* کادر کد پرونده اختصاصی به همراه کپی و پیام ذخیره‌سازی */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-blue-50 via-indigo-50/60 to-purple-50 rounded-2xl border-2 border-blue-300 inline-block w-full max-w-md shadow-sm space-y-3">
          <div className="flex items-center justify-center gap-2 text-blue-900 font-extrabold text-xs sm:text-sm">
            <KeyRound className="w-5 h-5 text-blue-600" />
            <span>کد پرونده اختصاصی شما:</span>
          </div>

          <div className="flex items-center justify-center gap-3 bg-white px-4 py-3 rounded-xl border border-blue-200 shadow-inner">
            <span className="text-2xl font-black text-blue-800 tracking-wider font-mono">
              {submittedResult.trackingCode}
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(submittedResult.trackingCode);
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2500);
              }}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 transition-colors"
              title="کپی کد پرونده"
            >
              {copiedCode ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs font-semibold leading-relaxed">
            ⚠️ <strong>مهم:</strong> لطفاً این کد پرونده را ذخیره یا یادداشت فرمایید تا برای مراجعات بعدی و ورود به پرونده خود، به همراه داشته باشید.
          </div>
          
          <span className="text-[10px] text-slate-400 block">
            تاریخ و زمان ثبت: {formatPersianDateTime(submittedResult.createdAt)}
          </span>
        </div>

        {/* کارنامه در صورت فعال بودن آزمون */}
        {submittedResult.quizResult && (
          <div className="p-6 bg-purple-50/70 border border-purple-200 rounded-xl text-right space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-purple-200/60">
              <div className="flex items-center gap-2">
                <Award className="w-5 h-5 text-purple-700" />
                <span className="font-bold text-sm text-purple-900">کارنامه رسمی آزمون الکترونیک</span>
              </div>
              <span className={`px-2.5 py-1 rounded text-xs font-bold ${
                submittedResult.quizResult.passed
                  ? 'bg-emerald-600 text-white'
                  : 'bg-rose-600 text-white'
              }`}>
                {submittedResult.quizResult.passed ? 'قبول شده' : 'مردود'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 bg-white rounded-lg border border-purple-100">
                <span className="text-slate-500 block text-[11px]">نمره نهایی</span>
                <span className="text-lg font-extrabold text-purple-900 font-mono">
                  {toPersianDigits(submittedResult.quizResult.score)}٪
                </span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-purple-100">
                <span className="text-slate-500 block text-[11px]">پاسخ‌های صحیح</span>
                <span className="text-lg font-extrabold text-emerald-600 font-mono">
                  {toPersianDigits(submittedResult.quizResult.correctCount)}
                </span>
              </div>
              <div className="p-3 bg-white rounded-lg border border-purple-100">
                <span className="text-slate-500 block text-[11px]">کل سوالات</span>
                <span className="text-lg font-extrabold text-slate-800 font-mono">
                  {toPersianDigits(submittedResult.quizResult.answersCount)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* رسید پرداخت بانکی */}
        {submittedResult.paymentStatus === 'paid' && (
          <div className="p-4 bg-emerald-50/60 border border-emerald-200 rounded-xl text-right text-xs space-y-1">
            <div className="flex items-center justify-between font-bold text-emerald-900">
              <span>تأییدیه تراکنش شاپرک</span>
              <span>{formatCurrency(submittedResult.paymentAmount || 0, 'IRT')}</span>
            </div>
            <div className="text-[11px] text-emerald-700 font-mono">
              شماره مرجع بانکی: {submittedResult.paymentRefId}
            </div>
          </div>
        )}

        {/* دکمه‌های بازگشت و عملیات نهایی */}
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3 print:hidden">
          <button
            type="button"
            onClick={() => {
              const code = submittedResult?.trackingCode || '';
              if (typeof window !== 'undefined' && code) {
                try {
                  localStorage.setItem('belhagh_current_case_code', code);
                } catch (e) {}
              }
              setSubmittedResult(null);
              if (onNavigateToForm) {
                onNavigateToForm('3uu4z');
              } else if (typeof window !== 'undefined') {
                window.location.href = '/form/3uu4z';
              }
            }}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer"
          >
            <Home className="w-4 h-4" />
            <span>بازگشت به صفحه اصلی</span>
          </button>

          <button
            type="button"
            onClick={handleSaveAndPrintCaseCode}
            className="inline-flex items-center gap-2 px-5 py-3 bg-slate-900 text-white text-xs sm:text-sm font-bold rounded-xl shadow-sm hover:bg-slate-800 active:scale-[0.99] transition-all cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>ذخیره و چاپ کد پرونده</span>
          </button>
        </div>

        {copiedCodeToast && (
          <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs font-bold flex items-center justify-center gap-2 animate-in fade-in duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>کد پرونده با موفقیت کپی و در حافظه دستگاه ذخیره شد!</span>
          </div>
        )}

      </div>
    );
  }

  // نمای پورتال ورودی: ورود به پرونده قبلی یا ثبت‌نام جدید
  if (authGateMode === 'portal') {
    const isBelhaghFamily =
      form.id === 'form-belhagh-registration' ||
      form.id === 'form-belhagh-booking' ||
      form.slug === 'zexuz' ||
      form.slug === '3uu4z' ||
      form.category?.includes('روانشناسی');

    const portalTitle =
      form.generalSettings?.portalTitle ||
      form.printTemplate?.headerTitle ||
      (isBelhaghFamily ? 'سامانه مشاوره تلفنی روانشناسی بالحق' : form.title);

    const portalSubtitle =
      form.generalSettings?.portalSubtitle ||
      (isBelhaghFamily ? 'ورود به پرونده یا ثبت‌نام جدید' : form.description || '');

    let heroImage =
      form.generalSettings?.portalHeroImage ||
      form.theme?.portalHeroImage ||
      (isBelhaghFamily ? '/images/belhagh-hero.png' : '');

    if (heroImage && isBelhaghFamily && !heroImage.includes('?v=')) {
      heroImage = `${heroImage}?v=3`;
    }

    const showHeroImage =
      Boolean(heroImage) && form.generalSettings?.showPortalHeroImage !== false;

    return (
      <div 
        className="w-full flex-1 flex flex-col items-center justify-center py-4 sm:py-8 px-2 sm:px-4 relative z-10"
        style={{
          // در صورت پیش‌نمایش مستقیم یا نبود کانتینر والد
          backgroundColor: !form.theme?.backgroundImage ? (form.theme?.backgroundColor || 'transparent') : 'transparent',
        }}
      >
        {isBelhaghFamily ? (
          <div className="max-w-[440px] w-full mx-auto my-2 sm:my-6 px-3 animate-in fade-in zoom-in-95 duration-300">
            <div className="overflow-hidden rounded-[2.5rem] border border-stone-200/90 shadow-2xl shadow-stone-900/10 text-center flex flex-col bg-white">
              
              {/* تصویر پس‌زمینه کارت پورتال: کاملاً تمیز و بدون هیچ دکمه‌ای روی آن */}
              {showHeroImage && heroImage ? (
                <div className="w-full relative overflow-hidden bg-stone-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={heroImage}
                    alt={portalTitle}
                    onError={(e) => {
                      const target = e.currentTarget;
                      if (!target.src.includes('belhagh-hero.jpg')) {
                        target.src = '/images/belhagh-hero.jpg';
                      }
                    }}
                    className="w-full h-auto object-cover select-none pointer-events-none block"
                  />
                </div>
              ) : null}

              {/* المان‌های پورتال: زیر تصویر و در بخش تمیز و لمسی موبایل */}
              <div className="p-5 sm:p-6 bg-white space-y-3.5">

                {!isLoginBoxOpen ? (
                  /* حالت اولیه: دکمه‌های ثبت نام و ورود اختصاصی سامانه بالحق */
                  <div className="space-y-3.5 pt-1">
                    {/* دکمه ثبت نام سبز زمردی مطابق تصویر بالحق */}
                    <button
                      type="button"
                      onClick={handleStartRegistration}
                      className="w-full py-3.5 sm:py-4 px-6 bg-[#008269] hover:bg-[#00705a] active:scale-[0.99] text-white font-black text-base sm:text-lg rounded-full shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        <span>ثبت نام</span>
                      </div>
                      <ChevronLeft className="w-5 h-5 text-white/80" />
                    </button>

                    {/* دکمه ورود سرمه‌ای مطابق تصویر بالحق */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsLoginBoxOpen(true);
                        setCaseCodeError(null);
                      }}
                      className="w-full py-3.5 sm:py-4 px-6 bg-[#084d8c] hover:bg-[#063d70] active:scale-[0.99] text-white font-black text-base sm:text-lg rounded-full shadow-lg shadow-blue-950/25 transition-all flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <LogIn className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        <span>ورود</span>
                      </div>
                      <ChevronLeft className="w-5 h-5 text-white/80" />
                    </button>
                  </div>
                ) : (
                  /* حالت باز شده ورود با دکمه سرمه‌ای و کادر وارد کردن کد */
                  <div className="space-y-3.5 pt-1 animate-in fade-in duration-200">
                    {/* دکمه ورود در بالا (کلیک مجدد برای بستن) */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsLoginBoxOpen(false);
                        setCaseCodeError(null);
                      }}
                      className="w-full py-3.5 sm:py-4 px-6 bg-[#084d8c] hover:bg-[#063d70] active:scale-[0.99] text-white font-black text-base sm:text-lg rounded-full shadow-lg shadow-blue-950/25 transition-all flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <LogIn className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        <span>ورود</span>
                      </div>
                      <ChevronLeft className="w-5 h-5 text-white/80 -rotate-90 transition-transform" />
                    </button>

                    {/* باکس دریافت کد پرونده */}
                    <div className="bg-[#f7faf8] rounded-3xl border-2 border-[#739a8e] p-5 shadow-inner space-y-4 text-right animate-in fade-in slide-in-from-top-2 duration-200">
                      {/* عنوان کادر با آیکون */}
                      <div className="flex items-center gap-2 text-[#084d3e] font-extrabold text-sm sm:text-base">
                        <User className="w-5 h-5 text-[#084d3e] shrink-0" />
                        <span>لطفاً کد پرونده خود را وارد نمایید</span>
                      </div>

                      <form onSubmit={handleCaseLogin} className="space-y-3.5">
                        <div className="relative">
                          <input
                            type="text"
                            autoFocus
                            value={caseCodeInput}
                            onChange={(e) => {
                              setCaseCodeInput(e.target.value);
                              setCaseCodeError(null);
                            }}
                            placeholder="مثال: SP123456"
                            className="w-full py-3.5 pr-11 pl-4 text-sm sm:text-base border-2 border-[#8faea4] rounded-2xl text-right font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-[#084d3e] bg-white text-slate-800 placeholder:text-slate-400 shadow-inner"
                            dir="ltr"
                          />
                          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                            <User className="w-5 h-5" />
                          </div>
                        </div>

                        {caseCodeError && (
                          <p className="text-xs text-rose-600 font-bold text-center animate-in fade-in">
                            {caseCodeError}
                          </p>
                        )}

                        {/* دکمه تایید سبز مطابق تصویر ۲ */}
                        <button
                          type="submit"
                          className="w-full py-3 px-6 bg-[#3a7667] hover:bg-[#084d3e] active:scale-[0.99] text-white font-extrabold text-sm sm:text-base rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <LogIn className="w-5 h-5" />
                          <span>تایید</span>
                        </button>

                        {/* لینک بازیابی کد پرونده مطابق تصویر ۳ */}
                        <div className="text-center pt-1">
                          <button
                            type="button"
                            onClick={() => {
                              setShowForgotModal(true);
                              setForgotResult(null);
                              setForgotMobileInput('');
                            }}
                            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#084d3e] hover:text-[#05372c] hover:underline transition-colors cursor-pointer"
                          >
                            <RotateCcw className="w-4 h-4" />
                            <span>بازیابی کد پرونده</span>
                          </button>
                        </div>
                      </form>
                    </div>

                    {/* دکمه ثبت نام در زیر باکس */}
                    <button
                      type="button"
                      onClick={handleStartRegistration}
                      className="w-full py-3.5 sm:py-4 px-6 bg-[#008269] hover:bg-[#00705a] active:scale-[0.99] text-white font-black text-base sm:text-lg rounded-full shadow-md transition-all flex items-center justify-between cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <UserPlus className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                        <span>ثبت نام</span>
                      </div>
                      <ChevronLeft className="w-5 h-5 text-white/80" />
                    </button>
                  </div>
                )}
              </div>

            </div>
          </div>
        ) : (
          /* برای سایر فرم‌های عمومی (غیر بالحق) */
          <div className="max-w-md mx-auto my-12 sm:my-20 px-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-white rounded-3xl border border-slate-200/90 shadow-xl shadow-slate-200/50 p-6 sm:p-8 space-y-6 text-center">
              <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
                {portalTitle}
              </h1>
              {portalSubtitle && (
                <p className="text-xs text-slate-500 font-medium -mt-3">
                  {portalSubtitle}
                </p>
              )}

              {!isLoginBoxOpen ? (
                <div className="space-y-3 pt-1">
                  <button
                    type="button"
                    onClick={handleStartRegistration}
                    className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-sm rounded-xl transition-all shadow-sm cursor-pointer"
                  >
                    ثبت‌نام جدید و تکمیل فرم
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsLoginBoxOpen(true);
                      setCaseCodeError(null);
                    }}
                    className="w-full py-3 px-4 bg-slate-50 hover:bg-slate-100 active:scale-[0.99] text-slate-700 font-bold text-sm rounded-xl transition-all border border-slate-200 cursor-pointer"
                  >
                    ورود با کد پیگیری
                  </button>
                </div>
              ) : (
                <div className="pt-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  <form onSubmit={handleCaseLogin} className="space-y-3 text-right">
                    <div>
                      <input
                        type="text"
                        autoFocus
                        value={caseCodeInput}
                        onChange={(e) => {
                          setCaseCodeInput(e.target.value);
                          setCaseCodeError(null);
                        }}
                        placeholder="کد پیگیری یا پرونده"
                        className="w-full px-4 py-2.5 text-sm border border-slate-300 rounded-xl text-center font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-colors"
                        dir="ltr"
                      />
                    </div>

                    {caseCodeError && (
                      <p className="text-xs text-rose-600 text-center font-medium animate-in fade-in">
                        {caseCodeError}
                      </p>
                    )}

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="submit"
                        className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-sm transition-all cursor-pointer"
                      >
                        تأیید و ورود
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setIsLoginBoxOpen(false);
                          setCaseCodeError(null);
                        }}
                        className="py-2.5 px-4 text-slate-600 hover:bg-slate-100 font-semibold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
                      >
                        بازگشت
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* مودال بازیابی کد پرونده در صورت فراموشی */}
        {showForgotModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl text-right">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2 text-slate-900 font-extrabold text-xs sm:text-sm">
                  <KeyRound className="w-4 h-4 text-blue-600" />
                  <span>بازیابی کد پرونده</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowForgotModal(false)}
                  className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">
                شماره همراهی که هنگام ثبت‌نام در سامانه ثبت نموده‌اید را وارد فرمایید تا کد پرونده شما بازیابی گردد:
              </p>

              <form onSubmit={handleForgotLookup} className="space-y-3">
                <input
                  type="text"
                  value={forgotMobileInput}
                  onChange={(e) => setForgotMobileInput(e.target.value)}
                  placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl text-center font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  dir="ltr"
                />

                {forgotResult && (
                  <div
                    className={`p-3 rounded-xl border text-xs leading-relaxed space-y-2 ${
                      forgotResult.found
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                        : 'bg-rose-50 border-rose-300 text-rose-900'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 font-bold">
                      {forgotResult.found ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      )}
                      <span>{forgotResult.message}</span>
                    </div>

                    {forgotResult.found && forgotResult.caseCode && (
                      <div className="space-y-2 pt-1 border-t border-emerald-200/60">
                        <div className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-emerald-200">
                          <span className="text-[11px] text-slate-600 font-medium">کد پرونده شما:</span>
                          <span className="font-mono font-black text-emerald-700 text-sm tracking-wider">
                            {forgotResult.caseCode}
                          </span>
                        </div>
                        <p className="text-[11px] text-emerald-800 font-semibold">
                          📌 این کد پرونده را ذخیره فرمایید تا برای مراجعات بعدی و ورود به پرونده به همراه داشته باشید.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            if (forgotResult.sub) {
                              const sub = forgotResult.sub;
                              setActiveCaseSubmission(sub);
                              const caseCode = forgotResult.caseCode || sub.trackingCode;
                              const prefilledData = {
                                ...sub.data,
                                f_name: sub.data?.f_name || sub.data?.f_applicant_name || '',
                                f_family: sub.data?.f_family || '',
                                f_mobile: sub.data?.f_mobile || sub.data?.mobile || '',
                                f_province_city: sub.data?.f_province_city || '',
                                f_role_in_family: sub.data?.f_role_in_family || '',
                                f_case_code: caseCode,
                              };
                              if (typeof window !== 'undefined') {
                                try {
                                  localStorage.setItem('belhagh_current_case_code', caseCode);
                                  localStorage.setItem('belhagh_active_case_data', JSON.stringify(prefilledData));
                                } catch (err) {}
                              }
                              setFormData((prev) => ({ ...prev, ...prefilledData }));
                              setShowForgotModal(false);

                              if (form.id === 'form-belhagh-booking' || form.slug === '3uu4z') {
                                setAuthGateMode('filling');
                                setCurrentStepIndex(0);
                                setInternalPageIndex(0);
                              } else if (onNavigateToForm) {
                                onNavigateToForm('3uu4z');
                              } else if (typeof window !== 'undefined') {
                                window.location.href = '/form/3uu4z';
                              }
                            }
                          }}
                          className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs rounded-xl shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5"
                        >
                          <LogIn className="w-4 h-4" />
                          <span>ورود به پرونده و ادامه نوبت‌دهی</span>
                        </button>
                      </div>
                    )}

                    {!forgotResult.found && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setShowForgotModal(false);
                            const isReg = form.id === 'form-belhagh-registration' || form.slug === 'zexuz';
                            if (isReg) {
                              setAuthGateMode('filling');
                              setCurrentStepIndex(0);
                              if (forgotMobileInput) {
                                handleFieldChange('f_mobile', forgotMobileInput);
                              }
                            } else {
                              if (typeof window !== 'undefined') {
                                try {
                                  sessionStorage.setItem('prefill_zexuz', JSON.stringify({ f_mobile: forgotMobileInput }));
                                  sessionStorage.setItem('prefill_form-belhagh-registration', JSON.stringify({ f_mobile: forgotMobileInput }));
                                } catch (e) {}
                              }
                              if (onNavigateToForm) {
                                onNavigateToForm('zexuz', { f_mobile: forgotMobileInput });
                              } else if (typeof window !== 'undefined') {
                                window.location.href = '/form/zexuz';
                              }
                            }
                          }}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-lg shadow-sm transition-all cursor-pointer"
                        >
                          انتقال به فرم ثبت‌نام و تشکیل پرونده با این شماره
                        </button>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    استعلام و بازیابی
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="px-3 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                  >
                    انصراف
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // نمای پرونده تشکیل‌شده برای کاربر لاگین‌شده با کد پرونده
  if (authGateMode === 'viewCase' && activeCaseSubmission) {
    const sub = activeCaseSubmission;
    const clientName = sub.data?.f_name || sub.data?.f_applicant_name || '';
    const clientFamily = sub.data?.f_family || '';
    const fullName = `${clientName} ${clientFamily}`.trim() || getFieldDisplayValue(undefined, sub.data?.f_role_in_family) || 'مُراجع محترم';
    const mobile = sub.data?.f_mobile || sub.data?.mobile || '-';

    return (
      <div className="max-w-xl mx-auto my-8 sm:my-14 p-5 sm:p-8 bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200/90 shadow-2xl space-y-6 text-right animate-in fade-in duration-300">
        
        {/* سربرگ پرونده */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <FolderLock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block mb-0.5">
                پرونده فعال
              </span>
              <h2 className="text-base font-extrabold text-slate-900">
                پرونده مشاوره‌ای: {fullName}
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setAuthGateMode('portal');
              setActiveCaseSubmission(null);
            }}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="خروج از پرونده"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

        {/* کادر کد پرونده طلایی */}
        <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50/70 border-2 border-amber-300 rounded-2xl space-y-2 text-center">
          <span className="text-xs text-amber-900 font-extrabold block">
            کد پرونده رسمی شما:
          </span>
          <div className="flex items-center justify-center gap-2 bg-white px-4 py-2.5 rounded-xl border border-amber-200 shadow-inner">
            <span className="text-xl font-black text-amber-800 tracking-wider font-mono">
              {sub.trackingCode}
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(sub.trackingCode);
                setCopiedCode(true);
                setTimeout(() => setCopiedCode(false), 2000);
              }}
              className="p-1 text-slate-500 hover:text-slate-800 cursor-pointer"
              title="کپی کد پرونده"
            >
              {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <span className="text-[11px] text-amber-900 font-medium block">
            📌 لطفاً این کد را یادداشت یا ذخیره فرمایید تا برای ورودهای آینده به پرونده، به آن دسترسی داشته باشید.
          </span>
        </div>

        {/* خلاصه اطلاعات ثبت‌شده */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 text-xs">
          <span className="font-extrabold text-slate-800 block pb-1 border-b border-slate-200/60">
            مشخصات ثبت شده پرونده:
          </span>
          <div className="grid grid-cols-2 gap-2 pt-1 text-[11px]">
            <div>
              <span className="text-slate-500">شماره همراه:</span>{' '}
              <span className="font-mono font-bold text-slate-900">{toPersianDigits(mobile)}</span>
            </div>
            <div>
              <span className="text-slate-500">تاریخ ثبت:</span>{' '}
              <span className="font-semibold text-slate-900">{formatPersianDateTime(sub.createdAt).split(' ')[0]}</span>
            </div>
            {sub.data?.f_role_in_family && (
              <div>
                <span className="text-slate-500">نقش در خانواده:</span>{' '}
                <span className="font-semibold text-slate-900">{getFieldDisplayValue(undefined, sub.data.f_role_in_family)}</span>
              </div>
            )}
            {sub.data?.f_province_city && (
              <div>
                <span className="text-slate-500">شهر محل سکونت:</span>{' '}
                <span className="font-semibold text-slate-900">{sub.data.f_province_city}</span>
              </div>
            )}
          </div>
        </div>

        {/* دکمه‌های عملیات */}
        <div className="space-y-2.5 pt-2">
          {form.id === 'form-belhagh-booking' || form.slug === '3uu4z' ? (
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  f_name: sub.data?.f_name || sub.data?.f_applicant_name || prev.f_name || '',
                  f_family: sub.data?.f_family || prev.f_family || '',
                  f_mobile: sub.data?.f_mobile || sub.data?.mobile || prev.f_mobile || '',
                  f_province_city: sub.data?.f_province_city || prev.f_province_city || '',
                  f_role_in_family: sub.data?.f_role_in_family || prev.f_role_in_family || '',
                  f_case_code: sub.trackingCode,
                }));
                setAuthGateMode('filling');
                setCurrentStepIndex(0);
              }}
              className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>دریافت نوبت مشاوره تلفنی با این پرونده</span>
              <ArrowLeft className="w-4 h-4 mr-auto" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleGoToNextChainedForm}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <Calendar className="w-4 h-4" />
              <span>ورود به سامانه نوبت‌دهی مشاوره و اخذ نوبت</span>
              <ArrowLeft className="w-4 h-4 mr-auto" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFormData({ ...sub.data });
                setAuthGateMode('filling');
              }}
              className="flex-1 py-2.5 px-3 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FileEdit className="w-3.5 h-3.5" />
              <span>مشاهده و ویرایش اطلاعات پرونده</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthGateMode('portal');
                setActiveCaseSubmission(null);
              }}
              className="px-4 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-600 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>خروج</span>
            </button>
          </div>
        </div>

      </div>
    );
  }

  const theme = form.theme;
  const formWidthClass = {
    compact: 'max-w-xl',
    standard: 'max-w-3xl',
    wide: 'max-w-5xl',
    full: 'max-w-full',
  }[theme?.formWidth || 'standard'];

  const borderRadiusClass = {
    none: 'rounded-none',
    sm: 'rounded-md',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
    full: 'rounded-[32px]',
  }[theme?.borderRadius || 'md'];

  const fontClass = {
    vazirmatn: 'font-sans',
    iranyekan: 'font-sans',
    shabnam: 'font-sans',
    system: 'font-mono',
  }[theme?.fontFamily || 'vazirmatn'];

  return (
    <div 
      className="min-h-screen py-2 sm:py-8 px-2 sm:px-4 flex flex-col items-center justify-start transition-all duration-300 w-full relative overflow-x-hidden"
      style={{
        backgroundColor: theme?.backgroundColor || '#f8fafc',
        backgroundImage: theme?.backgroundImage ? `url(${theme.backgroundImage})` : (theme?.backgroundGradient || undefined),
        backgroundSize: theme?.backgroundSize === 'repeat' ? 'auto' : (theme?.backgroundSize || 'cover'),
        backgroundRepeat: theme?.backgroundSize === 'repeat' ? 'repeat' : 'no-repeat',
        backgroundPosition: theme?.backgroundPosition || 'center center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* لایه پوشش تیره روی عکس پس‌زمینه */}
      {theme?.backgroundImage && (theme?.backgroundOverlayOpacity || 0) > 0 && (
        <div 
          className="fixed inset-0 pointer-events-none transition-opacity z-0"
          style={{ backgroundColor: `rgba(0, 0, 0, ${theme.backgroundOverlayOpacity})` }}
        />
      )}
      <div className={`${formWidthClass} ${fontClass} w-full transition-all duration-200 relative z-10`}>
        
        {/* نوار وضعیت پرونده متصل‌شده */}
        {formData.f_case_code && (isBelhaghFamily || form.id.includes('belhagh') || form.slug === '3uu4z') && (
          <div className="mb-3.5 p-3 px-4 bg-emerald-50/90 border border-emerald-200/90 rounded-2xl text-xs flex items-center justify-between text-emerald-950 font-bold shadow-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-pulse shrink-0" />
              <span>
                نوبت‌دهی برای پرونده: <strong className="font-mono text-emerald-950 font-black text-sm px-1.5 py-0.5 bg-white rounded-lg border border-emerald-200">{formData.f_case_code}</strong>
              </span>
              {Boolean(formData.f_name || formData.f_family) && (
                <span className="text-emerald-800">
                  ({formData.f_name} {formData.f_family})
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  localStorage.removeItem('belhagh_active_case_data');
                  localStorage.removeItem('belhagh_current_case_code');
                }
                setFormData((prev) => ({ ...prev, f_case_code: '' }));
                setAuthGateMode('portal');
                setIsLoginBoxOpen(true);
              }}
              className="text-[11px] text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
            >
              تغییر پرونده / ورود مجدد
            </button>
          </div>
        )}

        {/* سربرگ فرم */}
        <div 
          className={`${borderRadiusClass || 'rounded-2xl sm:rounded-3xl'} border shadow-xs p-3.5 sm:p-8 mb-3 sm:mb-6 transition-all`}
          style={{
            backgroundColor: theme?.cardBackgroundColor || '#ffffff',
            borderColor: theme?.borderColor || '#e2e8f0',
            borderWidth: `${theme?.borderWidth || 1}px`,
          }}
        >
          
          {/* تایمر معکوس آزمون */}
          {form.quiz.enabled && remainingSeconds > 0 && (
            <div className="mb-6 p-3 bg-purple-50 border border-purple-200 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 font-bold text-purple-900">
                <Timer className="w-4 h-4 text-purple-600 animate-pulse" />
                <span>زمان باقیمانده آزمون:</span>
              </div>
              <div className="font-mono text-base font-extrabold text-purple-800 tracking-wider">
                {toPersianDigits(Math.floor(remainingSeconds / 60))}:
                {toPersianDigits(remainingSeconds % 60 < 10 ? '0' : '')}
                {toPersianDigits(remainingSeconds % 60)}
              </div>
            </div>
          )}

          <div className="border-b border-slate-100 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    setAuthGateMode('portal');
                    setCurrentStepIndex(0);
                    setInternalPageIndex(0);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-all shadow-xs cursor-pointer"
                  title="بازگشت به صفحه اول / ورود به پرونده"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>بازگشت به صفحه ورود</span>
                </button>
                <h1 className="text-base sm:text-xl font-extrabold" style={{ color: theme?.titleColor || '#0f172a' }}>{form.title}</h1>
              </div>
              {onBackToStudio && (
                <button
                  onClick={onBackToStudio}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  بازگشت به ویرایشگر فرم
                </button>
              )}
            </div>
            {form.description && (
              <p className="text-xs mt-2 leading-relaxed" style={{ color: theme?.textColor || '#64748b' }}>{form.description}</p>
            )}
          </div>

        {/* استپر استاندارد فرم‌افزار و نسخه بهینه‌شده موبایل */}
        {form.mode === 'wizard' && form.steps && form.steps.length > 1 && (
          <div className="pt-4 sm:pt-6 pb-2 border-t border-slate-100/80">
            {/* نسخه فشرده و هوشمند موبایل */}
            <div className="sm:hidden px-2 pb-1 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span className="flex items-center gap-1.5" style={{ color: theme?.themeColor || '#0284c7' }}>
                  <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: theme?.themeColor || '#0284c7' }} />
                  <span>مرحله {toPersianDigits(currentStepIndex + 1)} از {toPersianDigits(form.steps.length)}: {form.steps[currentStepIndex]?.title}</span>
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  {toPersianDigits(Math.round(((currentStepIndex + 1) / form.steps.length) * 100))}%
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div 
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: theme?.themeColor || '#0284c7',
                    width: `${((currentStepIndex + 1) / form.steps.length) * 100}%`
                  }}
                />
              </div>
            </div>

            {/* نسخه کامل تبلت و دسکتاپ */}
            <div className="hidden sm:flex relative items-center justify-between max-w-2xl mx-auto px-4">
              {/* خط افقی سرتاسری اتصال مراحل */}
              <div 
                className="absolute top-4 left-6 right-6 h-0.5 z-0"
                style={{ backgroundColor: `${theme?.themeColor || '#0284c7'}33` }}
              />
              <div 
                className="absolute top-4 right-6 h-0.5 transition-all duration-300 z-0"
                style={{
                  backgroundColor: theme?.themeColor || '#0284c7',
                  width: `${(currentStepIndex / (form.steps.length - 1)) * 100}%`,
                }}
              />

              {form.steps.map((step, idx) => {
                const isActive = idx === currentStepIndex;
                const isPassed = idx < currentStepIndex;
                const themeCol = theme?.themeColor || '#0284c7';

                return (
                  <div key={step.id} className="relative z-10 flex flex-col items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setCurrentStepIndex(idx);
                        setInternalPageIndex(0);
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 cursor-pointer shadow-xs"
                      style={{
                        backgroundColor: isActive
                          ? themeCol
                          : isPassed
                          ? `${themeCol}dd`
                          : `${themeCol}28`,
                        color: isActive || isPassed ? '#ffffff' : themeCol,
                        boxShadow: isActive ? `0 0 0 4px ${themeCol}30` : undefined,
                        transform: isActive ? 'scale(1.15)' : undefined,
                      }}
                    >
                      {toPersianDigits(idx + 1)}
                    </button>
                    <span 
                      onClick={() => {
                        setCurrentStepIndex(idx);
                        setInternalPageIndex(0);
                      }}
                      className={`mt-2 text-[11px] font-bold text-center transition-colors max-w-[120px] cursor-pointer ${
                        isActive
                          ? 'text-slate-900 font-extrabold'
                          : isPassed
                          ? 'text-slate-600'
                          : 'text-slate-400 hover:text-slate-700'
                      }`}
                    >
                      {step.title}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>

      {/* بوم رندر فیلدها */}
      <form 
        onSubmit={handleSubmit} 
        className={`${borderRadiusClass || 'rounded-2xl sm:rounded-3xl'} border shadow-xs p-4 sm:p-8 space-y-5 sm:space-y-6 transition-all`}
        style={{
          backgroundColor: theme?.cardBackgroundColor || '#ffffff',
          borderColor: theme?.borderColor || '#e2e8f0',
          borderWidth: `${theme?.borderWidth || 1}px`,
        }}
      >
        
        {/* نوار پیشرفت صفحات یا پرسش‌ها در حالت تک‌سوالی یا شکست صفحه */}
        {pages.length > 1 && (
          <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-2 mb-2">
            <div className="flex items-center justify-between text-xs font-bold text-blue-900">
              <span>
                {isSingleQuestionMode ? 'پرسش' : 'صفحه'} {toPersianDigits(activePageIndex + 1)} از {toPersianDigits(pages.length)}
              </span>
              <span className="font-mono">{toPersianDigits(Math.round(((activePageIndex + 1) / pages.length) * 100))}٪ تکمیل شده</span>
            </div>
            <div className="w-full bg-blue-200/50 h-2 rounded-full overflow-hidden">
              <div 
                className="bg-blue-600 h-full transition-all duration-300 rounded-full"
                style={{ width: `${((activePageIndex + 1) / pages.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-12 gap-5">
          {form.slug === '3uu4z' && currentStep?.id === 'step-4' && (
            <div className="col-span-12 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 text-xs flex items-center gap-2.5 mb-1">
              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
              <div className="leading-relaxed">
                <span className="font-extrabold block text-emerald-900">مرحله چهارم: موضوع مراجعه، انتخاب مشاور و تعیین نوبت</span>
                <span className="text-[11px] text-emerald-800">
                  {formData['f_topic']
                    ? 'موضوع مراجعه انتخاب شد. اکنون مشاور مورد نظر و نوبت تقویم را رزرو فرمایید.'
                    : 'لطفاً ابتدا موضوع مراجعه را انتخاب فرمایید تا لیست مشاوران و تقویم نوبت‌دهی فعال گردد.'}
                </span>
              </div>
            </div>
          )}

          {activePageFields.map((field) => {
            if (!isFieldVisible(field.id)) return null;

            const colSpanClass: Record<number, string> = {
              12: 'col-span-12',
              6: 'col-span-12 md:col-span-6',
              4: 'col-span-12 md:col-span-4',
              3: 'col-span-12 md:col-span-3',
              2: 'col-span-12 md:col-span-2',
              1: 'col-span-12 md:col-span-1',
            };
            const colClass = colSpanClass[field.gridCols || 12] || 'col-span-12';

            const hasError = !!errors[field.id];

            return (
              <div key={field.id} id={`field-${field.id}`} className={`${colClass} space-y-1.5 scroll-mt-24`}>
                
                {/* عنوان و وضعیت اعتبارسنجی زنده */}
                <div className="flex items-center justify-between">
                  <label className="block text-xs sm:text-sm font-bold" style={{ color: theme?.labelColor || '#1e293b' }}>
                    {field.label}
                    {field.validations.required && <span className="text-rose-500 mr-1">*</span>}
                  </label>

                  {field.type === 'nationalCode' && formData[field.id] && (
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      isValidIranianNationalCode(formData[field.id])
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {isValidIranianNationalCode(formData[field.id]) ? 'کد ملی معتبر است ✓' : 'الگوریتم نامعتبر'}
                    </span>
                  )}
                </div>

                {/* رندر کنترل متناسب با ابزارک */}
                {field.type === 'textarea' ? (
                  <textarea
                    rows={3}
                    value={formData[field.id] || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    className={`w-full px-3.5 py-2.5 sm:py-2 text-base sm:text-sm border rounded-xl touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white transition-all ${
                      hasError ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-600'
                    }`}
                  />
                ) : ['radio', 'quizQuestion'].includes(field.type) ? (
                  <div className="space-y-2 pt-1">
                    {(field.options || []).map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex items-center gap-3 p-3.5 sm:p-3 rounded-xl border text-xs sm:text-sm cursor-pointer transition-all ${
                          formData[field.id] === opt.value || formData[field.id] === opt.id
                            ? 'border-blue-600 bg-blue-50/30 text-blue-900 font-bold'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <input
                          type="radio"
                          name={field.id}
                          checked={formData[field.id] === opt.value || formData[field.id] === opt.id}
                          onChange={() => handleFieldChange(field.id, opt.value || opt.id)}
                          className="w-4 h-4 text-blue-600"
                        />
                        <span className="flex-1">{opt.label}</span>
                        {opt.price ? (
                          <span className="text-[11px] text-slate-500 font-mono">
                            +{formatCurrency(opt.price)}
                          </span>
                        ) : null}
                      </label>
                    ))}
                  </div>
                ) : field.type === 'checkbox' ? (
                  <div className="space-y-2 pt-1">
                    {(field.options || []).map((opt) => {
                      const selectedList: string[] = formData[field.id] || [];
                      const isChecked = selectedList.includes(opt.value || opt.id);
                      return (
                        <label
                          key={opt.id}
                          className={`flex items-center gap-3 p-3.5 sm:p-3 rounded-xl border text-xs sm:text-sm cursor-pointer transition-all ${
                            isChecked
                              ? 'border-blue-600 bg-blue-50/30 text-blue-900 font-bold'
                              : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              const updated = e.target.checked
                                ? [...selectedList, opt.value || opt.id]
                                : selectedList.filter((x) => x !== (opt.value || opt.id));
                              handleFieldChange(field.id, updated);
                            }}
                            className="w-4 h-4 text-blue-600 rounded"
                          />
                          <span className="flex-1">{opt.label}</span>
                        </label>
                      );
                    })}
                  </div>
                ) : field.type === 'select' ? (
                  <select
                    value={formData[field.id] || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    className="w-full px-3.5 py-2.5 sm:py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  >
                    <option value="">انتخاب کنید</option>
                    {(field.options || []).map((o) => (
                      <option key={o.id} value={o.value || o.id}>
                        {o.label} {o.price ? `(${formatCurrency(o.price)})` : ''}
                      </option>
                    ))}
                  </select>
                ) : field.type === 'cascadingProvinceCity' ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <select
                        value={formData[`${field.id}_province`] || ''}
                        onChange={(e) => {
                          const newProvId = e.target.value;
                          const provObj = iranProvinces.find((p) => p.id === newProvId || p.name === newProvId);
                          const provName = provObj ? provObj.name : newProvId;
                          setFormData((prev) => ({
                            ...prev,
                            [`${field.id}_province`]: newProvId,
                            [`${field.id}_city`]: '',
                            [field.id]: provName ? provName : '',
                          }));
                          if (errors[field.id]) {
                            setErrors((prev) => {
                              const cp = { ...prev };
                              delete cp[field.id];
                              return cp;
                            });
                          }
                        }}
                        className="w-full px-3.5 py-2.5 sm:py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                      >
                        <option value="">-- انتخاب استان --</option>
                        {iranProvinces.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <select
                        value={formData[`${field.id}_city`] || ''}
                        onChange={(e) => {
                          const newCity = e.target.value;
                          const currentProvId = formData[`${field.id}_province`];
                          const provObj = iranProvinces.find((p) => p.id === currentProvId || p.name === currentProvId);
                          const provName = provObj ? provObj.name : currentProvId;
                          setFormData((prev) => ({
                            ...prev,
                            [`${field.id}_city`]: newCity,
                            [field.id]: provName && newCity ? `${provName} - ${newCity}` : (newCity || provName || ''),
                          }));
                          if (errors[field.id]) {
                            setErrors((prev) => {
                              const cp = { ...prev };
                              delete cp[field.id];
                              return cp;
                            });
                          }
                        }}
                        disabled={!formData[`${field.id}_province`]}
                        className="w-full px-3.5 py-2.5 sm:py-2 text-sm border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:bg-slate-100 transition-all"
                      >
                        <option value="">-- انتخاب شهر --</option>
                        {(
                          iranProvinces.find(
                            (p) => p.id === formData[`${field.id}_province`] || p.name === formData[`${field.id}_province`]
                          )?.cities || []
                        ).map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : field.type === 'toggle' ? (
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 cursor-pointer bg-slate-50/50">
                    <input
                      type="checkbox"
                      checked={!!formData[field.id]}
                      onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span className="text-xs font-semibold text-slate-800">{field.label}</span>
                  </label>
                ) : field.type === 'likeButton' ? (
                  <button
                    type="button"
                    onClick={() => handleFieldChange(field.id, !formData[field.id])}
                    className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 ${
                      formData[field.id]
                        ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                        : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <ThumbsUp className="w-4 h-4" />
                    <span>{formData[field.id] ? 'پسندیده شد ✓' : 'پسندیدم'}</span>
                  </button>
                ) : field.type === 'signature' ? (
                  <div className="border border-slate-300 rounded-xl p-3 bg-slate-50/50 space-y-2">
                    <canvas
                      ref={canvasRef}
                      width={500}
                      height={140}
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                      className="w-full h-36 bg-white border border-slate-200 rounded-lg cursor-crosshair touch-none"
                    />
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500">برای ثبت امضا، در کادر بالا با ماوس یا لمس بنویسید</span>
                      <button
                        type="button"
                        onClick={clearSignature}
                        className="px-2.5 py-1 text-rose-600 hover:bg-rose-50 rounded border border-rose-200"
                      >
                        پاک کردن امضا
                      </button>
                    </div>
                  </div>
                ) : field.type === 'mobile' ? (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        value={formData[field.id] || ''}
                        onChange={(e) => handleFieldChange(field.id, e.target.value)}
                        placeholder="۰۹۱۲۳۴۵۶۷۸۹"
                        className="flex-1 px-3.5 py-2.5 sm:py-2 text-sm border border-slate-300 rounded-xl font-mono text-left focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white transition-all"
                      />
                      {field.validations.verifyOtp && (
                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(true);
                            setEnteredOtp('3849');
                          }}
                          className="px-3.5 py-2.5 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-bold rounded-xl border border-slate-300 whitespace-nowrap transition-colors"
                        >
                          {otpSent ? 'کد پیامک: ۳۸۴۹' : 'ارسال کد تایید'}
                        </button>
                      )}
                    </div>
                    {field.validations.verifyOtp && otpSent && !otpVerified && (
                      <div className="flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-md">
                        <input
                          type="text"
                          value={enteredOtp}
                          onChange={(e) => setEnteredOtp(e.target.value)}
                          placeholder="کد ۴ رقمی پیامک شده"
                          className="w-32 px-2 py-1 text-xs border border-slate-300 rounded bg-white text-center font-mono"
                        />
                        <button
                          type="button"
                          onClick={() => setOtpVerified(true)}
                          className="px-3 py-1 bg-blue-600 text-white font-bold text-xs rounded hover:bg-blue-700"
                        >
                          تأیید کد
                        </button>
                      </div>
                    )}
                    {otpVerified && (
                      <div className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>شماره همراه با موفقیت تایید شد</span>
                      </div>
                    )}
                  </div>
                ) : field.type === 'audioRecord' ? (
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Mic className={`w-5 h-5 ${isRecordingAudio ? 'text-rose-600 animate-pulse' : 'text-slate-600'}`} />
                      <span className="text-xs font-semibold text-slate-800">
                        {isRecordingAudio ? 'در حال ضبط صدا از میکروفون...' : hasRecordedAudio ? 'پیام صوتی ضبط شد ✓' : 'پیام صوتی خود را ضبط کنید'}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleAudioRecord(field.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        isRecordingAudio
                          ? 'bg-rose-600 text-white'
                          : hasRecordedAudio
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-900 text-white'
                      }`}
                    >
                      {isRecordingAudio ? 'در حال ضبط...' : hasRecordedAudio ? 'ضبط مجدد' : 'شروع ضبط'}
                    </button>
                  </div>
                ) : field.type === 'appointmentBooking' ? (
                  <AppointmentScheduler
                    field={field}
                    value={formData[field.id]}
                    onChange={(val) => handleFieldChange(field.id, val)}
                    themeColor={theme?.themeColor || '#00897b'}
                    error={errors[field.id]}
                  />
                ) : field.type === 'fileUpload' || field.type === 'imageUpload' || field.type === 'photoCrop' ? (
                  <RealFileUploadField
                    field={field}
                    value={formData[field.id]}
                    onChange={(val) => handleFieldChange(field.id, val)}
                    error={errors[field.id]}
                  />
                ) : field.type === 'sectionDivider' ? (
                  <div className="py-2 border-b-2 border-slate-300 text-sm font-extrabold text-slate-900 pt-4">
                    {field.label}
                  </div>
                ) : field.type === 'alertBox' ? (
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs leading-relaxed">
                    {field.helpText || field.label}
                  </div>
                ) : field.type === 'satisfaction' ? (
                  <div className="flex items-center justify-around py-3 bg-slate-50 rounded-xl border border-slate-200">
                    {[
                      { emoji: '😡', label: 'خیلی ناراضی', val: 1 },
                      { emoji: '🙁', label: 'ناراضی', val: 2 },
                      { emoji: '😐', label: 'متوسط', val: 3 },
                      { emoji: '😊', label: 'راضی', val: 4 },
                      { emoji: '😍', label: 'بسیار عالی', val: 5 },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => handleFieldChange(field.id, item.val)}
                        className={`text-2xl p-2 rounded-xl transition-all ${
                          formData[field.id] === item.val
                            ? 'bg-blue-600/20 scale-125 ring-2 ring-blue-600'
                            : 'opacity-60 hover:opacity-100 hover:scale-110'
                        }`}
                        title={item.label}
                      >
                        {item.emoji}
                      </button>
                    ))}
                  </div>
                ) : field.type === 'termsCheckbox' ? (
                  <label className="flex items-start gap-2.5 p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 text-xs text-slate-800 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={!!formData[field.id]}
                      onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                    />
                    <span className="leading-relaxed">
                      {field.placeholder || 'تمامی قوانین، شرایط و مقررات استفاده از این سامانه را با دقت مطالعه نموده و موافقت خود را اعلام می‌دارم.'}
                    </span>
                  </label>
                ) : field.type === 'mapLocation' ? (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">موقعیت جغرافیایی:</span>
                      <button
                        type="button"
                        onClick={() => handleFieldChange(field.id, '۳۵.۶۸۹۲, ۵۱.۳۸۹۰ (تهران)')}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-bold flex items-center gap-1 shadow-xs"
                      >
                        <MapPin className="w-3.5 h-3.5" />
                        <span>ثبت موقعیت کنونی (GPS)</span>
                      </button>
                    </div>
                    {formData[field.id] && (
                      <div className="text-[11px] text-emerald-800 font-mono bg-emerald-50 p-2 rounded border border-emerald-200">
                        موقعیت ثبت‌شده: {formData[field.id]}
                      </div>
                    )}
                  </div>
                ) : field.type === 'richText' ? (
                  <div className="border border-slate-300 rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-blue-600 bg-white">
                    <div className="flex items-center gap-2 p-1.5 bg-slate-50 border-b border-slate-200 text-slate-600 text-xs">
                      <span className="font-bold px-1.5 py-0.5 rounded hover:bg-slate-200 cursor-pointer">B</span>
                      <span className="italic font-serif px-1.5 py-0.5 rounded hover:bg-slate-200 cursor-pointer">I</span>
                      <span className="underline px-1.5 py-0.5 rounded hover:bg-slate-200 cursor-pointer">U</span>
                    </div>
                    <textarea
                      rows={4}
                      value={formData[field.id] || ''}
                      onChange={(e) => handleFieldChange(field.id, e.target.value)}
                      placeholder={field.placeholder || 'متن خود را اینجا وارد کنید...'}
                      className="w-full p-2.5 text-xs focus:outline-none resize-none"
                    />
                  </div>
                ) : field.type === 'likertScale' ? (
                  <div className="grid grid-cols-4 gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200">
                    {[
                      { label: 'بسیار خوب', val: 4 },
                      { label: 'خوب', val: 3 },
                      { label: 'متوسط', val: 2 },
                      { label: 'ضعیف', val: 1 },
                    ].map((item) => (
                      <button
                        key={item.val}
                        type="button"
                        onClick={() => handleFieldChange(field.id, item.val)}
                        className={`py-2 px-1 text-center text-xs rounded-lg transition-all ${
                          formData[field.id] === item.val
                            ? 'bg-blue-600 text-white font-bold shadow-xs'
                            : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                ) : field.type === 'choiceTable' ? (
                  <div className="border border-slate-200 rounded-xl overflow-hidden text-xs bg-white">
                    <div className="grid grid-cols-3 bg-slate-100 font-bold p-2 text-center text-slate-700">
                      <span>عنوان سوال</span>
                      <span>بله</span>
                      <span>خیر</span>
                    </div>
                    {['مورد الف', 'مورد ب', 'مورد ج'].map((row, rIdx) => (
                      <div key={rIdx} className="grid grid-cols-3 p-2 text-center border-t border-slate-100 items-center text-slate-700">
                        <span>{row}</span>
                        <input
                          type="radio"
                          name={`ct_${field.id}_${rIdx}`}
                          onChange={() => handleFieldChange(`${field.id}_${rIdx}`, 'yes')}
                          className="mx-auto text-blue-600"
                        />
                        <input
                          type="radio"
                          name={`ct_${field.id}_${rIdx}`}
                          onChange={() => handleFieldChange(`${field.id}_${rIdx}`, 'no')}
                          className="mx-auto text-blue-600"
                        />
                      </div>
                    ))}
                  </div>
                ) : field.type === 'jalaliDate' ? (
                  <JalaliDateFieldInput
                    field={field}
                    value={formData[field.id]}
                    onChange={(val) => handleFieldChange(field.id, val)}
                    hasError={Boolean(hasError)}
                  />
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : field.type === 'password' ? 'password' : 'text'}
                    value={formData[field.id] || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    className={`w-full px-3.5 py-2.5 sm:py-2 text-base sm:text-sm border rounded-xl touch-manipulation focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white transition-all ${
                      hasError ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-600'
                    }`}
                  />
                )}

                {hasError && (
                  <div className="pt-1">
                    <div className="text-xs text-rose-600 font-bold flex items-center gap-1.5 p-2 rounded-xl bg-rose-50 border border-rose-200">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{errors[field.id]}</span>
                    </div>
                    {field.id === 'f_mobile' && errors[field.id]?.includes('بازیابی') && (
                      <button
                        type="button"
                        onClick={() => {
                          setForgotMobileInput(formData[field.id] || '');
                          setShowForgotModal(true);
                          setForgotResult(null);
                        }}
                        className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer shadow-xs"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>بازیابی شماره پرونده</span>
                      </button>
                    )}
                  </div>
                )}

                {field.helpText && field.type !== 'alertBox' && (
                  <p className="text-[11px] text-slate-400 pt-0.5">{field.helpText}</p>
                )}

              </div>
            );
          })}
        </div>

        {/* فاکتور مبلغ نهایی در صورت فعال بودن پرداخت */}
        {form.payment.enabled && calculatedAmount > 0 && (
          <div className="mt-6 p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-700 font-bold">
              <CreditCard className="w-4 h-4 text-emerald-600" />
              <span>مبلغ قابل پرداخت فاکتور:</span>
            </div>
            <div className="text-base font-extrabold text-blue-900">
              {formatCurrency(calculatedAmount, 'IRT')}
            </div>
          </div>
        )}

        {/* پیام راهنمای تکمیل کامل مرحله چهارم وضعیت سلامت */}
        {(form.id === 'form-belhagh-registration' || form.slug === 'zexuz') && currentStepIndex === 3 && (() => {
          const step4Fields = ['f_physical_illness', 'f_mental_illness', 'f_medications'];
          const isStep4Incomplete = step4Fields.some((fid) => {
            const val = formData[fid];
            return !val || (typeof val === 'string' && val.trim() === '');
          });
          return (
            <div className={`p-3.5 rounded-2xl border text-xs flex items-center gap-2.5 my-3 transition-all animate-in fade-in ${isStep4Incomplete ? 'bg-amber-50/90 border-amber-300 text-amber-900 shadow-xs' : 'bg-emerald-50/90 border-emerald-300 text-emerald-900 shadow-xs'}`}>
              {isStep4Incomplete ? (
                <>
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <span className="font-extrabold block text-amber-950 mb-0.5">توجه: مرحله چهارم نهایی است</span>
                    <span>تا زمانی که تمام قسمت‌های مرحله چهارم (وضعیت بیماری جسمی، بیماری روانی و داروهای مصرفی) تکمیل نشوند، امکان ثبت نهایی فرم وجود ندارد (در صورت عدم سابقه، بنویسید «ندارم»).</span>
                  </div>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                  <div className="leading-relaxed">
                    <span className="font-extrabold block text-emerald-950 mb-0.5">تمام قسمت‌های مرحله چهارم تکمیل شد</span>
                    <span>اطلاعات سلامت با موفقیت تکمیل گردید. اکنون می‌توانید روی دکمه «ثبت فرم» کلیک فرمایید.</span>
                  </div>
                </>
              )}
            </div>
          );
        })()}

        {/* هشدار شرطی در صورتی که کاربر عضو سایت نباشد و اجازه رفتن به مرحله بعد نداشته باشد */}
        {(form.id === 'form-belhagh-registration' || form.slug === 'zexuz') && currentStepIndex === 0 && (formData['f_ebadollah_member'] === 'no' || formData['f_ebadollah_member'] === 'خیر') && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs leading-relaxed flex items-start gap-2.5 my-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block mb-0.5">عدم امکان ادامه مراحل:</span>
              <span>ثبت نام در این سامانه منحصراً ویژه اعضای محترم سایت عبادالله می‌باشد. با توجه به انتخاب گزینه «خیر»، امکان رفتن به مراحل بعد وجود ندارد.</span>
            </div>
          </div>
        )}

        {(form.id === 'form-belhagh-booking' || form.slug === '3uu4z') && currentStepIndex === 2 && (formData['f_khankaram_member'] === 'no' || formData['f_khankaram_member'] === 'خیر') && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs leading-relaxed flex items-start gap-2.5 my-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block mb-0.5">عدم امکان ادامه مراحل:</span>
              <span>رزرو نوبت مشاوره تلفنی منحصراً مختص اعضای محترم سایت خوان کرم و عبادالله می‌باشد.</span>
            </div>
          </div>
        )}

        {/* دکمه‌های ناوبری مرحله‌ای و ثبت فرم با چیدمان لمسی بهینه‌شده موبایل */}
        <div className="pt-6 border-t border-slate-100 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {form.mode === 'wizard' && currentStepIndex > 0 ? (
              <>
                <button
                  type="button"
                  onClick={handlePrevStep}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>مرحله قبل</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthGateMode('portal');
                    setCurrentStepIndex(0);
                  }}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-3 py-2.5 sm:py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span>صفحه اول</span>
                </button>
              </>
            ) : form.mode === 'wizard' && currentStepIndex === 0 ? (
              <button
                type="button"
                onClick={() => {
                  setAuthGateMode('portal');
                  setCurrentStepIndex(0);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>بازگشت به صفحه اول</span>
              </button>
            ) : activePageIndex > 0 ? (
              <>
                <button
                  type="button"
                  onClick={handlePrevPage}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  <ArrowRight className="w-4 h-4" />
                  <span>مرحله قبل</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAuthGateMode('portal');
                  }}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1 px-3 py-2.5 sm:py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 rounded-xl hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <span>صفحه اول</span>
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAuthGateMode('portal');
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 sm:py-2 text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                <span>بازگشت به صفحه اول</span>
              </button>
            )}
          </div>

          <div>
            {activePageIndex < pages.length - 1 ? (
              <button
                type="button"
                onClick={handleNextPage}
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer ${borderRadiusClass || 'rounded-xl'}`}
                style={{
                  backgroundColor: theme?.buttonColor || '#0284c7',
                  color: theme?.buttonTextColor || '#ffffff',
                }}
              >
                <span>{activePageFields[activePageFields.length - 1]?.nextButtonText || 'مرحله بعد'}</span>
                <ArrowLeft className="w-4 h-4" />
              </button>
            ) : form.mode === 'wizard' && currentStepIndex < (form.steps?.length || 1) - 1 ? (
              canProceedToNextStep ? (
                <button
                key={`wizard-step-next-${currentStepIndex}`}
                  type="button"
                  onClick={handleNextStep}
                  className={`w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-6 py-3 sm:py-2.5 text-xs sm:text-sm font-bold shadow-sm transition-all cursor-pointer ${borderRadiusClass || 'rounded-xl'}`}
                  style={{
                    backgroundColor: theme?.buttonColor || '#0284c7',
                    color: theme?.buttonTextColor || '#ffffff',
                  }}
                >
                  <span>مرحله بعد</span>
                  <ArrowLeft className="w-4 h-4" />
                </button>
              ) : null
            ) : (
              <button
                key={`wizard-step-submit-${currentStepIndex}`}
                type="submit"
                className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 sm:py-2.5 text-xs sm:text-sm font-bold shadow-md transition-all cursor-pointer ${borderRadiusClass || 'rounded-xl'}`}
                style={{
                  backgroundColor: theme?.buttonColor || '#0284c7',
                  color: theme?.buttonTextColor || '#ffffff',
                }}
              >
                <span>
                  {form.payment.enabled && calculatedAmount > 0
                    ? 'رفتن به درگاه پرداخت و ثبت'
                    : (form.id === 'form-belhagh-registration' || form.slug === 'zexuz')
                    ? 'ثبت فرم'
                    : 'ثبت و تکمیل پرونده نوبت‌دهی'}
                </span>
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </form>

      {/* مودال درگاه پرداخت شاپرک */}
      <PaymentModal
        isOpen={isPaymentOpen}
        amount={calculatedAmount}
        description={form.payment.description || form.title}
        gateway={form.payment.gateway}
        onSuccess={(refId) => {
          setIsPaymentOpen(false);
          finalizeSubmission(refId);
        }}
        onCancel={() => setIsPaymentOpen(false)}
      />

      {/* مودال اطلاع‌رسانی ثبت‌نام تکراری */}
      {duplicateCaseInfo && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-amber-200 text-center relative overflow-hidden">
            <div className="w-16 h-16 mx-auto mb-4 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-200 shadow-inner">
              <AlertCircle className="w-9 h-9" />
            </div>

            <h3 className="text-base sm:text-lg font-black text-slate-800 mb-2 leading-relaxed">
              شما قبلاً ثبت نام کرده اید و باید شماره پرونده را بازیابی کنید
            </h3>

            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              برای شماره همراه وارد شده قبلاً در سامانه خدمات روانشناسی بالحق پرونده تشکیل شده است و امکان ثبت‌نام مجدد وجود ندارد.
            </p>

            <div className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl mb-5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">نام و نام خانوادگی:</span>
                <span className="font-bold text-slate-800">{duplicateCaseInfo.name || 'مراجع محترم'}</span>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-amber-200/60">
                <span className="text-slate-500 font-medium">کد پرونده شما:</span>
                <span className="font-black text-amber-700 font-mono tracking-wider text-base">
                  {duplicateCaseInfo.caseCode}
                </span>
              </div>
            </div>

            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => {
                  const caseCode = duplicateCaseInfo.caseCode;
                  if (typeof window !== 'undefined') {
                    try {
                      localStorage.setItem('belhagh_current_case_code', caseCode);
                    } catch (e) {}
                  }
                  setDuplicateCaseInfo(null);
                  if (onNavigateToForm) {
                    onNavigateToForm('3uu4z');
                  } else if (typeof window !== 'undefined') {
                    window.location.href = '/form/3uu4z';
                  }
                }}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>ورود به سامانه نوبت‌دهی با این پرونده</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setDuplicateCaseInfo(null);
                  setCurrentStepIndex(0);
                  setInternalPageIndex(0);
                  setTimeout(() => {
                    const el = document.getElementById('field-f_mobile');
                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }, 100);
                }}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <FileEdit className="w-4 h-4" />
                <span>ویرایش یا تغییر شماره همراه</span>
              </button>
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};
