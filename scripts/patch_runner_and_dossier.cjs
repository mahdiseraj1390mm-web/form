const fs = require('fs');

// Patch 1: src/components/runner/form-runner.tsx
{
  const file = 'src/components/runner/form-runner.tsx';
  let content = fs.readFileSync(file, 'utf8');

  // Fix SMS / share text to exact format without %0A, link or extra words
  const oldShareRegex = /text:\s*`کد پرونده اختصاصی شما در مرکز روانشناسی بالحق:[\s\S]*?https:\/\/s\.psy-belhagh\.com\/form\/3uu4z`,/;
  const newShareText = "text: `کد پرونده اختصاصی شما در مرکز روانشناسی بالحق: ${code}\\nجهت ورود به سامانه و دریافت نوبت مشاوره این کد را ذخیره داشته باشید`,";
  if (oldShareRegex.test(content)) {
    content = content.replace(oldShareRegex, newShareText);
  }

  // Enhance validateFields for select and jalaliDate
  const valTarget = `      // الزامی بودن
      if (f.validations?.required && (!val || val === '' || (typeof val === 'string' && val.trim() === ''))) {
        newErrors[f.id] = f.validations?.customErrorMessage || 'تکمیل این فیلد الزامی است.';
        return;
      }`;

  const valRepl = `      // الزامی بودن قطعی کلیه فیلدهای اجباری (متن، گزینه‌ها، تاریخ و ...)
      if (f.validations?.required) {
        if (!val || val === '' || (typeof val === 'string' && (val.trim() === '' || val.trim() === 'انتخاب کنید' || val.trim() === 'select'))) {
          newErrors[f.id] = f.validations?.customErrorMessage || (f.type === 'select' ? 'انتخاب یکی از گزینه‌ها الزامی است.' : 'تکمیل این فیلد الزامی است.');
          return;
        }
      }`;

  if (content.includes(valTarget)) {
    content = content.replace(valTarget, valRepl);
  }

  fs.writeFileSync(file, content.replace(/\r?\n/g, '\r\n'), 'utf8');
  console.log('form-runner.tsx patched');
}

// Patch 2: src/lib/sms-service.ts
{
  const file = 'src/lib/sms-service.ts';
  let content = fs.readFileSync(file, 'utf8');

  // Update default pattern template
  content = content.replace(
    /template:\s*'با سلام\\nکد پرونده شما:[\s\S]*?سایت روانشناسی بالحق',/,
    "template: 'کد پرونده اختصاصی شما در مرکز روانشناسی بالحق: {0}\\nجهت ورود به سامانه و دریافت نوبت مشاوره این کد را ذخیره داشته باشید',"
  );

  // Update sendCaseRegistrationSms exact text
  content = content.replace(
    /const exactText = `با سلام\\nکد پرونده شما:[\s\S]*?سایت روانشناسی بالحق`;/,
    "const exactText = `کد پرونده اختصاصی شما در مرکز روانشناسی بالحق: ${caseCode}\\nجهت ورود به سامانه و دریافت نوبت مشاوره این کد را ذخیره داشته باشید`;"
  );

  fs.writeFileSync(file, content.replace(/\r?\n/g, '\r\n'), 'utf8');
  console.log('sms-service.ts patched');
}
