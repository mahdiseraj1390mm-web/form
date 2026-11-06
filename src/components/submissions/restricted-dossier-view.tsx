'use client';

import React, { useState } from 'react';
import { FormSubmission, Form, SubmissionStatus } from '@/types/form';
import { ClientDossierFullview, ClientCaseGroup } from './client-dossier-fullview';
import { 
  FolderOpen, 
  Lock, 
  Key, 
  Search, 
  ShieldAlert, 
  AlertCircle, 
  CheckCircle2, 
  Eye, 
  Phone, 
  MapPin, 
  FileText, 
  X,
  User,
  RotateCcw
} from 'lucide-react';
import { formatPersianDateTime, toPersianDigits } from '@/lib/persian';

interface RestrictedDossierViewProps {
  clientCases: ClientCaseGroup[];
  forms: Form[];
}

export const RestrictedDossierView: React.FC<RestrictedDossierViewProps> = ({
  clientCases,
  forms,
}) => {
  const [codeInput, setCodeInput] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [searchedCodeText, setSearchedCodeText] = useState('');
  const [foundCase, setFoundCase] = useState<ClientCaseGroup | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [activeDossierModal, setActiveDossierModal] = useState<ClientCaseGroup | null>(null);
  const [activeSubmissionModal, setActiveSubmissionModal] = useState<FormSubmission | null>(null);

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const raw = codeInput.trim();
    if (!raw) return;

    setIsSearching(true);
    setHasSearched(true);
    setSearchedCodeText(raw);

    // استانداردسازی ورودی کاربر به حروف بزرگ انگلیسی و تبدیل ارقام فارسی
    const clean = raw
      .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
      .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
      .trim()
      .toUpperCase();

    const strippedClean = clean.replace(/^(SP|SF|BH|CASE)-?/i, '');
    const cleanDigits = clean.replace(/[^0-9]/g, '');

    // ۱. جستجو در پرونده‌های بارگذاری‌شده محلی
    const matched = clientCases.find((c) => {
      const cCode = (c.caseCode || '').toUpperCase();
      const cStripped = cCode.replace(/^(SP|SF|BH|CASE)-?/i, '');
      const cMob = (c.mobile || '').replace(/[^0-9]/g, '');

      // تطابق دقیق کد پرونده
      if (cCode === clean) return true;
      // تطابق بخش عددی بدون پیشوند
      if (strippedClean.length >= 3 && cStripped === strippedClean) return true;
      // کد پرونده شامل این عبارت باشد
      if (cCode.includes(clean)) return true;
      // بررسی کد پیگیری سابمیشن‌ها
      const hasTrack = c.submissions.some((s) => {
        const tr = (s.trackingCode || '').toUpperCase();
        return tr === clean || (strippedClean.length >= 3 && tr.includes(strippedClean));
      });
      if (hasTrack) return true;
      // استعلام با شماره تلفن ۱۰ یا ۱۱ رقمی مراجع
      if (cleanDigits.length >= 10 && cMob.includes(cleanDigits.slice(-10))) return true;

      return false;
    });

    if (matched) {
      setFoundCase(matched);
      setIsSearching(false);
      return;
    }

    // ۲. استعلام از API سرور در صورتی که در سابمیشن‌های اولیه کلاینت موجود نبود
    try {
      let res = await fetch(`/api/cases?code=${encodeURIComponent(clean)}`);
      let json = await res.json();

      if (!json.found && cleanDigits.length >= 10) {
        res = await fetch(`/api/cases?mobile=${encodeURIComponent(cleanDigits)}`);
        json = await res.json();
      }

      if (json.found && json.caseRecord) {
        const rec = json.caseRecord;
        const cCode = rec.case_code || clean;
        const fullName = `${rec.first_name || ''} ${rec.last_name || ''}`.trim() || rec.data?.fullName || 'مراجع مرکز بالحق';
        const recMobile = rec.mobile || rec.data?.f_mobile || 'ثبت‌نشده';
        const recLocation = (rec.province && rec.city) ? `${rec.province} - ${rec.city}` : (rec.data?.f_province_city || 'ثبت‌نشده');

        const subItem: FormSubmission = {
          id: `case-${rec.id}`,
          formId: 'form-belhagh-registration',
          trackingCode: cCode,
          status: 'approved',
          createdAt: rec.created_at || new Date().toISOString(),
          comments: [],
          data: {
            ...rec.data,
            caseCode: cCode,
            fullName,
            f_name: rec.first_name || '',
            f_family: rec.last_name || '',
            f_mobile: recMobile,
            f_province_city: recLocation,
          },
        };

        const constructedCase: ClientCaseGroup = {
          caseCode: cCode,
          fullName,
          mobile: recMobile,
          provinceCity: recLocation,
          submissions: [subItem],
          formTitles: ['form-belhagh-registration'],
          totalFormsCount: 1,
          latestDate: rec.created_at || new Date().toISOString(),
          overallStatus: 'approved',
          totalPaidAmount: 0,
          roleInFamily: rec.data?.f_role_in_family || 'عضو خانواده',
        };

        setFoundCase(constructedCase);
      } else {
        setFoundCase(null);
      }
    } catch {
      setFoundCase(null);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResetSearch = () => {
    setHasSearched(false);
    setFoundCase(null);
    setCodeInput('');
    setSearchedCodeText('');
  };

  return (
    <div className="relative flex-1 flex flex-col h-full overflow-hidden bg-slate-50 overscroll-contain">
      
      {/* سربرگ اختصاصی پرونده مراجعین با دسترسی محدود */}
      <div className="bg-white border-b border-slate-200/90 px-6 py-4 flex flex-wrap items-center justify-between gap-4 shrink-0 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200/80 shrink-0 shadow-xs">
            <FolderOpen className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                کارتابل پرونده مراجعین
              </h1>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200/60 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-700" />
                <span>دسترسی اختصاصی: نیاز به کد پرونده</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              جهت حفظ محرمانگی و حریم خصوصی، مشاهده اطلاعات هر پرونده منوط به وارد کردن کد پرونده اختصاصی می‌باشد.
            </p>
          </div>
        </div>
      </div>

      {/* محتوای اصلی کارتابل */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
        
        {/* کادر استعلام کد پرونده */}
        <div className="max-w-2xl mx-auto bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Lock className="w-4 h-4 text-blue-600" />
            <h2 className="font-extrabold text-slate-900 text-sm">استعلام و مشاهده پرونده مراجع</h2>
          </div>

          <form onSubmit={handleSearch} className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              لطفاً کد پرونده مراجع را وارد فرمایید:
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Key className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
                <input
                  type="text"
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="کد پرونده (مثال: SP968172 یا SP328786)..."
                  dir="ltr"
                  autoFocus
                  className="w-full pr-9 pl-3 py-2.5 text-xs font-mono border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-100 text-left"
                />
              </div>
              <button
                type="submit"
                disabled={isSearching || !codeInput.trim()}
                className="px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-sm hover:from-blue-700 hover:to-indigo-700 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Search className="w-4 h-4" />
                <span>{isSearching ? 'در حال استعلام...' : 'مشاهده پرونده'}</span>
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              کد پرونده را می‌توانید با یا بدون پیشوند وارد کنید.
            </p>
          </form>
        </div>

        {/* حالت ۱: کدی هنوز جستجو نشده است (هیچ پرونده‌ای نمایش داده نمی‌شود) */}
        {!hasSearched && (
          <div className="max-w-2xl mx-auto p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col items-center animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4 ring-8 ring-amber-500/5">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <h3 className="text-base font-extrabold text-slate-800">هیچ پرونده‌ای قابل مشاهده نیست</h3>
            <p className="text-xs text-slate-500 max-w-md mt-2 leading-relaxed">
              بر اساس تنظیمات حساب کاربری شما، مشاهده لیست کامل مراجعین امکان‌پذیر نمی‌باشد. جهت مشاهده سوابق، فرم‌ها و نوبت‌های هر مراجع، لطفاً کد پرونده اختصاصی او را در کادر بالا وارد کرده و دکمه «مشاهده پرونده» را بزنید.
            </p>
          </div>
        )}

        {/* حالت ۲: کد استعلام شده ولی در سیستم پیدا نشد */}
        {hasSearched && !isSearching && !foundCase && (
          <div className="max-w-2xl mx-auto p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col items-center animate-in fade-in duration-200">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4 ring-8 ring-rose-500/5">
              <AlertCircle className="w-8 h-8" />
            </div>
            <h3 className="text-base font-extrabold text-slate-800">پرونده‌ای با این کد یافت نشد</h3>
            <p className="text-xs text-slate-500 max-w-md mt-2 leading-relaxed">
              هیچ پرونده‌ای با کد «{searchedCodeText}» در پایگاه‌داده سامانه ثبت نشده است. لطفاً از صحت شماره پرونده مراجع اطمینان حاصل فرمایید.
            </p>
            <button
              onClick={handleResetSearch}
              className="mt-5 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>تلاش مجدد و استعلام کد دیگر</span>
            </button>
          </div>
        )}

        {/* حالت ۳: پرونده با موفقیت یافت شده و نمایش داده می‌شود */}
        {hasSearched && foundCase && (
          <div className="max-w-4xl mx-auto space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>پرونده مراجع با کد «{foundCase.caseCode}» با موفقیت فراخوانی شد.</span>
              </div>
              <button
                onClick={handleResetSearch}
                className="px-3 py-1.5 bg-white border border-emerald-300 text-emerald-800 rounded-lg text-xs font-bold hover:bg-emerald-100/50 transition cursor-pointer flex items-center gap-1"
              >
                <Search className="w-3.5 h-3.5" />
                <span>استعلام پرونده دیگر</span>
              </button>
            </div>

            {/* کارت جامع پرونده پیدا شده */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-start gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 text-blue-700 font-extrabold flex items-center justify-center text-base shadow-2xs">
                    {foundCase.fullName ? foundCase.fullName.slice(0, 2) : 'مر'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-extrabold text-slate-900">{foundCase.fullName}</h3>
                      <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
                        {foundCase.caseCode}
                      </span>
                      {foundCase.roleInFamily && (
                        <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 border border-slate-200">
                          {foundCase.roleInFamily}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-1.5 flex-wrap">
                      <span className="flex items-center gap-1 font-mono font-semibold text-slate-700">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        {foundCase.mobile}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {foundCase.provinceCity}
                      </span>
                      <span>•</span>
                      <span>{toPersianDigits(foundCase.submissions.length)} فرم تکمیل‌شده</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveDossierModal(foundCase)}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-sm hover:from-blue-700 hover:to-indigo-700 transition flex items-center gap-1.5 self-start sm:self-center cursor-pointer"
                >
                  <Eye className="w-4 h-4" />
                  <span>مشاهده پرونده کامل و چاپ کارنامه</span>
                </button>
              </div>

              {/* فرم‌های ثبت‌شده مراجع */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-700">فرم‌ها و پرسشنامه‌های تکمیل‌شده در این پرونده:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {foundCase.submissions.map((sub, idx) => {
                    const formObj = forms.find((f) => f.id === sub.formId);
                    return (
                      <div
                        key={sub.id || idx}
                        className="p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80 space-y-2 hover:border-slate-300 transition"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-slate-900">
                            {formObj?.title || sub.formId}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white text-slate-600 border border-slate-200">
                            {sub.trackingCode}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-200/60">
                          <span>تاریخ ثبت: {formatPersianDateTime(sub.createdAt)}</span>
                          <button
                            onClick={() => setActiveSubmissionModal(sub)}
                            className="text-blue-600 hover:text-blue-800 font-bold cursor-pointer"
                          >
                            مشاهده پاسخ‌ها
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* مودال مشاهده جزئیات کامل پرونده */}
      {activeDossierModal && (
        <ClientDossierFullview
          clientCase={activeDossierModal}
          onClose={() => setActiveDossierModal(null)}
          onStatusChange={(newStatus) => {
            setActiveDossierModal((prev) => (prev ? { ...prev, overallStatus: newStatus } : null));
          }}
        />
      )}

      {/* مودال مشاهده رکورد تکی پاسخ‌های فرم */}
      {activeSubmissionModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 space-y-5 border border-slate-200 shadow-2xl text-right">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-sky-600" />
                <h3 className="text-base font-extrabold text-slate-900">
                  جزئیات فرم: {activeSubmissionModal.trackingCode}
                </h3>
              </div>
              <button
                onClick={() => setActiveSubmissionModal(null)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-3 overscroll-contain">
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(activeSubmissionModal.data).map(([k, v]) => (
                  <div key={k} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-slate-400 block mb-0.5">{k}:</span>
                    <span className="font-bold text-slate-800">{String(v)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setActiveSubmissionModal(null)}
                className="px-5 py-2 bg-slate-900 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                بستن
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
