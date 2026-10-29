import { NextRequest, NextResponse } from 'next/server';
import { reconcilePendingDossiersNightly, extractClientProfiles } from '@/lib/user-similarity';
import { getFormSubmissionsFromDb, saveFormSubmissionToDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * کران‌جاب شبانه تطبیق هوشمند پرونده‌ها (Late-night Reconciliation Job)
 * هر شب در ساعات کم‌تردد (۰۲:۰۰ بامداد به وقت ایران) یا با فشردن دکمه دستی مدیر اجرا می‌شود.
 */
export async function GET(req: NextRequest) {
  try {
    const liveSubmissions = await getFormSubmissionsFromDb('all');
    const profiles = extractClientProfiles(liveSubmissions);
    const result = reconcilePendingDossiersNightly(liveSubmissions, profiles);

    // ذخیره سابمیشن‌های تغییریافته و پیوندخورده در پایگاه داده
    const toSave = result.changedSubmissions || result.updatedSubmissions.filter((s) => s.linkingStatus === 'linked' && s.reconciledAt);
    for (const sub of toSave) {
      await saveFormSubmissionToDb(sub);
    }

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
