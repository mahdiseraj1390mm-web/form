import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_hbad8wm9oYIT@ep-flat-band-b70xzvhu-pooler.c-13.us-east-1.aws.neon.tech/neondb?sslmode=require');
const res = await sql`SELECT form_id, count(*) FROM form_submissions GROUP BY form_id`;
console.log('Submissions per form in Neon DB:');
console.log(res);
