'use client';

import React, { useState, useRef } from 'react';
import { Form, FormThemeSettings } from '@/types/form';
import { 
  Palette, 
  Printer, 
  Plus, 
  Download, 
  Filter, 
  Edit3, 
  Check, 
  Image as ImageIcon, 
  Type, 
  Sliders, 
  Maximize2, 
  Layout, 
  Sparkles,
  Eye,
  RotateCcw,
  Upload,
  UploadCloud,
  Trash2,
  X,
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { PrintTemplateTab } from './print-template-tab';
import { toPersianDigits } from '@/lib/persian';

interface ThemeTabProps {
  form: Form;
  onUpdateForm: (updated: Partial<Form>) => void;
  onPreview: () => void;
}

interface PresetTheme {
  id: string;
  name: string;
  bgGradient: string;
  cssGradient: string;
  cardBg: string;
  textColor: string;
  titleColor: string;
  labelColor: string;
  primaryColor: string;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  fontFamily: 'vazirmatn' | 'iranyekan' | 'shabnam' | 'system';
}

const presetThemes: PresetTheme[] = [
  { id: 'belhagh_official', name: 'قالب رسمی بالحق (مدرن)', bgGradient: 'from-sky-50 via-blue-50/60 to-indigo-50/40', cssGradient: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #f8fafc 100%)', cardBg: '#ffffff', textColor: '#1e293b', titleColor: '#0369a1', labelColor: '#0f172a', primaryColor: '#0284c7', borderRadius: 'xl', fontFamily: 'vazirmatn' },
  { id: 'formafzar', name: 'قالب فرم افزار', bgGradient: 'from-pink-500 via-purple-600 to-indigo-700', cssGradient: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #4338ca 100%)', cardBg: '#ffffff', textColor: '#334155', titleColor: '#4c1d95', labelColor: '#1e293b', primaryColor: '#8b5cf6', borderRadius: 'md', fontFamily: 'vazirmatn' },
  { id: 'transparent', name: 'قالب شفاف', bgGradient: 'from-teal-200 via-cyan-300 to-sky-400', cssGradient: 'linear-gradient(135deg, #99f6e4 0%, #38bdf8 50%, #818cf8 100%)', cardBg: 'rgba(255, 255, 255, 0.90)', textColor: '#0f172a', titleColor: '#0369a1', labelColor: '#0f172a', primaryColor: '#0284c7', borderRadius: 'lg', fontFamily: 'iranyekan' },
  { id: 'garden', name: 'قالب گاردن', bgGradient: 'from-slate-200 to-slate-400', cssGradient: 'linear-gradient(135deg, #f1f5f9 0%, #cbd5e1 50%, #94a3b8 100%)', cardBg: '#ffffff', textColor: '#334155', titleColor: '#1e293b', labelColor: '#334155', primaryColor: '#475569', borderRadius: 'sm', fontFamily: 'system' },
  { id: 'accelerator', name: 'قالب شتاب دهنده', bgGradient: 'from-emerald-900 via-teal-900 to-slate-900', cssGradient: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #0f172a 100%)', cardBg: '#ffffff', textColor: '#0f172a', titleColor: '#064e3b', labelColor: '#1e293b', primaryColor: '#10b981', borderRadius: 'lg', fontFamily: 'vazirmatn' },
  { id: 'nature', name: 'قالب طبیعت', bgGradient: 'from-emerald-400 via-teal-500 to-green-600', cssGradient: 'linear-gradient(135deg, #6ee7b7 0%, #10b981 50%, #047857 100%)', cardBg: '#ffffff', textColor: '#064e3b', titleColor: '#047857', labelColor: '#064e3b', primaryColor: '#059669', borderRadius: 'xl', fontFamily: 'iranyekan' },
  { id: 'houram', name: 'قالب هورام', bgGradient: 'from-amber-100 via-orange-100 to-yellow-200', cssGradient: 'linear-gradient(135deg, #fef3c7 0%, #fed7aa 50%, #fde68a 100%)', cardBg: '#ffffff', textColor: '#78350f', titleColor: '#b45309', labelColor: '#78350f', primaryColor: '#d97706', borderRadius: 'md', fontFamily: 'shabnam' },
  { id: 'magenta', name: 'قالب سرخابی', bgGradient: 'from-rose-500 via-pink-600 to-red-500', cssGradient: 'linear-gradient(135deg, #f43f5e 0%, #e11d48 50%, #9f1239 100%)', cardBg: '#ffffff', textColor: '#881337', titleColor: '#9f1239', labelColor: '#881337', primaryColor: '#e11d48', borderRadius: 'md', fontFamily: 'vazirmatn' },
  { id: 'violet', name: 'قالب ویولت', bgGradient: 'from-purple-600 via-violet-700 to-indigo-800', cssGradient: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #4c1d95 100%)', cardBg: '#ffffff', textColor: '#3b0764', titleColor: '#581c87', labelColor: '#3b0764', primaryColor: '#7c3aed', borderRadius: 'xl', fontFamily: 'iranyekan' },
  { id: 'hadis', name: 'قالب حدیث', bgGradient: 'from-slate-300 via-blue-200 to-cyan-200', cssGradient: 'linear-gradient(135deg, #e0f2fe 0%, #7dd3fc 50%, #0284c7 100%)', cardBg: '#ffffff', textColor: '#1e293b', titleColor: '#0369a1', labelColor: '#1e293b', primaryColor: '#2563eb', borderRadius: 'lg', fontFamily: 'vazirmatn' },
  { id: 'mahsan', name: 'قالب مهسان', bgGradient: 'from-amber-200 via-stone-300 to-orange-200', cssGradient: 'linear-gradient(135deg, #fde68a 0%, #fbbf24 50%, #d97706 100%)', cardBg: '#ffffff', textColor: '#451a03', titleColor: '#78350f', labelColor: '#451a03', primaryColor: '#b45309', borderRadius: 'sm', fontFamily: 'shabnam' },
  { id: 'sarina', name: 'قالب سارینا', bgGradient: 'from-slate-700 via-slate-800 to-slate-900', cssGradient: 'linear-gradient(135deg, #334155 0%, #1e293b 50%, #0f172a 100%)', cardBg: '#ffffff', textColor: '#0f172a', titleColor: '#0f172a', labelColor: '#1e293b', primaryColor: '#3b82f6', borderRadius: 'none', fontFamily: 'system' },
  { id: 'harmony', name: 'قالب هارمونی', bgGradient: 'from-blue-200 via-indigo-100 to-purple-200', cssGradient: 'linear-gradient(135deg, #c7d2fe 0%, #818cf8 50%, #4f46e5 100%)', cardBg: '#ffffff', textColor: '#1e1b4b', titleColor: '#3730a3', labelColor: '#1e1b4b', primaryColor: '#4f46e5', borderRadius: 'xl', fontFamily: 'vazirmatn' },
];

export const ThemeTab: React.FC<ThemeTabProps> = ({ form, onUpdateForm, onPreview }) => {
  const [activeSubTab, setActiveSubTab] = useState<'formTheme' | 'printTheme'>('formTheme');
  const [viewMode, setViewMode] = useState<'gallery' | 'customizer'>('gallery');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [bgSourceTab, setBgSourceTab] = useState<'upload' | 'presets' | 'url'>('upload');
  const [isDraggingBg, setIsDraggingBg] = useState(false);
  const bgFileInputRef = useRef<HTMLInputElement | null>(null);

  const curatedBgPresets = [
    { id: 'nature_tree', label: 'طبیعت بالحق', url: '/images/nature-tree.jpg' },
    { id: 'office', label: 'دفتر کار مدرن', url: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80' },
    { id: 'nature', label: 'طبیعت کوهستان', url: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80' },
    { id: 'minimal', label: 'معماری مینیمال', url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=1200&q=80' },
    { id: 'sky', label: 'آسمان آرام', url: 'https://images.unsplash.com/photo-1517685352821-92cf88aee5a5?auto=format&fit=crop&w=1200&q=80' },
    { id: 'abstract', label: 'گرادیانت شیک', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1200&q=80' },
    { id: 'texture', label: 'تکسچر نوری', url: 'https://images.unsplash.com/photo-1579546929518-9e396f3cc809?auto=format&fit=crop&w=1200&q=80' },
  ];

  const handleBgFileUpload = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        updateTheme({
          backgroundImage: e.target.result as string,
          backgroundSize: theme.backgroundSize || 'cover',
          backgroundPosition: theme.backgroundPosition || 'center',
        });
      }
    };
    reader.readAsDataURL(file);
  };

  // تم جاری فرم
  const theme: FormThemeSettings = form.theme || {
    themeId: 'formafzar',
    themeColor: '#8b5cf6',
    backgroundGradient: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 50%, #4f46e5 100%)',
    fontFamily: 'vazirmatn',
    borderRadius: 'md',
    formWidth: 'standard',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    shadow: 'md',
    titleColor: '#0f172a',
    textColor: '#334155',
    labelColor: '#1e293b',
    cardBackgroundColor: '#ffffff',
    inputBackgroundColor: '#ffffff',
    inputBorderColor: '#cbd5e1',
    buttonColor: '#8b5cf6',
    buttonTextColor: '#ffffff',
  };

  const updateTheme = (props: Partial<FormThemeSettings>) => {
    const updatedTheme = {
      ...theme,
      ...props,
    };
    onUpdateForm({ theme: updatedTheme });
  };

  const handleApplyPreset = (preset: PresetTheme) => {
    const updatedTheme: FormThemeSettings = {
      ...theme,
      themeId: preset.id,
      themeColor: preset.primaryColor,
      backgroundGradient: preset.cssGradient,
      cardBackgroundColor: preset.cardBg,
      textColor: preset.textColor,
      titleColor: preset.titleColor,
      labelColor: preset.labelColor,
      borderRadius: preset.borderRadius,
      fontFamily: preset.fontFamily,
      buttonColor: preset.primaryColor,
      buttonTextColor: '#ffffff',
    };
    onUpdateForm({ theme: updatedTheme });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const formWidthClass = {
    compact: 'max-w-xl',
    standard: 'max-w-3xl',
    wide: 'max-w-5xl',
    full: 'max-w-full',
  }[theme.formWidth || 'standard'];

  const borderRadiusClass = {
    none: 'rounded-none',
    sm: 'rounded-md',
    md: 'rounded-xl',
    lg: 'rounded-2xl',
    xl: 'rounded-3xl',
    full: 'rounded-[36px]',
  }[theme.borderRadius || 'md'];

  const fontClass = {
    vazirmatn: 'font-sans',
    iranyekan: 'font-sans',
    shabnam: 'font-sans',
    system: 'font-mono',
  }[theme.fontFamily || 'vazirmatn'];

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-slate-50 select-none">
      
      {/* محتوای اصلی (چپ در RTL) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 order-2 md:order-1">
        
        {activeSubTab === 'formTheme' && (
          <div className="max-w-6xl mx-auto space-y-6">
            
            {/* نوار ابزار بالای تب قالب مطابق تصویر ۳ فرم‌افزار */}
            <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('gallery')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors ${
                    viewMode === 'gallery'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  گالری قالب‌های آماده فرم‌افزار
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('customizer')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 ${
                    viewMode === 'customizer'
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                  }`}
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>طراحی قالب اختصاصی توسط ادمین</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode('customizer')}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1 shadow-2xs transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ افزودن</span>
                </button>
                <button
                  type="button"
                  onClick={() => alert('دانلود فایل قالب')}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 border border-slate-200 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>دانلود</span>
                </button>
                <button
                  type="button"
                  onClick={onPreview}
                  className="px-3 py-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1 border border-slate-200 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>پیش‌نمایش</span>
                </button>
              </div>
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>قالب با موفقیت اعمال گردید.</span>
              </div>
            )}

            {/* نمای ۱: گالری قالب‌های آماده فرم‌افزار (دقیقاً مطابق تصویر ۳ فرم‌افزار) */}
            {viewMode === 'gallery' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {presetThemes.map((preset) => {
                  const isSelected = theme.themeId === preset.id;
                  return (
                    <div
                      key={preset.id}
                      className={`group bg-white rounded-2xl border transition-all overflow-hidden shadow-2xs hover:shadow-md cursor-pointer ${
                        isSelected
                          ? 'border-emerald-600 ring-2 ring-emerald-600/30'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                      onClick={() => handleApplyPreset(preset)}
                    >
                      {/* تصویر پیش‌نمایش گرافیکی قالب */}
                      <div className={`h-36 bg-linear-to-br ${preset.bgGradient} p-4 flex flex-col items-center justify-center relative`}>
                        {isSelected && (
                          <div className="absolute top-2 right-2 px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-bold rounded-full shadow-2xs flex items-center gap-1">
                            <Check className="w-3 h-3" />
                            <span>انتخاب شده</span>
                          </div>
                        )}
                        <div 
                          className="w-3/4 h-20 bg-white/90 backdrop-blur-xs rounded-lg p-2 shadow-sm flex flex-col justify-between"
                          style={{ borderRadius: preset.borderRadius === 'full' ? '16px' : preset.borderRadius === 'none' ? '0px' : '8px' }}
                        >
                          <div className="h-2 w-1/2 bg-slate-300 rounded" />
                          <div className="space-y-1">
                            <div className="h-1.5 w-full bg-slate-200 rounded" />
                            <div className="h-1.5 w-2/3 bg-slate-200 rounded" />
                          </div>
                          <div 
                            className="h-2.5 w-1/3 rounded mr-auto"
                            style={{ backgroundColor: preset.primaryColor }}
                          />
                        </div>
                      </div>

                      {/* اطلاعات و نام قالب */}
                      <div className="p-3 bg-white flex items-center justify-between border-t border-slate-100">
                        <span className="text-xs font-bold text-slate-800">{preset.name}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleApplyPreset(preset);
                            setViewMode('customizer');
                          }}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded-md transition-colors"
                          title="ویرایش و شخصی‌سازی این قالب"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* نمای ۲: طراح و سفارشی‌سازی پیشرفته قالب توسط ادمین (درخواست کاربر) */}
            {viewMode === 'customizer' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* پنل تنظیمات پیشرفته قالب ادمین (۷ ستون) */}
                <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-6">
                  
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-blue-600" />
                      <h3 className="text-sm font-bold text-slate-800">شخصی‌سازی دقیق مشخصات قالب</h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => setViewMode('gallery')}
                      className="text-xs text-blue-600 hover:text-blue-800 font-bold"
                    >
                      بازگشت به گالری
                    </button>
                  </div>

                  {/* بخش ۱: تصویر پس‌زمینه و آپلود عکس */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
                        <span>تصویر پس‌زمینه فرم</span>
                      </h4>
                      {theme.backgroundImage && (
                        <button
                          type="button"
                          onClick={() => updateTheme({ backgroundImage: '' })}
                          className="text-[11px] text-rose-600 hover:text-rose-700 font-bold flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>حذف تصویر پس‌زمینه</span>
                        </button>
                      )}
                    </div>

                    {/* تب‌های شیوه انتخاب عکس: آپلود مستقیم / تصاویر آماده / آدرس اینترنتی */}
                    <div className="flex p-0.5 bg-slate-100 rounded-lg text-xs font-bold text-slate-600">
                      <button
                        type="button"
                        onClick={() => setBgSourceTab('upload')}
                        className={`flex-1 py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                          bgSourceTab === 'upload' ? 'bg-white text-blue-700 shadow-2xs' : 'hover:text-slate-900'
                        }`}
                      >
                        <Upload className="w-3 h-3" />
                        <span>بارگذاری از سیستم</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBgSourceTab('presets')}
                        className={`flex-1 py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                          bgSourceTab === 'presets' ? 'bg-white text-blue-700 shadow-2xs' : 'hover:text-slate-900'
                        }`}
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>تصاویر آماده</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBgSourceTab('url')}
                        className={`flex-1 py-1.5 rounded-md transition-all flex items-center justify-center gap-1.5 ${
                          bgSourceTab === 'url' ? 'bg-white text-blue-700 shadow-2xs' : 'hover:text-slate-900'
                        }`}
                      >
                        <span>آدرس اینترنتی (URL)</span>
                      </button>
                    </div>

                    {/* محتوای تب انتخاب عکس */}
                    {bgSourceTab === 'upload' && (
                      <div>
                        <input
                          ref={bgFileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleBgFileUpload(e.target.files[0]);
                            }
                          }}
                        />

                        {theme.backgroundImage ? (
                          <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-900/5 group h-28 flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={theme.backgroundImage}
                              alt="Background Preview"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                type="button"
                                onClick={() => bgFileInputRef.current?.click()}
                                className="px-3 py-1.5 bg-white text-slate-800 text-xs font-bold rounded-lg shadow-md hover:bg-slate-50 flex items-center gap-1"
                              >
                                <RefreshCw className="w-3 h-3" />
                                <span>تغییر عکس</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => updateTheme({ backgroundImage: '' })}
                                className="px-3 py-1.5 bg-rose-600 text-white text-xs font-bold rounded-lg shadow-md hover:bg-rose-700 flex items-center gap-1"
                              >
                                <Trash2 className="w-3 h-3" />
                                <span>حذف</span>
                              </button>
                            </div>
                            <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/60 text-white text-[10px] rounded-md backdrop-blur-xs font-mono">
                              عکس فعال است
                            </div>
                          </div>
                        ) : (
                          <div
                            onClick={() => bgFileInputRef.current?.click()}
                            onDragOver={(e) => {
                              e.preventDefault();
                              setIsDraggingBg(true);
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              setIsDraggingBg(false);
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              setIsDraggingBg(false);
                              if (e.dataTransfer.files?.[0]) {
                                handleBgFileUpload(e.dataTransfer.files[0]);
                              }
                            }}
                            className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition-all ${
                              isDraggingBg
                                ? 'border-blue-500 bg-blue-50/80 scale-[0.99]'
                                : 'border-blue-200 hover:border-blue-400 bg-blue-50/30 hover:bg-blue-50/60'
                            }`}
                          >
                            <UploadCloud className="w-7 h-7 text-blue-600 mx-auto mb-1.5" />
                            <span className="text-xs font-bold text-slate-800 block">
                              کلیک کنید یا عکس را اینجا بکشید و رها کنید
                            </span>
                            <span className="text-[10px] text-slate-500 mt-0.5 block">
                              پشتیبانی از فرمت‌های JPG, PNG, WEBP, SVG
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {bgSourceTab === 'presets' && (
                      <div className="grid grid-cols-3 gap-2">
                        {curatedBgPresets.map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => updateTheme({ backgroundImage: preset.url, backgroundSize: 'cover', backgroundPosition: 'center' })}
                            className={`group relative h-16 rounded-xl overflow-hidden border-2 text-right transition-all ${
                              theme.backgroundImage === preset.url
                                ? 'border-blue-600 ring-2 ring-blue-600/30'
                                : 'border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={preset.url}
                              alt={preset.label}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent p-1.5 flex items-end">
                              <span className="text-[10px] font-bold text-white drop-shadow-xs">
                                {preset.label}
                              </span>
                            </div>
                            {theme.backgroundImage === preset.url && (
                              <div className="absolute top-1 left-1 w-4 h-4 rounded-full bg-blue-600 text-white flex items-center justify-center">
                                <Check className="w-2.5 h-2.5" />
                              </div>
                            )}
                          </button>
                        ))}
                      </div>
                    )}

                    {bgSourceTab === 'url' && (
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          آدرس مستقیم تصویر (URL)
                        </label>
                        <input
                          type="text"
                          placeholder="https://example.com/background.jpg"
                          value={theme.backgroundImage || ''}
                          onChange={(e) => updateTheme({ backgroundImage: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg font-mono text-left bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    )}

                    {/* تنظیمات اندازه و موقعیت عکس */}
                    <div className="grid grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          اندازه عکس (Size)
                        </label>
                        <select
                          value={theme.backgroundSize || 'cover'}
                          onChange={(e) => updateTheme({ backgroundSize: e.target.value as any })}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="cover">پوشش کل صفحه (Cover)</option>
                          <option value="contain">مقیاس کامل بدون برش (Contain)</option>
                          <option value="repeat">تکرارشونده کاشی (Repeat / Tile)</option>
                          <option value="auto">اندازه واقعی عکس (Auto)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          موقعیت قرارگیری (Position)
                        </label>
                        <select
                          value={theme.backgroundPosition || 'center'}
                          onChange={(e) => updateTheme({ backgroundPosition: e.target.value as any })}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                        >
                          <option value="center">وسط صفحه (Center)</option>
                          <option value="top">بالا (Top)</option>
                          <option value="bottom">پایین (Bottom)</option>
                          <option value="right">سمت راست (Right)</option>
                          <option value="left">سمت چپ (Left)</option>
                        </select>
                      </div>
                    </div>

                    {/* شفافیت و رنگ زیرین */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          رنگ پس‌زمینه کلی
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={theme.backgroundColor || '#f1f5f9'}
                            onChange={(e) => updateTheme({ backgroundColor: e.target.value })}
                            className="w-8 h-8 rounded border border-slate-300 cursor-pointer"
                          />
                          <span className="text-[11px] font-mono text-slate-500">
                            {theme.backgroundColor || '#f1f5f9'}
                          </span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                          پوشش تیره روی عکس: {toPersianDigits(Math.round((theme.backgroundOverlayOpacity || 0) * 100))}%
                        </label>
                        <input
                          type="range"
                          min="0"
                          max="0.8"
                          step="0.05"
                          value={theme.backgroundOverlayOpacity || 0}
                          onChange={(e) => updateTheme({ backgroundOverlayOpacity: parseFloat(e.target.value) })}
                          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
                        />
                      </div>
                    </div>
                  </div>

                  {/* بخش ۲: دور کادر، گوشه‌ها و اندازه فرم */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Layout className="w-3.5 h-3.5 text-slate-500" />
                      <span>دور کادر، گوشه‌ها و اندازه فرم</span>
                    </h4>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">شکل و گردی دور کادر فرم</label>
                      <div className="grid grid-cols-5 gap-1.5 text-center text-xs">
                        {[
                          { id: 'none', label: 'تیز (۰px)' },
                          { id: 'sm', label: 'گرد ملایم (۸px)' },
                          { id: 'md', label: 'گرد متوسط (۱۴px)' },
                          { id: 'lg', label: 'بسیار گرد (۲۲px)' },
                          { id: 'full', label: 'دایره‌ای / کپسولی' },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => updateTheme({ borderRadius: item.id as any })}
                            className={`py-2 px-1 rounded-lg border text-[11px] font-bold transition-all ${
                              theme.borderRadius === item.id
                                ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">عرض کادر فرم</label>
                        <select
                          value={theme.formWidth || 'standard'}
                          onChange={(e) => updateTheme({ formWidth: e.target.value as any })}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                        >
                          <option value="compact">باریک و جمع‌وجور (۶۰۰ پیکسل)</option>
                          <option value="standard">استاندارد سازمانی (۸۰۰ پیکسل)</option>
                          <option value="wide">عریض دسکتاپی (۱۰۰۰ پیکسل)</option>
                          <option value="full">تمام‌عرض صفحه (۱۰۰٪)</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">ضخامت خط دور کادر</label>
                        <select
                          value={theme.borderWidth || 1}
                          onChange={(e) => updateTheme({ borderWidth: Number(e.target.value) })}
                          className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg bg-white"
                        >
                          <option value={0}>بدون حاشیه (۰px)</option>
                          <option value={1}>حاشیه باریک (۱px)</option>
                          <option value={2}>حاشیه متوسط (۲px)</option>
                          <option value={3}>حاشیه ضخیم (۳px)</option>
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">رنگ خط دور کادر</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={theme.borderColor || '#cbd5e1'}
                            onChange={(e) => updateTheme({ borderColor: e.target.value })}
                            className="w-9 h-8 rounded border border-slate-300 cursor-pointer"
                          />
                          <span className="text-[11px] font-mono text-slate-500">{theme.borderColor || '#cbd5e1'}</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">رنگ کارت فرم</label>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={theme.cardBackgroundColor || '#ffffff'}
                            onChange={(e) => updateTheme({ cardBackgroundColor: e.target.value })}
                            className="w-9 h-8 rounded border border-slate-300 cursor-pointer"
                          />
                          <span className="text-[11px] font-mono text-slate-500">{theme.cardBackgroundColor || '#ffffff'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* بخش ۳: فونت‌ها، تایپوگرافی و رنگ متون */}
                  <div className="space-y-3 pt-3 border-t border-slate-100">
                    <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Type className="w-3.5 h-3.5 text-slate-500" />
                      <span>فونت‌ها و رنگ‌های متن</span>
                    </h4>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1.5">نوع فونت قلم</label>
                      <div className="grid grid-cols-4 gap-2 text-center">
                        {[
                          { id: 'vazirmatn', label: 'وزیرمتن' },
                          { id: 'iranyekan', label: 'ایران‌یکان' },
                          { id: 'shabnam', label: 'شبنم' },
                          { id: 'system', label: 'سیستم' },
                        ].map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => updateTheme({ fontFamily: item.id as any })}
                            className={`py-2 px-1 rounded-lg border text-xs font-bold transition-all ${
                              theme.fontFamily === item.id
                                ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-2xs'
                                : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            {item.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">رنگ عنوان فرم</label>
                        <input
                          type="color"
                          value={theme.titleColor || '#0f172a'}
                          onChange={(e) => updateTheme({ titleColor: e.target.value })}
                          className="w-full h-8 rounded border border-slate-300 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">رنگ برچسب فیلد</label>
                        <input
                          type="color"
                          value={theme.labelColor || '#1e293b'}
                          onChange={(e) => updateTheme({ labelColor: e.target.value })}
                          className="w-full h-8 rounded border border-slate-300 cursor-pointer"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-1">رنگ دکمه ثبت</label>
                        <input
                          type="color"
                          value={theme.buttonColor || '#2563eb'}
                          onChange={(e) => updateTheme({ buttonColor: e.target.value })}
                          className="w-full h-8 rounded border border-slate-300 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                </div>

                {/* پیش‌نمایش زنده آنی فرم (۵ ستون) با پس‌زمینه و تصویر واقعی */}
                <div 
                  className="lg:col-span-5 rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden transition-all duration-300 min-h-[500px]"
                  style={{
                    backgroundColor: theme.backgroundColor || '#f1f5f9',
                    backgroundImage: theme.backgroundImage ? `url(${theme.backgroundImage})` : (theme.backgroundGradient || undefined),
                    backgroundSize: theme.backgroundSize === 'repeat' ? 'auto' : (theme.backgroundSize || 'cover'),
                    backgroundRepeat: theme.backgroundSize === 'repeat' ? 'repeat' : 'no-repeat',
                    backgroundPosition: theme.backgroundPosition || 'center center',
                  }}
                >
                  {/* لایه پوشش روی عکس پس‌زمینه */}
                  {theme.backgroundImage && (theme.backgroundOverlayOpacity || 0) > 0 && (
                    <div 
                      className="absolute inset-0 pointer-events-none transition-opacity"
                      style={{ backgroundColor: `rgba(0, 0, 0, ${theme.backgroundOverlayOpacity})` }}
                    />
                  )}

                  <div className="relative z-10">
                    <div className="flex items-center justify-between pb-2 mb-4 border-b border-slate-200/60 bg-white/85 backdrop-blur-xs px-3 py-2 rounded-xl shadow-2xs">
                      <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-blue-600" />
                        <span>پیش‌نمایش زنده قالب و پس‌زمینه</span>
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">به‌روزرسانی در لحظه</span>
                    </div>

                    {/* جعبه شبیه‌ساز فرم با استایل زنده */}
                    <div 
                      className={`p-5 transition-all duration-200 shadow-md ${borderRadiusClass} ${fontClass}`}
                      style={{
                        backgroundColor: theme.cardBackgroundColor || '#ffffff',
                        borderWidth: `${theme.borderWidth || 1}px`,
                        borderColor: theme.borderColor || '#cbd5e1',
                        borderStyle: 'solid',
                      }}
                    >
                      <h4 
                        className="text-base font-extrabold pb-1 border-b border-slate-100"
                        style={{ color: theme.titleColor || '#0f172a' }}
                      >
                        {form.title || 'عنوان نمونه فرم'}
                      </h4>
                      <p 
                        className="text-[11px] mt-1 mb-4"
                        style={{ color: theme.textColor || '#64748b' }}
                      >
                        {form.description || 'توضیحات راهنمای نمونه...'}
                      </p>

                      <div className="space-y-3 text-xs">
                        <div>
                          <label 
                            className="block font-bold mb-1"
                            style={{ color: theme.labelColor || '#1e293b' }}
                          >
                            نام و نام خانوادگی <span className="text-rose-500">*</span>
                          </label>
                          <div 
                            className={`h-8 border px-3 flex items-center text-[11px] text-slate-400 ${borderRadiusClass}`}
                            style={{
                              backgroundColor: theme.inputBackgroundColor || '#ffffff',
                              borderColor: theme.inputBorderColor || '#cbd5e1',
                            }}
                          >
                            علی رضایی
                          </div>
                        </div>

                        <div>
                          <label 
                            className="block font-bold mb-1"
                            style={{ color: theme.labelColor || '#1e293b' }}
                          >
                            شماره تماس
                          </label>
                          <div 
                            className={`h-8 border px-3 flex items-center text-[11px] text-slate-400 ${borderRadiusClass}`}
                            style={{
                              backgroundColor: theme.inputBackgroundColor || '#ffffff',
                              borderColor: theme.inputBorderColor || '#cbd5e1',
                            }}
                          >
                            ۰۹۱۲۰۰۰۰۰۰۰
                          </div>
                        </div>

                        <div className="pt-2">
                          <button
                            type="button"
                            className={`w-full py-2 text-xs font-bold shadow-xs transition-colors cursor-pointer ${borderRadiusClass}`}
                            style={{
                              backgroundColor: theme.buttonColor || '#2563eb',
                              color: theme.buttonTextColor || '#ffffff',
                            }}
                          >
                            ثبت فرم
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs bg-white/85 backdrop-blur-xs p-2.5 rounded-xl relative z-10 shadow-2xs">
                    <span className="text-[11px] text-slate-700 font-semibold">تمامی تغییرات در فرم نهایی اعمال می‌گردد.</span>
                    <button
                      type="button"
                      onClick={() => {
                        setSaveSuccess(true);
                        setTimeout(() => setSaveSuccess(false), 2000);
                      }}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-2xs cursor-pointer"
                    >
                      ذخیره قالب
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {/* تب قالب چاپ فرم (PDF و پرینت) */}
        {activeSubTab === 'printTheme' && (
          <PrintTemplateTab form={form} onUpdateForm={onUpdateForm} />
        )}

      </div>

      {/* سایدبار ناوبری زیرمنوی قالب (سمت راست - مطابق تصویر ۳ فرم‌افزار) */}
      <div className="w-full md:w-60 bg-white border-l border-slate-200 shrink-0 p-3 overflow-y-auto order-1 md:order-2 shadow-xs">
        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setActiveSubTab('formTheme')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all text-right cursor-pointer ${
              activeSubTab === 'formTheme'
                ? 'bg-slate-50 text-slate-900 border-r-4 border-emerald-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Palette className={`w-4 h-4 ${activeSubTab === 'formTheme' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>قالب ثبت فرم</span>
            </div>
            <Edit3 className="w-3.5 h-3.5 text-slate-400" />
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab('printTheme')}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all text-right cursor-pointer ${
              activeSubTab === 'printTheme'
                ? 'bg-slate-50 text-slate-900 border-r-4 border-emerald-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Printer className={`w-4 h-4 ${activeSubTab === 'printTheme' ? 'text-emerald-600' : 'text-slate-400'}`} />
              <span>قالب چاپ فرم</span>
            </div>
            <Edit3 className="w-3.5 h-3.5 text-slate-400" />
          </button>
        </div>
      </div>

    </div>
  );
};
