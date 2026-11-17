import { describe, expect, it } from "vitest";
import { matchesPaymentSearch } from "@/lib/payment-search";
import { paymentActorLabel } from "@/lib/portal-format";

describe("payment initiator display and search", () => {
  const viewerName = "Mustafa Tahir";

  it("shows the signed-in borrower's name for their own payments", () => {
    expect(paymentActorLabel("You", viewerName)).toBe(viewerName);
    expect(paymentActorLabel("Mustafa Tahir", viewerName)).toBe(viewerName);
    expect(paymentActorLabel("Co-borrower", viewerName)).toBe("Co-borrower");
    expect(paymentActorLabel("Ahsan Khan", viewerName)).toBe("Source unavailable");
  });

  it("finds the displayed borrower name without matching an undisplayed co-borrower name", () => {
    const self = { amount: "2450.00", initiator: "You", viewerName };
    const other = { amount: "2450.00", initiator: "Co-borrower", viewerName };
    expect(matchesPaymentSearch("MOCK-PAY-1", "2026-10-01", "Mustafa", self)).toBe(true);
    expect(matchesPaymentSearch("MOCK-PAY-1", "2026-10-01", "Tahir", self)).toBe(true);
    expect(matchesPaymentSearch("MOCK-PAY-1", "2026-10-01", "Ahsan", other)).toBe(false);
    expect(matchesPaymentSearch("MOCK-PAY-1", "2026-10-01", "Co-borrower", other)).toBe(true);
  });
});
