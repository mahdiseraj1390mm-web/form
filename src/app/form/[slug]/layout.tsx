import type { Metadata } from 'next';
import { getFormManifestMeta } from '@/lib/pwa-manifest';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const meta = getFormManifestMeta(slug);

  return {
    title: meta.name,
    description: meta.description,
    manifest: `/form/${encodeURIComponent(slug)}/manifest.webmanifest`,
    appleWebApp: {
      capable: true,
      title: meta.shortName,
      statusBarStyle: 'default',
    },
  };
}

export default function FormSlugLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
