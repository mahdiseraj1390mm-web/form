import { extractBirthYear } from '@/lib/persian';
import { FormSubmission, SimilarityCandidateMatch, SimilarityNotification } from '@/types/form';

/**
 * نرمال‌سازی متون فارسی: یکسان‌سازی حروف ی/ک، حذف اعراب و فواصل مجازی
 */
export function normalizePersianText(str: string): string {
  if (!str) return '';
  return str
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632))
    .replace(/[ي]/g, 'ی')
    .replace(/[ك]/g, 'ک')
    .replace(/[آأإ]/g, 'ا')
    .replace(/ة/g, 'ه')
    .replace(/[\u200B-\u200D\uFEFF\u200C]/g, ' ') // نیم‌فاصله‌ها و کاراکترهای پنهان
    .replace(/[\u064B-\u065F\u0670]/g, '') // اعراب و تنوین
    .replace(/[^a-zA-Z0-9\u0600-\u06FF\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * نرمال‌سازی شماره همراه ایران (تبدیل +98، 0098، 98 به فرمت 09xxxxxxxxx)
 */
export function normalizeMobile(phone: string): string {
  if (!phone) return '';
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('989') && digits.length === 12) {
    return '0' + digits.slice(2);
  }
  if (digits.startsWith('9') && digits.length === 10) {
    return '0' + digits;
  }
  if (digits.length === 11 && digits.startsWith('09')) {
    return digits;
  }
  return digits;
}

/**
 * الگوریتم فاصله لون‌اشتاین (Levenshtein Distance)
 */
function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // حذف
          dp[i][j - 1] + 1, // درج
          dp[i - 1][j - 1] + 1 // جایگزینی
        );
      }
    }
  }
  return dp[m][n];
}

/**
 * شباهت متنی بر مبنای لون‌اشتاین (بین 0 تا 1)
 */
export function stringSimilarity(s1: string, s2: string): number {
  const n1 = normalizePersianText(s1);
  const n2 = normalizePersianText(s2);
  if (!n1 && !n2) return 1;
  if (!n1 || !n2) return 0;
  if (n1 === n2) return 1;

  const maxLen = Math.max(n1.length, n2.length);
  if (maxLen === 0) return 1;

  // بررسی شمول کلمات
  const words1 = n1.split(' ').filter(Boolean);
  const words2 = n2.split(' ').filter(Boolean);
  const commonWords = words1.filter((w) => words2.includes(w));
  const wordOverlap = (2 * commonWords.length) / (words1.length + words2.length);

  const dist = levenshteinDistance(n1, n2);
  const levScore = 1 - dist / maxLen;

  return Math.max(levScore, wordOverlap * 0.9);
}

export interface ClientProfileSummary {
  caseCode: string;
  fullName: string;
  mobile: string;
  schoolName?: string;
  provinceCity?: string;
  birthYear?: number;
  gender?: string;
  deviceFingerprint?: string;
  safaUserCode?: string;
  submissionsCount?: number;
}

/**
 * محاسبه شاخص تشابه تجمیعی میان یک ثبت‌نام جدید و یک پرونده موجود
 */
