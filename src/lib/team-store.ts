import fs from 'fs/promises';
import path from 'path';
import { TeamMember } from '@/types/advanced';
import { 
  AVAILABLE_SIDEBAR_TABS, 
  DEFAULT_INITIAL_TEAM_MEMBERS, 
  normalizeMobileNumber 
} from '@/lib/team-constants';
import { sql } from '@/lib/db';

export { AVAILABLE_SIDEBAR_TABS, DEFAULT_INITIAL_TEAM_MEMBERS, normalizeMobileNumber };

const DATA_DIR = path.join(process.cwd(), 'data');
const TEAM_MEMBERS_FILE = path.join(DATA_DIR, 'team_members.json');

/**
 * ایجاد جدول team_members در پایگاه داده PostgreSQL در صورت عدم وجود
 */
async function ensureDbTable(): Promise<boolean> {
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS team_members (
        id VARCHAR(255) PRIMARY KEY,
        mobile VARCHAR(50),
        username VARCHAR(100),
        name TEXT,
        data JSONB,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `;
    return true;
  } catch {
    return false;
  }
}

/**
 * ذخیره اعضا در دیتابیس PostgreSQL
 */
async function saveTeamMembersToPostgres(members: TeamMember[]): Promise<void> {
  try {
    const isReady = await ensureDbTable();
    if (!isReady) return;

    const currentIds = members.map((m) => m.id);
    if (currentIds.length > 0) {
      await sql(
        `DELETE FROM team_members WHERE NOT (id = ANY($1))`,
        [currentIds]
      );
    } else {
      await sql`DELETE FROM team_members`;
    }

    for (const m of members) {
      await sql(
        `INSERT INTO team_members (id, mobile, username, name, data, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
         ON CONFLICT (id) DO UPDATE SET
           mobile = EXCLUDED.mobile,
           username = EXCLUDED.username,
           name = EXCLUDED.name,
           data = EXCLUDED.data,
           updated_at = CURRENT_TIMESTAMP`,
        [m.id, m.mobile, m.username || m.mobile, m.name, JSON.stringify(m)]
      );
    }
  } catch (err) {
    console.warn('PostgreSQL saveTeamMembers error:', err);
  }
}

/**
 * واکشی اعضای تیم با اولویت پایگاه داده PostgreSQL و فال‌بک فایل پایدار
 */
export async function getTeamMembersFromDb(): Promise<TeamMember[]> {
  // ۱. اولویت اول: واکشی از پایگاه داده PostgreSQL
  try {
    const isReady = await ensureDbTable();
    if (isReady) {
      const rows = await sql`SELECT data FROM team_members ORDER BY updated_at DESC`;
      if (rows && Array.isArray(rows) && rows.length > 0) {
        const members: TeamMember[] = rows.map((r: any) =>
          typeof r.data === 'string' ? JSON.parse(r.data) : r.data
        );
        // پشتیبان‌گیری در فایل محلی
        await fs.mkdir(DATA_DIR, { recursive: true });
        await fs.writeFile(TEAM_MEMBERS_FILE, JSON.stringify(members, null, 2), 'utf8');
        return members;
      }
    }
  } catch (err) {
    console.warn('PostgreSQL getTeamMembers error, using local fallback:', err);
  }

  // ۲. اولویت دوم: بارگذاری از مخزن پایدار سرور (team_members.json)
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const content = await fs.readFile(TEAM_MEMBERS_FILE, 'utf8');
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const mapped = parsed.map((m: any) => ({
        ...m,
        allowedTabs: Array.isArray(m.allowedTabs) ? m.allowedTabs : ['submissions'],
        requireCaseCode: m.requireCaseCode !== undefined ? m.requireCaseCode : true,
      }));
      // ذخیره در PostgreSQL در پس‌زمینه
      saveTeamMembersToPostgres(mapped).catch(() => {});
      return mapped;
    }
  } catch {
    // فایل وجود ندارد
  }

  // ۳. اولویت سوم: مقداردهی اولیه با اعضای پیش‌فرض
  try {
    await saveTeamMembersToDb(DEFAULT_INITIAL_TEAM_MEMBERS);
  } catch (e) {
    console.warn('Could not initialize team members file:', e);
  }

  return DEFAULT_INITIAL_TEAM_MEMBERS;
}

/**
 * ذخیره اعضای تیم در دیتابیس و فایل محلی به صورت همزمان
 */
export async function saveTeamMembersToDb(members: TeamMember[]): Promise<void> {
  // ۱. ذخیره بی‌درنگ در فایل پایدار سرور
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(TEAM_MEMBERS_FILE, JSON.stringify(members, null, 2), 'utf8');

  // ۲. ذخیره در پایگاه داده PostgreSQL
  try {
    await saveTeamMembersToPostgres(members);
  } catch (err) {
    console.warn('Failed to sync team members to Postgres:', err);
  }
}

export async function findTeamMemberByCredentials(
  usernameOrPhone: string,
  password?: string
): Promise<TeamMember | null> {
  const members = await getTeamMembersFromDb();
  const cleanInput = (usernameOrPhone || '').trim().toLowerCase();
  const cleanPhone = normalizeMobileNumber(usernameOrPhone);

  const matched = members.find((m) => {
    const mPhone = normalizeMobileNumber(m.mobile || '');
    const mUsername = (m.username || '').trim().toLowerCase();

    const matchesIdentity =
      (cleanPhone && mPhone === cleanPhone) ||
      (mUsername && mUsername === cleanInput) ||
      (m.mobile && m.mobile.trim() === usernameOrPhone.trim());

    if (!matchesIdentity) return false;

    if (password !== undefined) {
      return m.password === password;
    }

    return true;
  });

  return matched || null;
}
