import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { Vazirmatn } from 'next/font/google';
import './globals.css';
import { FormProvider } from '@/context/form-context';
import { AdminAuthProvider } from '@/context/admin-auth-context';
import { PwaProvider } from '@/context/pwa-context';
import { PwaInstallPrompt } from '@/components/pwa/pwa-install-prompt';

const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'],
  weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900'],
  display: 'swap',
  variable: '--font-vazirmatn',
});

export const metadata: Metadata = {
  title: 'سامانه خدمات روانشناسی بالحق',
  description: 'سامانه هوشمند ثبت پرونده و نوبت‌دهی مرکز مشاوره و روانشناسی بالحق',
  applicationName: 'روانشناسی بالحق',
  appleWebApp: {
    capable: true,
    title: 'روانشناسی بالحق',
    statusBarStyle: 'default',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#084d3e',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className={`h-full ${vazirmatn.variable} ${vazirmatn.className}`}>
      <body className={`min-h-full flex flex-col ${vazirmatn.className} bg-slate-50 text-slate-900 antialiased selection:bg-blue-600 selection:text-white`}>
        <Script id="pwa-early-install-capture" strategy="beforeInteractive">
          {`
            (function () {
              if (typeof window === 'undefined') return;
              window.__pwaInstallPrompt = null;
              window.addEventListener('beforeinstallprompt', function (e) {
                e.preventDefault();
                window.__pwaInstallPrompt = e;
                window.dispatchEvent(new CustomEvent('pwa-install-ready'));
              });
              window.addEventListener('appinstalled', function () {
                window.__pwaInstallPrompt = null;
                window.dispatchEvent(new CustomEvent('pwa-app-installed'));
              });
            })();
          `}
        </Script>
        <PwaProvider>
          <AdminAuthProvider>
            <FormProvider>
              {children}
              <PwaInstallPrompt />
            </FormProvider>
          </AdminAuthProvider>
        </PwaProvider>
      </body>
    </html>
  );
}
