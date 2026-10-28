import { neon } from '@neondatabase/serverless';

const connectionString = 'postgresql://neondb_owner:npg_hbad8wm9oYIT@ep-flat-band-b70xzvhu-pooler.c-13.us-east-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(connectionString);

async function run() {
  const cases = await sql`SELECT * FROM belhagh_cases`;
  for (const c of cases) {
    const dataObj = { ...c.data, caseCode: c.case_code };
    await sql`
      INSERT INTO form_submissions (id, form_id, tracking_code, mobile, data, status, payment_status, payment_amount, payment_ref_id, created_at)
      VALUES (${'sub-case-' + c.case_code}, 'form-belhagh-registration', ${c.case_code}, ${c.mobile}, ${JSON.stringify(dataObj)}, 'new', 'none', null, null, ${c.created_at})
      ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data
    `;
    console.log('Migrated case:', c.case_code);
  }
  const count = await sql`SELECT count(*) FROM form_submissions`;
  console.log('form_submissions count is now:', count[0].count);
}

run();
