import { NextRequest, NextResponse } from 'next/server';
import {
  getTeamMembersFromDb,
  saveTeamMembersToDb,
  deleteTeamMemberFromDb,
  resolveSessionActor,
} from '@/lib/team-store';
import { TeamMember } from '@/types/advanced';

const AUTH_COOKIE_NAME = 'belhagh_admin_session';

export async function GET() {
  try {
    const teamMembers = (await getTeamMembersFromDb()).map((m) => ({
      ...m,
      canEditWorkingHours: m.canEditWorkingHours === true,
    }));
    return NextResponse.json({ success: true, teamMembers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const actor = await resolveSessionActor(req.cookies.get(AUTH_COOKIE_NAME)?.value);
    if (!actor) {
      return NextResponse.json(
        { success: false, error: 'احراز هویت برای تغییر اطلاعات تیم الزامی است.' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const isAdminActor =
      actor.type === 'admin' ||
      (actor.type === 'member' &&
        (actor.member.role === 'super_admin' || actor.member.allowedTabs?.includes('settings')));

    // اگر کاربر غیرادمین (مشاور) باشد، تنها در صورت داشتن مجوز صریح می‌تواند فقط ساعت کاری خودش را ویرایش کند
    if (!isAdminActor && actor.type === 'member') {
      if (actor.member.canEditWorkingHours !== true) {
        return NextResponse.json(
          { success: false, error: 'شما مجوز تغییر ساعت کاری خود را ندارید.' },
          { status: 403 }
        );
      }

      if (body.action === 'updateOwnSchedule' && body.workingHours) {
        const current = await getTeamMembersFromDb();
        const updated = current.map((m) =>
          m.id === actor.member.id
            ? {
                ...m,
                workingHours: body.workingHours,
                topicWorkingHours: body.topicWorkingHours ?? body.workingHours?.topicSchedules,
              }
            : m
        );
        await saveTeamMembersToDb(updated);
        return NextResponse.json({ success: true, teamMembers: updated });
      }

      if (Array.isArray(body.teamMembers)) {
        const incomingSelf = (body.teamMembers as Array<Partial<TeamMember> | null | undefined>).find(
          (m) => m?.id === actor.member.id
        );
        if (!incomingSelf) {
          return NextResponse.json(
            { success: false, error: 'دسترسی غیرمجاز برای تغییر سایر اعضا.' },
            { status: 403 }
          );
        }
        const current = await getTeamMembersFromDb();
        const updated = current.map((m) =>
          m.id === actor.member.id
            ? {
                ...m,
                workingHours: incomingSelf.workingHours,
                topicWorkingHours: incomingSelf.topicWorkingHours,
              }
            : m
        );
        await saveTeamMembersToDb(updated);
        return NextResponse.json({ success: true, teamMembers: updated });
      }

      return NextResponse.json(
        { success: false, error: 'عملیات فقط برای مدیر سامانه مجاز است.' },
        { status: 403 }
      );
    }

    if (body.action === 'delete' && body.id) {
      const updated = await deleteTeamMemberFromDb(body.id);
      return NextResponse.json({ success: true, teamMembers: updated });
    }

    if (Array.isArray(body.teamMembers)) {
      await saveTeamMembersToDb(body.teamMembers);
      const saved = await getTeamMembersFromDb();
      return NextResponse.json({ success: true, teamMembers: saved });
    }

    if (body.action === 'upsert' && body.member) {
      const current = await getTeamMembersFromDb();
      const member: TeamMember = body.member;
      const idx = current.findIndex((m) => m.id === member.id);
      let updated: TeamMember[];
      if (idx !== -1) {
        updated = [...current];
        updated[idx] = { ...updated[idx], ...member };
      } else {
        updated = [member, ...current];
      }
      await saveTeamMembersToDb(updated);
      const saved = await getTeamMembersFromDb();
      return NextResponse.json({ success: true, teamMembers: saved });
    }

    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
