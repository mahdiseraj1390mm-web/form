import { neon } from '@neondatabase/serverless';

const connectionString = 'postgresql://neondb_owner:npg_hbad8wm9oYIT@ep-flat-band-b70xzvhu-pooler.c-13.us-east-1.aws.neon.tech/neondb?sslmode=require';
const sql = neon(connectionString);

async function check() {
  console.log('--- Checking belhagh_cases in Neon DB ---');
  const cases = await sql`SELECT * FROM belhagh_cases ORDER BY created_at DESC LIMIT 50`;
  console.log(`Total cases found: ${cases.length}`);
  for (const c of cases) {
    const str = JSON.stringify(c);
    if (str.includes('زینب') || str.includes('شوندي') || str.includes('شوندی') || str.includes('فلاح')) {
      console.log('MATCH in belhagh_cases:');
      console.log('Case Code:', c.case_code);
      console.log('Mobile:', c.mobile);
      console.log('First Name:', c.first_name);
      console.log('Last Name:', c.last_name);
      console.log('Province:', c.province);
      console.log('City:', c.city);
      console.log('Data:', JSON.stringify(c.data, null, 2));
      console.log('-----------------------------------');
    }
  }

  console.log('\n--- Checking form_submissions in Neon DB ---');
  const subs = await sql`SELECT * FROM form_submissions ORDER BY created_at DESC LIMIT 50`;
  console.log(`Total submissions found: ${subs.length}`);
  for (const s of subs) {
    const str = JSON.stringify(s);
    if (str.includes('زینب') || str.includes('شوندي') || str.includes('شوندی') || str.includes('فلاح')) {
      console.log('MATCH in form_submissions:');
      console.log('ID:', s.id);
      console.log('Form ID:', s.form_id);
      console.log('Tracking Code:', s.tracking_code);
      console.log('Mobile:', s.mobile);
      console.log('Data:', JSON.stringify(s.data, null, 2));
      console.log('-----------------------------------');
    }
  }
}

check().catch(console.error);
