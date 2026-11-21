import { Form, FormSubmission, FormField } from '@/types/form';
import {
  FamilyDossierGroup,
  FamilyMemberSummary,
  FamilyQuestionComparisonItem,
} from '@/types/advanced';
import { extractBirthYear, formatClientAge, getFieldDisplayValue } from '@/lib/persian';
import { extractCleanName, isPlaceholderClientName } from '@/lib/client-identity';

/**
 * سرویس دامنه مدیریت پرونده‌ها و فرم‌های خانوادگی (Domain Service)
 * پیاده‌سازی شده بر اساس اصول مهندسی نرم‌افزار، شیءگرایی (OOP)، تفکیک مسئولیت‌ها (SRP)
 * و پویایی ۱۰۰٪ بدون وابستگی به داده‌های هاردکد شده یا اطلاعات فیک.
 */
export class FamilyDomainService {
  /**
   * نرمال‌سازی کدهای پرونده و خانواده
   */
  public static sanitizeCode(code?: string | null): string {
    if (!code) return '';
    return String(code)
      .trim()
      .replace(/^sub-case-/, '')
      .replace(/^sub-/, '')
      .trim();
  }

  /**
   * تشخیص قطعی و پویای اینکه آیا یک سابمیشن متعلق به فرم خانوادگی است یا خیر
   */
  public static isFamilySubmission(sub: FormSubmission, forms: Form[]): boolean {
    if (sub.isFamilySubmission === true || sub.data?.isFamilySubmission === true) {
      return true;
    }
    if (Boolean(sub.familyCaseCode || sub.data?.familyCaseCode || sub.data?.f_family_code)) {
      return true;
    }
    if (Boolean(sub.familyRole || sub.data?.familyRole)) {
      return true;
    }
    const matchingForm = forms.find((f) => f.id === sub.formId || f.slug === sub.formId);
    if (matchingForm?.formType === 'family') {
      return true;
    }
    return false;
  }

  /**
   * استخراج پویای کد پرونده فردی عضو
   */
  public static extractMemberCaseCode(sub: FormSubmission): string {
    const raw =
      sub.data?.caseCode ||
      sub.data?.f_case_code ||
      sub.trackingCode ||
      (sub.id.startsWith('sub-case-') ? sub.id : '');
    return this.sanitizeCode(raw);
  }

  /**
   * استخراج پویای کد پرونده خانوادگی
   */
  public static extractFamilyCode(
    sub: FormSubmission,
    memberToFamilyIndex: Map<string, string>,
    memberCode: string
  ): string | null {
    // ۱. بررسی مقادیر صریح کد خانواده در سابمیشن
    const explicitFamCode =
      sub.familyCaseCode ||
      sub.data?.familyCaseCode ||
      sub.data?.f_family_code ||
      sub.data?.family_code;

    if (explicitFamCode && String(explicitFamCode).trim()) {
      let cleaned = String(explicitFamCode).trim();
      if (!cleaned.toUpperCase().startsWith('FAM-') && !cleaned.toUpperCase().startsWith('FAMILY-')) {
        cleaned = `FAM-${cleaned}`;
      }
      return cleaned;
    }

    // ۲. بررسی کلیدهای داینامیک فیلدها در صورت ایجاد فرم توسط کاربر با شناسه‌های دلخواه
    if (sub.data && typeof sub.data === 'object') {
      for (const [key, val] of Object.entries(sub.data)) {
        if (
          (key.toLowerCase().includes('family_code') || key.toLowerCase().includes('familycasecode')) &&
          val &&
          typeof val === 'string' &&
          val.trim()
        ) {
          let cleaned = val.trim();
          if (!cleaned.toUpperCase().startsWith('FAM-')) {
            cleaned = `FAM-${cleaned}`;
          }
          return cleaned;
        }
      }
    }

    // ۳. بررسی نگاشت‌های قبلی اعضا به خانواده
    if (memberCode && memberToFamilyIndex.has(memberCode)) {
      return memberToFamilyIndex.get(memberCode)!;
    }

    return null;
  }

