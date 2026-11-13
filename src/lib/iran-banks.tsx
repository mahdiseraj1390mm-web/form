import React from 'react';
import { toEnglishDigits, toPersianDigits } from './persian';

export interface BankConfig {
  key: string;
  name: string;
  shortName: string;
  prefixes: string[];
  gradient: string; // Tailwind background gradient
  accentColor: string; // Hex for borders/chips
  textColor: string;
  subTextColor: string;
  chipColor: 'gold' | 'silver' | 'copper';
  patternType: 'waves' | 'geometric' | 'curves' | 'minimal' | 'islamic' | 'dots';
  logoSvg: (props: { className?: string }) => React.ReactNode;
}

// لوگوهای وکتور و شیک بانک‌های ایران
const MelliLogo = ({ className = 'w-7 h-7' }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="46" stroke="#fbbf24" strokeWidth="6" strokeDasharray="6 4" />
    <circle cx="50" cy="50" r="38" fill="#fbbf24" fillOpacity="0.15" />
    <path d="M50 18L56 34H73L59 45L64 62L50 51L36 62L41 45L27 34H44L50 18Z" fill="#fbbf24" />
    <circle cx="50" cy="74" r="7" fill="#fbbf24" />
  </svg>
);

const MellatLogo = ({ className = 'w-7 h-7' }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="15" y="15" width="70" height="70" rx="16" fill="#dc2626" />
    <rect x="25" y="25" width="50" height="50" rx="10" stroke="#ffffff" strokeWidth="6" />
    <circle cx="50" cy="50" r="14" fill="#fbbf24" />
    <path d="M50 25V36M50 64V75M25 50H36M64 50H75" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" />
  </svg>
);

const SaderatLogo = ({ className = 'w-7 h-7' }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="44" stroke="#facc15" strokeWidth="7" />
    <circle cx="50" cy="50" r="32" stroke="#facc15" strokeWidth="4" />
    <path d="M50 20C40 30 35 45 50 65C65 45 60 30 50 20Z" fill="#facc15" />
    <circle cx="50" cy="74" r="5" fill="#facc15" />
  </svg>
);

const TejaratLogo = ({ className = 'w-7 h-7' }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="44" stroke="#38bdf8" strokeWidth="6" />
    <path d="M50 22C38 32 38 68 50 78C62 68 62 32 50 22Z" fill="#38bdf8" fillOpacity="0.3" stroke="#38bdf8" strokeWidth="4" />
    <circle cx="50" cy="50" r="12" fill="#38bdf8" />
  </svg>
);

const SepahLogo = ({ className = 'w-7 h-7' }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M50 14L82 26V54C82 72 68 85 50 90C32 85 18 72 18 54V26L50 14Z" fill="#1e293b" stroke="#eab308" strokeWidth="6" />
    <path d="M50 30L55 42H68L58 50L62 62L50 54L38 62L42 50L32 42H45L50 30Z" fill="#eab308" />
  </svg>
);

const PasargadLogo = ({ className = 'w-7 h-7' }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="44" stroke="#f59e0b" strokeWidth="5" />
    <path d="M30 65C30 45 42 35 55 35C65 35 72 42 70 52C68 60 58 65 50 65H30Z" fill="#f59e0b" />
    <circle cx="58" cy="30" r="8" fill="#f59e0b" />
    <path d="M32 72H68" stroke="#f59e0b" strokeWidth="5" strokeLinecap="round" />
  </svg>
);

const SamanLogo = ({ className = 'w-7 h-7' }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="44" fill="#0284c7" fillOpacity="0.2" stroke="#38bdf8" strokeWidth="6" />
    <path d="M30 50A20 20 0 0 1 70 50A10 10 0 0 1 50 50A10 10 0 0 0 30 50" stroke="#38bdf8" strokeWidth="7" strokeLinecap="round" />
  </svg>
);

const ParsianLogo = ({ className = 'w-7 h-7' }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" stroke="#fda4af" strokeWidth="4" />
    <path d="M50 20C42 36 32 50 32 64C32 74 40 82 50 82C60 82 68 74 68 64C68 50 58 36 50 20Z" fill="#fda4af" />
    <circle cx="50" cy="54" r="7" fill="#881337" />
  </svg>
);

const KeshavarziLogo = ({ className = 'w-7 h-7' }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" stroke="#4ade80" strokeWidth="5" />
    <path d="M50 80V25" stroke="#fbbf24" strokeWidth="5" strokeLinecap="round" />
    <path d="M50 40C40 35 34 45 50 55C66 45 60 35 50 40Z" fill="#fbbf24" />
    <path d="M50 55C38 50 32 60 50 70C68 60 62 50 50 55Z" fill="#fbbf24" />
    <circle cx="50" cy="22" r="5" fill="#fbbf24" />
  </svg>
);

