import { environment } from '../../../environments/environment';

export function imageUrl(path: string | null | undefined, fallback = '/assets/images/placeholder.webp'): string {
  if (!path) return fallback;
  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('/assets/')) return path;
  return `${environment.uploadBaseUrl}${path}`;
}