  /**
   * استخراج پویای نقش فرد در خانواده
   */
  public static extractFamilyRole(sub: FormSubmission, form?: Form): string {
    const explicitRole =
      sub.familyRole ||
      sub.data?.familyRole ||
      sub.data?.f_role_in_family ||
      sub.data?.role_in_family ||
      sub.data?.f_role ||
      sub.data?.role;

    if (explicitRole && typeof explicitRole === 'string' && explicitRole.trim()) {
      return explicitRole.trim();
    }

    // بررسی فیلدهای فرم بر مبنای برچسب یا شناسه
    if (form && form.fields) {
      const roleField = form.fields.find(
        (f) =>
          f.id.includes('role_in_family') ||
          f.id.includes('familyRole') ||
          f.label.includes('نقش در خانواده') ||
          f.label.includes('نقش خود')
      );
      if (roleField && sub.data?.[roleField.id]) {
        return String(sub.data[roleField.id]).trim();
      }
    }

    return 'عضو خانواده';
  }

  /**
   * استخراج نام تمیز و کامل عضو
   */
  public static extractMemberFullName(sub: FormSubmission): string {
    const { fullName, firstName, lastName } = extractCleanName(sub.data);
    if (!isPlaceholderClientName(fullName)) {
      return fullName;
    }
    if (firstName || lastName) {
      return `${firstName} ${lastName}`.trim();
    }
    if (sub.data?.fullName && !isPlaceholderClientName(sub.data.fullName)) {
      return String(sub.data.fullName).trim();
    }
    const role = sub.familyRole || sub.data?.f_role_in_family;
    const cCode = this.extractMemberCaseCode(sub);
    return role && cCode ? `${role} (${cCode})` : (cCode ? `مراجع ${cCode}` : 'عضو خانواده');
  }

  /**
   * استخراج عنوان هوشمند خانواده
   */
  public static extractFamilyTitle(famGroup: {
    members: FamilyMemberSummary[];
    submissions: FormSubmission[];
  }): string {
    // جستجوی نام خانوادگی مشترک یا نام خانوادگی سرپرست (پدر یا مادر)
    const headMember =
      famGroup.members.find((m) => m.role.includes('پدر')) ||
      famGroup.members.find((m) => m.role.includes('مادر')) ||
      famGroup.members[0];

    if (headMember && headMember.fullName && !headMember.fullName.startsWith('مراجع')) {
      const parts = headMember.fullName.split(' ');
      if (parts.length > 1) {
        return `خانواده ${parts.slice(1).join(' ')}`;
      }
      return `خانواده ${headMember.fullName}`;
    }

    for (const sub of famGroup.submissions) {
      if (sub.data?.f_family) {
        return `خانواده ${sub.data.f_family}`;
      }
      const { lastName } = extractCleanName(sub.data);
      if (lastName) {
        return `خانواده ${lastName}`;
      }
    }

    return 'خانواده مراجع';
  }

