import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { accountCollectionNoticeApproval, approvedCollectionNoticeForLoan } from "@/lib/collection-notice";
import PortalCollectionNotice from "@/components/portal-collection-notice";

describe("account collection notice approval gate", () => {
  it("does not show a notice before RTR approves account applicability and copy", () => {
    expect(approvedCollectionNoticeForLoan(accountCollectionNoticeApproval, "100849201")).toBeNull();
  });

  it("shows only the explicitly approved account and preserves approved text", () => {
    const approval = {
      status: "APPROVED" as const,
      noticesByLoanId: { "100849201": { text: "Approved sample notice\nSecond line", version: "test-v1" } },
    };
    expect(approvedCollectionNoticeForLoan(approval, "another-account")).toBeNull();
    const notice = approvedCollectionNoticeForLoan(approval, "100849201");
    expect(notice).not.toBeNull();
    const markup = renderToStaticMarkup(<PortalCollectionNotice notice={notice!} />);
    expect(markup).toContain('aria-label="Collection notice"');
    expect(markup).toContain("Approved sample notice\nSecond line");
  });

  it("rejects blank copy or version even in an approved record", () => {
    expect(approvedCollectionNoticeForLoan({ status: "APPROVED", noticesByLoanId: { one: { text: " ", version: "v1" } } }, "one")).toBeNull();
    expect(approvedCollectionNoticeForLoan({ status: "APPROVED", noticesByLoanId: { one: { text: "Notice", version: " " } } }, "one")).toBeNull();
  });
});
