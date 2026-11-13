'use client';

import React, { useState, useEffect } from 'react';

export interface ConsultantAvatarProps {
  avatarUrl?: string | null;
  genderPrefix?: 'آقا' | 'خانم' | string | null;
  name?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  shape?: 'rounded' | 'circle';
  className?: string;
  showBadge?: boolean;
  alt?: string;
  title?: string;
}

/**
 * تشخیص جنسیت بر اساس پیشوند یا نام مشاور
 */
export function getGenderFromMember(
  genderPrefix?: string | null,
  name?: string | null
): 'male' | 'female' {
  const cleanPrefix = (genderPrefix || '').trim();
  if (cleanPrefix === 'خانم') return 'female';
  if (cleanPrefix === 'آقا' || cleanPrefix === 'آقای') return 'male';

  const cleanName = (name || '').trim();
  if (
    cleanName.startsWith('خانم') ||
    cleanName.includes('خانم') ||
    cleanName.includes('سرکار')
  ) {
    return 'female';
  }
  if (
    cleanName.startsWith('آقا') ||
    cleanName.startsWith('آقای') ||
    cleanName.includes('جناب')
  ) {
    return 'male';
  }

  // مشاوران شناخته‌شده خانم در مرکز
  const knownFemales = [
    'کریمی',
    'انصاری',
    'تیموریان',
    'عبدی (خانواده)',
    'گلیایی',
    'یاوری',
    'راستگو',
    'زینلی',
    'شوندی',
  ];
  if (knownFemales.some((fn) => cleanName.includes(fn))) {
    return 'female';
  }

  return 'male';
}

/**
 * آیکون اختصاصی وکتور برای مشاور آقا
 */
export const DefaultMaleAvatar: React.FC<{ className?: string }> = ({
  className = 'w-full h-full',
}) => {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="آیکون مشاور آقا"
    >
      <defs>
        <linearGradient id="maleBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E0F2FE" />
          <stop offset="100%" stopColor="#DBEAFE" />
        </linearGradient>
        <linearGradient id="maleHairGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1E293B" />
          <stop offset="100%" stopColor="#0F172A" />
        </linearGradient>
        <linearGradient id="maleSuitGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1E40AF" />
          <stop offset="100%" stopColor="#1E3A8A" />
        </linearGradient>
        <linearGradient id="maleSkinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FED7AA" />
          <stop offset="100%" stopColor="#FDBA74" />
        </linearGradient>
      </defs>

      {/* پس‌زمینه */}
      <rect width="80" height="80" rx="20" fill="url(#maleBgGrad)" />

      {/* شانه و کت رسمی */}
      <path
        d="M14 74C14 61.8497 23.8497 52 36 52H44C56.1503 52 66 61.8497 66 74V80H14V74Z"
        fill="url(#maleSuitGrad)"
      />

      {/* یقه پیراهن سفید */}
      <path d="M33 52L40 64L47 52H33Z" fill="#FFFFFF" />

      {/* کراوات یا خط میانی پیراهن */}
      <path d="M38.5 60L40 76L41.5 60L40 58L38.5 60Z" fill="#3B82F6" />

      {/* گردن */}
      <path d="M34 40H46V52H34V40Z" fill="url(#maleSkinGrad)" />
      {/* سایه زیر چانه */}
      <path d="M34 40C34 43 46 43 46 40V43C46 46 34 46 34 43V40Z" fill="#FB923C" opacity="0.4" />

      {/* سر و چهره */}
      <ellipse cx="40" cy="33" rx="14" ry="16" fill="url(#maleSkinGrad)" />

      {/* گوش‌ها */}
      <ellipse cx="25.5" cy="34" rx="2.5" ry="4" fill="url(#maleSkinGrad)" />
      <ellipse cx="54.5" cy="34" rx="2.5" ry="4" fill="url(#maleSkinGrad)" />

      {/* موهای مرتب مردانه */}
      <path
        d="M26 31C25 24 29 17 38 16C47 15 54 19 54 26C54 28 53 31 52 33C50 30 48 27 44 26C39 25 34 26 30 28C28 29 27 30 26 31Z"
        fill="url(#maleHairGrad)"
      />
      <path
        d="M25 29C24 25 28 17 40 16C47 16 54 20 54 27C51 23 46 22 40 22C33 22 28 25 25 29Z"
        fill="#334155"
      />

      {/* جزئیات چشم و لبخند ملایم */}
      <circle cx="34.5" cy="33.5" r="1.5" fill="#1E293B" />
      <circle cx="45.5" cy="33.5" r="1.5" fill="#1E293B" />
      {/* ابروها */}
      <path d="M32 30C33.5 29 36 29 37 30" stroke="#1E293B" strokeWidth="1.2" strokeLinecap="round" />
      <path d="M43 30C44 29 46.5 29 48 30" stroke="#1E293B" strokeWidth="1.2" strokeLinecap="round" />
      {/* لبخند */}
      <path d="M37 39C38.5 41 41.5 41 43 39" stroke="#EA580C" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
};

/**
 * آیکون اختصاصی وکتور برای مشاور خانم (با حجاب مقنعه رسمی و پوشش وزین درمانی)
 */
