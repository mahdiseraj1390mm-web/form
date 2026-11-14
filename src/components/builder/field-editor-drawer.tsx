'use client';

import React, { useState, useMemo } from 'react';
import { 
  FormField, 
  SelectOption, 
  Form, 
  ConditionalRule, 
  ConditionOperator, 
  ConditionAction, 
  WorkDayPeriod,
  FormConsultantBookingConfig,
  AppointmentData,
  BankCardData
} from '@/types/form';
import { 
  X, 
  Trash2, 
  Plus, 
  HelpCircle, 
  Calculator, 
  Sparkles, 
  Clock, 
  MapPin, 
  Palette, 
  Code,
  Check,
  ChevronDown,
  Calendar,
  Coffee,
  Ban,
  Edit2,
  GitBranch,
  Sliders,
  Copy,
  UserCheck,
  CheckSquare,
  Square,
  RefreshCw,
  User,
  CreditCard,
  UploadCloud
} from 'lucide-react';
import { toPersianDigits } from '@/lib/persian';
import { predefinedLists, iranProvinces } from '@/lib/iran-geo';
import { useForm } from '@/context/form-context';
import { COUNSELING_TOPICS, isConsultantMember } from '@/lib/consultant-helpers';
import { ConsultantScheduleModal } from '@/components/consultants/consultant-schedule-modal';
import { BankCardDisplay } from '@/components/ui/bank-card-display';
import { 
  IRANIAN_BANKS, 
  getBankByKey, 
  detectBankFromCardNumber, 
  formatCardNumber, 
  cleanCardNumber 
} from '@/lib/iran-banks';

interface FieldEditorDrawerProps {
  field: FormField | null;
  form: Form;
  onClose: () => void;
  onUpdate: (updated: Partial<FormField>) => void;
  onDelete: (fieldId: string) => void;
  onDuplicate?: (field: FormField) => void;
  onUpdateForm?: (updated: Partial<Form>) => void;
}

