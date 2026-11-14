'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from '@/context/form-context';
import { useAdminAuth } from '@/context/admin-auth-context';
import { AdminLoginView } from '@/components/auth/admin-login-view';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { MobileBottomNav } from '@/components/layout/mobile-bottom-nav';
import dynamic from 'next/dynamic';
import { Layers } from 'lucide-react';

function ViewSkeleton() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center animate-pulse">
      <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-2xs p-1.5 flex items-center justify-center mb-3">
        <img src="/images/belhagh-logo.png" alt="لوگوی روانشناسی بالحق" className="w-full h-full object-contain" />
      </div>
      <p className="text-xs text-slate-500 font-medium">در حال بارگذاری بخش مورد نظر...</p>
    </div>
  );
}

const DashboardView = dynamic(
  () => import('@/components/dashboard/dashboard-view').then((m) => m.DashboardView),
  { loading: () => <ViewSkeleton /> }
);
const FormsListView = dynamic(
  () => import('@/components/forms/forms-list-view').then((m) => m.FormsListView),
  { loading: () => <ViewSkeleton /> }
);
const Studio = dynamic(
  () => import('@/components/builder/studio').then((m) => m.Studio),
  { loading: () => <ViewSkeleton /> }
);
const FormRunner = dynamic(
  () => import('@/components/runner/form-runner').then((m) => m.FormRunner),
  { loading: () => <ViewSkeleton /> }
);
const SubmissionsHub = dynamic(
  () => import('@/components/submissions/submissions-hub').then((m) => m.SubmissionsHub),
  { loading: () => <ViewSkeleton /> }
);
const AnalyticsView = dynamic(
  () => import('@/components/analytics/analytics-view').then((m) => m.AnalyticsView),
  { loading: () => <ViewSkeleton /> }
);
const TemplatesView = dynamic(
  () => import('@/components/templates/templates-view').then((m) => m.TemplatesView),
  { loading: () => <ViewSkeleton /> }
);
const SystemSettingsView = dynamic(
  () => import('@/components/settings/system-settings-view').then((m) => m.SystemSettingsView),
  { loading: () => <ViewSkeleton /> }
);
const MediaManagerView = dynamic(
  () => import('@/components/media/media-manager-view').then((m) => m.MediaManagerView),
  { loading: () => <ViewSkeleton /> }
);
const AdminChatInboxView = dynamic(
  () => import('@/components/chat/admin-chat-inbox-view').then((m) => m.AdminChatInboxView),
  { loading: () => <ViewSkeleton /> }
);
const ConsultantsView = dynamic(
  () => import('@/components/consultants/consultants-view').then((m) => m.ConsultantsView),
  { loading: () => <ViewSkeleton /> }
);
const NewFormModal = dynamic(
  () => import('@/components/modals/new-form-modal').then((m) => m.NewFormModal),
  { ssr: false }
);

