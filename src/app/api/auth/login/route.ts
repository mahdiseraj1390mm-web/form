import { NextRequest, NextResponse } from 'next/server';
import {
  findTeamMemberByCredentials,
  buildSuperAdminSessionUser,
  buildMemberSessionUser,
} from '@/lib/team-store';

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

    const cleanUsername = String(username).trim();
    const cleanPassword = String(password).trim();
    const isHttps =
      req.nextUrl.protocol === 'https:' ||
      req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() === 'https';

    // ۱. بررسی لاگین مدیر کل (Super Admin)
    if (cleanUsername === ADMIN_USERNAME && cleanPassword === ADMIN_PASSWORD) {
      const token = Buffer.from(`${ADMIN_USERNAME}:${Date.now()}:belhagh_secret_token`).toString('base64');
      const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;

      const response = NextResponse.json({
        success: true,
        user: buildSuperAdminSessionUser(),
      });

      response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: token,
        httpOnly: false,
        secure: isHttps,
        sameSite: 'lax',
        path: '/',
        maxAge,
      });

      return response;
    }

    // ۲. بررسی لاگین اعضای تیم با شماره تلفن و رمز عبور تعیین شده توسط ادمین
    const member = await findTeamMemberByCredentials(cleanUsername, cleanPassword);

    if (member) {
      if (member.status === 'suspended') {
        return NextResponse.json(
          { success: false, error: 'حساب کاربری شما معلق یا غیرفعال شده است. لطفاً با مدیر سیستم هماهنگ فرمایید.' },
          { status: 403 }
        );
      }

      const token = Buffer.from(`member:${member.id}:${Date.now()}:belhagh_secret_token`).toString('base64');
      const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;

      const response = NextResponse.json({
        success: true,
        user: buildMemberSessionUser(member),
      });

      response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: token,
        httpOnly: false,
        secure: isHttps,
        sameSite: 'lax',
        path: '/',
        maxAge,
      });

      return response;
    }

    // ۳. در صورت عدم تطابق مشخصات
    return NextResponse.json(
      { success: false, error: 'نام کاربری (شماره تلفن) یا کلمه عبور وارد شده اشتباه است.' },
      { status: 401 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message || 'خطای سرور' },
      { status: 500 }
    );
  }
}
