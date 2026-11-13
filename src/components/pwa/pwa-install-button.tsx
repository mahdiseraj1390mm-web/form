'use client';

import React from 'react';
import { usePwaInstall } from '@/context/pwa-context';
import { Download, Smartphone } from 'lucide-react';

interface PwaInstallButtonProps {
  variant?: 'header' | 'public-header' | 'login';
  className?: string;
}

export const PwaInstallButton: React.FC<PwaInstallButtonProps> = ({
  variant = 'header',
  className = '',
}) => {
  const { isReady, isStandalone, isInstalled, canNativeInstall, triggerInstall } =
    usePwaInstall();

  // Hide once running inside installed PWA or already installed
  if (!isReady || isStandalone || (isInstalled && !canNativeInstall)) {
    return null;
  }

  if (variant === 'login') {
    return (
      <button
        type="button"
        onClick={triggerInstall}
        className={`w-full py-2.5 px-4 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${className}`}
      >
        <Smartphone className="w-4 h-4 shrink-0" />
        <span>نصب وب‌اپلیکیشن روی گوشی یا سیستم</span>
      </button>
    );
  }

  if (variant === 'public-header') {
    return (
      <button
        type="button"
        onClick={triggerInstall}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#084d3e] hover:bg-[#063b2f] text-white text-[11px] sm:text-xs font-bold shadow-xs transition-all cursor-pointer shrink-0 ${className}`}
        title="نصب وب‌اپلیکیشن روی دستگاه"
      >
        <Download className="w-3.5 h-3.5" />
        <span>نصب اپلیکیشن</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={triggerInstall}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-[#084d3e] border border-emerald-200/80 text-xs font-bold transition-colors cursor-pointer shrink-0 ${className}`}
      title="نصب نسخه وب‌اپلیکیشن (PWA)"
    >
      <Download className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">نصب اپلیکیشن</span>
    </button>
  );
};
