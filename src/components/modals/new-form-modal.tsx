'use client';

import React, { useState } from 'react';
import { useForm } from '@/context/form-context';
import { PlusCircle, Layers, X, Sparkles, FileText } from 'lucide-react';

interface NewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newFormId: string) => void;
}

export const NewFormModal: React.FC<NewFormModalProps> = ({ isOpen, onClose, onCreated }) => {
  const { createForm } = useForm();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('عمومی و سازمانی');
  const [mode, setMode] = useState<'classic' | 'wizard'>('classic');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const created = createForm({
      title: title.trim(),
      description: description.trim(),
      category,
      mode,
      fields: [
        {
          id: `f_name_${Date.now()}`,
          type: 'text',
          label: 'نام و نام خانوادگی',
          placeholder: 'مثال: علی احمدی',
          gridCols: 12,
          validations: { required: true },
        },
      ],
      steps: mode === 'wizard' ? [
        {
          id: `step_1_${Date.now()}`,
          title: 'مرحله اول',
          description: 'اطلاعات اولیه فرم',
          fieldIds: [],
        }
      ] : [],
    });

    setTitle('');
    setDescription('');
    onClose();
    onCreated(created.id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200 text-xs space-y-5">
        
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
