import { NextResponse } from "next/server";
import { borrowerMockMode } from "@/lib/mock-mode";

export function proxy() {
  if (!borrowerMockMode) return NextResponse.next();
  // MSW answers in the browser. A direct or missed request must never reach a
  // database, authentication provider, payment provider or email route in preview.
  const requestId = crypto.randomUUID();
  return NextResponse.json({ type: "about:blank", title: "Mock operation unavailable", status: 501, code: "MOCK_SERVER_API_DISABLED", detail: "Server APIs are disabled in the borrower mock demo.", requestId }, { status: 501, headers: { "Content-Type": "application/problem+json", "Cache-Control": "no-store", "X-Request-Id": requestId } });
}

export const config = { matcher: ["/api/:path*"] };