const MaskanLogo = ({ className = 'w-7 h-7' }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M50 18L82 46H70V80H30V46H18L50 18Z" fill="#f97316" stroke="#ffffff" strokeWidth="4" strokeLinejoin="round" />
    <rect x="42" y="54" width="16" height="26" rx="2" fill="#ffffff" />
  </svg>
);

const ShahrLogo = ({ className = 'w-7 h-7' }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" stroke="#fca5a5" strokeWidth="5" />
    <path d="M26 74V50L40 40V74M40 74V32L60 20V74M60 74V44L74 54V74" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RefahLogo = ({ className = 'w-7 h-7' }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="44" stroke="#38bdf8" strokeWidth="6" />
    <circle cx="50" cy="38" r="12" fill="#fbbf24" />
    <path d="M28 74C28 60 38 52 50 52C62 52 72 60 72 74" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" />
  </svg>
);

const EnLogo = ({ className = 'w-7 h-7' }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="18" y="18" width="64" height="64" rx="16" stroke="#c084fc" strokeWidth="6" />
    <path d="M34 32H66V44H46V50H62V60H46V68H66" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const MehrIranLogo = ({ className = 'w-7 h-7' }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" stroke="#2dd4bf" strokeWidth="5" />
    <path d="M50 78C30 65 24 50 32 38C40 26 50 34 50 42C50 34 60 26 68 38C76 50 70 65 50 78Z" fill="#2dd4bf" />
  </svg>
);

const ResalatLogo = ({ className = 'w-7 h-7' }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="44" stroke="#60a5fa" strokeWidth="5" />
    <path d="M32 38H68M50 38V76M36 76H64" stroke="#ffffff" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const BluBankLogo = ({ className = 'w-7 h-7' }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="45" fill="#38bdf8" />
    <path d="M35 25V75H52C63 75 70 68 70 59C70 52 65 47 58 45C63 43 67 38 67 33C67 27 61 25 52 25H35ZM47 35H52C56 35 58 37 58 40C58 43 56 45 52 45H47V35ZM47 55H53C57 55 60 57 60 61C60 65 57 67 53 67H47V55Z" fill="#0f172a" />
  </svg>
);

const AyandehLogo = ({ className = 'w-7 h-7' }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="20" y="20" width="60" height="60" rx="12" transform="rotate(45 50 50)" fill="#78350f" stroke="#fbbf24" strokeWidth="5" />
    <circle cx="50" cy="50" r="14" fill="#fbbf24" />
  </svg>
);

const SinaLogo = ({ className = 'w-7 h-7' }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="44" stroke="#818cf8" strokeWidth="6" />
    <path d="M34 50C34 40 42 32 50 32C58 32 66 40 66 50C66 60 58 68 50 68" stroke="#818cf8" strokeWidth="6" strokeLinecap="round" />
    <circle cx="50" cy="50" r="6" fill="#818cf8" />
  </svg>
);

const GenericBankLogo = ({ className = 'w-7 h-7' }: { className?: string }) => (
  <svg viewBox="0 0 100 100" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="15" y="24" width="70" height="52" rx="8" stroke="currentColor" strokeWidth="6" />
    <line x1="15" y1="40" x2="85" y2="40" stroke="currentColor" strokeWidth="6" />
    <circle cx="30" cy="58" r="6" fill="currentColor" />
  </svg>
);

// لیست کامل بانک‌های کشور
export const IRANIAN_BANKS: BankConfig[] = [
  {
    key: 'melli',
    name: 'بانک ملی ایران',
    shortName: 'ملی',
    prefixes: ['603799', '170019'],
    gradient: 'from-[#0b1e36] via-[#143763] to-[#0a1b30]',
    accentColor: '#fbbf24',
    textColor: 'text-amber-300',
    subTextColor: 'text-amber-100/80',
    chipColor: 'gold',
    patternType: 'waves',
    logoSvg: MelliLogo,
  },
  {
    key: 'mellat',
    name: 'بانک ملت',
    shortName: 'ملت',
    prefixes: ['610433', '991975'],
    gradient: 'from-[#b91c1c] via-[#881337] to-[#450a0a]',
    accentColor: '#fef08a',
    textColor: 'text-white',
    subTextColor: 'text-rose-100/80',
    chipColor: 'gold',
    patternType: 'curves',
    logoSvg: MellatLogo,
  },
  {
    key: 'saderat',
    name: 'بانک صادرات ایران',
    shortName: 'صادرات',
    prefixes: ['603769', '903769'],
    gradient: 'from-[#172554] via-[#1e3a8a] to-[#0f172a]',
    accentColor: '#facc15',
    textColor: 'text-yellow-300',
    subTextColor: 'text-blue-100/80',
    chipColor: 'gold',
    patternType: 'islamic',
    logoSvg: SaderatLogo,
  },
  {
    key: 'tejarat',
    name: 'بانک تجارت',
    shortName: 'تجارت',
    prefixes: ['585983', '627353'],
    gradient: 'from-[#0369a1] via-[#0284c7] to-[#0c4a6e]',
    accentColor: '#7dd3fc',
    textColor: 'text-cyan-200',
    subTextColor: 'text-sky-100/80',
    chipColor: 'silver',
    patternType: 'geometric',
    logoSvg: TejaratLogo,
  },
  {
    key: 'sepah',
    name: 'بانک سپه',
    shortName: 'سپه',
    prefixes: ['589210'],
    gradient: 'from-[#1e293b] via-[#334155] to-[#0f172a]',
    accentColor: '#eab308',
    textColor: 'text-amber-300',
    subTextColor: 'text-slate-200/80',
    chipColor: 'gold',
    patternType: 'minimal',
    logoSvg: SepahLogo,
  },
  {
    key: 'pasargad',
    name: 'بانک پاسارگاد',
    shortName: 'پاسارگاد',
    prefixes: ['502229', '639347'],
    gradient: 'from-[#18181b] via-[#27272a] to-[#09090b]',
    accentColor: '#f59e0b',
    textColor: 'text-amber-400',
    subTextColor: 'text-stone-300/80',
    chipColor: 'gold',
    patternType: 'curves',
    logoSvg: PasargadLogo,
  },
  {
    key: 'saman',
    name: 'بانک سامان',
    shortName: 'سامان',
    prefixes: ['621986'],
    gradient: 'from-[#0284c7] via-[#0369a1] to-[#075985]',
    accentColor: '#38bdf8',
    textColor: 'text-white',
    subTextColor: 'text-sky-100/90',
    chipColor: 'silver',
    patternType: 'waves',
    logoSvg: SamanLogo,
  },
  {
    key: 'parsian',
    name: 'بانک پارسیان',
    shortName: 'پارسیان',
    prefixes: ['622106', '639194', '627884'],
    gradient: 'from-[#831843] via-[#701a75] to-[#4a044e]',
    accentColor: '#f472b6',
    textColor: 'text-rose-200',
    subTextColor: 'text-rose-100/80',
    chipColor: 'gold',
    patternType: 'islamic',
    logoSvg: ParsianLogo,
  },
  {
    key: 'keshavarzi',
    name: 'بانک کشاورزی',
    shortName: 'کشاورزی',
    prefixes: ['603770', '639217'],
    gradient: 'from-[#14532d] via-[#166534] to-[#052e16]',
    accentColor: '#fde047',
    textColor: 'text-emerald-200',
    subTextColor: 'text-emerald-100/80',
    chipColor: 'gold',
    patternType: 'waves',
    logoSvg: KeshavarziLogo,
  },
  {
    key: 'maskan',
    name: 'بانک مسکن',
    shortName: 'مسکن',
    prefixes: ['628023'],
    gradient: 'from-[#c2410c] via-[#ea580c] to-[#7c2d12]',
    accentColor: '#fed7aa',
    textColor: 'text-white',
    subTextColor: 'text-orange-100/90',
    chipColor: 'silver',
    patternType: 'geometric',
    logoSvg: MaskanLogo,
  },
  {
    key: 'shahr',
    name: 'بانک شهر',
    shortName: 'شهر',
    prefixes: ['504706', '502806'],
    gradient: 'from-[#991b1b] via-[#b91c1c] to-[#7f1d1d]',
    accentColor: '#fde047',
    textColor: 'text-amber-200',
    subTextColor: 'text-red-100/80',
    chipColor: 'gold',
    patternType: 'geometric',
    logoSvg: ShahrLogo,
  },
  {
    key: 'refah',
    name: 'بانک رفاه کارگران',
    shortName: 'رفاه',
    prefixes: ['589463'],
    gradient: 'from-[#1e3a8a] via-[#1d4ed8] to-[#172554]',
    accentColor: '#fb923c',
    textColor: 'text-amber-200',
    subTextColor: 'text-blue-100/80',
    chipColor: 'gold',
    patternType: 'waves',
    logoSvg: RefahLogo,
  },
  {
    key: 'en',
    name: 'بانک اقتصاد نوین',
    shortName: 'اقتصاد نوین',
    prefixes: ['627412'],
    gradient: 'from-[#581c87] via-[#6b21a8] to-[#3b0764]',
    accentColor: '#d8b4fe',
    textColor: 'text-purple-200',
    subTextColor: 'text-purple-100/80',
    chipColor: 'silver',
    patternType: 'geometric',
    logoSvg: EnLogo,
  },
  {
    key: 'mehr_iran',
    name: 'بانک قرض‌الحسنه مهر ایران',
    shortName: 'مهر ایران',
    prefixes: ['606373'],
    gradient: 'from-[#0f766e] via-[#115e59] to-[#042f2e]',
    accentColor: '#5eead4',
    textColor: 'text-teal-200',
    subTextColor: 'text-teal-100/80',
    chipColor: 'gold',
    patternType: 'curves',
    logoSvg: MehrIranLogo,
  },
  {
    key: 'resalat',
    name: 'بانک قرض‌الحسنه رسالت',
    shortName: 'رسالت',
    prefixes: ['504172'],
    gradient: 'from-[#1e3a8a] via-[#2563eb] to-[#0f172a]',
    accentColor: '#93c5fd',
    textColor: 'text-sky-200',
    subTextColor: 'text-blue-100/80',
    chipColor: 'silver',
    patternType: 'minimal',
    logoSvg: ResalatLogo,
  },
  {
    key: 'blubank',
    name: 'بلو بانک (سامان)',
    shortName: 'بلو',
    prefixes: ['621986_blu'],
    gradient: 'from-[#0284c7] via-[#06b6d4] to-[#2563eb]',
    accentColor: '#38bdf8',
    textColor: 'text-white',
    subTextColor: 'text-sky-100/90',
    chipColor: 'silver',
    patternType: 'minimal',
    logoSvg: BluBankLogo,
  },
  {
    key: 'ayandeh',
    name: 'بانک آینده',
    shortName: 'آینده',
    prefixes: ['636214'],
    gradient: 'from-[#451a03] via-[#78350f] to-[#1c0a00]',
    accentColor: '#fbbf24',
    textColor: 'text-amber-300',
    subTextColor: 'text-amber-100/80',
    chipColor: 'gold',
    patternType: 'geometric',
    logoSvg: AyandehLogo,
  },
  {
    key: 'sina',
    name: 'بانک سینا',
    shortName: 'سینا',
    prefixes: ['639346'],
    gradient: 'from-[#1e1b4b] via-[#312e81] to-[#0f172a]',
    accentColor: '#a5b4fc',
    textColor: 'text-indigo-200',
    subTextColor: 'text-indigo-100/80',
    chipColor: 'silver',
    patternType: 'curves',
    logoSvg: SinaLogo,
  },
  {
    key: 'other',
    name: 'سایر بانک‌ها (کارت شتابی)',
    shortName: 'سایر',
    prefixes: [],
    gradient: 'from-[#1e293b] via-[#334155] to-[#0f172a]',
    accentColor: '#94a3b8',
    textColor: 'text-slate-100',
    subTextColor: 'text-slate-300/80',
    chipColor: 'gold',
    patternType: 'minimal',
    logoSvg: GenericBankLogo,
  },
];

/**
 * دریافت تنظیمات بانک بر اساس کلید
 */
export function getBankByKey(key?: string): BankConfig {
  if (!key) return IRANIAN_BANKS[0]; // پیش‌فرض ملی
  const found = IRANIAN_BANKS.find((b) => b.key === key.toLowerCase());
  return found || IRANIAN_BANKS[0];
}

/**
 * تشخیص هوشمند بانک بر اساس ۶ رقم اول شماره کارت
 */
export function detectBankFromCardNumber(cardNumber?: string): BankConfig | null {
  if (!cardNumber) return null;
  const clean = cleanCardNumber(cardNumber);
  if (clean.length < 6) return null;
  const prefix = clean.slice(0, 6);

  const matched = IRANIAN_BANKS.find((b) => b.prefixes.includes(prefix));
  return matched || null;
}

/**
 * پاکسازی شماره کارت (حذف فاصله، خط تیره و تبدیل ارقام فارسی)
 */
export function cleanCardNumber(cardNumber?: string): string {
  if (!cardNumber) return '';
  const eng = toEnglishDigits(cardNumber.toString());
  return eng.replace(/[^\d]/g, '');
}

/**
 * فرمت‌دهی شماره کارت به ۴ گروه ۴ رقمی با خط تیره یا فاصله
 */
export function formatCardNumber(cardNumber?: string, separator = '-'): string {
  const clean = cleanCardNumber(cardNumber);
  if (!clean) return '';
  const parts = [];
  for (let i = 0; i < clean.length; i += 4) {
    parts.push(clean.slice(i, i + 4));
  }
  return parts.join(separator);
}

/**
 * فرمت‌دهی نمایشی شماره کارت با ارقام فارسی
 */
export function formatCardNumberPersian(cardNumber?: string, separator = '-'): string {
  const formatted = formatCardNumber(cardNumber, separator);
  return toPersianDigits(formatted);
}
