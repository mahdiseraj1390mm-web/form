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
  CalendarDays
} from 'lucide-react';
import { 
  isValidIranianNationalCode, 
  isValidIranianMobile, 
  toPersianDigits, 
  formatCurrency, 
  formatPersianDateTime 
} from '@/lib/persian';
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

export const FormRunner: React.FC<FormRunnerProps> = ({ 
  form, 
  onBackToStudio,
  onNavigateToForm,
  initialFormData,
}) => {
  const { submitFormResponse } = useForm();
  
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

  // لود مقادیر پیش‌فرض و مقادیر از پیش‌پر شده (از فرم ثبت نام قبلی)
  useEffect(() => {
    setSubmittedResult(null);
    setCurrentStepIndex(0);
    setInternalPageIndex(0);
    setErrors({});
    setOtpVerified(false);
    setOtpSent(false);

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
  }, [form.id, form.slug, form.fields, initialFormData]);

  const handleGoToNextChainedForm = () => {
    if (!form.behavior?.nextChainedForm) return;
    const targetSlug = form.behavior.nextChainedForm.formSlug;
    const targetId = form.behavior.nextChainedForm.formId;

    const prefilledData: Record<string, any> = {};
    if (form.behavior.nextChainedForm.prefillMapping) {
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

    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('prefill_' + targetSlug, JSON.stringify(prefilledData));
        sessionStorage.setItem('prefill_' + targetId, JSON.stringify(prefilledData));
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
        if (String(val).trim() === String(expected).trim()) return true;
        if (
          selectedOption &&
          (String(selectedOption.label).trim() === String(expected).trim() ||
            String(selectedOption.value).trim() === String(expected).trim())
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

  // بررسی شرط مجاز بودن دکمه «مرحله بعد»
  const canProceedToNextStep = useMemo(() => {
    // فرم ۱ (ثبت نام): در مرحله اول اگر کاربر صریحاً «خیر» را انتخاب کند، بقیه مراحل کلاً مخفی می‌شود
    if (form.id === 'form-belhagh-registration' || form.slug === 'zexuz') {
      if (currentStepIndex === 0) {
        if (formData['f_ebadollah_member'] === 'no') return false;
      }
    }
    // فرم ۲ (نوبت دهی): در مرحله سابقه مشاوره اگر عضو نباشد («خیر»)، دکمه مرحله بعد کلاً مخفی می‌شود
    if (form.id === 'form-belhagh-booking' || form.slug === '3uu4z') {
      if (currentStepIndex === 2) {
        if (formData['f_khankaram_member'] === 'no') return false;
      }
    }
    return true;
  }, [form.id, form.slug, currentStepIndex, formData]);

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
      if (f.validations?.required && (!val || val === '')) {
        newErrors[f.id] = 'تکمیل این فیلد الزامی است.';
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
    return Object.keys(newErrors).length === 0;
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

  const handleNextStep = () => {
    if (!validateFields(currentStepFields)) return;

    if (currentStepIndex < form.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1);
      setInternalPageIndex(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      handleSubmit();
    }
  };

  const handlePrevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1);
      setInternalPageIndex(0);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (pages.length > 1 && activePageIndex < pages.length - 1) {
      handleNextPage();
      return;
    }

    const fieldsToValidate = form.fields;
    if (!validateFields(fieldsToValidate)) return;

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

    const sub = submitFormResponse(form.id, formData, paymentInfo, quizResult);
    setSubmittedResult(sub);

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

        {/* کادر کد رهگیری اختصاصی */}
        <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 inline-block w-full max-w-sm">
          <span className="text-[11px] text-slate-500 block mb-1">کد پیگیری رسمی:</span>
          <span className="text-xl font-extrabold text-blue-700 tracking-wider font-mono">
            {submittedResult.trackingCode}
          </span>
          <span className="text-[10px] text-slate-400 block mt-1">
            {formatPersianDateTime(submittedResult.createdAt)}
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

        {/* گزینه انتقال به فرم دوم (تشکیل پرونده مشاور و نوبت دهی مشاوره تلفنی) */}
        {form.behavior?.nextChainedForm && (
          <div className="p-6 bg-gradient-to-br from-blue-50 via-indigo-50/70 to-purple-50 rounded-2xl border-2 border-blue-400 text-right space-y-4 shadow-md animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md">
                <PhoneCall className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[11px] font-extrabold text-blue-700 bg-blue-100/90 px-2 py-0.5 rounded-md inline-block mb-1">
                  مرحله بعدی
                </span>
                <h3 className="text-base font-extrabold text-slate-900">
                  {form.behavior.nextChainedForm.title}
                </h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {form.behavior.nextChainedForm.description ||
                'ثبت نام اولیه شما با موفقیت تکمیل شد. اکنون جهت تشکیل پرونده مشاور و رزرو زمان مشاوره تلفنی، بر روی دکمه زیر کلیک فرمایید:'}
            </p>

            <button
              type="button"
              onClick={handleGoToNextChainedForm}
              className="w-full py-3.5 px-5 bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <PhoneCall className="w-4 h-4" />
              <span>{form.behavior.nextChainedForm.buttonText || 'تشکیل پرونده مشاور و دریافت نوبت مشاوره تلفنی'}</span>
              <ArrowLeft className="w-4 h-4 mr-auto" />
            </button>
          </div>
        )}

        <div className="pt-4 flex items-center justify-center gap-3">
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 text-white text-xs font-semibold rounded-md shadow-sm hover:bg-slate-800 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>چاپ برگه رسید رسمی</span>
          </button>

          <button
            onClick={() => {
              setSubmittedResult(null);
              setFormData({});
              setCurrentStepIndex(0);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-md hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>ثبت فرم جدید</span>
          </button>
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
      className="min-h-screen py-8 px-4 flex flex-col items-center justify-start transition-all duration-300 w-full relative"
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
        
        {/* سربرگ فرم */}
        <div 
          className={`${borderRadiusClass} border shadow-xs p-6 sm:p-8 mb-6 transition-all`}
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
            <div className="flex items-center justify-between">
              <h1 className="text-xl font-extrabold" style={{ color: theme?.titleColor || '#0f172a' }}>{form.title}</h1>
              {onBackToStudio && (
                <button
                  onClick={onBackToStudio}
                  className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                >
                  بازگشت به ویرایشگر فرم
                </button>
              )}
            </div>
            {form.description && (
              <p className="text-xs mt-2 leading-relaxed" style={{ color: theme?.textColor || '#64748b' }}>{form.description}</p>
            )}
          </div>

        {/* استپر استاندارد فرم‌افزار مطابق عکس‌های ارسالی کاربر */}
        {form.mode === 'wizard' && form.steps && form.steps.length > 1 && (
          <div className="pt-6 pb-2 border-t border-slate-100/80">
            <div className="relative flex items-center justify-between max-w-2xl mx-auto px-4">
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
                      disabled={!isPassed && !isActive}
                      onClick={() => {
                        if (isPassed) {
                          setCurrentStepIndex(idx);
                          setInternalPageIndex(0);
                        }
                      }}
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200"
                      style={{
                        backgroundColor: isActive
                          ? themeCol
                          : isPassed
                          ? `${themeCol}dd`
                          : `${themeCol}28`,
                        color: isActive || isPassed ? '#ffffff' : themeCol,
                        boxShadow: isActive ? `0 0 0 4px ${themeCol}30` : undefined,
                        transform: isActive ? 'scale(1.15)' : undefined,
                        cursor: isPassed ? 'pointer' : 'default',
                      }}
                    >
                      {toPersianDigits(idx + 1)}
                    </button>
                    <span 
                      className={`mt-2 text-[11px] font-bold text-center transition-colors max-w-[120px] ${
                        isActive
                          ? 'text-slate-900'
                          : isPassed
                          ? 'text-slate-600'
                          : 'text-slate-400'
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
        className={`${borderRadiusClass} border shadow-xs p-6 sm:p-8 space-y-6 transition-all`}
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
              <div key={field.id} className={`${colClass} space-y-1.5`}>
                
                {/* عنوان و وضعیت اعتبارسنجی زنده */}
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold" style={{ color: theme?.labelColor || '#1e293b' }}>
                    {field.label}
                    {field.validations.required && <span className="text-rose-500 mr-1">*</span>}
                  </label>

                  {field.type === 'nationalCode' && formData[field.id] && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
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
                    className={`w-full px-3 py-2 text-xs border rounded-md focus:outline-none focus:ring-1 bg-white ${
                      hasError ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-600'
                    }`}
                  />
                ) : ['radio', 'quizQuestion'].includes(field.type) ? (
                  <div className="space-y-2 pt-1">
                    {(field.options || []).map((opt) => (
                      <label
                        key={opt.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-all ${
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
                          className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition-all ${
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
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="">-- لطفاً انتخاب کنید --</option>
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
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
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
                        className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-600 disabled:bg-slate-100"
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
                        className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-md font-mono text-left"
                      />
                      {field.validations.verifyOtp && (
                        <button
                          type="button"
                          onClick={() => {
                            setOtpSent(true);
                            setEnteredOtp('3849');
                          }}
                          className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-md border border-slate-300 whitespace-nowrap"
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
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : field.type === 'password' ? 'password' : 'text'}
                    value={formData[field.id] || ''}
                    onChange={(e) => handleFieldChange(field.id, e.target.value)}
                    placeholder={field.placeholder}
                    className={`w-full px-3 py-2 text-xs border rounded-md focus:outline-none focus:ring-1 bg-white ${
                      hasError ? 'border-rose-400 focus:ring-rose-500' : 'border-slate-300 focus:ring-blue-600'
                    }`}
                  />
                )}

                {hasError && (
                  <div className="text-[11px] text-rose-600 flex items-center gap-1 pt-0.5">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{errors[field.id]}</span>
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

        {/* هشدار شرطی در صورتی که کاربر عضو سایت نباشد و اجازه رفتن به مرحله بعد نداشته باشد */}
        {(form.id === 'form-belhagh-registration' || form.slug === 'zexuz') && currentStepIndex === 0 && formData['f_ebadollah_member'] === 'no' && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs leading-relaxed flex items-start gap-2.5 my-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block mb-0.5">عدم امکان ادامه مراحل:</span>
              <span>ثبت نام در این سامانه منحصراً ویژه اعضای محترم سایت عبادالله می‌باشد. با توجه به انتخاب گزینه «خیر»، امکان رفتن به مراحل بعد وجود ندارد.</span>
            </div>
          </div>
        )}

        {(form.id === 'form-belhagh-booking' || form.slug === '3uu4z') && currentStepIndex === 2 && formData['f_khankaram_member'] === 'no' && (
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-amber-900 text-xs leading-relaxed flex items-start gap-2.5 my-3 animate-in fade-in">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-extrabold block mb-0.5">عدم امکان ادامه مراحل:</span>
              <span>رزرو نوبت مشاوره تلفنی منحصراً مختص اعضای محترم سایت خوان کرم و عبادالله می‌باشد.</span>
            </div>
          </div>
        )}

        {/* دکمه‌های ناوبری مرحله‌ای و ثبت فرم مطابق تصویر فرم‌افزار */}
        <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
          <div>
            {form.mode === 'wizard' && currentStepIndex > 0 ? (
              <button
                type="button"
                onClick={handlePrevStep}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <span>مرحله قبل</span>
              </button>
            ) : activePageIndex > 0 ? (
              <button
                type="button"
                onClick={handlePrevPage}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
              >
                <span>مرحله قبل</span>
              </button>
            ) : null}
          </div>

          <div>
            {activePageIndex < pages.length - 1 ? (
              <button
                type="button"
                onClick={handleNextPage}
                className={`inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold shadow-sm transition-all cursor-pointer ${borderRadiusClass}`}
                style={{
                  backgroundColor: theme?.buttonColor || '#0284c7',
                  color: theme?.buttonTextColor || '#ffffff',
                }}
              >
                <span>{activePageFields[activePageFields.length - 1]?.nextButtonText || 'مرحله بعد'}</span>
              </button>
            ) : form.mode === 'wizard' && currentStepIndex < (form.steps?.length || 1) - 1 ? (
              canProceedToNextStep ? (
                <button
                  type="button"
                  onClick={handleNextStep}
                  className={`inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold shadow-sm transition-all cursor-pointer ${borderRadiusClass}`}
                  style={{
                    backgroundColor: theme?.buttonColor || '#0284c7',
                    color: theme?.buttonTextColor || '#ffffff',
                  }}
                >
                  <span>مرحله بعد</span>
                </button>
              ) : null
            ) : (
              <button
                type="submit"
                className={`inline-flex items-center gap-2 px-6 py-2.5 text-xs font-bold shadow-md transition-all cursor-pointer ${borderRadiusClass}`}
                style={{
                  backgroundColor: theme?.buttonColor || '#0284c7',
                  color: theme?.buttonTextColor || '#ffffff',
                }}
              >
                <span>{form.payment.enabled && calculatedAmount > 0 ? 'رفتن به درگاه پرداخت و ثبت' : 'ثبت فرم'}</span>
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

      </div>
    </div>
  );
};