export const DefaultFemaleAvatar: React.FC<{ className?: string }> = ({
  className = 'w-full h-full',
}) => {
  return (
    <svg
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="آیکون مشاور خانم"
    >
      <defs>
        <linearGradient id="femaleBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDF4FF" />
          <stop offset="100%" stopColor="#F3E8FF" />
        </linearGradient>
        <linearGradient id="femaleHijabGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#581C87" />
          <stop offset="100%" stopColor="#3B0764" />
        </linearGradient>
        <linearGradient id="femaleCoatGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7E22CE" />
          <stop offset="100%" stopColor="#6B21A8" />
        </linearGradient>
        <linearGradient id="femaleSkinGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#FED7AA" />
          <stop offset="100%" stopColor="#FDBA74" />
        </linearGradient>
      </defs>

      {/* پس‌زمینه */}
      <rect width="80" height="80" rx="20" fill="url(#femaleBgGrad)" />

      {/* مانتو / پوشش شانه */}
      <path
        d="M14 74C14 62.5 23.5 53 35 53H45C56.5 53 66 62.5 66 74V80H14V74Z"
        fill="url(#femaleCoatGrad)"
      />

      {/* مقنعه / سرپوش رسمی بانوان */}
      <path
        d="M23 45C22 30 25 15 40 15C55 15 58 30 57 45C56 56 50 67 40 67C30 67 24 56 23 45Z"
        fill="url(#femaleHijabGrad)"
      />

      {/* گردی چهره درون مقنعه */}
      <ellipse cx="40" cy="35" rx="12" ry="14" fill="url(#femaleSkinGrad)" />

      {/* برش بالای مقنعه روی پیشانی */}
      <path
        d="M28 32C30 24 35 22 40 22C45 22 50 24 52 32C49 26 45 25 40 25C35 25 31 26 28 32Z"
        fill="#3B0764"
      />

      {/* جزئیات چهره مهربان و باوقار */}
      {/* چشم‌ها */}
      <circle cx="35" cy="34" r="1.4" fill="#1E293B" />
      <circle cx="45" cy="34" r="1.4" fill="#1E293B" />
      {/* مژه‌های ملایم */}
      <path d="M33 32.5C34.5 31.8 36.5 32 37 33" stroke="#1E293B" strokeWidth="1.1" strokeLinecap="round" />
      <path d="M43 33C43.5 32 45.5 31.8 47 32.5" stroke="#1E293B" strokeWidth="1.1" strokeLinecap="round" />
      {/* گونه‌ها */}
      <circle cx="32" cy="38" r="2" fill="#F472B6" opacity="0.35" />
      <circle cx="48" cy="38" r="2" fill="#F472B6" opacity="0.35" />
      {/* لبخند آرامش‌بخش */}
      <path d="M37.5 40.5C38.8 42 41.2 42 42.5 40.5" stroke="#BE185D" strokeWidth="1.3" strokeLinecap="round" />

      {/* امتداد چین‌های مقنعه زیر گردن و روی سینه */}
      <path
        d="M32 52C32 57 36 63 40 65C44 63 48 57 48 52C45 54 42 55 40 55C38 55 35 54 32 52Z"
        fill="#4C1D95"
      />
    </svg>
  );
};

const SIZE_MAP = {
  xs: 'w-6 h-6 min-w-6 text-[10px]',
  sm: 'w-8 h-8 min-w-8 text-xs',
  md: 'w-11 h-11 min-w-11 text-sm',
  lg: 'w-14 h-14 min-w-14 text-base',
  xl: 'w-18 h-18 min-w-18 text-lg',
  '2xl': 'w-24 h-24 min-w-24 text-xl',
};

export const ConsultantAvatar: React.FC<ConsultantAvatarProps> = ({
  avatarUrl,
  genderPrefix,
  name,
  size = 'md',
  shape = 'rounded',
  className = '',
  showBadge = false,
  alt,
  title,
}) => {
  const [imageError, setImageError] = useState(false);
  const gender = getGenderFromMember(genderPrefix, name);

  // ریست ارور هنگام تغییر آدرس تصویر
  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  const sizeClass = SIZE_MAP[size] || SIZE_MAP.md;
  const shapeClass = shape === 'circle' ? 'rounded-full' : 'rounded-2xl';
  const displayName = name || (gender === 'female' ? 'خانم مشاور' : 'آقای مشاور');
  const tooltip = title || displayName;

  const hasCustomImage = Boolean(avatarUrl && avatarUrl.trim() && !imageError);

  return (
    <div
      className={`relative shrink-0 select-none ${sizeClass} ${shapeClass} ${className}`}
      title={tooltip}
    >
      <div
        className={`w-full h-full overflow-hidden ${shapeClass} border border-slate-200/90 shadow-2xs flex items-center justify-center bg-slate-100`}
      >
        {hasCustomImage ? (
          <img
            src={avatarUrl!}
            alt={alt || displayName}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover object-top"
          />
        ) : gender === 'female' ? (
          <DefaultFemaleAvatar className="w-full h-full" />
        ) : (
          <DefaultMaleAvatar className="w-full h-full" />
        )}
      </div>

      {/* نشانگر کوچک جنسیت یا وضعیت در صورت فعال بودن */}
      {showBadge && (
        <span
          className={`absolute -bottom-1 -left-1 px-1 py-0.2 text-[9px] font-black rounded-full border-2 border-white shadow-xs ${
            gender === 'female'
              ? 'bg-purple-600 text-white'
              : 'bg-blue-600 text-white'
          }`}
          title={gender === 'female' ? 'مشاور خانم' : 'مشاور آقا'}
        >
          {gender === 'female' ? 'خانم' : 'آقا'}
        </span>
      )}
    </div>
  );
};
