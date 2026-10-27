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
  LogIn
} from 'lucide-react';
import { WebhookTester } from './webhook-tester';
import { PortalSettingsTab } from './portal-settings-tab';
import { SmsSettingsTab } from './sms-settings-tab';
import { useForm } from '@/context/form-context';
import { TeamMember, TeamRole } from '@/types/advanced';
import { InviteMemberModal } from '@/components/team/invite-member-modal';

export const SystemSettingsView: React.FC = () => {
  const { forms, teamMembers, inviteTeamMember, updateTeamMember, deleteTeamMember, toggleTeamMemberStatus } = useForm();
  const [activeTab, setActiveTab] = useState<'general' | 'portal' | 'sms' | 'payment' | 'api' | 'team'>('general');
  const [copiedKey, setCopiedKey] = useState(false);
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');

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
    if (window.confirm(`آیا از حذف دسترسی همکار «${member.name}» اطمینان دارید؟`)) {
      deleteTeamMember(member.id);
    }
  };

  const filteredMembers = teamMembers.filter((m) => {
    const matchesSearch = 
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.mobile.includes(searchQuery) ||
      m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.jobTitle.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || m.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const ROLE_BADGES: Record<TeamRole, { title: string; color: string }> = {
    super_admin: { title: 'مدیر کل (Super Admin)', color: 'bg-purple-100 text-purple-800 border-purple-200' },
    booking_operator: { title: 'اپراتور نوبت‌دهی و پذیرش', color: 'bg-teal-100 text-teal-800 border-teal-200' },
    reviewer: { title: 'کارشناس کارتابل', color: 'bg-blue-100 text-blue-800 border-blue-200' },
    form_builder: { title: 'طراح فرم', color: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
    auditor: { title: 'ناظر و بازرس', color: 'bg-amber-100 text-amber-800 border-amber-200' },
    custom: { title: 'دسترسی سفارشی', color: 'bg-slate-100 text-slate-800 border-slate-200' },
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-6 bg-slate-50">
      
      {/* سربرگ تنظیمات */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
          تنظیمات سازمانی و وب‌سرویس‌ها
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          پیکربندی کلیدهای امنیتی، پنل پیامک، درگاه‌های شاپرک و اعضای تیم
        </p>

        {/* منوی تب‌های تنظیمات */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-100 pb-0 text-xs font-semibold overflow-x-auto">
          {[
            { id: 'general', label: 'اطلاعات سازمان', icon: Building2 },
            { id: 'portal', label: 'صفحه ورود (پورتال پرونده)', icon: LogIn },
            { id: 'sms', label: 'سامانه پیامک', icon: Smartphone },
            { id: 'payment', label: 'درگاه‌های شاپرک', icon: CreditCard },
            { id: 'api', label: 'وب‌هوک و API', icon: Webhook },
            { id: 'team', label: 'اعضای تیم و دسترسی‌ها', icon: Users },
          ].map((t) => {
            const Icon = t.icon;
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id as any)}
                className={`flex items-center gap-2 py-3 px-3 border-b-2 transition-all whitespace-nowrap ${
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
                  className="px-4 py-2 bg-slate-900 text-white font-bold rounded-md hover:bg-slate-800 flex items-center gap-1.5"
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
            {/* سربرگ بخش همکاران و آمار */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[11px] text-slate-500 font-medium">کل همکاران سامانه</span>
                <div className="text-xl font-bold text-slate-900 mt-0.5">{teamMembers.length} نفر</div>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[11px] text-emerald-700 font-medium">همکاران فعال</span>
                <div className="text-xl font-bold text-emerald-800 mt-0.5">
                  {teamMembers.filter((m) => m.status === 'active').length} نفر
                </div>
              </div>
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl">
                <span className="text-[11px] text-teal-700 font-medium">اپراتورهای نوبت‌دهی</span>
                <div className="text-xl font-bold text-teal-800 mt-0.5">
                  {teamMembers.filter((m) => m.role === 'booking_operator').length} نفر
                </div>
              </div>
              <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl">
                <span className="text-[11px] text-purple-700 font-medium">مدیران کل</span>
                <div className="text-xl font-bold text-purple-800 mt-0.5">
                  {teamMembers.filter((m) => m.role === 'super_admin').length} نفر
                </div>
              </div>
            </div>

            {/* نوار جستجو و فیلتر + دکمه دعوت همکار */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div className="flex flex-1 items-center gap-2">
                <div className="relative flex-1 max-w-sm">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="جستجوی همکار بر اساس نام، شماره موبایل یا سمت..."
                    className="w-full pr-9 pl-3 py-2 text-xs border border-slate-300 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                  />
                </div>

                <div className="relative">
                  <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="px-3 py-2 text-xs border border-slate-300 rounded-xl bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-100"
                  >
                    <option value="all">همه نقش‌ها</option>
                    <option value="super_admin">مدیر کل</option>
                    <option value="booking_operator">اپراتور نوبت‌دهی</option>
                    <option value="reviewer">کارشناس کارتابل</option>
                    <option value="form_builder">طراح فرم</option>
                    <option value="auditor">ناظر و بازرس</option>
                    <option value="custom">دسترسی سفارشی</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleOpenInvite}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-xs rounded-xl shadow-sm hover:from-blue-700 hover:to-indigo-700 transition flex items-center justify-center gap-1.5"
              >
                <UserPlus className="w-4 h-4" />
                <span>+ دعوت همکار جدید</span>
              </button>
            </div>

            {/* لیست کارت‌های همکاران */}
            <div className="space-y-3">
              {filteredMembers.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 border border-dashed border-slate-200 rounded-2xl">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">همکاری با این مشخصات یافت نشد</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    می‌توانید عبارت جستجو را پاک کنید یا همکار جدیدی به سیستم اضافه نمایید.
                  </p>
                </div>
              ) : (
                filteredMembers.map((member) => {
                  const roleInfo = ROLE_BADGES[member.role] || ROLE_BADGES.custom;
                  const isActive = member.status === 'active';
                  const isAllScope = member.accessibleFormIds.includes('all');
                  const accessibleFormsCount = isAllScope ? forms.length : member.accessibleFormIds.length;

                  // شمارش مجوزهای فعال
                  const activePermCount = Object.values(member.permissions).filter(Boolean).length;

                  return (
                    <div
                      key={member.id}
                      className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs hover:border-slate-300 transition space-y-3"
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* مشخصات فردی */}
                        <div className="flex items-start gap-3">
                          <div className="relative">
                            <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 font-bold flex items-center justify-center text-sm">
                              {member.name.slice(0, 2)}
                            </div>
                            <span
                              className={`absolute -bottom-1 -left-1 w-3.5 h-3.5 rounded-full border-2 border-white ${
                                isActive ? 'bg-emerald-500' : 'bg-rose-400'
                              }`}
                              title={isActive ? 'فعال' : 'غیرفعال / تعلیق‌شده'}
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-bold text-sm text-slate-900">{member.name}</span>
                              <span
                                className={`text-[10px] font-bold px-2.5 py-0.5 rounded-md border ${roleInfo.color}`}
                              >
                                {roleInfo.title}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                                  isActive
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border border-rose-200'
                                }`}
                              >
                                {isActive ? 'فعال' : 'غیرفعال'}
                              </span>
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                              <span className="font-medium text-slate-700">{member.jobTitle}</span>
                              <span>•</span>
                              <span className="font-mono text-slate-600 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {member.mobile}
                              </span>
                              {member.email && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono text-slate-500 flex items-center gap-1">
                                    <Mail className="w-3 h-3 text-slate-400" />
                                    {member.email}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* دکمه‌های عملیات */}
                        <div className="flex items-center gap-1.5 self-end md:self-center">
                          <button
                            onClick={() => handleEditMember(member)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 text-xs font-bold rounded-lg transition flex items-center gap-1"
                            title="ویرایش سطح دسترسی و مشخصات"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            <span>ویرایش دسترسی‌ها</span>
                          </button>

                          <button
                            onClick={() => toggleTeamMemberStatus(member.id)}
                            className={`p-1.5 rounded-lg border text-xs font-bold transition flex items-center gap-1 ${
                              isActive
                                ? 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100'
                                : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                            }`}
                            title={isActive ? 'غیرفعال‌سازی موقت دسترسی' : 'فعال‌سازی مجدد'}
                          >
                            <Power className="w-3.5 h-3.5" />
                          </button>

                          {member.role !== 'super_admin' && (
                            <button
                              onClick={() => handleDeleteMember(member)}
                              className="p-1.5 rounded-lg border border-rose-200 text-rose-600 bg-rose-50 hover:bg-rose-100 text-xs font-bold transition"
                              title="حذف همکار"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* خلاصه سطوح دسترسی و فرم‌های مجاز */}
                      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-slate-400">مجوزهای فعال:</span>

                          {member.permissions.canCreateForms && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded border border-blue-200 text-[10px]">
                              طراحی فرم
                            </span>
                          )}

                          {member.permissions.canViewSubmissions && (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 text-[10px]">
                              مشاهده کارتابل
                            </span>
                          )}

                          {member.permissions.canChangeStatus && (
                            <span className="px-2 py-0.5 bg-cyan-50 text-cyan-700 rounded border border-cyan-200 text-[10px]">
                              تغییر وضعیت مراجعین
                            </span>
                          )}

                          {member.permissions.canManageBookings && (
                            <span className="px-2 py-0.5 bg-teal-50 text-teal-700 rounded border border-teal-200 text-[10px]">
                              مدیریت نوبت‌دهی مشاوره
                            </span>
                          )}

                          {member.permissions.canExportData && (
                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded border border-amber-200 text-[10px]">
                              خروجی اکسل
                            </span>
                          )}

                          {member.permissions.canViewFinances && (
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-200 text-[10px]">
                              تراکنش‌های مالی
                            </span>
                          )}

                          {member.permissions.canManageTeam && (
                            <span className="px-2 py-0.5 bg-rose-50 text-rose-700 rounded border border-rose-200 text-[10px]">
                              مدیریت همکاران
                            </span>
                          )}

                          <span className="text-slate-400 text-[10px]">
                            ({activePermCount} از ۱۶ مجوز فعال)
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 text-slate-500">
                          <span className="text-slate-400">محدوده فرم‌ها:</span>
                          <span className="font-bold text-slate-700 px-2 py-0.5 bg-slate-100 rounded text-[10px]">
                            {isAllScope ? 'همه فرم‌های سامانه' : `${accessibleFormsCount} فرم اختصاصی`}
                          </span>
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

      {/* مودال دعوت یا ویرایش همکار */}
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
