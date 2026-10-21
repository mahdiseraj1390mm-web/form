'use client';

import React, { useState } from 'react';
import { Form, FormShareSettings } from '@/types/form';
import { 
  Link as LinkIcon, 
  Code, 
  Globe, 
  Copy, 
  Check, 
  Plus, 
  Trash2, 
  Share2, 
  QrCode as QrCodeIcon,
  Download,
  ExternalLink,
  Edit2
} from 'lucide-react';

interface ShareTabProps {
  form: Form;
  onUpdateForm: (updated: Partial<Form>) => void;
}

export const ShareTab: React.FC<ShareTabProps> = ({ form, onUpdateForm }) => {
  const [activeSubTab, setActiveSubTab] = useState<'link' | 'embed' | 'wordpress' | 'joomla'>('link');
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [isEditingSlug, setIsEditingSlug] = useState(false);
  const [customSlug, setCustomSlug] = useState(form.slug || 'form-101');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // تنظیمات اشتراک‌گذاری
  const shareSettings: FormShareSettings = form.shareSettings || {
    shareMode: 'public',
    allowedDomains: ['https://example.com'],
    customSubdomain: '',
  };

  const updateShare = (props: Partial<FormShareSettings>) => {
    onUpdateForm({
      shareSettings: {
        ...shareSettings,
        ...props,
      },
    });
  };

  const formUrl = `https://formafzar.com/form/${form.slug || 'career-application'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(formUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSaveSlug = () => {
    onUpdateForm({ slug: customSlug.trim() });
    setIsEditingSlug(false);
  };

  const handleAddDomain = () => {
    const current = shareSettings.allowedDomains || [];
    updateShare({ allowedDomains: [...current, 'https://'] });
  };

  const handleUpdateDomain = (index: number, val: string) => {
    const current = [...(shareSettings.allowedDomains || [])];
    current[index] = val;
    updateShare({ allowedDomains: current });
  };

  const handleRemoveDomain = (index: number) => {
    const current = [...(shareSettings.allowedDomains || [])];
    current.splice(index, 1);
    updateShare({ allowedDomains: current });
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const embedIframeCode = `<iframe src="${formUrl}" width="100%" height="700" frameborder="0" style="border:none; overflow:hidden;" allow="geolocation; microphone; camera"></iframe>`;
  const wpShortcode = `[formafzar id="${form.id}" slug="${form.slug}"]`;

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-slate-50 select-none">
      
      {/* محتوای اشتراک‌گذاری (سمت چپ در RTL) */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 order-2 md:order-1">
        <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-6">
          
          {/* تب لینک فرم (تصاویر ۴ و ۵ فرم‌افزار) */}
          {activeSubTab === 'link' && (
            <div className="space-y-6">
              
              <div className="border-b border-slate-100 pb-3">
                <h3 className="text-sm font-bold text-slate-800">لینک فرم</h3>
              </div>

              {/* گزینه‌های رادیویی نحوه انتشار مطابق تصویر ۴ و ۵ فرم‌افزار */}
              <div className="space-y-2 border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="shareMode"
                    checked={shareSettings.shareMode === 'public'}
                    onChange={() => updateShare({ shareMode: 'public' })}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    دریافت لینک انتشار فرم (ایجاد لینک فرم)
                  </span>
                </label>

                <label className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="shareMode"
                    checked={shareSettings.shareMode === 'domainRestricted'}
                    onChange={() => updateShare({ shareMode: 'domainRestricted' })}
                    className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-bold text-slate-800">
                    انتشار فرم فقط در سایت مشخص شده
                  </span>
                </label>
              </div>

              {/* حالت ۱: لینک عمومی فرم و کیوآرکد و شبکه‌های اجتماعی (مطابق تصویر ۴) */}
              {shareSettings.shareMode === 'public' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  
                  {/* لینک کوتاه فرم */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">لینک کوتاه فرم</label>
                    <div className="flex items-center border border-slate-300 rounded-xl overflow-hidden shadow-2xs bg-white">
                      <button
                        type="button"
                        onClick={handleCopyLink}
                        className="px-4 py-2.5 bg-slate-700 hover:bg-slate-800 active:bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer shrink-0"
                      >
                        {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedLink ? 'کپی شد!' : 'کپی'}</span>
                      </button>

                      {isEditingSlug ? (
                        <div className="flex-1 flex items-center px-3 gap-2">
                          <input
                            type="text"
                            value={customSlug}
                            onChange={(e) => setCustomSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ''))}
                            className="flex-1 text-xs font-mono text-left py-1 outline-none"
                            placeholder="نام-مستعار-فرم"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={handleSaveSlug}
                            className="px-2 py-1 bg-emerald-600 text-white text-[11px] font-bold rounded"
                          >
                            تایید
                          </button>
                        </div>
                      ) : (
                        <div className="flex-1 px-3 py-2 text-xs font-mono text-blue-600 text-left overflow-x-auto select-all">
                          {formUrl}
                        </div>
                      )}

                      {!isEditingSlug && (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomSlug(form.slug || '');
                            setIsEditingSlug(true);
                          }}
                          className="px-3 py-2 text-slate-500 hover:text-slate-800 text-xs font-bold transition-colors"
                        >
                          تغییر
                        </button>
                      )}
                    </div>
                  </div>

                  {/* زیر دامنه اختصاصی */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1.5">زیر دامنه اختصاصی</label>
                    <div className="flex items-center border border-slate-300 rounded-xl px-3 py-2 bg-white">
                      <input
                        type="text"
                        placeholder="ایجاد زیر دامنه اختصاصی (مثال: company)"
                        value={shareSettings.customSubdomain || ''}
                        onChange={(e) => updateShare({ customSubdomain: e.target.value })}
                        className="flex-1 text-xs text-left font-mono outline-none"
                      />
                      <span className="text-xs text-slate-400 font-mono">.formafzar.com</span>
                    </div>
                  </div>

                  {/* کیوآرکد (QR Code) با استایل دقیق فرم‌افزار */}
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-2">کیوآرکد (QR Code)</label>
                    <div className="flex flex-col sm:flex-row items-center gap-4 p-4 border border-slate-200 rounded-xl bg-slate-50/40">
                      <div className="p-2 bg-white border border-slate-300 rounded-xl shadow-xs shrink-0">
                        {/* تولید بارکد QR تصویری با API استاندارد */}
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(formUrl)}`}
                          alt="QR Code فرم"
                          className="w-32 h-32 rounded"
                        />
                      </div>
                      <div className="space-y-2 text-center sm:text-right">
                        <span className="text-xs font-bold text-slate-800 block">بارکد سریع جهت اسکن با دوربین موبایل</span>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          مراجعین شما می‌توانند با اسکن این کیوآرکد توسط دوربین گوشی خود بدون نیاز به تایپ لینک، مستقیماً فرم را باز و تکمیل نمایند.
                        </p>
                        <a
                          href={`https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(formUrl)}`}
                          download="form-qrcode.png"
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-lg shadow-2xs transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>دانلود فایل تصویر بارکد</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* اشتراک در شبکه‌های مجازی مطابق ردیف پایین تصویر ۴ فرم‌افزار */}
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-2">اشتراک در شبکه‌های مجازی</label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {[
                        { name: 'Instagram', bg: 'bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600', icon: '📷' },
                        { name: 'Telegram', bg: 'bg-sky-500', icon: '✈️' },
                        { name: 'LinkedIn', bg: 'bg-blue-700', icon: '💼' },
                        { name: 'Twitter', bg: 'bg-slate-800', icon: '✖' },
                        { name: 'Facebook', bg: 'bg-blue-600', icon: 'f' },
                        { name: 'Eitaa', bg: 'bg-orange-500', icon: 'ایتا' },
                        { name: 'Bale', bg: 'bg-emerald-600', icon: 'بله' },
                      ].map((item) => (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => alert(`ارسال لینک فرم در ${item.name}`)}
                          className={`w-9 h-9 rounded-lg ${item.bg} text-white font-bold text-xs flex items-center justify-center shadow-2xs hover:opacity-90 active:scale-95 transition-all cursor-pointer`}
                          title={`اشتراک‌گذاری در ${item.name}`}
                        >
                          {item.icon}
                        </button>
                      ))}
                    </div>
                  </div>

                </div>
              )}

              {/* حالت ۲: انتشار فرم فقط در سایت مشخص شده (دقیقاً مطابق تصویر ۵ فرم‌افزار) */}
              {shareSettings.shareMode === 'domainRestricted' && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  <p className="text-xs text-slate-600 leading-relaxed">
                    نمایش فرم از طریق «قرار دادن کد» و «ماژول وردپرس و جوملا» فقط در سایت‌های زیر امکان‌پذیر است:
                  </p>

                  <div className="space-y-2">
                    {(shareSettings.allowedDomains || ['https://example.com']).map((domain, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleRemoveDomain(index)}
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
                        >
                          حذف
                        </button>
                        <input
                          type="text"
                          value={domain}
                          onChange={(e) => handleUpdateDomain(index, e.target.value)}
                          placeholder="https://mysite.ir"
                          className="flex-1 px-3 py-2 text-xs border border-slate-300 rounded-lg font-mono text-left bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3">
                    <button
                      type="button"
                      onClick={handleAddDomain}
                      className="px-4 py-2 bg-slate-600 hover:bg-slate-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>افزودن</span>
                    </button>

                    <div className="flex items-center gap-3">
                      {savedSuccess && (
                        <span className="text-xs text-emerald-600 font-bold flex items-center gap-1 animate-in fade-in">
                          <Check className="w-3.5 h-3.5" />
                          ذخیره شد
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={handleSave}
                        className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition-colors cursor-pointer"
                      >
                        ذخیره
                      </button>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* تب قراردادن کد (Embed) */}
          {activeSubTab === 'embed' && (
            <div className="space-y-5">
              <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
                قراردادن کد در صفحات وب (iFrame & Script)
              </h3>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">کد iFrame برای درج در وب‌سایت</label>
                <textarea
                  rows={4}
                  readOnly
                  value={embedIframeCode}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl bg-slate-50 font-mono text-left"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(embedIframeCode);
                  setCopiedCode(true);
                  setTimeout(() => setCopiedCode(false), 2000);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 cursor-pointer"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? 'کد کپی شد!' : 'کپی کد iFrame'}</span>
              </button>
            </div>
          )}

          {/* تب وردپرس */}
          {activeSubTab === 'wordpress' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
                افزونه و شورت‌کد وردپرس
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                شورت‌کد زیر را کپی کرده و در هر برگه، نوشته یا ویجت المنتور در سایت وردپرسی خود قرار دهید:
              </p>
              <div className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <code className="text-xs font-mono text-blue-700 flex-1">{wpShortcode}</code>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(wpShortcode);
                    alert('شورت‌کد وردپرس کپی شد.');
                  }}
                  className="px-3 py-1.5 bg-slate-800 text-white text-xs font-bold rounded-lg cursor-pointer"
                >
                  کپی
                </button>
              </div>
            </div>
          )}

          {/* تب جوملا */}
          {activeSubTab === 'joomla' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-800 pb-2 border-b border-slate-100">
                ماژول جوملا
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                شناسه فرم شما <span className="font-mono font-bold text-blue-700">{form.slug || form.id}</span> است. آن را در تنظیمات ماژول فرم‌افزار جوملا وارد نمایید.
              </p>
            </div>
          )}

        </div>
      </div>

      {/* سایدبار ناوبری زیرمنوی اشتراک‌گذاری (سمت راست - مطابق تصویر ۴ و ۵ فرم‌افزار) */}
      <div className="w-full md:w-60 bg-white border-l border-slate-200 shrink-0 p-3 overflow-y-auto order-1 md:order-2 shadow-xs">
        <div className="space-y-1">
          {[
            { id: 'link', label: 'لینک فرم', icon: LinkIcon },
            { id: 'embed', label: 'قراردادن کد', icon: Code },
            { id: 'wordpress', label: 'وردپرس', icon: Globe },
            { id: 'joomla', label: 'جوملا', icon: Globe },
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeSubTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSubTab(item.id as any)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all text-right cursor-pointer ${
                  isActive
                    ? 'bg-slate-50 text-slate-900 border-r-4 border-emerald-600 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
};
