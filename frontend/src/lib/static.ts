// Static preview build (GitHub Pages): pages are rendered once at build time from the
// sample data, served under a sub-path, with no API behind them.
export const STATIC_EXPORT =
  process.env.STATIC_EXPORT === "true" || process.env.NEXT_PUBLIC_STATIC_EXPORT === "true";

export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

/** Prefix a /public file path with the base path. next/link does this itself; plain URLs don't. */
export const asset = (path: string) => (path.startsWith("/") ? `${BASE_PATH}${path}` : path);

/** Query strings don't exist at build time, so a static build renders the unfiltered page. */
export async function readSearch<T extends object>(searchParams: Promise<T>): Promise<Partial<T>> {
  return STATIC_EXPORT ? {} : searchParams;
}
