import { borrowerMockMode } from "@/lib/mock-mode";
import { waitForMockWorker } from "@/lib/mock-worker-ready";

// Demo extensions have no production OpenAPI operation. Keep them outside the
// generated /api/v1 transport and refuse to send them in production mode.
export async function requestDemoConsent<T>(path: string, options: RequestInit = {}): Promise<T> {
  if (!borrowerMockMode || typeof window === "undefined" || !path.startsWith("/api/mock/loans/")) throw new Error("The demo consent API is unavailable.");
  const headers = new Headers(options.headers);
  headers.set("Authorization", "Bearer mock-borrower-access-token");
  await waitForMockWorker();
  const response = await fetch(path, { ...options, headers, signal: AbortSignal.timeout(20_000), credentials: "omit", cache: "no-store" });
  if (!response.ok) {
    const problem: unknown = await response.json().catch(() => null);
    throw new Error(typeof problem === "object" && problem !== null && "detail" in problem && typeof problem.detail === "string" ? problem.detail : "The consent request could not be completed.");
  }
  return (response.headers.get("Content-Type")?.includes("application/json") ? await response.json() : await response.text()) as T;
}
