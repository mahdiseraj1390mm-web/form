import type { Metadata, Viewport } from 'next';
import { Vazirmatn } from 'next/font/google';
import './globals.css';
import { FormProvider } from '@/context/form-context';
import { AdminAuthProvider } from '@/context/admin-auth-context';

const vazirmatn = Vazirmatn({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-vazirmatn',
});

export const metadata: Metadata = {
  title: 'سامانه خدمات روانشناسی بالحق',
  description: 'سامانه هوشمند ثبت پرونده و نوبت‌دهی مرکز مشاوره و روانشناسی بالحق',
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
    <html lang="fa" dir="rtl" className={`h-full ${vazirmatn.variable}`}>
      <body className="min-h-full flex flex-col font-['Vazirmatn',system-ui,sans-serif] bg-slate-50 text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
        <AdminAuthProvider>
          <FormProvider>
            {children}
          </FormProvider>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
