'use client';

import React, { useState } from 'react';
import { useForm } from '@/context/form-context';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import { DashboardView } from '@/components/dashboard/dashboard-view';
import { FormsListView } from '@/components/forms/forms-list-view';
import { Studio } from '@/components/builder/studio';
import { FormRunner } from '@/components/runner/form-runner';
import { SubmissionsHub } from '@/components/submissions/submissions-hub';
import { AnalyticsView } from '@/components/analytics/analytics-view';
import { TemplatesView } from '@/components/templates/templates-view';
import { SystemSettingsView } from '@/components/settings/system-settings-view';
import { MediaManagerView } from '@/components/media/media-manager-view';
import { AdminChatInboxView } from '@/components/chat/admin-chat-inbox-view';
import { NewFormModal } from '@/components/modals/new-form-modal';

export default function AppHome() {
  const { forms, activeForm, setActiveForm, getFormById } = useForm();
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isNewFormModalOpen, setIsNewFormModalOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [runnerPrefillData, setRunnerPrefillData] = useState<Record<string, any> | undefined>(undefined);

  const handleTemplateSelected = (newFormId: string) => {
    const f = getFormById(newFormId);
    if (f) setActiveForm(f);
    setCurrentTab('builder');
  };

  const handleFormCreated = (newFormId: string) => {
    const f = getFormById(newFormId);
    if (f) setActiveForm(f);
    setCurrentTab('builder');
  };

  const handleNavigateToForm = (formIdOrSlug: string, initialData?: Record<string, any>) => {
    const target = forms.find((f) => f.id === formIdOrSlug || f.slug === formIdOrSlug);
    if (target) {
      setActiveForm(target);
      setRunnerPrefillData(initialData);
      setCurrentTab('runner');
    }
  };

  return (
    <div className="h-screen h-[100dvh] flex flex-col bg-slate-50 text-slate-900 overflow-hidden">
      
      {/* سربرگ ناوبری سراسری */}
      <Header
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          setIsMobileNavOpen(false);
        }}
        openNewFormModal={() => setIsNewFormModalOpen(true)}
        isMobileNavOpen={isMobileNavOpen}
        onToggleMobileNav={() => setIsMobileNavOpen((prev) => !prev)}
      />

      {/* بوم اصلی نرم‌افزار */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        
        {/* منوی کناری ثابت و کشویی موبایل */}
        <Sidebar 
          currentTab={currentTab} 
          setCurrentTab={(tab) => {
            setCurrentTab(tab);
            setIsMobileNavOpen(false);
          }}
          isOpenMobile={isMobileNavOpen}
          onCloseMobile={() => setIsMobileNavOpen(false)}
        />

        {/* محتوای تب فعال */}
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
          {currentTab === 'dashboard' && (
            <DashboardView
              onOpenNewFormModal={() => setIsNewFormModalOpen(true)}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'forms' && (
            <FormsListView
              onOpenNewFormModal={() => setIsNewFormModalOpen(true)}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
          )}

          {currentTab === 'builder' && (
            <Studio onPreview={() => setCurrentTab('runner')} />
          )}

          {currentTab === 'runner' && activeForm && (
            <div className="flex-1 overflow-y-auto bg-slate-100/60 p-4 sm:p-6">
              <FormRunner
                key={activeForm.id}
                form={activeForm}
                onBackToStudio={() => setCurrentTab('builder')}
                onNavigateToForm={handleNavigateToForm}
                initialFormData={runnerPrefillData}
              />
            </div>
          )}

          {currentTab === 'submissions' && <SubmissionsHub />}

          {currentTab === 'media' && <MediaManagerView />}

          {currentTab === 'chat' && <AdminChatInboxView />}

          {currentTab === 'analytics' && (
            <AnalyticsView onNavigateToRunner={() => setCurrentTab('runner')} />
          )}

          {currentTab === 'templates' && (
            <TemplatesView onSelectTemplate={handleTemplateSelected} />
          )}

          {currentTab === 'settings' && <SystemSettingsView />}
        </main>
      </div>

      {/* مودال ایجاد فرم جدید */}
      <NewFormModal
        isOpen={isNewFormModalOpen}
        onClose={() => setIsNewFormModalOpen(false)}
        onCreated={handleFormCreated}
      />

    </div>
  );
}