export const FieldEditorDrawer: React.FC<FieldEditorDrawerProps> = ({
  field,
  form,
  onClose,
  onUpdate,
  onDelete,
  onDuplicate,
  onUpdateForm,
}) => {
  if (!field) return null;

  const { teamMembers } = useForm();
  const [editingScheduleConsultant, setEditingScheduleConsultant] = useState<{
    id: string;
    name: string;
    topics?: string[];
    schedule: AppointmentData;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<'general' | 'validation' | 'rules' | 'options' | 'formula' | 'quiz' | 'style' | 'booking' | 'bankCard'>(
    field.type === 'appointmentBooking' ? 'booking' : field.type === 'bankCard' ? 'bankCard' : 'general'
  );
  const [newPresetAmount, setNewPresetAmount] = useState('');

  // وضعیت و متغیرهای شروط منطقی
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<ConditionalRule | null>(null);
  const [ruleValue, setRuleValue] = useState('');
  const [ruleOperator, setRuleOperator] = useState<ConditionOperator>('equals');
  const [ruleTargetFieldId, setRuleTargetFieldId] = useState('');
  const [ruleAction, setRuleAction] = useState<ConditionAction>('show');
  const [hasSecondTarget, setHasSecondTarget] = useState(false);
  const [ruleSecondTargetFieldId, setRuleSecondTargetFieldId] = useState('');

  const fieldRules = (form.rules || []).filter((r) => r.sourceFieldId === field.id);

  const handleOpenAddRule = () => {
    setEditingRule(null);
    setRuleValue(field.options?.[0]?.label || field.options?.[0]?.value || '');
    setRuleOperator('equals');
    const firstOther = form.fields.find((f) => f.id !== field.id);
    setRuleTargetFieldId(firstOther?.id || '');
    setRuleAction('show');
    setHasSecondTarget(false);
    setRuleSecondTargetFieldId('');
    setIsRuleModalOpen(true);
  };

  const handleOpenEditRule = (rule: ConditionalRule) => {
    setEditingRule(rule);
    setRuleValue(rule.value || '');
    setRuleOperator(rule.operator || 'equals');
    setRuleTargetFieldId(rule.targetFieldId || rule.targetFieldIds?.[0] || '');
    setRuleAction(rule.action || 'show');
    const second = rule.additionalTargetFieldId || (rule.targetFieldIds && rule.targetFieldIds.length > 1 ? rule.targetFieldIds[1] : '');
    setHasSecondTarget(!!second);
    setRuleSecondTargetFieldId(second || '');
    setIsRuleModalOpen(true);
  };

  const handleSaveRule = () => {
    if (!ruleTargetFieldId) return;
    
    let updatedRules = [...(form.rules || [])];
    const targetIds = hasSecondTarget && ruleSecondTargetFieldId 
      ? [ruleTargetFieldId, ruleSecondTargetFieldId] 
      : [ruleTargetFieldId];

    if (editingRule) {
      updatedRules = updatedRules.map((r) =>
        r.id === editingRule.id
          ? {
              ...r,
              sourceFieldId: field.id,
              operator: ruleOperator,
              value: ruleValue,
              action: ruleAction,
              targetFieldId: ruleTargetFieldId,
              additionalTargetFieldId: hasSecondTarget && ruleSecondTargetFieldId ? ruleSecondTargetFieldId : undefined,
              targetFieldIds: targetIds,
            }
          : r
      );
    } else {
      const newRule: ConditionalRule = {
        id: `rule_${Date.now()}`,
        sourceFieldId: field.id,
        operator: ruleOperator,
        value: ruleValue,
        action: ruleAction,
        targetFieldId: ruleTargetFieldId,
        additionalTargetFieldId: hasSecondTarget && ruleSecondTargetFieldId ? ruleSecondTargetFieldId : undefined,
        targetFieldIds: targetIds,
      };
      updatedRules.push(newRule);
    }

    onUpdateForm?.({ rules: updatedRules });
    setIsRuleModalOpen(false);
    setEditingRule(null);
  };

  const handleDeleteRule = (ruleId: string) => {
    const updatedRules = (form.rules || []).filter((r) => r.id !== ruleId);
    onUpdateForm?.({ rules: updatedRules });
  };

  const renderRulesSection = () => {
    return (
      <div className="space-y-3 pt-3 border-t border-slate-100">
        <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
          <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5 text-blue-600" />
            <span>شرط‌ها</span>
          </span>
          <button
            type="button"
            onClick={handleOpenAddRule}
            className="text-blue-600 hover:text-blue-700 font-bold text-xs flex items-center gap-1 cursor-pointer transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>افزودن شرط</span>
          </button>
        </div>

        {fieldRules.length === 0 ? (
          <div className="p-4 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center space-y-1">
            <span className="text-[11px] text-slate-400 block">شرطی برای این فیلد تعریف نشده است.</span>
            <button
              type="button"
              onClick={handleOpenAddRule}
              className="text-[11px] text-blue-600 font-bold hover:underline inline-flex items-center gap-1 mt-1 cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>افزودن شرط جدید</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {fieldRules.map((rule) => {
              const sourceField = form.fields.find((f) => f.id === rule.sourceFieldId) || field;
              const sourceLabel = sourceField?.label || field.label;
              const targetField = form.fields.find((f) => f.id === rule.targetFieldId);
              const targetLabel = targetField?.label || rule.targetFieldId;
              const additionalTarget = rule.additionalTargetFieldId
                ? form.fields.find((f) => f.id === rule.additionalTargetFieldId)
                : rule.targetFieldIds && rule.targetFieldIds.length > 1
                ? form.fields.find((f) => f.id === rule.targetFieldIds![1])
                : null;
              const additionalTargetLabel = additionalTarget?.label || rule.additionalTargetFieldId;

              const opText = rule.operator === 'equals' ? 'بود' : rule.operator === 'notEquals' ? 'نبود' : 'شامل بود';

              return (
                <div
                  key={rule.id}
                  className="p-3 bg-white border border-slate-200 hover:border-blue-400 rounded-xl space-y-2 transition text-xs shadow-2xs group relative select-text"
                >
                  <div className="leading-relaxed text-slate-800">
                    <span className="text-rose-600 font-bold">اگر</span>{' '}
                    <span className="font-bold text-slate-900">{sourceLabel}</span>{' '}
                    <span className="text-slate-600">برابر با</span>{' '}
                    <span className="font-bold text-slate-900">{rule.value}</span>{' '}
                    <span className="text-rose-600 font-bold">{opText}</span>{' '}
                    <span className="font-bold text-slate-900">{targetLabel}</span>{' '}
                    <span className="text-slate-700">آشکار شود، غیر از این شرایط پنهان شود</span>
                    {additionalTargetLabel && (
                      <>
                        {' '}<span className="text-rose-600 font-bold">و</span>{' '}
                        <span className="font-bold text-slate-900">{additionalTargetLabel}</span>{' '}
                        <span className="text-slate-700">آشکار شود، غیر از این شرایط پنهان شود</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleOpenEditRule(rule)}
                      className="text-[11px] text-blue-600 hover:bg-blue-50 px-2 py-0.5 rounded font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>ویرایش شرط</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-[11px] text-rose-600 hover:bg-rose-50 px-2 py-0.5 rounded font-bold flex items-center gap-1 transition cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>حذف</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // گزینه‌ها
  const hasOptions = ['radio', 'checkbox', 'select', 'quizQuestion'].includes(field.type);
  const isQuiz = field.type === 'quizQuestion';
  const isFormula = field.type === 'formula';
  const isBooking = field.type === 'appointmentBooking';
  const isBankCard = field.type === 'bankCard';

  const currentBankCardData = useMemo(() => {
    return field.bankCardData || {
      cardNumber: '6037-9979-1234-5678',
      cardHolder: 'مرکز خدمات روانشناسی بالحق',
      bankKey: 'melli',
      bankName: 'بانک ملی ایران',
      presetAmounts: [30000, 50000, 100000, 200000],
      showPresetAmounts: true,
      showCustomAmount: true,
      depositTitle: 'شماره کارت جهت واریز اختیاری:',
      description: 'در صورت تمایل، می‌توانید مبلغی را به عنوان هدیه یا مشارکت اختیاری واریز فرمایید',
      allowCopy: true,
      allowReceiptUpload: true,
      requireReceipt: false,
      receiptTitle: 'تصویر فیش واریزی (اختیاری):',
    };
  }, [field.bankCardData]);

  const handleUpdateBankCard = (partial: Partial<BankCardData>) => {
    const updated: BankCardData = {
      ...currentBankCardData,
      ...partial,
    };
    onUpdate({ bankCardData: updated });
  };

  const handleCardNumberInput = (raw: string) => {
    const clean = cleanCardNumber(raw);
    const formatted = formatCardNumber(clean);
    const detected = detectBankFromCardNumber(clean);
    if (detected && detected.key !== currentBankCardData.bankKey) {
      handleUpdateBankCard({
        cardNumber: formatted,
        bankKey: detected.key,
        bankName: detected.name,
      });
    } else {
      handleUpdateBankCard({ cardNumber: formatted });
    }
  };

  const handleAddPresetAmount = () => {
    const num = parseInt(cleanCardNumber(newPresetAmount), 10);
    if (!isNaN(num) && num > 0) {
      const current = currentBankCardData.presetAmounts || [];
      if (!current.includes(num)) {
        const sorted = [...current, num].sort((a, b) => a - b);
        handleUpdateBankCard({ presetAmounts: sorted });
      }
      setNewPresetAmount('');
    }
  };

  const handleRemovePresetAmount = (amt: number) => {
    const current = currentBankCardData.presetAmounts || [];
    handleUpdateBankCard({ presetAmounts: current.filter((a) => a !== amt) });
  };

  const handleAddOption = () => {
    const currentOptions = field.options || [];
    const newId = `opt_${Date.now()}`;
    const newOpt: SelectOption = {
      id: newId,
      label: `گزینه ${toPersianDigits(currentOptions.length + 1)}`,
      value: `val_${currentOptions.length + 1}`,
      price: 0,
      score: 0,
    };
    onUpdate({ options: [...currentOptions, newOpt] });
  };

  const handleUpdateOption = (optId: string, updatedProps: Partial<SelectOption>) => {
    const currentOptions = field.options || [];
    const updated = currentOptions.map((o) => (o.id === optId ? { ...o, ...updatedProps } : o));
    onUpdate({ options: updated });
  };

  const handleRemoveOption = (optId: string) => {
    const currentOptions = field.options || [];
    onUpdate({ options: currentOptions.filter((o) => o.id !== optId) });
  };

  // بارگذاری از لیست‌های آماده سازمانی
  const handleLoadPredefined = (listKey: keyof typeof predefinedLists) => {
    const list = predefinedLists[listKey];
    if (!list) return;

    const newOpts: SelectOption[] = list.map((item, idx) => ({
      id: `opt_${Date.now()}_${idx}`,
      label: item.label,
      value: item.value,
      price: 0,
      score: 0,
    }));

    onUpdate({ options: newOpts });
  };

  // فقط مشاوران تعریف‌شده در سامانه (رزرو نوبت و گزینه‌ها منحصراً از این افراد مجاز است)
  const availableConsultantsList = useMemo(() => {
    return (teamMembers || []).filter(isConsultantMember);
  }, [teamMembers]);

  // تاگل کردن مشاور برای این فرم
  const handleToggleConsultantForBooking = (consultant: any) => {
    const currentSelected = field.appointmentData?.selectedConsultants || [];
    const prefix = consultant.genderPrefix || (consultant.name.startsWith('خانم') ? 'خانم' : (consultant.name.startsWith('آقا') ? 'آقا' : ''));
    const cleanName = consultant.name.replace(/^(خانم|آقای?)\s+/, '');
    const fullName = prefix ? `${prefix} ${cleanName}` : consultant.name;
    const topics = consultant.allowedTopics?.length > 0 ? consultant.allowedTopics : ['clinical', 'family'];

    const existingIndex = currentSelected.findIndex((sc) => sc.consultantId === consultant.id);
    let updated: FormConsultantBookingConfig[];

    if (existingIndex >= 0) {
      updated = currentSelected.map((sc, idx) =>
        idx === existingIndex ? { ...sc, enabled: !sc.enabled } : sc
      );
    } else {
      updated = [
        ...currentSelected,
        {
          consultantId: consultant.id,
          consultantName: fullName,
          genderPrefix: prefix as any,
          enabled: true,
          enabledTopics: topics,
          customWorkingHours: consultant.workingHours,
        },
      ];
    }

    onUpdate({
      appointmentData: {
        slotDurationMinutes: field.appointmentData?.slotDurationMinutes ?? 45,
        restTimeMinutes: field.appointmentData?.restTimeMinutes ?? 15,
        availableDays: field.appointmentData?.availableDays ?? [0, 1, 2, 3, 4],
        ...field.appointmentData,
        selectedConsultants: updated,
      },
    });
  };

  // تاگل کردن موضوع خاص برای یک مشاور در این فرم
  const handleToggleTopicForConsultant = (consultantId: string, topicId: string) => {
    const currentSelected = field.appointmentData?.selectedConsultants || [];
    const updated = currentSelected.map((sc) => {
      if (sc.consultantId !== consultantId) return sc;
      const curTopics = sc.enabledTopics || [];
      const nextTopics = curTopics.includes(topicId)
        ? curTopics.filter((t) => t !== topicId)
        : [...curTopics, topicId];
      return { ...sc, enabledTopics: nextTopics };
    });

    onUpdate({
      appointmentData: {
        slotDurationMinutes: field.appointmentData?.slotDurationMinutes ?? 45,
        restTimeMinutes: field.appointmentData?.restTimeMinutes ?? 15,
        ...field.appointmentData,
        selectedConsultants: updated,
      },
    });
  };

  // بازنشانی ساعت سفارشی مشاور به ساعت کاری اصلی در تنظیمات
  const handleResetConsultantSchedule = (consultantId: string) => {
    const currentSelected = field.appointmentData?.selectedConsultants || [];
    const updated = currentSelected.map((sc) => {
      if (sc.consultantId !== consultantId) return sc;
      return { ...sc, customWorkingHours: undefined };
    });

    onUpdate({
      appointmentData: {
        slotDurationMinutes: field.appointmentData?.slotDurationMinutes ?? 45,
        restTimeMinutes: field.appointmentData?.restTimeMinutes ?? 15,
        ...field.appointmentData,
        selectedConsultants: updated,
      },
    });
  };

  // ذخیره ساعت سفارشی مشاور برای این فرم خاص
  const handleSaveCustomConsultantSchedule = (schedule: AppointmentData) => {
    if (!editingScheduleConsultant) return;
    const currentSelected = field.appointmentData?.selectedConsultants || [];
    const updated = currentSelected.map((sc) => {
      if (sc.consultantId !== editingScheduleConsultant.id) return sc;
      return { ...sc, customWorkingHours: schedule };
    });

    onUpdate({
      appointmentData: {
        slotDurationMinutes: field.appointmentData?.slotDurationMinutes ?? 45,
        restTimeMinutes: field.appointmentData?.restTimeMinutes ?? 15,
        ...field.appointmentData,
        selectedConsultants: updated,
      },
    });
    setEditingScheduleConsultant(null);
  };

  // انتخاب همه مشاوران سیستم برای این فرم
  const handleSelectAllConsultants = () => {
    const updated = availableConsultantsList.map((c: any) => {
      const existing = (field.appointmentData?.selectedConsultants || []).find(
        (sc) => sc.consultantId === c.id
      );
      const prefix = (c as any).genderPrefix || (c.name.startsWith('خانم') ? 'خانم' : (c.name.startsWith('آقا') ? 'آقا' : ''));
      const cleanName = c.name.replace(/^(خانم|آقای?)\s+/, '');
      const consultantTopics = (c as any).allowedTopics?.length > 0
        ? (c as any).allowedTopics
        : COUNSELING_TOPICS.map((t) => t.id);

      return {
        consultantId: c.id,
        consultantName: cleanName,
        genderPrefix: (prefix || 'آقا') as 'آقا' | 'خانم',
        enabled: true,
        enabledTopics: existing?.enabledTopics?.length ? existing.enabledTopics : consultantTopics,
        customWorkingHours: existing?.customWorkingHours,
      };
    });

    onUpdate({
      appointmentData: {
        ...field.appointmentData,
        slotDurationMinutes: field.appointmentData?.slotDurationMinutes ?? 45,
        restTimeMinutes: field.appointmentData?.restTimeMinutes ?? 15,
        availableDays: field.appointmentData?.availableDays ?? [0, 1, 2, 3, 4],
        startHour: field.appointmentData?.startHour ?? '09:00',
        endHour: field.appointmentData?.endHour ?? '20:30',
        selectedConsultants: updated,
      },
    });
  };

  // لغو انتخاب همه مشاوران
  const handleDeselectAllConsultants = () => {
    const updated = (field.appointmentData?.selectedConsultants || []).map((sc) => ({
      ...sc,
      enabled: false,
    }));
    onUpdate({
      appointmentData: {
        ...field.appointmentData,
        slotDurationMinutes: field.appointmentData?.slotDurationMinutes ?? 45,
        selectedConsultants: updated,
      },
    });
  };

  // بارگذاری از لیست مشاوران سیستم در فیلدهای گزینه‌ای
  const handleLoadConsultants = () => {
    const consultantsToUse = (teamMembers || []).filter(isConsultantMember);
    const newOpts: SelectOption[] = consultantsToUse.map((c, idx) => {
      const prefix = (c as any).genderPrefix || (c.name.startsWith('خانم') ? 'خانم' : (c.name.startsWith('آقا') ? 'آقا' : ''));
      const cleanName = c.name.replace(/^(خانم|آقای?)\s+/, '');
      const fullName = prefix ? `${prefix} ${cleanName}` : c.name;
      return {
        id: `opt_c_${c.id || idx}`,
        label: fullName,
        value: fullName,
        price: 0,
        score: 0,
      };
    });
    onUpdate({ options: newOpts });
  };

  // درج تگ فیلد در فرمول
  const handleInsertFieldToFormula = (sourceField: FormField) => {
    const current = field.formulaExpression || '';
    const fieldTag = `{${sourceField.id}}`;
    onUpdate({ formulaExpression: `${current} ${fieldTag}`.trim() });
  };

  return (
    <>
      {/* بک‌دراپ تیره کلیک‌خور برای بستن دراور در موبایل */}
      <div 
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 transition-opacity"
        onClick={onClose}
      />

      {/* پنل تنظیمات فیلد */}
      <div className="fixed inset-y-0 left-0 w-full sm:w-[420px] max-w-full bg-white border-r border-slate-200 shadow-2xl z-50 flex flex-col animate-in slide-in-from-left duration-200 select-none">
        
        {/* سربرگ دراور */}
        <div className="p-3.5 sm:p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              {field.type}
            </span>
            <h3 className="text-xs sm:text-sm font-bold text-slate-900 mt-1">تنظیمات پیشرفته فیلد</h3>
          </div>
          <div className="flex items-center gap-1">
            {onDuplicate && (
              <button
                type="button"
                onClick={() => {
                  onDuplicate(field);
                }}
                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                title="کپی و تکثیر فیلد"
              >
                <Copy className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => {
                if (confirm('آیا از حذف این فیلد اطمینان دارید؟')) {
                  onDelete(field.id);
                }
              }}
              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="حذف فیلد"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              title="بستن پنجره"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* تب‌های دراور با اسکرول افقی نرم */}
        <div className="flex border-b border-slate-200 text-xs font-medium bg-white overflow-x-auto shrink-0 pr-1">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-2.5 px-3 text-center border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'general'
                ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/20'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            مشخصات کلی
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={`py-2.5 px-3 text-center border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'rules'
                ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/20'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>شرط‌ها</span>
            {fieldRules.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold flex items-center justify-center">
                {toPersianDigits(fieldRules.length)}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('validation')}
            className={`py-2.5 px-3 text-center border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'validation'
                ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/20'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            اعتبارسنجی
          </button>
          {hasOptions && (
            <button
              onClick={() => setActiveTab('options')}
              className={`py-2.5 px-3 text-center border-b-2 whitespace-nowrap transition-all ${
                activeTab === 'options'
                  ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/20'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              گزینه‌ها ({toPersianDigits(field.options?.length || 0)})
            </button>
          )}
          {isFormula && (
            <button
              onClick={() => setActiveTab('formula')}
              className={`py-2.5 px-3 text-center border-b-2 whitespace-nowrap transition-all ${
                activeTab === 'formula'
                  ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/20'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              فرمول ریاضی
            </button>
          )}
          {isQuiz && (
            <button
              onClick={() => setActiveTab('quiz')}
              className={`py-2.5 px-3 text-center border-b-2 whitespace-nowrap transition-all ${
                activeTab === 'quiz'
                  ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/20'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              پاسخ آزمون
            </button>
          )}
          {isBooking && (
            <button
              onClick={() => setActiveTab('booking')}
              className={`py-2.5 px-3 text-center border-b-2 whitespace-nowrap transition-all ${
                activeTab === 'booking'
                  ? 'border-emerald-600 text-emerald-600 font-bold bg-emerald-50/30'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              زمان‌بندی و نوبت‌دهی
            </button>
          )}
          {isBankCard && (
            <button
              onClick={() => setActiveTab('bankCard')}
              className={`py-2.5 px-3 text-center border-b-2 whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeTab === 'bankCard'
                  ? 'border-amber-600 text-amber-700 font-bold bg-amber-50/40'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-amber-600" />
              <span>کارت بانکی</span>
            </button>
          )}
          <button
            onClick={() => setActiveTab('style')}
            className={`py-2.5 px-3 text-center border-b-2 whitespace-nowrap transition-all ${
              activeTab === 'style'
                ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/20'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            ظاهر و استایل
          </button>
        </div>

      {/* محتوای دراور */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs">
        
        {/* تب ۱: مشخصات کلی */}
        {activeTab === 'general' && (
          <div className="space-y-4">
            {isBankCard && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-amber-700 shrink-0" />
                  <div>
                    <span className="font-extrabold text-amber-950 block text-xs">طرح کارت بانکی اختصاصی</span>
                    <span className="text-[10px] text-amber-800">بانک: {getBankByKey(currentBankCardData.bankKey).name} | به نام: {currentBankCardData.cardHolder}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('bankCard')}
                  className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-bold transition cursor-pointer shrink-0"
                >
                  ویرایش کارت و بانک
                </button>
              </div>
            )}
            <div>
              <label className="block text-slate-700 font-semibold mb-1">عنوان / برچسب فیلد</label>
              <input
                type="text"
                value={field.label}
                onChange={(e) => onUpdate({ label: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">نام انگلیسی متغیر (شناسه فیلد)</label>
              <input
                type="text"
                value={field.name || field.id}
                onChange={(e) => onUpdate({ name: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                placeholder="f_user_age"
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-left focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">جهت استفاده در وب‌هوک، خروجی اکسل و فرمول‌ها</span>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">متن نگهدارنده (Placeholder)</label>
              <input
                type="text"
                value={field.placeholder || ''}
                onChange={(e) => onUpdate({ placeholder: e.target.value })}
                placeholder="متنی که پیش از درج توسط کاربر نمایش می‌یابد"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">متن کمکی و راهنما (Help Text)</label>
              <input
                type="text"
                value={field.helpText || ''}
                onChange={(e) => onUpdate({ helpText: e.target.value })}
                placeholder="توضیحاتی برای شفاف‌سازی..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">عرض ستون در چیدمان</label>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { cols: 12, label: 'تمام‌صفحه' },
                  { cols: 6, label: 'نصف' },
                  { cols: 4, label: 'یک‌سوم' },
                  { cols: 3, label: 'یک‌چهارم' },
                ].map((item) => (
                  <button
                    key={item.cols}
                    onClick={() => onUpdate({ gridCols: item.cols as any })}
                    className={`py-1.5 px-2 rounded border text-center font-medium transition-all ${
                      field.gridCols === item.cols || (!field.gridCols && item.cols === 12)
                        ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            {form.panels && form.panels.length > 1 && (
              <div>
                <label className="block text-slate-700 font-semibold mb-1">متعلق به کدام پنل</label>
                <select
                  value={field.panelId || form.panels[0].id}
                  onChange={(e) => onUpdate({ panelId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  {form.panels.map((p, idx) => (
                    <option key={p.id} value={p.id}>
                      {p.title || `پنل ${toPersianDigits(idx + 1)}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-slate-700 font-semibold mb-1">مقدار پیش‌فرض (Default Value)</label>
              <input
                type="text"
                value={field.defaultValue || ''}
                onChange={(e) => onUpdate({ defaultValue: e.target.value })}
                placeholder="مقدار از پیش پر شده..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white"
              />
            </div>

            {/* تنظیمات فیلد مطابق فرم‌افزار */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="font-bold text-slate-800 text-xs block">تنظیمات</span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.validations?.required || false}
                    onChange={(e) =>
                      onUpdate({
                        validations: { ...field.validations, required: e.target.checked },
                      })
                    }
                    className="rounded text-blue-600 w-3.5 h-3.5"
                  />
                  <span className="text-slate-700">اجباری</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.validations?.isHidden || false}
                    onChange={(e) =>
                      onUpdate({
                        validations: { ...field.validations, isHidden: e.target.checked },
                      })
                    }
                    className="rounded text-blue-600 w-3.5 h-3.5"
                  />
                  <span className="text-slate-700">پنهان</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.validations?.isReadOnly || false}
                    onChange={(e) =>
                      onUpdate({
                        validations: { ...field.validations, isReadOnly: e.target.checked },
                      })
                    }
                    className="rounded text-blue-600 w-3.5 h-3.5"
                  />
                  <span className="text-slate-700">غیرفعال</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.validations?.uniqueCheck || false}
                    onChange={(e) =>
                      onUpdate({
                        validations: { ...field.validations, uniqueCheck: e.target.checked },
                      })
                    }
                    className="rounded text-blue-600 w-3.5 h-3.5"
                  />
                  <span className="text-slate-700">یکتا</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.isRepeatable || false}
                    onChange={(e) => onUpdate({ isRepeatable: e.target.checked })}
                    className="rounded text-blue-600 w-3.5 h-3.5"
                  />
                  <span className="text-slate-700">قابل تکرار</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.hideLabel || false}
                    onChange={(e) => onUpdate({ hideLabel: e.target.checked })}
                    className="rounded text-blue-600 w-3.5 h-3.5"
                  />
                  <span className="text-slate-700">بدون عنوان</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.validations?.searchable !== false}
                    onChange={(e) =>
                      onUpdate({
                        validations: { ...field.validations, searchable: e.target.checked },
                      })
                    }
                    className="rounded text-blue-600 w-3.5 h-3.5"
                  />
                  <span className="text-slate-700">قابل جستجو</span>
                </label>

                <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.panelBasedDefault || false}
                    onChange={(e) => onUpdate({ panelBasedDefault: e.target.checked })}
                    className="rounded text-blue-600 w-3.5 h-3.5"
                  />
                  <span className="text-slate-700">انتخاب بر اساس پنل</span>
                </label>
              </div>
            </div>

            {/* بخش شرط‌های فیلد (مطابق عکس‌های ۳ و ۵ فرم‌افزار) */}
            {renderRulesSection()}
            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200/70 space-y-2.5">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <span className="font-bold text-slate-800 text-xs block">ایجاد دکمه بعدی و انتقال به صفحه بعد</span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    فقط همین پرسش در این صفحه قرار گیرد و با زدن دکمه «بعدی» به سوال بعدی برود
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={field.pageBreakAfter || false}
                  onChange={(e) => onUpdate({ pageBreakAfter: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300"
                />
              </label>

              {field.pageBreakAfter && (
                <div className="pt-2 border-t border-blue-200/50">
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">متن دکمه بعدی</label>
                  <input
                    type="text"
                    value={field.nextButtonText || 'بعدی'}
                    onChange={(e) => onUpdate({ nextButtonText: e.target.value })}
                    placeholder="مثال: بعدی، مرحله بعد، ادامه..."
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* تب شرط‌های منطقی (شرط‌ها) */}
        {activeTab === 'rules' && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-1">
              <span className="font-bold text-xs text-blue-900 flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-blue-600" />
                <span>شروط منطقی فیلد «{field.label}»</span>
              </span>
              <p className="text-[11px] text-blue-700 leading-relaxed">
                با تعیین شروط زیر، با انتخاب هر گزینه، فیلدهای نوبت‌دهی، شماره تماس یا مشاوران مرتبط آشکار یا پنهان می‌شوند.
              </p>
            </div>
            {renderRulesSection()}
          </div>
        )}

        {/* تب ۲: اعتبارسنجی و قوانین */}
        {activeTab === 'validation' && (
          <div className="space-y-4">
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={field.validations.required || false}
                  onChange={(e) =>
                    onUpdate({
                      validations: { ...field.validations, required: e.target.checked },
                    })
                  }
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300"
                />
                <div>
                  <span className="font-bold text-slate-800">این فیلد اجباری است (Required)</span>
                  <span className="text-[10px] text-slate-500 block">کاربر بدون تکمیل این فیلد نمی‌تواند فرم را ثبت کند</span>
                </div>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={field.validations.isReadOnly || false}
                  onChange={(e) =>
                    onUpdate({
                      validations: { ...field.validations, isReadOnly: e.target.checked },
                    })
                  }
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300"
                />
                <div>
                  <span className="font-bold text-slate-800">فقط خواندنی (Read-Only)</span>
                  <span className="text-[10px] text-slate-500 block">کاربر نمی‌تواند مقدار این فیلد را تغییر دهد</span>
                </div>
              </label>

              <label className="flex items-center gap-2 cursor-pointer p-2.5 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={field.validations.uniqueCheck || false}
                  onChange={(e) =>
                    onUpdate({
                      validations: { ...field.validations, uniqueCheck: e.target.checked },
                    })
                  }
                  className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 border-slate-300"
                />
                <div>
                  <span className="font-bold text-slate-800">یکتا بودن مقدار (Unique Check)</span>
                  <span className="text-[10px] text-slate-500 block">جلوگیری از ثبت مقدار تکراری در کل پاسخ‌های قبلی</span>
                </div>
              </label>
            </div>

            {field.type === 'mobile' && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1.5">
                <label className="flex items-center gap-2 cursor-pointer font-bold text-blue-900">
                  <input
                    type="checkbox"
                    checked={field.validations.verifyOtp || false}
                    onChange={(e) =>
                      onUpdate({
                        validations: { ...field.validations, verifyOtp: e.target.checked },
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <span>ارسال و تأیید کد پیامکی یکبار مصرف (OTP)</span>
                </label>
                <p className="text-[10px] text-blue-700">
                  پیش از ثبت فرم، یک کد تأیید ۴ رقمی به شماره همراه واردشده پیامک خواهد شد.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 pt-2">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">حداقل طول کاراکتر</label>
                <input
                  type="number"
                  value={field.validations.minLength || ''}
                  onChange={(e) =>
                    onUpdate({
                      validations: { ...field.validations, minLength: Number(e.target.value) },
                    })
                  }
                  placeholder="مثال: ۳"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">حداکثر طول کاراکتر</label>
                <input
                  type="number"
                  value={field.validations.maxLength || ''}
                  onChange={(e) =>
                    onUpdate({
                      validations: { ...field.validations, maxLength: Number(e.target.value) },
                    })
                  }
                  placeholder="مثال: ۱۰۰"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">الگوی تطابق رجکس (Regex Pattern)</label>
              <input
                type="text"
                value={field.validations.pattern || ''}
                onChange={(e) =>
                  onUpdate({
                    validations: { ...field.validations, pattern: e.target.value },
                  })
                }
                placeholder="مثال: ^[a-zA-Z0-9]+$"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-md font-mono text-left"
              />
            </div>
          </div>
        )}

        {/* تب ۳: گزینه‌ها و مقادیر */}
        {activeTab === 'options' && hasOptions && (
          <div className="space-y-4">
            
            {/* بارگذاری از لیست‌های آماده سازمانی */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>لیست‌های آماده سراسری</span>
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => handleLoadPredefined('educationDegrees')}
                  className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-medium hover:border-blue-400"
                >
                  مقاطع تحصیلی
                </button>
                <button
                  onClick={() => handleLoadPredefined('militaryStatus')}
                  className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-medium hover:border-blue-400"
                >
                  وضعیت نظام وظیفه
                </button>
                <button
                  onClick={() => handleLoadPredefined('bloodTypes')}
                  className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-medium hover:border-blue-400"
                >
                  گروه‌های خونی
                </button>
                <button
                  type="button"
                  onClick={handleLoadConsultants}
                  className="px-2.5 py-1 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 text-blue-700 hover:from-blue-100 hover:to-indigo-100 rounded text-[10px] font-bold hover:border-blue-400 flex items-center gap-1 cursor-pointer transition shadow-2xs"
                >
                  <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                  <span>لیست مشاوران</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleLoadPredefined('maritalStatus')}
                  className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-medium hover:border-blue-400"
                >
                  وضعیت تأهل
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">فهرست گزینه‌ها</span>
              <button
                onClick={handleAddOption}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>افزودن گزینه جدید</span>
              </button>
            </div>

            <div className="space-y-2">
              {(field.options || []).map((opt, idx) => (
                <div key={opt.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded-md space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-slate-400 font-mono w-4">{idx + 1}</span>
                    <input
                      type="text"
                      value={opt.label}
                      onChange={(e) => handleUpdateOption(opt.id, { label: e.target.value })}
                      placeholder="عنوان گزینه..."
                      className="flex-1 px-2 py-1 text-xs border border-slate-300 rounded bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
                    />
                    <button
                      onClick={() => handleRemoveOption(opt.id)}
                      className="text-slate-400 hover:text-rose-600 p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex items-center gap-3 pt-1 border-t border-slate-200/60 text-[11px]">
                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">قیمت (تومان):</span>
                      <input
                        type="number"
                        value={opt.price || ''}
                        onChange={(e) => handleUpdateOption(opt.id, { price: Number(e.target.value) })}
                        placeholder="۰"
                        className="w-20 px-1.5 py-0.5 border border-slate-300 rounded bg-white text-left font-mono"
                      />
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-slate-500">نمره:</span>
                      <input
                        type="number"
                        value={opt.score || ''}
                        onChange={(e) => handleUpdateOption(opt.id, { score: Number(e.target.value) })}
                        placeholder="۰"
                        className="w-14 px-1.5 py-0.5 border border-slate-300 rounded bg-white text-left font-mono"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* تب ۴: فرمول محاسباتی */}
        {activeTab === 'formula' && isFormula && (
          <div className="space-y-4">
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 space-y-1">
              <span className="font-bold block">موتور فرمول‌نویسی بصری</span>
              <p className="text-[10px] text-blue-700">
                با کلیک روی فیلدهای زیر، آن‌ها را به فرمول اضافه کنید. عملگرهای مجاز: <code className="font-mono font-bold">+ - * / ( )</code>
              </p>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">فرمول محاسباتی</label>
              <textarea
                rows={3}
                value={field.formulaExpression || ''}
                onChange={(e) => onUpdate({ formulaExpression: e.target.value })}
                placeholder="مثال: ({f_count} * {f_price}) * 1.09"
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-left text-xs bg-slate-50"
              />
            </div>

            <div>
              <span className="font-semibold text-slate-800 block mb-2">درج فیلدهای فرم در فرمول:</span>
              <div className="flex flex-wrap gap-1.5">
                {form.fields.filter((f) => f.id !== field.id).map((other) => (
                  <button
                    key={other.id}
                    onClick={() => handleInsertFieldToFormula(other)}
                    className="px-2 py-1 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-800 border border-slate-200 rounded text-[11px] font-medium"
                  >
                    + {other.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* تب ۵: پاسخ آزمون */}
        {activeTab === 'quiz' && isQuiz && (
          <div className="space-y-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">گزینه صحیح</label>
              <select
                value={field.quizData?.correctOptionId || ''}
                onChange={(e) =>
                  onUpdate({
                    quizData: {
                      points: field.quizData?.points ?? 25,
                      ...field.quizData,
                      correctOptionId: e.target.value,
                    },
                  })
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-xs"
              >
                <option value="">-- انتخاب گزینه صحیح --</option>
                {(field.options || []).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">نمره مثبت</label>
                <input
                  type="number"
                  value={field.quizData?.points ?? 25}
                  onChange={(e) =>
                    onUpdate({
                      quizData: {
                        points: Number(e.target.value),
                        ...field.quizData,
                      },
                    })
                  }
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-md font-mono text-left"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">نمره منفی</label>
                <input
                  type="number"
                  value={field.quizData?.negativePoints || 0}
                  onChange={(e) =>
                    onUpdate({
                      quizData: {
                        points: field.quizData?.points ?? 25,
                        ...field.quizData,
                        negativePoints: Number(e.target.value),
                      },
                    })
                  }
                  className="w-full px-2 py-1.5 border border-slate-300 rounded-md font-mono text-left"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">تشریح و تحلیل پاسخ</label>
              <textarea
                rows={3}
                value={field.quizData?.explanation || ''}
                onChange={(e) =>
                  onUpdate({
                    quizData: {
                      points: field.quizData?.points ?? 25,
                      ...field.quizData,
                      explanation: e.target.value,
                    },
                  })
                }
                placeholder="توضیحاتی که بعد از آزمون به داوطلب نمایش داده می‌شود..."
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs"
              />
            </div>
          </div>
        )}

        {/* تب ۶: ظاهر و استایل */}
        {activeTab === 'style' && (
          <div className="space-y-4">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">رنگ برچسب فیلد</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={field.styling?.labelColor || '#0f172a'}
                  onChange={(e) =>
                    onUpdate({
                      styling: { ...field.styling, labelColor: e.target.value },
                    })
                  }
                  className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                />
                <span className="font-mono text-xs">{field.styling?.labelColor || '#0f172a'}</span>
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">رنگ پس‌زمینه فیلد</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={field.styling?.backgroundColor || '#ffffff'}
                  onChange={(e) =>
                    onUpdate({
                      styling: { ...field.styling, backgroundColor: e.target.value },
                    })
                  }
                  className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                />
                <span className="font-mono text-xs">{field.styling?.backgroundColor || '#ffffff'}</span>
              </div>
            </div>
          </div>
        )}

        {/* تب ۷: تنظیمات زمان‌بندی و نوبت‌دهی هوشمند */}
        {activeTab === 'booking' && isBooking && (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-950 space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs">
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>تعیین هوشمند مشاوران، موضوعات و زمان‌بندی رزرو</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                مشاورانی که مراجع می‌تواند از آن‌ها در این فرم نوبت رزرو کند را تیک بزنید و موضوعات هر کدام را مشخص فرمایید. همچنین می‌توانید ساعات کاری مشاور را اختصاصاً برای این فرم تغییر دهید.
              </p>
            </div>

            {/* بخش ۱: مشاوران و موضوعات مجاز در این فرم */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                  <span className="font-bold text-xs text-slate-800">مشاوران مجاز و زمان‌بندی نوبت‌ها:</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded-full">
                    {toPersianDigits((field.appointmentData?.selectedConsultants || []).filter((sc) => sc.enabled).length)} از {toPersianDigits(availableConsultantsList.length)}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSelectAllConsultants}
                    className="text-[10px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200 font-bold transition cursor-pointer"
                  >
                    انتخاب همه
                  </button>
                  <button
                    type="button"
                    onClick={handleDeselectAllConsultants}
                    className="text-[10px] text-slate-600 bg-slate-100 hover:bg-slate-200 px-2 py-0.5 rounded border border-slate-200 font-medium transition cursor-pointer"
                  >
                    لغو همه
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                {availableConsultantsList.map((consultant: any) => {
                  const prefix = (consultant as any).genderPrefix || (consultant.name.startsWith('خانم') ? 'خانم' : (consultant.name.startsWith('آقا') ? 'آقا' : ''));
                  const cleanName = consultant.name.replace(/^(خانم|آقای?)\s+/, '');
                  const fullName = prefix ? `${prefix} ${cleanName}` : consultant.name;
                  
                  const cConfig = (field.appointmentData?.selectedConsultants || []).find(
                    (sc) => sc.consultantId === consultant.id
                  );
                  const isEnabled = !!cConfig?.enabled;
                  const enabledTopics = cConfig?.enabledTopics || [];
                  const hasCustomHours = !!cConfig?.customWorkingHours;

                  // تمام موضوعات مرتبط با این مشاور
                  const consultantTopics = (consultant as any).allowedTopics?.length > 0
                    ? (consultant as any).allowedTopics
                    : COUNSELING_TOPICS.map((t) => t.id);

                  return (
                    <div
                      key={consultant.id}
                      className={`p-3 rounded-xl border transition-all ${
                        isEnabled
                          ? 'bg-white border-emerald-400 shadow-xs space-y-2.5'
                          : 'bg-white/60 border-slate-200 opacity-70'
                      }`}
                    >
                      {/* ردیف انتخاب مشاور */}
                      <div className="flex items-center justify-between gap-2">
                        <label className="flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={isEnabled}
                            onChange={() => handleToggleConsultantForBooking(consultant)}
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 cursor-pointer"
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-extrabold text-xs text-slate-900">{fullName}</span>
                              <span className="text-[10px] text-slate-500 font-medium">({consultant.jobTitle || 'مشاور'})</span>
                            </div>
                          </div>
                        </label>

                        {/* نشانگر ساعت کاری سفارشی */}
                        {isEnabled && hasCustomHours && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            ساعت کاری سفارشی فرم
                          </span>
                        )}
                      </div>

                      {/* موضوعات و دکمه ویرایش ساعت کاری اختصاصی در صورت فعال بودن */}
                      {isEnabled && (
                        <div className="pt-2 border-t border-slate-100 space-y-2">
                          <div>
                            <span className="text-[10px] font-bold text-slate-600 block mb-1">
                              موضوعات مشاوره فعال این مشاور در این فرم:
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {consultantTopics.map((topId: string) => {
                                const topObj = COUNSELING_TOPICS.find((t) => t.id === topId);
                                const isTopSelected = enabledTopics.includes(topId);
                                return (
                                  <button
                                    key={topId}
                                    type="button"
                                    onClick={() => handleToggleTopicForConsultant(consultant.id, topId)}
                                    className={`px-2 py-0.5 rounded-md text-[10px] font-medium border transition-colors flex items-center gap-1 cursor-pointer ${
                                      isTopSelected
                                        ? 'bg-indigo-50 border-indigo-300 text-indigo-800'
                                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                                    }`}
                                  >
                                    {isTopSelected ? <Check className="w-3 h-3 text-indigo-600" /> : null}
                                    <span>{topObj ? topObj.name : topId}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          {/* دکمه ویرایش ساعت کاری برای این فرم */}
                          <div className="flex items-center justify-between gap-2 pt-1">
                            <button
                              type="button"
                              onClick={() => {
                                const consultantTopics = (consultant as any).allowedTopics || [];
                                const enabledTopics = cConfig?.enabledTopics || [];
                                const topicsToPass = enabledTopics.length > 0 ? enabledTopics : consultantTopics;
                                setEditingScheduleConsultant({
                                  id: consultant.id,
                                  name: fullName,
                                  topics: topicsToPass,
                                  schedule: cConfig?.customWorkingHours || (consultant as any).workingHours || field.appointmentData || {
                                    slotDurationMinutes: 45,
                                    restTimeMinutes: 15,
                                    availableDays: [0, 1, 2, 3, 4],
                                    startHour: '09:00',
                                    endHour: '17:00',
                                  },
                                });
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg text-[10px] font-bold transition cursor-pointer"
                            >
                              <Edit2 className="w-3 h-3 text-emerald-600" />
                              <span>ویرایش ساعت کاری برای این فرم خاص</span>
                            </button>

                            {hasCustomHours && (
                              <button
                                type="button"
                                onClick={() => handleResetConsultantSchedule(consultant.id)}
                                className="text-[10px] text-slate-500 hover:text-slate-800 underline cursor-pointer"
                                title="حذف تنظیمات اختصاصی این فرم و بازگشت به ساعات کاری سراسری مشاور"
                              >
                                بازنشانی به ساعت اصلی
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* تب تنظیمات کارت بانکی و طرح اختصاصی */}
        {activeTab === 'bankCard' && isBankCard && (
          <div className="space-y-4">
            
            {/* پیش‌نمایش زنده کارت */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-700 block">پیش‌نمایش زنده کارت بانکی:</span>
              <BankCardDisplay
                cardNumber={currentBankCardData.cardNumber}
                cardHolder={currentBankCardData.cardHolder}
                bankKey={currentBankCardData.bankKey}
                title={field.label || currentBankCardData.depositTitle}
                description={field.helpText || currentBankCardData.description}
                presetAmounts={currentBankCardData.presetAmounts}
                showPresetAmounts={currentBankCardData.showPresetAmounts}
                showCustomAmount={currentBankCardData.showCustomAmount}
                allowReceiptUpload={currentBankCardData.allowReceiptUpload !== false}
                requireReceipt={Boolean(currentBankCardData.requireReceipt)}
                receiptTitle={currentBankCardData.receiptTitle}
                isReadOnly={true}
                showContainerBorder={true}
              />
            </div>

            {/* بخش ۱: انتخاب بانک با طرح‌های گرافیکی اختصاصی */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-amber-600" />
                  <span>انتخاب طرح و رنگ بانک:</span>
                </label>
                <span className="text-[10px] text-amber-900 font-bold bg-amber-100/80 px-2.5 py-0.5 rounded-full border border-amber-200">
                  {getBankByKey(currentBankCardData.bankKey).name}
                </span>
              </div>

              {/* سلکتور کشویی بانک‌ها */}
              <select
                value={currentBankCardData.bankKey}
                onChange={(e) => {
                  const b = getBankByKey(e.target.value);
                  handleUpdateBankCard({
                    bankKey: b.key,
                    bankName: b.name,
                  });
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold bg-white text-slate-800 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              >
                {IRANIAN_BANKS.map((b) => (
                  <option key={b.key} value={b.key}>
                    {b.name}
                  </option>
                ))}
              </select>

              {/* چیپ‌های گرافیکی سریع انتخاب بانک */}
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 pt-1 max-h-36 overflow-y-auto p-1 bg-white rounded-lg border border-slate-200">
                {IRANIAN_BANKS.map((b) => {
                  const isSelected = currentBankCardData.bankKey === b.key;
                  const Logo = b.logoSvg;
                  return (
                    <button
                      key={b.key}
                      type="button"
                      onClick={() => {
                        handleUpdateBankCard({
                          bankKey: b.key,
                          bankName: b.name,
                        });
                      }}
                      className={`p-1.5 rounded-lg border text-[10px] font-bold flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-amber-600 bg-amber-50 text-amber-950 ring-1 ring-amber-500 shadow-2xs'
                          : 'border-slate-100 hover:border-slate-300 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <div className="w-5 h-5 flex items-center justify-center">
                        <Logo className="w-5 h-5" />
                      </div>
                      <span className="truncate w-full text-center">{b.shortName}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* بخش ۲: شماره کارت و نام فرد / صاحب کارت */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              
              {/* شماره کارت */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-800">
                    شماره کارت ۱۶ رقمی:
                  </label>
                  {cleanCardNumber(currentBankCardData.cardNumber).length === 16 ? (
                    <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-0.5">
                      <Check className="w-3 h-3" />
                      <span>۱۶ رقم کامل</span>
                    </span>
                  ) : (
                    <span className="text-[10px] text-amber-700 font-bold">
                      {toPersianDigits(cleanCardNumber(currentBankCardData.cardNumber).length)} از ۱۶ رقم
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  dir="ltr"
                  value={currentBankCardData.cardNumber}
                  onChange={(e) => handleCardNumberInput(e.target.value)}
                  placeholder="6037-9979-1234-5678"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm font-mono font-bold tracking-widest text-slate-900 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  با تایپ ۶ رقم اول، نام و طرح بانک به صورت خودکار شناسایی و اعمال می‌گردد.
                </span>
              </div>

              {/* نام فرد یا صاحب حساب */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  نام فرد / صاحب حساب (درج روی کارت):
                </label>
                <input
                  type="text"
                  value={currentBankCardData.cardHolder}
                  onChange={(e) => handleUpdateBankCard({ cardHolder: e.target.value })}
                  placeholder="مثال: مرکز خدمات روانشناسی بالحق یا نام شخص"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 bg-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  این نام مستقیماً روی بدنه کارت فیزیکی با جلوه برجسته نمایش داده می‌شود.
                </span>
              </div>
            </div>

            {/* بخش ۳: تنظیمات مبالغ پیشنهادی */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="text-xs font-bold text-slate-800 block">
                مبالغ پیشنهادی و نحوه پرداخت:
              </span>

              {/* سوییچ نمایش مبالغ پیشنهادی */}
              <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentBankCardData.showPresetAmounts !== false}
                  onChange={(e) => handleUpdateBankCard({ showPresetAmounts: e.target.checked })}
                  className="rounded text-amber-600 w-3.5 h-3.5"
                />
                <span className="text-xs text-slate-700 font-semibold">
                  نمایش دکمه‌های مبالغ پیشنهادی سریع
                </span>
              </label>

              {/* سوییچ امکان مبلغ دلخواه */}
              <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentBankCardData.showCustomAmount !== false}
                  onChange={(e) => handleUpdateBankCard({ showCustomAmount: e.target.checked })}
                  className="rounded text-amber-600 w-3.5 h-3.5"
                />
                <span className="text-xs text-slate-700 font-semibold">
                  امکان وارد کردن مبلغ دلخواه توسط پرداخت‌کننده
                </span>
              </label>

              {/* مدیریت مبالغ پیشنهادی */}
              {currentBankCardData.showPresetAmounts !== false && (
                <div className="space-y-2 pt-1 border-t border-slate-200/70">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-bold text-slate-700">لیست مبالغ پیشنهادی (تومان):</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {(currentBankCardData.presetAmounts || []).map((amt) => (
                      <div
                        key={amt}
                        className="flex items-center gap-1 px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-xs font-bold text-amber-950 shadow-2xs"
                      >
                        <span>{toPersianDigits(amt.toLocaleString('fa-IR'))} تومان</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePresetAmount(amt)}
                          className="text-slate-400 hover:text-rose-600 transition-colors mr-1 cursor-pointer"
                          title="حذف این مبلغ"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* افزودن مبلغ جدید */}
                  <div className="flex items-center gap-1.5 pt-1">
                    <input
                      type="text"
                      placeholder="مبلغ جدید به تومان (مثلا: ۱۵۰,۰۰۰)"
                      value={newPresetAmount ? toPersianDigits(newPresetAmount) : ''}
                      onChange={(e) => setNewPresetAmount(cleanCardNumber(e.target.value))}
                      className="flex-1 px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-mono bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={handleAddPresetAmount}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>افزودن</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* بخش ۴: تنظیمات ظاهری و متن‌ها */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
              <span className="text-xs font-bold text-slate-800 block">
                متن‌ها و عناوین کادر واریز:
              </span>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-[11px]">عنوان اصلی فیلد:</label>
                <input
                  type="text"
                  value={field.label}
                  onChange={(e) => onUpdate({ label: e.target.value })}
                  placeholder="مشارکت مالی اختیاری در هزینه‌های مرکز (اختیاری)"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1 text-[11px]">متن راهنما و توضیحات:</label>
                <textarea
                  rows={2}
                  value={field.helpText || ''}
                  onChange={(e) => onUpdate({ helpText: e.target.value })}
                  placeholder="در صورت تمایل، می‌توانید مبلغی را به عنوان هدیه یا مشارکت اختیاری واریز فرمایید"
                  className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* سوییچ دکمه کپی */}
              <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentBankCardData.allowCopy !== false}
                  onChange={(e) => handleUpdateBankCard({ allowCopy: e.target.checked })}
                  className="rounded text-amber-600 w-3.5 h-3.5"
                />
                <span className="text-xs text-slate-700 font-semibold">
                  فعال بودن دکمه «کپی شماره کارت» روی کارت
                </span>
              </label>
            </div>

            {/* بخش ۴: تنظیمات پیوست و بارگذاری فیش واریزی */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <UploadCloud className="w-4 h-4 text-amber-600" />
                <span>تنظیمات بارگذاری تصویر فیش واریزی:</span>
              </label>

              {/* امکان بارگذاری تصویر فیش */}
              <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={currentBankCardData.allowReceiptUpload !== false}
                  onChange={(e) => handleUpdateBankCard({ allowReceiptUpload: e.target.checked })}
                  className="rounded text-amber-600 w-3.5 h-3.5"
                />
                <span className="text-xs text-slate-700 font-semibold">
                  امکان بارگذاری تصویر فیش واریزی توسط مراجع
                </span>
              </label>

              {currentBankCardData.allowReceiptUpload !== false && (
                <>
                  {/* اجباری بودن پیوست فیش */}
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={Boolean(currentBankCardData.requireReceipt)}
                      onChange={(e) => handleUpdateBankCard({ requireReceipt: e.target.checked })}
                      className="rounded text-amber-600 w-3.5 h-3.5"
                    />
                    <span className="text-xs text-slate-700 font-semibold">
                      اجباری بودن بارگذاری فیش واریزی (ثبت فرم بدون فیش ممکن نیست)
                    </span>
                  </label>

                  {/* عنوان بخش بارگذاری فیش */}
                  <div>
                    <label className="block text-slate-700 font-semibold mb-1 text-[11px]">
                      عنوان کادر بارگذاری فیش:
                    </label>
                    <input
                      type="text"
                      value={currentBankCardData.receiptTitle || ''}
                      onChange={(e) => handleUpdateBankCard({ receiptTitle: e.target.value })}
                      placeholder="مثال: تصویر فیش واریزی (اختیاری):"
                      className="w-full px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white focus:ring-1 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </>
              )}
            </div>

          </div>
        )}

      </div>

      {/* فوتر دراور */}
      <div className="p-3 sm:p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-2 shrink-0">
        <span className="text-[11px] text-slate-500 hidden sm:inline">تغییرات به طور آنی بر فرم اعمال می‌شوند</span>
        <button
          onClick={onClose}
          className="w-full sm:w-auto px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors text-center cursor-pointer"
        >
          اعمال و بازگشت به بوم
        </button>
      </div>

    </div>

    {/* پنجره مودال افزودن / ویرایش شرط منطقی */}
    {isRuleModalOpen && (
      <div className="fixed inset-0 z-60 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-hidden select-none">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4 animate-in zoom-in-95 duration-150 max-h-[80dvh] sm:max-h-[85vh] select-text overflow-y-auto">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <GitBranch className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900">
                  {editingRule ? 'ویرایش شرط منطقی' : 'افزودن شرط منطقی جدید'}
                </h4>
                <p className="text-[11px] text-slate-500">
                  تعیین شرط برای نمایش یا پنهان‌سازی فیلدهای دیگر بر اساس انتخاب کاربر
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                setIsRuleModalOpen(false);
                setEditingRule(null);
              }}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3.5 text-xs">
            {/* فیلد شرط (مبدأ) */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">اگر مقدار فیلد (مبدأ شرط):</label>
              <input
                type="text"
                readOnly
                value={field.label}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 font-bold"
              />
            </div>

            {/* عملگر و مقدار شرط */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">عملگر:</label>
                <select
                  value={ruleOperator}
                  onChange={(e) => setRuleOperator(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-600"
                >
                  <option value="equals">برابر باشد با (بود)</option>
                  <option value="notEquals">مخالف باشد با (نبود)</option>
                  <option value="isNotEmpty">پر شده باشد</option>
                  <option value="isEmpty">خالی باشد</option>
                  <option value="contains">شامل باشد</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">مقدار شرط:</label>
                {field.options && field.options.length > 0 ? (
                  <div className="space-y-1">
                    <select
                      value={ruleValue}
                      onChange={(e) => setRuleValue(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs focus:ring-1 focus:ring-blue-600"
                    >
                      {field.options.map((opt) => (
                        <option key={opt.id} value={opt.label || opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="یا مقدار دلخواه دستی..."
                      value={ruleValue}
                      onChange={(e) => setRuleValue(e.target.value)}
                      className="w-full px-2.5 py-1 text-[11px] bg-slate-50 border border-slate-200 rounded-md"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="مقدار مورد نظر..."
                    value={ruleValue}
                    onChange={(e) => setRuleValue(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs"
                  />
                )}
              </div>
            </div>

            {/* فیلد هدف اول و عملیات */}
            <div className="p-3 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2.5">
              <span className="font-bold text-blue-900 block text-xs">فیلد هدف اول:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">فیلد هدف:</label>
                  <select
                    value={ruleTargetFieldId}
                    onChange={(e) => setRuleTargetFieldId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    {form.fields
                      .filter((f) => f.id !== field.id)
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">عملیات:</label>
                  <select
                    value={ruleAction}
                    onChange={(e) => setRuleAction(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="show">آشکار شود، غیر از این شرایط پنهان شود</option>
                    <option value="hide">پنهان شود</option>
                    <option value="require">الزامی گردد</option>
                    <option value="disable">غیرفعال شود</option>
                  </select>
                </div>
              </div>
            </div>

            {/* فیلد دوم اختیاری همراه (مانند شماره تماس مشاور در عکس ۵) */}
            <div className="p-3 bg-teal-50/50 border border-teal-200 rounded-xl space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasSecondTarget}
                  onChange={(e) => setHasSecondTarget(e.target.checked)}
                  className="rounded text-teal-600 w-4 h-4"
                />
                <span className="font-bold text-teal-900">
                  افزودن فیلد دوم همزمان (مانند شماره تماس مشاور)
                </span>
              </label>

              {hasSecondTarget && (
                <div className="pt-2 border-t border-teal-200/60">
                  <label className="block text-[11px] text-slate-600 mb-1">فیلد همراه دوم:</label>
                  <select
                    value={ruleSecondTargetFieldId}
                    onChange={(e) => setRuleSecondTargetFieldId(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
                  >
                    <option value="">-- انتخاب فیلد دوم --</option>
                    {form.fields
                      .filter((f) => f.id !== field.id && f.id !== ruleTargetFieldId)
                      .map((f) => (
                        <option key={f.id} value={f.id}>
                          {f.label}
                        </option>
                      ))}
                  </select>
                  <span className="text-[10px] text-teal-700 mt-1 block">
                    این فیلد نیز همزمان با فیلد اول آشکار خواهد شد.
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setIsRuleModalOpen(false);
                setEditingRule(null);
              }}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer"
            >
              انصراف
            </button>
            <button
              type="button"
              onClick={handleSaveRule}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>{editingRule ? 'ذخیره تغییرات شرط' : 'ثبت شرط'}</span>
            </button>
          </div>
        </div>
      </div>
    )}
      {/* مودال تنظیم ساعات کاری سفارشی مشاور برای این فرم */}
      <ConsultantScheduleModal
        isOpen={!!editingScheduleConsultant}
        onClose={() => setEditingScheduleConsultant(null)}
        title={`ساعت کاری برای این فرم - ${editingScheduleConsultant?.name}`}
        description="ساعات کاری تنظیم‌شده در این بخش صرفاً برای همین فرم اعمال می‌گردد."
        consultantName={editingScheduleConsultant?.name}
        initialSchedule={editingScheduleConsultant?.schedule}
        topics={editingScheduleConsultant?.topics}
        onSave={handleSaveCustomConsultantSchedule}
      />
    </>
  );
};
