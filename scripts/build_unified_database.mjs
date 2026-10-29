import fs from 'fs';
import path from 'path';

function normalizePersianText(str) {
  if (!str) return '';
  return str
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[ي]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[آأإ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[\u200B-\u200D\uFEFF\u200C]/g, ' ')
    .replace(/[\u064B-\u065F\u0670]/g, '')
    .replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function levenshteinDistance(s1, s2) {
  const m = s1.length;
  const n = s2.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + 1);
    }
  }
  return dp[m][n];
}

function stringSimilarity(s1, s2) {
  const n1 = normalizePersianText(s1);
  const n2 = normalizePersianText(s2);
  if (!n1 && !n2) return 1;
  if (!n1 || !n2) return 0;
  if (n1 === n2) return 1;
  const maxLen = Math.max(n1.length, n2.length);
  if (maxLen === 0) return 1;
  const words1 = n1.split(' ').filter(Boolean);
  const words2 = n2.split(' ').filter(Boolean);
  const commonWords = words1.filter((w) => words2.includes(w));
  const wordOverlap = (2 * commonWords.length) / (words1.length + words2.length);
  const dist = levenshteinDistance(n1, n2);
  const levScore = 1 - dist / maxLen;
  return Math.max(levScore, wordOverlap * 0.9);
}

function normalizeMobile(phone) {
  if (!phone) return '';
  const digits = String(phone).replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, '');
  if (digits.startsWith('98') && digits.length === 12) {
    return '0' + digits.slice(2);
  }
  if (!digits.startsWith('0') && digits.length === 10) {
    return '0' + digits;
  }
  return digits;
}

// 1. Load 1063 Safa submissions
console.log('Loading 1063 Safa submissions from scripts/full_safaan_export.ts...');
const content = fs.readFileSync('scripts/full_safaan_export.ts', 'utf8');
const jsonPart = content.replace(/^[\s\S]*?export const safaanInitialSubmissions: FormSubmission\[\] = /, '').replace(/;\s*$/, '');
const safaSubmissions = JSON.parse(jsonPart);
console.log(`Loaded ${safaSubmissions.length} Safa submissions.`);