export function calculateMatchScore(
  subData: Record<string, any>,
  subMeta: { deviceFingerprint?: string; detectedSafaCode?: string },
  profile: ClientProfileSummary
): {
  score: number;
  matchedFields: string[];
  unmatchedFields: string[];
  isExactExplicit: boolean;
} {
  const matchedFields: string[] = [];
  const unmatchedFields: string[] = [];

  // ۱. بررسی تطابق صریح کد صفا (اولویت مطلق ۱۰۰٪)
  const candidateSafaCode = profile.safaUserCode || (profile.caseCode.startsWith('SF-') ? profile.caseCode.replace('SF-', '') : '');
  if (subMeta.detectedSafaCode && candidateSafaCode && subMeta.detectedSafaCode === candidateSafaCode) {
    return {
      score: 100,
      matchedFields: ['کد صریح صفا در دستگاه (تطابق قطعی ۱۰۰٪)'],
      unmatchedFields: [],
      isExactExplicit: true,
    };
  }

  // ۲. استخراج داده‌های مراجع جدید
  const subName = normalizePersianText(
    subData.fullName || `${subData.f_name || ''} ${subData.f_family || ''}`.trim() || subData.f_fullname || ''
  );
  const subMobile = normalizeMobile(subData.f_mobile || subData.bk_mobile || subData.mobile || '');
  const subSchool = normalizePersianText(subData.f_school_name || subData.school_name || '');
  const subProvince = normalizePersianText(subData.f_province_city || subData.province || '');

  let subBirthYear: number | undefined;
  if (subData.f_birth_date) {
    const parts = String(subData.f_birth_date).split(/[\/\-]/);
    if (parts.length >= 1 && parseInt(parts[0]) > 1300 && parseInt(parts[0]) < 1450) {
      subBirthYear = parseInt(parts[0]);
    }
  } else if (subData.birth_year) {
    subBirthYear = parseInt(subData.birth_year);
  }

  // پرونده‌های سامانه صفاً در دیتابیس صفاً فاقد نام اختصاصی، شماره همراه و شناسه دستگاه بوده و بر اساس مشخصات ۴گانه ارزیابی می‌شوند:
  const isAnonymousSafa = profile.caseCode?.startsWith('SF-') || profile.fullName?.includes('صفاً');

  if (isAnonymousSafa) {
    let demoWeight = 0;
    let demoScore = 0;

    // ۱. نام مدرسه یا مرکز معارفی (وزن: ۴۰)
    if (subSchool && profile.schoolName) {
      demoWeight += 40;
      const sim = stringSimilarity(subSchool, profile.schoolName);
      const subSchoolNorm = normalizePersianText(subSchool);
      const profSchoolNorm = normalizePersianText(profile.schoolName);
      if (sim >= 0.55 || subSchoolNorm.includes(profSchoolNorm) || profSchoolNorm.includes(subSchoolNorm)) {
        demoScore += 40;
        matchedFields.push(`نام مرکز معارفی (${profile.schoolName})`);
      } else {
        unmatchedFields.push('نام مدرسه معارفی');
      }
    }

    // ۲. استان و شهر (وزن: ۲۰)
    if (subProvince && profile.provinceCity) {
      demoWeight += 20;
      const sim = stringSimilarity(subProvince, profile.provinceCity);
      const subProvNorm = normalizePersianText(subProvince);
      const profProvNorm = normalizePersianText(profile.provinceCity);
      if (sim >= 0.5 || subProvNorm.includes(profProvNorm) || profProvNorm.includes(subProvNorm)) {
        demoScore += 20;
        matchedFields.push(`استان و شهر (${profile.provinceCity})`);
      } else {
        unmatchedFields.push('استان و شهر');
      }
    }

    // ۳. سال تولد دقیق (وزن: ۳۰)
    if (subBirthYear && profile.birthYear) {
      demoWeight += 30;
      const diff = Math.abs(subBirthYear - profile.birthYear);
      if (diff === 0) {
        demoScore += 30;
        matchedFields.push(`سال تولد دقیق (${profile.birthYear})`);
      } else if (diff <= 1) {
        demoScore += 18;
        matchedFields.push(`سال تولد (${profile.birthYear} با ۱ سال اختلاف)`);
      } else {
        unmatchedFields.push(`سال تولد (${subBirthYear} در برابر ${profile.birthYear})`);
      }
    }

    // ۴. جنسیت (وزن: ۱۰)
    const subGender = subData.gender || subData.f_gender || (
      subData.f_role_in_family?.includes('مادر') || subData.f_role_in_family?.includes('دختر') || subData.f_role_in_family?.includes('زن') ? 'خانم' :
      subData.f_role_in_family?.includes('پدر') || subData.f_role_in_family?.includes('پسر') || subData.f_role_in_family?.includes('مرد') ? 'آقا' : undefined
    );
    if (subGender && profile.gender) {
      demoWeight += 10;
      if (subGender === profile.gender) {
        demoScore += 10;
        matchedFields.push(`جنسیت (${profile.gender})`);
      } else {
        unmatchedFields.push('جنسیت');
      }
    }

    const demoPercent = demoWeight > 0 ? Math.round((demoScore / demoWeight) * 100) : 0;
    return {
      score: demoPercent,
      matchedFields,
      unmatchedFields,
      isExactExplicit: demoPercent === 100,
    };
  }

  let totalWeight = 0;
  let earnedScore = 0;

  // الف) بررسی شماره همراه (وزن: ۳۵)
  if (subMobile && profile.mobile) {
    totalWeight += 35;
    const profMobile = normalizeMobile(profile.mobile);
    if (subMobile === profMobile) {
      earnedScore += 35;
      matchedFields.push('شماره تلفن همراه');
    } else {
      unmatchedFields.push('شماره تلفن همراه');
    }
  }

  // ب) بررسی شناسه دستگاه (وزن: ۳۵)
  if (subMeta.deviceFingerprint && profile.deviceFingerprint) {
    totalWeight += 35;
    if (subMeta.deviceFingerprint === profile.deviceFingerprint) {
      earnedScore += 35;
      matchedFields.push('شناسه سخت‌افزاری دستگاه');
    } else {
      unmatchedFields.push('شناسه دستگاه');
    }
  }

  // ج) بررسی نام و نام خانوادگی (وزن: ۲۰)
  if (subName && profile.fullName) {
    totalWeight += 20;
    const sim = stringSimilarity(subName, profile.fullName);
    if (sim >= 0.8) {
      earnedScore += 20 * sim;
      matchedFields.push(`نام مراجع (${Math.round(sim * 100)}% تشابه)`);
    } else if (sim >= 0.5) {
      earnedScore += 20 * sim;
      matchedFields.push(`تشابه نسبی نام (${Math.round(sim * 100)}%)`);
    } else {
      unmatchedFields.push('نام و نام‌خانوادگی');
    }
  }

  // د) بررسی مدرسه (وزن: ۱۰)
  if (subSchool && profile.schoolName) {
    totalWeight += 10;
    const sim = stringSimilarity(subSchool, profile.schoolName);
    if (sim >= 0.7) {
      earnedScore += 10 * sim;
      matchedFields.push('نام مدرسه معارفی');
    } else {
      unmatchedFields.push('نام مدرسه');
    }
  }

  // ه) بررسی استان و شهر (وزن: ۱۰)
  if (subProvince && profile.provinceCity) {
    totalWeight += 10;
    const sim = stringSimilarity(subProvince, profile.provinceCity);
    if (sim >= 0.6) {
      earnedScore += 10;
      matchedFields.push('استان و شهر');
    }
  }

  // و) بررسی سال تولد (وزن: ۱۰)
  if (subBirthYear && profile.birthYear) {
    totalWeight += 10;
    const diff = Math.abs(subBirthYear - profile.birthYear);
    if (diff === 0) {
      earnedScore += 10;
      matchedFields.push('سال تولد دقیق');
    } else if (diff <= 1) {
      earnedScore += 6;
      matchedFields.push('سال تولد (۱ سال اختلاف)');
    } else {
      unmatchedFields.push(`سال تولد (${subBirthYear} در برابر ${profile.birthYear})`);
    }
  }

  const finalPercent = totalWeight > 0 ? Math.round((earnedScore / totalWeight) * 100) : 0;

  return {
    score: Math.min(100, Math.max(0, finalPercent)),
    matchedFields,
    unmatchedFields,
    isExactExplicit: false,
  };
}

