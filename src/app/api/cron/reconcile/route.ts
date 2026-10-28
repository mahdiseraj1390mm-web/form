import { NextRequest, NextResponse } from 'next/server';
import { reconcilePendingDossiersNightly, extractClientProfiles } from '@/lib/user-similarity';
import { allInitialSubmissions } from '@/context/form-context';

export const dynamic = 'force-dynamic';

/**
 * کران‌جاب شبانه تطبیق هوشمند پرونده‌ها (Late-night Reconciliation Job)
 * هر شب در ساعات کم‌تردد (مثلاً ۰۲:۰۰ بامداد) جهت اتصال پرونده‌های معلق یا بررسی‌نشده اجرا می‌شود.
 */
export async function GET(req: NextRequest) {
  try {
    const profiles = extractClientProfiles(allInitialSubmissions);
    const result = reconcilePendingDossiersNightly(allInitialSubmissions, profiles);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: 'پردازش تطبیق شبانه با موفقیت انجام شد.',
      reconciledCount: result.reconciledCount,
      logs: result.logs,
    });
  } catch (error: any) {
    console.error('Nightly cron reconciliation error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'خطا در اجرای فرآیند تطبیق شبانه',
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
