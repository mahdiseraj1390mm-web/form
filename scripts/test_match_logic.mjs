import { neon } from '@neondatabase/serverless';

const sql = neon('postgresql://neondb_owner:npg_hbad8wm9oYIT@ep-flat-band-b70xzvhu-pooler.c-13.us-east-1.aws.neon.tech/neondb?sslmode=require');

function normalizePersianText(str) {
  if (!str || typeof str !== 'string') return '';
  return str
    .replace(/[۰-۹]/g, (d) => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
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

async function main() {
  const subs = await sql`SELECT * FROM form_submissions ORDER BY created_at DESC LIMIT 3000`;
  
  // Get all Belhagh registrations
  const registrations = subs.filter(s => s.form_id === 'form-belhagh-registration' || s.tracking_code?.startsWith('SP'));
  console.log(`Found ${registrations.length} registrations.`);

  // Get all Safa submissions
  const safaSubs = subs.filter(s => s.form_id === 'form-safaan-assessment');
  console.log(`Found ${safaSubs.length} Safa submissions.`);

  for (const reg of registrations) {
    const regData = typeof reg.data === 'string' ? JSON.parse(reg.data) : reg.data;
    const name = regData.fullName || `${regData.f_name || ''} ${regData.f_family || ''}`.trim();
    const school = normalizePersianText(regData.f_school_name || regData.school_name || '');
    const prov = normalizePersianText(regData.f_province_city || regData.province || '');
    let birthYear = undefined;
    if (regData.f_birth_date) {
      const p = String(regData.f_birth_date).split(/[\/\-]/);
      if (p.length >= 1 && parseInt(p[0]) > 1300 && parseInt(p[0]) < 1450) birthYear = parseInt(p[0]);
    } else if (regData.birth_year) {
      birthYear = parseInt(regData.birth_year);
    }
    const gender = regData.gender || regData.f_gender || (
      regData.f_role_in_family?.includes('مادر') || regData.f_role_in_family?.includes('دختر') || regData.f_role_in_family?.includes('زن') ? 'خانم' :
      regData.f_role_in_family?.includes('پدر') || regData.f_role_in_family?.includes('پسر') || regData.f_role_in_family?.includes('مرد') ? 'آقا' : undefined
    );

    console.log(`\n======================================================`);
    console.log(`Checking registration: ${name} (Code: ${regData.caseCode || reg.tracking_code})`);
    console.log(`Demographics -> School: "${school}", Prov: "${prov}", Birth: ${birthYear}, Gender: ${gender}`);

    // Check matches in Safa
    const matches = [];
    for (const safa of safaSubs) {
      const sData = typeof safa.data === 'string' ? JSON.parse(safa.data) : safa.data;
      const sSchool = normalizePersianText(sData.school_name || sData.f_school_name || '');
      const sProv = normalizePersianText(sData.province || sData.f_province_city || '');
      const sBirth = sData.birth_year ? parseInt(sData.birth_year) : undefined;
      const sGender = sData.gender;

      let score = 0;
      let matched = [];

      // 1. School match
      const simSchool = stringSimilarity(school, sSchool);
      const schoolContains = (school && sSchool && (school.includes(sSchool) || sSchool.includes(school)));
      if (simSchool >= 0.55 || schoolContains) {
        score += 40;
        matched.push('مدرسه: ' + sData.school_name);
      }

      // 2. Province match
      const simProv = stringSimilarity(prov, sProv);
      const provContains = (prov && sProv && (prov.includes(sProv) || sProv.includes(prov)));
      if (simProv >= 0.5 || provContains) {
        score += 20;
        matched.push('استان: ' + sData.province);
      }

      // 3. Birth year match
      if (birthYear && sBirth) {
        const diff = Math.abs(birthYear - sBirth);
        if (diff === 0) {
          score += 30;
          matched.push('سال تولد: ' + sBirth);
        } else if (diff === 1) {
          score += 18;
          matched.push('سال تولد (۱ سال اختلاف): ' + sBirth);
        }
      }

      // 4. Gender match
      if (gender && sGender && gender === sGender) {
        score += 10;
        matched.push('جنسیت: ' + sGender);
      }

      if (score >= 70) {
        matches.push({
          safaId: safa.id,
          safaCode: sData.user_code || safa.tracking_code,
          score,
          matched,
          school: sData.school_name,
          prov: sData.province,
          birth: sBirth,
          gender: sGender
        });
      }
    }

    console.log(`Found ${matches.length} matches (score >= 70):`);
    matches.forEach(m => console.log(`  -> Match ${m.safaCode} (${m.score}%): ${m.matched.join(' | ')}`));
  }
}

main().catch(console.error);
