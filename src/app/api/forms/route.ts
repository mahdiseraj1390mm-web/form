import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { initialForms } from '@/lib/mock-data';
import { Form } from '@/types/form';

const DB_PATH = path.join(process.cwd(), 'data', 'forms.json');

// بازگرداندن فرم‌ها بدون حذف تصویر پیش‌فرض
function sanitizeForms(rawForms: Form[]): Form[] {
  return rawForms;
}

async function loadFormsFromDb(): Promise<Form[]> {
  try {
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });

    try {
      const content = await fs.readFile(DB_PATH, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return sanitizeForms(parsed);
      }
    } catch {
      // فایل دیتابیس هنوز ساخته نشده؛ با فرم‌های تمیز راه‌اندازی می‌شود
    }

    const cleanInitial = sanitizeForms(initialForms);
    await fs.writeFile(DB_PATH, JSON.stringify(cleanInitial, null, 2), 'utf8');
    return cleanInitial;
  } catch (err) {
    console.error('Error loading forms from DB:', err);
    return sanitizeForms(initialForms);
  }
}

async function saveFormsToDb(forms: Form[]): Promise<void> {
  const dataDir = path.join(process.cwd(), 'data');
  await fs.mkdir(dataDir, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(sanitizeForms(forms), null, 2), 'utf8');
}

export async function GET() {
  try {
    const forms = await loadFormsFromDb();
    return NextResponse.json({ success: true, forms });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let currentForms = await loadFormsFromDb();

    if (body.forms && Array.isArray(body.forms)) {
      currentForms = body.forms;
    } else if (body.formId && body.updated) {
      const idx = currentForms.findIndex((f) => f.id === body.formId);
      if (idx !== -1) {
        const existing = currentForms[idx];
        currentForms[idx] = {
          ...existing,
          ...body.updated,
          generalSettings: {
            ...existing.generalSettings,
            ...(body.updated.generalSettings || {}),
          },
          theme: {
            ...existing.theme,
            ...(body.updated.theme || {}),
          },
          updatedAt: new Date().toISOString(),
        };
      } else {
        return NextResponse.json({ error: 'فرم یافت نشد' }, { status: 404 });
      }
    } else {
      return NextResponse.json({ error: 'داده نامعتبر است' }, { status: 400 });
    }

    await saveFormsToDb(currentForms);
    return NextResponse.json({ success: true, forms: currentForms });
  } catch (err: any) {
    console.error('Error saving form to DB:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
