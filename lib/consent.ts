import type { CommunicationPreferences, ConsentRecord } from "@/lib/api/generated/model";

// Synthetic content for the MSW demo, never approved production disclosures.
export const demoEsign = {
  version: "demo-esign-enrollment-v1",
  title: "Paper-free statements — demo E-SIGN disclosure",
  text: "DEMO ONLY — RTR must supply and approve the production disclosure.\n\nScope: By enrolling, you choose electronic delivery of periodic statements for this loan. This does not authorize SMS, automated calls or payments.\n\nAccess: You need an email address, an internet connection, a current browser and a PDF reader. You must be able to open, download and retain PDF documents. Keep your email address current in Contact Details.\n\nCopies: Download or print your documents for your records. Contact Customer Solutions to request paper copies and confirm any applicable delivery arrangements or charges; this demo does not determine fees.\n\nWithdrawal: Turn off Electronic Statements in Communication Preferences, review the withdrawal and save. In this demo the preference changes immediately. Withdrawing electronic delivery does not cancel payments or other communication choices. RTR must confirm production delivery timing and any conditions.\n\nBefore enrolling, download the sample PDF and confirm that you can open and retain it. Enrollment requires your separate, unchecked acceptance below. Registration alone does not enroll you in paper-free delivery.",
};

export const callbackConsent = {
  version: "demo-callback-v2",
  text: "By submitting, you request a callback at the number provided about this inquiry only. This permission does not enroll you in text messages or recurring automated calls and does not change your account communication preferences.",
};

export type ConsentEvidence = ConsentRecord & {
  personId: string;
  consentText: string;
  disclosureVersion?: string;
  disclosureText?: string;
  documentAccessConfirmed?: boolean;
};

export type ConsentDemoState = {
  preferences: CommunicationPreferences;
  disclosure: typeof demoEsign;
  history: ConsentEvidence[];
};
