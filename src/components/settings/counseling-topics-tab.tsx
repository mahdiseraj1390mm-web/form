'use client';

import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Search,
  Check,
  X,
  AlertCircle,
  Users,
  Tag,
  FileText,
  RotateCcw,
  CheckCircle2,
  HelpCircle,
  Copy,
  FolderPlus,
  Sliders,
  Layers,
  Info
} from 'lucide-react';
import { useForm } from '@/context/form-context';
import { CounselingTopicOption } from '@/lib/consultant-helpers';
import { toPersianDigits } from '@/lib/persian';
import { ConsultantAvatar } from '@/components/consultants/consultant-avatar';

export const CounselingTopicsTab: React.FC = () => {
  const { counselingTopics, addCounselingTopic, updateCounselingTopic, deleteCounselingTopic, resetCounselingTopics, teamMembers } = useForm();

  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<CounselingTopicOption | null>(null);

  // فرم موضوع جدید یا ویرایش
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    keywordsInput: '',
    keywords: [] as string[],
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // پاکسازی پیام موفقیت
  const triggerSuccess = (msg: string) => {
    setActionSuccessMessage(msg);
    setTimeout(() => setActionSuccessMessage(null), 3500);
  };

  // مشاوران اختصاص داده شده به هر موضوع
  const topicConsultantsMap = useMemo(() => {
    const map: Record<string, typeof teamMembers> = {};
    counselingTopics.forEach((topic) => {
      map[topic.id] = teamMembers.filter((m) => {
        if (!m.allowedTopics || !Array.isArray(m.allowedTopics)) return false;
        return (
          m.allowedTopics.includes(topic.id) ||
          m.allowedTopics.includes(topic.name) ||
          (topic.keywords && topic.keywords.some((kw) => m.allowedTopics?.includes(kw)))
        );
      });
    });
    return map;
  }, [counselingTopics, teamMembers]);

  // فیلتر موضوعات
  const filteredTopics = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return counselingTopics;
    return counselingTopics.filter((t) => {
      const matchName = t.name.toLowerCase().includes(q);
      const matchDesc = (t.description || '').toLowerCase().includes(q);
      const matchId = t.id.toLowerCase().includes(q);
      const matchKeywords = Array.isArray(t.keywords) && t.keywords.some((k) => k.toLowerCase().includes(q));
      return matchName || matchDesc || matchId || matchKeywords;
    });
  }, [counselingTopics, searchQuery]);

  // باز کردن مودال افزودن
  const handleOpenAddModal = () => {
    setEditingTopic(null);
    setFormData({
      id: '',
      name: '',
      description: '',
      keywordsInput: '',
      keywords: [],
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // باز کردن مودال ویرایش
  const handleOpenEditModal = (topic: CounselingTopicOption) => {
    setEditingTopic(topic);
    setFormData({
      id: topic.id,
      name: topic.name,
      description: topic.description || '',
      keywordsInput: '',
      keywords: topic.keywords || [],
    });
    setFormErrors({});
    setIsModalOpen(true);
  };

  // افزودن کلمه کلیدی با اینتر یا دکمه
  const handleAddKeyword = () => {
    const kw = formData.keywordsInput.trim().replace(/^#/, '');
    if (!kw) return;
    if (!formData.keywords.includes(kw)) {
      setFormData((prev) => ({
        ...prev,
        keywords: [...prev.keywords, kw],
        keywordsInput: '',
      }));
    } else {
      setFormData((prev) => ({ ...prev, keywordsInput: '' }));
    }
  };

  // حذف کلمه کلیدی
  const handleRemoveKeyword = (kwToRemove: string) => {
    setFormData((prev) => ({
      ...prev,
      keywords: prev.keywords.filter((k) => k !== kwToRemove),
    }));
  };

  // ذخیره فرم
  const handleSaveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!formData.name.trim()) {
      errors.name = 'عنوان موضوع مشاوره الزامی است.';
    }

    if (!editingTopic) {
      // بررسی تکراری نبودن عنوان
      const duplicateName = counselingTopics.find(
        (t) => t.name.trim().toLowerCase() === formData.name.trim().toLowerCase()
      );
      if (duplicateName) {
        errors.name = 'موضوعی با این عنوان قبلاً ثبت شده است.';
      }

      // بررسی شناسه انگلیسی
      if (formData.id.trim()) {
        const cleanId = formData.id.trim().toLowerCase().replace(/\s+/g, '_');
        const duplicateId = counselingTopics.find((t) => t.id === cleanId);
        if (duplicateId) {
          errors.id = 'این شناسه انگلیسی قبلاً استفاده شده است.';
        }
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    // اضافه کردن آخرین کلمه کلیدی اگر در ورودی مانده باشد
    let finalKeywords = [...formData.keywords];
    if (formData.keywordsInput.trim()) {
      const remaining = formData.keywordsInput.trim().replace(/^#/, '');
      if (!finalKeywords.includes(remaining)) {
        finalKeywords.push(remaining);
      }
    }

    if (editingTopic) {
      // ویرایش موضوع موجود
      await updateCounselingTopic(editingTopic.id, {
        name: formData.name.trim(),
        description: formData.description.trim(),
        keywords: finalKeywords,
      });
      triggerSuccess(`موضوع «${formData.name.trim()}» با موفقیت ویرایش شد.`);
    } else {
      // افزودن موضوع جدید
      await addCounselingTopic({
        id: formData.id.trim() || undefined,
        name: formData.name.trim(),
        description: formData.description.trim(),
        keywords: finalKeywords,
      });
      triggerSuccess(`موضوع جدید «${formData.name.trim()}» با موفقیت افزوده شد.`);
    }

    setIsModalOpen(false);
  };

  // تایید و اجرای حذف موضوع
  const handleConfirmDelete = async (id: string) => {
    const topicToDelete = counselingTopics.find((t) => t.id === id);
    await deleteCounselingTopic(id);
    setDeleteConfirmId(null);
    triggerSuccess(`موضوع «${topicToDelete?.name || id}» با موفقیت حذف گردید.`);
  };

  // بازنشانی به موضوعات پیش‌فرض
  const handleResetDefaults = async () => {
    if (window.confirm('آیا مطمئن هستید که می‌خواهید موضوعات مشاوره را به گزینه‌های پیش‌فرض سامانه بازنشانی کنید؟')) {
      await resetCounselingTopics();
      triggerSuccess('موضوعات مشاوره به تنظیمات پیش‌فرض سامانه بازنشانی شدند.');
    }
  };

  // کپی شناسه
  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* سربرگ بخش و آمار کلی */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 bg-gradient-to-r from-indigo-50/70 via-purple-50/40 to-slate-50 border border-indigo-100 rounded-2xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              مدیریت موضوعات و حوزه‌های تخصصی مشاوره
            </h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              موضوعات قابل ارائه توسط مشاوران در این بخش تعریف، ویرایش و حذف می‌شوند. مشاوران در اکانت خود <strong>صرفاً می‌توانند</strong> از میان این موضوعات فعال انتخاب کنند.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-3 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
            title="بازنشانی به ۵ موضوع پیش‌فرض اولیه"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">بازنشانی پیش‌فرض</span>
          </button>

          <button
            type="button"
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/20"
          >
            <Plus className="w-4 h-4" />
            <span>افزودن موضوع جدید</span>
          </button>
        </div>
      </div>

      {/* پیام بازخورد عملیات */}
      {actionSuccessMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-bold">{actionSuccessMessage}</span>
        </div>
      )}

      {/* کارت‌های آماری سریع */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
          <span className="text-[11px] text-slate-500 font-medium">کل موضوعات تخصصی</span>
          <div className="text-xl font-bold text-slate-900 mt-0.5">
            {toPersianDigits(counselingTopics.length)} <span className="text-xs font-normal text-slate-500">حوزه</span>
          </div>
        </div>

        <div className="p-3 bg-indigo-50/60 border border-indigo-200/80 rounded-xl shadow-2xs">
          <span className="text-[11px] text-indigo-700 font-medium">مشاوران با موضوع فعال</span>
          <div className="text-xl font-bold text-indigo-900 mt-0.5">
            {toPersianDigits(
              teamMembers.filter((m) => Array.isArray(m.allowedTopics) && m.allowedTopics.length > 0).length
            )}{' '}
            <span className="text-xs font-normal text-indigo-600">مشاور</span>
          </div>
        </div>

        <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl shadow-2xs">
          <span className="text-[11px] text-emerald-700 font-medium">موضوعات پیش‌فرض اصلی</span>
          <div className="text-xl font-bold text-emerald-900 mt-0.5">
            {toPersianDigits(counselingTopics.filter((t) => t.isDefault).length || 5)}{' '}
            <span className="text-xs font-normal text-emerald-600">موضوع</span>
          </div>
        </div>

        <div className="p-3 bg-purple-50/60 border border-purple-200/80 rounded-xl shadow-2xs">
          <span className="text-[11px] text-purple-700 font-medium">موضوعات سفارشی افزوده</span>
          <div className="text-xl font-bold text-purple-900 mt-0.5">
            {toPersianDigits(counselingTopics.filter((t) => !t.isDefault).length)}{' '}
            <span className="text-xs font-normal text-purple-600">مورد</span>
          </div>
        </div>
      </div>

      {/* نوار جستجو و فیلتر */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="جستجو در نام موضوع، کلمات کلیدی، توضیحات یا کد انگلیسی..."
            className="w-full pr-9 pl-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>
        <span className="text-[11px] text-slate-500 shrink-0 font-medium">
          {toPersianDigits(filteredTopics.length)} موضوع یافت شد
        </span>
      </div>

      {/* راهنمای سریع به کاربر */}
      <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed">
          <strong>نکته مهم:</strong> هر موضوعی که در این صفحه اضافه یا ویرایش شود، به صورت لحظه‌ای در فرم تعریف و ویرایش مشاوران ظاهر می‌شود. مشاوران در صفحه خود دسترسی به افزودن دستی ندارند و فقط مجاز به فعال یا غیرفعال‌سازی هر موضوع برای خود خواهند بود.
        </div>
      </div>

      {/* لیست موضوعات در قالب کارت‌های تفکیک‌شده */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredTopics.map((topic) => {
          const consultants = topicConsultantsMap[topic.id] || [];
          const isDeleting = deleteConfirmId === topic.id;

          return (
            <div
              key={topic.id}
              className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-indigo-200 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-3">
                {/* سربرگ کارت */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-sm shrink-0">
                      <Tag className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-extrabold text-slate-900 text-sm">
                          {topic.name}
                        </h3>
                        {topic.isDefault && (
                          <span className="text-[9px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded border border-slate-200">
                            پایه‌ای
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-50 px-1.5 py-0.2 rounded border border-slate-100">
                          id: {topic.id}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleCopyId(topic.id)}
                          className="text-slate-400 hover:text-indigo-600 transition p-0.5 cursor-pointer"
                          title="کپی شناسه انگلیسی"
                        >
                          {copiedId === topic.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* دکمه‌های عملیات */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(topic)}
                      className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                      title="ویرایش موضوع"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(topic.id)}
                      className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="حذف موضوع"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* توضیحات موضوع */}
                <p className="text-xs text-slate-600 leading-relaxed min-h-[32px]">
                  {topic.description || 'بدون توضیحات ثبت‌شده'}
                </p>

                {/* کلمات کلیدی */}
                {Array.isArray(topic.keywords) && topic.keywords.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-slate-100">
                    <span className="text-[10px] text-slate-400 font-medium">کلمات کلیدی:</span>
                    {topic.keywords.map((kw, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                      >
                        #{kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* بخش پایین: مشاوران ارائه دهنده این موضوع */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="text-[11px] text-slate-500 font-medium">
                    {consultants.length > 0 ? (
                      <>
                        <strong className="text-slate-800 font-bold">{toPersianDigits(consultants.length)}</strong> مشاور این موضوع را پوشش می‌دهند
                      </>
                    ) : (
                      <span className="text-slate-400">هنوز به مشاوری اختصاص داده نشده</span>
                    )}
                  </span>
                </div>

                {/* آواتارهای فشرده مشاوران */}
                {consultants.length > 0 && (
                  <div className="flex items-center -space-x-2 -space-x-reverse overflow-hidden">
                    {consultants.slice(0, 4).map((c) => (
                      <div
                        key={c.id}
                        title={`${c.genderPrefix ? c.genderPrefix + ' ' : ''}${c.name}`}
                        className="ring-2 ring-white rounded-full"
                      >
                        <ConsultantAvatar
                          name={c.name}
                          avatarUrl={c.avatarUrl}
                          genderPrefix={c.genderPrefix}
                          size="xs"
                        />
                      </div>
                    ))}
                    {consultants.length > 4 && (
                      <div className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white flex items-center justify-center text-[9px] font-bold text-slate-600">
                        +{toPersianDigits(consultants.length - 4)}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* هشدار مدال تایید حذف در داخل کارت */}
              {isDeleting && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-2 animate-in fade-in">
                  <div className="flex items-start gap-2 text-rose-800 text-xs">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">آیا از حذف موضوع «{topic.name}» مطمئن هستید؟</p>
                      {consultants.length > 0 && (
                        <p className="text-[10px] text-rose-600 mt-1">
                          توجه: این موضوع در حال حاضر در برنامه کاری <strong>{toPersianDigits(consultants.length)} مشاور</strong> فعال است.
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(null)}
                      className="px-3 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-lg hover:bg-slate-50 cursor-pointer"
                    >
                      انصراف
                    </button>
                    <button
                      type="button"
                      onClick={() => handleConfirmDelete(topic.id)}
                      className="px-3 py-1 bg-rose-600 text-white text-xs font-bold rounded-lg hover:bg-rose-700 cursor-pointer"
                    >
                      حذف قطعی
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {filteredTopics.length === 0 && (
          <div className="col-span-full p-8 text-center bg-white border border-slate-200 border-dashed rounded-2xl space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h4 className="font-bold text-slate-800 text-sm">موضوعی یافت نشد</h4>
              <p className="text-xs text-slate-500">
                با عبارت جستجوی وارد شده موضوعی تطبیق پیدا نکرد یا هنوز موضوعی تعریف نکرده‌اید.
              </p>
            </div>
            <button
              type="button"
              onClick={handleOpenAddModal}
              className="px-4 py-2 bg-indigo-600 text-white font-bold text-xs rounded-xl hover:bg-indigo-700 cursor-pointer"
            >
              افزودن موضوع جدید
            </button>
          </div>
        )}
      </div>

      {/* مدال افزودن یا ویرایش موضوع */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden space-y-4">
            {/* سربرگ مدال */}
            <div className="flex items-center justify-between p-4 bg-slate-50 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                  {editingTopic ? <Edit2 className="w-4 h-4" /> : <FolderPlus className="w-4 h-4" />}
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {editingTopic ? `ویرایش موضوع: ${editingTopic.name}` : 'افزودن موضوع تخصصی جدید'}
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    {editingTopic
                      ? 'اطلاعات و کلمات کلیدی این موضوع را ویرایش نمایید.'
                      : 'عنوان، توضیحات و کلمات کلیدی موضوع را مشخص کنید.'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* بدنه فرم */}
            <form onSubmit={handleSaveTopic} className="p-5 space-y-4 text-xs">
              {/* نام موضوع */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  عنوان حوزه مشاوره <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                  }}
                  placeholder="مثال: مشاوره پیش از ازدواج، روان‌پزشکی، بازی‌درمانی..."
                  className={`w-full px-3 py-2 border rounded-xl bg-white text-xs focus:outline-none focus:ring-2 ${
                    formErrors.name
                      ? 'border-rose-400 focus:ring-rose-200'
                      : 'border-slate-300 focus:ring-indigo-200'
                  }`}
                />
                {formErrors.name && (
                  <p className="text-[10px] text-rose-500 mt-1 font-semibold">{formErrors.name}</p>
                )}
              </div>

              {/* شناسه انگلیسی (فقط هنگام افزودن) */}
              {!editingTopic ? (
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    شناسه سیستمی (انگلیسی / اختیاری)
                  </label>
                  <input
                    type="text"
                    value={formData.id}
                    onChange={(e) => {
                      setFormData({ ...formData, id: e.target.value });
                      if (formErrors.id) setFormErrors({ ...formErrors, id: '' });
                    }}
                    placeholder="مثال: premarital, psychiatry (در صورت خالی بودن خودکار ایجاد می‌شود)"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs font-mono text-left focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                  {formErrors.id && (
                    <p className="text-[10px] text-rose-500 mt-1 font-semibold">{formErrors.id}</p>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1">
                    برای تفکیک ساعات کاری و لینک‌های وب‌هوک استفاده می‌شود.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-500 mb-1">شناسه سیستمی (غیرقابل تغییر)</label>
                  <input
                    type="text"
                    readOnly
                    disabled
                    value={formData.id}
                    className="w-full px-3 py-2 border border-slate-200 bg-slate-100 rounded-xl text-xs font-mono text-slate-500 text-left"
                  />
                </div>
              )}

              {/* توضیحات */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  توضیحات کوتاه حوزه تخصصی
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="توضیحاتی که مراجعین یا مشاوران در فرم‌ها مشاهده خواهند کرد..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-200 leading-relaxed"
                />
              </div>

              {/* کلمات کلیدی */}
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  کلمات کلیدی برای تطبیق هوشمند
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.keywordsInput}
                    onChange={(e) => setFormData({ ...formData, keywordsInput: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddKeyword();
                      }
                    }}
                    placeholder="یک کلمه بنویسید و اینتر یا دکمه + را بزنید..."
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-xl bg-white text-xs focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  />
                  <button
                    type="button"
                    onClick={handleAddKeyword}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition cursor-pointer shrink-0"
                  >
                    + افزودن
                  </button>
                </div>

                {formData.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {formData.keywords.map((kw) => (
                      <span
                        key={kw}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-lg text-xs font-semibold"
                      >
                        <span>#{kw}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveKeyword(kw)}
                          className="text-slate-400 hover:text-rose-500 cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-slate-400 mt-1">
                  برای تطبیق هوشمند مراجعان بر اساس علائم و نیازهای فرم رزرو به کار می‌رود.
                </p>
              </div>

              {/* دکمه‌های پایانی فرم */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 font-bold rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl transition cursor-pointer shadow-sm shadow-indigo-600/20"
                >
                  {editingTopic ? 'ذخیره تغییرات موضوع' : 'افزودن و ثبت موضوع'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
