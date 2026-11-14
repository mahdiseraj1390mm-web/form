import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { initialForms } from '@/lib/mock-data';
import { Form } from '@/types/form';
import { getFormsFromDb, saveFormsToPostgres, deleteFormFromPostgres } from '@/lib/db';

const DB_PATH = path.join(process.cwd(), 'data', 'forms.json');

// بازگرداندن فرم‌ها بدون حذف تصویر پیش‌فرض
function sanitizeForms(rawForms: Form[]): Form[] {
  return rawForms.map((form) => {
    if (form.id === 'form-belhagh-registration' || form.slug === 'zexuz') {
      const regRequiredFieldIds = [
        'f_ebadollah_member',
        'f_name',
        'f_family',
        'f_mobile',
        'f_birth_date',
        'f_role_in_family',
        'f_family_members',
        'f_marital_status',
        'f_province_city',
        'f_school_name',
        'f_school_supervisor',
        'f_mentor_name',
        'f_physical_illness',
        'f_mental_illness',
        'f_medications',
      ];
      const customMsgs: Record<string, string> = {
        f_ebadollah_member: 'مشخص کردن وضعیت عضویت در سایت عبادالله الزامی است.',
        f_name: 'درج نام الزامی است.',
        f_family: 'درج نام خانوادگی الزامی است.',
        f_mobile: 'شماره تلفن همراه معتبر الزامی است.',
        f_birth_date: 'انتخاب تاریخ تولد الزامی است.',
        f_role_in_family: 'انتخاب نقش در خانواده الزامی است.',
        f_family_members: 'انتخاب تعداد اعضای خانواده الزامی است.',
        f_marital_status: 'انتخاب وضعیت تاهل الزامی است.',
        f_province_city: 'انتخاب استان و شهرستان الزامی است.',
        f_school_name: 'درج نام مدرسه معارفی الزامی است.',
        f_school_supervisor: 'درج نام ناظم مدرسه الزامی است.',
        f_mentor_name: 'درج نام مربی تربیتی الزامی است.',
      };
      const updatedFields = form.fields.map((f) => {
        if (regRequiredFieldIds.includes(f.id)) {
          return {
            ...f,
            validations: {
              ...(f.validations || {}),
              required: true,
              customErrorMessage: f.validations?.customErrorMessage || customMsgs[f.id] || 'تکمیل این فیلد الزامی است.',
            },
          };
        }
        return f;
      });
      return { ...form, fields: updatedFields };
    }

    if (form.id === 'form-belhagh-booking' || form.slug === '3uu4z') {
      let fields = form.fields.filter((f) => f.id !== 'f_alert_guideline' && f.id !== 'f_terms');
      const hasBankCard = fields.some((f) => f.id === 'f_optional_contribution' || f.type === 'bankCard');
      if (!hasBankCard) {
        fields.push({
          id: 'f_optional_contribution',
          type: 'bankCard',
          label: 'مشارکت مالی اختیاری در هزینه‌های مرکز (اختیاری)',
          placeholder: 'مثال: ۵۰,۰۰۰',
          helpText: 'در صورت تمایل، می‌توانید مبلغی را به عنوان هدیه یا مشارکت اختیاری واریز فرمایید',
          stepId: 'step-5',
          gridCols: 12,
          validations: {},
          bankCardData: {
            cardNumber: '6037-9979-1234-5678',
            cardHolder: 'مرکز خدمات روانشناسی بالحق',
            bankKey: 'melli',
            bankName: 'بانک ملی ایران',
            presetAmounts: [30000, 50000, 100000, 200000],
            showPresetAmounts: true,
            showCustomAmount: true,
            depositTitle: 'شماره کارت جهت واریز اختیاری:',
            description: 'در صورت تمایل، می‌توانید مبلغی را به عنوان هدیه یا مشارکت اختیاری واریز فرمایید',
            allowCopy: true,
          },
        });
      }

      let steps = form.steps
        ? form.steps.map((st) => {
            if (st.id === 'step-5') {
              const fieldIds = st.fieldIds.filter((id) => id !== 'f_alert_guideline' && id !== 'f_terms');
              if (!fieldIds.includes('f_optional_contribution')) {
                fieldIds.push('f_optional_contribution');
              }
              return {
                ...st,
                title: st.title === 'قوانین و راهنما' ? 'مشارکت مالی اختیاری' : st.title,
                description: st.description === 'تایید شرایط و قوانین نوبت‌دهی' ? 'مشارکت اختیاری در هزینه‌های مرکز' : st.description,
                fieldIds,
              };
            }
            return st;
          })
        : form.steps;

      const updatedFields = fields.map((f) => {
        if (f.id === 'f_prev_counselor_name') {
          return {
            ...f,
            validations: {
              ...(f.validations || {}),
              required: true,
              customErrorMessage: f.validations?.customErrorMessage || 'درج نام مشاور یا مشاوران سابق الزامی است.',
            },
          };
        }
        return f;
      });
      return { ...form, steps, fields: updatedFields };
    }

    return form;
  });
}