// 2. Client registrations from BelHagh
const clientRegistrations = [
  // Zainab Shovandi
  {
    id: 'sub-case-SP328786',
    formId: 'form-belhagh-registration',
    trackingCode: 'SP328786',
    mobile: '09127944985',
    status: 'new',
    createdAt: '2026-10-28T21:28:44.000Z',
    data: {
      f_name: 'زینب',
      f_family: 'شوندی',
      fullName: 'زینب شوندی',
      f_mobile: '09127944985',
      f_birth_date: '1362/12/01',
      f_school_name: 'الحسنی',
      f_province_city: 'تهران - تهران',
      f_role_in_family: 'مادر',
      f_marital_status: 'متأهل',
      f_family_members: '۵ نفر',
      f_medications: 'ندارم',
      f_mental_illness: 'خیر',
      f_physical_illness: 'خیر',
      f_ebadollah_member: 'بله',
      f_school_supervisor: 'خانم جلالی',
      caseCode: 'SP328786'
    }
  },
  // Zainab Fallah
  {
    id: 'sub-case-SP729745',
    formId: 'form-belhagh-registration',
    trackingCode: 'SP729745',
    mobile: '09393070199',
    status: 'new',
    createdAt: '2026-10-28T21:00:00.000Z',
    data: {
      f_name: 'زینب',
      f_family: 'فلاح',
      fullName: 'زینب فلاح',
      f_mobile: '09393070199',
      f_birth_date: '1375/03/16',
      f_school_name: 'مدرسه مسعودیه',
      f_province_city: 'تهران - تهران',
      f_role_in_family: 'دختر',
      f_marital_status: 'مجرد',
      caseCode: 'SP729745'
    }
  },
  {
    id: 'sub-1793224654010',
    formId: 'form-belhagh-registration',
    trackingCode: 'SP729745',
    mobile: '09393070199',
    status: 'new',
    createdAt: '2026-10-28T21:01:00.000Z',
    data: {
      f_name: 'زینب',
      f_family: 'فلاح',
      fullName: 'زینب فلاح',
      f_mobile: '09393070199',
      f_birth_date: '1375/03/16',
      f_school_name: 'مدرسه مسعودیه',
      f_province_city: 'تهران - تهران',
      caseCode: 'SP729745'
    }
  },
  {
    id: 'sub-1793224888243',
    formId: 'form-belhagh-booking',
    trackingCode: 'SP729745',
    mobile: '09393070199',
    status: 'approved',
    createdAt: '2026-10-28T21:05:00.000Z',
    data: {
      f_name: 'زینب',
      f_family: 'فلاح',
      fullName: 'زینب فلاح',
      f_mobile: '09393070199',
      f_school_name: 'مدرسه مسعودیه',
      f_province_city: 'tehran - تهران',
      f_birth_date: '1375/03/16',
      f_booking_counselor: 'دکتر علوی',
      f_booking_date: '1405/02/10',
      caseCode: 'SP729745'
    }
  },
  // Masih Mehdipoor
  {
    id: 'sub-case-SP220717',
    formId: 'form-belhagh-registration',
    trackingCode: 'SP220717',
    mobile: '09912958662',
    status: 'new',
    createdAt: '2026-10-28T21:20:00.000Z',
    data: {
      f_name: 'مسیح',
      f_family: 'مهدی پور',
      fullName: 'مسیح مهدی پور',
      f_mobile: '09912958662',
      f_school_name: 'اصفهان',
      f_province_city: 'اصفهان - نجف‌آباد',
      f_birth_date: '1398/10/08',
      caseCode: 'SP220717'
    }
  },
  {
    id: 'sub-1793226199324',
    formId: 'form-belhagh-registration',
    trackingCode: 'SP220717',
    mobile: '09912958662',
    status: 'new',
    createdAt: '2026-10-28T21:22:00.000Z',
    data: {
      f_name: 'مسیح',
      f_family: 'مهدی پور',
      fullName: 'مسیح مهدی پور',
      f_mobile: '09912958662',
      f_school_name: 'اصفهان',
      f_province_city: 'اصفهان - نجف‌آباد',
      f_birth_date: '1398/10/08',
      caseCode: 'SP142610'
    }
  },
  {
    id: 'sub-1793226327126',
    formId: 'form-belhagh-booking',
    trackingCode: 'SP220717',
    mobile: '09912958662',
    status: 'approved',
    createdAt: '2026-10-28T21:25:00.000Z',
    data: {
      f_name: 'مسیح',
      f_family: 'مهدی پور',
      fullName: 'مسیح مهدی پور',
      f_mobile: '09912958662',
      f_school_name: 'اصفهان',
      f_province_city: 'isfahan - نجف‌آباد',
      f_birth_date: '1398/10/08',
      caseCode: 'SP142610'
    }
  }
];

const allSubmissions = [...clientRegistrations, ...safaSubmissions];
console.log(`Total combined initial submissions: ${allSubmissions.length}`);

// 3. Run reconciliation logic
console.log('\nRunning reconciliation on combined dataset...');
const now = new Date().toISOString();

// Group clients
const clientMap = new Map();
allSubmissions.forEach(sub => {
  if (sub.formId !== 'form-safaan-assessment') {
    const cCode = sub.data?.caseCode || sub.trackingCode;
    if (cCode && !clientMap.has(cCode)) {
      let bYear = sub.data?.birth_year ? parseInt(sub.data.birth_year) : undefined;
      if (!bYear && sub.data?.f_birth_date) {
        const parts = String(sub.data.f_birth_date).split(/[\/\-]/);
        if (parts.length >= 1 && parseInt(parts[0]) > 1300 && parseInt(parts[0]) < 1450) {
          bYear = parseInt(parts[0]);
        }
      }

      const gender =
        sub.data?.gender ||
        sub.data?.f_gender ||
        (sub.data?.f_role_in_family?.includes('مادر') ||
        sub.data?.f_role_in_family?.includes('دختر') ||
        sub.data?.f_role_in_family?.includes('زن')
          ? 'خانم'
          : sub.data?.f_role_in_family?.includes('پدر') ||
            sub.data?.f_role_in_family?.includes('پسر') ||
            sub.data?.f_role_in_family?.includes('مرد')
          ? 'آقا'
          : undefined);

      clientMap.set(cCode, {
        caseCode: cCode,
        fullName: sub.data?.fullName || `${sub.data?.f_name || ''} ${sub.data?.f_family || ''}`.trim(),
        mobile: normalizeMobile(sub.data?.f_mobile || sub.mobile || ''),
        schoolName: sub.data?.f_school_name || sub.data?.school_name,
        provinceCity: sub.data?.f_province_city || sub.data?.province,
        birthYear: bYear,
        gender,
        safaUserCode: sub.data?.safaUserCode || sub.detectedSafaCode,
        submissions: [sub],
        hasLinkedSafa: false,
      });
    } else if (cCode && clientMap.has(cCode)) {
      clientMap.get(cCode).submissions.push(sub);
    }
  }
});

