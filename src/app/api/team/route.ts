import { NextRequest, NextResponse } from 'next/server';
import { getTeamMembersFromDb, saveTeamMembersToDb, deleteTeamMemberFromDb } from '@/lib/team-store';
import { TeamMember } from '@/types/advanced';

export async function GET() {
  try {
    const teamMembers = await getTeamMembersFromDb();
    return NextResponse.json({ success: true, teamMembers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (body.action === 'delete' && body.id) {
      const updated = await deleteTeamMemberFromDb(body.id);
      return NextResponse.json({ success: true, teamMembers: updated });
    }

    if (Array.isArray(body.teamMembers)) {
      await saveTeamMembersToDb(body.teamMembers);
      return NextResponse.json({ success: true, teamMembers: body.teamMembers });
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
      return NextResponse.json({ success: true, teamMembers: updated });
    }

    return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
