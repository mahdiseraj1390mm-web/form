import { NextRequest, NextResponse } from 'next/server';
import {
  resolveSessionActor,
  buildSuperAdminSessionUser,
  buildMemberSessionUser,
} from '@/lib/team-store';

const AUTH_COOKIE_NAME = 'belhagh_admin_session';

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(AUTH_COOKIE_NAME);
  const actor = await resolveSessionActor(cookie?.value);

  if (actor?.type === 'admin') {
    return NextResponse.json({
      authenticated: true,
      user: buildSuperAdminSessionUser(),
    });
  }

  if (actor?.type === 'member') {
    return NextResponse.json({
      authenticated: true,
      user: buildMemberSessionUser(actor.member),
    });
  }

  return NextResponse.json({ authenticated: false });
}
