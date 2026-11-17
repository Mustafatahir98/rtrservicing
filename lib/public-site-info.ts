// Public contact details supplied by RTR for the November 2026 website update.
export const publicSiteInfo = {
  phone: { label: "(877) 469-7325", href: "tel:+18774697325" },
  email: { label: "support@rtrservicing.com", href: "mailto:support@rtrservicing.com" },
  complaints: { label: "File a Complaint", href: "mailto:complaints@rtrservicing.com" },
  hours: ["Mon–Fri, 8:30 AM – 5:30 PM CT"],
  hoursShort: "Mon–Fri, 8:30 AM – 5:30 PM CT",
  hoursNote: "",
  correspondence: ["RTR Servicing", "P.O. Box 561266", "Dallas, TX 75356-1266"],
  corporate: ["Real Time Resolutions, Inc.", "1349 Empire Central Drive", "Suite 1300", "Dallas, TX 75247"],
  nmlsId: "9745",
  officialContact: "https://www.realtimeresolutions.com/contact-us/",
  officialPrivacy: "https://www.realtimeresolutions.com/privacy-policy/",
  officialNotices: "https://www.realtimeresolutions.com/legal-notice/",
  transferReference: "https://www.consumerfinance.gov/rules-policy/regulations/1024/33/",
} as const;

export const publicSecurityMessage = "Keep your account secure: do not send passwords, verification codes, your full SSN or complete bank/card numbers by email, text or this message form. If a request seems suspicious, contact Customer Solutions using verified contact details.";

// Do not treat a published corporate notice as approval for every portal visitor.
export const collectionNoticeApproval: { scope: "PENDING" | "ALL_PUBLIC_VISITORS"; approvedText: string | null } = {
  scope: "PENDING", approvedText: null,
};

export const publicLegalPages = {
  privacy: { title: "Privacy Policy", description: "RTR's published corporate privacy policy is linked below. Approved wording and confirmation of coverage for this portal have not yet been supplied.", reference: publicSiteInfo.officialPrivacy, referenceLabel: "Read RTR's published Privacy Policy" },
  terms: { title: "Terms of Service", description: "Approved terms for this portal have not yet been supplied. This page does not establish terms or record your acceptance. Contact Customer Solutions for the applicable documents.", reference: publicSiteInfo.officialNotices, referenceLabel: "View RTR's existing corporate Legal Notice" },
  "transfer-notices": { title: "Transfer Notices", description: "Your account-specific servicing transfer notice supplies the effective date and payment instructions. This public page does not replace that notice. Contact Customer Solutions if you need a copy.", reference: publicSiteInfo.transferReference, referenceLabel: "Read CFPB mortgage servicing transfer information" },
  "licenses-state-notices": { title: "Licenses & State Notices", description: "RTR's published corporate information identifies Real Time Resolutions, Inc. with NMLS ID 9745. Use the published notices for licensing and state-specific information; applicability to this portal still requires RTR confirmation.", reference: publicSiteInfo.officialNotices, referenceLabel: "Read RTR's published licensing and state notices" },
  "collection-notices": { title: "Collection Notices", description: "RTR must confirm which collection notices apply to this portal and to each account or visitor. No account-specific determination is made here. Existing published corporate notices are linked for reference.", reference: publicSiteInfo.officialNotices, referenceLabel: "Read RTR's published collection notices" },
  "error-information-requests": { title: "Errors & Information Requests", description: "For a formal mortgage notice of error or request for information, confirm the designated channel and address in your servicing correspondence or RTR's published contact instructions. Do not assume the general correspondence or payment address is the designated notice address.", reference: publicSiteInfo.officialContact, referenceLabel: "Check RTR's published designated request instructions" },
} as const;
