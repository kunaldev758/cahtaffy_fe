/**
 * Prefix paths to files in `public/` when the app uses `basePath` in production.
 * Injected at build time via next.config.js `env.NEXT_PUBLIC_BASE_PATH`.
 */
export function publicAsset(path: string): string {
  const base = process.env.NEXT_PUBLIC_BASE_PATH || ''
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}
