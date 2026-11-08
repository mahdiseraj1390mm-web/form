'use client';

import React, { useState } from 'react';
import { 
  Building2, 
  Smartphone, 
  CreditCard, 
  Key, 
  ShieldCheck, 
  Check, 
  Copy, 
  Users, 
  Webhook, 
  Globe,
  UserPlus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Power,
  Calendar,
  FileText,
  Sliders,
  CheckCircle2,
  XCircle,
  Phone, 
  Mail, 
  LogIn,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  Layers,
  KeyRound,
  Clock,
  UserCheck
} from 'lucide-react';
import { WebhookTester } from './webhook-tester';
import { PortalSettingsTab } from './portal-settings-tab';
import { SmsSettingsTab } from './sms-settings-tab';
import { useForm } from '@/context/form-context';
import { TeamMember, TeamRole } from '@/types/advanced';
import { InviteMemberModal } from '@/components/team/invite-member-modal';
import { AVAILABLE_SIDEBAR_TABS } from '@/lib/team-constants';
import { COUNSELING_TOPICS } from '@/lib/consultant-helpers';
import { toPersianDigits } from '@/lib/persian';

const TAB_NAME_MAP: Record<string, string> = {
  dashboard: 'داشبورد مدیریت',
  forms: 'فرم‌ها و پرسشنامه‌ها',
  builder: 'استودیو طراحی فرم',
  runner: 'پیش‌نمایش فرم زنده',
  submissions: 'پرونده مراجعین',
  media: 'مرکز اسناد و فایل‌ها',
  chat: 'گفتگوی آنلاین',
  analytics: 'آمارها و تحلیل‌ها',
  templates: 'قالب‌های آماده فرم',
  settings: 'تنظیمات و وب‌هوک‌ها',
};

