const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');
const { buildConsultantConfigMap } = require('./update_all_consultant_schedules');

const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || 'postgresql://belhagh:belhagh@2026!secure@127.0.0.1:5432/belhagh_db',
});

async function main() {
  const client = await pool.connect();
  try {
    // ۱. خواندن وضعیت زنده تیم از PostgreSQL برای حفظ ویرایش‌های مدیر (نام‌ها، تب‌ها، دسترسی‌ها)
    const teamRes = await client.query('SELECT id, data FROM team_members ORDER BY updated_at DESC');
    const liveMembers = teamRes.rows
      .map((r) => (typeof r.data === 'string' ? JSON.parse(r.data) : r.data))
      .filter((m) => m && m.id !== 'user-admin' && m.id !== 'user-booking-op' && m.id !== 'user-reviewer');

    // اگر در دیتابیس آقای برهانی روزهای کاری خاص (مثل [0,1,2]) تنظیم شده، همان در هر دو موضوع اعمال شود
    const liveBorhani = liveMembers.find((m) => m.id === 'user-counselor-borhani');
    const borhaniDays =
      Array.isArray(liveBorhani?.workingHours?.availableDays) &&
      liveBorhani.workingHours.availableDays.length > 0
        ? liveBorhani.workingHours.availableDays
        : [0, 1, 2, 3, 4];

    console.log('Borhani preserved live availableDays:', borhaniDays);
    const SCHEDULES_MAP = buildConsultantConfigMap(borhaniDays);

    const updatedMembers = [];
    for (const member of liveMembers) {
      const conf = SCHEDULES_MAP[member.id];
      const nextMember = {
        ...member,
        canEditWorkingHours: member.canEditWorkingHours === true,
      };
      if (conf) {
        nextMember.allowedTopics = conf.allowedTopics;
        nextMember.workingHours = conf.workingHours;
        nextMember.topicWorkingHours = conf.topicWorkingHours;
      }
      updatedMembers.push(nextMember);

      const mob = nextMember.mobileNumber || nextMember.mobile || nextMember.username || '';
      const user = nextMember.username || mob;
      await client.query(
        `INSERT INTO team_members (id, mobile, username, name, data, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET
           mobile = EXCLUDED.mobile,
           username = EXCLUDED.username,
           name = EXCLUDED.name,
           data = EXCLUDED.data,
           updated_at = CURRENT_TIMESTAMP`,
        [nextMember.id, mob, user, nextMember.name || '', JSON.stringify(nextMember)]
      );
      console.log(
        `✓ DB team_members updated: [${nextMember.id}] ${nextMember.name} | topics=${JSON.stringify(
          nextMember.allowedTopics
        )} | topicKeys=${JSON.stringify(Object.keys(nextMember.workingHours?.topicSchedules || {}))}`
      );
    }

    // همگام‌سازی فایل آینه‌ای data/team_members.json روی سرور
    const teamJsonPath = path.join(process.cwd(), 'data', 'team_members.json');
    fs.writeFileSync(teamJsonPath, JSON.stringify(updatedMembers, null, 2), 'utf8');
    console.log('✓ Mirrored clean team_members to data/team_members.json');

    // ۲. به‌روزرسانی فرم رزرو نوبت در جدول forms با حفظ سایر تنظیمات زنده
    const formRes = await client.query('SELECT id, data FROM forms WHERE id = $1', [
      'form-belhagh-booking',
    ]);
    if (formRes.rows.length > 0) {
      const formObj =
        typeof formRes.rows[0].data === 'string'
          ? JSON.parse(formRes.rows[0].data)
          : formRes.rows[0].data;

      const fBooking = Array.isArray(formObj.fields)
        ? formObj.fields.find((f) => f.id === 'f_booking')
        : null;

      if (fBooking && fBooking.appointmentData) {
        fBooking.appointmentData.selectedConsultants = updatedMembers.map((m) => {
          const conf = SCHEDULES_MAP[m.id];
          const hasDays =
            (Array.isArray(m.workingHours?.availableDays) && m.workingHours.availableDays.length > 0) ||
            Object.values(m.workingHours?.topicSchedules || {}).some(
              (ts) => Array.isArray(ts?.availableDays) && ts.availableDays.length > 0
            );
          return {
            consultantId: m.id,
            consultantName: m.name,
            genderPrefix: m.genderPrefix || (m.name.startsWith('خانم') ? 'خانم' : 'آقا'),
            enabled: conf ? conf.enabled : m.status === 'active' && hasDays,
            enabledTopics: m.allowedTopics || [],
            customWorkingHours: m.workingHours,
            topicSchedules: m.topicWorkingHours || {},
          };
        });

        await client.query(
          `UPDATE forms SET data = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [JSON.stringify(formObj), 'form-belhagh-booking']
        );
        console.log('✓ DB forms updated for form-belhagh-booking');

        // آینه‌سازی در data/forms.json روی سرور
        const formsJsonPath = path.join(process.cwd(), 'data', 'forms.json');
        if (fs.existsSync(formsJsonPath)) {
          const fileForms = JSON.parse(fs.readFileSync(formsJsonPath, 'utf8'));
          const idx = fileForms.findIndex((x) => x.id === 'form-belhagh-booking');
          if (idx !== -1) {
            fileForms[idx] = formObj;
            fs.writeFileSync(formsJsonPath, JSON.stringify(fileForms, null, 2), 'utf8');
            console.log('✓ Mirrored form-belhagh-booking to data/forms.json');
          }
        }
      }
    }
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
