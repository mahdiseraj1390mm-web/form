import { NextRequest, NextResponse } from 'next/server';
import { findTeamMemberByCredentials, AVAILABLE_SIDEBAR_TABS } from '@/lib/team-store';

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

    // ۱. بررسی لاگین مدیر کل (Super Admin)
    if (cleanUsername === ADMIN_USERNAME && cleanPassword === ADMIN_PASSWORD) {
      const token = Buffer.from(`${ADMIN_USERNAME}:${Date.now()}:belhagh_secret_token`).toString('base64');
      const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;

      const allTabs = AVAILABLE_SIDEBAR_TABS.map((t) => t.id);

      const response = NextResponse.json({
        success: true,
        user: {
          id: 'admin',
          username: ADMIN_USERNAME,
          name: 'مدیر ارشد سامانه',
          role: 'super_admin',
          isSuperAdmin: true,
          allowedTabs: allTabs,
          requireCaseCode: false,
        },
      });

      response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: token,
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
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

      const userAllowedTabs = Array.isArray(member.allowedTabs) && member.allowedTabs.length > 0
        ? member.allowedTabs
        : ['submissions'];

      const response = NextResponse.json({
        success: true,
        user: {
          id: member.id,
          username: member.mobile || member.username,
          name: member.name,
          mobile: member.mobile,
          role: member.role || 'member',
          jobTitle: member.jobTitle,
          isSuperAdmin: false,
          allowedTabs: userAllowedTabs,
          requireCaseCode: member.requireCaseCode !== undefined ? member.requireCaseCode : true,
        },
      });

      response.cookies.set({
        name: AUTH_COOKIE_NAME,
        value: token,
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
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
