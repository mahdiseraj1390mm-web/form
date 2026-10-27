'use client';

import React, { useState } from 'react';
import { FieldType } from '@/types/form';
import { 
  Type, 
  AlignLeft, 
  Hash, 
  Mail, 
  Phone, 
  Smartphone, 
  Calendar, 
  Clock, 
  ListFilter, 
  CheckSquare, 
  CircleDot, 
  ToggleLeft, 
  Sliders, 
  Star, 
  KeyRound, 
  Globe, 
  Tag, 
  Paperclip, 
  Layout, 
  AlertTriangle, 
  CreditCard, 
  Languages, 
  MapPin, 
  Calculator, 
  Layers, 
  PenTool, 
  Image as ImageIcon, 
  Crop, 
  Mic, 
  Video, 
  FileText, 
  CalendarClock, 
  HelpCircle, 
  Timer, 
  QrCode, 
  ThumbsUp, 
  ChevronDown, 
  ChevronLeft, 
  Search, 
  X, 
  GripVertical,
  FileEdit,
  Smile,
  Table2,
  FileCheck2,
  PlaySquare
} from 'lucide-react';

export interface WidgetDef {
  type: FieldType;
  label: string;
  tab: 'fields' | 'widgets';
  group: 'basic' | 'advanced' | 'media' | 'business';
  icon: React.ElementType;
  description: string;
  badge?: string;
}

