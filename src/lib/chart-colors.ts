/**
 * سیستم رنگ‌بندی ۴گانه معنایی بالحق (BelHagh Semantic 4-Color System)
 * قرمز، نارنجی، آبی، سبز
 * 
 * بر اساس استانداردهای روانسنجی و پایش بالینی:
 * - قرمز (Red): سطح بحرانی / کم / نیازمند مداخله فوری (۰٪ تا ۲۵٪)
 * - نارنجی (Orange): سطح متوسط / هشدار ملایم / نیازمند مراقبت (۲۶٪ تا ۵۰٪)
 * - آبی (Blue): سطح خوب / نرمال / استاندارد (۵۱٪ تا ۷۵٪)
 * - سبز (Green): سطح عالی / مطلوب / بالاترین تاب‌آوری و رشد (۷۶٪ تا ۱۰۰٪)
 */

export interface SemanticColorConfig {
  key: 'red' | 'orange' | 'blue' | 'green';
  label: string;
  shortLabel: string;
  rangeLabel: string;
  bgBar: string;
  bgBarHover: string;
  hex: string;
  textColor: string;
  badgeBg: string;
  badgeBorder: string;
  dotBg: string;
  ringColor: string;
}

export const SEMANTIC_COLORS: Record<'red' | 'orange' | 'blue' | 'green', SemanticColorConfig> = {
  red: {
    key: 'red',
    label: 'بحرانی / نیازمند پیگیری',
    shortLabel: 'بحرانی',
    rangeLabel: '۰٪ تا ۲۵٪',
    bgBar: 'bg-rose-500',
    bgBarHover: 'hover:bg-rose-600',
    hex: '#f43f5e',
    textColor: 'text-rose-700',
    badgeBg: 'bg-rose-50',
    badgeBorder: 'border-rose-200',
    dotBg: 'bg-rose-500',
    ringColor: 'ring-rose-200',
  },
  orange: {
    key: 'orange',
    label: 'متوسط / هشدار ملایم',
    shortLabel: 'متوسط',
    rangeLabel: '۲۶٪ تا ۵۰٪',
    bgBar: 'bg-amber-500',
    bgBarHover: 'hover:bg-amber-600',
    hex: '#f59e0b',
    textColor: 'text-amber-800',
    badgeBg: 'bg-amber-50',
    badgeBorder: 'border-amber-200',
    dotBg: 'bg-amber-500',
    ringColor: 'ring-amber-200',
  },
  blue: {
    key: 'blue',
    label: 'خوب / سطح استاندارد',
    shortLabel: 'نرمال',
    rangeLabel: '۵۱٪ تا ۷۵٪',
    bgBar: 'bg-sky-600',
    bgBarHover: 'hover:bg-sky-700',
    hex: '#0284c7',
    textColor: 'text-sky-800',
    badgeBg: 'bg-sky-50',
    badgeBorder: 'border-sky-200',
    dotBg: 'bg-sky-600',
    ringColor: 'ring-sky-200',
  },
  green: {
    key: 'green',
    label: 'عالی / سطح مطلوب',
    shortLabel: 'عالی',
    rangeLabel: '۷۶٪ تا ۱۰۰٪',
    bgBar: 'bg-emerald-600',
    bgBarHover: 'hover:bg-emerald-700',
    hex: '#059669',
    textColor: 'text-emerald-800',
    badgeBg: 'bg-emerald-50',
    badgeBorder: 'border-emerald-200',
    dotBg: 'bg-emerald-500',
    ringColor: 'ring-emerald-200',
  },
};

/**
 * فهرست ترتیبی ۴ رنگ جهت نمایش راهنما و پالت ترتیبی
 */
export const SEMANTIC_COLOR_TIERS: SemanticColorConfig[] = [
  SEMANTIC_COLORS.red,
  SEMANTIC_COLORS.orange,
  SEMANTIC_COLORS.blue,
  SEMANTIC_COLORS.green,
];

/**
 * پالت چرخشی ۴ رنگ معنایی بر اساس اندیس گزینه (قرمز، نارنجی، آبی، سبز)
 */
export function getFourColorByIndex(index: number): SemanticColorConfig {
  const sequence: SemanticColorConfig[] = [
    SEMANTIC_COLORS.red,
    SEMANTIC_COLORS.orange,
    SEMANTIC_COLORS.blue,
    SEMANTIC_COLORS.green,
  ];
  return sequence[Math.abs(index) % sequence.length];
}

/**
 * دریافت تنظیمات رنگ ۴گانه بر پایه درصد نمره (آستانه معنایی)
 * - نمره زیر ۳۵٪: قرمز (بحرانی / ضعیف)
 * - نمره ۳۵٪ تا ۵۹٪: نارنجی (متوسط / نیازمند توجه)
 * - نمره ۶۰٪ تا ۸۰٪: آبی (خوب / نرمال و استاندارد)
 * - نمره بالای ۸۰٪: سبز (عالی / مطلوب و پایدار)
 */
export function getSemanticColorByPercentage(percentage: number): SemanticColorConfig {
  const clamped = Math.max(0, Math.min(100, Number(percentage) || 0));
  if (clamped < 35) return SEMANTIC_COLORS.red;
  if (clamped < 60) return SEMANTIC_COLORS.orange;
  if (clamped <= 80) return SEMANTIC_COLORS.blue;
  return SEMANTIC_COLORS.green;
}
