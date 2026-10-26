import type { Metadata, Viewport } from 'next';
import './globals.css';
import { FormProvider } from '@/context/form-context';

export const metadata: Metadata = {
  title: 'فرم‌افزار سازمانی | سامانه جامع فرم‌ساز، آزمون‌ساز و گردش کار هوشمند',
  description: 'پلتفرم حرفه‌ای، امن و پیشرفته ساخت انواع فرم‌های سازمانی، آزمون‌های آنلاین، فاکتورساز و رزرو نوبت با طراحی اختصاصی و اتصال به درگاه بانکی شاپرک',
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
    <html lang="fa" dir="rtl" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="min-h-full flex flex-col font-['Vazirmatn',system-ui,sans-serif] bg-slate-50 text-slate-900 antialiased selection:bg-blue-600 selection:text-white">
        <FormProvider>
          {children}
        </FormProvider>
      </body>
    </html>
  );
}
