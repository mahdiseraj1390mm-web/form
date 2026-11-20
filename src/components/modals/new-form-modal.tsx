'use client';

import React, { useState } from 'react';
import { useForm } from '@/context/form-context';
import { PlusCircle, Layers, X, Sparkles, FileText, Users, User } from 'lucide-react';
import { FormType } from '@/types/form';

interface NewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newFormId: string) => void;
}

const DEFAULT_FAMILY_ROLES = ['پدر', 'مادر', 'فرزند', 'دختر', 'پسر', 'همسر'];

export const NewFormModal: React.FC<NewFormModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { createForm } = useForm();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('عمومی و سازمانی');
  const [mode, setMode] = useState<'classic' | 'wizard'>('classic');
  const [formType, setFormType] = useState<FormType>('individual');
  const [allowedRoles, setAllowedRoles] = useState<string[]>(['پدر', 'مادر', 'فرزند']);
  const [allowClientViewFamilyDossier, setAllowClientViewFamilyDossier] = useState(true);

  if (!isOpen) return null;

  const toggleRole = (role: string) => {
    setAllowedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const created = createForm({
      title: title.trim(),
      description: description.trim(),
      category: formType === 'family' ? 'خانواده و ازدواج' : category,
      mode: formType === 'family' ? 'wizard' : mode,
      formType,
      familyConfig: formType === 'family' ? {
        allowedRoles: allowedRoles.length > 0 ? allowedRoles : ['پدر', 'مادر', 'فرزند'],
        allowClientViewFamilyDossier,
        autoDetectRoleFromAccount: true,
        identityStepIndex: 0,
      } : undefined,
      fields: formType === 'family' ? [
        {
          id: `f_case_code_${Date.now()}`,
          type: 'text',
          label: 'کد پرونده فردی مراجع',
          placeholder: 'مثال: SP729745',
          helpText: 'در صورت لاگین بودن در سامانه به صورت خودکار درج می‌شود',
          stepId: `step_1_${Date.now()}`,
          gridCols: 6,
          validations: { required: true },
        },
        {
          id: `f_role_in_family_${Date.now()}`,
          type: 'select',
          label: 'نقش در خانواده',
          stepId: `step_1_${Date.now()}`,
          gridCols: 6,
          validations: { required: true },
          options: allowedRoles.map((r) => ({ id: r, label: r, value: r })),
        },
        {
          id: `q_family_item_${Date.now()}`,
          type: 'radio',
          label: 'میزان رضایت و صمیمیت شما از ارتباطات جاری در محیط خانه چقدر است؟',
          stepId: `step_2_${Date.now()}`,
          gridCols: 12,
          validations: { required: true },
          options: [
            { id: 'opt_high', label: 'بسیار زیاد و دلگرم‌کننده', value: 'بسیار زیاد' },
            { id: 'opt_med', label: 'متوسط و نیازمند بهبود', value: 'متوسط' },
            { id: 'opt_low', label: 'کم یا همراه با تنش', value: 'کم' },
          ],
        },
      ] : [
        {
          id: `f_name_${Date.now()}`,
          type: 'text',
          label: 'نام و نام خانوادگی',
          placeholder: 'مثال: علی احمدی',
          gridCols: 12,
          validations: { required: true },
        },
      ],
      steps: formType === 'family' ? [
        {
          id: `step_1_${Date.now()}`,
          title: 'مشخصات هویتی و ارتباطی',
          description: 'تعیین نقش فرد و اتصال به پرونده خانوادگی',
          fieldIds: [],
        },
        {
          id: `step_2_${Date.now()}`,
          title: 'ارزیابی روابط و تعاملات خانوادگی',
          description: 'پاسخ‌گویی مستقل و محرمانه اعضا به سوالات یکسان',
          fieldIds: [],
        },
      ] : (mode === 'wizard' ? [
        {
          id: `step_1_${Date.now()}`,
          title: 'مرحله اول',
          description: 'اطلاعات اولیه فرم',
          fieldIds: [],
        }
      ] : []),
    });

    setTitle('');
    setDescription('');
    setFormType('individual');
    onClose();
    onCreated(created.id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 pt-16 sm:pt-20 pb-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-w-md w-full p-6 border border-slate-200 text-xs space-y-5 max-h-[calc(100dvh-5.5rem)] sm:max-h-[calc(100vh-6.5rem)] overflow-y-auto">
        
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <PlusCircle className="w-5 h-5 text-blue-600" />
            <h3 className="font-extrabold text-sm text-slate-900">ایجاد فرم یا سامانه جدید</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-800 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-bold text-slate-800 mb-1">عنوان فرم سازمانی</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: فرم ثبت نام همایش فناوری ۱۴۰۵"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
            />
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">نوع فرم (فردی یا خانوادگی)</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setFormType('individual')}
                className={`p-3 rounded-xl border text-right transition-all flex items-start gap-2.5 cursor-pointer ${
                  formType === 'individual'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  formType === 'individual' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs">فرم عادی / فردی</div>
                  <div className="text-[10px] text-slate-500 font-normal mt-0.5">تکمیل مستقل توسط هر مراجع</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setFormType('family')}
                className={`p-3 rounded-xl border text-right transition-all flex items-start gap-2.5 cursor-pointer ${
                  formType === 'family'
                    ? 'border-purple-600 bg-purple-50/60 text-purple-900 font-bold shadow-2xs'
                    : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                  formType === 'family' ? 'bg-purple-600 text-white' : 'bg-slate-100 text-slate-500'
                }`}>
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs">فرم خانوادگی</div>
                  <div className="text-[10px] text-purple-700 font-normal mt-0.5">تکمیل توسط اعضای خانه و تطبیق</div>
                </div>
              </button>
            </div>
          </div>

          {/* تنظیمات نقش‌های مجاز و دسترسی در صورت انتخاب فرم خانوادگی */}
          {formType === 'family' && (
            <div className="p-3 bg-purple-50/70 border border-purple-200 rounded-xl space-y-3">
              <div>
                <label className="block font-bold text-purple-900 text-[11px] mb-1.5">
                  کدام یک از اعضای خانواده مجاز به پر کردن این فرم هستند؟
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DEFAULT_FAMILY_ROLES.map((role) => {
                    const isSelected = allowedRoles.includes(role);
                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => toggleRole(role)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-xs'
                            : 'bg-white border border-purple-200 text-purple-800 hover:bg-purple-100/50'
                        }`}
                      >
                        {role} {isSelected ? '✓' : '+'}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-2 border-t border-purple-200/60 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-bold text-purple-900 block">
                    امکان مشاهده نتایج و پرونده خانوادگی توسط مراجع
                  </span>
                  <span className="text-[10px] text-purple-700/80 block">
                    در صورت غیرفعال بودن، دکمه ورود به پرونده خانوادگی برای مراجع نمایش داده نمی‌شود.
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={allowClientViewFamilyDossier}
                  onChange={(e) => setAllowClientViewFamilyDossier(e.target.checked)}
                  className="w-4 h-4 text-purple-600 rounded cursor-pointer"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 mb-1">دسته‌بندی موضوعی</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            >
              <option value="عمومی و سازمانی">عمومی و سازمانی</option>
              <option value="منابع انسانی و استخدام">منابع انسانی و استخدام</option>
              <option value="فروش، مالی و فاکتور">فروش، مالی و فاکتور</option>
              <option value="آموزش و آزمون آنلاین">آموزش و آزمون آنلاین</option>
              <option value="نوبت‌دهی و رزرو وقت">نوبت‌دهی و رزرو وقت</option>
              <option value="نظرسنجی و ارزیابی">نظرسنجی و ارزیابی</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">سبک نمایش فرم</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMode('classic')}
                className={`p-3 rounded-lg border text-right transition-all ${
                  mode === 'classic'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <div>کلاسیک (تک‌صفحه)</div>
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">تمامی فیلدها در یک صفحه</div>
              </button>

              <button
                type="button"
                onClick={() => setMode('wizard')}
                className={`p-3 rounded-lg border text-right transition-all ${
                  mode === 'wizard'
                    ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold'
                    : 'border-slate-200 bg-white text-slate-700'
                }`}
              >
                <div>چندمرحله‌ای (Wizard)</div>
                <div className="text-[10px] text-slate-500 font-normal mt-0.5">همراه با نوار پیشرفت مرحله</div>
              </button>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">توضیحات اختیاری</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="راهنمایی برای تکمیل‌کنندگان..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white resize-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md font-medium"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-md shadow-sm transition-colors"
            >
              ایجاد و شروع طراحی
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
