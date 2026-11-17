import { borrowerMockMode } from "@/lib/mock-mode";
import { waitForMockWorker } from "@/lib/mock-worker-ready";

export type ApiProblem = {
  type: string; title: string; status: number; code: string;
  detail?: string; requestId?: string; errors?: { field: string; message: string }[];
};
export class ApiError extends Error {
  constructor(public problem: ApiProblem) {
    super(problem.detail ? `${problem.title}: ${problem.detail}` : problem.title);
    this.name = "ApiError";
  }
  get status() { return this.problem.status; }
}
type TokenProvider = (audience: "borrower") => Promise<string | null>;
export type ErrorType<ProblemBody> = ApiError & { readonly problem: ApiProblem & Partial<ProblemBody> };
let tokenProvider: TokenProvider = async () => null;
// The Cognito integration supplies access tokens at runtime, never build-time secrets.
export function setPortalTokenProvider(provider: TokenProvider) { tokenProvider = provider; }
export function retryPortalQuery(count: number, failure: unknown) {
  return count < 1 && failure instanceof ApiError && failure.status >= 500 && failure.status !== 503;
}

export async function portalHttp<T>(url: string, options: RequestInit = {}): Promise<T> {
  const path = url.replace(/^\/api\/v1/, "");
  const base = (process.env.NEXT_PUBLIC_PORTAL_API_BASE_URL || "/api/v1").replace(/\/$/, "");
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json, application/problem+json, text/csv");
  const publicOperation = path.startsWith("/public/") || path.startsWith("/registration/") || path === "/health";
  let token: string | null = null;
  if (borrowerMockMode && typeof window !== "undefined") {
    const key = "rtr-mock-session-until";
    if (Number(window.sessionStorage.getItem(key)) > Date.now()) token = "mock-borrower-access-token";
  } else if (!publicOperation) token = await tokenProvider("borrower");
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!publicOperation && !token) throw new ApiError({ type: "about:blank", title: "Sign in required", status: 401, code: "UNAUTHENTICATED", detail: "Please sign in again." });
  await waitForMockWorker();
  const timeout = AbortSignal.timeout(20_000);
  const signal = options.signal ? AbortSignal.any([options.signal, timeout]) : timeout;
  let response: Response;
  try { response = await fetch(`${base}${path}`, { ...options, headers, signal, cache: "no-store", credentials: "omit" }); }
  catch (error) {
    if (options.signal?.aborted) throw error;
    throw new ApiError({ type: "about:blank", title: timeout.aborted ? "Request timed out" : "Service unavailable", status: timeout.aborted ? 408 : 503, code: timeout.aborted ? "REQUEST_TIMEOUT" : "NETWORK_ERROR", detail: "The request could not be completed. Please check the current result before trying again." });
  }
  const requestId = response.headers.get("X-Request-Id") ?? undefined;
  if (!response.ok) {
    const body: unknown = await response.json().catch(() => null);
    const problem = typeof body === "object" && body !== null ? body as Record<string, unknown> : {};
    throw new ApiError({
      type: typeof problem.type === "string" ? problem.type : "about:blank",
      title: typeof problem.title === "string" ? problem.title : "Request failed",
      detail: typeof problem.detail === "string" ? problem.detail : "Please try again or contact support.",
      status: response.status, code: typeof problem.code === "string" ? problem.code : "REQUEST_FAILED", requestId,
      errors: Array.isArray(problem.errors) ? problem.errors.flatMap(value => typeof value === "object" && value !== null && "field" in value && "message" in value && typeof value.field === "string" && typeof value.message === "string" ? [{ field: value.field, message: value.message }] : []) : undefined,
    });
  }
  if (response.status === 204) return undefined as T;
  const contentType = response.headers.get("Content-Type") ?? "";
  return (contentType.includes("json") ? await response.json() : await response.text()) as T;
}
