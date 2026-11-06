const fs = require('fs');

// Patch 1: src/components/layout/header.tsx
{
  const file = 'src/components/layout/header.tsx';
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove the activeForm view button and create form button
  const regex = /\{\/\* دکمه‌های اکشن بالا \*\/\}\s*<div className="flex items-center gap-1\.5 sm:gap-3">[\s\S]*?\{\/\* اعلان‌ها و دراپ‌داون تطبیق هوشمند \*\/\}/;
  if (regex.test(content)) {
    content = content.replace(regex, `{/* دکمه‌های اکشن بالا */}\n        <div className="flex items-center gap-1.5 sm:gap-3">\n          {/* اعلان‌ها و دراپ‌داون تطبیق هوشمند */}`);
    fs.writeFileSync(file, content.replace(/\r?\n/g, '\r\n'), 'utf8');
    console.log('Patch 1 (header.tsx) applied successfully');
  } else {
    console.error('Patch 1 (header.tsx) regex did not match');
  }
}

// Patch 2: src/components/dashboard/dashboard-view.tsx
{
  const file = 'src/components/dashboard/dashboard-view.tsx';
  let content = fs.readFileSync(file, 'utf8');
  
  // Remove the 3 buttons: تحلیل‌های بالینی, کارتابل مراجعان, ایجاد فرم / سامانه جدید
  const regex = /<div className="flex items-center gap-2\.5 flex-wrap">[\s\S]*?<\/div>\s*<\/div>\s*\{\/\* ۳\. باکس آمار کلی سامانه/;
  if (regex.test(content)) {
    content = content.replace(regex, `</div>\n\n      {/* ۳. باکس آمار کلی سامانه`);
    fs.writeFileSync(file, content.replace(/\r?\n/g, '\r\n'), 'utf8');
    console.log('Patch 2 (dashboard-view.tsx) applied successfully');
  } else {
    console.error('Patch 2 (dashboard-view.tsx) regex did not match');
  }
}