async function loadFormsFromDb(): Promise<Form[]> {
  // ۱. اولویت نخست: واکشی از پایگاه‌داده سرور PostgreSQL
  try {
    const pgForms = await getFormsFromDb();
    if (pgForms && Array.isArray(pgForms) && pgForms.length > 0) {
      return sanitizeForms(pgForms);
    }
  } catch (e) {
    console.warn('PostgreSQL fetch forms error:', e);
  }

  // ۲. اولویت دوم: بارگذاری از مخزن پایدار سرور
  try {
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });

    try {
      const content = await fs.readFile(DB_PATH, 'utf8');
      const parsed = JSON.parse(content);
      if (Array.isArray(parsed) && parsed.length > 0) {
        saveFormsToPostgres(parsed).catch(() => {});
        return sanitizeForms(parsed);
      }
    } catch {
      // فایل دیتابیس هنوز ساخته نشده؛ با فرم‌های تمیز راه‌اندازی می‌شود
    }

    const cleanInitial = sanitizeForms(initialForms);
    await fs.writeFile(DB_PATH, JSON.stringify(cleanInitial, null, 2), 'utf8');
    saveFormsToPostgres(cleanInitial).catch(() => {});
    return cleanInitial;
  } catch (err) {
    console.error('Error loading forms from DB:', err);
    return sanitizeForms(initialForms);
  }
}

async function saveFormsToDb(forms: Form[]): Promise<void> {
  const sanitized = sanitizeForms(forms);
  // ذخیره در مخزن محلی
  try {
    const dataDir = path.join(process.cwd(), 'data');
    await fs.mkdir(dataDir, { recursive: true });
    await fs.writeFile(DB_PATH, JSON.stringify(sanitized, null, 2), 'utf8');
  } catch (err) {
    console.warn('Error saving forms to local file:', err);
  }

  // ذخیره در پایگاه‌داده سرور PostgreSQL
  try {
    await saveFormsToPostgres(sanitized);
  } catch (err) {
    console.warn('Error saving forms to PostgreSQL:', err);
  }
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
    } else if (body.newForm && body.newForm.id) {
      const exists = currentForms.some((f) => f.id === body.newForm.id);
      if (!exists) {
        currentForms = [body.newForm, ...currentForms];
      }
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

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const formId = searchParams.get('id');
    if (!formId) {
      return NextResponse.json({ error: 'شناسه فرم مشخص نیست' }, { status: 400 });
    }

    // ۱. حذف از پایگاه‌داده سرور PostgreSQL
    await deleteFormFromPostgres(formId);

    // ۲. حذف از مخزن فایل محلی data/forms.json
    try {
      const dataDir = path.join(process.cwd(), 'data');
      await fs.mkdir(dataDir, { recursive: true });
      let currentForms: Form[] = [];
      try {
        const content = await fs.readFile(DB_PATH, 'utf8');
        currentForms = JSON.parse(content);
      } catch {
        currentForms = initialForms;
      }
      const updatedForms = currentForms.filter((f) => f.id !== formId && f.slug !== formId);
      await fs.writeFile(DB_PATH, JSON.stringify(updatedForms, null, 2), 'utf8');
      return NextResponse.json({ success: true, forms: updatedForms });
    } catch (err) {
      console.warn('Error updating forms.json on delete:', err);
      return NextResponse.json({ success: true });
    }
  } catch (err: any) {
    console.error('Error deleting form from DB:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
