export const demoAccountScenarios = {
  CURRENT: { label: "Current account", contactRestricted: false, message: "No additional servicing restrictions in this example." },
  PAST_DUE: { label: "Past-due account", contactRestricted: false, message: "This synthetic example has an overdue installment and an applicable demo fee. Review the amounts below and contact Customer Solutions for assistance." },
  BANKRUPTCY_REVIEW: { label: "Bankruptcy review", contactRestricted: true, message: "This synthetic account is flagged for specialist review. Saved contact preferences do not override its contact restrictions. Use the authenticated request form for assistance." },
  ATTORNEY_REVIEW: { label: "Attorney-represented review", contactRestricted: true, message: "This synthetic account requires review of representation and contact instructions. Use the authenticated request form; the production process must be confirmed by RTR." },
  CONTACT_RESTRICTED: { label: "Contact-restricted account", contactRestricted: true, message: "Outbound contact is restricted in this synthetic example. Optional SMS and automated-call choices cannot be changed here. Authenticated information requests remain available." },
} as const;
export type DemoAccountScenario = keyof typeof demoAccountScenarios;
export type ServiceRequest = {
  requestId: string; referenceNumber: string; loanId: string; personId: string;
  type: "ERROR_NOTICE" | "INFORMATION_REQUEST";
  subject: string; message: string; status: "RECEIVED";
  submittedAt: string; updatedAt: string;
};
export type BorrowerSupportState = {
  scenario: DemoAccountScenario; contactRestricted: boolean;
  pastDueAmount: string; feesOwed: string; totalAmountDue: string;
  daysPastDue: number | null; requests: ServiceRequest[];
};
