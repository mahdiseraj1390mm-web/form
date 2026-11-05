import fs from 'fs/promises';
import path from 'path';
import { TeamMember } from '@/types/advanced';
import { 
  AVAILABLE_SIDEBAR_TABS, 
  DEFAULT_INITIAL_TEAM_MEMBERS, 
  normalizeMobileNumber 
} from '@/lib/team-constants';

export { AVAILABLE_SIDEBAR_TABS, DEFAULT_INITIAL_TEAM_MEMBERS, normalizeMobileNumber };

const DATA_DIR = path.join(process.cwd(), 'data');
const TEAM_MEMBERS_FILE = path.join(DATA_DIR, 'team_members.json');

export async function getTeamMembersFromDb(): Promise<TeamMember[]> {
  try {
    await fs.mkdir(DATA_DIR, { recursive: true });
    const content = await fs.readFile(TEAM_MEMBERS_FILE, 'utf8');
    const parsed = JSON.parse(content);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((m: any) => ({
        ...m,
        allowedTabs: Array.isArray(m.allowedTabs) ? m.allowedTabs : ['submissions'],
        requireCaseCode: m.requireCaseCode !== undefined ? m.requireCaseCode : true,
      }));
    }
  } catch {
    // در صورتی که فایل وجود نداشته باشد، با اعضای پیش‌فرض ایجاد می‌شود
  }

  try {
    await saveTeamMembersToDb(DEFAULT_INITIAL_TEAM_MEMBERS);
  } catch (e) {
    console.warn('Could not initialize team members file:', e);
  }

  return DEFAULT_INITIAL_TEAM_MEMBERS;
}

export async function saveTeamMembersToDb(members: TeamMember[]): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(TEAM_MEMBERS_FILE, JSON.stringify(members, null, 2), 'utf8');
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