export const widgetDefinitions: WidgetDef[] = [
  // --- تب فیلدها / فیلدهای پایه (مطابق تصویر شماره ۲ فرم‌افزار) ---
  { type: 'text', label: 'متن', tab: 'fields', group: 'basic', icon: Type, description: 'ورودی متنی تک‌خطی برای نام، عنوان و متون کوتاه' },
  { type: 'number', label: 'عدد', tab: 'fields', group: 'basic', icon: Hash, description: 'ورودی عددی، مبلغ، متراژ و سن' },
  { type: 'textarea', label: 'متن چندخطی', tab: 'fields', group: 'basic', icon: AlignLeft, description: 'توضیحات، شرح سوابق، آدرس و متون طولانی' },
  { type: 'email', label: 'ایمیل', tab: 'fields', group: 'basic', icon: Mail, description: 'پست الکترونیکی با اعتبارسنجی استاندارد' },
  { type: 'persianOnlyText', label: 'تلفن', tab: 'fields', group: 'basic', icon: Phone, description: 'شماره تلفن ثابت با پیش‌شماره' },
  { type: 'mobile', label: 'موبایل', tab: 'fields', group: 'basic', icon: Smartphone, description: 'شماره همراه با تاییدیه پیامکی OTP', badge: 'پیامک' },
  { type: 'jalaliDate', label: 'تاریخ', tab: 'fields', group: 'basic', icon: Calendar, description: 'تقویم خورشیدی رسمی با انتخابگر شمسی', badge: 'شمسی' },
  { type: 'digitalTime', label: 'ساعت', tab: 'fields', group: 'basic', icon: Clock, description: 'انتخاب دقیق زمان (ساعت و دقیقه)' },
  { type: 'select', label: 'لیست کشویی', tab: 'fields', group: 'basic', icon: ListFilter, description: 'منوی بازشو انتخابی با امکان جستجو' },
  { type: 'checkbox', label: 'چند انتخابی', tab: 'fields', group: 'basic', icon: CheckSquare, description: 'چک‌باکس چندانتخابی همزمان' },
  { type: 'radio', label: 'تک انتخابی', tab: 'fields', group: 'basic', icon: CircleDot, description: 'دکمه‌های رادیویی انتخاب یک گزینه' },
  { type: 'toggle', label: 'وضعیت', tab: 'fields', group: 'basic', icon: ToggleLeft, description: 'کلید سوئیچ روشن/خاموش، بلی/خیر' },
  { type: 'imageUpload', label: 'تصویر انتخابی', tab: 'fields', group: 'basic', icon: ImageIcon, description: 'ارسال تصویر و پیش‌نمایش گرافیکی' },
  { type: 'rating', label: 'اسلایدر', tab: 'fields', group: 'basic', icon: Sliders, description: 'ارزیابی کیفی، ستاره و نوار مدرج' },
  { type: 'englishOnlyText', label: 'وب‌سایت', tab: 'fields', group: 'basic', icon: Globe, description: 'لینک، آدرس اینترنتی یا حروف انگلیسی' },
  { type: 'password', label: 'رمز عبور', tab: 'fields', group: 'basic', icon: KeyRound, description: 'ورودی با کاراکترهای ستاره‌دار امن' },
  { type: 'sectionDivider', label: 'برچسب', tab: 'fields', group: 'basic', icon: Tag, description: 'تیتر، تفکیک‌کننده و برچسب جداکننده فرم' },
  { type: 'fileUpload', label: 'ضمیمه', tab: 'fields', group: 'basic', icon: Paperclip, description: 'بارگذاری فایل، اسناد PDF و زیپ' },
  { type: 'alertBox', label: 'پنل', tab: 'fields', group: 'basic', icon: Layout, description: 'کادر راهنما، اعلان و تذکرات مهم' },

  // --- تب فیلدها / فیلدهای پیشرفته (مطابق تصویر شماره ۱ فرم‌افزار) ---
  { type: 'formLookup', label: 'فیلد فرم', tab: 'fields', group: 'advanced', icon: Layers, description: 'فراخوانی و اتصال اطلاعات از سایر فرم‌ها' },
  { type: 'richText', label: 'ویرایشگر متن', tab: 'fields', group: 'advanced', icon: FileEdit, description: 'نوشتن متن با فرمت‌بندی پیشرفته و فونت دلخواه' },
  { type: 'formula', label: 'فرمول', tab: 'fields', group: 'advanced', icon: Calculator, description: 'محاسبات ریاضی خودکار، جمع اقلام و فرمول‌نویسی', badge: 'فرمول' },
  { type: 'signature', label: 'امضاء دیجیتال', tab: 'fields', group: 'advanced', icon: PenTool, description: 'کادر امضا با لمس صفحه یا ماوس', badge: 'امضا' },
  { type: 'cascadingProvinceCity', label: 'لیست مرتبط', tab: 'fields', group: 'advanced', icon: MapPin, description: 'انتخابگر دو مرحله‌ای استان و شهرستان‌های ایران', badge: 'بومی' },
  { type: 'rating', label: 'رتبه', tab: 'fields', group: 'advanced', icon: Star, description: 'امتیازدهی ستاره‌ای ۵ ستاره' },
  { type: 'satisfaction', label: 'رضایتمندی', tab: 'fields', group: 'advanced', icon: Smile, description: 'سنجش میزان رضایت مشتری با اموجی‌های استاندارد' },
  { type: 'likertScale', label: 'طیفی', tab: 'fields', group: 'advanced', icon: Sliders, description: 'طیف پنج‌گزینه‌ای لیکرت برای نظرسنجی دقیق' },
  { type: 'audioRecord', label: 'مالتی‌مدیا', tab: 'fields', group: 'advanced', icon: PlaySquare, description: 'پخش یا ضبط فایل‌های صوتی و تصویری' },
  { type: 'mapLocation', label: 'نقشه', tab: 'fields', group: 'advanced', icon: MapPin, description: 'انتخاب موقعیت جغرافیایی روی نقشه و ثبت لوکیشن' },
  { type: 'choiceTable', label: 'جدول انتخاب', tab: 'fields', group: 'advanced', icon: Table2, description: 'جدول ماتریسی سوالات و گزینه‌ها' },
  { type: 'appointmentBooking', label: 'رزرو وقت', tab: 'fields', group: 'advanced', icon: CalendarClock, description: 'تقویم هوشمند نوبت‌های کاری بدون تداخل (نوبت‌های باقی‌مانده)', badge: 'نوبت' },
  { type: 'termsCheckbox', label: 'شرایط استفاده', tab: 'fields', group: 'advanced', icon: FileCheck2, description: 'چک‌باکس توافق‌نامه و پذیرش قوانین' },
  { type: 'nationalCode', label: 'کد ملی ۱۰ رقمی', tab: 'fields', group: 'advanced', icon: CreditCard, description: 'اعتبارسنجی با الگوریتم کنترل ثبت‌احوال', badge: 'ایران' },

  // --- تب ابزارک‌ها / ابزارهای تکمیلی و آزمون ---
  { type: 'quizQuestion', label: 'سوال تستی آزمون', tab: 'widgets', group: 'business', icon: HelpCircle, description: 'با کلید تصحیح، نمره مثبت و منفی', badge: 'آزمون' },
  { type: 'countdownTimer', label: 'شمارنده معکوس', tab: 'widgets', group: 'business', icon: Timer, description: 'محدودسازی زمان تکمیل صفحه یا آزمون' },
  { type: 'barcodeScanner', label: 'بارکد و QR', tab: 'widgets', group: 'business', icon: QrCode, description: 'اسکن سریع با وب‌کم یا دوربین موبایل' },
  { type: 'likeButton', label: 'پسندیدم (لایک)', tab: 'widgets', group: 'business', icon: ThumbsUp, description: 'ابزار اعلام رضایت و لایک سریع' },
  { type: 'photoCrop', label: 'عکس پرسنلی', tab: 'widgets', group: 'media', icon: Crop, description: 'برش و کادربندی عکس پرسنلی ۳×۴', badge: 'پرسنلی' },
  { type: 'videoEmbed', label: 'ویدیو درون فرم', tab: 'widgets', group: 'media', icon: Video, description: 'پخش ویدیو آپارات یا فایل MP4' },
  { type: 'pdfEmbed', label: 'نمایشگر PDF', tab: 'widgets', group: 'media', icon: FileText, description: 'مشاهده بخشنامه یا برگه راهنما درون فرم' },
];