export default function AppHome() {
  const { isAuthenticated, isLoading, currentUser } = useAdminAuth();
  const { forms, activeForm, setActiveForm, getFormById } = useForm();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isNewFormModalOpen, setIsNewFormModalOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [runnerPrefillData, setRunnerPrefillData] = useState<Record<string, any> | undefined>(undefined);

  const isSuperAdmin = !!(
    currentUser?.isSuperAdmin ||
    currentUser?.username === 'admin' ||
    currentUser?.role === 'super_admin'
  );
  const userAllowedTabs = currentUser?.allowedTabs;

  // انتخاب خودکار اولین تب مجاز برای کاربر
  useEffect(() => {
    if (!currentUser || isSuperAdmin) return;
    const allowed = userAllowedTabs && userAllowedTabs.length > 0 ? userAllowedTabs : ['submissions'];
    if (!allowed.includes(currentTab)) {
      setCurrentTab(allowed[0]);
    }
  }, [currentUser, isSuperAdmin, userAllowedTabs, currentTab]);

  const handleTabChange = (targetTab: string) => {
    if (!isSuperAdmin && userAllowedTabs) {
      if (!userAllowedTabs.includes(targetTab)) {
        return;
      }
    }
    setCurrentTab(targetTab);
    setIsMobileNavOpen(false);
  };

  const handleTemplateSelected = (newFormId: string) => {
    const f = getFormById(newFormId);
    if (f) setActiveForm(f);
    handleTabChange('builder');
  };

  const handleFormCreated = (newFormId: string) => {
    const f = getFormById(newFormId);
    if (f) setActiveForm(f);
    handleTabChange('builder');
  };

  const handleNavigateToForm = (formIdOrSlug: string, initialData?: Record<string, any>) => {
    const target = forms.find((f) => f.id === formIdOrSlug || f.slug === formIdOrSlug);
    if (target) {
      setActiveForm(target);
      setRunnerPrefillData(initialData);
      handleTabChange('runner');
    }
  };

  // وضعیت بارگذاری اولیه احراز هویت
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-white p-2 flex items-center justify-center mb-4 animate-pulse shadow-xl ring-4 ring-white/10">
          <img src="/images/belhagh-logo.png" alt="لوگوی بالحق" className="w-full h-full object-contain" />
        </div>
        <p className="text-xs text-slate-400 font-medium">در حال بررسی مجوزهای دسترسی مدیریت...</p>
      </div>
    );
  }

  // در صورتی که کاربر وارد نشده باشد، فرم ورود نمایش داده می‌شود
  if (!isAuthenticated) {
    return <AdminLoginView />;
  }

  const isTabAllowed = (tabId: string) => {
    if (isSuperAdmin) return true;
    if (Array.isArray(userAllowedTabs) && userAllowedTabs.length > 0) {
      return userAllowedTabs.includes(tabId);
    }
    return tabId === 'submissions';
  };

  return (
    <div className="h-screen h-[100dvh] flex flex-col bg-slate-50 text-slate-900 overflow-hidden">
      
      {/* سربرگ ناوبری سراسری */}
      <Header
        currentTab={currentTab}
        setCurrentTab={handleTabChange}
        openNewFormModal={() => setIsNewFormModalOpen(true)}
        isMobileNavOpen={isMobileNavOpen}
        onToggleMobileNav={() => setIsMobileNavOpen((prev) => !prev)}
      />

      {/* بوم اصلی نرم‌افزار */}
      <div className="flex-1 min-h-0 min-w-0 flex overflow-hidden">
        
        {/* منوی کناری ثابت و کشویی موبایل */}
        <Sidebar 
          currentTab={currentTab} 
          setCurrentTab={handleTabChange}
          isOpenMobile={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />

        {/* محتوای تب فعال */}
        <main className="flex-1 min-h-0 min-w-0 flex flex-col overflow-hidden bottom-nav-safe md:pb-0">
          {currentTab === 'dashboard' && isTabAllowed('dashboard') && (
            <DashboardView
              onOpenNewFormModal={() => setIsNewFormModalOpen(true)}
              onNavigateTab={handleTabChange}
            />
          )}

          {currentTab === 'forms' && isTabAllowed('forms') && (
            <FormsListView
              onOpenNewFormModal={() => setIsNewFormModalOpen(true)}
              onNavigateTab={handleTabChange}
            />
          )}

          {currentTab === 'builder' && isTabAllowed('builder') && (
            <Studio onPreview={() => handleTabChange('runner')} />
          )}

          {currentTab === 'runner' && activeForm && isTabAllowed('runner') && (
            <div className="flex-1 overflow-y-auto bg-slate-100/60 p-4 sm:p-6">
              <FormRunner
                key={activeForm.id}
                form={activeForm}
                onBackToStudio={() => handleTabChange('builder')}
                onNavigateToForm={handleNavigateToForm}
                initialFormData={runnerPrefillData}
              />
            </div>
          )}

          {currentTab === 'submissions' && isTabAllowed('submissions') && <SubmissionsHub />}

          {currentTab === 'consultants' && isTabAllowed('consultants') && (
            <ConsultantsView onNavigateTab={handleTabChange} />
          )}

          {currentTab === 'media' && isTabAllowed('media') && <MediaManagerView />}

          {currentTab === 'chat' && isTabAllowed('chat') && <AdminChatInboxView />}

          {currentTab === 'analytics' && isTabAllowed('analytics') && (
            <AnalyticsView onNavigateToRunner={() => handleTabChange('runner')} />
          )}

          {currentTab === 'templates' && isTabAllowed('templates') && (
            <TemplatesView onSelectTemplate={handleTemplateSelected} />
          )}

          {currentTab === 'settings' && isTabAllowed('settings') && <SystemSettingsView />}
        </main>
      </div>

      {/* نوار ناوبری ثابت پایینی ویژه دسترسی سریع در موبایل */}
      <MobileBottomNav
        currentTab={currentTab}
        onSelectTab={handleTabChange}
        isSuperAdmin={isSuperAdmin}
        allowedTabs={userAllowedTabs}
      />

      {/* مودال ایجاد فرم جدید */}
      <NewFormModal
        isOpen={isNewFormModalOpen}
        onClose={() => setIsNewFormModalOpen(false)}
        onCreated={handleFormCreated}
      />

    </div>
  );
}