  /**
   * تجمیع کاملاً پویا و پایدار کلیه پرونده‌های خانوادگی بر اساس پاسخ‌های ذخیره شده در پایگاه‌داده
   */
  public static buildFamilyDossiers(
    submissions: FormSubmission[],
    forms: Form[]
  ): FamilyDossierGroup[] {
    const familyMap = new Map<string, FamilyDossierGroup>();
    const memberToFamilyIndex = new Map<string, string>();

    // فاز ۱: ساخت فهرست اولیه پیوندهای اعضا به کد خانواده
    submissions.forEach((sub) => {
      const memberCode = this.extractMemberCaseCode(sub);
      const famCode = this.extractFamilyCode(sub, memberToFamilyIndex, memberCode);
      if (famCode && memberCode) {
        memberToFamilyIndex.set(memberCode, famCode);
      }
    });

    // فاز ۲: استخراج خانواده‌ها و تجمیع سوابق فرم‌ها
    submissions.forEach((sub) => {
      const memberCode = this.extractMemberCaseCode(sub);
      const isFamilyForm = this.isFamilySubmission(sub, forms);

      let famCode = this.extractFamilyCode(sub, memberToFamilyIndex, memberCode);

      // در صورتی که فرم خانوادگی است و کد مشخصی برای خانواده وجود ندارد، از کد پرونده اولین عضو استفاده می‌شود
      if (!famCode && isFamilyForm && memberCode) {
        famCode = `FAM-${memberCode}`;
        memberToFamilyIndex.set(memberCode, famCode);
      }

      // اگر به هیچ خانواده‌ای متصل نیست، این سابمیشن پرونده مستقل فردی است
      if (!famCode) return;

      const cleanFamCode = famCode.trim();
      const mobile =
        sub.data?.f_mobile ||
        sub.data?.bk_mobile ||
        sub.data?.mobile ||
        sub.mobile ||
        '';
      const provinceCity = sub.data?.f_province_city || 'ثبت‌نشده';
      const role = this.extractFamilyRole(sub, forms.find((f) => f.id === sub.formId));
      const memberFullName = this.extractMemberFullName(sub);

      if (!familyMap.has(cleanFamCode)) {
        familyMap.set(cleanFamCode, {
          familyCode: cleanFamCode,
          familyName: 'خانواده مراجع',
          headCaseCode: memberCode || undefined,
          provinceCity,
          contactMobile: mobile,
          members: [],
          familySubmissions: [],
          individualSubmissions: [],
          createdAt: sub.createdAt,
          updatedAt: sub.createdAt,
        });
      }

      const famGroup = familyMap.get(cleanFamCode)!;

      // به‌روزرسانی تاریخ آخرین فعالیت
      if (new Date(sub.createdAt) > new Date(famGroup.updatedAt)) {
        famGroup.updatedAt = sub.createdAt;
      }
      if (mobile && (!famGroup.contactMobile || famGroup.contactMobile.startsWith('0900'))) {
        famGroup.contactMobile = mobile;
      }
      if (provinceCity && provinceCity !== 'ثبت‌نشده' && famGroup.provinceCity === 'ثبت‌نشده') {
        famGroup.provinceCity = provinceCity;
      }

      // تفکیک فرم‌های خانوادگی از فرم‌های فردی
      if (isFamilyForm) {
        if (!famGroup.familySubmissions.some((s) => s.id === sub.id)) {
          famGroup.familySubmissions.push(sub);
        }
      } else {
        if (!famGroup.individualSubmissions.some((s) => s.id === sub.id)) {
          famGroup.individualSubmissions.push(sub);
        }
      }

      // درج یا به‌روزرسانی عضو در خانواده
      if (memberCode) {
        let member = famGroup.members.find((m) => m.caseCode === memberCode);
        if (!member) {
          let computedAge = 'ثبت‌نشده';
          const bDate = sub.data?.f_birth_date || sub.data?.birth_date || sub.data?.birthDate;
          if (bDate) {
            computedAge = formatClientAge(extractBirthYear(bDate));
          } else if (sub.data?.f_age || sub.data?.age) {
            computedAge = formatClientAge(null, sub.data?.f_age || sub.data?.age);
          }

          member = {
            caseCode: memberCode,
            fullName: memberFullName,
            role,
            mobile,
            age: computedAge,
            individualSubmissionsCount: 0,
            familySubmissionsCount: 0,
            lastActiveDate: sub.createdAt,
          };
          famGroup.members.push(member);
        }

        if (isFamilyForm) {
          member.familySubmissionsCount++;
        } else {
          member.individualSubmissionsCount++;
        }

        if (role && role !== 'عضو خانواده' && (!member.role || member.role === 'عضو خانواده')) {
          member.role = role;
        }
        if (memberFullName && !memberFullName.startsWith('مراجع') && member.fullName.startsWith('مراجع')) {
          member.fullName = memberFullName;
        }
        if (new Date(sub.createdAt) > new Date(member.lastActiveDate)) {
          member.lastActiveDate = sub.createdAt;
        }
      }
    });

    // فاز ۳: تنظیم عناوین هوشمند خانواده‌ها
    const result: FamilyDossierGroup[] = [];
    familyMap.forEach((group) => {
      group.familyName = this.extractFamilyTitle({
        members: group.members,
        submissions: [...group.familySubmissions, ...group.individualSubmissions],
      });
      result.push(group);
    });

    return result.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }

