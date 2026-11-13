'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useSyncExternalStore,
} from 'react';

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface Window {
    __pwaInstallPrompt?: BeforeInstallPromptEvent | null;
  }
}

export type PwaPlatform =
  | 'chromium'
  | 'ios'
  | 'mac-safari'
  | 'android-firefox'
  | 'in-app'
  | 'other';

interface PwaContextType {
  isReady: boolean;
  isStandalone: boolean;
  isInstalled: boolean;
  isPromptOpen: boolean;
  justInstalledToast: boolean;
  canNativeInstall: boolean;
  platform: PwaPlatform;
  isMobile: boolean;
  triggerInstall: () => Promise<void>;
  dismissPrompt: () => void;
  openInstallGuide: () => void;
  closeInstallGuide: () => void;
}

const DISMISS_STORAGE_KEY = 'belhagh_pwa_dismissed_at';
const INSTALLED_STORAGE_KEY = 'belhagh_pwa_installed';
const DISMISS_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

const PwaContext = createContext<PwaContextType | undefined>(undefined);

const emptySubscribe = () => () => {};

function detectStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.matchMedia('(display-mode: fullscreen)').matches ||
    window.matchMedia('(display-mode: minimal-ui)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function subscribeStandalone(callback: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  const mql = window.matchMedia('(display-mode: standalone)');
  mql.addEventListener?.('change', callback);
  window.addEventListener('appinstalled', callback);
  return () => {
    mql.removeEventListener?.('change', callback);
    window.removeEventListener('appinstalled', callback);
  };
}

function detectPlatform(): { platform: PwaPlatform; isMobile: boolean } {
  if (typeof window === 'undefined') {
    return { platform: 'other', isMobile: false };
  }
  const ua = window.navigator.userAgent || '';
  const isIOS =
    (/iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)) &&
    !(window as Window & { MSStream?: unknown }).MSStream;
  const isAndroid = /Android/i.test(ua);
  const isMobile = isIOS || isAndroid;

  const isInApp =
    /Instagram|FBAN|FBAV|Telegram|WhatsApp|Line|MicroMessenger|Rubika|Eitaa|Bale|; wv\)/i.test(
      ua
    );
  if (isInApp) {
    return { platform: 'in-app', isMobile };
  }
  if (isIOS) {
    return { platform: 'ios', isMobile: true };
  }
  const isMacSafari =
    /Macintosh/i.test(ua) &&
    /Safari/i.test(ua) &&
    !/Chrome|Chromium|Edg|OPR|Firefox|FxiOS|CriOS/i.test(ua) &&
    navigator.maxTouchPoints <= 1;
  if (isMacSafari) {
    return { platform: 'mac-safari', isMobile: false };
  }
  if (isAndroid && /Firefox/i.test(ua)) {
    return { platform: 'android-firefox', isMobile: true };
  }
  if (/Chrome|Chromium|Edg|OPR|SamsungBrowser|Brave/i.test(ua)) {
    return { platform: 'chromium', isMobile };
  }
  return { platform: 'other', isMobile };
}

function isWithinDismissCooldown(): boolean {
  try {
    const raw = localStorage.getItem(DISMISS_STORAGE_KEY);
    if (!raw) return false;
    const ts = Number(raw);
    if (!Number.isFinite(ts)) return false;
    return Date.now() - ts < DISMISS_COOLDOWN_MS;
  } catch {
    return false;
  }
}

