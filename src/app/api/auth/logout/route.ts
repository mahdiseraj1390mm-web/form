import { NextResponse } from 'next/server';

const AUTH_COOKIE_NAME = 'belhagh_admin_session';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'خروج موفقیت‌آمیز بود' });

  response.cookies.set({
    name: AUTH_COOKIE_NAME,
    value: '',
    path: '/',
    maxAge: 0,
  });

  return response;
}
