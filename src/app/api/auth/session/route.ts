import { NextRequest, NextResponse } from 'next/server';
import { getTeamMembersFromDb, AVAILABLE_SIDEBAR_TABS } from '@/lib/team-store';

const AUTH_COOKIE_NAME = 'belhagh_admin_session';

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(AUTH_COOKIE_NAME);

  if (cookie && cookie.value && cookie.value.length > 5) {
    try {
      const decoded = Buffer.from(cookie.value, 'base64').toString('utf8');
      
      // اگر جلسه مدیر ارشد باشد
      if (decoded.startsWith('admin:')) {
        const allTabs = AVAILABLE_SIDEBAR_TABS.map((t) => t.id);
        return NextResponse.json({
          authenticated: true,
          user: {
            id: 'admin',
            username: 'admin',
            name: 'مدیر ارشد سامانه',
            role: 'super_admin',
            isSuperAdmin: true,
            allowedTabs: allTabs,
            requireCaseCode: false,
          },
        });
      }

      // اگر جلسه یکی از اعضای تیم باشد
      if (decoded.startsWith('member:')) {
        const parts = decoded.split(':');
        const memberId = parts[1];
        if (memberId) {
          const members = await getTeamMembersFromDb();
          const member = members.find((m) => m.id === memberId);
          if (member && member.status === 'active') {
            return NextResponse.json({
              authenticated: true,
              user: {
                id: member.id,
                username: member.mobile || member.username,
                name: member.name,
                mobile: member.mobile,
                role: member.role || 'member',
                jobTitle: member.jobTitle,
                isSuperAdmin: false,
                allowedTabs: member.allowedTabs || ['submissions'],
                requireCaseCode: member.requireCaseCode !== undefined ? member.requireCaseCode : true,
              },
            });
          }
        }
      }
    } catch {
      // در صورت خطای دیکود توکن
    }
  }

  return NextResponse.json({ authenticated: false });
}
