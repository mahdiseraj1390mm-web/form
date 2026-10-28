/**
 * اسکریپت پاکسازی داده‌های آزمایشی از جداول Neon PostgreSQL
 * اجرا: node scripts/purge-test-data.mjs
 */
import { neon } from '@neondatabase/serverless';

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_hbad8wm9oYIT@ep-flat-band-b70xzvhu-pooler.c-13.us-east-1.aws.neon.tech/neondb?sslmode=require';

const sql = neon(connectionString);

async function purgeTestData() {
  console.log('🗑️  شروع پاکسازی داده‌های آزمایشی...');

  try {
    const result1 = await sql.query('TRUNCATE TABLE form_submissions RESTART IDENTITY CASCADE');
    console.log('✅ جدول form_submissions پاکسازی شد');
  } catch (err) {
    console.error('❌ خطا در پاکسازی form_submissions:', err.message);
  }

  try {
    const result2 = await sql.query('TRUNCATE TABLE belhagh_cases RESTART IDENTITY CASCADE');
    console.log('✅ جدول belhagh_cases پاکسازی شد');
  } catch (err) {
    console.error('❌ خطا در پاکسازی belhagh_cases:', err.message);
  }

  console.log('🏁 پاکسازی کامل شد');
  process.exit(0);
}

purgeTestData().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
