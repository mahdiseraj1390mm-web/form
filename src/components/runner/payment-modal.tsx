'use client';

import React, { useState } from 'react';
import { ShieldCheck, CreditCard, Lock, CheckCircle2, X, RefreshCw } from 'lucide-react';
import { formatCurrency, toPersianDigits } from '@/lib/persian';

interface PaymentModalProps {
  isOpen: boolean;
  amount: number;
  description: string;
  gateway: string;
  onSuccess: (paymentRef: string) => void;
  onCancel: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  amount,
  description,
  gateway,
  onSuccess,
  onCancel,
}) => {
  const [cardNumber, setCardNumber] = useState('6037991823451234');
  const [cvv2, setCvv2] = useState('742');
  const [month, setMonth] = useState('08');
  const [year, setYear] = useState('05');
  const [dynamicPin, setDynamicPin] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpTimer, setOtpTimer] = useState(120);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleSendOtp = () => {
    setOtpSent(true);
    setDynamicPin('84291');
  };

  const handlePay = (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      const refId = `SHP-${Math.floor(10000000000 + Math.random() * 90000000000)}`;
      onSuccess(refId);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 text-xs">
        
        {/* هدر رسمی شاپرک */}
        <div className="bg-gradient-to-r from-slate-900 to-blue-950 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="font-extrabold text-sm tracking-wide">شاپرک | درگاه پرداخت اینترنتی</div>
              <div className="text-[10px] text-slate-300">اتصال امن SSL 256-Bit • بانک مرکزی جمهوری اسلامی ایران</div>
            </div>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-white p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* اطلاعات تراکنش */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-slate-500 text-[11px]">مبلغ قابل پرداخت:</span>
            <div className="text-base font-extrabold text-blue-900 mt-0.5">
              {formatCurrency(amount, 'IRT')}
            </div>
          </div>
          <div className="text-left">
            <span className="text-slate-500 text-[11px]">پذیرنده:</span>
            <div className="font-bold text-slate-800">سامانه فرم‌افزار سازمانی</div>
          </div>
        </div>

        {/* فرم ورود اطلاعات کارت بانکی */}
        <form onSubmit={handlePay} className="p-6 space-y-4">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">شماره کارت بانکی (۱۶ رقمی)</label>
            <div className="relative">
              <input
                type="text"
                value={cardNumber}
                onChange={(e) => setCardNumber(e.target.value)}
                maxLength={19}
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-center tracking-widest text-sm focus:ring-1 focus:ring-blue-600 bg-white"
                required
              />
              <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">کد شناسایی (CVV2)</label>
              <input
                type="password"
                value={cvv2}
                onChange={(e) => setCvv2(e.target.value)}
                maxLength={4}
                className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono text-center text-sm"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">تاریخ انقضا (ماه / سال)</label>
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  maxLength={2}
                  placeholder="سال"
                  className="w-1/2 px-2 py-2 border border-slate-300 rounded-md font-mono text-center text-xs"
                  required
                />
                <span className="text-slate-400">/</span>
                <input
                  type="text"
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  maxLength={2}
                  placeholder="ماه"
                  className="w-1/2 px-2 py-2 border border-slate-300 rounded-md font-mono text-center text-xs"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">رمز دوم پویا (پیامکی)</label>
            <div className="flex gap-2">
              <input
                type="password"
                value={dynamicPin}
                onChange={(e) => setDynamicPin(e.target.value)}
                maxLength={6}
                placeholder="رمز ارسال‌شده"
                className="flex-1 px-3 py-2 border border-slate-300 rounded-md font-mono text-center text-sm"
                required
              />
              <button
                type="button"
                onClick={handleSendOtp}
                className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-md border border-slate-300 transition-colors whitespace-nowrap"
              >
                {otpSent ? 'رمز: ۸۴۲۹۱' : 'دریافت رمز پویا'}
              </button>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-md font-medium"
            >
              انصراف
            </button>
            <button
              type="submit"
              disabled={isProcessing}
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold rounded-md shadow-md transition-all flex items-center gap-2"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>در حال اعتبارسنجی بانکی...</span>
                </>
              ) : (
                <>
                  <Lock className="w-4 h-4" />
                  <span>پرداخت و تأیید نهایی</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