function readStoredInstalled(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return localStorage.getItem(INSTALLED_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function PwaProvider({ children }: { children: React.ReactNode }) {
  const isReady = useSyncExternalStore(
    emptySubscribe,
    () => true,
    () => false
  );
  const isStandalone = useSyncExternalStore(
    subscribeStandalone,
    detectStandalone,
    () => false
  );

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [installedOverride, setInstalledOverride] = useState<boolean | null>(null);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  const [justInstalledToast, setJustInstalledToast] = useState(false);

  const platformInfo = useMemo(
    () =>
      isReady
        ? detectPlatform()
        : { platform: 'other' as PwaPlatform, isMobile: false },
    [isReady]
  );

  const isInstalled =
    isStandalone ||
    (installedOverride !== null
      ? installedOverride
      : isReady && !deferredPrompt && readStoredInstalled());

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const isDev =
        process.env.NODE_ENV === 'development' ||
        (typeof window !== 'undefined' &&
          (window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname === '::1'));

      if (isDev) {
        // در محیط توسعه، سرویس‌ورکر و کش‌های محلی را پاک می‌کنیم تا با کامپایل توربوپک و Fast Refresh تداخل نکند
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          for (const reg of registrations) {
            reg.unregister();
          }
        });
        if ('caches' in window) {
          caches.keys().then((keys) => {
            keys.forEach((key) => caches.delete(key));
          });
        }
      } else {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/', updateViaCache: 'none' })
          .catch((err) => {
            console.warn('Service worker registration failed:', err);
          });
      }
    }

    if (isStandalone) {
      try {
        localStorage.setItem(INSTALLED_STORAGE_KEY, '1');
      } catch {}
    }

    const syncEarlyPrompt = () => {
      if (window.__pwaInstallPrompt) {
        setDeferredPrompt(window.__pwaInstallPrompt);
        setInstalledOverride(false);
        try {
          localStorage.removeItem(INSTALLED_STORAGE_KEY);
        } catch {}
      }
    };

    const earlyCheckId = window.setTimeout(syncEarlyPrompt, 0);

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const bipEvent = e as BeforeInstallPromptEvent;
      window.__pwaInstallPrompt = bipEvent;
      setDeferredPrompt(bipEvent);
      setInstalledOverride(false);
      try {
        localStorage.removeItem(INSTALLED_STORAGE_KEY);
      } catch {}
    };

    const handleAppInstalled = () => {
      window.__pwaInstallPrompt = null;
      setDeferredPrompt(null);
      setInstalledOverride(true);
      setIsPromptOpen(false);
      setJustInstalledToast(true);
      try {
        localStorage.setItem(INSTALLED_STORAGE_KEY, '1');
      } catch {}
      window.setTimeout(() => setJustInstalledToast(false), 4500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-install-ready', syncEarlyPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-app-installed', handleAppInstalled);

    return () => {
      window.clearTimeout(earlyCheckId);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-install-ready', syncEarlyPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-app-installed', handleAppInstalled);
    };
  }, [isStandalone]);

  // Automatically offer PWA install prompt when the site opens
  useEffect(() => {
    if (!isReady || isStandalone) return;
    if (isWithinDismissCooldown()) return;

    // 1. Native Chromium install prompt available -> show right away with smooth delay
    if (deferredPrompt) {
      const timer = window.setTimeout(() => {
        setIsPromptOpen(true);
      }, 650);
      return () => window.clearTimeout(timer);
    }

    // 2. Platforms without beforeinstallprompt (iOS, macOS Safari, Android Firefox, In-App browsers)
    const manualAutoPlatforms: PwaPlatform[] = [
      'ios',
      'mac-safari',
      'android-firefox',
      'in-app',
    ];
    if (!isInstalled && manualAutoPlatforms.includes(platformInfo.platform)) {
      const timer = window.setTimeout(() => {
        setIsPromptOpen(true);
      }, 900);
      return () => window.clearTimeout(timer);
    }
  }, [isReady, isStandalone, isInstalled, deferredPrompt, platformInfo.platform]);

  const dismissPrompt = useCallback(() => {
    setIsPromptOpen(false);
    try {
      localStorage.setItem(DISMISS_STORAGE_KEY, String(Date.now()));
    } catch {}
  }, []);

  const openInstallGuide = useCallback(() => {
    setIsPromptOpen(true);
  }, []);

  const closeInstallGuide = useCallback(() => {
    setIsPromptOpen(false);
  }, []);

  const triggerInstall = useCallback(async () => {
    const promptEvent = deferredPrompt || window.__pwaInstallPrompt;
    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        window.__pwaInstallPrompt = null;
        setDeferredPrompt(null);
        if (choice.outcome === 'accepted') {
          setIsPromptOpen(false);
          setInstalledOverride(true);
          try {
            localStorage.setItem(INSTALLED_STORAGE_KEY, '1');
          } catch {}
        } else {
          dismissPrompt();
        }
      } catch (err) {
        console.warn('PWA prompt error:', err);
        setIsPromptOpen(true);
      }
      return;
    }

    // Fallback for platforms without native deferredPrompt -> open instructional card
    setIsPromptOpen(true);
  }, [deferredPrompt, dismissPrompt]);

  return (
    <PwaContext.Provider
      value={{
        isReady,
        isStandalone,
        isInstalled,
        isPromptOpen,
        justInstalledToast,
        canNativeInstall: Boolean(deferredPrompt),
        platform: platformInfo.platform,
        isMobile: platformInfo.isMobile,
        triggerInstall,
        dismissPrompt,
        openInstallGuide,
        closeInstallGuide,
      }}
    >
      {children}
    </PwaContext.Provider>
  );
}

export function usePwaInstall() {
  const ctx = useContext(PwaContext);
  if (!ctx) {
    throw new Error('usePwaInstall must be used within a PwaProvider');
  }
  return ctx;
}