interface WidgetPaletteProps {
  onSelectWidget: (type: FieldType) => void;
  onClose?: () => void;
  isMobileDrawer?: boolean;
}

export const WidgetPalette: React.FC<WidgetPaletteProps> = ({ 
  onSelectWidget,
  onClose,
  isMobileDrawer = false
}) => {
  // تب فعال بالا (فیلدها یا ابزارک‌ها - دقیقاً مانند فرم‌افزار)
  const [activeTab, setActiveTab] = useState<'fields' | 'widgets'>('fields');
  
  // وضعیت باز/بسته بودن بخش‌های کشویی (Accordion)
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    basic: true,       // فیلدهای پایه پیش‌فرض باز
    advanced: false,   // فیلدهای پیشرفته
    media: true,       // رسانه و مدارک پیش‌فرض باز
    business: false,   // تجاری و آزمون
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [draggingWidgetType, setDraggingWidgetType] = useState<string | null>(null);

  const toggleSection = (sectionKey: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [sectionKey]: !prev[sectionKey],
    }));
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, widgetType: FieldType) => {
    setDraggingWidgetType(widgetType);
    e.dataTransfer.setData('text/plain', JSON.stringify({ type: 'new-widget', widgetType }));
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragEnd = () => {
    setDraggingWidgetType(null);
  };

  const handleSelect = (type: FieldType) => {
    onSelectWidget(type);
    if (isMobileDrawer && onClose) {
      onClose();
    }
  };

  // فیلتر ابزارک‌ها بر اساس تب و متن جستجو
  const getGroupItems = (groupKey: 'basic' | 'advanced' | 'media' | 'business') => {
    return widgetDefinitions.filter((w) => {
      const matchGroup = w.group === groupKey;
      const matchSearch = searchTerm.trim() === '' || 
        w.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        w.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchGroup && matchSearch;
    });
  };

  const basicFields = getGroupItems('basic');
  const advancedFields = getGroupItems('advanced');
  const mediaWidgets = getGroupItems('media');
  const businessWidgets = getGroupItems('business');

  return (
    <div className={`bg-white select-none flex flex-col ${
      isMobileDrawer
        ? 'w-full h-full'
        : 'w-72 sm:w-80 border-l border-slate-200 shrink-0 h-full overflow-hidden'
    }`}>
      
      {/* سربرگ موبایل در صورت لزوم */}
      {isMobileDrawer && (
        <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50 shrink-0">
          <span className="text-xs font-bold text-slate-800">جعبه ابزار فرم‌افزار</span>
          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* دو تب اصلی بالای پنل: [فیلدها] | [ابزارک‌ها] - دقیقاً مطابق فرم‌افزار */}
      <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50 shrink-0 text-center font-bold text-xs">
        <button
          onClick={() => setActiveTab('fields')}
          className={`py-3 transition-colors relative ${
            activeTab === 'fields'
              ? 'text-slate-900 bg-white font-extrabold shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
          }`}
        >
          <span>فیلدها</span>
          {activeTab === 'fields' && (
            <div className="absolute top-0 inset-x-0 h-0.5 bg-blue-700" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('widgets')}
          className={`py-3 transition-colors relative ${
            activeTab === 'widgets'
              ? 'text-slate-900 bg-white font-extrabold shadow-xs'
              : 'text-slate-500 hover:text-slate-800 hover:bg-slate-100/70'
          }`}
        >
          <span>ابزارک‌ها</span>
          {activeTab === 'widgets' && (
            <div className="absolute top-0 inset-x-0 h-0.5 bg-blue-700" />
          )}
        </button>
      </div>

      {/* نوار جستجوی جمع‌وجور */}
      <div className="p-2.5 border-b border-slate-100 bg-white shrink-0">
        <div className="relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="جستجوی ابزار (متن، کد ملی، امضا...)"
            className="w-full pl-3 pr-7 py-1.5 text-[11px] border border-slate-200 rounded bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600 placeholder:text-slate-400"
          />
          <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-2" />
        </div>
      </div>

      {/* بدنه کشویی و آکاردئونی با گرید ۲ ستونه مطابق فرم‌افزار */}
      <div className="flex-1 overflow-y-auto">
        
        {/* ===================== تب فیلدها ===================== */}
        {activeTab === 'fields' && (
          <div>
            
            {/* ۱. کشوی فیلدهای پایه */}
            <div>
              <button
                onClick={() => toggleSection('basic')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#2b5c8f] hover:bg-[#244f7c] text-white text-xs font-bold transition-colors select-none"
              >
                <span>فیلدهای پایه</span>
                {openSections.basic ? (
                  <ChevronDown className="w-4 h-4 text-blue-100" />
                ) : (
                  <ChevronLeft className="w-4 h-4 text-blue-100" />
                )}
              </button>

              {openSections.basic && (
                <div className="grid grid-cols-2 border-b border-slate-200 bg-white">
                  {basicFields.map((w, idx) => {
                    const Icon = w.icon;
                    const isDragging = draggingWidgetType === w.type;
                    const isEven = idx % 2 === 0;

                    return (
                      <div
                        key={w.type}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, w.type)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleSelect(w.type)}
                        title={w.description}
                        className={`group flex items-center justify-between px-3 py-2.5 border-b border-slate-200 cursor-grab active:cursor-grabbing text-xs transition-colors ${
                          isEven ? 'border-l border-slate-200' : ''
                        } ${
                          isDragging
                            ? 'opacity-30 bg-blue-50'
                            : 'hover:bg-blue-50/70 hover:text-blue-900 bg-white'
                        }`}
                      >
                        <span className="text-[11px] font-medium text-slate-800 group-hover:text-blue-950 truncate select-none">
                          {w.label}
                        </span>
                        <div className="text-slate-600 group-hover:text-blue-700 shrink-0 ml-1">
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ۲. کشوی فیلدهای پیشرفته */}
            <div>
              <button
                onClick={() => toggleSection('advanced')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#2b5c8f] hover:bg-[#244f7c] text-white text-xs font-bold transition-colors select-none border-t border-[#1e446d]"
              >
                <span>فیلدهای پیشرفته</span>
                {openSections.advanced ? (
                  <ChevronDown className="w-4 h-4 text-blue-100" />
                ) : (
                  <ChevronLeft className="w-4 h-4 text-blue-100" />
                )}
              </button>

              {openSections.advanced && (
                <div className="grid grid-cols-2 border-b border-slate-200 bg-white">
                  {advancedFields.map((w, idx) => {
                    const Icon = w.icon;
                    const isDragging = draggingWidgetType === w.type;
                    const isEven = idx % 2 === 0;

                    return (
                      <div
                        key={w.type}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, w.type)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleSelect(w.type)}
                        title={w.description}
                        className={`group flex items-center justify-between px-3 py-2.5 border-b border-slate-200 cursor-grab active:cursor-grabbing text-xs transition-colors ${
                          isEven ? 'border-l border-slate-200' : ''
                        } ${
                          isDragging
                            ? 'opacity-30 bg-blue-50'
                            : 'hover:bg-blue-50/70 hover:text-blue-900 bg-white'
                        }`}
                      >
                        <span className="text-[11px] font-medium text-slate-800 group-hover:text-blue-950 truncate select-none">
                          {w.label}
                        </span>
                        <div className="text-slate-600 group-hover:text-blue-700 shrink-0 ml-1">
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ===================== تب ابزارک‌ها ===================== */}
        {activeTab === 'widgets' && (
          <div>
            
            {/* ۱. کشوی رسانه، اسناد و امضا */}
            <div>
              <button
                onClick={() => toggleSection('media')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#2b5c8f] hover:bg-[#244f7c] text-white text-xs font-bold transition-colors select-none"
              >
                <span>رسانه، اسناد و امضا</span>
                {openSections.media ? (
                  <ChevronDown className="w-4 h-4 text-blue-100" />
                ) : (
                  <ChevronLeft className="w-4 h-4 text-blue-100" />
                )}
              </button>

              {openSections.media && (
                <div className="grid grid-cols-2 border-b border-slate-200 bg-white">
                  {mediaWidgets.map((w, idx) => {
                    const Icon = w.icon;
                    const isDragging = draggingWidgetType === w.type;
                    const isEven = idx % 2 === 0;

                    return (
                      <div
                        key={w.type}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, w.type)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleSelect(w.type)}
                        title={w.description}
                        className={`group flex items-center justify-between px-3 py-2.5 border-b border-slate-200 cursor-grab active:cursor-grabbing text-xs transition-colors ${
                          isEven ? 'border-l border-slate-200' : ''
                        } ${
                          isDragging
                            ? 'opacity-30 bg-blue-50'
                            : 'hover:bg-blue-50/70 hover:text-blue-900 bg-white'
                        }`}
                      >
                        <span className="text-[11px] font-medium text-slate-800 group-hover:text-blue-950 truncate select-none">
                          {w.label}
                        </span>
                        <div className="text-slate-600 group-hover:text-blue-700 shrink-0 ml-1">
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ۲. کشوی ابزارهای تجاری، آزمون و پرداخت */}
            <div>
              <button
                onClick={() => toggleSection('business')}
                className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#2b5c8f] hover:bg-[#244f7c] text-white text-xs font-bold transition-colors select-none border-t border-[#1e446d]"
              >
                <span>ابزارهای تجاری و آزمون</span>
                {openSections.business ? (
                  <ChevronDown className="w-4 h-4 text-blue-100" />
                ) : (
                  <ChevronLeft className="w-4 h-4 text-blue-100" />
                )}
              </button>

              {openSections.business && (
                <div className="grid grid-cols-2 border-b border-slate-200 bg-white">
                  {businessWidgets.map((w, idx) => {
                    const Icon = w.icon;
                    const isDragging = draggingWidgetType === w.type;
                    const isEven = idx % 2 === 0;

                    return (
                      <div
                        key={w.type}
                        draggable={true}
                        onDragStart={(e) => handleDragStart(e, w.type)}
                        onDragEnd={handleDragEnd}
                        onClick={() => handleSelect(w.type)}
                        title={w.description}
                        className={`group flex items-center justify-between px-3 py-2.5 border-b border-slate-200 cursor-grab active:cursor-grabbing text-xs transition-colors ${
                          isEven ? 'border-l border-slate-200' : ''
                        } ${
                          isDragging
                            ? 'opacity-30 bg-blue-50'
                            : 'hover:bg-blue-50/70 hover:text-blue-900 bg-white'
                        }`}
                      >
                        <span className="text-[11px] font-medium text-slate-800 group-hover:text-blue-950 truncate select-none">
                          {w.label}
                        </span>
                        <div className="text-slate-600 group-hover:text-blue-700 shrink-0 ml-1">
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* راهنمای سریع و کاربردی در فوتر پالت */}
      <div className="px-3 py-2 border-t border-slate-200 bg-slate-50 text-[10px] text-slate-500 text-center shrink-0">
        <span>برای افزودن به فرم کلیک کنید یا به داخل بوم بکشید</span>
      </div>

    </div>
  );
};