export const SystemSettingsView: React.FC = () => {
  const { forms, teamMembers, inviteTeamMember, updateTeamMember, deleteTeamMember, toggleTeamMemberStatus } = useForm();
  const [activeTab, setActiveTab] = useState<'general' | 'portal' | 'sms' | 'payment' | 'api' | 'team'>('general');
  const [copiedKey, setCopiedKey] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  const togglePasswordVisibility = (id: string) => {
    setVisiblePasswords((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const copyApiKey = () => {
    navigator.clipboard.writeText('fa_live_89b271f8490a21ce98124098319');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleOpenInvite = () => {
    setEditingMember(null);
    setIsInviteModalOpen(true);
  };

  const handleEditMember = (member: TeamMember) => {
    setEditingMember(member);
    setIsInviteModalOpen(true);
  };

  const handleSaveMember = (data: Omit<TeamMember, 'id' | 'invitedAt'>) => {
    if (editingMember) {
      updateTeamMember(editingMember.id, data);
    } else {
      inviteTeamMember(data);
    }
    setIsInviteModalOpen(false);
    setEditingMember(null);
  };

  const handleDeleteMember = (member: TeamMember) => {
    if (window.confirm(`آیا از حذف دسترسی کاربر «${member.name}» با شماره «${member.mobile}» اطمینان دارید؟`)) {
      deleteTeamMember(member.id);
    }
  };

  const filteredMembers = teamMembers.filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const matchesSearch = 
      m.name.toLowerCase().includes(q) ||
      (m.genderPrefix && m.genderPrefix.toLowerCase().includes(q)) ||
      m.mobile.includes(q) ||
      (m.username && m.username.includes(q)) ||
      (m.jobTitle && m.jobTitle.toLowerCase().includes(q)) ||
      (m.allowedTopics && m.allowedTopics.some((t) => t.toLowerCase().includes(q)));
    return matchesSearch;
  });

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-slate-50">
      
      {/* سربرگ تنظیمات */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          تنظیمات سازمانی و وب‌سرویس‌ها
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          پیکربندی کلیدهای امنیتی، پنل پیامک، درگاه‌های شاپرک و اعضای تیم و دسترسی‌ها
        </p>

        {/* منوی تب‌های تنظیمات */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-100 pb-0 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'general', label: 'اطلاعات سازمان', icon: Building2 },
            { id: 'portal', label: 'صفحه ورود (پورتال پرونده)', icon: LogIn },
            { id: 'sms', label: 'سامانه پیامک', icon: Smartphone },
            { id: 'payment', label: 'درگاه‌های شاپرک', icon: CreditCard },
            { id: 'api', label: 'وب‌هوک و API', icon: Webhook },
            { id: 'team', label: 'مشاوران', icon: Users },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-2 py-3 px-3 border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'border-blue-600 text-blue-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* محتوای تب فعال */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 text-xs">
        {activeTab === 'general' && (
          <div className="space-y-4 max-w-xl">
            <div>
              <label className="block font-bold text-slate-800 mb-1">نام سازمان یا کسب و کار</label>
              <input
                type="text"
                defaultValue="سازمان راهکارهای ابری پایا"
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">زیردامنه اختصاصی فرم‌ها</label>
              <div className="flex items-center gap-1 font-mono text-left">
                <span className="text-slate-400">.formafzar.ir/</span>
                <input
                  type="text"
                  defaultValue="paya-cloud"
                  className="w-48 px-3 py-2 border border-slate-300 rounded-md bg-white text-xs font-mono"
                />
              </div>
            </div>

            <div className="pt-3">
              <button className="px-5 py-2 bg-slate-900 text-white font-bold rounded-md hover:bg-slate-800">
                ذخیره تنظیمات پایه
              </button>
            </div>
          </div>
        )}

        {activeTab === 'portal' && (
          <PortalSettingsTab />
        )}

        {activeTab === 'sms' && <SmsSettingsTab />}

        {activeTab === 'payment' && (
          <div className="space-y-4 max-w-xl">
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
              <div className="font-bold text-emerald-900">اتصال به درگاه‌های بانکی شاپرک</div>
              <p className="text-[11px] text-emerald-700 leading-relaxed">
                ترمینال‌های ثبت‌شده به طور خودکار اعتبارسنجی شده و مبالغ واریزی بدون کارمزد اضافی به حساب شبای تجاری شما منتقل می‌شوند.
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">کد ترمینال به‌پرداخت ملت (Terminal ID)</label>
              <input
                type="text"
                defaultValue="8912401"
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white font-mono text-left text-xs"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">شناسه پذیرنده زرین‌پال (Merchant ID)</label>
              <input
                type="text"
                defaultValue="zarin_109283-49210-91820"
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white font-mono text-left text-xs"
              />
            </div>

            <div className="pt-3">
              <button className="px-5 py-2 bg-slate-900 text-white font-bold rounded-md hover:bg-slate-800">
                ذخیره تنظیمات درگاه
              </button>
            </div>
          </div>
        )}

        {activeTab === 'api' && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 max-w-2xl">
              <span className="font-bold text-slate-900">کلید احراز هویت REST API</span>
              <p className="text-[11px] text-slate-500">
                از این کلید به عنوان Bearer Token در هدر درخواست‌های ارسالی به API استفاده کنید.
              </p>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value="fa_live_89b271f8490a21ce98124098319"
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-md font-mono text-left text-xs bg-white"
                />
                <button
                  onClick={copyApiKey}
                  className="px-4 py-2 bg-slate-900 text-white font-bold rounded-md hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedKey ? 'کپی شد' : 'کپی کلید'}</span>
                </button>
              </div>
            </div>

            <WebhookTester />
          </div>
        )}

        {activeTab === 'team' && (
          <div className="space-y-6">
            {/* سربرگ بخش مشاوران و آمار */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-500 font-medium">کل مشاوران و کاربران</span>
                <div className="text-xl font-bold text-slate-900 mt-0.5">{toPersianDigits(teamMembers.length)} نفر</div>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[11px] text-emerald-700 font-medium">مشاوران فعال</span>
                <div className="text-xl font-bold text-emerald-800 mt-0.5">
                  {toPersianDigits(teamMembers.filter((m) => m.status === 'active').length)} نفر
                </div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-[11px] text-amber-700 font-medium">دسترسی محدود به پرونده</span>
                <div className="text-xl font-bold text-amber-800 mt-0.5">
                  {toPersianDigits(teamMembers.filter((m) => m.requireCaseCode !== false && m.role !== 'super_admin').length)} نفر
                </div>
              </div>
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                <span className="text-[11px] text-purple-700 font-medium">مدیران ارشد</span>
                <div className="text-xl font-bold text-purple-800 mt-0.5">
                  {toPersianDigits(teamMembers.filter((m) => m.role === 'super_admin').length)} نفر
                </div>
              </div>
            </div>

            {/* راهنما و توضیحات بخش مشاوران */}
            <div className="p-4 bg-gradient-to-r from-blue-50/80 via-indigo-50/50 to-slate-50 border border-blue-200/70 rounded-2xl flex items-start gap-3">
              <UserCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-slate-700">
                <div className="font-bold text-slate-900 text-xs">مدیریت مشاوران سامانه و سطوح دسترسی</div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  در این بخش می‌توانید مشاوران مرکز مشاوره بالحق را با پیشوند (آقا / خانم)، نام و نام خانوادگی، موضوعات تخصصی مشاوره، ساعات کاری هفتگی، مجوزهای منوی کناری و نوع دسترسی به پرونده مراجعان (محدود شده یا آزاد) پیکربندی نمایید. مشاوران تعریف‌شده در این قسمت در فیلدهای رزرو وقت فرم‌ساز و گزینه‌های آماده لیست کشویی قابل استفاده هستند.
                </p>
              </div>
            </div>

            {/* نوار جستجو و فیلتر + دکمه افزودن مشاور */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="جستجوی مشاور بر اساس نام، شماره تلفن، سمت یا موضوع مشاوره..."
                  className="w-full pr-9 pl-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <button
                onClick={handleOpenInvite}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-sm hover:from-blue-700 hover:to-indigo-700 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ تعریف مشاور جدید</span>
              </button>
            </div>

            {/* لیست کارت‌های مشاوران */}
            <div className="space-y-3">
              {filteredMembers.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">مشاوری با این مشخصات یافت نشد</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    می‌توانید عبارت جستجو را پاک کنید یا مشاور جدیدی ثبت نمایید.
                  </p>
                </div>
              ) : (
                filteredMembers.map((member) => {
                  const isActive = member.status === 'active';
                  const isSuper = member.role === 'super_admin';
                  const userTabs = Array.isArray(member.allowedTabs) && member.allowedTabs.length > 0
                    ? member.allowedTabs
                    : (isSuper ? AVAILABLE_SIDEBAR_TABS.map((t) => t.id) : ['submissions']);
                  const isPasswordVisible = !!visiblePasswords[member.id];
                  const hasCaseCodeRestriction = member.requireCaseCode !== false && !isSuper;

                  // پیشوند آقا یا خانم
                  const prefix = member.genderPrefix || (member.name?.startsWith('خانم') ? 'خانم' : (member.name?.startsWith('آقا') ? 'آقا' : ''));
                  const cleanNameOnly = member.name?.replace(/^(خانم|آقای?)\s+/, '') || member.name;
                  const fullNameWithPrefix = prefix ? `${prefix} ${cleanNameOnly}` : member.name;

                  // خلاصه ساعت کاری
                  const wh = member.workingHours;
                  const dayNames = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];
                  const workDaysSummary = wh?.availableDays?.map((d) => dayNames[d] || String(d)).join('، ');

                  return (
                    <div
                      key={member.id}
                      className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs hover:border-slate-300 transition space-y-3"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* مشخصات مشاور */}
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-100 to-indigo-100 border border-slate-300 text-indigo-950 font-extrabold flex items-center justify-center text-xs shadow-xs">
                              {prefix ? prefix : (cleanNameOnly ? cleanNameOnly.slice(0, 2) : 'مش')}
                            </div>
                            <span
                              className={`absolute -bottom-1 -left-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                                isActive ? 'bg-emerald-500' : 'bg-rose-400'
                              }`}
                              title={isActive ? 'فعال' : 'غیرفعال / تعلیق‌شده'}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-extrabold text-sm text-slate-900">{fullNameWithPrefix}</span>

                              {prefix && (
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                  prefix === 'خانم'
                                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                                    : 'bg-blue-50 text-blue-700 border-blue-200'
                                }`}>
                                  {prefix}
                                </span>
                              )}

                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  isActive
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {isActive ? 'فعال' : 'معلق'}
                              </span>

                              {isSuper ? (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                                  مدیر ارشد سامانه
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                                  مشاور مرکز
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                              <span className="font-medium text-slate-700">{member.jobTitle || 'مشاور مرکز'}</span>
                              <span>•</span>
                              <span className="font-mono text-slate-700 flex items-center gap-1 font-semibold" title="نام کاربری جهت ورود">
                                <Phone className="w-3.5 h-3.5 text-blue-500" />
                                <span>نام کاربری: {member.mobile}</span>
                              </span>
                              
                              {member.password && (
                                <>
                                  <span>•</span>
                                  <div className="flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80">
                                    <Lock className="w-3 h-3 text-slate-400" />
                                    <span className="text-slate-500 text-[10px]">رمز:</span>
                                    <span className="font-mono font-bold text-slate-800 text-[11px]">
                                      {isPasswordVisible ? member.password : '••••••'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => togglePasswordVisibility(member.id)}
                                      className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                                      title={isPasswordVisible ? 'مخفی‌سازی رمز' : 'مشاهده رمز'}
                                    >
                                      {isPasswordVisible ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                    </button>
                                  </div>
                                </>
                              )}
                            </div>

                            {/* موضوعات تخصصی مشاوره */}
                            {member.allowedTopics && member.allowedTopics.length > 0 && (
                              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                <span className="text-[10px] text-slate-400 font-medium">موضوعات:</span>
                                {member.allowedTopics.map((topId) => {
                                  const topicObj = COUNSELING_TOPICS.find((t) => t.id === topId);
                                  return (
                                    <span
                                      key={topId}
                                      className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-md text-[10px] font-semibold"
                                    >
                                      {topicObj ? topicObj.name : topId}
                                    </span>
                                  );
                                })}
                              </div>
                            )}

                            {/* خلاصه ساعت کاری */}
                            {wh && (
                              <div className="flex items-center gap-1.5 text-[10px] text-emerald-800 bg-emerald-50/70 border border-emerald-100 px-2 py-1 rounded-lg w-fit">
                                <Clock className="w-3 h-3 text-emerald-600" />
                                <span>ساعت کاری: {workDaysSummary ? `روزهای (${workDaysSummary})` : 'بدون روز فعال'}</span>
                                <span>•</span>
                                <span>مدت جلسه: {toPersianDigits(wh.slotDurationMinutes || 45)} دقیقه</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* دکمه‌های عملیات */}
                        <div className="flex items-center gap-2 self-end md:self-center">
                          <button
                            onClick={() => handleEditMember(member)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 border border-blue-200 cursor-pointer"
                            title="ویرایش مشخصات و ساعات کاری"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>ویرایش مشخصات و ساعت کاری</span>
                          </button>

                          <button
                            onClick={() => toggleTeamMemberStatus(member.id)}
                            className={`p-2 rounded-xl border text-xs font-bold transition flex items-center gap-1 cursor-pointer ${
                              isActive
                                ? 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100'
                                : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                            }`}
                            title={isActive ? 'غیرفعال‌سازی موقت دسترسی' : 'فعال‌سازی مجدد'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          {!isSuper && (
                            <button
                              onClick={() => handleDeleteMember(member)}
                              className="p-2 rounded-xl border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 text-xs font-bold transition cursor-pointer"
                              title="حذف مشاور"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* تب‌های مجاز و وضعیت محدودیت پرونده مراجعین */}
                      <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-[11px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-400 font-medium">تب‌های مجاز سایدبار:</span>
                          {userTabs.map((tabId) => (
                            <span
                              key={tabId}
                              className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md border border-slate-200 text-[10px] font-semibold"
                            >
                              {TAB_NAME_MAP[tabId] || tabId}
                            </span>
                          ))}
                        </div>

                        <div>
                          {hasCaseCodeRestriction ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
                              <ShieldAlert className="w-3 h-3 text-amber-600" />
                              <span>پرونده مراجعان: دسترسی محدود شده (ورود کد پرونده)</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>پرونده مراجعان: دسترسی آزاد و نامحدود</span>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {/* مودال تعریف یا ویرایش کاربر */}
      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => {
          setIsInviteModalOpen(false);
          setEditingMember(null);
        }}
        onSave={handleSaveMember}
        editingMember={editingMember}
        forms={forms}
      />
    </div>
  );
};
