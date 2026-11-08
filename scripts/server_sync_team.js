const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://belhagh:belhagh@2026!secure@127.0.0.1:5432/belhagh_db'
});

async function main() {
  const filePath = path.join(__dirname, '..', 'data', 'team_members.json');
  console.log('Reading:', filePath);
  const raw = fs.readFileSync(filePath, 'utf8');
  const members = JSON.parse(raw);
  console.log(`Found ${members.length} members in team_members.json`);

  // حذف کاربران تستی و نمونه قدیمی از پایگاه داده
  await pool.query("DELETE FROM team_members WHERE id IN ('user-booking-op', 'user-reviewer')");

  const validIds = members.map((m) => m.id);
  if (validIds.length > 0) {
    await pool.query("DELETE FROM team_members WHERE NOT (id = ANY($1::varchar[]))", [validIds]);
  }

  for (const m of members) {
    const mob = m.mobileNumber || m.mobile || m.username || '';
    const user = m.username || mob;
    const name = m.name || '';
    const dataJson = JSON.stringify(m);

    await pool.query(
      `INSERT INTO team_members (id, mobile, username, name, data, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (id) DO UPDATE SET
         mobile = EXCLUDED.mobile,
         username = EXCLUDED.username,
         name = EXCLUDED.name,
         data = EXCLUDED.data,
         updated_at = CURRENT_TIMESTAMP`,
      [m.id, mob, user, name, dataJson]
    );
    console.log(`✓ Upserted: [${m.id}] ${name} (${mob})`);
  }

  const res = await pool.query('SELECT id, name, mobile, username FROM team_members ORDER BY id');
  console.log(`\nVerification: PostgreSQL team_members now has ${res.rows.length} rows:`);
  for (const r of res.rows) {
    console.log(` - ${r.id}: ${r.name} | ${r.mobile} | user: ${r.username}`);
  }

  await pool.end();
  console.log('\nPostgreSQL team sync complete!');
}

main().catch((err) => {
  console.error('Sync failed:', err);
  process.exit(1);
});
