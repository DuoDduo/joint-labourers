import type { Problem } from "./types";

const SERVER_BASE =
  process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";
const BROWSER_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

export class ApiError extends Error {
  constructor(
    public status: number,
    public problem: Problem | null,
  ) {
    super(problem?.title ?? `Request failed (${status})`);
  }
}

async function parse<T>(res: Response): Promise<T> {
  if (res.ok) return (await res.json()) as T;
  let problem: Problem | null = null;
  try {
    problem = (await res.json()) as Problem;
  } catch {
    /* non-JSON error body */
  }
  throw new ApiError(res.status, problem);
}

/** Server-side GET with ISR caching. Use in Server Components. */
export async function apiGet<T>(
  path: string,
  opts: { revalidate?: number; tags?: string[] } = {},
): Promise<T> {
  const res = await fetch(`${SERVER_BASE}${path}`, {
    next: { revalidate: opts.revalidate ?? 60, tags: opts.tags },
    headers: { Accept: "application/json" },
  });
  return parse<T>(res);
}

/** Like apiGet, but returns null on 404 so pages can call notFound(). */
export async function apiGetOrNull<T>(
  path: string,
  opts?: { revalidate?: number; tags?: string[] },
): Promise<T | null> {
  try {
    return await apiGet<T>(path, opts);
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null;
    throw e;
  }
}

/** Browser-side request (forms). Sends cookies for signed-in users. */
export async function apiSend<T>(path: string, method: "POST" | "PATCH", body: unknown): Promise<T> {
  const res = await fetch(`${BROWSER_BASE}${path}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  return parse<T>(res);
}

export async function apiBrowserGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BROWSER_BASE}${path}`, { credentials: "include" });
  return parse<T>(res);
}
