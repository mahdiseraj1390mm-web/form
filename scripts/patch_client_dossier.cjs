const fs = require('fs');

const file = 'src/components/submissions/client-dossier-fullview.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Add updateSubmissionData to useForm hook call
content = content.replace(
  /const\s*\{\s*forms,\s*updateSubmissionStatus,\s*addSubmissionComment\s*\}\s*=\s*useForm\(\);/,
  'const { forms, updateSubmissionStatus, updateSubmissionData, addSubmissionComment } = useForm();'
);

// 2. Fix Dossier Tabs Sizing:
// Replace <nav className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xs">
const oldNavRegex = /<nav className="flex gap-1 overflow-x-auto rounded-2xl border border-slate-200 bg-white p-1\.5 shadow-2xs">[\s\S]*?<\/nav>/;
const newNav = `<nav className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 w-full p-2 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          {[
            ['overview', 'تحلیل در یک نگاه'],
            ['analytics', 'تحلیل‌های آماری'],
            ['profile', 'مشخصات ثبت‌نام'],
            ['forms', 'فرم‌ها و آزمون‌ها'],
            ['followups', 'پیگیری‌ها'],
            ['finances', 'مالی و نوبت‌ها'],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setCurrentView('dossier');
                setActiveTab(key as any);
              }}
              className={\`w-full rounded-xl py-3 px-3 text-xs sm:text-sm font-black transition-all flex items-center justify-center text-center cursor-pointer \${
                (currentView === 'dossier' && activeTab === key) ||
                (currentView === 'formReport' && key === 'forms')
                  ? 'bg-[#173f6b] text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-50'
              }\`}
            >
              {label}
            </button>
          ))}
        </nav>`;

if (oldNavRegex.test(content)) {
  content = content.replace(oldNavRegex, newNav);
} else {
  console.warn('oldNavRegex did not match');
}

// 3. Fix clientAge calculation:
const oldAgeRegex = /\/\/ سن مراجع \(محاسبه هوشمند از سال تولد یا تاریخ تولد شمسی\)[\s\S]*?return 'ثبت‌نشده';\s*\}, \[combinedData, currentSubmissions\]\);/;
const newAgeLogic = `// سن مراجع (محاسبه دقیق و استاندارد از سال تولد یا تاریخ تولد شمسی)
  const clientAge = useMemo(() => {
    if (combinedData.f_age || combinedData.age) {
      const rawAge = combinedData.f_age || combinedData.age;
      const numAge = parseInt(toEnglishDigits(String(rawAge)));
      if (!isNaN(numAge) && numAge > 0 && numAge < 120) {
        return \`\${toPersianDigits(numAge)} سال\`;
      }
    }

    let bYear: number | null = null;
    const candidates = [
      combinedData.birth_year,
      combinedData.f_birth_year,
      combinedData.birthYear,
      combinedData.f_birth_date,
      combinedData.birth_date,
      combinedData.birthDate,
      ...currentSubmissions.map((s) => s.data?.birth_year),
      ...currentSubmissions.map((s) => s.data?.f_birth_date),
      ...currentSubmissions.map((s) => s.data?.f_birth_year),
    ];

    for (const cand of candidates) {
      if (!cand) continue;
      const str = toEnglishDigits(String(cand)).trim();
      const match4 = str.match(/(13\\d{2}|14\\d{2})/);
      if (match4) {
        bYear = parseInt(match4[1]);
        break;
      }
      const parts = str.split(/[\\/\\-\\.\\s]/).filter(Boolean);
      for (const p of parts) {
        const num = parseInt(p);
        if (!isNaN(num) && num >= 1320 && num <= 1440) {
          bYear = num;
          break;
        }
      }
      if (bYear) break;
    }

    if (bYear) {
      const currentJalaliYear = 1403;
      const calculatedAge = Math.max(1, currentJalaliYear - bYear);
      return \`\${toPersianDigits(calculatedAge)} سال\`;
    }

    return 'ثبت‌نشده';
  }, [combinedData, currentSubmissions]);`;

if (oldAgeRegex.test(content)) {
  content = content.replace(oldAgeRegex, newAgeLogic);
} else {
  console.warn('oldAgeRegex did not match');
}

// 4. Remove block lines 1405-1429 (آخرین توصیه مشاور from مشخصات فردی)
const oldRecBoxRegex = /\{\/\* ۱۱\. آخرین توصیه مشاور \*\/\}[\s\S]*?<\/div>\s*<\/article>/;
if (oldRecBoxRegex.test(content)) {
  content = content.replace(oldRecBoxRegex, `</article>`);
  console.log('Removed آخرین توصیه مشاور from مشخصات فردی');
} else {
  console.warn('oldRecBoxRegex did not match');
}

fs.writeFileSync(file, content.replace(/\r?\n/g, '\r\n'), 'utf8');
console.log('client-dossier-fullview.tsx (part 1) patched successfully');
