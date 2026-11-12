import { NextResponse } from 'next/server';
import { buildWebAppManifest } from '@/lib/pwa-manifest';

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const manifest = buildWebAppManifest({ slug });

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  });
}
