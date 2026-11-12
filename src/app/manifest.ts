import type { MetadataRoute } from 'next';
import { buildWebAppManifest } from '@/lib/pwa-manifest';

export default function manifest(): MetadataRoute.Manifest {
  return buildWebAppManifest({ includeShortcuts: true });
}
