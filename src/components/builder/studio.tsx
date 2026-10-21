'use client';

import React, { useState } from 'react';
import { useForm } from '@/context/form-context';
import { FormField, FieldType } from '@/types/form';
import { 
  PenTool, 
  Settings, 
  Palette, 
  Share2, 
  Layers, 
  Eye, 
  CheckCircle2,
  SlidersHorizontal,
  Plus
} from 'lucide-react';
import { BuilderCanvas } from './builder-canvas';
import { WidgetPalette, widgetDefinitions } from './widget-palette';
import { FieldEditorDrawer } from './field-editor-drawer';
import { SettingsTab } from './settings-tab';
import { ThemeTab } from './theme-tab';
import { ShareTab } from './share-tab';
import { IntegrationsTab } from './integrations-tab';
import { toPersianDigits } from '@/lib/persian';

interface StudioProps {
  onPreview: () => void;
}

export const Studio: React.FC<StudioProps> = ({ onPreview }) => {
  const { activeForm, updateForm, forms, setActiveForm } = useForm();
  
  // ۵ تب اصلی سامانه فرم‌افزار مطابق اسکرین‌شات‌های ارسالی کاربر
  const [activeMainTab, setActiveMainTab] = useState<'design' | 'settings' | 'theme' | 'share' | 'integrations'>('design');
  
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [showPalette, setShowPalette] = useState(true);
  const [mobileTab, setMobileTab] = useState<'canvas' | 'palette'>('canvas');
  const [targetInsertIndex, setTargetInsertIndex] = useState<number | undefined>(undefined);
  const [targetPanelId, setTargetPanelId] = useState<string | undefined>(undefined);
  const [showSavedToast, setShowSavedToast] = useState(false);

  if (!activeForm) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-center text-slate-500">
        <div>
          <PenTool className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">فرمی انتخاب نشده است</h3>
        </div>
      </div>
    );
  }

  const handleOpenPaletteWithTarget = (targetIndex?: number, panelId?: string) => {
    setTargetInsertIndex(targetIndex);
    setTargetPanelId(panelId);
    setShowPalette(true);
    setMobileTab('palette');
  };

  const handleQuickAddField = (type: FieldType, targetIndex?: number, panelId?: string) => {
    const finalIndex = targetIndex !== undefined ? targetIndex : targetInsertIndex;
    const finalPanelId = panelId || targetPanelId || activeForm.panels?.[0]?.id || 'p_1';
    const widgetDef = widgetDefinitions.find((w) => w.type === type);
    const newField: FormField = {
      id: `f_${Date.now()}`,
      type,
      label: widgetDef ? widgetDef.label : 'فیلد جدید',
      placeholder: '',
      panelId: finalPanelId,
      gridCols: 12,
      validations: {},
      options: ['radio', 'checkbox', 'select', 'quizQuestion'].includes(type)
        ? [
            { id: 'opt_1', label: 'گزینه ۱', value: '1', price: 0 },
            { id: 'opt_2', label: 'گزینه ۲', value: '2', price: 0 },
          ]
        : undefined,
      quizData: type === 'quizQuestion' ? { points: 25, correctOptionId: 'opt_1' } : undefined,
    };

    const newFields = [...activeForm.fields];
    if (finalIndex !== undefined) {
      newFields.splice(finalIndex, 0, newField);
    } else {
      newFields.push(newField);
    }

    updateForm(activeForm.id, { fields: newFields });
    setEditingField(newField);
    setTargetInsertIndex(undefined);
    setTargetPanelId(undefined);
    setMobileTab('canvas');
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2500);
  };

  const handleUpdateField = (updated: Partial<FormField>) => {
    if (!editingField) return;
    const newFields = activeForm.fields.map((f) => (f.id === editingField.id ? { ...f, ...updated } : f));
    updateForm(activeForm.id, { fields: newFields });
    setEditingField((prev) => (prev ? { ...prev, ...updated } : null));
  };

  const handleDeleteField = (fieldId: string) => {
    const newFields = activeForm.fields.filter((f) => f.id !== fieldId);
    updateForm(activeForm.id, { fields: newFields });
    setEditingField(null);
  };

  const handleSave = () => {
    setShowSavedToast(true);
    setTimeout(() => setShowSavedToast(false), 2500);
  };

  const mainTabs = [
    { id: 'design', label: 'طراحی' },
    { id: 'settings', label: 'تنظیمات' },
    { id: 'theme', label: 'قالب' },
    { id: 'share', label: 'اشتراک‌گذاری' },
    { id: 'integrations', label: 'یکپارچه‌سازی' },
  ];

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-slate-50 select-none relative">
      
      {/* هدر بالایی دقیقاً مطابق تصویر ۱ فرم‌افزار */}
      <div className="bg-white border-b border-slate-200 px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between shrink-0 shadow-xs z-20 gap-3">
        
        {/* سمت راست: مسیر ناوبری فرم‌ها > ویرایش [نام فرم] و سوییچر */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">فرم‌ها</span>
          <span className="text-xs text-slate-400 hidden sm:inline">&gt;</span>
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-xs font-bold text-slate-900 shrink-0 hidden sm:inline">ویرایش</span>
            <select
              value={activeForm.id}
              onChange={(e) => {
                const f = forms.find((item) => item.id === e.target.value);
                if (f) setActiveForm(f);
              }}
              className="text-xs font-extrabold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 max-w-[130px] sm:max-w-xs truncate"
            >
              {forms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* وسط: ۵ تب اصلی فرم‌افزار با خط نشانگر سبز رنگ (طراحی، تنظیمات، قالب، اشتراک‌گذاری، یکپارچه‌سازی) */}
        <div className="flex items-center gap-1 sm:gap-4 overflow-x-auto">
          {mainTabs.map((tab) => {
            const isActive = activeMainTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveMainTab(tab.id as any)}
                className={`py-2 px-2.5 sm:px-3 text-xs sm:text-sm font-bold transition-all relative cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'text-emerald-700 font-extrabold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>{tab.label}</span>
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-600 rounded-full" />
                )}
              </button>
            );
          })}
        </div>

        {/* سمت چپ: تاریخ شمسی + مشاهده فرم + دکمه سبز ذخیره */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-slate-500 hidden xl:inline">
            سه‌شنبه ۲۸ مهر ۱۴۰۵
          </span>

          <button
            onClick={onPreview}
            className="px-2.5 sm:px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            مشاهده فرم
          </button>

          <button
            onClick={handleSave}
            className="px-4 sm:px-5 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 rounded-lg shadow-2xs transition-all cursor-pointer flex items-center gap-1"
          >
            {showSavedToast ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
            <span>{showSavedToast ? 'ذخیره شد' : 'ذخیره'}</span>
          </button>
        </div>

      </div>

      {/* سوییچر لمسی موبایل در تب طراحی بین بوم و پالت */}
      {activeMainTab === 'design' && (
        <div className="md:hidden bg-white border-b border-slate-200 px-3 py-2 flex items-center justify-center gap-2 shrink-0">
          <button
            onClick={() => setMobileTab('canvas')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === 'canvas'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>بوم فرم ({toPersianDigits(activeForm.fields.length)})</span>
          </button>

          <button
            onClick={() => setMobileTab('palette')}
            className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all ${
              mobileTab === 'palette'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>انتخاب فیلدها و ابزارها</span>
          </button>
        </div>
      )}

      {/* بدنه و محیط کاری استودیو */}
      <div className="flex-1 flex overflow-hidden relative">
        
        {/* ۱: تب طراحی (Design) */}
        {activeMainTab === 'design' && (
          <>
            {/* جعبه فیلدها و ابزارک‌های فرم‌افزار - در دسکتاپ سمت راست داک‌شده */}
            {showPalette && (
              <div className="hidden md:block h-full shrink-0">
                <WidgetPalette 
                  onSelectWidget={(type) => handleQuickAddField(type)} 
                />
              </div>
            )}

            {/* در موبایل: تب انتخاب فیلدها */}
            {mobileTab === 'palette' && (
              <div className="md:hidden flex-1 flex flex-col h-full overflow-hidden bg-white">
                {targetPanelId && (
                  <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      <span>
                        افزودن به:{' '}
                        {activeForm.panels?.find((p) => p.id === targetPanelId)?.title || 'پنل انتخابی'}
                      </span>
                    </div>
                    <button
                      onClick={() => setMobileTab('canvas')}
                      className="text-emerald-700 hover:text-emerald-900 font-bold text-[11px] underline"
                    >
                      انصراف و بازگشت
                    </button>
                  </div>
                )}
                <WidgetPalette 
                  onSelectWidget={(type) => handleQuickAddField(type)} 
                  isMobileDrawer={false}
                />
              </div>
            )}

            {/* بوم طراحی فرم */}
            <div className={`flex-1 flex flex-col h-full overflow-y-auto ${
              mobileTab === 'palette' ? 'hidden md:flex' : 'flex'
            }`}>
              <BuilderCanvas
                form={activeForm}
                selectedFieldId={editingField?.id}
                onUpdateForm={(updated) => updateForm(activeForm.id, updated)}
                onSelectFieldForEdit={(field) => setEditingField(field)}
                onOpenWidgetPalette={handleOpenPaletteWithTarget}
                onQuickAddField={handleQuickAddField}
                onPreview={onPreview}
              />
            </div>
          </>
        )}

        {/* ۲: تب تنظیمات (Settings - اسکرین‌شات ۲ فرم‌افزار) */}
        {activeMainTab === 'settings' && (
          <SettingsTab 
            form={activeForm} 
            onUpdateForm={(updated) => updateForm(activeForm.id, updated)} 
          />
        )}

        {/* ۳: تب قالب (Theme - اسکرین‌شات ۳ فرم‌افزار و شخصی‌سازی ادمین) */}
        {activeMainTab === 'theme' && (
          <ThemeTab 
            form={activeForm} 
            onUpdateForm={(updated) => updateForm(activeForm.id, updated)}
            onPreview={onPreview}
          />
        )}

        {/* ۴: تب اشتراک‌گذاری (Share - اسکرین‌شات ۴ و ۵ فرم‌افزار) */}
        {activeMainTab === 'share' && (
          <ShareTab 
            form={activeForm} 
            onUpdateForm={(updated) => updateForm(activeForm.id, updated)} 
          />
        )}

        {/* ۵: تب یکپارچه‌سازی (Integrations) */}
        {activeMainTab === 'integrations' && (
          <IntegrationsTab 
            form={activeForm} 
            onUpdateForm={(updated) => updateForm(activeForm.id, updated)} 
          />
        )}

      </div>

      {/* کشوی تنظیمات و ویرایش مشخصات فیلد انتخاب‌شده */}
      <FieldEditorDrawer
        field={editingField}
        form={activeForm}
        onClose={() => setEditingField(null)}
        onUpdate={handleUpdateField}
        onDelete={handleDeleteField}
        onUpdateForm={(updated) => updateForm(activeForm.id, updated)}
      />

    </div>
  );
};
