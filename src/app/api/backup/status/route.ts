import { NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const LOCAL_SUBMISSIONS_FILE = path.join(process.cwd(), 'data', 'submissions.json');

/**
 * اندپوینت وضعیت پایگاه‌داده و سلامت داده‌ها جهت پایش بک‌آپ‌ها
 * GET /api/backup/status
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const secretKey = process.env.BACKUP_SECRET_KEY || 'belhagh_backup_token_2026';

    const url = new URL(req.url);
    const token = url.searchParams.get('token') || authHeader.replace(/^Bearer\s+/i, '');

    // Allow monitoring without secret, or protect details if token mismatch
    const isAuthorized = !process.env.BACKUP_SECRET_KEY || token === secretKey;
    if (!isAuthorized && token) {
      return NextResponse.json({ success: false, error: 'دسترسی غیرمجاز' }, { status: 403 });
    }

    let casesCount = 0;
    let submissionsCount = 0;
    let latestSubmissionAt: string | null = null;
    let systemStatus = 'healthy';

    try {
      // Fetch counts from PostgreSQL database
      const [casesCountRow] = await sql`SELECT count(*)::int as count FROM belhagh_cases`;
      const [submissionsCountRow] = await sql`SELECT count(*)::int as count FROM form_submissions`;
      const [latestSubRow] = await sql`SELECT max(created_at) as latest_created_at FROM form_submissions`;

      casesCount = casesCountRow?.count || 0;
      submissionsCount = submissionsCountRow?.count || 0;
      latestSubmissionAt = latestSubRow?.latest_created_at || null;
    } catch (dbErr: any) {
      // فال‌بک شفاف به مخزن فایل محلی در صورت در دسترس نبودن موقت پایگاه‌داده
      systemStatus = 'local_storage_fallback';
      if (fs.existsSync(LOCAL_SUBMISSIONS_FILE)) {
        try {
          const raw = fs.readFileSync(LOCAL_SUBMISSIONS_FILE, 'utf8');
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            submissionsCount = parsed.length;
            const uniqueCases = new Set(parsed.map((s: any) => s.data?.caseCode || s.trackingCode).filter(Boolean));
            casesCount = uniqueCases.size;
            latestSubmissionAt = parsed[0]?.createdAt || null;
          }
        } catch {}
      }
    }

    const data = {
      status: systemStatus,
      timestamp: new Date().toISOString(),
      counts: {
        cases: casesCount,
        submissions: submissionsCount,
      },
      latest_submission_at: latestSubmissionAt,
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
        message: error?.message || 'خطا در بررسی وضعیت پشتیبان‌گیری',
      },
      { status: 500 }
    );
  }
}
