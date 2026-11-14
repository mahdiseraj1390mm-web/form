import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { CounselingTopicOption } from '@/lib/consultant-helpers';

const TOPICS_FILE = path.join(process.cwd(), 'data', 'counseling_topics.json');

const DEFAULT_TOPICS: CounselingTopicOption[] = [
  { id: 'child', name: 'مشاوره کودک', keywords: ['کودک'], description: 'پرونده‌ها و نوبت‌های تخصصی کودک', isDefault: true },
  { id: 'teen', name: 'مشاوره نوجوان', keywords: ['نوجوان'], description: 'پرونده‌ها و نوبت‌های تخصصی نوجوان', isDefault: true },
  { id: 'education', name: 'مشاوره تحصیلی', keywords: ['تحصیلی'], description: 'برنامه‌ریزی و هدایت تحصیلی', isDefault: true },
  { id: 'clinical', name: 'مشاوره بالینی و روان‌درمانی', keywords: ['بالینی', 'روان‌درمانی', 'فردی'], description: 'اضطراب، افسردگی و درمان‌های بالینی', isDefault: true },
  { id: 'family', name: 'مشاوره ازدواج و خانواده', keywords: ['خانواده', 'ازدواج', 'زوجین', 'زوج'], description: 'مشاوره پیش از ازدواج، زوج‌درمانی و خانواده', isDefault: true },
];

export async function GET() {
  try {
    if (fs.existsSync(TOPICS_FILE)) {
      const raw = fs.readFileSync(TOPICS_FILE, 'utf8');
      const topics = JSON.parse(raw);
      if (Array.isArray(topics) && topics.length > 0) {
        return NextResponse.json({ success: true, topics });
      }
    }
    return NextResponse.json({ success: true, topics: DEFAULT_TOPICS });
  } catch (err: any) {
    return NextResponse.json({ success: true, topics: DEFAULT_TOPICS, error: err.message });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let topicsToSave: CounselingTopicOption[] = [];

    if (Array.isArray(body.topics)) {
      topicsToSave = body.topics;
    } else if (Array.isArray(body)) {
      topicsToSave = body;
    } else if (body.action === 'reset') {
      topicsToSave = DEFAULT_TOPICS;
    } else {
      return NextResponse.json({ success: false, error: 'آرایه موضوعات نامعتبر است.' }, { status: 400 });
    }

    const dir = path.dirname(TOPICS_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(TOPICS_FILE, JSON.stringify(topicsToSave, null, 2), 'utf8');

    return NextResponse.json({ success: true, topics: topicsToSave });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
