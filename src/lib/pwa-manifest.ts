import type { MetadataRoute } from 'next';

export interface FormManifestMeta {
  name: string;
  shortName: string;
  description: string;
}

export function getFormManifestMeta(slug?: string): FormManifestMeta {
  if (slug === '3uu4z' || slug === 'form-belhagh-booking') {
    return {
      name: 'نوبت‌دهی مشاوره تلفنی بالحق',
      shortName: 'نوبت‌دهی بالحق',
      description: 'سامانه نوبت‌دهی مشاوره تلفنی مرکز خدمات روانشناسی بالحق',
    };
  }
  if (slug === 'safaan' || slug === 'form-safaan-assessment') {
    return {
      name: 'سامانه خودسنجی صفاً',
      shortName: 'خودسنجی صفاً',
      description: 'سامانه هوشمند ارزیابی و خودسنجی مرکز خدمات روانشناسی بالحق',
    };
  }
  if (slug === 'zexuz' || slug === 'form-belhagh-registration') {
    return {
      name: 'مرکز خدمات روانشناسی بالحق',
      shortName: 'روانشناسی بالحق',
      description: 'سامانه ثبت‌نام، مشاوره تلفنی و پرونده مراجعین مرکز روانشناسی بالحق',
    };
  }
  return {
    name: 'سامانه خدمات روانشناسی بالحق',
    shortName: 'روانشناسی بالحق',
    description: 'سامانه هوشمند ثبت پرونده و نوبت‌دهی مرکز مشاوره و روانشناسی بالحق',
  };
}

export function buildWebAppManifest(options?: {
  slug?: string;
  includeShortcuts?: boolean;
}): MetadataRoute.Manifest {
  const slug = options?.slug;
  const meta = getFormManifestMeta(slug);
  const startUrl = slug ? `/form/${encodeURIComponent(slug)}` : '/';

  const manifest: MetadataRoute.Manifest = {
    id: startUrl,
    name: meta.name,
    short_name: meta.shortName,
    description: meta.description,
    start_url: startUrl,
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    launch_handler: {
      client_mode: ['focus-existing', 'auto'],
    },
    orientation: 'any',
    dir: 'rtl',
    lang: 'fa',
    background_color: '#f8fafc',
    theme_color: '#084d3e',
    categories: ['health', 'medical', 'productivity'],
    icons: [
      {
        src: '/icons/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };

  if (options?.includeShortcuts) {
    manifest.shortcuts = [
      {
        name: 'نوبت‌دهی مشاوره تلفنی',
        short_name: 'نوبت‌دهی',
        description: 'رزرو نوبت مشاوره تلفنی در مرکز بالحق',
        url: '/form/3uu4z',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
        ],
      },
      {
        name: 'ثبت‌نام و تشکیل پرونده',
        short_name: 'ثبت‌نام',
        description: 'ثبت‌نام مراجع جدید و دریافت کد پرونده',
        url: '/form/zexuz',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
        ],
      },
    ];
  }

  return manifest;
}