console.log(`Found ${clientMap.size} clients to reconcile:`);
for (const c of clientMap.values()) {
  console.log(`- ${c.fullName} (${c.caseCode}) | School: "${c.schoolName}" | Prov: "${c.provinceCity}" | Birth: ${c.birthYear} | Gender: ${c.gender}`);
}

const unlinkedSafa = allSubmissions.filter(s => s.formId === 'form-safaan-assessment');

let matchCount = 0;
for (const client of clientMap.values()) {
  let matchedSafa = null;
  let matchedCode = '';

  // Explicit code check
  if (client.safaUserCode) {
    matchedSafa = unlinkedSafa.find(s => s.data?.user_code === client.safaUserCode || s.trackingCode === `SF-${client.safaUserCode}`);
    if (matchedSafa) matchedCode = client.safaUserCode;
  }

  // 4-factor demographic match
  if (!matchedSafa && client.schoolName && client.birthYear && client.gender) {
    const candidates = [];
    for (const safa of unlinkedSafa) {
      const sSchool = safa.data?.school_name || safa.data?.f_school_name || '';
      const sProv = safa.data?.province || safa.data?.f_province_city || '';
      const sBirth = safa.data?.birth_year || (safa.data?.f_birth_date ? parseInt(String(safa.data.f_birth_date).split(/[\/\-]/)[0]) : undefined);
      const sGender = safa.data?.gender || safa.data?.f_gender || '';

      const simSchool = stringSimilarity(client.schoolName, sSchool);
      const cSNorm = normalizePersianText(client.schoolName);
      const sSNorm = normalizePersianText(sSchool);
      const schoolMatch = simSchool >= 0.55 || cSNorm.includes(sSNorm) || sSNorm.includes(cSNorm);

      const simProv = stringSimilarity(client.provinceCity || '', sProv);
      const cPNorm = normalizePersianText(client.provinceCity || '');
      const sPNorm = normalizePersianText(sProv);
      const provMatch = simProv >= 0.5 || cPNorm.includes(sPNorm) || sPNorm.includes(cPNorm);

      const birthMatch = sBirth && client.birthYear === sBirth;
      const genderMatch = sGender && client.gender === sGender;

      if (schoolMatch && provMatch && birthMatch && genderMatch) {
        const code = safa.data?.user_code || safa.trackingCode.replace('SF-', '');
        candidates.push({ safa, code });
      }
    }

    if (candidates.length === 1) {
      matchedSafa = candidates[0].safa;
      matchedCode = candidates[0].code;
    }
  }

  if (matchedSafa && matchedCode) {
    // Link Safa to client!
    matchedSafa.data = {
      ...matchedSafa.data,
      caseCode: client.caseCode,
      fullName: client.fullName,
      mobile: client.mobile,
      f_mobile: client.mobile,
      linkingStatus: 'linked',
      reconciledAt: now,
      reconciledReason: `تطبیق ۱۰۰٪ مشخصات ۴گانه با مراجع ${client.fullName} (${client.caseCode})`
    };
    matchedSafa.mobile = client.mobile;
    matchedSafa.linkingStatus = 'linked';
    matchedSafa.reconciledAt = now;
    matchedSafa.reconciledReason = `تطبیق ۱۰۰٪ با مراجع ${client.fullName}`;

    client.submissions.forEach(cSub => {
      cSub.data = {
        ...cSub.data,
        safaUserCode: matchedCode,
        detectedSafaCode: matchedCode,
        linkingStatus: 'linked',
        reconciledAt: now
      };
      cSub.detectedSafaCode = matchedCode;
      cSub.linkingStatus = 'linked';
      cSub.reconciledAt = now;
    });

    matchCount++;
    console.log(`✅ MATCH: Client ${client.fullName} (${client.caseCode}) linked to Safa ${matchedCode} (Sub ID: ${matchedSafa.id})`);
  }
}

console.log(`\nReconciliation completed. Total linked: ${matchCount}`);

// Save to data/submissions.json
fs.mkdirSync('data', { recursive: true });
fs.writeFileSync('data/submissions.json', JSON.stringify(allSubmissions, null, 2), 'utf8');
console.log(`Saved ${allSubmissions.length} submissions to data/submissions.json.`);
