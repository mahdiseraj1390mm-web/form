import { NextRequest, NextResponse } from 'next/server';

const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'belhagh@12345';
const AUTH_COOKIE_NAME = 'belhagh_admin_session';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password, rememberMe } = body || {};

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'لطفاً نام کاربری و کلمه عبور را وارد کنید.' },
        { status: 400 }
      );
    }

    if (username.trim() !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return NextResponse.json(
        { success: false, error: 'نام کاربری یا کلمه عبور وارد شده اشتباه است.' },
        { status: 401 }
      );
    }

    // تولید توکن جلسه
    const token = Buffer.from(`${ADMIN_USERNAME}:${Date.now()}:belhagh_secret_token`).toString('base64');
    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // 30 روز در صورت مرا به خاطر بسپار، یا 24 ساعت

    const response = NextResponse.json({
      success: true,
      user: {
        username: ADMIN_USERNAME,
        name: 'مدیر ارشد سامانه',
        role: 'super_admin',
      },
    });

    response.cookies.set({
      name: AUTH_COOKIE_NAME,
      value: token,
      httpOnly: false, // اجازه خواندن امن در کلاینت برای همگام‌سازی استیت
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    return response;
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'خطای سرور' },
      { status: 500 }
    );
  }
}
