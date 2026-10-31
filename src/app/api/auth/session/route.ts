import { NextRequest, NextResponse } from 'next/server';

const AUTH_COOKIE_NAME = 'belhagh_admin_session';

export async function GET(req: NextRequest) {
  const cookie = req.cookies.get(AUTH_COOKIE_NAME);

  if (cookie && cookie.value && cookie.value.length > 10) {
    return NextResponse.json({
      authenticated: true,
      user: {
        username: 'admin',
        name: 'مدیر ارشد سامانه',
        role: 'super_admin',
      },
    });
  }

  return NextResponse.json({ authenticated: false });
}
