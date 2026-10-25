'use client';

import React, { useState, useEffect } from 'react';
import { Form, FormField, FieldType, FormPanel } from '@/types/form';
import { 
  GripVertical, 
  Settings, 
  Copy, 
  Trash2, 
  Plus, 
  Sliders, 
  Layers, 
  Eye, 
  ChevronUp, 
  ChevronDown, 
  Monitor, 
  Tablet, 
  Smartphone, 
  Columns, 
  MapPin, 
  Move,
  X,
  Check,
  ArrowRightCircle,
  UploadCloud,
  Calendar,
  CalendarCheck,
  CalendarOff,
  Clock
} from 'lucide-react';
import { widgetDefinitions } from './widget-palette';
import { toPersianDigits } from '@/lib/persian';

interface BuilderCanvasProps {
  form: Form;
  selectedFieldId?: string;
  onUpdateForm: (updated: Partial<Form>) => void;
  onSelectFieldForEdit: (field: FormField) => void;
  onOpenWidgetPalette: (targetIndex?: number, targetPanelId?: string) => void;
  onQuickAddField: (type: FieldType, targetIndex?: number, targetPanelId?: string) => void;
  onPreview: () => void;
}

export const BuilderCanvas: React.FC<BuilderCanvasProps> = ({
  form,
  selectedFieldId,
  onUpdateForm,
  onSelectFieldForEdit,
  onOpenWidgetPalette,
  onQuickAddField,
  onPreview,
}) => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [viewportMode, setViewportMode] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  // استیت مدال تنظیمات پنل
  const [editingPanelId, setEditingPanelId] = useState<string | null>(null);
  const [editingPanelTitle, setEditingPanelTitle] = useState('');
  const [editingPanelCols, setEditingPanelCols] = useState<1 | 2 | 3 | 4>(1);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    }
  }, []);
  
  // استیت‌های Drag & Drop
  const [dragOverPanelId, setDragOverPanelId] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggingFieldIndex, setDraggingFieldIndex] = useState<number | null>(null);

  // پنل‌های فرم (در صورت عدم وجود، یک پنل پیش‌فرض ایجاد می‌شود)
  const panels: FormPanel[] = form.panels && form.panels.length > 0
    ? form.panels
    : [{ id: 'p_1', title: 'پنل ۱', columns: 1 }];

  // افزودن پنل جدید
  const handleAddPanel = () => {
    const newPanelIndex = panels.length + 1;
    const newPanel: FormPanel = {
      id: `p_${Date.now()}`,
      title: `پنل ${toPersianDigits(newPanelIndex)}`,
      columns: 1,
    };
    onUpdateForm({ panels: [...panels, newPanel] });
  };

  // ذخیره تنظیمات پنل
  const handleSavePanelSettings = () => {
    if (!editingPanelId) return;
    const updated = panels.map((p) => 
      p.id === editingPanelId ? { ...p, title: editingPanelTitle.trim() || 'بدون عنوان', columns: editingPanelCols } : p
    );
    onUpdateForm({ panels: updated });
    setEditingPanelId(null);
  };

  // حذف پنل
  const handleDeletePanel = (panelId: string) => {
    if (panels.length <= 1) {
      alert('حداقل یک پنل باید در فرم وجود داشته باشد.');
      return;
    }
    if (confirm('آیا از حذف این پنل اطمینان دارید؟ تمام فیلدهای این پنل به پنل اول منتقل می‌شوند.')) {
      const remainingPanels = panels.filter((p) => p.id !== panelId);
      const fallbackPanelId = remainingPanels[0].id;
      const updatedFields = form.fields.map((f) => 
        (f.panelId === panelId || !f.panelId) ? { ...f, panelId: fallbackPanelId } : f
      );
      onUpdateForm({ panels: remainingPanels, fields: updatedFields });
      setEditingPanelId(null);
    }
  };

  // حذف فیلد
  const handleDeleteField = (fieldId: string) => {
    if (confirm('آیا از حذف این فیلد اطمینان دارید؟')) {
      const updated = form.fields.filter((f) => f.id !== fieldId);
      onUpdateForm({ fields: updated });
    }
  };

  // کپی / تکثیر فیلد
  const handleDuplicateField = (field: FormField, index: number) => {
    const duplicate: FormField = {
      ...field,
      id: `f_${Date.now()}`,
      label: `${field.label} (کپی)`,
    };
    const newFields = [...form.fields];
    newFields.splice(index + 1, 0, duplicate);
    onUpdateForm({ fields: newFields });
    onSelectFieldForEdit(duplicate);
  };

  // جابه‌جایی سریع فیلد
  const handleMoveField = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index === 0) return;
    if (direction === 'down' && index === form.fields.length - 1) return;
    
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const newFields = [...form.fields];
    const [moved] = newFields.splice(index, 1);
    newFields.splice(targetIndex, 0, moved);
    onUpdateForm({ fields: newFields });
  };

  // تغییر عرض ستون
  const handleChangeCols = (fieldId: string, currentCols?: number) => {
    const nextColsMap: Record<number, 12 | 6 | 4 | 3> = {
      12: 6,
      6: 4,
      4: 3,
      3: 12,
    };
    const nextCols = nextColsMap[currentCols || 12] || 12;
    const newFields = form.fields.map((f) => (f.id === fieldId ? { ...f, gridCols: nextCols } : f));
    onUpdateForm({ fields: newFields });
  };

  // رویدادهای Drag & Drop
  const handleDragOver = (e: React.DragEvent, index: number, panelId?: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
    if (panelId && dragOverPanelId !== panelId) {
      setDragOverPanelId(panelId);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number, targetPanelId?: string) => {
    e.preventDefault();
    setDragOverIndex(null);
    setDragOverPanelId(null);

    const rawData = e.dataTransfer.getData('text/plain');
    if (!rawData) return;

    try {
      const parsed = JSON.parse(rawData);

      // اگر ابزارک پنل درگ شده باشد یا روی ناحیه پنل جدید رها شده باشد
      if (parsed.type === 'new-widget' && parsed.widgetType === 'alertBox') {
        handleAddPanel();
        return;
      }

      if (targetPanelId === 'new_panel') {
        const newPanelId = `p_${Date.now()}`;
        const newPanel: FormPanel = { id: newPanelId, title: `پنل ${toPersianDigits(panels.length + 1)}`, columns: 1 };
        onUpdateForm({ panels: [...panels, newPanel] });
        targetPanelId = newPanelId;
      }

      // اگر از پالت ابزارک درگ شده باشد
      if (parsed.type === 'new-widget' && parsed.widgetType) {
        onQuickAddField(parsed.widgetType, dropIndex, targetPanelId);
        return;
      }

      // اگر فیلد موجود روی بوم جابجا شده باشد
      if (parsed.type === 'existing-field' && typeof parsed.index === 'number') {
        const fromIndex = parsed.index;
        if (fromIndex === dropIndex) return;

        const newFields = [...form.fields];
        const [moved] = newFields.splice(fromIndex, 1);
        if (targetPanelId) {
          moved.panelId = targetPanelId;
        }
        const adjustedDropIndex = fromIndex < dropIndex ? dropIndex - 1 : dropIndex;
        newFields.splice(adjustedDropIndex, 0, moved);
        onUpdateForm({ fields: newFields });
        onSelectFieldForEdit(moved);
      }
    } catch {
      // ignore
    }
  };

  // آغاز درگ کردن فیلد روی بوم جهت جابجایی
  const handleFieldDragStart = (e: React.DragEvent, index: number) => {
    setDraggingFieldIndex(index);
    e.dataTransfer.setData(
      'text/plain',
      JSON.stringify({ type: 'existing-field', index })
    );
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleFieldDragEnd = () => {
    setDraggingFieldIndex(null);
    setDragOverIndex(null);
    setDragOverPanelId(null);
  };

  // مدیریت درگ اند دراپ مراحل (Steps Reordering)
  const [draggingStepIndex, setDraggingStepIndex] = useState<number | null>(null);
  const [dragOverStepIndex, setDragOverStepIndex] = useState<number | null>(null);

  const handleStepDragStart = (e: React.DragEvent, idx: number) => {
    setDraggingStepIndex(idx);
    e.dataTransfer.setData('text/plain', `step_${idx}`);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleStepDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStepIndex !== idx) {
      setDragOverStepIndex(idx);
    }
  };

  const handleStepDrop = (e: React.DragEvent, targetIdx: number) => {
    e.preventDefault();
    if (draggingStepIndex === null || draggingStepIndex === targetIdx) {
      setDraggingStepIndex(null);
      setDragOverStepIndex(null);
      return;
    }

    const currentSteps = [...(form.steps || [])];
    const [movedStep] = currentSteps.splice(draggingStepIndex, 1);
    currentSteps.splice(targetIdx, 0, movedStep);

    onUpdateForm({ steps: currentSteps });
    setActiveStepIndex(targetIdx);
    setDraggingStepIndex(null);
    setDragOverStepIndex(null);
  };

  const handleStepDragEnd = () => {
    setDraggingStepIndex(null);
    setDragOverStepIndex(null);
  };

  // افزودن مرحله جدید در حالت Wizard
  const handleAddStep = () => {
    const newStepIndex = (form.steps?.length || 0) + 1;
    const newStep = {
      id: `step-${Date.now()}`,
      title: `مرحله ${toPersianDigits(newStepIndex)}`,
      description: 'توضیحات این مرحله را وارد کنید',
      fieldIds: [],
    };
    const currentSteps = form.steps || [];
    onUpdateForm({ steps: [...currentSteps, newStep] });
    setActiveStepIndex(currentSteps.length);
  };

  const handleDeleteStep = (stepIdx: number) => {
    if (form.steps.length <= 1) return;
    if (confirm('با حذف این مرحله، فیلدهای آن به مرحله اول منتقل می‌شوند. ادامه می‌دهید؟')) {
      const stepToDelete = form.steps[stepIdx];
      const newSteps = form.steps.filter((_, i) => i !== stepIdx);
      const newFields = form.fields.map((f) =>
        f.stepId === stepToDelete.id ? { ...f, stepId: newSteps[0].id } : f
      );
      onUpdateForm({ steps: newSteps, fields: newFields });
      setActiveStepIndex(Math.max(0, stepIdx - 1));
    }
  };

  const getWidgetInfo = (type: FieldType) => {
    return widgetDefinitions.find((w) => w.type === type) || {
      label: type,
      icon: Layers,
      category: 'basic',
    };
  };

  const activeStep = form.mode === 'wizard' && form.steps && form.steps.length > 0 
    ? form.steps[activeStepIndex] 
    : null;

  const displayedFields = form.mode === 'wizard' && activeStep
    ? form.fields.filter((f) => !f.stepId || f.stepId === activeStep.id)
    : form.fields;

  const viewportWidthClass = {
    desktop: 'max-w-4xl',
    tablet: 'max-w-2xl',
    mobile: 'max-w-sm',
  }[viewportMode];

  const theme = form.theme;
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
      className="flex-1 flex flex-col h-full overflow-y-auto p-3 sm:p-6 select-none relative transition-all duration-300"
      style={{
        backgroundColor: theme?.backgroundColor || '#f8fafc',
        backgroundImage: theme?.backgroundImage ? `url(${theme.backgroundImage})` : (theme?.backgroundGradient || undefined),
        backgroundSize: theme?.backgroundSize === 'repeat' ? 'auto' : (theme?.backgroundSize || 'cover'),
        backgroundRepeat: theme?.backgroundSize === 'repeat' ? 'repeat' : 'no-repeat',
        backgroundPosition: theme?.backgroundPosition || 'center center',
        backgroundAttachment: 'fixed',
      }}
    >
      {/* لایه پوشش تیره روی عکس پس‌زمینه در صورت تنظیم توسط ادمین */}
      {theme?.backgroundImage && (theme?.backgroundOverlayOpacity || 0) > 0 && (
        <div 
          className="absolute inset-0 pointer-events-none transition-opacity"
          style={{ backgroundColor: `rgba(0, 0, 0, ${theme.backgroundOverlayOpacity})` }}
        />
      )}
      
      {/* نوار ابزار بالای بوم */}
      <div className="max-w-4xl mx-auto w-full mb-4 sm:mb-6 bg-white p-3 sm:p-3.5 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        
        {/* سوییچ حالت کلاسیک / چندمرحله‌ای */}
        <div className="flex items-center gap-2 sm:gap-3">
          <span className="text-xs font-semibold text-slate-700">سبک فرم:</span>
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50 text-xs">
            <button
              onClick={() => onUpdateForm({ mode: 'classic' })}
              className={`px-2.5 sm:px-3 py-1.5 rounded-md font-medium transition-all ${
                form.mode === 'classic'
                  ? 'bg-white shadow-xs text-blue-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              کلاسیک
            </button>
            <button
              onClick={() => onUpdateForm({ mode: 'wizard' })}
              className={`px-2.5 sm:px-3 py-1.5 rounded-md font-medium transition-all ${
                form.mode === 'wizard'
                  ? 'bg-white shadow-xs text-blue-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              چندمرحله‌ای
            </button>
            <button
              onClick={() => onUpdateForm({ mode: 'singleQuestion' })}
              className={`px-2.5 sm:px-3 py-1.5 rounded-md font-medium transition-all ${
                form.mode === 'singleQuestion'
                  ? 'bg-white shadow-xs text-blue-700 font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              تک‌سوالی (اسلایدی)
            </button>
          </div>
        </div>

        {/* سوییچ شبیه‌ساز ابعاد (دسکتاپ، تبلت، موبایل) */}
        <div className="hidden sm:flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setViewportMode('desktop')}
            className={`p-1.5 rounded ${viewportMode === 'desktop' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}
            title="نمای رایانه دسکتاپ"
          >
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewportMode('tablet')}
            className={`p-1.5 rounded ${viewportMode === 'tablet' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}
            title="نمای تبلت"
          >
            <Tablet className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewportMode('mobile')}
            className={`p-1.5 rounded ${viewportMode === 'mobile' ? 'bg-white shadow-xs text-blue-700' : 'text-slate-500 hover:text-slate-800'}`}
            title="نمای گوشی موبایل"
          >
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* دکمه‌های اکشن */}
        <div className="flex items-center gap-2">
          <button
            onClick={onPreview}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-md transition-colors"
          >
            <Eye className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden sm:inline">پیش‌نمایش زنده</span>
            <span className="sm:hidden">پیش‌نمایش</span>
          </button>
        </div>

      </div>

      {/* تب‌های مراحل در حالت مرحله‌ای با اسکرول لمسی */}
      {form.mode === 'wizard' && (
        <div className="max-w-4xl mx-auto w-full mb-3 sm:mb-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {(form.steps || []).map((step, idx) => (
              <div
                key={step.id}
                draggable
                onDragStart={(e) => handleStepDragStart(e, idx)}
                onDragOver={(e) => handleStepDragOver(e, idx)}
                onDrop={(e) => handleStepDrop(e, idx)}
                onDragEnd={handleStepDragEnd}
                className={`flex items-center rounded-lg border text-xs font-medium transition-all shrink-0 cursor-grab active:cursor-grabbing select-none ${
                  dragOverStepIndex === idx ? 'border-dashed border-blue-500 ring-2 ring-blue-300 scale-105 shadow-md' : ''
                } ${
                  draggingStepIndex === idx ? 'opacity-40' : ''
                } ${
                  activeStepIndex === idx
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs font-bold'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
                title="برای جابجایی این مرحله، آن را بگیرید و بکشید (Drag & Drop)"
              >
                <div className="pr-2 pl-0.5 text-slate-400 hover:text-slate-600 flex items-center">
                  <GripVertical className="w-3.5 h-3.5" />
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStepIndex(idx)}
                  className="pr-1 pl-3.5 py-2"
                >
                  {step.title}
                </button>
                {form.steps.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteStep(idx);
                    }}
                    className="p-1.5 hover:text-rose-400 border-r border-slate-200/50"
                    title="حذف مرحله"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <button
              onClick={handleAddStep}
              className="px-3 py-2 rounded-lg text-xs font-medium border border-dashed border-slate-300 text-slate-500 hover:text-blue-600 hover:border-blue-400 bg-white/50 shrink-0 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>مرحله جدید</span>
            </button>
          </div>
        </div>
      )}

      {/* بوم رندر فرم بر اساس Viewport انتخابی و قالب اعمال‌شده */}
      <div 
        className={`${viewportWidthClass} mx-auto w-full ${borderRadiusClass} ${fontClass} border shadow-md p-4 sm:p-7 transition-all duration-300`}
        style={{
          backgroundColor: theme?.cardBackgroundColor || '#ffffff',
          borderColor: theme?.borderColor || '#cbd5e1',
          borderWidth: `${theme?.borderWidth || 1}px`,
        }}
      >
        
        {/* سربرگ بوم فرم */}
        <div className="border-b border-slate-100 pb-4 sm:pb-5 mb-5 sm:mb-6">
          <input
            type="text"
            value={form.title}
            onChange={(e) => onUpdateForm({ title: e.target.value })}
            className="w-full text-lg sm:text-2xl font-extrabold focus:outline-none focus:ring-1 focus:ring-blue-500 rounded p-1 -mr-1"
            style={{ color: theme?.titleColor || '#0f172a' }}
            placeholder="عنوان فرم سازمانی..."
          />
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => onUpdateForm({ description: e.target.value })}
            className="w-full text-xs mt-2 focus:outline-none focus:ring-1 focus:ring-blue-500 rounded p-1 -mr-1 resize-none"
            style={{ color: theme?.textColor || '#64748b' }}
            placeholder="توضیحات و راهنمای کلی فرم برای مراجعین..."
          />
        </div>

        {/* لیست پنل‌های فرم دقیقاً مطابق ساختار و طراحی فرم‌افزار */}
        <div className="space-y-6">
          {panels.map((panel, panelIndex) => {
            // فیلدهای متعلق به این پنل
            const panelFields = displayedFields.filter((f) => {
              if (f.panelId) return f.panelId === panel.id;
              // فیلدهای بدون پنل در اولین پنل قرار می‌گیرند
              return panelIndex === 0;
            });

            return (
              <div
                key={panel.id}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.dataTransfer.dropEffect = 'copy';
                  if (dragOverPanelId !== panel.id) setDragOverPanelId(panel.id);
                }}
                onDragLeave={(e) => {
                  if (e.currentTarget === e.target) setDragOverPanelId(null);
                }}
                onDrop={(e) => handleDrop(e, form.fields.length, panel.id)}
                className={`bg-white rounded-xl border p-3 sm:p-5 shadow-2xs relative transition-all ${
                  dragOverPanelId === panel.id ? 'border-emerald-500 ring-2 ring-emerald-500/20' : 'border-slate-300'
                }`}
              >
                {/* هدر پنل مطابق تصویر فرم‌افزار */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-100">
                  {/* سمت راست: نام پنل */}
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm sm:text-base text-slate-800">
                      {panel.title || `پنل ${toPersianDigits(panelIndex + 1)}`}
                    </span>
                    {panelFields.length > 0 && (
                      <span className="text-[11px] text-slate-400 font-medium">
                        ({toPersianDigits(panelFields.length)} فیلد)
                      </span>
                    )}
                  </div>

                  {/* سمت چپ: آیکون چرخ‌دنده تنظیمات پنل */}
                  <button
                    onClick={() => {
                      setEditingPanelId(panel.id);
                      setEditingPanelTitle(panel.title || `پنل ${toPersianDigits(panelIndex + 1)}`);
                      setEditingPanelCols(panel.columns || 1);
                    }}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    title="تنظیمات پنل"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                </div>

                {/* لیست فیلدهای درون این پنل */}
                {panelFields.length === 0 ? (
                  <div
                    onDragOver={(e) => handleDragOver(e, 0, panel.id)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, 0, panel.id)}
                    className={`py-8 text-center border-2 border-dashed rounded-lg transition-colors mb-3 ${
                      dragOverPanelId === panel.id
                        ? 'border-emerald-500 bg-emerald-50/60 text-emerald-800'
                        : 'border-slate-200 bg-slate-50/50 text-slate-500'
                    }`}
                  >
                    <p className="text-xs font-bold">
                      {dragOverPanelId === panel.id ? '↓ ابزارک را اینجا رها کنید' : 'این پنل هنوز ابزاری ندارد'}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 hidden md:block">
                      ابزارک دلخواه را از پالت سمت راست بکشید و در این کادر رها کنید (Drag & Drop)
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1 md:hidden">
                      با لمس دکمه «+ افزودن فیلد» زیر، ابزارک مورد نظر را اضافه کنید
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-12 gap-3 mb-3">
                    {panelFields.map((field) => {
                      const globalIndex = form.fields.findIndex((f) => f.id === field.id);
                      const widgetInfo = getWidgetInfo(field.type);
                      const isSelected = selectedFieldId === field.id;
                      const isDraggingThis = draggingFieldIndex === globalIndex;

                      const colSpanClass: Record<number, string> = {
                        12: 'col-span-12',
                        6: 'col-span-12 md:col-span-6',
                        4: 'col-span-12 md:col-span-4',
                        3: 'col-span-12 md:col-span-3',
                        2: 'col-span-12 md:col-span-2',
                        1: 'col-span-12 md:col-span-1',
                      };
                      const colClass = colSpanClass[field.gridCols || 12] || 'col-span-12';

                      return (
                        <React.Fragment key={field.id}>
                          <div
                            draggable={!isTouchDevice}
                            onDragStart={(e) => handleFieldDragStart(e, globalIndex)}
                            onDragEnd={handleFieldDragEnd}
                            onClick={() => onSelectFieldForEdit(field)}
                            className={`${colClass} group relative p-3 sm:p-4 rounded-xl border transition-all cursor-pointer ${
                            isSelected
                              ? 'border-blue-600 ring-2 ring-blue-600/30 bg-blue-50/15 shadow-md'
                              : isDraggingThis
                              ? 'opacity-30 border-dashed border-slate-400'
                              : 'border-slate-200 bg-white hover:border-blue-400 hover:shadow-xs'
                          }`}
                        >
                          {/* برچسب در حال ویرایش */}
                          {isSelected && (
                            <div className="absolute -top-2.5 right-3 px-2 py-0.5 bg-blue-600 text-white text-[10px] font-bold rounded-full shadow-xs flex items-center gap-1">
                              <span>در حال ویرایش</span>
                            </div>
                          )}

                          {/* ردیف هدر فیلد: آیکون جابجایی + برچسب و الزامی بودن */}
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2 min-w-0">
                              {/* آیکون فلش ۴ طرفه جابجایی مطابق فرم‌افزار */}
                              <div 
                                className="text-slate-400 hover:text-slate-700 cursor-grab active:cursor-grabbing p-0.5 shrink-0" 
                                title="جابجایی فیلد"
                              >
                                <Move className="w-3.5 h-3.5" />
                              </div>

                              <span className="text-xs font-bold text-slate-800 truncate">
                                {field.label}
                              </span>
                              {field.validations.required && (
                                <span className="text-rose-500 font-bold text-xs" title="فیلد الزامی">*</span>
                              )}
                            </div>

                            {/* ابزارهای سریع فیلد */}
                            <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updated = form.fields.map((f) =>
                                    f.id === field.id ? { ...f, pageBreakAfter: !f.pageBreakAfter } : f
                                  );
                                  onUpdateForm({ fields: updated });
                                }}
                                className={`p-1 rounded text-[10px] font-bold flex items-center gap-0.5 transition-colors ${
                                  field.pageBreakAfter
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'text-slate-400 hover:text-blue-600'
                                }`}
                                title={field.pageBreakAfter ? 'حذف دکمه بعدی این صفحه' : 'ایجاد دکمه بعدی و انتقال به صفحه بعد'}
                              >
                                <ArrowRightCircle className="w-3.5 h-3.5" />
                                <span className="hidden xl:inline text-[9px]">{field.pageBreakAfter ? 'بعدی ✓' : 'کلیک بعدی'}</span>
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleChangeCols(field.id, field.gridCols);
                                }}
                                className="p-1 text-slate-400 hover:text-blue-600 text-[10px] font-mono hidden sm:flex items-center"
                                title="تغییر عرض"
                              >
                                <Columns className="w-3 h-3" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveField(globalIndex, 'up');
                                }}
                                className="p-1 text-slate-400 hover:text-slate-700"
                                title="انتقال به بالا"
                              >
                                <ChevronUp className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveField(globalIndex, 'down');
                                }}
                                className="p-1 text-slate-400 hover:text-slate-700"
                                title="انتقال به پایین"
                              >
                                <ChevronDown className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDuplicateField(field, globalIndex);
                                }}
                                className="p-1 text-slate-400 hover:text-blue-600 hidden sm:block"
                                title="کپی فیلد"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteField(field.id);
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600"
                                title="حذف فیلد"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {/* پیش‌نمایش کنترل ورودی متناسب با نوع */}
                          <div className="mt-1">
                            {field.type === 'textarea' ? (
                              <div className="h-14 border border-dashed border-slate-200 rounded-md bg-slate-50/60 p-2 text-[11px] text-slate-400">
                                {field.placeholder || 'متن چندخطی (توضیحات)...'}
                              </div>
                            ) : ['radio', 'checkbox', 'quizQuestion'].includes(field.type) ? (
                              <div className="space-y-1.5 pt-1">
                                {(field.options || []).slice(0, 3).map((opt) => (
                                  <div key={opt.id} className="flex items-center gap-2 text-xs text-slate-600">
                                    <div className="w-3.5 h-3.5 rounded-full border border-slate-300 bg-slate-50" />
                                    <span>{opt.label}</span>
                                    {opt.price ? (
                                      <span className="text-[10px] text-slate-400 font-mono mr-auto">
                                        +{toPersianDigits(opt.price)} تومان
                                      </span>
                                    ) : null}
                                  </div>
                                ))}
                              </div>
                            ) : field.type === 'signature' ? (
                              <div className="h-12 border border-dashed border-slate-200 rounded-md bg-slate-50/70 flex items-center justify-center text-[11px] text-slate-400">
                                کادر امضای دیجیتال کاربر
                              </div>
                            ) : field.type === 'richText' ? (
                              <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50/50">
                                <div className="flex items-center gap-2 pb-1.5 mb-1.5 border-b border-slate-200 text-slate-400 text-[10px]">
                                  <span className="font-bold px-1 rounded bg-slate-200 text-slate-700">B</span>
                                  <span className="italic font-serif px-1">I</span>
                                  <span className="underline px-1">U</span>
                                </div>
                                <div className="text-[11px] text-slate-400 min-h-[30px]">
                                  {field.placeholder || 'محل نگارش متن پیشرفته...'}
                                </div>
                              </div>
                            ) : field.type === 'satisfaction' ? (
                              <div className="flex items-center justify-around py-2 bg-slate-50 rounded-xl border border-slate-200">
                                <span className="text-lg opacity-75">😡</span>
                                <span className="text-lg opacity-75">🙁</span>
                                <span className="text-lg opacity-75">😐</span>
                                <span className="text-lg opacity-75">😊</span>
                                <span className="text-lg opacity-75">😍</span>
                              </div>
                            ) : field.type === 'likertScale' ? (
                              <div className="grid grid-cols-4 gap-1 text-center text-[10px] py-1.5 px-2 bg-slate-50 rounded-lg border border-slate-200">
                                <div className="p-1 border-l border-slate-200 text-slate-700">بسیار خوب</div>
                                <div className="p-1 border-l border-slate-200 text-slate-700">خوب</div>
                                <div className="p-1 border-l border-slate-200 text-slate-700">متوسط</div>
                                <div className="p-1 text-slate-700">ضعیف</div>
                              </div>
                            ) : field.type === 'mapLocation' ? (
                              <div className="h-12 border border-dashed border-emerald-300 rounded-lg bg-emerald-50/40 flex items-center justify-center gap-2 text-xs text-emerald-800">
                                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                                <span>موقعیت مکانی روی نقشه</span>
                              </div>
                            ) : ['fileUpload', 'imageUpload', 'photoCrop'].includes(field.type) ? (
                              <div className="border-2 border-dashed border-slate-300 rounded-xl p-3 text-center bg-slate-50/70 hover:bg-slate-50">
                                <UploadCloud className="w-5 h-5 text-slate-400 mx-auto mb-1" />
                                <span className="text-[11px] text-slate-700 font-bold block">
                                  {field.type === 'imageUpload' || field.type === 'photoCrop'
                                    ? 'بارگذاری تصویر (کلیک یا کشیدن عکس)'
                                    : 'بارگذاری فایل و ضمایم (PDF, Doc, Zip...)'}
                                </span>
                                <span className="text-[10px] text-slate-400">حداکثر ۲۰ مگابایت</span>
                              </div>
                            ) : field.type === 'termsCheckbox' ? (
                              <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
                                <input type="checkbox" readOnly checked className="w-3.5 h-3.5 rounded text-blue-600 border-slate-300" />
                                <span>شرایط و قوانین را می‌پذیرم.</span>
                              </div>
                            ) : field.type === 'appointmentBooking' ? (
                              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl space-y-2">
                                <div className="flex items-center justify-between text-xs">
                                  <div className="flex items-center gap-1.5 font-bold text-emerald-950">
                                    <Calendar className="w-4 h-4 text-emerald-600" />
                                    <span>تنظیمات زمان‌بندی و نوبت‌دهی مشاور</span>
                                  </div>
                                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                                    {toPersianDigits(field.appointmentData?.slotDurationMinutes || 30)} دقیقه‌ای
                                  </span>
                                </div>

                                {/* روزهای کاری */}
                                <div className="flex flex-wrap items-center gap-1 text-[11px]">
                                  <span className="font-bold text-emerald-800 flex items-center gap-0.5">
                                    <CalendarCheck className="w-3 h-3 text-emerald-600" />
                                    <span>روزهای کاری:</span>
                                  </span>
                                  {(field.appointmentData?.availableDays || [0, 1, 2, 3, 4]).map((dIdx) => {
                                    const dayNames = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
                                    return (
                                      <span key={dIdx} className="bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold text-[10px]">
                                        {dayNames[dIdx]}
                                      </span>
                                    );
                                  })}
                                </div>

                                {/* روزهای تعطیل */}
                                <div className="flex flex-wrap items-center gap-1 text-[11px]">
                                  <span className="font-bold text-rose-700 flex items-center gap-0.5">
                                    <CalendarOff className="w-3 h-3 text-rose-500" />
                                    <span>روزهای تعطیل:</span>
                                  </span>
                                  {[0, 1, 2, 3, 4, 5, 6]
                                    .filter((dIdx) => !(field.appointmentData?.availableDays || [0, 1, 2, 3, 4]).includes(dIdx))
                                    .map((dIdx) => {
                                      const dayNames = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'];
                                      return (
                                        <span key={dIdx} className="bg-rose-50 text-rose-700 border border-rose-200 px-1.5 py-0.5 rounded font-medium text-[10px]">
                                          {dayNames[dIdx]}
                                        </span>
                                      );
                                    })}
                                </div>

                                <div className="flex items-center justify-between pt-1 border-t border-emerald-200/70 text-[10px] text-slate-500">
                                  <span>
                                    ساعات کاری: {toPersianDigits(field.appointmentData?.startHour || '09:00')} الی {toPersianDigits(field.appointmentData?.endHour || '17:00')}
                                    {field.appointmentData?.restTimeMinutes ? ` (استراحت: ${toPersianDigits(field.appointmentData.restTimeMinutes)} دقیقه)` : ''}
                                  </span>
                                  <span className="text-emerald-700 font-bold">
                                    کلیک برای ویرایش تقویم
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <div className="h-8 border border-slate-200 rounded-md bg-slate-50/60 flex items-center px-3 text-[11px] text-slate-400">
                                {field.placeholder || 'محل ورود داده کاربر...'}
                              </div>
                            )}
                          </div>

                          {/* نوار اکشن لمسی در حالت انتخاب در گوشی */}
                          {isSelected && (
                            <div className="mt-3 pt-2 border-t border-blue-200 flex items-center justify-between gap-1 text-[11px]">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onSelectFieldForEdit(field);
                                }}
                                className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 text-white rounded-lg font-bold shadow-2xs"
                              >
                                <Settings className="w-3 h-3" />
                                <span>ویرایش</span>
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const updated = form.fields.map((f) =>
                                    f.id === field.id ? { ...f, pageBreakAfter: !f.pageBreakAfter } : f
                                  );
                                  onUpdateForm({ fields: updated });
                                }}
                                className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-colors ${
                                  field.pageBreakAfter
                                    ? 'bg-blue-600 text-white shadow-2xs'
                                    : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                }`}
                                title="تعریف دکمه بعدی برای این پرسش"
                              >
                                <ArrowRightCircle className="w-3 h-3" />
                                <span>دکمه بعدی: {field.pageBreakAfter ? 'فعال' : 'غیرفعال'}</span>
                              </button>

                              <div className="flex items-center gap-1">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDuplicateField(field, globalIndex);
                                  }}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-blue-600 rounded-lg"
                                  title="تکثیر فیلد"
                                >
                                  <Copy className="w-3 h-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleDeleteField(field.id);
                                  }}
                                  className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg"
                                  title="حذف فیلد"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* نشانگر تصویری شکست صفحه و دکمه بعدی */}
                        {field.pageBreakAfter && (
                          <div className="col-span-12 py-2 px-3 bg-blue-50/90 border border-dashed border-blue-400 rounded-xl flex items-center justify-between text-xs text-blue-900 shadow-2xs my-1 animate-in fade-in duration-150">
                            <div className="flex items-center gap-2 font-bold">
                              <ArrowRightCircle className="w-4 h-4 text-blue-600 shrink-0" />
                              <span>پایان این صفحه ── ایجاد دکمه «{field.nextButtonText || 'بعدی'}» و انتقال به پرسش بعد</span>
                            </div>
                            <span className="text-[10px] bg-white border border-blue-200 px-2.5 py-0.5 rounded-full font-bold text-blue-700">
                              کلیک بعدی ⏭
                            </span>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                  </div>
                )}

                {/* دکمه سبز رنگ افزودن فیلد - فقط در حالت موبایل (در کامپیوتر درگ اند دراپ است) */}
                <button
                  type="button"
                  onClick={() => onOpenWidgetPalette(undefined, panel.id)}
                  className="md:hidden w-full py-2.5 px-4 border border-emerald-600 hover:bg-emerald-50 active:bg-emerald-100 text-emerald-600 font-bold text-xs sm:text-sm rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-2"
                >
                  <Plus className="w-4 h-4 stroke-[2.5]" />
                  <span>افزودن فیلد</span>
                </button>
              </div>
            );
          })}
        </div>

        {/* بخش پایین بوم: دکمه افزودن پنل در موبایل، ناحیه درگ اند دراپ در کامپیوتر، و ثبت فرم */}
        <div className="mt-5 space-y-3">
          {/* دکمه سرمه‌ای/تیره افزودن پنل - فقط در حالت موبایل (در کامپیوتر درگ اند دراپ است) */}
          <button
            type="button"
            onClick={handleAddPanel}
            className="md:hidden w-full py-2.5 px-4 border border-slate-700 hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>افزودن پنل</span>
          </button>

          {/* ناحیه درگ اند دراپ کامپیوتر برای افزودن پنل یا فیلد جدید */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'copy';
              if (dragOverPanelId !== 'new_panel') setDragOverPanelId('new_panel');
            }}
            onDragLeave={() => setDragOverPanelId(null)}
            onDrop={(e) => handleDrop(e, form.fields.length, 'new_panel')}
            className={`hidden md:flex transition-all duration-150 rounded-xl items-center justify-center border-2 border-dashed py-3 my-2 ${
              dragOverPanelId === 'new_panel'
                ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold text-xs'
                : 'border-slate-300 bg-slate-50/60 text-slate-500 hover:border-slate-400 text-xs'
            }`}
          >
            <span>
              {dragOverPanelId === 'new_panel'
                ? '↓ رها کنید تا پنل جدید ایجاد شود'
                : 'کشش ابزارک یا پنل به اینجا برای ایجاد بخش جدید (Drag & Drop)'}
            </span>
          </div>

          {/* دکمه ثبت فرم با استایل قالب اعمال‌شده */}
          <button
            type="button"
            onClick={onPreview}
            className={`w-full py-2.5 px-4 font-bold text-xs sm:text-sm rounded-lg flex items-center justify-center transition-colors cursor-pointer ${borderRadiusClass}`}
            style={{
              backgroundColor: theme?.buttonColor || '#2563eb',
              color: theme?.buttonTextColor || '#ffffff',
            }}
          >
            <span>ثبت فرم</span>
          </button>
        </div>

      </div>

      {/* مدال تنظیمات پنل */}
      {editingPanelId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <Settings className="w-4 h-4 text-blue-600" />
                <span>تنظیمات پنل</span>
              </h3>
              <button
                onClick={() => setEditingPanelId(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">عنوان پنل</label>
              <input
                type="text"
                value={editingPanelTitle}
                onChange={(e) => setEditingPanelTitle(e.target.value)}
                placeholder="مثال: اطلاعات تماس و آدرس"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-600 bg-white"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">چیدمان ستون‌ها در پنل</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPanelCols(1)}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                    editingPanelCols === 1
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  تک‌ستونه (تمام عرض)
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPanelCols(2)}
                  className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all ${
                    editingPanelCols === 2
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  دو‌ستونه (کنار هم)
                </button>
              </div>
            </div>

            {panels.length > 1 && (
              <div className="pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleDeletePanel(editingPanelId)}
                  className="w-full py-2 px-3 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>حذف این پنل</span>
                </button>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingPanelId(null)}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                انصراف
              </button>
              <button
                type="button"
                onClick={handleSavePanelSettings}
                className="px-4 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors flex items-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>ذخیره تغییرات</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
