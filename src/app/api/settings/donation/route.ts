import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DONATION_SETTINGS_FILE = path.join(process.cwd(), 'data', 'donation_settings.json');

const DEFAULT_SETTINGS = {
  enabled: true,
  cardNumber: '6037-9979-1234-5678',
  cardHolder: 'مرکز خدمات روانشناسی بالحق',
  bankKey: 'melli',
  title: 'مشارکت مالی اختیاری در هزینه‌های مرکز (اختیاری)',
  description: 'در صورت تمایل، می‌توانید مبلغی را به عنوان هدیه یا مشارکت اختیاری واریز فرمایید',
};

export async function GET() {
  try {
    if (fs.existsSync(DONATION_SETTINGS_FILE)) {
      const raw = fs.readFileSync(DONATION_SETTINGS_FILE, 'utf8');
      const settings = JSON.parse(raw);
      return NextResponse.json({ success: true, settings: { ...DEFAULT_SETTINGS, ...settings } });
    }
    return NextResponse.json({ success: true, settings: DEFAULT_SETTINGS });
  } catch (err: any) {
    return NextResponse.json({ success: true, settings: DEFAULT_SETTINGS });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let current = DEFAULT_SETTINGS;
    if (fs.existsSync(DONATION_SETTINGS_FILE)) {
      try {
        current = JSON.parse(fs.readFileSync(DONATION_SETTINGS_FILE, 'utf8'));
      } catch {}
    }

    const updated = {
      ...current,
      ...body,
    };

    const dir = path.dirname(DONATION_SETTINGS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DONATION_SETTINGS_FILE, JSON.stringify(updated, null, 2), 'utf8');

    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