export interface MatchDecisionResult {
  status: 'linked' | 'pending_match' | 'requires_admin_resolution';
  matchedCaseCode?: string;
  notification?: SimilarityNotification;
}

/**
 * ارزیابی تطابق ثبت‌نام جدید در برابر پرونده‌های موجود سامانه
 */
export function evaluateSubmissionSimilarity(
  sub: FormSubmission,
  existingProfiles: ClientProfileSummary[]
): MatchDecisionResult {
  // اگر مراجع قبلاً متصل شده یا فاقد داده است
  if (!existingProfiles || existingProfiles.length === 0) {
    return { status: 'pending_match' };
  }

  const subMeta = {
    deviceFingerprint: sub.deviceFingerprint,
    detectedSafaCode: sub.detectedSafaCode,
  };

  const candidateMatches: Array<SimilarityCandidateMatch & { isExact: boolean }> = [];

  for (const profile of existingProfiles) {
    const res = calculateMatchScore(sub.data, subMeta, profile);

    // تطابق ۱۰۰٪ صریح کد
    if (res.isExactExplicit || res.score === 100) {
      return {
        status: 'linked',
        matchedCaseCode: profile.caseCode,
      };
    }

    if (res.score >= 50) {
      candidateMatches.push({
        userId: profile.caseCode,
        caseCode: profile.caseCode,
        userName: profile.fullName || 'مراجع بالحق',
        userMobile: profile.mobile,
        matchPercent: res.score,
        matchedFields: res.matchedFields,
        unmatchedFields: res.unmatchedFields,
        isExact: false,
      });
    }
  }

  // مرتب‌سازی نزولی بر اساس درصد تطابق
  candidateMatches.sort((a, b) => b.matchPercent - a.matchPercent);

  if (candidateMatches.length === 0) {
    return { status: 'pending_match' };
  }

  const topMatch = candidateMatches[0];

  // بررسی حالت تساوی میان کاندید اول با کاندیدهای بعدی (۲ یا بیشتر)
  const tiedCandidates = candidateMatches.filter(
    (c) => Math.abs(c.matchPercent - topMatch.matchPercent) <= 2 && c.matchPercent >= 65
  );

  if (tiedCandidates.length >= 2) {
    const registrantName =
      sub.data.fullName || `${sub.data.f_name || ''} ${sub.data.f_family || ''}`.trim() || 'مراجع جدید';
    const registrantMobile = sub.data.f_mobile || sub.data.bk_mobile;

    const notification: SimilarityNotification = {
      id: `sim-notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      submissionId: sub.id,
      registrantName,
      registrantMobile,
      createdAt: new Date().toISOString(),
      candidates: tiedCandidates,
      resolved: false,
    };

    return {
      status: 'requires_admin_resolution',
      notification,
    };
  }

  // اگر کاندید اول تشابه بالای ۷۵٪ داشته باشد و تساوی وجود نداشته باشد
  if (topMatch.matchPercent >= 75) {
    return {
      status: 'linked',
      matchedCaseCode: topMatch.caseCode,
    };
  }

  // در غیر این صورت منتظر تطابق‌های بعدی بماند
  return { status: 'pending_match' };
}

/**
 * قانون اصالت کد صریح دستگاه و بازتخصیص هوشمند (Authoritative Reclaim)
 * اگر کاربری با کد صریح در دستگاه ثبت‌نام کند و پرونده‌اش قبلاً به شخص دیگری متصل شده باشد،
 * پرونده بلافاصله از شخص قبلی پس گرفته شده و به مالک واقعی متصل می‌شود.
 */
export function reclaimDossierWithExplicitCode(
  safaCode: string,
  newSub: FormSubmission,
  allSubmissions: FormSubmission[],
  allProfiles: ClientProfileSummary[]
): {
  updatedSubmissions: FormSubmission[];
  displacedUserId: string | null;
  reassignedCaseCode: string;
} {
  let displacedUserId: string | null = null;
  const targetCaseCode = `SF-${safaCode}`;

  // جستجوی سابمیشن‌های متعلق به این کد صفا
  const safaSubmissions = allSubmissions.filter(
    (s) => s.detectedSafaCode === safaCode || s.data?.user_code === safaCode || s.trackingCode === targetCaseCode
  );

  for (const s of safaSubmissions) {
    if (s.data?.caseCode && s.data.caseCode !== targetCaseCode && s.data.caseCode !== newSub.data?.caseCode) {
      displacedUserId = s.data.caseCode;
    }
  }

  // انتساب قطعی به کاربر جدید
  const targetUserCaseCode = newSub.data?.caseCode || newSub.trackingCode || `CASE-${newSub.id.slice(-6)}`;

  const updatedSubmissions = allSubmissions.map((s) => {
    if (s.detectedSafaCode === safaCode || s.data?.user_code === safaCode || s.trackingCode === targetCaseCode) {
      return {
        ...s,
        linkingStatus: 'linked' as const,
        data: {
          ...s.data,
          caseCode: targetUserCaseCode,
        },
        reconciledAt: new Date().toISOString(),
        reconciledReason: `پس‌گرفتن و اتصال قطعی به دلیل احراز کد صریح دستگاه (${safaCode})`,
      };
    }
    return s;
  });

  return {
    updatedSubmissions,
    displacedUserId,
    reassignedCaseCode: targetUserCaseCode,
  };
}

/**
 * پردازش خودکار شبانه (Nightly Reconciliation Job)
 * در ساعات خلوتی، ثبت‌نامی‌های روز را با صف پرونده‌های معلق اسکن می‌کند و موارد تطابق ۱۰۰٪ را پیوند می‌دهد.
 */
export function reconcilePendingDossiersNightly(
  submissions: FormSubmission[],
  profiles?: ClientProfileSummary[]
): {
  reconciledCount: number;
  updatedSubmissions: FormSubmission[];
  changedSubmissions: FormSubmission[];
  logs: string[];
} {
  const logs: string[] = [];
  let reconciledCount = 0;
  const now = new Date().toISOString();

  // نسخه قابل ویرایش از ارسالی‌ها
  const updatedSubmissions = submissions.map((s) => ({
    ...s,
    data: { ...(s.data || {}) },
  }));
  const changedMap = new Map<string, FormSubmission>();

  // ۱. گروه‌بندی ثبت‌نامی‌های سامانه بالحق بر اساس کد پرونده (به جز کارنامه‌های خام صفا)
  interface ClientGroup {
    caseCode: string;
    fullName: string;
    mobile: string;
    schoolName?: string;
    provinceCity?: string;
    birthYear?: number;
    gender?: string;
    safaUserCode?: string;
    detectedSafaCode?: string;
    submissions: FormSubmission[];
    hasLinkedSafa: boolean;
  }

  const clientGroups = new Map<string, ClientGroup>();

  updatedSubmissions.forEach((sub) => {
    const isSafaForm = sub.formId === 'form-safaan-assessment';
    const cCode = sub.data?.caseCode || sub.trackingCode;

    if (!isSafaForm && cCode) {
      if (!clientGroups.has(cCode)) {
        let bYear = extractBirthYear(sub.data?.birth_year || sub.data?.f_birth_date) || undefined;

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

        const fullName =
          sub.data?.fullName ||
          `${sub.data?.f_name || ''} ${sub.data?.f_family || ''}`.trim() ||
          sub.data?.f_fullname ||
          'مراجع بالحق';

        const mobile = normalizeMobile(sub.data?.f_mobile || sub.data?.bk_mobile || sub.mobile || '');

        clientGroups.set(cCode, {
          caseCode: cCode,
          fullName,
          mobile,
          schoolName: sub.data?.f_school_name || sub.data?.school_name,
          provinceCity: sub.data?.f_province_city || sub.data?.province,
          birthYear: bYear,
          gender,
          safaUserCode: sub.data?.safaUserCode || sub.detectedSafaCode,
          detectedSafaCode: sub.detectedSafaCode,
          submissions: [sub],
          hasLinkedSafa: false,
        });
      } else {
        const group = clientGroups.get(cCode)!;
        group.submissions.push(sub);
        if (!group.schoolName && (sub.data?.f_school_name || sub.data?.school_name)) {
          group.schoolName = sub.data?.f_school_name || sub.data?.school_name;
        }
        if (!group.provinceCity && (sub.data?.f_province_city || sub.data?.province)) {
          group.provinceCity = sub.data?.f_province_city || sub.data?.province;
        }
        if (!group.birthYear && sub.data?.f_birth_date) {
          const parts = String(sub.data.f_birth_date).split(/[/-]/);
          if (parts.length >= 1 && parseInt(parts[0]) > 1300 && parseInt(parts[0]) < 1450) {
            group.birthYear = parseInt(parts[0]);
          }
        }
        if (!group.gender && (sub.data?.gender || sub.data?.f_gender)) {
          group.gender = sub.data?.gender || sub.data?.f_gender;
        }
        if (!group.safaUserCode && (sub.data?.safaUserCode || sub.detectedSafaCode)) {
          group.safaUserCode = sub.data?.safaUserCode || sub.detectedSafaCode;
        }
      }
    }
  });

  // ۲. علامت‌گذاری مراجعانی که قبلاً کارنامه صفاً به پرونده‌شان متصل شده است
  updatedSubmissions.forEach((sub) => {
    if (sub.formId === 'form-safaan-assessment') {
      const cCode = sub.data?.caseCode;
      if (cCode && clientGroups.has(cCode)) {
        clientGroups.get(cCode)!.hasLinkedSafa = true;
      }
    }
  });

  // ۳. جداسازی کارنامه‌های صفای متصل‌نشده
  const unlinkedSafaSubs = updatedSubmissions.filter((sub) => {
    if (sub.formId !== 'form-safaan-assessment') return false;
    const cCode = sub.data?.caseCode;
    const isLinked = sub.linkingStatus === 'linked' || sub.data?.linkingStatus === 'linked';
    return !isLinked && (!cCode || cCode.startsWith('SF-') || cCode === sub.trackingCode || !clientGroups.has(cCode));
  });

  // ۴. تطبیق هوشمند هر مراجع متصل‌نشده با کارنامه‌های صفا بر مبنای بالاترین ضریب شباهت
  for (const client of clientGroups.values()) {
    if (client.hasLinkedSafa) continue;

    // الف) بررسی کد صریح صفا در دستگاه
    let matchedSafa: FormSubmission | null = null;
    let matchedCode = '';
    let matchScore = 100;

    if (client.safaUserCode) {
      const found = unlinkedSafaSubs.find(
        (s) =>
          s.data?.user_code === client.safaUserCode ||
          s.trackingCode === `SF-${client.safaUserCode}` ||
          s.trackingCode === client.safaUserCode
      );
      if (found) {
        matchedSafa = found;
        matchedCode = client.safaUserCode;
        matchScore = 100;
      }
    }

    // ب) محاسبه ضریب شباهت برای تمام کارنامه‌ها و انتخاب کاندید با بیشترین شباهت
    if (!matchedSafa) {
      const candidates: Array<{
        safa: FormSubmission;
        code: string;
        score: number;
        birthDiff: number;
        matchedFields: string[];
      }> = [];

      for (const safa of unlinkedSafaSubs) {
        const sSchool = safa.data?.school_name || safa.data?.f_school_name || '';
        const sProv = safa.data?.province || safa.data?.f_province_city || '';
        const sBirth = extractBirthYear(safa.data?.birth_year || safa.data?.f_birth_date) || undefined;
        const sGender = safa.data?.gender || safa.data?.f_gender || '';

        const sim = calculateDemographicSimilarity(
          {
            schoolName: client.schoolName,
            provinceCity: client.provinceCity,
            birthYear: client.birthYear,
            gender: client.gender,
          },
          {
            schoolName: sSchool,
            provinceCity: sProv,
            birthYear: sBirth,
            gender: sGender,
          }
        );

        if (sim.score >= 50) {
          const sCode = safa.data?.user_code || (safa.trackingCode ? safa.trackingCode.replace('SF-', '') : '');
          candidates.push({
            safa,
            code: sCode,
            score: sim.score,
            birthDiff: sim.birthDiff,
            matchedFields: sim.matchedFields,
          });
        }
      }

      // مرتب‌سازی بر مبنای بالاترین ضریب شباهت
      candidates.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (a.birthDiff !== b.birthDiff) return a.birthDiff - b.birthDiff;
        return b.matchedFields.length - a.matchedFields.length;
      });

      if (candidates.length > 0) {
        const top = candidates[0];
        matchedSafa = top.safa;
        matchedCode = top.code;
        matchScore = top.score;
      }
    }

    // ج) اعمال پیوند و ادغام دوطرفه در صورت یافتن کاندید با بالاترین شباهت
    if (matchedSafa && matchedCode) {
      // به‌روزرسانی کارنامه صفاً جهت ملحق شدن به پرونده مراجع در کارتابل
      matchedSafa.data = {
        ...matchedSafa.data,
        caseCode: client.caseCode,
        fullName: client.fullName,
        mobile: client.mobile,
        f_mobile: client.mobile,
        linkingStatus: 'linked',
        reconciledAt: now,
        reconciledReason: `تطبیق و ادغام با بالاترین ضریب شباهت (${matchScore}%) با پرونده ${client.fullName} (${client.caseCode})`,
        evaluationResult: matchedSafa.evaluationResult || matchedSafa.data?.evaluationResult,
      };
      matchedSafa.mobile = client.mobile;
      matchedSafa.linkingStatus = 'linked';
      matchedSafa.reconciledAt = now;
      matchedSafa.reconciledReason = `تطبیق و ادغام با بالاترین ضریب شباهت (${matchScore}%) با پرونده ${client.fullName}`;

      changedMap.set(matchedSafa.id, matchedSafa);

      // حذف از استخر کارنامه‌های متصل‌نشده
      const sIdx = unlinkedSafaSubs.findIndex((s) => s.id === matchedSafa!.id);
      if (sIdx !== -1) unlinkedSafaSubs.splice(sIdx, 1);

      // به‌روزرسانی ثبت‌نام‌های مراجع
      client.submissions.forEach((cSub) => {
        cSub.data = {
          ...cSub.data,
          safaUserCode: matchedCode,
          detectedSafaCode: matchedCode,
          linkingStatus: 'linked',
          reconciledAt: now,
          reconciledReason: `اتصال به کارنامه صفاً (${matchedCode} - تشابه ${matchScore}%)`,
        };
        cSub.detectedSafaCode = matchedCode;
        cSub.linkingStatus = 'linked';
        cSub.reconciledAt = now;
        changedMap.set(cSub.id, cSub);
      });

      client.hasLinkedSafa = true;
      reconciledCount++;
      logs.push(
        `کارنامه خودسنجی صفاً (کد ${matchedCode} با ضریب شباهت ${matchScore}%) با موفقیت به پرونده مراجع ${client.fullName} (${client.caseCode}) ادغام شد.`
      );
    }
  }

  return {
    reconciledCount,
    updatedSubmissions,
    changedSubmissions: Array.from(changedMap.values()),
    logs,
  };
}

/**
 * محاسبه ضریب شباهت ویژگی‌های ۴گانه جمعیت‌شناختی میان مراجع و کارنامه صفان
 */
export function calculateDemographicSimilarity(
  clientData: {
    schoolName?: string;
    provinceCity?: string;
    birthYear?: number;
    gender?: string;
  },
  safaData: {
    schoolName?: string;
    provinceCity?: string;
    birthYear?: number;
    gender?: string;
  }
): {
  score: number;
  matchedFields: string[];
  unmatchedFields: string[];
  birthDiff: number;
} {
  const matchedFields: string[] = [];
  const unmatchedFields: string[] = [];
  let earnedScore = 0;
  let totalWeight = 0;
  let birthDiff = 99;

  const cSchool = normalizePersianText(clientData.schoolName || '');
  const sSchool = normalizePersianText(safaData.schoolName || '');
  const cProv = normalizePersianText(clientData.provinceCity || '');
  const sProv = normalizePersianText(safaData.provinceCity || '');
  const cYear = clientData.birthYear;
  const sYear = safaData.birthYear;
  const cGender = clientData.gender ? normalizePersianText(clientData.gender) : '';
  const sGender = safaData.gender ? normalizePersianText(safaData.gender) : '';

  // ۱. نام مدرسه یا مرکز معارفی (وزن: ۳۵)
  if (cSchool && sSchool) {
    totalWeight += 35;
    const sim = stringSimilarity(cSchool, sSchool);
    if (sim >= 0.55 || cSchool.includes(sSchool) || sSchool.includes(cSchool)) {
      earnedScore += 35;
      matchedFields.push(`نام مرکز معارفی (${safaData.schoolName})`);
    } else {
      unmatchedFields.push('نام مرکز معارفی');
    }
  }

  // ۲. استان و شهر (وزن: ۲۵)
  if (cProv && sProv) {
    totalWeight += 25;
    const sim = stringSimilarity(cProv, sProv);
    if (sim >= 0.5 || cProv.includes(sProv) || sProv.includes(cProv)) {
      earnedScore += 25;
      matchedFields.push(`استان و شهر (${safaData.provinceCity})`);
    } else {
      unmatchedFields.push('استان و شهر');
    }
  }

  // ۳. سال تولد (وزن: ۲۵)
  if (cYear && sYear) {
    totalWeight += 25;
    birthDiff = Math.abs(cYear - sYear);
    if (birthDiff === 0) {
      earnedScore += 25;
      matchedFields.push(`سال تولد دقیق (${sYear})`);
    } else if (birthDiff === 1) {
      earnedScore += 16;
      matchedFields.push(`سال تولد با ۱ سال اختلاف (${sYear})`);
    } else if (birthDiff === 2) {
      earnedScore += 8;
      matchedFields.push(`سال تولد با ۲ سال اختلاف (${sYear})`);
    } else {
      unmatchedFields.push(`سال تولد (${cYear} در برابر ${sYear})`);
    }
  }

  // ۴. جنسیت (وزن: ۱۵)
  if (cGender && sGender) {
    totalWeight += 15;
    if (cGender === sGender || cGender.includes(sGender) || sGender.includes(cGender)) {
      earnedScore += 15;
      matchedFields.push(`جنسیت (${safaData.gender})`);
    } else {
      unmatchedFields.push('جنسیت');
    }
  }

  // اگر حداقل یک بعد اصلی یا دو بعد معتبر مقایسه شده باشند (حداقل وزن ۳۵)
  const finalPercent = totalWeight >= 35 ? Math.round((earnedScore / totalWeight) * 100) : 0;

  // پاداش همگرایی چندعاملی
  let convergenceBonus = 0;
  if (matchedFields.length >= 4) convergenceBonus = 10;
  else if (matchedFields.length === 3) convergenceBonus = 5;

  const scoreWithBonus = Math.min(100, finalPercent + (finalPercent > 0 ? convergenceBonus : 0));

  return {
    score: scoreWithBonus,
    matchedFields,
    unmatchedFields,
    birthDiff,
  };
}

/**
 * همانندسازی و ادغام خودکار کارنامه آزمون صفان با بالاترین ضریب شباهت در زمان ثبت‌نام مراجع
 */
export function matchAndMergeSafaForNewRegistration(
  newRegistrationSub: FormSubmission,
  allSubmissions: FormSubmission[]
): {
  mergedSafa: FormSubmission | null;
  updatedRegistrationSub: FormSubmission;
  matchScore: number;
} {
  const now = new Date().toISOString();
  const subData = newRegistrationSub.data || {};
  const caseCode = subData.caseCode || newRegistrationSub.trackingCode || `CASE-${newRegistrationSub.id.slice(-6)}`;
  const fullName =
    subData.fullName ||
    `${subData.f_name || ''} ${subData.f_family || ''}`.trim() ||
    subData.f_fullname ||
    'مراجع بالحق';
  const mobile = normalizeMobile(subData.f_mobile || subData.bk_mobile || newRegistrationSub.mobile || '');

  const schoolName = subData.f_school_name || subData.school_name || '';
  const provinceCity = subData.f_province_city || subData.province || '';
  const birthYear = extractBirthYear(subData.f_birth_date || subData.birth_year) || undefined;
  const gender =
    subData.gender ||
    subData.f_gender ||
    (subData.f_role_in_family?.includes('مادر') ||
    subData.f_role_in_family?.includes('دختر') ||
    subData.f_role_in_family?.includes('زن') ||
    subData.f_role_in_family?.includes('همسر (خانم)')
      ? 'خانم'
      : subData.f_role_in_family?.includes('پدر') ||
        subData.f_role_in_family?.includes('پسر') ||
        subData.f_role_in_family?.includes('مرد') ||
        subData.f_role_in_family?.includes('همسر (آقا)')
      ? 'آقا'
      : undefined);

  const detectedSafaCode =
    newRegistrationSub.detectedSafaCode ||
    subData.detectedSafaCode ||
    subData.safaUserCode ||
    (caseCode.startsWith('SF-') ? caseCode.replace('SF-', '') : undefined);

  // استخراج کارنامه‌های صفای انتساب‌نیافته
  const unlinkedSafas = allSubmissions.filter((s) => {
    if (s.formId !== 'form-safaan-assessment') return false;
    const isLinked = s.linkingStatus === 'linked' || s.data?.linkingStatus === 'linked';
    const sCaseCode = s.data?.caseCode || s.trackingCode;
    const hasRealCode = typeof sCaseCode === 'string' && sCaseCode.trim() !== '' && !sCaseCode.startsWith('SF-');
    return !(isLinked && hasRealCode);
  });

  if (unlinkedSafas.length === 0) {
    return { mergedSafa: null, updatedRegistrationSub: newRegistrationSub, matchScore: 0 };
  }

  // ۱. بررسی تطابق قطعی کد صفا
  if (detectedSafaCode) {
    const exact = unlinkedSafas.find(
      (s) =>
        s.data?.user_code === detectedSafaCode ||
        s.trackingCode === `SF-${detectedSafaCode}` ||
        s.trackingCode === detectedSafaCode
    );
    if (exact) {
      const mergedSafa: FormSubmission = {
        ...exact,
        mobile: mobile || exact.mobile,
        linkingStatus: 'linked',
        reconciledAt: now,
        reconciledReason: `تطابق قطعی کد دستگاه صفا (${detectedSafaCode}) در زمان ثبت‌نام`,
        data: {
          ...(exact.data || {}),
          caseCode,
          fullName,
          mobile,
          f_mobile: mobile,
          linkingStatus: 'linked',
          reconciledAt: now,
          reconciledReason: `تطابق قطعی کد دستگاه صفا (${detectedSafaCode}) در زمان ثبت‌نام`,
          evaluationResult: exact.evaluationResult || exact.data?.evaluationResult,
        },
      };

      const updatedReg: FormSubmission = {
        ...newRegistrationSub,
        detectedSafaCode,
        linkingStatus: 'linked',
        reconciledAt: now,
        data: {
          ...subData,
          safaUserCode: detectedSafaCode,
          detectedSafaCode,
          linkingStatus: 'linked',
          reconciledAt: now,
          reconciledReason: `اتصال قطعی به کارنامه صفا (${detectedSafaCode})`,
        },
      };

      return { mergedSafa, updatedRegistrationSub: updatedReg, matchScore: 100 };
    }
  }

  // ۲. محاسبه ضریب شباهت برای تمام کارنامه‌ها و انتخاب کاندید با بالاترین شباهت
  const candidates: Array<{
    safa: FormSubmission;
    code: string;
    score: number;
    birthDiff: number;
    matchedFields: string[];
  }> = [];

  for (const safa of unlinkedSafas) {
    const sSchool = safa.data?.school_name || safa.data?.f_school_name || '';
    const sProv = safa.data?.province || safa.data?.f_province_city || '';
    const sBirth = extractBirthYear(safa.data?.birth_year || safa.data?.f_birth_date) || undefined;
    const sGender = safa.data?.gender || safa.data?.f_gender || '';

    const sim = calculateDemographicSimilarity(
      { schoolName, provinceCity, birthYear, gender },
      { schoolName: sSchool, provinceCity: sProv, birthYear: sBirth, gender: sGender }
    );

    if (sim.score >= 50) {
      const sCode = safa.data?.user_code || (safa.trackingCode ? safa.trackingCode.replace('SF-', '') : '');
      candidates.push({
        safa,
        code: sCode,
        score: sim.score,
        birthDiff: sim.birthDiff,
        matchedFields: sim.matchedFields,
      });
    }
  }

  // مرتب‌سازی بر اساس بیشترین شباهت (نزولی)
  candidates.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (a.birthDiff !== b.birthDiff) return a.birthDiff - b.birthDiff;
    return b.matchedFields.length - a.matchedFields.length;
  });

  if (candidates.length === 0) {
    return { mergedSafa: null, updatedRegistrationSub: newRegistrationSub, matchScore: 0 };
  }

  const topMatch = candidates[0];
  const mergedSafa: FormSubmission = {
    ...topMatch.safa,
    mobile: mobile || topMatch.safa.mobile,
    linkingStatus: 'linked',
    reconciledAt: now,
    reconciledReason: `همانندسازی و ادغام خودکار با بیشترین شباهت (${topMatch.score}%) در زمان ثبت‌نام مراجع`,
    data: {
      ...(topMatch.safa.data || {}),
      caseCode,
      fullName,
      mobile,
      f_mobile: mobile,
      linkingStatus: 'linked',
      reconciledAt: now,
      reconciledReason: `همانندسازی و ادغام خودکار با بیشترین شباهت (${topMatch.score}%) در زمان ثبت‌نام مراجع`,
      evaluationResult: topMatch.safa.evaluationResult || topMatch.safa.data?.evaluationResult,
    },
  };

  const updatedReg: FormSubmission = {
    ...newRegistrationSub,
    detectedSafaCode: topMatch.code,
    linkingStatus: 'linked',
    reconciledAt: now,
    data: {
      ...subData,
      safaUserCode: topMatch.code,
      detectedSafaCode: topMatch.code,
      linkingStatus: 'linked',
      reconciledAt: now,
      reconciledReason: `اتصال خودکار به کارنامه صفاً (${topMatch.code} با تشابه ${topMatch.score}%)`,
    },
  };

  return { mergedSafa, updatedRegistrationSub: updatedReg, matchScore: topMatch.score };
}

export function extractClientProfiles(submissions: FormSubmission[]): ClientProfileSummary[] {
  const profileMap = new Map<string, ClientProfileSummary>();
  submissions.forEach((s) => {
    const cCode = s.data?.caseCode || s.trackingCode;
    if (cCode && !profileMap.has(cCode)) {
      let bYear = extractBirthYear(s.data?.birth_year || s.data?.f_birth_date) || undefined;

      const gender = s.data?.gender || s.data?.f_gender || (
        s.data?.f_role_in_family?.includes('مادر') || s.data?.f_role_in_family?.includes('دختر') || s.data?.f_role_in_family?.includes('زن') ? 'خانم' :
        s.data?.f_role_in_family?.includes('پدر') || s.data?.f_role_in_family?.includes('پسر') || s.data?.f_role_in_family?.includes('مرد') ? 'آقا' : undefined
      );

      profileMap.set(cCode, {
        caseCode: cCode,
        fullName: s.data?.fullName || `${s.data?.f_name || ''} ${s.data?.f_family || ''}`.trim() || '',
        mobile: s.data?.f_mobile || s.data?.bk_mobile || s.data?.mobile || '',
        schoolName: s.data?.f_school_name || s.data?.school_name,
        provinceCity: s.data?.f_province_city || s.data?.province,
        birthYear: bYear,
        gender,
        deviceFingerprint: s.deviceFingerprint,
        safaUserCode: s.detectedSafaCode || (cCode.startsWith('SF-') ? cCode.replace('SF-', '') : undefined),
      });
    }
  });
  return Array.from(profileMap.values());
}
