import { API_BASE_URL } from './config';

const API_ORIGIN = API_BASE_URL.replace(/\/api\/?$/i, '');

export function resolveMediaUrl(url: string | null | undefined) {
  if (!url) {
    return null;
  }

  if (/^https?:\/\//i.test(url)) {
    return url;
  }

  return `${API_ORIGIN}${url.startsWith('/') ? '' : '/'}${url}`;
}
