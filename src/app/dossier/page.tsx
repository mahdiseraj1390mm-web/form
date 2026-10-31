'use client';

import React, { useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from '@/context/form-context';
import { ClientDossierFullview, ClientCaseGroup } from '@/components/submissions/client-dossier-fullview';
import { Layers, FileQuestion, ArrowRight } from 'lucide-react';

function DossierContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const caseCodeParam = searchParams.get('case') || searchParams.get('code');
  const { submissions } = useForm();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // گروه‌بندی خودکار پاسخ‌های ثبت‌شده جهت استخراج پرونده واقعی
  const targetCase: ClientCaseGroup | null = useMemo(() => {
    if (!mounted || submissions.length === 0) return null;

    // ۱. جستجوی سابمیشن منطبق با کد پرونده، کد پیگیری یا شماره تماس
    let matchSub = caseCodeParam
      ? submissions.find((s) => {
          const cCode = s.data?.caseCode || s.trackingCode || s.id;
          const mob = s.data?.f_mobile || s.data?.bk_mobile || s.mobile;
          const cleanParam = caseCodeParam.trim().toLowerCase();
          return (
            cCode?.toLowerCase() === cleanParam ||
            s.trackingCode?.toLowerCase() === cleanParam ||
            s.id === caseCodeParam ||
            (mob && String(mob).includes(cleanParam))
          );
        })
      : submissions[0];

    if (!matchSub) {
      if (!caseCodeParam && submissions.length > 0) {
        matchSub = submissions[0];
      } else {
        return null;
      }
    }

    const cCode = matchSub.data?.caseCode || matchSub.trackingCode || `CASE-${matchSub.id.slice(-6)}`;
    const clientSubs = submissions.filter(
      (s) =>
        (s.data?.caseCode && s.data.caseCode === cCode) ||
        s.trackingCode === cCode ||
        (matchSub.mobile && s.mobile === matchSub.mobile) ||
        (matchSub.data?.f_mobile && s.data?.f_mobile === matchSub.data.f_mobile)
    );

    const candidateName =
      matchSub.data?.fullName ||
      (matchSub.data?.f_name || matchSub.data?.f_family
        ? `${matchSub.data?.f_name || ''} ${matchSub.data?.f_family || ''}`.trim()
        : '') ||
      matchSub.data?.f_fullname ||
      'مراجع مرکز بالحق';

    const totalPaid = clientSubs.reduce(
      (acc, curr) => acc + (curr.paymentStatus === 'paid' ? curr.paymentAmount || 0 : 0),
      0
    );

    return {
      caseCode: cCode,
      fullName: candidateName,
      mobile: matchSub.data?.f_mobile || matchSub.mobile || matchSub.data?.bk_mobile || 'ثبت‌نشده',
      provinceCity: matchSub.data?.f_province_city || matchSub.data?.province || 'ثبت‌نشده',
      submissions: clientSubs.length > 0 ? clientSubs : [matchSub],
      formTitles: clientSubs.map((s) => s.formId),
      totalFormsCount: clientSubs.length > 0 ? clientSubs.length : 1,
      latestDate: matchSub.createdAt || new Date().toISOString(),
      overallStatus: matchSub.status || 'new',
      totalPaidAmount: totalPaid,
      roleInFamily: matchSub.data?.f_role_in_family || 'عضو خانواده',
    };
  }, [caseCodeParam, submissions, mounted]);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
          <Layers className="size-5 animate-spin text-[#173f6b]" />
          <span>در حال بارگذاری پرونده مراجع...</span>
        </div>
      </div>
    );
  }

  if (!targetCase) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center p-4" dir="rtl">
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm max-w-md w-full text-center space-y-4">
          <div className="grid size-14 place-items-center rounded-2xl bg-slate-100 text-slate-400 mx-auto">
            <FileQuestion className="size-7" />
          </div>
          <h2 className="text-lg font-black text-slate-800">پرونده‌ای یافت نشد</h2>
          <p className="text-xs text-slate-500 leading-relaxed">
            {caseCodeParam
              ? `هیچ پرونده‌ای با مشخصات یا کد «${caseCodeParam}» در پایگاه‌داده بالحق یافت نشد.`
              : 'هیچ پرونده ثبت‌شده‌ای در سیستم موجود نیست.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#173f6b] text-white rounded-xl text-xs font-bold hover:bg-[#123357] transition cursor-pointer"
          >
            <ArrowRight className="size-4" />
            <span>بازگشت به سامانه</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa]">
      <ClientDossierFullview clientCase={targetCase} onClose={() => router.push('/')} />
    </div>
  );
}

export default function DossierPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center">
          <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
            <Layers className="size-5 animate-spin text-[#173f6b]" />
            <span>در حال بارگذاری پرونده مراجع...</span>
          </div>
        </div>
      }
    >
      <DossierContent />
    </Suspense>
  );
}
