/** Allow only same-origin relative paths after OAuth callback. */
export function safeRedirectPath(next: string | null | undefined, fallback = '/dashboard'): string {
  if (!next || !next.startsWith('/') || next.startsWith('//')) {
    return fallback
  }
  if (next.includes('@') || next.includes('\\')) {
    return fallback
  }
  return next
}
