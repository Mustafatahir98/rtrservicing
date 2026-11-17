/** RTR supplies the exact copy and eligible accounts before publication. */
export type ApprovedAccountCollectionNotice = {
  text: string;
  version: string;
};

export type AccountCollectionNoticeApproval =
  | { status: "PENDING" }
  | { status: "APPROVED"; noticesByLoanId: Readonly<Record<string, ApprovedAccountCollectionNotice>> };

export const accountCollectionNoticeApproval: AccountCollectionNoticeApproval = { status: "PENDING" };

export function approvedCollectionNoticeForLoan(
  approval: AccountCollectionNoticeApproval,
  loanId: string,
): ApprovedAccountCollectionNotice | null {
  if (approval.status !== "APPROVED") return null;
  const notice = Object.hasOwn(approval.noticesByLoanId, loanId) ? approval.noticesByLoanId[loanId] : undefined;
  return notice?.text.trim() && notice.version.trim() ? notice : null;
}
