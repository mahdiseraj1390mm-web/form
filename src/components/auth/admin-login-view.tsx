'use client';

import React, { useState } from 'react';
import { useAdminAuth } from '@/context/admin-auth-context';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  Eye, 
  EyeOff, 
  LogIn, 
  AlertCircle, 
  Layers,
  Sparkles,
  CheckCircle2,
  Building2
} from 'lucide-react';

export const AdminLoginView: React.FC = () => {
  const { login } = useAdminAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      setErrorMessage('لطفاً نام کاربری را وارد نمایید.');
      return;
    }
    if (!password) {
      setErrorMessage('لطفاً کلمه عبور را وارد نمایید.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const result = await login(username, password, rememberMe);
    if (!result.success) {
      setErrorMessage(result.error || 'نام کاربری یا کلمه عبور اشتباه است.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen min-h-[100dvh] flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100 p-4 sm:p-6 relative overflow-hidden selection:bg-blue-600 selection:text-white">
      {/* هاله‌های نوری پس‌زمینه (Ambient Gradients) */}
      <div className="absolute top-[-10%] right-[-5%] w-[450px] h-[450px] bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-5%] w-[450px] h-[450px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-600/5 rounded-full blur-[140px] pointer-events-none" />

      {/* خطوط و پترن شبکه ای مدرن */}
      <div 
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255,255,255,0.7) 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }}
      />

      {/* کارت اصلی ورود */}
      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] p-6 sm:p-8 space-y-6">
          
          {/* لوگو و سربرگ برند */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/20 ring-4 ring-blue-500/10">
              <Layers className="w-8 h-8" />
            </div>

            <div>
              <div className="flex items-center justify-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  فرم‌افزار سازمانی
                </h1>
                <span className="text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  سازمانی Pro
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                سامانه هوشمند خدمات روانشناسی بالحق
              </p>
            </div>
          </div>

          <div className="border-t border-slate-800/80 pt-4">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-blue-400" />
                ورود به پنل مدیریت
              </span>
              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                دسترسی محافظت‌شده
              </span>
            </div>

            {/* پیام خطا */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2.5 animate-in fade-in slide-in-from-top-1">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* فرم ورود */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* نام کاربری */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  نام کاربری
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="admin"
                    dir="ltr"
                    autoFocus
                    required
                    className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono"
                  />
                </div>
              </div>

              {/* کلمه عبور */}
              <div className="space-y-1.5">
                <label className="block text-xs font-medium text-slate-300">
                  کلمه عبور
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    placeholder="••••••••••••"
                    dir="ltr"
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950/60 border border-slate-700/80 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all font-mono tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                    tabIndex={-1}
                    title={showPassword ? 'مخفی‌سازی رمز' : 'نمایش رمز'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* مرا به خاطر بسپار */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none text-slate-400 hover:text-slate-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-blue-600 focus:ring-blue-500 focus:ring-offset-slate-900"
                  />
                  <span>مرا در این سیستم به خاطر بسپار</span>
                </label>
              </div>

              {/* دکمه ارسال */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:from-blue-700 active:to-indigo-700 shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>در حال احراز هویت...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>ورود به پنل ادمین</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* پانویس امنیتی */}
          <div className="border-t border-slate-800/80 pt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
              حفاظت امنیتی ۲۵۶ بیتی داده‌ها
            </span>
            <span>مرکز مشاوره و خدمات روانشناسی بالحق</span>
          </div>

        </div>

        {/* بازگشت یا مشاهده فرم کاربر */}
        <div className="text-center mt-5">
          <p className="text-xs text-slate-500">
            مراجعان و کاربران محترم نیازی به ورود ندارند و می‌توانند فرم‌ها را از طریق لینک اختصاصی تکمیل نمایند.
          </p>
        </div>
      </div>
    </div>
  );
};
