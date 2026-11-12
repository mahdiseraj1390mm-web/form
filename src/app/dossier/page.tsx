'use client';

import React, { useMemo, useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from '@/context/form-context';
import { ClientDossierFullview, ClientCaseGroup } from '@/components/submissions/client-dossier-fullview';
import { Layers, FileQuestion, ArrowRight } from 'lucide-react';
import { FormSubmission } from '@/types/form';
import { isUnassignedSafaSubmission } from '@/lib/safa-utils';

function DossierContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const caseCodeParam = searchParams.get('case') || searchParams.get('code');
  const { submissions } = useForm();
  
  const [apiFetchedCase, setApiFetchedCase] = useState<ClientCaseGroup | null>(null);
  const [isSearchingApi, setIsSearchingApi] = useState<boolean>(false);

  // واکشی مستقیم از سرور در صورتی که پرونده در حافظه اولیه کلاینت یافت نشد
  useEffect(() => {
    if (!caseCodeParam) return;
    const cleanParam = caseCodeParam.trim();

    // بررسی اولیه در سابمیشن‌های موجود
    const existsLocally = submissions.some((s) => {
      const cCode = s.data?.caseCode || s.trackingCode || s.id;
      const mob = s.data?.f_mobile || s.data?.bk_mobile || s.mobile;
      return (
        cCode?.toLowerCase() === cleanParam.toLowerCase() ||
        s.trackingCode?.toLowerCase() === cleanParam.toLowerCase() ||
        s.id === cleanParam ||
        (mob && String(mob).includes(cleanParam))
      );
    });

    if (existsLocally) {
      setApiFetchedCase(null);
      return;
    }

    // استعلام مستقیم از API سرور
    let isCancelled = false;
    setIsSearchingApi(true);

    const lookupCase = async () => {
      try {
        let res = await fetch(`/api/cases?code=${encodeURIComponent(cleanParam)}`);
        let json = await res.json();

        if (!json.found) {
          res = await fetch(`/api/cases?mobile=${encodeURIComponent(cleanParam)}`);
          json = await res.json();
        }

        if (json.found && json.caseRecord && !isCancelled) {
          const rec = json.caseRecord;
          const cCode = rec.case_code;
          const fullName = `${rec.first_name || ''} ${rec.last_name || ''}`.trim() || rec.data?.fullName || 'مراجع مرکز بالحق';
          const recMobile = rec.mobile || rec.data?.f_mobile || 'ثبت‌نشده';
          const recLocation = (rec.province && rec.city) ? `${rec.province} - ${rec.city}` : (rec.data?.f_province_city || 'ثبت‌نشده');

          const subItem: FormSubmission = {
            id: `case-${rec.id}`,
            formId: 'form-belhagh-registration',
            trackingCode: cCode,
            status: 'approved',
            createdAt: rec.created_at || new Date().toISOString(),
            comments: [],
            data: {
              ...rec.data,
              caseCode: cCode,
              fullName,
              f_name: rec.first_name || '',
              f_family: rec.last_name || '',
              f_mobile: recMobile,
              f_province_city: recLocation,
            },
          };

          setApiFetchedCase({
            caseCode: cCode,
            fullName,
            mobile: recMobile,
            provinceCity: recLocation,
            submissions: [subItem],
            formTitles: ['form-belhagh-registration'],
            totalFormsCount: 1,
            latestDate: rec.created_at || new Date().toISOString(),
            overallStatus: 'approved',
            totalPaidAmount: 0,
            roleInFamily: rec.data?.f_role_in_family || 'عضو خانواده',
          });
        }
      } catch (e) {
        console.warn('API dossier lookup error:', e);
      } finally {
        if (!isCancelled) setIsSearchingApi(false);
      }
    };

    lookupCase();

    return () => {
      isCancelled = true;
    };
  }, [caseCodeParam, submissions]);

  // گروه‌بندی خودکار پاسخ‌های ثبت‌شده جهت استخراج پرونده واقعی
  const targetCase: ClientCaseGroup | null = useMemo(() => {
    if (apiFetchedCase) {
      const updatedSubs = apiFetchedCase.submissions.map((s) => {
        const live = submissions.find((sub) => sub.id === s.id);
        return live || s;
      });
      return {
        ...apiFetchedCase,
        submissions: updatedSubs,
      };
    }
    if (submissions.length === 0) return null;

    // ۱. جستجوی سابمیشن منطبق با کد پرونده، کد پیگیری یا شماره تماس
    const activeSubs = submissions;
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
      : (activeSubs[0] || null);

    if (!matchSub) {
      return null;
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

    let clinicalSt: FormSubmission['status'] | null = null;
    for (const s of clientSubs) {
      const cand = s.data?.clinical_status || s.data?.caseStatus || s.data?.report?.status;
      if (cand && ['regressing', 'needs_followup', 'growing', 'optimal'].includes(cand)) {
        clinicalSt = cand as FormSubmission['status'];
        break;
      }
    }
    if (!clinicalSt) {
      for (const s of clientSubs) {
        if (s.status && ['regressing', 'needs_followup', 'growing', 'optimal'].includes(s.status)) {
          clinicalSt = s.status;
          break;
        }
      }
    }
    const resolvedStatus = clinicalSt || (matchSub.status === 'approved' ? 'optimal' : matchSub.status === 'rejected' ? 'regressing' : matchSub.status || 'new');

    return {
      caseCode: cCode,
      fullName: candidateName,
      mobile: matchSub.data?.f_mobile || matchSub.mobile || matchSub.data?.bk_mobile || 'ثبت‌نشده',
      provinceCity: matchSub.data?.f_province_city || matchSub.data?.province || 'ثبت‌نشده',
      submissions: clientSubs.length > 0 ? clientSubs : [matchSub],
      formTitles: clientSubs.map((s) => s.formId),
      totalFormsCount: clientSubs.length > 0 ? clientSubs.length : 1,
      latestDate: matchSub.createdAt || new Date().toISOString(),
      overallStatus: resolvedStatus as any,
      totalPaidAmount: totalPaid,
      roleInFamily: matchSub.data?.f_role_in_family || 'عضو خانواده',
    };
  }, [caseCodeParam, submissions, apiFetchedCase]);

  if (isSearchingApi) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center">
        <div className="flex items-center gap-2 text-slate-500 font-bold text-sm">
          <Layers className="size-5 animate-spin text-[#173f6b]" />
          <span>در حال استعلام پرونده مراجع از سرور...</span>
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
    <div className="min-h-screen w-full overflow-x-hidden bg-[#f5f7fa]">
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