  /**
   * موتور مقایسه تطبیقی سوال‌به‌سوال پاسخ‌های اعضای خانواده در یک فرم دلخواه (Comparison Engine)
   */
  public static compareFamilyAnswers(
    familyGroup: FamilyDossierGroup,
    form: Form
  ): {
    form: Form;
    members: FamilyMemberSummary[];
    questions: FamilyQuestionComparisonItem[];
    consensusCount: number;
    divergenceCount: number;
    agreementRate: number;
  } {
    const formSubs = familyGroup.familySubmissions.filter(
      (s) => s.formId === form.id || s.formId === form.slug
    );
    const members = familyGroup.members;

    const questions: FamilyQuestionComparisonItem[] = [];
    let consensusCount = 0;
    let divergenceCount = 0;

    (form.fields || []).forEach((field) => {
      // نادیده گرفتن المان‌های نمایشی یا جداکننده‌ها
      if (['sectionDivider', 'alertBox'].includes(field.type)) return;

      // تشخیص پویای فیلدهای ارتباطی و هویتی (بدون هاردکد کردن شناسه‌ها)
      const fieldIdLower = field.id.toLowerCase();
      const fieldLabelLower = (field.label || '').toLowerCase();
      const isIdentityField = Boolean(
        fieldIdLower.includes('case_code') ||
        fieldIdLower.includes('role_in_family') ||
        fieldIdLower.includes('family_code') ||
        fieldIdLower.includes('familyrole') ||
        fieldIdLower.includes('familycasecode') ||
        fieldLabelLower.includes('کد پرونده') ||
        fieldLabelLower.includes('نقش در خانواده') ||
        fieldLabelLower.includes('کد خانواده')
      );

      const memberAnswers: Record<
        string,
        { role: string; memberName: string; answer: any; displayValue: string }
      > = {};
      const answerValues: string[] = [];

      formSubs.forEach((sub) => {
        const rawMemberCode = this.extractMemberCaseCode(sub);
        const member = members.find((m) => m.caseCode === rawMemberCode);
        const role = sub.familyRole || member?.role || this.extractFamilyRole(sub, form);
        const name = member?.fullName || this.extractMemberFullName(sub);
        const rawAns = sub.data?.[field.id];

        const displayVal =
          rawAns !== undefined && rawAns !== null && String(rawAns).trim() !== ''
            ? getFieldDisplayValue(rawAns, field)
            : 'ثبت‌نشده';

        if (rawAns !== undefined && rawAns !== null && String(rawAns).trim() !== '') {
          answerValues.push(String(rawAns).trim().toLowerCase());
        }

        const key = rawMemberCode || sub.id;
        memberAnswers[key] = {
          role,
          memberName: name,
          answer: rawAns,
          displayValue: displayVal,
        };
      });

      // محاسبه پویای وفاق در برابر اختلاف دیدگاه
      const distinctAnswers = new Set(answerValues);
      let isConsensus = true;
      let divergenceLevel: 'none' | 'moderate' | 'high' = 'none';

      if (!isIdentityField && answerValues.length > 1) {
        if (distinctAnswers.size > 1) {
          isConsensus = false;
          divergenceLevel = distinctAnswers.size >= 3 ? 'high' : 'moderate';
          divergenceCount++;
        } else {
          isConsensus = true;
          divergenceLevel = 'none';
          consensusCount++;
        }
      }

      questions.push({
        fieldId: field.id,
        questionLabel: field.label,
        stepTitle: form.steps?.find((s) => s.fieldIds?.includes(field.id) || s.id === field.stepId)?.title,
        memberAnswers,
        isConsensus,
        divergenceLevel,
      });
    });

    const totalEvaluated = consensusCount + divergenceCount;
    const agreementRate = totalEvaluated > 0 ? Math.round((consensusCount / totalEvaluated) * 100) : 100;

    return {
      form,
      members,
      questions,
      consensusCount,
      divergenceCount,
      agreementRate,
    };
  }
}
