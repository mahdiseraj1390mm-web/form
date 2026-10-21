'use client';

import React, { useState } from 'react';
import { Form, ConditionalRule, ConditionOperator, ConditionAction } from '@/types/form';
import { Plus, Trash2, GitBranch, ArrowLeftRight, CheckCircle2, Edit2, X, Check } from 'lucide-react';
import { toPersianDigits } from '@/lib/persian';

interface LogicBuilderProps {
  form: Form;
  onUpdateForm: (updated: Partial<Form>) => void;
}

export const LogicBuilder: React.FC<LogicBuilderProps> = ({ form, onUpdateForm }) => {
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [sourceFieldId, setSourceFieldId] = useState<string>(form.fields[0]?.id || '');
  const [operator, setOperator] = useState<ConditionOperator>('equals');
  const [targetValue, setTargetValue] = useState<string>('');
  const [action, setAction] = useState<ConditionAction>('show');
  const [targetFieldId, setTargetFieldId] = useState<string>(form.fields[1]?.id || '');
  const [hasSecondTarget, setHasSecondTarget] = useState(false);
  const [secondTargetFieldId, setSecondTargetFieldId] = useState<string>('');

  const currentSourceField = form.fields.find((f) => f.id === sourceFieldId);

  const handleStartEdit = (rule: ConditionalRule) => {
    setEditingRuleId(rule.id);
    setSourceFieldId(rule.sourceFieldId);
    setOperator(rule.operator);
    setTargetValue(rule.value || '');
    setAction(rule.action);
    setTargetFieldId(rule.targetFieldId || rule.targetFieldIds?.[0] || '');
    const second = rule.additionalTargetFieldId || (rule.targetFieldIds && rule.targetFieldIds.length > 1 ? rule.targetFieldIds[1] : '');
    setHasSecondTarget(!!second);
    setSecondTargetFieldId(second || '');
  };

  const handleCancelEdit = () => {
    setEditingRuleId(null);
    setTargetValue('');
    setHasSecondTarget(false);
    setSecondTargetFieldId('');
  };

  const handleSaveRule = () => {
    if (!sourceFieldId || !targetFieldId) return;

    const targetIds = hasSecondTarget && secondTargetFieldId
      ? [targetFieldId, secondTargetFieldId]
      : [targetFieldId];

    if (editingRuleId) {
      const updatedRules = form.rules.map((r) =>
        r.id === editingRuleId
          ? {
              ...r,
              sourceFieldId,
              operator,
              value: targetValue,
              action,
              targetFieldId,
              additionalTargetFieldId: hasSecondTarget && secondTargetFieldId ? secondTargetFieldId : undefined,
              targetFieldIds: targetIds,
            }
          : r
      );
      onUpdateForm({ rules: updatedRules });
      handleCancelEdit();
    } else {
      const newRule: ConditionalRule = {
        id: `rule_${Date.now()}`,
        sourceFieldId,
        operator,
        value: targetValue,
        action,
        targetFieldId,
        additionalTargetFieldId: hasSecondTarget && secondTargetFieldId ? secondTargetFieldId : undefined,
        targetFieldIds: targetIds,
      };
      onUpdateForm({ rules: [...form.rules, newRule] });
      setTargetValue('');
      setHasSecondTarget(false);
      setSecondTargetFieldId('');
    }
  };

  const handleRemoveRule = (ruleId: string) => {
    onUpdateForm({ rules: form.rules.filter((r) => r.id !== ruleId) });
    if (editingRuleId === ruleId) handleCancelEdit();
  };

  const getFieldLabel = (id?: string) => {
    if (!id) return '';
    return form.fields.find((f) => f.id === id)?.label || id;
  };

  const operatorLabels: Record<ConditionOperator, string> = {
    equals: 'برابر باشد با',
    notEquals: 'مخالف باشد با',
    contains: 'شامل شود',
    greaterThan: 'بزرگ‌تر باشد از',
    lessThan: 'کوچک‌تر باشد از',
    isEmpty: 'خالی باشد',
    isNotEmpty: 'پر شده باشد',
  };

  const actionLabels: Record<ConditionAction, string> = {
    show: 'آشکار شود، غیر از این پنهان شود',
    hide: 'مخفی شود',
    require: 'الزامی گردد',
    disable: 'غیرفعال شود',
    setValue: 'مقداردهی شود',
    jumpToStep: 'پرش به مرحله بعدی',
  };

  return (
    <div className="max-w-4xl mx-auto w-full p-6 space-y-6">
      
      {/* توضیح ماژول */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm flex items-start gap-4">
        <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600 shrink-0">
          <GitBranch className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-900">موتور منطق و شرط‌گذاری پویا</h2>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            با تعریف شروط هوشمند می‌توانید نمایش یا الزام فیلدها را بر اساس پاسخ‌های کاربر تغییر دهید و فرم‌های واکنش‌گرا و پویا بسازید.
          </p>
        </div>
      </div>

      {/* فرم ایجاد قانون شرطی جدید */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm space-y-4">
        <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
          <span>افزودن شرط جدید</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center text-xs">
          {/* شرط: اگر فیلد X */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">اگر مقدار فیلد:</label>
            <select
              value={sourceFieldId}
              onChange={(e) => setSourceFieldId(e.target.value)}
              className="w-full px-2.5 py-2 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
            >
              {form.fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* عملگر */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">عملگر:</label>
            <select
              value={operator}
              onChange={(e) => setOperator(e.target.value as any)}
              className="w-full px-2.5 py-2 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
            >
              {Object.entries(operatorLabels).map(([op, label]) => (
                <option key={op} value={op}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* مقدار هدف */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">مقدار:</label>
            {currentSourceField?.options && currentSourceField.options.length > 0 ? (
              <select
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                className="w-full px-2 py-2 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-600 text-xs"
              >
                <option value="">-- انتخاب مقدار --</option>
                {currentSourceField.options.map((opt) => (
                  <option key={opt.id} value={opt.label || opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type="text"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                placeholder="مثلا: مرد، تهران..."
                className="w-full px-2.5 py-2 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
              />
            )}
          </div>

          {/* آنگاه فیلد Y */}
          <div className="md:col-span-3">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">آنگاه فیلد:</label>
            <select
              value={targetFieldId}
              onChange={(e) => setTargetFieldId(e.target.value)}
              className="w-full px-2.5 py-2 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
            >
              {form.fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </div>

          {/* عملیات */}
          <div className="md:col-span-2">
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">عملیات:</label>
            <select
              value={action}
              onChange={(e) => setAction(e.target.value as any)}
              className="w-full px-2.5 py-2 border border-slate-300 rounded-md bg-white focus:ring-1 focus:ring-blue-600"
            >
              {Object.entries(actionLabels).map(([act, label]) => (
                <option key={act} value={act}>
                  {label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* فیلد دوم همراه اختیاری */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-4 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer text-xs">
            <input
              type="checkbox"
              checked={hasSecondTarget}
              onChange={(e) => setHasSecondTarget(e.target.checked)}
              className="rounded text-blue-600 w-4 h-4"
            />
            <span className="font-semibold text-slate-700">افزودن فیلد دوم همزمان (مانند شماره تماس مشاور)</span>
          </label>

          {hasSecondTarget && (
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <span className="text-[11px] text-slate-500 whitespace-nowrap">فیلد دوم:</span>
              <select
                value={secondTargetFieldId}
                onChange={(e) => setSecondTargetFieldId(e.target.value)}
                className="w-full px-2.5 py-1.5 border border-slate-300 rounded-md bg-white text-xs"
              >
                <option value="">-- انتخاب فیلد دوم --</option>
                {form.fields
                  .filter((f) => f.id !== targetFieldId)
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.label}
                    </option>
                  ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 mr-auto">
            {editingRuleId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-3 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-md"
              >
                انصراف از ویرایش
              </button>
            )}
            <button
              type="button"
              onClick={handleSaveRule}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-md shadow-sm transition-colors cursor-pointer"
            >
              {editingRuleId ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              <span>{editingRuleId ? 'ذخیره تغییرات شرط' : 'ثبت قانون شرطی'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* لیست شروط تعریف شده */}
      <div className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-sm space-y-3">
        <h3 className="text-xs font-bold text-slate-900 pb-2 border-b border-slate-100 flex items-center justify-between">
          <span>شروط فعال روی این فرم</span>
          <span className="text-[11px] text-slate-500 font-normal">
            {toPersianDigits(form.rules.length)} قانون
          </span>
        </h3>

        {form.rules.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            هیچ شرطی برای فیلدهای این فرم تعریف نشده است.
          </div>
        ) : (
          <div className="space-y-2">
            {form.rules.map((rule, idx) => {
              const additionalTargetLabel = rule.additionalTargetFieldId
                ? getFieldLabel(rule.additionalTargetFieldId)
                : rule.targetFieldIds && rule.targetFieldIds.length > 1
                ? getFieldLabel(rule.targetFieldIds[1])
                : null;

              return (
                <div
                  key={rule.id}
                  className={`p-3 border rounded-lg flex items-center justify-between text-xs transition-all ${
                    editingRuleId === rule.id
                      ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-400'
                      : 'bg-slate-50 border-slate-200/80 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-mono text-[10px]">
                      {idx + 1}
                    </span>
                    <span className="font-semibold text-slate-800">اگر</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-slate-300 font-bold text-blue-700">
                      «{getFieldLabel(rule.sourceFieldId)}»
                    </span>
                    <span className="text-slate-500">{operatorLabels[rule.operator]}</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-slate-300 font-mono text-slate-900">
                      «{rule.value || 'مقداری'}»
                    </span>
                    <span className="font-semibold text-slate-800">آنگاه</span>
                    <span className="bg-white px-2 py-0.5 rounded border border-slate-300 font-bold text-emerald-700">
                      «{getFieldLabel(rule.targetFieldId)}»
                    </span>
                    <span className="font-bold text-indigo-700">{actionLabels[rule.action]}</span>
                    {additionalTargetLabel && (
                      <>
                        <span className="font-bold text-slate-800">و</span>
                        <span className="bg-white px-2 py-0.5 rounded border border-slate-300 font-bold text-teal-700">
                          «{additionalTargetLabel}»
                        </span>
                        <span className="font-bold text-indigo-700">{actionLabels[rule.action]}</span>
                      </>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleStartEdit(rule)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      title="ویرایش شرط"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveRule(rule.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                      title="حذف شرط"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
