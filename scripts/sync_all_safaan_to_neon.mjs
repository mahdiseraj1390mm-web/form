import fs from 'fs';
import { neon } from '@neondatabase/serverless';

const connectionString = process.env.DATABASE_URL ||
  'postgresql://neondb_owner:npg_hbad8wm9oYIT@ep-flat-band-b70xzvhu-pooler.c-13.us-east-1.aws.neon.tech/neondb?sslmode=require';

const sql = neon(connectionString);

async function main() {
  console.log('🚀 Loading safaanInitialSubmissions from src/lib/safaan-submissions.ts...');
  const fileContent = fs.readFileSync('src/lib/safaan-submissions.ts', 'utf8');
  const jsonPart = fileContent.replace(/^[\s\S]*?export const safaanInitialSubmissions: FormSubmission\[\] = /, '').replace(/;\s*$/, '');
  const submissions = JSON.parse(jsonPart);
  console.log(`📦 Loaded ${submissions.length} submissions.`);

  const batchSize = 50;
  let totalInserted = 0;

  for (let i = 0; i < submissions.length; i += batchSize) {
    const batch = submissions.slice(i, i + batchSize);
    
    // Build multi-row parameterized insert query
    // ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10), ($11, ...)
    const valuePlaceholders = [];
    const params = [];

    batch.forEach((s, idx) => {
      const baseIdx = idx * 10;
      valuePlaceholders.push(
        `($${baseIdx + 1}, $${baseIdx + 2}, $${baseIdx + 3}, $${baseIdx + 4}, $${baseIdx + 5}, $${baseIdx + 6}, $${baseIdx + 7}, $${baseIdx + 8}, $${baseIdx + 9}, $${baseIdx + 10})`
      );

      const trackingCode = s.trackingCode || s.data?.caseCode || s.data?.user_code || s.id;
      const mobile = s.data?.mobile || s.data?.f_mobile || s.data?.f_phone || null;
      const status = s.status || (s.evaluationResult?.isCritical ? 'reviewing' : 'approved');
      const fullData = {
        ...s.data,
        evaluationResult: s.evaluationResult,
        quizResult: s.quizResult,
        comments: s.comments || [],
        userIp: s.userIp || '185.143.232.19',
      };

      params.push(
        s.id,
        'form-safaan-assessment',
        trackingCode,
        mobile,
        JSON.stringify(fullData),
        status,
        s.paymentStatus || 'none',
        s.paymentAmount ? Number(s.paymentAmount) : null,
        s.paymentRefId || null,
        s.createdAt ? new Date(s.createdAt).toISOString() : new Date().toISOString()
      );
    });

    const query = `
      INSERT INTO form_submissions (id, form_id, tracking_code, mobile, data, status, payment_status, payment_amount, payment_ref_id, created_at)
      VALUES ${valuePlaceholders.join(', ')}
      ON CONFLICT (id) DO UPDATE SET
        tracking_code = EXCLUDED.tracking_code,
        mobile = EXCLUDED.mobile,
        data = EXCLUDED.data,
        status = EXCLUDED.status,
        payment_status = EXCLUDED.payment_status,
        created_at = EXCLUDED.created_at
    `;

    await sql.query(query, params);
    totalInserted += batch.length;
    process.stdout.write(`\r✅ Inserted ${totalInserted} / ${submissions.length} submissions...`);
  }

  console.log(`\n🎉 Done! Total ${totalInserted} Safaan submissions inserted/updated in Neon PostgreSQL.`);

  // Verify in DB
  const countRes = await sql`SELECT count(*) as total, count(CASE WHEN (data->'evaluationResult'->>'isCritical')::boolean = true THEN 1 END) as critical_count FROM form_submissions WHERE form_id = 'form-safaan-assessment'`;
  console.log('📊 Verification from Neon DB:', countRes[0]);

  // Check 84623
  const check84623 = await sql`SELECT id, tracking_code, status, data->'fullName' as name, data->'evaluationResult'->>'overallScore' as score, data->'evaluationResult'->>'isCritical' as is_crit FROM form_submissions WHERE tracking_code LIKE '%84623%'`;
  console.log('🔍 Check 84623 in Neon DB:', check84623);
}

main().catch((err) => {
  console.error('\n❌ Fatal error in migration:', err);
  process.exit(1);
});
