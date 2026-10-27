'use client';

import React, { useState } from 'react';
import { FormField, SelectOption, Form, ConditionalRule, ConditionOperator, ConditionAction } from '@/types/form';
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
  Copy
} from 'lucide-react';
import { toPersianDigits } from '@/lib/persian';
import { predefinedLists, iranProvinces } from '@/lib/iran-geo';

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

  const [activeTab, setActiveTab] = useState<'general' | 'validation' | 'rules' | 'options' | 'formula' | 'quiz' | 'style' | 'booking'>(
    field.type === 'appointmentBooking' ? 'booking' : 'general'
  );

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

  // درج تگ فیلد در فرمول
  const handleInsertFieldToFormula = (sourceField: FormField) => {
    const current = field.formulaExpression || '';
    const fieldTag = `{${sourceField.id}}`;
    onUpdate({ formulaExpression: `${current} ${fieldTag}`.trim() });
  };

  // تولید خودکار گزینه‌های نوبت بر اساس روزبندی، ساعات کاری، مدت جلسه و استراحت
  const handleGenerateBookingOptions = () => {
    const config = field.appointmentData;
    const slotDuration = config?.slotDurationMinutes ?? 30;
    const restDuration = config?.restTimeMinutes ?? 5;
    const availableDays = config?.availableDays ?? [0, 1, 2, 3, 4];
    const dayNames = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];

    const newOptions: SelectOption[] = [];

    availableDays.forEach((dayIdx) => {
      const dayName = dayNames[dayIdx];
      const dayConfig = config?.daySchedules?.[dayIdx];
      const period = dayConfig?.periods?.[0] || {
        startHour: config?.startHour || '09:00',
        endHour: config?.endHour || '17:00',
      };

      const [startH, startM] = period.startHour.split(':').map(Number);
      const [endH, endM] = period.endHour.split(':').map(Number);
      const startMin = (startH || 9) * 60 + (startM || 0);
      const endMin = (endH || 17) * 60 + (endM || 0);

      let currentMin = startMin;
      while (currentMin + slotDuration <= endMin) {
        const sH = Math.floor(currentMin / 60);
        const sM = currentMin % 60;
        const eH = Math.floor((currentMin + slotDuration) / 60);
        const eM = (currentMin + slotDuration) % 60;

        const formatTime = (h: number, m: number) =>
          `${h < 10 ? '0' + h : h}:${m < 10 ? '0' + m : m}`;

        const timeRange = `${toPersianDigits(formatTime(sH, sM))} الی ${toPersianDigits(formatTime(eH, eM))}`;
        const label = `${dayName} - ساعت ${timeRange}`;
        const optId = `slot_${dayIdx}_${currentMin}`;

        newOptions.push({
          id: optId,
          label,
          value: optId,
        });

        currentMin += slotDuration + restDuration;
      }
    });

    onUpdate({ options: newOptions });
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
                <span>تعیین هوشمند زمان‌بندی، روزبندی و استراحت</span>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                مدت زمان هر جلسه مشاوره، استراحت بین جلسات، ساعات کاری روزانه و روزهای تعطیل را تعیین فرمایید.
              </p>
            </div>

            {/* بخش ۱: مدت جلسه و زمان استراحت */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <span className="font-bold text-xs text-slate-800 block">۱. مدت مشاوره و استراحت بین جلسات</span>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    مدت هر جلسه (دقیقه):
                  </label>
                  <select
                    value={field.appointmentData?.slotDurationMinutes ?? 30}
                    onChange={(e) => {
                      const dur = Number(e.target.value);
                      onUpdate({
                        appointmentData: {
                          availableDays: [0, 1, 2, 3, 4],
                          startHour: '09:00',
                          endHour: '17:00',
                          restTimeMinutes: 5,
                          ...field.appointmentData,
                          slotDurationMinutes: dur,
                        },
                      });
                    }}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value={15}>۱۵ دقیقه</option>
                    <option value={20}>۲۰ دقیقه</option>
                    <option value={30}>۳۰ دقیقه (استاندارد)</option>
                    <option value={40}>۴۰ دقیقه</option>
                    <option value={45}>۴۵ دقیقه (تخصصی)</option>
                    <option value={60}>۶۰ دقیقه (۱ ساعت)</option>
                    <option value={90}>۹۰ دقیقه</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    زمان استراحت (دقیقه):
                  </label>
                  <select
                    value={field.appointmentData?.restTimeMinutes ?? 5}
                    onChange={(e) => {
                      const rest = Number(e.target.value);
                      onUpdate({
                        appointmentData: {
                          availableDays: [0, 1, 2, 3, 4],
                          startHour: '09:00',
                          endHour: '17:00',
                          slotDurationMinutes: 30,
                          ...field.appointmentData,
                          restTimeMinutes: rest,
                        },
                      });
                    }}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  >
                    <option value={0}>بدون استراحت (۰ دقیقه)</option>
                    <option value={5}>۵ دقیقه (توصیه‌شده)</option>
                    <option value={10}>۱۰ دقیقه</option>
                    <option value={15}>۱۵ دقیقه</option>
                    <option value={20}>۲۰ دقیقه</option>
                    <option value={30}>۳۰ دقیقه</option>
                  </select>
                </div>
              </div>
            </div>

            {/* بخش ۲: روزبندی هفته و ساعات کاری از چه ساعتی تا چه ساعتی */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800">۲. مشخص کردن روزهای کاری و تعطیل مشاور</span>
                <span className="text-[10px] text-slate-400 font-medium">ساعات حضور هر روز</span>
              </div>

              {/* الگوهای آماده انتخاب سریع روزها */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-500">الگوهای سریع روزهای حضور مشاور:</span>
                <div className="flex flex-wrap gap-1">
                  {[
                    { label: 'فقط پنج‌شنبه‌ها', days: [5] },
                    { label: 'یکشنبه و سه‌شنبه', days: [1, 3] },
                    { label: 'شنبه، دوشنبه، چهارشنبه', days: [0, 2, 4] },
                    { label: 'شنبه و دوشنبه', days: [0, 2] },
                    { label: 'شنبه تا چهارشنبه', days: [0, 1, 2, 3, 4] },
                    { label: 'همه روزها (بجز جمعه)', days: [0, 1, 2, 3, 4, 5] },
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        onUpdate({
                          appointmentData: {
                            slotDurationMinutes: field.appointmentData?.slotDurationMinutes ?? 30,
                            restTimeMinutes: field.appointmentData?.restTimeMinutes ?? 5,
                            startHour: field.appointmentData?.startHour ?? '09:00',
                            endHour: field.appointmentData?.endHour ?? '17:00',
                            ...field.appointmentData,
                            availableDays: preset.days,
                          },
                        });
                      }}
                      className="px-2 py-1 text-[10px] rounded bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200 transition-colors"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* ساعات کاری پیش‌فرض */}
              <div className="p-2.5 bg-white border border-slate-200 rounded-lg space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700">ساعت کاری عمومی مشاور:</span>
                  <span className="text-[10px] text-slate-400">اعمال به همه روزهای فعال</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-500">از:</span>
                    <input
                      type="time"
                      value={field.appointmentData?.startHour || '09:00'}
                      onChange={(e) => {
                        const newStart = e.target.value;
                        onUpdate({
                          appointmentData: {
                            slotDurationMinutes: field.appointmentData?.slotDurationMinutes ?? 30,
                            restTimeMinutes: field.appointmentData?.restTimeMinutes ?? 5,
                            ...field.appointmentData,
                            startHour: newStart,
                          },
                        });
                      }}
                      className="px-2 py-1 border border-slate-300 rounded font-mono text-center text-xs bg-slate-50"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-slate-500">تا:</span>
                    <input
                      type="time"
                      value={field.appointmentData?.endHour || '17:00'}
                      onChange={(e) => {
                        const newEnd = e.target.value;
                        onUpdate({
                          appointmentData: {
                            slotDurationMinutes: field.appointmentData?.slotDurationMinutes ?? 30,
                            restTimeMinutes: field.appointmentData?.restTimeMinutes ?? 5,
                            ...field.appointmentData,
                            endHour: newEnd,
                          },
                        });
                      }}
                      className="px-2 py-1 border border-slate-300 rounded font-mono text-center text-xs bg-slate-50"
                    />
                  </div>

                  <div className="flex items-center gap-1 mr-auto">
                    {[
                      { l: 'صبح (۰۹-۱۲)', s: '09:00', e: '12:00' },
                      { l: 'عصر (۱۶-۱۹)', s: '16:00', e: '19:00' },
                      { l: 'کامل (۰۹-۱۷)', s: '09:00', e: '17:00' },
                    ].map((hPreset, hi) => (
                      <button
                        key={hi}
                        type="button"
                        onClick={() => {
                          onUpdate({
                            appointmentData: {
                              slotDurationMinutes: field.appointmentData?.slotDurationMinutes ?? 30,
                              restTimeMinutes: field.appointmentData?.restTimeMinutes ?? 5,
                              ...field.appointmentData,
                              startHour: hPreset.s,
                              endHour: hPreset.e,
                            },
                          });
                        }}
                        className="px-1.5 py-0.5 text-[9px] bg-slate-100 hover:bg-slate-200 text-slate-700 rounded transition-colors"
                      >
                        {hPreset.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                {[
                  { dayIdx: 0, label: 'شنبه' },
                  { dayIdx: 1, label: 'یکشنبه' },
                  { dayIdx: 2, label: 'دوشنبه' },
                  { dayIdx: 3, label: 'سه‌شنبه' },
                  { dayIdx: 4, label: 'چهارشنبه' },
                  { dayIdx: 5, label: 'پنج‌شنبه' },
                  { dayIdx: 6, label: 'جمعه' },
                ].map(({ dayIdx, label }) => {
                  const currentAvailableDays = field.appointmentData?.availableDays ?? [0, 1, 2, 3, 4];
                  const isDayEnabled = currentAvailableDays.includes(dayIdx);
                  const daySchedule = field.appointmentData?.daySchedules?.[dayIdx];
                  const period = daySchedule?.periods?.[0] || {
                    startHour: field.appointmentData?.startHour || '09:00',
                    endHour: field.appointmentData?.endHour || '17:00',
                  };

                  return (
                    <div 
                      key={dayIdx} 
                      className={`p-2 rounded-lg border text-xs flex items-center justify-between gap-2 transition-all ${
                        isDayEnabled ? 'bg-white border-slate-300 shadow-2xs' : 'bg-slate-100/60 border-slate-200 opacity-60'
                      }`}
                    >
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-slate-800 select-none">
                        <input
                          type="checkbox"
                          checked={isDayEnabled}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const newAvailable = checked
                              ? Array.from(new Set([...currentAvailableDays, dayIdx]))
                              : currentAvailableDays.filter((d) => d !== dayIdx);
                            onUpdate({
                              appointmentData: {
                                slotDurationMinutes: field.appointmentData?.slotDurationMinutes ?? 30,
                                restTimeMinutes: field.appointmentData?.restTimeMinutes ?? 5,
                                startHour: field.appointmentData?.startHour ?? '09:00',
                                endHour: field.appointmentData?.endHour ?? '17:00',
                                ...field.appointmentData,
                                availableDays: newAvailable,
                              },
                            });
                          }}
                          className="w-3.5 h-3.5 text-emerald-600 rounded"
                        />
                        <span>{label}</span>
                        {!isDayEnabled && <span className="text-[10px] text-rose-500 font-semibold">(تعطیل)</span>}
                      </label>

                      {isDayEnabled && (
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="text-slate-400">از</span>
                          <input
                            type="time"
                            value={period.startHour}
                            onChange={(e) => {
                              const newStart = e.target.value;
                              const prevSchedules = field.appointmentData?.daySchedules || {};
                              onUpdate({
                                appointmentData: {
                                  slotDurationMinutes: field.appointmentData?.slotDurationMinutes ?? 30,
                                  restTimeMinutes: field.appointmentData?.restTimeMinutes ?? 5,
                                  ...field.appointmentData,
                                  daySchedules: {
                                    ...prevSchedules,
                                    [dayIdx]: {
                                      enabled: true,
                                      periods: [{ startHour: newStart, endHour: period.endHour }],
                                    },
                                  },
                                },
                              });
                            }}
                            className="w-16 px-1 py-0.5 border border-slate-300 rounded font-mono text-center text-xs bg-white"
                          />
                          <span className="text-slate-400">تا</span>
                          <input
                            type="time"
                            value={period.endHour}
                            onChange={(e) => {
                              const newEnd = e.target.value;
                              const prevSchedules = field.appointmentData?.daySchedules || {};
                              onUpdate({
                                appointmentData: {
                                  slotDurationMinutes: field.appointmentData?.slotDurationMinutes ?? 30,
                                  restTimeMinutes: field.appointmentData?.restTimeMinutes ?? 5,
                                  ...field.appointmentData,
                                  daySchedules: {
                                    ...prevSchedules,
                                    [dayIdx]: {
                                      enabled: true,
                                      periods: [{ startHour: period.startHour, endHour: newEnd }],
                                    },
                                  },
                                },
                              });
                            }}
                            className="w-16 px-1 py-0.5 border border-slate-300 rounded font-mono text-center text-xs bg-white"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* بخش ۳: مشخص کردن روزهای تعطیل و مرخصی */}
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-xs text-slate-800">۳. مشخص کردن روزهای تعطیل</span>
                <span className="text-[10px] text-slate-400">تعطیلات رسمی و مرخصی‌ها</span>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  id="admin_holiday_input"
                  placeholder="تاریخ روز تعطیل (مثلاً: ۱۴۰۵/۰۱/۰۱ یا جمعه)"
                  className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      const val = (e.currentTarget.value || '').trim();
                      if (val) {
                        const current = field.appointmentData?.holidays || [];
                        if (!current.includes(val)) {
                          onUpdate({
                            appointmentData: {
                              slotDurationMinutes: field.appointmentData?.slotDurationMinutes ?? 30,
                              restTimeMinutes: field.appointmentData?.restTimeMinutes ?? 5,
                              ...field.appointmentData,
                              holidays: [...current, val],
                            },
                          });
                        }
                        e.currentTarget.value = '';
                      }
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    const inp = document.getElementById('admin_holiday_input') as HTMLInputElement | null;
                    if (inp && inp.value.trim()) {
                      const val = inp.value.trim();
                      const current = field.appointmentData?.holidays || [];
                      if (!current.includes(val)) {
                        onUpdate({
                          appointmentData: {
                            slotDurationMinutes: field.appointmentData?.slotDurationMinutes ?? 30,
                            restTimeMinutes: field.appointmentData?.restTimeMinutes ?? 5,
                            ...field.appointmentData,
                            holidays: [...current, val],
                          },
                        });
                      }
                      inp.value = '';
                    }
                  }}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg transition-colors"
                >
                  افزودن
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(field.appointmentData?.holidays && field.appointmentData.holidays.length > 0) ? (
                  field.appointmentData.holidays.map((h, i) => (
                    <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded text-[11px] font-medium">
                      <span>{h}</span>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (field.appointmentData?.holidays || []).filter((_, idx) => idx !== i);
                          onUpdate({
                            appointmentData: {
                              slotDurationMinutes: field.appointmentData?.slotDurationMinutes ?? 30,
                              restTimeMinutes: field.appointmentData?.restTimeMinutes ?? 5,
                              ...field.appointmentData,
                              holidays: updated,
                            },
                          });
                        }}
                        className="text-rose-500 hover:text-rose-900"
                      >
                        ✕
                      </button>
                    </span>
                  ))
                ) : (
                  <span className="text-[10px] text-slate-400">روزهای تعطیل اختصاصی تعریف نشده است.</span>
                )}
              </div>
            </div>

            {/* بخش ۴: تولید خودکار و به‌روزرسانی نوبت‌ها در فیلد */}
            <div className="pt-1">
              <button
                type="button"
                onClick={handleGenerateBookingOptions}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>تولید و ثبت خودکار نوبت‌های زمانی در فیلد (نوبت‌های باقی‌مانده)</span>
              </button>
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
      <div className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 select-none">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-lg w-full p-5 space-y-4 animate-in zoom-in-95 duration-150">
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
    </>
  );
};
