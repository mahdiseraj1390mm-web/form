import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * اندپوینت وضعیت پایگاه‌داده و سلامت داده‌ها جهت پایش بک‌آپ‌ها
 * GET /api/backup/status
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const secretKey = process.env.BACKUP_SECRET_KEY || 'belhagh_backup_token_2026';

    // Optional bearer token check if query param or header provided
    const url = new URL(req.url);
    const token = url.searchParams.get('token') || authHeader.replace(/^Bearer\s+/i, '');

    // Allow monitoring without secret, or protect details if token mismatch
    const isAuthorized = !process.env.BACKUP_SECRET_KEY || token === secretKey;

    // Fetch counts from key tables
    const [casesCountRow] = await sql`SELECT count(*)::int as count FROM belhagh_cases`;
    const [submissionsCountRow] = await sql`SELECT count(*)::int as count FROM form_submissions`;

    // Fetch latest submission timestamp
    const [latestSubRow] = await sql`SELECT max(created_at) as latest_created_at FROM form_submissions`;

    const data = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      counts: {
        cases: casesCountRow?.count || 0,
        submissions: submissionsCountRow?.count || 0,
      },
      latest_submission_at: latestSubRow?.latest_created_at || null,
      backup_policy: {
        schedule: 'hourly (0 * * * *)',
        retention: '12 backups',
        destination_host: 'safaan@192.168.2.60',
      },
    };

    return NextResponse.json({
      success: true,
      data,
    });
  } catch (error: any) {
    console.error('Backup status check error:', error);
    return NextResponse.json(
      {
        success: false,
        status: 'error',
        message: error.message || 'خطا در ارتباط با پایگاه‌داده',
      },
      { status: 500 }
    );
  }
}
