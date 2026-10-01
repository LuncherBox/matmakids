export function safeReturnPath(value: string | string[] | undefined) {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (!candidate) return '/';
  if (!candidate.startsWith('/')) return '/';
  if (candidate.startsWith('//')) return '/';
  if (candidate.includes('://')) return '/';

  return candidate;
}
