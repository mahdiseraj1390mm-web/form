import { neon } from '@neondatabase/serverless';
import fs from 'fs';

const sql = neon('postgresql://neondb_owner:npg_hbad8wm9oYIT@ep-flat-band-b70xzvhu-pooler.c-13.us-east-1.aws.neon.tech/neondb?sslmode=require');

async function test() {
  console.log('--- Fetching submissions from Neon DB ---');
  const subs = await sql`SELECT * FROM form_submissions ORDER BY created_at DESC LIMIT 3000`;
  console.log('Total submissions fetched:', subs.length);

  // Find Zeinab Shovandi
  const shovandi = subs.find(s => s.data?.f_family === 'شوندی' || s.data?.fullName?.includes('شوندی'));
  console.log('Shovandi submission:', shovandi ? { id: shovandi.id, code: shovandi.tracking_code, caseCode: shovandi.data?.caseCode, linkingStatus: shovandi.data?.linkingStatus, data: shovandi.data } : 'Not found');

  // Find Safa 34340
  const safa34340 = subs.find(s => s.tracking_code === 'SF-34340' || s.data?.user_code === '34340');
  console.log('Safa 34340 submission:', safa34340 ? { id: safa34340.id, code: safa34340.tracking_code, caseCode: safa34340.data?.caseCode, data: safa34340.data } : 'Not found');

  // Find Zeinab Fallah
  const fallah = subs.find(s => s.data?.f_family === 'فلاح' || s.data?.fullName?.includes('فلاح'));
  console.log('Fallah submission:', fallah ? { id: fallah.id, code: fallah.tracking_code, caseCode: fallah.data?.caseCode } : 'Not found');

  // Find Safa 99988
  const safa99988 = subs.find(s => s.tracking_code === 'SF-99988' || s.data?.user_code === '99988');
  console.log('Safa 99988 submission:', safa99988 ? { id: safa99988.id, code: safa99988.tracking_code, caseCode: safa99988.data?.caseCode } : 'Not found');
}

test().catch(console.error);
